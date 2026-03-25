import React from 'react';
import Seo from '../components/seo/Seo';

const Terms = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <Seo
        title="Terms of Service"
        description="Review Coury's terms of service for platform access, acceptable use, and account responsibilities."
        path="/terms"
      />
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-4">
        By using Coury, you agree to use the platform for lawful educational purposes and to keep your
        account credentials secure.
      </p>
      <p className="text-muted-foreground mb-4">
        You are responsible for content you upload and for compliance with applicable institution and
        copyright rules. We may suspend abusive or harmful usage.
      </p>
      <p className="text-muted-foreground">Last updated: March 2026</p>
    </main>
  );
};

export default Terms;
