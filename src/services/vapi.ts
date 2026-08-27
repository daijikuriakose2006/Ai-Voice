import Vapi from '@vapi-ai/web';
import { InterviewSetup, TranscriptItem } from '../types';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;

let vapiInstance: Vapi | null = null;

export function getVapiClient(): Vapi {
  if (!vapiInstance) {
    vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
  }
  return vapiInstance;
}

export interface VapiSessionCallbacks {
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (text: string, speaker: 'ai' | 'user') => void;
  onError?: (error: any) => void;
}

/**
 * Start a live voice interview call with Vapi using a professional Female Voice
 */
export async function startVapiInterview(
  setup: InterviewSetup,
  callbacks: VapiSessionCallbacks
) {
  const vapi = getVapiClient();

  // Detach prior listeners to avoid duplicate calls
  vapi.removeAllListeners();

  // Attach event listeners
  vapi.on('call-start', () => {
    callbacks.onCallStart?.();
  });

  vapi.on('call-end', () => {
    callbacks.onCallEnd?.();
  });

  vapi.on('speech-start', () => {
    callbacks.onSpeechStart?.();
  });

  vapi.on('speech-end', () => {
    callbacks.onSpeechEnd?.();
  });

  vapi.on('message', (message: any) => {
    if (message.type === 'transcript') {
      const speaker = message.role === 'assistant' ? 'ai' : 'user';
      callbacks.onTranscript?.(message.transcript, speaker);
    }
  });

  vapi.on('error', (err: any) => {
    console.error('Vapi live call error:', err);
    callbacks.onError?.(err);
  });

  const questionsList = setup.questions && setup.questions.length > 0
    ? setup.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : `1. Walk me through your experience in ${setup.jobRole}.\n2. Describe an interesting technical challenge you solved.`;

  // Assistant Configuration with high-quality Female Voice
  const assistantOptions: any = {
    name: "Rachel - MockPilot Interviewer",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    model: {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Rachel, a friendly, professional female senior engineering interviewer at MockPilot.
You are conducting a realistic mock interview for a candidate applying for the ${setup.jobRole} position (${setup.experienceLevel} level, ${setup.interviewType} format).

The candidate's tech focus includes: ${setup.techStack.join(', ') || 'General software engineering'}.

Here is the prepared interview question flow:
${questionsList}

Interview Rules:
1. Greet the candidate warmly in 1 short sentence, set a supportive tone, and ask the first question.
2. Keep your spoken responses concise and natural (1 to 2 sentences max) so it feels like a real conversation.
3. Listen attentively to their response, acknowledge their key points with professional insight, and probe deeper or move to the next planned question.
4. Allow natural interruptions and maintain a warm, articulate, and encouraging female interviewer persona.`
        }
      ]
    },
    voice: {
      // 11labs / PlayHT / Azure high-fidelity Female Voice
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (Warm, professional female voice)
      stability: 0.7,
      similarityBoost: 0.8
    },
    firstMessage: `Hello! I'm Rachel, your interviewer today. We're going to dive into some questions for the ${setup.jobRole} role. Whenever you're ready, let's start with our first topic: ${setup.questions?.[0] || 'Could you walk me through your background and what you’ve been working on recently?'}`
  };

  try {
    await vapi.start(assistantOptions);
  } catch (error) {
    console.error('Failed to start Vapi session with assistant options:', error);
    // If inline options require agent ID, attempt fallback start or throw
    throw error;
  }
}

export function stopVapiInterview() {
  if (vapiInstance) {
    try {
      vapiInstance.stop();
    } catch (e) {
      console.warn('Error stopping Vapi instance:', e);
    }
  }
}

export function setVapiMuted(isMuted: boolean) {
  if (vapiInstance) {
    try {
      vapiInstance.setMuted(isMuted);
    } catch (e) {
      console.warn('Error muting Vapi:', e);
    }
  }
}
