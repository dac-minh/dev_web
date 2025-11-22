import { useEffect, useState, useMemo, useRef } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useParams } from "react-router-dom";
import { 
    CandlestickChart as CandlestickIcon, 
    AreaChart as AreaIcon, 
    ArrowUpRight, 
    ArrowDownRight, 
    Search,
    Info 
} from "lucide-react";

// *** IMPORT LIGHTWEIGHT-CHARTS ***
import { 
    createChart, 
    ColorType, 
    LineStyle, 
    IChartApi, 
    ISeriesApi, 
    UTCTimestamp,
    CrosshairMode
} from 'lightweight-charts';

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:8888";
const REFERENCE_DATE = new Date('2025-10-21T00:00:00');

// --- TYPES ---
type ChartDataPoint = {
    date: string; 
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
};

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type ChartType = 'area' | 'candlestick';

type CoinMetrics = {
    market_cap_usd: number | null;
    market_cap_change_pct_24h: number | null;
    volume24: number | null;
    volume_change_pct_24h: number | null;
    fdv: number | null;
    vol_per_mkt_cap_24h: number | null;
    total_supply: number | null;
    max_supply: number | null;
    circulating_supply: number | null;
    price_usd: number | null; 
};

type NewsItem = {
    title: string;
    url: string;
    source_id: string;
    published_on: string;
};

// --- HELPERS ---
const formatPrice = (v: number) => { 
    if (v == null || isNaN(v)) return "---"; 
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`; 
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`; 
    if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`; 
    return v < 10 ? `$${v.toFixed(4)}` : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; 
};

const formatDateAPI = (date: Date) => { 
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    return d.toISOString().split('T')[0]; 
};

const formatPercent = (v: number | null) => {
    if (v == null) return <span className="text-white/30 text-xs">--</span>;
    const isUp = v >= 0;
    const color = isUp ? 'text-emerald-400' : 'text-red-500';
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`flex items-center gap-0.5 text-xs font-bold ${color}`}>
            <Icon size={12} />
            {Math.abs(v).toFixed(2)}%
        </span>
    );
};

const formatLargeNumber = (v: number | null) => {
    if (v == null) return "---";
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const getStartDate = (range: TimeRange): string => {
    const endDate = new Date(REFERENCE_DATE.getTime());
    let startDate = new Date(REFERENCE_DATE.getTime());
    switch(range){
        case '1D': startDate.setDate(endDate.getDate() - 2); break; 
        case '1W': startDate.setDate(endDate.getDate() - 8); break;
        case '1M': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3M': startDate.setMonth(endDate.getMonth() - 3); break;
        case '1Y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        case 'ALL': startDate = new Date('2015-01-01'); break;
        default: startDate.setFullYear(endDate.getFullYear() - 1);
    }
    return formatDateAPI(startDate);
};

// --- COMPONENT: TRADING CHART (ĐÃ FIX CSS) ---
interface TradingChartProps {
    data: ChartDataPoint[];
    chartType: ChartType;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, chartType }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);

    // 1. Khởi tạo Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#6b7280' },
            grid: { vertLines: { color: '#ffffff0d' }, horzLines: { color: '#ffffff0d' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
            rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
            crosshair: { 
                mode: CrosshairMode.Normal, 
                vertLine: { labelVisible: false, color: '#ffffff30', style: LineStyle.Dotted }, 
                horzLine: { labelVisible: true, color: '#ffffff30', style: LineStyle.Dotted } 
            },
        });
        chartRef.current = chart;

        // SỬ DỤNG ResizeObserver ĐỂ TỰ ĐỘNG KHỚP KÍCH THƯỚC
        const resizeObserver = new ResizeObserver((entries) => {
            if (!chart || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });

        resizeObserver.observe(chartContainerRef.current);

        return () => { 
            resizeObserver.disconnect();
            chart.remove(); 
        };
    }, []);

    // 2. Cập nhật Dữ liệu & Loại Chart
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !data) return;

        if (seriesRef.current) { chart.removeSeries(seriesRef.current); seriesRef.current = null; }

        const formattedData = data
            .map(dp => ({
                time: (new Date(dp.date).getTime() / 1000) as UTCTimestamp, 
                open: dp.open, high: dp.high, low: dp.low, close: dp.close, value: dp.close
            }))
            .sort((a, b) => (a.time as number) - (b.time as number));

        if (chartType === 'candlestick') {
            const s = chart.addCandlestickSeries({
                upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444'
            });
            s.setData(formattedData);
            seriesRef.current = s;
        } else {
            const s = chart.addAreaSeries({
                lineColor: '#facc15', topColor: 'rgba(250, 204, 21, 0.2)', bottomColor: 'rgba(250, 204, 21, 0.0)', lineWidth: 2
            });
            s.setData(formattedData);
            seriesRef.current = s;
        }
        
        if (formattedData.length > 0) chart.timeScale().fitContent();
    }, [data, chartType]);

    // QUAN TRỌNG: Thêm `absolute inset-0` để chart luôn tràn đầy container
    return <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />;
};

// --- COMPONENT: STAT CARD ---
const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode; }) => (
  <div className="rounded-xl bg-[#1e2026] p-4 border border-white/5 hover:border-white/10 transition-all h-full flex flex-col justify-between group">
    <div className="flex items-center gap-1 text-gray-400 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <Info size={12} className="cursor-pointer hover:text-white opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="flex flex-col gap-1">
        <div className="text-white font-bold text-lg tracking-tight">{value}</div>
        {sub && <div>{sub}</div>}
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function CoinDetail() {
  const { coin_id = "bitcoin" } = useParams();
  
  const [metrics, setMetrics] = useState<CoinMetrics | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  const name = useMemo(() => coin_id.charAt(0).toUpperCase() + coin_id.slice(1).replace(/-/g, ' '), [coin_id]);
  const symbol = useMemo(() => coin_id.substring(0, 3).toUpperCase(), [coin_id]);

  useEffect(() => {
    setLoading(true);
    
    const fetchAllData = async () => {
        try {
            const startDateStr = getStartDate(timeRange);

            const [metricsRes, newsRes, chartRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/coins/${coin_id}/metrics`),
                fetch(`${API_BASE_URL}/api/coins/${coin_id}/news`),
                fetch(`${API_BASE_URL}/api/coins/${coin_id}/history?start_date=${startDateStr}&time_range=${timeRange}`)
            ]);
            
            if (metricsRes.ok) setMetrics(await metricsRes.json());
            if (newsRes.ok) {
                const newsData = await newsRes.json();
                setNews(Array.isArray(newsData) ? newsData : []);
            }
            if (chartRes.ok) {
                const d = await chartRes.json();
                setChartData(Array.isArray(d) ? d : []);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    fetchAllData();
  }, [coin_id, timeRange]);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white max-w-[1600px] mx-auto">
        
        {/* HEADER & CHART SECTION */}
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 flex flex-col min-h-[550px] border border-white/5">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-baseline gap-2">
                        {name} <span className="text-sm text-gray-400 font-normal bg-white/5 px-2 py-0.5 rounded">{symbol}</span>
                    </h1>
                    <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                            {loading || !metrics ? "..." : formatPrice(metrics.price_usd || 0)}
                        </span>
                        {!loading && metrics && (
                            <div className={`px-2 py-0.5 rounded text-sm font-bold flex items-center ${metrics.market_cap_change_pct_24h && metrics.market_cap_change_pct_24h >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {metrics.market_cap_change_pct_24h && metrics.market_cap_change_pct_24h >= 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                                {Math.abs(metrics.market_cap_change_pct_24h || 0).toFixed(2)}%
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-[#1e2026] p-1 rounded-lg border border-white/10">
                        <button onClick={()=>setChartType('area')} className={`p-2 rounded-md transition-all ${chartType==='area'?'bg-[#33353c] text-yellow-400 shadow-sm':'text-gray-500 hover:text-white'}`}><AreaIcon size={18}/></button>
                        <button onClick={()=>setChartType('candlestick')} className={`p-2 rounded-md transition-all ${chartType==='candlestick'?'bg-[#33353c] text-yellow-400 shadow-sm':'text-gray-500 hover:text-white'}`}><CandlestickIcon size={18}/></button>
                    </div>
                    <div className="flex bg-[#1e2026] p-1 rounded-lg border border-white/10 overflow-hidden">
                        {(['1D','1W','1M','3M','1Y','ALL'] as TimeRange[]).map(r=>(
                            <button key={r} onClick={()=>setTimeRange(r)} 
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timeRange===r?'bg-[#33353c] text-white shadow-sm':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* CHART AREA (ĐÃ FIX CSS RELATIVE) */}
            <div className="flex-1 w-full relative rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a0a] min-h-[350px]">
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-20 backdrop-blur-sm"><div className="animate-spin rounded-full size-10 border-4 border-white/10 border-t-yellow-400"/></div>}
                {!loading && chartData.length === 0 ? 
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2"><Search size={32} strokeWidth={1.5}/><span>No chart data available</span></div> : 
                    <TradingChart data={chartData} chartType={chartType} />
                }
            </div>
        </div>

        {/* METRICS & NEWS */}
        <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col gap-4">
                {loading || !metrics ? (
                    <div className="grid gap-4 grid-cols-2 animate-pulse">
                        {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl h-24 bg-[#1e2026] border border-white/5"></div>)}
                    </div>
                ) : (
                    <>
                        <div className="rounded-xl bg-[#1e2026] p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1 text-gray-400 text-xs uppercase tracking-wider mb-1">
                                    Market Cap <Info size={12}/>
                                </div>
                                <div className="text-2xl font-bold text-white">{formatPrice(metrics.market_cap_usd || 0)}</div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg bg-[#141414] border border-white/5`}>
                                {formatPercent(metrics.market_cap_change_pct_24h)}
                            </div>
                        </div>
                        <div className="grid gap-3 grid-cols-2">
                            <StatCard label="Volume (24h)" value={formatPrice(metrics.volume24 || 0)} sub={formatPercent(metrics.volume_change_pct_24h)} />
                            <StatCard label="FDV" value={formatPrice(metrics.fdv || 0)} />
                            <StatCard label="Vol/Mkt Cap" value={`${((metrics.vol_per_mkt_cap_24h || 0) * 100).toFixed(2)}%`} />
                            <StatCard label="Total Supply" value={formatLargeNumber(metrics.total_supply)} sub={<span className="text-xs text-gray-500">{symbol}</span>}/>
                            <StatCard label="Max Supply" value={formatLargeNumber(metrics.max_supply)} sub={<span className="text-xs text-gray-500">{symbol}</span>}/>
                            <StatCard label="Circulating" value={formatLargeNumber(metrics.circulating_supply)} sub={<span className="text-xs text-gray-500">{symbol}</span>}/>
                        </div>
                    </>
                )}
            </div>
            
            <div className="lg:col-span-7 rounded-2xl bg-[#1e2026] border border-white/5 flex flex-col">
                <div className="border-b border-white/5 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Latest News</h3>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Real-time</span>
                </div>
                <ul className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1 max-h-[450px]">
                    {loading ? (
                        <div className="p-6 text-sm text-gray-500 animate-pulse">Loading news...</div>
                    ) : news.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">No news found for this asset.</div>
                    ) : (
                        news.map((item, i) => (
                        <li key={i} className="p-5 hover:bg-white/5 transition-colors group">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                                <div className="text-white font-medium text-base group-hover:text-emerald-400 transition-colors line-clamp-2">{item.title}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded capitalize text-gray-400">{item.source_id || 'Crypto'}</span>
                                    <span>•</span>
                                    <span>{new Date(item.published_on).toLocaleDateString()}</span>
                                </div>
                            </a>
                        </li>
                        ))
                    )}
                </ul>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}