import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProcessedFile {
  id: string;
  originalName: string;
  processedAt: Date;
  downloadUrl: string;
  previewUrl: string;
}

export interface BandSettings {
  height: number; // in mm
  yOffset: number; // in mm
  replaceImage?: File;
  backgroundColor?: string;
  textContent?: string;
  textColor?: string;
}

interface AppState {
  // Current processing state
  currentFile: File | null;
  previewImages: string[];
  currentPage: number;
  bandSettings: BandSettings;
  isProcessing: boolean;
  processingProgress: number;
  
  // History
  processedFiles: ProcessedFile[];
  
  // Actions
  setCurrentFile: (file: File | null) => void;
  setPreviewImages: (images: string[]) => void;
  setCurrentPage: (page: number) => void;
  setBandSettings: (settings: Partial<BandSettings>) => void;
  setProcessing: (processing: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  addProcessedFile: (file: ProcessedFile) => void;
  removeProcessedFile: (id: string) => void;
  reset: () => void;
}

const DEFAULT_BAND_SETTINGS: BandSettings = {
  height: 60, // 60mm default band height
  yOffset: 0,
  backgroundColor: '#ffffff',
  textContent: '',
  textColor: '#000000',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentFile: null,
      previewImages: [],
      currentPage: 0,
      bandSettings: DEFAULT_BAND_SETTINGS,
      isProcessing: false,
      processingProgress: 0,
      processedFiles: [],

      // Actions
      setCurrentFile: (file) => set({ currentFile: file }),
      
      setPreviewImages: (images) => set({ 
        previewImages: images,
        currentPage: 0 
      }),
      
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setBandSettings: (settings) => set(state => ({
        bandSettings: { ...state.bandSettings, ...settings }
      })),
      
      setProcessing: (processing) => set({ 
        isProcessing: processing,
        processingProgress: processing ? 0 : 100
      }),
      
      setProcessingProgress: (progress) => set({ processingProgress: progress }),
      
      addProcessedFile: (file) => set(state => ({
        processedFiles: [file, ...state.processedFiles.slice(0, 4)] // Keep only last 5
      })),
      
      removeProcessedFile: (id) => set(state => ({
        processedFiles: state.processedFiles.filter(f => f.id !== id)
      })),
      
      reset: () => set({
        currentFile: null,
        previewImages: [],
        currentPage: 0,
        bandSettings: DEFAULT_BAND_SETTINGS,
        isProcessing: false,
        processingProgress: 0,
      }),
    }),
    {
      name: 'obi-tuke-storage',
      partialize: (state) => ({ 
        processedFiles: state.processedFiles 
      }),
    }
  )
);