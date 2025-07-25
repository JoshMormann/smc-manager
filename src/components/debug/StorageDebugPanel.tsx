import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { StorageDiagnostics } from '@/utils/storageDiagnostics';
import { useAuth } from '@/contexts/AuthContext';
import { STORAGE_CONFIG } from '@/config/storage';

export default function StorageDebugPanel() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Awaited<
    ReturnType<typeof StorageDiagnostics.getStorageStatus>
  > | null>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults(null);

    try {
      const status = await StorageDiagnostics.getStorageStatus(user?.id);
      setResults(status);
    } catch (error: unknown) {
      setResults({
        bucket: {
          exists: false,
          isPublic: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          bucketName: STORAGE_CONFIG.bucketName,
        },
        recommendations: [
          'Failed to run diagnostics: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
        ],
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Storage Configuration Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Current Configuration:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Bucket Name:</div>
            <Badge variant="outline">{STORAGE_CONFIG.bucketName}</Badge>
            <div>Max File Size:</div>
            <Badge variant="outline">
              {Math.round(STORAGE_CONFIG.maxFileSize / (1024 * 1024))}MB
            </Badge>
            <div>Max Files:</div>
            <Badge variant="outline">{STORAGE_CONFIG.maxFiles}</Badge>
          </div>
        </div>

        <Button onClick={runDiagnostics} disabled={testing} className="w-full">
          {testing ? 'Running Diagnostics...' : 'Test Storage Setup'}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Bucket Status */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                {getStatusIcon(results.bucket.exists)}
                Bucket Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Bucket Exists:</div>
                <Badge variant={results.bucket.exists ? 'default' : 'destructive'}>
                  {results.bucket.exists ? 'Yes' : 'No'}
                </Badge>
                <div>Public Access:</div>
                <Badge variant={results.bucket.isPublic ? 'default' : 'secondary'}>
                  {results.bucket.isPublic ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              {results.bucket.error && (
                <Alert>
                  <AlertDescription>{results.bucket.error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Upload Test */}
            {results.upload && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  {getStatusIcon(results.upload.success)}
                  Upload Test
                </h4>
                <Badge variant={results.upload.success ? 'default' : 'destructive'}>
                  {results.upload.success ? 'Passed' : 'Failed'}
                </Badge>
                {results.upload.error && (
                  <Alert>
                    <AlertDescription>{results.upload.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations:</h4>
              <ul className="space-y-1">
                {results.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    {rec.includes('✅') ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription>
            This debug panel helps identify storage configuration issues. Run this test after
            setting up your Supabase storage bucket.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
