import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { fetchBookmarks } from '../services/api';
import BookmarkGrid from '../components/BookmarkGrid';
import BookmarkList from '../components/BookmarkList';

const FolderPage = ({ viewMode }) => {
  const { folderId } = useParams();
  
  const { 
    data: bookmarks = [], 
    isLoading,
    error 
  } = useQuery(
    ['bookmarks', folderId], 
    () => fetchBookmarks(folderId)
  );
  
  const { data: folderInfo } = useQuery(
    ['folder', folderId], 
    () => ({ name: 'Folder Name' }) // This would be replaced with an actual API call
  );

  if (isLoading) {
    return <LoadingMessage>Loading bookmarks...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>Error loading bookmarks: {error.message}</ErrorMessage>;
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState>
        <EmptyTitle>No bookmarks in this folder</EmptyTitle>
        <EmptyText>Add bookmarks to this folder by clicking the "Add URL" button</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      <PageTitle>{folderInfo?.name || 'Loading folder...'}</PageTitle>
      
      {viewMode === 'grid' ? (
        <BookmarkGrid bookmarks={bookmarks} />
      ) : (
        <BookmarkList bookmarks={bookmarks} />
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
`;

const LoadingMessage = styled.div`
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-light);
`;

const ErrorMessage = styled.div`
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-danger);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  background-color: var(--color-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  margin: var(--spacing-xl) auto;
  max-width: 600px;
`;

const EmptyTitle = styled.h2`
  font-size: 1.3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
`;

const EmptyText = styled.p`
  color: var(--color-text-light);
  text-align: center;
  margin-bottom: var(--spacing-md);
`;

export default FolderPage; 