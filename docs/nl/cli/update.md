---
read_when:
    - Je wilt een broncode-checkout veilig bijwerken
    - Je moet het gedrag van de verkorte notatie `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + Gateway automatisch herstarten)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-02T20:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable-/beta-/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
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

- `--no-restart`: sla het opnieuw starten van de Gateway-service over na een geslaagde update. Package-manager-updates die de Gateway wel opnieuw starten, verifiëren dat de opnieuw gestarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; wordt opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het package-doel alleen voor deze update. Voor package-installaties wordt `main` gekoppeld aan `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk geplande updateacties vooraf (kanaal/tag/doel/herstart-flow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer npm-plugin-artefactdrift wordt
  gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging van een downgrade).

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
na het bijwerken opnieuw moet worden gestart (standaard wordt opnieuw gestart). Als je `dev` selecteert zonder git-checkout,
biedt dit aan er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanaf npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane-`update.run` package-manager-updates
forceren een niet-uitgestelde updateherstart zonder cooldown na de package-wissel,
omdat het oude Gateway-proces nog chunks in het geheugen kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-manager-installaties lost `openclaw update` de doelpackageversie op
voordat de package manager wordt aangeroepen. npm globale installaties gebruiken een staged
install: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventaris en wisselt vervolgens die schone package-tree in de
echte globale prefix. Als verificatie mislukt, worden post-update doctor, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte tree. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale package-installatie,
en voert daarna pluginsynchronisatie, een core-command completion-verversing en herstartwerk uit. Dit
houdt verpakte sidecars en kanaalbeheerde pluginrecords afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige plugin-command completion-rebuilds worden overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en opnieuw starten is ingeschakeld,
stoppen package-manager-updates de draaiende service voordat de package-tree wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, starten de
service opnieuw en verifiëren dat de opnieuw gestarte Gateway de verwachte versie rapporteert. Met
`--no-restart` wordt packagevervanging nog steeds uitgevoerd, maar de beheerde service wordt niet
gestopt of opnieuw gestart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je
deze handmatig opnieuw start.

## Git-checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag, bouw daarna en voer doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, fetch daarna en rebase.

### Updatestappen

<Steps>
  <Step title="Verify clean worktree">
    Vereist geen niet-gecommitte wijzigingen.
  </Step>
  <Step title="Switch channel">
    Schakelt over naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Fetch upstream">
    Alleen dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Install dependencies">
    Gebruikt de package manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna een tijdelijke `npm install pnpm@10`-fallback) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Build Control UI">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` wordt uitgevoerd als laatste veilige-updatecontrole.
  </Step>
  <Step title="Sync plugins">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt bijgehouden plugin-installaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen bijgehouden npm- en ClawHub-plugin-installaties die de
default/latest-lijn volgen eerst een plugin-`@beta`-release. Als de plugin geen
beta-release heeft, valt OpenClaw terug op de vastgelegde default/latest-spec. Exacte
versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact vastgepinde npm-plugin-update wordt opgelost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die plugin-artefactupdate af in plaats van deze te installeren. Installeer of update de plugin alleen expliciet opnieuw nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Mislukte pluginsynchronisatie na de update laat het updateresultaat mislukken en stopt vervolgwerk voor opnieuw starten. Los de plugin-installatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is plugin laden alleen verificatie: startup voert geen package managers uit en muteert geen dependency-trees. Package-manager-`update.run`-herstarts omzeilen de normale idle-uitstel en herstart-cooldown nadat de package-tree is gewisseld, zodat het oude proces geen verwijderde chunks lazy kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-shorthand

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Development channels](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
