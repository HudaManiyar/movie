import { useState, useEffect } from 'react';
import axios from 'axios';

// RENDER URL
const API_URL = "https://movie-yld4.onrender.com"; 
// const API_URL = "http://localhost:5000"; // Uncomment for local testing

function App() {
  const [movies, setMovies] = useState([]);
  const [view, setView] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Forms & State
  const [movieForm, setMovieForm] = useState({ title: '', genre: '', description: '', poster_url: '', rating: '' });
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', movie: '', rating: '' });
  const [selectedMovie, setSelectedMovie] = useState(null); 
  const [editId, setEditId] = useState(null);

  // FETCH MOVIES
  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API_URL}/movies`);
      setMovies(res.data);
    } catch (err) { console.error("Error fetching movies"); }
  };

  useEffect(() => {
    fetchMovies();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, long: pos.coords.longitude }),
        (err) => console.log("Location denied")
      );
    }
  }, []);

  // CAROUSEL AUTO-SLIDE LOGIC
  useEffect(() => {
    if (movies.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % movies.length);
      }, 4000); // Slides every 4 seconds
      return () => clearInterval(interval);
    }
  }, [movies]);

  // FILTER LOGIC
  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // HANDLERS
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/movies/${editId}`, movieForm);
        alert("Movie Updated!");
      } else {
        await axios.post(`${API_URL}/movies`, movieForm);
        alert("Movie Added!");
      }
      setMovieForm({ title: '', genre: '', description: '', poster_url: '', rating: '' });
      setEditId(null);
      fetchMovies();
      setView('home');
    } catch (err) { alert("Error saving movie. Check Rating is a number!"); }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    console.log("📝 Feedback Submitted:", feedbackForm);
    alert("Feedback logged to Console!");
    setFeedbackForm({ name: '', email: '', movie: '', rating: '' });
  };

  const deleteMovie = async (id) => {
    if(window.confirm("Delete this movie?")) {
      await axios.delete(`${API_URL}/movies/${id}`);
      fetchMovies();
    }
  };

  const viewDetails = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/movies/${id}`);
      setSelectedMovie(res.data);
      setView('details');
    } catch (err) { alert("Error fetching details"); }
  };

  const editMovie = (movie) => {
    setMovieForm(movie);
    setEditId(movie.id);
    setView('add');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      
      {/* --- RESTORED PREVIOUS HEADER --- */}
      <nav className="bg-gray-800 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center border-b border-gray-700">
        <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
           MovieMania
        </h1>
        <div className="space-x-4">
          <button onClick={() => setView('home')} className={`px-3 py-1 rounded transition ${view==='home' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>🏠 Home</button>
          <button onClick={() => {setView('add'); setEditId(null);}} className={`px-3 py-1 rounded transition ${view==='add' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>➕ Add Movie</button>
          <button onClick={() => setView('feedback')} className={`px-3 py-1 rounded transition ${view==='feedback' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>⭐ Reviews</button>
        </div>
      </nav>

      {/* VIEW: HOME */}
      {view === 'home' && (
        <>
          {/* --- HERO CAROUSEL --- */}
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden border-b border-gray-700">
             {movies.length > 0 ? (
                <div className="container mx-auto px-4 py-10 flex flex-col-reverse md:flex-row items-center gap-8 min-h-[450px]">
                   
                   {/* Left: Text Info */}
                   <div className="md:w-1/2 space-y-4 animate-fade-in">
                      <span className="bg-red-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-widest">Featured Movie</span>
                      <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">{movies[currentSlide].title}</h2>
                      <div className="flex items-center gap-3 text-sm">
                         <span className="text-yellow-400 font-bold">★ {movies[currentSlide].rating}/10</span>
                         <span className="text-gray-400">|</span>
                         <span className="text-gray-300 uppercase">{movies[currentSlide].genre}</span>
                      </div>
                      <p className="text-gray-300 text-lg line-clamp-3">{movies[currentSlide].description}</p>
                      <div className="pt-2">
                         <button onClick={() => viewDetails(movies[currentSlide].id)} className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded font-bold transition">View Details</button>
                      </div>
                   </div>

                   {/* Right: Poster (Original Ratio) */}
                   <div className="md:w-1/2 flex justify-center md:justify-end relative">
                      {/* Blurred Background Glow */}
                      <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-20 rounded-full"></div>
                      
                      <img 
                        src={movies[currentSlide].poster_url} 
                        alt={movies[currentSlide].title} 
                        className="relative w-64 md:w-80 rounded-lg shadow-2xl border-4 border-gray-800 transform transition duration-700 hover:scale-105"
                      />
                   </div>

                   {/* Carousel Dots */}
                   <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {movies.map((_, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'w-6 bg-red-500' : 'w-2 bg-gray-600'}`}
                         />
                      ))}
                   </div>
                </div>
             ) : (
                <div className="text-center py-20 text-gray-500">Loading Movies...</div>
             )}
          </div>

          {/* SEARCH BAR */}
          <div className="container mx-auto px-4 mt-8 mb-6">
            <input 
              type="text" 
              placeholder="🔍 Search movies by title or genre..." 
              className="w-full md:w-1/2 mx-auto block p-3 rounded-full bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-red-500 outline-none shadow-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* MOVIE GRID */}
          <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
            {filteredMovies.map(m => (
              <div key={m.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-2 transition duration-300 group border border-gray-700">
                <div className="relative h-96 w-full">
                   <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                   <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-2 py-1 rounded text-xs">★ {m.rating}</div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold truncate text-gray-100">{m.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{m.genre}</p>
                  
                  <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                    <button onClick={() => viewDetails(m.id)} className="text-blue-400 hover:text-blue-300 text-sm font-bold">View</button>
                    <div className="flex gap-3">
                      <button onClick={() => editMovie(m)} className="text-gray-400 hover:text-white text-xs uppercase">Edit</button>
                      <button onClick={() => deleteMovie(m.id)} className="text-red-400 hover:text-red-300 text-xs uppercase">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SINGLE MOVIE DETAILS VIEW */}
      {view === 'details' && selectedMovie && (
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-4xl w-full flex flex-col md:flex-row gap-8 border border-gray-700">
            <div className="md:w-1/3">
               <img src={selectedMovie.poster_url} className="w-full rounded shadow-lg" />
            </div>
            <div className="md:w-2/3 flex flex-col justify-center">
              <h2 className="text-4xl font-bold mb-2 text-white">{selectedMovie.title}</h2>
              <div className="flex gap-2 mb-4">
                 <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold uppercase">{selectedMovie.genre}</span>
                 <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">★ {selectedMovie.rating}/10</span>
              </div>
              <p className="text-gray-300 mb-8 leading-relaxed text-lg">{selectedMovie.description}</p>
              <button onClick={() => setView('home')} className="self-start bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition">← Back to Home</button>
            </div>
          </div>
        </div>
      )}

      {/* FORMS (Add/Edit/Feedback) */}
      {(view === 'add' || view === 'feedback') && (
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-red-500">{view === 'add' ? (editId ? "Update Movie" : "Add New Movie") : "Reviews"}</h2>
            
            <form onSubmit={view === 'add' ? handleMovieSubmit : handleFeedbackSubmit} className="space-y-4">
               {view === 'add' ? (
                 <>
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-red-500 outline-none" placeholder="Title" required value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-red-500 outline-none" placeholder="Genre" value={movieForm.genre} onChange={e => setMovieForm({...movieForm, genre: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-red-500 outline-none" placeholder="Poster URL" value={movieForm.poster_url} onChange={e => setMovieForm({...movieForm, poster_url: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-red-500 outline-none" placeholder="Rating (0-10)" type="number" step="0.1" value={movieForm.rating} onChange={e => setMovieForm({...movieForm, rating: e.target.value})} />
                    <textarea className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-red-500 outline-none" placeholder="Description" rows="4" value={movieForm.description} onChange={e => setMovieForm({...movieForm, description: e.target.value})} />
                 </>
               ) : (
                 <>
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" placeholder="Name" required value={feedbackForm.name} onChange={e => setFeedbackForm({...feedbackForm, name: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" placeholder="Email" type="email" required value={feedbackForm.email} onChange={e => setFeedbackForm({...feedbackForm, email: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" placeholder="Movie Title" value={feedbackForm.movie} onChange={e => setFeedbackForm({...feedbackForm, movie: e.target.value})} />
                    <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" placeholder="Rating (1-10)" type="number" max="10" required value={feedbackForm.rating} onChange={e => setFeedbackForm({...feedbackForm, rating: e.target.value})} />
                 </>
               )}
               <button className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-white transition">{view === 'add' ? (editId ? "Update" : "Submit") : "Submit Review"}</button>
            </form>
            <button onClick={() => setView('home')} className="w-full text-center text-gray-500 text-sm mt-4 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center p-6 text-gray-500 text-sm mt-10 border-t border-gray-700">
        <p>MovieMania © 2025</p>
        <p>📍 Location: {location ? `${location.lat.toFixed(2)}, ${location.long.toFixed(2)}` : "Locating..."}</p>
      </footer>
    </div>
  );
}

export default App;
