import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Seo from '../components/seo/Seo';

const VerifyEmail = () => {
  const [message] = useState('Email verification now uses a 6-digit code. Please return to registration or login to verify your account.');

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
          <AlertCircle className="h-10 w-10 mx-auto text-amber-500" />

          <h1 className="mt-4 text-2xl font-bold text-foreground">Email Verification</h1>
          <p className="mt-3 text-sm text-muted-foreground">
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
