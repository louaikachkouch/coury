import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronLeft, FileText, Video, Calendar, Users, X, MessageSquare, Download, Upload, Eye, CheckCircle, Play, Plus, Loader2, Trash2, Sparkles } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { coursesAPI, healthCheck } from '../services/api';

const colorPalette = [
  { color: 'bg-[#E08E79]/15 text-[#C96951]', solidColor: 'bg-[#E08E79]' },
  { color: 'bg-[#88B088]/15 text-[#6B916B]', solidColor: 'bg-[#88B088]' },
  { color: 'bg-[#9A8C98]/15 text-[#7A6C78]', solidColor: 'bg-[#9A8C98]' },
  { color: 'bg-[#7EA8BE]/15 text-[#5A8AA0]', solidColor: 'bg-[#7EA8BE]' },
];

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

const MAX_OCR_PAGES = 6;
const OCR_RENDER_SCALE = 1.75;
const TESSERACT_WORKER_PATH = '/tesseract/worker.min.js';
const TESSERACT_CORE_PATH = '/tesseract/tesseract-core.wasm.js';
const TESSERACT_LANG_PATH = '/tessdata';
const HF_MAX_INPUT_CHARS = 12000;
const DELETE_HOLD_MS = 3000;

const summarizeTextWithHuggingFace = async (text) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No text was extracted from the PDF to summarize.');
  }

  const inputText = trimmed.slice(0, HF_MAX_INPUT_CHARS);
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payload = {
    text: inputText,
  };

  const response = await fetch(`${API_BASE_URL}/api/courses/summarize`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let result = null;
  try {
    result = JSON.parse(rawBody);
  } catch (parseError) {
    const snippet = rawBody ? rawBody.slice(0, 180).replace(/\s+/g, ' ') : 'empty response body';
    throw new Error(`Summarization service returned non-JSON response (HTTP ${response.status}): ${snippet}`);
  }

  if (!response.ok) {
    throw new Error(result?.message || `Summarization request failed (HTTP ${response.status})`);
  }

  if (!result?.summary || typeof result.summary !== 'string') {
    throw new Error('Summarization service did not return a valid summary.');
  }

  return result.summary.trim();
};

const buildSummaryPdfBlobUrl = ({ title, summary }) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const headerHeight = 88;
  const footerHeight = 34;
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - footerHeight - 10;
  const colors = {
    header: [37, 62, 115],
    accent: [224, 142, 121],
    headingBg: [235, 240, 251],
    headingText: [41, 62, 108],
    bodyText: [42, 46, 52],
    metaText: [232, 236, 247],
    footerText: [107, 117, 134],
  };

  const renderHeader = () => {
    doc.setFillColor(...colors.header);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setFillColor(...colors.accent);
    doc.rect(0, headerHeight - 8, pageWidth, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text(title || 'Course Summary', margin, 36);

    doc.setTextColor(...colors.metaText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const generatedAt = new Date().toLocaleString();
    doc.text(`Generated on ${generatedAt}`, margin, 55);
  };

  const renderFooter = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      doc.setPage(i);
      doc.setDrawColor(228, 232, 240);
      doc.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);
      doc.setTextColor(...colors.footerText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
    }
  };

  const addNewPage = () => {
    doc.addPage();
    renderHeader();
    return headerHeight + 26;
  };

  const ensureSpace = (y, requiredHeight) => {
    if (y + requiredHeight > contentBottom) {
      return addNewPage();
    }
    return y;
  };

  renderHeader();
  let y = headerHeight + 26;
  const lines = (summary || '').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      y += 8;
      continue;
    }

    const isSectionHeading = /^(Comprehensive Course Summary|Overview|Detailed Breakdown|Section\s+\d+)$/i.test(line);
    if (isSectionHeading) {
      y = ensureSpace(y, 34);
      doc.setFillColor(...colors.headingBg);
      doc.roundedRect(margin, y - 15, contentWidth, 24, 4, 4, 'F');
      doc.setTextColor(...colors.headingText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(line, margin + 10, y + 2);
      y += 22;
      continue;
    }

    const wrapped = doc.splitTextToSize(line, contentWidth - 8);
    const blockHeight = wrapped.length * 16 + 2;
    y = ensureSpace(y, blockHeight + 8);
    doc.setTextColor(...colors.bodyText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(wrapped, margin + 4, y);
    y += blockHeight;
  }

  renderFooter();

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

const buildAuthenticatedFileUrl = (relativePathOrUrl) => {
  if (!relativePathOrUrl) return null;

  if (relativePathOrUrl.startsWith('blob:')) {
    return relativePathOrUrl;
  }

  const token = localStorage.getItem('token');
  const absoluteUrl = relativePathOrUrl.startsWith('http')
    ? relativePathOrUrl
    : `${API_BASE_URL}${relativePathOrUrl}`;

  if (!token) {
    return absoluteUrl;
  }

  const separator = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${separator}token=${encodeURIComponent(token)}`;
};

const extractPdfTextWithTesseract = async (pdfUrl) => {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF file (HTTP ${response.status})`);
  }

  const pdfBuffer = await response.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({
    data: pdfBuffer,
  }).promise;
  const pagesToScan = Math.min(pdfDoc.numPages, MAX_OCR_PAGES);
  const worker = await createWorker('eng', 1, {
    workerPath: TESSERACT_WORKER_PATH,
    corePath: TESSERACT_CORE_PATH,
    langPath: TESSERACT_LANG_PATH,
    gzip: false,
  });
  const chunks = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToScan; pageNumber += 1) {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to initialize canvas context for OCR');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      const { data: { text } } = await worker.recognize(canvas);
      if (text && text.trim()) {
        chunks.push(`Page ${pageNumber}\n${text.trim()}`);
      }
    }
  } finally {
    await worker.terminate();
  }

  return chunks.join('\n\n');
};

const ModuleItem = ({ module, onView, onToggle, onDelete }) => {
  const getIcon = () => {
    switch (module.type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div 
      className={`p-4 rounded-xl border ${module.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border/50'} hover:shadow-sm transition-shadow cursor-pointer group`}
    >
      <div className="flex items-center gap-3">
        <div 
          className={`p-2 rounded-lg ${module.completed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} cursor-pointer hover:scale-110 transition-transform`}
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          {getIcon()}
        </div>
        <div className="flex-1" onClick={onView}>
          <h4 className={`font-medium ${module.completed ? 'text-muted-foreground line-through' : 'text-foreground'} hover:text-primary transition-colors`}>
            {module.title}
          </h4>
          {module.due && !module.completed && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-accent font-medium">
              <Clock className="h-3 w-3" />
              <span>Due: {module.due}</span>
            </div>
          )}
          {module.completed && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary font-medium">
              <span>Completed</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div 
            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${module.completed ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary'}`}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            {module.completed && <span className="text-xs">✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Module Content Viewer Modal (PDF/Video viewer)
const ModuleContentModal = ({ module, course, onClose, onMarkComplete, onSummarySaved }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryPdfUrl, setSummaryPdfUrl] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [activeFileUrl, setActiveFileUrl] = useState(module.fileUrl || null);
  const [isDeleteHolding, setIsDeleteHolding] = useState(false);
  const [deleteHoldMsLeft, setDeleteHoldMsLeft] = useState(DELETE_HOLD_MS);
  const deleteHoldTimeoutRef = useRef(null);
  const deleteHoldIntervalRef = useRef(null);
  const deleteHoldStartRef = useRef(0);

  const clearDeleteHold = () => {
    if (deleteHoldTimeoutRef.current) {
      clearTimeout(deleteHoldTimeoutRef.current);
      deleteHoldTimeoutRef.current = null;
    }
    if (deleteHoldIntervalRef.current) {
      clearInterval(deleteHoldIntervalRef.current);
      deleteHoldIntervalRef.current = null;
    }
    deleteHoldStartRef.current = 0;
    setIsDeleteHolding(false);
    setDeleteHoldMsLeft(DELETE_HOLD_MS);
  };

  useEffect(() => {
    setActiveFileUrl(module.fileUrl || null);
  }, [module.fileUrl]);

  useEffect(() => {
    return () => {
      clearDeleteHold();
      if (summaryPdfUrl) {
        URL.revokeObjectURL(summaryPdfUrl);
      }
    };
  }, [summaryPdfUrl]);
  
  // Check if this is a PDF with an actual file
  const isPdfWithFile = module.type === 'reading' && activeFileUrl;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      onMarkComplete();
    }, 1500);
  };

  const handleGenerateSummary = async (e) => {
    e.stopPropagation();
    if (!activeFileUrl) return;

    setShowSummaryPopup(true);
    setIsSummarizing(true);
    setSummaryError('');
    if (summaryPdfUrl) {
      URL.revokeObjectURL(summaryPdfUrl);
      setSummaryPdfUrl('');
    }

    try {
      const extractedText = await extractPdfTextWithTesseract(activeFileUrl);
      const summary = await summarizeTextWithHuggingFace(extractedText);
      const generatedPdfUrl = buildSummaryPdfBlobUrl({
        title: module.title,
        summary,
      });
      setSummaryPdfUrl(generatedPdfUrl);
    } catch (error) {
      setSummaryError(`Unable to summarize this PDF. ${error?.message || 'Please try again.'}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeepSummary = (e) => {
    e.stopPropagation();
    const saveSummaryToCourse = async () => {
      try {
        if (!summaryPdfUrl) {
          setShowSummaryPopup(false);
          return;
        }

        const courseId = course?._id || course?.id;
        const lessonId = module?._id || module?.id;
        if (!courseId || !lessonId) {
          throw new Error('Missing course or lesson id for saving summary');
        }

        setIsSavingSummary(true);
        const response = await fetch(summaryPdfUrl);
        if (!response.ok) {
          throw new Error('Unable to read generated summary PDF');
        }

        const blob = await response.blob();
        const sanitized = (module?.title || 'summary')
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase();
        const fileName = `${sanitized || 'summary'}-generated-summary.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        const result = await coursesAPI.replaceContentFile(courseId, lessonId, file);
        const updatedFileUrl = buildAuthenticatedFileUrl(result?.lesson?.fileUrl || null);

        if (updatedFileUrl) {
          setActiveFileUrl(updatedFileUrl);
        }

        if (onSummarySaved) {
          onSummarySaved({
            lessonId,
            fileUrl: updatedFileUrl,
            fileName: result?.lesson?.fileName || fileName,
          });
        }

        clearDeleteHold();
        setShowSummaryPopup(false);
      } catch (error) {
        setSummaryError(`Unable to save summary as lesson file. ${error?.message || 'Please try again.'}`);
      } finally {
        setIsSavingSummary(false);
      }
    };

    saveSummaryToCourse();
  };

  const handleDeleteSummary = () => {
    clearDeleteHold();
    if (summaryPdfUrl) {
      URL.revokeObjectURL(summaryPdfUrl);
    }
    setSummaryPdfUrl('');
    setShowSummaryPopup(false);
  };

  const startDeleteHold = (e) => {
    e.stopPropagation();
    if (isDeleteHolding) return;

    deleteHoldStartRef.current = Date.now();
    setIsDeleteHolding(true);
    setDeleteHoldMsLeft(DELETE_HOLD_MS);

    deleteHoldIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - deleteHoldStartRef.current;
      const remaining = Math.max(0, DELETE_HOLD_MS - elapsed);
      setDeleteHoldMsLeft(remaining);
    }, 100);

    deleteHoldTimeoutRef.current = setTimeout(() => {
      handleDeleteSummary();
    }, DELETE_HOLD_MS);
  };

  const cancelDeleteHold = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!isDeleteHolding) return;
    clearDeleteHold();
  };

  // For PDF files with actual content, show fullscreen clean viewer
  if (isPdfWithFile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col h-dvh" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} onClick={onClose}>
        {/* Responsive Header with warm accents */}
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 py-3 sm:py-4 backdrop-blur-md overflow-auto"
          style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #e08e79 0%, #c96951 100%)' }}>
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-sm sm:text-base md:text-lg truncate">{module.title}</h2>
              {module.fileName && (
                <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">{module.fileName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-nowrap justify-start sm:justify-end flex-shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={handleGenerateSummary}
              className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(224, 142, 121, 0.95) 0%, rgba(201, 105, 81, 0.95) 50%, rgba(126, 168, 190, 0.95) 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(224, 142, 121, 0.35)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 26px rgba(224, 142, 121, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(224, 142, 121, 0.35)';
              }}
              title="Generate PDF summary with Hugging Face"
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)',
                  transform: 'translateX(-130%)',
                  animation: 'pdfResumeShine 2.6s ease-in-out infinite'
                }}
              />
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 relative z-10" />
              <span className="relative z-10">Summary</span>
            </button>
            {!module.completed && (
              <button 
                onClick={onMarkComplete}
                className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Mark Complete</span>
                <span className="md:hidden">Complete</span>
              </button>
            )}
            {module.completed && (
              <span className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap" style={{ background: 'rgba(136, 176, 136, 0.2)', color: '#88B088' }}>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Completed</span>
                <span className="md:hidden">Done</span>
              </span>
            )}
            <a href={activeFileUrl} download={module.fileName || 'document.pdf'} className="flex-shrink-0">
              <button 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                title="Download PDF"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </a>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl transition-all flex-shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              title="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
        
        {/* Responsive PDF Viewer with cozy frame */}
        <div className="flex-1 min-h-0 p-1.5 sm:p-4 md:p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div 
            className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            <iframe
              src={`${activeFileUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
              className="w-full h-full border-0"
              title={module.title}
              style={{ background: '#faf8f5' }}
            />
          </div>
        </div>

        {/* Subtle ambient glow - hidden on mobile */}
        <div 
          className="hidden md:block fixed top-0 left-1/4 w-1/2 h-32 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(224, 142, 121, 0.3) 0%, transparent 70%)' }}
        />
        <style>{`
          @keyframes pdfResumeShine {
            0% { transform: translateX(-130%); }
            45% { transform: translateX(130%); }
            100% { transform: translateX(130%); }
          }
        `}</style>

        {showSummaryPopup && (
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowSummaryPopup(false);
            }}
          >
            <Card
              className="w-[99vw] sm:w-[96vw] lg:w-[92vw] xl:w-[88vw] max-w-7xl h-[96vh] sm:h-[93vh] border border-slate-700/70 bg-slate-950 text-slate-100 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!isSummarizing && !summaryError && summaryPdfUrl && (
                <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-300 font-medium tracking-wide uppercase">Course Summary</p>
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">{course?.title || module?.title || 'Summary PDF'}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      onMouseDown={startDeleteHold}
                      onMouseUp={cancelDeleteHold}
                      onMouseLeave={cancelDeleteHold}
                      onTouchStart={startDeleteHold}
                      onTouchEnd={cancelDeleteHold}
                      onTouchCancel={cancelDeleteHold}
                      onContextMenu={(e) => e.preventDefault()}
                      className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleteHolding ? `Hold ${Math.ceil(deleteHoldMsLeft / 1000)}s` : 'Delete'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleKeepSummary}
                      disabled={isSavingSummary}
                      className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white"
                    >
                      {isSavingSummary ? 'Saving...' : 'Keep'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-0 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap flex-1 bg-slate-950">
                {isSummarizing && (
                  <div className="h-full min-h-[220px] flex items-center justify-center gap-2 text-slate-200 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-orange-300" />
                    <span>Reading PDF, summarizing with Hugging Face, and generating PDF...</span>
                  </div>
                )}

                {!isSummarizing && summaryError && (
                  <div className="h-full min-h-[220px] flex items-center justify-center px-3 text-center">
                    <p className="text-red-300 text-sm sm:text-base font-medium">{summaryError}</p>
                  </div>
                )}

                {!isSummarizing && !summaryError && summaryPdfUrl && (
                  <div className="h-full overflow-hidden bg-white">
                    <iframe
                      src={`${summaryPdfUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
                      title="PDF Summary"
                      className="w-full h-full min-h-[70vh] sm:min-h-[72vh] border-0"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <Card className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl border-none shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Responsive Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${course.color}`}>
              {module.type === 'video' ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : 
               module.type === 'assignment' ? <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> : 
               <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">{module.title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{course.code} • {course.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Responsive Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {module.type === 'video' ? (
            // Responsive Video Content
            <div className="space-y-3 sm:space-y-4">
              <div className="aspect-video bg-muted rounded-lg sm:rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                <div className="relative z-10 text-center px-4">
                  <div className="bg-primary text-primary-foreground rounded-full p-3 sm:p-4 mx-auto mb-3 sm:mb-4 w-fit cursor-pointer hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Click to play video lecture</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Duration: 45 minutes</p>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Lecture Notes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This lecture covers the key concepts of {module.title.toLowerCase()}. Make sure to take notes and complete the practice exercises at the end.
                </p>
              </div>
            </div>
          ) : module.type === 'assignment' ? (
            // Responsive Assignment Content
            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Assignment Instructions</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Complete the following assignment and submit your work as a PDF file. Make sure to follow the rubric guidelines provided below.
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-accent font-medium">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Due: {module.due || 'No deadline'}</span>
                </div>
              </div>

              {/* Responsive PDF Preview Area */}
              <div className="border-2 border-dashed border-border/50 rounded-lg sm:rounded-xl p-4 sm:p-8 text-center">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="font-semibold text-sm sm:text-base mb-2">Assignment Document</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 break-words">{module.title}.pdf</p>
                <Button variant="ghost" className="gap-2 text-xs sm:text-sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  Download Assignment PDF
                </Button>
              </div>

              {/* Responsive Submission Area */}
              <div className="p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/20">
                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  Submit Your Work
                </h3>
                
                {submitted ? (
                  <div className="text-center py-3 sm:py-4">
                    <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-2 sm:mb-3" />
                    <p className="font-semibold text-xs sm:text-sm text-primary">Assignment Submitted!</p>
                    <p className="text-xs text-muted-foreground mt-1">Your work has been submitted successfully.</p>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-border rounded-lg sm:rounded-xl p-4 sm:p-6 text-center mb-3 sm:mb-4">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
                        {selectedFile ? (
                          <p className="text-xs sm:text-sm font-medium text-primary truncate">{selectedFile.name}</p>
                        ) : (
                          <>
                            <p className="text-xs sm:text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX (max 10MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                    <Button 
                      className="w-full gap-2 text-xs sm:text-sm" 
                      onClick={handleSubmit}
                      disabled={!selectedFile || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                          Submit Assignment
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Responsive Reading Content (PDF) - Mock for modules without uploaded file
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-inner border border-border/50 p-4 sm:p-8 min-h-[300px] sm:min-h-[400px]">
                <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                  <div className="text-center border-b pb-4 sm:pb-6">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{module.title}</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{course.code} - {course.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">By {course.instructor}</p>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 text-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold">Introduction</h2>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      This chapter covers the fundamental concepts of {module.title.toLowerCase()}. Understanding these principles is essential for your progress in this course.
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                    
                    <h2 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6">Key Concepts</h2>
                    <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 sm:space-y-2">
                      <li>Understanding the fundamental principles</li>
                      <li>Applying theoretical knowledge to practice</li>
                      <li>Analyzing case studies and examples</li>
                      <li>Developing critical thinking skills</li>
                    </ul>
                    
                    <p className="text-xs sm:text-sm leading-relaxed mt-3 sm:mt-4">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                    </p>
                  </div>
                  
                  <div className="text-center text-xs sm:text-sm text-gray-400 pt-4 sm:pt-6 border-t">
                    Page 1 of 12
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                <Button variant="ghost" className="gap-2 text-xs sm:text-sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  Download PDF
                </Button>
                <div className="flex gap-1 sm:gap-2">
                  <Button variant="ghost" size="sm" className="text-xs">Previous</Button>
                  <Button variant="ghost" size="sm" className="text-xs">Next</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responsive Footer */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {module.completed ? (
              <span className="text-xs sm:text-sm text-primary font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Completed
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={onMarkComplete} className="text-xs sm:text-sm">
                Mark as Complete
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className="text-xs sm:text-sm">Close</Button>
        </div>
      </Card>
    </div>
  );
};

// Add Content Modal
const AddContentModal = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('reading');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill title from filename if empty
      if (!title) {
        const fileName = e.target.files[0].name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Create a URL for the uploaded file so it can be displayed locally
    let fileUrl = null;
    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile);
    }
    
    onAdd({
      id: Date.now(),
      title: title.trim(),
      type,
      completed: false,
      due: type === 'assignment' && dueDate ? dueDate : undefined,
      fileName: selectedFile?.name,
      fileUrl: fileUrl,
      file: selectedFile, // Pass the actual file for upload
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6 border-none shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Course Content</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5: Advanced Topics"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'reading', label: 'Reading', icon: BookOpen },
                { value: 'video', label: 'Video', icon: Video },
                { value: 'assignment', label: 'Assignment', icon: FileText },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                    type === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="content-file-upload"
              />
              <label htmlFor="content-file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF only (max 15MB)</p>
                  </>
                )}
              </label>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-muted-foreground hover:text-accent mt-2"
              >
                Remove file
              </button>
            )}
          </div>

          {type === 'assignment' && (
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g., Friday, 5:00 PM"
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Syllabus Modal
const SyllabusModal = ({ course, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6 border-none shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Course Syllabus</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-2">{course.code}: {course.title}</h3>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Instructor:</span>
              <p className="text-muted-foreground">{course.instructor}</p>
            </div>
            <div>
              <span className="font-semibold">Credits:</span>
              <p className="text-muted-foreground">{course.credits}</p>
            </div>
            <div>
              <span className="font-semibold">Schedule:</span>
              <p className="text-muted-foreground">{course.schedule}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Course Objectives</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Understand core concepts and theories</li>
              <li>Apply knowledge through practical assignments</li>
              <li>Develop critical thinking skills</li>
              <li>Collaborate effectively with peers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Grading</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Assignments: 40%</p>
              <p>Midterm Exam: 25%</p>
              <p>Final Exam: 25%</p>
              <p>Participation: 10%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </Card>
    </div>
  );
};

// Discussion Board Modal
const DiscussionModal = ({ course, onClose }) => {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([
    { id: 1, author: 'Sarah M.', content: 'Does anyone have notes from last week\'s lecture?', time: '2 hours ago', replies: 3 },
    { id: 2, author: 'James K.', content: 'Study group meeting tomorrow at 3pm in the library!', time: '5 hours ago', replies: 7 },
    { id: 3, author: 'Prof. ' + course.instructor.split(' ').pop(), content: 'Reminder: Office hours are cancelled this Friday.', time: '1 day ago', replies: 0 },
  ]);

  const handlePost = () => {
    if (!newPost.trim()) return;
    setPosts([
      { id: Date.now(), author: 'You', content: newPost, time: 'Just now', replies: 0 },
      ...posts
    ]);
    setNewPost('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6 border-none shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Discussion Board</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Start a discussion..."
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <Button onClick={handlePost}>Post</Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{post.author}</span>
                <span className="text-xs text-muted-foreground">{post.time}</span>
              </div>
              <p className="text-sm text-foreground">{post.content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{post.replies} replies</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-border/30">
          <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </Card>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ contentTitle, onConfirm, onCancel, isDeleting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <Card className="w-full max-w-sm p-6 border-none shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-bold mb-2">Delete Content</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete <span className="font-medium text-foreground">"{contentTitle}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, content: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      const isApiAvailable = await healthCheck();
      
      if (isApiAvailable && localStorage.getItem('token')) {
        try {
          const data = await coursesAPI.getById(id);
          // Map API data to display format
          const colorIndex = parseInt(id, 16) % colorPalette.length || 0;
          
          // Get completed lesson IDs from enrollment
          const completedLessonIds = new Set(
            (data.course.completedLessons || [])
              .filter(cl => cl.completed)
              .map(cl => cl.lessonId?.toString() || cl.lessonId)
          );
          
          // Flatten modules -> lessons into a single array for display
          let flattenedModules = [];
          if (data.course.modules && Array.isArray(data.course.modules)) {
            data.course.modules.forEach((mod) => {
              if (mod.lessons && Array.isArray(mod.lessons)) {
                flattenedModules = flattenedModules.concat(
                  mod.lessons.map((lesson, idx) => ({
                    ...lesson,
                    id: lesson._id || `${mod._id}-${idx}`,
                    // Mark as completed if in the completedLessons array
                    completed: lesson.completed || completedLessonIds.has(lesson._id?.toString() || lesson._id),
                    // Build an authenticated file URL for protected GridFS streaming.
                    fileUrl: buildAuthenticatedFileUrl(lesson.fileUrl),
                  }))
                );
              }
            });
          }
          
          // Fallback to default modules if none exist
          if (flattenedModules.length === 0) {
            flattenedModules = [
              { id: 1, title: 'Course Introduction', completed: false, type: 'video' },
              { id: 2, title: 'Getting Started', completed: false, type: 'reading' },
            ];
          }
          
          const mappedCourse = {
            ...data.course,
            id: data.course._id,
            code: data.course.category?.substring(0, 3).toUpperCase() + ' 101',
            ...colorPalette[colorIndex],
            modules: flattenedModules,
            announcements: data.course.announcements || [],
            credits: data.course.credits || 3,
            schedule: data.course.schedule || 'See course details',
          };
          setCourse(mappedCourse);
        } catch (error) {
          console.error('Failed to fetch course:', error);
          setCourse(null);
        }
      } else {
        setCourse(null);
      }
      setIsLoading(false);
    };

    fetchCourse();
  }, [id]);

  // Auto-save progress periodically and on unload
  useEffect(() => {
    if (!course) return;

    const saveProgress = async () => {
      try {
        const completedLessons = (course.modules || [])
          .filter(m => m.completed)
          .map(m => ({
            lessonId: m._id || m.id,
            completed: true,
            completedAt: new Date()
          }));

        const progress = course.modules && course.modules.length > 0
          ? Math.round((completedLessons.length / course.modules.length) * 100)
          : 0;

        await coursesAPI.updateProgress(course._id || course.id, {
          progress,
          completedLessons,
          currentModule: 0,
          currentLesson: 0
        });
      } catch (error) {
        console.warn('Failed to auto-save progress:', error);
      }
    };

    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(saveProgress, 30000);

    // Save on page unload/beforeunload
    const handleBeforeUnload = () => {
      saveProgress().catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [course]);

  const addNewContent = async (newModule) => {
    if (!course) return;
    
    // Save to API with file upload
    try {
      const result = await coursesAPI.addContent(
        course._id || course.id, 
        {
          title: newModule.title,
          type: newModule.type,
          due: newModule.due
        },
        newModule.file // Pass the file for upload
      );
      
      // Flatten the returned course modules into display format
      if (result.course && result.course.modules) {
        let flattenedModules = [];
        result.course.modules.forEach((mod) => {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            flattenedModules = flattenedModules.concat(
              mod.lessons.map((lesson, idx) => ({
                ...lesson,
                id: lesson._id || `${mod._id}-${idx}`,
                fileUrl: buildAuthenticatedFileUrl(lesson.fileUrl),
              }))
            );
          }
        });
        
        const completedCount = flattenedModules.filter(m => m.completed).length;
        const progress = flattenedModules.length > 0 
          ? Math.round((completedCount / flattenedModules.length) * 100) 
          : 0;
        setCourse({ ...course, modules: flattenedModules, progress });
        return;
      }
    } catch (error) {
      console.error('Failed to save content to database:', error);
    }
    
    // Fallback: Update local state only if API failed
    const courseModules = [...(course.modules || []), newModule];
    const completedCount = courseModules.filter(m => m.completed).length;
    const progress = Math.round((completedCount / courseModules.length) * 100);
    setCourse({ ...course, modules: courseModules, progress });
  };

  const openModuleContent = (module) => {
    setSelectedModule(module);
    setShowContentModal(true);
  };

  const handleSummarySaved = ({ lessonId, fileUrl, fileName }) => {
    setCourse((prevCourse) => {
      if (!prevCourse) return prevCourse;

      const updatedModules = (prevCourse.modules || []).map((m) => {
        const id = m._id || m.id;
        if ((id || '').toString() !== (lessonId || '').toString()) {
          return m;
        }

        return {
          ...m,
          fileUrl: fileUrl || m.fileUrl,
          fileName: fileName || m.fileName,
        };
      });

      return {
        ...prevCourse,
        modules: updatedModules,
      };
    });

    setSelectedModule((prev) => {
      if (!prev) return prev;
      const id = prev._id || prev.id;
      if ((id || '').toString() !== (lessonId || '').toString()) {
        return prev;
      }

      return {
        ...prev,
        fileUrl: fileUrl || prev.fileUrl,
        fileName: fileName || prev.fileName,
      };
    });
  };

  const handleMarkModuleComplete = () => {
    if (selectedModule) {
      toggleModuleCompletion(selectedModule._id || selectedModule.id);
      setSelectedModule({ ...selectedModule, completed: true });
    }
  };

  const toggleModuleCompletion = async (moduleId) => {
    if (!course) return;
    
    const courseModules = (course.modules || []).map(m => 
      (m._id || m.id) === moduleId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = courseModules.filter(m => m.completed).length;
    const progress = courseModules.length > 0 
      ? Math.round((completedCount / courseModules.length) * 100)
      : 0;
    
    // Update local state immediately for responsiveness
    setCourse({ ...course, modules: courseModules, progress });
    
    // Build completedLessons array for the API
    const completedLessons = courseModules
      .filter(m => m.completed)
      .map(m => ({
        lessonId: m._id || m.id,
        completed: true,
        completedAt: new Date()
      }));
    
    // Save progress to backend immediately
    try {
      const result = await coursesAPI.updateProgress(course._id || course.id, {
        progress,
        completedLessons,
        currentModule: 0,
        currentLesson: 0
      });
      
      // Update course with server response to ensure sync
      if (result.course) {
        setCourse(prevCourse => ({
          ...prevCourse,
          progress: result.course.progress || progress,
          lastAccessedAt: result.course.lastAccessedAt
        }));
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const deleteContent = async (lessonId) => {
    if (!course) return;
    
    // Find the content to get its title for the modal
    const contentToDelete = course.modules.find(m => (m._id || m.id) === lessonId);
    setDeleteModal({ show: true, content: contentToDelete, lessonId });
  };

  const confirmDelete = async () => {
    if (!course || !deleteModal.lessonId) return;
    
    setIsDeleting(true);
    try {
      const result = await coursesAPI.deleteContent(course._id || course.id, deleteModal.lessonId);
      
      // Flatten the returned course modules into display format
      if (result.course && result.course.modules) {
        let flattenedModules = [];
        result.course.modules.forEach((mod) => {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            flattenedModules = flattenedModules.concat(
              mod.lessons.map((lesson, idx) => ({
                ...lesson,
                id: lesson._id || `${mod._id}-${idx}`,
                fileUrl: buildAuthenticatedFileUrl(lesson.fileUrl),
              }))
            );
          }
        });
        
        const completedCount = flattenedModules.filter(m => m.completed).length;
        const progress = flattenedModules.length > 0 
          ? Math.round((completedCount / flattenedModules.length) * 100) 
          : 0;
        setCourse({ ...course, modules: flattenedModules, progress });
      }
      setDeleteModal({ show: false, content: null, lessonId: null });
    } catch (error) {
      console.error('Failed to delete content:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteCourse = async () => {
    if (!course) return;
    
    setIsDeletingCourse(true);
    try {
      await coursesAPI.delete(course._id || course.id);
      navigate('/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setIsDeletingCourse(false);
      setShowDeleteCourse(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Course not found</h3>
        <p className="text-muted-foreground mt-2">Please log in and ensure the course exists.</p>
        <Button variant="ghost" onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modals */}
      {showSyllabus && <SyllabusModal course={course} onClose={() => setShowSyllabus(false)} />}
      {showDiscussion && <DiscussionModal course={course} onClose={() => setShowDiscussion(false)} />}
      {showContentModal && selectedModule && (
        <ModuleContentModal 
          module={selectedModule} 
          course={course} 
          onClose={() => { setShowContentModal(false); setSelectedModule(null); }}
          onMarkComplete={handleMarkModuleComplete}
          onSummarySaved={handleSummarySaved}
        />
      )}
      {showAddContent && (
        <AddContentModal 
          onClose={() => setShowAddContent(false)}
          onAdd={addNewContent}
        />
      )}
      {deleteModal.show && (
        <DeleteConfirmModal 
          contentTitle={deleteModal.content?.title || 'this content'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, content: null, lessonId: null })}
          isDeleting={isDeleting}
        />
      )}

      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/courses')}
        className="gap-2 -ml-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Courses
      </Button>

      {/* Course Header */}
      <Card className="p-6 border-none shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${course.solidColor}`} />
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-wider text-muted-foreground mb-2 uppercase">
              {course.code}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-2">{course.instructor}</p>
          </div>
          <div className={`p-4 rounded-xl ${course.color}`}>
            <BookOpen className="h-8 w-8" />
          </div>
        </div>

        <p className="text-muted-foreground mt-4">{course.description}</p>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{course.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{course.credits} Credits</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-muted-foreground">Course Progress</span>
            <span className="text-foreground">{course.progress}%</span>
          </div>
          <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${course.solidColor} rounded-full`}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-heading">Course Content</h2>
              <p className="text-sm text-muted-foreground">Click on a module to view its content</p>
            </div>
            <Button onClick={() => setShowAddContent(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
          <div className="space-y-3">
            {course.modules.map((module) => (
              <ModuleItem 
                key={module.id} 
                module={module} 
                onView={() => openModuleContent(module)}
                onToggle={() => toggleModuleCompletion(module.id)}
                onDelete={() => deleteContent(module._id || module.id)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-lg font-heading mb-4">Announcements</h3>
            {course.announcements.length > 0 ? (
              <div className="space-y-3">
                {course.announcements.map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{announcement.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements</p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-lg font-heading mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowSyllabus(true)}
              >
                <FileText className="h-4 w-4" />
                View Syllabus
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowDiscussion(true)}
              >
                <Users className="h-4 w-4" />
                Discussion Board
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/schedule')}
              >
                <Calendar className="h-4 w-4" />
                View Schedule
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteCourse(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Course
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Course Modal */}
      {showDeleteCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteCourse(false)}>
          <Card className="w-full max-w-sm p-6 border-none shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold mb-2">Delete Course</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <span className="font-medium text-foreground">"{course.title}"</span>? This will permanently remove all content and enrollments. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDeleteCourse(false)} 
                  className="flex-1"
                  disabled={isDeletingCourse}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={deleteCourse} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeletingCourse}
                >
                  {isDeletingCourse ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Course'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
