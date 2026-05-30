import React, { useState, useEffect } from 'react';
import ChatInterface  from '../../components/chat/ChatInterface';
import { useParams, Link } from 'react-router-dom';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, BookOpen, BrainCircuit, Clock, FileText, MessageSquare, Sparkles } from 'lucide-react';
import moment from 'moment';
import AIActions from '../../components/ai/AIActions';
import Flashcard from '../../../../../backend/models/Flashcard';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const response = await documentService.getDocumentById(id);
        const docData = response.data || response;
        setDocument(docData);
      } catch (error) {
        toast.error('Failed to fetch document details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocumentDetails();
    }
  }, [id]);

  // Helper function to get the full PDF URL
  const getPdfUrl = () => {
    if (!document?.filePath) return null;

    const filePath = document.filePath;

    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Otherwise, construct the full URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (!document) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Document not found</p>
        </div>
      );
    }

    const pdfUrl = getPdfUrl();
    
    if (!pdfUrl) {
      return (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No PDF file available</p>
        </div>
      );
    }

    // PDF Viewer
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">{document.title}</span>
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink size={16} />
            Open in new tab
          </a>
        </div>
        <div className="bg-gray-100">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-[calc(100vh-250px)] min-h-[600px]"
            title="PDF Viewer"
            frameBorder="0"
          />
        </div>
      </div>
    );
  };

  const renderChat = () => {
    return <ChatInterface/>
  };

  const renderAIActions = () => {
    return <AIActions/>
  };

  const renderFlashcardsTab = () => {
    return <FlashcardManager documentId={id}/>
  };

  const renderQuizzesTab = () => {
    return (
      <div className="text-center py-12">
        <BrainCircuit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No quizzes yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Use AI Actions to generate quizzes from this document
        </p>
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Document not found</p>
          <Link to="/documents" className="text-blue-600 hover:underline">
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: 'content', label: 'Content', icon: FileText, content: renderContent() },
    { name: 'chat', label: 'Chat', icon: MessageSquare, content: renderChat() },
    { name: 'aiActions', label: 'AI Actions', icon: Sparkles, content: renderAIActions() },
    { name: 'flashcards', label: 'Flashcards', icon: BookOpen, content: renderFlashcardsTab() },
    { name: 'quizzes', label: 'Quizzes', icon: BrainCircuit, content: renderQuizzesTab() },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            to="/documents" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {document.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{formatFileSize(document.fileSize)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Uploaded {moment(document.createdAt).fromNow()}
                </span>
                {document.flashcardCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {document.flashcardCount} Flashcards
                  </span>
                )}
                {document.quizCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="w-4 h-4" />
                    {document.quizCount} Quizzes
                  </span>
                )}
                {document.status === 'processing' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex gap-6 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.name
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {tabs.find((tab) => tab.name === activeTab)?.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;