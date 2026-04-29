---
read_when:
    - Je wilt Cerebras gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de Cerebras API-sleutel of de CLI-authenticatiekeuze nodig
summary: Cerebras-configuratie (authenticatie + modelselectie)
title: Cerebras
x-i18n:
    generated_at: "2026-04-29T23:08:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) biedt snelle OpenAI-compatibele inferentie.

| Eigenschap | Waarde                       |
| ---------- | ---------------------------- |
| Provider   | `cerebras`                   |
| Auth       | `CEREBRAS_API_KEY`           |
| API        | OpenAI-compatibel            |
| Basis-URL  | `https://api.cerebras.ai/v1` |

## Aan de slag

<Steps>
  <Step title="Verkrijg een API-sleutel">
    Maak een API-sleutel aan in de [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Controleer of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Niet-interactieve configuratie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Ingebouwde catalogus

OpenClaw wordt geleverd met een statische Cerebras-catalogus voor het openbare OpenAI-compatibele endpoint:

| Modelreferentie                          | Naam                 | Opmerkingen                            |
| ---------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Standaardmodel; preview-redeneermodel  |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Productieredeneermodel                 |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Previewmodel zonder redenering         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Productiemodel gericht op snelheid     |

<Warning>
Cerebras markeert `zai-glm-4.7` en `qwen-3-235b-a22b-instruct-2507` als previewmodellen, en `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` zijn gedocumenteerd voor deprecatie op 27 mei 2026. Controleer de pagina met ondersteunde modellen van Cerebras voordat je erop vertrouwt voor productie.
</Warning>

## Handmatige configuratie

De meegeleverde Plugin betekent meestal dat je alleen de API-sleutel nodig hebt. Gebruik expliciete
`models.providers.cerebras`-configuratie wanneer je modelmetadata wilt overschrijven:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
Als de Gateway als daemon wordt uitgevoerd (launchd/systemd), zorg er dan voor dat `CEREBRAS_API_KEY`
beschikbaar is voor dat proces, bijvoorbeeld in `~/.openclaw/.env` of via
`env.shellEnv`.
</Note>
