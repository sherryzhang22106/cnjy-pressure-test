
import React, { useState, useEffect } from 'react';
import { PRESSURE_LEVELS } from './constants';

// 模拟测评记录数据类型
interface AssessmentRecord {
  id: string;
  date: string;
  totalScore: number;
  level: number;
  levelTag: string;
  dimensionScores: {
    EXTERNAL: number;  // 外部围攻压力
    INTERNAL: number;  // 内心抗压指数
    DEFENSE: number;   // 防御反击能力
  };
  paymentStatus: {
    basic: boolean;
    ai: boolean;
  };
  userAgent: string;
}

// 模拟数据生成
const generateMockData = (): AssessmentRecord[] => {
  const records: AssessmentRecord[] = [];
  const userAgents = [
    'WeChat/8.0 (iPhone)',
    'Chrome/120 (Windows)',
    'Safari/17 (MacOS)',
    'WeChat/8.0 (Android)',
    'Chrome/120 (Android)'
  ];

  for (let i = 0; i < 50; i++) {
    const totalScore = Math.floor(Math.random() * 100);
    const level = PRESSURE_LEVELS.find(l => totalScore >= l.range[0] && totalScore <= l.range[1]) || PRESSURE_LEVELS[0];

    records.push({
      id: `CNY2026-${String(i + 1).padStart(5, '0')}`,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalScore,
      level: level.level,
      levelTag: level.tag,
      dimensionScores: {
        EXTERNAL: Math.floor(Math.random() * 100),
        INTERNAL: Math.floor(Math.random() * 100),
        DEFENSE: Math.floor(Math.random() * 100),
      },
      paymentStatus: {
        basic: Math.random() > 0.3,
        ai: Math.random() > 0.6,
      },
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// 统计卡片组件
const StatCard = ({ title, value, subtitle, color, icon }: {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: string;
}) => (
  <div className={`${color} border-2 border-[#2f3542] p-4 shadow-[3px_3px_0_0_#2f3542]`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-1">{title}</div>
        <div className="text-3xl font-black italic">{value}</div>
        {subtitle && <div className="text-xs font-bold mt-1 opacity-60">{subtitle}</div>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

// 围攻等级分布图
const LevelDistribution = ({ records }: { records: AssessmentRecord[] }) => {
  const distribution = PRESSURE_LEVELS.map(level => ({
    ...level,
    count: records.filter(r => r.level === level.level).length,
  }));

  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="bg-white border-2 border-[#2f3542] p-4 shadow-[3px_3px_0_0_#2f3542]">
      <h3 className="text-sm font-black italic uppercase tracking-tighter mb-4 border-b-2 border-[#2f3542] pb-2">
        🎯 围攻等级分布
      </h3>
      <div className="space-y-2">
        {distribution.map(level => (
          <div key={level.level} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#2f3542] text-white flex items-center justify-center text-[10px] font-black">
              {level.level}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black truncate max-w-[100px]">{level.tag}</span>
                <span className="text-[9px] text-gray-400">({level.range[0]}-{level.range[1]}分)</span>
              </div>
              <div className="h-4 bg-gray-100 border border-[#2f3542] relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    level.level <= 2 ? 'bg-[#2ecc71]' :
                    level.level <= 4 ? 'bg-[#feca57]' :
                    level.level <= 6 ? 'bg-[#ff9f43]' : 'bg-[#ff4757]'
                  }`}
                  style={{ width: `${(level.count / maxCount) * 100}%` }}
                />
                <span className="absolute right-1 top-0 text-[9px] font-black leading-4">{level.count}人</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 维度分析图
const DimensionAnalysis = ({ records }: { records: AssessmentRecord[] }) => {
  const avgExternal = Math.round(records.reduce((sum, r) => sum + r.dimensionScores.EXTERNAL, 0) / records.length);
  const avgInternal = Math.round(records.reduce((sum, r) => sum + r.dimensionScores.INTERNAL, 0) / records.length);
  const avgDefense = Math.round(records.reduce((sum, r) => sum + r.dimensionScores.DEFENSE, 0) / records.length);

  const dimensions = [
    { name: '外部围攻压力', value: avgExternal, color: 'bg-[#ff4757]', desc: '亲戚轰炸强度' },
    { name: '内心抗压指数', value: avgInternal, color: 'bg-[#2f3542]', desc: '心理承受能力' },
    { name: '防御反击能力', value: 100 - avgDefense, color: 'bg-[#feca57]', desc: '糊弄学水平' },
  ];

  return (
    <div className="bg-white border-2 border-[#2f3542] p-4 shadow-[3px_3px_0_0_#2f3542]">
      <h3 className="text-sm font-black italic uppercase tracking-tighter mb-4 border-b-2 border-[#2f3542] pb-2">
        📊 三维压力分析
      </h3>
      <div className="space-y-4">
        {dimensions.map(dim => (
          <div key={dim.name}>
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-xs font-black">{dim.name}</span>
                <span className="text-[9px] text-gray-400 ml-2">({dim.desc})</span>
              </div>
              <span className="text-sm font-black italic">{dim.value}%</span>
            </div>
            <div className="h-3 bg-gray-100 border border-[#2f3542]">
              <div
                className={`h-full ${dim.color} transition-all duration-700`}
                style={{ width: `${dim.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 测评记录表格
const RecordsTable = ({ records }: { records: AssessmentRecord[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(records.length / pageSize);
  const currentRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'bg-[#2ecc71] text-white';
    if (level <= 4) return 'bg-[#feca57] text-[#2f3542]';
    if (level <= 6) return 'bg-[#ff9f43] text-white';
    return 'bg-[#ff4757] text-white';
  };

  return (
    <div className="bg-white border-2 border-[#2f3542] shadow-[3px_3px_0_0_#2f3542] overflow-hidden">
      <div className="p-4 border-b-2 border-[#2f3542] bg-[#f7f1e3]">
        <h3 className="text-sm font-black italic uppercase tracking-tighter">
          📋 测评记录明细
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#2f3542] text-white">
            <tr>
              <th className="p-2 text-left font-black">测评编号</th>
              <th className="p-2 text-left font-black">测评时间</th>
              <th className="p-2 text-center font-black">围攻分数</th>
              <th className="p-2 text-center font-black">围攻等级</th>
              <th className="p-2 text-center font-black">外部压力</th>
              <th className="p-2 text-center font-black">抗压指数</th>
              <th className="p-2 text-center font-black">防御能力</th>
              <th className="p-2 text-center font-black">基础报告</th>
              <th className="p-2 text-center font-black">AI报告</th>
              <th className="p-2 text-left font-black">来源</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, idx) => (
              <tr key={record.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 font-mono font-bold">{record.id}</td>
                <td className="p-2 text-gray-600">
                  {new Date(record.date).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-2 text-center">
                  <span className="font-black text-lg italic text-[#ff4757]">{record.totalScore}</span>
                </td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-0.5 text-[9px] font-black ${getLevelColor(record.level)}`}>
                    LV.{record.level} {record.levelTag}
                  </span>
                </td>
                <td className="p-2 text-center font-bold">{record.dimensionScores.EXTERNAL}%</td>
                <td className="p-2 text-center font-bold">{record.dimensionScores.INTERNAL}%</td>
                <td className="p-2 text-center font-bold">{100 - record.dimensionScores.DEFENSE}%</td>
                <td className="p-2 text-center">
                  {record.paymentStatus.basic ? (
                    <span className="text-[#2ecc71] font-black">✓ 已购</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {record.paymentStatus.ai ? (
                    <span className="text-[#2ecc71] font-black">✓ 已购</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="p-2 text-[9px] text-gray-500 max-w-[100px] truncate">
                  {record.userAgent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="p-3 border-t-2 border-[#2f3542] bg-[#f7f1e3] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500">
          共 {records.length} 条记录
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-[10px] font-black border border-[#2f3542] bg-white disabled:opacity-30"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-[10px] font-black bg-[#2f3542] text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-[10px] font-black border border-[#2f3542] bg-white disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

// 收入统计
const RevenueStats = ({ records }: { records: AssessmentRecord[] }) => {
  const basicCount = records.filter(r => r.paymentStatus.basic).length;
  const aiCount = records.filter(r => r.paymentStatus.ai).length;
  const basicRevenue = basicCount * 0.99;
  const aiRevenue = aiCount * 0.99;
  const totalRevenue = basicRevenue + aiRevenue;

  return (
    <div className="bg-white border-2 border-[#2f3542] p-4 shadow-[3px_3px_0_0_#2f3542]">
      <h3 className="text-sm font-black italic uppercase tracking-tighter mb-4 border-b-2 border-[#2f3542] pb-2">
        💰 收入统计
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-2 bg-[#f7f1e3]">
          <span className="text-xs font-bold">基础报告收入</span>
          <span className="font-black italic">¥{basicRevenue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-[#f7f1e3]">
          <span className="text-xs font-bold">AI报告收入</span>
          <span className="font-black italic">¥{aiRevenue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[#2f3542] text-white">
          <span className="text-xs font-black">总收入</span>
          <span className="text-xl font-black italic">¥{totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-[10px] font-bold text-gray-500 mb-2">转化率分析</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 border border-gray-200">
            <div className="text-lg font-black italic text-[#ff4757]">
              {records.length > 0 ? Math.round((basicCount / records.length) * 100) : 0}%
            </div>
            <div className="text-[9px] font-bold text-gray-400">基础报告转化</div>
          </div>
          <div className="text-center p-2 bg-gray-50 border border-gray-200">
            <div className="text-lg font-black italic text-[#ff4757]">
              {basicCount > 0 ? Math.round((aiCount / basicCount) * 100) : 0}%
            </div>
            <div className="text-[9px] font-bold text-gray-400">AI报告追购率</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主管理后台组件
export default function Admin() {
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setRecords(generateMockData());
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f1e3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧧</div>
          <div className="text-sm font-black italic uppercase tracking-widest">加载数据中...</div>
        </div>
      </div>
    );
  }

  // 统计数据
  const todayRecords = records.filter(r =>
    new Date(r.date).toDateString() === new Date().toDateString()
  );
  const avgScore = Math.round(records.reduce((sum, r) => sum + r.totalScore, 0) / records.length);
  const highPressureCount = records.filter(r => r.level >= 6).length;
  const wechatCount = records.filter(r => r.userAgent.includes('WeChat')).length;

  return (
    <div className="min-h-screen bg-[#f7f1e3]">
      {/* 顶部导航 */}
      <header className="bg-[#2f3542] text-white p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff4757] flex items-center justify-center font-black italic text-xl border-2 border-white">
              P
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase tracking-tighter">春节围攻压力测评</h1>
              <p className="text-[9px] opacity-60 font-bold">管理后台 V2026</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#2ecc71] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold opacity-70">系统运行中</span>
            </div>
            <button className="px-3 py-1 bg-white/10 text-[10px] font-black uppercase hover:bg-white/20 transition">
              刷新数据
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="今日测评人数"
            value={todayRecords.length}
            subtitle="较昨日 +12%"
            color="bg-white"
            icon="📊"
          />
          <StatCard
            title="平均围攻分数"
            value={avgScore}
            subtitle="全体用户均值"
            color="bg-[#feca57]"
            icon="🎯"
          />
          <StatCard
            title="高压预警人数"
            value={highPressureCount}
            subtitle="LV.6 及以上"
            color="bg-[#ff4757] text-white"
            icon="🚨"
          />
          <StatCard
            title="微信端占比"
            value={`${Math.round((wechatCount / records.length) * 100)}%`}
            subtitle={`${wechatCount}/${records.length} 人`}
            color="bg-[#2ecc71] text-white"
            icon="📱"
          />
        </div>

        {/* 图表区域 */}
        <div className="grid md:grid-cols-3 gap-4">
          <LevelDistribution records={records} />
          <DimensionAnalysis records={records} />
          <RevenueStats records={records} />
        </div>

        {/* 记录表格 */}
        <RecordsTable records={records} />

        {/* 底部信息 */}
        <div className="text-center py-6 opacity-50">
          <p className="text-[10px] font-black uppercase tracking-widest">
            春节围攻压力测评 · 管理后台 · 2026 CNY Edition
          </p>
        </div>
      </main>
    </div>
  );
}
