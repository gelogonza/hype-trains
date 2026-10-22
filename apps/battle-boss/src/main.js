import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadTemplate } from './TemplateView.js';
import { BattleBoss } from './BattleBoss.js';

fetch(`${import.meta.env.BASE_URL}template.html`)
  .then((response) => { if (!response.ok) throw new Error('Could not load the UI template'); return response.text(); })
  .then((template) => {
    loadTemplate(template);
    createRoot(document.getElementById('root')).render(
      React.createElement(BattleBoss)
    );
  })
  .catch((error) => { document.getElementById('root').textContent = error.message; });
