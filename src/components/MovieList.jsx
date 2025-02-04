import React, { useState, useEffect } from 'react';
import axios from 'axios';
import supabase from '../supabaseClient'; // Import your supabase client

const MovieList = ({ searchQuery }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [checkedCount, setCheckedCount] = useState(0); // State for count of checked movies

  // Fetch movies from API
  const fetchMovies = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: {
          api_key: '89d836126a639fab60dcec363de606d0',
          query: searchQuery,
          page: 1,
        },
      });

      const fetchedMovies = response.data.results
        .filter((movie) => movie.title)
        .map((movie) => ({
          ...movie,
          watched: false,
        }));

      setMovies(fetchedMovies);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error);
      setLoading(false);
    }
  };

  // Fetch watched movies from the database
  const fetchWatchedMovies = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('watched', true);

    if (error) {
      console.error('Error fetching watched movies:', error);
    } else {
      // Filter out blank records
      const validWatchedMovies = data.filter((movie) => movie.tmdb_id && movie.title);

      // Update watchedMovies state
      setWatchedMovies(validWatchedMovies.map((movie) => movie.tmdb_id));

      // Update movies state with watched status
      setMovies((prevMovies) =>
        prevMovies.map((movie) => ({
          ...movie,
          watched: validWatchedMovies.some((watchedMovie) => watchedMovie.tmdb_id === movie.id),
        }))
      );

      // Update the checked count based on valid watched movies
      setCheckedCount(validWatchedMovies.length);
    }
  };

  useEffect(() => {
    fetchMovies(searchQuery);
    fetchWatchedMovies();
  }, [searchQuery]);

  // Handle checkbox change and update database
  const handleCheckboxChange = async (tmdbId, isChecked) => {
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === tmdbId ? { ...movie, watched: isChecked } : movie
      )
    );

    const updatedMovie = { tmdb_id: tmdbId, watched: isChecked };

    try {
      await supabase.from('movies').upsert(updatedMovie, { onConflict: ['tmdb_id'] });
      fetchWatchedMovies(); // Fetch updated watched movies after saving
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  // Save watched status to the database
  const handleSave = async () => {
    const updatedMovies = movies
      .filter((movie) => movie.watched && movie.title)
      .map((movie) => ({
        tmdb_id: movie.id,
        title: movie.title || 'Unknown Title',
        release_date: movie.release_date,
        watched: movie.watched,
      }));

    if (updatedMovies.length === 0) {
      console.log('No movies marked as watched or missing titles.');
      return;
    }

    try {
      const { error } = await supabase.from('movies').upsert(updatedMovies, { onConflict: ['tmdb_id'] });

      if (error) {
        console.error('Error saving watched status:', error.message);
        setSuccessMessage('');
      } else {
        setSuccessMessage('Movies saved successfully!'); // Set success message
        fetchWatchedMovies(); // Fetch the updated watched movies list
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  // Remove all watched movies
  const removeAllWatched = async () => {
    const userConfirmed = window.confirm('Are you sure you want to remove all watched movies?');

    if (!userConfirmed) {
      return;
    }

    try {
      const updatedMovies = movies.map((movie) => ({
        ...movie,
        watched: false,
      }));

      setMovies(updatedMovies);

      const { error } = await supabase.from('movies').update({ watched: false }).eq('watched', true);

      if (error) {
        console.error('Error removing all watched statuses:', error.message);
      } else {
        fetchWatchedMovies();
        setSuccessMessage('All movies removed from watched!');
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      }
    } catch (error) {
      console.error('Unexpected error during remove all watched:', error);
    }
  };

  if (loading) return <p>Loading movies...</p>;
  if (error) return <p>Error fetching movies: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Don't search here</h1>

      {/* Success Message */}
      {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={() => {}}
          disabled
          style={styles.searchBar}
        />
      </div>

      <div style={styles.movieList}>
        {movies.map((movie) => (
          <div key={movie.id} style={styles.movieCard}>
            <label style={styles.movieLabel}>
              <input
                type="checkbox"
                checked={watchedMovies.includes(movie.id)}
                onChange={(e) =>
                  handleCheckboxChange(movie.id, e.target.checked)
                }
                style={styles.checkboxInput}
              />
              <span
                style={{
                  ...styles.movieTitle,
                  textDecoration: watchedMovies.includes(movie.id)
                    ? 'line-through'
                    : 'none',
                }}
              >
                {movie.title} ({movie.release_date?.split('-')[0] || 'Unknown'})
              </span>
            </label>
          </div>
        ))}
      </div>

      <div style={styles.saveContainer}>
        <button variant="primary" style={styles.saveButton} onClick={handleSave}>
          Save Watched Status
        </button>

        <button style={{ ...styles.deleteButton, ...styles.buttonSpacing }} onClick={removeAllWatched}>
          REMOVE ALL MOVIES FROM WATCHED
        </button>

        {/* Counter for checked movies */}
        <div style={styles.counter}>
          Movies marked as watched: {checkedCount}
        </div>
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
  searchContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  searchBar: {
    padding: '10px',
    fontSize: '1rem',
    width: '80%',
    maxWidth: '400px',
    border: '1px solid #ccc',
    borderRadius: '4px',
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
    boxShadow: '0px rgba(0 ,0 ,0)',
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
    textAlign: 'center',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  saveContainer: { textAlign: 'center' },
  deleteButton: {
    padding: '10px 20px',
    textAlign: 'center',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonSpacing: {
    marginLeft: '10px',
  },
  counter: {
    marginTop: '10px',
    fontSize: '1.2rem',
    color: '#333',
  },
};

export default MovieList;
