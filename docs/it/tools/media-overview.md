---
read_when:
    - Alla ricerca di una panoramica delle funzionalità multimediali di OpenClaw
    - Decidere quale provider multimediale configurare
    - Capire come funziona la generazione multimediale asincrona
sidebarTitle: Media overview
summary: Panoramica delle funzionalità di immagini, video, musica, voce e comprensione dei media
title: Panoramica dei media
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:40:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw genera immagini, video e musica, comprende i media in ingresso
(immagini, audio, video) e riproduce ad alta voce le risposte con la sintesi
vocale. Tutte le funzionalità multimediali sono guidate da strumenti: l'agente
decide quando usarle in base alla conversazione e ogni strumento compare solo
quando è configurato almeno un provider di supporto.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt testuali o immagini di riferimento tramite
    `image_generate`. Sincrona — viene completata inline con la risposta.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrona — viene eseguita in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrona sui provider
    condivisi; il percorso del workflow ComfyUI viene eseguito in modo sincrono.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più
    la configurazione `messages.tts`. Sincrona.
  </Card>
  <Card title="Comprensione dei media" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli con
    capacità visive e Plugin dedicati alla comprensione dei media.
  </Card>
  <Card title="Da voce a testo" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite provider STT batch o provider
    STT in streaming per Voice Call.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

| Provider    | Immagine | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione dei media |
| ----------- | :------: | :---: | :----: | :-: | :-: | :-----------------: | :--------------------: |
| Alibaba     |          |   ✓   |        |     |     |                     |                        |
| BytePlus    |          |   ✓   |        |     |     |                     |                        |
| ComfyUI     |    ✓     |   ✓   |   ✓    |     |     |                     |                        |
| Deepgram    |          |       |        |     |  ✓  |          ✓          |                        |
| ElevenLabs  |          |       |        |  ✓  |  ✓  |                     |                        |
| fal         |    ✓     |   ✓   |        |     |     |                     |                        |
| Google      |    ✓     |   ✓   |   ✓    |  ✓  |     |          ✓          |           ✓            |
| Gradium     |          |       |        |  ✓  |     |                     |                        |
| Local CLI   |          |       |        |  ✓  |     |                     |                        |
| Microsoft   |          |       |        |  ✓  |     |                     |                        |
| MiniMax     |    ✓     |   ✓   |   ✓    |  ✓  |     |                     |                        |
| Mistral     |          |       |        |     |  ✓  |                     |                        |
| OpenAI      |    ✓     |   ✓   |        |  ✓  |  ✓  |          ✓          |           ✓            |
| Qwen        |          |   ✓   |        |     |     |                     |                        |
| Runway      |          |   ✓   |        |     |     |                     |                        |
| SenseAudio  |          |       |        |     |  ✓  |                     |                        |
| Together    |          |   ✓   |        |     |     |                     |                        |
| Vydra       |    ✓     |   ✓   |        |  ✓  |     |                     |                        |
| xAI         |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |           ✓            |
| Xiaomi MiMo |    ✓     |       |        |  ✓  |     |                     |           ✓            |

<Note>
La comprensione dei media usa qualsiasi modello con capacità visive o audio
registrato nella configurazione del provider. La matrice sopra elenca i provider
con supporto dedicato alla comprensione dei media; la maggior parte dei provider
LLM multimodali (Anthropic, Google, OpenAI, ecc.) può comprendere anche i media
in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Asincrono vs sincrono

| Funzionalità    | Modalità     | Motivo                                                              |
| --------------- | ------------ | ------------------------------------------------------------------- |
| Immagine        | Sincrona     | Le risposte del provider arrivano in pochi secondi; completa inline con la risposta. |
| Sintesi vocale  | Sincrona     | Le risposte del provider arrivano in pochi secondi; viene allegata all'audio della risposta. |
| Video           | Asincrona    | L'elaborazione del provider richiede da 30 s a diversi minuti.      |
| Musica (shared) | Asincrona    | Stessa caratteristica di elaborazione del provider del video.       |
| Musica (ComfyUI) | Sincrona    | Il workflow locale viene eseguito inline sul server ComfyUI configurato. |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce
immediatamente un id dell'attività e tiene traccia del job nel registro delle attività.
L'agente continua a rispondere ad altri messaggi mentre il job è in esecuzione.
Quando il provider termina, OpenClaw riattiva l'agente affinché possa pubblicare
il media completato nel canale originale.

## Da voce a testo e Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
I Plugin di canale che eseguono un preflight di una nota vocale per il mention gating
o il parsing dei comandi contrassegnano l'allegato trascritto nel contesto in ingresso,
così il passaggio condiviso di comprensione dei media riutilizza quella trascrizione
invece di effettuare una seconda chiamata STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming
per Voice Call, quindi l'audio telefonico in diretta può essere inoltrato al vendor
selezionato senza attendere il completamento di una registrazione.

## Mapping dei provider (come i vendor si dividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagine, video, musica, TTS batch, voce backend in tempo reale e
    comprensione dei media.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagine, video, TTS batch, STT batch, STT in streaming per Voice Call,
    voce backend in tempo reale e memory-embedding.
  </Accordion>
  <Accordion title="xAI">
    Immagine, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in
    streaming per Voice Call. La voce Realtime di xAI è una capacità upstream ma
    non è registrata in OpenClaw finché il contratto condiviso per la voce in tempo
    reale non può rappresentarla.
  </Accordion>
</AccordionGroup>

## Correlati

- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
- [Generazione musicale](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Nodi audio](/it/nodes/audio)
