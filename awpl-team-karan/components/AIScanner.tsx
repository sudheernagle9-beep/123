
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Product } from '../types';
import { PRODUCT_DATA } from '../constants';

interface AIScannerProps {
  onProductsFound: (items: { product: Product; quantity: number }[]) => void;
}

const AIScanner: React.FC<AIScannerProps> = ({ onProductsFound }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const productNames = PRODUCT_DATA.map(p => p.name).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: file.type } },
              { text: `Identify items and quantities from this image. Only match with these official names: ${productNames}. Return a JSON array: [{"name": "EXACT_NAME", "quantity": NUMBER}].` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER }
              },
              required: ["name", "quantity"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || '[]');
      const matchedItems = results.map((res: any) => {
        const product = PRODUCT_DATA.find(p => p.name.toLowerCase() === res.name.toLowerCase());
        return product ? { product, quantity: res.quantity || 1 } : null;
      }).filter(Boolean);

      if (matchedItems.length > 0) {
        onProductsFound(matchedItems as any);
      } else {
        setError("No products found in image.");
      }
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-200">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isProcessing ? 'bg-blue-100 animate-pulse' : 'bg-slate-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">AI Document Scanner</h3>
          <p className="text-[10px] text-slate-400 uppercase font-medium">Auto-scan order slips</p>
        </div>
        <input
          type="file"
          accept="image/*"
          id="ai-upload"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
          disabled={isProcessing}
        />
        <label
          htmlFor="ai-upload"
          className={`cursor-pointer px-6 py-2.5 rounded-lg font-bold text-xs uppercase transition-all ${isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
        >
          {isProcessing ? 'Processing...' : 'Upload Image'}
        </label>
        {error && <p className="text-[10px] text-red-500 font-bold uppercase">{error}</p>}
      </div>
    </div>
  );
};

export default AIScanner;
