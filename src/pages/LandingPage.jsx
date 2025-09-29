import React from "react";
import {
  CallToAction,
  FeatureSection,
  HeroSection,
  StatSection,
} from "../components/landing";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeatureSection />
      <StatSection />
      <CallToAction />
    </div>
  );
};

export default LandingPage;
