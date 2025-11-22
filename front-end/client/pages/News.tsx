import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Newspaper, Clock, ExternalLink, Flame } from "lucide-react";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:8888";

// --- TYPES ---
interface NewsItem {
  title: string;
  published_on: string;
  url: string;
  source_id: string;
  sentiment?: string;
  keywords?: string; // API trả về chuỗi keywords ví dụ: "bitcoin,ethereum,defi"
}

interface SentimentData {
  average_sentiment_score: number; // Từ -1 đến 1
  market_sentiment_label: string;
}

// --- HELPERS ---
const getCoinLogo = (symbol: string) => {
    // Map cơ bản các symbol phổ biến sang ID của CoinMarketCap để lấy ảnh
    const map: Record<string, string> = {
        "BTC": "1", "ETH": "1027", "USDT": "825", "BNB": "1839", "SOL": "5426", 
        "XRP": "52", "USDC": "3408", "ADA": "2010", "AVAX": "5805", "DOGE": "74", 
        "TRX": "1958", "LINK": "1975", "DOT": "6636", "MATIC": "3890", "LTC": "2",
        "SHIB": "5994", "DAI": "4943", "UNI": "7083", "SATS": "24077", "PEPE": "24478"
    };
    const id = map[symbol.toUpperCase()] || "1"; 
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
};

const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- COMPONENT: FEAR & GREED GAUGE ---
const FearGreedGauge = ({ score, label }: { score: number, label: string }) => {
    // Score từ API là -1 (Negative) đến 1 (Positive).
    // Map sang 0 - 100: ((score + 1) / 2) * 100
    const value0to100 = Math.max(0, Math.min(100, ((score + 1) / 2) * 100));
    
    // Tính góc quay kim: 0 = -90deg, 50 = 0deg, 100 = 90deg
    const rotation = (value0to100 / 100) * 180 - 90;

    let colorClass = "text-yellow-400";
    if (value0to100 > 60) colorClass = "text-emerald-400";
    if (value0to100 < 40) colorClass = "text-red-500";

    return (
        <div className="relative w-full h-48 rounded-3xl bg-[#141414] p-6 ring-1 ring-white/5 flex flex-col items-center justify-center shadow-lg overflow-hidden">
             {/* Background Blur Effect */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 ${value0to100 > 50 ? 'bg-emerald-500' : 'bg-red-500'} blur-[60px] opacity-20`}></div>

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 z-10">Market Sentiment</h3>
            
            <div className="relative w-[200px] h-[100px] z-10">
                {/* SVG Gauge */}
                <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />   {/* Red */}
                            <stop offset="50%" stopColor="#facc15" />   {/* Yellow */}
                            <stop offset="100%" stopColor="#10b981" />  {/* Green */}
                        </linearGradient>
                    </defs>
                    {/* Background Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#333" strokeWidth="12" strokeLinecap="round" />
                    {/* Colored Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-gradient)" strokeWidth="12" strokeLinecap="round" />
                    
                    {/* Needle Group */}
                    <g transform={`translate(100, 100) rotate(${rotation})`}>
                         {/* Needle */}
                        <path d="M -4 0 L 0 -75 L 4 0 Z" fill="white" />
                        <circle cx="0" cy="0" r="6" fill="#1f2937" stroke="white" strokeWidth="2" />
                    </g>
                </svg>
                
                {/* Value Text */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
                    <div className={`text-3xl font-extrabold ${colorClass} transition-colors duration-500`}>
                        {Math.round(value0to100)}
                    </div>
                    <div className="text-sm font-medium text-white/80 capitalize">{label}</div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: NEWS ITEM ---
const NewsCard = ({ item }: { item: NewsItem }) => {
    // Xử lý keywords để tạo ra các badge coin giả lập (nếu có)
    // Nếu keywords chứa 'bitcoin' -> hiện badge BTC
    const tags = useMemo(() => {
        const raw = item.keywords || "";
        const found: string[] = [];
        if (raw.toLowerCase().includes("bitcoin")) found.push("BTC");
        if (raw.toLowerCase().includes("ethereum")) found.push("ETH");
        if (raw.toLowerCase().includes("solana")) found.push("SOL");
        if (raw.toLowerCase().includes("binance")) found.push("BNB");
        if (raw.toLowerCase().includes("ripple")) found.push("XRP");
        if (raw.toLowerCase().includes("chainlink")) found.push("LINK");
        
        // Nếu không tìm thấy, lấy 2 keyword đầu tiên làm tag text
        if (found.length === 0 && raw.length > 0) {
            return raw.split(',').slice(0, 2).map(k => k.trim());
        }
        return found;
    }, [item.keywords]);

    return (
        <li className="group relative bg-[#141414] hover:bg-[#1e2026] border-b border-white/5 last:border-0 transition-all duration-200">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-5">
                 {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        {tags.slice(0, 3).map((tag, idx) => (
                             tag.length <= 5 ? (
                                <div key={idx} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-[11px] font-bold text-gray-300 border border-white/5">
                                    <img src={getCoinLogo(tag)} alt="" className="w-3.5 h-3.5 rounded-full" onError={(e:any) => e.target.style.display = 'none'}/>
                                    {tag}
                                </div>
                             ) : (
                                <span key={idx} className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase">{tag}</span>
                             )
                        ))}
                        {item.sentiment && (
                             <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${item.sentiment.toLowerCase() === 'positive' ? 'bg-emerald-500/10 text-emerald-400' : item.sentiment.toLowerCase() === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-gray-700/30 text-gray-400'}`}>
                                {item.sentiment}
                             </span>
                        )}
                    </div>
                    
                    <h3 className="text-base font-semibold text-white group-hover:text-yellow-400 transition-colors leading-snug mb-2 line-clamp-2">
                        {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                        <span className="flex items-center gap-1.5">
                            <Newspaper size={12} /> {item.source_id}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} /> {formatDate(item.published_on)}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-yellow-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            Read more <ExternalLink size={12}/>
                        </span>
                    </div>
                </div>
            </a>
        </li>
    );
};

// --- MAIN PAGE ---
export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [sentiment, setSentiment] = useState<SentimentData>({ average_sentiment_score: 0, market_sentiment_label: "Neutral" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [newsRes, sentimentRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/news/latest`),
                    fetch(`${API_BASE_URL}/api/market/sentiment`)
                ]);
                
                if (newsRes.ok) setNews(await newsRes.json());
                if (sentimentRes.ok) setSentiment(await sentimentRes.json());
            } catch (error) {
                console.error("Failed to fetch news data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="p-6 max-w-[1600px] mx-auto space-y-6">
                 {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Crypto News</h1>
                        <p className="text-gray-400 text-sm mt-1">Latest updates and market sentiment analysis</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-lg text-yellow-400 border border-yellow-400/20">
                        <Flame size={14} /> Real-time Feed
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 items-start">
                    {/* LEFT COLUMN: Sentiment & Trending (Chiếm 3 phần) */}
                    <div className="lg:col-span-3 space-y-6 sticky top-6">
                        {/* Gauge Chart */}
                        <FearGreedGauge 
                            score={sentiment.average_sentiment_score} 
                            label={sentiment.market_sentiment_label} 
                        />

                        {/* Mini Trending List (Giả lập hoặc lấy từ Top Uptrend) */}
                        <div className="rounded-3xl bg-[#141414] p-5 ring-1 ring-white/5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                Trending Coins <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            </h3>
                            <div className="space-y-3">
                                {['BTC', 'SOL', 'PEPE', 'SATS'].map(c => (
                                    <div key={c} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <img src={getCoinLogo(c)} className="w-6 h-6 rounded-full bg-white/10" alt=""/>
                                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{c}</span>
                                        </div>
                                        <div className="text-xs font-mono text-emerald-400">+2.4%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: News Feed (Chiếm 9 phần) */}
                    <div className="lg:col-span-9 rounded-3xl bg-[#141414] ring-1 ring-white/5 overflow-hidden min-h-[600px]">
                        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#141414]">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <Newspaper size={16} className="text-yellow-400" /> 
                                Market Headlines
                            </div>
                            <div className="text-xs text-gray-500">
                                Showing top {news.length} articles
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="p-10 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 bg-white/5 rounded w-3/4"></div>
                                            <div className="h-3 bg-white/5 rounded w-1/2"></div>
                                        </div>
                                        <div className="w-20 h-8 bg-white/5 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {news.map((item, index) => (
                                    <NewsCard key={index} item={item} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}