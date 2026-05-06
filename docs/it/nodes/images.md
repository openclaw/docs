---
read_when:
    - Modifica della pipeline multimediale o degli allegati
summary: Regole per la gestione di immagini e contenuti multimediali per l'invio, il Gateway e le risposte degli agenti
title: Supporto per immagini e media
x-i18n:
    generated_at: "2026-05-06T08:58:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Supporto per immagini e contenuti multimediali (2025-12-05)

Il canale WhatsApp viene eseguito tramite **Baileys Web**. Questo documento descrive le regole attuali di gestione dei contenuti multimediali per invii, Gateway e risposte degli agenti.

## Obiettivi

- Inviare contenuti multimediali con didascalie opzionali tramite `openclaw message send --media`.
- Consentire alle risposte automatiche dalla casella di posta web di includere contenuti multimediali insieme al testo.
- Mantenere limiti per tipo ragionevoli e prevedibili.

## Interfaccia CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opzionale; la didascalia può essere vuota per invii solo multimediali.
  - `--dry-run` stampa il payload risolto; `--json` emette `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento del canale WhatsApp Web

- Input: percorso di file locale **oppure** URL HTTP(S).
- Flusso: carica in un Buffer, rileva il tipo di contenuto multimediale e crea il payload corretto:
  - **Immagini:** ridimensiona e ricomprime in JPEG (lato massimo 2048px) mirando a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB).
  - **Audio/voce/video:** inoltro senza modifiche fino a 16 MB; l'audio viene inviato come nota vocale (`ptt: true`).
  - **Documenti:** tutto il resto, fino a 100 MB, con nome file preservato quando disponibile.
- Riproduzione in stile GIF su WhatsApp: invia un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) affinché i client mobili lo riproducano in loop in linea.
- Il rilevamento MIME preferisce i byte magici, poi le intestazioni, poi l'estensione del file.
- La didascalia proviene da `--message` o `reply.text`; è consentita una didascalia vuota.
- Logging: non verboso mostra `↩️`/`✅`; verboso include dimensioni e percorso/URL di origine.

## Pipeline di risposta automatica

- `getReplyFromConfig` restituisce `{ text?, mediaUrl?, mediaUrls? }`.
- Quando sono presenti contenuti multimediali, il mittente web risolve percorsi locali o URL usando la stessa pipeline di `openclaw message send`.
- Se fornite, più voci multimediali vengono inviate in sequenza.

## Contenuti multimediali in ingresso verso i comandi (Pi)

- Quando i messaggi web in ingresso includono contenuti multimediali, OpenClaw li scarica in un file temporaneo ed espone variabili di templating:
  - `{{MediaUrl}}` pseudo-URL per il contenuto multimediale in ingresso.
  - `{{MediaPath}}` percorso temporaneo locale scritto prima di eseguire il comando.
- Quando è abilitata una sandbox Docker per sessione, i contenuti multimediali in ingresso vengono copiati nello spazio di lavoro della sandbox e `MediaPath`/`MediaUrl` vengono riscritti in un percorso relativo come `media/inbound/<filename>`.
- La comprensione dei contenuti multimediali (se configurata tramite `tools.media.*` o `tools.media.models` condivisi) viene eseguita prima del templating e può inserire blocchi `[Image]`, `[Audio]` e `[Video]` in `Body`.
  - L'audio imposta `{{Transcript}}` e usa la trascrizione per l'analisi del comando, così i comandi slash continuano a funzionare.
  - Le descrizioni di video e immagini preservano eventuale testo della didascalia per l'analisi del comando.
  - Se il modello primario di immagini attivo supporta già la visione in modo nativo, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
- Per impostazione predefinita viene elaborato solo il primo allegato immagine/audio/video corrispondente; imposta `tools.media.<cap>.attachments` per elaborare più allegati.

## Limiti ed errori

**Limiti di invio in uscita (invio web WhatsApp)**

- Immagini: fino a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB) dopo la ricompressione.
- Audio/voce/video: limite di 16 MB; documenti: limite di 100 MB.
- Contenuti multimediali troppo grandi o illeggibili → errore chiaro nei log e la risposta viene saltata.

**Limiti di comprensione dei contenuti multimediali (trascrizione/descrizione)**

- Immagine predefinita: 10 MB (`tools.media.image.maxBytes`).
- Audio predefinito: 20 MB (`tools.media.audio.maxBytes`).
- Video predefinito: 50 MB (`tools.media.video.maxBytes`).
- I contenuti multimediali troppo grandi saltano la comprensione, ma le risposte procedono comunque con il corpo originale.

## Note per i test

- Coprire i flussi di invio e risposta per i casi immagine/audio/documento.
- Convalidare la ricompressione per le immagini (limite di dimensione) e il flag di nota vocale per l'audio.
- Assicurarsi che le risposte con più contenuti multimediali vengano distribuite come invii sequenziali.

## Correlati

- [Acquisizione dalla fotocamera](/it/nodes/camera)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Audio e note vocali](/it/nodes/audio)
