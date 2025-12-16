import React, { useState } from 'react';
import type { InterviewFlow, Answer } from '../types';
import VideoRecorder from './VideoRecorder';
import { analyzeVideoResponse } from '../services/geminiService';
import { ArrowRight, CheckCircle, Loader2, PlayCircle, Video, Mic } from 'lucide-react';

interface InterviewSessionProps {
  flow: InterviewFlow;
  onComplete: () => void;
  onExit: () => void;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ flow, onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswerBlob, setCurrentAnswerBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const currentQuestion = flow.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === flow.questions.length - 1;

  const handleNext = async () => {
    if (!currentAnswerBlob) return;

    setIsProcessing(true);
    setProcessingStatus('AI is analyzing your response...');

    try {
      // 1. Analyze with Gemini
      const analysis = await analyzeVideoResponse(currentAnswerBlob, currentQuestion.text);
      
      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        videoBlob: currentAnswerBlob,
        analysis: analysis
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      // 2. If it's the last question, submit everything to webhook
      if (isLastQuestion) {
        setProcessingStatus('Finalizing results...');
        await submitToWebhook(updatedAnswers);
        onComplete();
      } else {
        // Prepare for next question
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswerBlob(null);
      }

    } catch (error) {
      console.error("Error processing step:", error);
      alert("There was an error processing your video. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const submitToWebhook = async (allAnswers: Answer[]) => {
    if (!flow.webhookUrl) {
        console.log("No webhook URL configured, skipping submission.");
        return;
    }

    const payload = {
      interviewId: flow.id,
      candidateId: crypto.randomUUID(),
      flowTitle: flow.title,
      submittedAt: new Date().toISOString(),
      results: allAnswers.map(a => {
        // Find question text for context
        const questionText = flow.questions.find(q => q.id === a.questionId)?.text;
        return {
            questionId: a.questionId,
            questionText,
            analysis: a.analysis
        };
      })
    };

    try {
        console.log(`Submitting to webhook: ${flow.webhookUrl}`);
        const response = await fetch(flow.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        });
        if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }
        console.log("Webhook submission successful");
    } catch (e) {
      console.error("Webhook submission failed", e);
      alert(`Note: The interview completed, but we couldn't send the data to the webhook server. Error: ${e instanceof Error ? e.message : String(e)}`);
      // We don't block completion UI on webhook failure, but we notify.
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-brand-yellow blur-xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="w-16 h-16 text-brand-yellow animate-spin relative z-10" />
        </div>
        <h2 className="text-3xl font-display font-bold dark:text-white text-black mt-8 mb-3">Processing</h2>
        <p className="text-gray-500 font-medium">{processingStatus}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-[calc(100vh-80px)]">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="font-display text-2xl font-bold dark:text-white text-black">{flow.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Session
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</div>
                <div className="text-brand-yellow font-mono font-bold">{Math.round(((currentQuestionIndex) / flow.questions.length) * 100)}%</div>
            </div>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-brand-yellow transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestionIndex) / flow.questions.length) * 100}%` }}
                />
            </div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        {/* Question Side */}
        <div className="order-2 lg:order-1 space-y-6">
          <div className="relative group rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-800 aspect-video">
             {/* Question Video Overlay */}
             <div className="absolute top-0 left-0 p-6 z-10 w-full bg-gradient-to-b from-black/80 to-transparent">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                    <Video size={12} /> Interviewer
                </div>
             </div>
             
            <video 
              src={currentQuestion.videoUrl} 
              controls 
              className="w-full h-full object-cover"
              // Auto-play the question video carefully (muted usually required for autoplay, but let user control)
            />
          </div>
          
          <div className="glass-panel p-8 rounded-3xl border-l-4 border-l-brand-yellow">
            <h3 className="text-brand-yellow text-xs font-bold uppercase tracking-wider mb-3">
              Question {currentQuestionIndex + 1} of {flow.questions.length}
            </h3>
            <p className="text-3xl md:text-4xl font-display font-bold dark:text-white text-black leading-tight">
              "{currentQuestion.text}"
            </p>
          </div>
        </div>

        {/* Answer Side */}
        <div className="order-1 lg:order-2 flex flex-col h-full justify-center space-y-8">
            <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 border-t-2 border-l-2 border-brand-yellow rounded-tl-2xl"></div>
                <div className="absolute -right-4 -bottom-4 w-12 h-12 border-b-2 border-r-2 border-brand-yellow rounded-br-2xl"></div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-2 border border-gray-200 dark:border-gray-800">
                     <VideoRecorder 
                        onRecordingComplete={setCurrentAnswerBlob}
                        maxDurationSeconds={90}
                        label="Your Answer"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 max-w-[200px]">
                    Record your answer to proceed. You can retake it if needed.
                </p>
                <button
                    onClick={handleNext}
                    disabled={!currentAnswerBlob}
                    className="group flex items-center gap-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-black px-8 py-4 rounded-2xl font-bold transition-all transform hover:translate-x-1"
                >
                    {isLastQuestion ? 'Submit Interview' : 'Next Question'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </div>
      
      <div className="mt-8 lg:mt-0 text-center py-6">
         <button onClick={onExit} className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors">
            Cancel Session
         </button>
      </div>
    </div>
  );
};

export default InterviewSession;