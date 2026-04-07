---
read_when:
    - Cerchi una panoramica delle funzionalità media
    - Stai decidendo quale provider media configurare
    - Vuoi capire come funziona la generazione media asincrona
summary: Pagina di destinazione unificata per le funzionalità di generazione media, comprensione e sintesi vocale
title: Panoramica media
x-i18n:
    generated_at: "2026-04-07T08:18:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# Generazione e comprensione dei media

OpenClaw genera immagini, video e musica, comprende i media in ingresso (immagini, audio, video) e riproduce ad alta voce le risposte con la sintesi vocale. Tutte le funzionalità media sono guidate da strumenti: l'agente decide quando usarle in base alla conversazione, e ogni strumento compare solo quando è configurato almeno un provider di supporto.

## Funzionalità in sintesi

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generazione di immagini | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra                                                 | Crea o modifica immagini da prompt di testo o riferimenti |
| Generazione video    | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea video da testo, immagini o video esistenti         |
| Generazione musicale | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea musica o tracce audio da prompt di testo           |
| Sintesi vocale (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI                                                       | Converte le risposte in uscita in audio parlato         |
| Comprensione dei media | (automatica)   | Qualsiasi provider di modelli con capacità vision/audio, più fallback CLI                    | Riassume immagini, audio e video in ingresso            |

## Matrice delle capacità dei provider

Questa tabella mostra quali provider supportano quali funzionalità media nella piattaforma.

| Provider   | Immagine | Video | Musica | TTS | STT / Trascrizione | Comprensione dei media |
| ---------- | -------- | ----- | ------ | --- | ------------------ | ---------------------- |
| Alibaba    |          | Sì    |        |     |                    |                        |
| BytePlus   |          | Sì    |        |     |                    |                        |
| ComfyUI    | Sì       | Sì    | Sì     |     |                    |                        |
| Deepgram   |          |       |        |     | Sì                 |                        |
| ElevenLabs |          |       |        | Sì  |                    |                        |
| fal        | Sì       | Sì    |        |     |                    |                        |
| Google     | Sì       | Sì    | Sì     |     |                    | Sì                     |
| Microsoft  |          |       |        | Sì  |                    |                        |
| MiniMax    | Sì       | Sì    | Sì     | Sì  |                    |                        |
| OpenAI     | Sì       | Sì    |        | Sì  | Sì                 | Sì                     |
| Qwen       |          | Sì    |        |     |                    |                        |
| Runway     |          | Sì    |        |     |                    |                        |
| Together   |          | Sì    |        |     |                    |                        |
| Vydra      | Sì       | Sì    |        |     |                    |                        |
| xAI        |          | Sì    |        |     |                    |                        |

<Note>
La comprensione dei media usa qualsiasi modello con capacità vision o audio registrato nella configurazione del provider. La tabella sopra evidenzia i provider con supporto dedicato alla comprensione dei media; la maggior parte dei provider LLM con modelli multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i media in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Come funziona la generazione asincrona

La generazione di video e musica viene eseguita come attività in background perché l'elaborazione del provider richiede in genere da 30 secondi a diversi minuti. Quando l'agente chiama `video_generate` o `music_generate`, OpenClaw invia la richiesta al provider, restituisce immediatamente un ID attività e tiene traccia del job nel registro delle attività. L'agente continua a rispondere ad altri messaggi mentre il job è in esecuzione. Quando il provider completa l'elaborazione, OpenClaw riattiva l'agente così può pubblicare il media completato nel canale originale. La generazione di immagini e TTS sono sincrone e si completano inline con la risposta.

## Link rapidi

- [Image Generation](/it/tools/image-generation) -- generazione e modifica di immagini
- [Video Generation](/it/tools/video-generation) -- text-to-video, image-to-video e video-to-video
- [Music Generation](/it/tools/music-generation) -- creazione di musica e tracce audio
- [Text-to-Speech](/it/tools/tts) -- conversione delle risposte in audio parlato
- [Media Understanding](/it/nodes/media-understanding) -- comprensione di immagini, audio e video in ingresso
