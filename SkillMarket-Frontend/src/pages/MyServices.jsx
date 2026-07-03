import { useEffect, useState } from 'react';
import { getMyServices, deleteService, createService } from '../api/services';
import { uploadImage } from '../api/upload';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Plumbing', 'Tutoring', 'Design', 'Cleaning', 'Electrical', 'Other'];

const CATEGORY_BG = {
  Plumbing: 'bg-blue-50', Tutoring: 'bg-purple-50', Design: 'bg-yellow-50',
  Cleaning: 'bg-green-50', Electrical: 'bg-emerald-50', Other: 'bg-gray-100',
};

const CATEGORY_ICONS = {
  Plumbing: '🔧', Tutoring: '📚', Design: '🎨',
  Cleaning: '🧹', Electrical: '⚡', Other: '🛠️',
};

export default function MyServices() {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Plumbing', price: '', imageUrl: '' });
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyServices();
  }, []);

  const fetchMyServices = async () => {
    try {
      const res = await getMyServices();
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let imageUrl = form.imageUrl;

      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      await createService({ ...form, price: parseFloat(form.price), imageUrl });
      setForm({ title: '', description: '', category: 'Plumbing', price: '', imageUrl: '' });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      fetchMyServices();
    } catch (err) {
      setUploading(false);
      setError('Failed to create service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      fetchMyServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900 cursor-pointer"
            onClick={() => navigate('/dashboard')}>
            Skill<span className="text-blue-600">Market</span>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Browse
            </button>
            <span className="text-sm text-gray-500 font-medium hidden sm:inline">Hi, {user?.name}</span>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-600 font-medium hover:text-red-700 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dashboard</p>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Services</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            {showForm ? 'Cancel' : '+ Add Service'}
          </button>
        </div>

        {/* Add Service Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">New listing</p>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6">Create a service</h2>

            {error && (
              <p className="text-red-600 text-sm font-medium mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="Service title" required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Description" rows={3}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>

                <input name="price" value={form.price} onChange={handleChange}
                  placeholder="Price (₹)" type="number" required
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 text-center bg-blue-50/30">
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="hidden" id="imageUpload" />
                <label htmlFor="imageUpload"
                  className="cursor-pointer text-blue-600 text-sm font-semibold hover:underline">
                  📷 Click to upload image
                </label>
                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Preview"
                      className="w-28 h-28 object-cover rounded-xl mx-auto shadow-sm" />
                    <p className="text-xs text-gray-400 mt-2">{imageFile?.name}</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                {uploading ? 'Uploading image...' : 'Create Service'}
              </button>
            </form>
          </div>
        )}

        {/* Services List */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Listings</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Your Services</h2>

          {services.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">🛠️</p>
              <p className="text-gray-800 font-bold text-lg mb-1">No services yet</p>
              <p className="text-gray-400 text-sm">Add your first service to start getting bookings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map(service => (
                <div key={service.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                  <div className={`h-36 ${CATEGORY_BG[service.category] || 'bg-gray-100'} flex items-center justify-center relative`}>
                    {service.imageUrl
                      ? <img src={service.imageUrl} alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      : <span className="text-5xl">{CATEGORY_ICONS[service.category] || '🛠️'}</span>
                    }
                    <div className="absolute bottom-2 right-2 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      ₹{Number(service.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">{service.category}</p>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{service.title}</h3>
                    {service.description && (
                      <p className="text-gray-400 text-xs mb-4 leading-relaxed line-clamp-2">{service.description}</p>
                    )}
                    <button onClick={() => handleDelete(service.id)}
                      className="w-full bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}