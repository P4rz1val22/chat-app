import { useMemo, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type {
  Room,
  CreateRoomForm,
  ExtendedSession,
  SwitchRoomData,
  Message,
} from "@/types";

interface UseRoomManagementProps {
  socket: Socket | null;
  session: ExtendedSession | null;
  rooms: Room[];
  currentRoom: string;
  roomSearch: string;
  setCurrentRoom: React.Dispatch<React.SetStateAction<string>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stopTyping: () => void;
}

interface UseRoomManagementReturn {
  filteredRooms: Room[];
  currentRoomName: string;
  handleCreateRoom: (roomData: CreateRoomForm) => Promise<void>;
  handleDeleteRoom: (roomId: string) => void;
  handleAddMember: (email: string) => void;
  switchRoom: (newRoomId: string) => void;
}

export function useRoomManagement({
  socket,
  session,
  rooms,
  currentRoom,
  roomSearch,
  setCurrentRoom,
  setMessages,
  stopTyping,
}: UseRoomManagementProps): UseRoomManagementReturn {
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.name.toLowerCase().includes(roomSearch.toLowerCase())
    );
  }, [rooms, roomSearch]);

  const currentRoomName = useMemo(() => {
    const room = rooms.find((room) => room.id === currentRoom);
    return room?.name || currentRoom;
  }, [rooms, currentRoom]);

  const handleCreateRoom = useCallback(
    async (roomData: CreateRoomForm) => {
      if (!socket?.connected || !session?.user?.id) return;

      const createData = {
        ...roomData,
        createdById: session.user.id,
      };

      socket.emit("create_room", createData);
    },
    [socket, session?.user?.id]
  );

  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      if (!socket?.connected || !session?.user?.id) return;

      const roomToDelete = rooms.find((room) => room.id === roomId);
      if (!roomToDelete) return;

      if (roomToDelete.createdBy != session.user.id) {
        alert("Only the room creator can delete this room.");
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${roomToDelete.name}"?\n\n` +
          `This will permanently delete all messages and remove all members. This action cannot be undone.`
      );

      if (confirmed) {
        socket.emit("delete_room", {
          roomId: roomId,
          deletedBy: session.user.id,
        });
      }
    },
    [socket, session?.user?.id, rooms]
  );

  const handleAddMember = useCallback(
    (email: string) => {
      if (!socket?.connected || !session?.user?.id) return;

      socket.emit("add_member", {
        roomId: currentRoom,
        email: email,
        addedBy: session.user.id,
      });
    },
    [socket, session?.user?.id, currentRoom]
  );

  const switchRoom = useCallback(
    (newRoomId: string) => {
      if (!socket?.connected || !session?.user?.name) return;

      if (!newRoomId || newRoomId === "") {
        return;
      }

      const roomExists = rooms.find((room) => room.id === newRoomId);
      if (!roomExists) {
        return;
      }

      stopTyping();

      const switchData: SwitchRoomData = {
        oldRoom: currentRoom || "none",
        newRoom: newRoomId,
        username: session.user.name,
      };
      socket.emit("switch_room", switchData);

      setCurrentRoom(newRoomId);
      setMessages([]);
    },
    [
      socket,
      session?.user?.name,
      rooms,
      currentRoom,
      stopTyping,
      setCurrentRoom,
      setMessages,
    ]
  );

  return {
    filteredRooms,
    currentRoomName,
    handleCreateRoom,
    handleDeleteRoom,
    handleAddMember,
    switchRoom,
  };
}
