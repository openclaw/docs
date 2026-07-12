---
read_when:
    - Sie möchten ein Claude-Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI umschließt.
    - Sie möchten abonnementbasierten mit API-Schlüssel-basiertem Anthropic-Zugriff vergleichen
summary: Community-Proxy, der Claude-Abonnementzugangsdaten über einen OpenAI-kompatiblen Endpunkt bereitstellt
title: Claude-Max-API-Proxy
x-i18n:
    generated_at: "2026-07-12T02:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** ist ein Community-npm-Paket (kein OpenClaw-Plugin), das
ein Claude-Max-/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt bereitstellt.
Dadurch können Sie jedes OpenAI-kompatible Tool mit Ihrem Abonnement statt mit
einem Anthropic-API-Schlüssel verwenden.

<Warning>
Nur technische Kompatibilität, kein offiziell genehmigter Weg. Anthropic hat
in der Vergangenheit bestimmte Nutzungen von Abonnements außerhalb von Claude
Code blockiert. Prüfen Sie die aktuellen Abrechnungsregeln von Anthropic, bevor
Sie sich darauf verlassen.

Die Claude-Code-Dokumentation von Anthropic beschreibt `claude -p` als
programmatische Nutzung beziehungsweise Nutzung über das Agent SDK. Seit der
Support-Aktualisierung von Anthropic vom 15. Juni 2026 werden die Nutzung von
Claude Agent SDK, `claude -p` und Drittanbieter-Apps auf die Nutzungslimits des
angemeldeten Abonnements angerechnet (das zuvor angekündigte separate
Guthabenmodell für das Agent SDK ist ausgesetzt). Weitere Informationen finden
Sie im Anthropic-Artikel zum [Agent-SDK-Tarif](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
in den Tarifartikeln zu [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
und [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
sowie unter [Anthropic-Provider](/de/providers/anthropic) in den OpenClaw-eigenen
Hinweisen zur Abrechnung der Claude CLI.
</Warning>

## Warum Sie dies verwenden sollten

| Ansatz                     | Abrechnungsweg                                  | Am besten geeignet für                                |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Anthropic-API-Schlüssel    | Abrechnung pro Token über die Claude Console    | Produktionsanwendungen, gemeinsame Automatisierung, Volumen |
| Claude-Abonnement-Proxy    | Tarif- und Guthabenregeln von Claude Code / `claude -p` | Persönliche Experimente mit kompatiblen Tools          |

Mit diesem Proxy kann ein Claude-Max- oder Pro-Abonnement mit
OpenAI-kompatiblen Tools verwendet werden. Es handelt sich nicht um einen
unbegrenzten Pauschaltarif – es gelten die Nutzungslimits von Claude Code.
API-Schlüssel bleiben für den Produktionseinsatz der transparentere
Abrechnungsweg.

## Funktionsweise

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

Der Proxy startet die Claude Code CLI für jede Anfrage als Unterprozess,
konvertiert Chatanfragen im OpenAI-Format in CLI-Prompts und überträgt die
Antwort im OpenAI-Format als Stream zurück oder gibt sie vollständig zurück.

## Erste Schritte

<Steps>
  <Step title="Install the proxy">
    Erfordert Node.js 20+ und eine authentifizierte Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    Konfigurieren Sie den Proxy in OpenClaw als benutzerdefinierten
    OpenAI-kompatiblen Endpunkt:

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

<Note>
Die nachstehenden Modell-IDs stammen aus dem eigenen Katalog des Proxys und
sind keine Anthropic-Modellreferenzen von OpenClaw. Jede ID ist einem
Modellalias der Claude Code CLI (`opus`, `sonnet`, `haiku`) zugeordnet. Daher
ändert sich das zugrunde liegende Modell, wenn Anthropic diesen Alias in der
CLI aktualisiert. Prüfen Sie die aktuelle README-Datei des Proxys, bevor Sie
sich auf eine bestimmte Zuordnung verlassen.
</Note>

| Modell-ID          | CLI-Alias | Aktuelle Zuordnung |
| ------------------ | --------- | ------------------ |
| `claude-opus-4`    | `opus`    | Claude Opus 4.5    |
| `claude-sonnet-4`  | `sonnet`  | Claude Sonnet 4    |
| `claude-haiku-4`   | `haiku`   | Claude Haiku 4     |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Dies verwendet die generische benutzerdefinierte OpenAI-kompatible
    `/v1`-Route von OpenClaw, also denselben Pfad wie jedes andere selbst
    gehostete OpenAI-kompatible Backend:

    - Die ausschließlich für natives OpenAI vorgesehene Anfrageaufbereitung wird nicht angewendet.
    - `/fast` und `service_tier` gelten nur für direkten Datenverkehr zu
      `api.anthropic.com`; Proxy-Routen lassen `service_tier` unverändert
      (siehe [Schnellmodus des Anthropic-Providers](/de/providers/anthropic#advanced-configuration)).
    - Keine Responses-Option `store`, keine Hinweise für den Prompt-Cache und
      keine OpenAI-kompatible Aufbereitung von Reasoning-Nutzlasten.
    - Die OpenAI-/Codex-Zuordnungsheader von OpenClaw (`originator`, `version`,
      `User-Agent`) werden nur bei nativem OAuth-Datenverkehr zu
      `api.openai.com` gesendet, nicht an benutzerdefinierte
      `OPENAI_BASE_URL`-Ziele wie diesen Proxy.

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
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

- Übernimmt das Abrechnungs-, Nutzungsguthaben- und Ratenbegrenzungsverhalten von `claude -p` in Claude Code.
- Bindet ausschließlich an `127.0.0.1`; abgesehen vom eigenen CLI-Aufruf an Anthropic werden keine Daten an Drittanbieterserver gesendet.
- Streaming-Antworten werden unterstützt.
- Authentifizierungsfehler werden beim Start nicht geprüft und treten erst auf, wenn tatsächlich eine Chatanfrage ausgeführt wird. Wenn die CLI nicht authentifiziert ist, schlägt daher die erste Anfrage fehl, anstatt dass der Server den Start verweigert.

<Note>
Informationen zur nativen Anthropic-Integration mit der Claude CLI oder mit
API-Schlüsseln finden Sie unter [Anthropic-Provider](/de/providers/anthropic).
Informationen zu OpenAI-/Codex-Abonnements finden Sie unter
[OpenAI-Provider](/de/providers/openai).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit der Claude CLI oder mit API-Schlüsseln.
  </Card>
  <Card title="OpenAI provider" href="/de/providers/openai" icon="robot">
    Für OpenAI-/Codex-Abonnements.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
