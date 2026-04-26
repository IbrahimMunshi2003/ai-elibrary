import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBook, FiMessageSquare, FiStar, FiBookmark, 
  FiActivity, FiTrendingUp, FiArrowUpRight, FiClock 
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { apiService } from '../services/api';
import BookCard from '../components/BookCard';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-600`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
          <FiTrendingUp className="mr-1" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-foreground">{value}</h3>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, icon: Icon, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="text-primary-500 w-5 h-5" />}
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiService.getDashboardStats();
        setData(res);
      } catch (err) {
        toast.error("Failed to load analytics dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) return <Loader />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FiActivity className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold">No analytics data available yet</h2>
      <p className="text-muted-foreground max-w-xs">Start interacting with the library to see your activity dashboard grow.</p>
    </div>
  );

  const { total_books, total_comments, average_rating, pdf_opened, ai_queries, bookmarks, category_distribution, activity_trend, top_books, recent_activity } = data;

  return (
    <div className="w-full min-h-screen pb-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Library <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-lg">Real-time insights across your digital collection.</p>
        </div>
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Last synced: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard title="Total Books" value={total_books} icon={FiBook} color="blue" />
        <StatsCard title="Total Comments" value={total_comments} icon={FiMessageSquare} color="purple" trend="+12%" />
        <StatsCard title="Avg Rating" value={Number(average_rating).toFixed(1)} icon={FiStar} color="amber" />
        <StatsCard title="PDFs Opened" value={pdf_opened} icon={FiBook} color="emerald" trend="+5%" />
        <StatsCard title="AI Queries" value={ai_queries} icon={FiActivity} color="rose" />
        <StatsCard title="Saved Books" value={bookmarks} icon={FiBookmark} color="indigo" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Activity Trend - Line Chart */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <SectionHeader title="7-Day Activity History" icon={FiTrendingUp} subtitle="User interactions over the past week" />
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity_trend}>
                <defs>
                  <linearGradient id="colorPdf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="pdf_opens" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPdf)" strokeWidth={3} />
                <Area type="monotone" dataKey="ai_queries" stroke="#ec4899" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution - Bar Chart */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <SectionHeader title="Books per Category" icon={FiBook} subtitle="Distribution across library sections" />
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribution Pie & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {/* Category Share - Pie Chart */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <SectionHeader title="Category Share" subtitle="Percentage breakdown of types" />
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {category_distribution.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium">
                <div className="w-2 ha-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Books */}
        <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <SectionHeader title="Your Top Books" icon={FiStar} subtitle="Highest rated books from your collection" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {top_books.length > 0 ? (
              top_books.map((book) => (
                <Link to={`/books/${book.id}`} key={`title-${book.title}`} className="bg-background border border-border p-4 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-1 block">
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary-600 transition-colors">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-primary-600 font-medium bg-primary-500/10 px-3 py-1.5 rounded-lg w-fit">
                          <FiMessageSquare /> {book.comment_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                          <FiStar className="fill-amber-500" /> {Number(book.rating || book.average_rating || 0).toFixed(1)}
                      </div>
                    </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full py-10 text-center">No top-rated books to display from your collection yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
