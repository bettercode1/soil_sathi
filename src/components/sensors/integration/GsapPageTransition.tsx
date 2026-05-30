import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ReactNode } from "react";

gsap.registerPlugin(useGSAP);

interface GsapPageTransitionProps {
  children: ReactNode;
  stepKey: string;
}

/** Animates step content in with GSAP when the integration step changes. */
export const GsapPageTransition = ({ children, stepKey }: GsapPageTransitionProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        wrapRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
      );
    },
    { scope: wrapRef, dependencies: [stepKey] },
  );

  return (
    <div ref={wrapRef} key={stepKey}>
      {children}
    </div>
  );
};
