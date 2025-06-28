import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ModalType } from '../../types';

// Modal context type
interface ModalContextType {
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  modalType: ModalType | null;
  modalData: Record<string, unknown> | null;
  isModalOpen: boolean;
}

// Create context
const ModalContext = createContext<ModalContextType | null>(null);

// Hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Modal provider component
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<Record<string, unknown> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Add class to body to prevent scrolling
      document.body.classList.add('modal-open');
    } else {
      // Restore scrolling
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      // Cleanup
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen]);

  const openModal = (type: ModalType, data?: Record<string, unknown>) => {
    setModalType(type);
    setModalData(data || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    
    // Delay clearing the modal type and data to allow for exit animations
    setTimeout(() => {
      setModalType(null);
      setModalData(null);
    }, 300);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modalType, modalData, isModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
};