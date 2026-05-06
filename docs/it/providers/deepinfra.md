---
read_when:
    - Vuoi un'unica chiave API per i principali LLM open source
    - Vuoi eseguire modelli tramite l'API di DeepInfra in OpenClaw
summary: Usa l'API unificata di DeepInfra per accedere ai modelli a codice aperto e di frontiera più popolari in OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T09:05:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra fornisce un'**API unificata** che instrada le richieste ai modelli open source e frontier più popolari dietro un unico
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Ottenere una chiave API

1. Vai a [https://deepinfra.com/](https://deepinfra.com/)
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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Superfici OpenClaw supportate

Il Plugin incluso registra tutte le superfici DeepInfra che corrispondono agli attuali
contratti dei provider OpenClaw:

| Superficie                    | Modello predefinito               | Configurazione/strumento OpenClaw                         |
| ----------------------------- | --------------------------------- | --------------------------------------------------------- |
| Chat / provider di modelli    | `deepseek-ai/DeepSeek-V3.2`       | `agents.defaults.model`                                   |
| Generazione/modifica immagini | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensione dei media        | `moonshotai/Kimi-K2.5` per immagini | comprensione delle immagini in ingresso                 |
| Voce in testo                 | `openai/whisper-large-v3-turbo`   | trascrizione audio in ingresso                            |
| Testo in voce                 | `hexgrad/Kokoro-82M`              | `messages.tts.provider: "deepinfra"`                      |
| Generazione video             | `Pixverse/Pixverse-T2V`           | `video_generate`, `agents.defaults.videoGenerationModel`  |
| Embedding di memoria          | `BAAI/bge-m3`                     | `agents.defaults.memorySearch.provider: "deepinfra"`      |

DeepInfra espone anche reranking, classificazione, rilevamento di oggetti e altri
tipi di modelli nativi. OpenClaw attualmente non dispone di contratti provider
di prima classe per queste categorie, quindi questo Plugin non li registra ancora.

## Modelli disponibili

OpenClaw scopre dinamicamente i modelli DeepInfra disponibili all'avvio. Usa
`/models deepinfra` per vedere l'elenco completo dei modelli disponibili.

Qualsiasi modello disponibile su [DeepInfra.com](https://deepinfra.com/) può essere usato con il prefisso `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Note

- I riferimenti dei modelli sono `deepinfra/<provider>/<model>` (ad es. `deepinfra/Qwen/Qwen3-Max`).
- Modello predefinito: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL di base: `https://api.deepinfra.com/v1/openai`
- La generazione video nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

## Correlati

- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
