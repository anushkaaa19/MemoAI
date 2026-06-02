// src/pages/Flashcards/FlashcardsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  ChevronRight,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import flashcardService from '../../services/flashcardService';
import Spinner from '../../components/common/Spinner';

const FlashcardsListPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, recent, starred, most-reviewed
  const [stats, setStats] = useState({
    totalCards: 0,
    totalSets: 0,
    totalReviews: 0,
    starredCards: 0
  });

  useEffect(() => {
    fetchAllFlashcards();
  }, []);

  const fetchAllFlashcards = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getAllFlashcardsSets();
      console.log("Fetched flashcards:", response);

      let setsData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        setsData = response.data;
      } else if (Array.isArray(response)) {
        setsData = response;
      }

      // Calculate statistics
      let totalCards = 0;
      let totalReviews = 0;
      let starredCards = 0;

      setsData.forEach(set => {
        const cardsCount = set.cards?.length || 0;
        totalCards += cardsCount;

        set.cards?.forEach(card => {
          totalReviews += card.reviewCount || 0;
          if (card.isStarred) starredCards++;
        });
      });

      setStats({
        totalCards,
        totalSets: setsData.length,
        totalReviews,
        starredCards
      });

      setFlashcardSets(setsData);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to fetch flashcards');
      setFlashcardSets([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSets = () => {
    let filtered = [...flashcardSets];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(set =>
        set.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.documentId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    switch (filterBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'starred':
        filtered = filtered.filter(set =>
          set.cards?.some(card => card.isStarred)
        );
        break;
      case 'most-reviewed':
        filtered.sort((a, b) => {
          const aReviews = a.cards?.reduce((sum, card) => sum + (card.reviewCount || 0), 0) || 0;
          const bReviews = b.cards?.reduce((sum, card) => sum + (card.reviewCount || 0), 0) || 0;
          return bReviews - aReviews;
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const getTotalReviewsForSet = (set) => {
    return set.cards?.reduce((sum, card) => sum + (card.reviewCount || 0), 0) || 0;
  };

  const getStarredCountForSet = (set) => {
    return set.cards?.filter(card => card.isStarred).length || 0;
  };

  const filteredSets = getFilteredSets();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">My Flashcards</h1>
          </div>
          <p className="text-gray-500 ml-13">
            Review and manage all your flashcard sets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSets}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cards</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Starred Cards</p>
                <p className="text-2xl font-bold text-gray-900">{stats.starredCards}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search flashcard sets by title or document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterBy === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterBy('recent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${filterBy === 'recent'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Clock className="w-4 h-4" />
                Recent
              </button>
              <button
                onClick={() => setFilterBy('starred')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${filterBy === 'starred'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Star className="w-4 h-4" />
                Starred
              </button>
              <button
                onClick={() => setFilterBy('most-reviewed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${filterBy === 'most-reviewed'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                Most Reviewed
              </button>
            </div>
          </div>
        </div>

        {/* Flashcard Sets Grid */}
        {filteredSets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flashcards Found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Generate flashcards from your documents to start learning'}
            </p>
            {!searchTerm && (
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Go to Documents
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => {
              const totalReviews = getTotalReviewsForSet(set);
              const starredCount = getStarredCountForSet(set);
              const cardCount = set.cards?.length || 0;

              return (
                <Link
                  key={set._id}
                  to={`/documents/${set.documentId?._id || set.documentId}`}
                  state={{ selectedFlashcardSetId: set._id }}
                  className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {set.title || 'Untitled Set'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {set.documentId?.title || 'Document'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Cards</span>
                        <span className="font-medium text-gray-900">{cardCount}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Reviews
                        </span>
                        <span className="font-medium text-gray-900">{totalReviews}</span>
                      </div>

                      {starredCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            Starred
                          </span>
                          <span className="font-medium text-yellow-600">{starredCount}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created
                        </span>
                        <span className="text-xs text-gray-500">
                          {moment(set.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>

                    {/* Review Progress Bar */}
                    {totalReviews > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Review Progress</span>
                          <span>{Math.min(100, Math.round((totalReviews / (cardCount * 3)) * 100))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.round((totalReviews / (cardCount * 3)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 font-medium">Review Set</span>
                        <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsListPage;
