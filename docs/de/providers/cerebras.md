---
read_when:
    - Sie möchten Cerebras mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cerebras-API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Cerebras-Einrichtung (Authentifizierung + Modellauswahl)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T07:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) bietet schnelle OpenAI-kompatible Inferenz.

| Eigenschaft | Wert                         |
| ----------- | ---------------------------- |
| Provider    | `cerebras`                   |
| Auth        | `CEREBRAS_API_KEY`           |
| API         | OpenAI-kompatibel            |
| Basis-URL   | `https://api.cerebras.ai/v1` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verfügbarkeit der Modelle prüfen">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Integrierter Katalog

OpenClaw liefert einen statischen Cerebras-Katalog für den öffentlichen OpenAI-kompatiblen Endpunkt mit:

| Modellreferenz                           | Name                 | Hinweise                                     |
| ---------------------------------------- | -------------------- | -------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Standardmodell; Reasoning-Vorschaumodell     |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Reasoning-Modell für die Produktion          |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Nicht-Reasoning-Vorschaumodell               |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Produktionsmodell mit Fokus auf Geschwindigkeit |

<Warning>
Cerebras kennzeichnet `zai-glm-4.7` und `qwen-3-235b-a22b-instruct-2507` als Vorschaumodelle, und `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` sind für die Einstellung am 27. Mai 2026 dokumentiert. Prüfen Sie die Seite der unterstützten Modelle von Cerebras, bevor Sie sich in der Produktion darauf verlassen.
</Warning>

## Manuelle Konfiguration

Das gebündelte Plugin bedeutet in der Regel, dass Sie nur den API-Schlüssel benötigen. Verwenden Sie eine explizite
`models.providers.cerebras`-Konfiguration, wenn Sie Modellmetadaten überschreiben möchten:

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
Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `CEREBRAS_API_KEY`
für diesen Prozess verfügbar ist, zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`.
</Note>
