import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { Toaster } from 'react-hot-toast';

// Layout components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import FolderPage from './pages/FolderPage';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <AppContainer>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success, #4caf50)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger, #e53935)',
              secondary: 'white',
            },
          },
        }}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MainContent>
        <Header 
          toggleSidebar={toggleSidebar} 
          viewMode={viewMode} 
          toggleViewMode={toggleViewMode}
          searchQuery={searchQuery}
          onSearch={handleSearch}
        />
        <ContentArea>
          <Routes>
            <Route path="/" element={<HomePage viewMode={viewMode} searchQuery={searchQuery} />} />
            <Route path="/folder/:folderId" element={<FolderPage viewMode={viewMode} searchQuery={searchQuery} />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
};

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
`;

export default App; 