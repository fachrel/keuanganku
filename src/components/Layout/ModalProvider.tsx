import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Add class to body to prevent scrolling
      document.body.classList.add('modal-open');
      
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    
    return () => {
      // Cleanup
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const openModal = (type: ModalType, data?: any) => {
    setModalType(type);
    setModalData(data);
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