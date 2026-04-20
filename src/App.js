import React from "react";
import VoiceNotes from "./components/VoiceNotes";
import "./styles.css";

function App() {
  return (
    <div className="app">
      <h1 className="title">🎤 Ultimate Voice Notes</h1>
      <VoiceNotes />
    </div>
  );
}

export default App;