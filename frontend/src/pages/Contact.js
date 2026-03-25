import React from 'react';
import Seo from '../components/seo/Seo';

const Contact = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <Seo
        title="Contact"
        description="Contact Coury support for account help, course issues, and technical questions."
        path="/contact"
      />
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="text-muted-foreground mb-4">
        For support requests, product feedback, or account questions, reach us at:
      </p>
      <p className="text-foreground font-medium">support@coury.tn</p>
    </main>
  );
};

export default Contact;
