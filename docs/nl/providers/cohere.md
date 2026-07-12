---
read_when:
    - Je wilt Cohere met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de Cohere-API-sleutel of de CLI-authenticatiekeuze nodig
summary: Cohere-configuratie (authenticatie + modelselectie)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T09:17:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) biedt OpenAI-compatibele inferentie via de Compatibility API. OpenClaw bundelt de Cohere-provider tijdens de overgang naar externalisering en publiceert deze ook als officiële externe Plugin.

| Eigenschap                   | Waarde                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Provider-id                  | `cohere`                                                     |
| Plugin                       | gebundeld tijdens de overgang; officieel extern pakket       |
| Omgevingsvariabele voor auth | `COHERE_API_KEY`                                             |
| Onboarding-vlag              | `--auth-choice cohere-api-key`                               |
| Directe CLI-vlag             | `--cohere-api-key <key>`                                     |
| API                          | OpenAI-compatibel (`openai-completions`)                     |
| Basis-URL                    | `https://api.cohere.ai/compatibility/v1`                     |
| Standaardmodel               | `cohere/command-a-plus-05-2026`                              |
| Contextvenster               | 128.000 tokens                                               |

## Ingebouwde catalogus

| Modelreferentie                       | Invoer          | Context | Maximale uitvoer | Opmerkingen                                             |
| ------------------------------------- | --------------- | ------- | ---------------- | ------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`       | tekst, afbeelding | 128.000 | 64.000           | Standaard; toonaangevend agentisch redeneermodel        |
| `cohere/command-a-03-2025`            | tekst           | 256.000 | 8.000            | Vorig Command A-model                                   |
| `cohere/command-a-reasoning-08-2025`  | tekst           | 256.000 | 32.000           | Agentisch redeneren en gebruik van hulpmiddelen         |
| `cohere/command-a-vision-07-2025`     | tekst, afbeelding | 128.000 | 8.000            | Visuele en documentanalyse; geen gebruik van hulpmiddelen |
| `cohere/north-mini-code-1-0`          | tekst, afbeelding | 256.000 | 64.000           | Agentisch programmeren; redeneren; gratis limieten      |

Cohere-modellen met redeneervermogen ondersteunen twee redeneermodi van de Compatibility API. OpenClaw wijst **uit** toe aan `none` en elk ingeschakeld denkniveau aan `high`. Command A Vision ondersteunt geen gebruik van hulpmiddelen, dus OpenClaw houdt agenthulpmiddelen uitgeschakeld voor dat model.

## Aan de slag

1. Cohere wordt meegeleverd met de huidige OpenClaw-pakketten. Als het ontbreekt, installeer dan het externe pakket en start de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Maak een Cohere-API-sleutel.
3. Voer de onboarding uit:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Controleer of de catalogus beschikbaar is:

```bash
openclaw models list --provider cohere
```

De onboarding stelt Cohere alleen in als primair model wanneer er nog geen primair model is geconfigureerd.

## Configuratie uitsluitend via de omgeving

Maak `COHERE_API_KEY` beschikbaar voor het Gateway-proces en selecteer vervolgens het Cohere-model:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Als de Gateway als daemon of in Docker wordt uitgevoerd, stel dan `COHERE_API_KEY` in voor die service. Als u deze alleen in een interactieve shell exporteert, wordt de variabele niet beschikbaar voor een Gateway die al actief is.
</Note>

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [CLI voor modellen](/nl/cli/models)
- [Provideroverzicht](/nl/providers/index)
