import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  markdown, 
  className = "prose prose-headings:text-primary prose-sm md:prose-base max-w-none" 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    // Apply syntax highlighting after the component mounts
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [markdown]);

  // Pre-process the markdown content to fix common issues
  const processedMarkdown = markdown
    // Ensure headers have space after #
    .replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
    // Ensure lists have space after markers
    .replace(/^(\s*[-*+])([^\s])/gm, '$1 $2')
    .replace(/^(\s*\d+\.)([^\s])/gm, '$1 $2');

  // Parse markdown to HTML
  const getMarkdownHtml = () => {
    // Use marked to parse markdown to HTML
    const html = marked.parse(processedMarkdown);
    
    // Sanitize HTML
    return DOMPurify.sanitize(html as string, {
      USE_PROFILES: { html: true }
    });
  };

  return (
    <div 
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: getMarkdownHtml() }} 
    />
  );
};

export default MarkdownRenderer; 