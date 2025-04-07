import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { useMutation, useQueryClient } from 'react-query';
import { addBookmark } from '../services/api';

const AddBookmarkModal = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const queryClient = useQueryClient();
  
  const addBookmarkMutation = useMutation(addBookmark, {
    onSuccess: () => {
      queryClient.invalidateQueries('bookmarks');
      onClose();
    }
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url) return;
    
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    addBookmarkMutation.mutate({
      url,
      title: title || url,
      folder_id: folder || null,
      tags: tagArray
    });
  };

  const fetchUrlInfo = async () => {
    // This is a placeholder, actual implementation would use backend endpoint to fetch URL info
    if (!url) return;
    
    setIsFetching(true);
    try {
      // Simulate fetching URL info
      setTimeout(() => {
        // In real app, we'd parse this from the actual response
        setTitle(`Title for ${url}`);
        setIsFetching(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching URL info:', error);
      setIsFetching(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Add Bookmark</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="url">URL*</Label>
              <InputWrapper>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <FetchButton 
                  type="button" 
                  onClick={fetchUrlInfo}
                  disabled={!url || isFetching}
                >
                  {isFetching ? 'Fetching...' : 'Fetch'}
                </FetchButton>
              </InputWrapper>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="folder">Folder</Label>
              <Select
                id="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">None</option>
                {/* Folder options would be populated from the API */}
                <option value="1">Example Folder</option>
              </Select>
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
              <CancelButton type="button" onClick={onClose}>
                Cancel
              </CancelButton>
              <SubmitButton 
                type="submit" 
                disabled={!url || addBookmarkMutation.isLoading}
              >
                {addBookmarkMutation.isLoading ? 'Saving...' : 'Save'}
              </SubmitButton>
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

const InputWrapper = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const FetchButton = styled.button`
  background-color: var(--color-secondary);
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
  
  &:hover {
    background-color: var(--color-background);
  }
`;

const SubmitButton = styled(Button)`
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

export default AddBookmarkModal; 