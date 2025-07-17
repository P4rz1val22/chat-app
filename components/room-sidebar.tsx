// components/room-sidebar.tsx
import type { RoomSidebarProps, RoomItemProps } from "../types";

// Individual room item component
function RoomItem({ room, isActive, onClick }: RoomItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">#</span>
        <span className="font-medium">{room.name}</span>
      </div>
      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
        {room.memberCount}
      </span>
    </div>
  );
}

// Add new room button component
function AddRoomButton({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="mt-4 p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
    >
      <div className="flex items-center space-x-2 text-gray-500">
        <span>+</span>
        <span className="text-sm">Add new room</span>
      </div>
    </div>
  );
}

// Main room sidebar component
export default function RoomSidebar({
  rooms,
  currentRoom,
  roomSearch,
  onRoomChange,
  onRoomSearchChange,
  onAddRoom,
}: RoomSidebarProps) {
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(roomSearch.toLowerCase())
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search rooms..."
            value={roomSearch}
            onChange={(e) => onRoomSearchChange(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-2 top-2.5 text-gray-400">🔍</div>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Chat Rooms
          </h3>

          <div className="space-y-1">
            {filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={currentRoom === room.id}
                onClick={() => onRoomChange(room.id)}
              />
            ))}
          </div>

          {/* Add New Room Button */}
          <AddRoomButton onClick={onAddRoom} />
        </div>
      </div>
    </div>
  );
}
