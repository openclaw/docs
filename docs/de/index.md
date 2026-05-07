---
read_when:
    - Einführung in OpenClaw für Neueinsteiger
summary: OpenClaw ist ein Mehrkanal-Gateway für KI-Agenten, das auf jedem Betriebssystem läuft.
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIATE! EXFOLIATE!"_ — vermutlich ein Weltraum-Hummer

<p align="center">
  <strong>Ein Gateway für jedes Betriebssystem für KI-Agenten über Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und mehr.</strong><br />
  Senden Sie eine Nachricht und erhalten Sie eine Agentenantwort aus Ihrer Tasche. Betreiben Sie ein Gateway über integrierte Kanäle, gebündelte Kanal-Plugins, WebChat und mobile Nodes hinweg.
</p>

<Columns>
  <Card title="Erste Schritte" href="/de/start/getting-started" icon="rocket">
    Installieren Sie OpenClaw und starten Sie das Gateway in wenigen Minuten.
  </Card>
  <Card title="Onboarding ausführen" href="/de/start/wizard" icon="sparkles">
    Geführte Einrichtung mit `openclaw onboard` und Kopplungsabläufen.
  </Card>
  <Card title="Steuerungsoberfläche öffnen" href="/de/web/control-ui" icon="layout-dashboard">
    Starten Sie das Browser-Dashboard für Chat, Konfiguration und Sitzungen.
  </Card>
</Columns>

## Was ist OpenClaw?

OpenClaw ist ein **selbst gehostetes Gateway**, das Ihre bevorzugten Chat-Apps und Kanaloberflächen — integrierte Kanäle sowie gebündelte oder externe Kanal-Plugins wie Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und mehr — mit KI-Coding-Agenten wie Pi verbindet. Sie führen einen einzelnen Gateway-Prozess auf Ihrem eigenen Rechner (oder einem Server) aus, der zur Brücke zwischen Ihren Messaging-Apps und einem stets verfügbaren KI-Assistenten wird.

**Für wen ist es gedacht?** Für Entwickler und erfahrene Nutzer, die einen persönlichen KI-Assistenten möchten, dem sie von überall aus Nachrichten senden können — ohne die Kontrolle über ihre Daten abzugeben oder auf einen gehosteten Dienst angewiesen zu sein.

**Was macht es anders?**

- **Selbst gehostet**: läuft auf Ihrer Hardware, nach Ihren Regeln
- **Multi-Channel**: ein Gateway bedient integrierte Kanäle sowie gebündelte oder externe Kanal-Plugins gleichzeitig
- **Agent-native**: entwickelt für Coding-Agenten mit Tool-Nutzung, Sitzungen, Speicher und Multi-Agent-Routing
- **Open Source**: MIT-lizenziert, community-getrieben

**Was benötigen Sie?** Node 24 (empfohlen) oder Node 22 LTS (`22.16+`) für Kompatibilität, einen API-Schlüssel von Ihrem gewählten Provider und 5 Minuten. Für beste Qualität und Sicherheit verwenden Sie das stärkste verfügbare Modell der neuesten Generation.

## Funktionsweise

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Das Gateway ist die zentrale Quelle der Wahrheit für Sitzungen, Routing und Kanalverbindungen.

## Wichtige Funktionen

<Columns>
  <Card title="Multi-Channel-Gateway" icon="network" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und mehr mit einem einzigen Gateway-Prozess.
  </Card>
  <Card title="Plugin-Kanäle" icon="plug" href="/de/tools/plugin">
    Gebündelte Plugins fügen Matrix, Nostr, Twitch, Zalo und mehr in normalen aktuellen Releases hinzu.
  </Card>
  <Card title="Multi-Agent-Routing" icon="route" href="/de/concepts/multi-agent">
    Isolierte Sitzungen pro Agent, Arbeitsbereich oder Absender.
  </Card>
  <Card title="Medienunterstützung" icon="image" href="/de/nodes/images">
    Senden und empfangen Sie Bilder, Audio und Dokumente.
  </Card>
  <Card title="Web-Steuerungsoberfläche" icon="monitor" href="/de/web/control-ui">
    Browser-Dashboard für Chat, Konfiguration, Sitzungen und Nodes.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    Koppeln Sie iOS- und Android-Nodes für Canvas, Kamera und sprachfähige Workflows.
  </Card>
</Columns>

## Schnellstart

<Steps>
  <Step title="OpenClaw installieren">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Onboarding durchführen und den Dienst installieren">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatten">
    Öffnen Sie die Steuerungsoberfläche in Ihrem Browser und senden Sie eine Nachricht:

    ```bash
    openclaw dashboard
    ```

    Oder verbinden Sie einen Kanal ([Telegram](/de/channels/telegram) ist am schnellsten) und chatten Sie von Ihrem Smartphone aus.

  </Step>
</Steps>

Benötigen Sie die vollständige Installation und Entwicklungsumgebung? Siehe [Erste Schritte](/de/start/getting-started).

## Dashboard

Öffnen Sie die browserbasierte Steuerungsoberfläche, nachdem das Gateway gestartet wurde.

- Lokaler Standard: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Remote-Zugriff: [Weboberflächen](/de/web) und [Tailscale](/de/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Konfiguration (optional)

Die Konfiguration befindet sich unter `~/.openclaw/openclaw.json`.

- Wenn Sie **nichts tun**, verwendet OpenClaw die gebündelte Pi-Binärdatei im RPC-Modus mit Sitzungen pro Absender.
- Wenn Sie es stärker absichern möchten, beginnen Sie mit `channels.whatsapp.allowFrom` und (für Gruppen) Erwähnungsregeln.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Hier beginnen

<Columns>
  <Card title="Dokumentations-Hubs" href="/de/start/hubs" icon="book-open">
    Alle Dokumentationen und Anleitungen, nach Anwendungsfall geordnet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="settings">
    Zentrale Gateway-Einstellungen, Tokens und Provider-Konfiguration.
  </Card>
  <Card title="Remote-Zugriff" href="/de/gateway/remote" icon="globe">
    Zugriffsmuster für SSH und Tailnet.
  </Card>
  <Card title="Kanäle" href="/de/channels/telegram" icon="message-square">
    Kanalspezifische Einrichtung für Feishu, Microsoft Teams, WhatsApp, Telegram, Discord und mehr.
  </Card>
  <Card title="Nodes" href="/de/nodes" icon="smartphone">
    iOS- und Android-Nodes mit Kopplung, Canvas, Kamera und Geräteaktionen.
  </Card>
  <Card title="Hilfe" href="/de/help" icon="life-buoy">
    Einstiegspunkt für häufige Korrekturen und Fehlerbehebung.
  </Card>
</Columns>

## Mehr erfahren

<Columns>
  <Card title="Vollständige Funktionsliste" href="/de/concepts/features" icon="list">
    Vollständige Kanal-, Routing- und Medienfunktionen.
  </Card>
  <Card title="Multi-Agent-Routing" href="/de/concepts/multi-agent" icon="route">
    Arbeitsbereichsisolierung und Sitzungen pro Agent.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="shield">
    Tokens, Allowlists und Sicherheitskontrollen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/gateway/troubleshooting" icon="wrench">
    Gateway-Diagnosen und häufige Fehler.
  </Card>
  <Card title="Über das Projekt und Danksagungen" href="/de/reference/credits" icon="info">
    Projektursprünge, Mitwirkende und Lizenz.
  </Card>
</Columns>
