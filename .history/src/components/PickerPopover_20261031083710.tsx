import { useLayoutEffect, useRef } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type { Transition } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";

export type PickerItem = { value: string; label: string };
export type PickerAnchor = {
  x: number;
  y: number;
  above: boolean;
  originX: number;
};

export const POPOVER_WIDTH = 336;

const { spring, duration, ease } = motionTokens;
const enter = [...ease.enter] as [number, number, number, number];
const standard = [...ease.standard] as [number, number, number, number];
const physical = (visualDuration: number, bounce: number): Transition => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return {
    type: "spring",
    stiffness: root * root,
    damping: 2 * (1 - bounce) * root,
    mass: 1,
  };
};
const GLIDE = physical(0.3, 0);
const INSTANT: Transition = { duration: 0 };

type PickerGridProps = {
  label: string;
  listId: string;
  optionIdPrefix: string;
  items: PickerItem[];
  columns: number;
  size: "sm" | "lg";
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onPick: (value: string) => void;
};

function PickerGrid({
  label,
  listId,
  optionIdPrefix,
  items,
  columns,
  size,
  activeIndex,
  onActiveChange,
  onPick,
}: PickerGridProps) {
  const reduced = !!useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
  const placed = useRef(false);
  const hx = useMotionValue(0);
  const hy = useMotionValue(0);
  const hw = useMotionValue(0);
  const hh = useMotionValue(0);

  useLayoutEffect(() => {
    const list = listRef.current;
    const cell = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !cell) return;

    const top = cell.offsetTop;
    const bottom = top + cell.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }

    const transition = reduced || !placed.current ? INSTANT : GLIDE;
    animate(hx, cell.offsetLeft, transition);
    animate(hy, cell.offsetTop, transition);
    animate(hw, cell.offsetWidth, transition);
    animate(hh, cell.offsetHeight, transition);
    placed.current = true;
  }, [activeIndex, reduced, items, hx, hy, hw, hh]);

  return (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={label}
      className="relative grid max-h-56 gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      <motion.li
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-xl bg-white/10"
        style={{ x: hx, y: hy, width: hw, height: hh }}
      />
      {items.map((item, index) => (
        <li
          key={item.value}
          id={`${optionIdPrefix}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          aria-label={item.label}
          data-index={index}
          className={`relative z-10 grid cursor-pointer select-none place-items-center rounded-xl ${
            size === "sm" ? "h-9 text-xl" : "aspect-square text-4xl"
          }`}
          onPointerMove={() => {
            if (index !== activeIndex) onActiveChange(index);
          }}
          onClick={() => onPick(item.value)}
        >
          {item.value}
        </li>
      ))}
    </ul>
  );
}

type PickerPopoverProps = PickerGridProps & {
  open: boolean;
  popoverKey: string;
  anchor: PickerAnchor | null;
};

export function PickerPopover({
  open,
  popoverKey,
  anchor,
  ...grid
}: PickerPopoverProps) {
  const reduced = !!useReducedMotion();
  const popIn = reduced
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: anchor?.above ? 4 : -4 };

  return (
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          key={popoverKey}
          className="absolute z-20 max-w-full rounded-card border border-line bg-ground/95 p-3 shadow-xl shadow-black/50 backdrop-blur-xl"
          style={{
            left: anchor.x,
            width: POPOVER_WIDTH,
            ...(anchor.above ? { bottom: anchor.y } : { top: anchor.y }),
            transformOrigin: `${anchor.originX}px ${anchor.above ? "100%" : "0"}`,
          }}
          initial={popIn}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: reduced
              ? { duration: duration.fast }
              : {
                  ...spring.snappy,
                  opacity: { duration: duration.fast, ease: enter },
                },
          }}
          exit={{
            ...popIn,
            transition: { duration: duration.exit * 0.7, ease: standard },
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <PickerGrid {...grid} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}