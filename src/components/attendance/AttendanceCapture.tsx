
import React, { useRef, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Webcam } from '@/components/ui/webcam';
import { Button } from '@/components/ui/button';
import useFaceRecognition from '@/hooks/useFaceRecognition';
import AttendanceResult from './AttendanceResult';
import { testModelLoading, checkModelsAccessibility } from '@/utils/modelTester';
import { AlertCircle } from 'lucide-react';

const AttendanceCapture = () => {
  const { toast } = useToast();
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    accessible: boolean;
    errors: string[];
  } | null>(null);
  
  const {
    processFace,
    isProcessing,
    isModelLoading,
    result,
    error,
    resetResult
  } = useFaceRecognition();
  
  // Initial model availability check
  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        const testResult = await testModelLoading();
        if (testResult.success) {
          setModelStatus('ready');
        } else {
          console.error('Model load test failed:', testResult.message);
          setModelStatus('error');
        }
      } catch (err) {
        console.error('Error checking model status:', err);
        setModelStatus('error');
      }
    };
    
    checkModelStatus();
  }, []);
  
  const runDiagnostics = async () => {
    setShowDiagnostics(true);
    try {
      const accessibility = await checkModelsAccessibility();
      setDiagnosticResult(accessibility);
    } catch (err) {
      console.error('Error running diagnostics:', err);
      setDiagnosticResult({
        accessible: false,
        errors: [`Diagnostic error: ${err instanceof Error ? err.message : String(err)}`]
      });
    }
  };
  
  const retryModels = async () => {
    setModelStatus('loading');
    setShowDiagnostics(false);
    setDiagnosticResult(null);
    
    try {
      const testResult = await testModelLoading(true); // Force reload
      if (testResult.success) {
        setModelStatus('ready');
        toast({
          title: "Success",
          description: "Face recognition models loaded successfully.",
          variant: "default",
        });
      } else {
        console.error('Model reload failed:', testResult.message);
        setModelStatus('error');
        toast({
          title: "Loading Failed",
          description: testResult.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error reloading models:', err);
      setModelStatus('error');
      toast({
        title: "Error",
        description: "Failed to reload face models. Please refresh the page.",
        variant: "destructive",
      });
    }
  };
  
  const handleCapture = async () => {
    if (!webcamRef.current || isProcessing || isModelLoading) {
      console.log('Cannot capture: webcam not ready, processing in progress, or models still loading');
      console.log('Webcam ref exists:', !!webcamRef.current);
      console.log('Is processing:', isProcessing);
      console.log('Is model loading:', isModelLoading);
      return;
    }
    
    try {
      console.log('Processing face recognition...');
      console.log('Webcam video element:', webcamRef.current);
      console.log('Video element ready state:', webcamRef.current.readyState);
      console.log('Video dimensions:', webcamRef.current.videoWidth, 'x', webcamRef.current.videoHeight);
      
      const recognitionResult = await processFace(webcamRef.current);
      
      if (!recognitionResult) {
        toast({
          title: "Processing Error",
          description: error || "Failed to process face. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const displayStatus = recognitionResult.status === 'present' ? 'present' : 'unauthorized';
      const statusMessage = displayStatus === 'present' ? 'present' : 'not authorized';
      
      if (recognitionResult.recognized) {
        toast({
          title: "Attendance Recorded",
          description: `${recognitionResult.employee.name} marked as ${statusMessage} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          variant: displayStatus === 'present' ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Recognition Failed",
          description: "This person is not registered in the system.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Face recognition error:', err);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the image.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Facial Recognition</h3>
      <div className="space-y-4">
        {modelStatus === 'error' ? (
          <div className="bg-destructive/10 border border-destructive rounded-md p-4 space-y-3">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-destructive mr-2" />
              <h4 className="font-medium text-destructive">Face Recognition Models Not Loaded</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The application failed to load face recognition models. This might be due to network issues or missing model files.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryModels}
              >
                Retry Loading
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runDiagnostics}
              >
                Run Diagnostics
              </Button>
            </div>
            
            {showDiagnostics && (
              <div className="bg-muted p-3 rounded-md text-sm space-y-2 max-h-48 overflow-y-auto">
                <h5 className="font-medium">Diagnostic Results:</h5>
                {!diagnosticResult ? (
                  <p>Running diagnostics...</p>
                ) : (
                  <>
                    <p className={diagnosticResult.accessible ? "text-green-600" : "text-destructive"}>
                      Models accessible: {diagnosticResult.accessible ? "Yes" : "No"}
                    </p>
                    {diagnosticResult.errors.length > 0 && (
                      <div>
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {diagnosticResult.errors.map((err, i) => (
                            <li key={i} className="text-xs">{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <Webcam
            ref={webcamRef}
            onCapture={() => handleCapture()}
            className="w-full"
            showControls={!isProcessing && !result}
            autoStart={!result}
          />
        )}
        
        {isModelLoading && (
          <div className="flex flex-col items-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-muted-foreground">Loading face recognition models...</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex flex-col items-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-muted-foreground">Processing face recognition...</p>
          </div>
        )}
        
        {result && <AttendanceResult result={result} resetResult={resetResult} />}
      </div>
    </Card>
  );
};

export default AttendanceCapture;
