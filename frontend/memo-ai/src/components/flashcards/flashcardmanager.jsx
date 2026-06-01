// src/components/documents/FlashcardManager.jsx
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Sparkles,
  Brain,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId, onBack }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(documentId);
      console.log("Full Response:", response);

      let flashcards = [];
      
      // Handle backend response structure
      if (response?.data && Array.isArray(response.data)) {
        flashcards = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        flashcards = response.data.data;
      } else if (Array.isArray(response)) {
        flashcards = response;
      } else if (response?.data?.flashcards && Array.isArray(response.data.flashcards)) {
        flashcards = response.data.flashcards;
      }
      
      console.log("Parsed flashcards:", flashcards.length, "sets");
      setFlashcardSets(flashcards);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch flashcard sets");
      setFlashcardSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchFlashcardSets();
    }
  }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      await fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async () => {
    const currentCard = selectedSet?.cards[currentCardIndex];
    if (!currentCard) return;

    try {
      await flashcardService.reviewFlashcard(currentCard._id);
    } catch (error) {
      console.error("Failed to review flashcard:", error);
    }
  };

  const handleNextCard = () => {
    if (selectedSet && selectedSet.cards) {
      handleReview();
      setCurrentCardIndex(
        (prevIndex) => (prevIndex + 1) % selectedSet.cards.length
      );
    }
  };

  const handlePrevCard = () => {
    if (selectedSet && selectedSet.cards) {
      handleReview();
      setCurrentCardIndex(
        (prevIndex) =>
          (prevIndex - 1 + selectedSet.cards.length) % selectedSet.cards.length
      );
    }
  };

  const handleToggleStar = async (cardId) => {
    console.log("Toggling star for card:", cardId);
    try {
      const result = await flashcardService.toggleStar(cardId);
      console.log("Star toggle response:", result);
      
      // Refresh the flashcard sets
      await fetchFlashcardSets();
      
      // Update the selected set with fresh data
      if (selectedSet) {
        const updatedSet = flashcardSets.find(s => s._id === selectedSet._id);
        if (updatedSet) {
          setSelectedSet(updatedSet);
          const updatedCard = updatedSet.cards.find(c => c._id === cardId);
          console.log("Updated card star status:", updatedCard?.isStarred);
        }
      }
      
      toast.success(result.message || "Star status updated!");
    } catch (error) {
      console.error("Star toggle error:", error);
      toast.error("Failed to update star status");
    }
  };

  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();
    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(setToDelete._id);
      toast.success("Flashcard set deleted successfully!");
      setIsDeleteModalOpen(false);
      setSetToDelete(null);
      if (selectedSet?._id === setToDelete._id) {
        setSelectedSet(null);
      }
      await fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    setCurrentCardIndex(0);
  };

  const renderFlashcardViewer = () => {
    if (!selectedSet || !selectedSet.cards || selectedSet.cards.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No flashcards in this set</p>
        </div>
      );
    }

    const currentCard = selectedSet.cards[currentCardIndex];

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToSets}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sets
          </button>
          <div className="text-sm text-gray-500">
            Card {currentCardIndex + 1} of {selectedSet.cards.length}
          </div>
        </div>

        {/* Flashcard */}
        // In FlashcardManager.jsx, update the renderFlashcardViewer
<Flashcard
  flashcard={{
    ...currentCard,
    reviewCount: currentCard.reviewCount || 0,
    lastReviewed: currentCard.lastReviewed,
    isStarred: currentCard.isStarred || false
  }}
  onToggleStar={handleToggleStar}
  onNext={handleNextCard}
  onPrevious={handlePrevCard}
  currentIndex={currentCardIndex}
  totalCards={selectedSet.cards.length}
  showNavigation={true}
/>

        {/* Simple navigation buttons if needed (Flashcard component already has them) */}
        <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
          <button
            onClick={handlePrevCard}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <span className="text-sm text-gray-500">Flip card to see answer</span>
          <button
            onClick={handleNextCard}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  };

  const renderSetList = () => {
    if (!flashcardSets || flashcardSets.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flashcards Yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Generate flashcards from your document using AI
          </p>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            {generating ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Header with generate button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Flashcard Sets</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select a set to start reviewing
            </p>
          </div>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-sm"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            {generating ? "Generating..." : "Generate New"}
          </button>
        </div>

        {/* Flashcard sets grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcardSets.map((set, idx) => (
            <div
              key={set._id || set.id || idx}
              onClick={() => handleSelectSet(set)}
              className="group relative bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg hover:border-purple-200 transition-all"
            >
              <button
                onClick={(e) => handleDeleteRequest(e, set)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1 pr-8">
                    {set.title || `Set ${idx + 1}`}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {set.cards?.length || 0} cards
                  </p>
                  <p className="text-xs text-gray-400">
                    Created {set.createdAt ? moment(set.createdAt).fromNow() : "recently"}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Ready to review</span>
                  <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
            </div>
            <p className="text-gray-500 ml-13">
              Review and manage your flashcard sets
            </p>
          </div>

          {/* Main content */}
          {selectedSet ? renderFlashcardViewer() : renderSetList()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Flashcard Set</h2>
            </div>

            <p className="text-gray-600 text-center mb-4">
              Are you sure you want to delete "{setToDelete?.title || `Set`}"?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action cannot be undone. All flashcards in this set will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlashcardManager;