"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={
        isVisible
          ? `translate-y-0 opacity-100 transition duration-700 ease-out ${className}`
          : `translate-y-8 opacity-0 transition duration-700 ease-out ${className}`
      }
    >
      {children}
    </div>
  );
}