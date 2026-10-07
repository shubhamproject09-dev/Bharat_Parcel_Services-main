import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store/store.jsx'

// Logo
import logo from './assets/Logo/favicon.png'

// Set favicon
const favicon = document.querySelector('link[rel="icon"]')

if (favicon) {
  favicon.href = logo
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)