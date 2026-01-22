import React, { useState } from "react";
import BeautifulAussie from "../assets/video/beautifulAussie.mp4";
import BeautyBlonde from "../assets/pics/beautiful_aussie_girl.webp";

export default function About() {
  const [isHovered, setIsHovered] = useState(false);

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      width: "100%",
      height: "calc(100vh - 80px)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "var(--primary-bg)",
      padding: "0 20px",
      boxSizing: "border-box", 
    },
    heading: {
      margin: "20px 0",
      fontSize: "2.5rem",
      textAlign: "center",
      color: "var(--text-color, #333)",
    },
    subHeading: {
      fontSize: "1.2rem",
      textAlign: "center",
      maxWidth: "800px",
      marginBottom: "30px",
      lineHeight: "1.6",
      fontWeight: "400",
    },
    hoverTrigger: {
      position: "relative",
      color: "#0066cc",
      textDecoration: "underline",
      textDecorationStyle: "dotted",
      cursor: "pointer",
      fontWeight: "bold",
      display: "inline-block",
    },
    popupImage: {
      position: "absolute",
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "250px",
      height: "auto",
      marginBottom: "10px",
      borderRadius: "8px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      border: "4px solid white",
      zIndex: 100,
      pointerEvents: "none",
    },
    videoWrapper: {
      flex: 1,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      paddingBottom: "20px",
    },
    videoPlayer: {
      maxHeight: "95%",
      maxWidth: "100%",
      borderRadius: "12px",
      boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
      display: "block",
      objectFit: "contain",
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.heading}>About the Educational Games Hub</h1>

      <h2 style={styles.subHeading}>
        My beautiful blonde Aussie engineer has just gotten back from her
        vacation in { }  
        <span
          style={styles.hoverTrigger}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Hawaii
          {isHovered && (
            <img
              src={BeautyBlonde}
              alt="Vacation in Hawaii"
              style={styles.popupImage}
            />
          )}
        </span>
        . Listen to her carefully to learn about the Game Hub I wonderfully
        created!!
      </h2>

      <div style={styles.videoWrapper}>
        <video controls style={styles.videoPlayer}>
          <source src={BeautifulAussie} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}


