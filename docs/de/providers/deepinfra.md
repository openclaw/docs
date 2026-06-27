---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für die führenden Open-Source-LLMs
    - Sie möchten Modelle über die API von DeepInfra in OpenClaw ausführen
summary: Nutzen Sie die einheitliche API von DeepInfra, um in OpenClaw auf die beliebtesten Open-Source- und Frontier-Modelle zuzugreifen
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:03:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra stellt eine **einheitliche API** bereit, die Anfragen an die beliebtesten Open-Source- und Frontier-Modelle hinter einem einzigen Endpoint und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Basis-URL.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann Gateway neu:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Unterstützte OpenClaw-Oberflächen

Das Plugin registriert alle DeepInfra-Oberflächen, die den aktuellen
OpenClaw-Provider-Verträgen entsprechen. Chat, Bilderzeugung und Videoerzeugung
aktualisieren ihre Modellkataloge live aus `/v1/openai/models?sort_by=openclaw&filter=with_meta`,
wenn `DEEPINFRA_API_KEY` konfiguriert ist; die anderen Oberflächen verwenden die unten aufgeführten kuratierten
statischen Standardwerte.

| Oberfläche               | Standardmodell                                                                                           | OpenClaw-Konfiguration/-Tool                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / Modell-Provider   | erster mit Chat getaggter Eintrag aus dem Live-Katalog (Manifest-Fallback `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Bilderzeugung/-bearbeitung | erster mit `image-gen` getaggter Eintrag aus dem Live-Katalog (statischer Fallback `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medienverständnis        | `moonshotai/Kimi-K2.5` für Bilder                                                                        | Verständnis eingehender Bilder                           |
| Speech-to-Text           | `openai/whisper-large-v3-turbo`                                                                          | Transkription eingehender Audiodaten                     |
| Text-to-Speech           | `hexgrad/Kokoro-82M`                                                                                     | `messages.tts.provider: "deepinfra"`                     |
| Videoerzeugung           | erster mit `video-gen` getaggter Eintrag aus dem Live-Katalog (statischer Fallback `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Memory Embeddings        | `BAAI/bge-m3`                                                                                            | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra stellt außerdem Reranking, Klassifizierung, Objekterkennung und andere
native Modelltypen bereit. OpenClaw hat derzeit keine erstklassigen Provider-Verträge
für diese Kategorien, daher registriert dieses Plugin sie noch nicht.

## Verfügbare Modelle

OpenClaw erkennt verfügbare DeepInfra-Modelle beim Start dynamisch. Verwenden Sie
`/models deepinfra`, um die vollständige Liste der verfügbaren Modelle anzuzeigen.

Jedes auf [DeepInfra.com](https://deepinfra.com/) verfügbare Modell kann mit dem Präfix `deepinfra/` verwendet werden:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Hinweise

- Modellreferenzen haben das Format `deepinfra/<provider>/<model>` (z. B. `deepinfra/Qwen/Qwen3-Max`).
- Standardmodell: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Native Videoerzeugung verwendet `https://api.deepinfra.com/v1/inference/<model>`.

## Verwandt

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
