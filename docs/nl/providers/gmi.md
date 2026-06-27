---
read_when:
    - U wilt OpenClaw uitvoeren met GMI Cloud-modellen
    - Je hebt de GMI-provider-id, sleutel of endpoint nodig
summary: Gebruik de OpenAI-compatibele API van GMI Cloud met OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:12:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud is een gehost inferentieplatform voor frontier- en open-weight-modellen
achter een OpenAI-compatibele API. In OpenClaw is het een officiële externe provider-
plugin, wat betekent dat je die één keer installeert, selecteert met de provider-id `gmi`,
referenties opslaat via normale modelauthenticatie, en modelreferenties gebruikt zoals
`gmi/google/gemini-3.1-flash-lite`.

Gebruik GMI wanneer je één API-sleutel wilt voor meerdere gehoste modelfamilies, waaronder
Google-, Anthropic-, OpenAI-, DeepSeek-, Moonshot- en Z.AI-routes die door GMI's
catalogus worden aangeboden. Het is nuttig als secundaire provider voor modelfallback, om
gehoste routes tussen leveranciers te vergelijken, of wanneer GMI een model beschikbaar heeft voordat je
primaire provider dat heeft.

Deze provider gebruikt OpenAI-compatibele chatsemantiek. OpenClaw beheert de provider-
id, het authenticatieprofiel, aliassen, de seed van de modelcatalogus en de basis-URL; GMI beheert de live
modelbeschikbaarheid, facturering, snelheidslimieten en elk provider-side routeringsbeleid.

## Installatie

Installeer de plugin, herstart de Gateway en maak daarna een API-sleutel aan in GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Voer daarna uit:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Of stel in:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Standaardwaarden

- Provider: `gmi`
- Aliassen: `gmi-cloud`, `gmicloud`
- Basis-URL: `https://api.gmi-serving.com/v1`
- Omgevingsvariabele: `GMI_API_KEY`
- Standaardmodel: `gmi/google/gemini-3.1-flash-lite`

## Wanneer je GMI kiest

- Je wilt een gehost OpenAI-compatibel endpoint in plaats van een lokale modelserver.
- Je wilt meerdere commerciële en open-weight-modelfamilies proberen via één
  provideraccount.
- Je wilt een fallbackprovider met andere upstreamroutering dan OpenRouter,
  DeepInfra, Together of de directe API's van leveranciers.
- Je hebt GMI-specifieke model-id's, prijzen of accountcontroles nodig.

Kies in plaats daarvan de directe leverancierprovider wanneer je leverancier-native functies nodig hebt
die GMI niet via zijn OpenAI-compatibele route aanbiedt. Kies een lokale
provider zoals Ollama, LM Studio, vLLM of SGLang wanneer datalokaliteit of lokale
GPU-controle belangrijker is dan gehost gemak.

## Modellen

De plugincatalogus seedt veelvoorkomende beschikbare GMI Cloud-route-id's, waaronder:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

De catalogus is een seed, geen belofte dat elk account elk model op
elk moment kan aanroepen. Gebruik OpenClaw's opdracht voor modellisting om te zien wat de geconfigureerde
provider in jouw omgeving rapporteert:

```bash
openclaw models list --provider gmi
```

## Probleemoplossing

- `401` of `403`: controleer of `GMI_API_KEY` is ingesteld voor het proces dat
  OpenClaw uitvoert, of voer onboarding opnieuw uit om de sleutel op te slaan in het authenticatieprofiel van de provider.
- Onbekende modelfouten: bevestig dat het model bestaat in je GMI-account en gebruik de
  volledige `gmi/<route-id>`-referentie die wordt getoond door `openclaw models list --provider gmi`.
- Incidentele providerfouten: probeer een andere GMI-route of configureer GMI als een
  fallback in plaats van de enige primaire modelprovider.

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
