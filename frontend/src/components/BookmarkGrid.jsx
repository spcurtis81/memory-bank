import React, { useState } from 'react';
import styled from 'styled-components';
import { FaGlobe, FaEllipsisH, FaTrash, FaEdit, FaFolder, FaExternalLinkAlt, FaLink } from 'react-icons/fa';
import { useQueryClient, useMutation } from 'react-query';
import { deleteBookmark } from '../services/api';
import { formatUrl } from '../utils/formatters';
import EditBookmarkModal from './EditBookmarkModal';
import MoveBookmarkModal from './MoveBookmarkModal';
import { toast } from 'react-hot-toast';

const BookmarkGrid = ({ bookmarks }) => {
  const queryClient = useQueryClient();
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [movingBookmark, setMovingBookmark] = useState(null);
  
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

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark);
  };

  const handleMove = (bookmark) => {
    setMovingBookmark(bookmark);
  };

  const handleMoveComplete = () => {
    setMovingBookmark(null);
    toast.success('Bookmark moved successfully!');
  };
  
  const handleEditComplete = () => {
    setEditingBookmark(null);
    toast.success('Bookmark updated successfully!');
  };

  return (
    <GridContainer>
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id}>
          <CardContent>
            <CardLink href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.image ? (
                <CardImageContainer>
                  <CardImage src={bookmark.image} alt={bookmark.title} />
                </CardImageContainer>
              ) : (
                <NoImageContainer>
                  <FaLink />
                </NoImageContainer>
              )}
              
              <CardInfo>
                <CardMeta>
                  <SiteInfo>
                    {bookmark.favicon ? (
                      <Favicon src={bookmark.favicon} alt="site icon" />
                    ) : (
                      <FaviconPlaceholder>
                        <FaGlobe />
                      </FaviconPlaceholder>
                    )}
                    <SiteUrl>{formatUrl(bookmark.url)}</SiteUrl>
                  </SiteInfo>
                </CardMeta>
                
                <CardTitle title={bookmark.title}>{bookmark.title}</CardTitle>
              </CardInfo>
            </CardLink>
            
            <ActionsDropdown onClick={(e) => e.stopPropagation()}>
              <DropdownButton>
                <FaEllipsisH />
              </DropdownButton>
              <DropdownContent>
                <DropdownItem onClick={() => handleEdit(bookmark)}>
                  <FaEdit />
                  <span>Edit</span>
                </DropdownItem>
                <DropdownItem onClick={() => handleMove(bookmark)}>
                  <FaFolder />
                  <span>Move</span>
                </DropdownItem>
                <DropdownItem onClick={() => handleDelete(bookmark.id)}>
                  <FaTrash />
                  <span>Delete</span>
                </DropdownItem>
              </DropdownContent>
            </ActionsDropdown>
          </CardContent>
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <TagsContainer>
              {bookmark.tags.map(tag => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
            </TagsContainer>
          )}
        </BookmarkCard>
      ))}
      
      {editingBookmark && (
        <EditBookmarkModal 
          bookmark={editingBookmark} 
          onClose={() => setEditingBookmark(null)}
          onSuccess={handleEditComplete}
        />
      )}
      
      {movingBookmark && (
        <MoveBookmarkModal 
          bookmark={movingBookmark} 
          onClose={() => setMovingBookmark(null)}
          onSuccess={handleMoveComplete}
        />
      )}
    </GridContainer>
  );
};

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BookmarkCard = styled.div`
  background-color: var(--color-card);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
`;

const CardContent = styled.div`
  position: relative;
`;

const CardLink = styled.a`
  color: inherit;
  text-decoration: none;
  display: block;
  
  &:hover {
    text-decoration: none;
  }
`;

const CardImageContainer = styled.div`
  width: 100%;
  position: relative;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: var(--color-background);
  overflow: hidden;
`;

const CardImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardLink}:hover & {
    transform: scale(1.05);
  }
`;

const NoImageContainer = styled.div`
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  position: relative;
  
  svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    opacity: 0.5;
  }
`;

const CardInfo = styled.div`
  padding: var(--spacing-md);
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
`;

const SiteInfo = styled.div`
  display: flex;
  align-items: center;
`;

const Favicon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: var(--spacing-xs);
  border-radius: 3px;
`;

const FaviconPlaceholder = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-xs);
  color: var(--color-text-light);
  font-size: 0.8rem;
`;

const SiteUrl = styled.span`
  font-size: 0.75rem;
  color: var(--color-text-light);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-md) var(--spacing-md);
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
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 5;
`;

const DropdownButton = styled.button`
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: white;
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