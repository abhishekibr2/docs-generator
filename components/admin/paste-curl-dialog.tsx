'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { parseCurlCommand, type ParsedCurl } from '@/lib/utils/curl-parser';

interface PasteCurlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCurlParsed: (parsed: ParsedCurl) => void;
}

export function PasteCurlDialog({
  open,
  onOpenChange,
  onCurlParsed,
}: PasteCurlDialogProps) {
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);

    if (!curlCommand.trim()) {
      setError('Please paste a curl command');
      return;
    }

    try {
      const parsed = parseCurlCommand(curlCommand);
      onCurlParsed(parsed);
      setCurlCommand('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to parse curl command. Please check the format.');
    }
  };

  const handleCancel = () => {
    setCurlCommand('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Paste Curl Command</DialogTitle>
          <DialogDescription>
            Paste your curl command below. The form will be automatically populated with the extracted information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="curl-command">Curl Command</Label>
            <Textarea
              id="curl-command"
              value={curlCommand}
              onChange={(e) => {
                setCurlCommand(e.target.value);
                setError(null);
              }}
              placeholder='curl -X GET "https://api.example.com/users?page=1" -H "Authorization: Bearer token123"'
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleParse}>Parse</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

