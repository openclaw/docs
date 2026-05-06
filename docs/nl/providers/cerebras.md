---
read_when:
    - Je wilt Cerebras gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de Cerebras API-sleutel of de CLI-authenticatiekeuze nodig
summary: Cerebras-configuratie (authenticatie + modelselectie)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:28:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) biedt snelle OpenAI-compatibele inference op aangepaste inferencehardware. OpenClaw bevat een gebundelde Cerebras-provider-Plugin met een statische catalogus van vier modellen.

| Eigenschap      | Waarde                                   |
| --------------- | ---------------------------------------- |
| Provider-id     | `cerebras`                               |
| Plugin          | gebundeld, `enabledByDefault: true`      |
| Auth-env-var    | `CEREBRAS_API_KEY`                       |
| Onboarding-vlag | `--auth-choice cerebras-api-key`         |
| Directe CLI-vlag | `--cerebras-api-key <key>`              |
| API             | OpenAI-compatibel (`openai-completions`) |
| Basis-URL       | `https://api.cerebras.ai/v1`             |
| Standaardmodel  | `cerebras/zai-glm-4.7`                   |

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

    De lijst moet alle vier gebundelde modellen bevatten. Als `CEREBRAS_API_KEY` niet kan worden opgelost, meldt `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve installatie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Ingebouwde catalogus

OpenClaw levert een statische Cerebras-catalogus mee die het openbare OpenAI-compatibele endpoint weerspiegelt. Alle vier modellen delen een context van 128k en 8.192 maximale outputtokens.

| Modelref                                  | Naam                 | Redeneren | Opmerkingen                            |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ja        | Standaardmodel; preview-redeneermodel |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ja        | Productie-redeneermodel                |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nee       | Previewmodel zonder redeneren          |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nee       | Productiemodel gericht op snelheid     |

<Warning>
  Cerebras markeert `zai-glm-4.7` en `qwen-3-235b-a22b-instruct-2507` als previewmodellen, en `llama3.1-8b` plus `qwen-3-235b-a22b-instruct-2507` zijn gedocumenteerd voor deprecatie op 27 mei 2026. Controleer de pagina met ondersteunde modellen van Cerebras voordat je erop vertrouwt voor productieworkloads.
</Warning>

## Handmatige configuratie

Door de gebundelde Plugin heb je meestal alleen de API-sleutel nodig. Gebruik expliciete `models.providers.cerebras`-configuratie wanneer je modelmetadata wilt overschrijven of in `mode: "merge"` tegen de statische catalogus wilt draaien:

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
  Als de Gateway als daemon draait (launchd, systemd, Docker), zorg er dan voor dat `CEREBRAS_API_KEY` beschikbaar is voor dat proces, bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`. Een sleutel die alleen in `~/.profile` staat, helpt een beheerde service niet tenzij de env afzonderlijk wordt geimporteerd.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    Redeneerinspanningsniveaus voor de twee redeneercapabele Cerebras-modellen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
  <Card title="Modellen-FAQ" href="/nl/help/faq-models" icon="circle-question">
    Auth-profielen, modellen wisselen en fouten met "no profile" oplossen.
  </Card>
</CardGroup>
