---
read_when:
    - Modifica della pipeline multimediale o degli allegati
summary: Regole di gestione di immagini e contenuti multimediali per send, Gateway e risposte dell'agente
title: Supporto per immagini e contenuti multimediali
x-i18n:
    generated_at: "2026-04-30T09:00:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Supporto a immagini e media (2025-12-05)

Il canale WhatsApp funziona tramite **Baileys Web**. Questo documento descrive le regole attuali di gestione dei media per invii, gateway e risposte degli agenti.

## Obiettivi

- Inviare media con didascalie opzionali tramite `openclaw message send --media`.
- Consentire alle risposte automatiche dalla casella di posta web di includere media insieme al testo.
- Mantenere limiti per tipo sensati e prevedibili.

## Superficie CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opzionale; la didascalia può essere vuota per invii solo media.
  - `--dry-run` stampa il payload risolto; `--json` emette `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento del canale WhatsApp Web

- Input: percorso di file locale **o** URL HTTP(S).
- Flusso: carica in un Buffer, rileva il tipo di media e costruisce il payload corretto:
  - **Immagini:** ridimensiona e ricomprime in JPEG (lato massimo 2048 px) puntando a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB).
  - **Audio/Voce/Video:** pass-through fino a 16 MB; l'audio viene inviato come nota vocale (`ptt: true`).
  - **Documenti:** qualsiasi altro contenuto, fino a 100 MB, con nome file preservato quando disponibile.
- Riproduzione in stile GIF di WhatsApp: invia un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) in modo che i client mobili lo riproducano in loop inline.
- Il rilevamento MIME preferisce i magic byte, poi le intestazioni, poi l'estensione del file.
- La didascalia proviene da `--message` o `reply.text`; è consentita una didascalia vuota.
- Logging: la modalità non verbose mostra `↩️`/`✅`; la modalità verbose include dimensione e percorso/URL sorgente.

## Pipeline di risposta automatica

- `getReplyFromConfig` restituisce `{ text?, mediaUrl?, mediaUrls? }`.
- Quando sono presenti media, il mittente web risolve percorsi locali o URL usando la stessa pipeline di `openclaw message send`.
- Più voci media vengono inviate in sequenza se fornite.

## Media in ingresso verso i comandi (Pi)

- Quando i messaggi web in ingresso includono media, OpenClaw li scarica in un file temporaneo ed espone variabili di templating:
  - `{{MediaUrl}}` pseudo-URL per il media in ingresso.
  - `{{MediaPath}}` percorso temporaneo locale scritto prima di eseguire il comando.
- Quando è abilitata una sandbox Docker per sessione, i media in ingresso vengono copiati nell'area di lavoro della sandbox e `MediaPath`/`MediaUrl` vengono riscritti in un percorso relativo come `media/inbound/<filename>`.
- La comprensione dei media (se configurata tramite `tools.media.*` o `tools.media.models` condivisi) viene eseguita prima del templating e può inserire blocchi `[Image]`, `[Audio]` e `[Video]` in `Body`.
  - L'audio imposta `{{Transcript}}` e usa la trascrizione per il parsing dei comandi, così i comandi slash continuano a funzionare.
  - Le descrizioni di video e immagini preservano eventuale testo della didascalia per il parsing dei comandi.
  - Se il modello di immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
- Per impostazione predefinita viene elaborato solo il primo allegato immagine/audio/video corrispondente; imposta `tools.media.<cap>.attachments` per elaborare più allegati.

## Limiti ed errori

**Limiti di invio in uscita (invio web WhatsApp)**

- Immagini: fino a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB) dopo la ricompressione.
- Audio/voce/video: limite di 16 MB; documenti: limite di 100 MB.
- Media troppo grandi o illeggibili → errore chiaro nei log e la risposta viene saltata.

**Limiti di comprensione dei media (trascrizione/descrizione)**

- Immagine predefinita: 10 MB (`tools.media.image.maxBytes`).
- Audio predefinito: 20 MB (`tools.media.audio.maxBytes`).
- Video predefinito: 50 MB (`tools.media.video.maxBytes`).
- I media troppo grandi saltano la comprensione, ma le risposte proseguono comunque con il corpo originale.

## Note per i test

- Coprire i flussi di invio e risposta per casi di immagine/audio/documento.
- Validare la ricompressione per le immagini (limite di dimensione) e il flag di nota vocale per l'audio.
- Assicurarsi che le risposte con più media vengano distribuite come invii sequenziali.

## Correlati

- [Acquisizione da fotocamera](/it/nodes/camera)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Audio e note vocali](/it/nodes/audio)
