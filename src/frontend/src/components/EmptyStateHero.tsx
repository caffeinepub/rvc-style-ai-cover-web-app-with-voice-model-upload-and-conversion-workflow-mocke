import { ReactNode } from 'react';

interface EmptyStateHeroProps {
  title: string;
  description: string;
  action?: ReactNode;
  imageSrc?: string;
}

export default function EmptyStateHero({ title, description, action, imageSrc }: EmptyStateHeroProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          className="w-full max-w-md mb-8 opacity-60"
        />
      )}
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

