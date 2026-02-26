import React from 'react';

const HeroSection = () => {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
        Good morning, Alex.{' '}
        <span className="inline-block origin-bottom-right">👋</span>
      </h1>
      <p className="text-muted-foreground text-lg">
        You have <span className="font-medium text-foreground">2 assignments</span> due soon.
      </p>
    </section>
  );
};

export default HeroSection;
