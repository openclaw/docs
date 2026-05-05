---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Scegliere quale provider multimediale configurare
    - Comprendere come funziona la generazione asincrona dei contenuti multimediali
sidebarTitle: Media overview
summary: Funzionalità per immagini, video, musica, voce e comprensione dei media in sintesi
title: Panoramica dei media
x-i18n:
    generated_at: "2026-05-05T01:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i contenuti multimediali in ingresso
(immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte
le funzionalità multimediali sono guidate dagli strumenti: l'agente decide quando usarle in base
alla conversazione, e ogni strumento compare solo quando è configurato almeno un provider
di supporto.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt testuali o immagini di riferimento tramite
    `image_generate`. Sincrono — si completa inline con la risposta.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrono — viene eseguito in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrono sui provider
    condivisi; il percorso del workflow ComfyUI viene eseguito in modo sincrono.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più la
    configurazione `messages.tts`. Sincrono.
  </Card>
  <Card title="Comprensione dei media" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli con capacità
    di visione e Plugin dedicati alla comprensione dei media.
  </Card>
  <Card title="Da voce a testo" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite STT batch o provider STT in streaming
    per chiamate vocali.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

| Provider    | Immagine | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione dei media |
| ----------- | :------: | :---: | :----: | :-: | :-: | :-----------------: | :--------------------: |
| Alibaba     |          |   ✓   |        |     |     |                     |                        |
| BytePlus    |          |   ✓   |        |     |     |                     |                        |
| ComfyUI     |    ✓     |   ✓   |   ✓    |     |     |                     |                        |
| DeepInfra   |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |           ✓            |
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
| OpenRouter  |    ✓     |   ✓   |        |  ✓  |     |                     |           ✓            |
| Qwen        |          |   ✓   |        |     |     |                     |                        |
| Runway      |          |   ✓   |        |     |     |                     |                        |
| SenseAudio  |          |       |        |     |  ✓  |                     |                        |
| Together    |          |   ✓   |        |     |     |                     |                        |
| Vydra       |    ✓     |   ✓   |        |  ✓  |     |                     |                        |
| xAI         |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |           ✓            |
| Xiaomi MiMo |    ✓     |       |        |  ✓  |     |                     |           ✓            |

<Note>
La comprensione dei media usa qualsiasi modello con capacità di visione o audio registrato
nella configurazione del provider. La matrice sopra elenca i provider con supporto dedicato
alla comprensione dei media; la maggior parte dei provider LLM multimodali (Anthropic, Google,
OpenAI, ecc.) può comprendere anche i media in ingresso quando è configurata come modello
di risposta attivo.
</Note>

## Asincrono e sincrono

| Funzionalità      | Modalità    | Perché                                                                  |
| ----------------- | ----------- | ----------------------------------------------------------------------- |
| Immagine          | Sincrona    | Le risposte del provider arrivano in pochi secondi; si completa inline con la risposta. |
| Sintesi vocale    | Sincrona    | Le risposte del provider arrivano in pochi secondi; vengono allegate all'audio della risposta. |
| Video             | Asincrona   | L'elaborazione del provider richiede da 30 s a diversi minuti.          |
| Musica (condivisa) | Asincrona  | Stessa caratteristica di elaborazione del provider dei video.           |
| Musica (ComfyUI)  | Sincrona    | Il workflow locale viene eseguito inline sul server ComfyUI configurato. |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce subito un
id attività e tiene traccia del job nel registro delle attività. L'agente continua a rispondere
ad altri messaggi mentre il job è in esecuzione. Quando il provider termina, OpenClaw risveglia
l'agente con i percorsi dei media generati, così può informare l'utente e, quando richiesto
dalla policy di consegna della sorgente, inoltrare il risultato tramite lo strumento di messaggistica.

## Da voce a testo e chiamata vocale

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
I Plugin di canale che verificano preventivamente una nota vocale per il gating delle menzioni
o il parsing dei comandi marcano l'allegato trascritto nel contesto in ingresso, quindi il passaggio
condiviso di comprensione dei media riutilizza quella trascrizione invece di effettuare una seconda
chiamata STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming per chiamate
vocali, quindi l'audio telefonico live può essere inoltrato al vendor selezionato senza attendere
una registrazione completata.

## Mappature dei provider (come i vendor si suddividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagini, video, musica, TTS batch, voce backend in tempo reale e
    comprensione dei media.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagini, video, TTS batch, STT batch, STT in streaming per chiamate vocali,
    voce backend in tempo reale e embedding di memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfici di routing chat/modello, generazione/modifica di immagini, da testo a video,
    TTS batch, STT batch, comprensione dei media immagine ed embedding di memoria.
    I modelli nativi DeepInfra di riclassificazione/classificazione/rilevamento oggetti non sono
    registrati finché OpenClaw non dispone di contratti provider dedicati per quelle
    categorie.
  </Accordion>
  <Accordion title="xAI">
    Immagini, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in streaming
    per chiamate vocali. La voce in tempo reale di xAI è una funzionalità upstream ma non è
    registrata in OpenClaw finché il contratto condiviso per la voce in tempo reale non può
    rappresentarla.
  </Accordion>
</AccordionGroup>

## Correlati

- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
- [Generazione di musica](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Nodi audio](/it/nodes/audio)
