import { deriveKeyFromManifest, decryptBlob } from './crypto.js';
import { initPlayer } from './player.js';

const manifest = JSON.parse(document.getElementById('manifest').textContent);

const form = document.getElementById('unlock-form');
const input = document.getElementById('answer-input');
const errorMsg = document.getElementById('error-msg');
const lockSection = document.getElementById('lock-section');
const contentSection = document.getElementById('content-section');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const answer = input.value;
  if (!answer.trim()) return;

  const btn = form.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Unlocking...';
  errorMsg.textContent = '';

  try {
    const key = await deriveKeyFromManifest(answer, manifest);

    // Fetch and decrypt content payload
    const contentRes = await fetch('content.enc');
    const contentBuf = await contentRes.arrayBuffer();
    let plainBuf;
    try {
      plainBuf = await decryptBlob(contentBuf, key);
    } catch {
      throw new Error('wrong-answer');
    }

    const payload = JSON.parse(new TextDecoder().decode(plainBuf));

    // Inject HTML
    contentSection.innerHTML = payload.html;

    // Decrypt media in parallel
    const mediaPromises = (payload.media || []).map(async ({ id, type }) => {
      const res = await fetch(`${id}.enc`);
      const buf = await res.arrayBuffer();
      const decrypted = await decryptBlob(buf, key);
      const mimeType = type === 'image' ? 'image/jpeg' : 'application/octet-stream';
      const blob = new Blob([decrypted], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const el = contentSection.querySelector(`[data-media-id="${id}"]`);
      if (el) el.src = url;
    });

    // Decrypt audio if present
    let audioUrl = null;
    if (payload.music) {
      const audioPromise = (async () => {
        const res = await fetch('audio.enc');
        const buf = await res.arrayBuffer();
        const decrypted = await decryptBlob(buf, key);
        const blob = new Blob([decrypted], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
      })();
      mediaPromises.push(audioPromise);
    }

    await Promise.all(mediaPromises);

    // Show content, hide lock
    lockSection.classList.add('hidden');
    contentSection.classList.remove('hidden');

    if (audioUrl) {
      initPlayer(audioUrl);
    }
  } catch (err) {
    if (err.message === 'wrong-answer') {
      errorMsg.textContent = "That's not it — try again 🌸";
    } else {
      errorMsg.textContent = 'Something went wrong. Please refresh and try again.';
      console.error(err);
    }
    btn.disabled = false;
    btn.textContent = 'Unlock';
    input.focus();
    input.select();
  }
});
