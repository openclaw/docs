---
read_when:
    - Vuoi utilizzare la sintesi vocale di Inworld per le risposte in uscita
    - Hai bisogno di un output di telefonia PCM o di note vocali OGG_OPUS da Inworld
summary: Sintesi vocale in streaming di Inworld per le risposte di OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T07:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld è un provider di sintesi vocale (TTS) in streaming. In OpenClaw sintetizza l'audio delle risposte in uscita (MP3 per impostazione predefinita, OGG_OPUS per i messaggi vocali) e audio PCM grezzo per i canali di telefonia come Voice Call.

OpenClaw invia richieste all'endpoint TTS in streaming di Inworld, concatena i segmenti audio in base64 restituiti in un singolo buffer e passa il risultato alla pipeline standard per l'audio delle risposte.

| Proprietà        | Valore                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| ID provider      | `inworld`                                                               |
| Plugin           | pacchetto esterno ufficiale (`@openclaw/inworld-speech`)                |
| Contratto        | `speechProviders` (solo TTS)                                            |
| Variabile di ambiente per l'autenticazione | `INWORLD_API_KEY` (HTTP Basic, credenziale Base64 della dashboard) |
| URL di base      | `https://api.inworld.ai`                                                |
| Voce predefinita | `Sarah`                                                                 |
| Modello predefinito | `inworld-tts-1.5-max`                                                |
| Output           | MP3 (predefinito), OGG_OPUS (messaggi vocali), PCM 22050 Hz (telefonia) |
| Sito web         | [inworld.ai](https://inworld.ai)                                        |
| Documentazione   | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)              |

## Installare il Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Guida introduttiva

<Steps>
  <Step title="Imposta la chiave API">
    Copia la credenziale dalla dashboard di Inworld (Workspace > API Keys) e impostala come variabile di ambiente. Il valore viene inviato senza modifiche come credenziale HTTP Basic, quindi non codificarlo nuovamente in Base64 e non convertirlo in un token bearer.

    ```bash
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
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza l'audio con Inworld e lo recapita come MP3 (o OGG_OPUS quando il canale richiede un messaggio vocale).
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione       | Percorso                                     | Descrizione                                                                |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credenziale Base64 della dashboard. In alternativa usa `INWORLD_API_KEY`.  |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Sostituisce l'URL di base dell'API Inworld (predefinito: `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificatore della voce (predefinito: `Sarah`). Alias precedente: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID del modello TTS (predefinito: `inworld-tts-1.5-max`).                   |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura di campionamento, da `0` (escluso) a `2` (facoltativa).        |

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Inworld usa l'autenticazione HTTP Basic con un'unica stringa di credenziali codificata in Base64. Copiala senza modifiche dalla dashboard di Inworld. Il provider la invia come `Authorization: Basic <apiKey>` senza ulteriore codifica, quindi non codificarla personalmente in Base64 e non fornire un token in stile bearer. Consulta le [note sull'autenticazione TTS](/it/tools/tts#inworld-primary) per la stessa avvertenza.
  </Accordion>
  <Accordion title="Modelli">
    ID dei modelli supportati: `inworld-tts-1.5-max` (predefinito), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Formati audio in uscita">
    Per impostazione predefinita, le risposte usano MP3. Quando la destinazione del canale è `voice-note`, OpenClaw richiede a Inworld il formato `OGG_OPUS`, così l'audio viene riprodotto come messaggio vocale nativo. La sintesi per telefonia usa audio `PCM` grezzo a 22050 Hz per alimentare il bridge di telefonia.
  </Accordion>
  <Accordion title="Endpoint personalizzati">
    Sostituisci l'host dell'API con `messages.tts.providers.inworld.baseUrl`. Le barre finali vengono rimosse prima dell'invio delle richieste.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="waveform-lines">
    Panoramica della TTS, provider e configurazione di `messages.tts`.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni di `messages.tts`.
  </Card>
  <Card title="Provider" href="/it/providers" icon="grid">
    Tutti i provider supportati da OpenClaw.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e procedure di debug.
  </Card>
</CardGroup>
