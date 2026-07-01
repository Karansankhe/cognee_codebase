import type { FormEvent, ReactNode } from "react";

interface DashboardModalProps {
  children: ReactNode;
  title: string;
  eyebrow: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function DashboardModal({
  children,
  eyebrow,
  onClose,
  onSubmit,
  title,
}: DashboardModalProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-sm">
      <form
        className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_30px_90px_rgba(20,20,24,0.22)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pulse-muted">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              {title}
            </h2>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-pulse-surface text-lg leading-none"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="mt-5 space-y-4">{children}</div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-full bg-pulse-surface px-4 py-2 text-sm font-medium"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-pulse-green px-5 py-2 text-sm font-semibold text-pulse-ink"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function ModalField({
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-pulse-muted">{label}</span>
      <input
        className="mt-2 w-full rounded-full border border-pulse-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-pulse-ink"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

export function ModalTextArea({
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-pulse-muted">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full resize-none rounded-[22px] border border-pulse-line bg-white px-4 py-3 text-sm outline-none transition focus:border-pulse-ink"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
