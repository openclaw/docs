---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Scelta del provider multimediale da configurare
    - Comprendere il funzionamento della generazione asincrona di contenuti multimediali
sidebarTitle: Media overview
summary: Capacità per immagini, video, musica, parlato e comprensione dei contenuti multimediali a colpo d'occhio
title: Panoramica dei media
x-i18n:
    generated_at: "2026-04-30T09:17:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i media in ingresso
(immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte
le funzionalità multimediali sono guidate da strumenti: l'agente decide quando usarle in base
alla conversazione e ogni strumento compare solo quando è configurato almeno un
provider sottostante.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt testuali o immagini di riferimento tramite
    `image_generate`. Sincrona — viene completata all'interno della risposta.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrona — viene eseguita in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrona sui
    provider condivisi; il percorso del workflow ComfyUI viene eseguito in modo sincrono.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più la
    configurazione `messages.tts`. Sincrona.
  </Card>
  <Card title="Comprensione dei media" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli
    con capacità visive e plugin dedicati alla comprensione dei media.
  </Card>
  <Card title="Riconoscimento vocale" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite STT in batch o provider STT
    in streaming per chiamate vocali.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

| Provider    | Immagine | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione dei media |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| CLI locale   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
La comprensione dei media usa qualsiasi modello con capacità visive o audio registrato
nella configurazione del tuo provider. La matrice sopra elenca i provider con supporto
dedicato alla comprensione dei media; la maggior parte dei provider LLM multimodali (Anthropic, Google,
OpenAI, ecc.) può comprendere anche i media in ingresso quando è configurata come modello
di risposta attivo.
</Note>

## Asincrono e sincrono

| Funzionalità      | Modalità         | Perché                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Immagine           | Sincrona  | Le risposte del provider arrivano in pochi secondi; viene completata all'interno della risposta. |
| Sintesi vocale  | Sincrona  | Le risposte del provider arrivano in pochi secondi; vengono allegate all'audio della risposta. |
| Video           | Asincrona | L'elaborazione del provider richiede da 30 s a diversi minuti.                 |
| Musica (condivisa)  | Asincrona | Stessa caratteristica di elaborazione del provider del video.                  |
| Musica (ComfyUI) | Sincrona  | Il workflow locale viene eseguito inline sul server ComfyUI configurato.  |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce immediatamente
un id attività e traccia il lavoro nel registro delle attività. L'agente continua
a rispondere ad altri messaggi mentre il lavoro è in esecuzione. Quando il provider termina,
OpenClaw riattiva l'agente in modo che possa pubblicare il media completato nel
canale originale.

## Riconoscimento vocale e chiamata vocale

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
I plugin dei canali che eseguono il preflight di una nota vocale per il filtro delle menzioni o il parsing
dei comandi marcano l'allegato trascritto nel contesto in ingresso, quindi il passaggio condiviso
di comprensione dei media riusa quella trascrizione invece di effettuare una seconda
chiamata STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT
in streaming per chiamate vocali, quindi l'audio telefonico live può essere inoltrato al fornitore
selezionato senza attendere una registrazione completata.

## Mappature dei provider (come i fornitori si suddividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagine, video, musica, TTS in batch, voce in tempo reale backend e
    comprensione dei media.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagine, video, TTS in batch, STT in batch, STT in streaming per chiamate vocali, voce in tempo reale backend
    e embedding di memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfici di chat/routing dei modelli, generazione/modifica di immagini, da testo a video, TTS in batch,
    STT in batch, comprensione dei media immagine ed embedding di memoria.
    I modelli nativi DeepInfra di rerank/classificazione/rilevamento oggetti non vengono
    registrati finché OpenClaw non dispone di contratti provider dedicati per quelle
    categorie.
  </Accordion>
  <Accordion title="xAI">
    Immagine, video, ricerca, esecuzione di codice, TTS in batch, STT in batch e STT
    in streaming per chiamate vocali. La voce in tempo reale xAI è una funzionalità upstream ma
    non viene registrata in OpenClaw finché il contratto condiviso per la voce in tempo reale non può
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
