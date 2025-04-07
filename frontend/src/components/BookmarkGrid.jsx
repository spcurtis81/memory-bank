import React from 'react';
import styled from 'styled-components';
import { FaGlobe, FaEllipsisH, FaTrash, FaEdit, FaFolder } from 'react-icons/fa';
import { useQueryClient, useMutation } from 'react-query';
import { deleteBookmark } from '../services/api';

const BookmarkGrid = ({ bookmarks }) => {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation(deleteBookmark, {
    onSuccess: () => {
      queryClient.invalidateQueries('bookmarks');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <GridContainer>
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id}>
          <CardHeader>
            <FaviconWrapper>
              <FaGlobe />
            </FaviconWrapper>
            <CardTitle title={bookmark.title}>{bookmark.title}</CardTitle>
            <ActionsDropdown>
              <DropdownButton>
                <FaEllipsisH />
              </DropdownButton>
              <DropdownContent>
                <DropdownItem>
                  <FaEdit />
                  <span>Edit</span>
                </DropdownItem>
                <DropdownItem>
                  <FaFolder />
                  <span>Move</span>
                </DropdownItem>
                <DropdownItem onClick={() => handleDelete(bookmark.id)}>
                  <FaTrash />
                  <span>Delete</span>
                </DropdownItem>
              </DropdownContent>
            </ActionsDropdown>
          </CardHeader>
          
          <CardUrl href={bookmark.url} target="_blank" rel="noopener noreferrer">
            {formatUrl(bookmark.url)}
          </CardUrl>
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <TagsContainer>
              {bookmark.tags.map(tag => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
            </TagsContainer>
          )}
        </BookmarkCard>
      ))}
    </GridContainer>
  );
};

// Helper function to format URLs for display
const formatUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BookmarkCard = styled.div`
  background-color: var(--color-card);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  position: relative;
`;

const FaviconWrapper = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-sm);
  color: var(--color-primary);
  flex-shrink: 0;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const CardUrl = styled.a`
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    color: var(--color-primary);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: auto;
`;

const Tag = styled.span`
  background-color: var(--color-background);
  color: var(--color-text-light);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
`;

const ActionsDropdown = styled.div`
  position: relative;
  margin-left: var(--spacing-sm);
`;

const DropdownButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  
  &:hover {
    color: var(--color-primary);
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  min-width: 150px;
  z-index: 10;
  display: none;
  
  ${ActionsDropdown}:hover & {
    display: block;
  }
`;

const DropdownItem = styled.button`
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  color: var(--color-text);
  cursor: pointer;
  
  &:hover {
    background-color: var(--color-background);
  }
  
  svg {
    margin-right: var(--spacing-sm);
    font-size: 0.8rem;
  }
`;

export default BookmarkGrid; 