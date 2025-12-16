import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Video, Link as LinkIcon, Settings } from 'lucide-react';
import type { InterviewFlow, Question } from '../types';
import VideoRecorder from './VideoRecorder';

interface AdminPanelProps {
  onBack: () => void;
  onSaveFlow: (flow: InterviewFlow) => void;
  existingFlow: InterviewFlow | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onSaveFlow, existingFlow }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionVideo, setNewQuestionVideo] = useState<Blob | null>(null);

  useEffect(() => {
    if (existingFlow) {
      setTitle(existingFlow.title);
      setWebhookUrl(existingFlow.webhookUrl);
      setQuestions(existingFlow.questions);
    }
  }, [existingFlow]);

  const handleAddQuestion = () => {
    if (!newQuestionText || !newQuestionVideo) return;
    const videoUrl = URL.createObjectURL(newQuestionVideo);
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      order: questions.length + 1,
      text: newQuestionText,
      videoUrl: videoUrl 
    };
    setQuestions([...questions, newQuestion]);
    setNewQuestionText('');
    setNewQuestionVideo(null);
    setIsAddingQuestion(false);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = () => {
    if (!title || questions.length === 0) {
      alert("Please provide a title and at least one question.");
      return;
    }
    const cleanWebhookUrl = webhookUrl.trim();
    if(cleanWebhookUrl && !cleanWebhookUrl.startsWith('http')) {
        alert("Webhook URL must start with http:// or https://");
        return;
    }

    const flow: InterviewFlow = {
      id: existingFlow?.id || crypto.randomUUID(),
      title,
      webhookUrl: cleanWebhookUrl,
      questions
    };
    onSaveFlow(flow);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display text-3xl font-bold dark:text-white text-black">
            {existingFlow ? 'Edit Flow' : 'New Interview Flow'}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-brand-yellow hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
        >
          <Save size={20} /> Save Configuration
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-6 text-brand-yellow">
              <Settings size={20} />
              <h2 className="font-bold uppercase tracking-wider text-sm">Flow Settings</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Interview Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Dev Interview"
                  className="w-full bg-gray-50 dark:bg-black/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 text-black dark:text-white focus:border-brand-yellow outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Webhook Endpoint</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <input 
                    type="url" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api..."
                    className="w-full bg-gray-50 dark:bg-black/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 pl-10 text-black dark:text-white focus:border-brand-yellow outline-none transition-colors font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl hidden lg:block">
             <h3 className="font-bold text-gray-900 dark:text-white mb-2">How it works</h3>
             <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-3 list-disc pl-4">
                <li>Create a sequence of questions.</li>
                <li>Record a video asking each question yourself.</li>
                <li>Candidates watch your video and record a reply.</li>
                <li>Gemini AI analyzes the reply.</li>
                <li>Results are sent to your webhook.</li>
             </ul>
          </div>
        </div>

        {/* Questions Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold dark:text-white text-black">Questions Sequence</h2>
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500">
              {questions.length} STEPS
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="group bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-start gap-5 hover:border-brand-yellow/50 transition-colors shadow-sm">
                <div className="bg-gray-100 dark:bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg text-gray-500 dark:text-gray-400 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{q.text}</h3>
                  <div className="flex items-center gap-2 text-xs text-brand-yellow font-medium">
                    <Video size={14} /> Video Recorded
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Question Form */}
          {isAddingQuestion ? (
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand-yellow animate-in slide-in-from-bottom-2">
              <h3 className="font-display text-lg font-bold dark:text-white text-black mb-6">Add New Question</h3>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Question Text</label>
                <input 
                  type="text" 
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 py-3 text-xl font-medium text-black dark:text-white focus:border-brand-yellow outline-none placeholder-gray-400"
                  placeholder="Type your question here..."
                  autoFocus
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-4">Record Video Prompt</label>
                <VideoRecorder 
                  onRecordingComplete={(blob) => setNewQuestionVideo(blob)}
                  label="Record yourself asking the question"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-6 py-2 text-gray-500 hover:text-black dark:hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddQuestion}
                  disabled={!newQuestionText || !newQuestionVideo}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2 rounded-lg font-bold transition-all"
                >
                  Add Question
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingQuestion(true)}
              className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl text-gray-400 hover:border-brand-yellow hover:text-brand-yellow hover:bg-brand-yellow/5 transition-all flex flex-col items-center justify-center gap-2"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                <Plus size={24} />
              </div>
              <span className="font-medium">Add Next Question</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;