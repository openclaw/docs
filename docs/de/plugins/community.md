---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder eintragen
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-30T09:34:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Drittanbieterpakete, die OpenClaw um neue
Kanäle, Tools, Provider oder andere Funktionen erweitern. Sie werden von der
Community entwickelt und gepflegt, in der Regel auf [ClawHub](/de/tools/clawhub)
veröffentlicht und können mit einem einzigen Befehl installiert werden. npm
bleibt ein unterstützter Fallback für Pakete, die noch nicht zu ClawHub
umgezogen sind.

ClawHub ist die maßgebliche Oberfläche zum Entdecken von Community-Plugins. Öffnen
Sie keine reinen Dokumentations-PRs, nur um Ihr Plugin hier für bessere
Auffindbarkeit hinzuzufügen; veröffentlichen Sie es stattdessen auf ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und fällt automatisch auf npm zurück.

## Aufgelistete Plugins

### Apify

Extrahieren Sie Daten von jeder Website mit über 20.000 vorgefertigten Scrapern. Lassen Sie Ihren Agent
Daten aus Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, E-Commerce-Websites und mehr extrahieren — einfach durch Nachfragen.

- **npm:** `@apify/apify-openclaw-plugin`
- **Repository:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Codex App Server-Konversationen. Binden Sie einen Chat an
einen Codex-Thread, kommunizieren Sie mit einfachem Text und steuern Sie ihn mit chat-nativen
Befehlen für Fortsetzen, Planung, Review, Modellauswahl, Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **Repository:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integration von Enterprise-Robotern im Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **Repository:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless-Context-Management-Plugin für OpenClaw. DAG-basierte Zusammenfassung von
Konversationen mit inkrementeller Compaction — bewahrt die vollständige Kontexttreue
und reduziert gleichzeitig die Token-Nutzung.

- **npm:** `@martian-engineering/lossless-claw`
- **Repository:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie Agent-Verhalten,
Kosten, Tokens, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **Repository:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agent einen Live2D-Avatar mit Echtzeit-Lippensynchronisation,
Emotionsausdrücken und Text-to-Speech. Enthält Creator-Tools für KI-Asset-Generierung
und Ein-Klick-Deployment in den Prometheus Marketplace. Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **Repository:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats, Gruppen-
Erwähnungen, Kanalnachrichten und Rich Media einschließlich Sprache, Bilder, Videos
und Dateien.

Aktuelle OpenClaw-Releases bündeln QQ Bot. Verwenden Sie die gebündelte Einrichtung in
[QQ Bot](/de/channels/qqbot) für normale Installationen; installieren Sie dieses externe Plugin nur,
wenn Sie ausdrücklich das eigenständige, von Tencent gepflegte Paket verwenden möchten.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **Repository:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Kanal-Plugin für OpenClaw vom Tencent WeCom-Team. Basierend auf
persistenten WeCom Bot-WebSocket-Verbindungen unterstützt es Direktnachrichten und Gruppen-
Chats, Streaming-Antworten, proaktives Messaging, Bild-/Dateiverarbeitung, Markdown-
Formatierung, integrierte Zugriffskontrolle sowie Dokument-/Meeting-/Messaging-Skills.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **Repository:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Yuanbao-Kanal-Plugin für OpenClaw vom Tencent Yuanbao-Team. Basierend auf
persistenten WebSocket-Verbindungen unterstützt es Direktnachrichten und Gruppen-Chats,
Streaming-Antworten, proaktives Messaging, Bild-/Datei-/Audio-/Videoverarbeitung,
Markdown-Formatierung, integrierte Zugriffskontrolle und Slash-Command-Menüs.

- **npm:** `openclaw-plugin-yuanbao`
- **Repository:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Ihr Plugin einreichen

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher zu betreiben sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie auf [ClawHub](/de/tools/clawhub), es sei denn, Sie benötigen ausdrücklich
    eine reine npm-Distribution.
    Siehe [Plugins erstellen](/de/plugins/building-plugins) für die vollständige Anleitung.

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation und einem Issue-
    Tracker liegen.

  </Step>

  <Step title="Dokumentations-PRs nur für Änderungen an Quelldokumenten verwenden">
    Sie benötigen keinen Dokumentations-PR, nur um Ihr Plugin auffindbar zu machen. Veröffentlichen Sie es
    stattdessen auf ClawHub.

    Öffnen Sie einen Dokumentations-PR nur, wenn die Quelldokumentation von OpenClaw eine tatsächliche inhaltliche
    Änderung benötigt, etwa zur Korrektur von Installationshinweisen oder zum Hinzufügen von Cross-Repo-
    Dokumentation, die in die Hauptdokumentation gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                    | Warum                                             |
| ------------------------------ | ------------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen funktionierendes `openclaw plugins install` |
| Öffentliches GitHub-Repository | Quellcode-Review, Issue-Tracking, Transparenz     |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie es konfiguriert wird |
| Aktive Wartung                 | Aktuelle Updates oder reaktionsschnelle Issue-Bearbeitung |

Wrapper mit geringem Aufwand, unklare Zuständigkeit oder nicht gepflegte Pakete können abgelehnt werden.

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin) — wie Sie ein beliebiges Plugin installieren
- [Plugins erstellen](/de/plugins/building-plugins) — erstellen Sie Ihr eigenes
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
