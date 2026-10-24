'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Volume2, Bot, AlertCircle } from 'lucide-react';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'collector' | 'generator';
}

export default function VoiceAgentModal({ isOpen, onClose, role }: VoiceAgentModalProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [agentReply, setAgentReply] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscript('');
    setAgentReply('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await sendVoiceToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Audio capture error:', err);
      setErrorMsg('Microphone access denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceToBackend = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('role', role);
      formData.append('location', 'Metropolis');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/voice-agent?format=stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice agent error: HTTP ${response.status}`);
      }

      const serverTranscript = response.headers.get('X-Transcript');
      const serverSpeech = response.headers.get('X-Speech-Text');

      if (serverTranscript) setTranscript(decodeURIComponent(serverTranscript));
      if (serverSpeech) setAgentReply(decodeURIComponent(serverSpeech));

      const audioBlobResponse = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlobResponse);

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (err: any) {
      console.error('Voice processing error:', err);
      setErrorMsg(err.message || 'Failed to communicate with voice agent.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    stopRecording();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 text-slate-900 shadow-xl p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm p-1"
        >
          ✕
        </button>

        <div className="text-center pb-2">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto mb-2">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {role === 'collector' ? 'Voice Inventory Sourcing' : 'Waste Valuation Hotline'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
            {role === 'collector'
              ? 'Speak naturally: "I need 50kg of cardboard and copper scrap"'
              : 'Speak naturally: "I have a broken washer and some scrap metal"'}
          </p>
        </div>

        {/* Audio interaction area */}
        <div className="my-6 flex flex-col items-center justify-center min-h-[100px]">
          {isRecording ? (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform active:scale-95"
              >
                <Square className="w-5 h-5 fill-white" />
              </button>
              <span className="text-xs text-red-600 font-medium mt-2.5">
                Recording... Tap to send
              </span>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Processing request...</span>
            </div>
          ) : isPlayingAudio ? (
            <div className="flex flex-col items-center space-y-2">
              <Volume2 className="w-8 h-8 text-slate-900 animate-pulse" />
              <span className="text-xs text-slate-700 font-medium">
                Speaking response...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                <Mic className="w-6 h-6" />
              </button>
              <span className="text-xs text-slate-500 mt-2.5">
                Tap microphone to speak
              </span>
            </div>
          )}
        </div>

        {/* Transcript Box */}
        <div className="w-full bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2 min-h-[80px]">
          {transcript && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                You Said:
              </span>
              <p className="text-slate-800 italic mt-0.5">"{transcript}"</p>
            </div>
          )}

          {agentReply && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                <Bot className="w-3 h-3 text-slate-600" />
                <span>Agent Response:</span>
              </span>
              <p className="text-slate-900 font-medium mt-0.5">{agentReply}</p>
            </div>
          )}

          {!transcript && !agentReply && !isProcessing && (
            <p className="text-slate-400 text-center py-2 text-xs">
              Speech transcribed and processed live via Gemini & ElevenLabs
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
