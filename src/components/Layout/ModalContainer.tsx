import React from 'react';
import { useModal } from './ModalProvider';

// Import all modals
import AddAccountModal from '../Accounts/AddAccountModal';
import EditAccountModal from '../Accounts/EditAccountModal';
import TransferModal from '../Accounts/TransferModal';
import AddCategoryModal from '../Categories/AddCategoryModal';
import CategoryBudgetModal from '../Categories/CategoryBudgetModal';
import AddBudgetModal from '../Budget/AddBudgetModal';
import EditBudgetModal from '../Budget/EditBudgetModal';
import AddGoalModal from '../SavingsGoals/AddGoalModal';
import ContributeModal from '../SavingsGoals/ContributeModal';
import AddWishlistModal from '../Wishlist/AddWishlistModal';
import EditWishlistModal from '../Wishlist/EditWishlistModal';
import AddTransactionModal from '../Transactions/AddTransactionModal';
import OCRTransactionModal from '../Transactions/OCRTransactionModal';
import AddRecurringModal from '../Recurring/AddRecurringModal';

const ModalContainer: React.FC = () => {
  const { modalType, modalData, isModalOpen, closeModal } = useModal();

  if (!isModalOpen || !modalType) return null;

  // Render the appropriate modal based on modalType
  switch (modalType) {
    case 'addAccount':
      return <AddAccountModal isOpen={true} onClose={closeModal} />;
    
    case 'editAccount':
      return <EditAccountModal isOpen={true} account={modalData} onClose={closeModal} />;
    
    case 'transfer':
      return <TransferModal isOpen={true} accounts={modalData} onClose={closeModal} />;
    
    case 'addCategory':
      return <AddCategoryModal onClose={closeModal} onAddCategory={modalData.onAddCategory} />;
    
    case 'categoryBudget':
      return (
        <CategoryBudgetModal 
          category={modalData.category} 
          onClose={closeModal} 
          onUpdateBudget={modalData.onUpdateBudget} 
        />
      );
    
    case 'addBudget':
      return (
        <AddBudgetModal 
          categories={modalData.categories} 
          onClose={closeModal} 
          onAddBudget={modalData.onAddBudget} 
        />
      );
    
    case 'editBudget':
      return (
        <EditBudgetModal 
          budget={modalData.budget} 
          onClose={closeModal} 
          onUpdateBudget={modalData.onUpdateBudget} 
        />
      );
    
    case 'addGoal':
      return <AddGoalModal onClose={closeModal} onAddGoal={modalData.onAddGoal} />;
    
    case 'contributeGoal':
      return (
        <ContributeModal 
          goal={modalData.goal} 
          onClose={closeModal} 
          onContribute={modalData.onContribute} 
        />
      );
    
    case 'addWishlist':
      return <AddWishlistModal isOpen={true} onClose={closeModal} />;
    
    case 'editWishlist':
      return <EditWishlistModal isOpen={true} item={modalData} onClose={closeModal} />;
    
    case 'addTransaction':
      return <AddTransactionModal isOpen={true} onClose={closeModal} />;
    
    case 'ocrTransaction':
      return <OCRTransactionModal isOpen={true} onClose={closeModal} />;

    case 'addRecurringTransaction':
      return <AddRecurringModal closeModal={closeModal} />;
    
    default:
      return null;
  }
};

export default ModalContainer;