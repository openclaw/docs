---
read_when:
    - Vuoi un'unica chiave API per i principali LLM open source
    - Vuoi eseguire modelli tramite l'API di DeepInfra in OpenClaw
summary: Usa l'API unificata di DeepInfra per accedere ai modelli open source e di frontiera più popolari in OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:06:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra fornisce un'**API unificata** che instrada le richieste verso i più popolari modelli open source e frontier dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Installa il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Ottenere una chiave API

1. Vai su [https://deepinfra.com/](https://deepinfra.com/)
2. Accedi o crea un account
3. Vai a Dashboard / Keys e genera una nuova chiave API oppure usa quella creata automaticamente

## Configurazione CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Oppure imposta la variabile d'ambiente:

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

## Superfici OpenClaw supportate

Il Plugin registra tutte le superfici DeepInfra che corrispondono agli attuali
contratti dei provider OpenClaw. Chat, generazione di immagini e generazione di video
aggiornano i propri cataloghi di modelli live da `/v1/openai/models?sort_by=openclaw&filter=with_meta`
quando `DEEPINFRA_API_KEY` è configurata; le altre superfici usano i valori predefiniti
statici curati riportati di seguito.

| Superficie               | Modello predefinito                                                                                   | Configurazione/strumento OpenClaw                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / provider modello  | prima voce con tag chat dal catalogo live (fallback del manifest `deepseek-ai/DeepSeek-V4-Flash`)     | `agents.defaults.model`                                  |
| Generazione/modifica immagini | prima voce con tag `image-gen` dal catalogo live (fallback statico `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensione dei media   | `moonshotai/Kimi-K2.5` per le immagini                                                                | comprensione delle immagini in ingresso                  |
| Speech-to-text           | `openai/whisper-large-v3-turbo`                                                                       | trascrizione audio in ingresso                           |
| Text-to-speech           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Generazione video        | prima voce con tag `video-gen` dal catalogo live (fallback statico `Pixverse/Pixverse-T2V`)           | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embedding di memoria     | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra espone anche reranking, classificazione, rilevamento di oggetti e altri
tipi di modelli nativi. OpenClaw al momento non dispone di contratti provider
di prima classe per queste categorie, quindi questo Plugin non le registra ancora.

## Modelli disponibili

OpenClaw rileva dinamicamente i modelli DeepInfra disponibili all'avvio. Usa
`/models deepinfra` per visualizzare l'elenco completo dei modelli disponibili.

Qualsiasi modello disponibile su [DeepInfra.com](https://deepinfra.com/) può essere usato con il prefisso `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Note

- I riferimenti ai modelli sono `deepinfra/<provider>/<model>` (ad esempio, `deepinfra/Qwen/Qwen3-Max`).
- Modello predefinito: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL di base: `https://api.deepinfra.com/v1/openai`
- La generazione video nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

## Correlati

- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
