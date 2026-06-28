---
read_when:
    - Uitleg over wat ClawHub is
    - Zoeken naar, installeren of bijwerken van Skills of plugins
    - Skills of Plugins publiceren naar het register
    - Kiezen tussen openclaw- en clawhub-CLI-flows
sidebarTitle: ClawHub
summary: Openbaar ClawHub-overzicht voor ontdekking, installatie, publicatie, beveiliging en de clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T05:07:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub is het openbare register voor OpenClaw Skills en plugins.

- Gebruik native `openclaw`-opdrachten om Skills te zoeken, installeren en bijwerken, en om plugins vanuit ClawHub te installeren.
- Gebruik de afzonderlijke `clawhub` CLI voor registerauthenticatie, publiceren en workflows voor verwijderen/herstellen.

Site: [clawhub.ai](https://clawhub.ai)

## Snelstart

Zoek en installeer Skills met OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Zoek en installeer plugins met OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installeer de ClawHub CLI wanneer je registergeauthenticeerde workflows wilt, zoals
publiceren of verwijderen/herstellen:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Wat ClawHub host

| Oppervlak      | Wat het opslaat                                             | Typische opdracht                            |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Geversioneerde tekstbundels met `SKILL.md` plus ondersteunende bestanden | `openclaw skills install @openclaw/demo`     |
| Codeplugins    | OpenClaw-pluginpakketten met compatibiliteitsmetadata        | `openclaw plugins install clawhub:<package>` |
| Bundelplugins  | Verpakte pluginbundels voor OpenClaw-distributie             | `clawhub package publish <source>`           |

ClawHub houdt semver-versies, tags zoals `latest`, changelogs, bestanden,
downloads, sterren en samenvattingen van beveiligingsscans bij. Openbare pagina's tonen de huidige registerstatus,
zodat gebruikers een Skill of plugin kunnen inspecteren voordat ze die installeren.

## Native OpenClaw-flows

Native OpenClaw-opdrachten installeren in de actieve OpenClaw-werkruimte en bewaren
bronmetadata, zodat latere updateopdrachten op ClawHub kunnen blijven.

Gebruik `clawhub:<package>` wanneer een plugininstallatie via ClawHub moet worden opgelost.
Kale npm-veilige pluginspecificaties kunnen tijdens lanceringsoverschakelingen via npm worden opgelost, en
`npm:<package>` blijft alleen npm wanneer een bron expliciet moet zijn.

Plugininstallaties valideren geadverteerde compatibiliteit voor `pluginApi` en `minGatewayVersion`
voordat de archiefinstallatie wordt uitgevoerd. Wanneer een pakketversie een
ClawPack-artefact publiceert, geeft OpenClaw de voorkeur aan de exacte geüploade npm-pack `.tgz`, verifieert het
de ClawHub-digestheader en gedownloade bytes, en registreert het artefactmetadata voor
latere updates.

## ClawHub CLI

De ClawHub CLI is bedoeld voor registergeauthenticeerd werk:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

De CLI heeft ook opdrachten voor het installeren/bijwerken van Skills voor directe registerworkflows:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Die opdrachten installeren Skills in `./skills` onder de huidige werkmap
en registreren geïnstalleerde versies in `.clawhub/lock.json`.

## Publiceren

Publiceer Skills vanuit een lokale map die `SKILL.md` bevat:

```bash
clawhub skill publish <path>
```

Veelgebruikte publicatieopties:

- `--slug <slug>`: gepubliceerde Skill-URL-naam.
- `--name <name>`: weergavenaam.
- `--version <version>`: semver-versie.
- `--changelog <text>`: changelogtekst.
- `--tags <tags>`: door komma's gescheiden tags, standaard `latest`.

Publiceer plugins vanuit een lokale map, `owner/repo`, `owner/repo@ref`, of een GitHub-
URL:

```bash
clawhub package publish <source>
```

Gebruik `--dry-run` om het exacte publicatieplan te bouwen zonder te uploaden, en `--json`
voor CI-vriendelijke uitvoer.

Codeplugins moeten de vereiste OpenClaw-compatibiliteitsmetadata in
`package.json` bevatten, waaronder `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`. Zie [CLI](/nl/clawhub/cli) voor de volledige opdrachtreferentie
en [Skill-indeling](/nl/clawhub/skill-format) voor Skill-metadata.

## Beveiliging en moderatie

ClawHub is standaard open: iedereen kan uploaden, maar publiceren vereist een GitHub-
account dat oud genoeg is om door de uploadpoort te komen. Openbare detailpagina's vatten de
nieuwste scanstatus samen vóór installatie of download.

ClawHub voert geautomatiseerde controles uit op gepubliceerde Skills en pluginreleases. Releases die door scans worden vastgehouden
of geblokkeerd zijn, kunnen verdwijnen uit openbare catalogus- en installatieoppervlakken, terwijl ze
zichtbaar blijven voor hun eigenaar in `/dashboard`.

Ingelogde gebruikers kunnen Skills en pakketten rapporteren. Moderators kunnen rapporten beoordelen,
inhoud verbergen of herstellen, en misbruikaccounts blokkeren. Zie
[Beveiliging](/nl/clawhub/security),
[Beveiligingsaudits](/nl/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation), en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage) voor details over beleid en handhaving.

## Telemetrie en omgeving

Wanneer je `clawhub install` uitvoert terwijl je bent ingelogd, kan de CLI op best-effortbasis een
installatiegebeurtenis versturen, zodat ClawHub geaggregeerde installatieaantallen kan berekenen. Schakel dit uit met:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nuttige omgevingsoverschrijvingen:

| Variabele                     | Effect                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Overschrijf de site-URL die wordt gebruikt voor browserlogin. |
| `CLAWHUB_REGISTRY`            | Overschrijf de register-API-URL.                  |
| `CLAWHUB_CONFIG_PATH`         | Overschrijf waar de CLI token-/configuratiestatus opslaat. |
| `CLAWHUB_WORKDIR`             | Overschrijf de standaardwerkmap.                  |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Schakel installatietelemetrie uit.                |

Zie [Telemetrie](/nl/clawhub/telemetry), [HTTP-API](/nl/clawhub/http-api), en
[Probleemoplossing](/nl/clawhub/troubleshooting) voor uitgebreider referentiemateriaal.
