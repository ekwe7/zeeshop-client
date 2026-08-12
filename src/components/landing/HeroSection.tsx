import React, { useState, useEffect } from 'react';

interface HeroSectionProps {
  onStartTrial?: () => void;
  onViewDemo?: () => void;
}

interface SlideData {
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  secondaryCtaText?: string;
  bgImage: string;
}

const slides: SlideData[] = [
  {
    badge: "Retail Management Software",
    title: "Modern Retail Management for Growth.",
    description: "Streamline operations, optimize inventory, and unlock data-driven insights. Built for high-velocity teams who demand speed without sacrificing control.",
    primaryCtaText: "Start Free Trial",
    secondaryCtaText: "View Live Demo",
    bgImage: "/ca1.jpeg"
  },
  {
    badge: "Fast POS & Cashier Workflows",
    title: "Lightning Fast Checkout & Customer Debt Tracking.",
    description: "Empower cashiers with rapid barcode scanning, multiple payment methods (Cash, Credit, Transfer), and automated receipt printing.",
    primaryCtaText: "Explore POS Terminal",
    secondaryCtaText: "Debt Management",
    bgImage: "/ca2.jpeg"
  },
  {
    badge: "Stock Control & Purchase Orders",
    title: "Real-Time Stock Audits & Supplier Automation.",
    description: "Track inventory movements across locations, set automated reorder levels, and manage purchase orders directly with your suppliers.",
    primaryCtaText: "Manage Inventory",
    secondaryCtaText: "Supplier Portal",
    bgImage: "/ca23.jpeg"
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartTrial }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);

    return () => clearInterval(slideInterval);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const activeSlide = slides[currentSlide];

  return (
    <section className="hero-section">
      {/* Slide Background Image */}
      <div 
        key={activeSlide.bgImage}
        className="hero-slide-bg"
        style={{ backgroundImage: `url(${activeSlide.bgImage})` }}
      />
      <div className="hero-slide-overlay" />

      {/* Background SVG Grid */}
      <div className="hero-bg-pattern">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#bbcabf" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="hero-content">
        {/* Dynamic Carousel Slide */}
        <div key={currentSlide} className="carousel-slide-fade">
          <div className="hero-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}></span>
            <span>{activeSlide.badge}</span>
          </div>

          <h1 className="hero-title">
            {activeSlide.title}
          </h1>

          <p className="hero-description">
            {activeSlide.description}
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={onStartTrial}>
              {activeSlide.primaryCtaText}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Previous & Next Control Arrows */}
        <button className="carousel-control prev" onClick={handlePrevSlide} aria-label="Previous Slide">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button className="carousel-control next" onClick={handleNextSlide} aria-label="Next Slide">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  );
};