"use client";

import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";

export default function Page() {
  const [room] = useState(new Room());
  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');

  const checkMicPermission = useCallback(async () => {
    try {
      // First, check if permissions are already granted
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (error) {
      // Permission not granted or denied
      console.log('Microphone permission not granted:', error);
      setMicPermission('prompt');
      return false;
    }
  }, []);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      await onConnectButtonClicked();
    } catch (error) {
      console.error('Error acquiring microphone permissions:', error);
      setMicPermission('denied');
      alert('Microphone access was denied. Please check your browser settings.');
    }
  }, []);

  useEffect(() => {
    checkMicPermission();
  }, []);

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container max-h-[90vh]">
          <SimpleVoiceAssistant 
            onConnectButtonClicked={onConnectButtonClicked} 
            micPermission={micPermission} 
            requestMicPermission={requestMicPermission} 
          />
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function SimpleVoiceAssistant(props: { 
  onConnectButtonClicked: () => void; 
  micPermission: PermissionState; 
  requestMicPermission: () => void 
}) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <>
      <AnimatePresence>
        {agentState === "disconnected" && (
          <motion.div
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="absolute left-1/2 -translate-x-1/2 space-y-5 flex flex-col items-center -translate-y-1/2"
          >
            <h1 className="text-2xl font-bold">Volition Labs Voice Agent Sandbox</h1>
            <h2 className="text-xl font-bold">Pantarini Restaurant Sandbox</h2>
            <p className="text-center">
              Try our sandboxed voice agent, built to handle order booking and tracking for a demo restaurant. Feel free to ask it anything—no voice or transcript data is stored.
              <br /><br />
              After your chat, we would appreciate your feedback through a quick 3-question form.
              <br /><br />
              <p>You can reach out to me on the <a className="underline" href="https://www.linkedin.com/in/aditya-kumar-5a1689278/">LinkedID</a>.</p>
            </p>
            <div className="flex gap-4">
              {props.micPermission !== 'granted' ? (
                <button 
                  className="bg-blue-500 text-white rounded-md px-4 py-2" 
                  onClick={props.requestMicPermission}
                >
                  Request Microphone Access
                </button>
              ) : (
                <button 
                  className="bg-white text-black rounded-md px-4 py-2" 
                  onClick={() => props.onConnectButtonClicked()}
                >
                  Start a conversation
                </button>
              )}
              <button className="bg-yellow-500 text-amber-800 rounded-md px-4 py-2">
                <a href="https://form.jotform.com/250985522943465" target="__blank">
                Leave Feedback  
                </a>
              </button>
            </div>
          </motion.div>
        )}
        <div className="w-3/4 lg:w-1/2 mx-auto h-full">
          <TranscriptionView />
        </div>
      </AnimatePresence>

      <RoomAudioRenderer />
      <NoAgentNotification state={agentState} />
      <div className="fixed bottom-0 w-full px-4 py-2">
        <ControlBar />
      </div>
    </>
  );
}

function ControlBar() {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  const { state: agentState, audioTrack } = useVoiceAssistant();

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex absolute w-full h-full justify-between px-8 sm:px-4"
          >
            <BarVisualizer
              state={agentState}
              barCount={5}
              trackRef={audioTrack}
              className="agent-visualizer w-24 gap-2"
              options={{ minHeight: 12 }}
            />
            <div className="flex items-center">
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
