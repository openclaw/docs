---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für die führenden Open-Source-LLMs.
    - Sie möchten Modelle über die API von DeepInfra in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von DeepInfra, um in OpenClaw auf die beliebtesten Open-Source- und Frontier-Modelle zuzugreifen.
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T02:04:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra leitet Anfragen an beliebte Open-Source- und Frontier-Modelle über einen
einzigen OpenAI-kompatiblen Endpunkt und API-Schlüssel weiter. Die meisten OpenAI-SDKs funktionieren
damit, wenn Sie die Basis-URL ändern.

## Plugin installieren

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API-Schlüssel abrufen

1. Melden Sie sich unter [deepinfra.com](https://deepinfra.com/) an.
2. Gehen Sie zu Dashboard / Keys und generieren Sie einen Schlüssel oder verwenden Sie den automatisch erstellten Schlüssel.

## CLI-Einrichtung

```bash
openclaw onboard --deepinfra-api-key <key>
```

Alternativ können Sie die Umgebungsvariable festlegen:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Konfigurationsbeispiel

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

## Unterstützte Bereiche

Chat, Bildgenerierung und Videogenerierung aktualisieren ihre Modellkataloge
direkt über `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`,
sobald `DEEPINFRA_API_KEY` konfiguriert ist. Andere Bereiche verwenden die unten aufgeführten
statischen Standardwerte, bis sie denselben Live-Katalog verwenden.

| Bereich                    | Standardmodell                                                                                                    | OpenClaw-Konfiguration/-Tool                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / Modell-Provider     | erster mit `chat` gekennzeichneter Eintrag aus dem Live-Katalog (statischer Fallback: `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Bildgenerierung/-bearbeitung | erster mit `image-gen` gekennzeichneter Eintrag aus dem Live-Katalog (statischer Fallback: `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medienverständnis          | `moonshotai/Kimi-K2.5` für Bilder                                                                                | Verständnis eingehender Bilder                           |
| Sprache-zu-Text            | `openai/whisper-large-v3-turbo`                                                                                  | Transkription eingehender Audiodaten                      |
| Text-zu-Sprache            | `hexgrad/Kokoro-82M`                                                                                             | `messages.tts.provider: "deepinfra"`                     |
| Videogenerierung           | statischer Fallback: `Pixverse/Pixverse-T2V` (DeepInfra liefert derzeit keine Live-Einträge mit `video-gen`)      | `video_generate`, `agents.defaults.videoGenerationModel` |
| Speicher-Embeddings        | `BAAI/bge-m3`                                                                                                    | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra stellt außerdem Re-Ranking, Klassifizierung, Objekterkennung und weitere
native Modelltypen bereit. OpenClaw verfügt für diese Kategorien noch über keinen
Provider-Vertrag, daher registriert dieses Plugin sie nicht.

## Verfügbare Modelle

OpenClaw erkennt DeepInfra-Modelle dynamisch, sobald ein Schlüssel konfiguriert ist. Verwenden Sie
`/models deepinfra` oder `openclaw models list --provider deepinfra`, um die
aktuelle Liste anzuzeigen.

Jedes Modell auf [deepinfra.com](https://deepinfra.com/) funktioniert mit dem
Präfix `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...und viele weitere
```

## Hinweise

- Modellreferenzen haben das Format `deepinfra/<provider>/<model>` (zum Beispiel `deepinfra/Qwen/Qwen3-Max`).
- Standard-Chatmodell: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Die native Videogenerierung verwendet `https://api.deepinfra.com/v1/inference/<model>`.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
