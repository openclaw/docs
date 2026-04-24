---
read_when:
    - Modificare la pipeline dei media o gli allegati
summary: Regole di gestione di immagini e media per invio, gateway e risposte dell’agente
title: Supporto immagini e media
x-i18n:
    generated_at: "2026-04-24T08:48:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Supporto immagini e media (2025-12-05)

Il canale WhatsApp funziona tramite **Baileys Web**. Questo documento descrive le attuali regole di gestione dei media per invio, gateway e risposte dell’agente.

## Obiettivi

- Inviare media con didascalie opzionali tramite `openclaw message send --media`.
- Consentire alle risposte automatiche dalla inbox web di includere media insieme al testo.
- Mantenere limiti per tipo ragionevoli e prevedibili.

## Superficie CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` è opzionale; la didascalia può essere vuota per invii di soli media.
  - `--dry-run` stampa il payload risolto; `--json` emette `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento del canale web WhatsApp

- Input: percorso file locale **oppure** URL HTTP(S).
- Flusso: carica in un Buffer, rileva il tipo di media e costruisce il payload corretto:
  - **Immagini:** ridimensiona e ricomprime in JPEG (lato massimo 2048px) con obiettivo `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB).
  - **Audio/Voice/Video:** pass-through fino a 16 MB; l’audio viene inviato come nota vocale (`ptt: true`).
  - **Documenti:** qualsiasi altro tipo, fino a 100 MB, con il nome file preservato quando disponibile.
- Riproduzione stile GIF su WhatsApp: invia un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) così i client mobile lo ripetono inline.
- Il rilevamento MIME preferisce magic bytes, poi intestazioni, poi estensione del file.
- La didascalia proviene da `--message` oppure `reply.text`; una didascalia vuota è consentita.
- Logging: in modalità non verbosa mostra `↩️`/`✅`; in modalità verbosa include dimensione e percorso/URL sorgente.

## Pipeline di risposta automatica

- `getReplyFromConfig` restituisce `{ text?, mediaUrl?, mediaUrls? }`.
- Quando sono presenti media, il sender web risolve percorsi locali o URL usando la stessa pipeline di `openclaw message send`.
- Se vengono forniti più media, questi vengono inviati in sequenza.

## Media in ingresso verso i comandi (Pi)

- Quando i messaggi web in ingresso includono media, OpenClaw scarica in un file temporaneo ed espone variabili di templating:
  - `{{MediaUrl}}` pseudo-URL per il media in ingresso.
  - `{{MediaPath}}` percorso temporaneo locale scritto prima di eseguire il comando.
- Quando è abilitata una sandbox Docker per-sessione, il media in ingresso viene copiato nel workspace sandbox e `MediaPath`/`MediaUrl` vengono riscritti in un percorso relativo come `media/inbound/<filename>`.
- La comprensione dei media (se configurata tramite `tools.media.*` o i condivisi `tools.media.models`) viene eseguita prima del templating e può inserire blocchi `[Image]`, `[Audio]` e `[Video]` in `Body`.
  - L’audio imposta `{{Transcript}}` e usa la trascrizione per il parsing dei comandi così i comandi slash continuano a funzionare.
  - Le descrizioni di video e immagini preservano qualsiasi testo di didascalia per il parsing dei comandi.
  - Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco riassuntivo `[Image]` e passa invece l’immagine originale al modello.
- Per impostazione predefinita viene elaborato solo il primo allegato immagine/audio/video corrispondente; imposta `tools.media.<cap>.attachments` per elaborare più allegati.

## Limiti ed errori

**Limiti di invio in uscita (invio web WhatsApp)**

- Immagini: fino a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB) dopo la ricompressione.
- Audio/voice/video: limite di 16 MB; documenti: 100 MB.
- Media troppo grandi o illeggibili → errore chiaro nei log e la risposta viene saltata.

**Limiti di comprensione dei media (trascrizione/descrizione)**

- Immagine predefinita: 10 MB (`tools.media.image.maxBytes`).
- Audio predefinito: 20 MB (`tools.media.audio.maxBytes`).
- Video predefinito: 50 MB (`tools.media.video.maxBytes`).
- I media troppo grandi saltano la comprensione, ma le risposte continuano comunque con il body originale.

## Note per i test

- Coprire i flussi di invio + risposta per casi immagine/audio/documento.
- Validare la ricompressione per le immagini (vincolo di dimensione) e il flag nota vocale per l’audio.
- Assicurarsi che le risposte multi-media vengano distribuite come invii sequenziali.

## Correlati

- [Acquisizione da fotocamera](/it/nodes/camera)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Audio e note vocali](/it/nodes/audio)
