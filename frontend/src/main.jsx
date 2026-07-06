/**
 * Ponto de Entrada de Renderização (React DOM)
 * Configura o Context Provider e renderiza o componente raiz no navegador.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
