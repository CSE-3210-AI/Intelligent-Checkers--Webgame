import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useUser();
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form[0].value;
    const password = form[1].value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    const username = data.user?.user_metadata?.username || data.user?.email;
    login({ email: data.user.email, username });
    navigate('/');
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-slate-100 to-blue-100 px-4">
      <Card className="w-full max-w-md p-0 rounded-2xl shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-md relative">
        <button
          type="button"
          aria-label="Go back"
          className="absolute left-4 top-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <CardHeader className="pt-12 pb-4 text-center">
          <CardTitle className="text-2xl font-extrabold text-blue-900 tracking-tight">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <input type="email" placeholder="Enter your email" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <input type="password" placeholder="Enter your password" className="px-4 py-3 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base text-black placeholder:text-slate-500 transition" />
            <Button type="submit" className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-md text-base shadow-lg transition">Sign In</Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/signup" className="text-blue-700 hover:underline text-sm">Create Account</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
