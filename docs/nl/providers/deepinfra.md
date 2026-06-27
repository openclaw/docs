---
read_when:
    - Je wilt één API-sleutel voor de toonaangevende open source-LLM's
    - Je wilt modellen uitvoeren via de API van DeepInfra in OpenClaw
summary: Gebruik de uniforme API van DeepInfra om toegang te krijgen tot de populairste open source- en frontier-modellen in OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra biedt een **uniforme API** die aanvragen naar de populairste open source- en frontiermodellen achter één
endpoint en API-sleutel routeert. Deze is OpenAI-compatibel, waardoor de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

## Plugin installeren

Installeer de officiële plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Een API-sleutel verkrijgen

1. Ga naar [https://deepinfra.com/](https://deepinfra.com/)
2. Meld je aan of maak een account aan
3. Ga naar Dashboard / Keys en genereer een nieuwe API-sleutel of gebruik de automatisch aangemaakte sleutel

## CLI-configuratie

```bash
openclaw onboard --deepinfra-api-key <key>
```

Of stel de omgevingsvariabele in:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Configuratiefragment

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

## Ondersteunde OpenClaw-oppervlakken

De plugin registreert alle DeepInfra-oppervlakken die overeenkomen met de huidige
OpenClaw-providercontracten. Chat, afbeeldingsgeneratie en videogeneratie
verversen hun modelcatalogi live vanuit `/v1/openai/models?sort_by=openclaw&filter=with_meta`
wanneer `DEEPINFRA_API_KEY` is geconfigureerd; de andere oppervlakken gebruiken de beheerde
statische standaarden hieronder.

| Oppervlak                | Standaardmodel                                                                                       | OpenClaw-configuratie/-tool                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / modelprovider     | eerste chat-gelabelde vermelding uit de livecatalogus (manifest-fallback `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Afbeeldingsgeneratie/-bewerking | eerste met `image-gen` gelabelde vermelding uit de livecatalogus (statische fallback `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Mediabegrip              | `moonshotai/Kimi-K2.5` voor afbeeldingen                                                             | begrip van inkomende afbeeldingen                        |
| Spraak-naar-tekst        | `openai/whisper-large-v3-turbo`                                                                       | transcriptie van inkomende audio                         |
| Tekst-naar-spraak        | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Videogeneratie           | eerste met `video-gen` gelabelde vermelding uit de livecatalogus (statische fallback `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Memory-embeddings        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra biedt ook reranking, classificatie, objectdetectie en andere
native modeltypen. OpenClaw heeft momenteel geen eersteklas providercontracten
voor die categorieën, dus deze plugin registreert ze nog niet.

## Beschikbare modellen

OpenClaw ontdekt beschikbare DeepInfra-modellen dynamisch bij het opstarten. Gebruik
`/models deepinfra` om de volledige lijst met beschikbare modellen te bekijken.

Elk model dat beschikbaar is op [DeepInfra.com](https://deepinfra.com/) kan worden gebruikt met het voorvoegsel `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...en nog veel meer
```

## Opmerkingen

- Modelverwijzingen zijn `deepinfra/<provider>/<model>` (bijv. `deepinfra/Qwen/Qwen3-Max`).
- Standaardmodel: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Native videogeneratie gebruikt `https://api.deepinfra.com/v1/inference/<model>`.

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
