// src/pages/Quizzes/QuizResultPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, XCircle, RotateCcw, Share2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizService';

const QuizResultPage = () => {
  const { quizId } = useParams(); // This gets the quizId from URL
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (location.state) {
      setResults(location.state);
      fetchQuizDetails();
    } else {
      fetchQuizResults();
    }
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const response = await quizService.getQuizById(quizId);
      const quizData = response.data?.data || response.data;
      setQuiz(quizData);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const response = await quizService.getQuizResults(quizId);
      setResults(response.data);
      fetchQuizDetails();
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
      setLoading(false);
    }
  };

  const handleRetake = () => {
    navigate(`/quizzes/${quizId}`); // ✅ Fixed: matches your route
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Rest of your results display logic...
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h2 className="font-semibold text-gray-900">{quiz?.title}</h2>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Your results content here */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <Award className="w-20 h-20 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {results?.score}/{results?.total}
          </h1>
          <p className="text-gray-600 mb-6">Your Score</p>
          
          <button
            onClick={handleRetake}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;