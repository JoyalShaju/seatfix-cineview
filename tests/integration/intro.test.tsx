import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeatFixIntro } from '@/components/intro/SeatFixIntro';

describe('SeatFix Intro Screen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the SeatFix cinematic intro and transitions smoothly into the auditorium', () => {
    const onComplete = vi.fn();
    render(<SeatFixIntro reducedMotion={false} onComplete={onComplete} />);

    expect(screen.getByRole('dialog', { name: /welcome to seatfix/i })).toBeInTheDocument();
    expect(screen.getByText('SeatFix')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2800);
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('allows immediate dismissal via Skip button', () => {
    const onComplete = vi.fn();
    render(<SeatFixIntro reducedMotion={true} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
