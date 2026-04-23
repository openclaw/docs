---
read_when:
    - Cerchi una panoramica delle capacità multimediali
    - Decidere quale provider multimediale configurare
    - Capire come funziona la generazione multimediale asincrona
summary: Pagina di destinazione unificata per capacità di generazione media, comprensione e vocali
title: Panoramica dei media
x-i18n:
    generated_at: "2026-04-23T08:37:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Generazione e comprensione dei media

OpenClaw genera immagini, video e musica, comprende i media in ingresso (immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte le capacità multimediali sono guidate da tool: l'agente decide quando usarle in base alla conversazione e ogni tool compare solo quando è configurato almeno un provider di supporto.

## Capacità in sintesi

| Capacità             | Tool             | Provider                                                                                     | Cosa fa                                                  |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Generazione immagini | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o modifica immagini da prompt di testo o riferimenti |
| Generazione video    | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea video da testo, immagini o video esistenti          |
| Generazione musica   | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea musica o tracce audio da prompt di testo            |
| Sintesi vocale (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Converte le risposte in uscita in audio parlato          |
| Comprensione media   | (automatica)     | Qualsiasi provider di modelli con capacità vision/audio, più fallback CLI                    | Riassume immagini, audio e video in ingresso             |

## Matrice delle capacità dei provider

Questa tabella mostra quali provider supportano quali capacità multimediali sulla piattaforma.

| Provider   | Immagini | Video | Musica | TTS | STT / Trascrizione | Comprensione media |
| ---------- | -------- | ----- | ------ | --- | ------------------ | ------------------ |
| Alibaba    |          | Yes   |        |     |                    |                    |
| BytePlus   |          | Yes   |        |     |                    |                    |
| ComfyUI    | Yes      | Yes   | Yes    |     |                    |                    |
| Deepgram   |          |       |        |     | Yes                |                    |
| ElevenLabs |          |       |        | Yes | Yes                |                    |
| fal        | Yes      | Yes   |        |     |                    |                    |
| Google     | Yes      | Yes   | Yes    |     |                    | Yes                |
| Microsoft  |          |       |        | Yes |                    |                    |
| MiniMax    | Yes      | Yes   | Yes    | Yes |                    |                    |
| Mistral    |          |       |        |     | Yes                |                    |
| OpenAI     | Yes      | Yes   |        | Yes | Yes                | Yes                |
| Qwen       |          | Yes   |        |     |                    |                    |
| Runway     |          | Yes   |        |     |                    |                    |
| Together   |          | Yes   |        |     |                    |                    |
| Vydra      | Yes      | Yes   |        |     |                    |                    |
| xAI        | Yes      | Yes   |        | Yes | Yes                | Yes                |

<Note>
La comprensione dei media usa qualsiasi modello con capacità vision o audio registrato nella configurazione dei provider. La tabella sopra evidenzia i provider con supporto dedicato alla comprensione media; la maggior parte dei provider LLM con modelli multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i media in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Come funziona la generazione asincrona

La generazione di video e musica viene eseguita come task in background perché l'elaborazione del provider richiede tipicamente da 30 secondi a diversi minuti. Quando l'agente chiama `video_generate` o `music_generate`, OpenClaw invia la richiesta al provider, restituisce immediatamente un ID task e tiene traccia del job nel task ledger. L'agente continua a rispondere ad altri messaggi mentre il job è in esecuzione. Quando il provider termina, OpenClaw risveglia l'agente così può pubblicare il media completato nel canale originale. La generazione di immagini e il TTS sono sincroni e vengono completati inline con la risposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI possono tutti trascrivere audio in ingresso
tramite il percorso batch `tools.media.audio` quando configurati. Deepgram,
ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT streaming per Voice Call, così l'audio telefonico live può essere inoltrato al vendor selezionato
senza attendere il completamento di una registrazione.

OpenAI si mappa alle superfici OpenClaw di generazione immagini, generazione video, TTS batch, STT batch, STT streaming per Voice Call, voce realtime e embedding della memoria. xAI attualmente si mappa alle superfici OpenClaw di immagini, video, ricerca, esecuzione di codice, TTS batch, STT batch
e STT streaming per Voice Call. La voce xAI Realtime è una capacità
upstream, ma non è registrata in OpenClaw finché il contratto condiviso per la
voce realtime non può rappresentarla.

## Link rapidi

- [Generazione immagini](/it/tools/image-generation) -- generazione e modifica di immagini
- [Generazione video](/it/tools/video-generation) -- text-to-video, image-to-video e video-to-video
- [Generazione musica](/it/tools/music-generation) -- creazione di musica e tracce audio
- [Sintesi vocale](/it/tools/tts) -- conversione delle risposte in audio parlato
- [Comprensione media](/it/nodes/media-understanding) -- comprensione di immagini, audio e video in ingresso
