import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Xarrow from 'react-xarrows';

const App = () => {
  return (
    <div>
      <div id="box1" style={{width: 50, height: 50, background: 'red', margin: 50}}></div>
      <Xarrow start="box1" end="missing" />
    </div>
  );
};
