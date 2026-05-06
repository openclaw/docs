---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Scegliere quale provider multimediale configurare
    - Comprendere il funzionamento della generazione asincrona di contenuti multimediali
sidebarTitle: Media overview
summary: Funzionalità di immagine, video, musica, voce e comprensione dei contenuti multimediali in sintesi
title: Panoramica dei media
x-i18n:
    generated_at: "2026-05-06T09:13:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i contenuti multimediali in ingresso
(immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte
le funzionalità multimediali sono basate su strumenti: l'agente decide quando usarle in base
alla conversazione e ogni strumento appare solo quando è configurato almeno un provider
di supporto.

Il parlato live usa il contratto di sessione Talk invece del percorso dello strumento multimediale
one-shot. Talk ha tre modalità: `realtime` nativa del provider, `stt-tts` locale o in streaming
e `transcription` per la cattura del parlato solo in osservazione. Queste modalità
condividono cataloghi dei provider, envelope degli eventi e semantica di annullamento con
telefonia, riunioni, realtime del browser e client push-to-talk nativi.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt testuali o immagini di riferimento tramite
    `image_generate`. Sincrono: completa inline con la risposta.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrono: viene eseguito in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrono sui provider
    condivisi; il percorso del workflow ComfyUI viene eseguito in modo sincrono.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più
    la configurazione `messages.tts`. Sincrono.
  </Card>
  <Card title="Comprensione dei contenuti multimediali" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli
    con capacità di visione e Plugin dedicati alla comprensione dei contenuti multimediali.
  </Card>
  <Card title="Riconoscimento vocale" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite STT batch o provider STT
    in streaming di Voice Call.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

| Provider    | Immagine | Video | Musica | TTS | STT | Voce realtime | Comprensione multimediale |
| ----------- | :------: | :---: | :----: | :-: | :-: | :-----------: | :-----------------------: |
| Alibaba     |          |   ✓   |        |     |     |               |                           |
| BytePlus    |          |   ✓   |        |     |     |               |                           |
| ComfyUI     |    ✓     |   ✓   |   ✓    |     |     |               |                           |
| DeepInfra   |    ✓     |   ✓   |        |  ✓  |  ✓  |               |             ✓             |
| Deepgram    |          |       |        |     |  ✓  |       ✓       |                           |
| ElevenLabs  |          |       |        |  ✓  |  ✓  |               |                           |
| fal         |    ✓     |   ✓   |        |     |     |               |                           |
| Google      |    ✓     |   ✓   |   ✓    |  ✓  |     |       ✓       |             ✓             |
| Gradium     |          |       |        |  ✓  |     |               |                           |
| Local CLI   |          |       |        |  ✓  |     |               |                           |
| Microsoft   |          |       |        |  ✓  |     |               |                           |
| MiniMax     |    ✓     |   ✓   |   ✓    |  ✓  |     |               |                           |
| Mistral     |          |       |        |     |  ✓  |               |                           |
| OpenAI      |    ✓     |   ✓   |        |  ✓  |  ✓  |       ✓       |             ✓             |
| OpenRouter  |    ✓     |   ✓   |        |  ✓  |     |               |             ✓             |
| Qwen        |          |   ✓   |        |     |     |               |                           |
| Runway      |          |   ✓   |        |     |     |               |                           |
| SenseAudio  |          |       |        |     |  ✓  |               |                           |
| Together    |          |   ✓   |        |     |     |               |                           |
| Vydra       |    ✓     |   ✓   |        |  ✓  |     |               |                           |
| xAI         |    ✓     |   ✓   |        |  ✓  |  ✓  |               |             ✓             |
| Xiaomi MiMo |    ✓     |       |        |  ✓  |     |               |             ✓             |

<Note>
La comprensione dei contenuti multimediali usa qualsiasi modello con capacità di visione
o audio registrato nella configurazione del provider. La matrice sopra elenca i provider
con supporto dedicato alla comprensione dei contenuti multimediali; la maggior parte dei
provider LLM multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i
contenuti multimediali in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Asincrono e sincrono

| Funzionalità      | Modalità     | Perché                                                                                                      |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Immagine          | Sincrona     | Le risposte del provider arrivano in pochi secondi; completa inline con la risposta.                         |
| Sintesi vocale    | Sincrona     | Le risposte del provider arrivano in pochi secondi; viene allegata all'audio della risposta.                 |
| Video             | Asincrona    | L'elaborazione del provider richiede da 30 s a diversi minuti; le code lente possono arrivare al timeout configurato. |
| Musica (condivisa) | Asincrona   | Stessa caratteristica di elaborazione del provider dei video.                                               |
| Musica (ComfyUI)  | Sincrona     | Il workflow locale viene eseguito inline contro il server ComfyUI configurato.                              |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce subito
un ID attività e traccia il job nel registro delle attività. L'agente continua a
rispondere ad altri messaggi mentre il job è in esecuzione. Quando il provider termina,
OpenClaw risveglia l'agente con i percorsi dei contenuti multimediali generati così può
informare l'utente e, quando richiesto dalla policy di consegna della sorgente, inoltrare
il risultato tramite lo strumento messaggi. Per le route di gruppo/canale solo con
strumento messaggi, OpenClaw considera l'assenza di prove di consegna dello strumento
messaggi come un tentativo di completamento non riuscito e invia direttamente al canale
originale il fallback dei contenuti multimediali generati.

## Speech-to-text e Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
I Plugin di canale che eseguono il preflight di una nota vocale per il gating delle menzioni
o il parsing dei comandi marcano l'allegato trascritto nel contesto in ingresso, così il
passaggio condiviso di comprensione dei contenuti multimediali riusa quella trascrizione
invece di effettuare una seconda chiamata STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming
di Voice Call, quindi l'audio telefonico live può essere inoltrato al vendor selezionato
senza attendere una registrazione completata.

Per conversazioni utente live, preferisci la [modalità Talk](/it/nodes/talk). Gli allegati
audio batch restano sul percorso multimediale; realtime del browser, push-to-talk nativo,
telefonia e audio delle riunioni devono usare gli eventi Talk e i cataloghi con ambito
di sessione restituiti dal Gateway.

## Mappature dei provider (come i vendor si dividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagini, video, musica, TTS batch, voce realtime backend e
    comprensione dei contenuti multimediali.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagini, video, TTS batch, STT batch, STT in streaming di Voice Call,
    voce realtime backend e embedding della memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Routing chat/modello, generazione/modifica di immagini, testo-a-video, TTS batch,
    STT batch, comprensione multimediale delle immagini e superfici di embedding della memoria.
    I modelli DeepInfra nativi di rerank/classification/object-detection non vengono
    registrati finché OpenClaw non dispone di contratti provider dedicati per quelle
    categorie.
  </Accordion>
  <Accordion title="xAI">
    Immagine, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in streaming
    di Voice Call. La voce xAI Realtime è una funzionalità upstream, ma non è registrata
    in OpenClaw finché il contratto condiviso per la voce realtime non può rappresentarla.
  </Accordion>
</AccordionGroup>

## Correlati

- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
- [Generazione di musica](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Nodi audio](/it/nodes/audio)
- [Modalità Talk](/it/nodes/talk)
