import type { RoomSidebarProps, RoomItemProps } from "../types";

function RoomItem({ room, isActive, onClick }: RoomItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "hover:bg-gray-100 text-gray-700"
      }`}
      aria-pressed={isActive}
      aria-label={`Switch to room ${room.name}, ${room.memberCount} members`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg" aria-hidden="true">
          #
        </span>
        <span className="font-medium">{room.name}</span>
      </div>
      <span
        className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full"
        aria-label={`${room.memberCount} members`}
      >
        {room.memberCount}
      </span>
    </button>
  );
}

function AddRoomButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 w-full p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label="Create new room"
    >
      <div className="flex items-center space-x-2 text-gray-500">
        <span aria-hidden="true">+</span>
        <span className="text-sm">Add new room</span>
      </div>
    </button>
  );
}

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
    <nav
      className="w-64 bg-white border-r border-gray-200 flex flex-col"
      aria-label="Room navigation"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <label htmlFor="room-search" className="sr-only">
            Search rooms
          </label>
          <input
            id="room-search"
            type="text"
            placeholder="Search rooms..."
            value={roomSearch}
            onChange={(e) => onRoomSearchChange(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="search-help"
          />
          <div
            className="absolute left-2 top-2.5 text-gray-400"
            aria-hidden="true"
          >
            🔍
          </div>
          <div id="search-help" className="sr-only">
            Type to filter rooms by name
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Chat Rooms
          </h3>

          <div
            role="list"
            className="space-y-1"
            aria-label={`${filteredRooms.length} available rooms`}
          >
            {filteredRooms.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                {roomSearch ? "No rooms found" : "No rooms available"}
              </div>
            ) : (
              filteredRooms.map((room) => (
                <div key={room.id} role="listitem">
                  <RoomItem
                    room={room}
                    isActive={currentRoom === room.id}
                    onClick={() => onRoomChange(room.id)}
                  />
                </div>
              ))
            )}
          </div>

          <AddRoomButton onClick={onAddRoom} />
        </div>
      </div>
    </nav>
  );
}
