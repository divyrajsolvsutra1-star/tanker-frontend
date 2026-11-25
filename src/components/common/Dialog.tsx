import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import Button from "./Button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "small" | "medium" | "large";
  closeLabel?: string;
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "medium",
  closeLabel = "Close dialog",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={`app-dialog app-dialog--${size}`}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (!dialogRef.current?.open) onOpenChange(false);
      }}
      ref={dialogRef}
    >
      <div className="app-dialog__panel">
        <header className="app-dialog__header">
          <div>
            <h2 className="app-dialog__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="app-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label={closeLabel}
            className="app-dialog__close"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Close
          </Button>
        </header>
        <div className="app-dialog__body">{children}</div>
      </div>
    </dialog>
  );
}
