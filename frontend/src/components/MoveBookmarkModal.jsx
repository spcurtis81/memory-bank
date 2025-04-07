import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaFolder, FaPlus } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchFolders, updateBookmark, addFolder } from '../services/api';
import { toast } from 'react-hot-toast';

const MoveBookmarkModal = ({ bookmark, onClose, onSuccess }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(bookmark.folder_id || '');
  const [isMoving, setIsMoving] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const queryClient = useQueryClient();
  
  // Force refetch of folders when component mounts
  const { data: folders = [], isLoading: isFoldersLoading, refetch: refetchFolders } = useQuery(
    'folders', 
    fetchFolders,
    { 
      refetchOnMount: true,
      staleTime: 0
    }
  );
  
  // Log folders data for debugging
  useEffect(() => {
    console.log('Available folders in MoveBookmarkModal:', folders);
  }, [folders]);
  
  const moveBookmarkMutation = useMutation(
    (data) => updateBookmark(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookmarks');
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    }
  );

  const addFolderMutation = useMutation(addFolder, {
    onSuccess: async (newFolder) => {
      toast.success(`Folder "${newFolder.name}" created!`);
      await queryClient.invalidateQueries('folders');
      await refetchFolders();
      setSelectedFolderId(newFolder.id.toString());
      setIsAddingFolder(false);
      setNewFolderName('');
    },
    onError: (error) => {
      toast.error('Failed to create folder');
      console.error('Error creating folder:', error);
    }
  });
  
  const handleMove = async () => {
    setIsMoving(true);
    try {
      await moveBookmarkMutation.mutateAsync({
        id: bookmark.id,
        folder_id: selectedFolderId === '' ? null : selectedFolderId
      });
    } catch (error) {
      console.error('Error moving bookmark:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    addFolderMutation.mutate({ name: newFolderName.trim() });
  };

  const handleFolderChange = (e) => {
    const value = e.target.value;
    if (value === 'add-new') {
      setIsAddingFolder(true);
    } else {
      setSelectedFolderId(value);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Move Bookmark</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <BookmarkTitle>{bookmark.title}</BookmarkTitle>
          
          <FormGroup>
            <Label htmlFor="folder">Select Folder</Label>
            {isAddingFolder ? (
              <div>
                <InputWrapper>
                  <Input
                    type="text"
                    placeholder="New folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <FolderButton 
                    type="button" 
                    onClick={handleAddFolder}
                    disabled={addFolderMutation.isLoading || !newFolderName.trim()}
                  >
                    {addFolderMutation.isLoading ? 'Adding...' : 'Add'}
                  </FolderButton>
                </InputWrapper>
                <LinkButton
                  type="button"
                  onClick={() => {
                    setIsAddingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </LinkButton>
              </div>
            ) : isFoldersLoading ? (
              <LoadingText>Loading folders...</LoadingText>
            ) : (
              <Select 
                id="folder" 
                value={selectedFolderId} 
                onChange={handleFolderChange}
              >
                <option value="">No Folder (Root)</option>
                <option value="add-new" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  + Add New Folder
                </option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            )}
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose} disabled={isMoving}>
              Cancel
            </CancelButton>
            <MoveButton 
              type="button" 
              onClick={handleMove} 
              disabled={isMoving || selectedFolderId === bookmark.folder_id}
            >
              {isMoving ? 'Moving...' : 'Move'}
            </MoveButton>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--color-card);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-text);
  
  &:hover {
    color: var(--color-primary);
  }
`;

const ModalBody = styled.div`
  padding: var(--spacing-md);
`;

const BookmarkTitle = styled.h4`
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-weight: 500;
  word-break: break-word;
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
`;

const LoadingText = styled.p`
  margin: var(--spacing-sm) 0;
  color: var(--color-text-light);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
`;

const Button = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  
  &:hover:not(:disabled) {
    background-color: var(--color-background);
  }
`;

const MoveButton = styled(Button)`
  background-color: var(--color-primary);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
`;

const FolderButton = styled.button`
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 500;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }
  
  &:disabled {
    background-color: var(--color-border);
    color: var(--color-text-light);
    cursor: not-allowed;
  }
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: var(--color-primary);
  padding: 0;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: var(--color-primary-dark);
  }
`;

export default MoveBookmarkModal; 