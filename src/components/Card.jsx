import React from 'react';
import './Card.css';

export default function Card({ data }) {
  if (!data) return null;
  return (
    <div className="tcg-card">
      <img src={data.imageUrl || data.artUrl} alt={data.name || 'Card'} className="full-card-image" />
    </div>
  );
}
