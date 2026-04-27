import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useUser();

  async function signUpWithBackend({ username, email, password }) {
    let response;
    try {
      response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
    } catch {
      throw new Error('Unable to reach authentication server. Make sure backend is running on port 4000.');
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error || 'Sign up failed');
    }

    return body;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const username = form[0].value;
    const email = form[1].value;
    const password = form[2].value;
    const confirm = form[3].value;
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    try {
      const data = await signUpWithBackend({ username, email, password });
      const resolvedUsername = data?.user?.username || username;
      login({ email, username: resolvedUsername });
      navigate('/');
    } catch (error) {
      alert(error.message || 'Sign up failed');
      return;
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-0 rounded-2xl shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-md relative">
        <button
          type="button"
          aria-label="Go back"
          className="CyberButton CyberButton--secondary absolute left-4 top-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <CardHeader className="pt-12 pb-4 text-center">
          <CardTitle className="text-2xl font-extrabold text-blue-900 tracking-tight">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <input type="text" placeholder="Choose a username" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <input type="email" placeholder="Enter your email" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <input type="password" placeholder="Create a password" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <input type="password" placeholder="Confirm your password" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <Button type="submit" className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-md text-base shadow-lg transition">Sign Up</Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/signin" className="text-blue-700 hover:underline text-sm">Already have an account?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
