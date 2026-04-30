---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für die führenden Open-Source-LLMs
    - Sie möchten Modelle über die API von DeepInfra in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von DeepInfra, um in OpenClaw auf die beliebtesten Open-Source- und Frontier-Modelle zuzugreifen
x-i18n:
    generated_at: "2026-04-30T07:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra stellt eine **vereinheitlichte API** bereit, die Anfragen hinter einem einzigen
Endpoint und API-Schlüssel an die beliebtesten Open-Source- und Frontier-Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI SDKs durch Wechsel der Basis-URL funktionieren.

## API-Schlüssel erhalten

1. Gehen Sie zu [https://deepinfra.com/](https://deepinfra.com/)
2. Melden Sie sich an oder erstellen Sie ein Konto
3. Navigieren Sie zu Dashboard / Keys und generieren Sie einen neuen API-Schlüssel oder verwenden Sie den automatisch erstellten

## CLI-Einrichtung

```bash
openclaw onboard --deepinfra-api-key <key>
```

Oder setzen Sie die Umgebungsvariable:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Konfigurationsausschnitt

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

## Unterstützte OpenClaw-Oberflächen

Das mitgelieferte Plugin registriert alle DeepInfra-Oberflächen, die den aktuellen
OpenClaw-Provider-Verträgen entsprechen:

| Oberfläche               | Standardmodell                    | OpenClaw-Konfiguration/Tool                            |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Chat / Modell-Provider   | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Bildgenerierung/-bearbeitung | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medienverständnis        | `moonshotai/Kimi-K2.5` für Bilder | Verständnis eingehender Bilder                           |
| Speech-to-Text           | `openai/whisper-large-v3-turbo`    | Transkription eingehender Audiodaten                     |
| Text-to-Speech           | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Videogenerierung         | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Memory-Embeddings        | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra stellt außerdem Reranking, Klassifizierung, Objekterkennung und andere
native Modelltypen bereit. OpenClaw hat derzeit keine erstklassigen Provider-Verträge
für diese Kategorien, daher registriert dieses Plugin sie noch nicht.

## Verfügbare Modelle

OpenClaw ermittelt verfügbare DeepInfra-Modelle beim Start dynamisch. Verwenden Sie
`/models deepinfra`, um die vollständige Liste der verfügbaren Modelle anzuzeigen.

Jedes auf [DeepInfra.com](https://deepinfra.com/) verfügbare Modell kann mit dem Präfix `deepinfra/` verwendet werden:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Hinweise

- Modellreferenzen sind `deepinfra/<provider>/<model>` (z. B. `deepinfra/Qwen/Qwen3-Max`).
- Standardmodell: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Native Videogenerierung verwendet `https://api.deepinfra.com/v1/inference/<model>`.
