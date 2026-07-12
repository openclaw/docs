---
read_when:
    - OpenClaw für Neueinsteiger vorstellen
summary: OpenClaw ist ein Gateway für KI-Agenten, das mehrere Kanäle unterstützt und auf jedem Betriebssystem läuft.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T01:45:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _„ENTBLÄTTERN! ENTBLÄTTERN!“_ — Vermutlich ein Weltraumhummer

<p align="center">
  <strong>Das betriebssystemübergreifende Gateway für KI-Agenten in Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weiteren Diensten.</strong><br />
  Senden Sie eine Nachricht und erhalten Sie unterwegs eine Antwort von einem Agenten. Betreiben Sie ein einziges Gateway für Kanal-Plugins, WebChat und mobile Nodes.
</p>

<Columns>
  <Card title="Erste Schritte" href="/de/start/getting-started" icon="rocket">
    Installieren Sie OpenClaw und nehmen Sie das Gateway innerhalb weniger Minuten in Betrieb.
  </Card>
  <Card title="Onboarding ausführen" href="/de/start/wizard" icon="list-checks">
    Geführte Einrichtung mit `openclaw onboard` und Kopplungsabläufen.
  </Card>
  <Card title="Kanal verbinden" href="/de/channels" icon="message-circle">
    Verbinden Sie Discord, Signal, Telegram, WhatsApp und weitere Dienste, um von überall aus zu chatten.
  </Card>
  <Card title="Control UI öffnen" href="/de/web/control-ui" icon="layout-dashboard">
    Öffnen Sie das Browser-Dashboard für Chats, Konfiguration und Sitzungen.
  </Card>
</Columns>

## Dokumentation durchsuchen

In mobilen Browsern wird das Abschnittsmenü möglicherweise ohne die vollständige Desktop-Tableiste angezeigt. Über
diese Übersichtslinks erreichen Sie dieselben übergeordneten Dokumentationsbereiche direkt aus dem Seiteninhalt.

<Columns>
  <Card title="Erste Schritte" href="/de" icon="rocket">
    Überblick, Anwendungsbeispiele, erste Schritte und Einrichtungsanleitungen.
  </Card>
  <Card title="Installation" href="/de/install" icon="download">
    Installationswege, Aktualisierungen, Container, Hosting und erweiterte Einrichtung.
  </Card>
  <Card title="Kanäle" href="/de/channels" icon="messages-square">
    Nachrichtenkanäle, Kopplung, Routing, Zugriffsgruppen und Qualitätssicherung für Kanäle.
  </Card>
  <Card title="Agenten" href="/de/concepts/architecture" icon="bot">
    Architektur, Sitzungen, Kontext, Speicher und Multi-Agent-Routing.
  </Card>
  <Card title="Funktionen" href="/de/tools" icon="wand-sparkles">
    Werkzeuge, Skills, Cron, Webhooks und Automatisierungsfunktionen.
  </Card>
  <Card title="ClawHub" href="/de/clawhub" icon="store">
    Plugin-Marktplatz, Veröffentlichung, Kuratierung und Hinweise zur Vertrauenswürdigkeit.
  </Card>
  <Card title="Modelle" href="/de/providers" icon="brain">
    Provider, Modellkonfiguration, Ausfallsicherung und lokale Modelldienste.
  </Card>
  <Card title="Plattformen" href="/de/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, Nodes und Weboberflächen.
  </Card>
  <Card title="Gateway und Betrieb" href="/de/gateway" icon="server">
    Gateway-Konfiguration, Sicherheit, Diagnose und Betrieb.
  </Card>
  <Card title="Referenz" href="/de/cli" icon="terminal">
    CLI-Referenz, Schemas, RPC, Versionshinweise und Vorlagen.
  </Card>
  <Card title="Hilfe" href="/de/help" icon="life-buoy">
    Fehlerbehebung, häufig gestellte Fragen, Tests, Diagnosen und Umgebungsprüfungen.
  </Card>
</Columns>

## Was ist OpenClaw?

OpenClaw ist ein **selbst gehostetes Gateway**, das Ihre bevorzugten Chat-Apps — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere über Kanal-Plugins — mit KI-Programmieragenten verbindet. Sie führen einen einzigen Gateway-Prozess auf Ihrem eigenen Rechner oder einem Server aus, der als Brücke zwischen Ihren Nachrichten-Apps und einem stets verfügbaren KI-Assistenten dient.

**Für wen ist es gedacht?** Für Entwickler und erfahrene Anwender, die einen persönlichen KI-Assistenten möchten, dem sie von überall aus Nachrichten senden können, ohne die Kontrolle über ihre Daten aufzugeben oder von einem gehosteten Dienst abhängig zu sein.

**Was unterscheidet OpenClaw von anderen Lösungen?**

- **Selbst gehostet**: läuft nach Ihren Regeln auf Ihrer Hardware
- **Mehrkanalfähig**: Ein Gateway bedient gleichzeitig alle konfigurierten Kanal-Plugins
- **Für Agenten konzipiert**: entwickelt für Programmieragenten mit Werkzeugnutzung, Sitzungen, Speicher und Multi-Agent-Routing
- **Open Source**: MIT-lizenziert und von der Community weiterentwickelt

**Was benötigen Sie?** Node 24 (empfohlen) oder aus Kompatibilitätsgründen Node 22 LTS (`22.19+`), einen API-Schlüssel Ihres gewählten Providers und fünf Minuten Zeit. Verwenden Sie für höchste Qualität und Sicherheit das leistungsstärkste verfügbare Modell der neuesten Generation.

## Funktionsweise

```mermaid
flowchart LR
  A["Chat-Apps und Plugins"] --> B["Gateway"]
  B --> C["OpenClaw-Agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS-App"]
  B --> G["iOS- und Android-Nodes"]
```

Das Gateway ist die zentrale maßgebliche Instanz für Sitzungen, Routing und Kanalverbindungen.

## Hauptfunktionen

<Columns>
  <Card title="Mehrkanal-Gateway" icon="network" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und weitere Dienste mit einem einzigen Gateway-Prozess.
  </Card>
  <Card title="Kanal-Plugins" icon="plug" href="/de/tools/plugin">
    Kanal-Plugins ergänzen Matrix, Nostr, Twitch, Zalo und weitere Dienste; offizielle Plugins werden bei Bedarf installiert.
  </Card>
  <Card title="Multi-Agent-Routing" icon="route" href="/de/concepts/multi-agent">
    Isolierte Sitzungen pro Agent, Arbeitsbereich oder Absender.
  </Card>
  <Card title="Medienunterstützung" icon="image" href="/de/nodes/images">
    Senden und empfangen Sie Bilder, Audiodateien und Dokumente.
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/de/web/control-ui">
    Browser-Dashboard für Chats, Konfiguration, Sitzungen und Nodes.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    Koppeln Sie iOS- und Android-Nodes für Canvas-, Kamera- und sprachgestützte Arbeitsabläufe.
  </Card>
</Columns>

## Schnellstart

<Steps>
  <Step title="OpenClaw installieren">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Onboarding durchführen und Dienst installieren">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatten">
    Öffnen Sie die Control UI in Ihrem Browser und senden Sie eine Nachricht:

    ```bash
    openclaw dashboard
    ```

    Alternativ können Sie einen Kanal verbinden ([Telegram](/de/channels/telegram) ist am schnellsten) und von Ihrem Smartphone aus chatten.

  </Step>
</Steps>

Benötigen Sie die vollständige Installations- und Entwicklungsumgebung? Lesen Sie [Erste Schritte](/de/start/getting-started).

## Dashboard

Öffnen Sie nach dem Start des Gateways die Control UI im Browser.

- Lokaler Standard: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Fernzugriff: [Weboberflächen](/de/web) und [Tailscale](/de/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Konfiguration (optional)

Die Konfiguration befindet sich unter `~/.openclaw/openclaw.json`.

- Wenn Sie **nichts unternehmen**, verwendet OpenClaw die mitgelieferte Laufzeit des OpenClaw-Agenten. Direktnachrichten teilen sich die Hauptsitzung des Agenten, und jeder Gruppenchat erhält eine eigene Sitzung.
- Wenn Sie den Zugriff einschränken möchten, beginnen Sie mit `channels.whatsapp.allowFrom` und bei Gruppen zusätzlich mit Erwähnungsregeln.

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
  <Card title="Dokumentationsübersichten" href="/de/start/hubs" icon="book-open">
    Alle Dokumentationen und Anleitungen, nach Anwendungsfall geordnet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="settings">
    Zentrale Gateway-Einstellungen, Token und Provider-Konfiguration.
  </Card>
  <Card title="Fernzugriff" href="/de/gateway/remote" icon="globe">
    Zugriffsmuster für SSH und Tailnet.
  </Card>
  <Card title="Kanäle" href="/de/channels/telegram" icon="message-square">
    Kanalspezifische Einrichtung für Discord, Feishu, Microsoft Teams, Telegram, WhatsApp und weitere Dienste.
  </Card>
  <Card title="Nodes" href="/de/nodes" icon="smartphone">
    iOS- und Android-Nodes mit Kopplung, Canvas, Kamera und Geräteaktionen.
  </Card>
  <Card title="Hilfe" href="/de/help" icon="life-buoy">
    Einstiegspunkt für häufige Fehlerbehebungen und Problemlösungen.
  </Card>
</Columns>

## Weitere Informationen

<Columns>
  <Card title="Vollständige Funktionsliste" href="/de/concepts/features" icon="list">
    Sämtliche Kanal-, Routing- und Medienfunktionen.
  </Card>
  <Card title="Multi-Agent-Routing" href="/de/concepts/multi-agent" icon="route">
    Isolierung von Arbeitsbereichen und Sitzungen pro Agent.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="shield">
    Token, Zulassungslisten und Sicherheitskontrollen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/gateway/troubleshooting" icon="wrench">
    Gateway-Diagnosen und häufige Fehler.
  </Card>
  <Card title="Über das Projekt und Danksagungen" href="/de/reference/credits" icon="info">
    Projektursprung, Mitwirkende und Lizenz.
  </Card>
</Columns>
