---
read_when:
    - Je wilt een broncode-checkout veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - Je moet het verkortingsgedrag van `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (relatief veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-06T09:07:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable-/beta-/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata), verlopen updates via de pakketbeheerderstroom in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Pakketbeheerderupdates die de Gateway wel herstarten, controleren of de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het pakketdoel alleen voor deze update. Voor pakketinstallaties wordt `main` gekoppeld aan `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk een voorbeeld van geplande updateacties (kanaal/tag/doel/herstartstroom) zonder configuratie te schrijven, te installeren, Plugins te synchroniseren of te herstarten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.warnings` wanneer beschadigde of niet-laadbare beheerde Plugins
  herstel nodig hebben nadat de core-update is geslaagd, en `postUpdate.plugins.integrityDrifts`
  wanneer drift in npm-Pluginartefacten wordt gedetecteerd tijdens synchronisatie van Plugins na de update.
- `--timeout <seconds>`: time-out per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld downgradebevestiging).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om een voorbeeld te bekijken
van de geplande kanaal-/tag-/installatie-/herstartacties, `--json` voor machineleesbare
resultaten, en `openclaw update status --json` wanneer je alleen kanaal- en
beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een update debugt,
zijn console-uitgebreidheid en bestandslogniveau gescheiden: Gateway `--verbose` beïnvloedt
terminal-/WebSocket-uitvoer, terwijl bestandslogs `logging.level: "debug"` of
`"trace"` in configuratie vereisen. Zie [Gateway-logboekregistratie](/nl/gateway/logging).

<Warning>
Downgrades vereisen bevestiging omdat oudere versies configuratie kunnen breken.
</Warning>

## `update status`

Toon het actieve updatekanaal + git-tag/branch/SHA (voor broncheckouts), plus updatebeschikbaarheid.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opties:

- `--json`: druk machineleesbare status-JSON af.
- `--timeout <seconds>`: time-out voor controles (standaard 3s).

## `update wizard`

Interactieve stroom om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken moet worden herstart (standaard wordt herstart). Als je `dev` selecteert zonder git-checkout,
biedt deze aan er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode uitgelijnd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, te overschrijven met `OPENCLAW_GIT_DIR`),
  werkt deze bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stabiele release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run`-pakketbeheerderupdates
forceren een niet-uitgestelde updateherstart zonder afkoelperiode na de pakketwissel,
omdat het oude Gateway-proces nog in-memory chunks kan hebben die verwijzen naar
bestanden die door het nieuwe pakket zijn verwijderd.

Voor pakketbeheerderinstallaties lost `openclaw update` de doelpakketversie op
voordat de pakketbeheerder wordt aangeroepen. npm-globale installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe pakket in een tijdelijke npm-prefix, controleert
daar de verpakte `dist`-inventaris en wisselt die schone pakketstructuur daarna in de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, Plugin-synchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte structuur. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale pakketinstallatie
en voert daarna Plugin-synchronisatie, een vernieuwing van core-opdrachtaanvulling en herstartwerk uit. Dit
houdt verpakte sidecars en kanaalgebonden Plugin-records uitgelijnd met de
geïnstalleerde OpenClaw-build, terwijl volledige herbouw van Plugin-opdrachtaanvulling wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen pakketbeheerderupdates de draaiende service voordat de pakketstructuur wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en controleren of de herstarte Gateway de verwachte versie rapporteert voordat
succes wordt gemeld. Op macOS controleert de check na de update ook of de LaunchAgent
is geladen/draait voor het actieve profiel en of de geconfigureerde loopbackpoort
gezond is. Als de plist is geïnstalleerd maar launchd deze niet beheert, bootstrapt OpenClaw
de LaunchAgent automatisch opnieuw en voert daarna opnieuw de
gereedheidscontroles voor gezondheid/versie/kanaal uit. Een verse bootstrap laadt de RunAtLoad-
taak direct, zodat updateherstel niet onmiddellijk `kickstart -k` uitvoert op de nieuw
gestarte Gateway. Als de Gateway nog steeds niet gezond wordt, sluit de opdracht
af met een niet-nulcode en drukt het herstartlogpad plus expliciete instructies voor herstarten, opnieuw installeren en
pakketrollback af. Met `--no-restart`
wordt pakketvervanging nog steeds uitgevoerd, maar de beheerde service wordt niet gestopt of
herstart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig herstart.

## Git-checkoutstroom

### Kanaalselectie

- `stable`: check de nieuwste niet-beta-tag uit, bouw daarna en voer doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: check `main` uit, fetch daarna en rebase.

### Updatestappen

<Steps>
  <Step title="Schone worktree controleren">
    Vereist geen niet-gecommitte wijzigingen.
  </Step>
  <Step title="Van kanaal wisselen">
    Wisselt naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste bouwbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriële modus omdat hosts voor gebruikersupdates vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de pakketbeheerder van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke fallback via `npm install pnpm@10`) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` draait als de laatste veilige-updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert Plugins naar het actieve kanaal. Dev gebruikt gebundelde Plugins; stable en beta gebruiken npm. Werkt gevolgde Plugin-installaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-Plugin-installaties die de
standaard-/latest-lijn volgen eerst een Plugin-`@beta`-release. Als de Plugin geen
beta-release heeft, valt OpenClaw terug op de vastgelegde standaard-/latest-specificatie. Voor npm-
Plugins valt OpenClaw ook terug wanneer het beta-pakket bestaat maar installatievalidatie
mislukt. Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact vastgepinde npm-Plugin-update oplost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die Pluginartefactupdate af in plaats van deze te installeren. Installeer of werk de Plugin alleen expliciet bij nadat je hebt gecontroleerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Plugin-synchronisatiefouten na de update die beperkt zijn tot een beheerde Plugin worden gerapporteerd als waarschuwingen nadat de core-update is geslaagd. Het JSON-resultaat houdt de update op topniveau `status: "ok"` en rapporteert `postUpdate.plugins.status: "warning"` met richtlijnen voor `openclaw doctor --fix` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds falen. Los de Plugin-installatie- of updatefout op en voer daarna opnieuw `openclaw doctor --fix` of `openclaw update` uit.

Wanneer de bijgewerkte Gateway start, is het laden van Plugins alleen verificatie: startup voert geen pakketbeheerders uit en muteert geen dependency trees. Pakketbeheerder-`update.run`-herstarts omzeilen de normale idle-uitstel en herstartafkoeling nadat de pakketstructuur is verwisseld, zodat het oude proces niet lui verwijderde chunks kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroegtijdig met een pakketbeheerder-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
