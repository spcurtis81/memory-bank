import React from 'react';
import styled from 'styled-components';
import { FaGlobe, FaEllipsisH, FaTrash, FaEdit, FaFolder } from 'react-icons/fa';
import { useQueryClient, useMutation } from 'react-query';
import { deleteBookmark } from '../services/api';

const BookmarkList = ({ bookmarks }) => {
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
    <ListContainer>
      {bookmarks.map(bookmark => (
        <ListItem key={bookmark.id}>
          <IconWrapper>
            <FaGlobe />
          </IconWrapper>
          
          <ContentWrapper>
            <TitleRow>
              <Title title={bookmark.title}>{bookmark.title}</Title>
              <UrlText>{formatUrl(bookmark.url)}</UrlText>
            </TitleRow>
            
            {bookmark.tags && bookmark.tags.length > 0 && (
              <TagsRow>
                {bookmark.tags.map(tag => (
                  <Tag key={tag.id}>{tag.name}</Tag>
                ))}
              </TagsRow>
            )}
          </ContentWrapper>
          
          <Actions>
            <ActionLink href={bookmark.url} target="_blank" rel="noopener noreferrer">
              Visit
            </ActionLink>
            
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
          </Actions>
        </ListItem>
      ))}
    </ListContainer>
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

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-card);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  color: var(--color-primary);
  flex-shrink: 0;
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UrlText = styled.span`
  font-size: 0.85rem;
  color: var(--color-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
`;

const Tag = styled.span`
  background-color: var(--color-background);
  color: var(--color-text-light);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-md);
`;

const ActionLink = styled.a`
  color: var(--color-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  
  &:hover {
    text-decoration: underline;
  }
  
  @media (max-width: 640px) {
    display: none;
  }
`;

const ActionsDropdown = styled.div`
  position: relative;
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

export default BookmarkList; 