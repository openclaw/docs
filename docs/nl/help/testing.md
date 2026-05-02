---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-testreeksen, Docker-uitvoerders en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-05-02T11:19:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een handleiding voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke commando's je moet uitvoeren voor gangbare workflows (lokaal, vóór pushen, debuggen).
- Hoe live tests aanmeldgegevens ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario-auteurschap.
- [Matrix-QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transportplugin die door repo-ondersteunde scenario's wordt gebruikt.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runnersectie hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel aan de slag

Op de meeste dagen:

- Volledige gate (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suiterun op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandsselectie routeert nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één fout werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Door Linux-VM ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests wijzigt of extra zekerheid wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Wanneer je echte providers/modellen debugt (vereist echte aanmeldgegevens):

- Live suite (modellen + gateway-tool-/imageprobes): `pnpm test:live`
- Richt je stil op één live bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model draait nu een tekstbeurt plus een kleine probe in file-read-stijl.
    Modellen waarvan metadata `image`-invoer adverteert, draaien ook een kleine imagebeurt.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, inclusief aparte Docker-live-modelmatrixjobs
    die per provider zijn geshard.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providersecrets toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Draait een Docker-live-lane tegen het Codex app-serverpad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert vervolgens dat een gewoon antwoord en een imagebijlage
    via de native pluginbinding worden gerouteerd in plaats van ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Draait Gateway-agentbeurten via de Plugin-eigen Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image-,
    cron-MCP-, sub-agent- en Guardian-probes. Schakel de sub-agentprobe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-serverfouten isoleert. Voor een gerichte sub-agentcheck schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agentprobe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue-command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in extra zekerheidscontrole voor de rescue-commandsurface van het berichtkanaal.
    Deze oefent `/crestodian status`, zet een persistente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes`, en verifieert het schrijfpad voor audit/config.
- Crestodian planner-Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Draait Crestodian in een configuratieloze container met een neppe Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite getypte
    configuratieschrijving.
- Crestodian first-run-Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-directory, routeert kale `openclaw` naar
    Crestodian, past setup-/model-/agent-/Discord-plugin- + SecretRef-schrijvingen toe,
    valideert configuratie en verifieert auditvermeldingen. Hetzelfde Ring 0-setuppad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-kostensmoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit, en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het beperken van live tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-labrealiteit nodig hebt:

CI draait QA Lab in speciale workflows. `Parity gate` draait op matchende PR's en
vanuit handmatige dispatch met mockproviders. `QA-Lab - All Lanes` draait 's nachts op
`main` en vanuit handmatige dispatch met de mock parity gate, live Matrix-lane,
door Convex beheerde live Telegram-lane en door Convex beheerde live Discord-lane als
parallelle jobs. Geplande QA- en releasechecks geven Matrix `--profile fast`
expliciet door, terwijl de Matrix-CLI en handmatige workflowinvoer standaard
`all` blijven; handmatige dispatch kan `all` sharden naar `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release Checks` draait parity plus
de snelle Matrix- en Telegram-lanes vóór releasegoedkeuring, met
`mock-openai/gpt-5.5` voor releasetransportchecks zodat ze deterministisch blijven
en normale provider-plugin-startup vermijden. Deze live transport-gateways schakelen
memory search uit; memory-gedrag blijft gedekt door de QA-parity-suites.

Volledige release-live-mediashards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` bevat. Docker-live-model-/backendshards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Draait repo-ondersteunde QA-scenario's rechtstreeks op de host.
  - Draait standaard meerdere geselecteerde scenario's parallel met geïsoleerde
    gatewayworkers. `qa-channel` staat standaard op concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Stopt met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenario-bewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Draait de gateway-startupbench plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatiesamenvatting
    onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudend hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte startupbursts als metriek worden vastgelegd
    zonder op de minutenlange gateway-pegregressie te lijken.
  - Gebruikt gebouwde `dist`-artifacts; draai eerst een build wanneer de checkout nog geen
    verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Draait dezelfde QA-suite binnen een wegwerpbare Multipass-Linux-VM.
  - Houdt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live runs forwarden de ondersteunde QA-authinvoer die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA-live-providerconfigpad en `CODEX_HOME`
    wanneer aanwezig.
  - Outputdirectories moeten onder de repo-root blijven zodat de guest via
    de gemounte workspace terug kan schrijven.
  - Schrijft het normale QA-rapport + de samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor QA-werk in operatorstijl.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert deze globaal in
    Docker, draait niet-interactieve OpenAI-API-key-onboarding, configureert standaard Telegram,
    verifieert dat de verpakte pluginruntime laadt zonder startup-
    dependencyrepair, draait doctor en draait één lokale agentbeurt tegen een
    gemockt OpenAI-endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord te draaien.
- `pnpm test:docker:session-runtime-context`
  - Draait een deterministische built-app-Docker-smoke voor embedded runtime context-
    transcripts. Deze verifieert dat verborgen OpenClaw runtime context wordt gepersisteerd als een
    niet-weergegeven custom message in plaats van te lekken naar de zichtbare user turn,
    seedt daarna een getroffen gebroken session-JSONL en verifieert dat
    `openclaw doctor --fix` deze herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-packagecandidate in Docker, draait installed-package-
    onboarding, configureert Telegram via de geïnstalleerde CLI, en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde package als de SUT Gateway.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om een opgeloste lokale tarball te testen in plaats van
    uit de registry te installeren.
  - Gebruikt dezelfde Telegram-env-aanmeldgegevens of Convex-aanmeldgegevensbron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en de rolsecret in. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolsecret aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-environment en Convex-CI-credentialleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productbewijs als nevenrun
  tegen één candidate package. Deze accepteert een vertrouwde ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artifact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test`, en draait daarna de
  bestaande Docker-E2E-scheduler met smoke-, package-, product-, volledige of custom
  laneprofielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram-QA-workflow tegen hetzelfde `package-under-test`-artifact te draaien.
  - Laatste bèta-productbewijs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball-URL-bewijs vereist een digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifactbewijs downloadt een tarball-artifact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Verpakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd, en schakelt vervolgens gebundelde kanalen/plugins
    in via configbewerkingen.
  - Verifieert dat setup-discovery niet-geconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    plugin expliciet installeert, en dat een tweede herstart geen verborgen
    dependency-reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat legacy plugin-dependencyresten opruimt zonder een
    postinstall-reparatie aan de harness-kant.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna
    de geinstalleerde opdracht `openclaw update` uit in dezelfde guest en verifieert de
    geinstalleerde versie, updatestatus, gatewaygereedheid en een lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows`, of `--platform linux` tijdens
    itereren op een guest. Gebruik `--json` voor het pad naar het samenvattingsartifact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live bewijs van de
    agentbeurt. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-time-out zodat Parallels-transportstops
    niet de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lanelogs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log`, of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastgelopen is.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor- en pakketupdatewerk
    op een koude guest; dat is nog steeds gezond zolang de geneste npm-debuglog
    voortgang toont.
  - Voer deze aggregaatwrapper niet parallel uit met individuele Parallels-
    macOS-, Windows- of Linux-smokelanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of gatewaystatus van de guest.
  - Het post-updatebewijs voert het normale gebundelde pluginoppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip worden
    geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt zelf alleen
    een eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-provider-server voor directe protocol-smoketests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-backed Tuwunel-homeserver. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde credentials. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met niet-nul wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder een falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam beschikbaar stelt.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artifact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT van verzendverzoek door driver tot waargenomen SUT-antwoord.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet afdrijven; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-credentials via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA-lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeats
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén secret voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van credentialrol:
  - CLI: `--credential-role maintainer|ci`
  - Env-standaard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env-vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback `http://` Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Beheerdersopdrachten voor maintainers (pool add/remove/list) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live runs om de Convex-site-URL, broker-secrets,
endpointprefix, HTTP-time-out en admin/list-bereikbaarheid te controleren zonder
secretwaarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI
utilities.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Verzoek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succes: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainer-secret)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainer-secret)
  - Verzoek: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Actieve-leasebeveiliging: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainer-secret)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert misvormde payloads.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimale lat: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het pluginmanifest, mount als `openclaw qa <runner>`, en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Denk aan de suites als “toenemend realistisch” (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Config: niet-gerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-projectshards uitbreiden naar per-projectconfigs voor parallelle planning
- Bestanden: core-/unitinventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts`, en `test/**/*.test.ts`; UI-unittests draaien in de dedicated `unit-ui`-shard
- Scope:
  - Pure unittests
  - In-process integratietests (gateway-auth, routering, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loader-tests moeten breed `api.js`- en
    `runtime-api.js`-fallbackgedrag bewijzen met gegenereerde kleine pluginfixtures, niet met
    echte gebundelde pluginbron-API's. Echte plugin-API-loads horen thuis in
    plugin-owned contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Een ongerichte `pnpm test` voert twaalf kleinere shardconfiguraties uit (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van een enorm native root-projectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgrafiek, omdat een multi-shard watch-lus niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via gescopete lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het root-project vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope gescopete lanes: directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete bronmappings en lokale import-grafiekafhankelijken. Config-/setup-/pakketbewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert vervolgens de bijpassende typecheck-, lint- en guard-commando's uit. Vitest-tests worden niet uitgevoerd; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Versiebumpen met alleen releasemetadata draaien gerichte versie-/config-/root-dependency-checks, met een guard die pakketwijzigingen buiten het top-level versieveld afwijst.
    - Live Docker ACP-harnessbewerkingen draaien gerichte checks: shellsyntaxis voor de live Docker-auth-scripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere pakketoppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Import-lichte unittests van agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden routeren via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen changed-mode-runs ook naar expliciete naastliggende tests in die lichte lanes, zodat helperbewerkingen niet opnieuw de volledige zware suite voor die directory draaien.
    - `auto-reply` heeft speciale buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat niet één import-zware bucket de volledige Node-tail bezit.
    - Normale PR/main-CI slaat de extensie-batch-sweep en de release-only `agentic-plugins`-shard bewust over. Full Release Validation dispatcht de afzonderlijke `Plugin Prerelease`-child-workflow voor die plugin-/extensie-zware suites op release candidates.

  </Accordion>

  <Accordion title="Ingebedde runner-dekking">

    - Wanneer je discovery-inputs voor berichttools of de runtimecontext voor Compaction wijzigt,
      behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de ingebedde runner-integratiesuites gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat gescopete ids en Compaction-gedrag nog steeds
      via de echte `run.ts`- / `compact.ts`-paden lopen; helper-only tests zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool en isolatiestandaarden">

    - De basis-Vitest-configuratie gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-standaarden
      uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-processen
      om V8-compile-churn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff triggert.
    - De pre-commit-hook doet alleen formatting. Deze restaget geformatteerde bestanden en
      voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór handoff of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope gescopete lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, config-, pakket- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag,
      maar met een hogere workerlimiet.
    - Lokale worker-autoschaling is bewust conservatief en schaalt terug
      wanneer de host load average al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade doen.
    - De basis-Vitest-configuratie markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat changed-mode-reruns correct blijven wanneer testbedrading wijzigt.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus
      import-breakdown-output in.
    - `pnpm test:perf:imports:changed` scopet dezelfde profilingweergave naar
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Whole-config-runs gebruiken het configpad als sleutel; include-pattern-CI-shards
      voegen de shardnaam toe, zodat gefilterde shards afzonderlijk kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van zijn tijd besteedt aan opstartimports,
      houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam rechtstreeks in plaats van runtime-helpers diep te importeren alleen
      om ze via `vi.mock(...)` door te geven.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en
      print wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de gewijzigde-bestandenlijst via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread CPU-profiel voor
      Vitest-/Vite-opstart- en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte loopback Gateway met diagnostics ingeschakeld
  - Stuurt synthetische gatewaybericht-, geheugen- en grote-payload-churn door het diagnostische eventpad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt helpers voor persistentie van diagnostische stabiliteitsbundels
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure-budget blijven en per-session queuedieptes terug naar nul leeglopen
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde-plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-output opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van meerdere Gateway-instances
  - WebSocket-/HTTP-oppervlakken, node pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E: OpenShell-backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijke lokale Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH-exec
  - Verifieert remote-canonical filesystem-gedrag via de sandbox fs bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-gateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Commando: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en gebundelde-plugin-live-tests onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (zet `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - “Werkt deze provider/dit model _vandaag_ daadwerkelijk met echte credentials?”
  - Vangt providerformatwijzigingen, tool-calling-eigenaardigheden, auth-problemen en rate-limitgedrag op
- Verwachtingen:
  - Niet CI-stabiel naar ontwerp (echte netwerken, echte providerpolicies, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai bij voorkeur ingeperkte subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren config-/auth-materiaal naar een tijdelijke test-home, zodat unitfixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte homedirectory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: deze behoudt `[live] ...`-voortgangsoutput, maar onderdrukt de extra `~/.profile`-melding en dempt gateway-bootstraplogs/Bonjour-chatter. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (provider-specifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responses.
- Voortgangs-/Heartbeat-output:
  - Live-suites sturen nu voortgangsregels naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/gateway-voortgangsregels direct streamen tijdens live-runs.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslissingstabel:

- Bewerkingslogica/-tests: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- “mijn bot is offline” / provider-specifieke fouten / tool-aanroepen debuggen: voer een versmalde `pnpm test:live` uit

## Live-tests (met netwerktoegang)

Voor de live-modelmatrix, CLI-backend-smoketests, ACP-smoketests, het Codex-appserver-testharnas en alle live-tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, afbeelding, muziek, video, mediatestharnas) — plus credentialafhandeling voor live-runs — zie [Live-suites testen](/nl/help/testing-live). Voor de specifieke checklist voor updates en Plugin-validatie zie [Updates en Plugins testen](/nl/help/testing-updates-plugins).

## Docker-uitvoerders (optionele "werkt in Linux"-controles)

Deze Docker-uitvoerders zijn opgesplitst in twee groepen:

- Live-modeluitvoerders: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun bijbehorende live-bestand met profielsleutel uit binnen de Docker-image van de repo (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en werkruimte worden aangekoppeld (en `~/.profile` wordt ingelezen als die is aangekoppeld). De bijbehorende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-uitvoerders gebruiken standaard een kleinere smoketestlimiet, zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die omgevingsvariabelen wanneer je
  expliciet de grotere, volledige scan wilt.
- `test:docker:all` bouwt de live-Docker-image eenmaal via `test:docker:live-build`, verpakt OpenClaw eenmaal als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-uitvoerder voor install-/update-/Plugin-dependency-lanes; die lanes koppelen de vooraf gebouwde tarball aan. De functionele image installeert dezelfde tarball in `/app` voor lanes met gebouwde-app-functionaliteit. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregatie gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt procesplaatsen, terwijl capaciteitslimieten voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve limieten, kan de scheduler die toch starten wanneer de pool leeg is en laat hij die vervolgens alleen draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 plaatsen, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer ruimte heeft. De uitvoerder voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, slaat timings van geslaagde lanes op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, pakket-/imagebehoeften en credentials te printen.
- `Package Acceptance` is de GitHub-native pakketgate voor "werkt deze installeerbare tarball als product?" Deze lost één kandidaatpakket op uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test` en voert daarna de herbruikbare Docker E2E-lanes uit tegen precies die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn gerangschikt op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, release-standaarden en fouttriage.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graaf vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart imports van pakketdependencies zoals Commander, prompt-UI, undici of logging binnenhaalt vóór commandodispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. De verpakte CLI-smoketest dekt ook hoofdhulp, onboardinghulp, doctorhulp, status, configuratieschema en een model-lijstcommando.
- Verouderde compatibiliteit voor Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert het testharnas alleen metadatahiaten van verzonden pakketten: weggelaten private QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende persistente `update.channel`, verouderde locaties voor Plugin-installatierecords, ontbrekende persistentie van marketplace-installatierecords en migratie van configuratiemetadata tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Containersmoketest-uitvoerders: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` en `test:docker:config-reload` starten één of meer echte containers en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-uitvoerders koppelen ook alleen de benodigde CLI-auth-homes aan (of alle ondersteunde homes wanneer de run niet is versmald) en kopiëren die vervolgens naar de container-home vóór de run, zodat OAuth van externe CLI's tokens kan vernieuwen zonder de auth-opslag van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harnas-smoketest: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + ontwikkelagent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-broncheckout-lane. Deze maakt opzettelijk geen deel uit van Docker-release-lanes voor pakketten, omdat de npm-tarball QA Lab weglaat.
- Open WebUI-live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding/kanaal/agent-smoketest: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert één gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoketest voor wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt van pakket `stable` naar git `dev`, verifieert dat het bewaarde kanaal en de Plugin-na-update werken, schakelt daarna terug naar pakket `stable` en controleert de updatestatus.
- Upgrade-overlevingssmoketest: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vervuilde fixture van een oude gebruiker met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande werkruimte-/sessiebestanden. Het voert pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een local loopback Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Gepubliceerde upgrade-overlevingssmoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestanden van bestaande gebruikers, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een local loopback Gateway en controleert geconfigureerde intents, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregatiescheduler exacte baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert persistentie van verborgen runtimecontext-transcripten plus doctor-reparatie van getroffen gedupliceerde prompt-herschrijftakken.
- Bun-globale-installatie-smoketest: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige boom in, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde afbeeldingsproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen zijn root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-invoer van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan, zodat root-eigendom cache-items het installatiegedrag voor gebruikers lokaal niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache opnieuw te gebruiken bij lokale herhalingen.
- Install Smoke CI slaat de dubbele direct-npm-globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- Agents-delete-gedeelde-werkruimte-CLI-smoketest: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één werkruimte in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag waarbij de werkruimte behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + gezondheid): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, naar cursor gepromoveerde klikbare elementen, iframe-refs en framemetadata dekken.
- OpenAI Responses web_search-regressie met minimale redenering: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de providerschema-afwijzing en controleert dat de ruwe details in Gateway-logs verschijnen.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude-notificatieframe-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel-allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-cleanup (echte Gateway + teardown van stdio-MCP-child na geïsoleerde Cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git-bewegende refs, ClawHub-kitchen-sink, marketplace-updates en Claude-bundel inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config-herlaadmetadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketests voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git-bewegende refs, ClawHub-fixtures, marketplace-updates en Claude-bundel inschakelen/inspecteren. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde Plugins.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` krijgen nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image wijst, trekken de scripts deze op als deze nog niet lokaal is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners mounten de huidige checkout ook read-only en
stagen deze naar een tijdelijke werkmap binnen de container. Dit houdt de runtime-
image slank terwijl Vitest nog steeds tegen je exacte lokale bron/configuratie
draait.
De stagingstap slaat grote lokale-only caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputmappen zodat Docker-live-runs geen minuten besteden aan het kopiëren
van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in zodat Gateway-liveprobes geen
echte Telegram/Discord/etc.-kanaalworkers binnen de container starten.
`test:docker:live-models` voert nog steeds `pnpm test:live` uit, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-
livedekking uit die Docker-lane wilt beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteits-smoketest op hoger niveau: deze start een
OpenClaw-gatewaycontainer met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` beschikbaar stelt, en verzendt daarna een
echte chatrequest via de `/api/chat/completions`-proxy van Open WebUI.
De eerste run kan merkbaar trager zijn omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startinstallatie moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in gedockeriseerde runs te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is opzettelijk deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert daarna routed gespreksdetectie, transcriptlezingen, bijlagemetadata,
live eventqueue-gedrag, outbound verzendrouting en Claude-achtige kanaal- +
machtigingsnotificaties via de echte stdio-MCP-bridge. De notificatiecontrole
inspecteert de raw stdio-MCP-frames rechtstreeks, zodat de smoketest valideert wat de
bridge daadwerkelijk uitzendt, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio-MCP-probeserver
binnen de container, materialiseert die server via de ingebedde Pi-bundel-
MCP-runtime, voert de tool uit en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` deze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-model-
sleutel nodig. Het start een geseede Gateway met een echte stdio-MCP-probeserver, voert een
geïsoleerde Cron-beurt en een `/subagents spawn`-eenmalige childbeurt uit, en verifieert daarna
dat het MCP-childproces na elke run wordt afgesloten.

Handmatige ACP-thread-smoketest in gewone taal (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadroutingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en ingelezen voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn ingelezen, met tijdelijke config-/workspace-mappen en zonder externe CLI-auth-koppelingen
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-auth-mappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Versmalde providerruns koppelen alleen de benodigde mappen/bestanden die uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` worden afgeleid
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor herhalingen waarvoor geen rebuild nodig is
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat referenties uit de profielopslag komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway beschikbaar wordt gemaakt voor de Open WebUI-smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de vastgezette Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docs-controles uit na docs-wijzigingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook headingcontroles binnen pagina’s nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de “echte pipeline” zonder echte providers:

- Gateway-toolaanroep (mock OpenAI, echte gateway + agentlus): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Betrouwbaarheidsevaluaties voor agents (skills)

We hebben al enkele CI-veilige tests die zich gedragen als “betrouwbaarheidsevaluaties voor agents”:

- Mock-toolaanroepen via de echte gateway + agentlus (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en config-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante skills)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt hij de vereiste stappen/argumenten?
- **Workflowcontracten:** multi-turnscenario’s die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen controleren.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner die mockproviders gebruikt om toolaanroepen + volgorde, lezen van skillbestanden en sessiebedrading te controleren.
- Een kleine suite skillgerichte scenario’s (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (vorm van plugin en kanaal)

Contracttests verifiëren dat elke geregistreerde plugin en elk kanaal voldoet aan het
interfacecontract. Ze itereren over alle gevonden plugins en voeren een suite van
vorm- en gedragsasserties uit. De standaard `pnpm test`-unitlane slaat deze gedeelde seam- en smoke-bestanden bewust over; voer de contractcommando’s expliciet uit
wanneer je gedeelde kanaal- of provideroppervlakken aanraakt.

### Commando’s

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Te vinden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basisvorm van plugin (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Verwerking van inkomende berichten
- **actions** - Kanaalactiehandlers
- **threading** - Afhandeling van thread-ID
- **directory** - Directory-/roster-API
- **group-policy** - Afdwinging van groepsbeleid

### Providerstatuscontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Vorm van pluginregister

### Providercontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugindetectie
- **loader** - Plugin laden
- **runtime** - Providerruntime
- **shape** - Pluginvorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een kanaal- of providerplugin
- Na het refactoren van pluginregistratie of -detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent alleen live is (rate limits, authbeleid), houd de live test beperkt en opt-in via env vars
- Richt je bij voorkeur op de kleinste laag die de bug opvangt:
  - providerrequestconversie-/replaybug → directe modeltest
  - gateway-sessie-/geschiedenis-/toolpipelinebug → gateway live-smoke of CI-veilige gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled doel per SecretRef-klasse af uit registermetadata (`listSecretTargetRegistryEntries()`) en controleert vervolgens dat exec-id’s met traversal-segmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde doel-id’s, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
