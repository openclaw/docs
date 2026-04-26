---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden.
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder auflisten.
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-26T11:34:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Community-Plugins sind Pakete von Drittanbietern, die OpenClaw um neue
Channels, Tools, Provider oder andere Fähigkeiten erweitern. Sie werden von der Community entwickelt und gepflegt,
auf [ClawHub](/de/tools/clawhub) oder npm veröffentlicht und
mit einem einzigen Befehl installierbar.

ClawHub ist die kanonische Erkennungsoberfläche für Community-Plugins. Öffnen Sie
keine docs-only PRs, nur um Ihr Plugin hier für die Auffindbarkeit hinzuzufügen; veröffentlichen
Sie es stattdessen auf ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und fällt automatisch auf npm zurück.

## Aufgelistete Plugins

### Apify

Daten von jeder Website mit über 20.000 einsatzbereiten Scrapern extrahieren. Lassen Sie Ihren Agenten
Daten aus Instagram, Facebook, TikTok, YouTube, Google Maps, der Google-
Suche, E-Commerce-Websites und mehr extrahieren — einfach auf Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Codex App Server-Konversationen. Binden Sie einen Chat an
einen Codex-Thread, sprechen Sie mit ihm in Klartext und steuern Sie ihn mit chatnativen
Befehlen für Fortsetzen, Planung, Review, Modellauswahl, Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Enterprise-Roboter-Integration mit Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless Context Management Plugin für OpenClaw. DAG-basierte Konversations-
Zusammenfassung mit inkrementeller Compaction — bewahrt vollständige Kontexttreue
bei gleichzeitiger Reduzierung des Token-Verbrauchs.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie Agent-Verhalten,
Kosten, Tokens, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agenten einen Live2D-Avatar mit Echtzeit-Lippensynchronisation, Emotions-
Ausdrücken und Text-to-Speech. Enthält Creator-Tools für KI-Asset-Generierung
und Ein-Klick-Bereitstellung im Prometheus Marketplace. Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw über die QQ Bot API mit QQ verbinden. Unterstützt private Chats, Gruppen-
Erwähnungen, Channel-Nachrichten und Rich Media einschließlich Sprache, Bildern, Videos
und Dateien.

Aktuelle OpenClaw-Versionen bündeln QQ Bot. Verwenden Sie für normale Installationen das gebündelte Setup in
[QQ Bot](/de/channels/qqbot); installieren Sie dieses externe Plugin nur,
wenn Sie absichtlich das von Tencent gepflegte eigenständige Paket verwenden möchten.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Channel-Plugin für OpenClaw vom Tencent-WeCom-Team. Unterstützt durch
persistente WebSocket-Verbindungen von WeCom Bot werden direkte Nachrichten und Gruppen-
Chats, Streaming-Antworten, proaktives Messaging, Bild-/Dateiverarbeitung, Markdown-
Formatierung, integrierte Zugriffskontrolle und Skills für Dokumente/Meetings/Messaging unterstützt.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Ihr Plugin einreichen

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher zu betreiben sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie es auf [ClawHub](/de/tools/clawhub) (bevorzugt) oder npm.
    Siehe [Building Plugins](/de/plugins/building-plugins) für die vollständige Anleitung.

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation und einem Issue-
    Tracker liegen.

  </Step>

  <Step title="Docs-PRs nur für Änderungen an Source-Dokumentation verwenden">
    Sie brauchen keinen Docs-PR, nur um Ihr Plugin auffindbar zu machen. Veröffentlichen Sie es
    stattdessen auf ClawHub.

    Öffnen Sie einen Docs-PR nur dann, wenn die Source-Dokumentation von OpenClaw eine tatsächliche inhaltliche
    Änderung benötigt, etwa zur Korrektur von Installationshinweisen oder zum Hinzufügen reposübergreifender
    Dokumentation, die in den Haupt-Dokumentationssatz gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                | Warum                                          |
| -------------------------- | ---------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer müssen `openclaw plugins install` verwenden können |
| Öffentliches GitHub-Repo   | Source-Review, Issue-Tracking, Transparenz     |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren |
| Aktive Pflege              | Aktuelle Updates oder reaktionsschnelle Issue-Bearbeitung |

Wenig aufwendige Wrapper, unklare Zuständigkeit oder nicht gepflegte Pakete können abgelehnt werden.

## Verwandt

- [Install and Configure Plugins](/de/tools/plugin) — wie Sie beliebige Plugins installieren
- [Building Plugins](/de/plugins/building-plugins) — eigene erstellen
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
