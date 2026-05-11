---
read_when:
    - U wilt een broncode-checkout veilig bijwerken
    - U debugt uitvoer of opties van `openclaw update`
    - Je moet het verkortingsgedrag van `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-11T20:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable/beta/dev-kanalen.

Als je hebt geinstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
gebeuren updates via de package-manager-flow in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Package-manager-updates die de Gateway wel herstarten, controleren of de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het packagedoel alleen voor deze update. Voor package-installaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk geplande updateacties vooraf (channel/tag/target/restart-flow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: print machineleesbare `UpdateRunResult`-JSON, inclusief
  `postUpdate.plugins.warnings` wanneer corrupte of niet-laadbare beheerde plugins
  reparatie nodig hebben nadat de core-update is geslaagd, fallbackdetails voor
  plugins in het betakanaal wanneer een plugin geen betarelease heeft, en
  `postUpdate.plugins.integrityDrifts` wanneer npm-pluginartefactdrift wordt
  gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld downgradebevestiging).

`openclaw update` heeft geen `--verbose`-flag. Gebruik `--dry-run` om de
geplande channel/tag/install/restart-acties vooraf te bekijken, `--json` voor
machineleesbare resultaten, en `openclaw update status --json` wanneer je alleen
kanaal- en beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een
update debugt, staan console-uitgebreidheid en bestandslogniveau los van elkaar:
Gateway `--verbose` beinvloedt terminal-/WebSocket-uitvoer, terwijl
bestandslogs `logging.level: "debug"` of `"trace"` in de configuratie vereisen.
Zie [Gateway-logboekregistratie](/nl/gateway/logging).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn muterende `openclaw update`-runs uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-input voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
</Note>

<Warning>
Downgrades vereisen bevestiging omdat oudere versies configuratie kunnen breken.
</Warning>

## `update status`

Toon het actieve updatekanaal + git-tag/branch/SHA (voor source checkouts), plus updatebeschikbaarheid.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opties:

- `--json`: print machineleesbare status-JSON.
- `--timeout <seconds>`: timeout voor controles (standaard 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken opnieuw moet worden gestart (standaard wordt opnieuw gestart). Als je `dev` selecteert zonder git checkout, wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode op een lijn:

- `dev` → zorgt voor een git checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stabiele release.

De auto-updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run` package-manager-updates
forceren een niet-uitgestelde updateherstart zonder cooldown na de packagewissel,
omdat het oude Gateway-proces mogelijk nog in-memory chunks heeft die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-manager-installaties lost `openclaw update` de doelpackageversie op
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een
gefaseerde installatie: OpenClaw installeert het nieuwe package in een tijdelijke
npm-prefix, controleert daar de verpakte `dist`-inventaris en wisselt vervolgens
die schone package-tree in de echte globale prefix. Als de verificatie mislukt,
worden doctor na de update, pluginsynchronisatie en herstartwerk niet uitgevoerd
vanuit de verdachte tree. Zelfs wanneer de geinstalleerde versie al overeenkomt
met het doel, ververst de opdracht de globale package-installatie en voert daarna
pluginsynchronisatie, een core-command-completionverversing en herstartwerk uit.
Dit houdt verpakte sidecars en kanaaleigen pluginrecords afgestemd op de
geinstalleerde OpenClaw-build, terwijl volledige herbouw van plugin-command-completions
wordt overgelaten aan expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geinstalleerd en herstarten is ingeschakeld,
stoppen package-manager-updates de actieve service voordat de package-tree wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en controleren of de herstarte Gateway de verwachte versie rapporteert voordat
succes wordt gemeld. Op macOS controleert de post-updatecontrole ook of de LaunchAgent
voor het actieve profiel is geladen/actief is en of de geconfigureerde loopbackpoort
gezond is. Als de plist is geinstalleerd maar launchd deze niet superviseert, bootstrapt
OpenClaw de LaunchAgent automatisch opnieuw en voert daarna opnieuw de
health/version/channel-gereedheidscontroles uit. Een verse bootstrap laadt de RunAtLoad-job
direct, dus updateherstel voert niet meteen `kickstart -k` uit op de nieuw
gestarte Gateway. Als de Gateway nog steeds niet gezond wordt, sluit de opdracht af
met een niet-nulcode en print het pad naar het herstartlog plus expliciete instructies
voor herstarten, opnieuw installeren en package-rollback. Met `--no-restart`
wordt de packagevervanging nog steeds uitgevoerd, maar de beheerde service wordt
niet gestopt of herstart, waardoor de actieve Gateway oude code kan blijven gebruiken
totdat je deze handmatig herstart.

## Git checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, haal daarna op en rebase.

### Updatestappen

<Steps>
  <Step title="Schone worktree verifiëren">
    Vereist geen niet-gecommitte wijzigingen.
  </Step>
  <Step title="Kanaal wisselen">
    Wisselt naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste buildbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriele modus omdat updatehosts van gebruikers vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase">
    Rebaset naar de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de package manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke fallback `npm install pnpm@11`) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` draait als laatste safe-updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt gevolgde plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-plugininstallaties die de
standaard-/latest-lijn volgen eerst een plugin-`@beta`-release. Als de plugin geen
betarelease heeft, valt OpenClaw terug op de geregistreerde standaard-/latest-specificatie
en rapporteert dat als waarschuwing. Voor npm-plugins valt OpenClaw ook terug wanneer het
betapackage bestaat maar installvalidatie mislukt. Deze pluginfallbackwaarschuwingen laten
de core-update niet mislukken. Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exacte vastgezette npm-pluginupdate resolveert naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Installeer of werk de plugin alleen expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Pluginsynchronisatiefouten na de update die beperkt zijn tot een beheerde plugin worden als waarschuwingen gerapporteerd nadat de core-update is geslaagd. Het JSON-resultaat houdt de top-level update `status: "ok"` en rapporteert `postUpdate.plugins.status: "warning"` met begeleiding voor `openclaw doctor --fix` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds mislukken. Los de plugininstallatie- of updatefout op en voer daarna opnieuw `openclaw doctor --fix` of `openclaw update` uit.

Wanneer de bijgewerkte Gateway start, is het laden van plugins alleen ter verificatie: opstarten voert geen package managers uit en muteert geen dependency trees. Package-manager `update.run`-herstarts omzeilen de normale idle-uitstelling en herstartcooldown nadat de package-tree is gewisseld, zodat het oude proces geen verwijderde chunks lui kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
