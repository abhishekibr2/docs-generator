'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Custom heading components with anchor links
export function Heading1({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h1
      id={id}
      className="scroll-mt-20 text-4xl font-bold tracking-tight mb-4 mt-8 first:mt-0"
    >
      {children}
    </h1>
  );
}

export function Heading2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="scroll-mt-20 text-3xl font-semibold tracking-tight mb-3 mt-6 first:mt-0 pb-2 border-b group"
    >
      <a
        href={`#${id}`}
        className="no-underline hover:underline text-foreground"
      >
        {children}
      </a>
    </h2>
  );
}

export function Heading3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="scroll-mt-20 text-2xl font-semibold tracking-tight mb-2 mt-5 first:mt-0 group"
    >
      <a
        href={`#${id}`}
        className="no-underline hover:underline text-foreground"
      >
        {children}
      </a>
    </h3>
  );
}

export function Heading4({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h4
      id={id}
      className="scroll-mt-20 text-xl font-semibold tracking-tight mb-2 mt-4 first:mt-0"
    >
      {children}
    </h4>
  );
}

export function Heading5({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h5
      id={id}
      className="scroll-mt-20 text-lg font-semibold tracking-tight mb-3 mt-6 first:mt-0"
    >
      {children}
    </h5>
  );
}

export function Heading6({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h6
      id={id}
      className="scroll-mt-20 text-base font-semibold tracking-tight mb-3 mt-6 first:mt-0"
    >
      {children}
    </h6>
  );
}

// Code block with syntax highlighting and copy button
export function CodeBlock({
  children,
  className,
  ...props
}: {
  children: string | React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const [copied, setCopied] = useState(false);
  
  // Extract language from className (supports both language-xxx and lang-xxx formats)
  const match = /(?:language-|lang-)(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  
  // Handle different children types
  let codeString = '';
  if (typeof children === 'string') {
    codeString = children;
  } else if (Array.isArray(children)) {
    codeString = children.join('');
  } else if (children && typeof children === 'object' && 'props' in children) {
    const props = children.props as { children?: any };
    codeString = String(props?.children || children);
  } else {
    codeString = String(children);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-xs border border-border/50 hover:bg-background hover:opacity-100 transition-all"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-slate-950">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          PreTag="div"
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// Inline code
export function InlineCode({ children, className, ...props }: any) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

// Callout component
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: Check,
  };

  const styles = {
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100',
    error: 'border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100',
    success: 'border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100',
  };

  const Icon = icons[type];

  return (
    <Alert className={cn('my-4', styles[type])}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

// Tabs component wrapper
export function MDXTabs({
  children,
  defaultValue,
}: {
  children: React.ReactNode;
  defaultValue?: string;
}) {
  return <Tabs defaultValue={defaultValue}>{children}</Tabs>;
}

export function MDXTabsList({ children }: { children: React.ReactNode }) {
  return <TabsList>{children}</TabsList>;
}

export function MDXTabsTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <TabsTrigger value={value}>{children}</TabsTrigger>;
}

export function MDXTabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <TabsContent value={value}>{children}</TabsContent>;
}

// Card component
export function MDXCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="my-4">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Steps component
export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="my-6 space-y-4">{children}</div>;
}

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
        {number}
      </div>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-2">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}

// API Endpoint component
export function APIEndpoint({
  method,
  path,
  children,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  children?: React.ReactNode;
}) {
  const methodColors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500',
  };

  return (
    <div className="my-4 rounded-lg border bg-muted p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-semibold text-white',
            methodColors[method],
          )}
        >
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

// Custom image component
export function MDXImage({
  src,
  alt,
  width,
  height,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  [key: string]: any;
}) {
  return (
    <div className="my-4">
      <Image
        src={src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        className="rounded-lg"
        {...props}
      />
      {alt && (
        <p className="text-sm text-muted-foreground text-center mt-2">{alt}</p>
      )}
    </div>
  );
}

// Custom link component
export function MDXLink({ href, children, ...props }: any) {
  const isExternal = href?.startsWith('http');
  
  if (isExternal) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:text-primary/80"
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="text-primary underline underline-offset-4 hover:text-primary/80"
      {...props}
    >
      {children}
    </Link>
  );
}

// Export all components for MDX
export const mdxComponents = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  code: (props: any) => {
    const { className, children, ...rest } = props;
    // Check if it's a code block (has className with language) or inline code
    if (className) {
      return <CodeBlock className={className} {...rest}>{children}</CodeBlock>;
    }
    return <InlineCode {...props} />;
  },
  pre: (props: any) => {
    const { children, ...rest } = props;
    // Extract code from pre tag - MDX wraps code in pre > code
    if (children && typeof children === 'object' && 'props' in children) {
      const codeProps = children.props;
      // Combine className from pre and code if both exist
      const className = props.className 
        ? `${props.className} ${codeProps.className || ''}`.trim()
        : codeProps.className;
      return <CodeBlock {...codeProps} className={className} {...rest} />;
    }
    // If it's a direct code block without pre wrapper
    if (children && typeof children === 'object' && 'type' in children && children.type === 'code') {
      return <CodeBlock {...children.props} {...rest} />;
    }
    return <pre {...props} />;
  },
  Callout,
  Tabs: MDXTabs,
  TabsList: MDXTabsList,
  TabsTrigger: MDXTabsTrigger,
  TabsContent: MDXTabsContent,
  Card: MDXCard,
  Steps,
  Step,
  APIEndpoint,
  img: MDXImage,
  Image: MDXImage,
  a: MDXLink,
  p: (props: any) => <p className="my-4 leading-7" {...props} />,
  ul: (props: any) => <ul className="my-4 ml-6 list-disc [&>li]:my-1.5" {...props} />,
  ol: (props: any) => <ol className="my-4 ml-6 list-decimal [&>li]:my-1.5" {...props} />,
  li: (props: any) => <li className="leading-7" {...props} />,
  blockquote: (props: any) => (
    <blockquote
      className="my-4 border-l-2 pl-6 italic text-muted-foreground"
      {...props}
    />
  ),
  hr: (props: any) => <hr className="my-16 border-t" {...props} />,
  table: (props: any) => (
    <div className="my-16! w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="border-b-2 border-border bg-muted/50" {...props} />,
  tbody: (props: any) => <tbody {...props} />,
  tr: (props: any) => <tr className="border-b border-border hover:bg-muted/30 transition-colors" {...props} />,
  th: (props: any) => (
    <th className="bg-muted/50! font-semibold! text-left py-4! px-6! text-sm border-r border-border last:border-r-0" {...props} />
  ),
  td: (props: any) => <td className="py-4! px-6! text-sm border-r border-border last:border-r-0" {...props} />,
};

