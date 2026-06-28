---
read_when:
    - Sie möchten ein Claude Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI kapselt
    - Sie möchten abonnementbasierten gegenüber API-Schlüssel-basiertem Anthropic-Zugriff bewerten
summary: Community-Proxy, um Claude-Abonnement-Zugangsdaten als OpenAI-kompatiblen Endpunkt bereitzustellen
title: Claude Max API-Proxy
x-i18n:
    generated_at: "2026-06-28T20:44:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** ist ein Community-Tool, das Ihr Claude Max/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt bereitstellt. Dadurch können Sie Ihr Abonnement mit jedem Tool verwenden, das das OpenAI-API-Format unterstützt.

<Warning>
Dieser Weg dient nur der technischen Kompatibilität. Anthropic hat in der Vergangenheit einige Abonnementnutzungen außerhalb von Claude Code blockiert. Sie müssen selbst entscheiden, ob Sie ihn verwenden, und die aktuellen Abrechnungsregeln von Anthropic prüfen, bevor Sie sich darauf verlassen.

In den aktuellen Support-Dokumenten von Anthropic wird `claude -p` als Agent-SDK-/programmatische Nutzung bezeichnet. Das Support-Update von Anthropic vom 15. Juni 2026 hat den angekündigten separaten Credit-Plan für das Agent SDK ausgesetzt. Vorerst werden Claude Agent SDK, `claude -p` und die Nutzung durch Drittanbieter-Apps weiterhin auf die Nutzungslimits des angemeldeten Abonnements angerechnet.

Bevor Sie sich auf diesen Weg verlassen, prüfen Sie den [Artikel zum Agent-SDK-Plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) von Anthropic sowie die Claude-Code-Supportartikel für [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)- oder [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)-Konten.
</Warning>

## Warum dies verwenden?

| Ansatz                    | Kostenweg                                       | Am besten geeignet für                      |
| ------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Anthropic API             | Zahlung pro Token über Claude Console oder Cloud | Produktions-Apps, gemeinsame Automatisierung, Volumen |
| Claude-Abonnement-Proxy   | Claude Code / `claude -p`-Plan und Credit-Regeln | Persönliche Experimente mit kompatiblen Tools |

Wenn Sie ein Claude Max- oder Pro-Abonnement haben und es mit OpenAI-kompatiblen Tools verwenden möchten, kann dieser Proxy für einige persönliche Workflows geeignet sein. Er ist kein unbegrenzter Pauschalweg. API-Schlüssel bleiben der klarere Richtlinien- und Abrechnungsweg für den Produktionseinsatz.

## Funktionsweise

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Der Proxy:

1. Nimmt Anfragen im OpenAI-Format unter `http://localhost:3456/v1/chat/completions` an
2. Wandelt sie in Claude-Code-CLI-Befehle um
3. Gibt Antworten im OpenAI-Format zurück (Streaming wird unterstützt)

## Erste Schritte

<Steps>
  <Step title="Install the proxy">
    Erfordert Node.js 22+ und Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
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
  <Step title="Configure OpenClaw">
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
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Dieser Weg verwendet dieselbe Proxy-artige OpenAI-kompatible Route wie andere benutzerdefinierte `/v1`-Backends:

    - Native OpenAI-spezifische Anfrageformung gilt nicht
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden auf der Proxy-URL nicht eingefügt

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
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

- Dies ist ein **Community-Tool** und wird nicht offiziell von Anthropic oder OpenClaw unterstützt
- Erfordert ein aktives Claude Max/Pro-Abonnement mit authentifizierter Claude Code CLI
- Übernimmt das Abrechnungs-, Usage-Credit- und Rate-Limit-Verhalten von Claude Code `claude -p`
- Der Proxy läuft lokal und sendet keine Daten an Drittanbieter-Server
- Streaming-Antworten werden vollständig unterstützt

<Note>
Für die native Anthropic-Integration mit Claude CLI oder API-Schlüsseln siehe [Anthropic Provider](/de/providers/anthropic). Für OpenAI/Codex-Abonnements siehe [OpenAI Provider](/de/providers/openai).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit Claude CLI oder API-Schlüsseln.
  </Card>
  <Card title="OpenAI provider" href="/de/providers/openai" icon="robot">
    Für OpenAI/Codex-Abonnements.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
