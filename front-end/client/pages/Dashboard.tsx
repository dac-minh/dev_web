// Dashboard.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, ChevronDown, Search, CandlestickChart as CandlestickIcon, AreaChart as AreaIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// *** IMPORT lightweight-charts (Đã thêm Time, UTCTimestamp) ***
import { 
    createChart, 
    ColorType, 
    CandlestickSeriesPartialOptions, 
    AreaSeriesPartialOptions, 
    LineStyle, 
    IChartApi, 
    ISeriesApi,
    Time,           // <-- MỚI
    UTCTimestamp    // <-- MỚI: Dùng để định nghĩa kiểu thời gian
} from 'lightweight-charts';

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:8888";
const REFERENCE_DATE = new Date('2025-10-21T00:00:00');
const FALLBACK_LOGO = "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";

// --- TYPES ---
type Asset = { 
    coin_id: string; 
    name: string; 
    symbol: string; 
    price: number; 
    change_24h: number; 
    logo_url: string; 
};

type ChartDataPoint = {
    date: string; // ISO string date
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
};

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type ChartType = 'area' | 'candlestick';
type SparklineMap = { [coin_id: string]: number[] };

const STATIC_UP_CHART_DATA = [30, 50, 40, 60, 70];
const STATIC_DOWN_CHART_DATA = [70, 50, 60, 40, 30];

// --- HELPERS ---
const formatPrice = (v: number) => { if (v == null || isNaN(v)) return "---"; if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`; if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`; if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`; return v < 10 ? `$${v.toFixed(4)}` : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };
const formatDateAPI = (date: Date) => { const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); return d.toISOString().split('T')[0]; };

const getStartDate = (range: TimeRange): string => {
    const endDate = new Date(REFERENCE_DATE.getTime());
    let startDate = new Date(REFERENCE_DATE.getTime());
    switch(range){
        case '1D': startDate.setDate(endDate.getDate() - 2); break; 
        case '1W': startDate.setDate(endDate.getDate() - 7); break;
        case '1M': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3M': startDate.setMonth(endDate.getMonth() - 3); break;
        case '1Y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        case 'ALL': startDate = new Date('2015-01-01'); break;
        default: startDate.setFullYear(endDate.getFullYear() - 1);
    }
    return formatDateAPI(startDate);
};

// --- COMPONENTS ---

// SparklineChart
const SparklineChart = ({ data, color }: { data: number[], color: string }) => {
    const chartData = useMemo(() => data.map(price => ({ v: price })), [data]);
    return (
        <div className="mt-6 h-12 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <Area type="linear" dataKey="v" stroke={color} strokeWidth={3} fill={`url(#spark-${color.replace("#", "")})`} isAnimationActive={false} dot={false} activeDot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// MiniAssetCard
const MiniAssetCard = ({ a, sparkline }: { a: Asset, sparkline: number[] }) => {
    const trend = a.change_24h >= 0 ? 'up' : 'down';
    const color = trend === 'up' ? '#26a69a' : '#ef5350';
    const Icon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
    const sparklineData = (sparkline && sparkline.length > 0)
        ? sparkline
        : (trend === 'up' ? STATIC_UP_CHART_DATA : STATIC_DOWN_CHART_DATA);

    return (
        <Link to={`/chart/${a.coin_id}`} className="group flex flex-col justify-between rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 hover:bg-[#1a1a1a] transition-all">
            <div>
                <div className="flex justify-between mb-4">
                    <div className="flex gap-3 items-center">
                        <img 
                            src={a.logo_url || FALLBACK_LOGO} 
                            alt={a.name} 
                            className="size-12 rounded-full" 
                            onError={(e:any) => e.target.src = FALLBACK_LOGO}
                        />
                        <div>
                            <div className="font-bold text-lg text-white truncate max-w-[100px]">{a.name}</div>
                            <div className="text-sm text-white/50">{a.symbol}</div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-0.5 text-sm font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-500'}`}>
                        {a.change_24h > 0 ? "+" : ""}{a.change_24h.toFixed(2)}%<Icon size={16}/>
                    </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">${a.price < 10 ? a.price.toFixed(4) : a.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>
            <SparklineChart data={sparklineData} color={color} />
        </Link>
    );
};

// CoinDropdown
const CoinDropdown = ({ assets, selectedId, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const selected = assets.find((a: Asset) => a.coin_id === selectedId);
    const filtered = assets.filter((a: Asset) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] px-3 py-2 rounded-xl text-white font-semibold ring-1 ring-white/10 transition-all">
                {selected ? (
                    <>
                        <img 
                            src={selected.logo_url || FALLBACK_LOGO} 
                            className="size-6 rounded-full" 
                            alt=""
                            onError={(e:any) => e.target.src = FALLBACK_LOGO}
                        />
                        <span>{selected.name}</span>
                        <span className="text-white/50 text-sm">{selected.symbol}</span>
                    </>
                ) : "Select Coin"}
                <ChevronDown size={16} className={`transition-transform ${isOpen?'rotate-180':''}`}/>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 max-h-80 bg-[#1a1a1a] ring-1 ring-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-white/5 bg-[#1a1a1a] sticky top-0">
                        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/><input type="text" placeholder="Search..." className="w-full bg-[#0f0f0f] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none ring-1 ring-white/5 focus:ring-yellow-400/50" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} autoFocus/></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                        {filtered.map((a: Asset) => (
                            <button key={a.coin_id} onClick={()=>{onChange(a.coin_id);setIsOpen(false);setSearchTerm("")}} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${a.coin_id===selectedId?'bg-yellow-400/20 text-yellow-400':'text-white hover:bg-white/5'}`}>
                                <img 
                                    src={a.logo_url || FALLBACK_LOGO} 
                                    className="size-6 rounded-full" 
                                    alt=""
                                    onError={(e:any) => e.target.src = FALLBACK_LOGO}
                                />
                                <div className="text-left flex-1 truncate">
                                    <div className="font-medium truncate">{a.name}</div>
                                    <div className="text-xs opacity-50">{a.symbol}</div>
                                </div>
                                {a.coin_id===selectedId&&<div className="size-2 rounded-full bg-yellow-400"/>}
                            </button>
                        ))}
                        {filtered.length===0 && <div className="p-4 text-center text-sm text-white/40">No coins found</div>}
                    </div>
                </div>
            )}
        </div>
    );
};


// =======================================================
// *** COMPONENT TradingChart (ĐÃ FIX LỖI TYPESCRIPT) ***
// =======================================================
interface TradingChartProps {
    data: ChartDataPoint[];
    chartType: ChartType;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, chartType }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);

    // 1. Hook để tạo và dọn dẹp biểu đồ
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            // Cấu hình giao diện tối
            layout: {
                background: { type: ColorType.Solid, color: '#141414' },
                textColor: 'rgba(255, 255, 255, 0.6)',
            },
            grid: {
                vertLines: { color: '#FFFFFF1A' },
                horzLines: { color: '#FFFFFF1A' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderVisible: false,
            },
            rightPriceScale: {
                borderVisible: false,
            },
            crosshair: {
                mode: 1, // 0 = normal, 1 = magnet
                vertLine: {
                    color: '#FFFFFF80',
                    style: LineStyle.Dashed,
                },
                horzLine: {
                    color: '#FFFFFF80',
                    style: LineStyle.Dashed,
                },
            },
        });
        chartRef.current = chart;

        // Xử lý resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.resize(
                    chartContainerRef.current.clientWidth, 
                    chartContainerRef.current.clientHeight
                );
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        // Dọn dẹp
        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []); // Chỉ chạy 1 lần khi component mount

    // 2. Hook để cập nhật dữ liệu và loại biểu đồ
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !data) return;

        // Xóa series cũ nếu có
        if (seriesRef.current) {
            chart.removeSeries(seriesRef.current);
            seriesRef.current = null;
        }

        if (chartType === 'candlestick') {
            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            } as CandlestickSeriesPartialOptions);
            
            const formattedData = data.map(dp => ({
                // *** FIX: Ép kiểu về UTCTimestamp ***
                time: (new Date(dp.date).getTime() / 1000) as UTCTimestamp, 
                open: dp.open,
                high: dp.high,
                low: dp.low,
                close: dp.close,
            }));
            
            candlestickSeries.setData(formattedData);
            seriesRef.current = candlestickSeries;

        } else { // 'area'
            const areaSeries = chart.addAreaSeries({
                lineColor: '#fde047', // Màu vàng
                lineWidth: 2,
                topColor: 'rgba(253, 224, 71, 0.3)', // Màu fill vàng mờ
                bottomColor: 'rgba(253, 224, 71, 0.0)',
            } as AreaSeriesPartialOptions);

            const formattedData = data.map(dp => ({
                // *** FIX: Ép kiểu về UTCTimestamp ***
                time: (new Date(dp.date).getTime() / 1000) as UTCTimestamp,
                value: dp.close, // Biểu đồ đường/diện tích dùng giá đóng cửa
            }));
            
            areaSeries.setData(formattedData);
            seriesRef.current = areaSeries;
        }
        
        // Tự động điều chỉnh khung nhìn
        if (data.length > 0) {
            chart.timeScale().fitContent();
        }

    }, [data, chartType]); // Chạy lại khi data hoặc chartType thay đổi

    // Component chỉ render 1 cái div container
    return <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />;
};
// =======================================================


// --- MAIN COMPONENT ---
export default function Dashboard() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
    
    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

    const [loading, setLoading] = useState(true);
    const [marketChange1D, setMarketChange1D] = useState<number | null>(null);
    const [marketChange7D, setMarketChange7D] = useState<number | null>(null);
    const [marketChange30D, setMarketChange30D] = useState<number | null>(null);
    const [assetStartIndex, setAssetStartIndex] = useState(0);
    const [sparklineData, setSparklineData] = useState<SparklineMap>({});

    const top10Assets = useMemo(() => assets.slice(0, 10), [assets]);

    // useEffect 1
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/coins/top100`)
        .then(r => r.json())
        .then(d => {
            const mappedAssets = d.map((c: any) => ({
                coin_id: c.coin_id, 
                name: c.name,
                logo_url: c.logo_url,
                symbol: c.symbol,
                price: c.price,
                change_24h: c.change_24h || 0
            }));
            setAssets(mappedAssets);
            if (d.length > 0 && !selectedId) {
                setSelectedId(d[0].coin_id);
            }
        })
        .catch(e => console.error("Fetch Top 100 Error:", e));
        
        fetch(`${API_BASE_URL}/api/coins/sparklines`)
            .then(r => r.json())
            .then(d => {
                const map: SparklineMap = {};
                for (const item of d) {
                    map[item.coin_id] = item.sparkline_prices;
                }
                setSparklineData(map);
            })
            .catch(e => console.error("Fetch Sparklines Error:", e));

        fetch(`${API_BASE_URL}/api/market/cap_growth`).then(r=>r.json()).then(d=>setMarketChange1D(d.change_pct_market_1d)).catch(e=>console.error("Fetch 1D Error:", e));
        fetch(`${API_BASE_URL}/api/market/cap_growth_7d`).then(r=>r.json()).then(d=>setMarketChange7D(d.change_pct_market_7d)).catch(e=>console.error("Fetch 7D Error:", e));
        fetch(`${API_BASE_URL}/api/market/cap_growth_30d`).then(r=>r.json()).then(d=>setMarketChange30D(d.change_pct_market_30d)).catch(e=>console.error("Fetch 30D Error:", e));
    }, [selectedId]);

    
    // useEffect 2: Fetch chart data
    useEffect(() => {
        if (!selectedId) {
            setChartData([]);
            return;
        }

        setLoading(true);
        const startDateStr = getStartDate(timeRange);
        
        fetch(`${API_BASE_URL}/api/coins/${selectedId}/history?start_date=${startDateStr}&time_range=${timeRange}`)
            .then(r => {
                if (!r.ok) {
                    throw new Error(`HTTP error! status: ${r.status}`);
                }
                return r.json();
            })
            .then((data: ChartDataPoint[]) => {
                const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setChartData(sortedData);
            })
            .catch(e => {
                console.error("Lỗi khi tải dữ liệu biểu đồ:", e);
                setChartData([]);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [selectedId, timeRange]);


    const selectedInfo = useMemo(()=>assets.find(a=>a.coin_id===selectedId),[assets,selectedId]);
    
    // MarketChangeDisplay
    const MarketChangeDisplay = ({ label, value }: { label: string, value: number | null }) => {
        const isUp = value != null && value >= 0;
        const color = value == null ? 'text-white/50' : isUp ? 'text-emerald-400' : 'text-red-500';
        const Icon = isUp ? ArrowUpRight : ArrowDownRight;
        return (
            <div className="text-right">
                <div className="text-xs font-medium text-white/60 uppercase mb-1">{label}</div>
                {value == null ? (<div className="text-sm font-bold text-white/50 animate-pulse">...</div>) : (
                    <div className={`text-sm font-bold flex items-center justify-end gap-1 ${color}`}>
                        {isUp ? '+' : ''}{value.toFixed(2)}% <Icon size={16}/>
                    </div>
                )}
            </div>
        );
    };

    const handleAssetNext = () => {
        if (top10Assets.length > 4) {
            setAssetStartIndex(prev => Math.min(prev + 1, top10Assets.length - 4));
        }
    };
    const handleAssetPrev = () => {
        setAssetStartIndex(prev => Math.max(prev - 1, 0));
    };
    const renderSkeletons = () => {
        return Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col justify-between rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 h-[230px] opacity-50">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                        <div className="size-12 rounded-full bg-white/10 animate-pulse"></div>
                        <div>
                            <div className="h-5 bg-white/10 rounded-md w-20 animate-pulse"></div>
                            <div className="h-4 bg-white/10 rounded-md w-12 mt-2 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-5 bg-white/10 rounded-md w-16 animate-pulse"></div>
                </div>
                <div className="h-8 bg-white/10 rounded-md w-3/4 animate-pulse"></div>
                <div className="mt-6 h-12 w-full bg-white/10 rounded-md animate-pulse"></div>
            </div>
        ));
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 text-white">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-sm font-medium text-white/60 mb-1">TOTAL BALANCE</div>
                        <div className="text-5xl font-extrabold tracking-tight">$154,510<span className="text-3xl text-white/40">.00</span></div>
                    </div>
                    <div className="flex gap-6">
                        <MarketChangeDisplay label="Today" value={marketChange1D} />
                        <MarketChangeDisplay label="7 Days" value={marketChange7D} />
                        <MarketChangeDisplay label="30 Days" value={marketChange30D} />
                    </div>
                </div>

                {/* SLIDER */}
                <div className="flex items-center gap-2">
                    <button onClick={handleAssetPrev} disabled={assetStartIndex === 0} className="p-2 rounded-full bg-[#141414] hover:bg-[#1a1a1a] ring-1 ring-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {top10Assets.length > 0 ? (
                            top10Assets.slice(assetStartIndex, assetStartIndex + 4).map(a => (
                                <MiniAssetCard 
                                    key={a.coin_id} 
                                    a={a} 
                                    sparkline={sparklineData[a.coin_id] || []} 
                                />
                            ))
                        ) : (
                            renderSkeletons()
                        )}
                    </div>
                    <button onClick={handleAssetNext} disabled={assetStartIndex >= (top10Assets.length - 4) || top10Assets.length === 0} className="p-2 rounded-full bg-[#141414] hover:bg-[#1a1a1a] ring-1 ring-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <ChevronRight size={24} />
                    </button>
                </div>


                {/* Main Content */}
                <div className="grid lg:grid-cols-12 gap-6">
                    
                    {/* PORTFOLIO */}
                    <div className="lg:col-span-4 rounded-3xl bg-[#fde047] p-6 text-black h-fit sticky top-6">
                        <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-extrabold">My Portfolio</h2><MoreHorizontal className="opacity-50"/></div>
                        <div className="space-y-3">{[{n:'Bitcoin',c:'BTC',p:37,cl:'#f7931a'},{n:'Tether',c:'USDT',p:23,cl:'#26a17b'},{n:'Ethereum',c:'ETH',p:20,cl:'#627eea'}].map(i=><div key={i.c} className="flex items-center justify-between rounded-xl bg-black/90 px-4 py-3 text-white"><div className="flex items-center gap-3"><span className="inline-flex size-8 items-center justify-center rounded-full" style={{backgroundColor:i.cl}}/><div><div className="text-sm font-bold">{i.n}</div><div className="text-xs text-white/50">{i.c}</div></div></div><div className="text-sm font-bold">{i.p}%</div></div>)}</div>
                    </div>


                    {/* Main Chart */}
                    <div className="lg:col-span-8 rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 flex flex-col min-h-[500px]">
                        {/* Header Chart */}
                        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                            <div>
                                <CoinDropdown assets={assets} selectedId={selectedId} onChange={setSelectedId}/>
                                <div className="text-4xl font-extrabold mt-4">
                                    {selectedInfo ? (selectedInfo.price < 10 ? `$${selectedInfo.price.toFixed(4)}` : `$${selectedInfo.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`) : "---"}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex bg-black/40 p-1 rounded-full ring-1 ring-white/10">
                                    <button onClick={()=>setChartType('area')} className={`px-2 py-1 rounded-full text-white/60 hover:text-white ${chartType==='area'?'bg-yellow-400 text-black':''}`}><AreaIcon size={18}/></button>
                                    <button onClick={()=>setChartType('candlestick')} className={`px-2 py-1 rounded-full text-white/60 hover:text-white ${chartType==='candlestick'?'bg-yellow-400 text-black':''}`}><CandlestickIcon size={18}/></button>
                                </div>
                                <div className="flex gap-1 bg-black/40 p-1.5 rounded-full ring-1 ring-white/10">
                                    {(['1D','1W','1M','3M','1Y','ALL'] as TimeRange[]).map(r=><button key={r} onClick={()=>setTimeRange(r)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${timeRange===r?'bg-[#fde047] text-black':'text-white/60 hover:text-white hover:bg-white/5'}`}>{r}</button>)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Chart Container */}
                        <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#fde047]/5 to-transparent ring-1 ring-white/5 min-h-[300px]">
                            <TradingChart data={chartData} chartType={chartType} />

                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#141414]/80 z-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#fde047]"/>
                                </div>
                            )}

                            {!loading && chartData.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2">
                                    <Search size={32} className="opacity-50"/>
                                    <span>No data available</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}