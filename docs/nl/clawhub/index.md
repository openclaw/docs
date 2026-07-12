---
read_when:
    - Uitleg over wat ClawHub is
    - Skills of plugins zoeken, installeren of bijwerken
    - Skills of plugins publiceren in het register
    - Kiezen tussen CLI-processen van OpenClaw en ClawHub
sidebarTitle: ClawHub
summary: Openbaar ClawHub-overzicht voor het ontdekken, installeren, publiceren, beveiligen en de clawhub-CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T08:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub is het openbare register voor OpenClaw-Skills en -plugins.

- Gebruik ingebouwde `openclaw`-opdrachten om Skills te zoeken, installeren en bij te werken en om plugins vanuit ClawHub te installeren.
- Gebruik de afzonderlijke `clawhub`-CLI voor registerauthenticatie, publicatie en workflows voor verwijderen/herstellen.

Website: [clawhub.ai](https://clawhub.ai)

## Snel aan de slag

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

Installeer de ClawHub-CLI wanneer u registergeauthenticeerde workflows wilt gebruiken, zoals
publiceren of verwijderen/herstellen:

```bash
npm i -g clawhub
# of
pnpm add -g clawhub
```

## Wat ClawHub host

| Oppervlak      | Wat het opslaat                                             | Gebruikelijke opdracht                        |
| -------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Skills         | Tekstbundels met versies, met `SKILL.md` en ondersteunende bestanden | `openclaw skills install @openclaw/demo`     |
| Codeplugins    | OpenClaw-pluginpakketten met compatibiliteitsmetadata       | `openclaw plugins install clawhub:<package>` |
| Bundelplugins  | Verpakte pluginbundels voor distributie van OpenClaw        | `clawhub package publish <source>`           |

ClawHub houdt semver-versies, tags zoals `latest`, wijzigingslogboeken, bestanden,
downloads, sterren en samenvattingen van beveiligingsscans bij. Openbare pagina's tonen de huidige registerstatus,
zodat gebruikers een Skill of plugin kunnen inspecteren voordat ze deze installeren.

## Ingebouwde OpenClaw-workflows

Ingebouwde OpenClaw-opdrachten installeren in de actieve OpenClaw-werkruimte en slaan
bronmetadata permanent op, zodat latere opdrachten voor bijwerken ClawHub kunnen blijven gebruiken.

Gebruik `clawhub:<package>` wanneer de installatie van een plugin via ClawHub moet worden afgehandeld.
Kale npm-veilige pluginspecificaties kunnen tijdens overgangsperiodes bij de lancering via npm worden afgehandeld, en
`npm:<package>` blijft uitsluitend npm gebruiken wanneer de bron expliciet moet zijn.

Bij plugininstallaties wordt de geadverteerde compatibiliteit met `pluginApi` en `minGatewayVersion`
gevalideerd voordat de archiefinstallatie wordt uitgevoerd. Wanneer voor een pakketversie een
ClawPack-artefact wordt gepubliceerd, geeft OpenClaw de voorkeur aan het exact geüploade npm-pack-bestand `.tgz`, verifieert het
de digest-header van ClawHub en de gedownloade bytes, en registreert het artefactmetadata voor
latere updates.

## ClawHub-CLI

De ClawHub-CLI is bedoeld voor registergeauthenticeerde werkzaamheden:

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

De CLI heeft ook opdrachten voor het installeren en bijwerken van Skills voor rechtstreekse registerworkflows:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Deze opdrachten installeren Skills in `./skills` onder de huidige werkmap
en registreren geïnstalleerde versies in `.clawhub/lock.json`.

## Publiceren

Publiceer Skills vanuit een lokale map die `SKILL.md` bevat:

```bash
clawhub skill publish <path>
```

Veelgebruikte publicatieopties:

- `--slug <slug>`: URL-naam van de gepubliceerde Skill.
- `--name <name>`: weergavenaam.
- `--version <version>`: semver-versie.
- `--changelog <text>`: tekst van het wijzigingslogboek.
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
`openclaw.build.openclawVersion`. Zie [CLI](/nl/clawhub/cli) voor het volledige opdrachtoverzicht
en [Skill-indeling](/clawhub/skill-format) voor Skill-metadata.

## Beveiliging en moderatie

ClawHub is standaard open: iedereen kan uploaden, maar voor publicatie is een GitHub-
account vereist dat oud genoeg is om de uploadcontrole te doorstaan. Openbare detailpagina's vatten vóór
installatie of downloaden de meest recente scanstatus samen.

ClawHub voert geautomatiseerde controles uit op gepubliceerde Skills en pluginreleases. Releases die wegens een scan zijn tegengehouden
of geblokkeerd, kunnen uit de openbare catalogus en installatieoppervlakken verdwijnen, terwijl
ze voor hun eigenaar zichtbaar blijven in `/dashboard`.

Aangemelde gebruikers kunnen Skills en pakketten rapporteren. Moderators kunnen meldingen beoordelen,
inhoud verbergen of herstellen en accounts met misbruikgedrag blokkeren. Zie
[Beveiliging](/clawhub/security),
[Beveiligingsaudits](/nl/clawhub/security-audits),
[Moderatie en accountveiligheid](/clawhub/moderation) en
[Aanvaardbaar gebruik](/clawhub/acceptable-usage) voor details over beleid en handhaving.

## Telemetrie en omgeving

Wanneer u `clawhub install` uitvoert terwijl u bent aangemeld, kan de CLI naar beste vermogen
een installatiegebeurtenis verzenden, zodat ClawHub geaggregeerde installatieaantallen kan berekenen. Schakel dit uit met:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nuttige omgevingsoverschrijvingen:

| Variabele                     | Effect                                              |
| ----------------------------- | --------------------------------------------------- |
| `CLAWHUB_SITE`                | Overschrijf de website-URL voor aanmelding via de browser. |
| `CLAWHUB_REGISTRY`            | Overschrijf de URL van de register-API.             |
| `CLAWHUB_CONFIG_PATH`         | Overschrijf waar de CLI de token-/configuratiestatus opslaat. |
| `CLAWHUB_WORKDIR`             | Overschrijf de standaardwerkmap.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Schakel installatietelemetrie uit.                  |

Zie [Telemetrie](/nl/clawhub/telemetry), [HTTP-API](/clawhub/http-api) en
[Probleemoplossing](/clawhub/troubleshooting) voor uitgebreider referentiemateriaal.
