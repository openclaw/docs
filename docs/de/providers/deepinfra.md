---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für die führenden Open-Source-LLMs.
    - Sie möchten Modelle über die API von DeepInfra in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von DeepInfra, um in OpenClaw auf die beliebtesten Open-Source- und Frontier-Modelle zuzugreifen
title: DeepInfra
x-i18n:
    generated_at: "2026-07-24T04:37:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a63bdd4ffd2189cde50f0ee601fd7ee32ca86c943a9899072f0c140823608004
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra leitet Anfragen an beliebte Open-Source- und Frontier-Modelle über einen
einzelnen OpenAI-kompatiblen Endpunkt und API-Schlüssel weiter. Die meisten OpenAI-SDKs funktionieren
damit, indem die Basis-URL geändert wird.

## Plugin installieren

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API-Schlüssel abrufen

1. Melden Sie sich bei [deepinfra.com](https://deepinfra.com/) an
2. Gehen Sie zu Dashboard / Keys und generieren Sie einen Schlüssel oder verwenden Sie den automatisch erstellten

## CLI-Einrichtung

```bash
openclaw onboard --deepinfra-api-key <key>
```

Alternativ können Sie die Umgebungsvariable festlegen:

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

## Unterstützte Oberflächen

Chat, Bildgenerierung und Videogenerierung aktualisieren ihre Modellkataloge
live von `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`,
sobald `DEEPINFRA_API_KEY` konfiguriert ist. Die Live-Erkennung erweitert die Liste der
auswählbaren Modelle; das Standardmodell je Oberfläche bleibt der unten angegebene statische Wert.
Andere Oberflächen verwenden statische Kataloge, bis sie auf denselben
Live-Katalog umgestellt werden.

| Oberfläche                    | Standardmodell                                                                         | OpenClaw-Konfiguration/-Tool                           |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chat / Modell-Provider        | `deepseek-ai/DeepSeek-V4-Flash` (der Live-Katalog fügt weitere Chatmodelle hinzu)                    | `agents.defaults.model`                                    |
| Bildgenerierung/-bearbeitung  | `black-forest-labs/FLUX-1-schnell` (der Live-Katalog fügt weitere `image-gen`-Modelle hinzu)     | `image_generate`, `agents.defaults.mediaModels.image`                |
| Medienverständnis             | `moonshotai/Kimi-K2.5` für Bilder                                                          | Verständnis eingehender Bilder                        |
| Sprache-zu-Text               | `openai/whisper-large-v3-turbo`                                                                     | Transkription eingehender Audiodaten                  |
| Text-zu-Sprache               | `hexgrad/Kokoro-82M`                                                                     | `tts.provider: "deepinfra"`                                    |
| Videogenerierung              | `Pixverse/Pixverse-T2V` (der Live-Katalog fügt weitere `video-gen`-Modelle hinzu)     | `video_generate`, `agents.defaults.mediaModels.video`                |
| Speicher-Embeddings           | `BAAI/bge-m3`                                                                     | `memory.search.provider: "deepinfra"`                                    |

DeepInfra stellt außerdem Reranking, Klassifizierung, Objekterkennung und weitere
native Modelltypen bereit. OpenClaw verfügt für diese Kategorien
noch über keinen Provider-Vertrag, daher registriert dieses Plugin sie nicht.

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

- Modellreferenzen sind `deepinfra/<provider>/<model>` (zum Beispiel `deepinfra/Qwen/Qwen3-Max`).
- Standard-Chatmodell: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Die Videogenerierung verwendet den OpenAI-kompatiblen asynchronen Endpunkt `https://api.deepinfra.com/v1/openai/videos` (zuerst übermitteln, dann abfragen). Ein konfiguriertes `baseUrl` wird berücksichtigt. `openclaw doctor --fix` migriert veraltete Werte von `nativeBaseUrl` oder `/v1/inference` unter `api.deepinfra.com` automatisch zu `baseUrl`; benutzerdefinierte native Endpunkte sind außer Betrieb genommen, werden mit einem Doctor-Hinweis gemeldet und benötigen ein manuell konfiguriertes OpenAI-kompatibles `baseUrl`. Die Videogenerierung schlägt mit einer konkreten Fehlermeldung fehl (bevor eine Anfrage gesendet wird), solange `baseUrl` noch auf die außer Betrieb genommene `/v1/inference`-Oberfläche verweist.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
