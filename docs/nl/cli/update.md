---
read_when:
    - Je wilt een broncheckout veilig bijwerken
    - Je debugt `openclaw update`-uitvoer of opties
    - Je moet begrijpen hoe de verkorte notatie `--update` werkt
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-07T13:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en schakel tussen stable-/beta-/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata), verlopen updates via de package-managerflow in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het opnieuw starten van de Gateway-service over na een geslaagde update. Package-managerupdates die de Gateway wel opnieuw starten, controleren of de opnieuw gestarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; blijft bewaard in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het packagedoel alleen voor deze update. Voor package-installaties wordt `main` toegewezen aan `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk een voorbeeld van geplande updateacties (kanaal/tag/doel/herstartflow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.warnings` wanneer beschadigde of niet-laadbare beheerde plugins
  reparatie nodig hebben nadat de kernupdate is geslaagd, en `postUpdate.plugins.integrityDrifts`
  wanneer npm-pluginartefactdrift wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: time-out per stap (standaard is 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging van een downgrade).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om een voorbeeld te bekijken
van de geplande kanaal-/tag-/installatie-/herstartacties, `--json` voor machineleesbare
resultaten, en `openclaw update status --json` wanneer je alleen kanaal- en
beschikbaarheidsdetails nodig hebt. Als je Gateway-logboeken rond een update debugt,
staan console-uitgebreidheid en het logniveau van bestanden los van elkaar: Gateway `--verbose` beïnvloedt
terminal-/WebSocket-uitvoer, terwijl bestandslogboeken `logging.level: "debug"` of
`"trace"` in de configuratie vereisen. Zie [Gateway-logboekregistratie](/nl/gateway/logging).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn muterende `openclaw update`-runs uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-invoer voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
</Note>

<Warning>
Downgrades vereisen bevestiging omdat oudere versies de configuratie kunnen breken.
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
- `--timeout <seconds>`: time-out voor controles (standaard is 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken opnieuw moet worden gestart (standaard wordt opnieuw gestart). Als je `dev` selecteert zonder git-checkout, biedt deze
aan om er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijf met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanaf npm met `latest`.
- `beta` → geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-kern (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run` package-managerupdates
forceren een niet-uitgestelde, cooldownvrije updateherstart na de packagewissel,
omdat het oude Gateway-proces nog in-memory chunks kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-managerinstallaties lost `openclaw update` de doelpackageversie op
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventaris en wisselt die schone packageboom vervolgens in de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte boom. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale package-installatie,
en voert daarna pluginsynchronisatie, een vernieuwing van de voltooiing van kernopdrachten en herstartwerk uit. Dit
houdt verpakte sidecars en kanaalbeheerde pluginrecords afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige herbouw van pluginopdrachtvoltooiing wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-managerupdates de draaiende service voordat de packageboom wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, starten de
service opnieuw en verifiëren dat de opnieuw gestarte Gateway de verwachte versie rapporteert voordat
succes wordt gemeld. Op macOS controleert de post-updatecontrole ook of de LaunchAgent
is geladen/draait voor het actieve profiel en of de geconfigureerde loopbackpoort
gezond is. Als de plist is geïnstalleerd maar launchd deze niet beheert, bootstrapt OpenClaw
de LaunchAgent automatisch opnieuw en voert daarna de
gereedheidscontroles voor gezondheid/versie/kanaal opnieuw uit. Een verse bootstrap laadt de RunAtLoad-
taak direct, waardoor updateherstel de nieuw gestarte
Gateway niet meteen `kickstart -k` geeft. Als de Gateway nog steeds niet gezond wordt, sluit de opdracht af
met een niet-nulcode en drukt het herstartlogpad plus expliciete instructies voor herstart, herinstallatie en
packageterugdraaiing af. Met `--no-restart`
wordt de packagevervanging nog steeds uitgevoerd, maar de beheerde service wordt niet gestopt of
opnieuw gestart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig opnieuw start.

## Git-checkoutflow

### Kanaalselectie

- `stable`: check de nieuwste niet-beta-tag uit, bouw daarna en voer doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: check `main` uit, voer daarna fetch en rebase uit.

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
  <Step title="Preflightbuild (alleen dev)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip mislukt, loopt dit tot 10 commits terug om de nieuwste bouwbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriële modus omdat updatehosts van gebruikers vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase">
    Rebaset naar de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de package manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna een tijdelijke fallback met `npm install pnpm@10`) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` draait als de laatste veilige updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt gevolgde plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-plugininstallaties die de
standaard-/latest-lijn volgen eerst een plugin `@beta`-release. Als de plugin geen
beta-release heeft, valt OpenClaw terug op de vastgelegde standaard-/latest-spec. Voor npm-
plugins valt OpenClaw ook terug wanneer het betapackage bestaat maar installatievalidatie
mislukt. Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact gepinde npm-pluginupdate wordt opgelost naar een artefact waarvan de integriteit verschilt van de opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Herinstalleer of werk de plugin alleen expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Pluginsynchronisatiefouten na de update die beperkt zijn tot een beheerde plugin, worden als waarschuwingen gemeld nadat de kernupdate is geslaagd. Het JSON-resultaat houdt de top-level update `status: "ok"` en rapporteert `postUpdate.plugins.status: "warning"` met begeleiding voor `openclaw doctor --fix` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds mislukken. Los de plugininstallatie- of updatefout op en voer daarna `openclaw doctor --fix` of `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is het laden van plugins alleen verificatie: startup voert geen package managers uit en muteert geen afhankelijkheidsbomen. Package-manager `update.run`-herstarts omzeilen de normale idle-uitstelling en herstart-cooldown nadat de packageboom is gewisseld, zodat het oude proces geen verwijderde chunks lui kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcherscripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
