import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BookOpen, Code, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive documentation to help you get started and make the
            most of our platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-12">
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
              <BookOpen className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Get started with our guides and tutorials
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/docs">Browse Docs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
              <Code className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Complete API documentation and examples
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/api-reference">View API</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Changelog</CardTitle>
              <CardDescription>
                Latest updates and improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/changelog">View Changelog</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
              <Sparkles className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Jump right in with our quick start guide
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link href="/docs">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
