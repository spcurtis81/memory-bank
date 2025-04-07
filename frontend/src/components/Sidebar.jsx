import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown, FaPlus, FaTimes, FaTrash, FaPen } from 'react-icons/fa';
import { fetchFolders, addFolder, deleteFolder } from '../services/api';
import { toast } from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const queryClient = useQueryClient();
  const { data: folders = [], isLoading, refetch } = useQuery('folders', fetchFolders, {
    onSuccess: (data) => {
      console.log('Query success - folders data:', data);
    },
    onError: (error) => {
      console.error('Query error fetching folders:', error);
    }
  });

  const deleteFolderMutation = useMutation(deleteFolder, {
    onSuccess: () => {
      queryClient.invalidateQueries('folders');
      queryClient.invalidateQueries('bookmarks');
      toast.success('Folder deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  });

  // Log folders data when it changes
  useEffect(() => {
    console.log('Folders data updated:', folders);
  }, [folders]);

  const toggleFolder = (folderId) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId]
    });
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsAddingFolder(true);
    try {
      await addFolder({ 
        name: newFolderName.trim(),
        parent_id: selectedParentId 
      });
      
      // Invalidate the folders query to refetch the data
      queryClient.invalidateQueries('folders');
      
      // Also explicitly refetch
      await refetch();
      
      // Reset the form
      setShowNewFolderInput(false);
      setNewFolderName('');
      setSelectedParentId(null);
      
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Error adding folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsAddingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder? The bookmarks will be moved to root.')) {
      return;
    }
    
    deleteFolderMutation.mutate(folderId);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Recursive function to build the folder tree
  const renderFolders = (parentId = null) => {
    // Convert parentId to number or null for proper comparison
    const normalizedParentId = parentId === null ? null : Number(parentId);
    
    // Filter folders that have matching parent_id
    const childFolders = folders.filter(folder => {
      // Convert folder.parent_id to number or keep as null
      const folderParentId = folder.parent_id === null ? null : Number(folder.parent_id);
      return folderParentId === normalizedParentId;
    });
    
    if (childFolders.length === 0) return null;

    return (
      <FolderList>
        {childFolders.map(folder => {
          const isExpanded = expandedFolders[folder.id];
          const hasChildren = folders.some(f => f.parent_id === folder.id);
          const isActive = location.pathname === `/folder/${folder.id}`;
          
          return (
            <FolderItem key={folder.id}>
              <FolderRow>
                {hasChildren && (
                  <ExpandButton onClick={() => toggleFolder(folder.id)}>
                    {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                  </ExpandButton>
                )}
                
                <FolderLink 
                  to={`/folder/${folder.id}`} 
                  isActive={isActive}
                  onClick={(e) => editMode && e.preventDefault()}
                >
                  {isExpanded ? <FaFolderOpen /> : <FaFolder />}
                  <span>{folder.name}</span>
                </FolderLink>
                
                {editMode && (
                  <DeleteButton 
                    onClick={() => handleDeleteFolder(folder.id)}
                    aria-label="Delete folder"
                  >
                    <FaTrash />
                  </DeleteButton>
                )}
              </FolderRow>
              
              {isExpanded && renderFolders(folder.id)}
            </FolderItem>
          );
        })}
      </FolderList>
    );
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <SidebarHeader>
        <SidebarTitle>Folders</SidebarTitle>
        <HeaderActions>
          <EditButton 
            onClick={toggleEditMode}
            isActive={editMode}
            title={editMode ? "Exit edit mode" : "Edit folders"}
          >
            <FaPen />
          </EditButton>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </HeaderActions>
      </SidebarHeader>

      <SidebarContent>
        <AllItemsLink to="/" isActive={location.pathname === '/'}>
          <FaFolder />
          <span>All Bookmarks</span>
        </AllItemsLink>

        {isLoading ? (
          <LoadingMessage>Loading folders...</LoadingMessage>
        ) : (
          <>
            {renderFolders()}
            
            {showNewFolderInput ? (
              <NewFolderForm>
                <NewFolderInput
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <NewFolderActions>
                  <SaveButton 
                    onClick={handleAddFolder} 
                    disabled={isAddingFolder || !newFolderName.trim()}
                  >
                    {isAddingFolder ? 'Saving...' : 'Save'}
                  </SaveButton>
                  <CancelButton 
                    onClick={() => setShowNewFolderInput(false)}
                    disabled={isAddingFolder}
                  >
                    Cancel
                  </CancelButton>
                </NewFolderActions>
              </NewFolderForm>
            ) : (
              <AddFolderButton onClick={() => setShowNewFolderInput(true)}>
                <FaPlus />
                <span>New Folder</span>
              </AddFolderButton>
            )}
          </>
        )}
      </SidebarContent>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.aside`
  width: 250px;
  height: 100%;
  background-color: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  
  @media (max-width: 1023px) {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    transition: transform 0.3s ease;
    box-shadow: var(--shadow-lg);
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
`;

const SidebarTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-light);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (min-width: 1024px) {
    display: none;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
`;

const AllItemsLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
  font-weight: 600;
  background-color: ${props => props.isActive ? 'var(--color-background)' : 'transparent'};
  
  &:hover {
    background-color: var(--color-background);
    text-decoration: none;
  }
  
  svg {
    margin-right: var(--spacing-sm);
    color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-light)'};
  }
`;

const FolderList = styled.ul`
  list-style: none;
  padding-left: var(--spacing-md);
`;

const FolderItem = styled.li`
  margin: var(--spacing-xs) 0;
`;

const FolderRow = styled.div`
  display: flex;
  align-items: center;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-light);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
`;

const FolderLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  color: var(--color-text);
  flex: 1;
  background-color: ${props => props.isActive ? 'var(--color-background)' : 'transparent'};
  
  &:hover {
    background-color: var(--color-background);
    text-decoration: none;
  }
  
  svg {
    margin-right: var(--spacing-sm);
    color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-light)'};
  }
`;

const LoadingMessage = styled.div`
  padding: var(--spacing-md);
  color: var(--color-text-light);
  font-style: italic;
`;

const AddFolderButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  width: 100%;
  margin-top: var(--spacing-md);
  color: var(--color-text-light);
  
  &:hover {
    background-color: var(--color-background);
  }
  
  svg {
    margin-right: var(--spacing-sm);
    font-size: 0.8rem;
  }
`;

const NewFolderForm = styled.div`
  margin-top: var(--spacing-md);
`;

const NewFolderInput = styled.input`
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-sm);
`;

const NewFolderActions = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const SaveButton = styled.button`
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-light)'};
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    color: var(--color-primary);
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: var(--color-danger, #e53935);
  margin-left: auto;
  font-size: 0.9rem;
  padding: var(--spacing-xs);
  cursor: pointer;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

export default Sidebar; 