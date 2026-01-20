import BeautifulAussie from "../assets/video/beautifulAussie.mp4";

export default function About() {
  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 80px)', /* Adjusts for your navbar height */
      overflow: 'hidden',           /* Kills all scrolling */
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--primary-bg)', /* No more black background */
      padding: '0 20px',             /* Side padding without causing scroll */
      boxSizing: 'border-box'        /* Ensures padding doesn't add to width */
    }}>
      
      <h1 style={{ 
        margin: '20px 0', 
        fontSize: '2rem',
        textAlign: 'center' 
      }}>
        About the Educational Games Hub
      </h1>
      
      <div style={{
        flex: 1,           /* Takes up remaining space */
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' /* Safety for the video container */
      }}>
        <video 
          controls 
          style={{ 
            maxHeight: '95%',  /* Stays within the flex container */
            maxWidth: '100%', 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-hover)',
            display: 'block'
          }}
        >
          <source src={BeautifulAussie} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}