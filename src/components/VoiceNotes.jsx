import React, { useState, useRef, useEffect } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceNotes() {
  const [notes, setNotes] = useState([]);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [tag, setTag] = useState("General");
  const [manualText, setManualText] = useState("");

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // Load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notes"));
    const theme = JSON.parse(localStorage.getItem("theme"));
    if (saved) setNotes(saved);
    if (theme) setDarkMode(theme);
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(darkMode));
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  // Speech to text
  const startListening = () => {
    if (!SpeechRecognition) return alert("Not supported");
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      addNote(text);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
  };

  // Add note
  const addNote = (text, audioURL = null) => {
    if (!text && !audioURL) return;
    setNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: text || "Voice Note",
        audio: audioURL,
        tag,
        date: new Date().toLocaleString()
      }
    ]);
    setManualText("");
  };

  // Audio recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      addNote("", url);
      audioChunks.current = [];
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const playVoice = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, text: editText } : n));
    setEditingId(null);
  };

  const filtered = notes.filter(n =>
    n.text.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: notes.length,
    tags: [...new Set(notes.map(n => n.tag))].length
  };

  return (
    <div className="container">
      <div className="top-bar">
        <button onClick={startListening} className="mic">
          {listening ? "🎧 Listening" : "🎙 Speak"}
        </button>
        <button
          onClick={recording ? stopRecording : startRecording}
          className="mic"
        >
          {recording ? "⏹ Stop" : "⏺ Record"}
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="toggle">
          {darkMode ? "☀" : "🌙"}
        </button>
      </div>

      <input
        className="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={tag} onChange={(e) => setTag(e.target.value)}>
        <option>General</option>
        <option>Study</option>
        <option>Ideas</option>
        <option>Tasks</option>
      </select>

      {/* Manual Note Input */}
      <div className="manual">
        <input
          type="text"
          placeholder="Write a note..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
        />
        <button onClick={() => addNote(manualText)}>Add</button>
      </div>

      <div className="stats">
        <p>Total Notes: {stats.total}</p>
        <p>Categories: {stats.tags}</p>
      </div>

      <div className="notes">
        {filtered.map(note => (
          <div key={note.id} className="note">
            {editingId === note.id ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <button onClick={() => saveEdit(note.id)}>Save</button>
              </>
            ) : (
              <>
                <p>{note.text}</p>
                <span>{note.tag} • {note.date}</span>
              </>
            )}

            {note.audio && <audio controls src={note.audio}></audio>}

            <div className="actions">
              <button onClick={() => playVoice(note.text)}>▶</button>
              <button onClick={() => startEdit(note)}>✏</button>
              <button onClick={() => deleteNote(note.id)}>❌</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




