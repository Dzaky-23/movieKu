'use client';

import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Play, Info, Plus, ChevronRight, X, Heart, Star, Settings } from 'lucide-react';
import { api, Content, Profile } from '@/service/api';

export default function Home() {
  // --- STATE ---
  const [user, setUser] = useState<any>(null); // Supabase Auth User
  const [profile, setProfile] = useState<Profile | null>(null); // Tabel 'profiles'

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Data State
  const [heroMovie, setHeroMovie] = useState<Content | null>(null);
  const [trending, setTrending] = useState<Content[]>([]);
  const [animeList, setAnimeList] = useState<Content[]>([]);
  const [drakorList, setDrakorList] = useState<Content[]>([]);
  const [personalizedList, setPersonalizedList] = useState<Content[]>([]);
  const [scrolled, setScrolled] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Cek User saat load
    checkUserSession();

    // 2. Navbar scroll effect
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // 3. Load Data Konten (Umum)
    fetchDashboardData();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update personalized list kalau profile user ke-load dan punya interests
  useEffect(() => {
    if (profile && profile.interests && profile.interests.length > 0) {
      fetchPersonalizedData(profile.interests);
    }
  }, [profile]);

  // --- LOGIC BACKEND ---

  async function checkUserSession() {
    setLoadingUser(true);
    const currentUser = await api.auth.getCurrentUser();

    if (currentUser) {
      setUser(currentUser);
      // Ambil detail profile (interests, name, dll)
      const { profile } = await api.user.getProfile(currentUser.id);
      if (profile) setProfile(profile);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoadingUser(false);
  }

  async function fetchDashboardData() {
    // Hero Movie (Ambil trending, lalu acak 1)
    const { data: trendData } = await api.content.getTrending(15);
    if (trendData && trendData.length > 0) {
      // Filter agar hero image valid (punya backdrop/poster)
      const validHero = trendData.filter(t => t.backdrop_path || t.poster_path);
      if (validHero.length > 0) {
        setHeroMovie(validHero[Math.floor(Math.random() * Math.min(5, validHero.length))]);
      }
      setTrending(trendData);
    }

    // Row: Anime
    const { data: animeData } = await api.content.getByCategory('Anime', 15);
    setAnimeList(animeData);

    // Row: Drakor
    const { data: drakorData } = await api.content.getByCategory('Korean Drama', 15);
    setDrakorList(drakorData);
  }

  async function fetchPersonalizedData(interests: string[]) {
    // LOGIC SEMENTARA:
    // Ambil berdasarkan kategori yang disukai user.

    let mixedResults: Content[] = [];

    // Simple round-robin fetch berdasarkan interest
    for (const interest of interests) {
      let data: Content[] = [];

      if (interest === 'Anime') {
        const res = await api.content.getByCategory('Anime', 5);
        data = res.data;
      } else if (interest === 'K-Drama') {
        const res = await api.content.getByCategory('Korean Drama', 5);
        data = res.data;
      } else {
        // Fallback: Ambil trending buat genre lain
        const res = await api.content.getTrending(5);
        data = res.data;
      }

      mixedResults = [...mixedResults, ...data];
    }

    // Hapus duplikat
    const uniqueIds = new Set();
    const uniqueList = mixedResults.filter(item => {
      const isDuplicate = uniqueIds.has(item.id);
      uniqueIds.add(item.id);
      return !isDuplicate;
    });

    setPersonalizedList(uniqueList);
  }

  // --- HANDLERS AUTH ---
  const handleAuth = async (e: React.FormEvent, email: string, pass: string, name?: string) => {
    e.preventDefault();

    let error = null;
    let resultUser = null;

    if (authMode === 'login') {
      const res = await api.auth.login(email, pass);
      error = res.error;
      resultUser = res.user;
    } else {
      if (!name) return alert('Name required');
      const res = await api.auth.register(email, pass, name);
      error = res.error;
      resultUser = res.user;
    }

    if (error) {
      alert(error.message);
    } else if (resultUser) {
      // Sukses Login/Register
      setShowAuthModal(false);
      await checkUserSession(); // Reload session

      // Kalau register baru, langsung buka onboarding
      if (authMode === 'register') {
        setShowOnboarding(true);
      }
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setProfile(null);
    setPersonalizedList([]); // Clear data personal
  };

  const saveInterests = async (selectedInterests: string[]) => {
    if (!user) return;

    const { profile: updatedProfile, error } = await api.user.updateInterests(user.id, selectedInterests);

    if (error) {
      alert('Gagal menyimpan interest');
    } else if (updatedProfile) {
      setProfile(updatedProfile); // Update UI
      setShowOnboarding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-red-500 selection:text-white">

      {/* --- FANTASY NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b border-fantasy-gold/20 ${scrolled ? 'bg-fantasy-teal/95 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-gradient-to-b from-fantasy-teal to-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-3 flex items-center justify-between">

          {/* Logo Area */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fantasy-gold flex items-center justify-center shadow-[0_0_10px_#d4af37]">
              <span className="text-fantasy-teal font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-fantasy-gold tracking-widest drop-shadow-md">
              MOVIEKU
            </h1>
          </div>

          {/* Center Menu - RPG Style */}
          <ul className="hidden md:flex gap-8 text-sm text-fantasy-gold-light/80 font-display tracking-widest uppercase">
            {['Home', 'Grimoires', 'Artifacts', 'Tavern'].map((item) => (
              <li key={item} className="relative group cursor-pointer hover:text-fantasy-gold transition-colors duration-300">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-fantasy-gold group-hover:w-full transition-all duration-300"></span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-6">
            <Settings className="w-5 h-5 text-fantasy-gold-light/80 cursor-pointer hover:text-fantasy-gold hover:rotate-90 transition-all duration-500" />

            {loadingUser ? (
              <div className="w-8 h-8 rounded-full border border-fantasy-gold/30 animate-pulse bg-fantasy-teal-light" />
            ) : user ? (
              <div className="group relative flex items-center gap-3 cursor-pointer">
                <span className="text-xs font-display font-bold text-fantasy-gold/90 hidden sm:block tracking-widest uppercase">
                  {profile?.name || 'Traveler'}
                </span>
                <div className="relative">
                  <div className="absolute inset-0 bg-fantasy-gold blur-sm opacity-20 group-hover:opacity-50 transition-opacity"></div>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || user.email}`}
                    className="relative w-9 h-9 rounded-full border-2 border-fantasy-gold/50 group-hover:border-fantasy-gold transition-colors"
                    alt="Profile"
                  />
                </div>

                {/* Dropdown Menu - Scroll Style */}
                <div className="absolute top-full right-0 mt-4 w-56 bg-fantasy-teal border border-fantasy-gold/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-none opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 transform origin-top-right">
                  {/* Decorative Corner */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fantasy-gold"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fantasy-gold"></div>

                  <div className="p-1">
                    <button onClick={() => setShowOnboarding(true)} className="w-full text-left text-xs px-4 py-3 hover:bg-fantasy-gold/10 text-fantasy-gold-light hover:text-fantasy-gold font-display uppercase tracking-wider border-b border-fantasy-gold/10">
                      Attune Personality
                    </button>
                    <button onClick={handleLogout} className="w-full text-left text-xs px-4 py-3 hover:bg-red-900/20 text-red-400 hover:text-red-300 flex items-center gap-2 font-display uppercase tracking-wider">
                      <LogOut size={14} /> Depart
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-6 py-1.5 border border-fantasy-gold text-fantasy-gold font-display text-xs font-bold tracking-widest hover:bg-fantasy-gold hover:text-fantasy-teal transition-all duration-300 uppercase relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-fantasy-gold"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-fantasy-gold"></div>
                Join Guild
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      {heroMovie && (
        <div className="relative min-h-screen w-full flex items-center justify-center pt-20 pb-10 overflow-hidden">

          {/* Background Layer with Mask */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-fantasy-teal/60 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-fantasy-teal via-fantasy-teal/50 to-transparent z-20"></div>
            <img
              src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path || heroMovie.poster_path}`}
              alt={heroMovie.title}
              className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
            />
          </div>

          {/* Main Hero Content - Centered Card Style */}
          <div className="relative z-30 max-w-5xl w-full mx-auto px-4 flex flex-col items-center text-center space-y-6">

            {/* Ornament Top */}
            <div className="flex items-center gap-4 opacity-80">
              <div className="h-[1px] w-12 md:w-24 bg-gradient-to-r from-transparent to-fantasy-gold"></div>
              <div className="w-3 h-3 rotate-45 border border-fantasy-gold"></div>
              <span className="text-fantasy-gold font-display text-xs md:text-sm tracking-[0.2em] uppercase">
                FEATURED CHRONICLE
              </span>
              <div className="w-3 h-3 rotate-45 border border-fantasy-gold"></div>
              <div className="h-[1px] w-12 md:w-24 bg-gradient-to-l from-transparent to-fantasy-gold"></div>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-fantasy-gold-light to-fantasy-gold-dark drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-tight max-w-4xl">
              {heroMovie.title.toUpperCase()}
            </h1>

            <div className="flex items-center gap-3 text-fantasy-paper/80 font-display text-sm tracking-widest border border-fantasy-gold/20 bg-fantasy-teal/50 backdrop-blur-md px-6 py-2 rounded-full">
              <span>{heroMovie.media_type === 'tv' ? 'SAGA' : 'TALE'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-fantasy-gold"></span>
              <span>{heroMovie.release_date?.split('-')[0]}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-fantasy-gold"></span>
              <div className="flex items-center text-fantasy-gold gap-1">
                <Star size={14} fill="#d4af37" />
                <span>{Math.round(heroMovie.vote_average * 10)} / 100</span>
              </div>
            </div>

            <p className="text-lg md:text-xl text-fantasy-paper/90 max-w-2xl leading-relaxed font-light drop-shadow-md italic">
              "{heroMovie.overview}"
            </p>

            <div className="flex gap-6 mt-8">
              <button className="relative px-8 py-3 bg-fantasy-gold-dark/20 border border-fantasy-gold/60 text-fantasy-gold font-display font-bold tracking-[0.2em] hover:bg-fantasy-gold hover:text-black transition-all duration-300 group overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  <Play size={18} className="fill-current" /> BEGIN JOURNEY
                </span>
                <div className="absolute inset-0 bg-fantasy-gold transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 z-0"></div>
              </button>

              <button className="px-8 py-3 bg-transparent border border-fantasy-paper/30 text-fantasy-paper font-display font-bold tracking-[0.2em] hover:border-fantasy-gold hover:text-fantasy-gold transition-all duration-300 flex items-center gap-3">
                <Info size={18} /> LORE
              </button>
            </div>
          </div>

        </div>
      )}

      <div className="relative z-10 space-y-20 pb-20 px-4 md:px-12">

        {/* Row 1: Personalized */}
        {user && profile && profile.interests && profile.interests.length > 0 && personalizedList.length > 0 && (
          <ContentRow
            title={`Quest Board: ${profile.name}`}
            subtitle={`Matches your affinity for ${profile.interests.slice(0, 3).join(', ')}`}
            items={personalizedList}
          />
        )}

        {/* Row 2: Trending */}
        <ContentRow title="Realm Favorites" subtitle="Tales most travelled by others" items={trending} />

        {/* Row 3: Anime */}
        <ContentRow title="Mythical Animations" items={animeList} isPoster={true} />

        {/* Row 4: K-Drama */}
        <ContentRow title="Eastern Kingdoms" items={drakorList} />

      </div>

      {/* --- MODALS --- */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          switchMode={(m) => setAuthMode(m)}
          onClose={() => setShowAuthModal(false)}
          onSubmit={handleAuth}
        />
      )}

      {showOnboarding && profile && (
        <OnboardingModal
          currentInterests={profile.interests || []}
          onSave={saveInterests}
        />
      )}

    </div>
  );
}

// --- SUB-COMPONENT: CONTENT ROW (HORIZONTAL SCROLL) ---
function ContentRow({ title, subtitle, items, isPoster = false }: { title: string, subtitle?: string, items: Content[], isPoster?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = window.innerWidth * 0.7;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="group relative">
      {/* Section Header */}
      <div className="mb-6 flex items-end gap-4 border-b border-fantasy-gold/20 pb-2 mx-1">
        <div>
          <h2 className="text-xl md:text-3xl font-display font-bold text-fantasy-gold drop-shadow-md tracking-wider">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-fantasy-paper/60 font-display uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-fantasy-gold/20 to-transparent mb-2"></div>
      </div>

      <div className="relative group/slider">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 md:-left-10 top-0 bottom-0 z-20 w-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 text-fantasy-gold hover:text-fantasy-gold-light"
        >
          <ChevronRight className="rotate-180 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" size={40} />
        </button>

        {/* Cards Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar scroll-smooth py-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`relative flex-none transition-all duration-300 hover:-translate-y-2 cursor-pointer group/card
                ${isPoster ? 'w-[180px] aspect-[2/3]' : 'w-[280px] aspect-video'}
              `}
            >
              {/* Card Frame */}
              <div className="absolute inset-0 border-2 border-fantasy-gold/30 rounded-lg group-hover/card:border-fantasy-gold group-hover/card:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all z-10 pointer-events-none"></div>

              {/* Image */}
              <div className="w-full h-full rounded-lg overflow-hidden relative">
                <img
                  src={`https://image.tmdb.org/t/p/w500${isPoster ? item.poster_path : (item.backdrop_path || item.poster_path)}`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 grayscale-[30%] group-hover/card:grayscale-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
              </div>

              {/* Card Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-3 z-20">
                <div className="self-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full bg-fantasy-gold text-fantasy-teal flex items-center justify-center shadow-lg">
                    <Play size={12} fill="black" />
                  </div>
                </div>

                <div>
                  <h4 className="text-fantasy-paper font-display font-bold text-sm md:text-base leading-tight drop-shadow-md group-hover/card:text-fantasy-gold transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold bg-black/50 px-1.5 py-0.5 rounded border border-green-900/50">
                      <span>{Math.round(item.vote_average * 10)}%</span>
                    </div>
                    <span className="text-[10px] text-fantasy-paper/60 uppercase tracking-wider">{item.release_date?.split('-')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 md:-right-10 top-0 bottom-0 z-20 w-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 text-fantasy-gold hover:text-fantasy-gold-light"
        >
          <ChevronRight className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" size={40} />
        </button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: AUTH MODAL ---
interface AuthModalProps {
  mode: 'login' | 'register';
  switchMode: (m: 'login' | 'register') => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, email: string, pass: string, name?: string) => void;
}

function AuthModal({ mode, switchMode, onClose, onSubmit }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-fantasy-teal border-2 border-fantasy-gold p-8 rounded-none max-w-md w-full relative shadow-[0_0_50px_rgba(212,175,55,0.2)]">

        {/* Decorative Corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-fantasy-gold"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-fantasy-gold"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-fantasy-gold"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-fantasy-gold"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-fantasy-gold/50 hover:text-fantasy-gold transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-display font-bold mb-6 text-fantasy-gold text-center tracking-widest uppercase drop-shadow-md">
          {mode === 'login' ? 'Identify Yourself' : 'New Enrollment'}
        </h2>

        <form onSubmit={(e) => onSubmit(e, email, pass, name)} className="space-y-5">
          {mode === 'register' && (
            <div>
              <input
                type="text"
                placeholder="YOUR NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-fantasy-gold/30 text-fantasy-paper px-4 py-3 rounded-none focus:outline-none focus:border-fantasy-gold focus:bg-black/60 transition font-display tracking-wider placeholder:text-fantasy-gold/20"
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="EMAIL OR SCROLL ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-fantasy-gold/30 text-fantasy-paper px-4 py-3 rounded-none focus:outline-none focus:border-fantasy-gold focus:bg-black/60 transition font-display tracking-wider placeholder:text-fantasy-gold/20"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="SECRET PHRASE"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-black/40 border border-fantasy-gold/30 text-fantasy-paper px-4 py-3 rounded-none focus:outline-none focus:border-fantasy-gold focus:bg-black/60 transition font-display tracking-wider placeholder:text-fantasy-gold/20"
              required
            />
          </div>

          <button type="submit" className="w-full bg-fantasy-gold hover:bg-fantasy-gold-light text-fantasy-teal font-bold font-display py-3 mt-6 transition tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 shadow-lg">
            {mode === 'login' ? 'ENTER REALM' : 'SIGN CONTRACT'}
          </button>
        </form>

        <div className="mt-8 text-fantasy-gold/40 text-sm text-center font-display tracking-wide">
          {mode === 'login' ? 'New to the guild?' : 'Already have a seal?'}{' '}
          <span
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-fantasy-gold hover:underline cursor-pointer font-bold ml-1"
          >
            {mode === 'login' ? 'Join us.' : 'Enter here.'}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PERSONALITY ONBOARDING MODAL ---
function OnboardingModal({ currentInterests, onSave }: { currentInterests: string[], onSave: (tags: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(currentInterests || []);

  const options = [
    { label: 'Anime', emoji: '🎌' },
    { label: 'Korean Drama', emoji: '🇰🇷' }, // Pake nama key yg sama kayak database category
    { label: 'Action', emoji: '💥' },
    { label: 'Romance', emoji: '💘' },
    { label: 'Horror', emoji: '👻' },
    { label: 'Sci-Fi', emoji: '👽' },
    { label: 'Comedy', emoji: '😂' },
    { label: 'Thriller', emoji: '🔪' },
  ];

  const toggleInterest = (label: string) => {
    if (selected.includes(label)) {
      setSelected(selected.filter(i => i !== label));
    } else {
      setSelected([...selected, label]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-fantasy-teal border-2 border-fantasy-gold p-8 rounded-none max-w-2xl w-full text-center relative animate-in fade-in zoom-in duration-300 shadow-[0_0_60px_rgba(212,175,55,0.15)]">

        {/* Ornate Header */}
        <div className="mb-8 border-b border-fantasy-gold/20 pb-4">
          <h2 className="text-3xl font-display font-bold text-fantasy-gold mb-2 tracking-[0.1em] uppercase">Attune Your Spirit</h2>
          <p className="text-fantasy-paper/60 text-sm font-display tracking-widest">Select the runes that resonate with your soul.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => toggleInterest(opt.label)}
              className={`p-4 border transition-all duration-300 flex flex-col items-center gap-3 group relative overflow-hidden
                ${selected.includes(opt.label)
                  ? 'bg-fantasy-gold/20 border-fantasy-gold text-fantasy-gold scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-black/40 border-fantasy-gold/20 text-fantasy-paper/50 hover:border-fantasy-gold/60 hover:text-fantasy-gold/80'}
              `}
            >
              <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{opt.emoji}</span>
              <span className="text-xs font-bold font-display uppercase tracking-wider">{opt.label}</span>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50"></div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSave(selected)}
          disabled={selected.length === 0}
          className={`w-full py-4 font-display font-bold text-lg tracking-[0.25em] transition-all duration-300 uppercase
             ${selected.length > 0
              ? 'bg-fantasy-gold text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]'
              : 'bg-fantasy-teal-light border border-fantasy-gold/20 text-fantasy-gold/30 cursor-not-allowed'}
          `}
        >
          {selected.length === 0 ? 'Select Runes' : 'Begin Adventure'}
        </button>

      </div>
    </div>
  );
}