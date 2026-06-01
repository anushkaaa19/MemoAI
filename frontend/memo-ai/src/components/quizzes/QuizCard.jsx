// src/components/quizzes/QuizCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Award, BarChart2, Play, Clock, Brain } from 'lucide-react';
import moment from 'moment';

const QuizCard = ({ quiz, onDelete }) => {
  const hasAttempted = quiz.score !== undefined && quiz.score > 0;
  const totalQuestions = quiz.totalQuestions || quiz.questions?.length || 0;
  
  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all overflow-hidden">
      <div className="p-5">
        {/* Header with Delete Button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate pr-8">
                {quiz.title || `Quiz - ${moment(quiz.createdAt).format("MMM D, YYYY")}`}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created {moment(quiz.createdAt).format("MMM D, YYYY")}
                </span>
                <span className="text-xs text-gray-500">
                  {totalQuestions} questions
                </span>
              </div>
            </div>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(quiz);
            }}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Score Badge (if attempted) */}
        {hasAttempted && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
              <span className="text-sm text-gray-600">Score:</span>
              <div className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                {quiz.score}/{totalQuestions}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 pt-2 flex items-center gap-3">
          {hasAttempted ? (
            <>
              {/* View Results Button - Matches your route */}
              <Link 
                to={`/quizzes/${quiz._id}/results`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <BarChart2 className="w-4 h-4" strokeWidth={2} />
                View Results
              </Link>
              
              {/* Retake Quiz Button - Using quizzes route */}
              <Link 
                to={`/quizzes/${quiz._id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all"
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                Retake Quiz
              </Link>
            </>
          ) : (
            /* Start Quiz Button - Using quizzes route */
            <Link 
              to={`/quizzes/${quiz._id}`}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Play className="w-4 h-4" strokeWidth={2} />
              Start Quiz
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;