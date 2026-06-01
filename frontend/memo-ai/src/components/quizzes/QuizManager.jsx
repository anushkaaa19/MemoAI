// src/components/quizzes/QuizManager.jsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Brain, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';

import quizService from '../../services/quizService';
import aiService from '../../services/aiService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import QuizCard from './QuizCard';

const QuizManager = ({ documentId, documentTitle }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuizToDelete, setSelectedQuizToDelete] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await quizService.getQuizzesForDocument(documentId);
      console.log("Fetched quizzes:", response);
      
      let quizzesData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        quizzesData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        quizzesData = response.data;
      } else if (Array.isArray(response)) {
        quizzesData = response;
      }
      
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      if (error?.statusCode !== 404) {
        toast.error('Failed to fetch quizzes.');
      }
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchQuizzes();
    }
  }, [documentId]);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const docName = documentTitle || 'Quiz';
      const formattedDate = moment().format('MMM DD, YYYY');
      const quizTitle = `${docName} - ${formattedDate}`;
      
      await aiService.generateQuiz(documentId, { 
        numQuestions,
        title: quizTitle 
      });
      
      toast.success('Quiz generated successfully!');
      setIsGenerateModalOpen(false);
      setNumQuestions(5);
      await fetchQuizzes();
    } catch (error) {
      console.error('Generate quiz error:', error);
      toast.error(error.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteRequest = (quiz) => {
    setSelectedQuizToDelete(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuizToDelete) return;
    setDeleting(true);
    try {
      await quizService.deleteQuiz(selectedQuizToDelete._id);
      toast.success('Quiz deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedQuizToDelete(null);
      await fetchQuizzes();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
        <Brain className="w-8 h-8 text-purple-600" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Quizzes Yet</h3>
      <p className="text-sm text-slate-500 mb-8 max-w-sm leading-relaxed">
        Generate a quiz from your document to test your knowledge.
      </p>
      <button
        onClick={() => setIsGenerateModalOpen(true)}
        className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        <span>Generate Quiz</span>
      </button>
    </div>
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex justify-end gap-2 mb-6">
          <Button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Plus size={16} className="mr-1" />
            Generate Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <QuizCard 
                key={quiz._id} 
                quiz={quiz} 
                onDelete={handleDeleteRequest} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate Quiz Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsGenerateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Generate Quiz</h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a quiz to test your knowledge
              </p>
            </div>

            <form onSubmit={handleGenerateQuiz}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose between 1-20 questions
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate Quiz"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Quiz</h2>
            </div>

            <p className="text-gray-600 text-center mb-4">
              Are you sure you want to delete "{selectedQuizToDelete?.title || 'this quiz'}"?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action cannot be undone. All progress for this quiz will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizManager;