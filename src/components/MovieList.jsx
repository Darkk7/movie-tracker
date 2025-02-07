import React, { useState, useEffect } from 'react';
import axios from 'axios';
import supabase from '../supabaseClient'; // Import your Supabase client

const MovieList = ({ searchQuery }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchedMovies, setWatchedMovies] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [checkedCount, setCheckedCount] = useState(0);

  // Fetch movies from API
  const fetchMovies = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: {
          api_key: '89d836126a639fab60dcec363de606d0',
          query,
          page: 1,
        },
      });

      const fetchedMovies = response.data.results
        .filter((movie) => movie.title) // Remove movies with missing titles
        .map((movie) => ({
          id: movie.id, 
          title: movie.title,
          release_date: movie.release_date || 'Unknown',
          watched: false, // Default unchecked
        }));

      setMovies(fetchedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch watched movies from the database
  const fetchWatchedMovies = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('tmdb_id')
      .eq('watched', true);

    if (error) {
      console.error('Error fetching watched movies:', error);
    } else {
      // Store watched movies as a Set for faster lookup
      const watchedSet = new Set(data.map((movie) => movie.tmdb_id));
      setWatchedMovies(watchedSet);

      setMovies((prevMovies) =>
        prevMovies.map((movie) => ({
          ...movie,
          watched: watchedSet.has(movie.id),
        }))
      );

      setCheckedCount(watchedSet.size); // Count only valid movies
    }
  };

  useEffect(() => {
    fetchMovies(searchQuery);
    fetchWatchedMovies();
  }, [searchQuery]);

  const handleCheckboxChange = async (tmdbId, isChecked) => {
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === tmdbId ? { ...movie, watched: isChecked } : movie
      )
    );

    // Update watched movies in the database
    try {
      await supabase.from('movies').upsert({ tmdb_id: tmdbId, watched: isChecked }, { onConflict: ['tmdb_id'] });
      fetchWatchedMovies(); // Refresh the list after updating
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  const handleSave = async () => {
    const updatedMovies = movies
      .filter((movie) => movie.watched && movie.title) // Ensure valid data
      .map((movie) => ({
        tmdb_id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        watched: movie.watched,
      }));

    if (updatedMovies.length === 0) {
      console.log('No movies marked as watched.');
      return;
    }

    try {
      const { error } = await supabase.from('movies').upsert(updatedMovies, { onConflict: ['tmdb_id'] });

      if (error) {
        console.error('Error saving watched status:', error.message);
      } else {
        setSuccessMessage('Movies saved successfully!');
        fetchWatchedMovies();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  const removeAllWatched = async () => {
    const userConfirmed = window.confirm('Are you sure you want to remove all watched movies?');

    if (!userConfirmed) {
      return;
    }

    try {
      await supabase.from('movies').update({ watched: false }).eq('watched', true);
      fetchWatchedMovies();
      setSuccessMessage('All movies removed from watched!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Unexpected error during remove all watched:', error);
    }
  };

  if (loading) return <p>Loading movies...</p>;
  if (error) return <p>Error fetching movies: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Movie Watchlist</h1>

      {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

      <div style={styles.movieList}>
        {movies.map((movie) => (
          <div key={movie.id} style={styles.movieCard}>
            <label style={styles.movieLabel}>
              <input
                type="checkbox"
                checked={watchedMovies.has(movie.id)}
                onChange={(e) => handleCheckboxChange(movie.id, e.target.checked)}
                style={styles.checkboxInput}
              />
              <span
                style={{
                  ...styles.movieTitle,
                  textDecoration: watchedMovies.has(movie.id) ? 'line-through' : 'none',
                }}
              >
                {movie.title} ({movie.release_date.split('-')[0] || 'Unknown'})
              </span>
            </label>
          </div>
        ))}
      </div>

      <div style={styles.saveContainer}>
        <button style={styles.saveButton} onClick={handleSave}>Save Watched Status</button>
        <button style={{ ...styles.deleteButton, ...styles.buttonSpacing }} onClick={removeAllWatched}>
          REMOVE ALL MOVIES FROM WATCHED
        </button>

        <div style={styles.counter}>Movies marked as watched: {checkedCount}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f4f4f9',
    maxWidth: '900px',
    margin: '0 auto',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    textAlign: 'center',
    fontSize: '2rem',
    color: '#333',
    marginBottom: '20px',
  },
  movieList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  movieCard: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0px rgba(0, 0, 0, 0.1)',
    display: 'flex',
  },
  successMessage: {
    color: '#28a745',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonSpacing: { marginLeft: '10px' },
  counter: { marginTop: '10px', fontSize: '1.2rem', color: '#333' },
};

export default MovieList;
