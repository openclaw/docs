---
read_when:
    - Je wilt een bron-checkout veilig bijwerken
    - Je debugt de uitvoer of opties van `openclaw update`
    - Je moet het gedrag van de verkorte notatie `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische Gateway-herstart)
title: Bijwerken
x-i18n:
    generated_at: "2026-06-27T17:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw veilig bij en wissel tussen de kanalen stable/beta/dev.

Als je hebt geïnstalleerd via **npm/pnpm/bun** (globale installatie, geen git-metadata),
verlopen updates via de package-manager-flow in [Bijwerken](/nl/install/updating).

## Gebruik

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opties

- `--no-restart`: sla het herstarten van de Gateway-service over na een geslaagde update. Package-manager-updates die de Gateway wel herstarten, controleren of de herstarte service de verwachte bijgewerkte versie rapporteert voordat de opdracht slaagt.
- `--channel <stable|beta|dev>`: stel het updatekanaal in (git + npm; opgeslagen in de configuratie).
- `--tag <dist-tag|version|spec>`: overschrijf het packagedoel alleen voor deze update. Voor package-installaties verwijst `main` naar `github:openclaw/openclaw#main`; GitHub/git-bronspecificaties worden verpakt in een tijdelijke tarball vóór de gefaseerde globale npm-installatie.
- `--dry-run`: toon een voorbeeld van geplande updateacties (channel/tag/target/restart-flow) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of te herstarten.
- `--json`: druk machineleesbare `UpdateRunResult`-JSON af, inclusief
  `postUpdate.plugins.warnings` wanneer corrupte of niet-laadbare beheerde plugins
  reparatie nodig hebben nadat de core-update is geslaagd, details over beta-channel-pluginfallback
  wanneer een plugin geen beta-release heeft, en `postUpdate.plugins.integrityDrifts`
  wanneer drift in npm-pluginartefacten wordt gedetecteerd tijdens pluginsynchronisatie na de update.
- `--timeout <seconds>`: timeout per stap (standaard 1800s).
- `--yes`: sla bevestigingsprompts over (bijvoorbeeld bevestiging voor downgrades).
- `--acknowledge-clawhub-risk`: sta na het bekijken van community ClawHub-vertrouwenswaarschuwingen
  toe dat pluginsynchronisatie na de update doorgaat zonder interactieve
  prompt. Zonder dit worden risicovolle community ClawHub-pluginreleases overgeslagen en
  ongewijzigd gelaten wanneer OpenClaw niet kan prompten. Officiële ClawHub-packages en
  gebundelde OpenClaw-pluginbronnen omzeilen deze releasevertrouwensprompt.

`openclaw update` heeft geen `--verbose`-vlag. Gebruik `--dry-run` om een voorbeeld te bekijken
van de geplande channel/tag/install/restart-acties, `--json` voor machineleesbare
resultaten, en `openclaw update status --json` wanneer je alleen kanaal- en
beschikbaarheidsdetails nodig hebt. Als je Gateway-logs rond een update debugt,
zijn console-uitgebreidheid en bestandslogniveau gescheiden: Gateway `--verbose` beïnvloedt
terminal-/WebSocket-uitvoer, terwijl bestandslogs `logging.level: "debug"` of
`"trace"` in de configuratie vereisen. Zie [Gateway-logregistratie](/nl/gateway/logging).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn muterende `openclaw update`-runs uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-input voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
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

- `--json`: druk machineleesbare status-JSON af.
- `--timeout <seconds>`: timeout voor controles (standaard 3s).

## `update repair`

Voer de afronding van de update opnieuw uit nadat het core-package al is gewijzigd, maar later
reparatiewerk niet netjes is afgerond. Dit is het ondersteunde herstelpad wanneer
`openclaw update` het nieuwe core-package heeft geïnstalleerd, maar post-core pluginsynchronisatie,
beheerde npm-pluginmetadata, registry-verversing of doctor-reparatie nog moet
convergeren.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opties:

- `--channel <stable|beta|dev>`: sla het updatekanaal op vóór reparatie en
  voer pluginconvergentie uit tegen dat kanaal.
- `--json`: druk machineleesbare afrondings-JSON af.
- `--timeout <seconds>`: timeout voor reparatiestappen (standaard `1800`).
- `--yes`: sla bevestigingsprompts over.
- `--acknowledge-clawhub-risk`: sta na het bekijken van community ClawHub-vertrouwenswaarschuwingen
  toe dat pluginconvergentie tijdens reparatie doorgaat zonder interactieve
  prompt. Officiële ClawHub-packages en gebundelde OpenClaw-pluginbronnen
  omzeilen deze releasevertrouwensprompt.
- `--no-restart`: geaccepteerd voor pariteit met de updateopdracht; reparatie herstart de
  Gateway nooit.

`openclaw update repair` voert `openclaw doctor --fix` uit, herlaadt de gerepareerde
configuratie en installatierecords, synchroniseert gevolgde plugins voor het actieve updatekanaal,
werkt beheerde npm-plugininstallaties bij, repareert ontbrekende geconfigureerde pluginpayloads,
ververst de pluginregistry en schrijft de geconvergeerde install-recordmetadata.
Het installeert geen nieuw core-package en herstart de Gateway niet.

## `update wizard`

Interactieve flow om een updatekanaal te kiezen en te bevestigen of de Gateway na het bijwerken
moet worden herstart (standaard is herstarten). Als je `dev` selecteert zonder git checkout, biedt het
aan er een te maken.

Opties:

- `--timeout <seconds>`: timeout voor elke updatestap (standaard `1800`)

## Wat het doet

Wanneer je expliciet van kanaal wisselt (`--channel ...`), houdt OpenClaw ook de
installatiemethode afgestemd:

- `dev` → zorgt voor een git checkout (standaard: `~/openclaw`, of `$OPENCLAW_HOME/openclaw` wanneer
  `OPENCLAW_HOME` is ingesteld; overschrijf met `OPENCLAW_GIT_DIR`),
  werkt die bij en installeert de globale CLI vanuit die checkout.
- `stable` → installeert vanuit npm met `latest`.
- `beta` → geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op `latest` wanneer beta
  ontbreekt of ouder is dan de huidige stable-release.

De automatische updater van de Gateway-core (wanneer ingeschakeld via configuratie) start het CLI-updatepad
buiten de live Gateway-requesthandler. Control-plane `update.run`
package-manager-updates en supervised git-checkout-updates gebruiken ook een
managed-service-overdracht in plaats van de package tree te vervangen of
`dist/` opnieuw te bouwen binnen het live Gateway-proces. De Gateway start een losgekoppelde helper,
sluit af, en de helper voert het normale `openclaw update --yes --json` CLI-pad uit
van buiten de Gateway-procesboom. Als die overdracht niet beschikbaar is,
retourneert `update.run` een gestructureerd antwoord met de veilige shellopdracht om
handmatig uit te voeren.

Voor package-manager-installaties bepaalt `openclaw update` de doelpackageversie
voordat de package manager wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe package in een tijdelijke npm-prefix, verifieert
daar de verpakte `dist`-inventory en wisselt vervolgens die schone package tree om naar de
echte globale prefix. Als verificatie mislukt, worden post-update doctor, pluginsynchronisatie en
herstartwerk niet uitgevoerd vanuit de verdachte tree. Zelfs wanneer de geïnstalleerde versie
al overeenkomt met het doel, ververst de opdracht de globale package-installatie,
en voert daarna pluginsynchronisatie, een core-command-completionverversing en herstartwerk uit. Dit
houdt verpakte sidecars en kanaalbeheerde pluginrecords afgestemd op de
geïnstalleerde OpenClaw-build, terwijl volledige plugin-command-completion-rebuilds worden overgelaten aan
expliciete `openclaw completion --write-state`-runs.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen package-manager- en git-checkout-updates de draaiende service voordat
de package tree wordt vervangen of de checkout/build-uitvoer wordt gewijzigd. De updater
ververst daarna de servicemetadata vanuit de bijgewerkte installatie, herstart de
service en verifieert de herstarte Gateway voordat
`Gateway: restarted and verified.` wordt gerapporteerd. Package-manager-updates verifiëren daarnaast
dat de herstarte Gateway de verwachte packageversie rapporteert; git-checkout-updates
verifiëren gatewaygezondheid en servicegereedheid na de rebuild. Op macOS controleert de
post-update-controle ook of de LaunchAgent is geladen/draait voor het actieve
profiel en of de geconfigureerde loopbackpoort gezond is. Als de plist is geïnstalleerd
maar launchd er geen toezicht op houdt, bootstrapt OpenClaw de LaunchAgent
automatisch opnieuw, en voert daarna de health/version/channel-gereedheidscontroles opnieuw uit. Een verse
bootstrap laadt de RunAtLoad-job direct, waardoor updateherstel niet
onmiddellijk `kickstart -k` uitvoert op de nieuw gestarte Gateway. Als de Gateway nog steeds
niet gezond wordt, eindigt de opdracht met een niet-nulwaarde en drukt het herstartlogpad
plus expliciete instructies voor herstart, herinstallatie en package-rollback af. Als herstarten
niet kan worden uitgevoerd, drukt de opdracht `Gateway: restart skipped (...)` of
`Gateway: restart failed: ...` af met een handmatige `openclaw gateway restart`-hint.
Met `--no-restart` wordt packagevervanging of git-rebuild nog steeds uitgevoerd, maar wordt de
beheerde service niet gestopt of herstart, waardoor de draaiende Gateway oude
code kan blijven gebruiken totdat je die handmatig herstart.

### Vorm van control-plane-respons

Wanneer `update.run` wordt aangeroepen via de Gateway-control plane op een
package-manager-installatie of supervised git checkout, rapporteert de handler de
start van de overdracht los van de CLI-update die doorgaat nadat de
Gateway afsluit:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, en
  `handoff.status: "started"` betekenen dat de Gateway de managed-service
  overdracht heeft aangemaakt en zijn eigen herstart heeft gepland zodat de losgekoppelde helper
  `openclaw update --yes --json` buiten het live serviceproces kan uitvoeren.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, en
  `handoff.status: "unavailable"` betekenen dat OpenClaw geen toezicht houdende
  servicegrens en duurzame service-identiteit kon vinden voor een veilige overdracht. Bijvoorbeeld:
  systemd-overdracht vereist de OpenClaw-unitidentiteit
  (`OPENCLAW_SYSTEMD_UNIT`), niet alleen omgevingsmarkers van systemd-processen. De
  respons bevat `handoff.command`, de shellopdracht om uit te voeren van buiten de
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` betekent dat de
  Gateway probeerde de overdracht aan te maken, maar de losgekoppelde helper niet kon starten.

De `sentinel`-payload wordt nog steeds geschreven voordat de Gateway afsluit, en de CLI-
overdracht werkt dezelfde herstart-sentinel bij nadat de health checks voor de managed-service-herstart
zijn voltooid. Tijdens de overdracht kan de sentinel
`stats.reason: "restart-health-pending"` bevatten zonder success-continuation; de
herstarte Gateway blijft die pollen en voert de continuation pas uit nadat de CLI
servicegezondheid heeft geverifieerd en de sentinel heeft herschreven met het definitieve `ok`-
resultaat. `openclaw status` en `openclaw status --all` tonen een `Update restart`-
rij terwijl die sentinel pending of mislukt is, en `update.status` ververst en
retourneert de nieuwste sentinel.

## Git-checkout-flow

### Kanaalselectie

- `stable`: checkout de nieuwste niet-beta-tag en voer daarna build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag, maar val terug op de nieuwste stable-tag wanneer beta ontbreekt of ouder is.
- `dev`: checkout `main`, en voer daarna fetch en rebase uit.

### Updatestappen

<Steps>
  <Step title="Schone worktree verifiëren">
    Vereist geen niet-gecommitte wijzigingen.
  </Step>
  <Step title="Kanaal wisselen">
    Schakelt over naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen dev.
  </Step>
  <Step title="Preflight-build (alleen dev)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip faalt, loopt dit tot 10 commits terug om de nieuwste buildbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze preflight ook lint uit te voeren; lint draait in beperkte seriële modus omdat hosts voor gebruikersupdates vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebasen">
    Rebaset op de geselecteerde commit (alleen dev).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de pakketmanager van de repo. Voor pnpm-checkouts bootstrappt de updater `pnpm` op aanvraag (eerst via `corepack`, daarna met een tijdelijke fallback `npm install pnpm@11`) in plaats van `npm run build` uit te voeren binnen een pnpm-workspace.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als de laatste controle voor veilige updates.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins naar het actieve kanaal. Dev gebruikt gebundelde plugins; stable en beta gebruiken npm. Werkt bijgehouden Plugin-installaties bij.
  </Step>
</Steps>

Op het bèta-updatekanaal proberen bijgehouden npm- en ClawHub-Plugin-installaties die de standaard-/nieuwste lijn volgen eerst een Plugin-release `@beta`. Als de Plugin geen bètarelease heeft, valt OpenClaw terug op de vastgelegde standaard-/nieuwste specificatie en meldt dat als waarschuwing. Voor npm-plugins valt OpenClaw ook terug wanneer het bètapakket bestaat maar de installatievalidatie niet haalt. Deze Plugin-fallbackwaarschuwingen zorgen er niet voor dat de kernupdate faalt. Exacte versies en expliciete tags worden niet herschreven.

<Warning>
Als een exact vastgepinde npm-Plugin-update resolveert naar een artefact waarvan de integriteit afwijkt van het opgeslagen installatierecord, breekt `openclaw update` die update van het Plugin-artefact af in plaats van het te installeren. Installeer of update de Plugin alleen expliciet opnieuw nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Synchronisatiefouten van Plugins na de update die beperkt zijn tot een beheerde Plugin en waar het synchronisatiepad omheen kan routeren (bijv. een onbereikbaar npm-register voor een niet-essentiële Plugin), worden als waarschuwingen gemeld nadat de kernupdate is geslaagd. Het JSON-resultaat behoudt de update-`status: "ok"` op topniveau en meldt `postUpdate.plugins.status: "warning"` met begeleiding voor `openclaw update repair` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte updater- of synchronisatie-excepties laten het updateresultaat nog steeds falen. Los de installatiefout of updatefout van de Plugin op en voer daarna `openclaw update repair` opnieuw uit.

Na de synchronisatiestap per Plugin voert `openclaw update` een verplichte **post-core-convergentie**-pass uit voordat de gateway opnieuw wordt gestart: ontbrekende geconfigureerde Plugin-payloads worden gerepareerd, elk _actief_ bijgehouden installatierecord op schijf wordt gevalideerd en statisch wordt geverifieerd dat de `package.json` parsebaar is (en dat eventuele expliciet gedeclareerde `main` bestaat). Fouten uit deze pass — en een ongeldig OpenClaw-configsnapshot — retourneren `postUpdate.plugins.status: "error"` en zetten de update-`status` op topniveau op `"error"`, zodat `openclaw update` met een niet-nulstatus afsluit en de gateway _niet_ opnieuw wordt gestart met een niet-geverifieerde Plugin-set. De fout bevat gestructureerde regels `postUpdate.plugins.warnings[].guidance` die voor opvolging verwijzen naar `openclaw update repair` en `openclaw plugins inspect <id> --runtime --json`. Uitgeschakelde Plugin-items en records die geen aan een vertrouwde bron gekoppelde officiële synchronisatiedoelen zijn, worden hier overgeslagen, in lijn met het beleid `skipDisabledPlugins` dat door de ontbrekende-payloadcontrole wordt gebruikt, zodat een verouderd uitgeschakeld Plugin-record een verder geldige update niet kan blokkeren.

Wanneer de bijgewerkte Gateway start, is het laden van Plugins alleen ter verificatie: opstarten voert geen pakketmanagers uit en muteert geen afhankelijkheidsstructuren. Herstarts van pakketmanager-`update.run` worden overgedragen aan het door de CLI beheerde servicepad, zodat de pakketwissel buiten het oude Gateway-proces plaatsvindt en de service-healthchecks bepalen of de update als voltooid kan worden gerapporteerd.

Als pnpm-bootstrap nog steeds faalt, stopt de updater vroegtijdig met een pakketmanager-specifieke fout in plaats van `npm run build` binnen de checkout te proberen.
</Note>

## `--update`-shorthand

`openclaw --update` wordt herschreven naar `openclaw update` (handig voor shells en launcher-scripts).

## Gerelateerd

- `openclaw doctor` (biedt aan om eerst update uit te voeren op git-checkouts)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
