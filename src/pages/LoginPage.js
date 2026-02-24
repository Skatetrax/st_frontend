import { useState } from "react";
import { login, checkSession } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [aLogin, setALogin] = useState("");
  const [aPasswordHash, setPasswordHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await login(aLogin, aPasswordHash);
      if (resp.message === "Login successful") {
        const session = await checkSession();
        onLogin(session);
        navigate("/dashboard");
      } else {
        setError(resp.message || "Login failed");
      }
    } catch (err) {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'linear-gradient(135deg, rgba(42, 27, 161, 0.85), rgba(29, 210, 177, 0.85) 100%), url("/images/skates.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(11, 15, 13, 0.75)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2.5rem 2rem 2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.25rem',
          }}>
            Skatetrax
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#a1a1aa',
            fontSize: '0.85rem',
            marginBottom: '1.75rem',
          }}>
            Sign in to your account
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              marginBottom: '1rem',
              color: '#f87171',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                Username
              </label>
              <input
                type="text"
                value={aLogin}
                onChange={e => setALogin(e.target.value)}
                placeholder="Enter your username"
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                value={aPasswordHash}
                onChange={e => setPasswordHash(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <div style={{
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'center',
        color: '#a1a1aa',
        fontSize: '0.8rem',
      }}>
        <span>&copy; {new Date().getFullYear()} Skatetrax</span>
      </div>
    </div>
  );
}
