import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Login } from './components/Login';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Note, ViewMode, User } from './types';
import { supabase } from './services/supabaseClient';

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- App State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  // --- Modal State ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref to store timeouts for debouncing saves per note ID
  const saveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // --- Effects ---

  // 1. Handle Auth Session
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'Matheus Nogueira',
          avatarUrl: session.user.user_metadata?.avatar_url
        });
        fetchNotes();
      }
      setAuthLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'Matheus Nogueira',
          avatarUrl: session.user.user_metadata?.avatar_url
        });
        fetchNotes();
      } else {
        setUser(null);
        setNotes([]);
        setActiveNoteId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Notes from Supabase
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map Database snake_case to Frontend camelCase
        const mappedNotes: Note[] = data.map((item: any) => ({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          updatedAt: new Date(item.updated_at).getTime(),
          isDeleted: item.is_deleted
        }));
        setNotes(mappedNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Handle Resize for responsive logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileListVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateAvatar = (url: string) => {
    if (user) {
      setUser({ ...user, avatarUrl: url });
    }
  };

  const handleAddNote = async () => {
    if (viewMode === 'trash') setViewMode('active');

    // Optimistic UI Update
    const tempId = crypto.randomUUID();
    const newNote: Note = {
      id: tempId,
      title: '',
      content: '',
      updatedAt: Date.now(),
      isDeleted: false
    };

    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setSearchTerm('');
    if (window.innerWidth < 768) {
      setIsMobileListVisible(false);
    }

    // DB Insert
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          user_id: user.id,
          title: '', 
          content: '',
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace temp ID with real DB ID
      if (data) {
        setNotes(prev => prev.map(n => n.id === tempId ? { ...n, id: data.id } : n));
        setActiveNoteId(data.id);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      // Optional: Remove optimistic note on error
    }
  };

  const handleDeleteNote = async (id: string) => {
    // Optimistic Update
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isDeleted: true, updatedAt: Date.now() } : note
      )
    );
    if (activeNoteId === id) {
      setActiveNoteId(null);
      setIsMobileListVisible(true);
    }

    // DB Update
    try {
      await supabase
        .from('notes')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error moving note to trash:', error);
    }
  };

  const handleRestoreNote = async (id: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isDeleted: false, updatedAt: Date.now() } : note
      )
    );

    try {
      await supabase
        .from('notes')
        .update({ is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error restoring note:', error);
    }
  };

  // Trigger Modal
  const handlePermanentDeleteRequest = (id: string) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  // Execute Delete after confirmation
  const executePermanentDelete = async () => {
    if (!noteToDelete) return;
    
    setIsDeleting(true);
    const id = noteToDelete;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Success UI Update
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setIsMobileListVisible(true);
      }
      
      setDeleteModalOpen(false);
      setNoteToDelete(null);

    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Erro ao excluir nota no banco de dados. Verifique sua conexão ou permissões.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    // 1. Immediate Local Update for UI Responsiveness
    setNotes(prevNotes => 
      prevNotes.map(note => {
        if (note.id === id) {
          return { ...note, ...updates, updatedAt: Date.now() };
        }
        return note;
      })
    );

    // 2. Debounced DB Update
    if (saveTimeoutsRef.current[id]) {
      clearTimeout(saveTimeoutsRef.current[id]);
    }

    saveTimeoutsRef.current[id] = setTimeout(async () => {
      try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;

        await supabase
          .from('notes')
          .update(dbUpdates)
          .eq('id', id);
        
        delete saveTimeoutsRef.current[id];
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }, 1000);
  };

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    if (window.innerWidth < 768) {
      setIsMobileListVisible(false);
    }
  };

  const handleBackToMenu = () => {
    setIsMobileListVisible(true);
  };

  // Filter notes based on view mode and search
  const visibleNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'active') {
      return !note.isDeleted && matchesSearch;
    } else {
      return note.isDeleted && matchesSearch;
    }
  });

  const sortedNotes = [...visibleNotes].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // --- Render Login if not authenticated ---
  if (!user) {
    return <Login />;
  }

  // --- Render Main App ---
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      <div className={`
        fixed inset-0 z-20 md:static md:z-0 w-full md:w-80 lg:w-96 h-full transition-transform duration-300 bg-white
        ${!isMobileListVisible ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <Sidebar
          notes={sortedNotes}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onRestoreNote={handleRestoreNote}
          onPermanentDelete={handlePermanentDeleteRequest}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentView={viewMode}
          onViewChange={setViewMode}
          className="h-full w-full"
          user={user}
          onLogout={handleLogout}
          onUpdateAvatar={handleUpdateAvatar}
        />
      </div>

      <main className="flex-1 relative h-full w-full">
        <Editor
          activeNote={activeNote}
          onUpdateNote={handleUpdateNote}
          isMobileListVisible={isMobileListVisible}
          onBack={handleBackToMenu}
          onRestore={() => activeNote && handleRestoreNote(activeNote.id)}
        />
      </main>
      
      <ConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executePermanentDelete}
        title="Excluir Permanentemente"
        message="Tem certeza que deseja apagar esta nota para sempre? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}

export default App;