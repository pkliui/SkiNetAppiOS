import { useState, useCallback, useRef } from 'react';
import { runSegmentation } from '../ml/modelRunner';
import type { PickedImage, SegmentationResult } from '../types';

interface State {
  image: PickedImage | null;
  result: SegmentationResult | null;
  isRunning: boolean;
  error: string | null;
}

export function useInference() {
  const [state, setState] = useState<State>({
    image: null,
    result: null,
    isRunning: false,
    error: null,
  });

  // Keep a ref so runInference can read current state without being recreated.
  const stateRef = useRef(state);
  stateRef.current = state;

  const setImage = useCallback((image: PickedImage) => {
    setState({ image, result: null, isRunning: false, error: null });
  }, []);

  const runInference = useCallback(async () => {
    const { image, isRunning } = stateRef.current;
    if (!image || isRunning) return;

    setState(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const result = await runSegmentation(image);
      setState(prev => ({ ...prev, result, isRunning: false }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Inference failed';
      setState(prev => ({ ...prev, isRunning: false, error }));
    }
  }, []);

  return { ...state, setImage, runInference };
}
