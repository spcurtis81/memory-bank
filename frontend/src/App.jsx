import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';

// Layout components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import FolderPage from './pages/FolderPage';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <AppContainer>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MainContent>
        <Header 
          toggleSidebar={toggleSidebar} 
          viewMode={viewMode} 
          toggleViewMode={toggleViewMode} 
        />
        <ContentArea>
          <Routes>
            <Route path="/" element={<HomePage viewMode={viewMode} />} />
            <Route path="/folder/:folderId" element={<FolderPage viewMode={viewMode} />} />
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