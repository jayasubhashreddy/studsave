import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('sn_token', token);
      window.location.href = '/';
    } else {
      navigate('/login', { replace: true });
    }
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--green)', borderTopColor: 'transparent' }} />
        <span className="text-sm" style={{ color: 'var(--ink3)' }}>Signing you in…</span>
      </div>
    </div>
  );
}
