import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
    } else {
      setError('');
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-md rounded-lg p-8 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h1>
        <p className="text-center text-gray-500 text-sm">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        <div className="space-y-4">
          <div className="border rounded-lg px-4 py-3 flex items-center space-x-3 bg-white shadow-sm">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Send Reset Link
          </button>

          {submitted && (
            <p className="text-green-600 text-sm text-center">
              A reset link has been sent to your email (simulated).
            </p>
          )}
        </div>

        <div className="text-center text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => navigate('/')}>Back to Login</div>
      </form>
    </div>
  );
};



export default ForgotPassword;