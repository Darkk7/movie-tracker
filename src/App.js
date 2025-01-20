import React, { useState } from 'react';
import MovieList from './components/MovieList';

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Handle input change to update the search query state
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Search Movie Here :)</h1>
      
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for a movie"
          style={styles.searchBar}
        />
      </div>

      {/* Pass searchQuery as a prop to MovieList component */}
      <MovieList searchQuery={searchQuery} />
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
};

export default App;
