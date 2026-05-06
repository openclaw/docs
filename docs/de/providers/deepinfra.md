---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für die führenden Open-Source-LLMs
    - Sie möchten Modelle über die API von DeepInfra in OpenClaw ausführen
summary: Nutzen Sie die einheitliche API von DeepInfra, um in OpenClaw auf die beliebtesten Open-Source- und Frontier-Modelle zuzugreifen
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T07:00:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra stellt eine **einheitliche API** bereit, die Anfragen an die beliebtesten Open-Source- und Frontier-Modelle hinter einem einzigen
Endpunkt und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI-SDKs funktionieren, indem die Basis-URL geändert wird.

## API-Schlüssel abrufen

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

Das gebündelte Plugin registriert alle DeepInfra-Oberflächen, die den aktuellen
OpenClaw-Provider-Verträgen entsprechen:

| Oberfläche               | Standardmodell                    | OpenClaw-Konfiguration/-Tool                         |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Chat / Modell-Provider   | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Bilderzeugung/-bearbeitung | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medienverständnis        | `moonshotai/Kimi-K2.5` for images  | Eingehendes Bildverständnis                              |
| Speech-to-Text           | `openai/whisper-large-v3-turbo`    | Eingehende Audiotranskription                            |
| Text-to-Speech           | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Videogenerierung         | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Memory-Einbettungen      | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra stellt außerdem Reranking, Klassifizierung, Objekterkennung und andere
native Modelltypen bereit. OpenClaw verfügt derzeit nicht über erstklassige Provider-Verträge
für diese Kategorien, daher registriert dieses Plugin sie noch nicht.

## Verfügbare Modelle

OpenClaw erkennt verfügbare DeepInfra-Modelle beim Start dynamisch. Verwenden Sie
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

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
