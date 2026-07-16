---
read_when:
    - Uitleg over wat ClawHub is
    - Skills of plugins zoeken, installeren of bijwerken
    - Skills of plugins publiceren in het register
    - Kiezen tussen de CLI-processen van OpenClaw en ClawHub
sidebarTitle: ClawHub
summary: Openbaar ClawHub-overzicht voor ontdekken, installeren, publiceren, beveiliging en de clawhub-CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T15:20:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub is het openbare register voor OpenClaw-skills en -plugins.

- Gebruik ingebouwde `openclaw`-opdrachten om skills te zoeken, installeren en bij te werken en om plugins vanuit ClawHub te installeren.
- Gebruik de afzonderlijke `clawhub`-CLI voor registerauthenticatie, publicatie en workflows voor verwijderen/herstellen.

Website: [clawhub.ai](https://clawhub.ai)

## Snel aan de slag

Zoek en installeer skills met OpenClaw:

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

Installeer de ClawHub-CLI wanneer je met registerauthenticatie beveiligde workflows wilt gebruiken, zoals
publiceren of verwijderen/herstellen:

```bash
npm i -g clawhub
# of
pnpm add -g clawhub
```

## Wat ClawHub host

| Onderdeel      | Wat het opslaat                                              | Gebruikelijke opdracht                        |
| -------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Skills         | Geversioneerde tekstbundels met `SKILL.md` en ondersteunende bestanden | `openclaw skills install @openclaw/demo`     |
| Codeplugins    | OpenClaw-pluginpakketten met compatibiliteitsmetadata        | `openclaw plugins install clawhub:<package>` |
| Bundelplugins  | Verpakte pluginbundels voor distributie met OpenClaw         | `clawhub package publish <source>`           |

ClawHub houdt semver-versies, tags zoals `latest`, wijzigingslogboeken, bestanden,
downloads, sterren en samenvattingen van beveiligingsscans bij. Openbare pagina's tonen de huidige registerstatus,
zodat gebruikers een skill of plugin kunnen bekijken voordat ze deze installeren.

## Ingebouwde OpenClaw-workflows

Ingebouwde OpenClaw-opdrachten installeren in de actieve OpenClaw-werkruimte en bewaren
bronmetadata, zodat latere updateopdrachten ClawHub kunnen blijven gebruiken.

Gebruik `clawhub:<package>` wanneer een plugininstallatie via ClawHub moet worden afgehandeld.
Kale npm-veilige pluginspecificaties kunnen tijdens overgangsperioden bij releases via npm worden afgehandeld, en
`npm:<package>` blijft uitsluitend voor npm wanneer een bron expliciet moet zijn.

Plugininstallaties valideren de opgegeven compatibiliteit met `pluginApi` en `minGatewayVersion`
voordat de archiefinstallatie wordt uitgevoerd. Wanneer een pakketversie een
ClawPack-artefact publiceert, geeft OpenClaw de voorkeur aan het exact geüploade npm-pack-`.tgz`, verifieert het
de ClawHub-digestheader en gedownloade bytes en registreert het artefactmetadata voor
latere updates.

## ClawHub-CLI

De ClawHub-CLI is bedoeld voor werk met registerauthenticatie:

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

De CLI heeft ook opdrachten voor het installeren en bijwerken van skills voor rechtstreekse registerworkflows:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Deze opdrachten installeren skills in `./skills` onder de huidige werkmap
en registreren geïnstalleerde versies in `.clawhub/lock.json`.

## Publiceren

Publiceer skills vanuit een lokale map met `SKILL.md`:

```bash
clawhub skill publish <path>
```

Veelgebruikte publicatieopties:

- `--slug <slug>`: URL-naam van de gepubliceerde skill.
- `--name <name>`: weergavenaam.
- `--version <version>`: semver-versie.
- `--changelog <text>`: tekst voor het wijzigingslogboek.
- `--tags <tags>`: door komma's gescheiden tags, standaard `latest`.

Publiceer plugins vanuit een lokale map, `owner/repo`, `owner/repo@ref` of een GitHub-
URL:

```bash
clawhub package publish <source>
```

Gebruik `--dry-run` om het exacte publicatieplan samen te stellen zonder te uploaden, en `--json`
voor CI-vriendelijke uitvoer.

Codeplugins moeten de vereiste OpenClaw-compatibiliteitsmetadata bevatten in
`package.json`, waaronder `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`. Zie [CLI](/nl/clawhub/cli) voor de volledige
opdrachtenreferentie en [Skill-indeling](/clawhub/skill-format) voor skillmetadata.

## Beveiliging en moderatie

ClawHub is standaard open: iedereen kan uploaden, maar voor publicatie is een GitHub-
account vereist dat oud genoeg is om door de uploadcontrole te komen. Openbare detailpagina's vatten vóór
installatie of download de nieuwste scanstatus samen.

ClawHub voert geautomatiseerde controles uit op gepubliceerde skills en pluginreleases. Releases die na een scan zijn
vastgehouden of geblokkeerd, kunnen van de openbare catalogus- en installatieonderdelen verdwijnen, terwijl
ze voor hun eigenaar zichtbaar blijven in `/dashboard`.

Ingelogde gebruikers kunnen skills en pakketten rapporteren. Moderators kunnen meldingen beoordelen,
inhoud verbergen of herstellen en accounts die misbruik maken blokkeren. Zie
[Beveiliging](/nl/clawhub/security),
[Beveiligingsaudits](/clawhub/security-audits),
[Moderatie en accountveiligheid](/clawhub/moderation) en
[Aanvaardbaar gebruik](/clawhub/acceptable-usage) voor details over beleid en handhaving.

## Telemetrie en omgeving

Wanneer je `clawhub install` uitvoert terwijl je bent ingelogd, kan de CLI naar beste vermogen
een installatiegebeurtenis verzenden, zodat ClawHub geaggregeerde installatieaantallen kan berekenen. Schakel dit uit met:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nuttige omgevingsoverschrijvingen:

| Variabele                     | Effect                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Overschrijf de website-URL die voor browseraanmelding wordt gebruikt. |
| `CLAWHUB_REGISTRY`            | Overschrijf de URL van de register-API.           |
| `CLAWHUB_CONFIG_PATH`         | Overschrijf waar de CLI token-/configuratiestatus opslaat. |
| `CLAWHUB_WORKDIR`             | Overschrijf de standaardwerkmap.                  |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Schakel installatietelemetrie uit.                |

Zie [Telemetrie](/clawhub/telemetry), [HTTP-API](/clawhub/http-api) en
[Probleemoplossing](/nl/clawhub/troubleshooting) voor uitgebreider referentiemateriaal.
