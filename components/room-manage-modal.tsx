import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Room } from "@/types";

interface RoomManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onAddMember: (email: string) => void;
  onDeleteRoom: (roomId: string) => void;
  roomCreator: string;
}

export default function RoomManageModal({
  isOpen,
  onClose,
  room,
  onAddMember,
  onDeleteRoom,
  roomCreator,
}: RoomManageModalProps) {
  const { data: session } = useSession();
  const [memberEmail, setMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const canDelete = room?.createdBy == session?.user?.id;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      firstInputRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberEmail.trim()) return;

    setIsLoading(true);
    onAddMember(memberEmail.trim());
    setMemberEmail("");
    setIsLoading(false);
  };

  const handleDeleteRoom = () => {
    if (!room) return;
    onDeleteRoom(room.id);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-room-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        role="document"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="manage-room-title"
              className="text-xl font-bold text-gray-800"
            >
              Manage Room: {room.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
              aria-label="Close dialog"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Type:</span> {room.type}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Privacy:</span>{" "}
              {room.isPrivate ? "Private" : "Public"}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Members:</span> {room.memberCount}
            </div>
            <div className="text-sm text-blue-600">
              <span className="font-medium">
                Room Owner: {roomCreator}
                {room?.createdBy == session?.user?.id && " (You)"}
              </span>
            </div>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label
                htmlFor="memberEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Add Member by Email
              </label>
              <input
                ref={firstInputRef}
                type="email"
                id="memberEmail"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                required
                aria-describedby="email-help"
              />
              <div id="email-help" className="text-xs text-gray-500 mt-1">
                User will be added immediately if they have an account
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isLoading}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!memberEmail.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {isLoading ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>

          {canDelete && (
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h3 className="font-semibold mb-2 text-red-600">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-3">
                Delete this room permanently. This will remove all messages and
                members.
              </p>
              <button
                onClick={handleDeleteRoom}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                aria-label={`Delete room ${room.name}`}
              >
                Delete Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
