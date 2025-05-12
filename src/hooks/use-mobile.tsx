import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Standard for md breakpoint in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsMobile(false); // Default to false on SSR or if window is not available
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    
    // Initial check
    onChange();
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile === undefined ? false : isMobile; // Return false during hydration or if undefined
}
