import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORY_ICONS = {
  Plumbing: '🔧', Tutoring: '📚', Design: '🎨',
  Cleaning: '🧹', Electrical: '⚡', Other: '🛠️',
};

const CATEGORY_BG = {
  Plumbing: 'bg-blue-50', Tutoring: 'bg-purple-50', Design: 'bg-yellow-50',
  Cleaning: 'bg-green-50', Electrical: 'bg-emerald-50', Other: 'bg-gray-100',
};

const CATEGORIES = [
  { icon: '🔧', name: 'Plumbing' },
  { icon: '⚡', name: 'Electrical' },
  { icon: '🧹', name: 'Cleaning' },
  { icon: '📚', name: 'Tutoring' },
  { icon: '🎨', name: 'Design' },
  { icon: '🐛', name: 'Pest Control' },
  { icon: '🖌️', name: 'Painting' },
  { icon: '🔨', name: 'Patchwork' },
  { icon: '❄️', name: 'AC Service' },
  { icon: '🌿', name: 'Gardening' },
  { icon: '🚿', name: 'Bathroom Fix' },
  { icon: '🛠️', name: 'Other' },
];

const TESTIMONIALS = [
  { quote: '"Found a great plumber within minutes. Highly recommended!"', name: 'Rahul Sharma', role: 'Client, Mumbai', rating: 5 },
  { quote: '"SkillMarket helped me grow my business 3x in just 2 months."', name: 'Priya Singh', role: 'Provider, Andheri', rating: 5 },
  { quote: '"Can\'t imagine finding local services without SkillMarket now."', name: 'Arjun Nair', role: 'Client, Bandra', rating: 5 },
];

const FEATURES = [
  { icon: '🔍', title: 'Find Local Services', desc: 'Browse plumbers, tutors, designers and more in your area.' },
  { icon: '📅', title: 'Easy Booking', desc: 'Book a service in seconds with our simple booking system.' },
  { icon: '✅', title: 'Verified Providers', desc: 'All providers are verified for quality and trust.' },
  { icon: '💬', title: 'Real-time Updates', desc: 'Get instant updates when your booking is accepted.' },
];

function StarRating({ rating = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-blue-600' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/services`)
    .then((res) => setServices(res.data))
    .catch((err) => console.error(err))
    .finally(() => setLoadingServices(false));
}, []);

  const categories = ['All', 'Plumbing', 'Electrical', 'Cleaning', 'Tutoring', 'Design', 'Other'];
  const filteredServices = activeCategory === 'All' ? services : services.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* Navbar */}
      <nav className="bg-gray-100 sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* Logo */}
         <a href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-black tracking-tight text-gray-900 cursor-pointer shrink-0"
            >
              Skill<span className="text-blue-600">Market</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">Services</a>
            <a href="#categories" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">Categories</a>
            <a href="#testimonials" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">Reviews</a>
            <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">About</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-sm text-gray-900 font-semibold px-4 py-2 hover:text-blue-600 transition">
              Log in
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">— India's Local Skill Marketplace</p>
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-5">
            The best way<br />to find local<br />
            <span className="text-blue-600">skilled talent.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
            Connect with verified local service providers for plumbing, tutoring, design, and more. Book in seconds, right from your doorstep.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition text-sm">
              Find a Service
            </button>
            <button onClick={() => navigate('/register')}
              className="bg-white text-gray-900 font-semibold px-7 py-3 rounded-xl border border-gray-300 hover:border-gray-400 transition text-sm">
              See how it works
            </button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative shrink-0">
          <div className="w-72 h-72 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center text-8xl shadow-inner">
            🧑‍🔧
          </div>
          <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
            <span className="text-xs font-bold text-gray-900">500+ Providers</span>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            <span className="text-xs font-bold text-gray-900">Verified & Trusted</span>
          </div>
          <div className="absolute top-1/2 -right-6 bg-blue-600 rounded-xl px-3 py-1.5 shadow-lg">
            <span className="text-xs font-bold text-white">4.9 ★</span>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="border-y border-gray-200 bg-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trusted by thousands across India</p>
          <div className="flex items-center gap-8">
            {[
              { value: '500+', label: 'Providers' },
              { value: '2000+', label: 'Clients' },
              { value: '12+', label: 'Categories' },
              { value: '4.9★', label: 'Rating' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-8 py-16">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Listings</p>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Most Popular Services in{' '}
          <span className="text-blue-600">{activeCategory === 'All' ? 'All Categories' : activeCategory} ▾</span>
        </h2>
        <p className="text-gray-400 text-sm mb-8">Discover our most popular services and get the job done with ease on SkillMarket.</p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />)}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No services in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredServices.slice(0, 8).map(service => (
              <div key={service.id} onClick={() => navigate('/register')}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className={`h-36 ${CATEGORY_BG[service.category]||'bg-gray-100'} flex items-center justify-center relative`}>
                  {service.imageUrl
                    ? <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    : <span className="text-5xl">{CATEGORY_ICONS[service.category]||'🛠️'}</span>
                  }
                  <div className="absolute bottom-2 right-2 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    ₹{service.price?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">{service.category}</p>
                  <h4 className="font-bold text-gray-900 text-sm mb-2 leading-snug line-clamp-1">{service.title}</h4>
                  <div className="flex items-center gap-1.5 mb-3">
                    <StarRating rating={Math.round(service.averageRating || 0)} />
<span className="text-xs text-gray-400">
  {service.totalReviews > 0 ? `(${service.averageRating?.toFixed(1)})` : '(No reviews yet)'}
</span>
                  </div>
                  {service.providerAddress && (
                    <p className="text-xs text-gray-400 mb-3">📍 {service.providerAddress.split(',').slice(0,2).join(',')}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {service.providerName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-500">{service.providerName}</span>
                    </div>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold">
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingServices && filteredServices.length > 0 && (
          <div className="text-center mt-10">
            <button onClick={() => navigate('/register')}
              className="bg-white text-gray-900 border border-gray-300 font-semibold px-8 py-3 rounded-xl hover:border-gray-400 transition text-sm">
              View All Services →
            </button>
          </div>
        )}
      </section>

      {/* Categories */}
      <section id="categories" className="border-t border-gray-200 py-16 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Browse</p>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Explore Our <span className="text-blue-600">Service Categories</span>
          </h2>
          <p className="text-gray-400 text-sm mb-10">Find the right service for every need around you.</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-5">
            {CATEGORIES.map(cat => (
              <button key={cat.name} onClick={() => navigate('/register')}
                className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-200 border border-gray-200">
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-600 text-center leading-tight hidden sm:block">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Why Us</p>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-10">Why <span className="text-blue-600">SkillMarket?</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 px-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center mb-2">Testimonials</h2>
          <p className="text-gray-400 text-sm text-center mb-10">People love what we do and we want to let you know</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-5">{t.quote}</p>
                <StarRating rating={t.rating} />
                <p className="font-bold text-gray-900 text-sm mt-3">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="py-20 px-8 bg-gray-100 border-t border-gray-200 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-500 text-base mb-8">
            Join thousands of clients and providers on SkillMarket today. It's completely free.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/register')}
              className="bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition text-base">
              Create Free Account →
            </button>
            <button onClick={() => navigate('/login')}
              className="bg-white text-gray-900 font-bold px-10 py-4 rounded-xl border border-gray-300 hover:border-gray-400 transition text-base">
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12 px-8 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10 mb-8">
          <a href="/services"> <div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Skill<span className="text-blue-600">Market</span></h3>
            <p className="text-xs text-gray-400 leading-relaxed">2026 © SkillMarket<br />All rights reserved.</p>
          </div>
          </a>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Pages</h4>
            <ul className="space-y-2">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Profile', path: '/profile' },
              ].map(l => (
                <li key={l.label}>
                  <button onClick={() => navigate(l.path)} className="text-sm text-gray-500 hover:text-gray-900 transition">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Categories</h4>
            <ul className="space-y-2">
              {['Plumbing', 'Electrical', 'Cleaning', 'Tutoring', 'Design'].map(l => (
                <li key={l}>
                  <button onClick={() => handleCategory(l)} className="text-sm text-gray-500 hover:text-gray-900 transition">{l}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service'].map(l => (
                <li key={l}><button className="text-sm text-gray-500 hover:text-gray-900 transition">{l}</button></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">Built with Spring Boot + React + Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
