import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tooltip, ResponsiveContainer, Treemap } from 'recharts';
import { Link } from "react-router-dom";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:8888";

// --- TYPES ---
type Asset = { 
    coin_id: string; name: string; symbol: string; price: number; change_24h: number; 
    market_cap: number; volume: number; rank?: number;
};

// Cập nhật Type mới cho Uptrend (khớp với API models.py)
type TopUptrendAsset = {
    coin_id: string;
    name: string;
    symbol: string;
    price: number;
    percent_change: number;
};

type TableFilter = 10 | 50 | 100;

// --- HELPERS ---
const getCoinLogo = (id: string) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${{"bitcoin":"1","ethereum":"1027","tether":"825","bnb":"1839","solana":"5426","xrp":"52","usdc":"3408","cardano":"2010","avalanche":"5805","dogecoin":"74","tron":"1958","chainlink":"1975","polkadot":"6636","polygon":"3890","litecoin":"2","hedera-hashgraph":"4642"}[id]||"1"}.png`;
const formatPrice = (v: number) => { if (v == null || isNaN(v)) return "---"; if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`; if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`; if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`; return v < 10 ? `$${v.toFixed(4)}` : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };

const formatPercent = (v: number | null) => {
    if (v == null) return <span className="text-white/50">N/A</span>;
    const isUp = v >= 0;
    const color = isUp ? 'text-emerald-400' : 'text-red-500';
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`flex items-center gap-1 font-medium ${color}`}>
            {isUp ? <Icon size={14} /> : <Icon size={14} />}
            {Math.abs(v).toFixed(2)}%
        </span>
    );
};

// --- CUSTOM TREEMAP CONTENT ---
const CustomTreemapContent = (props: any) => {
    const { depth, x, y, width, height, symbol, change_24h } = props;
    if (depth > 1) return null; 
    const change = change_24h || 0; 
    const trendColor = change >= 0 ? '#26a69a' : '#ef5350';
    const opacity = Math.min(1, 0.3 + Math.abs(change) / 10);
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} style={{ fill: trendColor, opacity: opacity, stroke: '#0a0a0a', strokeWidth: 2 }} />
            {width > 50 && height > 40 && (
                <>
                    <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={Math.min(width / 5, 14)} fontWeight="bold" className="pointer-events-none">{symbol}</text>
                    <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle" fill="#fff" fontSize={Math.min(width / 6, 10)} opacity={0.9} className="pointer-events-none">{change > 0 ? '+' : ''}{change.toFixed(2)}%</text>
                </>
            )}
        </g>
    );
};

// --- COMPONENT THẺ STAT ---
const StatCard = ({ title, value, isLoading }: { title: string, value: number | null, isLoading: boolean }) => {
    const isUp = value != null && value >= 0;
    const color = value == null ? 'text-white/50' : isUp ? 'text-emerald-400' : 'text-red-500';
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    return (
        <div className="rounded-2xl bg-[#141414] p-6 ring-1 ring-white/5">
            <div className="text-sm font-medium text-white/60 mb-2">{title}</div>
            {isLoading ? (<div className="h-8 w-24 bg-white/10 animate-pulse rounded-md"></div>) : (
                <div className={`text-3xl font-bold flex items-center gap-2 ${color}`}>
                    {value == null ? "N/A" : (<>{isUp ? '+' : ''}{value.toFixed(2)}%<Icon size={24} /></>)}
                </div>
            )}
        </div>
    );
};

// --- COMPONENT UPTREND MỚI (Có bộ lọc) ---
const TopUptrendCard = () => {
    const [data, setData] = useState<TopUptrendAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'1D' | '1W' | '1M'>('1D');

    useEffect(() => {
        setIsLoading(true);
        // Gọi API với tham số type
        fetch(`${API_BASE_URL}/api/market/uptrend?type=${filter}`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((d) => {
                setData(Array.isArray(d) ? d : []);
            })
            .catch(e => console.error("Fetch Uptrend Error:", e))
            .finally(() => setIsLoading(false));
    }, [filter]);

    return (
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Top 5 Coin Uptrend</h2>
                {/* Nút lọc */}
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg ring-1 ring-white/10">
                    {(['1D', '1W', '1M'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                filter === f ? 'bg-[#fde047] text-black' : 'text-white/60 hover:text-white'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-3">
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-white/10"></div>
                                <div className="space-y-1"><div className="h-4 w-20 bg-white/10 rounded"></div><div className="h-3 w-12 bg-white/10 rounded"></div></div>
                            </div>
                            <div className="h-5 w-16 bg-white/10 rounded"></div>
                        </div>
                    ))
                ) : (
                    data.map((coin) => (
                        <Link to={`/chart/${coin.coin_id}`} key={coin.coin_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={getCoinLogo(coin.coin_id)} 
                                    alt={coin.name} 
                                    className="size-8 rounded-full" 
                                    onError={(e:any) => e.target.src = "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"}
                                />
                                <div className="overflow-hidden">
                                    <div className="font-semibold text-sm text-white group-hover:text-yellow-400 truncate w-28" title={coin.name}>
                                        {coin.name}
                                    </div>
                                    <div className="text-xs text-white/50 flex items-center gap-1">
                                        {coin.symbol} <span className="text-white/20">|</span> {formatPrice(coin.price)}
                                    </div>
                                </div>
                            </div>
                            {formatPercent(coin.percent_change)}
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

// --- COMPONENT BẢNG XẾP HẠNG ---
const CoinRankTable = ({ data, isLoading }: { data: Asset[], isLoading: boolean }) => {
    const [filter, setFilter] = useState<TableFilter>(100);
    const filteredData = useMemo(() => { return data.filter(coin => coin.rank && coin.rank <= filter); }, [data, filter]);

    return (
        <div className="rounded-3xl bg-[#14141a] ring-1 ring-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-[#14141a]">
                <h2 className="text-lg font-bold text-white">Market Cap Ranking</h2>
                <div className="flex gap-1 bg-black/40 p-1.5 rounded-full ring-1 ring-white/10">
                    {(['10','50','100'] as const).map(f => {
                        const val = parseInt(f) as TableFilter;
                        return (<button key={f} onClick={() => setFilter(val)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === val ? 'bg-[#fde047] text-black' : 'text-white/60 hover:text-white'}`}>Top {f}</button>);
                    })}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-[#1a1a1a] text-xs text-white/50 uppercase">
                        <tr>
                            <th className="px-6 py-4">#</th><th className="px-6 py-4">Asset</th><th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Change (1D)</th><th className="px-6 py-4">Market Cap</th><th className="px-6 py-4">Volume (24h)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? ([...Array(10)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td className="px-6 py-4"><div className="h-4 w-6 bg-white/10 rounded"></div></td>
                                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="size-8 rounded-full bg-white/10"></div><div className="h-4 w-24 bg-white/10 rounded"></div></div></td>
                                <td className="px-6 py-4"><div className="h-4 w-20 bg-white/10 rounded"></div></td><td className="px-6 py-4"><div className="h-4 w-16 bg-white/10 rounded"></div></td>
                                <td className="px-6 py-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td><td className="px-6 py-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td>
                            </tr>
                        ))) : (
                            filteredData.map((coin) => (
                                <tr key={coin.coin_id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm text-white/50">{coin.rank}</td>
                                    <td className="px-6 py-4">
                                        <Link to={`/chart/${coin.coin_id}`} className="flex items-center gap-3 group">
                                            <img src={getCoinLogo(coin.coin_id)} alt={coin.name} className="size-8 rounded-full" onError={(e:any) => e.target.src = "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"} />
                                            <div><div className="font-semibold text-sm text-white group-hover:text-yellow-400">{coin.name}</div><div className="text-xs text-white/50">{coin.symbol}</div></div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-white">{formatPrice(coin.price)}</td>
                                    <td className="px-6 py-4 text-sm">{formatPercent(coin.change_24h)}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-white/80">{formatPrice(coin.market_cap)}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-white/80">{formatPrice(coin.volume)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ChartOverview() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(true);
    
    const [loadingStats, setLoadingStats] = useState(true);
    const [statApiGrowth, setStatApiGrowth] = useState<number | null>(null);
    const [statCalcGrowth, setStatCalcGrowth] = useState<number | null>(null);
    const [statVolumeGrowth, setStatVolumeGrowth] = useState<number | null>(null);
    const [statSentiment, setStatSentiment] = useState<number | null>(null);

    // Tải Top 100 coin
    useEffect(() => {
        setLoadingAssets(true);
        fetch(`${API_BASE_URL}/api/coins/top100`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(d=>{
                const data = Array.isArray(d) ? d : []; 
                setAssets(data.map((c:any)=>({
                    coin_id: c.coin_id, 
                    name: c.name,
                    symbol: c.symbol || c.name.substring(0,3).toUpperCase(), 
                    price: c.price,
                    change_24h: c.change_24h,
                    market_cap: c.market_cap || 1, 
                    volume: c.volume || 0, 
                    rank: c.rank,
                })));
            }).catch(e=>console.error("Fetch Top 100 Error:", e)).finally(() => setLoadingAssets(false));
    }, []);

    // Tải 4 thẻ chỉ số
    useEffect(() => {
        setLoadingStats(true);
        const fetchStats = async () => {
            try {
                const [apiGrowth, calcGrowth, volGrowth, sentiment] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/market/cap_growth`).then(r => r.json()).catch(()=>({})),
                    fetch(`${API_BASE_URL}/api/market/cap_growth_calc`).then(r => r.json()).catch(()=>({})),
                    fetch(`${API_BASE_URL}/api/market/volume_growth`).then(r => r.json()).catch(()=>({})),
                    fetch(`${API_BASE_URL}/api/market/sentiment`).then(r => r.json()).catch(()=>({}))
                ]);
                setStatApiGrowth(apiGrowth?.change_pct_market_1d ?? null);
                setStatCalcGrowth(calcGrowth?.change_pct_market_cap_calc ?? null);
                setStatVolumeGrowth(volGrowth?.volume_growth_pct ?? null);
                setStatSentiment(sentiment?.average_sentiment_score ?? null);
            } catch (e) { console.error("Fetch Stats Error:", e); }
            finally { setLoadingStats(false); }
        };
        fetchStats();
    }, []);

    return (
        <DashboardLayout>
            <div className="p-6 text-white space-y-6">
                <h1 className="text-3xl font-bold text-white">Market Overview</h1>
                
                {/* --- HEATMAP & UPTREND --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 flex flex-col min-h-[400px]">
                        <h2 className="text-lg font-bold mb-4">Market Cap Heatmap (100)</h2>
                        <div className="flex-1 w-full relative">
                            {loadingAssets ? (
                                <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#fde047]"/></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <Treemap 
                                        data={assets} dataKey="market_cap" aspectRatio={16 / 9}
                                        isAnimationActive={false} content={<CustomTreemapContent />}
                                    >
                                        <Tooltip content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-[#000000cc] border border-white/10 rounded-xl p-3 backdrop-blur-sm text-white text-xs z-50">
                                                        <div className="font-bold mb-2 text-yellow-400">{data.name}</div>
                                                        <p>Market Cap: {formatPrice(data.market_cap)}</p>
                                                        <p>Change (24h): <span style={{ color: data.change_24h >= 0 ? '#26a69a' : '#ef5350' }}>{data.change_24h != null ? data.change_24h.toFixed(2) : 'N/A'}%</span></p>
                                                    </div>
                                                );
                                            } return null;
                                        }} />
                                    </Treemap>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                        <TopUptrendCard />
                    </div>
                </div>

                {/* --- 4 CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Global Market Cap Change (API)" value={statApiGrowth} isLoading={loadingStats} />
                    <StatCard title="Global Market Cap Change (Calc)" value={statCalcGrowth} isLoading={loadingStats} />
                    <StatCard title="Volume Change (24h)" value={statVolumeGrowth} isLoading={loadingStats} />
                    <StatCard title="Market Sentiment Score" value={statSentiment} isLoading={loadingStats} />
                </div>

                {/* --- TABLE --- */}
                <div className="w-full">
                    <CoinRankTable data={assets} isLoading={loadingAssets} />
                </div>
            </div>
        </DashboardLayout>
    );
}