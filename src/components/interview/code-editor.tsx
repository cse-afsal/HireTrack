"use client";

import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface CodeEditorProps {
  language: string;
  initialCode: string;
}

export function CodeEditor({ language, initialCode }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput("");
    
    // This is where Judge0 API mock goes
    try {
      setTimeout(() => {
        setOutput("> Execution successful.\n> " + code.length + " bytes processed.\n[Mock Output] Hello, World!");
        setIsExecuting(false);
      }, 1200);
    } catch (err) {
      setOutput("Error executing code.");
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 bg-neutral-800 rounded text-neutral-300">
            {language.toUpperCase()}
          </span>
        </div>
        <Button 
          size="sm" 
          onClick={handleRunCode} 
          disabled={isExecuting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs"
        >
          {isExecuting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
          Run
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
         <Editor
           height="100%"
           language={language}
           theme="vs-dark"
           value={code}
           onChange={(val) => setCode(val || "")}
           onMount={handleEditorDidMount}
           options={{
             minimap: { enabled: false },
             fontSize: 14,
             padding: { top: 16 },
             scrollBeyondLastLine: false,
             smoothScrolling: true,
             cursorBlinking: "smooth",
           }}
         />
      </div>

      {/* Output Console area */}
      <div className="h-1/3 border-t border-neutral-800 bg-[#1e1e1e] flex flex-col shrink-0">
         <div className="px-4 py-1.5 border-b border-neutral-800 bg-[#2d2d2d] flex items-center justify-between">
           <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Console Output</span>
           <button onClick={() => setOutput("")} className="text-xs text-neutral-500 hover:text-white">Clear</button>
         </div>
         <div className="flex-1 p-4 font-mono text-sm overflow-auto text-neutral-300">
            {isExecuting && !output && <span className="text-neutral-500 animate-pulse">Running code snippet...</span>}
            {output && <pre className="whitespace-pre-wrap">{output}</pre>}
            {!isExecuting && !output && <span className="text-neutral-600 italic">Run your code to see output here.</span>}
         </div>
      </div>
    </div>
  );
}
