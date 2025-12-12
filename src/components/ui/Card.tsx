export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-surface border border-border rounded-xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);