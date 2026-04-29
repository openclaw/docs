---
read_when:
    - Je wilt één API-sleutel voor de beste open-source LLM's
    - Je wilt modellen uitvoeren via de API van DeepInfra in OpenClaw
summary: Gebruik de uniforme API van DeepInfra om toegang te krijgen tot de populairste open-sourcemodellen en frontiermodellen in OpenClaw
x-i18n:
    generated_at: "2026-04-29T23:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra biedt een **uniforme API** die verzoeken naar de populairste open source- en frontiermodellen achter één
endpoint en API-sleutel routeert. Deze is OpenAI-compatibel, dus de meeste OpenAI SDK's werken door de basis-URL te wijzigen.

## Een API-sleutel verkrijgen

1. Ga naar [https://deepinfra.com/](https://deepinfra.com/)
2. Meld je aan of maak een account aan
3. Navigeer naar Dashboard / Keys en genereer een nieuwe API-sleutel of gebruik de automatisch aangemaakte sleutel

## CLI-installatie

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Ondersteunde OpenClaw-oppervlakken

De meegeleverde plugin registreert alle DeepInfra-oppervlakken die overeenkomen met de huidige
OpenClaw-providercontracten:

| Oppervlak                | Standaardmodel                    | OpenClaw-configuratie/tool                              |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Chat-/modelprovider      | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Afbeeldingen genereren/bewerken | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Media begrijpen          | `moonshotai/Kimi-K2.5` voor afbeeldingen | begrip van inkomende afbeeldingen                       |
| Spraak-naar-tekst        | `openai/whisper-large-v3-turbo`    | transcriptie van inkomende audio                         |
| Tekst-naar-spraak        | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Video genereren          | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Geheugenembeddings       | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra biedt ook reranking, classificatie, objectdetectie en andere
native modeltypen. OpenClaw heeft momenteel geen eersteklas providercontracten
voor die categorieën, dus deze plugin registreert ze nog niet.

## Beschikbare modellen

OpenClaw ontdekt beschikbare DeepInfra-modellen dynamisch bij het opstarten. Gebruik
`/models deepinfra` om de volledige lijst met beschikbare modellen te zien.

Elk model dat beschikbaar is op [DeepInfra.com](https://deepinfra.com/) kan worden gebruikt met het voorvoegsel `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Opmerkingen

- Modelverwijzingen zijn `deepinfra/<provider>/<model>` (bijv. `deepinfra/Qwen/Qwen3-Max`).
- Standaardmodel: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Basis-URL: `https://api.deepinfra.com/v1/openai`
- Native videogeneratie gebruikt `https://api.deepinfra.com/v1/inference/<model>`.
