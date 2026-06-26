export function initPlayer(audioUrl) {
  const bar = document.getElementById('music-bar');
  const audio = document.getElementById('audio-el');
  const playBtn = document.getElementById('play-btn');
  const seekEl = document.getElementById('seek');
  const elapsed = document.getElementById('elapsed');
  const total = document.getElementById('total');
  const volEl = document.getElementById('volume');

  audio.src = audioUrl;
  bar.classList.remove('hidden');

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.textContent = '⏸';
    } else {
      audio.pause();
      playBtn.textContent = '▶';
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    seekEl.value = (audio.currentTime / audio.duration) * 100;
    elapsed.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    total.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    playBtn.textContent = '▶';
    seekEl.value = 0;
  });

  seekEl.addEventListener('input', () => {
    if (audio.duration) {
      audio.currentTime = (seekEl.value / 100) * audio.duration;
    }
  });

  volEl.addEventListener('input', () => {
    audio.volume = volEl.value / 100;
  });
}
