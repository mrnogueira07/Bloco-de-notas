import React, { useRef, useState } from 'react';
import { Note, SidebarProps } from '../types';
import { supabase } from '../services/supabaseClient';

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onAddNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDelete,
  searchTerm,
  onSearchChange,
  currentView,
  onViewChange,
  user,
  onLogout,
  onUpdateAvatar,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Format date helper
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    setIsUploading(true);
    try {
      // 1. Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // 4. Update Local State
      onUpdateAvatar(publicUrl);

    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "avatars" existe e é público.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            SmartNotes
          </h1>
          {currentView === 'active' && (
            <button 
              onClick={onAddNote}
              className="p-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-colors"
              title="Criar nova nota"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder={currentView === 'active' ? "Buscar notas..." : "Buscar na lixeira..."}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
          />
          <svg className="absolute left-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* View Toggles */}
        <div className="flex p-1 bg-gray-200 rounded-lg">
          <button
            onClick={() => onViewChange('active')}
            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${
              currentView === 'active' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Minhas Notas
          </button>
          <button
            onClick={() => onViewChange('trash')}
            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${
              currentView === 'trash' 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Lixeira
          </button>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">
              {currentView === 'active' 
                ? 'Nenhuma nota encontrada.' 
                : 'Lixeira vazia.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notes.map((note) => (
              <li key={note.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNote(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectNote(note.id);
                    }
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors group relative cursor-pointer outline-none ${
                    activeNoteId === note.id 
                      ? currentView === 'active' ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-red-50 border-l-4 border-red-500' 
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-medium truncate pr-6 ${activeNoteId === note.id ? 'text-gray-900' : 'text-gray-800'}`}>
                      {note.title || 'Sem título'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{formatDate(note.updatedAt)}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10 leading-relaxed">
                    {note.content || <span className="italic opacity-50">Sem conteúdo...</span>}
                  </p>

                  {/* Actions Container */}
                  <div className={`absolute top-4 right-2 flex gap-1 z-10 bg-white/90 rounded-md shadow-sm opacity-0 group-hover:opacity-100 ${activeNoteId === note.id ? 'opacity-100' : ''}`}>
                    
                    {currentView === 'active' ? (
                      // Action: Move to Trash
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Mover para lixeira"
                      >
                        <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    ) : (
                      // Actions: Restore & Permanent Delete
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreNote(note.id);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
                          title="Restaurar nota"
                        >
                          <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 14 4 9 9 4"></polyline>
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDelete(note.id);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Excluir permanentemente"
                        >
                          <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div 
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
                title="Alterar foto de perfil"
              >
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                {/* Overlay for upload indication */}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user.name}</span>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};