import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Smart Course Management for Students"
        description="Coury helps students organize coursework, track progress, manage schedules, and stay consistent with their academic goals."
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Coury',
          url: 'https://coury.vercel.app/',
          description: 'Student-focused course and schedule management platform',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://coury.vercel.app/courses?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/cover.png" alt="Coury" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">Coury</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 border-t border-border/50">
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-colors font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-primary text-xs sm:text-sm font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Your Learning Journey Starts Here
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                Learn Smarter,{' '}
                <span className="text-primary">Achieve More</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Coury is your all-in-one platform for managing courses, tracking progress, and staying organized throughout your academic journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center"
                >
                  Start Learning Free
                </Link>
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-card border border-border text-foreground rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-muted transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-4 justify-center lg:justify-start">
                <div className="flex -space-x-2 sm:-space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt=""
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background"
                    />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  <span className="text-foreground font-semibold">2,000+</span> students already learning
                </p>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl sm:rounded-3xl blur-3xl" />
              <img
                src="/cover.png"
                alt="Coury Dashboard"
                className="relative rounded-2xl sm:rounded-3xl shadow-2xl border border-border/50 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Powerful features designed to help you stay on top of your studies
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Course Management',
                description: 'Organize all your courses in one place with detailed progress tracking and materials.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Smart Scheduling',
                description: 'Interactive calendar to manage classes, assignments, and study sessions effortlessly.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Progress Analytics',
                description: 'Visual insights into your learning progress with detailed statistics and reports.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: 'Reminders & Alerts',
                description: 'Never miss a deadline with smart notifications for upcoming tasks and classes.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Collaboration',
                description: 'Connect with classmates, share notes, and work together on group projects.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Mobile Friendly',
                description: 'Access your courses and schedule from any device, anywhere, anytime.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 sm:p-6 lg:p-8 bg-card rounded-xl sm:rounded-2xl border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center text-primary mb-4 sm:mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl sm:rounded-3xl border border-primary/20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already using Coury to achieve their academic goals.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:opacity-90 transition-all shadow-xl"
            >
              Get Started for Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <img src="/cover.png" alt="Coury" className="h-8 w-8 rounded-lg" />
              <span className="text-lg sm:text-xl font-bold text-foreground">Coury</span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm text-center">
              © 2026 Coury. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="/privacy" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="/contact" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
