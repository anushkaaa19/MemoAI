import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  BookOpen,
  BrainCircuit,
  Clock,
} from 'lucide-react';
import moment from 'moment';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/documents/${document._id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(document);
  };

 return (
  <div
    onClick={handleNavigate}
    className="
      group relative cursor-pointer
      bg-[#f7f7f7]
      border border-gray-200
      rounded-2xl
      p-5
      w-[220px]
      overflow-hidden
      transition-all duration-300 ease-out
      hover:-translate-y-2
      hover:shadow-2xl
      hover:border-teal-200
    "
  >
    {/* Glow Effect */}
    <div
      className="
        absolute inset-0
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-gradient-to-br from-teal-50 via-transparent to-purple-50
        pointer-events-none
      "
    />

    <div className="relative z-10 flex flex-col gap-4">
      
      {/* Top */}
      <div className="flex items-start justify-between">
        
        {/* File Icon */}
        <div
          className="
            w-14 h-14
            rounded-2xl
            bg-[#14b8a6]
            flex items-center justify-center
            shadow-md
            transition-transform duration-300
            group-hover:scale-110
            group-hover:rotate-3
          "
        >
          <FileText
            className="w-7 h-7 text-white"
            strokeWidth={2.2}
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="
            opacity-0 group-hover:opacity-100
            transition-all duration-300
            p-2 rounded-xl
            hover:bg-red-50
            hover:scale-110
          "
        >
          <Trash2
            className="w-4 h-4 text-red-500"
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Title */}
      <div>
        <h3
          title={document.title}
          className="
            text-[17px]
            font-semibold
            text-gray-800
            leading-snug
            line-clamp-2
          "
        >
          {document.title}
        </h3>
      </div>

      {/* File Size */}
      {document.fileSize !== undefined && (
        <span
          className="
            text-xs text-gray-500
          "
        >
          {formatFileSize(document.fileSize)}
        </span>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {document.flashcardCount !== undefined && (
          <div
            className="
              flex items-center gap-1
              px-2 py-1
              rounded-lg
              bg-purple-100
              text-purple-700
              text-xs font-medium
              transition-transform duration-300
              group-hover:scale-105
            "
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{document.flashcardCount} Flashcards</span>
          </div>
        )}

        {document.quizCount !== undefined && (
          <div
            className="
              flex items-center gap-1
              px-2 py-1
              rounded-lg
              bg-green-100
              text-green-700
              text-xs font-medium
              transition-transform duration-300
              group-hover:scale-105
            "
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>{document.quizCount} Quizzes</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="
          flex items-center gap-1
          text-xs text-gray-500
          pt-2
        "
      >
        <Clock className="w-3.5 h-3.5" strokeWidth={2} />
        <span>
          Uploaded {moment(document.createdAt).fromNow()}
        </span>
      </div>
    </div>

    {/* Bottom Hover Line */}
    <div
      className="
        absolute bottom-0 left-0
        h-1 w-0
        bg-gradient-to-r from-teal-400 to-cyan-500
        transition-all duration-500
        group-hover:w-full
      "
    />
  </div>
  );
};

export default DocumentCard;