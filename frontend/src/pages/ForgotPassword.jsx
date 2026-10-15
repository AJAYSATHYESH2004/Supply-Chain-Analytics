import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await forgotPassword(email);
      setMessage('If an account exists for this email, you will receive a reset link shortly.');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl">
          {message ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-accent text-sm">
                {message}
              </div>
              <Link to="/login" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
                  <input
                    type="email"
                    required
                    className="w-full bg-background/50 border border-border rounded-xl py-3 pl-11 pr-4 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Send Reset Link
                    <Send size={18} />
                  </>
                )}
              </button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
