import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { createReadingList, getBooks, getReadingLists, updateReadingList } from '@/services/api';
import type { Book, ReadingList } from '@/types';
import { formatDate } from '@/utils/formatters';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

/**
 * ReadingLists page component
 */
export function ReadingLists() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListDescription, setEditListDescription] = useState('');

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  useEffect(() => {
    loadLists();
  }, []);

  const targetList = useMemo(
    () => lists.find((l) => l.id === targetListId) ?? null,
    [lists, targetListId]
  );

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const data = await getReadingLists();
      setLists(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const newList = await createReadingList({
        name: newListName,
        description: newListDescription,
        bookIds: [],
      });
      setLists([...lists, newList]);
      setIsModalOpen(false);
      setNewListName('');
      setNewListDescription('');
      showSuccess('Reading list created successfully!');
    } catch (error) {
      handleApiError(error);
    }
  };

  const openEditModal = (list: ReadingList) => {
    setEditListId(list.id);
    setEditListName(list.name);
    setEditListDescription(list.description ?? '');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditListId(null);
    setEditListName('');
    setEditListDescription('');
  };

  const handleUpdateList = async () => {
    if (!editListId) return;
    if (!editListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const updated = await updateReadingList(editListId, {
        name: editListName.trim(),
        description: editListDescription,
      });
      setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showSuccess('Reading list updated successfully!');
      closeEditModal();
    } catch (error) {
      handleApiError(error);
    }
  };

  const loadBooks = async () => {
    setIsBooksLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsBooksLoading(false);
    }
  };

  const openAddBookModal = async (listId: string) => {
    setTargetListId(listId);
    setSelectedBookIds([]);
    setIsAddBookModalOpen(true);

    if (books.length === 0 && !isBooksLoading) {
      await loadBooks();
    }
  };

  const closeAddBookModal = () => {
    setIsAddBookModalOpen(false);
    setTargetListId(null);
    setSelectedBookIds([]);
  };

  const handleAddBookToList = async () => {
    if (!targetList) {
      alert('Please choose a reading list');
      return;
    }
    if (selectedBookIds.length === 0) {
      alert('Please choose at least one book');
      return;
    }

    const existingIds = Array.isArray(targetList.bookIds) ? targetList.bookIds : [];
    const newIds = selectedBookIds.filter((id) => !existingIds.includes(id));
    if (newIds.length === 0) {
      alert('All selected books are already in this list');
      return;
    }

    try {
      const updated = await updateReadingList(targetList.id, {
        bookIds: [...existingIds, ...newIds],
      });

      setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showSuccess('Book added to reading list!');
      closeAddBookModal();
    } catch (error) {
      handleApiError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">My Reading Lists</h1>
            <p className="text-slate-600 text-lg">Organize your books into custom lists</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
            Create New List
          </Button>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reading lists yet</h3>
            <p className="text-slate-600 mb-4">
              Create your first list to start organizing your books
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">{list.name}</h3>
                <p className="text-slate-600 mb-4 line-clamp-2">{list.description}</p>
                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <span>{list.bookIds.length} books</span>
                  <span>Created {formatDate(list.createdAt)}</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => openAddBookModal(list.id)} className="flex-1">
                    Add Book
                  </Button>
                  <Button variant="secondary" onClick={() => openEditModal(list)} className="flex-1">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Reading List"
        >
          <div>
            <Input
              label="List Name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Summer Reading 2024"
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="What's this list about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreateList} className="flex-1">
                Create List
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Reading List">
          <div>
            <Input
              label="List Name"
              type="text"
              value={editListName}
              onChange={(e) => setEditListName(e.target.value)}
              placeholder="e.g., Summer Reading 2024"
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={editListDescription}
                onChange={(e) => setEditListDescription(e.target.value)}
                placeholder="What's this list about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleUpdateList} className="flex-1" disabled={!editListId}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={closeEditModal} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isAddBookModalOpen}
          onClose={closeAddBookModal}
          title={targetList ? `Add Book to "${targetList.name}"` : 'Add Book to Reading List'}
        >
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Book</label>
              <select
                multiple
                value={selectedBookIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setSelectedBookIds(values);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[220px]"
                disabled={isBooksLoading}
              >
                {books.length === 0 ? (
                  <option value="" disabled>
                    {isBooksLoading ? 'Loading books…' : 'No books available'}
                  </option>
                ) : (
                  books.map((book) => {
                    const isAlreadyInList = (targetList?.bookIds ?? []).includes(book.id);
                    return (
                      <option key={book.id} value={book.id} disabled={isAlreadyInList}>
                        {book.title} — {book.author}
                        {isAlreadyInList ? ' (already in list)' : ''}
                      </option>
                    );
                  })
                )}
              </select>
              <p className="mt-2 text-sm text-slate-500">
                Tip: Hold <span className="font-medium">⌘</span> (Mac) or <span className="font-medium">Ctrl</span>{' '}
                (Windows) to select multiple books.
              </p>
              {targetList ? (
                <p className="mt-2 text-sm text-slate-600">
                  Selected: <span className="font-medium">{selectedBookIds.length}</span> (new:{' '}
                  <span className="font-medium">
                    {selectedBookIds.filter((id) => !(targetList?.bookIds ?? []).includes(id)).length}
                  </span>
                  )
                </p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleAddBookToList}
                className="flex-1"
                disabled={
                  !targetList ||
                  selectedBookIds.length === 0 ||
                  selectedBookIds.every((id) => (targetList?.bookIds ?? []).includes(id))
                }
              >
                Add Books
              </Button>
              <Button variant="secondary" onClick={closeAddBookModal} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
