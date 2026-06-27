---
read_when:
    - Je wilt Cerebras gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de Cerebras API-sleutel of de CLI-authenticatiekeuze nodig
summary: Cerebras-instelling (authenticatie + modelselectie)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) biedt snelle OpenAI-compatibele inferentie op aangepaste inferentiehardware. De Cerebras-provider-Plugin bevat een statische catalogus met vier modellen.

| Eigenschap      | Waarde                                   |
| --------------- | ---------------------------------------- |
| Provider-id     | `cerebras`                               |
| Plugin          | officieel extern pakket                  |
| Auth-env-var    | `CEREBRAS_API_KEY`                       |
| Onboarding-vlag | `--auth-choice cerebras-api-key`         |
| Directe CLI-vlag | `--cerebras-api-key <key>`              |
| API             | OpenAI-compatibel (`openai-completions`) |
| Basis-URL       | `https://api.cerebras.ai/v1`             |
| Standaardmodel  | `cerebras/zai-glm-4.7`                   |

## Plugin installeren

Installeer de officiële Plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Een API-sleutel ophalen">
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

```bash Alleen env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Controleren of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider cerebras
    ```

    De lijst moet alle vier statische modellen bevatten. Als `CEREBRAS_API_KEY` niet kan worden opgelost, rapporteert `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve setup

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Ingebouwde catalogus

OpenClaw levert een statische Cerebras-catalogus die het openbare OpenAI-compatibele eindpunt weerspiegelt. Alle vier modellen delen een context van 128k en 8.192 maximale uitvoertokens.

| Model-ref                                 | Naam                 | Reasoning | Notities                               |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ja        | Standaardmodel; preview-reasoningmodel |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ja        | Productie-reasoningmodel               |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nee       | Previewmodel zonder reasoning          |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nee       | Productiemodel gericht op snelheid     |

<Warning>
  Cerebras markeert `zai-glm-4.7` en `qwen-3-235b-a22b-instruct-2507` als previewmodellen, en `llama3.1-8b` plus `qwen-3-235b-a22b-instruct-2507` zijn gedocumenteerd voor uitfasering op 27 mei 2026. Controleer de pagina met ondersteunde modellen van Cerebras voordat u erop vertrouwt voor productieworkloads.
</Warning>

## Handmatige configuratie

De Plugin betekent meestal dat u alleen de API-sleutel nodig hebt. Gebruik expliciete `models.providers.cerebras`-configuratie wanneer u modelmetadata wilt overschrijven of in `mode: "merge"` tegen de statische catalogus wilt draaien:

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
  Als de Gateway als daemon draait (launchd, systemd, Docker), zorg er dan voor dat `CEREBRAS_API_KEY` beschikbaar is voor dat proces — bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`. Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een beheerde service niet tenzij de env afzonderlijk wordt geïmporteerd.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    Reasoning-inspanningsniveaus voor de twee Cerebras-modellen die reasoning ondersteunen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
  <Card title="Veelgestelde vragen over modellen" href="/nl/help/faq-models" icon="circle-question">
    Auth-profielen, wisselen van model en fouten met "no profile" oplossen.
  </Card>
</CardGroup>
