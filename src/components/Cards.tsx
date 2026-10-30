
import React from "react";

type CardsProps = {
  children: React.ReactNode;
  title?: string;
  padding?: string;
  borderRadius?: string;
  className?: string;
};

const Cards = ({
  children,
  title,
  padding = "p-6 sm:p-8",
  borderRadius = "rounded-card",
  className = "",
}: CardsProps) => {
  return (
    <div
      className={[
        borderRadius,
        "border border-line bg-surface",
        padding,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title && (
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-ink text-left">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
};

export default Cards;
