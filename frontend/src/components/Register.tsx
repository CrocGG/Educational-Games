import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Use your centralized api service

export default function Register() {
    const navigate = useNavigate();
    
    // 1. State for form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // 2. Handle input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 3. Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            // Use the 'api' instance instead of axios directly
            await api.post('/register/', formData);

            setMessage('Registration successful! Redirecting to login...');
            
            // Optional: Redirect after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            // Try to extract the specific error message from Django
            const errorMsg = err.response?.data?.detail 
                || err.response?.data?.username?.[0] 
                || 'An error occurred during registration.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="form-card">
                <h2>Join the Party</h2>
                <p>Register if you are not a part of the party yet!</p>
                
                {/* Success Message */}
                {message && (
                    <div style={{ 
                        color: '#155724', 
                        backgroundColor: '#d4edda', 
                        padding: '10px', 
                        borderRadius: '4px', 
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        ✅ {message}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{ 
                        color: '#721c24', 
                        backgroundColor: '#f8d7da', 
                        padding: '10px', 
                        borderRadius: '4px', 
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input 
                        name="username" 
                        placeholder="Choose a Username"
                        type="text" 
                        onChange={handleChange} 
                        required 
                    />
                    
                    <input 
                        name="email" 
                        placeholder="Your Email"
                        type="email" 
                        onChange={handleChange} 
                        required 
                    />
                   
                    <input 
                        name="password" 
                        placeholder="Choose a Password"
                        type="password" 
                        onChange={handleChange} 
                        required 
                    />
                    
                    <br />
                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}