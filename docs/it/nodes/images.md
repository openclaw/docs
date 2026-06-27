---
read_when:
    - Modifica della pipeline multimediale o degli allegati
summary: Regole di gestione di immagini e contenuti multimediali per invio, gateway e risposte dell'agente
title: Supporto per immagini e contenuti multimediali
x-i18n:
    generated_at: "2026-06-27T17:42:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Il canale WhatsApp viene eseguito tramite **Baileys Web**. Questo documento descrive le regole attuali di gestione dei media per invio, Gateway e risposte degli agenti.

## Obiettivi

- Inviare media con didascalie facoltative tramite `openclaw message send --media`.
- Consentire alle risposte automatiche dalla posta in arrivo web di includere media insieme al testo.
- Mantenere limiti per tipo ragionevoli e prevedibili.

## Superficie CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` facoltativo; la didascalia può essere vuota per invii solo media.
  - `--dry-run` stampa il payload risolto; `--json` emette `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento del canale WhatsApp Web

- Input: percorso file locale **oppure** URL HTTP(S).
- Flusso: carica in un Buffer, rileva il tipo di media e crea il payload corretto:
  - **Immagini:** ridimensiona e ricomprime in JPEG (lato massimo 2048 px) mirando a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB).
  - **Audio/Voce/Video:** pass-through fino a 16 MB; l'audio viene inviato come nota vocale (`ptt: true`).
  - **Documenti:** qualsiasi altro contenuto, fino a 100 MB, con nome file preservato quando disponibile.
- Riproduzione stile GIF di WhatsApp: invia un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) così i client mobili lo riproducono in loop inline.
- Il rilevamento MIME preferisce i magic byte, poi le intestazioni, quindi l'estensione del file.
- La didascalia proviene da `--message` o `reply.text`; è consentita una didascalia vuota.
- Logging: non dettagliato mostra `↩️`/`✅`; dettagliato include dimensione e percorso/URL di origine.

## Pipeline di risposta automatica

- `getReplyFromConfig` restituisce `{ text?, mediaUrl?, mediaUrls? }`.
- Quando è presente un media, il mittente web risolve percorsi locali o URL usando la stessa pipeline di `openclaw message send`.
- Più voci media vengono inviate in sequenza se fornite.

## Media in ingresso verso i comandi

- Quando i messaggi web in ingresso includono media, OpenClaw li scarica in un file temporaneo ed espone variabili di templating:
  - `{{MediaUrl}}` pseudo-URL per il media in ingresso.
  - `{{MediaPath}}` percorso temporaneo locale scritto prima di eseguire il comando.
- Quando è abilitata una sandbox Docker per sessione, il media in ingresso viene copiato nell'area di lavoro della sandbox e `MediaPath`/`MediaUrl` vengono riscritti in un percorso relativo come `media/inbound/<filename>`.
- La comprensione dei media (se configurata tramite `tools.media.*` o `tools.media.models` condiviso) viene eseguita prima del templating e può inserire blocchi `[Image]`, `[Audio]` e `[Video]` in `Body`.
  - L'audio imposta `{{Transcript}}` e usa la trascrizione per il parsing dei comandi, così i comandi slash continuano a funzionare.
  - Le descrizioni di video e immagini preservano eventuale testo della didascalia per il parsing dei comandi.
  - Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
- Per impostazione predefinita viene elaborato solo il primo allegato immagine/audio/video corrispondente; imposta `tools.media.<cap>.attachments` per elaborare più allegati.

## Limiti ed errori

**Limiti di invio in uscita (invio web WhatsApp)**

- Immagini: fino a `channels.whatsapp.mediaMaxMb` (predefinito: 50 MB) dopo la ricompressione.
- Audio/voce/video: limite di 16 MB; documenti: limite di 100 MB.
- Media troppo grandi o non leggibili → errore chiaro nei log e la risposta viene saltata.

**Limiti di comprensione dei media (trascrizione/descrizione)**

- Immagine predefinita: 10 MB (`tools.media.image.maxBytes`).
- Audio predefinito: 20 MB (`tools.media.audio.maxBytes`).
- Video predefinito: 50 MB (`tools.media.video.maxBytes`).
- I media troppo grandi saltano la comprensione, ma le risposte procedono comunque con il corpo originale.

## Note per i test

- Coprire i flussi di invio e risposta per i casi immagine/audio/documento.
- Convalidare la ricompressione per le immagini (limite dimensione) e il flag nota vocale per l'audio.
- Assicurarsi che le risposte con più media si espandano in invii sequenziali.

## Correlati

- [Acquisizione fotocamera](/it/nodes/camera)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Audio e note vocali](/it/nodes/audio)
