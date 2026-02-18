
import React, { useState, useMemo, useEffect } from 'react';
import ProductSearch from './components/ProductSearch';
import BillingTable from './components/BillingTable';
import Summary from './components/Summary';
import { CartItem, Product, Totals } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type BillType = 'DP' | 'MRP' | 'DISCOUNT';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedBillType, setSelectedBillType] = useState<BillType>('MRP');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const APP_TITLE = "AWPL TEAM KARAN";

  const handleAddProduct = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, selectedQuantity: item.selectedQuantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, selectedQuantity: 1 }];
    });
  };

  const handleRemove = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.selectedQuantity + delta);
        return { ...item, selectedQuantity: newQty };
      }
      return item;
    }));
  };

  const totals: Totals = useMemo(() => {
    return cart.reduce((acc, item) => {
      acc.totalMRP += (item.mrp || 0) * (item.selectedQuantity || 0);
      acc.totalDP += (item.dp || 0) * (item.selectedQuantity || 0);
      acc.totalSP += (item.sp || 0) * (item.selectedQuantity || 0);
      acc.gap = acc.totalMRP - acc.totalDP;
      return acc;
    }, { totalMRP: 0, totalDP: 0, totalSP: 0, gap: 0 });
  }, [cart]);

  const handleClearRequest = () => {
    if (isConfirmingClear) {
      setCart([]);
      setCustomerName('');
      setCustomerMobile('');
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  };

  useEffect(() => {
    let timer: number;
    if (isConfirmingClear) {
      timer = window.setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isConfirmingClear]);

  const generatePDF = (type: BillType, discount: number = 0) => {
    if (type === 'DISCOUNT' && discount > totals.gap) {
      alert(`Warning: Discount amount (Rs. ${discount}) cannot exceed your total profit (Rs. ${totals.gap.toFixed(2)}).`);
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const CURRENCY = "Rs.";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(APP_TITLE, pageWidth / 2, 18, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      const billSubtitle = type === 'DP' ? "Detailed Internal Business Report" : "Retail Sales Invoice";
      doc.text(billSubtitle, pageWidth / 2, 26, { align: "center" });
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 32, pageWidth - 14, 32);

      // Customer Info
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("CUSTOMER INFO", 14, 42);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${customerName || 'Walk-in Customer'}`, 14, 47);
      doc.text(`Mobile: ${customerMobile || 'Not Provided'}`, 14, 52);

      // Bill Info
      doc.setFont("helvetica", "bold");
      doc.text("BILL INFO", pageWidth - 14, 42, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${currentDate}`, pageWidth - 14, 47, { align: "right" });
      doc.text(`Bill No: AWPL-${now.getTime().toString().slice(-6)}`, pageWidth - 14, 52, { align: "right" });
      
      let head = [];
      let body = [];

      if (type === 'DP') {
        head = [['S.No', 'Product Name', 'Qty', 'MRP', 'DP Price', 'SP', 'Profit', 'Total']];
        body = cart.map((item, index) => [
          index + 1,
          item.name,
          item.selectedQuantity,
          `${CURRENCY} ${item.mrp.toFixed(0)}`,
          `${CURRENCY} ${item.dp.toFixed(0)}`,
          item.sp,
          `${CURRENCY} ${(item.mrp - item.dp).toFixed(0)}`,
          `${CURRENCY} ${(item.mrp * item.selectedQuantity).toFixed(0)}`
        ]);
      } else {
        head = [['S.No', 'Product Description', 'Quantity', 'Rate (MRP)', 'Amount']];
        body = cart.map((item, index) => [
          index + 1,
          item.name,
          item.selectedQuantity,
          `${CURRENCY} ${item.mrp.toFixed(2)}`,
          `${CURRENCY} ${(item.mrp * item.selectedQuantity).toFixed(2)}`
        ]);
      }
      
      autoTable(doc, {
        startY: 60,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { 
          fillColor: type === 'DP' ? [13, 148, 136] : [37, 99, 235], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        styles: { fontSize: 8.5, cellPadding: 3, halign: 'center', textColor: 51 },
        columnStyles: {
          1: { halign: 'left', cellWidth: 'auto' },
          4: type === 'DP' ? { fontStyle: 'bold', fillColor: [240, 253, 250] } : { halign: 'center' } 
        },
      });
      
      const finalY = (doc as any).lastAutoTable?.finalY || 70;
      const summaryWidth = 75;
      const summaryX = pageWidth - 14 - summaryWidth;
      const valueX = pageWidth - 14;
      let currentY = finalY + 12;

      const addRow = (label: string, value: string, isBold = false, color?: [number, number, number]) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(isBold ? 11 : 9.5);
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        else doc.setTextColor(51, 65, 85);
        
        doc.text(label, summaryX, currentY);
        doc.text(value, valueX, currentY, { align: "right" });
        currentY += 7;
      };

      if (type === 'DP') {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(summaryX - 2, currentY - 6, summaryWidth + 4, 32, 1.5, 1.5, 'F');
        addRow("Total Points (SP):", totals.totalSP.toFixed(2));
        addRow("Total MRP Price:", `${CURRENCY} ${totals.totalMRP.toFixed(2)}`);
        addRow("Total Profit Margin:", `${CURRENCY} ${totals.gap.toFixed(2)}`, true, [13, 148, 136]);
        doc.setDrawColor(226, 232, 240);
        doc.line(summaryX, currentY - 4, valueX, currentY - 4);
        currentY += 2;
        addRow("Total DP Price:", `${CURRENCY} ${totals.totalDP.toFixed(2)}`, true, [20, 184, 166]);
      } else if (type === 'DISCOUNT') {
        const subTotal = totals.totalMRP;
        const finalTotal = Math.max(0, subTotal - discount);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(summaryX - 2, currentY - 6, summaryWidth + 4, 25, 1.5, 1.5, 'F');
        addRow("Sub-Total (MRP):", `${CURRENCY} ${subTotal.toFixed(2)}`);
        addRow("Special Discount:", `(-) ${CURRENCY} ${discount.toFixed(2)}`, false, [220, 38, 38]);
        doc.setDrawColor(226, 232, 240);
        doc.line(summaryX, currentY - 4, valueX, currentY - 4);
        currentY += 2;
        addRow("Grand Total:", `${CURRENCY} ${finalTotal.toFixed(2)}`, true, [30, 41, 59]);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(summaryX - 2, currentY - 6, summaryWidth + 4, 12, 1.5, 1.5, 'F');
        addRow("Grand Total (MRP):", `${CURRENCY} ${totals.totalMRP.toFixed(2)}`, true, [30, 41, 59]);
      }
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("Thank you for choosing AWPL products! Stay Healthy, Stay Wealthy.", pageWidth / 2, currentY + 15, { align: "center" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`System Generated Document | AWPL TEAM KARAN`, 14, pageHeight - 10);
      
      setTimeout(() => {
        doc.save(`AWPL_${type}_Bill_${customerName || 'Customer'}.pdf`);
        setShowDownloadModal(false);
      }, 150);

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Technical issue occurred while generating PDF.");
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Download Options</h3>
                <button onClick={() => setShowDownloadModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedBillType('DP')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedBillType === 'DP' ? 'border-teal-600 bg-teal-50 shadow-inner' : 'border-gray-100 hover:border-teal-200'}`}
                >
                  <p className="font-bold text-teal-800">1. DP Price Bill (Distributor)</p>
                  <p className="text-xs text-teal-600">Full info on SP, MRP, Profit and DP Price.</p>
                </button>

                <button 
                  onClick={() => setSelectedBillType('MRP')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedBillType === 'MRP' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-blue-200'}`}
                >
                  <p className="font-bold text-blue-800">2. MRP Price Bill (Customer)</p>
                  <p className="text-xs text-blue-600">Retail bill based on MRP rates only.</p>
                </button>

                <div className={`p-4 rounded-xl border-2 transition-all ${selectedBillType === 'DISCOUNT' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                  <button onClick={() => setSelectedBillType('DISCOUNT')} className="w-full text-left mb-2">
                    <p className="font-bold text-orange-800">3. MRP with Custom Discount</p>
                    <p className="text-xs text-orange-600">Apply discount from profit margin.</p>
                  </button>
                  {selectedBillType === 'DISCOUNT' && (
                    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Discount Amount (in Rs.)</label>
                      <input 
                        type="number" 
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-800"
                        placeholder="0.00"
                      />
                      <p className="mt-1 text-[10px] text-orange-600 italic">Max limit: Rs. {totals.gap.toFixed(0)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowDownloadModal(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={() => generatePDF(selectedBillType, discountAmount)} className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">Generate Bill</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight tracking-tight mb-1 uppercase">
              {APP_TITLE}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <>
                <button 
                  onClick={handleClearRequest} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${isConfirmingClear ? 'bg-red-600 text-white animate-pulse' : 'text-red-600 hover:bg-red-50'}`}
                >
                  {isConfirmingClear ? 'Confirm Clear?' : 'Clear List'}
                </button>
                <button 
                  onClick={() => setShowDownloadModal(true)} 
                  className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  Download Bill
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Customer Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter Name" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Mobile Number</label>
              <input type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="Enter Mobile" maxLength={10} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all" />
            </div>
          </div>
        </div>

        <ProductSearch onAddProduct={handleAddProduct} />
        <Summary totals={totals} />
        <BillingTable items={cart} onRemove={handleRemove} onUpdateQuantity={handleUpdateQuantity} />
      </main>
    </div>
  );
};

export default App;
