import { registerSW } from 'virtual:pwa-register';
registerSW();
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { RefreshProvider } from './contexts/RefreshContext'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <RefreshProvider>
      <App />
    </RefreshProvider>
  </BrowserRouter>
)
