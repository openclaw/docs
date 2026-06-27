---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Decidere quale provider multimediale configurare
    - Capire come funziona la generazione asincrona di media
sidebarTitle: Media overview
summary: Funzionalità di comprensione di immagini, video, musica, voce e media in sintesi
title: Panoramica dei media
x-i18n:
    generated_at: "2026-06-27T18:21:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i media in ingresso
(immagini, audio, video) e pronuncia le risposte ad alta voce con la sintesi vocale. Tutte
le funzionalità multimediali sono guidate da strumenti: l'agente decide quando usarle in base
alla conversazione, e ogni strumento appare solo quando è configurato almeno un
provider di supporto.

Il parlato live usa il contratto di sessione Talk invece del percorso dello strumento multimediale
one-shot. Talk ha tre modalità: `realtime` nativa del provider, `stt-tts` locale o in streaming,
e `transcription` per l'acquisizione del parlato in sola osservazione. Queste modalità
condividono cataloghi dei provider, buste degli eventi e semantica di annullamento con
telefonia, riunioni, browser in tempo reale e client nativi push-to-talk.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini da prompt testuali o immagini di riferimento tramite
    `image_generate`. Asincrono nelle sessioni di chat: viene eseguito in background e
    pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrono: viene eseguito in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrono nelle sessioni di chat
    sul ciclo di vita condiviso delle attività di generazione multimediale.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` più la
    configurazione `messages.tts`. Sincrono.
  </Card>
  <Card title="Comprensione dei media" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli compatibili
    con la visione e plugin dedicati alla comprensione dei media.
  </Card>
  <Card title="Riconoscimento vocale" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite provider STT batch o STT in streaming
    per Voice Call.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

| Provider          | Immagine | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione dei media |
| ----------------- | :------: | :---: | :----: | :-: | :-: | :-----------------: | :--------------------: |
| Alibaba           |          |   ✓   |        |     |     |                     |                        |
| BytePlus          |          |   ✓   |        |     |     |                     |                        |
| ComfyUI           |    ✓     |   ✓   |   ✓    |     |     |                     |                        |
| DeepInfra         |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |           ✓            |
| Deepgram          |          |       |        |     |  ✓  |          ✓          |                        |
| ElevenLabs        |          |       |        |  ✓  |  ✓  |                     |                        |
| fal               |    ✓     |   ✓   |   ✓    |     |     |                     |                        |
| Google            |    ✓     |   ✓   |   ✓    |  ✓  |     |          ✓          |           ✓            |
| Gradium           |          |       |        |  ✓  |     |                     |                        |
| Local CLI         |          |       |        |  ✓  |     |                     |                        |
| Microsoft         |          |       |        |  ✓  |     |                     |                        |
| Microsoft Foundry |    ✓     |       |        |     |     |                     |                        |
| MiniMax           |    ✓     |   ✓   |   ✓    |  ✓  |     |                     |                        |
| Mistral           |          |       |        |     |  ✓  |                     |                        |
| OpenAI            |    ✓     |   ✓   |        |  ✓  |  ✓  |          ✓          |           ✓            |
| OpenRouter        |    ✓     |   ✓   |   ✓    |  ✓  |  ✓  |                     |           ✓            |
| Qwen              |          |   ✓   |        |     |     |                     |                        |
| Runway            |          |   ✓   |        |     |     |                     |                        |
| SenseAudio        |          |       |        |     |  ✓  |                     |                        |
| Together          |          |   ✓   |        |     |     |                     |                        |
| Vydra             |    ✓     |   ✓   |        |  ✓  |     |                     |                        |
| xAI               |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |           ✓            |
| Xiaomi MiMo       |    ✓     |       |        |  ✓  |     |                     |           ✓            |

<Note>
La comprensione dei media usa qualsiasi modello compatibile con la visione o con l'audio registrato
nella configurazione del provider. La matrice sopra elenca i provider con supporto dedicato alla
comprensione dei media; la maggior parte dei provider LLM multimodali (Anthropic, Google,
OpenAI, ecc.) può anche comprendere i media in ingresso quando è configurata come modello di
risposta attivo.
</Note>

## Asincrono e sincrono

| Funzionalità  | Modalità    | Motivo                                                                                                      |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| Immagine      | Asincrona   | L'elaborazione del provider può durare più di un turno di chat; gli allegati generati usano il percorso di completamento condiviso. |
| Sintesi vocale | Sincrona   | Le risposte del provider ritornano in pochi secondi; allegate all'audio della risposta.                      |
| Video         | Asincrona   | L'elaborazione del provider richiede da 30 s a diversi minuti; le code lente possono arrivare fino al timeout configurato. |
| Musica        | Asincrona   | Stessa caratteristica di elaborazione del provider dei video.                                               |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce immediatamente un
id attività e traccia il job nel registro delle attività. L'agente continua a rispondere ad altri
messaggi mentre il job è in esecuzione. Quando il provider termina, OpenClaw risveglia l'agente con
i percorsi dei media generati così può informare l'utente tramite la normale modalità di risposta
visibile della sessione: consegna automatica della risposta finale quando configurata, oppure
`message(action="send")` quando la sessione richiede lo strumento messaggio. Se la sessione del
richiedente è inattiva o il suo wake attivo fallisce, e dalla risposta di completamento mancano
ancora alcuni media generati, OpenClaw invia un fallback diretto idempotente con solo i media mancanti.
I media già consegnati dalla risposta di completamento non vengono pubblicati di nuovo.

## Riconoscimento vocale e Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio e xAI possono tutti trascrivere
l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
I plugin di canale che eseguono un preflight di una nota vocale per il gating delle menzioni o il
parsing dei comandi marcano l'allegato trascritto nel contesto in ingresso, così il passaggio condiviso
di comprensione dei media riusa quella trascrizione invece di effettuare una seconda chiamata
STT per lo stesso audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming per Voice Call,
così l'audio telefonico live può essere inoltrato al fornitore selezionato senza attendere una
registrazione completata.

Per conversazioni utente live, preferisci [modalità Talk](/it/nodes/talk). Gli allegati audio batch
restano sul percorso dei media; browser in tempo reale, push-to-talk nativo, telefonia e audio delle
riunioni dovrebbero usare gli eventi Talk e i cataloghi con ambito di sessione restituiti dal Gateway.

## Mappature dei provider (come i fornitori si suddividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici di immagini, video, musica, TTS batch, voce in tempo reale backend e
    comprensione dei media.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici di immagini, video, TTS batch, STT batch, STT in streaming per Voice Call, voce
    in tempo reale backend ed embedding di memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Routing di chat/modelli, generazione/modifica di immagini, da testo a video, TTS batch,
    STT batch, comprensione dei media immagine e superfici di embedding di memoria.
    I modelli nativi DeepInfra di rerank/classificazione/rilevamento oggetti non sono
    registrati finché OpenClaw non dispone di contratti provider dedicati per quelle
    categorie.
  </Accordion>
  <Accordion title="xAI">
    Immagini, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in streaming
    per Voice Call. La voce in tempo reale xAI è una funzionalità upstream ma non è
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
- [Modalità Talk](/it/nodes/talk)
