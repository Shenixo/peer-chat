
"use client";

import {
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
  Ref,
  RefObject,
} from "react";

import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import type {
  TargetAndTransition,
  Variants,
} from "motion/react";

import { motionTokens } from "../lib/motion-tokens";
import styles from "./button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl";

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "onDrag"
    | "onDragEnd"
    | "onDragStart"
    | "onAnimationStart"
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  background?: CSSProperties["background"];
  class?: string;
}

const pressVariants: Variants = {
  pressed: (button: RefObject<HTMLButtonElement | null>) => {
    const width = button.current?.offsetWidth ?? 0;

    return {
      scale:
        width > 220
          ? 0.985
          : width && width <= 48
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
};

const textIn: TargetAndTransition = {
  opacity: 0,
  y: 2,
};

const textOut: TargetAndTransition = {
  opacity: 0,
  transition: {
    duration: 0.1,
    ease: [...motionTokens.ease.standard],
  },
};

const iconIn: TargetAndTransition = {
  opacity: 0,
  scale: 0.85,
};

const iconOut: TargetAndTransition = {
  opacity: 0,
  transition: {
    duration: 0.1,
    ease: [...motionTokens.ease.standard],
  },
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
} as const;

function labelKey(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  ) {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(labelKey).join("");
  }

  if (!isValidElement(node)) {
    return "";
  }

  const type = node.type as
    | string
    | { displayName?: string; name?: string };

  return `<${
    typeof type === "string"
      ? type
      : type?.displayName ?? type?.name ?? ""
  }>${labelKey(
    (node.props as { children?: ReactNode }).children,
  )}`;
}

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

function LabelPhase({
  children,
  icon,
  reduced,
  ref,
}: {
  children: ReactNode;
  icon: boolean;
  reduced: boolean;
  ref?: Ref<HTMLSpanElement>;
}) {
  const present = useIsPresent();

  return (
    <motion.span
      ref={ref}
      className={styles.labelPhase}
      aria-hidden={present ? undefined : true}
      initial={
        reduced
          ? fadeIn
          : icon
            ? iconIn
            : textIn
      }
      animate={rest}
      exit={
        reduced
          ? fadeOut
          : icon
            ? iconOut
            : textOut
      }
      transition={
        reduced
          ? {
              duration: motionTokens.duration.instant,
            }
          : icon
            ? iconEnter
            : {
                duration: motionTokens.duration.standard,
                ease: [...motionTokens.ease.enter],
              }
      }
    >
      {children}
    </motion.span>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    className,
    class: customClass,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    onClick,
    background,
    style,
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion() ?? false;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  const key = labelKey(children);
  const width = useMorphWidth(
    contentRef,
    key,
    reduceMotion,
  );

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const popup = props["aria-haspopup"];

  const anchorsLayer =
    (popup !== undefined &&
      popup !== false &&
      popup !== "false") ||
    props.role === "combobox" ||
    (props as Record<string, unknown>)["data-state"] !==
      undefined;

  const inert =
    disabled ||
    loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";

  const sizeClass =
    size === "2xl"
      ? styles.size2xl
      : styles[size];

  const classes = [
    styles.button,
    styles[variant],
    sizeClass,
    background !== undefined ? styles.customBackground : "",
    className,
    customClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={setRefs}
      tabIndex={props.tabIndex ?? 0}
      className={classes}
      style={{
        ...style,
        ...(background !== undefined
          ? { background }
          : {}),
        ...(background !== undefined
          ? { border: "none" }
          : {}),
      }}
      disabled={disabled}
      aria-busy={loading || undefined}
      custom={buttonRef}
      variants={pressVariants}
      whileTap={
        reduceMotion || anchorsLayer || inert
          ? undefined
          : "pressed"
      }
      transition={motionTokens.spring.snappy}
      {...props}
      aria-disabled={
        loading || props["aria-disabled"] || undefined
      }
      onClick={
        loading
          ? (event) => event.preventDefault()
          : onClick
      }
    >
      <AnimatePresence initial={false}>
        {loading ? (
          <motion.span
            key="loader"
            className={styles.loader}
            aria-hidden="true"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.6 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={
              reduceMotion
                ? fadeOut
                : { ...iconOut, scale: 0.8 }
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
            <span className={styles.spinner} />
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.span
        className={[
          styles.labelSlot,
          loading ? styles.loadingLabel : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width }}
      >
        <span
          ref={contentRef}
          className={styles.labelContent}
        >
          <AnimatePresence
            mode="popLayout"
            initial={false}
          >
            <LabelPhase
              key={key}
              icon={
                !/\S/.test(key.replace(/<[^>]*>/g, ""))
              }
              reduced={reduceMotion}
            >
              {children}
            </LabelPhase>
          </AnimatePresence>
        </span>
      </motion.span>
    </motion.button>
  );
});

Button.displayName = "Button";

export default Button;
