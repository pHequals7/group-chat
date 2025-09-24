import React, { useState } from 'react'
import { useAuth } from './AuthContext'

const LoginPage = () => {
    const { signInWithGoogle, signInWithEmail, signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleEmailAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isSignUp) {
                await signUp(email, password)
                setError('Check your email for confirmation link!')
            } else {
                await signInWithEmail(email, password)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')
        try {
            await signInWithGoogle()
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'rgb(0, 0, 46)',
            display: 'grid',
            gridTemplateColumns: '60% 40%'
        }}>
            {/* Left side - Brand section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{
                    color: 'white',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        marginBottom: '16px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                        Group Chat
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        opacity: 0.8,
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                        Chat with multiple AI models simultaneously in a WhatsApp-style interface
                    </p>
                </div>
            </div>

            {/* Right side - Login form */}
            <div style={{
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '320px'
                }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#1a1a1a',
                            marginBottom: '8px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h2>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px'
                        }}>
                            <p style={{ fontSize: '14px', color: '#dc2626' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth}>
                        <div style={{ marginBottom: '16px' }}>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease-in-out'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease-in-out'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-blue btn-large"
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                backgroundColor: '#10a37f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '500',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                transition: 'background-color 0.15s ease-in-out',
                                marginBottom: '16px'
                            }}
                            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d8f6a')}
                            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#10a37f')}
                        >
                            {loading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Continue')}
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '16px 0',
                            color: '#6b7280'
                        }}>
                            <div style={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#e5e7eb'
                            }}></div>
                            <span style={{
                                margin: '0 16px',
                                fontSize: '14px',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>OR</span>
                            <div style={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#e5e7eb'
                            }}></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                backgroundColor: 'white',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '500',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                transition: 'background-color 0.15s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}
                            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = 'white')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{
                                color: '#10a37f',
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: '14px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>

                    {/* Demo Account Info */}
                    <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '12px'
                    }}>
                        <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1e40af',
                            marginBottom: '8px'
                        }}>Demo Account</h3>
                        <div style={{
                            fontSize: '12px',
                            color: '#1d4ed8',
                            lineHeight: '1.4'
                        }}>
                            <p><strong>Email:</strong> admin@email.com</p>
                            <p><strong>Password:</strong> admin123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage