import React, { useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import Prism from "prismjs";
// Import Prism.js language support
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
// Import a Prism theme
import "prismjs/themes/prism-tomorrow.css";

/**
 * Custom code block component for enhanced markdown rendering with Prism.js
 */
const CodeBlock = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}): JSX.Element => {
  const codeRef = useRef<HTMLElement>(null);
  const language = className ? className.replace("language-", "") : "";

  // Apply Prism highlighting when component mounts or children change
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children]);

  // Function to copy code to clipboard
  const copyToClipboard = (): void => {
    if (navigator.clipboard && children) {
      navigator.clipboard
        .writeText(children)
        .then(() => {
          console.log("Code copied to clipboard");
        })
        .catch((error) => {
          console.error("Failed to copy code: ", error);
        });
    }
  };

  return (
    <pre className={`relative group ${className || ""}`}>
      <button
        onClick={copyToClipboard}
        className="copy-button absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
        text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Copy
      </button>
      <code ref={codeRef} className={language ? `language-${language}` : ""}>
        {children}
      </code>
    </pre>
  );
};

/**
 * Component for inline code rendering
 */
const InlineCode = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return (
    <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm">
      {children}
    </code>
  );
};

/**
 * Safely renders markdown content with error handling
 */
export const SafeMarkdown = ({
  content,
  options,
}: {
  content: string;
  options: Record<string, unknown>;
}): JSX.Element => {
  try {
    return <Markdown options={options}>{content}</Markdown>;
  } catch (error) {
    console.error("Error rendering markdown:", error);
    // If markdown rendering fails, return plain text
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
};

/**
 * Returns markdown rendering options with custom components
 */
export const getMarkdownOptions = (): Record<string, unknown> => {
  return {
    overrides: {
      pre: {
        component: CodeBlock,
      },
      code: {
        component: InlineCode,
      },
      h1: {
        props: {
          className: "text-2xl font-bold mt-6 mb-4",
        },
      },
      h2: {
        props: {
          className: "text-xl font-bold mt-6 mb-3",
        },
      },
      h3: {
        props: {
          className: "text-lg font-bold mt-4 mb-2",
        },
      },
      p: {
        props: {
          className: "my-3",
        },
      },
      ul: {
        props: {
          className: "list-disc pl-6 my-3",
        },
      },
      ol: {
        props: {
          className: "list-decimal pl-6 my-3",
        },
      },
      li: {
        props: {
          className: "my-1",
        },
      },
      a: {
        props: {
          className: "text-blue-600 hover:underline dark:text-blue-400",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      },
      blockquote: {
        props: {
          className:
            "border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-3 py-2 italic",
        },
      },
      hr: {
        props: {
          className: "my-4 border-gray-300 dark:border-gray-600",
        },
      },
      table: {
        props: {
          className: "min-w-full my-6 border-collapse",
        },
      },
      th: {
        props: {
          className:
            "border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700",
        },
      },
      td: {
        props: {
          className: "border border-gray-300 dark:border-gray-600 px-4 py-2",
        },
      },
    },
  };
};

export default SafeMarkdown; 