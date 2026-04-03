import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Seo from '../components/seo/Seo';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Verification link is invalid or has expired.');
      }
    };

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Seo title="Verify Email" description="Verify your Coury account email." path="/verify-email" noindex />
      <div className="w-full max-w-md bg-card/60 border border-border/60 rounded-2xl p-8 shadow-xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="text-center">
          {status === 'loading' && <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />}
          {status === 'success' && <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />}
          {status === 'error' && <AlertCircle className="h-10 w-10 mx-auto text-red-500" />}

          <h1 className="mt-4 text-2xl font-bold text-foreground">Email Verification</h1>
          <p className={`mt-3 text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>
            {message}
          </p>

          <div className="mt-6">
            <Link to="/login">
              <Button className="w-full" type="button">
                Go to Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
