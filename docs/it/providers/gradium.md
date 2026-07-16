---
read_when:
    - Si desidera Gradium per la sintesi vocale
    - È necessario configurare la chiave API, la voce o il token di direttiva di Gradium
summary: Usare la sintesi vocale di Gradium in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T14:51:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) è un provider di sintesi vocale per OpenClaw. Genera risposte audio standard (WAV), output Opus compatibile con i messaggi vocali e audio u-law a 8 kHz per le interfacce di telefonia.

| Proprietà      | Valore                                |
| ------------- | ------------------------------------ |
| ID provider   | `gradium`                            |
| Autenticazione          | `GRADIUM_API_KEY` o configurazione `apiKey` |
| URL di base      | `https://api.gradium.ai` (predefinito)   |
| Voce predefinita | `Emma` (`YTpq7expH9539ERJ`)          |

## Installare il plugin

Gradium è un plugin esterno ufficiale. Installarlo, quindi riavviare il Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configurazione

Creare una chiave API Gradium, quindi renderla disponibile tramite una variabile di ambiente o la chiave di configurazione. La configurazione ha la precedenza sulla variabile di ambiente.

<Tabs>
  <Tab title="Variabile di ambiente">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Chiave di configurazione">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Configurazione

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Chiave                                             | Tipo   | Descrizione                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Chiave API risolta. Supporta `${ENV}` e riferimenti ai segreti.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | string | URL HTTPS dell'API Gradium su `api.gradium.ai`. Le barre finali vengono rimosse. Valore predefinito: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID della voce predefinita usato quando non è presente alcuna sostituzione tramite direttiva.                                            |

Il formato di output viene scelto automaticamente in base all'interfaccia di destinazione (vedere [Output](#output)) e non è configurabile in `openclaw.json`.

## Voci

| Nome               | ID voce           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(predefinita)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Sostituzione della voce per singolo messaggio

Quando la politica vocale attiva consente di sostituire la voce, è possibile cambiarla direttamente nel testo con un token di direttiva (tutte queste forme sono equivalenti e accettano un ID voce nativo del provider):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Se la politica vocale disabilita la sostituzione della voce, la direttiva viene elaborata ma ignorata.

## Output

Il formato di output viene selezionato in base all'interfaccia di destinazione; il provider non sintetizza altri formati.

| Destinazione         | Formato      | Estensione file | Frequenza di campionamento | Indicatore di compatibilità vocale |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Audio standard | `wav`       | `.wav`   | provider    | no                    |
| Messaggio vocale     | `opus`      | `.opus`  | provider    | sì                   |
| Telefonia      | `ulaw_8000` | n/d      | 8 kHz       | n/d                   |

## Ordine di selezione automatica

Tra i provider TTS configurati, l'ordine di selezione automatica di Gradium è `30`. Consultare [Sintesi vocale](/it/tools/tts) per sapere come OpenClaw sceglie il provider attivo quando `messages.tts.provider` non è impostato in modo esplicito.

## Contenuti correlati

- [Sintesi vocale](/it/tools/tts)
- [Panoramica dei contenuti multimediali](/it/tools/media-overview)
