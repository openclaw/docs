---
read_when:
    - Sie möchten Drittanbieter-Plugins für OpenClaw finden
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder eintragen
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-05-02T20:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Drittanbieterpakete, die OpenClaw um neue
Kanäle, Tools, Provider oder andere Funktionen erweitern. Sie werden von der
Community erstellt und gepflegt, üblicherweise auf [ClawHub](/de/tools/clawhub)
veröffentlicht und lassen sich mit einem einzigen Befehl installieren. npm bleibt
der Startstandard für reine Paketspezifikationen, während ClawHub-Pack-Installationen
ausgerollt werden.

ClawHub ist die maßgebliche Oberfläche zum Entdecken von Community-Plugins. Öffnen
Sie keine reinen Dokumentations-PRs, nur um Ihr Plugin hier zur besseren
Auffindbarkeit einzutragen; veröffentlichen Sie es stattdessen auf ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Verwenden Sie `openclaw plugins install <package-name>` für auf npm gehostete Pakete.

## Aufgelistete Plugins

### Apify

Scrapen Sie Daten von jeder Website mit mehr als 20.000 einsatzbereiten Scrapern.
Lassen Sie Ihren Agent Daten aus Instagram, Facebook, TikTok, YouTube, Google
Maps, Google Search, E-Commerce-Websites und mehr extrahieren - einfach per Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **Repository:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Codex App Server-Unterhaltungen. Binden Sie einen
Chat an einen Codex-Thread, kommunizieren Sie mit einfachem Text damit und steuern
Sie ihn mit chat-nativen Befehlen für Fortsetzen, Planung, Review, Modellauswahl,
Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **Repository:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Enterprise-Roboterintegration im Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **Repository:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless-Context-Management-Plugin für OpenClaw. DAG-basierte
Unterhaltungszusammenfassung mit inkrementeller Compaction - bewahrt die volle
Kontexttreue und reduziert zugleich die Token-Nutzung.

- **npm:** `@martian-engineering/lossless-claw`
- **Repository:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie
Agent-Verhalten, Kosten, Token, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **Repository:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agent einen Live2D-Avatar mit Lippensynchronisation in
Echtzeit, Emotionsausdrücken und Text-to-Speech. Enthält Creator-Tools für die
KI-Asset-Generierung und One-Click-Deployment in den Prometheus Marketplace.
Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **Repository:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats,
Gruppenerwähnungen, Kanalnachrichten und Rich Media einschließlich Sprache,
Bildern, Videos und Dateien.

Aktuelle OpenClaw-Versionen bündeln QQ Bot. Verwenden Sie für normale
Installationen die gebündelte Einrichtung unter [QQ Bot](/de/channels/qqbot);
installieren Sie dieses externe Plugin nur, wenn Sie ausdrücklich das von
Tencent gepflegte eigenständige Paket verwenden möchten.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **Repository:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Kanal-Plugin für OpenClaw vom Tencent WeCom-Team. Basierend auf
persistenten WeCom Bot WebSocket-Verbindungen unterstützt es Direktnachrichten
und Gruppenchats, Streaming-Antworten, proaktive Nachrichten, Bild-/Dateiverarbeitung,
Markdown-Formatierung, integrierte Zugriffskontrolle sowie Dokument-/Meeting-/
Messaging-Skills.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **Repository:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Yuanbao-Kanal-Plugin für OpenClaw vom Tencent Yuanbao-Team. Basierend auf
persistenten WebSocket-Verbindungen unterstützt es Direktnachrichten und
Gruppenchats, Streaming-Antworten, proaktive Nachrichten, Bild-/Datei-/Audio-/
Videoverarbeitung, Markdown-Formatierung, integrierte Zugriffskontrolle und
Slash-Command-Menüs.

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
    Veröffentlichen Sie es auf [ClawHub](/de/tools/clawhub), sofern Sie nicht ausdrücklich
    eine reine npm-Distribution benötigen.
    Den vollständigen Leitfaden finden Sie unter [Plugins erstellen](/de/plugins/building-plugins).

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation
    und Issue-Tracker liegen.

  </Step>

  <Step title="Dokumentations-PRs nur für Änderungen an Quelldokumentation verwenden">
    Sie benötigen keinen Dokumentations-PR, nur um Ihr Plugin auffindbar zu machen.
    Veröffentlichen Sie es stattdessen auf ClawHub.

    Öffnen Sie einen Dokumentations-PR nur, wenn die Quelldokumentation von OpenClaw
    eine tatsächliche Inhaltsänderung benötigt, etwa eine Korrektur der
    Installationsanleitung oder das Hinzufügen von repositoryübergreifender
    Dokumentation, die in die Hauptdokumentation gehört.

  </Step>
</Steps>

## Qualitätsanforderungen

| Anforderung                         | Warum                                              |
| ----------------------------------- | -------------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen funktionierendes `openclaw plugins install` |
| Öffentliches GitHub-Repository      | Quellcode-Review, Issue-Tracking, Transparenz      |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren |
| Aktive Wartung                      | Aktuelle Updates oder reaktionsschneller Umgang mit Issues |

Wrapper mit geringem Aufwand, unklare Zuständigkeit oder ungepflegte Pakete können abgelehnt werden.

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin) - wie Sie ein beliebiges Plugin installieren
- [Plugins erstellen](/de/plugins/building-plugins) - erstellen Sie Ihr eigenes
- [Plugin Manifest](/de/plugins/manifest) - Manifest-Schema
