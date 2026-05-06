---
read_when:
    - Je wilt een checkout van de broncode veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - Je moet het gedrag van de verkorte notatie `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatisch herstarten van Gateway)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-06T17:54:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable-/beta-/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, zonder git-metadata),
verlopen updates via de package-manager-flow in [Bijwerken](/nl/install/updating).

## Gebruik

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opties

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Package-manager-updates die de Gateway wel herstarten, controleren of de herstarte service de verwachte bijgewerkte versie meldt voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in config).
- `--tag <dist-tag|version|spec>`: overschrijf het package-doel alleen voor deze update. Voor package-installaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk een voorbeeld van geplande updateacties (kanaal/tag/doel/herstart-flow) zonder config te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.warnings` wanneer beschadigde of niet-laadbare beheerde plugins
  reparatie nodig hebben nadat de core-update is geslaagd, en `postUpdate.plugins.integrityDrifts`
  wanneer drift in npm-pluginartefacten wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld downgradebevestiging).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om de
geplande kanaal-/tag-/installatie-/herstartacties te bekijken, `--json` voor
machineleesbare resultaten, en `openclaw update status --json` wanneer je alleen
kanaal- en beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een
update debugt, staan console-uitvoer en bestandslogniveau los van elkaar:
Gateway `--verbose` beïnvloedt terminal-/WebSocket-uitvoer, terwijl bestandslogs
`logging.level: "debug"` of `"trace"` in config vereisen. Zie
[Gateway-logging](/nl/gateway/logging).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn muterende `openclaw update`-runs uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-input voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
</Note>

<Warning>
Downgrades vereisen bevestiging omdat oudere versies configuratie kunnen breken.
</Warning>

## `update status`

Toon het actieve updatekanaal + git-tag/branch/SHA (voor source-checkouts), plus updatebeschikbaarheid.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opties:

- `--json`: druk machineleesbare status-JSON af.
- `--timeout <seconds>`: timeout voor controles (standaard 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken moet worden herstart (standaard wordt herstart). Als je `dev`
selecteert zonder git-checkout, wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt die bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De core-auto-updater van de Gateway (wanneer ingeschakeld via config) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run` package-manager-updates
forceren een niet-uitgestelde updateherstart zonder cooldown na de package-wissel,
omdat het oude Gateway-proces nog chunks in het geheugen kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-manager-installaties bepaalt `openclaw update` de doelpackageversie
voordat de package-manager wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de meegeleverde `dist`-inventaris, en wisselt vervolgens die schone package-tree in de
echte globale prefix. Als verificatie faalt, worden post-update doctor, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte tree. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale package-installatie,
en voert daarna pluginsynchronisatie, een core-command completion-verversing en herstartwerk uit. Dit
houdt meegeleverde sidecars en kanaalbeheerde pluginrecords afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige herbouw van plugin-command completion wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-manager-updates de draaiende service voordat de package-tree wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en controleren of de herstarte Gateway de verwachte versie meldt voordat
succes wordt gemeld. Op macOS controleert de post-update-check ook of de LaunchAgent
is geladen/draait voor het actieve profiel en of de geconfigureerde loopback-poort
gezond is. Als de plist is geïnstalleerd maar launchd deze niet beheert, bootstrapt OpenClaw
de LaunchAgent automatisch opnieuw, en voert daarna de
gezondheids-/versie-/kanaal-gereedheidscontroles opnieuw uit. Een verse bootstrap laadt de RunAtLoad
job direct, zodat updateherstel de nieuw gestarte Gateway niet meteen met
`kickstart -k` aanstuurt. Als de Gateway nog steeds niet gezond wordt, sluit de opdracht
af met een niet-nulstatus en drukt het pad naar het herstartlog plus expliciete instructies
voor herstarten, opnieuw installeren en package-rollback af. Met `--no-restart`
wordt packagevervanging nog steeds uitgevoerd, maar de beheerde service wordt niet gestopt of
herstart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig herstart.

## Git-checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag, bouw daarna en voer doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, fetch daarna en rebase.

### Updatestappen

<Steps>
  <Step title="Schone worktree verifiëren">
    Vereist dat er geen niet-gecommitte wijzigingen zijn.
  </Step>
  <Step title="Kanaal wisselen">
    Wisselt naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste buildbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriële modus omdat updatehosts van gebruikers vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase">
    Rebaset naar de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de package-manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke `npm install pnpm@10`-fallback) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als de laatste veilige updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins met het actieve kanaal. Dev gebruikt meegeleverde plugins; stable en beta gebruiken npm. Werkt gevolgde plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-plugininstallaties die de
default/latest-lijn volgen eerst een plugin-`@beta`-release. Als de plugin geen
beta-release heeft, valt OpenClaw terug op de geregistreerde default/latest-spec. Voor npm-
plugins valt OpenClaw ook terug wanneer het beta-package bestaat maar installatievalidatie faalt.
Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact gepinde npm-pluginupdate verwijst naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Installeer de plugin pas opnieuw of werk deze pas expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Fouten bij pluginsynchronisatie na de update die beperkt zijn tot een beheerde plugin, worden als waarschuwingen gemeld nadat de core-update is geslaagd. Het JSON-resultaat houdt de update `status: "ok"` op topniveau en meldt `postUpdate.plugins.status: "warning"` met begeleiding voor `openclaw doctor --fix` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds falen. Los de plugininstallatie- of updatefout op, en voer daarna `openclaw doctor --fix` of `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is pluginladen alleen verificatie: startup voert geen package-managers uit en muteert geen dependency-trees. Package-manager `update.run`-herstarts omzeilen de normale idle-uitstelperiode en herstart-cooldown nadat de package-tree is gewisseld, zodat het oude proces geen verwijderde chunks lazy kan blijven laden.

Als pnpm-bootstrap nog steeds faalt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-afkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om update eerst uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
