import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DataProvider } from './DataContext'
import { ToastProvider } from './ToastContext'
import FolderSetup from './FolderSetup'

function Root() {
  const [folderPath, setFolderPath] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    window.indexifyFS.getSavedFolder().then((saved) => {
      setFolderPath(saved)
      setChecking(false)
    })
  }, [])

  if (checking) return null
  if (!folderPath) return <FolderSetup onComplete={setFolderPath} />

  return (
    <DataProvider folderPath={folderPath}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DataProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)