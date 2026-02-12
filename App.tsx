
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Copy, Check, RefreshCw, Trash2, Mail, Terminal, Type, Layout } from 'lucide-react';
import { marked } from 'marked';

const SYSTEM_PROMPT = `You are a world-class professional communication consultant. 
Your task is to refine business emails. 
Rules:
1. Make them sound professional and direct.
2. Avoid "corporate speak" or unnecessary fluff. 
3. Maintain a natural, human tone.
4. Do not add generic greetings or sign-offs if they aren't necessary, but keep the ones provided if they fit.
5. Focus on clarity and efficiency.
6. The user specifically wants to avoid "corporate" cliches.
7. Use Markdown for subtle formatting (bolding important points, using bulleted lists for clarity) to ensure the email is readable.
8. Ensure the tone is appropriate for the context (e.g., technical reporting, follow-ups).`;

const App: React.FC = () => {
  const [input, setInput] = useState(`Hi,

As per Kip’s request, I had the Jaydu India team try out web PDM by downloading an assembly (D3530-BF – standard front wall). They were unsuccessful because once they initiated the download, the web PDM interface was stuck on the loading screen. They waited for about two hours before closing it.

In contrast, I tried the web pdm interface here. I was able to download the same assembly in 2 minutes.

Thank you,
Sreevardhan Gullipalli
Engineering Contractor`);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const refineEmail = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this email. Use subtle markdown formatting (bold/lists) where it helps readability. Make it professional but natural. Original content:\n\n${input}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const refinedText = response.text || '';
      setOutput(refinedText);
    } catch (err) {
      console.error(err);
      setError('Failed to refine the email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const copyToClipboard = async () => {
    if (!output || !outputRef.current) return;

    try {
      const html = outputRef.current.innerHTML;
      const plainText = outputRef.current.innerText;

      // Create a Blob for the HTML content
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });

      // Use the ClipboardItem API to copy both formats
      // This allows clients like Outlook and Gmail to pick up the HTML version
      const data = [new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      })];

      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback to plain text if ClipboardItem is not supported
      await navigator.clipboard.writeText(outputRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
  };

  const renderedHtml = marked.parse(output) as string;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-6xl mb-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Mail className="w-8 h-8 text-blue-600" />
            ProScript <span className="text-blue-600">Refiner</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">"Say it better, professionally."</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-xs font-semibold text-slate-600">
            <Type className="w-3.5 h-3.5 text-blue-500" />
            Rich Text Support
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-xs font-medium text-slate-600">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            Gemini 3 Flash
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Input Panel */}
        <section className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <Layout className="w-4 h-4" />
              Your Draft
            </div>
            <button 
              onClick={clearInput}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 shadow-sm"
              title="Clear input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-grow flex flex-col gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your rough email draft here..."
              className="flex-grow min-h-[400px] w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none resize-none transition-all text-slate-700 leading-relaxed"
            />
            <button
              onClick={refineEmail}
              disabled={isLoading || !input.trim()}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 group"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing Context...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Refine with Rich Text
                </>
              )}
            </button>
          </div>
        </section>

        {/* Output Panel */}
        <section className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/30">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600">
              <Check className="w-4 h-4" />
              Refined Result
            </div>
            {output && (
              <button 
                onClick={copyToClipboard}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${
                  copied 
                    ? 'bg-green-500 text-white shadow-green-200' 
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy for Outlook'}
              </button>
            )}
          </div>

          <div className="p-6 flex-grow flex flex-col">
            <div 
              ref={outputRef}
              className={`prose-output flex-grow min-h-[400px] w-full p-6 bg-white border border-slate-100 rounded-2xl overflow-auto text-slate-800 ${!output && 'flex flex-col items-center justify-center text-slate-400 italic border-dashed border-slate-200 bg-slate-50/30'}`}
            >
              {error ? (
                <div className="text-red-500 font-medium text-center px-4 bg-red-50 py-4 rounded-xl border border-red-100">
                  {error}
                </div>
              ) : output ? (
                <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center opacity-60">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-slate-300" />
                   </div>
                   <p>Click "Refine" to see the magic happen.</p>
                </div>
              )}
            </div>

            {output && (
              <div className="mt-6 p-4 bg-blue-50/50 text-blue-800 rounded-2xl text-xs flex items-start gap-3 border border-blue-100/50">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold mb-1 uppercase tracking-tight">Smart Enhancement</p>
                  Formatting preserved for email clients. Use the "Copy" button to keep bolding and lists when pasting into Outlook or Gmail.
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer / Info */}
      <footer className="w-full max-w-6xl mt-12 pt-8 border-t border-slate-200 text-slate-400 text-sm flex flex-col md:flex-row justify-between items-center gap-4 px-4">
        <p className="font-medium text-slate-500 flex items-center gap-1.5">
           Built for Professional Clarity
        </p>
        <div className="flex gap-8">
          <span className="hover:text-blue-600 cursor-pointer transition-colors font-medium">Feedback</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors font-medium">History</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors font-medium">Settings</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
