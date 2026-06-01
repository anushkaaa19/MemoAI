// src/pages/Quizzes/QuizTakePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizService';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await quizService.getQuizById(quizId);
      const quizData = response.data?.data || response.data;
      setQuiz(quizData);
      setAnswers(new Array(quizData.questions?.length || 0).fill(null));
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestion] === null) {
      toast.error('Please select an answer');
      return;
    }
    
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = answers.some(a => a === null);
    if (unanswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const response = await quizService.submitQuiz(quizId, answers);
      toast.success('Quiz submitted successfully!');
      
      // ✅ FIXED: Navigate to correct results URL matching your routes
      navigate(`/quizzes/${quizId}/results`, {
        state: { 
          score: response.data.score,
          total: quiz.questions.length,
          answers: answers,
          questions: quiz.questions
        }
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Exit Quiz</span>
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-gray-900">{quiz.title}</h2>
              <p className="text-sm text-gray-500">{quiz.questions.length} questions</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium mb-4">
              Question {currentQuestion + 1}
            </span>
            <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  answers[currentQuestion] === idx
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                }`}
              >
                <input
                  type="radio"
                  name="question"
                  checked={answers[currentQuestion] === idx}
                  onChange={() => handleAnswer(idx)}
                  className="w-5 h-5 text-purple-600"
                />
                <span className="text-gray-700 text-lg">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 inline mr-1" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={answers[currentQuestion] === null}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === quiz.questions.length - 1 ? (
              submitting ? 'Submitting...' : 'Submit Quiz'
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 inline ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                idx === currentQuestion
                  ? 'bg-purple-600 text-white'
                  : answers[idx] !== null
                  ? 'bg-green-100 text-green-600 border border-green-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizTakePage;