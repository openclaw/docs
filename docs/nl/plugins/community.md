---
read_when:
    - Je wilt OpenClaw-plugins van derden vinden
    - Je wilt je eigen Plugin publiceren of vermelden
summary: 'Door de community onderhouden OpenClaw-plugins: bekijken, installeren en je eigen plugin indienen'
title: Communityplugins
x-i18n:
    generated_at: "2026-04-30T09:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Communityplugins zijn pakketten van derden die OpenClaw uitbreiden met nieuwe
kanalen, tools, providers of andere mogelijkheden. Ze worden gebouwd en onderhouden
door de community, meestal gepubliceerd op [ClawHub](/nl/tools/clawhub), en zijn
installeerbaar met een enkele opdracht. npm blijft een ondersteunde fallback voor
pakketten die nog niet naar ClawHub zijn verhuisd.

ClawHub is het canonieke ontdekkingsoppervlak voor communityplugins. Open geen
PR's die alleen docs wijzigen om je plugin hier toe te voegen voor vindbaarheid;
publiceer hem in plaats daarvan op ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw controleert eerst ClawHub en valt automatisch terug op npm.

## Vermelde plugins

### Apify

Scrape gegevens van elke website met meer dan 20.000 kant-en-klare scrapers. Laat je agent
gegevens extraheren uit Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, e-commercesites en meer — gewoon door erom te vragen.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Onafhankelijke OpenClaw-bridge voor gesprekken met Codex App Server. Koppel een chat aan
een Codex-thread, communiceer ermee met platte tekst en bestuur hem met chatnative
opdrachten voor hervatten, plannen, review, modelselectie, Compaction en meer.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Enterprise-robotintegratie met Stream-modus. Ondersteunt tekst-, afbeeldings- en
bestandsberichten via elke DingTalk-client.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless Context Management-plugin voor OpenClaw. DAG-gebaseerde gesprekssamenvatting
met incrementele Compaction — behoudt volledige contextgetrouwheid terwijl
het tokengebruik wordt verminderd.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Officiële plugin die agenttraces naar Opik exporteert. Monitor agentgedrag,
kosten, tokens, fouten en meer.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geef je OpenClaw-agent een Live2D-avatar met realtime lipsynchronisatie, emotie-
expressies en tekst-naar-spraak. Bevat creatortools voor het genereren van AI-assets
en implementatie met één klik naar de Prometheus Marketplace. Momenteel in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbind OpenClaw met QQ via de QQ Bot API. Ondersteunt privéchats, groeps-
vermeldingen, kanaalberichten en rich media, waaronder spraak, afbeeldingen, video's
en bestanden.

Huidige OpenClaw-releases bundelen QQ Bot. Gebruik de gebundelde configuratie in
[QQ Bot](/nl/channels/qqbot) voor normale installaties; installeer deze externe plugin alleen
wanneer je bewust het zelfstandige pakket wilt dat door Tencent wordt onderhouden.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-kanaalplugin voor OpenClaw door het Tencent WeCom-team. Aangedreven door
permanente WeCom Bot WebSocket-verbindingen ondersteunt hij directe berichten en groeps-
chats, streaming-antwoorden, proactieve berichten, verwerking van afbeeldingen/bestanden, Markdown-
opmaak, ingebouwde toegangscontrole en document-/vergader-/berichtenvaardigheden.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Yuanbao-kanaalplugin voor OpenClaw door het Tencent Yuanbao-team. Aangedreven door
permanente WebSocket-verbindingen ondersteunt hij directe berichten en groepschats,
streaming-antwoorden, proactieve berichten, verwerking van afbeeldingen/bestanden/audio/video,
Markdown-opmaak, ingebouwde toegangscontrole en slash-command-menu's.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Dien je plugin in

We verwelkomen communityplugins die nuttig, gedocumenteerd en veilig te gebruiken zijn.

<Steps>
  <Step title="Publiceer op ClawHub of npm">
    Je plugin moet installeerbaar zijn via `openclaw plugins install \<package-name\>`.
    Publiceer op [ClawHub](/nl/tools/clawhub), tenzij je specifiek distributie
    alleen via npm nodig hebt.
    Zie [Plugins bouwen](/nl/plugins/building-plugins) voor de volledige gids.

  </Step>

  <Step title="Host op GitHub">
    Broncode moet in een openbare repository staan met configuratiedocumentatie en een issue-
    tracker.

  </Step>

  <Step title="Gebruik docs-PR's alleen voor wijzigingen aan brondocumentatie">
    Je hebt geen docs-PR nodig alleen om je plugin vindbaar te maken. Publiceer hem
    in plaats daarvan op ClawHub.

    Open alleen een docs-PR wanneer de brondocumentatie van OpenClaw een daadwerkelijke inhoudelijke
    wijziging nodig heeft, zoals het corrigeren van installatieadvies of het toevoegen van cross-repo-
    documentatie die in de hoofddocumentatieset thuishoort.

  </Step>
</Steps>

## Kwaliteitslat

| Vereiste                    | Waarom                                       |
| --------------------------- | --------------------------------------------- |
| Gepubliceerd op ClawHub of npm | Gebruikers hebben nodig dat `openclaw plugins install` werkt |
| Openbare GitHub-repo        | Bronreview, issuetracking, transparantie      |
| Configuratie- en gebruiksdocumentatie | Gebruikers moeten weten hoe ze hem configureren |
| Actief onderhoud            | Recente updates of responsieve issueafhandeling |

Wrappers met weinig inspanning, onduidelijk eigenaarschap of niet-onderhouden pakketten kunnen worden afgewezen.

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin) — hoe je elke plugin installeert
- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Plugin Manifest](/nl/plugins/manifest) — manifestschema
