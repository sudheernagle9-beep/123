
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { PRODUCT_DATA } from '../constants';

interface ProductSearchProps {
  onAddProduct: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddProduct }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = PRODUCT_DATA.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onAddProduct(product);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mb-8" ref={containerRef}>
      <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-300 transition-all overflow-hidden">
        <span className="pl-4 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full py-3 px-4 text-gray-700 outline-none placeholder-gray-400"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((p) => (
            <li 
              key={p.id}
              onClick={() => handleSelect(p)}
              className="flex justify-between items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.quantityInfo} • MRP: Rs. {p.mrp}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  SP: {p.sp}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductSearch;
