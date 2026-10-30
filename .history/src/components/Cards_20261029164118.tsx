
import React from "react";

type CardsProps = {
  children: React.ReactNode;
  title?: string;
};

const Cards = ({ children, title }: CardsProps) => {
  return (
    <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
      {title && (
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-ink text-left">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
};

export default Cards;
