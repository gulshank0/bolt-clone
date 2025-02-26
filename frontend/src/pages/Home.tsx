import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export function Home() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/builder", { state: { prompt } });
    }
  };

  return (
    <>
      <div className="p-4 flex justify-between items-center gap-5 text-pretty bg-gradient-to-t from-gray-900 to-gray-800 text-gray-100 ">
        <div className="flex items-center gap-2">
          <img 
            src="/public/apiary-svgrepo-com.svg" 
            alt="Webpage Logo" 
                    className="h-10 w-auto text-white cursor-pointer"
                    onClick={() => window.location.reload()}
          /> <h1 className="text-2xl font-bold text-teal-500 hover:cursor-pointer" onClick={() => window.location.reload()} >TARS</h1>
        </div>
       <div className="flex gap-5">
        <button className="text-bold hover:text-gray-500" onClick={() => navigate("/")}>Home</button>
        <button className="text-bold hover:text-gray-500" onClick={() => navigate("/feedback")}>Feedback</button>
        <button className="text-bold hover:text-gray-500" onClick={() => navigate("/contact")}>Contact us</button>
        <button className="text-bold hover:text-gray-500" onClick={() => navigate("/about")}>About us</button>
        
        </div> 
      </div>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
           
            <h1 className="text-4xl font-bold text-gray-100 mb-4">
             Gulashan Copied Project is here to help you fix 
            </h1>
            <p className="text-lg text-gray-300">
              Generate a website of your choice 
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-lg p-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the website you want to build..."
                className="w-full h-40 p-6 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-full mt-4 bg-teal-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-teal-300 transition-colors"
              >
                Generate Web App <ArrowRight className="inline-block w-5 h-5 ml-2" /> 
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

