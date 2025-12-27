'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hashCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const extractHeadings = () => {
    const headingElements = document.querySelectorAll('h2, h3');
    const tocItems: TOCItem[] = [];

    headingElements.forEach((heading) => {
      let id = heading.id;
      
      // If no ID, generate one from text content
      if (!id) {
        id = heading.textContent?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || '';
        heading.id = id;
      }
      
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';

      if (id && text) {
        tocItems.push({ id, text, level });
      }
    });

    return { tocItems, headingElements };
  };

  const setupObservers = (headingElements: NodeListOf<Element>) => {
    // Clean up existing observer
    if (observerRef.current) {
      headingElements.forEach((heading) => observerRef.current?.unobserve(heading));
    }

    // Set up intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -80% 0%',
      },
    );

    headingElements.forEach((heading) => observer.observe(heading));
    observerRef.current = observer;
  };

  useEffect(() => {
    // Reset state when component mounts or route changes
    setHeadings([]);
    setActiveId('');

    // Ensure we're in the browser
    if (typeof window === 'undefined') return;

    let retryCount = 0;
    const maxRetries = 15;
    const retryDelay = 200;

    const tryExtractHeadings = () => {
      const { tocItems, headingElements } = extractHeadings();

      if (tocItems.length > 0) {
        setHeadings(tocItems);
        setupObservers(headingElements);
        
        // Clear any pending retries
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else if (retryCount < maxRetries) {
        // Retry after a delay if no headings found
        retryCount++;
        retryTimeoutRef.current = setTimeout(tryExtractHeadings, retryDelay);
      }
    };

    // Try immediately, then retry if needed
    tryExtractHeadings();

    // Handle initial hash if present
    const handleInitialHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        // Wait a bit for content to render, then scroll
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    };

    // Try to handle hash after headings are found (check DOM directly)
    hashCheckIntervalRef.current = setInterval(() => {
      const headingElements = document.querySelectorAll('h2, h3');
      if (headingElements.length > 0) {
        handleInitialHash();
        if (hashCheckIntervalRef.current) {
          clearInterval(hashCheckIntervalRef.current);
          hashCheckIntervalRef.current = null;
        }
      }
    }, 100);

    // Clear hash check after 5 seconds to avoid infinite loop
    setTimeout(() => {
      if (hashCheckIntervalRef.current) {
        clearInterval(hashCheckIntervalRef.current);
        hashCheckIntervalRef.current = null;
      }
    }, 5000);

    // Also watch for DOM changes in case content loads asynchronously
    const handleMutation = () => {
      const { tocItems, headingElements } = extractHeadings();
      if (tocItems.length > 0) {
        setHeadings(tocItems);
        setupObservers(headingElements);
      }
    };

    mutationObserverRef.current = new MutationObserver(handleMutation);

    // Try to find and observe the article or main element
    const setupMutationObserver = () => {
      const observeTarget = document.querySelector('article') || document.querySelector('main');
      if (observeTarget && mutationObserverRef.current) {
        mutationObserverRef.current.observe(observeTarget, {
          childList: true,
          subtree: true,
        });
        return true;
      }
      return false;
    };

    // Try to set up observer immediately
    if (!setupMutationObserver()) {
      // If not found, observe body temporarily to find article/main
      const bodyObserver = new MutationObserver(() => {
        if (setupMutationObserver()) {
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      
      // Clean up body observer after a timeout
      setTimeout(() => {
        bodyObserver.disconnect();
      }, 5000);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (observerRef.current) {
        const headingElements = document.querySelectorAll('h2, h3');
        headingElements.forEach((heading) => observerRef.current?.unobserve(heading));
        observerRef.current = null;
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }
      if (hashCheckIntervalRef.current) {
        clearInterval(hashCheckIntervalRef.current);
        hashCheckIntervalRef.current = null;
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    
    if (element) {
      console.log('Element found:', id);
      console.log('Current scroll:', window.scrollY);
      console.log('Element position:', element.getBoundingClientRect().top);
      console.log('Element offsetTop:', element.offsetTop);
      
      window.history.pushState(null, '', `#${id}`);
      
      // Try native scroll first
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      
      // If native doesn't work, manual calculation
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        if (rect.top < 80 || rect.top > 100) {
          const targetPosition = element.offsetTop - 96; // Match scroll-mt-24
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    } else {
      console.error('Element not found:', id);
    }
  };
    
  

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="hidden xl:block w-full">
      <div className="border-l pl-4 py-2">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
          On this page
        </h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                'block w-full text-left text-sm py-1 transition-colors cursor-pointer',
                heading.level === 3 && 'pl-4',
                activeId === heading.id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}


