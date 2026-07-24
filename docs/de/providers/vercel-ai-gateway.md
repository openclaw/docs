---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Einrichtung des Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-07-24T05:19:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Der [Vercel AI Gateway](https://vercel.com/ai-gateway) bietet eine einheitliche API für den
Zugriff auf Hunderte von Modellen über einen einzigen Endpunkt.

| Eigenschaft   | Wert                                   |
| ------------- | -------------------------------------- |
| Provider      | `vercel-ai-gateway`                    |
| Paket         | `@openclaw/vercel-ai-gateway-provider` |
| Authentifizierung | `AI_GATEWAY_API_KEY`                   |
| API           | Kompatibel mit Anthropic Messages      |
| Basis-URL     | `https://ai-gateway.vercel.sh`         |
| Modellkatalog | Automatisch über `/v1/models` erkannt       |

<Tip>
OpenClaw erkennt den `/v1/models`-Katalog des Gateway automatisch, sodass sowohl der
Chat-Befehl `/models vercel-ai-gateway` als auch
`openclaw models list --provider vercel-ai-gateway` aktuelle Modellreferenzen
wie `vercel-ai-gateway/openai/gpt-5.5` und
`vercel-ai-gateway/moonshotai/kimi-k2.6` enthalten.
</Tip>

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Standardmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Kurzschreibweise für Modell-IDs

OpenClaw normalisiert Kurzschreibweisen für Claude-Modellreferenzen zur Laufzeit:

| Eingabe in Kurzschreibweise          | Normalisierte Modellreferenz                  |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Verwenden Sie in Ihrer Konfiguration eine der beiden Formen; OpenClaw löst die kanonische
Referenz `anthropic/...` automatisch auf.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn der OpenClaw Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher,
    dass `AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, ist für einen
    launchd/systemd-Daemon nicht sichtbar, sofern diese Umgebung nicht ausdrücklich importiert wird. Legen Sie
    den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-
    Prozess darauf zugreifen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet jede Anfrage an den Upstream-Provider weiter, der im Präfix der
    Modellreferenz angegeben ist. Beispielsweise wird `vercel-ai-gateway/anthropic/claude-opus-4.6`
    über Anthropic, `vercel-ai-gateway/openai/gpt-5.5` über
    OpenAI und `vercel-ai-gateway/moonshotai/kimi-k2.6` über
    MoonshotAI weitergeleitet. Ein `AI_GATEWAY_API_KEY` authentifiziert alle Upstream-Provider.
  </Accordion>
  <Accordion title="Denkstufen">
    Die Optionen von `/think` richten sich nach dem Präfix des Upstream-Modells, wenn OpenClaw
    es erkennt. `vercel-ai-gateway/anthropic/...` verwendet das Claude-Denkprofil,
    einschließlich der adaptiven Standardeinstellung für Claude-4.6-Modelle. Vertrauenswürdige
    `vercel-ai-gateway/openai/...`-Referenzen (`gpt-5.2` und neuer sowie Codex-
    Varianten bis hinunter zu `gpt-5.1-codex`) stellen `/think xhigh` bereit. Andere mit Namensräumen versehene
    Referenzen behalten die standardmäßigen Reasoning-Stufen bei, sofern ihre Katalogmetadaten
    keine weiteren deklarieren.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
