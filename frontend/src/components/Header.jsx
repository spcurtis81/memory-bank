import React, { useState } from 'react';
import styled from 'styled-components';
import { FaBars, FaSearch, FaTh, FaList, FaPlus } from 'react-icons/fa';
import AddBookmarkModal from './AddBookmarkModal';

const Header = ({ toggleSidebar, viewMode, toggleViewMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic
    console.log('Searching for:', searchQuery);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={toggleSidebar}>
          <FaBars />
        </MenuButton>
        <AppTitle>Memory Bank</AppTitle>
      </LeftSection>

      <SearchForm onSubmit={handleSearch}>
        <SearchIcon>
          <FaSearch />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="Search bookmarks and tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchForm>

      <RightSection>
        <IconButton onClick={toggleViewMode} title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}>
          {viewMode === 'grid' ? <FaList /> : <FaTh />}
        </IconButton>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          <span>Add URL</span>
        </AddButton>
      </RightSection>

      {showAddModal && (
        <AddBookmarkModal onClose={() => setShowAddModal(false)} />
      )}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  justify-content: space-between;
  height: 60px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  
  @media (min-width: 1024px) {
    display: none;
  }
`;

const AppTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
  
  @media (max-width: 640px) {
    display: none;
  }
`;

const SearchForm = styled.form`
  flex: 1;
  max-width: 600px;
  display: flex;
  align-items: center;
  background-color: var(--color-background);
  border-radius: var(--border-radius-md);
  padding: 0 var(--spacing-sm);
  margin: 0 var(--spacing-md);
  
  @media (max-width: 640px) {
    margin: 0 var(--spacing-sm);
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-text-light);
  font-size: 0.9rem;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: none;
  padding: var(--spacing-sm);
  outline: none;
  font-size: 0.9rem;
  color: var(--color-text);
  
  &::placeholder {
    color: var(--color-text-light);
    opacity: 0.7;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  margin-right: var(--spacing-sm);
  
  &:hover {
    background-color: var(--color-background);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
  
  svg {
    margin-right: var(--spacing-sm);
  }
  
  @media (max-width: 640px) {
    span {
      display: none;
    }
    
    svg {
      margin-right: 0;
    }
    
    padding: var(--spacing-sm);
  }
`;

export default Header; 