---
read_when:
    - U wilt een broncode-checkout veilig bijwerken
    - Je moet het gedrag van de afkorting `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-01T11:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfbbd6e3cd1a83e3700fa248a6ce2cb3adf1c94d0d5491895eea21bfec5d52b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable-/beta-/dev-kanalen.

Als je hebt geinstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
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

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Package-managerupdates die de Gateway wel herstarten, controleren of de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; blijft bewaard in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het package-doel alleen voor deze update. Voor package-installaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk geplande updateacties vooraf (kanaal/tag/doel/herstartflow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer drift in npm-pluginartefacten
  wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging voor downgraden).

<Warning>
Downgrades vereisen bevestiging omdat oudere versies de configuratie kunnen breken.
</Warning>

## `update status`

Toon het actieve updatekanaal + git-tag/branch/SHA (voor bron-checkouts), plus updatebeschikbaarheid.

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
na het bijwerken opnieuw moet worden gestart (standaard wordt opnieuw gestart). Als je `dev` selecteert zonder git-checkout, wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` -> zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` -> installeert vanuit npm met `latest`.
- `beta` -> geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live request handler van de Gateway. Control-plane `update.run` package-managerupdates
forceren een niet-uitgestelde, cooldownloze updateherstart na het verwisselen van het package,
omdat het oude Gateway-proces nog in-memory chunks kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-managerinstallaties lost `openclaw update` de doel-packageversie op
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een staged
install: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventaris en verwisselt daarna die schone package tree met de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte tree. Zelfs wanneer de geinstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale package-installatie
en voert daarna pluginsynchronisatie, een vernieuwing van core-command completion en herstartwerk uit. Dit
houdt verpakte sidecars en kanaal-eigen pluginrecords afgestemd op de
geinstalleerde OpenClaw-build, terwijl volledige herbouw van plugin-command completion wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geinstalleerd en herstarten is ingeschakeld,
stoppen package-managerupdates de draaiende service voordat de package
tree wordt vervangen; daarna worden de servicemetadata vernieuwd vanuit de bijgewerkte installatie, wordt de
service opnieuw gestart en wordt geverifieerd dat de herstarte Gateway de verwachte versie rapporteert. Met
`--no-restart` wordt het package nog steeds vervangen, maar de beheerde service wordt niet
gestopt of opnieuw gestart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig opnieuw start.

## Git-checkoutflow

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
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebaset naar de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de package manager van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke fallback `npm install pnpm@10`) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als de laatste veilige updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt via npm geinstalleerde plugins bij.
  </Step>
</Steps>

<Warning>
Als een exact vastgezette npm-pluginupdate wordt opgelost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Herinstalleer of update de plugin alleen expliciet nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Fouten bij pluginsynchronisatie na de update laten het updateresultaat falen en stoppen het daaropvolgende herstartwerk. Los de plugininstallatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, worden ingeschakelde runtime-afhankelijkheden van gebundelde plugins voorbereid voordat pluginactivatie plaatsvindt. Package-manager `update.run`-herstarts omzeilen de normale idle-uitstel en herstartcooldown nadat de package tree is verwisseld, zodat het oude proces niet lazy-loading kan blijven doen van verwijderde chunks. Herstarts via de service manager laten runtime-afhankelijkheidsstaging nog steeds leeg lopen voordat de Gateway wordt gesloten.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcherscripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelkanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
