/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const tokenRes = await api.post("/token/", data);
      
      login(tokenRes.data.access);
      
      navigate("/games");
      
    } catch (err: any) {
      console.error("Login error details:", err.response?.data);

      alert("Login Failed: Please check your username and password.");
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h2>Welcome Mate!</h2>
        <p>Log in to enjoy the party!</p>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <input 
            placeholder="Your Name" 
            {...register("username", { required: true })} 
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Secret Password"
            {...register("password", { required: true })}
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Let's Go!"}
          </button>
        </form>
      </div>
    </div>
  );
}