import { Room, RoomSettings } from './Room.js';
import { CONFIG } from '../config/constants.js';
import { Server } from 'socket.io';
import { generateRoomCode } from '../utils/idGenerator.js';

export class RoomManager {
  private static instance: RoomManager;
  private readonly rooms: Map<string, Room> = new Map();
  private io!: Server;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public initialize(io: Server): void {
    this.io = io;
  }

  public createRoom(settings?: Partial<RoomSettings>): Room {
    // Check room limit
    if (this.rooms.size >= CONFIG.MAX_ROOMS) {
      throw new Error('Server room limit reached');
    }

    // Generate unique room code
    let roomId: string;
    do {
      roomId = generateRoomCode();
    } while (this.rooms.has(roomId));

    const room = new Room(roomId, this.io, settings);
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId.toUpperCase());
    if (room) {
      room.destroy();
      this.rooms.delete(roomId.toUpperCase());
    }
  }

  public findRoomByPlayer(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalPlayerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.size;
    }
    return count;
  }
}
