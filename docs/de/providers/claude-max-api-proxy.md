---
read_when:
    - Sie möchten ein Claude-Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI umschließt.
    - Sie möchten abonnementbasierten und API-Schlüssel-basierten Zugriff auf Anthropic vergleichen
summary: Community-Proxy, um Claude-Abonnementanmeldedaten als OpenAI-kompatiblen Endpunkt bereitzustellen
title: Claude-Max-API-Proxy
x-i18n:
    generated_at: "2026-07-24T04:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** ist ein Community-npm-Paket (kein OpenClaw-Plugin), das
ein Claude-Max-/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt bereitstellt,
sodass Sie jedes OpenAI-kompatible Tool mit Ihrem Abonnement statt mit einem
Anthropic-API-Schlüssel verwenden können.

<Warning>
Nur technisch kompatibel, kein offiziell genehmigter Weg. Anthropic hat in der
Vergangenheit bestimmte Abonnementnutzungen außerhalb von Claude Code blockiert;
prüfen Sie die aktuellen Abrechnungsregeln von Anthropic, bevor Sie sich darauf
verlassen.

Die Claude-Code-Dokumentation von Anthropic beschreibt `claude -p` als
Agent-SDK-/programmatische Nutzung. Laut dem Support-Update von Anthropic vom
15\. Juni 2026 werden die Nutzung von Claude Agent SDK, `claude -p` und
Drittanbieter-Apps auf die Nutzungslimits des angemeldeten Abonnements
angerechnet (das zuvor angekündigte separate Guthabenmodell für das Agent SDK
ist pausiert). Weitere Informationen finden Sie im Anthropic-Artikel zum
[Agent-SDK-Tarif](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
in den Tarifartikeln zu [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
und [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
sowie unter [Anthropic-Provider](/de/providers/anthropic) für OpenClaws eigene
Hinweise zur Abrechnung der Claude CLI.
</Warning>

## Gründe für die Verwendung

| Ansatz                    | Abrechnungsweg                                  | Am besten geeignet für                          |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Anthropic-API-Schlüssel   | Tokenbasierte Abrechnung über Claude Console    | Produktiv-Apps, gemeinsam genutzte Automatisierung, hohes Volumen |
| Claude-Abonnement-Proxy   | Tarif- und Guthabenregeln von Claude Code / `claude -p` | Persönliche Experimente mit kompatiblen Tools |

Mit diesem Proxy kann ein Claude-Max- oder Pro-Abonnement mit
OpenAI-kompatiblen Tools verwendet werden. Es handelt sich nicht um einen
unbegrenzten Pauschaltarif – es gelten die Nutzungslimits von Claude Code.
API-Schlüssel bleiben für den Produktionseinsatz der eindeutigere
Abrechnungsweg.

## Funktionsweise

```text
Ihre App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI-Format)               (konvertiert das Format)         (verwendet Ihre Anmeldung)
```

Der Proxy startet die Claude Code CLI für jede Anfrage als Unterprozess,
konvertiert Chatanfragen im OpenAI-Format in CLI-Prompts und streamt die Antwort
im OpenAI-Format zurück (oder gibt sie direkt zurück).

## Erste Schritte

<Steps>
  <Step title="Proxy installieren">
    Erfordert Node.js 20+ und eine authentifizierte Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Prüfen, ob die Claude CLI authentifiziert ist
    claude --version
    claude auth login   # falls noch nicht authentifiziert
    ```

  </Step>
  <Step title="Server starten">
    ```bash
    claude-max-api
    # Server läuft unter http://localhost:3456
    ```
  </Step>
  <Step title="Proxy testen">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hallo!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw konfigurieren">
    Richten Sie OpenClaw auf den Proxy als benutzerdefinierten
    OpenAI-kompatiblen Endpunkt aus:

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
Die folgenden Modell-IDs stammen aus dem eigenen Katalog des Proxys und sind
nicht die Anthropic-Modellreferenzen von OpenClaw. Jede ID ist einem
Modellalias der Claude Code CLI (`opus`, `sonnet`,
`haiku`) zugeordnet. Das zugrunde liegende Modell ändert sich daher,
wenn Anthropic diesen Alias in der CLI aktualisiert. Prüfen Sie die aktuelle
README-Datei des Proxys, bevor Sie sich auf eine bestimmte Zuordnung verlassen.
</Note>

| Modell-ID         | CLI-Alias | Aktuelle Zuordnung |
| ----------------- | --------- | ------------------ |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Hinweise zur OpenAI-kompatiblen Proxy-Nutzung">
    Dabei wird die generische benutzerdefinierte OpenAI-kompatible Route
    `/v1` von OpenClaw verwendet, derselbe Pfad wie bei jedem
    anderen selbst gehosteten OpenAI-kompatiblen Backend:

    - Die ausschließlich für natives OpenAI vorgesehene Anfrageformatierung wird nicht angewendet.
    - `/fast` und `service_tier` gelten nur für direkten `api.anthropic.com`-Datenverkehr;
      Proxy-Routen lassen `service_tier` unverändert (siehe
      [Schnellmodus des Anthropic-Providers](/de/providers/anthropic#advanced-configuration)).
    - Keine Responses-`store`, Prompt-Cache-Hinweise oder
      OpenAI-Reasoning-Kompatibilitätsformatierung der Nutzdaten.
    - Die OpenAI-/Codex-Attributionsheader von OpenClaw (`originator`,
      `version`, `User-Agent`) werden nur bei nativem
      `api.openai.com`-OAuth-Datenverkehr gesendet, nicht an benutzerdefinierte
      `OPENAI_BASE_URL`-Ziele wie diesen Proxy.

  </Accordion>

  <Accordion title="Automatischer Start unter macOS mit LaunchAgent">
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

- Übernimmt das Verhalten von Claude Code für `claude -p`-Abrechnung, Nutzungsguthaben und Ratenbegrenzung.
- Bindet ausschließlich an `127.0.0.1`; es werden keine Daten an Drittanbieterserver gesendet, abgesehen vom eigenen Aufruf der CLI an Anthropic.
- Streaming-Antworten werden unterstützt.
- Authentifizierungsfehler werden beim Start nicht geprüft und treten erst auf, wenn tatsächlich eine Chatanfrage ausgeführt wird. Wenn die CLI nicht authentifiziert ist, schlägt daher die erste Anfrage fehl, anstatt dass der Server den Start verweigert.

<Note>
Informationen zur nativen Anthropic-Integration mit der Claude CLI oder
API-Schlüsseln finden Sie unter [Anthropic-Provider](/de/providers/anthropic).
Informationen zu OpenAI-/Codex-Abonnements finden Sie unter
[OpenAI-Provider](/de/providers/openai).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Anthropic-Provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit der Claude CLI oder API-Schlüsseln.
  </Card>
  <Card title="OpenAI-Provider" href="/de/providers/openai" icon="robot">
    Für OpenAI-/Codex-Abonnements.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
