---
read_when:
    - Je wilt Meta met OpenClaw gebruiken
    - U hebt de omgevingsvariabele MODEL_API_KEY of de CLI-authenticatiekeuze nodig
summary: Meta-configuratie (authenticatie + selectie van het muse-spark-1.1-model)
title: Meta
x-i18n:
    generated_at: "2026-07-12T09:19:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

De **Meta API** gebruikt de OpenAI-compatibele **Responses API** (`POST /v1/responses`)
voor het redeneermodel `muse-spark-1.1`. De provider wordt geleverd als een gebundelde OpenClaw-
plugin.

| Eigenschap            | Waarde                             |
| --------------------- | ---------------------------------- |
| Provider-id           | `meta`                             |
| Plugin                | gebundelde provider                |
| Omgevingsvariabele voor authenticatie | `MODEL_API_KEY`       |
| Onboarding-vlag       | `--auth-choice meta-api-key`       |
| Directe CLI-vlag      | `--meta-api-key <key>`             |
| API                   | Responses API (`openai-responses`) |
| Basis-URL             | `https://api.meta.ai/v1`           |
| Standaardmodel        | `meta/muse-spark-1.1`              |
| Standaardredenering   | `high` (`reasoning.effort`)        |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Directe vlag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Alleen omgevingsvariabele
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Controleer of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider meta
    ```

    Toont de statische catalogusvermelding voor `muse-spark-1.1`. Als `MODEL_API_KEY` niet kan worden gevonden,
    meldt `openclaw models status --json` de ontbrekende referentie onder
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve configuratie

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Ingebouwde catalogus

| Modelreferentie       | Naam           | Redenering | Contextvenster | Maximale uitvoer |
| --------------------- | -------------- | ---------- | --------------- | ---------------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | ja         | 1,048,576       | 131,072          |

Mogelijkheden:

- Tekst- en afbeeldingsinvoer
- Toolaanroepen en streaming
- Redeneerinspanning: `minimal`, `low`, `medium`, `high`, `xhigh` (standaard: `high`)
- Statusloze, versleutelde herhaling van redeneringen (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` accepteert geen `reasoning.effort: "none"`. OpenClaw wijst
`--thinking off` voor deze provider toe aan `minimal`.
</Warning>

## Handmatige configuratie

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Als de Gateway als daemon wordt uitgevoerd (launchd, systemd, Docker), zorg er dan voor dat
`MODEL_API_KEY` beschikbaar is voor dat proces, bijvoorbeeld in
`~/.openclaw/.env` of via `env.shellEnv`. Een sleutel die alleen in een
interactieve shell is geëxporteerd, helpt een beheerde service niet, tenzij de omgevingsvariabele
afzonderlijk wordt geïmporteerd.
</Note>

## Snelle test

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Live-tests gebruiken `muse-spark-1.1` met `POST /v1/responses`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning voor muse-spark-1.1.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Standaardinstellingen voor agents en modelconfiguratie.
  </Card>
</CardGroup>
