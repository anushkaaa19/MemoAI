import React from 'react'

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-600 text-white p-4">MemoAI</header>
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}

export default AppLayout