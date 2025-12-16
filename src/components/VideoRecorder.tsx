import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StopCircle, RefreshCw, Video } from 'lucide-react';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDurationSeconds?: number;
  label?: string;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onRecordingComplete, 
  maxDurationSeconds = 60,
  label = "Record Video"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access denied.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  useEffect(() => {
    if (!recordedBlob && !stream) startCamera();
  }, [recordedBlob, stream, startCamera]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setTimer(prev => {
          if (prev >= maxDurationSeconds) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDurationSeconds]);

  const startRecording = () => {
    if (!stream) return;
    const chunks: BlobPart[] = [];
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? { mimeType: 'video/webm;codecs=vp9' } : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onRecordingComplete(blob);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setTimer(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setTimer(0);
    startCamera();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 text-sm font-bold p-3 rounded-lg border border-red-500/20 text-center">
          {error}
        </div>
      )}

      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
        {!recordedBlob ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        ) : (
          <video 
            src={previewUrl || ""} 
            controls 
            className="w-full h-full object-contain" 
          />
        )}

        {/* Live Indicator overlay */}
        {!recordedBlob && !isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Camera Ready</span>
            </div>
        )}

        {/* Recording Overlay */}
        {isRecording && (
          <div className="absolute inset-0 border-[6px] border-red-500/50 rounded-2xl pointer-events-none z-20 animate-pulse"></div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-mono font-bold flex items-center gap-2 z-30 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
            {formatTime(timer)}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {!recordedBlob ? (
          !isRecording ? (
            <button
              onClick={startRecording}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-red-600/20 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
              START RECORDING
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full py-4 rounded-xl bg-gray-900 text-white border border-gray-700 hover:bg-black font-bold tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <StopCircle size={20} className="text-red-500" />
              STOP
            </button>
          )
        ) : (
          <button
            onClick={resetRecording}
            className="w-full py-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-yellow text-gray-900 dark:text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            RETAKE VIDEO
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;