---
read_when:
    - Je wilt Cohere gebruiken met OpenClaw
    - Je hebt de Cohere API-sleutel-env var of CLI-authenticatiekeuze nodig
summary: Cohere-configuratie (authenticatie + modelselectie)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) biedt OpenAI-compatibele inferentie via de compatibiliteits-API. OpenClaw levert de Cohere-provider tijdens de overgang naar externalisatie en publiceert deze ook als officiële externe plugin met de modelcatalogus van Command A.

| Eigenschap      | Waarde                                               |
| --------------- | ---------------------------------------------------- |
| Provider-id     | `cohere`                                             |
| Plugin          | gebundeld tijdens overgang; officieel extern pakket  |
| Auth-env-var    | `COHERE_API_KEY`                                     |
| Onboarding-vlag | `--auth-choice cohere-api-key`                       |
| Directe CLI-vlag | `--cohere-api-key <key>`                            |
| API             | OpenAI-compatibel (`openai-completions`)             |
| Basis-URL       | `https://api.cohere.ai/compatibility/v1`             |
| Standaardmodel  | `cohere/command-a-03-2025`                           |

## Aan de slag

1. Cohere is opgenomen in huidige OpenClaw-pakketten. Als het niet beschikbaar is, installeer dan het externe pakket en herstart de Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Maak een Cohere-API-sleutel.
3. Voer onboarding uit:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Controleer of de catalogus beschikbaar is:

```bash
openclaw models list --provider cohere
```

Het standaardmodel wordt alleen ingesteld wanneer er nog geen primair model is geconfigureerd.

## Setup alleen via omgeving

Maak `COHERE_API_KEY` beschikbaar voor het Gateway-proces en selecteer daarna het Cohere-model:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Als de Gateway als daemon of in Docker draait, configureer dan `COHERE_API_KEY` voor die service. Het alleen exporteren in een interactieve shell maakt deze niet beschikbaar voor een al draaiende Gateway.
</Note>

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Modellen-CLI](/nl/cli/models)
- [Providerdirectory](/nl/providers)
