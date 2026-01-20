import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>404</h1>
            <p style={styles.text}>Oops! The page you're looking for doesn't exist.</p>
            <Link to="/" style={styles.link}>
                Go back to Home
            </Link>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center' as const,
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        fontSize: '72px',
        margin: '0',
        color: '#333'
    },
    text: {
        fontSize: '18px',
        color: '#666',
        marginBottom: '20px'
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        fontWeight: 'bold' as const
    }
};