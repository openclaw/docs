---
read_when:
    - Je wilt een checkout van de broncode veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - Je moet het gedrag van de verkorte notatie van `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (relatief veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-05-07T01:51:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
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

- `--no-restart`: sla het opnieuw starten van de Gateway-service over na een geslaagde update. Package-manager-updates die de Gateway wel opnieuw starten, verifiëren dat de opnieuw gestarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; wordt opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het packagedoel alleen voor deze update. Voor package-installaties verwijst `main` naar `github:openclaw/openclaw#main`.
- `--dry-run`: bekijk geplande updateacties vooraf (kanaal/tag/doel/herstart-flow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.warnings` wanneer corrupte of niet-laadbare beheerde plugins
  reparatie nodig hebben nadat de core-update is geslaagd, en `postUpdate.plugins.integrityDrifts`
  wanneer drift in npm-pluginartefacten wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld downgradebevestiging).

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om de geplande
kanaal-/tag-/installatie-/herstartacties vooraf te bekijken, `--json` voor machineleesbare
resultaten, en `openclaw update status --json` wanneer je alleen kanaal- en
beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een update debugt,
zijn console-uitvoerigheid en bestandslogniveau gescheiden: Gateway `--verbose` beïnvloedt
terminal-/WebSocket-uitvoer, terwijl bestandslogs `logging.level: "debug"` of
`"trace"` in de configuratie vereisen. Zie [Gateway-logging](/nl/gateway/logging).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn muterende `openclaw update`-runs uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-input voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
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
- `--timeout <seconds>`: timeout voor controles (standaard 3s).

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway
na het bijwerken opnieuw moet worden gestart (standaard wordt opnieuw gestart). Als je `dev` selecteert zonder git-checkout, biedt deze
aan er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git-checkout (standaard: `~/openclaw`, te overschrijven met `OPENCLAW_GIT_DIR`),
  werkt die bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm-dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

OpenClaw heeft nog geen LTS- of maandelijks supportkanaal. We werken
richting maandelijkse supportlijnen, maar `--channel` accepteert momenteel alleen
`stable`, `beta` en `dev`. Gebruik `--tag <version-or-dist-tag>` voor een eenmalig
doel wanneer je een specifiek packageartefact nodig hebt.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run` package-manager-updates
forceren een niet-uitgestelde updateherstart zonder cooldown na de packagewissel,
omdat het oude Gateway-proces nog in-memory chunks kan hebben die verwijzen naar
bestanden die door het nieuwe package zijn verwijderd.

Voor package-manager-installaties lost `openclaw update` de doelpackageversie op
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een gestagde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
de verpakte `dist`-inventaris daar en wisselt daarna die schone packageboom in de
echte globale prefix. Als verificatie mislukt, worden post-update doctor, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte boom. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, vernieuwt de opdracht de globale package-installatie,
en voert daarna pluginsynchronisatie, een core-command completion-verversing en herstartwerk uit. Dit
houdt verpakte sidecars en kanaalbeheerde pluginrecords afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige plugin-command completion-rebuilds worden overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-manager-updates de actieve service voordat de packageboom wordt vervangen,
verversen daarna de servicemetadata vanuit de bijgewerkte installatie, starten de
service opnieuw en verifiëren dat de opnieuw gestarte Gateway de verwachte versie rapporteert voordat
succes wordt gemeld. Op macOS verifieert de post-update-controle ook dat de LaunchAgent
voor het actieve profiel is geladen/draait en dat de geconfigureerde loopbackpoort
gezond is. Als de plist is geïnstalleerd maar launchd deze niet beheert, bootstrap OpenClaw
de LaunchAgent automatisch opnieuw en voert daarna de
gezondheids-/versie-/kanaalgereedheidscontroles opnieuw uit. Een verse bootstrap laadt de RunAtLoad
job direct, zodat updateherstel niet onmiddellijk `kickstart -k` uitvoert op de nieuw
gestarte Gateway. Als de Gateway nog steeds niet gezond wordt, eindigt de opdracht
met een niet-nulstatus en drukt deze het pad naar het herstartlog af plus expliciete instructies voor herstarten, opnieuw installeren en
package-rollback. Met `--no-restart`
wordt de packagevervanging nog steeds uitgevoerd, maar de beheerde service wordt niet gestopt of
opnieuw gestart, waardoor de draaiende Gateway oude code kan blijven gebruiken totdat je deze
handmatig opnieuw start.

## Git-checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, en voer daarna fetch en rebase uit.

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
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt deze tot 10 commits terug om de nieuwste buildbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriële modus omdat updatehosts van gebruikers vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Install dependencies">
    Gebruikt de repo-package manager. Voor pnpm-checkouts bootstrap de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke `npm install pnpm@10`-fallback) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Build Control UI">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` draait als de laatste veilige updatecontrole.
  </Step>
  <Step title="Sync plugins">
    Synchroniseert plugins met het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt gevolgde plugininstallaties bij.
  </Step>
</Steps>

Op het beta-updatekanaal proberen gevolgde npm- en ClawHub-plugininstallaties die de
default/latest-lijn volgen eerst een plugin `@beta`-release. Als de plugin geen
beta-release heeft, valt OpenClaw terug op de vastgelegde default/latest-spec. Voor npm-
plugins valt OpenClaw ook terug wanneer het beta-package bestaat maar installatievalidatie
mislukt. Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact vastgepinde npm-pluginupdate oplost naar een artefact waarvan de integriteit verschilt van het opgeslagen installatierecord, breekt `openclaw update` die pluginartefactupdate af in plaats van deze te installeren. Installeer de plugin opnieuw of werk deze expliciet bij, maar alleen nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Pluginsynchronisatiefouten na de update die beperkt zijn tot een beheerde plugin worden als waarschuwingen gemeld nadat de core-update is geslaagd. Het JSON-resultaat houdt de top-level update `status: "ok"` en rapporteert `postUpdate.plugins.status: "warning"` met `openclaw doctor --fix`- en `openclaw plugins inspect <id> --runtime --json`-advies. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds falen. Herstel de plugininstallatie- of updatefout en voer daarna `openclaw doctor --fix` of `openclaw update` opnieuw uit.

Wanneer de bijgewerkte Gateway start, is het laden van plugins alleen verificatie: bij opstarten worden geen package managers uitgevoerd en worden dependency trees niet gemuteerd. Package-manager `update.run`-herstarts omzeilen de normale idle-uitstel en herstartcooldown nadat de packageboom is gewisseld, zodat het oude proces verwijderde chunks niet lazy kan blijven laden.

Als pnpm-bootstrap nog steeds faalt, stopt de updater vroeg met een package-manager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-verkorting

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcherscripts).

## Gerelateerd

- `openclaw doctor` (biedt aan eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
