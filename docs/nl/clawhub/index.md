---
read_when:
    - Uitleg over wat ClawHub is
    - Skills of plugins zoeken, installeren of bijwerken
    - Skills of Plugins publiceren in het register
    - Kiezen tussen de openclaw- en clawhub-CLI-werkwijzen
sidebarTitle: ClawHub
summary: Openbaar ClawHub-overzicht voor ontdekking, installatie, publiceren, beveiliging en de clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub is het openbare register voor OpenClaw Skills en plugins.

- Gebruik native `openclaw`-opdrachten om Skills te zoeken, te installeren en bij te werken, en om plugins vanuit ClawHub te installeren.
- Gebruik de afzonderlijke `clawhub` CLI voor registerauthenticatie, publiceren, verwijderen/herstellen, opnieuw scannen en synchronisatieworkflows.

Site: [clawhub.ai](https://clawhub.ai)

## Snel aan de slag

Zoek en installeer Skills met OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Zoek en installeer plugins met OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installeer de ClawHub CLI wanneer je register-geauthenticeerde workflows wilt gebruiken, zoals
publiceren, synchroniseren, verwijderen/herstellen of door de eigenaar aangevraagde nieuwe scans:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Wat ClawHub host

| Oppervlak      | Wat het opslaat                                             | Typische opdracht                            |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Geversioneerde tekstbundels met `SKILL.md` plus ondersteunende bestanden | `openclaw skills install <slug>`             |
| Code-plugins   | OpenClaw-pluginpakketten met compatibiliteitsmetadata        | `openclaw plugins install clawhub:<package>` |
| Bundelplugins  | Verpakte pluginbundels voor OpenClaw-distributie             | `clawhub package publish <source>`           |
| Souls          | `SOUL.md`-bundels die op onlycrabs.ai worden getoond         | Publicatiestromen via web en API             |

ClawHub houdt semver-versies, tags zoals `latest`, changelogs, bestanden,
downloads, sterren en samenvattingen van beveiligingsscans bij. Openbare pagina's tonen de huidige registerstatus,
zodat gebruikers een Skill of plugin kunnen inspecteren voordat ze die installeren.

## Native OpenClaw-stromen

Native OpenClaw-opdrachten installeren in de actieve OpenClaw-werkruimte en bewaren
bronmetadata, zodat latere updateopdrachten op ClawHub kunnen blijven.

Gebruik `clawhub:<package>` wanneer een plugininstallatie via ClawHub moet worden opgelost.
Kale npm-veilige pluginspecificaties kunnen tijdens lanceringsoverschakelingen via npm worden opgelost, en
`npm:<package>` blijft alleen npm wanneer een bron expliciet moet zijn.

Plugininstallaties valideren de geadverteerde compatibiliteit van `pluginApi` en `minGatewayVersion`
voordat de archiefinstallatie wordt uitgevoerd. Wanneer een pakketversie een
ClawPack-artefact publiceert, geeft OpenClaw de voorkeur aan de exact geüploade npm-pack `.tgz`, verifieert
de ClawHub-digestheader en gedownloade bytes, en registreert artefactmetadata voor
latere updates.

## ClawHub CLI

De ClawHub CLI is bedoeld voor register-geauthenticeerd werk:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

De CLI heeft ook opdrachten voor het installeren/bijwerken van Skills voor directe registerworkflows:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Die opdrachten installeren Skills in `./skills` onder de huidige werkdirectory
en registreren geïnstalleerde versies in `.clawhub/lock.json`.

## Publiceren

Publiceer Skills vanuit een lokale map die `SKILL.md` bevat:

```bash
clawhub skill publish <path>
```

Veelgebruikte publicatieopties:

- `--slug <slug>`: Skill-slug.
- `--name <name>`: weergavenaam.
- `--version <version>`: semver-versie.
- `--changelog <text>`: changelogtekst.
- `--tags <tags>`: kommagescheiden tags, standaard ingesteld op `latest`.

Publiceer plugins vanuit een lokale map, `owner/repo`, `owner/repo@ref` of een GitHub-
URL:

```bash
clawhub package publish <source>
```

Gebruik `--dry-run` om het exacte publicatieplan te bouwen zonder te uploaden, en `--json`
voor CI-vriendelijke uitvoer.

Code-plugins moeten de vereiste OpenClaw-compatibiliteitsmetadata bevatten in
`package.json`, inclusief `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`. Zie [CLI](/nl/clawhub/cli) voor de volledige opdrachtreferentie
en [Skill-indeling](/nl/clawhub/skill-format) voor Skill-metadata.

## Beveiliging en moderatie

ClawHub is standaard open: iedereen kan uploaden, maar publiceren vereist een GitHub-
account dat oud genoeg is om door de uploadpoort te komen. Openbare detailpagina's vatten de
nieuwste scanstatus samen vóór installatie of download.

ClawHub voert automatische controles uit op gepubliceerde Skills en pluginreleases. Releases die door scans worden tegengehouden
of geblokkeerd, kunnen uit de openbare catalogus en installatieoppervlakken verdwijnen, terwijl
ze zichtbaar blijven voor hun eigenaar in `/dashboard`.

Eigenaars kunnen beperkte nieuwe scans aanvragen voor herstel bij fout-positieven. Platform-
moderators en beheerders kunnen nieuwe scans aanvragen voor elke Skill of elk pakket bij het afhandelen
van supportmeldingen:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Aangemelde gebruikers kunnen Skills en pakketten rapporteren. Moderators kunnen rapporten beoordelen,
inhoud verbergen of herstellen, bezwaren afhandelen en misbruikende accounts blokkeren. Zie
[Acceptabel gebruik](/nl/clawhub/acceptable-usage) en
[Beveiliging + moderatie](/nl/clawhub/security) voor beleids- en handhavingsdetails.

## Telemetrie en omgeving

Wanneer je `clawhub sync` uitvoert terwijl je bent ingelogd, verzendt de CLI een minimale momentopname zodat
ClawHub installatieaantallen kan berekenen. Schakel dit uit met:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nuttige omgevingsoverschrijvingen:

| Variabele                     | Effect                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Overschrijf de site-URL die voor browserlogin wordt gebruikt. |
| `CLAWHUB_REGISTRY`            | Overschrijf de URL van de register-API.           |
| `CLAWHUB_CONFIG_PATH`         | Overschrijf waar de CLI token-/configuratiestatus opslaat. |
| `CLAWHUB_WORKDIR`             | Overschrijf de standaard werkdirectory.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Schakel telemetrie uit bij `sync`.                |

Zie [Telemetrie](/nl/clawhub/telemetry), [HTTP API](/nl/clawhub/http-api) en
[Probleemoplossing](/nl/clawhub/troubleshooting) voor uitgebreider referentiemateriaal.
