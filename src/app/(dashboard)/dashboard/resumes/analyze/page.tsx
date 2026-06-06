"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle, Loader2, ImageIcon } from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE_MB = 15;

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return <ImageIcon className="w-10 h-10 text-emerald-400" />;
  return <FileText className="w-10 h-10 text-emerald-400" />;
}

export default function AnalyzeResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    const lowerName = selectedFile.name.toLowerCase();
    const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!isAccepted) {
      setError("Unsupported file type. Please upload a PDF, JPG, or PNG file.");
      return;
    }
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setFile(selectedFile);
    // Show preview for images
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resumes/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze resume. Please try again.");
      }

      router.push(`/dashboard/resumes/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while analyzing the resume. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-4">AI Resume Analyzer</h1>
        <p className="text-neutral-400 mb-2">
          Upload your resume to get an AI-powered ATS score and detailed feedback.
        </p>
        <p className="text-neutral-500 text-sm mb-4">
          Accepts <span className="text-indigo-400 font-medium">PDF</span>,{" "}
          <span className="text-indigo-400 font-medium">JPG</span>,{" "}
          <span className="text-indigo-400 font-medium">PNG</span>, or{" "}
          <span className="text-indigo-400 font-medium">WebP</span> — including scanned resume images
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-all cursor-pointer
              ${isDragOver ? "border-indigo-500 bg-indigo-500/10" : file ? "border-emerald-500/50 bg-emerald-500/5 cursor-default" : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image preview thumbnail */}
            {previewUrl && (
              <div className="w-full max-h-48 overflow-hidden rounded-xl border border-emerald-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Resume preview" className="w-full object-contain max-h-48" />
              </div>
            )}

            {!previewUrl && (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${file ? "bg-emerald-500/10 border-emerald-500/20" : "bg-indigo-500/10 border-indigo-500/20"}`}>
                {file ? (
                  getFileIcon(file)
                ) : (
                  <UploadCloud className="w-10 h-10 text-indigo-400" />
                )}
              </div>
            )}

            {file ? (
              <div className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <p className="text-white font-semibold text-lg">File Ready</p>
                </div>
                <p className="text-emerald-400 text-sm mt-1 font-mono truncate px-4">{file.name}</p>
                <p className="text-neutral-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-semibold text-lg">
                  {isDragOver ? "Drop your resume here!" : "Drag & Drop or Click to Browse"}
                </p>
                <p className="text-neutral-500 text-sm mt-1">PDF, JPG, PNG, WebP — up to 15MB</p>
                <p className="text-neutral-600 text-xs mt-1">Scanned image resumes are supported ✓</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {file && (
            <div className="space-y-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-base"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing your resume... (may take ~30s)
                  </>
                ) : (
                  "Upload & Analyze with AI"
                )}
              </Button>
              <Button
                onClick={clearFile}
                disabled={isUploading}
                variant="ghost"
                className="text-neutral-400 hover:text-white w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Remove file
              </Button>
            </div>
          )}

          {!file && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
            >
              Browse Files
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-8 grid md:grid-cols-3 gap-4 text-center text-sm">
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/50">
          <FileText className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
          <h4 className="font-medium text-white mb-1">ATS Compatibility</h4>
          <p className="text-neutral-500">Checks how well your resume parses through applicant tracking systems.</p>
        </div>
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/50">
          <ImageIcon className="w-5 h-5 mx-auto mb-2 text-pink-400" />
          <h4 className="font-medium text-white mb-1">Image Resume Support</h4>
          <p className="text-neutral-500">Supports scanned images and photo-based resume files using AI vision.</p>
        </div>
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/50">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
          <h4 className="font-medium text-white mb-1">Job Fit Score</h4>
          <p className="text-neutral-500">Gives a score out of 100 and suggests target roles based on your experience.</p>
        </div>
      </div>
    </div>
  );
}
