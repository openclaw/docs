---
read_when:
    - Sie möchten ein Claude Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI umschließt
    - Sie möchten abonnementbasierten mit API-Schlüssel-basiertem Anthropic-Zugriff vergleichen
summary: Community-Proxy, um Claude-Abonnement-Anmeldedaten als OpenAI-kompatiblen Endpunkt bereitzustellen
title: Claude Max API-Proxy
x-i18n:
    generated_at: "2026-06-27T18:02:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** ist ein Community-Tool, das Ihr Claude Max/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt bereitstellt. Damit können Sie Ihr Abonnement mit jedem Tool verwenden, das das OpenAI-API-Format unterstützt.

<Warning>
Dieser Weg dient nur der technischen Kompatibilität. Anthropic hat in der
Vergangenheit manche Abonnementnutzung außerhalb von Claude Code blockiert. Sie
müssen selbst entscheiden, ob Sie ihn verwenden, und die aktuellen
Abrechnungsregeln von Anthropic prüfen, bevor Sie sich darauf verlassen.

Die aktuellen Support-Dokumente von Anthropic sagen, dass `claude -p` Agent
SDK-/programmatische Nutzung ist. Ab dem 15. Juni 2026 wird die Nutzung von
`claude -p` in Abonnementplänen zuerst aus einem separaten monatlichen Agent
SDK-Guthaben abgerechnet und danach, sofern Nutzungsguthaben aktiviert ist, aus
Nutzungsguthaben zu Standard-API-Tarifen.
</Warning>

## Warum dies verwenden?

| Ansatz                    | Kostenweg                                           | Am besten geeignet für                                      |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Anthropic API             | Zahlung pro Token über Claude Console oder Cloud    | Produktions-Apps, gemeinsame Automatisierung, Volumen       |
| Claude-Abonnement-Proxy   | Claude Code-/`claude -p`-Plan und Guthabenregeln    | Persönliche Experimente mit kompatiblen Tools               |

Wenn Sie ein Claude Max- oder Pro-Abonnement haben und es mit
OpenAI-kompatiblen Tools verwenden möchten, kann dieser Proxy für manche
persönlichen Workflows passen. Er ist kein unbegrenzter Pauschalweg. API-Schlüssel
bleiben der klarere Richtlinien- und Abrechnungsweg für die Produktionsnutzung.

## Funktionsweise

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Der Proxy:

1. Nimmt OpenAI-formatierte Anfragen unter `http://localhost:3456/v1/chat/completions` an
2. Wandelt sie in Claude Code CLI-Befehle um
3. Gibt Antworten im OpenAI-Format zurück (Streaming wird unterstützt)

## Erste Schritte

<Steps>
  <Step title="Proxy installieren">
    Erfordert Node.js 22+ und Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Server starten">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Proxy testen">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw konfigurieren">
    Richten Sie OpenClaw auf den Proxy als benutzerdefinierten OpenAI-kompatiblen Endpunkt aus:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Integrierter Katalog

| Modell-ID         | Wird zugeordnet zu |
| ----------------- | ------------------ |
| `claude-opus-4`   | Claude Opus 4      |
| `claude-sonnet-4` | Claude Sonnet 4    |
| `claude-haiku-4`  | Claude Haiku 4     |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Hinweise zu Proxy-artigen OpenAI-kompatiblen Endpunkten">
    Dieser Weg verwendet dieselbe Proxy-artige OpenAI-kompatible Route wie andere
    benutzerdefinierte `/v1`-Backends:

    - Native OpenAI-spezifische Anfrageformung gilt nicht
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und
      keine OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Verborgene OpenClaw-Zuordnungs-Header (`originator`, `version`, `User-Agent`)
      werden bei der Proxy-URL nicht eingefügt

  </Accordion>

  <Accordion title="Automatischer Start unter macOS mit LaunchAgent">
    Erstellen Sie einen LaunchAgent, um den Proxy automatisch auszuführen:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Hinweise

- Dies ist ein **Community-Tool**, das nicht offiziell von Anthropic oder OpenClaw unterstützt wird
- Erfordert ein aktives Claude Max/Pro-Abonnement mit authentifizierter Claude Code CLI
- Übernimmt das Abrechnungs-, Nutzungsguthaben- und Ratenlimitverhalten von Claude Code `claude -p`
- Der Proxy läuft lokal und sendet keine Daten an Drittanbieter-Server
- Streaming-Antworten werden vollständig unterstützt

<Note>
Für die native Anthropic-Integration mit Claude CLI oder API-Schlüsseln siehe [Anthropic-Provider](/de/providers/anthropic). Für OpenAI/Codex-Abonnements siehe [OpenAI-Provider](/de/providers/openai).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Anthropic-Provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit Claude CLI oder API-Schlüsseln.
  </Card>
  <Card title="OpenAI-Provider" href="/de/providers/openai" icon="robot">
    Für OpenAI/Codex-Abonnements.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
