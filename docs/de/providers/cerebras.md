---
read_when:
    - Sie möchten Cerebras mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cerebras-API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Cerebras-Einrichtung (Authentifizierung + Modellauswahl)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T07:00:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) bietet schnelle OpenAI-kompatible Inferenz auf spezieller Inferenzhardware. OpenClaw enthält ein gebündeltes Cerebras-Provider-Plugin mit einem statischen Katalog aus vier Modellen.

| Eigenschaft             | Wert                                     |
| ----------------------- | ---------------------------------------- |
| Provider-ID             | `cerebras`                               |
| Plugin                  | gebündelt, `enabledByDefault: true`      |
| Auth-Umgebungsvariable  | `CEREBRAS_API_KEY`                       |
| Onboarding-Flag         | `--auth-choice cerebras-api-key`         |
| Direktes CLI-Flag       | `--cerebras-api-key <key>`               |
| API                     | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL               | `https://api.cerebras.ai/v1`             |
| Standardmodell          | `cerebras/zai-glm-4.7`                   |

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

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider cerebras
    ```

    Die Liste sollte alle vier gebündelten Modelle enthalten. Wenn `CEREBRAS_API_KEY` nicht aufgelöst werden kann, meldet `openclaw models status --json` die fehlende Anmeldeinformation unter `auth.unusableProfiles`.

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

OpenClaw liefert einen statischen Cerebras-Katalog aus, der den öffentlichen OpenAI-kompatiblen Endpunkt widerspiegelt. Alle vier Modelle teilen sich einen Kontext von 128k und maximal 8.192 Ausgabetoken.

| Modellreferenz                           | Name                 | Reasoning | Hinweise                               |
| ---------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                   | Z.ai GLM 4.7         | ja        | Standardmodell; Reasoning-Vorschaumodell |
| `cerebras/gpt-oss-120b`                  | GPT OSS 120B         | ja        | Produktions-Reasoning-Modell           |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nein      | Vorschaumodell ohne Reasoning          |
| `cerebras/llama3.1-8b`                   | Llama 3.1 8B         | nein      | Produktivmodell mit Fokus auf Geschwindigkeit |

<Warning>
  Cerebras kennzeichnet `zai-glm-4.7` und `qwen-3-235b-a22b-instruct-2507` als Vorschaumodelle, und `llama3.1-8b` sowie `qwen-3-235b-a22b-instruct-2507` sind für die Einstellung am 27. Mai 2026 dokumentiert. Prüfen Sie die Seite der unterstützten Cerebras-Modelle, bevor Sie sie für Produktionsworkloads verwenden.
</Warning>

## Manuelle Konfiguration

Das gebündelte Plugin bedeutet normalerweise, dass Sie nur den API-Schlüssel benötigen. Verwenden Sie eine explizite `models.providers.cerebras`-Konfiguration, wenn Sie Modellmetadaten überschreiben oder mit `mode: "merge"` gegen den statischen Katalog ausführen möchten:

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
  Wenn der Gateway als Daemon ausgeführt wird (launchd, systemd, Docker), stellen Sie sicher, dass `CEREBRAS_API_KEY` für diesen Prozess verfügbar ist — zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`. Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem verwalteten Dienst nicht, sofern die Umgebung nicht separat importiert wird.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Reasoning-Aufwandsstufen für die zwei Reasoning-fähigen Cerebras-Modelle.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
  <Card title="Modelle-FAQ" href="/de/help/faq-models" icon="circle-question">
    Auth-Profile, Modelle wechseln und „no profile“-Fehler beheben.
  </Card>
</CardGroup>
