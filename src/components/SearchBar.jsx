// src/components/SearchBar.jsx
import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value); // Pass the query back to App.js
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleSearchChange}
      placeholder="Search for a movie"
    />
  );
};

export default SearchBar;
