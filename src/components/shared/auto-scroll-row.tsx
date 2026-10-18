"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type AutoScrollRowProps = {
  /** Pass the item list already duplicated (e.g. `[...items, ...items]`) — the loop wraps at the halfway point. */
  children: React.ReactNode;
  direction?: "left" | "right";
  pixelsPerSecond?: number;
  id?: string;
  className?: string;
};

/** How long after a manual swipe/drag ends before the row resumes auto-scrolling. */
const RESUME_DELAY_MS = 1500;

/**
 * A horizontally auto-scrolling, infinitely looping row: continuously
 * animates `scrollLeft` via rAF, pauses on hover, and pauses while the user
 * is actively touching/dragging (native touch scroll keeps working, since
 * this is a real `overflow-x-auto` container, not a CSS transform).
 */
export function AutoScrollRow({
  children,
  direction = "left",
  pixelsPerSecond = 45,
  id,
  className,
}: AutoScrollRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Scrolling right visually means walking the content backwards — start
    // mid-way through the doubled list so there's room to decrement.
    if (direction === "right") track.scrollLeft = track.scrollWidth / 2;

    // The exact (fractional) offset lives here. At 1x zoom the browser rounds
    // `scrollLeft` to whole pixels, so adding the per-frame step to it directly
    // (0.3px at 45px/s on a 144 Hz screen) rounded back to zero every frame
    // and the row never moved.
    let position = track.scrollLeft;

    // The children are two back-to-back copies of the same list — wrapping
    // by exactly half the scroll width, in either direction, is invisible
    // to the eye and is what makes the loop feel endless. The forward wrap
    // waits until the row is strictly past the halfway point: exactly
    // `halfWidth` is where a right-moving row starts (and where `<= 0` sends
    // it), so wrapping there too bounced the row between 0 and halfWidth.
    const wrap = () => {
      const halfWidth = track.scrollWidth / 2;
      if (track.scrollLeft > halfWidth) track.scrollLeft -= halfWidth;
      else if (track.scrollLeft <= 0) track.scrollLeft += halfWidth;
      // A swipe or the wrap above moved the row — carry on from where it is now.
      if (Math.abs(track.scrollLeft - position) >= 1) position = track.scrollLeft;
    };
    track.addEventListener("scroll", wrap);

    const sign = direction === "left" ? 1 : -1;
    let raf = 0;
    let lastTime: number | null = null;
    const tick = (time: number) => {
      if (lastTime == null) lastTime = time;
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;
      if (!pausedRef.current) {
        position += sign * pixelsPerSecond * deltaSeconds;
        track.scrollLeft = position;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", wrap);
    };
  }, [direction, pixelsPerSecond]);

  const pauseForInteraction = () => {
    window.clearTimeout(resumeTimeoutRef.current);
    pausedRef.current = true;
  };
  const scheduleResume = () => {
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  };

  return (
    <div
      id={id}
      ref={trackRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onPointerDown={pauseForInteraction}
      onPointerUp={scheduleResume}
      onTouchStart={pauseForInteraction}
      onTouchEnd={scheduleResume}
      className={cn(
        "flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
