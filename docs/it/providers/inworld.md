---
read_when:
    - Vuoi la sintesi vocale di Inworld per le risposte in uscita
    - È necessario l'output da Inworld per telefonia PCM o per note vocali OGG_OPUS
summary: Sintesi vocale in streaming di Inworld per le risposte di OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld è un provider di sintesi vocale (TTS) in streaming. In OpenClaw
sintetizza l'audio delle risposte in uscita (MP3 per impostazione predefinita, OGG_OPUS per le note vocali)
e audio PCM per canali di telefonia come Voice Call.

OpenClaw invia richieste all'endpoint TTS in streaming di Inworld, concatena i
chunk audio base64 restituiti in un unico buffer e passa il risultato alla
pipeline standard dell'audio di risposta.

| Proprietà            | Valore                                                          |
| -------------------- | --------------------------------------------------------------- |
| ID provider          | `inworld`                                                       |
| Plugin               | in bundle, `enabledByDefault: true`                             |
| Contratto            | `speechProviders` (solo TTS)                                    |
| Var env auth         | `INWORLD_API_KEY` (HTTP Basic, credenziale dashboard Base64)    |
| URL base             | `https://api.inworld.ai`                                        |
| Voce predefinita     | `Sarah`                                                         |
| Modello predefinito  | `inworld-tts-1.5-max`                                           |
| Uscita               | MP3 (predefinita), OGG_OPUS (note vocali), PCM 22050 Hz (telefonia) |
| Sito web             | [inworld.ai](https://inworld.ai)                                |
| Documentazione       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
    Copia la credenziale dalla dashboard Inworld (Workspace > API Keys)
    e impostala come variabile env. Il valore viene inviato letteralmente come
    credenziale HTTP Basic, quindi non codificarlo di nuovo in Base64 né
    convertirlo in un token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Seleziona Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Invia un messaggio">
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza
    l'audio con Inworld e lo consegna come MP3 (o OGG_OPUS quando il canale
    richiede una nota vocale).
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione       | Percorso                                     | Descrizione                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credenziale dashboard Base64. Ripiega su `INWORLD_API_KEY`.       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Sovrascrive l'URL base dell'API Inworld (predefinito `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificatore della voce (predefinito `Sarah`).                  |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID modello TTS (predefinito `inworld-tts-1.5-max`).               |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura di campionamento `0..2` (opzionale).                  |

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Inworld usa l'autenticazione HTTP Basic con una singola stringa di
    credenziale codificata in Base64. Copiala letteralmente dalla dashboard
    Inworld. Il provider la invia come `Authorization: Basic <apiKey>` senza
    alcuna ulteriore codifica, quindi non codificarla tu stesso in Base64 e
    non passare un token in stile bearer. Vedi le [note sull'autenticazione TTS](/it/tools/tts#inworld-primary)
    per lo stesso richiamo.
  </Accordion>
  <Accordion title="Modelli">
    ID modello supportati: `inworld-tts-1.5-max` (predefinito),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Output audio">
    Le risposte usano MP3 per impostazione predefinita. Quando il target del
    canale è `voice-note`, OpenClaw chiede a Inworld `OGG_OPUS` affinché
    l'audio venga riprodotto come una bolla vocale nativa. La sintesi per
    telefonia usa `PCM` grezzo a 22050 Hz per alimentare il bridge di telefonia.
  </Accordion>
  <Accordion title="Endpoint personalizzati">
    Sovrascrivi l'host API con `messages.tts.providers.inworld.baseUrl`.
    Le barre finali vengono rimosse prima dell'invio delle richieste.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="waveform-lines">
    Panoramica TTS, provider e configurazione `messages.tts`.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo alla configurazione, incluse le impostazioni `messages.tts`.
  </Card>
  <Card title="Provider" href="/it/providers" icon="grid">
    Tutti i provider OpenClaw in bundle.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
</CardGroup>
