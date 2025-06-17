import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Animation imports
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
// Context import
import { useTheme } from '../../contexts/ThemeContext';
// Icon imports
import { CheckCircle, Sun, Moon, BarChart3, Wallet, Target, ChevronRight, ChevronLeft, Menu, X, Quote, LogIn, ScanLine, Goal, DollarSign } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type Language = 'en' | 'id';
interface ShowcaseItem {
  title: string;
  description: string;
  image: string;
}
interface Content {
  nav: { features: string; howItWorks: string; testimonials: string; signIn: string; getStarted: string; };
  hero: { title: string; subtitle: string; cta: string; };
  showcase: {
    title: string;
    subtitle: string;
    items: ShowcaseItem[];
  };
  features: { title: string; subtitle: string; items: { icon: React.ElementType; title: string; description: string; }[]; };
  howItWorks: { title: string; subtitle: string; steps: { icon: React.ElementType; title: string; description: string; }[]; };
  testimonials: { title: string; subtitle: string; items: { quote: string; author: string; role: string; }[]; };
  cta: { title: string; subtitle: string; cta: string; };
  faq: { title: string; subtitle: string; items: { question: string; answer: string }[] };
  pricing: { title: string; subtitle: string; free: { name: string; price: string; period: string; features: string[]; cta: string; }; premium: { name: string; status: string; description: string; }; };
  footer: { copy: string; madeBy: string; };
}

// --- CONTENT (Internationalization) ---
const textContent: Record<Language, Content> = {
  en: {
    nav: { features: "Features", howItWorks: "How It Works", testimonials: "Testimonials", signIn: "Sign In", getStarted: "Get Started" },
    hero: { title: "Take Full Control of Your Financial Future.", subtitle: "KeuanganKu helps you track expenses, manage budgets, and achieve your savings goals with powerful, easy-to-use tools. Welcome to financial clarity.", cta: "Get Started for Free" },
    showcase: {
      title: "Your Finances, Beautifully Visualized",
      subtitle: "Our intuitive dashboard gives you a complete overview of your financial health in one clear, interactive view.",
      items: [
        { title: "All-in-One Dashboard", description: "See your total balance, recent transactions, and goal progress the moment you log in. Everything you need, at a glance.", image: "https://placehold.co/1200x750/1e293b/a78bfa?text=Dashboard" },
        { title: "Flexible Budgeting", description: "Create custom budgets that work for your lifestyle. We'll track your spending and notify you before you go over.", image: "https://placehold.co/1200x750/1e293b/a78bfa?text=Budgeting" },
        { title: "Insightful Reports", description: "Understand your spending habits with easy-to-read charts. See breakdowns by category, merchant, and more.", image: "https://placehold.co/1200x750/1e293b/a78bfa?text=Reports" },
      ]
    },
    features: { title: "Everything You Need to Succeed", subtitle: "From detailed tracking to future planning, we've got you covered.", items: [ { icon: Wallet, title: "Smart Expense Tracking", description: "Connect your accounts and let our system automatically categorize your transactions. See where your money is really going." }, { icon: Target, title: "Achievable Savings Goals", description: "Set custom goals for anything from a new gadget to a down payment. We'll help you stay on track to reach them." }, { icon: BarChart3, title: "Insightful Reports", description: "Visualize your financial health with beautiful, easy-to-understand charts and reports. Make data-driven decisions." } ] },
    howItWorks: { title: "Get Started in 3 Simple Steps", subtitle: "Managing your finances has never been this easy.", steps: [ { icon: LogIn, title: "Create Your Account", description: "Sign up for free in just a few seconds. No long forms, no credit card required." }, { icon: ScanLine, title: "Link Your Accounts", description: "Securely connect your bank accounts for automated transaction tracking." }, { icon: Goal, title: "Set Your Goals", description: "Define your financial goals and start tracking your progress towards them." }, ] },
    testimonials: { title: "Loved by Users Everywhere", subtitle: "Don't just take our word for it. Here's what our users have to say.", items: [ { quote: "KeuanganKu has completely changed how I see my money. The dashboard is a game-changer!", author: "Andi Saputra", role: "Freelance Designer" }, { quote: "Finally, a finance app that's both powerful and beautiful. Setting and tracking savings goals is incredibly motivating.", author: "Siti Aminah", role: "Marketing Manager" }, { quote: "I was drowning in spreadsheets. This app saved me hours every month and gave me real insights.", author: "Budi Hartono", role: "Small Business Owner" }, ] },
    cta: { title: "Ready to Transform Your Finances?", subtitle: "Join thousands of users who are building a better financial future with KeuanganKu.", cta: "Sign Up Now" },
    faq: {
        title: "Frequently Asked Questions",
        subtitle: "Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.",
        items: [
          { question: "Is KeuanganKu secure?", answer: "Absolutely. We use bank-level 256-bit encryption and secure protocols to connect to your accounts. Your data is encrypted, anonymized, and never sold." },
          { question: "Is this application free?", answer: "Yes, the core features of KeuanganKu are completely free to use. We may introduce optional premium features in the future." },
          { question: "Can I connect multiple bank accounts?", answer: "Yes! You can securely connect multiple accounts from various banks to get a complete picture of your financial health in one place." },
          { question: "How does automatic categorization work?", answer: "Our smart algorithm analyzes transaction data to automatically assign categories like 'Food', 'Transport', or 'Bills'. You can also create custom rules and categories to fit your needs." }
        ]
        },
      pricing: {
        title: "Simple, Transparent Pricing",
        subtitle: "Start for free and get all the essential tools to manage your finances. No hidden fees.",
        free: { name: "Starter", price: "Rp 0", period: "Forever", features: ["Unlimited Transaction Tracking", "Custom Budgeting", "Savings Goal Setting", "Insightful Reports"], cta: "Get Started for Free" },
        premium: { name: "Premium", status: "Coming Soon", description: "Get ready for advanced features like investment tracking, multi-currency support, and predictive forecasting." }
      },
    footer: { copy: "KeuanganKu. All rights reserved.", madeBy: "By razka.dev" }
  },
  id: {
    nav: { features: "Fitur", howItWorks: "Cara Kerja", testimonials: "Testimoni", signIn: "Masuk", getStarted: "Mulai" },
    hero: { title: "Ambil Kendali Penuh Atas Masa Depan Keuangan Anda.", subtitle: "KeuanganKu membantu Anda melacak pengeluaran, mengelola anggaran, dan mencapai tujuan tabungan dengan alat yang canggih dan mudah digunakan. Selamat datang di kejelasan finansial.", cta: "Mulai Gratis Sekarang" },
    showcase: {
      title: "Visualisasi Keuangan Anda yang Indah",
      subtitle: "Dasbor intuitif kami memberi Anda gambaran lengkap tentang kesehatan finansial Anda dalam satu tampilan yang jelas dan interaktif.",
      items: [
          { title: "Dasbor Lengkap", description: "Lihat total saldo Anda, transaksi terkini, dan kemajuan tujuan saat Anda masuk. Semua yang Anda butuhkan, dalam sekejap.", image: "/images/dashboard.png" },
          { title: "Anggaran Fleksibel", description: "Buat anggaran khusus yang sesuai dengan gaya hidup Anda. Kami akan melacak pengeluaran Anda dan memberi tahu Anda sebelum Anda melewatinya.", image: "https://placehold.co/1200x750/1e293b/a78bfa?text=Anggaran" },
          { title: "Laporan Mendalam", description: "Pahami kebiasaan belanja Anda dengan bagan yang mudah dibaca. Lihat perincian berdasarkan kategori, pedagang, dan lainnya.", image: "https://placehold.co/1200x750/1e293b/a78bfa?text=Laporan" },
      ]
    },
    features: { title: "Semua yang Anda Butuhkan untuk Sukses", subtitle: "Dari pelacakan detail hingga perencanaan masa depan, kami siap membantu Anda.", items: [ { icon: Wallet, title: "Pelacakan Pengeluaran Cerdas", description: "Hubungkan akun Anda dan biarkan sistem kami mengkategorikan transaksi Anda secara otomatis. Lihat ke mana uang Anda sebenarnya pergi." }, { icon: Target, title: "Tujuan Tabungan yang Tercapai", description: "Tetapkan tujuan khusus untuk apa pun, mulai dari gadget baru hingga uang muka. Kami akan membantu Anda tetap di jalur untuk mencapainya." }, { icon: BarChart3, title: "Laporan yang Mendalam", description: "Visualisasikan kesehatan finansial Anda dengan bagan dan laporan yang indah dan mudah dipahami. Buat keputusan berdasarkan data." } ] },
    howItWorks: { title: "Mulai dalam 3 Langkah Mudah", subtitle: "Mengelola keuangan Anda tidak pernah semudah ini.", steps: [ { icon: LogIn, title: "Buat Akun Anda", description: "Daftar gratis hanya dalam beberapa detik. Tanpa formulir panjang, tanpa kartu kredit." }, { icon: ScanLine, title: "Hubungkan Rekening", description: "Hubungkan rekening bank Anda dengan aman untuk pelacakan transaksi otomatis." }, { icon: Goal, title: "Tetapkan Tujuan Anda", description: "Tentukan tujuan keuangan Anda dan mulailah melacak kemajuan Anda." }, ] },
    testimonials: { title: "Disukai oleh Pengguna di Mana Saja", subtitle: "Jangan hanya percaya kata-kata kami. Inilah yang dikatakan para pengguna kami.", items: [ { quote: "KeuanganKu benar-benar mengubah cara saya melihat uang. Dasbornya luar biasa!", author: "Andi Saputra", role: "Desainer Lepas" }, { quote: "Akhirnya, aplikasi keuangan yang canggih sekaligus indah. Menetapkan dan melacak tujuan tabungan sangat memotivasi.", author: "Siti Aminah", role: "Manajer Pemasaran" }, { quote: "Dulu saya tenggelam dalam spreadsheet. Aplikasi ini menghemat waktu saya berjam-jam setiap bulan dan memberi saya wawasan nyata.", author: "Budi Hartono", role: "Pemilik Usaha Kecil" }, ] },
    cta: { title: "Siap Mengubah Keuangan Anda?", subtitle: "Bergabunglah dengan ribuan pengguna yang sedang membangun masa depan finansial yang lebih baik bersama KeuanganKu.", cta: "Daftar Sekarang" },
    faq: {
        title: "Pertanyaan yang Sering Diajukan",
        subtitle: "Punya pertanyaan? Kami punya jawabannya. Jika Anda tidak dapat menemukan yang Anda cari, jangan ragu untuk menghubungi kami.",
        items: [
          { question: "Apakah KeuanganKu aman?", answer: "Tentu saja. Kami menggunakan enkripsi 256-bit tingkat bank dan protokol aman untuk terhubung ke rekening Anda. Data Anda dienkripsi, dianonimkan, dan tidak akan pernah dijual." },
          { question: "Apakah aplikasi ini gratis?", answer: "Ya, fitur inti KeuanganKu sepenuhnya gratis untuk digunakan. Kami mungkin akan memperkenalkan fitur premium opsional di masa mendatang." },
          { question: "Bisakah saya menghubungkan beberapa rekening bank?", answer: "Ya! Anda dapat menghubungkan beberapa rekening dari berbagai bank dengan aman untuk mendapatkan gambaran lengkap tentang kesehatan finansial Anda di satu tempat." },
          { question: "Bagaimana cara kerja kategorisasi otomatis?", answer: "Algoritme cerdas kami menganalisis data transaksi untuk menetapkan kategori secara otomatis seperti 'Makanan', 'Transportasi', atau 'Tagihan'. Anda juga dapat membuat aturan dan kategori khusus sesuai kebutuhan Anda." }
        ]
      },
      pricing: {
        title: "Harga yang Simpel dan Transparan",
        subtitle: "Mulai gratis dan dapatkan semua alat penting untuk mengelola keuangan Anda. Tanpa biaya tersembunyi.",
        free: { name: "Starter", price: "Rp 0", period: "Selamanya", features: ["Pelacakan Transaksi Tanpa Batas", "Anggaran Kustom", "Penetapan Tujuan Tabungan", "Laporan Mendalam"], cta: "Mulai Gratis" },
        premium: { name: "Premium", status: "Segera Hadir", description: "Bersiaplah untuk fitur canggih seperti pelacakan investasi, dukungan multi-mata uang, dan prediksi perkiraan." }
      },
      
    footer: { copy: "KeuanganKu. Hak cipta dilindungi undang-undang.", madeBy: "Made by Razka.dev" }
  }
};

// --- ANIMATION VARIANTS ---
const sectionVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Reusable component for scroll-triggered animations
const AnimatedSection: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  React.useEffect(() => { if (inView) { controls.start("visible"); } }, [controls, inView]);
  return ( <motion.div ref={ref} variants={sectionVariant} initial="hidden" animate={controls} className={className}> {children} </motion.div> );
};

// --- UI COMPONENTS ---
const Header: React.FC<{ content: Content['nav']; }> = ({ content }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme, language, setLanguage } = useTheme();

  return (
    <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }} className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
        <div className="flex">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
          <div className="flex-shrink-0 pl-2"> <a href="#" className="text-2xl font-bold text-slate-800 dark:text-white"> Keuangan<span className="text-violet-500">Ku</span> </a> </div>
        </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Features</a>
            <a href="#showcase" className="text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Showcase</a>
            <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">{content.howItWorks}</a>
            <a href="#testimonials" className="text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">{content.testimonials}</a>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle dark mode"> {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full font-semibold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle language"> {language.toUpperCase()} </motion.button>
            <Link to="/login" className="text-slate-600 dark:text-slate-300 font-medium hover:text-violet-500 dark:hover:text-violet-400 transition-colors">{content.signIn}</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup" className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-md font-semibold text-sm hover:bg-violet-700 transition-colors block"> {content.getStarted} </Link>
            </motion.div>
          </div>
          <div className="md:hidden flex items-center"> <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-slate-500 dark:text-slate-400" aria-label="Open menu"> {isMenuOpen ? <X size={24} /> : <Menu size={24} />} </button> </div>
        </div>
      </div>
      {isMenuOpen && ( <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"> <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3"> <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300">Features</a> <a href="#showcase" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300">Showcase</a> <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300">{content.howItWorks}</a> <a href="#testimonials" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300">{content.testimonials}</a> </div> <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-800 px-4"> <div className="flex items-center justify-between"> <Link to="/auth" className="flex-grow w-full text-center px-4 py-2 border border-transparent rounded-md font-semibold text-slate-700 dark:text-white">{content.signIn}</Link> <Link to="/auth" className="flex-grow w-full text-center px-4 py-2 bg-violet-600 text-white rounded-md font-semibold ml-3">{content.getStarted}</Link> </div> <div className="mt-4 flex items-center justify-center space-x-4"> <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400"> {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} </button> <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full font-semibold text-sm text-slate-500 dark:text-slate-400"> {language.toUpperCase()} </button> </div> </div> </div> )}
    </motion.header>
  );
};


const Hero: React.FC<{ content: Content['hero'] }> = ({ content }) => {
    const heroTextContainer = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
    };
  
    const heroTextItem = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.5 } },
    };
  
    // Variants for the dashboard's parent container to stagger its children
    const dashboardContainerVariants = {
      hidden: { opacity: 0, scale: 0.9 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.5,
          delay: 0.5,
          ease: 'easeOut',
          when: 'beforeChildren',
          staggerChildren: 0.15,
        },
      },
    };
  
    // Variants for the individual cards inside the dashboard
    const dashboardItemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
      },
    };
  
    // Variants for the Savings Goal progress bar animation
    const progressBarVariants = {
      hidden: { width: '0%' },
      visible: { width: '45%', transition: { duration: 1, ease: [0.25, 1, 0.5, 1] } },
    };
  
    // Variants for the chart bar container to stagger the bars
    const chartContainerVariants = {
      hidden: {},
      visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    };
    
    // Variants for each chart bar, using 'custom' prop for dynamic height
    const barVariants = {
      hidden: { height: '0%' },
      visible: (custom: string) => ({
        height: custom,
        transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
      }),
    };
  
    const chartData = [
      { height: '30%', color: 'bg-green-500/20' },
      { height: '50%', color: 'bg-red-500/20' },
      { height: '75%', color: 'bg-green-500/20' },
      { height: '60%', color: 'bg-green-500/20' },
    ];
  
    return (
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20 md:pt-0">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[80%] z-0"
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.20) 0%, transparent 65%)' }}
        />
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              className="text-center md:text-left"
              variants={heroTextContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                variants={heroTextItem}
                className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl"
              >
                {content.title}
              </motion.h1>
              <motion.p
                variants={heroTextItem}
                className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300 md:mx-0"
              >
                {content.subtitle}
              </motion.p>
              <motion.div variants={heroTextItem}>
                <motion.a
                  href="/signup"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-violet-600 px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-violet-700"
                >
                  {content.cta} <ChevronRight className="-mr-1 ml-2 h-5 w-5" />
                </motion.a>
              </motion.div>
            </motion.div>
  
            <motion.div
              className="relative"
              variants={dashboardContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="rounded-2xl bg-slate-200/50 p-6 shadow-2xl shadow-slate-500/10 backdrop-blur-lg dark:bg-slate-800/50 dark:shadow-black/30">
                <motion.div
                  variants={dashboardItemVariants}
                  className="mb-4 flex items-center justify-between"
                >
                  <p className="font-bold text-slate-800 dark:text-white">Dashboard</p>
                  <div className="flex space-x-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                </motion.div>
  
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    variants={dashboardItemVariants}
                    className="rounded-lg bg-white p-4 shadow dark:bg-slate-900"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Balance</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">Rp 0</p>
                  </motion.div>
                  <motion.div
                    variants={dashboardItemVariants}
                    className="rounded-lg bg-white p-4 shadow dark:bg-slate-900"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400">Savings Goal</p>
                    <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        variants={progressBarVariants}
                        className="h-2.5 rounded-full bg-violet-500"
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    variants={dashboardItemVariants}
                    className="col-span-2 rounded-lg bg-white p-4 shadow dark:bg-slate-900"
                  >
                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Monthly Trend</p>
                    <motion.div
                      variants={chartContainerVariants}
                      className="flex h-24 items-end space-x-2"
                    >
                      {chartData.map((bar, i) => (
                        <motion.div
                          key={i}
                          custom={bar.height}
                          variants={barVariants}
                          className={`w-full rounded-t-sm ${bar.color}`}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  };
  
const unifiedBg = "bg-slate-50 dark:bg-slate-800";

const Showcase: React.FC<{ content: Content['showcase'] }> = ({ content }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const slideVariants = {
        hidden: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
        exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }),
    };
    const textVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }, };
    const paginate = (newDirection: number) => { setDirection(newDirection); setCurrentIndex(prevIndex => (prevIndex + newDirection + content.items.length) % content.items.length); };
    const goToSlide = (index: number) => { setDirection(index > currentIndex ? 1 : -1); setCurrentIndex(index); };
    const activeItem = content.items[currentIndex];

    return (
        <section id="showcase" className={`py-16 md:py-24 ${unifiedBg}`}>
            <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
                </div>
                
                <div className="relative h-[400px] md:h-[600px] w-full max-w-5xl mx-auto overflow-hidden bg-slate-200 dark:bg-slate-900/50 rounded-2xl shadow-2xl">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.img key={currentIndex} src={activeItem.image} custom={direction} variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="absolute h-full w-full object-cover" />
                    </AnimatePresence>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => paginate(-1)} className="absolute top-1/2 left-4 -translate-y-1/2 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full transition-colors">
                        <ChevronLeft className="h-6 w-6 text-slate-800 dark:text-white" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => paginate(1)} className="absolute top-1/2 right-4 -translate-y-1/2 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full transition-colors">
                        <ChevronRight className="h-6 w-6 text-slate-800 dark:text-white" />
                    </motion.button>
                </div>

                <div className="text-center mt-8">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div key={currentIndex} variants={textVariants} initial="hidden" animate="visible" exit="exit">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeItem.title}</h3>
                      <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{activeItem.description}</p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex justify-center space-x-3 mt-6">
                    {content.items.map((_, index) => (
                      <button key={index} onClick={() => goToSlide(index)} className={`w-3 h-3 rounded-full transition-colors ${ currentIndex === index ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400' }`} aria-label={`Go to slide ${index + 1}`} />
                    ))}
                  </div>
                </div>
            </AnimatedSection>
        </section>
    );
};

const Features: React.FC<{ content: Content['features'] }> = ({ content }) => {
    return (
        <section id="features" className={`py-16 md:py-24 relative ${unifiedBg}`}>
             <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {content.items.map((feature, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.03, y: -5 }} className="flex flex-col p-8 bg-white/70 dark:bg-slate-900/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-violet-500 text-white"> <feature.icon className="h-6 w-6" aria-hidden="true" /> </div>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </AnimatedSection>
        </section>
    )
}

const HowItWorks: React.FC<{ content: Content['howItWorks'] }> = ({ content }) => {
    return (
        <section id="how-it-works" className={`py-16 md:py-24 ${unifiedBg}`}>
            <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3 text-center">
                    {content.steps.map((step, index) => (
                         <div key={index} className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-violet-100 dark:bg-slate-700 text-violet-600 dark:text-violet-400 border-2 border-violet-200 dark:border-slate-600">
                                <step.icon className="h-8 w-8" />
                            </div>
                            <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{step.description}</p>
                        </div>
                    ))}
                </div>
            </AnimatedSection>
        </section>
    );
};

const Testimonials: React.FC<{ content: Content['testimonials'] }> = ({ content }) => {
    return (
        <section id="testimonials" className={`py-16 md:py-24 ${unifiedBg}`}>
            <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                    {content.items.map((testimonial, index) => (
                        <div key={index} className="flex flex-col justify-between p-6 bg-white dark:bg-slate-900/70 rounded-2xl shadow-lg">
                            <div> <Quote className="w-8 h-8 text-violet-300 dark:text-violet-600" /> <blockquote className="mt-4 text-slate-600 dark:text-slate-300"> <p>"{testimonial.quote}"</p> </blockquote> </div>
                            <footer className="mt-6"> <p className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</p> <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p> </footer>
                        </div>
                    ))}
                </div>
            </AnimatedSection>
        </section>
    );
};

const CallToAction: React.FC<{ content: Content['cta'] }> = ({ content }) => {
    return (
        <section className={`py-16 md:py-24 ${unifiedBg}`}>
             <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-violet-600 rounded-2xl p-8 md:p-12 text-center shadow-2xl shadow-violet-500/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{content.title}</h2>
                        <p className="mt-4 text-lg text-violet-200 max-w-2xl mx-auto">{content.subtitle}</p>
                        <div className="mt-8">
                          <motion.a href="/signup" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-violet-600 bg-white hover:bg-violet-50"> {content.cta} </motion.a>
                        </div>
                    </div>
                </div>
            </AnimatedSection>
        </section>
    );
};

const FAQ: React.FC<{ content: Content['faq'] }> = ({ content }) => {
    return (
      <section id="faq" className={`py-16 md:py-24 ${unifiedBg}`}>
        <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {content.items.map((item, index) => (
              <motion.div
                key={index}
                initial={false}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <details className="group">
                  <summary className="flex justify-between items-center p-4 cursor-pointer bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="font-medium text-slate-900 dark:text-white">{item.question}</span>
                    <ChevronRight className="h-5 w-5 text-slate-500 dark:text-slate-400 transform group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-300">{item.answer}</p>
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>
    );
  };

  const Pricing: React.FC<{ content: Content['pricing'] }> = ({ content }) => {
    return (
      <section id="pricing" className={`py-16 md:py-24 ${unifiedBg}`}>
        <AnimatedSection className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{content.title}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{content.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="border-2 border-violet-500 rounded-2xl p-8 flex flex-col shadow-2xl shadow-violet-500/10">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{content.free.name}</h3>
              <div className="flex items-baseline mt-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{content.free.price}</span>
                <span className="ml-2 text-lg text-slate-500 dark:text-slate-400">/ {content.free.period}</span>
              </div>
              <ul className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
                {content.free.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                 <Link to="/auth" className="w-full inline-block text-center px-6 py-3 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-700 transition-colors">
                  {content.free.cta}
                </Link>
              </div>
            </div>
  
            {/* Premium Teaser */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col bg-white dark:bg-slate-800/50">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{content.premium.name}</h3>
              <div className="flex items-baseline mt-4">
                 <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300">{content.premium.status}</span>
              </div>
              <p className="mt-6 text-slate-600 dark:text-slate-300">{content.premium.description}</p>
              <div className="mt-auto pt-8">
                <div className="w-full inline-block text-center px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md font-semibold cursor-not-allowed">
                  Notify Me
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
    );
  };

const Footer: React.FC<{ content: Content['footer'] }> = ({ content }) => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} {content.copy}</p>
                <p className="mt-2">{content.madeBy}</p>
            </div>
        </footer>
    );
};

// --- MAIN LANDING PAGE COMPONENT ---
export default function LandingPage() {
  const { language } = useTheme();
  const currentContent = textContent[language];

  return (
    <div className="bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header content={currentContent.nav} />
      <main>
        <Hero content={currentContent.hero} />
        <Features content={currentContent.features} />
        <Showcase content={currentContent.showcase} />
        <HowItWorks content={currentContent.howItWorks} />
        <Pricing content={currentContent.pricing} />
        <Testimonials content={currentContent.testimonials} />
        <FAQ content={currentContent.faq} />
        <CallToAction content={currentContent.cta} />
      </main>
      <Footer content={currentContent.footer} />
    </div>
  );
}
