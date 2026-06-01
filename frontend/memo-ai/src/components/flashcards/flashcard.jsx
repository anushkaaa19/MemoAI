// src/components/documents/Flashcard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, StarOff, RotateCw, ChevronLeft, ChevronRight, Volume2, Sparkles, CheckCircle, Clock } from 'lucide-react';

const Flashcard = ({ 
  flashcard, 
  onToggleStar, 
  onNext, 
  onPrevious,
  currentIndex,
  totalCards,
  showNavigation = false 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const speechButtonRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (!showNavigation) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        onPrevious?.();
      } else if (e.key === 'ArrowRight') {
        onNext?.();
      } else if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleStar(e);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNavigation, onPrevious, onNext]);

  const handleFlip = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isFlipped, isAnimating]);

  const handleToggleStar = (e) => {
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(flashcard._id || flashcard.id);
    }
  };

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Store reference to the button
      const button = e.currentTarget;
      
      utterance.onstart = () => {
        if (button) {
          button.classList.add('text-blue-500', 'scale-110');
        }
      };
      
      utterance.onend = () => {
        if (button) {
          button.classList.remove('text-blue-500', 'scale-110');
        }
      };
      
      utterance.onerror = () => {
        if (button) {
          button.classList.remove('text-blue-500', 'scale-110');
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported');
    }
  };

  // Review statistics
  const reviewCount = flashcard.reviewCount || 0;
  const isStarred = flashcard.isStarred || false;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Card counter and stats bar */}
      {showNavigation && totalCards > 0 && (
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-4 py-1.5 text-sm font-semibold shadow-md">
              {currentIndex + 1} / {totalCards}
            </div>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
                <Clock className="w-3 h-3" />
                <span>Reviewed {reviewCount} {reviewCount === 1 ? 'time' : 'times'}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 hidden sm:flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1.5">
            <kbd className="px-2 py-0.5 bg-white rounded shadow-sm text-xs">←</kbd>
            <span>Prev</span>
            <kbd className="px-2 py-0.5 bg-white rounded shadow-sm text-xs">→</kbd>
            <span>Next</span>
            <kbd className="px-2 py-0.5 bg-white rounded shadow-sm text-xs">Space</kbd>
            <span>Flip</span>
            <kbd className="px-2 py-0.5 bg-white rounded shadow-sm text-xs">F</kbd>
            <span>Star</span>
          </div>
        </div>
      )}

      {/* 3D Flashcard */}
      <div className="relative perspective-2000">
        <div
          className="relative w-full cursor-pointer group"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
        >
          <div
            className={`relative transition-all duration-700 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* FRONT SIDE - QUESTION */}
            <div className="relative [backface-visibility:hidden]">
              <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Decorative top bar */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                
                <div className="p-8 md:p-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        QUESTION
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSpeak(e, flashcard.question)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105"
                        aria-label="Speak question"
                      >
                        <Volume2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <RotateCw className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Question content */}
                  <div className="min-h-[300px] flex items-center justify-center py-8">
                    <p className="text-gray-800 text-center text-2xl md:text-3xl leading-relaxed font-medium">
                      {flashcard.question}
                    </p>
                  </div>

                  {/* Flip hint */}
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-full px-4 py-2">
                      <RotateCw className="w-4 h-4" />
                      <span>Click or press Space to reveal answer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK SIDE - ANSWER */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden h-full">
                {/* Decorative top bar */}
                <div className="h-2 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"></div>
                
                <div className="p-8 md:p-10 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        ANSWER
                      </span>
                      {isStarred && (
                        <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500" /> Starred
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleSpeak(e, flashcard.answer)}
                      className="p-2 rounded-full bg-white/50 hover:bg-white transition-all hover:scale-105"
                      aria-label="Speak answer"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>

                  {/* Answer content */}
                  <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-gray-800 text-center text-xl md:text-2xl leading-relaxed">
                      {flashcard.answer.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < flashcard.answer.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 text-center">
                    <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      Click or press Space to flip back
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating star button */}
        <button
          onClick={handleToggleStar}
          className={`absolute -top-3 -right-3 z-20 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
            isStarred 
              ? 'bg-yellow-400 hover:bg-yellow-500' 
              : 'bg-white hover:bg-gray-50'
          }`}
          aria-label={isStarred ? "Remove star" : "Add star"}
        >
          {isStarred ? (
            <Star className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
          ) : (
            <StarOff className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Navigation buttons */}
      {showNavigation && onPrevious && onNext && totalCards > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all group shadow-md"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium text-gray-700 hidden sm:inline">Previous</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all group shadow-md"
          >
            <span className="font-medium hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Progress bar */}
      {showNavigation && totalCards > 0 && (
        <div className="mt-8">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcard;