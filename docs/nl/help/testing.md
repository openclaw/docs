---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-, e2e- en live-testsuites, Docker-testuitvoerders en wat elke test afdekt'
title: Testen
x-i18n:
    generated_at: "2026-05-03T11:11:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke commando's je uitvoert voor veelvoorkomende workflows (lokaal, voor pushen, debuggen).
- Hoe live-tests referenties ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor model-/providerproblemen uit de praktijk.

<Note>
**QA-stack (qa-lab, qa-channel, live-transportlanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario-authoring.
- [Matrix-QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De sectie voor QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel aan de slag

De meeste dagen:

- Volledige controle (verwacht voor pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale run van de volledige suite op een ruime machine: `pnpm test:max`
- Directe Vitest-watchlus: `pnpm test:watch`
- Directe bestandsselectie routeert nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan een enkele fout itereert.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra zekerheid wilt:

- Dekkingscontrole: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte referenties):

- Live-suite (modellen + Gateway-tool-/image-probes): `pnpm test:live`
- Richt je stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte `openai/gpt-5.4`-agentbeurt of
  `deep_profile=true` voor Kova-CPU-/heap-/trace-artifacts. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.4-lane-artifacts naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook bron-niveau Gateway-opstart-, geheugen-,
  Plugin-druk-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt plus een kleine bestandsleesachtige probe uit.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine image-beurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, die afzonderlijke Docker live-model
    matrixjobs bevat, geshard per provider.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-aanroepers ervan.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live-lane uit tegen het Codex app-serverpad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna een gewone reply en een image-attachment
    route via de native Plugin-binding in plaats van ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de Plugin-eigen Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image-,
    Cron-MCP-, subagent- en Guardian-probes. Schakel de subagent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-serverfouten isoleert. Voor een gerichte subagentcontrole schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit sluit af na de subagent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue-command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in riem-en-bretelscontrole voor het message-channel rescue-command
    surface. Deze oefent `/crestodian status`, zet een persistente modelwijziging
    in de wachtrij, antwoordt `/crestodian yes`, en verifieert het audit-/config-schrijpad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een nep-Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite getypeerde
    configschrijfactie.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Begint vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup-/model-/agent-/Discord-Plugin- + SecretRef-schrijfacties toe,
    valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setuppad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistant-transcript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falend geval nodig hebt, geef dan de voorkeur aan het vernauwen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-labrealisme nodig hebt:

CI voert QA Lab uit in toegewijde workflows. Agentische pariteit is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet een zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. `QA-Lab - All Lanes`
draait elke nacht op `main` en vanuit handmatige dispatch met de mock-parity-lane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord
-lane als parallelle jobs. Geplande QA en releasechecks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix CLI en handmatige workflowinput
standaard `all` blijven; handmatige dispatch kan `all` sharden in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert pariteit plus de snelle Matrix- en Telegram-lanes uit vóór release-
goedkeuring, met `mock-openai/gpt-5.5` voor release-transportchecks zodat ze
deterministisch blijven en normale provider-Plugin-opstart vermijden. Deze live-transport
Gateways schakelen geheugenzoekopdrachten uit; geheugengedrag blijft gedekt door de QA-parity
-suites.

Full-release live-mediashards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` heeft. Docker live-model-/backendshards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geisoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriele lane.
  - Sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende afsluitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbench plus een klein mock-QA Lab-scenariopakket uit
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde samenvatting van CPU-observaties
    onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metrieken worden
    vastgelegd zonder eruit te zien als de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout nog geen
    verse runtime-uitvoer heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Gebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-authenticatie-invoer door die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA-liveproviderconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Uitvoermappen moeten onder de repo-root blijven zodat de guest via de
    gemounte workspace kan terugschrijven.
  - Schrijft het normale QA-rapport + de samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve onboarding met een OpenAI API-sleutel uit, configureert standaard Telegram,
    verifieert dat de verpakte Plugin-runtime laadt zonder
    afhankelijkheidsreparatie bij het opstarten, voert doctor uit en voert een lokale agentbeurt uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoke van de gebouwde app uit voor ingebedde runtimecontext-
    transcripties. Het verifieert dat verborgen OpenClaw-runtimecontext wordt opgeslagen als een
    niet-weergegeven custom bericht in plaats van te lekken naar de zichtbare gebruikersbeurt,
    seedt daarna een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` die herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding voor het geinstalleerde pakket uit,
    configureert Telegram via de geinstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geinstalleerde pakket als de SUT-Gateway.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit de registry
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-credentials of Convex-credentialbron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim in. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Die draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-credentialleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor side-run productbewijs
  tegen een kandidaatpakket. Het accepteert een vertrouwde ref, gepubliceerde npm-specificatie,
  HTTPS-tarball-URL plus SHA-256, of tarballartefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of custom
  lane-profielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artefact uit te voeren.
  - Laatste beta-productbewijs:

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

- Artefactbewijs downloadt een tarballartefact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt daarna gebundelde kanalen/plugins in via configuratie-
    bewerkingen.
  - Verifieert dat setupdetectie ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    Plugin expliciet installeert en dat een tweede herstart geen verborgen afhankelijkheids-
    reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd en verifieert dat de
    post-update doctor van de kandidaat legacy-Plugin-afhankelijkheidsresten opruimt zonder een
    postinstall-reparatie aan harnesszijde.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna
    de geinstalleerde opdracht `openclaw update` in dezelfde guest uit en verifieert de
    geinstalleerde versie, updatestatus, Gateway-gereedheid en een lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op een guest. Gebruik `--json` voor het pad van het samenvattingsartefact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agentbeurtbewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-time-out zodat Parallels-transportstalls niet
    de rest van het testvenster kunnen gebruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lanelogs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper is vastgelopen.
  - Windows-update kan op een koude guest 10 tot 15 minuten besteden aan post-update doctor- en pakket-
    updatewerk; dat is nog steeds gezond wanneer de geneste npm-
    debuglog vooruitgaat.
  - Voer deze aggregaatwrapper niet parallel uit met afzonderlijke Parallels
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of de Gateway-status van de guest.
  - Het post-updatebewijs voert het normale gebundelde Plugin-oppervlak uit omdat
    capabilityfacades zoals spraak, afbeeldingsgeneratie en media-
    begrip worden geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt
    zelf alleen een eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocolsmoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privegroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde credentials. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende afsluitcode.
  - Vereist twee verschillende bots in dezelfde privegroep, waarbij de SUT-bot een Telegram-gebruikersnaam blootlegt.
  - Schakel voor stabiele bot-naar-botobservatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en artefact met geobserveerde berichten onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT van het driververzendverzoek tot de geobserveerde SUT-reactie.

Live-transportlanes delen een standaardcontract zodat nieuwe transports niet afdwalen; de dekkingsmatrix per lane staat in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-credentials via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een Convex-ondersteunde pool, heartbeats
die lease terwijl de lane draait en geeft de lease vrij bij afsluiten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Een geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Credential-rolselectie:
  - CLI: `--credential-role maintainer|ci`
  - Env-standaard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env-vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback-`http://` Convex-URL's toe voor alleen lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normale werking `https://` gebruiken.

Maintainer-beheeropdrachten (pool toevoegen/verwijderen/listen) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` voor live-runs om de Convex-site-URL, brokergeheimen,
eindpuntprefix, HTTP-time-out en admin-/lijstbereikbaarheid te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard-endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Verzoek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Geslaagd: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw probeerbaar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainergeheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Geslaagd: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Verzoek: `{ credentialId, actorId }`
  - Geslaagd: `{ status: "ok", changed, credential }`
  - Actieve leasebeveiliging: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Geslaagd: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-soort:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-tekenreeks zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en wijst onjuist gevormde payloads af.

### Een kanaal toevoegen aan QA

De architectuur en namen van scenariohelpers voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, koppel als `openclaw qa <runner>` en maak scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als “toenemend realistisch” (en toenemend foutgevoelig/kostbaar):

### Unit / integratie (standaard)

- Commando: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de shardset `vitest.full-*.config.ts` en kunnen shards met meerdere projecten uitbreiden naar configuraties per project voor parallelle planning
- Bestanden: core-/unitinventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de speciale `unit-ui`-shard
- Bereik:
  - Pure unittests
  - In-process integratietests (gatewayauthenticatie, routing, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-loads horen thuis in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test` draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native hoofdprojectproces. Dit verlaagt piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk ongerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native hoofdprojectgrafiek `vitest.config.ts`, omdat een watch-loop met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige opstartkosten van het hoofdproject betaalt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronkoppelingen en lokale importgrafiekafhankelijken. Configuratie-/setup-/pakketbewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale checkgate voor smal werk. Deze classificeert de diff in core, coretests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en draait daarna de bijpassende typecheck-, lint- en guardcommando's. Deze draait geen Vitest-tests; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Versiebumpen met alleen releasemetadata draaien gerichte versie-/configuratie-/rootafhankelijkheidschecks, met een guard die pakketwijzigingen buiten het hoogste versieveld afwijst.
    - Bewerkingen aan de live Docker ACP-harnas draaien gerichte checks: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-planner. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; afhankelijkheids-, export-, versie- en andere pakketoppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unittests uit agents, commando's, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utilitygebieden routeren via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtimezware bestanden blijven op de bestaande lanes.
    - Geselecteerde bronbestanden van helpers in `plugin-sdk` en `commands` koppelen changed-mode-runs ook aan expliciete naastgelegen tests in die lichte lanes, zodat helperbewerkingen de volledige zware suite voor die directory niet opnieuw hoeven te draaien.
    - `auto-reply` heeft speciale buckets voor corehelpers op topniveau, `reply.*`-integratietests op topniveau en de `src/auto-reply/reply/**`-subboom. CI splitst de reply-subboom verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extensiebatchsweep en de alleen-voor-release `agentic-plugins`-shard over. Volledige releasevalidatie dispatcht de afzonderlijke child-workflow `Plugin Prerelease` voor die Plugin-/extensiezware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Dekking van embedded runner">

    - Wanneer je invoer voor berichttooldetectie of runtimecontext voor
      Compaction wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de integratiesuites voor embedded runner gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped id's en Compaction-gedrag nog steeds
      via de echte `run.ts`- / `compact.ts`-paden lopen; alleen-helpertests zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool en isolatiestandaarden">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner in de hoofdprojecten, e2e en live configuraties.
    - De hoofd-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde standaardwaarden `threads` + `isolate: false`
      uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om met standaard V8-
      gedrag te vergelijken.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff triggert.
    - De pre-commit-hook doet alleen formattering. Deze staged geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai `pnpm check:changed` expliciet vóór overdracht of push wanneer je
      de slimme lokale checkgate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harnas-, configuratie-, pakket- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag,
      alleen met een hogere werkercap.
    - Automatisch schalen van lokale workers is bewust conservatief en schaalt terug
      wanneer de gemiddelde hostbelasting al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade aanrichten.
    - De basisconfiguratie van Vitest markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat reruns in changed-mode correct blijven wanneer
      testbedrading verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profilering.

  </Accordion>

  <Accordion title="Prestatiedebugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profileringsweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shardtiminggegevens worden geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs van hele configuraties gebruiken het configuratiepad als sleutel; CI-shards met
      include-patroon voegen de shardnaam toe zodat gefilterde shards afzonderlijk
      kunnen worden gevolgd.
    - Wanneer één hete test nog steeds het grootste deel van zijn tijd in opstartimports doorbrengt,
      houd zware afhankelijkheden dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze door `vi.mock(...)` te halen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native hoofdprojectpad voor die gecommitte diff
      en print wandtijd plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      vuile boom door de gewijzigde bestandslijst via
      `scripts/test-projects.mjs` en de hoofd-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de hoofdthread voor
      Vitest-/Vite-opstart en transformoverhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+-heapprofielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Bereik:
  - Start standaard een echte loopback-Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische Gateway-berichten-, geheugen- en grote-payloadchurn via het diagnostische gebeurtenispad
  - Bevraagt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostische stabiliteitsbundels
  - Controleert dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutel
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde-Plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om overhead door console-I/O te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Bereik:
  - End-to-endgedrag van Gateway met meerdere instanties
  - WebSocket-/HTTP-oppervlakken, Node-koppeling en zwaardere netwerken
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E: OpenShell-backend-smoke

- Opdracht: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Bereik:
  - Start een geïsoleerde OpenShell Gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijke lokale Dockerfile
  - Test OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH-uitvoering
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-brug
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaarduitvoering van `pnpm test:e2e`
  - Vereist een lokale `openshell` CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME`, en vernietigt daarna de test-Gateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig uitvoert
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte aanbieders + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, en live tests voor gebundelde Plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Bereik:
  - “Werkt deze aanbieder/dit model _vandaag_ echt met echte inloggegevens?”
  - Vangt wijzigingen in aanbiedersformaten, eigenaardigheden bij toolaanroepen, authenticatieproblemen en gedrag rond snelheidslimieten op
- Verwachtingen:
  - Bewust niet CI-stabiel (echte netwerken, echt aanbiedersbeleid, quota, storingen)
  - Kost geld / gebruikt snelheidslimieten
  - Voer bij voorkeur beperkte subsets uit in plaats van “alles”
- Live-uitvoeringen sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-uitvoeringen nog steeds `HOME` en kopiëren ze configuratie-/authenticatiemateriaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je live tests bewust je echte homedirectory wilt laten gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- Rotatie van API-sleutels (aanbiederspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of een override per live-uitvoering via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij snelheidslimietreacties.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites geven nu voortgangsregels uit naar stderr, zodat lange aanroepen naar aanbieders zichtbaar actief zijn, zelfs wanneer Vitest-consolecapturing stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat voortgangsregels van aanbieder/Gateway direct streamen tijdens live-uitvoeringen.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppelen aanraken: voeg `pnpm test:e2e` toe
- “Mijn bot ligt eruit” / aanbiederspecifieke fouten / toolaanroepen debuggen: voer een beperkte `pnpm test:live` uit

## Live (netwerk-aanrakende) tests

Voor de live modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harnas, en alle live tests voor media-aanbieders (Deepgram, BytePlus, ComfyUI, afbeelding,
muziek, video, mediaharnas) — plus credential-afhandeling voor live-uitvoeringen — zie
[Live suites testen](/nl/help/testing-live). Voor de specifieke update- en
Plugin-validatiechecklist, zie
[Updates en Plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-controles)

Deze Docker-runners vallen uiteen in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende live bestand met profielsleutel uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en werkruimte worden gemount (en `~/.profile` wordt gesourcet als die is gemount). De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker live-runners gebruiken standaard een kleinere smoke-limiet, zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live Docker-image eenmaal via `test:docker:live-build`, verpakt OpenClaw eenmaal als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor functionaliteitslanes van de gebouwde app. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregatie gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` regelt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en deze daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, bewaart timings van geslaagde lanes in `.artifacts/docker-tests/lane-timings.json`, en gebruikt die timings om langere lanes bij latere uitvoeringen eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lane-manifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan te printen voor geselecteerde lanes, pakket-/imagebehoeften en credentials.
- `Package Acceptance` is de GitHub-native pakketgate voor "werkt deze installeerbare tarball als product?" Deze resolveert één kandidaatpakket vanuit `source=npm`, `source=ref`, `source=url`, of `source=artifact`, uploadt het als `package-under-test`, en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product`, en `full`. Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/Plugin-contract, de published-upgrade survivor-matrix, release-standaarden en foutentriage.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanuit `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart imports maakt van pakketafhankelijkheden zoals Commander, prompt-UI, undici of logging vóór command dispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. Packaged CLI-smoke dekt ook root-help, onboard-help, doctor-help, status, configuratieschema en een model-list-opdracht.
- Legacy-compatibiliteit van Package Acceptance is beperkt tot `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert het harnas alleen metadatagaten van verzonden pakketten: weggelaten private QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin-install-record-locaties, ontbrekende marketplace-install-record-persistentie en migratie van configuratiemetadata tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, en `test:docker:config-reload` starten een of meer echte containers op en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de uitvoering niet is beperkt), en kopiëren die daarna naar de container-home vóór de uitvoering, zodat externe-CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harnassmoketest: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-lane voor source-checkout. Deze maakt bewust geen deel uit van package-Docker-release-lanes, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-smoketest voor onboarding/kanaal/agent: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert één gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoketest voor wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt van package `stable` naar git `dev`, verifieert dat het opgeslagen kanaal en de plugin na de update werken, schakelt vervolgens terug naar package `stable` en controleert de updatestatus.
- Upgrade-survivor-smoketest: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vervuilde old-user-fixture met agents, kanaalconfiguratie, plugin-allowlists, verouderde plugin-dependency-status en bestaande workspace-/sessiebestanden. Het voert package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus opstart-/statusbudgetten.
- Gepubliceerde upgrade-survivor-smoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande gebruikersbestanden, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, laat de geaggregeerde planner exacte baselines uitbreiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `all-since-2026.4.23`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de set reported-issues bevat `configured-plugin-installs` voor automatisch herstel van externe OpenClaw-plugininstallaties. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert persistentie van transcripties met verborgen runtimecontext plus doctor-herstel van getroffen gedupliceerde prompt-herschrijftakken.
- Bun-smoketest voor globale installatie: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige tree, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde image providers retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of op GitHub met de `update_baseline_version`-input van de Install Smoke-workflow. Niet-root installer-controles houden een geïsoleerde npm-cache bij, zodat cache-items die eigendom zijn van root geen gebruikerslokale installatiegedrag maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache bij lokale herhalingen te hergebruiken.
- Install Smoke CI slaat de dubbele direct-npm globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die env uit wanneer directe `npm install -g`-dekking nodig is.
- Agents delete shared workspace CLI-smoketest: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag waarbij de workspace behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, naar klikbaar gepromoveerde cursors, iframe-refs en framemetadata dekken.
- OpenAI Responses web_search-regressie voor minimale reasoning: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de providerschema-afwijzing en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP-cleanup (echte Gateway + afbouw van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-registry met gehoste dependencies, bewegende git-refs, ClawHub kitchen-sink, marketplace-updates en Claude-bundle enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-unchanged-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecycle-matrix-smoketest: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt enable/disable om, upgradet en downgradet deze via een lokale npm-registry, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS/CPU-metrics voor elke lifecyclefase worden gelogd.
- Config reload metadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketests voor lokaal pad, `file:`, npm-registry met gehoste dependencies, bewegende git-refs, ClawHub-fixtures, marketplace-updates en Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte npm-plugininstallatie, enable, disable, upgrade, downgrade en uninstall bij ontbrekende code.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hebben nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image wijst, halen de scripts deze op als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests houden hun eigen Dockerfiles omdat ze package-/installatiegedrag valideren in plaats van de gedeelde built-app-runtime.

De Docker-runners voor live-modellen koppelen ook de huidige checkout alleen-lezen aan en
plaatsen die in een tijdelijke workdir binnen de container. Zo blijft de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale source/config draait.
De stagingstap slaat grote lokale-only caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputdirectories, zodat Docker-live-runs geen minuten besteden aan het
kopiëren van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen
echte Telegram/Discord/etc.-channel workers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-livecoverage uit die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een smoke-test voor compatibiliteit op hoger niveau: deze start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` exposeert, en stuurt vervolgens een
echt chatverzoek via Open WebUI's `/api/chat/completions`-proxy.
De eerste run kan merkbaar trager zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startsetup moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in Docker-runs te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het boot een vooraf gevulde Gateway-
container, start een tweede container die `openclaw mcp serve` start, en
verifieert daarna routed conversation discovery, transcriptreads, metadata van bijlagen,
gedrag van de live event queue, outbound send routing, en Claude-stijl channel- +
toestemmingsnotificaties over de echte stdio MCP-bridge. De notificatiecheck
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke-test valideert wat de
bridge daadwerkelijk uitzendt, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de ingebedde Pi-bundel
MCP-runtime, voert de tool uit, en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-modelsleutel
nodig. Het start een vooraf gevulde Gateway met een echte stdio MCP-probeserver, draait een
geïsoleerde Cron-turn en een `/subagents spawn` eenmalige child-turn, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP-thread-smoke in gewone taal (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-thread-routingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspace-dirs en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties binnen Docker
- Externe CLI-auth-dirs/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna gekopieerd naar `/home/node/...` voordat tests starten
  - Standaarddirs: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte provider-runs koppelen alleen de benodigde dirs/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommalijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway wordt geëxposeerd voor de Open WebUI-smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt die door de Open WebUI-smoke wordt gebruikt te overschrijven
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docs-checks uit na docs-bewerkingen: `pnpm check:docs`.
Draai volledige Mintlify-ankervalidatie wanneer je ook headingchecks binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway-toolcalling (mock OpenAI, echte Gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Betrouwbaarheidsevals voor agents (Skills)

We hebben al een paar CI-veilige tests die zich gedragen als "betrouwbaarheidsevals voor agents":

- Mock-toolcalling via de echte Gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die session-wiring en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt hij vereiste stappen/args?
- **Workflowcontracten:** multi-turnscenario's die toolvolgorde, behoud van sessiegeschiedenis en sandboxgrenzen assert-en.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenario-runner die mock-providers gebruikt om toolcalls + volgorde, skillbestandsreads en session-wiring te assert-en.
- Een kleine suite met skillgerichte scenario's (gebruiken vs vermijden, gating, prompt injection).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en channelvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd channel aan het
interfacecontract voldoet. Ze itereren over alle ontdekte Plugins en draaien een suite van
shape- en gedragsassertions. De standaard `pnpm test`-unitlane slaat deze gedeelde seam- en smoke-bestanden bewust over; voer de contractcommando's expliciet uit
wanneer je gedeelde channel- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basale Plugin-vorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Session-bindinggedrag
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Channelactie-handlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channelstatusprobes
- **registry** - Vorm van Plugin-registry

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/-selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-discovery
- **loader** - Plugin-laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer draaien

- Na het wijzigen van plugin-sdk-exports of subpaths
- Na het toevoegen of wijzigen van een channel- of provider-Plugin
- Na het refactoren van Plugin-registratie of discovery

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shapetransformatie vast)
- Als het inherent alleen live is (rate limits, authbeleid), houd de livetest dan smal en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug opvangt:
  - providerrequest-conversie-/replaybug → directe modeltest
  - Gateway-session-/history-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled doel per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat traversal-segment exec ids worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target ids, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en Plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
