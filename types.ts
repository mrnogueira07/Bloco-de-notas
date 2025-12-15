export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  isDeleted?: boolean; // New property for trash functionality
}

export type NoteSortOption = 'updated' | 'alpha';
export type ViewMode = 'active' | 'trash';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void; // Moves to trash
  onRestoreNote: (id: string) => void; // Restores from trash
  onPermanentDelete: (id: string) => void; // Deletes forever
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
  user: User | null;
  onLogout: () => void;
  onUpdateAvatar: (url: string) => void;
}

export interface EditorProps {
  activeNote: Note | null;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  isMobileListVisible: boolean;
  onBack: () => void;
  onRestore: () => void; // Allow restoring from editor
}