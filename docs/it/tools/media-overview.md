---
read_when:
    - Cerchi una panoramica delle capability media
    - Decidere quale provider media configurare
    - Capire come funziona la generazione media asincrona
summary: Pagina di destinazione unificata per capability di generazione, comprensione e voce dei media
title: Panoramica dei media
x-i18n:
    generated_at: "2026-04-24T09:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Generazione e comprensione dei media

OpenClaw genera immagini, video e musica, comprende media in ingresso (immagini, audio, video) e legge ad alta voce le risposte con la sintesi vocale. Tutte le capability media sono guidate da strumenti: l'agente decide quando usarli in base alla conversazione, e ogni strumento appare solo quando è configurato almeno un provider di supporto.

## Capability in sintesi

| Capability           | Strumento         | Provider                                                                                     | Cosa fa                                                  |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Generazione di immagini | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o modifica immagini da prompt testuali o riferimenti |
| Generazione video    | `video_generate`  | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea video da testo, immagini o video esistenti         |
| Generazione musicale | `music_generate`  | ComfyUI, Google, MiniMax                                                                     | Crea musica o tracce audio da prompt testuali           |
| Text-to-speech (TTS) | `tts`             | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Converte le risposte in uscita in audio parlato         |
| Comprensione dei media | (automatica)    | Qualsiasi provider di modelli con capability vision/audio, più fallback CLI                  | Riassume immagini, audio e video in ingresso            |

## Matrice delle capability dei provider

Questa tabella mostra quali provider supportano quali capability media sulla piattaforma.

| Provider   | Immagine | Video | Musica | TTS | STT / Trascrizione | Comprensione dei media |
| ---------- | -------- | ----- | ------ | --- | ------------------ | ---------------------- |
| Alibaba    |          | Sì    |        |     |                    |                        |
| BytePlus   |          | Sì    |        |     |                    |                        |
| ComfyUI    | Sì       | Sì    | Sì     |     |                    |                        |
| Deepgram   |          |       |        |     | Sì                 |                        |
| ElevenLabs |          |       |        | Sì  | Sì                 |                        |
| fal        | Sì       | Sì    |        |     |                    |                        |
| Google     | Sì       | Sì    | Sì     |     |                    | Sì                     |
| Microsoft  |          |       |        | Sì  |                    |                        |
| MiniMax    | Sì       | Sì    | Sì     | Sì  |                    |                        |
| Mistral    |          |       |        |     | Sì                 |                        |
| OpenAI     | Sì       | Sì    |        | Sì  | Sì                 | Sì                     |
| Qwen       |          | Sì    |        |     |                    |                        |
| Runway     |          | Sì    |        |     |                    |                        |
| Together   |          | Sì    |        |     |                    |                        |
| Vydra      | Sì       | Sì    |        |     |                    |                        |
| xAI        | Sì       | Sì    |        | Sì  | Sì                 | Sì                     |

<Note>
La comprensione dei media usa qualsiasi modello con capability vision o audio registrato nella configurazione del provider. La tabella sopra evidenzia i provider con supporto dedicato alla comprensione dei media; la maggior parte dei provider LLM con modelli multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i media in ingresso quando configurata come modello di risposta attivo.
</Note>

## Come funziona la generazione asincrona

La generazione video e musicale viene eseguita come attività in background perché l'elaborazione del provider richiede in genere da 30 secondi a diversi minuti. Quando l'agente chiama `video_generate` o `music_generate`, OpenClaw invia la richiesta al provider, restituisce immediatamente un ID attività e traccia il lavoro nel registro delle attività. L'agente continua a rispondere ad altri messaggi mentre il lavoro è in esecuzione. Quando il provider termina, OpenClaw riattiva l'agente affinché possa pubblicare il media completato nel canale originale. La generazione di immagini e il TTS sono sincroni e si completano inline con la risposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI possono tutti trascrivere audio in ingresso
tramite il percorso batch `tools.media.audio` quando configurati. Deepgram,
ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming per Voice Call, così l'audio telefonico live può essere inoltrato al vendor selezionato
senza attendere il completamento della registrazione.

OpenAI viene mappato alle superfici OpenClaw di immagini, video, batch TTS, batch STT, Voice Call
streaming STT, realtime voice e memory embedding. xAI attualmente
viene mappato alle superfici OpenClaw di immagini, video, search, code-execution, batch TTS, batch STT
e Voice Call streaming STT. xAI Realtime voice è una capability upstream,
ma non viene registrata in OpenClaw finché il contratto condiviso di realtime
voice non può rappresentarla.

## Link rapidi

- [Image Generation](/it/tools/image-generation) -- generazione e modifica di immagini
- [Video Generation](/it/tools/video-generation) -- text-to-video, image-to-video e video-to-video
- [Music Generation](/it/tools/music-generation) -- creazione di musica e tracce audio
- [Text-to-Speech](/it/tools/tts) -- conversione delle risposte in audio parlato
- [Media Understanding](/it/nodes/media-understanding) -- comprensione di immagini, audio e video in ingresso

## Correlati

- [Image generation](/it/tools/image-generation)
- [Video generation](/it/tools/video-generation)
- [Music generation](/it/tools/music-generation)
- [Text-to-speech](/it/tools/tts)
