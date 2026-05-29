import React, { useState, useEffect } from "react";
import { Plus, Upload, Trash2, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import DocumentCard from "../../components/documents/DocumentCard";
import DocumentDetailPage from "./DocumentDetailPage";
const DocumentListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const response = await documentService.getDocuments();
      setDocuments(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch documents.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile || !uploadTitle) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setUploading(true);

    const formData = new FormData();

    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);

    try {
      await documentService.uploadDocument(formData);

      toast.success("Document uploaded");

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");

      setLoading(true);
      fetchDocuments();
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;

    setDeleting(true);

    try {
      await documentService.deleteDocument(selectedDoc._id);

      toast.success(`'${selectedDoc.title}' deleted.`);

      setIsDeleteModalOpen(false);
      setSelectedDoc(null);

      setDocuments((prev) =>
        prev.filter((d) => d._id !== selectedDoc._id)
      );
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }
  const renderContent = () => {

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shadow-lg shadow-slate-200/50 mb-6">
              <FileText
                className="w-10 h-10 text-slate-400"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-xl font-medium text-slate-900 tracking-tight mb-2">
              No Documents Yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Get started by uploading your first PDF document to begin learning.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex iitems-center gap-2 py-3 px-6 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadpw-emerald-500/30 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        </div>

      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {documents?.map((doc) => (
          <DocumentCard key={doc._id}
            document={doc}
            onDelete={handleDeleteRequest} />
        ))}
      </div>
    )

  };

  return (
    <div className="min-h-screen relative">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 pointer-events-none" />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
              My Documents
            </h1>

            <p className="text-slate-500 text-sm">
              Manage and organise your learning materials
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Upload Document
          </button>
        </div>
        {renderContent()};
      </div>
{isUploadModalOpen&&(<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
    {/* Header with close button */}
    <div className="flex justify-end">
      <button 
        onClick={() => setIsUploadModalOpen(false)} 
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
    
    {/* Title Section */}
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Upload New Document
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Add a PDF document to your library
      </p>
    </div>
    
    {/* Form */}
    <form onSubmit={handleUpload} className="space-y-5">
      {/* Document Title Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Title
        </label>
        <input 
          type="text" 
          value={uploadTitle} 
          onChange={(e) => setUploadTitle(e.target.value)}
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="e.g., React Interview Prep" 
        />
      </div>
      
      {/* PDF File Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          PDF File
        </label>
        
        {/* File upload dropzone */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf"
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-blue-50 rounded-full">
                <Upload className="w-6 h-6 text-blue-600" strokeWidth={2} />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {uploadFile ? (
                <span className="text-blue-600 font-medium">{uploadFile.name}</span>
              ) : (
                <>
                  <span className="text-blue-600 font-medium hover:underline">
                    Click to upload
                  </span>{" "}
                  <span className="text-gray-500">or drag and drop</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PDF up to 10MB
            </p>
          </label>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(false)}
          disabled={uploading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={uploading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </span>
          ) : (
            "Upload"
          )}
        </button>
      </div>
    </form>
  </div>
</div>)}
{/* Delete Modal - ONLY show when isDeleteModalOpen is true */}
{isDeleteModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDeleteModalOpen(false)} />
    
    {/* Modal Container */}
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
      
      {/* Close button */}
      <button
        onClick={() => setIsDeleteModalOpen(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Modal Header */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6 text-red-600" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Confirm Deletion
        </h2>
      </div>

      {/* Content */}
      <p className="text-gray-600 text-center mb-2">
        Are you sure you want to delete the document:
      </p>
      <p className="font-semibold text-gray-900 text-center mb-2">
        "{selectedDoc?.title}"
      </p>
      <p className="text-sm text-gray-500 text-center mb-6">
        This action cannot be undone.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(false)}
          disabled={deleting}
          className="flex-1 h-11 px-4 border-2 border-gray-200 rounded-xl bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        
        <button
          onClick={handleConfirmDelete}
          disabled={deleting}
          className="flex-1 h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
  </div >
  
);
};

export default DocumentListPage;
