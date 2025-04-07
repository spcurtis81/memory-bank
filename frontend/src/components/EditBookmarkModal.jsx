import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { updateBookmark, fetchFolders, addFolder } from '../services/api';
import { toast } from 'react-hot-toast';

const EditBookmarkModal = ({ bookmark, onClose, onSuccess }) => {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [folderId, setFolderId] = useState(bookmark.folder_id || '');
  const [tags, setTags] = useState(bookmark.tags.map(tag => tag.name).join(', '));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: folders = [], isLoading: isFoldersLoading, refetch: refetchFolders } = useQuery(
    'folders', 
    fetchFolders,
    { 
      refetchOnMount: true,
      staleTime: 0
    }
  );
  
  useEffect(() => {
    console.log('Available folders in EditBookmarkModal:', folders);
  }, [folders]);
  
  const updateBookmarkMutation = useMutation(
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
      setFolderId(newFolder.id.toString());
      setIsAddingFolder(false);
      setNewFolderName('');
    },
    onError: (error) => {
      toast.error('Failed to create folder');
      console.error('Error creating folder:', error);
    }
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!url || !title) return;
    
    setIsUpdating(true);
    
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        title,
        url,
        folder_id: folderId === '' ? null : folderId,
        tags: tagArray
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
    } finally {
      setIsUpdating(false);
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
      setFolderId(value);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit Bookmark</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <Form onSubmit={handleUpdate}>
            <FormGroup>
              <Label htmlFor="url">URL*</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="title">Title*</Label>
              <Input
                id="title"
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="folder">Folder</Label>
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
                  value={folderId}
                  onChange={handleFolderChange}
                >
                  <option value="">None (Root)</option>
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
            
            <FormGroup>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                placeholder="tag1, tag2, tag3"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <HelpText>Separate tags with commas</HelpText>
            </FormGroup>
            
            <ButtonGroup>
              <CancelButton type="button" onClick={onClose} disabled={isUpdating}>
                Cancel
              </CancelButton>
              <SaveButton 
                type="submit" 
                disabled={isUpdating || !url || !title}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </SaveButton>
            </ButtonGroup>
          </Form>
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
  padding: var(--spacing-md);
`;

const ModalContent = styled.div`
  background-color: var(--color-card);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  color: var(--color-text-light);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBody = styled.div`
  padding: var(--spacing-md);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
`;

const Input = styled.input`
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const Select = styled.select`
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const HelpText = styled.small`
  color: var(--color-text-light);
  margin-top: var(--spacing-xs);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
`;

const Button = styled.button`
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-weight: 500;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  
  &:hover:not(:disabled) {
    background-color: var(--color-background);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: var(--color-primary);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }
  
  &:disabled {
    background-color: var(--color-border);
    color: var(--color-text-light);
    cursor: not-allowed;
  }
`;

const LoadingText = styled.p`
  color: var(--color-text-light);
  margin: var(--spacing-sm) 0;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const FolderButton = styled.button`
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 500;
  
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
  margin-top: var(--spacing-xs);
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: var(--color-primary-dark);
  }
`;

export default EditBookmarkModal;