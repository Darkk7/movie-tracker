import React, { useState, useEffect } from 'react';
import axios from 'axios';
import supabase from '../supabaseClient'; // Import your supabase client

const MovieList = ({ searchQuery }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchedMovies, setWatchedMovies] = useState([]); // Stores watched movie IDs

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
  
      // Log the fetched data to check titles
      console.log('Fetched movies: ', response.data.results);
  
      // Filter out movies without a title
      const fetchedMovies = response.data.results.filter(movie => movie.title);
  
      // Log the filtered movies
      console.log('Filtered movies: ', fetchedMovies);
  
      setMovies(fetchedMovies);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error);
      setLoading(false);
    }
  };
  
  

  const fetchWatchedMovies = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('watched', true);
    if (error) {
      console.error('Error fetching watched movies:', error);
    } else {
      setWatchedMovies(data.map(movie => movie.tmdb_id)); // Save watched movie IDs
    }
  };

  // Fetch movies and watched status when component mounts or search query changes
  useEffect(() => {
    fetchMovies(searchQuery);
    fetchWatchedMovies();
  }, [searchQuery]);

  const handleCheckboxChange = async (tmdbId, isChecked) => {
    console.log('Checkbox clicked:', tmdbId, isChecked);

    // Toggle the watched status in local state immediately
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === tmdbId ? { ...movie, watched: isChecked } : movie
      )
    );

    // Save the updated status to Supabase
    const updatedMovie = {
      tmdb_id: tmdbId,
      watched: isChecked,
    };

    try {
      const { data, error } = await supabase
        .from('movies')
        .upsert(updatedMovie, { onConflict: ['tmdb_id'] });

      if (error) {
        console.error('Error saving watched status:', error);
      } else {
        console.log('Movie status saved:', data);
        fetchWatchedMovies(); // Fetch updated watched movies list
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  const handleSave = async () => {
    // Filter movies to include only those that have a title and are marked as watched
    const updatedMovies = movies
      .filter((movie) => movie.watched && movie.title) // Only include movies with a title and marked as watched
      .map((movie) => ({
        tmdb_id: movie.id,
        title: movie.title || 'Unknown Title', // Provide a fallback value in case title is missing
        release_date: movie.release_date,
        watched: movie.watched,
      }));
  
    if (updatedMovies.length === 0) {
      console.log('No movies marked as watched or missing titles.');
      return; // Exit early if no movies meet the criteria
    }
  
    // Logging the updatedMovies array to check the content before saving
    console.log('Movies to save: ', updatedMovies);
  
    try {
      const { data, error } = await supabase
        .from('movies')
        .upsert(updatedMovies, { onConflict: ['tmdb_id'] });
  
      if (error) {
        console.error('Error saving watched status:', error.message);
      } else {
        console.log('Movies saved successfully:', data);
        fetchWatchedMovies(); // Fetch updated watched movies list
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };  

  const getReleaseYear = (releaseDate) => {
    return releaseDate ? releaseDate.split('-')[0] : 'Unknown';
  };

  const isMovieWatched = (movieId) => {
    return watchedMovies.includes(movieId); // Check if movie ID exists in watchedMovies
  };

  if (loading) {
    return <p>Loading movies...</p>;
  }

  if (error) {
    return <p>Error fetching movies: {error.message}</p>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Don't search here</h1>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={() => {}}
          placeholder="Search for a movie..."
          disabled
          style={styles.searchBar}
        />
      </div>

      {/* Movie List */}
      <div style={styles.movieList}>
        {movies.map((movie) => {
          const releaseYear = getReleaseYear(movie.release_date);
          const isWatched = isMovieWatched(movie.id);

          return (
            <div key={movie.id} style={styles.movieCard}>
              <label style={styles.movieLabel}>
                <input
                  type="checkbox"
                  checked={isWatched} // Use the watched status from watchedMovies
                  onChange={(e) => handleCheckboxChange(movie.id, e.target.checked)} // Toggle watched status
                  style={styles.checkboxInput}
                />
                <span
                  style={{
                    ...styles.movieTitle,
                    textDecoration: isWatched ? 'line-through' : 'none',
                  }}
                >
                  {movie.title} ({releaseYear})
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div style={styles.saveContainer}>
        <button style={styles.saveButton} onClick={handleSave}>
          Save Watched Status
        </button>
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
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movieLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxInput: {
    marginRight: '10px',
  },
  movieTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
  },
  saveContainer: {
    textAlign: 'center',
    marginTop: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default MovieList;
