

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  RefObject,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type {
  TargetAndTransition,
  Variants,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./action-button.module.css";

export type ActionButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl";

export interface ActionButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "onClick"
    | "onDrag"
    | "onDragEnd"
    | "onDragStart"
    | "onAnimationStart"
  > {
  label: string;
  successLabel?: string;
  pendingLabel?: string;
  onAction: () => void | Promise<void>;
  resetAfterMs?: number;
  onActionError?: (error: unknown) => void;
  size?: ActionButtonSize;
  background?: CSSProperties["background"];
  class?: string;
}

const pressVariants: Variants = {
  pressed: (
    button: RefObject<HTMLButtonElement | null>,
  ) => {
    const width = button.current?.offsetWidth ?? 0;

    return {
      scale:
        width > 220
          ? 0.985
          : width > 0 && width <= 48
            ? 0.96
            : 0.97,
      transition: {
        duration: motionTokens.duration.instant,
        ease: [...motionTokens.ease.standard],
      },
    };
  },
};

const rest: TargetAndTransition = {
  opacity: 1,
  y: 0,
  scale: 1,
  filter: "blur(0px)",
};

const labelIn = {
  duration: 0.16,
  ease: [...motionTokens.ease.enter],
} as const;

const labelOut: TargetAndTransition = {
  opacity: 0,
  transition: {
    duration: 0.1,
    ease: [...motionTokens.ease.standard],
  },
};

const iconIn: TargetAndTransition = {
  opacity: 0,
  scale: 0.6,
  filter: `blur(${motionTokens.blur.subtle}px)`,
};

const iconOut: TargetAndTransition = {
  ...iconIn,
  transition: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.standard],
  },
};

const arrowIn: TargetAndTransition = {
  opacity: 0,
  x: -6,
  filter: `blur(${motionTokens.blur.subtle}px)`,
};

const arrowOut: TargetAndTransition = {
  opacity: 0,
  x: 8,
  filter: `blur(${motionTokens.blur.subtle}px)`,
  transition: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.standard],
  },
};

const iconRest: TargetAndTransition = {
  ...rest,
  x: 0,
};

const fadeIn: TargetAndTransition = {
  ...rest,
  opacity: 0,
};

const fadeOut: TargetAndTransition = {
  opacity: 0,
  transition: {
    duration: motionTokens.duration.instant,
  },
};

const iconEnter = {
  ...motionTokens.spring.snappy,
  opacity: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.enter],
  },
  filter: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.enter],
  },
} as const;

function useMorphWidth(
  content: RefObject<HTMLElement | null>,
  key: string,
  reduced: boolean,
) {
  const width = useMotionValue<number | "auto">("auto");
  const lastKey = useRef(key);
  const armedUntil = useRef(0);

  useLayoutEffect(() => {
    if (lastKey.current === key) return;

    lastKey.current = key;
    armedUntil.current = performance.now() + 700;
  }, [key]);

  useEffect(() => {
    const node = content.current;
    const slot = node?.parentElement;

    if (
      !node ||
      !slot ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    let measured = false;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const next = entry.contentRect.width;

      if (
        !next ||
        !measured ||
        reduced ||
        performance.now() > armedUntil.current
      ) {
        measured = next > 0;
        width.jump(next || "auto");
        delete slot.dataset.morphing;
        return;
      }

      slot.dataset.morphing = "";

      animate(width, next, {
        ...motionTokens.spring.morph,
        onComplete: () => {
          delete slot.dataset.morphing;
        },
      });
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [content, reduced, width]);

  return width;
}

function DrawnCheck({
  reduced,
}: {
  reduced: boolean;
}) {
  return (
    <svg
      className={styles.statusIcon}
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M4 12l5 5L20 6"
        initial={
          reduced
            ? false
            : { pathLength: 0, opacity: 0 }
        }
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: {
            duration: motionTokens.duration.standard,
            ease: [...motionTokens.ease.enter],
            delay: 0.05,
          },
          opacity: {
            duration: 0.05,
            delay: 0.05,
          },
        }}
      />
    </svg>
  );
}

function SwapText({
  text,
  reduced,
}: {
  text: string;
  reduced: boolean;
}) {
  const sizerRef = useRef<HTMLSpanElement>(null);
  const width = useMorphWidth(sizerRef, text, reduced);

  return (
    <motion.span
      className={styles.morph}
      style={{ width }}
      aria-hidden="true"
    >
      <span ref={sizerRef} className={styles.sizer}>
        {text}
      </span>

      <AnimatePresence initial={false}>
        <motion.span
          key={text}
          className={styles.label}
          initial={
            reduced
              ? false
              : { opacity: 0, y: 2 }
          }
          animate={{ opacity: 1, y: 0 }}
          exit={
            reduced
              ? {
                  opacity: 0,
                  transition: { duration: 0 },
                }
              : labelOut
          }
          transition={labelIn}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export function ActionButton({
  label,
  successLabel = "Saved",
  pendingLabel = "Saving",
  onAction,
  resetAfterMs = 2400,
  onActionError,
  className,
  class: customClass,
  size = "md",
  background,
  style,
  disabled,
  ...props
}: ActionButtonProps) {
  const [state, setState] = useState<
    "idle" | "pending" | "success"
  >("idle");

  const resetTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const inFlight = useRef(false);
  const reduceMotion = useReducedMotion() ?? false;

  const externallyDisabled =
    disabled === true ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";

  const text =
    state === "pending"
      ? pendingLabel
      : state === "success"
        ? successLabel
        : label;

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const run = useCallback(async () => {
    if (inFlight.current || externallyDisabled) return;

    inFlight.current = true;

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }

    setState("pending");

    try {
      await onAction();

      setState("success");

      if (resetAfterMs > 0) {
        resetTimer.current = setTimeout(() => {
          setState("idle");
          resetTimer.current = null;
        }, resetAfterMs);
      }
    } catch (error) {
      setState("idle");
      onActionError?.(error);
    } finally {
      inFlight.current = false;
    }
  }, [
    externallyDisabled,
    onAction,
    onActionError,
    resetAfterMs,
  ]);

  const pending = state === "pending";
  const arrow = state === "idle";

  const sizeClass =
    size === "2xl"
      ? styles.size2xl
      : styles[size];

  const classes = [
    styles.button,
    sizeClass,
    background !== undefined
      ? styles.customBackground
      : "",
    className,
    customClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      {...props}
      ref={buttonRef}
      type={props.type ?? "button"}
      className={classes}
      style={{
        ...style,
        ...(background !== undefined
          ? { background, border: "none" }
          : {}),
      }}
      disabled={disabled}
      aria-disabled={
        externallyDisabled || pending
          ? true
          : undefined
      }
      aria-busy={pending || undefined}
      data-state={state}
      custom={buttonRef}
      variants={pressVariants}
      whileTap={
        reduceMotion || externallyDisabled || pending
          ? undefined
          : "pressed"
      }
      transition={motionTokens.spring.snappy}
      onClick={run}
    >
      <span className={styles.content} aria-hidden="true">
        <SwapText
          text={text}
          reduced={reduceMotion}
        />

        <span className={styles.iconSlot}>
          <AnimatePresence initial={false}>
            <motion.span
              key={state}
              className={styles.phase}
              initial={
                reduceMotion
                  ? fadeIn
                  : arrow
                    ? arrowIn
                    : iconIn
              }
              animate={iconRest}
              exit={
                reduceMotion
                  ? fadeOut
                  : arrow
                    ? arrowOut
                    : iconOut
              }
              transition={
                reduceMotion
                  ? {
                      duration:
                        motionTokens.duration.instant,
                    }
                  : iconEnter
              }
            >
              {pending ? (
                <span className={styles.spinner} />
              ) : state === "success" ? (
                <DrawnCheck reduced={reduceMotion} />
              ) : (
                <ArrowRight
                  className={styles.arrow}
                  width={17}
                  height={17}
                />
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>

      <span className={styles.visuallyHidden}>
        {label}
      </span>

      <span
        className={styles.visuallyHidden}
        role="status"
        aria-live="polite"
      >
        {pending
          ? pendingLabel
          : state === "success"
            ? successLabel
            : ""}
      </span>
    </motion.button>
  );
}

ActionButton.displayName = "ActionButton";

export default ActionButton;
