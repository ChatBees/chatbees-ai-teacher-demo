"use client";

import { useState } from "react";

export default function Home() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("File uploaded successfully");
      setVideoSrc(`/uploads/${file.name}`);
    } else {
      alert("File upload failed");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="flex flex-col sm:flex-row gap-8 w-full">
          <div className="flex-1">
            <input
              type="file"
              accept="video/mp4"
              onChange={handleFileChange}
              className="mb-4"
            />
            <button
              onClick={handleUpload}
              className="mb-4 p-2 bg-blue-500 text-white rounded-lg"
            >
              Upload Video
            </button>
            {videoSrc && (
              <video className="w-full h-auto" controls src={videoSrc}>
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full">
              <h2 className="text-lg font-semibold mb-4">ChatBees</h2>
              <div className="flex flex-col gap-2 h-96 overflow-y-auto">
                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg">
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
                {/* Add more chat messages here */}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  className="w-full p-2 rounded-lg border border-gray-300 text-black dark:border-gray-700"
                  placeholder="Type a message..."
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
