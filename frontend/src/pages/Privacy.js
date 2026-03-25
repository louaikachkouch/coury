import React from 'react';
import Seo from '../components/seo/Seo';

const Privacy = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <Seo
        title="Privacy Policy"
        description="Read Coury's privacy policy to understand how account, usage, and course data is handled."
        path="/privacy"
      />
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4">
        Coury values your privacy. We collect account and usage data only to provide learning features,
        course progress tracking, and account security.
      </p>
      <p className="text-muted-foreground mb-4">
        We do not sell personal data. Data may be processed by infrastructure providers required to run
        the platform. You can request account data updates or deletion by contacting support.
      </p>
      <p className="text-muted-foreground">Last updated: March 2026</p>
    </main>
  );
};

export default Privacy;
