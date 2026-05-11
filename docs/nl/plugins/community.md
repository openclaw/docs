---
read_when:
    - Je wilt OpenClaw-plugins van derden vinden
    - Je wilt je eigen Plugin publiceren of vermelden
summary: 'Door de community onderhouden OpenClaw-plugins: bekijk, installeer en dien je eigen plugin in'
title: Communityplugins
x-i18n:
    generated_at: "2026-05-11T20:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Community plugins zijn pakketten van derden die OpenClaw uitbreiden met nieuwe
kanalen, tools, providers of andere mogelijkheden. Ze worden gebouwd en onderhouden
door de community, meestal gepubliceerd op [ClawHub](/nl/clawhub), en zijn te installeren
met één opdracht. Npm blijft de startstandaard voor kale pakketspecificaties
terwijl ClawHub-packinstallaties worden uitgerold.

ClawHub is de canonieke ontdekkingsplek voor community plugins. Open geen
docs-only PR's alleen om je plugin hier toe te voegen voor vindbaarheid; publiceer deze in plaats daarvan op
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Gebruik `openclaw plugins install <package-name>` voor npm-gehoste pakketten.

## Vermelde plugins

### Apify

Scrape gegevens van elke website met 20.000+ kant-en-klare scrapers. Laat je agent
gegevens extraheren uit Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, e-commercesites en meer — gewoon door het te vragen.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Onafhankelijke OpenClaw-bridge voor Codex App Server-gesprekken. Koppel een chat aan
een Codex-thread, praat ermee met platte tekst en bedien deze met chat-native
opdrachten voor hervatten, plannen, reviewen, modelselectie, Compaction en meer.

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

Lossless Context Management-plugin voor OpenClaw. DAG-gebaseerde
gesprekssamenvatting met incrementele Compaction — behoudt volledige contextgetrouwheid
terwijl tokengebruik wordt verminderd.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Officiële plugin die agent-traces naar Opik exporteert. Monitor agentgedrag,
kosten, tokens, fouten en meer.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geef je OpenClaw-agent een Live2D-avatar met realtime lipsynchronisatie, emotie-
expressies en tekst-naar-spraak. Bevat creator-tools voor AI-assetgeneratie
en implementatie met één klik naar de Prometheus Marketplace. Momenteel in alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbind OpenClaw met QQ via de QQ Bot API. Ondersteunt privéchats, groeps-
vermeldingen, kanaalberichten en rich media, waaronder spraak, afbeeldingen, video's
en bestanden.

Huidige OpenClaw-releases bundelen QQ Bot. Gebruik de gebundelde setup in
[QQ Bot](/nl/channels/qqbot) voor normale installaties; installeer deze externe plugin alleen
wanneer je bewust het zelfstandige pakket van Tencent wilt.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-kanaalplugin voor OpenClaw door het Tencent WeCom-team. Aangedreven door
persistente WeCom Bot WebSocket-verbindingen ondersteunt deze directe berichten en groeps-
chats, streamingantwoorden, proactieve berichten, verwerking van afbeeldingen/bestanden, Markdown-
opmaak, ingebouwde toegangscontrole en document-/vergader-/berichtenvaardigheden.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Yuanbao-kanaalplugin voor OpenClaw door het Tencent Yuanbao-team. Aangedreven door
persistente WebSocket-verbindingen ondersteunt deze directe berichten en groepschats,
streamingantwoorden, proactieve berichten, verwerking van afbeeldingen/bestanden/audio/video,
Markdown-opmaak, ingebouwde toegangscontrole en slash-command-menu's.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Dien je plugin in

We verwelkomen community plugins die nuttig, gedocumenteerd en veilig te gebruiken zijn.

<Steps>
  <Step title="Publiceer op ClawHub of npm">
    Je plugin moet installeerbaar zijn via `openclaw plugins install \<package-name\>`.
    Publiceer op [ClawHub](/nl/clawhub), tenzij je specifiek npm-only
    distributie nodig hebt.
    Zie [Plugins bouwen](/nl/plugins/building-plugins) voor de volledige gids.

  </Step>

  <Step title="Host op GitHub">
    Broncode moet in een openbare repository staan met setupdocumentatie en een issue-
    tracker.

  </Step>

  <Step title="Gebruik docs-PR's alleen voor wijzigingen aan brondocumentatie">
    Je hebt geen docs-PR nodig alleen om je plugin vindbaar te maken. Publiceer deze
    in plaats daarvan op ClawHub.

    Open alleen een docs-PR wanneer de brondocumentatie van OpenClaw een daadwerkelijke inhoudelijke
    wijziging nodig heeft, zoals het corrigeren van installatierichtlijnen of het toevoegen van cross-repo-
    documentatie die in de hoofdset met docs thuishoort.

  </Step>
</Steps>

## Kwaliteitslat

| Vereiste                    | Waarom                                        |
| --------------------------- | --------------------------------------------- |
| Gepubliceerd op ClawHub of npm | Gebruikers hebben werkende `openclaw plugins install` nodig |
| Openbare GitHub-repo        | Bronreview, issue-tracking, transparantie     |
| Setup- en gebruiksdocumentatie | Gebruikers moeten weten hoe ze deze configureren |
| Actief onderhoud            | Recente updates of responsieve issue-afhandeling |

Wrappers met weinig inspanning, onduidelijk eigenaarschap of niet-onderhouden pakketten kunnen worden afgewezen.

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin) — hoe je elke plugin installeert
- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Pluginmanifest](/nl/plugins/manifest) — manifestschema
