// components/room-manage-modal.tsx
import { useState, useEffect } from "react";
import type { Room } from "@/types";

interface RoomManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onAddMember: (username: string) => void;
}

interface RoomMember {
  id: string;
  name: string;
  email?: string;
  username?: string;
}

export default function RoomManageModal({
  isOpen,
  onClose,
  room,
  onAddMember,
}: RoomManageModalProps) {
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && room) {
      // TODO: Fetch room members when modal opens
      // For now, we'll just show the add member functionality
      setMembers([]);
    }
  }, [isOpen, room]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMemberUsername.trim()) return;

    setIsLoading(true);
    onAddMember(newMemberUsername.trim());
    setNewMemberUsername("");
    setIsLoading(false);
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Manage Room: {room.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Room Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Type:</span> {room.type}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Privacy:</span>{" "}
              {room.isPrivate ? "Private" : "Public"}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Members:</span> {room.memberCount}
            </div>
          </div>

          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label
                htmlFor="newMemberUsername"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Add Member
              </label>
              <input
                type="text"
                id="newMemberUsername"
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                User will be added immediately (no invitation needed)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!newMemberUsername.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
