---
read_when:
    - U wilt OpenClaw uitvoeren met GMI Cloud-modellen
    - U hebt de provider-id, sleutel of het eindpunt van GMI nodig
summary: Gebruik de OpenAI-compatibele API van GMI Cloud met OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T09:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud is een gehost inferentieplatform voor geavanceerde modellen en modellen met openbaar beschikbare gewichten
achter een OpenAI-compatibele API. In OpenClaw is het een officiële externe provider-
Plugin: installeer deze eenmaal, sla inloggegevens op via de normale modelauthenticatie en gebruik
modelverwijzingen zoals `gmi/google/gemini-3.1-flash-lite`.

Gebruik GMI wanneer u één API-sleutel wilt voor meerdere gehoste modelfamilies, waaronder
routes van Anthropic, DeepSeek, Google, Moonshot, OpenAI en Z.AI die via de
catalogus van GMI beschikbaar zijn. Het werkt als secundaire provider voor modelterugval, om
gehoste routes van verschillende leveranciers te vergelijken, of wanneer GMI een model beschikbaar heeft voordat uw
primaire provider dat heeft. OpenClaw beheert de provider-id, het authenticatieprofiel, de aliassen,
de initiële modelcatalogus en de basis-URL; GMI beheert de actuele modelbeschikbaarheid, facturering,
snelheidslimieten en eventueel routeringsbeleid aan de providerzijde.

| Eigenschap          | Waarde                                   |
| ------------------- | ---------------------------------------- |
| Provider-id         | `gmi` (aliassen: `gmi-cloud`, `gmicloud`) |
| Pakket               | `@openclaw/gmi-provider`                 |
| Omgevingsvariabele voor authenticatie | `GMI_API_KEY`             |
| API                  | OpenAI-compatibel (`openai-completions`) |
| Basis-URL            | `https://api.gmi-serving.com/v1`         |
| Standaardmodel       | `gmi/google/gemini-3.1-flash-lite`       |

## Configuratie

Installeer de Plugin, start de Gateway opnieuw en maak vervolgens een API-sleutel aan in GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Voer daarna het volgende uit:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Bij niet-interactieve configuraties kunt u `--gmi-api-key <key>` meegeven of het volgende instellen:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Wanneer GMI kiezen

- U wilt een gehost OpenAI-compatibel eindpunt in plaats van een lokale modelserver.
- U wilt meerdere commerciële modelfamilies en modelfamilies met openbaar beschikbare gewichten uitproberen via één
  provideraccount.
- U wilt een terugvalprovider met andere upstreamroutering dan DeepInfra,
  OpenRouter, Together of de directe API's van leveranciers.
- U hebt GMI-specifieke model-id's, prijzen of accountinstellingen nodig.

Kies in plaats daarvan de directe provider van de leverancier wanneer u leveranciersspecifieke functies nodig hebt
die GMI niet via zijn OpenAI-compatibele route beschikbaar stelt. Kies een lokale
provider zoals LM Studio, Ollama, SGLang of vLLM wanneer gegevenslokaliteit of lokale
GPU-controle belangrijker is dan het gemak van hosting.

## Modellen

De catalogus van de Plugin bevat als uitgangspunt veelgebruikte route-id's van GMI Cloud:

| Modelverwijzing                     | Invoer           | Context   | Maximale uitvoer |
| ----------------------------------- | ---------------- | --------- | ---------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | tekst + afbeelding | 200,000   | 64,000           |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | tekst             | 163,840   | 65,536           |
| `gmi/google/gemini-3.1-flash-lite` | tekst + afbeelding | 1,048,576 | 65,536           |
| `gmi/moonshotai/Kimi-K2.5`         | tekst + afbeelding | 262,144   | 65,536           |
| `gmi/openai/gpt-5.4`               | tekst + afbeelding | 400,000   | 128,000          |
| `gmi/zai-org/GLM-5.1-FP8`          | tekst             | 202,752   | 65,536           |

De catalogus is een uitgangspunt en geen garantie dat elk account elk model op
elk moment kan aanroepen. Geef weer wat de geconfigureerde provider in uw omgeving rapporteert:

```bash
openclaw models list --provider gmi
```

## Probleemoplossing

- `401` of `403`: controleer of `GMI_API_KEY` is ingesteld voor het proces dat
  OpenClaw uitvoert, of voer de onboarding opnieuw uit om de sleutel in het authenticatieprofiel van de provider op te slaan.
- Fouten voor onbekende modellen: controleer of het model in uw GMI-account bestaat en gebruik de
  volledige `gmi/<route-id>`-verwijzing die wordt weergegeven door `openclaw models list --provider gmi`.
- Incidentele providerfouten: probeer een andere GMI-route of configureer GMI als
  terugvaloptie in plaats van als enige primaire modelprovider.

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
