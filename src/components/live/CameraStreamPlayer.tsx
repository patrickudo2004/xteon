import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, Snowflake } from 'lucide-react';

interface CameraStreamPlayerProps {
  cameraId: string;
  cameraName: string;
  isFrozen?: boolean;
  isLiveFeedEnabled?: boolean;
  onMetadataLoaded?: (res: { width: number; height: number }, fps: number) => void;
  onToggleFeed?: () => void;
  className?: string;
}

export const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = ({
  cameraId,
  cameraName,
  isFrozen = false,
  isLiveFeedEnabled = false,
  onMetadataLoaded,
  onToggleFeed,
  className = 'w-full h-full object-contain bg-black',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frozenSnapshot, setFrozenSnapshot] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and attach WebRTC MediaStream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    if (!isLiveFeedEnabled) {
      setIsLoading(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    const startCamera = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC Camera API not supported in this environment');
        }

        // Request real camera video stream with deviceId constraint
        const constraints: MediaStreamConstraints = {
          video: cameraId
            ? {
                deviceId: { exact: cameraId },
                width: { ideal: 3840, min: 1280 },
                height: { ideal: 2160, min: 720 },
                frameRate: { ideal: 60, min: 30 },
              }
            : true,
          audio: false,
        };

        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (exactErr) {
          // Fallback if exact deviceId constraint is unsupported by certain virtual drivers
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: cameraId ? { deviceId: cameraId } : true,
            audio: false,
          });
        }

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        // Query real resolution and frame rate capabilities
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height && onMetadataLoaded) {
            onMetadataLoaded(
              { width: settings.width, height: settings.height },
              settings.frameRate || 60
            );
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Camera stream acquisition error:', err);
          setErrorMsg(err.message || 'Camera sensor in standby or in use by another app');
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraId, isLiveFeedEnabled]);

  // Handle freeze frame snapshot
  useEffect(() => {
    if (isFrozen && videoRef.current) {
      try {
        const video = videoRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setFrozenSnapshot(canvas.toDataURL('image/jpeg', 0.9));
          }
        }
      } catch (e) {
        console.warn('Freeze frame capture error:', e);
      }
    } else if (!isFrozen) {
      setFrozenSnapshot(null);
    }
  }, [isFrozen]);

  if (!isLiveFeedEnabled) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#0B0D13] via-[var(--bg-card)] to-[#07090E] flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] flex items-center justify-center text-[var(--accent-amber)] shadow-lg">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
            {cameraName}
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
            Sensor Standby • LED Off • 0% CPU Load
          </div>
        </div>
        {onToggleFeed && (
          <button
            onClick={onToggleFeed}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Engage Live Stream</span>
          </button>
        )}
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#130B0B] to-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="font-mono text-xs font-bold text-rose-300">
          {cameraName}
        </div>
        <div className="text-[10px] font-mono text-slate-400 max-w-xs leading-relaxed">
          {errorMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      {isFrozen && frozenSnapshot ? (
        <img
          src={frozenSnapshot}
          alt={`Frozen ${cameraName}`}
          className={className}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            if (videoRef.current && onMetadataLoaded) {
              const v = videoRef.current;
              onMetadataLoaded({ width: v.videoWidth, height: v.videoHeight }, 60);
            }
          }}
          className={className}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isFrozen && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-1 shadow-lg">
          <Snowflake className="w-3 h-3" />
          <span>FROZEN VIEW</span>
        </div>
      )}
    </div>
  );
};
