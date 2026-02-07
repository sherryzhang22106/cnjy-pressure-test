
import React, { useState, useEffect, useRef } from 'react';
import { QUESTIONS, PRESSURE_LEVELS } from './constants';
import { QuizResult, Dimension } from './types';
import { generateAIAnalysisStream } from './services/aiService';
import {
  isWechat,
  isMobile,
  createNativePayment,
  createJsapiPayment,
  getWechatOAuthUrl,
  pollPaymentStatus,
  invokeWechatPay,
  checkLocalPayment,
  markLocalPayment
} from './services/paymentService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Utils ---

const saveAsPDF = async (element: HTMLElement, filename: string) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f7f1e3', // 保持品牌背景色
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    
    pdf.save(filename);
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF 生成失败，请尝试截图保存。');
  }
};

// --- Atomic Components ---

const Badge = ({ children, color = 'bg-[#feca57]' }: { children?: React.ReactNode, color?: string }) => (
  <span className={`${color} border-2 border-[#2f3542] px-3 py-1 text-[10px] font-black uppercase tracking-tighter italic inline-block`}>
    {children}
  </span>
);

const Header = () => (
  <header className="py-3 px-5 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b-2 border-[#2f3542] no-print">
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-[#2f3542] text-white flex items-center justify-center font-black italic text-lg border-2 border-[#2f3542]">P</div>
      <div className="flex flex-col -space-y-1">
        <span className="text-xs font-black tracking-tighter uppercase">春节压力扫描</span>
        <span className="text-[9px] font-bold text-[#ff4757] tracking-tighter italic">V2026 OFFICIAL</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-[#2ecc71] rounded-full animate-pulse" />
      <span className="text-[10px] font-black text-[#2f3542] opacity-70 italic uppercase">系统就绪</span>
    </div>
  </header>
);

// --- Payment View ---

const PaymentGate = ({ title, price, onPay, onBack, paymentType }: {
  title: string,
  price: string,
  onPay: () => void,
  onBack?: () => void,
  paymentType: 'basic' | 'ai'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [showQR, setShowQR] = useState(false);
  const cancelPollRef = useRef<(() => void) | null>(null);

  // 检查本地缓存是否已支付
  useEffect(() => {
    if (checkLocalPayment(paymentType)) {
      onPay();
    }
  }, [paymentType, onPay]);

  // 检查微信授权回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && isWechat()) {
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
      handleJsapiPay(code);
    }
  }, []);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (cancelPollRef.current) {
        cancelPollRef.current();
      }
    };
  }, []);

  const handlePaymentSuccess = () => {
    markLocalPayment(paymentType);
    setLoading(false);
    setShowQR(false);
    onPay();
  };

  // 微信内 JSAPI 支付
  const handleJsapiPay = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const description = paymentType === 'basic' ? '春节压力测评基础报告' : '春节压力测评AI深度报告';
      const { orderNo, payParams } = await createJsapiPayment(code, parseFloat(price), description);

      const success = await invokeWechatPay(payParams);
      if (success) {
        handlePaymentSuccess();
      } else {
        setError('支付已取消');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || '支付失败');
      setLoading(false);
    }
  };

  // PC/手机浏览器 Native 支付（扫码）
  const handleNativePay = async () => {
    setLoading(true);
    setError('');
    try {
      const description = paymentType === 'basic' ? '春节压力测评基础报告' : '春节压力测评AI深度报告';
      const { orderNo: newOrderNo, qrImageUrl } = await createNativePayment(parseFloat(price), description);

      setOrderNo(newOrderNo);
      setQrCode(qrImageUrl);
      setShowQR(true);
      setLoading(false);

      // 开始轮询支付状态
      cancelPollRef.current = pollPaymentStatus(
        newOrderNo,
        handlePaymentSuccess,
        () => {
          setError('支付超时，请重试');
          setShowQR(false);
        }
      );
    } catch (err: any) {
      setError(err.message || '创建订单失败');
      setLoading(false);
    }
  };

  // 处理支付按钮点击
  const handlePayClick = async () => {
    if (isWechat()) {
      // 微信内：跳转授权获取 code
      setLoading(true);
      try {
        const oauthUrl = await getWechatOAuthUrl(window.location.href);
        window.location.href = oauthUrl;
      } catch (err: any) {
        setError(err.message || '获取授权失败');
        setLoading(false);
      }
    } else {
      // PC 或手机浏览器：显示二维码
      handleNativePay();
    }
  };

  const closeQR = () => {
    if (cancelPollRef.current) {
      cancelPollRef.current();
    }
    setShowQR(false);
    setQrCode('');
    setOrderNo('');
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] animate-slide-up no-print">
      <div className="neo-box p-8 bg-white text-center w-full relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest border-b border-[#2f3542] italic hover:opacity-70"
          >
            ← 返回
          </button>
        )}

        {showQR ? (
          <>
            <div className="text-3xl mb-4">📱</div>
            <h2 className="text-lg font-black italic mb-2">请使用微信扫码支付</h2>
            <p className="text-gray-500 text-xs mb-4">支付金额：¥{price}</p>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="支付二维码" className="w-48 h-48 border-2 border-[#2f3542]" />
            </div>
            <p className="text-[10px] text-gray-400 mb-4">订单号：{orderNo}</p>
            <button
              onClick={closeQR}
              className="text-[10px] font-black text-gray-500 border-b border-gray-300"
            >
              取消支付
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">🧧</div>
            <h2 className="text-xl font-black italic mb-2">{title}</h2>
            <p className="text-gray-600 font-bold mb-8 text-sm leading-relaxed">
              支付 {price} 元<br/>立即解锁你的深度生存报告
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              onClick={handlePayClick}
              disabled={loading}
              className={`btn-primary w-full py-4 text-lg italic tracking-tighter ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? '处理中...' : '立即支付解锁'}
            </button>
            <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
              <div className="w-1 h-1 bg-black rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest italic">微信安全支付</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Views ---

const LandingView = ({ onStart }: { onStart: () => void }) => (
  <div className="flex flex-col p-6 animate-slide-up relative min-h-[calc(100vh-80px)] justify-center no-print">
    <div className="relative mb-8 pt-10">
      <div className="absolute -top-10 -left-2 z-0 opacity-10 select-none pointer-events-none">
        <div className="text-[100px] font-black text-[#2f3542] opacity-5 leading-none">2026</div>
      </div>
      
      <div className="relative z-10">
        <Badge>春节保命神器</Badge>
        <h2 className="text-3xl font-black leading-tight mt-3 mb-5 tracking-tighter italic uppercase underline decoration-[#ff4757] underline-offset-4">
          春节将至，<br/>
          测测你会被围攻到几级？
        </h2>
        <div className="bg-[#2f3542] text-white px-3 py-1.5 inline-block font-bold text-xs mb-8 rotate-[-1deg]">
          —— 预判亲戚走位，平安舒适过年
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-10">
      <div className="neo-box p-4 bg-white rotate-1">
        <div className="text-[9px] font-black text-gray-400 uppercase mb-1">评估人群</div>
        <div className="text-base font-black italic">18-35岁</div>
      </div>
      <div className="neo-box p-4 bg-[#feca57] -rotate-1">
        <div className="text-[9px] font-black text-[#2f3542] uppercase mb-1">核心算法</div>
        <div className="text-base font-black italic">深度测算</div>
      </div>
    </div>

    <p className="text-[#2f3542] font-bold mb-12 leading-relaxed text-lg border-l-4 border-[#ff4757] pl-4 italic">
      拒绝精神内耗，提前识别围攻场景。<br/>
      <span className="text-sm opacity-60">这份指南，比年终奖更治愈。</span>
    </p>
    
    <button 
      onClick={onStart}
      className="btn-primary w-full py-5 text-xl italic tracking-tighter flex items-center justify-center gap-4 group mb-12"
    >
      <span>开启压力扫描</span>
      <span className="transition-transform group-active:translate-x-4">>></span>
    </button>

    {/* 8个等级详情展示区 */}
    <section className="mt-4 mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-[2px] flex-1 bg-[#2f3542]"></div>
        <span className="text-xs font-black italic uppercase tracking-widest text-[#2f3542]">看看你会属于哪一级？</span>
        <div className="h-[2px] flex-1 bg-[#2f3542]"></div>
      </div>
      
      <div className="space-y-6">
        {PRESSURE_LEVELS.map((level) => (
          <div key={level.level} className="neo-box p-4 bg-white relative overflow-hidden no-active">
            <div className="absolute top-0 right-0 bg-[#2f3542] text-white text-[9px] font-black px-2 py-1 italic">
              LV.{level.level} ({level.range[0]}-{level.range[1]}分)
            </div>
            <h4 className="text-lg font-black italic text-[#ff4757] mb-2">{level.tag}</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {level.keywords.map(k => (
                <span key={k} className="px-2 py-0.5 bg-[#feca57] border-[1.5px] border-[#2f3542] font-black text-[9px] italic">#{k}</span>
              ))}
            </div>
            <p className="text-xs font-bold leading-relaxed text-gray-600 border-l-2 border-gray-200 pl-3">
              {level.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const QuizView = ({ onComplete }: { onComplete: (result: QuizResult) => void }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (label: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = label;
    setAnswers(newAnswers);
    
    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);
    }
  };

  const handleNext = () => {
    if (answers[currentIdx] && currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentIdx === QUESTIONS.length - 1 && answers[currentIdx]) {
      calculateResult(answers);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calculateResult = (finalAnswers: string[]) => {
    const scores = { [Dimension.EXTERNAL]: 0, [Dimension.INTERNAL]: 0, [Dimension.DEFENSE]: 0 };
    const counts = { [Dimension.EXTERNAL]: 0, [Dimension.INTERNAL]: 0, [Dimension.DEFENSE]: 0 };

    QUESTIONS.forEach((q, idx) => {
      const selectedOption = q.options.find(o => o.label === finalAnswers[idx]);
      if (selectedOption) scores[q.dimension] += selectedOption.weight;
      counts[q.dimension]++;
    });

    const dimScores = {
      [Dimension.EXTERNAL]: Math.round((scores[Dimension.EXTERNAL] / counts[Dimension.EXTERNAL]) * 100),
      [Dimension.INTERNAL]: Math.round((scores[Dimension.INTERNAL] / counts[Dimension.INTERNAL]) * 100),
      [Dimension.DEFENSE]: Math.round((scores[Dimension.DEFENSE] / counts[Dimension.DEFENSE]) * 100),
    };

    const totalScore = Math.round(dimScores[Dimension.EXTERNAL] * 0.4 + dimScores[Dimension.INTERNAL] * 0.3 + dimScores[Dimension.DEFENSE] * 0.3);
    const level = PRESSURE_LEVELS.find(l => totalScore >= l.range[0] && totalScore <= l.range[1]) || PRESSURE_LEVELS[0];

    onComplete({ totalScore, level, dimensionScores: dimScores, answers: finalAnswers });
  };

  const q = QUESTIONS[currentIdx];
  const progress = ((currentIdx + 1) / QUESTIONS.length) * 100;

  return (
    <div className="p-6 animate-slide-up flex flex-col min-h-[calc(100vh-80px)] no-print">
      <div className="mb-6">
        <div className="flex justify-between items-end mb-1">
          <Badge color="bg-[#2f3542] text-white">题目: {currentIdx + 1} / {QUESTIONS.length}</Badge>
          <span className="text-[10px] font-black italic opacity-50 uppercase">分析进度 {Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-white border-2 border-[#2f3542] p-0.5">
          <div className="h-full bg-[#ff4757] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-black leading-tight tracking-tighter italic border-b-2 border-[#2f3542] pb-4 mb-6">
          {q.text}
        </h2>

        <div className="space-y-4">
          {q.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleAnswer(opt.label)}
              className={`neo-box w-full text-left p-4 flex items-start gap-4 transition-all ${answers[currentIdx] === opt.label ? 'bg-[#feca57] translate-x-0.5 translate-y-0.5 shadow-none' : 'bg-white'}`}
            >
              <span className={`w-8 h-8 border-2 border-[#2f3542] flex items-center justify-center font-black text-sm shrink-0 ${answers[currentIdx] === opt.label ? 'bg-[#2f3542] text-white' : 'bg-gray-100'}`}>
                {opt.label}
              </span>
              <span className="flex-1 text-sm font-bold leading-snug pt-1">{opt.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 py-6 mt-10 bg-white/50 backdrop-blur-sm border-t-2 border-[#2f3542] -mx-6 px-6 no-print">
        <div className="flex gap-4">
          <button onClick={handlePrev} disabled={currentIdx === 0} className={`flex-1 py-3 border-2 border-[#2f3542] font-black uppercase italic tracking-tighter text-sm ${currentIdx === 0 ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-white active:translate-y-0.5 shadow-[2px_2px_0_0_#2f3542]'}`}>上一步</button>
          <button onClick={handleNext} disabled={!answers[currentIdx]} className={`flex-[2] py-3 border-2 border-[#2f3542] font-black uppercase italic tracking-tighter text-sm ${!answers[currentIdx] ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-[#2f3542] text-white active:translate-y-0.5 shadow-[2px_2px_0_0_#2f3542]'}`}>{currentIdx === QUESTIONS.length - 1 ? '完成扫描' : '下一步'}</button>
        </div>
      </div>
    </div>
  );
};

const LoadingView = ({ text }: { text: string }) => (
  <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 no-print">
    <div className="w-48 h-48 border-4 border-[#2f3542] relative overflow-hidden bg-[#fafafa] flex items-center justify-center">
      <div className="scan-line" />
      <div className="text-center px-4 relative z-10">
        <div className="text-6xl mb-4 animate-bounce">🧨</div>
        <div className="text-[10px] font-black uppercase tracking-widest bg-[#2f3542] text-white px-3 mb-2 italic">处理中</div>
        <div className="text-sm font-black italic">{text}</div>
      </div>
    </div>
  </div>
);

const ResultView = ({ result, onGenerateAI, onReset }: { result: QuizResult; onGenerateAI: () => void; onReset: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const share = () => { alert("已为您生成报告图文，请截图保存分享！"); };

  const downloadPDF = async () => {
    if (!containerRef.current || isGenerating) return;
    setIsGenerating(true);
    await saveAsPDF(containerRef.current, `春节压力测试报告_${result.level.tag}.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="p-6 animate-slide-up pb-40">
      <div ref={containerRef} className="neo-box bg-white p-6 relative overflow-hidden mb-6 no-active">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff4757] text-white flex items-center justify-center font-black rotate-45 translate-x-8 -translate-y-8 text-[8px]">核心</div>
        
        <div className="text-center mb-6 border-b-2 border-[#2f3542] pb-6">
          <Badge>核心压力扫描结果</Badge>
          <div className="text-7xl font-black italic leading-none text-[#ff4757] my-4 tracking-tighter">{result.totalScore}</div>
          <div className="text-xl font-black italic uppercase tracking-tighter bg-[#2f3542] text-white px-4 py-2 inline-block">{result.level.tag}</div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {result.level.keywords.map(k => (
              <span key={k} className="px-2 py-0.5 bg-[#feca57] border-2 border-[#2f3542] font-black text-[10px] uppercase italic">#{k}</span>
            ))}
          </div>

          <div className="p-4 bg-[#f7f1e3] border-2 border-[#2f3542] font-bold text-base leading-relaxed italic text-center">
             " {result.level.description} "
          </div>

          <div className="space-y-4 pt-4">
            {[
              { l: '外部环境压力', s: result.dimensionScores.EXTERNAL, c: 'bg-[#ff4757]' },
              { l: '个人抗压特质', s: result.dimensionScores.INTERNAL, c: 'bg-[#2f3542]' },
              { l: '应对防御能力', s: 100 - result.dimensionScores.DEFENSE, c: 'bg-[#feca57]' }
            ].map(dim => (
              <div key={dim.l}>
                <div className="flex justify-between text-[10px] font-black mb-1 uppercase tracking-tighter opacity-70">
                  <span>{dim.l}</span>
                  <span>{dim.s}%</span>
                </div>
                <div className="h-2 border-2 border-[#2f3542] bg-white">
                  <div className={`${dim.c} h-full transition-all duration-1000`} style={{ width: `${dim.s}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t-2 border-[#2f3542] z-40 -mx-6 px-6 no-print">
        <div className="space-y-3">
          <button onClick={onGenerateAI} className="btn-primary w-full py-4 text-lg italic tracking-tighter flex items-center justify-center gap-4">
            <span>生成 AI 深度定制生存报告</span>
            <span className="text-[10px] font-black border-2 border-white px-1 italic">¥0.99</span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={downloadPDF} 
              disabled={isGenerating}
              className={`neo-box p-3 font-black uppercase italic tracking-tighter text-xs flex items-center justify-center gap-2 bg-[#feca57] ${isGenerating ? 'opacity-50' : ''}`}
            >
              {isGenerating ? '正在生成...' : '📥 下载 PDF'}
            </button>
            <button onClick={share} className="neo-box p-3 font-black uppercase italic tracking-tighter text-xs flex items-center justify-center gap-2 bg-[#2ecc71] text-white">🤳 分享朋友圈</button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8 no-print pb-6">
        <button onClick={onReset} className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-300">重新扫描</button>
      </div>
    </div>
  );
};

const AIReportView = ({ result, report, onReportGenerated, onBack }: { 
  result: QuizResult, report: string, onReportGenerated: (text: string) => void, onBack: () => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(!report);
  const streamRef = useRef(false);

  useEffect(() => {
    if (!report && !streamRef.current) {
      streamRef.current = true;
      setIsStreaming(true);
      generateAIAnalysisStream(result, (text) => {
        onReportGenerated(text);
      }).finally(() => {
        setIsStreaming(false);
      });
    }
  }, [result, report, onReportGenerated]);

  const sections = report.split(/\[(.*?)\]/).filter(s => s.trim());
  const formattedSections = [];
  if (sections.length > 1) {
    for (let i = 0; i < sections.length; i += 2) {
      formattedSections.push({ title: sections[i], content: sections[i + 1] });
    }
  } else if (report) {
    formattedSections.push({ title: "AI 智能测算中...", content: report });
  }

  const share = () => { alert("已生成分享素材，请截图本页分享！"); };
  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const downloadPDF = async () => {
    if (!containerRef.current || isGenerating || isStreaming) return;
    setIsGenerating(true);
    await saveAsPDF(containerRef.current, `春节AI深度避雷手册_${result.level.tag}.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="p-6 animate-slide-up pb-48">
      <button onClick={onBack} className="mb-6 font-black text-[10px] uppercase tracking-widest border-b-2 border-[#2f3542] pb-1 italic flex items-center gap-2 no-print">
        ← 返回数据看板
      </button>

      <div ref={containerRef}>
        <div className="mb-8 border-l-4 border-[#2f3542] pl-3">
          <Badge color="bg-[#ff4757] text-white">AI 深度情报报告</Badge>
          <h2 className="text-2xl font-black tracking-tighter italic uppercase mt-2 leading-none">
            春节避雷手册 <span className="text-[#ff4757]">V2.6</span>
          </h2>
        </div>

        <div className="space-y-8 mb-12">
          {formattedSections.length > 0 ? formattedSections.map((sec, idx) => (
            <div key={idx} className={`neo-box p-6 no-active ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f7f1e3]'}`}>
              <h3 className="text-base font-black italic bg-[#2f3542] text-white px-3 py-1 inline-block mb-4 uppercase tracking-tighter">
                {sec.title}
              </h3>
              <div className="text-[#2f3542] leading-relaxed font-bold text-sm whitespace-pre-wrap text-justify opacity-90">
                {sec.content}
              </div>
            </div>
          )) : (
            <div className="neo-box p-6 bg-white animate-pulse no-print">
              <div className="h-3 bg-gray-200 w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 w-full mb-3"></div>
              <div className="h-3 bg-gray-200 w-5/6"></div>
            </div>
          )}
          
          {isStreaming && (
            <div className="flex items-center gap-2 justify-center text-[10px] font-black italic text-[#ff4757] animate-pulse no-print">
              <span>AI 大脑解密中...</span>
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-[#ff4757] rounded-full"></span>
                <span className="w-1 h-1 bg-[#ff4757] rounded-full"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回到顶部 */}
      <div className="flex justify-center mb-10 no-print">
        <button 
          onClick={scrollToTop}
          className="neo-box px-5 py-2 font-black text-[10px] italic uppercase bg-white hover:bg-gray-50 flex items-center gap-2"
        >
          回到顶部 ↑
        </button>
      </div>

      {/* 底部按钮: 下载(Yellow), 分享(Green) */}
      <div className="sticky bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t-2 border-[#2f3542] z-40 -mx-6 px-6 no-print">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={downloadPDF} 
            disabled={isGenerating || isStreaming}
            className={`neo-box p-4 font-black uppercase italic tracking-tighter text-sm flex items-center justify-center gap-2 bg-[#feca57] ${isGenerating || isStreaming ? 'opacity-50' : ''}`}
          >
            {isGenerating ? '正在生成...' : '下载 AI 报告'}
          </button>
          <button onClick={share} className="neo-box p-4 font-black uppercase italic tracking-tighter text-sm flex items-center justify-center gap-2 bg-[#2ecc71] text-white">分享朋友圈</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState<'landing' | 'quiz' | 'calculating' | 'payBasic' | 'result' | 'payAI' | 'fullReport'>('landing');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [aiReport, setAiReport] = useState<string>('');

  const resetAll = () => {
    setStep('landing');
    setResult(null);
    setAiReport('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="content-container flex flex-col">
      <Header />
      <main className="flex-1">
        {step === 'landing' && <LandingView onStart={() => setStep('quiz')} />}
        {step === 'quiz' && <QuizView onComplete={(res) => {
          setResult(res);
          setStep('calculating');
          setTimeout(() => setStep('payBasic'), 1500);
        }} />}
        {step === 'calculating' && <LoadingView text="扫描春节压力偏向..." />}
        {step === 'payBasic' && (
          <PaymentGate
            title="扫描完成！数据已锁定"
            price="0.99"
            onPay={() => setStep('result')}
            paymentType="basic"
          />
        )}
        {step === 'result' && result && (
          <ResultView 
            result={result} 
            onGenerateAI={() => setStep('payAI')} 
            onReset={resetAll}
          />
        )}
        {step === 'payAI' && (
          <PaymentGate
            title="AI 深度生存情报已生成"
            price="0.99"
            onPay={() => setStep('fullReport')}
            onBack={() => setStep('result')}
            paymentType="ai"
          />
        )}
        {step === 'fullReport' && result && (
          <AIReportView 
            result={result} 
            report={aiReport}
            onReportGenerated={(text) => setAiReport(text)}
            onBack={() => { setStep('result'); window.scrollTo({ top: 0 }); }}
          />
        )}
      </main>
    </div>
  );
}
