---
read_when:
    - Je wilt één API-sleutel voor de beste opensource-LLM's
    - Je wilt modellen uitvoeren via de API van DeepInfra in OpenClaw
summary: Gebruik de uniforme API van DeepInfra om toegang te krijgen tot de populairste opensource- en grensverleggende modellen in OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T09:18:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra routeert aanvragen naar populaire opensource- en frontiermodellen achter één
OpenAI-compatibel eindpunt en één API-sleutel. De meeste OpenAI-SDK's werken
ermee door de basis-URL te wijzigen.

## Plugin installeren

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Een API-sleutel verkrijgen

1. Meld u aan bij [deepinfra.com](https://deepinfra.com/)
2. Ga naar Dashboard / Keys en genereer een sleutel, of gebruik de automatisch aangemaakte sleutel

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

## Ondersteunde oppervlakken

Chat, afbeeldingsgeneratie en videogeneratie vernieuwen hun modelcatalogi
live via `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
zodra `DEEPINFRA_API_KEY` is geconfigureerd. Andere oppervlakken gebruiken de statische
standaardwaarden hieronder totdat ze naar dezelfde livecatalogus zijn overgezet.

| Oppervlak                  | Standaardmodel                                                                                               | OpenClaw-configuratie/-tool                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Chat/modelprovider         | eerste als chat gemarkeerde vermelding uit de livecatalogus (statische terugvaloptie `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Afbeeldingen genereren/bewerken | eerste met `image-gen` gemarkeerde vermelding uit de livecatalogus (statische terugvaloptie `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Mediabegrip                | `moonshotai/Kimi-K2.5` voor afbeeldingen                                                                     | begrip van inkomende afbeeldingen                        |
| Spraak-naar-tekst          | `openai/whisper-large-v3-turbo`                                                                               | transcriptie van inkomende audio                         |
| Tekst-naar-spraak          | `hexgrad/Kokoro-82M`                                                                                          | `messages.tts.provider: "deepinfra"`                     |
| Videogeneratie             | statische terugvaloptie `Pixverse/Pixverse-T2V` (DeepInfra heeft momenteel geen live `video-gen`-vermeldingen) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Geheugenembeddings         | `BAAI/bge-m3`                                                                                                 | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra biedt ook herrangschikking, classificatie, objectdetectie en andere
eigen modeltypen. OpenClaw heeft nog geen providercontract voor die categorieën,
dus deze Plugin registreert ze niet.

## Beschikbare modellen

OpenClaw detecteert DeepInfra-modellen dynamisch zodra een sleutel is geconfigureerd. Gebruik
`/models deepinfra` of `openclaw models list --provider deepinfra` om de
huidige lijst te bekijken.

Elk model op [deepinfra.com](https://deepinfra.com/) werkt met het
voorvoegsel `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...en nog veel meer
```

## Opmerkingen

- Modelverwijzingen hebben de vorm `deepinfra/<provider>/<model>` (bijvoorbeeld `deepinfra/Qwen/Qwen3-Max`).
- Standaardchatmodel: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Eigen videogeneratie gebruikt `https://api.deepinfra.com/v1/inference/<model>`.

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
