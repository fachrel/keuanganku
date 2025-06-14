import React, { createContext, useContext, useState, ReactNode } from 'react';

// Modal types
export type ModalType = 
  | 'addAccount'
  | 'editAccount'
  | 'transfer'
  | 'addCategory'
  | 'categoryBudget'
  | 'addBudget'
  | 'editBudget'
  | 'addGoal'
  | 'contributeGoal'
  | 'addWishlist'
  | 'editWishlist'
  | 'addTransaction'
  | 'ocrTransaction';

// Modal context type
interface ModalContextType {
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  modalType: ModalType | null;
  modalData: any;
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
  const [modalData, setModalData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (type: ModalType, data?: any) => {
    setModalType(type);
    setModalData(data);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
    
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