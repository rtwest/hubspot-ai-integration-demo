import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the login link!')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md">
        <h2 className="text-lg font-bold mb-4">Sign in</h2>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 mb-4 w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Send Magic Link
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  )
} 