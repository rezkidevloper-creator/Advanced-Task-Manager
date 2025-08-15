import React from 'react';

const Filters = ({ onFilterChange }) => {
  const handleChange = (e) => {
    if (onFilterChange) {
      onFilterChange(e.target.value);
    }
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <label style={{ marginRight: '8px' }}>فلترة المنتجات:</label>
      <select onChange={handleChange}>
        <option value="">الكل</option>
        <option value="clothes">ملابس</option>
        <option value="shoes">أحذية</option>
        <option value="accessories">إكسسوارات</option>
      </select>
    </div>
  );
};

export default Filters;
