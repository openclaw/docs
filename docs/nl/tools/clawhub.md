---
read_when:
    - Skills of plugins zoeken, installeren of bijwerken
    - Skills of Plugins publiceren naar het register
    - De clawhub CLI of de omgevingsoverrides ervan configureren
sidebarTitle: ClawHub
summary: 'ClawHub: openbaar register voor OpenClaw-Skills en plugins, native installatiestromen en de clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-29T23:22:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub is het openbare register voor **OpenClaw Skills en plugins**.

- Gebruik native `openclaw`-opdrachten om Skills te zoeken, installeren en bij te werken, en om plugins vanuit ClawHub te installeren.
- Gebruik de afzonderlijke `clawhub` CLI voor registerauthenticatie, publiceren, verwijderen/herstellen en synchronisatieworkflows.

Site: [clawhub.ai](https://clawhub.ai)

## Snel starten

<Steps>
  <Step title="Zoeken">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Installeren">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Gebruiken">
    Start een nieuwe OpenClaw-sessie — die pikt de nieuwe Skill op.
  </Step>
  <Step title="Publiceren (optioneel)">
    Installeer voor registergeauthenticeerde workflows (publiceren, synchroniseren, beheren)
    de afzonderlijke `clawhub` CLI:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Native OpenClaw-flows

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native `openclaw`-opdrachten installeren in je actieve werkruimte en
    bewaren bronmetadata zodat latere `update`-aanroepen op ClawHub kunnen blijven.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Kale npm-veilige Plugin-specificaties worden ook eerst tegen ClawHub geprobeerd, vóór npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Gebruik `npm:<package>` wanneer je alleen npm-resolutie wilt zonder
    ClawHub-lookup:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin-installaties valideren de geadverteerde compatibiliteit van `pluginApi` en
    `minGatewayVersion` voordat de archiefinstallatie wordt uitgevoerd, zodat
    incompatibele hosts vroeg gesloten falen in plaats van het pakket gedeeltelijk
    te installeren.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accepteert alleen installeerbare Plugin-
families. Als een ClawHub-pakket eigenlijk een Skill is, stopt OpenClaw en
wijst het je in plaats daarvan naar `openclaw skills install <slug>`.

Anonieme ClawHub-Plugin-installaties falen ook gesloten voor privé-pakketten.
Community- of andere niet-officiële kanalen kunnen nog steeds installeren, maar OpenClaw
waarschuwt zodat operators bron en verificatie kunnen beoordelen voordat ze
die inschakelen.
</Note>

## Wat ClawHub is

- Een openbaar register voor OpenClaw Skills en plugins.
- Een geversioneerde opslagplaats van Skill-bundels en metadata.
- Een ontdekkingsoppervlak voor zoeken, tags en gebruikssignalen.

Een typische Skill is een geversioneerde bundel bestanden die het volgende bevat:

- Een `SKILL.md`-bestand met de primaire beschrijving en het gebruik.
- Optionele configuraties, scripts of ondersteunende bestanden die door de Skill worden gebruikt.
- Metadata zoals tags, samenvatting en installatievereisten.

ClawHub gebruikt metadata om ontdekking mogelijk te maken en Skill-
mogelijkheden veilig beschikbaar te stellen. Het register houdt gebruikssignalen
(sterren, downloads) bij om rangschikking en zichtbaarheid te verbeteren. Elke publicatie
maakt een nieuwe semver-versie aan, en het register bewaart versiegeschiedenis zodat gebruikers
wijzigingen kunnen controleren.

## Werkruimte en Skill-laden

De afzonderlijke `clawhub` CLI installeert Skills ook in `./skills` onder
je huidige werkmap. Als er een OpenClaw-werkruimte is geconfigureerd,
valt `clawhub` terug op die werkruimte tenzij je `--workdir`
(of `CLAWHUB_WORKDIR`) overschrijft. OpenClaw laadt werkruimte-Skills vanuit
`<workspace>/skills` en pikt ze op in de **volgende** sessie.

Als je al `~/.openclaw/skills` of gebundelde Skills gebruikt, krijgen werkruimte-
Skills voorrang. Zie [Skills](/nl/tools/skills) voor meer details over hoe Skills worden geladen,
gedeeld en gated.

## Servicefuncties

| Functie                  | Opmerkingen                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| Openbaar browsen         | Skills en hun `SKILL.md`-inhoud zijn openbaar zichtbaar.            |
| Zoeken                   | Aangedreven door embeddings (vectorzoeken), niet alleen trefwoorden. |
| Versionering             | Semver, changelogs en tags (inclusief `latest`).                    |
| Downloads                | Zip per versie.                                                     |
| Sterren en opmerkingen   | Communityfeedback.                                                  |
| Samenvattingen van beveiligingsscans | Detailpagina’s tonen de nieuwste scanstatus vóór installatie of download. |
| Detailpagina’s van scanners | VirusTotal-, ClawScan- en statische-analyseresultaten hebben diepe links. |
| Dashboard voor eigenaarsherstel | Uitgevers kunnen gescand vastgehouden eigen inhoud zien via `/dashboard`. |
| Door eigenaar aangevraagde rescans | Eigenaars kunnen beperkte rescans aanvragen voor herstel bij fout-positieven. |
| Moderatie                | Goedkeuringen en audits.                                            |
| CLI-vriendelijke API     | Geschikt voor automatisering en scripting.                          |

## Beveiliging en moderatie

ClawHub is standaard open — iedereen kan Skills uploaden, maar een GitHub-
account moet **minstens één week oud** zijn om te publiceren. Dit vertraagt
misbruik zonder legitieme bijdragers te blokkeren.

<AccordionGroup>
  <Accordion title="Beveiligingsscans">
    ClawHub voert geautomatiseerde beveiligingscontroles uit op gepubliceerde Skills en Plugin-
    releases. Openbare detailpagina’s vatten het huidige resultaat samen, en scanner-
    rijen linken naar speciale detailpagina’s voor VirusTotal, ClawScan en statische
    analyse.

    Door scans vastgehouden of geblokkeerde releases kunnen niet beschikbaar zijn in de openbare catalogus en
    installatieoppervlakken, terwijl ze nog steeds zichtbaar zijn voor hun eigenaar in `/dashboard`.

  </Accordion>
  <Accordion title="Rapporteren">
    - Elke aangemelde gebruiker kan een Skill rapporteren.
    - Redenen voor rapportage zijn verplicht en worden vastgelegd.
    - Elke gebruiker kan maximaal 20 actieve rapporten tegelijk hebben.
    - Skills met meer dan 3 unieke rapporten worden standaard automatisch verborgen.

  </Accordion>
  <Accordion title="Moderatie">
    - Moderators kunnen verborgen Skills bekijken, ze weer zichtbaar maken, ze verwijderen of gebruikers verbannen.
    - Misbruik van de rapportagefunctie kan leiden tot accountverboden.
    - Interesse om moderator te worden? Vraag het in de OpenClaw Discord en neem contact op met een moderator of maintainer.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Je hebt dit alleen nodig voor registergeauthenticeerde workflows zoals
publiceren/synchroniseren.

### Globale opties

<ParamField path="--workdir <dir>" type="string">
  Werkmap. Standaard: huidige map; valt terug op OpenClaw-werkruimte.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills-map, relatief ten opzichte van workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Basis-URL van site (browserlogin).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Basis-URL van register-API.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Schakel prompts uit (niet-interactief).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Druk CLI-versie af.
</ParamField>

### Opdrachten

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Loginopties:

    - `--token <token>` — plak een API-token.
    - `--label <label>` — label dat wordt opgeslagen voor browserlogin-tokens (standaard: `CLI token`).
    - `--no-browser` — open geen browser (vereist `--token`).

  </Accordion>
  <Accordion title="Zoeken">
    ```bash
    clawhub search "query"
    ```

    Zoekt Skills. Gebruik `clawhub package explore` voor Plugin-/pakketontdekking.

    - `--limit <n>` — maximaal aantal resultaten.

  </Accordion>
  <Accordion title="Plugins bekijken / inspecteren">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` en `package inspect` zijn de ClawHub CLI-oppervlakken voor Plugin-/pakketontdekking en metadata-inspectie. Native OpenClaw-installaties gebruiken nog steeds `openclaw plugins install clawhub:<package>`.

    Opties:

    - `--family skill|code-plugin|bundle-plugin` — filter pakketfamilie.
    - `--official` — toon alleen officiële pakketten.
    - `--executes-code` — toon alleen pakketten die code uitvoeren.
    - `--version <version>` / `--tag <tag>` — inspecteer een specifieke pakketversie.
    - `--versions`, `--files`, `--file <path>` — inspecteer pakketgeschiedenis en bestanden.
    - `--json` — machineleesbare uitvoer.

  </Accordion>
  <Accordion title="Installeren / bijwerken / weergeven">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opties:

    - `--version <version>` — installeer of werk bij naar een specifieke versie (alleen één slug bij `update`).
    - `--force` — overschrijf als de map al bestaat, of wanneer lokale bestanden met geen enkele gepubliceerde versie overeenkomen.
    - `clawhub list` leest `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Skills publiceren">
    ```bash
    clawhub skill publish <path>
    ```

    Opties:

    - `--slug <slug>` — Skill-slug.
    - `--name <name>` — weergavenaam.
    - `--version <version>` — semver-versie.
    - `--changelog <text>` — changelogtekst (kan leeg zijn).
    - `--tags <tags>` — kommagescheiden tags (standaard: `latest`).

  </Accordion>
  <Accordion title="Plugins publiceren">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` kan een lokale map, `owner/repo`, `owner/repo@ref` of een
    GitHub-URL zijn.

    Opties:

    - `--dry-run` — bouw het exacte publicatieplan zonder iets te uploaden.
    - `--json` — geef machineleesbare uitvoer voor CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — optionele overschrijvingen wanneer autodetectie niet genoeg is.

  </Accordion>
  <Accordion title="Rescans aanvragen">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Rescan-opdrachten vereisen een ingelogd eigenaarstoken en richten zich op de nieuwste
    gepubliceerde Skill-versie of Plugin-release. Geef bij niet-interactieve runs
    `--yes` door.

    JSON-antwoorden bevatten het doeltype, de naam, versie, rescanstatus en
    resterende/maximale aantallen aanvragen voor die versie of release.

  </Accordion>
  <Accordion title="Verwijderen / herstellen (eigenaar of beheerder)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniseren (lokaal scannen + nieuw of bijgewerkt publiceren)">
    ```bash
    clawhub sync
    ```

    Opties:

    - `--root <dir...>` — extra scanroots.
    - `--all` — upload alles zonder prompts.
    - `--dry-run` — toon wat zou worden geüpload.
    - `--bump <type>` — `patch|minor|major` voor updates (standaard: `patch`).
    - `--changelog <text>` — changelog voor niet-interactieve updates.
    - `--tags <tags>` — kommagescheiden tags (standaard: `latest`).
    - `--concurrency <n>` — registercontroles (standaard: `4`).

  </Accordion>
</AccordionGroup>

## Veelvoorkomende workflows

<Tabs>
  <Tab title="Zoeken">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Een Plugin vinden">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Installeren">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Alles bijwerken">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Een enkele skill publiceren">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Veel skills synchroniseren">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Een Plugin vanaf GitHub publiceren">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadata voor Plugin-pakketten

Codeplugins moeten de vereiste OpenClaw-metadata opnemen in
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Gepubliceerde pakketten moeten **gebouwde JavaScript** meeleveren en
`runtimeExtensions` naar die uitvoer laten verwijzen. Installaties via een Git-checkout kunnen nog steeds terugvallen
op TypeScript-broncode wanneer er geen gebouwde bestanden bestaan, maar gebouwde runtime-
items vermijden runtimecompilatie van TypeScript in opstart-, doctor- en
Plugin-laadpaden.

## Versiebeheer, lockfile en telemetrie

<AccordionGroup>
  <Accordion title="Versiebeheer en tags">
    - Elke publicatie maakt een nieuwe **semver** `SkillVersion`.
    - Tags (zoals `latest`) verwijzen naar een versie; door tags te verplaatsen kun je terugdraaien.
    - Changelogs worden per versie toegevoegd en kunnen leeg zijn bij het synchroniseren of publiceren van updates.

  </Accordion>
  <Accordion title="Lokale wijzigingen versus registryversies">
    Updates vergelijken de lokale skill-inhoud met registryversies met behulp van een
    contenthash. Als lokale bestanden niet overeenkomen met een gepubliceerde versie, vraagt de
    CLI om bevestiging voordat er wordt overschreven (of is `--force` vereist in
    niet-interactieve runs).
  </Accordion>
  <Accordion title="Sync-scans en fallback-hoofdmappen">
    `clawhub sync` scant eerst je huidige werkmap. Als er geen skills worden
    gevonden, valt het terug op bekende legacy-locaties (bijvoorbeeld
    `~/openclaw/skills` en `~/.openclaw/skills`). Dit is ontworpen om
    oudere skill-installaties te vinden zonder extra flags.
  </Accordion>
  <Accordion title="Opslag en lockfile">
    - Geïnstalleerde skills worden vastgelegd in `.clawhub/lock.json` onder je werkmap.
    - Auth-tokens worden opgeslagen in het ClawHub CLI-configuratiebestand (te overschrijven via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetrie (installatieaantallen)">
    Wanneer je `clawhub sync` uitvoert terwijl je bent ingelogd, stuurt de CLI een minimale
    momentopname om installatieaantallen te berekenen. Je kunt dit volledig uitschakelen:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen

| Variabele                     | Effect                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Overschrijf de site-URL.                        |
| `CLAWHUB_REGISTRY`            | Overschrijf de registry-API-URL.                |
| `CLAWHUB_CONFIG_PATH`         | Overschrijf waar de CLI het token/de configuratie opslaat. |
| `CLAWHUB_WORKDIR`             | Overschrijf de standaardwerkmap.                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Schakel telemetrie uit voor `sync`.             |

## Gerelateerd

- [Community-plugins](/nl/plugins/community)
- [Plugins](/nl/tools/plugin)
- [Skills](/nl/tools/skills)
