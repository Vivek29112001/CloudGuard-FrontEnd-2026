import { AlertTriangle, LoaderCircle } from "lucide-react";
export function LoadingPanel({
  label = "Loading audit information…",
}: {
  label?: string;
}) {
  return (
    <div className="empty-panel text-slate-500">
      <LoaderCircle size={28} className="animate-spin" />
      <p>{label}</p>
    </div>
  );
}
export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="alert danger">
      <AlertTriangle size={17} />
      <div>{message}</div>
    </div>
  );
}
export function InfoPanel({ children }: { children: React.ReactNode }) {
  return <div className="alert">{children}</div>;
}
