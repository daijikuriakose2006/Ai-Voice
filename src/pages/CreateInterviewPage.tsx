import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateInterviewQuestions } from '../services/groq';
import { saveInterviewSession } from '../services/firebase';
import { ExperienceLevel, InterviewType, InterviewSession } from '../types';
import { Sparkles, X, Plus, Loader2, RefreshCw, Trash2, Edit2, Check } from 'lucide-react';

const SUGGESTED_TAGS = [
  'Node.js',
  'PostgreSQL',
  'AWS',
  'Python',
  'Kubernetes',
  'React',
  'TypeScript',
  'GraphQL',
  'Docker',
  'Next.js',
  'System Design',
  'Microservices',
  'Redis',
  'CI/CD'
];

export const CreateInterviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [jobRole, setJobRole] = useState('Frontend Engineer');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid (2-5y)');
  const [interviewType, setInterviewType] = useState<InterviewType>('Mixed');
  const [techStack, setTechStack] = useState<string[]>(['React', 'TypeScript']);
  const [tagInput, setTagInput] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  // Generated Flow State
  const [questions, setQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Trigger question generation from Groq
  const fetchQuestionsFromAI = async (count = questionCount) => {
    setIsGenerating(true);
    try {
      const generated = await generateInterviewQuestions({
        jobRole,
        experienceLevel,
        interviewType,
        techStack,
        questionCount: count,
      });
      setQuestions(generated);
    } catch (err) {
      console.error('Failed to generate questions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load questions when parameters change
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchQuestionsFromAI(questionCount);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [jobRole, experienceLevel, interviewType, techStack, questionCount]);

  const handleAddTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !techStack.includes(clean)) {
      setTechStack([...techStack, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTechStack(techStack.filter(t => t !== tagToRemove));
  };

  const handleSaveEdit = (index: number) => {
    if (editText.trim()) {
      const updated = [...questions];
      updated[index] = editText.trim();
      setQuestions(updated);
    }
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setQuestionCount(updated.length);
  };

  const handleAddCustomQuestion = () => {
    if (newQuestionInput.trim()) {
      const updated = [...questions, newQuestionInput.trim()];
      setQuestions(updated);
      setQuestionCount(updated.length);
      setNewQuestionInput('');
      setShowAddCustom(false);
    }
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    const sessionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newSession: InterviewSession = {
      id: sessionId,
      userId: user?.id || 'guest',
      jobRole,
      experienceLevel,
      interviewType,
      techStack,
      questionCount: questions.length,
      questions: questions.length > 0 ? questions : [
        `Walk me through your background and how you use ${techStack.join(', ') || 'modern engineering practices'}.`,
        'Can you describe a technically complex feature you implemented recently?',
        'How do you approach testing, debugging, and production reliability?'
      ],
      status: 'in_progress',
      durationSeconds: 0,
      voiceProvider: 'vapi',
      voiceGender: 'female',
      createdAt: new Date().toISOString()
    };

    await saveInterviewSession(newSession);
    navigate(`/interview/${sessionId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Page Title Header matching Screenshot 3 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Create an interview
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            The AI interviewer adapts its questions and follow-ups to this setup using Groq AI.
          </p>
        </div>

        {/* 2-Column Grid matching Screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Form Setup Card */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-soft">
            
            {/* Job Role Input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-2">
                Job role
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Product Manager, Backend Architect"
                className="w-full px-4 py-3 bg-white dark:bg-obsidian-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
              />
            </div>

            {/* Experience Level & Interview Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-2">
                  Experience level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-3 bg-white dark:bg-obsidian-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors cursor-pointer"
                >
                  <option value="Junior (0-2y)">Junior (0-2y)</option>
                  <option value="Mid (2-5y)">Mid (2-5y)</option>
                  <option value="Senior (5+y)">Senior (5+y)</option>
                  <option value="Lead / Staff (8+y)">Lead / Staff (8+y)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-2">
                  Interview type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                  className="w-full px-3.5 py-3 bg-white dark:bg-obsidian-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors cursor-pointer"
                >
                  <option value="Mixed">Mixed</option>
                  <option value="Technical">Technical</option>
                  <option value="System Design">System Design</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Live Coding">Live Coding</option>
                </select>
              </div>
            </div>

            {/* Tech Stack / Topics Tag Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-2">
                Tech stack / topics
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Type a technology and press Enter"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-obsidian-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-700 text-neutral-800 dark:text-neutral-200 font-semibold text-sm rounded-xl transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Selected Tags */}
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {techStack.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-obsidian-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-full text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_TAGS.filter(t => !techStack.includes(t)).slice(0, 6).map(suggested => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => handleAddTag(suggested)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {suggested}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions Slider (1 to 15) */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                  Number of questions
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white px-2.5 py-0.5 bg-neutral-100 dark:bg-obsidian-800 rounded-md border border-neutral-200 dark:border-neutral-700">
                    {questionCount} questions
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={15}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="text-[11px] font-medium">Quick presets:</span>
                {[3, 5, 7, 10, 15].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuestionCount(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      questionCount === preset
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-obsidian-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button matching Screenshot 3 */}
            <button
              type="button"
              onClick={handleStartInterview}
              disabled={isStarting}
              className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isStarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300 dark:text-amber-600" />
              )}
              <span>Generate & start interview ({questions.length} questions)</span>
            </button>
          </div>

          {/* Right Column: Generated Flow Card matching Screenshot 3 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Generated flow
              </h2>
              
              <button
                type="button"
                onClick={() => fetchQuestionsFromAI(questionCount)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-obsidian-900 hover:bg-neutral-100 dark:hover:bg-obsidian-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50"
                title="Regenerate with Groq AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              {jobRole || 'General'} · {experienceLevel} · {interviewType} · {questions.length} questions
            </p>

            {/* Questions Numbered List matching Screenshot 3 */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {questions.map((question, index) => (
                <div key={index} className="flex items-start gap-3.5 group p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-obsidian-900/60 transition-colors">
                  {/* Number Badge */}
                  <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </div>

                  {/* Question Text / Inline Edit */}
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 text-xs sm:text-sm bg-white dark:bg-obsidian-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(index)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                        {question}
                      </p>
                    )}
                  </div>

                  {/* Edit / Delete actions on hover */}
                  {editingIndex !== index && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(index);
                          setEditText(question);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                        title="Edit question"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(index)}
                        className="p-1 text-neutral-400 hover:text-red-500"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Question Accordion */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              {showAddCustom ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newQuestionInput}
                    onChange={(e) => setNewQuestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomQuestion();
                      }
                    }}
                    placeholder="Enter custom interview question..."
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-obsidian-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomQuestion}
                      className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold"
                    >
                      Add to Flow
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-3 py-1.5 text-neutral-500 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add custom question</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
