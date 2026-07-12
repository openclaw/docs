---
read_when:
    - Sie möchten Cerebras mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cerebras-API-Schlüssel oder die Authentifizierungsauswahl der CLI.
summary: Cerebras-Einrichtung (Authentifizierung + Modellauswahl)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T15:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) bietet Hochgeschwindigkeits-Inferenz, die mit OpenAI kompatibel ist, auf speziell entwickelter Inferenzhardware. Das Plugin enthält einen statischen Katalog mit vier Modellen (keine Live-Erkennung).

| Eigenschaft         | Wert                                                      |
| ------------------- | --------------------------------------------------------- |
| Provider-ID         | `cerebras`                                                |
| Plugin              | offizielles externes Paket (`@openclaw/cerebras-provider`) |
| Authentifizierungs-Umgebungsvariable | `CEREBRAS_API_KEY`                     |
| Onboarding-Flag     | `--auth-choice cerebras-api-key`                          |
| Direktes CLI-Flag   | `--cerebras-api-key <key>`                                |
| API                 | OpenAI-kompatibel (`openai-completions`)                  |
| Basis-URL           | `https://api.cerebras.ai/v1`                              |
| Standardmodell      | `cerebras/zai-glm-4.7`                                    |

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

```bash Nur Umgebungsvariable
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verfügbarkeit der Modelle überprüfen">
    ```bash
    openclaw models list --provider cerebras
    ```

    Listet alle vier statischen Modelle auf. Wenn `CEREBRAS_API_KEY` nicht aufgelöst werden kann, meldet `openclaw models status --json` die fehlenden Anmeldedaten unter `auth.unusableProfiles`.

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

Alle vier Modelle verfügen über ein Kontextfenster von 128k und maximal 8,192 Ausgabetokens.

| Modellreferenz                            | Name                 | Schlussfolgern | Hinweise                                       |
| ----------------------------------------- | -------------------- | ------------- | ---------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ja            | Standardmodell; Schlussfolgerungsmodell in der Vorschau |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ja            | Produktives Schlussfolgerungsmodell            |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nein          | Vorschau-Modell ohne Schlussfolgerungsfunktion |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nein          | Produktives, auf Geschwindigkeit optimiertes Modell |

<Warning>
Cerebras kennzeichnet `zai-glm-4.7` und `qwen-3-235b-a22b-instruct-2507` als Vorschaumodelle. Für `llama3.1-8b` sowie `qwen-3-235b-a22b-instruct-2507` ist laut Dokumentation die Einstellung am 27. Mai 2026 vorgesehen. Prüfen Sie die Cerebras-Seite [unterstützte Modelle](https://inference-docs.cerebras.ai/models/overview), bevor Sie sich bei Produktionsworkloads auf diese Modelle verlassen.
</Warning>

## Manuelle Konfiguration

Für die meisten Einrichtungen ist nur der API-Schlüssel erforderlich. Verwenden Sie eine explizite `models.providers.cerebras`-Konfiguration, um Modellmetadaten zu überschreiben oder im Modus `mode: "merge"` mit dem statischen Katalog zu arbeiten:

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
Wenn der Gateway als Daemon ausgeführt wird (launchd, systemd, Docker), stellen Sie sicher, dass `CEREBRAS_API_KEY` für diesen Prozess verfügbar ist – beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`. Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, steht einem verwalteten Dienst nur dann zur Verfügung, wenn die Umgebungsvariablen separat importiert werden.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Stufen des Schlussfolgerungsaufwands für die beiden schlussfolgerungsfähigen Cerebras-Modelle.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
  <Card title="Häufig gestellte Fragen zu Modellen" href="/de/help/faq-models" icon="circle-question">
    Authentifizierungsprofile, Wechseln von Modellen und Beheben von „no profile“-Fehlern.
  </Card>
</CardGroup>
