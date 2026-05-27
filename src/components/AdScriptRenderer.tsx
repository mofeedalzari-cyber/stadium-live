import React, { useEffect, useRef } from 'react';

interface AdScriptRendererProps {
  html: string;
}

export default function AdScriptRenderer({ html }: AdScriptRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Reset container contents
    containerRef.current.innerHTML = '';
    
    // Parse the inner html securely
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    
    nodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const oldScript = node as HTMLScriptElement;
        const newScript = document.createElement('script');
        
        // Copy all attributes securely (e.g., src, async, defer, type)
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        
        containerRef.current?.appendChild(newScript);
      } else {
        // Append other elements directly (images, links, iframes)
        const cloned = node.cloneNode(true);
        containerRef.current?.appendChild(cloned);
      }
    });
  }, [html]);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex flex-col items-center justify-center overflow-hidden min-h-[60px]" 
    />
  );
}
