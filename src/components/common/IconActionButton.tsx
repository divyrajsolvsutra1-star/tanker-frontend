import { EditIcon, TrashIcon } from "@/components/common/Icons";

interface IconActionButtonProps {
  action: "edit" | "delete";
  onClick: () => void;
  title: string;
  disabled?: boolean;
}

export default function IconActionButton({
  action,
  onClick,
  title,
  disabled = false,
}: IconActionButtonProps) {
  const Icon = action === "edit" ? EditIcon : TrashIcon;

  return (
    <button
      type="button"
      aria-label={title}
      className={`erp-action-btn erp-action-btn--${action} erp-action-btn--icon`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
