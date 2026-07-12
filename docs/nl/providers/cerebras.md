---
read_when:
    - Je wilt Cerebras gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de Cerebras-API-sleutel of de CLI-authenticatiekeuze nodig
summary: Cerebras-configuratie (authenticatie + modelselectie)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T09:12:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) biedt snelle, met OpenAI compatibele inferentie op speciaal ontwikkelde inferentiehardware. De plugin wordt geleverd met een statische catalogus van vier modellen (geen live-detectie).

| Eigenschap             | Waarde                                                    |
| ---------------------- | --------------------------------------------------------- |
| Provider-id            | `cerebras`                                                |
| Plugin                 | officieel extern pakket (`@openclaw/cerebras-provider`)   |
| Omgevingsvariabele voor authenticatie | `CEREBRAS_API_KEY`                          |
| Onboarding-vlag        | `--auth-choice cerebras-api-key`                          |
| Directe CLI-vlag       | `--cerebras-api-key <key>`                                |
| API                    | OpenAI-compatibel (`openai-completions`)                  |
| Basis-URL              | `https://api.cerebras.ai/v1`                              |
| Standaardmodel         | `cerebras/zai-glm-4.7`                                    |

## Plugin installeren

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Een API-sleutel verkrijgen">
    Maak een API-sleutel aan in de [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Onboarding uitvoeren">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Directe vlag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Alleen omgevingsvariabele
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Controleren of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider cerebras
    ```

    Toont alle vier statische modellen. Als `CEREBRAS_API_KEY` niet kan worden gevonden, meldt `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve configuratie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Ingebouwde catalogus

Alle vier modellen hebben een contextvenster van 128k en maximaal 8.192 uitvoertokens.

| Modelreferentie                            | Naam                 | Redeneren | Opmerkingen                                      |
| ------------------------------------------ | -------------------- | --------- | ------------------------------------------------ |
| `cerebras/zai-glm-4.7`                     | Z.ai GLM 4.7         | ja        | Standaardmodel; previewmodel voor redeneren      |
| `cerebras/gpt-oss-120b`                    | GPT OSS 120B         | ja        | Productiemodel voor redeneren                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507`  | Qwen 3 235B Instruct | nee       | Previewmodel zonder redeneervermogen             |
| `cerebras/llama3.1-8b`                     | Llama 3.1 8B         | nee       | Op snelheid gericht productiemodel               |

<Warning>
Cerebras markeert `zai-glm-4.7` en `qwen-3-235b-a22b-instruct-2507` als previewmodellen. Volgens de documentatie worden daarnaast `llama3.1-8b` en `qwen-3-235b-a22b-instruct-2507` op 27 mei 2026 uitgefaseerd. Raadpleeg de [pagina met ondersteunde modellen](https://inference-docs.cerebras.ai/models/overview) van Cerebras voordat u deze voor productieworkloads gebruikt.
</Warning>

## Handmatige configuratie

Voor de meeste configuraties is alleen de API-sleutel nodig. Gebruik een expliciete configuratie voor `models.providers.cerebras` om modelmetagegevens te overschrijven of met `mode: "merge"` in combinatie met de statische catalogus te werken:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Als de Gateway als daemon wordt uitgevoerd (launchd, systemd, Docker), zorgt u ervoor dat `CEREBRAS_API_KEY` beschikbaar is voor dat proces, bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`. Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een beheerde service niet, tenzij de omgevingsvariabele afzonderlijk wordt geïmporteerd.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    Niveaus voor de redeneerinspanning van de twee Cerebras-modellen met redeneervermogen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Standaardinstellingen voor agents en modelconfiguratie.
  </Card>
  <Card title="Veelgestelde vragen over modellen" href="/nl/help/faq-models" icon="circle-question">
    Authenticatieprofielen, wisselen tussen modellen en fouten over ontbrekende profielen oplossen.
  </Card>
</CardGroup>
