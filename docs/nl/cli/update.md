---
read_when:
    - Je wilt een broncode-checkout veilig bijwerken
    - U moet het gedrag van de verkorte notatie `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-04-29T22:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stabiele/beta/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
verlopen updates via de package-managerflow in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Package-managerupdates die de Gateway wel herstarten, verifiëren dat de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het packagedoel alleen voor deze update. Voor package-installaties wordt `main` gekoppeld aan `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk geplande updateacties vooraf (kanaal/tag/doel/herstartflow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of te herstarten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer npm Plugin-artefactdrift wordt
  gedetecteerd tijdens de Plugin-synchronisatie na de update.
- `--timeout <seconds>`: time-out per stap (standaard is 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging van downgrade).

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
- `--timeout <seconds>`: time-out voor controles (standaard is 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken moet worden herstart (standaard wordt herstart). Als je `dev` selecteert zonder git-checkout,
biedt deze aan er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stabiele release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) hergebruikt hetzelfde updatepad.

Voor package-managerinstallaties lost `openclaw update` de doelpackageversie op
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventaris en wisselt die schone packageboom vervolgens om met de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, Plugin-synchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte boom. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, vernieuwt de opdracht de globale package-installatie
en voert daarna Plugin-synchronisatie, een refresh van core-opdrachtvoltooiing en herstartwerk uit. Dit
houdt verpakte sidecars en door het kanaal beheerde Plugin-records afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige rebuilds van Plugin-opdrachtvoltooiing worden overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-managerupdates de draaiende service voordat de packageboom wordt vervangen,
vernieuwen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en verifiëren dat de herstarte Gateway de verwachte versie rapporteert. Met
`--no-restart` wordt packagevervanging nog steeds uitgevoerd, maar wordt de beheerde service niet
gestopt of herstart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig herstart.

## Git-checkoutflow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag, bouw daarna en voer doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stabiele tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, fetch daarna en rebase.

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
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt deze tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebaset naar de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de package manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke `npm install pnpm@10`-fallback) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als laatste veilige updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins met het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt via npm geïnstalleerde plugins bij.
  </Step>
</Steps>

<Warning>
Als een exact gepinde npm Plugin-update wordt opgelost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die Plugin-artefactupdate af in plaats van deze te installeren. Installeer of werk de Plugin alleen expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Fouten bij Plugin-synchronisatie na de update laten het updateresultaat mislukken en stoppen vervolgherstartwerk. Los de Plugin-installatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, worden runtime-afhankelijkheden van ingeschakelde gebundelde plugins klaargezet voordat Plugin-activatie plaatsvindt. Door updates getriggerde herstarts laten actieve staging van runtime-afhankelijkheden eerst leeglopen voordat de Gateway wordt gesloten, zodat service-managerherstarts een lopende npm-installatie niet onderbreken.

Als pnpm-bootstrap nog steeds faalt, stopt de updater vroegtijdig met een package-manager-specifieke fout in plaats van `npm run build` te proberen binnen de checkout.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcherscripts).

## Gerelateerd

- `openclaw doctor` (biedt aan eerst update uit te voeren op git-checkouts)
- [Ontwikkelkanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
