---
read_when:
    - Vuoi la sintesi vocale Inworld per le risposte in uscita
    - Ti serve un output di telefonia PCM o di nota vocale OGG_OPUS da Inworld
summary: Sintesi vocale in streaming di Inworld per le risposte di OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:07:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld è un provider di sintesi vocale text-to-speech (TTS) in streaming. In OpenClaw
sintetizza l'audio delle risposte in uscita (MP3 per impostazione predefinita, OGG_OPUS per le note vocali)
e audio PCM per canali telefonici come Voice Call.

OpenClaw invia richieste all'endpoint TTS in streaming di Inworld, concatena i
chunk audio base64 restituiti in un singolo buffer e passa il risultato alla
pipeline standard per l'audio di risposta.

| Proprietà      | Valore                                                          |
| -------------- | --------------------------------------------------------------- |
| ID provider    | `inworld`                                                       |
| Plugin         | pacchetto esterno ufficiale                                     |
| Contratto      | `speechProviders` (solo TTS)                                    |
| Variabile env di autenticazione | `INWORLD_API_KEY` (HTTP Basic, credenziale dashboard Base64) |
| URL base       | `https://api.inworld.ai`                                        |
| Voce predefinita | `Sarah`                                                       |
| Modello predefinito | `inworld-tts-1.5-max`                                      |
| Output         | MP3 (predefinito), OGG_OPUS (note vocali), PCM 22050 Hz (telefonia) |
| Sito web       | [inworld.ai](https://inworld.ai)                                |
| Documentazione | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Installa il Plugin

Installa il Plugin ufficiale, poi riavvia Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Primi passi

<Steps>
  <Step title="Imposta la tua chiave API">
    Copia la credenziale dalla tua dashboard Inworld (Workspace > API Keys)
    e impostala come variabile env. Il valore viene inviato così com'è come
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
              speakerVoiceId: "Sarah",
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
    si aspetta una nota vocale).
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione          | Percorso                                        | Descrizione                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Credenziale dashboard Base64. Ripiega su `INWORLD_API_KEY`.       |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Sovrascrive l'URL base dell'API Inworld (predefinito `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Identificatore della voce (predefinito `Sarah`).                  |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID modello TTS (predefinito `inworld-tts-1.5-max`).               |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Temperatura di campionamento `0..2` (opzionale).                  |

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Inworld usa l'autenticazione HTTP Basic con una singola stringa di
    credenziale codificata in Base64. Copiala così com'è dalla dashboard
    Inworld. Il provider la invia come `Authorization: Basic <apiKey>` senza
    ulteriori codifiche, quindi non codificarla tu in Base64 e non passare un
    token in stile bearer. Vedi le [note di autenticazione TTS](/it/tools/tts#inworld-primary)
    per la stessa avvertenza.
  </Accordion>
  <Accordion title="Modelli">
    ID modello supportati: `inworld-tts-1.5-max` (predefinito),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Output audio">
    Le risposte usano MP3 per impostazione predefinita. Quando il target del
    canale è `voice-note`, OpenClaw chiede a Inworld `OGG_OPUS` così l'audio
    viene riprodotto come fumetto vocale nativo. La sintesi per telefonia usa
    `PCM` grezzo a 22050 Hz per alimentare il bridge di telefonia.
  </Accordion>
  <Accordion title="Endpoint personalizzati">
    Sovrascrivi l'host API con `messages.tts.providers.inworld.baseUrl`.
    Le barre finali vengono rimosse prima dell'invio delle richieste.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/it/tools/tts" icon="waveform-lines">
    Panoramica TTS, provider e configurazione `messages.tts`.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni `messages.tts`.
  </Card>
  <Card title="Provider" href="/it/providers" icon="grid">
    Tutti i provider OpenClaw supportati.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
</CardGroup>
