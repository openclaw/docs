---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder auflisten
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-05-10T19:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Drittanbieterpakete, die OpenClaw um neue
Kanäle, Werkzeuge, Provider oder andere Fähigkeiten erweitern. Sie werden von
der Community entwickelt und gepflegt, üblicherweise auf [ClawHub](/de/clawhub)
veröffentlicht und mit einem einzigen Befehl installiert. Npm bleibt der
Startstandard für reine Paketangaben, während ClawHub-Paketinstallationen
ausgerollt werden.

ClawHub ist die kanonische Discovery-Oberfläche für Community-Plugins. Öffnen
Sie keine reinen Dokumentations-PRs, nur um Ihr Plugin hier zur Auffindbarkeit
hinzuzufügen; veröffentlichen Sie es stattdessen auf ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Verwenden Sie `openclaw plugins install <package-name>` für auf npm gehostete Pakete.

## Aufgeführte Plugins

### Apify

Extrahieren Sie Daten von jeder Website mit über 20.000 einsatzbereiten Scrapern. Lassen Sie Ihren Agenten
Daten aus Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, E-Commerce-Websites und mehr extrahieren — einfach per Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **Repository:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Codex App Server-Unterhaltungen. Binden Sie einen Chat an
einen Codex-Thread, sprechen Sie mit ihm in Klartext und steuern Sie ihn mit chatnativen
Befehlen für Fortsetzen, Planung, Review, Modellauswahl, Compaction und mehr.

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
Gesprächszusammenfassung mit inkrementeller Compaction — erhält die vollständige Kontexttreue
und reduziert gleichzeitig den Tokenverbrauch.

- **npm:** `@martian-engineering/lossless-claw`
- **Repository:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agenten-Traces nach Opik exportiert. Überwachen Sie Agentenverhalten,
Kosten, Token, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **Repository:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agenten einen Live2D-Avatar mit Echtzeit-Lippensynchronisation, Emotionsausdrücken
und Text-to-Speech. Enthält Creator-Werkzeuge für KI-Asset-Generierung
und One-Click-Deployment zum Prometheus Marketplace. Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **Repository:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats, Gruppen-
Erwähnungen, Kanalnachrichten und Rich Media einschließlich Sprache, Bildern, Videos
und Dateien.

Aktuelle OpenClaw-Releases bündeln QQ Bot. Verwenden Sie für normale Installationen die gebündelte Einrichtung in
[QQ Bot](/de/channels/qqbot); installieren Sie dieses externe Plugin nur,
wenn Sie bewusst das von Tencent gepflegte Standalone-Paket verwenden möchten.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **Repository:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Kanal-Plugin für OpenClaw vom Tencent WeCom-Team. Basierend auf
persistenten WeCom Bot WebSocket-Verbindungen unterstützt es Direktnachrichten und Gruppen-
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
    Veröffentlichen Sie auf [ClawHub](/de/clawhub), sofern Sie nicht ausdrücklich eine npm-only-
    Distribution benötigen.
    Siehe [Plugins erstellen](/de/plugins/building-plugins) für die vollständige Anleitung.

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss sich in einem öffentlichen Repository mit Einrichtungsdokumentation und einem Issue-
    Tracker befinden.

  </Step>

  <Step title="Dokumentations-PRs nur für Änderungen an Quelldokumentation verwenden">
    Sie benötigen keinen Dokumentations-PR, nur um Ihr Plugin auffindbar zu machen. Veröffentlichen Sie es
    stattdessen auf ClawHub.

    Öffnen Sie einen Dokumentations-PR nur, wenn die Quelldokumentation von OpenClaw eine tatsächliche Inhalts-
    Änderung benötigt, etwa zur Korrektur von Installationshinweisen oder zum Hinzufügen Repository-übergreifender
    Dokumentation, die in den Hauptdokumentationssatz gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                 | Warum                                           |
| --------------------------- | --------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen funktionierendes `openclaw plugins install` |
| Öffentliches GitHub-Repository          | Quellcode-Review, Issue-Tracking, Transparenz   |
| Einrichtungs- und Nutzungsdokumentation        | Benutzer müssen wissen, wie sie es konfigurieren        |
| Aktive Wartung          | Aktuelle Updates oder reaktionsschnelle Issue-Bearbeitung   |

Wrapper mit geringem Aufwand, unklare Zuständigkeit oder ungepflegte Pakete können abgelehnt werden.

## Verwandte Themen

- [Plugins installieren und konfigurieren](/de/tools/plugin) — So installieren Sie beliebige Plugins
- [Plugins erstellen](/de/plugins/building-plugins) — Erstellen Sie Ihre eigenen
- [Plugin-Manifest](/de/plugins/manifest) — Manifestschema
