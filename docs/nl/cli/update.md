---
read_when:
    - Je wilt een checkout van de broncode veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - U moet het verkorte gedrag van `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-03T21:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen stable-/beta-/dev-kanalen.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
verlopen updates via de pakketbeheerderstroom in [Bijwerken](/nl/install/updating).

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

- `--no-restart`: sla het herstarten van de Gateway-service na een geslaagde update over. Pakketbeheerderupdates die de Gateway wel herstarten, verifiëren dat de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; wordt opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het pakketdoel alleen voor deze update. Voor pakketinstallaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk vooraf de geplande updateacties (kanaal/tag/doel/herstartstroom) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of te herstarten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.integrityDrifts` wanneer drift in npm-pluginartefacten
  wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: time-out per stap (standaard is 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging voor downgraden).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om de geplande
kanaal-/tag-/installatie-/herstartacties vooraf te bekijken, `--json` voor
machineleesbare resultaten, en `openclaw update status --json` wanneer je alleen
kanaal- en beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een update
debugt, staan console-uitvoerigheid en bestandslogniveau los van elkaar: Gateway
`--verbose` beïnvloedt terminal-/WebSocket-uitvoer, terwijl bestandslogs
`logging.level: "debug"` of `"trace"` in de configuratie vereisen. Zie
[Gateway-logboekregistratie](/nl/gateway/logging).

<Warning>
Downgrades vereisen bevestiging omdat oudere versies de configuratie kunnen breken.
</Warning>

## `update status`

Toon het actieve updatekanaal + git-tag/branch/SHA (voor broncode-checkouts), plus updatebeschikbaarheid.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opties:

- `--json`: druk machineleesbare status-JSON af.
- `--timeout <seconds>`: time-out voor controles (standaard is 3s).

## `update wizard`

Interactieve stroom om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken moet worden herstart (standaard wordt er herstart). Als je `dev`
selecteert zonder git-checkout, wordt aangeboden er een te maken.

Opties:

- `--timeout <seconds>`: time-out voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode in lijn:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, overschrijf met `OPENCLAW_GIT_DIR`),
  werkt die bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanaf npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-kern (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run`-pakketbeheerderupdates
forceren een niet-uitgestelde updateherstart zonder afkoelperiode na de pakketwissel,
omdat het oude Gateway-proces nog chunks in het geheugen kan hebben die verwijzen naar
bestanden die door het nieuwe pakket zijn verwijderd.

Voor pakketbeheerderinstallaties bepaalt `openclaw update` de doelpakketversie
voordat de pakketbeheerder wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe pakket in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventaris en wisselt die schone pakketboom vervolgens naar de
echte globale prefix. Als verificatie mislukt, worden doctor na de update, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte boom. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale pakketinstallatie,
en voert daarna pluginsynchronisatie, een verversing van core-command completion en herstartwerk uit. Dit
houdt verpakte sidecars en kanaal-eigen pluginrecords in lijn met de
geïnstalleerde OpenClaw-build, terwijl volledige herbouw van plugin-command completion wordt overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen pakketbeheerderupdates de actieve service voordat de pakketboom wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, herstarten de
service en verifiëren dat de herstarte Gateway de verwachte versie rapporteert voordat
succes wordt gemeld. Op macOS verifieert de controle na de update ook dat de LaunchAgent
voor het actieve profiel is geladen/actief is en dat de geconfigureerde loopbackpoort
gezond is. Als de plist is geïnstalleerd maar launchd er geen toezicht op houdt, bootstrappt OpenClaw
de LaunchAgent automatisch opnieuw en voert daarna de controles voor
health/versie/kanaalgereedheid opnieuw uit. Een nieuwe bootstrap laadt de RunAtLoad
job direct, waardoor updateherstel de nieuw gestarte Gateway niet onmiddellijk met
`kickstart -k` opnieuw start. Als de Gateway nog steeds niet gezond wordt, eindigt de opdracht
met een niet-nulstatus en drukt het pad naar het herstartlogboek af plus expliciete instructies voor herstarten, opnieuw installeren en
pakketrollback. Met `--no-restart`
wordt pakketvervanging nog steeds uitgevoerd, maar de beheerde service wordt niet gestopt of
herstart, waardoor de actieve Gateway oude code kan blijven gebruiken totdat je deze
handmatig herstart.

## Git-checkoutstroom

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main` en voer daarna fetch en rebase uit.

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
    Voert lint en TypeScript-build uit in een tijdelijke worktree. Als de tip mislukt, loopt dit tot 10 commits terug om de nieuwste schone build te vinden.
  </Step>
  <Step title="Rebase">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Dependencies installeren">
    Gebruikt de pakketbeheerder van de repo. Voor pnpm-checkouts bootstrappt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke `npm install pnpm@10`-fallback) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als de laatste veilige updatecontrole.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt bijgehouden plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen bijgehouden npm- en ClawHub-plugininstallaties die de
standaard/latest-lijn volgen eerst een plugin-`@beta`-release. Als de plugin geen
beta-release heeft, valt OpenClaw terug op de vastgelegde default/latest-spec. Exacte
versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact gepinde npm-pluginupdate resulteert in een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van het te installeren. Installeer de plugin alleen opnieuw of werk deze expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Mislukkingen bij pluginsynchronisatie na de update laten het updateresultaat mislukken en stoppen vervolgwerk voor herstarten. Los de plugininstallatie- of updatefout op en voer daarna `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is het laden van plugins alleen verifiëren: startup voert geen pakketbeheerders uit en wijzigt geen dependency trees. Pakketbeheerder-`update.run`-herstarts omzeilen de normale idle-uitstel en herstartafkoelperiode nadat de pakketboom is gewisseld, zodat het oude proces niet lui verwijderde chunks kan blijven laden.

Als pnpm-bootstrap nog steeds mislukt, stopt de updater vroegtijdig met een pakketbeheerder-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-shorthand

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelkanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
