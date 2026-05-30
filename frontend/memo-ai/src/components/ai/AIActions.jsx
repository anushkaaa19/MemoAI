import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, BookOpen, Lightbulb, FileText, X } from "lucide-react";
import aiService from "../../services/aiService";
import toast from "react-hot-toast";
import MarkdownRenderer from "../common/MarkdownRenderer";

const AIActions = () => {
  const { id: documentId } = useParams();
  const [loadingAction, setLoadingAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [concept, setConcept] = useState("");

  const handleGenerateSummary = async () => {
    setLoadingAction("summary");
    try {
      const response = await aiService.generateSummary(documentId);
      const summary = response.data?.summary || response.summary;
      setModalTitle("Generated Summary");
      setModalContent(summary);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to generate summary.");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateFlashcards = async () => {
    setLoadingAction("flashcards");
    try {
      const response = await aiService.generateFlashcards(documentId);
      const flashcards = response.data?.flashcards || response.flashcards;
      setModalTitle("Generated Flashcards");
      setModalContent(JSON.stringify(flashcards, null, 2));
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to generate flashcards.");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExplainConcept = async (e) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error("Please enter a concept to explain.");
      return;
    }
    setLoadingAction("explain");
    try {
      const response = await aiService.explainConcept(documentId, concept);
      const explanation = response.data?.explanation || response.explanation;
      setModalTitle(`Explanation of "${concept}"`);
      setModalContent(explanation);
      setIsModalOpen(true);
      setConcept("");
    } catch (error) {
      toast.error("Failed to explain concept.");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">Powered by advanced AI</p>
          </div>
        </div>

        {/* Generate Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Generate Summary</h4>
                <p className="text-sm text-gray-500">
                  Get a concise summary of the entire document.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={loadingAction === "summary"}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === "summary" ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "Summarize"
              )}
            </button>
          </div>
        </div>

        {/* Generate Flashcards Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Generate Flashcards</h4>
                <p className="text-sm text-gray-500">
                  Create flashcards from key concepts in the document.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateFlashcards}
              disabled={loadingAction === "flashcards"}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === "flashcards" ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>

        {/* Explain Concept Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Explain Concept</h4>
              <p className="text-sm text-gray-500">
                Ask AI to explain a specific concept from the document.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleExplainConcept} className="flex gap-2">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., Virtual DOM, React Hooks, State Management..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              disabled={loadingAction === "explain"}
            />
            <button
              type="submit"
              disabled={loadingAction === "explain" || !concept.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === "explain" ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Explaining...
                </span>
              ) : (
                "Explain"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={2} />
                <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <MarkdownRenderer content={modalContent} />
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIActions;