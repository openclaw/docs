---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Scegliere quale provider multimediale configurare
    - Comprendere come funziona la generazione asincrona di contenuti multimediali
sidebarTitle: Media overview
summary: Panoramica delle funzionalità per immagini, video, musica, voce e comprensione multimediale
title: Panoramica dei media
x-i18n:
    generated_at: "2026-05-05T06:19:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i contenuti multimediali in ingresso
(immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte
le capacità multimediali sono guidate da strumenti: l'agente decide quando usarle in base
alla conversazione e ogni strumento compare solo quando è configurato almeno un
provider sottostante.

## Capacità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt di testo o immagini di riferimento tramite
    `image_generate`. Sincrono: viene completato in linea con la risposta.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrono: viene eseguito in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrono sui provider
    condivisi; il percorso del flusso di lavoro ComfyUI viene eseguito in modo sincrono.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più la
    configurazione `messages.tts`. Sincrono.
  </Card>
  <Card title="Comprensione dei contenuti multimediali" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli con capacità
    di visione e Plugin dedicati alla comprensione dei contenuti multimediali.
  </Card>
  <Card title="Trascrizione vocale" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite provider STT batch o di STT in
    streaming per Voice Call.
  </Card>
</CardGroup>

## Matrice delle capacità dei provider

| Provider    | Immagini | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione multimediale |
| ----------- | :------: | :---: | :----: | :-: | :-: | :-----------------: | :-----------------------: |
| Alibaba     |          |   ✓   |        |     |     |                     |                           |
| BytePlus    |          |   ✓   |        |     |     |                     |                           |
| ComfyUI     |    ✓     |   ✓   |   ✓    |     |     |                     |                           |
| DeepInfra   |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |             ✓             |
| Deepgram    |          |       |        |     |  ✓  |          ✓          |                           |
| ElevenLabs  |          |       |        |  ✓  |  ✓  |                     |                           |
| fal         |    ✓     |   ✓   |        |     |     |                     |                           |
| Google      |    ✓     |   ✓   |   ✓    |  ✓  |     |          ✓          |             ✓             |
| Gradium     |          |       |        |  ✓  |     |                     |                           |
| Local CLI   |          |       |        |  ✓  |     |                     |                           |
| Microsoft   |          |       |        |  ✓  |     |                     |                           |
| MiniMax     |    ✓     |   ✓   |   ✓    |  ✓  |     |                     |                           |
| Mistral     |          |       |        |     |  ✓  |                     |                           |
| OpenAI      |    ✓     |   ✓   |        |  ✓  |  ✓  |          ✓          |             ✓             |
| OpenRouter  |    ✓     |   ✓   |        |  ✓  |     |                     |             ✓             |
| Qwen        |          |   ✓   |        |     |     |                     |                           |
| Runway      |          |   ✓   |        |     |     |                     |                           |
| SenseAudio  |          |       |        |     |  ✓  |                     |                           |
| Together    |          |   ✓   |        |     |     |                     |                           |
| Vydra       |    ✓     |   ✓   |        |  ✓  |     |                     |                           |
| xAI         |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |             ✓             |
| Xiaomi MiMo |    ✓     |       |        |  ✓  |     |                     |             ✓             |

<Note>
La comprensione dei contenuti multimediali usa qualsiasi modello con capacità di visione o audio registrato
nella configurazione del provider. La matrice precedente elenca i provider con supporto dedicato
alla comprensione dei contenuti multimediali; anche la maggior parte dei provider LLM multimodali (Anthropic, Google,
OpenAI, ecc.) può comprendere i contenuti multimediali in ingresso quando è configurata come modello
di risposta attivo.
</Note>

## Asincrono e sincrono

| Capacità        | Modalità     | Perché                                                                                                    |
| --------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Immagini        | Sincrona     | Le risposte dei provider arrivano in pochi secondi; viene completata in linea con la risposta.             |
| Sintesi vocale  | Sincrona     | Le risposte dei provider arrivano in pochi secondi; viene allegata all'audio della risposta.               |
| Video           | Asincrona    | L'elaborazione del provider richiede da 30 s a diversi minuti; le code lente possono arrivare al timeout configurato. |
| Musica (condivisa) | Asincrona | Stessa caratteristica di elaborazione del provider dei video.                                             |
| Musica (ComfyUI) | Sincrona    | Il flusso di lavoro locale viene eseguito in linea sul server ComfyUI configurato.                         |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce subito
un id attività e tiene traccia del job nel registro attività. L'agente continua
a rispondere ad altri messaggi mentre il job è in esecuzione. Quando il provider termina,
OpenClaw riattiva l'agente con i percorsi dei contenuti multimediali generati, così può avvisare
l'utente e, quando richiesto dalla policy di consegna della sorgente, inoltrare il risultato tramite
lo strumento dei messaggi. Per le route di gruppo/canale solo tramite strumento dei messaggi, OpenClaw considera
l'assenza di prove di consegna dello strumento dei messaggi come un tentativo di completamento non riuscito e invia
direttamente al canale originale il fallback dei contenuti multimediali generati.

## Trascrizione vocale e Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurato.
I Plugin di canale che eseguono un preflight di una nota vocale per il gating delle menzioni o il parsing
dei comandi contrassegnano l'allegato trascritto nel contesto in ingresso, così il passaggio condiviso
di comprensione dei contenuti multimediali riutilizza quella trascrizione invece di effettuare una seconda
chiamata STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming per
Voice Call, così l'audio telefonico live può essere inoltrato al vendor selezionato
senza attendere una registrazione completata.

## Mappature dei provider (come i vendor si distribuiscono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagini, video, musica, TTS batch, voce in tempo reale backend e
    comprensione dei contenuti multimediali.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagini, video, TTS batch, STT batch, STT in streaming per Voice Call, voce
    in tempo reale backend e embedding di memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfici di routing chat/modello, generazione/modifica di immagini, da testo a video, TTS batch,
    STT batch, comprensione dei contenuti multimediali immagine ed embedding di memoria.
    I modelli nativi DeepInfra di rerank/classificazione/rilevamento oggetti non sono
    registrati finché OpenClaw non avrà contratti provider dedicati per quelle
    categorie.
  </Accordion>
  <Accordion title="xAI">
    Immagini, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in streaming per Voice
    Call. La voce in tempo reale xAI è una capacità upstream ma non viene
    registrata in OpenClaw finché il contratto condiviso per la voce in tempo reale non potrà
    rappresentarla.
  </Accordion>
</AccordionGroup>

## Correlati

- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
- [Generazione di musica](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Nodi audio](/it/nodes/audio)
