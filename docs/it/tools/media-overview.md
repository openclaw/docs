---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali di OpenClaw
    - Decidere quale provider multimediale configurare
    - Comprendere il funzionamento della generazione asincrona di contenuti multimediali
sidebarTitle: Media overview
summary: Panoramica delle funzionalità per immagini, video, musica, voce e comprensione dei contenuti multimediali
title: Panoramica dei contenuti multimediali
x-i18n:
    generated_at: "2026-07-12T07:34:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera immagini, video e musica, comprende i contenuti multimediali in ingresso
(immagini, audio, video) e pronuncia ad alta voce le risposte tramite sintesi vocale. Tutte
le funzionalità multimediali sono gestite tramite strumenti: l'agente decide quando usarle in base
alla conversazione e ciascuno strumento compare solo quando è configurato almeno un
provider sottostante.

La voce dal vivo usa il contratto di sessione Talk anziché il percorso dello strumento multimediale
a esecuzione singola. Talk dispone di tre modalità: `realtime` nativa del provider, `stt-tts`
locale o in streaming e `transcription` per l'acquisizione vocale di sola osservazione. Queste modalità
condividono cataloghi dei provider, contenitori degli eventi e semantica di annullamento con
telefonia, riunioni, comunicazione in tempo reale nel browser e client push-to-talk nativi.

## Funzionalità

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Crea e modifica immagini a partire da prompt testuali o immagini di riferimento tramite
    `image_generate`. Asincrono nelle sessioni di chat: viene eseguito in background e
    pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Da testo a video, da immagine a video e da video a video tramite `video_generate`.
    Asincrono: viene eseguito in background e pubblica il risultato quando è pronto.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Genera musica o tracce audio tramite `music_generate`. Asincrono nelle sessioni
    di chat, nel ciclo di vita condiviso delle attività di generazione multimediale.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="microphone">
    Converte le risposte in uscita in audio parlato tramite lo strumento `tts` e la
    configurazione `messages.tts`. Sincrono.
  </Card>
  <Card title="Comprensione multimediale" href="/it/nodes/media-understanding" icon="eye">
    Riassume immagini, audio e video in ingresso usando provider di modelli
    con funzionalità visive e Plugin dedicati alla comprensione multimediale.
  </Card>
  <Card title="Riconoscimento vocale" href="/it/nodes/audio" icon="ear-listen">
    Trascrive i messaggi vocali in ingresso tramite STT in batch o provider STT
    in streaming per Voice Call.
  </Card>
</CardGroup>

## Matrice delle funzionalità dei provider

<Note>
Questa tabella comprende i Plugin dedicati alla generazione multimediale, alla sintesi vocale
e al riconoscimento vocale. Molti provider di modelli di chat (Anthropic, Google, OpenAI e altri)
comprendono inoltre i contenuti multimediali in ingresso tramite il proprio modello di risposta; consulta
l'elenco completo dei provider in
[Comprensione multimediale](/it/nodes/media-understanding#provider-support-matrix).
</Note>

| Provider          | Immagini | Video | Musica | TTS | STT | Voce in tempo reale | Comprensione multimediale |
| ----------------- | :------: | :---: | :----: | :-: | :-: | :-----------------: | :-----------------------: |
| Alibaba           |          |   ✓   |        |     |     |                     |                           |
| Azure Speech      |          |       |        |  ✓  |     |                     |                           |
| BytePlus          |          |   ✓   |        |     |     |                     |                           |
| ComfyUI           |    ✓     |   ✓   |   ✓    |     |     |                     |                           |
| Deepgram          |          |       |        |     |  ✓  |                     |                           |
| DeepInfra         |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |             ✓             |
| ElevenLabs        |          |       |        |  ✓  |  ✓  |                     |                           |
| fal               |    ✓     |   ✓   |   ✓    |     |     |                     |                           |
| Google            |    ✓     |   ✓   |   ✓    |  ✓  |  ✓  |          ✓          |             ✓             |
| Gradium           |          |       |        |  ✓  |     |                     |                           |
| Inworld           |          |       |        |  ✓  |     |                     |                           |
| LiteLLM           |    ✓     |       |        |     |     |                     |                           |
| CLI locale        |          |       |        |  ✓  |     |                     |                           |
| Microsoft         |          |       |        |  ✓  |     |                     |                           |
| Microsoft Foundry |    ✓     |       |        |     |     |                     |                           |
| MiniMax           |    ✓     |   ✓   |   ✓    |  ✓  |     |                     |                           |
| Mistral           |          |       |        |     |  ✓  |                     |                           |
| OpenAI            |    ✓     |   ✓   |        |  ✓  |  ✓  |          ✓          |             ✓             |
| OpenRouter        |    ✓     |   ✓   |   ✓    |  ✓  |  ✓  |                     |             ✓             |
| PixVerse          |          |   ✓   |        |     |     |                     |                           |
| Qwen              |          |   ✓   |        |     |     |                     |             ✓             |
| Runway            |          |   ✓   |        |     |     |                     |                           |
| SenseAudio        |          |       |        |     |  ✓  |                     |                           |
| Together          |          |   ✓   |        |     |     |                     |                           |
| Volcengine        |          |       |        |  ✓  |     |                     |                           |
| Vydra             |    ✓     |   ✓   |        |  ✓  |     |                     |                           |
| xAI               |    ✓     |   ✓   |        |  ✓  |  ✓  |                     |             ✓             |
| Xiaomi MiMo       |          |       |        |  ✓  |     |                     |                           |

<Note>
Per **voce in tempo reale** si intende qui la comunicazione bidirezionale in tempo reale nativa
del provider (modalità `realtime` di Talk, ad esempio Gemini Live o OpenAI Realtime API): attualmente
solo Google e OpenAI la registrano. Deepgram, ElevenLabs, Mistral, OpenAI e xAI
registrano separatamente lo STT in streaming di Voice Call (audio-testo unidirezionale); consulta
[Riconoscimento vocale e Voice Call](#speech-to-text-and-voice-call) più avanti.
La voce in tempo reale di xAI è una funzionalità upstream, ma non viene registrata in
OpenClaw finché il contratto condiviso per la voce in tempo reale non sarà in grado di rappresentarla.
</Note>

## Asincrono e sincrono

| Funzionalità   | Modalità   | Motivo                                                                                                                  |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Immagini       | Asincrona  | L'elaborazione del provider può durare più di un turno di chat; gli allegati generati usano il percorso di completamento condiviso. |
| Sintesi vocale | Sincrona   | Le risposte del provider arrivano in pochi secondi e vengono allegate all'audio della risposta.                          |
| Video          | Asincrona  | L'elaborazione del provider richiede da 30 s a diversi minuti; le code lente possono continuare fino al timeout configurato. |
| Musica         | Asincrona  | Presenta le stesse caratteristiche di elaborazione del provider dei video.                                               |

Per gli strumenti asincroni, OpenClaw invia la richiesta al provider, restituisce immediatamente
un id dell'attività e monitora il processo nel registro delle attività. L'agente continua
a rispondere agli altri messaggi mentre il processo è in esecuzione. Al termine del provider,
OpenClaw riattiva l'agente fornendogli i percorsi dei contenuti multimediali generati, affinché possa informare
l'utente tramite la normale modalità di risposta visibile della sessione: consegna automatica della risposta finale
quando configurata, oppure `message(action="send")` quando la sessione richiede
lo strumento per i messaggi. Se la sessione del richiedente è inattiva o la relativa riattivazione non
riesce, e nella risposta di completamento mancano ancora alcuni contenuti multimediali generati,
OpenClaw invia direttamente un fallback idempotente contenente solo i contenuti mancanti. I contenuti multimediali
già consegnati dalla risposta di completamento non vengono pubblicati di nuovo.

## Riconoscimento vocale e Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio e xAI possono tutti trascrivere l'audio in ingresso tramite il percorso batch
`tools.media.audio`, se configurati. I Plugin dei canali che eseguono una verifica preliminare
di una nota vocale per filtrare le menzioni o analizzare i comandi contrassegnano l'allegato
trascritto nel contesto in ingresso, in modo che il passaggio condiviso di comprensione multimediale
riutilizzi tale trascrizione anziché effettuare una seconda chiamata STT per lo stesso
audio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano inoltre provider STT
in streaming per Voice Call, consentendo di inoltrare l'audio telefonico dal vivo al fornitore
selezionato senza attendere il completamento di una registrazione.

Per le conversazioni dal vivo con gli utenti, preferisci la [modalità Talk](/it/nodes/talk). Gli allegati
audio in batch restano nel percorso multimediale; la comunicazione in tempo reale nel browser, il push-to-talk
nativo, la telefonia e l'audio delle riunioni devono usare gli eventi Talk e i cataloghi
con ambito di sessione restituiti dal Gateway.

## Mappature dei provider (come i fornitori si suddividono tra le superfici)

<AccordionGroup>
  <Accordion title="Google">
    Superfici per immagini, video, musica, TTS in batch, STT in batch, voce in tempo reale
    del backend e comprensione multimediale.
  </Accordion>
  <Accordion title="OpenAI">
    Superfici per immagini, video, TTS in batch, STT in batch, STT in streaming per Voice Call,
    voce in tempo reale del backend e incorporamento della memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfici per instradamento di chat/modelli, generazione e modifica di immagini, conversione
    da testo a video, TTS in batch, STT in batch, comprensione dei contenuti multimediali visivi
    e incorporamento della memoria. DeepInfra espone inoltre riordinamento, classificazione,
    rilevamento di oggetti e altri tipi di modelli nativi; OpenClaw non dispone ancora di un
    contratto del provider per queste categorie, pertanto questo Plugin non le registra.
  </Accordion>
  <Accordion title="xAI">
    Immagini, video, ricerca, esecuzione di codice, TTS in batch, STT in batch e STT
    in streaming per Voice Call. La voce in tempo reale di xAI è una funzionalità upstream, ma
    non viene registrata in OpenClaw finché il contratto condiviso per la voce in tempo reale
    non sarà in grado di rappresentarla.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
- [Generazione di musica](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
- [Comprensione multimediale](/it/nodes/media-understanding)
- [Node audio](/it/nodes/audio)
- [Modalità Talk](/it/nodes/talk)
