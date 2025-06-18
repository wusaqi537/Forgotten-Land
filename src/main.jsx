import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QuestProvider } from "./components/QuestContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QuestProvider>
      <App />
    </QuestProvider>
  </React.StrictMode>,
)
