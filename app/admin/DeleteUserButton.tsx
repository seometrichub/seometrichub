"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteUserButtonProps = {
  userId: string;
  email: string;
  disabled?: boolean;
};

export default function DeleteUserButton({
  userId,
  email,
  disabled = false,
}: DeleteUserButtonProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (disabled || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${email}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Unable to delete user.",
        );
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete user.",
      );

      setDeleting(false);
    }
  }

  if (disabled) {
    return (
      <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
        Protected
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete User"}
      </button>

      {error && (
        <p className="mt-2 max-w-48 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}