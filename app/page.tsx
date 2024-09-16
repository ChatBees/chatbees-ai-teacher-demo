"use client";

import { useEffect, useState } from "react";
import { getAccountID, GetOutlineFAQ, OutlineFAQResponse, API_KEY, SummarizeDoc, COLLECTION_NAME } from "../libs/chatbees";
import ChatWidget from "@/components/ChatWidget";

// Fake data for demonstration purposes
const fakeSummary = "This is a fake summary of the video content. It provides an overview of the main topics discussed in the video, including key points and important takeaways.";
const fakeFAQs = [
  { question: "What is the main topic of this video?", answer: "The main topic of this video is an introduction to artificial intelligence and its applications in everyday life." },
  { question: "How long is the video?", answer: "The video is approximately 15 minutes long." },
  { question: "Who is the presenter?", answer: "The presenter is Dr. Jane Smith, a renowned expert in the field of AI." },
];

const Spinner = () => (
  <div className="spinner border-t-2 border-blue-500 border-solid rounded-full w-4 h-4 animate-spin"></div>
);

export default function Home() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docName, setDocName] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>(""); // New state for video title
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isLoadingFAQ, setIsLoadingFAQ] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      // Set the video title to the file name without extension
      setVideoTitle(file.name.split('.').slice(0, -1).join('.'));
    }
  };

  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        const id = await getAccountID();
        if (id) {
          setAccountId(id);
        }
      } catch (error) {
        console.error("Error fetching account ID:", error);
        setAccountId("demo-account-id");
      }
    };

    fetchAccountId();
  }, []);

  useEffect(() => {
    const fetchOutlineAndFAQ = async () => {
      if (videoSrc && accountId && API_KEY && docName) {
        setIsLoadingOutline(true);
        setIsLoadingFAQ(true);
        setIsLoadingSummary(true);

        try {
          const docNameWithExt = docName.endsWith('.txt') ? docName : `${docName}.txt`;
          const response: OutlineFAQResponse = await GetOutlineFAQ(accountId, API_KEY, COLLECTION_NAME as string, docNameWithExt);
          setSummary(response.outlines.join('\n'));
          setFaqs(response.faqs);
          setIsLoadingOutline(false);
          setIsLoadingFAQ(false);

          // Fetch the summary for video description
          const summaryResponse = await SummarizeDoc(accountId, API_KEY, COLLECTION_NAME as string, docNameWithExt);
          setDescription(summaryResponse);
          setIsLoadingSummary(false);
        } catch (error) {
          console.error("Error fetching outline, FAQ, or summary:", error);
          // Inject fake data for demo purposes
          setSummary(fakeSummary);
          setFaqs(fakeFAQs);
          setDescription("Failed to load video description.");
          setIsLoadingOutline(false);
          setIsLoadingFAQ(false);
          setIsLoadingSummary(false);
        }
      }
    };

    fetchOutlineAndFAQ();
  }, [videoSrc, accountId, docName]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVideoSrc(data.videoUrl);
        setDocName(data.docName);
        // Set the video title if it's not already set (in case it wasn't set during file selection)
        if (!videoTitle) {
          setVideoTitle(data.docName.split('.').slice(0, -1).join('.'));
        }
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 p-4 shadow-md">
        <h1 className="text-2xl font-bold">ChatBees AI Teacher</h1>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
        <div className="lg:w-2/3">
          {videoSrc ? (
            <>
              <video className="w-full h-auto" controls src={videoSrc}>
                Your browser does not support the video tag.
              </video>
            </>
          ) : (
            <div className="bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center">
              <p>No video uploaded yet</p>
            </div>
          )}

          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">{videoTitle || "Video Title"}</h2>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <Spinner />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading description...</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {description || "No description available for this video."}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">Outline</h3>
            {isLoadingOutline ? (
              <div className="flex items-center space-x-2">
                <Spinner />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading outline...</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {summary || "No summary available for this video."}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Upload Video</h3>
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose a video file
              </label>
              <input
                id="file-upload"
                type="file"
                accept="video/mp4"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-gray-700 dark:file:text-gray-200
                  dark:hover:file:bg-gray-600"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium
                ${file && !isUploading
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
                } transition duration-300 ease-in-out`}
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                  {uploadProgress}% Uploaded
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/3 mt-4 lg:mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 py-2 px-4 ${activeTab === 'chat' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                ChatBees
              </button>
              <button
                className={`flex-1 py-2 px-4 ${activeTab === 'faq' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                FAQ
              </button>
            </div>

            <div className={activeTab !== "chat" ? "hidden" : ""}>
              <ChatWidget aid={accountId || ""} apiKey={API_KEY || ""} collectionName={COLLECTION_NAME || ""}
                docName={docName || ""}/>
            </div>

            {activeTab === 'faq' && (
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                {isLoadingFAQ ? (
                  <div className="flex items-center space-x-2">
                    <Spinner />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading FAQs...</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {faqs.map((faq, index) => (
                      <li key={index}>
                        <h4 className="font-medium">{faq.question}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 p-4 text-center">
        <p>Account ID: {accountId}</p>
      </footer>
    </div>
  );
}
