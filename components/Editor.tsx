import React, { useState } from 'react';
import { EditorProps } from '../types';
import { Button } from './Button';
import { enhanceNoteContent, generateTitle, fixGrammar, changeTone, ToneType } from '../services/geminiService';

export const Editor: React.FC<EditorProps> = ({
  activeNote,
  onUpdateNote,
  isMobileListVisible,
  onBack,
  onRestore
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isChangingTone, setIsChangingTone] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);

  // If there's no active note, show a placeholder state
  if (!activeNote) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center h-full transition-transform duration-300 ${isMobileListVisible ? 'translate-x-full absolute inset-0 md:translate-x-0 md:relative' : 'translate-x-0 relative'}`}>
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="18"></line>
            <line x1="8" y1="14" x2="16" y2="14"></line>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Selecione uma nota</h2>
        <p className="text-gray-500 max-w-md">
          Escolha uma nota na barra lateral para editar ou crie uma nova para começar suas anotações.
        </p>
      </div>
    );
  }

  const handleEnhance = async () => {
    if (!activeNote.content.trim()) return;
    
    setIsEnhancing(true);
    try {
      const improvedText = await enhanceNoteContent(activeNote.content);
      onUpdateNote(activeNote.id, { content: improvedText });
    } catch (error) {
      alert("Falha ao melhorar texto. Verifique sua conexão ou chave de API.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGrammarFix = async () => {
    if (!activeNote.content.trim()) return;

    setIsFixingGrammar(true);
    try {
      const fixedText = await fixGrammar(activeNote.content);
      onUpdateNote(activeNote.id, { content: fixedText });
    } catch (error) {
      alert("Falha ao corrigir gramática.");
    } finally {
      setIsFixingGrammar(false);
    }
  };

  const handleToneChange = async (tone: ToneType) => {
    if (!activeNote.content.trim()) return;
    
    setIsChangingTone(true);
    setShowToneMenu(false);
    try {
      const newText = await changeTone(activeNote.content, tone);
      onUpdateNote(activeNote.id, { content: newText });
    } catch (error) {
      alert("Falha ao reescrever texto.");
    } finally {
      setIsChangingTone(false);
    }
  };

  const handleAutoTitle = async () => {
    if (!activeNote.content.trim()) return;
    setIsGeneratingTitle(true);
    try {
      const newTitle = await generateTitle(activeNote.content);
      onUpdateNote(activeNote.id, { title: newTitle });
    } catch (error) {
       console.error("Failed to generate title", error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const isTrash = activeNote.isDeleted;

  return (
    <div className={`flex-1 flex flex-col h-full bg-white transition-transform duration-300 z-10 ${isMobileListVisible ? 'translate-x-full absolute inset-0 md:relative md:translate-x-0' : 'translate-x-0 absolute inset-0 md:relative'}`}>
      
      {/* Trash Banner */}
      {isTrash && (
        <div className="bg-red-50 text-red-700 px-6 py-3 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span className="text-sm font-medium">Esta nota está na lixeira.</span>
          </div>
          <button 
            onClick={onRestore}
            className="text-sm font-medium underline hover:text-red-900"
          >
            Restaurar para editar
          </button>
        </div>
      )}

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
           {/* Mobile Back Button */}
          <button 
            onClick={onBack}
            className="md:hidden mr-2 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Editor</span>
        </div>

        <div className="flex gap-2 relative">
           <Button 
            variant="ghost" 
            onClick={handleAutoTitle}
            disabled={isGeneratingTitle || !activeNote.content || isTrash}
            isLoading={isGeneratingTitle}
            title="Gerar título automático com IA"
            className="hidden lg:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5v13l-5.5-2.5L6.5 21v-13A5.5 5.5 0 0 1 12 2.5z"/>
            </svg>
            Auto Título
          </Button>

          {/* Tone Dropdown */}
          <div className="relative">
            <Button 
              variant="secondary" 
              onClick={() => setShowToneMenu(!showToneMenu)}
              disabled={!activeNote.content || isTrash || isChangingTone}
              isLoading={isChangingTone}
              className="text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
              title="Alterar tom do texto"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
               </svg>
              Tom
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-1 transition-transform ${showToneMenu ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Button>
            
            {showToneMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowToneMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-40 flex flex-col animate-in fade-in zoom-in duration-200 origin-top-right">
                   <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">Reescrever como</div>
                   <button onClick={() => handleToneChange('formal')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center">
                     <span className="w-2 h-2 rounded-full bg-slate-800 mr-2"></span> Formal
                   </button>
                   <button onClick={() => handleToneChange('professional')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span> Profissional
                   </button>
                   <button onClick={() => handleToneChange('informal')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Informal
                   </button>
                </div>
              </>
            )}
          </div>
          
          <Button 
            variant="secondary" 
            onClick={handleGrammarFix} 
            isLoading={isFixingGrammar}
            disabled={!activeNote.content || isTrash}
            className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hidden sm:flex"
            title="Corrigir erros gramaticais"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M7 4v16M17 4v16M3 8h4M3 16h4M17 8h4M17 16h4"></path>
            </svg>
            Gramática
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleEnhance} 
            isLoading={isEnhancing}
            disabled={!activeNote.content || isTrash}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
            title="Reescrever e melhorar texto"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Melhorar
          </Button>
        </div>
      </div>

      {/* Editor Inputs */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
        <input
          type="text"
          value={activeNote.title}
          readOnly={!!isTrash}
          onChange={(e) => onUpdateNote(activeNote.id, { title: e.target.value })}
          placeholder="Título da Nota"
          className={`w-full text-3xl md:text-4xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none bg-transparent mb-6 ${isTrash ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <textarea
          value={activeNote.content}
          readOnly={!!isTrash}
          onChange={(e) => onUpdateNote(activeNote.id, { content: e.target.value })}
          placeholder="Comece a escrever sua nota aqui..."
          className={`w-full h-[calc(100%-80px)] resize-none text-lg text-gray-600 leading-relaxed border-none outline-none bg-transparent placeholder-gray-300 ${isTrash ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
      
      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
        <span>{activeNote.content.length} caracteres</span>
        <span>Última edição: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeNote.updatedAt))}</span>
      </div>
    </div>
  );
};