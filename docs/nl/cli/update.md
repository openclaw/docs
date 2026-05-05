---
read_when:
    - Je wilt een werkkopie van de broncode veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - Je moet het gedrag van de verkorte notatie `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (relatief veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-05T01:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable/beta/dev-kanalen.

Als je via **npm/pnpm/bun** hebt geïnstalleerd (globale installatie, geen git-metadata), verlopen updates via de pakketbeheerder-flow in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het opnieuw starten van de Gateway-service over na een geslaagde update. Updates via de pakketbeheerder die de Gateway wel opnieuw starten, controleren of de herstartte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; wordt opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het pakketdoel alleen voor deze update. Voor pakketinstallaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk de geplande updateacties vooraf (kanaal/tag/doel/herstart-flow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer npm-plugin-artefactdrift wordt
  gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: time-out per stap (standaard is 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld downgradebevestiging).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om de
geplande acties voor kanaal/tag/installatie/herstart vooraf te bekijken, `--json`
voor machineleesbare resultaten, en `openclaw update status --json` wanneer je
alleen kanaal- en beschikbaarheidsdetails nodig hebt. Als je Gateway-logboeken
rond een update debugt, zijn console-uitvoerigheid en bestandslogniveau
gescheiden: Gateway `--verbose` beïnvloedt terminal-/WebSocket-uitvoer, terwijl
bestandslogboeken `logging.level: "debug"` of `"trace"` in de configuratie
vereisen. Zie [Gateway-logboekregistratie](/nl/gateway/logging).

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
na het bijwerken opnieuw moet worden gestart (standaard is opnieuw starten). Als
je `dev` selecteert zonder git-checkout, wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode gelijk:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijven met `OPENCLAW_GIT_DIR`),
  werkt die bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stabiele release.

De kern-auto-updater van de Gateway (wanneer ingeschakeld via configuratie) start
het CLI-updatepad buiten de live Gateway-requesthandler. Control-plane
`update.run`-updates via de pakketbeheerder forceren een niet-uitgestelde
updateherstart zonder cooldown na de pakketwissel, omdat het oude Gateway-proces
nog in-memory chunks kan hebben die verwijzen naar bestanden die door het nieuwe
pakket zijn verwijderd.

Voor pakketbeheerderinstallaties bepaalt `openclaw update` de doelpakketversie
voordat de pakketbeheerder wordt aangeroepen. Globale npm-installaties gebruiken
een gefaseerde installatie: OpenClaw installeert het nieuwe pakket in een
tijdelijke npm-prefix, verifieert daar de verpakte `dist`-inventaris en wisselt
die schone pakketboom daarna in de echte globale prefix. Als verificatie mislukt,
worden post-update doctor, pluginsynchronisatie en herstartwerk niet uitgevoerd
vanuit de verdachte boom. Zelfs wanneer de geïnstalleerde versie al overeenkomt
met het doel, vernieuwt de opdracht de globale pakketinstallatie en voert daarna
pluginsynchronisatie, een verversing van core-command completion en herstartwerk
uit. Dit houdt verpakte sidecars en kanaaleigen plugin-records in lijn met de
geïnstalleerde OpenClaw-build, terwijl volledige heropbouw van plugin-command
completion wordt overgelaten aan expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is
ingeschakeld, stoppen pakketbeheerderupdates de draaiende service voordat de
pakketboom wordt vervangen. Daarna wordt de servicemetadata vanuit de bijgewerkte
installatie vernieuwd, wordt de service opnieuw gestart en wordt gecontroleerd of
de herstartte Gateway de verwachte versie rapporteert voordat succes wordt
gemeld. Op macOS controleert de post-updatecontrole ook of de LaunchAgent voor
het actieve profiel is geladen/draait en of de geconfigureerde loopback-poort
gezond is. Als de plist is geïnstalleerd maar launchd die niet beheert, bootstrapt
OpenClaw de LaunchAgent automatisch opnieuw en voert daarna de controles voor
gezondheid/versie/kanaalgereedheid opnieuw uit. Een verse bootstrap laadt de
RunAtLoad-taak direct, zodat updateherstel de nieuw gestarte Gateway niet
onmiddellijk `kickstart -k` geeft. Als de Gateway nog steeds niet gezond wordt,
eindigt de opdracht met een niet-nulstatus en drukt het pad naar het herstartlog
plus expliciete instructies voor herstarten, opnieuw installeren en pakketrollback
af. Met `--no-restart` wordt pakketvervanging nog steeds uitgevoerd, maar de
beheerde service wordt niet gestopt of opnieuw gestart, waardoor de draaiende
Gateway oude code kan blijven gebruiken totdat je deze handmatig opnieuw start.

## Git-checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stabiele tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main` en voer daarna fetch en rebase uit.

### Updatestappen

<Steps>
  <Step title="Schone worktree verifiëren">
    Vereist dat er geen niet-gecommitte wijzigingen zijn.
  </Step>
  <Step title="Van kanaal wisselen">
    Wisselt naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de pakketbeheerder van de repo. Voor pnpm-checkouts bootstrapt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna als fallback een tijdelijke `npm install pnpm@10`) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als laatste veilige-updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins met het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt gevolgde plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-plugininstallaties die
de default/latest-lijn volgen eerst een plugin-`@beta`-release. Als de plugin
geen beta-release heeft, valt OpenClaw terug op de vastgelegde
default/latest-specificatie. Voor npm-plugins valt OpenClaw ook terug wanneer het
beta-pakket bestaat maar installatievalidatie mislukt. Exacte versies en
expliciete tags worden niet herschreven.

<Warning>
Als een exact vastgepinde npm-pluginupdate wordt opgelost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Installeer de plugin opnieuw of werk deze expliciet bij, alleen nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Mislukte pluginsynchronisatie na de update laat het updateresultaat mislukken en stopt het vervolgwerk voor opnieuw starten. Los de plugininstallatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is het laden van plugins alleen verificatie: startup voert geen pakketbeheerders uit en wijzigt geen afhankelijkheidsbomen. Herstarts van pakketbeheerder-`update.run` omzeilen de normale idle-uitstelling en herstart-cooldown nadat de pakketboom is gewisseld, zodat het oude proces verwijderde chunks niet lazy kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroeg met een pakketbeheerder-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
