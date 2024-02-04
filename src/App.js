// App.js
import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import './App.css'; 

const dbPromise = openDB('audio-db', 1, {
  upgrade(db) {
    db.createObjectStore('audios');
  },
});
async function storeAudio(name, data) {
  const db = await dbPromise;
  const tx = db.transaction('audios', 'readwrite');
  tx.store.put(data, name);
  await tx.done;
}

async function getAudio(name) {
  const db = await dbPromise;
  return db.transaction('audios').store.get(name);
}

async function getAllAudios() {
  const db = await dbPromise;
  return db.transaction('audios').store.getAll();
}

function AudioPlayer({ src, onEnded, ...props }) {
  const audioRef = React.useRef();

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      localStorage.setItem('lastPlayedTime', audio.currentTime);
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  useEffect(() => {
    const lastPlayedTime = localStorage.getItem('lastPlayedTime');
    if (lastPlayedTime) {
      audioRef.current.currentTime = lastPlayedTime;
    }
  }, [src]);

  return (
    <audio
      ref={audioRef}
      src={URL.createObjectURL(src)}
      controls
      onEnded={onEnded}
      {...props}
    />
  );
}

function App() {
  const [audios, setAudios] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await storeAudio(selectedFile.name, selectedFile);
      setAudios((prev) => [...prev, selectedFile]);
      setSelectedFile(null); 
    }
  };

  const handlePlay = (audio) => {
    setNowPlaying(audio);
    localStorage.setItem('lastPlayedAudio', audio.name);
  };

  const handleEnded = () => {
    const currentIndex = audios.findIndex((audio) => audio.name === nowPlaying.name);
    const nextIndex = (currentIndex + 1) % audios.length;
    const nextAudio = audios[nextIndex];
    setNowPlaying(nextAudio);
    localStorage.setItem('lastPlayedAudio', nextAudio.name);
  };

  useEffect(() => {
    const lastPlayedAudio = localStorage.getItem('lastPlayedAudio');
    if (lastPlayedAudio) {
      getAudio(lastPlayedAudio).then((audio) => {
        if (audio) {
          setNowPlaying(audio);
        }
      });
    }
  }, []);

  useEffect(() => {
    getAllAudios().then((allAudios) => {
      setAudios(allAudios);
    });
  }, []);
  const handleNext = () => {
    if (audios.length > 0 && nowPlaying) {
      const currentIndex = audios.findIndex((audio) => audio.name === nowPlaying.name);
      const nextIndex = (currentIndex + 1) % audios.length;
      const nextAudio = audios[nextIndex];
      setNowPlaying(nextAudio);
      localStorage.setItem('lastPlayedAudio', nextAudio.name);
    }
  };

  return (
    <div className="app">
      <h1 className="title">Audio Player</h1>
      <div className="input-container">
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
      <div className="player-container">
        <div className="player">
          {nowPlaying ? (
            <div>
              <h2>Now Playing: {nowPlaying.name}</h2>
              <AudioPlayer src={nowPlaying} autoPlay onEnded={handleEnded} />
            </div>
          ) : (
            <h2 className="empty-message">{audios.length > 0 ? "Select a song to play" : "Upload a song to play"}</h2>
          )}
        </div>
        <div className="playlist">
          <h2 className="column-heading">Playlist</h2>
          {audios.length > 0 ? (
            audios.map((audio, i) => (
              <button key={i} className="audio-button" onClick={() => handlePlay(audio)}>
                {audio.name}
              </button>
            ))
          ) : (
            <p className="empty-message">No songs added</p>
          )}
        </div>
      </div>
      <button className='btnNext' onClick={handleNext}>Next</button>
    </div>
  );
}

export default App;