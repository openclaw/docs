---
read_when:
    - Sie möchten Cerebras mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cerebras-API-Schlüssel oder die CLI-Authentifizierungsauswahl
summary: Cerebras-Einrichtung (Authentifizierung + Modellauswahl)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:02:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) stellt schnelle OpenAI-kompatible Inferenz auf spezieller Inferenzhardware bereit. Das Cerebras-Provider-Plugin enthält einen statischen Katalog mit vier Modellen.

| Eigenschaft     | Wert                                     |
| --------------- | ---------------------------------------- |
| Provider-ID     | `cerebras`                               |
| Plugin          | offizielles externes Paket               |
| Auth-Env-Var    | `CEREBRAS_API_KEY`                       |
| Onboarding-Flag | `--auth-choice cerebras-api-key`         |
| Direktes CLI-Flag | `--cerebras-api-key <key>`             |
| API             | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL       | `https://api.cerebras.ai/v1`             |
| Standardmodell  | `cerebras/zai-glm-4.7`                   |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

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

```bash Nur Env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verifizieren, dass Modelle verfügbar sind">
    ```bash
    openclaw models list --provider cerebras
    ```

    Die Liste sollte alle vier statischen Modelle enthalten. Wenn `CEREBRAS_API_KEY` nicht aufgelöst wird, meldet `openclaw models status --json` die fehlenden Anmeldedaten unter `auth.unusableProfiles`.

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

OpenClaw liefert einen statischen Cerebras-Katalog aus, der den öffentlichen OpenAI-kompatiblen Endpunkt widerspiegelt. Alle vier Modelle verwenden einen 128k-Kontext und 8.192 maximale Ausgabe-Token.

| Modell-Ref                               | Name                 | Reasoning | Hinweise                               |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ja        | Standardmodell; Vorschau-Reasoning-Modell |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ja        | Produktions-Reasoning-Modell           |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nein      | Vorschau-Modell ohne Reasoning         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nein      | Produktionsmodell mit Fokus auf Geschwindigkeit |

<Warning>
  Cerebras kennzeichnet `zai-glm-4.7` und `qwen-3-235b-a22b-instruct-2507` als Vorschaumodelle, und `llama3.1-8b` sowie `qwen-3-235b-a22b-instruct-2507` sind zur Einstellung am 27. Mai 2026 dokumentiert. Prüfen Sie die Seite zu unterstützten Modellen von Cerebras, bevor Sie sich für Produktions-Workloads auf diese Modelle verlassen.
</Warning>

## Manuelle Konfiguration

Mit dem Plugin benötigen Sie normalerweise nur den API-Schlüssel. Verwenden Sie eine explizite `models.providers.cerebras`-Konfiguration, wenn Sie Modellmetadaten überschreiben oder im Modus `mode: "merge"` mit dem statischen Katalog arbeiten möchten:

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
  Wenn der Gateway als Daemon ausgeführt wird (launchd, systemd, Docker), stellen Sie sicher, dass `CEREBRAS_API_KEY` für diesen Prozess verfügbar ist, zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`. Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, hilft einem verwalteten Dienst nicht, sofern die Env nicht separat importiert wird.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Reasoning-Aufwandsstufen für die zwei Reasoning-fähigen Cerebras-Modelle.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standards und Modellkonfiguration.
  </Card>
  <Card title="Modelle-FAQ" href="/de/help/faq-models" icon="circle-question">
    Auth-Profile, Modelle wechseln und Fehler vom Typ „no profile“ beheben.
  </Card>
</CardGroup>
