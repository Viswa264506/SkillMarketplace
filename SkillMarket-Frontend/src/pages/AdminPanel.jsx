import { useEffect, useState } from "react";
import {
  getAdminStats, getAllUsers, getAllServices, getAllBookings,
  toggleUserActive, deleteUser, deleteService, deleteBooking,
  getPendingVerifications, verifyProvider, rejectProvider
} from "../api/admin";

export default function AdminPanel() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [s, u, sv, b, pv] = await Promise.all([
      getAdminStats(), getAllUsers(), getAllServices(), getAllBookings(), getPendingVerifications()
    ]);
    setStats(s.data);
    setUsers(u.data);
    setServices(sv.data);
    setBookings(b.data);
    setPendingVerifications(pv.data);
  };

  const handleToggle = async (id) => { await toggleUserActive(id); fetchAll(); };
  const handleDeleteUser = async (id) => { if (confirm("Delete this user?")) { await deleteUser(id); fetchAll(); } };
  const handleDeleteService = async (id) => { if (confirm("Delete this service?")) { await deleteService(id); fetchAll(); } };
  const handleDeleteBooking = async (id) => { if (confirm("Delete this booking?")) { await deleteBooking(id); fetchAll(); } };
  const handleVerifyProvider = async (id) => { await verifyProvider(id); fetchAll(); };
  const handleRejectProvider = async (id) => { if (confirm("Reject this provider's verification?")) { await rejectProvider(id); fetchAll(); } };

  const tabs = ["overview", "users", "services", "bookings", "verifications"];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-red-500">🛡️ Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
              activeTab === tab ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {tab}
            {tab === "verifications" && pendingVerifications.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
                {pendingVerifications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
            { label: "Total Services", value: stats.totalServices, color: "text-green-400" },
            { label: "Total Bookings", value: stats.totalBookings, color: "text-yellow-400" },
          ].map(card => (
            <div key={card.label} className="bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-2">{card.label}</p>
              <p className={`text-5xl font-bold ${card.color}`}>{card.value ?? "..."}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === "ADMIN" ? "bg-red-500" :
                      u.role === "PROVIDER" ? "bg-blue-500" : "bg-green-500"
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${u.isActive ? "bg-green-700" : "bg-red-700"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleToggle(u.id)}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs">
                      Toggle
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Services */}
      {activeTab === "services" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-t border-gray-700">
                  <td className="p-3">{s.id}</td>
                  <td className="p-3">{s.title}</td>
                  <td className="p-3">{s.category}</td>
                  <td className="p-3">₹{s.price}</td>
                  <td className="p-3">
                    <button onClick={() => handleDeleteService(s.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bookings */}
      {activeTab === "bookings" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Client</th>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-t border-gray-700">
                  <td className="p-3">{b.id}</td>
                  <td className="p-3">{b.client?.name}</td>
                  <td className="p-3">{b.service?.title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      b.status === "PENDING" ? "bg-yellow-600" :
                      b.status === "ACCEPTED" ? "bg-green-600" :
                      b.status === "REJECTED" ? "bg-red-600" : "bg-gray-600"
                    }`}>{b.status}</span>
                  </td>
                  <td className="p-3">{b.bookingDate}</td>
                  <td className="p-3">
                    <button onClick={() => handleDeleteBooking(b.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verifications */}
      {activeTab === "verifications" && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Pending Provider Verifications</h2>
          {pendingVerifications.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-10 text-center text-gray-400">
              No pending verifications.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map(p => (
                <div key={p.id} className="bg-gray-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-gray-400 text-sm">{p.email}</p>
                    <div className="mt-2 space-y-1">
                      {p.aadhaarNumber && (
                        <p className="text-sm text-gray-300">🪪 Aadhaar: <span className="font-mono">{p.aadhaarNumber}</span></p>
                      )}
                      {p.panNumber && (
                        <p className="text-sm text-gray-300">📄 PAN: <span className="font-mono">{p.panNumber}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleVerifyProvider(p.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold">
                      ✓ Verify
                    </button>
                    <button onClick={() => handleRejectProvider(p.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}