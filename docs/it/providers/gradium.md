---
read_when:
    - Vuoi Gradium per la sintesi vocale
    - È necessaria la configurazione della chiave API, della voce o del token di direttiva di Gradium
summary: Usa la sintesi vocale Gradium in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:07:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) è un provider di sintesi vocale per OpenClaw. Il Plugin può generare normali risposte audio (WAV), output Opus compatibile con i messaggi vocali e audio u-law a 8 kHz per superfici di telefonia.

| Proprietà          | Valore                               |
| ------------------ | ------------------------------------ |
| ID provider        | `gradium`                            |
| Autenticazione     | `GRADIUM_API_KEY` o config `apiKey`  |
| URL base           | `https://api.gradium.ai` (predefinito) |
| Voce predefinita   | `Emma` (`YTpq7expH9539ERJ`)          |

## Installa Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configurazione

Crea una chiave API Gradium, quindi esponila a OpenClaw con una variabile d'ambiente o con la chiave di configurazione.

<Tabs>
  <Tab title="Variabile d'ambiente">
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

Il Plugin controlla prima la `apiKey` risolta e, in caso contrario, usa la variabile d'ambiente `GRADIUM_API_KEY`.

## Config

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

| Chiave                                          | Tipo   | Descrizione                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Chiave API risolta. Supporta `${ENV}` e riferimenti a segreti.                                |
| `messages.tts.providers.gradium.baseUrl`        | string | Sostituisce l'origine API. Le barre finali vengono rimosse. Valore predefinito: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID voce predefinito usato quando non è presente alcuna direttiva di override.                 |

Il formato audio di output viene selezionato automaticamente dal runtime in base alla superficie di destinazione e non è configurabile da `openclaw.json`. Vedi [Output](#output) sotto.

## Voci

| Nome      | ID voce            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voce predefinita: Emma.

### Override della voce per messaggio

Quando la policy vocale attiva consente gli override della voce, puoi cambiare voce inline usando un token direttiva. Usa `speakerVoiceId` per gli ID voce nativi del provider.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Se la policy vocale disabilita gli override della voce, la direttiva viene consumata ma ignorata.

## Output

Il runtime sceglie il formato di output dalla superficie di destinazione. Al momento il provider non sintetizza altri formati.

| Destinazione    | Formato     | Estensione file | Frequenza di campionamento | Flag compatibile con messaggio vocale |
| --------------- | ----------- | --------------- | -------------------------- | ------------------------------------- |
| Audio standard  | `wav`       | `.wav`          | provider                   | no                                    |
| Messaggio vocale | `opus`     | `.opus`         | provider                   | sì                                    |
| Telefonia       | `ulaw_8000` | n/d             | 8 kHz                      | n/d                                   |

## Ordine di selezione automatica

Tra i provider TTS configurati, l'ordine di selezione automatica di Gradium è `30`. Vedi [Sintesi vocale](/it/tools/tts) per sapere come OpenClaw sceglie il provider attivo quando `messages.tts.provider` non è fissato.

## Correlati

- [Sintesi vocale](/it/tools/tts)
- [Panoramica media](/it/tools/media-overview)
