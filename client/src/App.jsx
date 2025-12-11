import { useState, useEffect } from 'react';
import axios from 'axios';

// IMPORTANT: We will change this URL after deploying the backend to Render
const API_URL = "http://localhost:5000"; 

function App() {
  const [movies, setMovies] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [location, setLocation] = useState(null);
  const [workerMsg, setWorkerMsg] = useState('Waiting for worker...');
  
  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [movieForm, setMovieForm] = useState({ title: '', director: '', genre: '', release_year: '', rating: '' });

  // 1. Fetch Movies (Public)
  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API_URL}/movies`);
      setMovies(res.data);
    } catch (err) { console.error("Error fetching movies", err); }
  };

  useEffect(() => {
    fetchMovies();

    // 2. Web Worker Implementation
    if (window.Worker) {
      const myWorker = new Worker('/worker.js');
      myWorker.postMessage('System Check');
      myWorker.onmessage = (e) => setWorkerMsg(e.data);
    }
  }, []);

  // 3. Geolocation
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, long: pos.coords.longitude }),
        () => alert("Location access denied")
      );
    }
  };

  // 4. Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, loginForm);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      alert("Logged In Successfully");
    } catch (err) { alert("Invalid Credentials"); }
  };

  // 5. Add Movie (Protected)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!token) return alert("Login required!");
    try {
      await axios.post(`${API_URL}/movies`, movieForm, { headers: { Authorization: `Bearer ${token}` } });
      alert("Movie Added");
      fetchMovies();
    } catch (err) { alert("Failed to add movie"); }
  };

  // 6. Delete Movie (Protected)
  const handleDelete = async (id) => {
    if (!token) return alert("Login required!");
    try {
      await axios.delete(`${API_URL}/movies/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchMovies();
    } catch (err) { alert("Failed to delete"); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5 font-sans text-gray-800">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-5">Movie Manager</h1>

      {/* CAROUSEL (Mandatory Requirement) */}
      <div className="bg-white p-4 rounded shadow mb-6 overflow-x-auto whitespace-nowrap">
         <h2 className="font-bold mb-2">New Releases (Carousel)</h2>
         <div className="flex gap-4">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="w-48 h-24 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white rounded shadow">
                Feature Movie {num}
              </div>
            ))}
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LOGIN SECTION */}
        {!token ? (
          <form onSubmit={handleLogin} className="bg-white p-5 rounded shadow">
            <h2 className="text-xl font-bold mb-3">Admin Login</h2>
            <input className="border p-2 w-full mb-2" placeholder="Username" onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            <input type="password" className="border p-2 w-full mb-2" placeholder="Password" onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button className="bg-green-500 text-white w-full py-2 rounded">Login</button>
          </form>
        ) : (
           <div className="bg-white p-5 rounded shadow text-center">
             <h2 className="text-xl font-bold text-green-600">Welcome Admin</h2>
             <button onClick={() => { setToken(''); localStorage.clear(); }} className="text-red-500 underline mt-2">Logout</button>
           </div>
        )}

        {/* ADD MOVIE FORM */}
        <form onSubmit={handleAdd} className="bg-white p-5 rounded shadow">
          <h2 className="text-xl font-bold mb-3">Add Movie</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="border p-2" placeholder="Title" onChange={e => setMovieForm({...movieForm, title: e.target.value})} />
            <input className="border p-2" placeholder="Director" onChange={e => setMovieForm({...movieForm, director: e.target.value})} />
            <input className="border p-2" placeholder="Genre" onChange={e => setMovieForm({...movieForm, genre: e.target.value})} />
            <input className="border p-2" placeholder="Year" type="number" onChange={e => setMovieForm({...movieForm, release_year: e.target.value})} />
            <input className="border p-2" placeholder="Rating" type="number" step="0.1" onChange={e => setMovieForm({...movieForm, rating: e.target.value})} />
          </div>
          <button className="bg-blue-600 text-white w-full py-2 rounded mt-3">Add Movie</button>
        </form>
      </div>

      {/* MOVIE LIST */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Movie Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {movies.map(m => (
            <div key={m.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
              <h3 className="font-bold text-lg">{m.title}</h3>
              <p className="text-sm text-gray-600">{m.director} | {m.genre} | {m.release_year}</p>
              <div className="flex justify-between mt-2">
                <span className="font-bold text-yellow-500">★ {m.rating}</span>
                {token && <button onClick={() => handleDelete(m.id)} className="text-red-500 text-sm">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER (Technical Checks) */}
      <footer className="mt-10 p-4 bg-gray-800 text-white rounded">
         <p><strong>Web Worker Status:</strong> {workerMsg}</p>
         <p>
           <strong>Location:</strong> 
           {location ? ` Lat: ${location.lat}, Long: ${location.long}` : <button onClick={getLocation} className="ml-2 bg-gray-600 px-2 rounded text-xs">Get Location</button>}
         </p>
      </footer>
    </div>
  );
}

export default App;