import React, { useState } from "react";

interface UserInputProps {
  askQuestion: (userMsg: string) => void;
  disabled: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ askQuestion, disabled }) => {
  const [userMsg, setUserMsg] = useState<string>("");

  const onAskQuestion = () => {
    if (disabled) {
      return;
    }

    askQuestion(userMsg);
    setUserMsg('');
  }

  return (
    <div
      className="bottom-0 w-full p-1.5 flex justify-between items-center box-border border border-gray-300 border-t-0 rounded-b-xl">
      <textarea
        className="w-full resize-none rounded-lg p-1.5 box-border flex-grow mr-2.5 text-gray-900"
        placeholder="Type your message here"
        value={userMsg}
        onChange={(e) => setUserMsg(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAskQuestion();
          }
        }}
      ></textarea>
      <button
        className="flex h-16 w-16 items-center justify-center rounded-md bg-primary text-white hover:text-gray-900 bg-black"
        aria-label="Ask ChatBees Question"
        onClick={onAskQuestion}
        disabled={disabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className={disabled ? "text-gray-400" : "text-white"}
        >
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round"></path>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round"></path>
        </svg>
      </button>
    </div>
  );
};

export default UserInput;
