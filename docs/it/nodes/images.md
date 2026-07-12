---
read_when:
    - Modifica della pipeline multimediale o degli allegati
summary: Regole di gestione di immagini e contenuti multimediali per invii, Gateway e risposte degli agenti
title: Supporto per immagini e contenuti multimediali
x-i18n:
    generated_at: "2026-07-12T07:11:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Il canale WhatsApp viene eseguito su Baileys Web. Questa pagina descrive le regole di gestione dei contenuti multimediali per gli invii, il Gateway e le risposte dell'agente.

## Obiettivi

- Inviare contenuti multimediali con una didascalia facoltativa tramite `openclaw message send --media`.
- Consentire alle risposte automatiche dalla casella di posta web di includere contenuti multimediali insieme al testo.
- Mantenere limiti ragionevoli e prevedibili per ciascun tipo.

## Interfaccia CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — allega un contenuto multimediale (immagine/audio/video/documento); accetta percorsi locali o URL. Facoltativo; la didascalia può essere vuota per gli invii contenenti solo contenuti multimediali.
- `--gif-playback` — tratta il contenuto video come una GIF in riproduzione (solo WhatsApp).
- `--force-document` — invia il contenuto multimediale come documento per evitare la compressione del canale (Telegram, WhatsApp); si applica a immagini, GIF e video.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opzioni di consegna e gestione delle conversazioni condivise con gli invii di solo testo.
- `--dry-run` — stampa il payload risolto senza eseguire l'invio.
- `--json` — stampa il risultato in formato JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contiene il risultato dell'invio specifico del canale, incluso qualsiasi riferimento al contenuto multimediale).

## Comportamento del canale WhatsApp Web

- Input: percorso di un file locale **oppure** URL HTTP(S).
- Flusso: carica in un buffer, rileva il tipo di contenuto multimediale, quindi crea il payload in uscita in base al tipo:
  - **Immagini:** ottimizzate per rientrare nel limite `channels.whatsapp.mediaMaxMb` (valore predefinito: 50 MB). Le immagini opache vengono ricompresse in JPEG (la sequenza predefinita delle dimensioni dei lati parte da 2048 px e diminuisce dopo ripetuti superamenti del limite di dimensione); le immagini con trasparenza vengono mantenute in formato PNG. Se la sorgente è già un file JPEG/PNG/WebP accettabile che rispetta i limiti di dimensione del file e dei lati, i byte originali vengono mantenuti inalterati anziché essere ricompressi. Le GIF animate non vengono mai ricodificate, ma solo verificate rispetto al limite di dimensione.
  - **Audio/voce:** a meno che non sia già audio vocale nativo (`.ogg`/`.opus` oppure `audio/ogg`/`audio/opus`), l'audio in uscita viene transcodificato tramite `ffmpeg` in Opus/OGG (48 kHz mono, 64 kbps, con durata massima di 20 minuti) prima di essere inviato come messaggio vocale (`ptt: true`).
  - **Video:** inoltro diretto fino a 16 MB.
  - **Documenti:** qualsiasi altro contenuto, fino a 100 MB, mantenendo il nome del file quando disponibile.
- Riproduzione in stile GIF su WhatsApp: invia un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) affinché i client mobili lo riproducano in ciclo direttamente nella conversazione.
- Il rilevamento MIME dà la precedenza ai magic byte rilevati, quindi all'estensione del file e infine alle intestazioni della risposta; un contenitore generico rilevato (`application/octet-stream`, `zip`) non sostituisce mai un'associazione più specifica basata sull'estensione (ad esempio XLSX rispetto a ZIP).
- La didascalia proviene da `--message` o `reply.text`; è consentita una didascalia vuota.
- Registrazione: la modalità non dettagliata mostra `↩️`/`✅`; quella dettagliata include la dimensione e il percorso o URL di origine.

<Note>
I valori di 16 MB per audio/video e 100 MB per i documenti indicati sopra sono i limiti multimediali predefiniti condivisi per tipo, utilizzati quando non viene specificato un limite esplicito in byte. Gli invii tramite WhatsApp impostano un limite esplicito da `channels.whatsapp.mediaMaxMb` (valore predefinito: 50 MB), applicato uniformemente a tutti i tipi per tale account.
</Note>

## Pipeline delle risposte automatiche

- `getReplyFromConfig` restituisce un payload di risposta (o un array di payload) contenente, tra gli altri campi, `text?`, `mediaUrl?` e `mediaUrls?`.
- Quando sono presenti contenuti multimediali, il mittente web risolve i percorsi locali o gli URL usando la stessa pipeline di `openclaw message send`.
- Se vengono fornite più voci multimediali, vengono inviate in sequenza.

## Contenuti multimediali in ingresso nei comandi

- Quando i messaggi web in ingresso includono contenuti multimediali, OpenClaw li scarica in un file temporaneo ed espone le variabili di modello:
  - `{{MediaUrl}}` — pseudo-URL del contenuto multimediale in ingresso.
  - `{{MediaPath}}` — percorso temporaneo locale scritto prima dell'esecuzione del comando.
- Quando è abilitata una sandbox Docker per sessione, i contenuti multimediali in ingresso vengono copiati nell'area di lavoro della sandbox e `MediaPath`/`MediaUrl` vengono riscritti con un percorso relativo alla sandbox, ad esempio `media/inbound/<filename>`.
- La comprensione dei contenuti multimediali (configurata tramite `tools.media.*` o il valore condiviso `tools.media.models`) viene eseguita prima dell'applicazione del modello e può inserire blocchi `[Image]`, `[Audio]` e `[Video]` in `Body`.
  - Per l'audio, imposta `{{Transcript}}` e usa la trascrizione per l'analisi dei comandi, in modo che i comandi slash continuino a funzionare.
  - Le descrizioni di video e immagini mantengono l'eventuale testo della didascalia per l'analisi dei comandi.
  - Se il modello primario attivo supporta già nativamente la visione, OpenClaw omette il blocco riepilogativo `[Image]` e passa invece l'immagine originale al modello.
- Per impostazione predefinita viene elaborato solo il primo allegato immagine/audio/video corrispondente; impostare `tools.media.<capability>.attachments` per elaborare più allegati.

## Limiti ed errori

**Limiti degli invii in uscita (invio tramite WhatsApp Web)**

- Immagini: fino a `channels.whatsapp.mediaMaxMb` (valore predefinito: 50 MB) dopo l'ottimizzazione.
- Audio/video: limite di 16 MB (valore predefinito condiviso, sostituito da `mediaMaxMb` per gli invii tramite WhatsApp).
- Documenti: limite di 100 MB (valore predefinito condiviso, sostituito da `mediaMaxMb` per gli invii tramite WhatsApp).
- I contenuti multimediali troppo grandi o illeggibili producono un errore chiaro nei log e la risposta viene ignorata.

**Limiti per la comprensione dei contenuti multimediali (trascrizione/descrizione)**

- Valore predefinito per le immagini: 10 MB (`tools.media.image.maxBytes`).
- Valore predefinito per l'audio: 20 MB (`tools.media.audio.maxBytes`).
- Valore predefinito per i video: 50 MB (`tools.media.video.maxBytes`).
- I contenuti multimediali troppo grandi non vengono sottoposti a comprensione, ma la risposta viene comunque elaborata con il corpo originale.

## Note per i test

- Coprire i flussi di invio e risposta per i casi relativi a immagini, audio e documenti.
- Verificare i limiti di dimensione dopo l'ottimizzazione delle immagini e il flag del messaggio vocale per l'audio.
- Assicurarsi che le risposte con più contenuti multimediali vengano distribuite come invii sequenziali.

## Pagine correlate

- [Acquisizione dalla fotocamera](/it/nodes/camera)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Audio e messaggi vocali](/it/nodes/audio)
