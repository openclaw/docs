---
read_when:
    - Vuoi un'unica chiave API per i migliori LLM open source
    - Vuoi eseguire modelli tramite l'API di DeepInfra in OpenClaw
summary: Usa l'API unificata di DeepInfra per accedere ai modelli open source e di frontiera più popolari in OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T07:26:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra instrada le richieste verso noti modelli open source e di frontiera tramite un
unico endpoint compatibile con OpenAI e una sola chiave API. La maggior parte degli SDK OpenAI funziona
con DeepInfra modificando l'URL di base.

## Installare il plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Ottenere una chiave API

1. Accedi a [deepinfra.com](https://deepinfra.com/)
2. Vai a Dashboard / Keys e genera una chiave oppure usa quella creata automaticamente

## Configurazione tramite CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

In alternativa, imposta la variabile di ambiente:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Frammento di configurazione

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Funzionalità supportate

La chat, la generazione di immagini e la generazione di video aggiornano in tempo reale i rispettivi cataloghi dei modelli
da `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
dopo la configurazione di `DEEPINFRA_API_KEY`. Le altre funzionalità usano i valori predefiniti statici
riportati di seguito finché non verranno trasferite allo stesso catalogo in tempo reale.

| Funzionalità                  | Modello predefinito                                                                                         | Configurazione/strumento OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / fornitore di modelli    | prima voce con tag `chat` del catalogo in tempo reale (ripiego statico `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| Generazione/modifica di immagini | prima voce con tag `image-gen` del catalogo in tempo reale (ripiego statico `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensione dei contenuti multimediali      | `moonshotai/Kimi-K2.5` per le immagini                                                                     | comprensione delle immagini in ingresso                              |
| Conversione da voce a testo           | `openai/whisper-large-v3-turbo`                                                                       | trascrizione dell'audio in ingresso                              |
| Conversione da testo a voce           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Generazione di video         | ripiego statico `Pixverse/Pixverse-T2V` (attualmente DeepInfra non restituisce righe `video-gen` dal catalogo in tempo reale)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| Incorporamenti della memoria        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra offre inoltre riordinamento per pertinenza, classificazione, rilevamento di oggetti e altri
tipi di modelli nativi. OpenClaw non dispone ancora di un contratto del fornitore per tali categorie,
pertanto questo plugin non le registra.

## Modelli disponibili

OpenClaw rileva dinamicamente i modelli DeepInfra dopo la configurazione di una chiave. Usa
`/models deepinfra` o `openclaw models list --provider deepinfra` per visualizzare l'elenco
corrente.

Qualsiasi modello disponibile su [deepinfra.com](https://deepinfra.com/) funziona con il
prefisso `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...e molti altri
```

## Note

- I riferimenti ai modelli hanno il formato `deepinfra/<provider>/<model>` (ad esempio `deepinfra/Qwen/Qwen3-Max`).
- Modello di chat predefinito: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL di base: `https://api.deepinfra.com/v1/openai`
- La generazione nativa di video usa `https://api.deepinfra.com/v1/inference/<model>`.

## Contenuti correlati

- [Fornitori di modelli](/it/concepts/model-providers)
- [Tutti i fornitori](/it/providers/index)
