---
read_when:
    - Je wilt een broncode-checkout veilig bijwerken
    - Je moet begrijpen hoe de verkorte notatie `--update` zich gedraagt
summary: CLI-referentie voor `openclaw update` (relatief veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-02T11:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en schakel tussen stable/beta/dev-kanalen.

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

- `--no-restart`: sla het herstarten van de Gateway-service na een geslaagde update over. Package-manager-updates die de Gateway wel herstarten, controleren of de herstartte service de verwachte bijgewerkte versie meldt voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het package-doel alleen voor deze update. Voor package-installaties wordt `main` gekoppeld aan `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk de geplande updateacties vooraf (kanaal/tag/doel/herstartflow) zonder configuratie te schrijven, te installeren, Plugins te synchroniseren of te herstarten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer npm-Plugin-artefactdrift wordt
  gedetecteerd tijdens synchronisatie van Plugins na de update.
- `--timeout <seconds>`: time-out per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging van downgrades).

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
- `--timeout <seconds>`: time-out voor controles (standaard 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken moet worden herstart (standaard wordt herstart). Als je `dev` selecteert zonder git-checkout,
wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijf met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanaf npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run` package-manager-updates
forceren een niet-uitgestelde updateherstart zonder cooldown na de package-swap,
omdat het oude Gateway-proces nog in-memory chunks kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-manager-installaties bepaalt `openclaw update` de doelpackageversie
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, controleert
daar de verpakte `dist`-inventaris en wisselt daarna die schone package-tree om met de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, Plugin-synchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte tree. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, vernieuwt de opdracht de globale package-installatie,
en voert daarna Plugin-synchronisatie, een vernieuwing van core-command-completion en herstartwerk uit. Dit
houdt verpakte sidecars en kanaaleigen Plugin-records afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige heropbouw van plugin-command-completion wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-manager-updates de draaiende service voordat de package-tree wordt vervangen,
vernieuwen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en controleren of de herstartte Gateway de verwachte versie meldt. Met
`--no-restart` wordt packagevervanging nog steeds uitgevoerd, maar wordt de beheerde service niet
gestopt of herstart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je
deze handmatig herstart.

## Git-checkoutflow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag, en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, en fetch en rebase daarna.

### Updatestappen

<Steps>
  <Step title="Controleer schone worktree">
    Vereist dat er geen niet-gecommitte wijzigingen zijn.
  </Step>
  <Step title="Wissel kanaal">
    Schakelt naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Fetch upstream">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebast op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Installeer afhankelijkheden">
    Gebruikt de repo-package manager. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke fallback `npm install pnpm@10`) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Build Control UI">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Voer doctor uit">
    `openclaw doctor` wordt uitgevoerd als laatste veilige updatecontrole.
  </Step>
  <Step title="Synchroniseer Plugins">
    Synchroniseert Plugins met het actieve kanaal. Dev gebruikt gebundelde Plugins; stable en beta gebruiken npm. Werkt via npm geïnstalleerde Plugins bij.
  </Step>
</Steps>

<Warning>
Als een exact gepinde npm-Plugin-update verwijst naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die Plugin-artefactupdate af in plaats van deze te installeren. Installeer of werk de Plugin alleen expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Mislukkingen bij Plugin-synchronisatie na de update laten het updateresultaat falen en stoppen vervolgwerk voor herstarten. Los de Plugin-installatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is het laden van Plugins alleen verificatie: tijdens het opstarten worden geen package managers uitgevoerd en worden dependency trees niet gewijzigd. Package-manager-`update.run`-herstarts omzeilen de normale idle-uitstel en herstart-cooldown nadat de package-tree is omgewisseld, zodat het oude proces niet lazy-loading kan blijven doen van verwijderde chunks.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-afkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
