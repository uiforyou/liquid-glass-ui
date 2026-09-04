import React, { useRef, useState, useEffect } from 'react';
import { GlassButton } from './GlassButton';
import { Spring1D, SPRING_PRESETS } from '../physics';
import '../GlassMaterial.css';

interface GlassInputProps {
  onSend?: (text: string) => void;
  placeholder?: string;
  onPlusClick?: () => void;
  onBoundsChange?: (bounds: { x: number; y: number; width: number; height: number }) => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  onSend,
  placeholder = 'Ask ChatGPT',
  onPlusClick,
  onBoundsChange
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [height, setHeight] = useState(56);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spring animation for height expansion
  const heightSpring = useRef(new Spring1D(56, SPRING_PRESETS.morph));
  const animFrameRef = useRef<number | null>(null);

  const reportBounds = () => {
    if (!containerRef.current || !onBoundsChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    onBoundsChange({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
  };

  const animateHeight = (targetH: number) => {
    heightSpring.current.setTarget(targetH);
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const running = heightSpring.current.update(dt);
      setHeight(heightSpring.current.current);
      reportBounds();

      if (running) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Adjust textarea auto-grow
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollH = textarea.scrollHeight;
    const newContainerH = Math.min(Math.max(scrollH + 18, 56), 150);
    animateHeight(newContainerH);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    if (onSend) onSend(text);
    setText('');
    animateHeight(56);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  useEffect(() => {
    reportBounds();
    const handleResize = () => reportBounds();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const hasContent = text.trim().length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '56px',
        height: `${height}px`,
        borderRadius: height > 64 ? '28px' : '9999px',
        padding: '7px 10px',
        display: 'flex',
        alignItems: height > 64 ? 'flex-end' : 'center',
        gap: '10px',
        boxSizing: 'border-box',
        // Transparent glass body: lets the 3D raytraced liquid lens and refraction shine through
        background: 'rgba(255, 255, 255, 0.005)',
        // 3D physical rim lighting & elevation shadow without muddy opaque black
        boxShadow: isFocused
          ? '0 24px 60px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.35)'
          : '0 20px 50px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(0, 0, 0, 0.35)'
      }}
    >
      {/* Plus Action Button */}
      <GlassButton
        ariaLabel="Add attachment or action"
        size={40}
        onClick={onPlusClick}
        style={{ flexShrink: 0 }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </GlassButton>

      {/* Auto-growing Text Input */}
      <div style={{ flex: 1, minHeight: '36px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsFocused(true); reportBounds(); }}
          onBlur={() => { setIsFocused(false); reportBounds(); }}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#ffffff',
            fontSize: '16px',
            lineHeight: '1.45',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflowY: 'auto',
            maxHeight: '110px',
            padding: '6px 2px',
            margin: 0,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
          }}
        />
      </div>

      {/* Trailing Controls: Microphone + Send/Voice Blue Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {!hasContent && (
          <GlassButton
            ariaLabel="Voice dictation"
            size={38}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </GlassButton>
        )}

        {/* Primary Action Button (Blue / Active Send) */}
        <button
          onClick={handleSend}
          aria-label={hasContent ? "Send message" : "Voice mode"}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            border: 'none',
            borderRadius: '9999px',
            background: hasContent ? '#ffffff' : '#2563eb',
            color: hasContent ? '#000000' : '#ffffff',
            boxShadow: hasContent
              ? '0 2px 10px rgba(255,255,255,0.35)'
              : '0 2px 14px rgba(37,99,235,0.65)',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {hasContent ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          ) : (
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
};
