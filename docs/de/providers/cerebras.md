---
read_when:
    - Sie möchten Cerebras mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cerebras-API-Schlüssel oder die CLI-Authentifizierungsauswahl
summary: Cerebras-Einrichtung (Authentifizierung + Modellauswahl)
title: Cerebras
x-i18n:
    generated_at: "2026-07-24T04:06:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 716eef83155ef80d9aa61bd55ed83e3e38ad22720ae055bce7eb9c2cbfb6cf41
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) bietet Hochgeschwindigkeits-Inferenz, die mit OpenAI kompatibel ist, auf spezieller Inferenz-Hardware. Das Plugin enthält einen statischen Katalog mit zwei Modellen (keine Live-Erkennung).

| Eigenschaft     | Wert                                                      |
| --------------- | --------------------------------------------------------- |
| Provider-ID     | `cerebras`                                        |
| Plugin          | offizielles externes Paket (`@openclaw/cerebras-provider`)           |
| Auth-Umgebungsvariable | `CEREBRAS_API_KEY`                                 |
| Onboarding-Flag | `--auth-choice cerebras-api-key`                                        |
| Direktes CLI-Flag | `--cerebras-api-key <key>`                                      |
| API             | OpenAI-kompatibel (`openai-completions`)                    |
| Basis-URL       | `https://api.cerebras.ai/v1`                                        |
| Standardmodell  | `cerebras/zai-glm-4.7`                                        |

## Plugin installieren

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Onboarding ausführen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direktes Flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Nur Umgebung
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verfügbarkeit der Modelle überprüfen">
    ```bash
    openclaw models list --provider cerebras
    ```

    Listet beide statischen Modelle auf. Wenn `CEREBRAS_API_KEY` nicht aufgelöst ist, meldet `openclaw models status --json` die fehlenden Anmeldedaten unter `auth.unusableProfiles`.

  </Step>
</Steps>

## Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Integrierter Katalog

Beide Modelle verfügen über ein Kontextfenster von 128k und maximal 8,192 Ausgabetokens.

| Modellreferenz          | Name         | Reasoning | Hinweise                               |
| ----------------------- | ------------ | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`  | Z.ai GLM 4.7 | ja        | Standardmodell; Reasoning-Vorschaumodell |
| `cerebras/gpt-oss-120b` | GPT OSS 120B | ja        | Reasoning-Produktionsmodell            |

## Manuelle Konfiguration

Für die meisten Einrichtungen ist nur der API-Schlüssel erforderlich. Verwenden Sie eine explizite `models.providers.cerebras`-Konfiguration, um Modellmetadaten zu überschreiben oder `mode: "merge"` mit dem statischen Katalog auszuführen:

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
Wenn das Gateway als Daemon ausgeführt wird (launchd, systemd, Docker), stellen Sie sicher, dass `CEREBRAS_API_KEY` für diesen Prozess verfügbar ist – beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`. Ein ausschließlich in einer interaktiven Shell exportierter Schlüssel hilft einem verwalteten Dienst nicht, sofern die Umgebung nicht separat importiert wird.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Stufen des Reasoning-Aufwands für die beiden Reasoning-fähigen Cerebras-Modelle.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
  <Card title="Häufig gestellte Fragen zu Modellen" href="/de/help/faq-models" icon="circle-question">
    Auth-Profile, Wechseln von Modellen und Beheben von „no profile“-Fehlern.
  </Card>
</CardGroup>
