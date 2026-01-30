/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../services/api";
import type { Game } from "../models/types";
import { useAuth } from "../context/AuthContext";

interface GameFormData {
  name: string;
  image: FileList;
}

export default function ManagerPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<GameFormData>();

  if (!user || !user.is_admin) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "red" }}>
        <h2>Access Denied</h2>
        <p>You must be an administrator to view this page.</p>
      </div>
    );
  }

  const fetchGames = async () => {
    try {
      const res = await api.get("/games/");
      setGames(res.data);
    } catch (err) {
      console.error("Error fetching games", err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (editingGame) {
      setValue("name", editingGame.name);
    } else {
      reset();
    }
  }, [editingGame, setValue, reset]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this game?")) return;
    try {
      await api.delete(`/games/${id}/`);
      fetchGames();
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const onSubmit = async (data: GameFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);

    if (data.image && data.image.length > 0) {
      formData.append("image", data.image[0]);
    }

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      if (editingGame) {
        await api.patch(`/games/${editingGame.id}/`, formData, config);
      } else {
        await api.post("/games/", formData, config);
      }

      setEditingGame(null);
      reset();
      fetchGames();
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.name) {
        alert("Operation failed: Game name already exists.");
      } else {
        alert("Operation failed. Please check the console for details.");
      }
    }
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "Game Name", "High Score Player", "Top Player ID", "Image URL"];

    const rows = games.map((game) => [
      game.id,
      `"${game.name}"`,
      `"${game.high_score_player_username || "No records"}"`,
      game.high_score_player || "-",
      game.image || "No Image",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `games_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Manager Dashboard</h1>
      {/* Display username safely */}
      <p>Welcome, Admin {user?.username}</p>

      <div
        className="admin-panel"
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "15px",
        }}
      >

        {/* --- CSV DOWNLOAD BUTTON --- */}
        <div style={{ marginBottom: "10px", textAlign: "right" }}>
          <button
            onClick={handleDownloadCSV}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "8px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Download CSV
          </button>
        </div>
        <h3>{editingGame ? `Edit: ${editingGame.name}` : "Add New Game"}</h3>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <input
            placeholder="Game Name"
            {...register("name", { required: true })}
            style={{ padding: "5px" }}
          />
          {/* File input */}
          <input type="file" accept="image/*" {...register("image")} />

          <button type="submit">{editingGame ? "Update" : "Create"}</button>

          {editingGame && (
            <button
              type="button"
              onClick={() => {
                setEditingGame(null);
                reset();
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <table
        border={1}
        cellPadding={10}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th>Game Name</th>
            <th>High Score</th>
            <th>Top Player ID</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <td>
                <strong>{game.name}</strong>
                <br />
                <span style={{ fontSize: "0.8em", color: "#666" }}>
                  ID: {game.id.slice(0, 8)}...
                </span>
              </td>
              <td>
                {game.high_score_player_username ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    {game.high_score_player_username}
                  </span>
                ) : (
                  <span style={{ color: "#999", fontStyle: "italic" }}>
                    No records
                  </span>
                )}
              </td>
              <td>
                {game.high_score_player ? (
                  <span style={{ fontSize: "0.8em", fontFamily: "monospace" }}>
                    {game.high_score_player}
                  </span>
                ) : (
                  <span style={{ color: "#999" }}>-</span>
                )}
              </td>
              <td>
                {game.image && (
                  <img
                    src={game.image} 
                    alt={game.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                    }}
                  />
                )}
              </td>
              <td>
                <button onClick={() => setEditingGame(game)}>Edit</button>
                <button
                  onClick={() => handleDelete(game.id)}
                  style={{ marginLeft: "10px", color: "red" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}