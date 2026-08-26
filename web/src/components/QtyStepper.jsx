import { useEffect, useRef } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';

// Presentational only -- each caller owns its own validation logic (Cart
// silently ignores invalid input; Product detail clamps), so this only
// takes already-decided values via props rather than encoding either
// behavior itself. Pulses the stepper's outer shell (not the <input>
// directly) on a value change, so typing/focus in the number input is
// never disrupted by the animation.
export default function QtyStepper({ value, onDecrement, onIncrement, onInputChange, min = 1, max }) {
  const controls = useAnimation();
  const prevValue = useRef(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      if (!reduceMotion) controls.start({ scale: [1, 1.08, 1], transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } });
    }
  }, [value, controls, reduceMotion]);

  return (
    <motion.div className="qty-stepper" animate={controls}>
      <button type="button" onClick={onDecrement} aria-label="Decrease quantity">
        −
      </button>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onInputChange(e.target.value)} />
      <button type="button" onClick={onIncrement} aria-label="Increase quantity">
        +
      </button>
    </motion.div>
  );
}
