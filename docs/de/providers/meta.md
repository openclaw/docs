---
read_when:
    - Sie möchten Meta mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable MODEL_API_KEY oder die CLI-Authentifizierungsauswahl
summary: Meta-Einrichtung (Authentifizierung + Auswahl des Modells muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-24T04:07:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

Die **Meta API** verwendet die OpenAI-kompatible **Responses API** (`POST /v1/responses`)
für das Reasoning-Modell `muse-spark-1.1`. Der Provider wird als gebündeltes
OpenClaw-Plugin ausgeliefert.

| Eigenschaft          | Wert                               |
| -------------------- | ---------------------------------- |
| Provider-ID          | `meta`                 |
| Plugin               | gebündelter Provider               |
| Authentifizierungs-Umgebungsvariable | `MODEL_API_KEY` |
| Onboarding-Flag      | `--auth-choice meta-api-key`                 |
| Direktes CLI-Flag    | `--meta-api-key <key>`                 |
| API                  | Responses API (`openai-responses`) |
| Basis-URL            | `https://api.meta.ai/v1`                 |
| Standardmodell       | `meta/muse-spark-1.1`                 |
| Standard-Reasoning   | `high` (`reasoning.effort`) |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direktes Flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Nur Umgebungsvariable
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Verfügbarkeit der Modelle überprüfen">
    ```bash
    openclaw models list --provider meta
    ```

    Listet den statischen Katalogeintrag `muse-spark-1.1` auf. Wenn `MODEL_API_KEY` nicht aufgelöst ist,
    meldet `openclaw models status --json` die fehlenden Anmeldedaten unter
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Integrierter Katalog

| Modellreferenz        | Name           | Reasoning | Kontextfenster | Max. Ausgabe |
| --------------------- | -------------- | --------- | -------------- | ------------ |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | ja        | 1,048,576      | 131,072      |

Funktionen:

- Text- und Bildeingabe
- Tool-Aufrufe und Streaming
- Reasoning-Aufwand: `minimal`, `low`, `medium`, `high`, `xhigh` (Standard: `high`)
- Zustandslose, verschlüsselte Reasoning-Wiedergabe (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` akzeptiert `reasoning.effort: "none"` nicht. OpenClaw ordnet
`--thinking off` für diesen Provider `minimal` zu.
</Warning>

## Manuelle Konfiguration

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
Wenn das Gateway als Daemon (launchd, systemd, Docker) ausgeführt wird, stellen Sie sicher,
dass `MODEL_API_KEY` für diesen Prozess verfügbar ist – beispielsweise in
`~/.openclaw/.env` oder über `env.shellEnv`. Ein Schlüssel, der nur in einer
interaktiven Shell exportiert wurde, hilft einem verwalteten Dienst nicht, sofern die
Umgebungsvariable nicht separat importiert wird.
</Note>

## Smoke-Test

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Live-Tests verwenden `muse-spark-1.1` für `POST /v1/responses`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Stufen des Reasoning-Aufwands für muse-spark-1.1.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
</CardGroup>
