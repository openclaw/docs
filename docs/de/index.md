---
read_when:
    - OpenClaw für Neueinsteiger vorstellen
summary: OpenClaw ist ein Multi-Channel-Gateway für KI-Agenten, das auf jedem Betriebssystem ausgeführt werden kann.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-16T12:52:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe97e7299be4855fd9af21838e0626b5a5c8aafe46d982859e9033f0efec2443
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

> _„HÄUTEN! HÄUTEN!“_ — Wahrscheinlich ein Weltraumhummer

<p align="center">
  <strong>Ein Gateway für jedes Betriebssystem, das KI-Agenten mit Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weiteren Diensten verbindet.</strong><br />
  Senden Sie eine Nachricht und erhalten Sie unterwegs die Antwort eines Agenten. Betreiben Sie ein Gateway für Channel-Plugins, WebChat und mobile Nodes.
</p>

<Columns>
  <Card title="Erste Schritte" href="/de/start/getting-started" icon="rocket">
    Installieren Sie OpenClaw und nehmen Sie das Gateway innerhalb weniger Minuten in Betrieb.
  </Card>
  <Card title="Onboarding ausführen" href="/de/start/wizard" icon="list-checks">
    Geführte Einrichtung mit `openclaw onboard` und Kopplungsabläufen.
  </Card>
  <Card title="Einen Channel verbinden" href="/de/channels" icon="message-circle">
    Verbinden Sie Discord, Signal, Telegram, WhatsApp und weitere Dienste, um von überall zu chatten.
  </Card>
  <Card title="Control UI öffnen" href="/de/web/control-ui" icon="layout-dashboard">
    Öffnen Sie das Browser-Dashboard für Chat, Konfiguration und Sitzungen.
  </Card>
</Columns>

## Dokumentation durchsuchen

In mobilen Browsern wird das Abschnittsmenü möglicherweise ohne die vollständige Desktop-Tableiste angezeigt. Verwenden Sie
diese Hub-Links, um über den Seiteninhalt dieselben übergeordneten Dokumentationsbereiche aufzurufen.

<Columns>
  <Card title="Erste Schritte" href="/de" icon="rocket">
    Übersicht, Beispiele, erste Schritte und Einrichtungsanleitungen.
  </Card>
  <Card title="Installation" href="/de/install" icon="download">
    Installationswege, Aktualisierungen, Container, Hosting und erweiterte Einrichtung.
  </Card>
  <Card title="Channels" href="/de/channels" icon="messages-square">
    Messaging-Channels, Kopplung, Routing, Zugriffsgruppen und Channel-QA.
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
    Fehlerbehebung, häufig gestellte Fragen, Tests, Diagnose und Umgebungsprüfungen.
  </Card>
</Columns>

## Was ist OpenClaw?

OpenClaw ist ein **selbst gehostetes Gateway**, das Ihre bevorzugten Chat-Apps — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere über Channel-Plugins — mit KI-Coding-Agenten verbindet. Sie betreiben einen einzigen Gateway-Prozess auf Ihrem eigenen Computer (oder einem Server), der als Brücke zwischen Ihren Messaging-Apps und einem jederzeit verfügbaren KI-Assistenten dient.

**Für wen ist es gedacht?** Für Entwickler und erfahrene Benutzer, die einen persönlichen KI-Assistenten wünschen, dem sie von überall Nachrichten senden können — ohne die Kontrolle über ihre Daten aufzugeben oder von einem gehosteten Dienst abhängig zu sein.

**Was macht es besonders?**

- **Selbst gehostet**: läuft nach Ihren Regeln auf Ihrer Hardware
- **Mehrere Channels**: Ein Gateway bedient gleichzeitig jedes konfigurierte Channel-Plugin
- **Für Agenten entwickelt**: für Coding-Agenten mit Werkzeugnutzung, Sitzungen, Speicher und Multi-Agent-Routing konzipiert
- **Open Source**: MIT-lizenziert und von der Community entwickelt

**Was benötigen Sie?** Node 24.15+ (empfohlen), Node 22 LTS (`22.22.3+`) für Kompatibilität oder Node 25.9+, einen API-Schlüssel Ihres gewählten Providers und 5 Minuten. Verwenden Sie für optimale Qualität und Sicherheit das leistungsstärkste verfügbare Modell der neuesten Generation.

## Funktionsweise

```mermaid
flowchart LR
  A["Chat-Apps + Plugins"] --> B["Gateway"]
  B --> C["OpenClaw-Agent"]
  B --> D["CLI"]
  B --> E["Web-Control-UI"]
  B --> F["macOS-App"]
  B --> G["iOS- und Android-Nodes"]
```

Das Gateway ist die zentrale verlässliche Datenquelle für Sitzungen, Routing und Channel-Verbindungen.

## Zentrale Funktionen

<Columns>
  <Card title="Multi-Channel-Gateway" icon="network" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und weitere Dienste mit einem einzigen Gateway-Prozess.
  </Card>
  <Card title="Channel-Plugins" icon="plug" href="/de/tools/plugin">
    Channel-Plugins ergänzen Matrix, Nostr, Twitch, Zalo und weitere Dienste; offizielle Plugins werden bei Bedarf installiert.
  </Card>
  <Card title="Multi-Agent-Routing" icon="route" href="/de/concepts/multi-agent">
    Isolierte Sitzungen pro Agent, Arbeitsbereich oder Absender.
  </Card>
  <Card title="Medienunterstützung" icon="image" href="/de/nodes/images">
    Senden und empfangen Sie Bilder, Audiodateien und Dokumente.
  </Card>
  <Card title="Web-Control-UI" icon="monitor" href="/de/web/control-ui">
    Browser-Dashboard für Chat, Konfiguration, Sitzungen und Nodes.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    Koppeln Sie iOS- und Android-Nodes für Canvas-, Kamera- und sprachgesteuerte Arbeitsabläufe.
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

    Alternativ können Sie einen Channel verbinden ([Telegram](/de/channels/telegram) ist am schnellsten) und von Ihrem Smartphone aus chatten.

  </Step>
</Steps>

Benötigen Sie die vollständige Installations- und Entwicklungsumgebung? Weitere Informationen finden Sie unter [Erste Schritte](/de/start/getting-started).

## Dashboard

Öffnen Sie nach dem Start des Gateways die Control UI im Browser.

- Lokaler Standard: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Remotezugriff: [Weboberflächen](/de/web) und [Tailscale](/de/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Konfiguration (optional)

Die Konfiguration befindet sich unter `~/.openclaw/openclaw.json`.

- Wenn Sie **nichts unternehmen**, verwendet OpenClaw die mitgelieferte OpenClaw-Agent-Laufzeit; Direktnachrichten verwenden gemeinsam die Hauptsitzung des Agenten, während jeder Gruppenchat eine eigene Sitzung erhält.
- Wenn Sie den Zugriff einschränken möchten, beginnen Sie mit `channels.whatsapp.allowFrom` und verwenden Sie für Gruppen zusätzlich Erwähnungsregeln.

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
  <Card title="Remotezugriff" href="/de/gateway/remote" icon="globe">
    Zugriffsmuster für SSH und Tailnet.
  </Card>
  <Card title="Channels" href="/de/channels/telegram" icon="message-square">
    Channel-spezifische Einrichtung für Discord, Feishu, Microsoft Teams, Telegram, WhatsApp und weitere Dienste.
  </Card>
  <Card title="Nodes" href="/de/nodes" icon="smartphone">
    iOS- und Android-Nodes mit Kopplung, Canvas, Kamera und Geräteaktionen.
  </Card>
  <Card title="Hilfe" href="/de/help" icon="life-buoy">
    Einstiegspunkt für häufige Lösungen und Fehlerbehebung.
  </Card>
</Columns>

## Weitere Informationen

<Columns>
  <Card title="Vollständige Funktionsliste" href="/de/concepts/features" icon="list">
    Sämtliche Channel-, Routing- und Medienfunktionen.
  </Card>
  <Card title="Multi-Agent-Routing" href="/de/concepts/multi-agent" icon="route">
    Arbeitsbereichsisolierung und Sitzungen pro Agent.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="shield">
    Tokens, Zulassungslisten und Sicherheitskontrollen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/gateway/troubleshooting" icon="wrench">
    Gateway-Diagnose und häufige Fehler.
  </Card>
  <Card title="Über das Projekt und Danksagungen" href="/de/reference/credits" icon="info">
    Ursprünge des Projekts, Mitwirkende und Lizenz.
  </Card>
</Columns>
