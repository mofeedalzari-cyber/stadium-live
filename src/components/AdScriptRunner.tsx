import { useEffect, useRef } from "react";

interface AdScriptRunnerProps {
  html: string;
}

export function AdScriptRunner({ html }: AdScriptRunnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) {
      if (containerRef.current) containerRef.current.innerHTML = "";
      return;
    }

    // Clear previous elements
    containerRef.current.innerHTML = "";

    // Create a temporary element to parse raw HTML
    const div = document.createElement("div");
    div.innerHTML = html;

    // Extract all children and append them dynamically (executing scripts properly)
    const nodes = Array.from(div.childNodes);
    for (const node of nodes) {
      if (node.nodeName === "SCRIPT") {
        const script = document.createElement("script");
        const oldScript = node as HTMLScriptElement;
        
        // Copy all attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        
        // Set script source or inner javascript content
        if (oldScript.src) {
          script.src = oldScript.src;
        } else {
          script.innerHTML = oldScript.innerHTML;
        }
        
        script.async = true;
        containerRef.current.appendChild(script);
      } else {
        // Clone and append non-script HTML elements (e.g., div, iframe, ins)
        containerRef.current.appendChild(node.cloneNode(true));
      }
    }
  }, [html]);

  return <div ref={containerRef} className="w-full flex justify-center items-center overflow-hidden" />;
}
