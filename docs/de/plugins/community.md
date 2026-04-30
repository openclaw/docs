---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder auflisten
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und Ihre eigenen einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-30T07:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Drittanbieterpakete, die OpenClaw um neue
Kanäle, Tools, Provider oder andere Funktionen erweitern. Sie werden von der
Community erstellt und gepflegt, üblicherweise auf [ClawHub](/de/tools/clawhub)
veröffentlicht und lassen sich mit einem einzigen Befehl installieren. npm bleibt
ein unterstützter Fallback für Pakete, die noch nicht zu ClawHub gewechselt sind.

ClawHub ist die maßgebliche Oberfläche zum Auffinden von Community-Plugins.
Öffnen Sie keine rein dokumentationsbezogenen PRs, nur um Ihr Plugin hier
auffindbar zu machen; veröffentlichen Sie es stattdessen auf ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und fällt automatisch auf npm zurück.

## Aufgeführte Plugins

### Apify

Scrapen Sie Daten von beliebigen Websites mit mehr als 20.000 vorgefertigten
Scrapern. Lassen Sie Ihren Agent Daten aus Instagram, Facebook, TikTok, YouTube,
Google Maps, Google Search, E-Commerce-Websites und mehr extrahieren — einfach
per Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **Repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Unterhaltungen mit Codex App Server. Binden Sie
einen Chat an einen Codex-Thread, kommunizieren Sie per Klartext damit und
steuern Sie ihn mit chat-nativen Befehlen für Fortsetzen, Planung, Review,
Modellauswahl, Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **Repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Enterprise-Robot-Integration im Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **Repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless-Context-Management-Plugin für OpenClaw. DAG-basierte
Unterhaltungszusammenfassung mit inkrementeller Compaction — bewahrt die volle
Kontexttreue und reduziert gleichzeitig die Token-Nutzung.

- **npm:** `@martian-engineering/lossless-claw`
- **Repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie
Agent-Verhalten, Kosten, Tokens, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **Repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agent einen Live2D-Avatar mit Echtzeit-Lippensynchronität,
Emotionsausdrücken und Text-to-Speech. Enthält Creator-Tools für
KI-Asset-Generierung und Ein-Klick-Bereitstellung im Prometheus Marketplace.
Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **Repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats,
Gruppenerwähnungen, Kanalnachrichten und Rich Media einschließlich Sprache,
Bildern, Videos und Dateien.

Aktuelle OpenClaw-Versionen bündeln QQ Bot. Verwenden Sie für normale
Installationen die gebündelte Einrichtung unter [QQ Bot](/de/channels/qqbot);
installieren Sie dieses externe Plugin nur, wenn Sie bewusst das von Tencent
gepflegte eigenständige Paket verwenden möchten.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **Repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Kanal-Plugin für OpenClaw vom Tencent WeCom-Team. Gestützt auf
persistente WeCom Bot WebSocket-Verbindungen unterstützt es Direktnachrichten
und Gruppenchats, Streaming-Antworten, proaktive Nachrichten, Bild- und
Dateiverarbeitung, Markdown-Formatierung, integrierte Zugriffskontrolle sowie
Dokument-, Meeting- und Messaging-Skills.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **Repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Yuanbao-Kanal-Plugin für OpenClaw vom Tencent Yuanbao-Team. Gestützt auf
persistente WebSocket-Verbindungen unterstützt es Direktnachrichten und
Gruppenchats, Streaming-Antworten, proaktive Nachrichten, Bild-/Datei-/Audio-/
Videoverarbeitung, Markdown-Formatierung, integrierte Zugriffskontrolle und
Slash-Command-Menüs.

- **npm:** `openclaw-plugin-yuanbao`
- **Repo:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Ihr Plugin einreichen

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher zu
betreiben sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie es auf [ClawHub](/de/tools/clawhub), sofern Sie nicht
    ausdrücklich eine reine npm-Distribution benötigen.
    Die vollständige Anleitung finden Sie unter [Plugins erstellen](/de/plugins/building-plugins).

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss sich in einem öffentlichen Repository mit
    Einrichtungsdokumentation und Issue-Tracker befinden.

  </Step>

  <Step title="Docs-PRs nur für Änderungen an Quelldokumentation verwenden">
    Sie benötigen keinen Docs-PR, nur um Ihr Plugin auffindbar zu machen.
    Veröffentlichen Sie es stattdessen auf ClawHub.

    Öffnen Sie einen Docs-PR nur, wenn die Quelldokumentation von OpenClaw eine
    tatsächliche Inhaltsänderung benötigt, etwa zur Korrektur von
    Installationshinweisen oder zum Hinzufügen repo-übergreifender Dokumentation,
    die in den Hauptdokumentationssatz gehört.

  </Step>
</Steps>

## Qualitätsanforderungen

| Anforderung                    | Warum                                                 |
| ------------------------------ | ----------------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen funktionierendes `openclaw plugins install` |
| Öffentliches GitHub-Repo       | Quellcode-Review, Issue-Tracking, Transparenz         |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren |
| Aktive Wartung                 | Aktuelle Updates oder reaktionsschnelle Issue-Bearbeitung |

Wrapper mit geringem Aufwand, unklare Zuständigkeit oder ungepflegte Pakete
können abgelehnt werden.

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin) — wie Sie ein beliebiges Plugin installieren
- [Plugins erstellen](/de/plugins/building-plugins) — erstellen Sie Ihr eigenes
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
