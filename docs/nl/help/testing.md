---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressies toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-07-02T08:29:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een handleiding voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, pre-push, debuggen).
- Hoe live-tests referenties ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, opdrachtoppervlak, scenario-authoring.
- [Matrix-QA](/nl/concepts/qa-matrix) - referentie voor `pnpm openclaw qa matrix`.
- [Maturity-scorecard](/nl/maturity/scorecard) - hoe release-QA-bewijs stabiliteits- en LTS-beslissingen ondersteunt.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transportplugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker-/Parallels-runners. De sectie met QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de bovenstaande referenties.
</Note>

## Snel aan de slag

Op de meeste dagen:

- Volledige gate (verwacht vóór push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale full-suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watchlus: `pnpm test:watch`
- Directe bestandsselectie routeert nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één fout itereert.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

## Tijdelijke testmappen

Geef de voorkeur aan de gedeelde helpers in `test/helpers/temp-dir.ts` voor tijdelijke
mappen die eigendom zijn van tests. Ze maken eigenaarschap expliciet en houden opschoning in dezelfde
testlevenscyclus:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` stelt bewust geen handmatige opschoningsmethode beschikbaar; Vitest
bezit de opschoning na elke test. Bestaande helpers op lager niveau blijven bestaan voor tests die
nog niet zijn gemigreerd, maar nieuwe en gemigreerde tests moeten de automatisch opschonende
tracker gebruiken. Vermijd nieuw handmatig gebruik van `makeTempDir`, `cleanupTempDirs` of
`createTempDirTracker` en vermijd nieuwe kale `fs.mkdtemp*`-aanroepen in tests,
tenzij een case expliciet ruw temp-dir-gedrag verifieert. Voeg een controleerbare
allow-opmerking toe met een concrete reden wanneer een test bewust een kale tijdelijke
map nodig heeft:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Voor migratiezichtbaarheid rapporteert `node scripts/report-test-temp-creations.mjs`
nieuwe kale temp-dir-aanmaak en nieuw handmatig gebruik van gedeelde helpers in toegevoegde diff-regels
zonder bestaande opschoningsstijlen te blokkeren. De bestandsscope volgt bewust
dezelfde testpadclassificatie die door `scripts/changed-lanes.mjs` wordt gebruikt,
in plaats van een aparte bestandsnaamheuristiek voor testhelpers te onderhouden, terwijl
de gedeelde helperimplementatie zelf wordt overgeslagen. `check:changed` voert dit rapport uit voor
gewijzigde testpaden als een waarschuwing-only CI-signaal; bevindingen zijn GitHub-waarschuwingsannotaties,
geen fouten.

Bij het debuggen van echte providers/modellen (vereist echte referenties):

- Live-suite (modellen + gateway-tool-/image-probes): `pnpm test:live`
- Richt je stil op één livebestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_openai_candidate=true` voor een echte `openai/gpt-5.5`-agentbeurt of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artefacten. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.5-lane-artefacten naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook source-level gateway-boot-, geheugen-,
  plugin-pressure-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt plus een kleine file-read-achtige probe uit.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine image-beurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, wat afzonderlijke Docker live model
    matrix-jobs omvat die per provider zijn geshard.
  - Voor gerichte CI-reruns, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live-lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna een platte reactie en een image-bijlage
    die via de native plugin-binding lopen in plaats van ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert gateway-agentbeurten uit via de plugin-owned Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit sluit af na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Codex on-demand install-smoke: `pnpm test:docker:codex-on-demand`
  - Installeert de verpakte OpenClaw-tarball in Docker, voert OpenAI API-key
    onboarding uit en verifieert dat de Codex-plugin plus `@openai/codex`-dependency
    on-demand zijn gedownload naar de beheerde npm-projectroot.
- Live plugin tool dependency-smoke: `pnpm test:docker:live-plugin-tool`
  - Verpakt een fixture-plugin met een echte `slugify`-dependency, installeert deze via
    `npm-pack:`, verifieert de dependency onder de beheerde npm-projectroot,
    vraagt daarna een live OpenAI-model om de plugintool aan te roepen en de verborgen
    slug terug te geven.
- Crestodian rescue command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders-check voor het command-oppervlak voor redding via berichtenkanaal.
    Deze oefent `/crestodian status`, queued een persistente modelwijziging,
    antwoordt `/crestodian yes` en verifieert het audit-/config-schrij pad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner fallback wordt vertaald naar een geaudite typed
    config-write.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Begint vanuit een lege OpenClaw state-dir, verifieert het moderne onboard
    Crestodian-entrypoint, past setup/model/agent/Discord-plugin + SecretRef
    writes toe, valideert config en verifieert auditentries. Hetzelfde Ring 0 setup-pad
    wordt ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: voer met `MOONSHOT_API_KEY` ingesteld
  `openclaw models list --provider moonshot --json` uit, voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falende case nodig hebt, geef dan de voorkeur aan het versmallen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI voert QA Lab uit in toegewezen workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als standalone PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de release-checks-QA-groep. Stabiele/default release
checks houden exhaustieve live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait elke nacht op `main` en vanuit handmatige dispatch met de mock parity lane, live
Matrix-lane, Convex-managed live Telegram-lane en Convex-managed live Discord
lane als parallelle jobs. Geplande QA en releasechecks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix CLI en handmatige workflowinput
default `all` blijven; handmatige dispatch kan `all` sharden naar `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert parity plus de snelle Matrix- en Telegram-lanes uit vóór release
approval, met `mock-openai/gpt-5.5` voor release-transportchecks zodat ze
deterministisch blijven en normale provider-plugin-opstart vermijden. Deze live transport
gateways schakelen memory search uit; memory-gedrag blijft gedekt door de QA parity
suites.

Full release live media shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` heeft. Docker live model/backend shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die eenmaal per geselecteerde
commit wordt gebouwd, en pullen die daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Schrijft top-level artefacten `qa-evidence.json`, `qa-suite-summary.json` en
    `qa-suite-report.md` voor de geselecteerde scenarioset, inclusief selecties
    voor gemengde flows, Vitest- en Playwright-scenario's.
  - Wanneer aangeroepen door `pnpm openclaw qa run --qa-profile <profile>`, wordt
    de scorekaart van het geselecteerde taxonomieprofiel in dezelfde
    `qa-evidence.json` opgenomen. `smoke-ci` schrijft beknopt bewijs, wat
    `evidenceMode: "slim"` instelt en `execution` per item weglaat. `release`
    dekt de samengestelde release-readiness-doorsnede; `all` selecteert elke
    actieve maturity-categorie en is bedoeld voor expliciete dispatches van de
    QA Profile Evidence-workflow wanneer een volledig scorekaartartefact nodig
    is.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met
    geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency 4
    (begrensd door het aantal geselecteerde scenario's). Gebruik
    `--concurrency <count>` om het aantal workers af te stemmen, of
    `--concurrency 1` voor de oudere seriële lane.
  - Sluit af met een niet-nulstatus wanneer een scenario mislukt. Gebruik
    `--allow-failures` wanneer je artefacten wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale provider-server ondersteund door AIMock voor
    experimentele fixture- en protocol-mockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm openclaw qa coverage --match <query>`
  - Doorzoekt scenario-ID's, titels, oppervlakken, coverage-ID's, docs-referenties,
    code-referenties, plugins en providervereisten, en print daarna passende
    suitedoelen.
  - Gebruik dit vóór een QA Lab-run wanneer je het geraakte gedrag of bestandspad
    kent, maar niet het kleinste scenario. Het is alleen adviserend; kies nog
    steeds mock-, live-, Multipass-, Matrix- of transportbewijs op basis van het
    gedrag dat wordt gewijzigd.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-pluginproef uit via QA Lab. Het installeert
    het externe Kitchen Sink-pakket, verifieert de inventaris van het
    plugin-SDK-oppervlak, peilt `/healthz` en `/readyz`, registreert Gateway
    CPU/RSS-bewijs, voert een live OpenAI-beurt uit en controleert vijandige
    diagnostiek. Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In
    gehydrateerde Testbox-sessies laadt het automatisch het Testbox
    live-auth-profiel wanneer de helper `openclaw-testbox-env` aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark plus een klein mock QA Lab-scenariopakket
    uit (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde samenvatting
    van CPU-observaties onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudend hoge CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metrics worden
    vastgelegd zonder te lijken op de Gateway-regressie waarbij de CPU minutenlang
    vastloopt.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de
    checkout nog geen verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-authenticatie-invoer door die praktisch is
    voor de gast: providerkeys op basis van env, het pad naar de QA live
    providerconfiguratie en `CODEX_HOME` wanneer aanwezig.
  - Outputmappen moeten onder de repo-root blijven zodat de gast via de gemounte
    workspace kan terugschrijven.
  - Schrijft het normale QA-rapport plus samenvatting en Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de door Docker ondersteunde QA-site voor QA-werk in operatorstijl.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-key-onboarding uit, configureert
    standaard Telegram, verifieert dat de verpakte pluginruntime laadt zonder
    dependency-reparatie bij het opstarten, voert doctor uit en voert één lokale
    agentbeurt uit tegen een gemockt OpenAI-endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoke voor een gebouwde app uit voor
    ingebedde runtimecontexttranscripten. Het verifieert dat verborgen OpenClaw
    runtimecontext wordt bewaard als een niet-weergegeven aangepast bericht in
    plaats van te lekken naar de zichtbare gebruikersbeurt, seedt daarna een
    getroffen kapotte sessie-JSONL en verifieert dat `openclaw doctor --fix` die
    herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding voor het
    geïnstalleerde pakket uit, configureert Telegram via de geïnstalleerde CLI en
    hergebruikt daarna de live Telegram QA-lane met dat geïnstalleerde pakket als
    de SUT Gateway.
  - De wrapper mount alleen de `qa-lab`-harnessbron uit de checkout; het
    geïnstalleerde pakket is eigenaar van `dist`, `openclaw/plugin-sdk` en de
    gebundelde pluginruntime, zodat de lane geen huidige checkout-plugins mengt
    in het pakket dat wordt getest.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het
    register een opgeloste lokale tarball te testen.
  - Emitteert standaard herhaalde RTT-timing in `qa-evidence.json` met
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Overschrijf
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om de RTT-run af te stemmen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepteert een kommagescheiden lijst met
    Telegram QA-check-ID's om te samplen; wanneer niet ingesteld, is de standaard
    RTT-geschikte check `telegram-mentioned-message-reply`.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI/release-automatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en een rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host vóór
    Docker-build-/installatiewerk. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust de setup vóór referenties debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane. Wanneer Convex-referenties
    zijn geselecteerd en geen rol is ingesteld, gebruikt de wrapper `ci` in CI en
    `maintainer` buiten CI.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    omgeving `qa-live-shared` en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productbewijs
  als side-run tegen één kandidaatpakket. Het accepteert een vertrouwde ref, een
  gepubliceerde npm-specificatie, een HTTPS-tarball-URL plus SHA-256, of een
  tarballartefact uit een andere run, uploadt de genormaliseerde
  `openclaw-current.tgz` als `package-under-test`, en voert daarna de bestaande
  Docker E2E-scheduler uit met smoke-, package-, product-, full- of aangepaste
  laneprofielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artefact uit te
  voeren.
  - Laatste bètaproductbewijs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bewijs met exacte tarball-URL vereist een digest en gebruikt het veiligheidsbeleid
  voor openbare URL's:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise-/private tarball-mirrors gebruiken een expliciet beleid voor
  vertrouwde bronnen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` leest `.github/package-trusted-sources.json` uit de vertrouwde
workflow-ref en accepteert geen URL-referenties of een private-netwerkbypass via
workflowinvoer. Als het genoemde beleid bearer-auth declareert, configureer dan
het vaste geheim `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artefactbewijs downloadt een tarballartefact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakt en installeert de huidige OpenClaw-build in Docker, start de Gateway met
    OpenAI geconfigureerd en schakelt daarna gebundelde kanalen/plugins in via
    configuratie-edits.
  - Verifieert dat setupdiscovery ongeconfigureerde downloadbare plugins afwezig
    laat, dat de eerste geconfigureerde doctor-reparatie elke ontbrekende
    downloadbare plugin expliciet installeert, en dat een tweede herstart geen
    verborgen dependency-reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in vóór
    het uitvoeren van `openclaw update --tag <candidate>`, en verifieert dat de
    post-update doctor van de kandidaat legacy plugin-dependency-resten opruimt
    zonder postinstall-reparatie aan de harnesszijde.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-gasten. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert
    daarna de geïnstalleerde opdracht `openclaw update` uit in dezelfde gast en
    verifieert de geïnstalleerde versie, updatestatus, Gateway-gereedheid en één
    lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één gast. Gebruik `--json` voor het pad naar het samenvattingsartefact
    en de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live
    agentbeurtbewijs. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander OpenAI-model
    valideert.
  - Wikkel lange lokale runs in een hosttimeout zodat vastlopende
    Parallels-transporten niet de rest van het testvenster kunnen opslokken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper hangt.
  - Windows-update kan op een koude gast 10 tot 15 minuten besteden aan
    post-update doctor- en pakketupdatewerk; dat is nog steeds gezond wanneer de
    geneste npm-debuglog voortgang laat zien.
  - Voer deze aggregaatwrapper niet parallel uit met afzonderlijke Parallels
    macOS-, Windows- of Linux-smokelanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of Gateway-status van de gast.
  - Het post-updatebewijs voert het normale gebundelde pluginoppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip via gebundelde
    runtime-API's worden geladen, zelfs wanneer de agentbeurt zelf alleen een
    eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoketests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live-QA-lane uit tegen een wegwerpbare, door Docker ondersteunde Tuwunel-homeserver. Alleen source-checkout - verpakte installaties leveren geen `qa-lab` mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifact-indeling: [Matrix-QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live-QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard de env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Standaardinstellingen dekken canary, mention gating, command-adressering, `/status`, bot-naar-bot-antwoorden met vermelding en native antwoorden op core-opdrachten. `mock-openai`-standaardinstellingen dekken ook deterministische reply-chain- en Telegram-final-message-streamingregressies. Gebruik `--list-scenarios` voor optionele probes zoals `session_status`.
  - Eindigt met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je artifacts wilt zonder een falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam heeft.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram-QA-rapport, samenvatting en `qa-evidence.json` onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf de verzendaanvraag van de driver tot het geobserveerde SUT-antwoord.

`Mantis Telegram Live` is de PR-evidence-wrapper rond deze lane. Deze voert de kandidaat-ref uit met door Convex geleasete Telegram-referenties, rendert de geredigeerde QA-rapport-/evidencebundel in een Crabbox-desktopbrowser, neemt MP4-evidence op, genereert een motion-getrimde GIF, uploadt de artifactbundel en plaatst inline PR-evidence via de Mantis GitHub App wanneer `pr_number` is ingesteld. Maintainers kunnen dit starten vanuit de Actions-UI via `Mantis Scenario` (`scenario_id:
telegram-live`) of rechtstreeks vanuit een pullrequest-opmerking:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` is de agentic native Telegram Desktop-wrapper voor visueel PR-bewijs voor/na. Start dit vanuit de Actions-UI met vrije `instructions`, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), of vanuit een PR-opmerking:

```text
@openclaw-mantis telegram desktop proof
```

De Mantis-agent leest de PR, bepaalt welk Telegram-zichtbaar gedrag de wijziging bewijst, voert de echte-gebruiker Crabbox Telegram Desktop-proof-lane uit op baseline- en kandidaat-refs, itereert tot de native GIF's bruikbaar zijn, schrijft een gekoppeld `motionPreview`-manifest en plaatst dezelfde 2-koloms GIF-tabel via de Mantis GitHub App wanneer `pr_number` is ingesteld.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Leaset of hergebruikt een Crabbox Linux-desktop, installeert native Telegram Desktop, configureert OpenClaw met een geleaset Telegram SUT-bottoken, start de gateway en neemt screenshot-/MP4-evidence op vanaf de zichtbare VNC-desktop.
  - Gebruikt standaard `--credential-source convex`, zodat workflows alleen het Convex-brokergeheim nodig hebben. Gebruik `--credential-source env` met dezelfde `OPENCLAW_QA_TELEGRAM_*`-variabelen als `pnpm openclaw qa telegram`.
  - Telegram Desktop heeft nog steeds een gebruikerslogin/-profiel nodig. Het bottoken configureert alleen OpenClaw. Gebruik `--telegram-profile-archive-env <name>` voor een base64 `.tgz`-profielarchief, of gebruik `--keep-lease` en log één keer handmatig in via VNC.
  - Schrijft `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` en `telegram-desktop-builder.mp4` onder de uitvoermap.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet uiteenlopen; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor live transport-QA, verkrijgt QA lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeatt die lease terwijl de lane draait en geeft de lease vrij bij afsluiten. De sectienaam dateert van vóór ondersteuning voor Discord, Slack en WhatsApp; het leasecontract wordt gedeeld tussen soorten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van referentierol:
  - CLI: `--credential-role maintainer|ci`
  - Env-standaard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env-vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback-`http://` Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normale werking `https://` gebruiken.

Maintainer-adminopdrachten (pool toevoegen/verwijderen/opsommen) vereisen specifiek `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-runs om de Convex-site-URL, brokergeheimen, endpoint-prefix, HTTP-time-out en admin-/list-bereikbaarheid te controleren zonder geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-hulpprogramma's.

Standaard endpoint-contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Aanvraag: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succes: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Succes: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainer-geheim)
  - Aanvraag: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainer-geheim)
  - Aanvraag: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Actieve-lease-bewaking: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainer-geheim)
  - Aanvraag: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payload-vorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert onjuist gevormde payloads.

Payload-vorm voor Telegram real-user-kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` en `telegramApiId` moeten numerieke strings zijn.
- `tdlibArchiveSha256` en `desktopTdataArchiveSha256` moeten SHA-256-hexstrings zijn.
- `kind: "telegram-user"` is gereserveerd voor de Mantis Telegram Desktop proof-workflow. Generieke QA Lab-lanes mogen deze niet verkrijgen.

Door broker gevalideerde multi-channel-payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-lanes kunnen ook uit de pool leasen, maar Slack-payloadvalidatie leeft momenteel in de Slack-QA-runner in plaats van in de broker. Gebruik `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` voor Slack-rijen.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transport-runner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Beschouw de suites als "toenemend realisme" (en toenemende flakiness/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-project-shards uitbreiden naar per-project-configs voor parallelle planning
- Bestanden: core-/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Scope:
  - Pure unittests
  - In-process integratietests (gateway-auth, routing, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten brede fallback-gedrag van `api.js` en `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met echte gebundelde Plugin-source-API's. Echte Plugin-API-loads horen thuis in Plugin-owned contract-/integratiesuites.

Native dependency-beleid:

- Standaard testinstallaties slaan optionele native Discord-opus-builds over. Discord voice gebruikt gebundelde `libopus-wasm`, en `@discordjs/opus` blijft uitgeschakeld in `allowBuilds`, zodat lokale tests en Testbox-lanes de native addon niet compileren.
- Vergelijk native opus-prestaties in de `libopus-wasm`-benchmarkrepo, niet in standaard OpenClaw-install-/testlussen. Zet `@discordjs/opus` niet op `true` in de standaard `allowBuilds`; daardoor compileren niet-gerelateerde install-/testlussen native code.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Onggerichte `pnpm test`-runs gebruiken twaalf kleinere shard-configuraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-projectproces. Dit verlaagt de piek-RSS op zwaar belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` leiden expliciete bestands-/directorytargets eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige opstartkosten van het root-project hoeft te betalen.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete bronmappings en lokale import-graafafhankelijken. Config-/setup-/package-bewerkingen voeren tests niet breed uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor nauw afgebakend werk. Het classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de bijpassende typecheck-, lint- en guard-commando's uit. Het voert geen Vitest-tests uit; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Versieverhogingen die alleen releasemetadata raken, voeren gerichte versie-/config-/root-dependency-checks uit, met een guard die package-wijzigingen buiten het top-level versieveld afwijst.
    - Live Docker ACP-harnessbewerkingen voeren gerichte checks uit: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-surface-bewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unittests uit agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde bronbestanden van helpers in `plugin-sdk` en `commands` mappen changed-mode-runs ook naar expliciete naastliggende tests in die lichte lanes, zodat helperbewerkingen niet de volledige zware suite voor die directory opnieuw uitvoeren.
    - `auto-reply` heeft aparte buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extensie-batchsweep en de alleen-voor-releases bedoelde `agentic-plugins`-shard over. Full Release Validation dispatcht de aparte `Plugin Prerelease`-childworkflow voor die plugin-/extensie-zware suites op release candidates.

  </Accordion>

  <Accordion title="Dekking van embedded runner">

    - Wanneer je discovery-inputs voor message-tools of de runtimecontext voor compaction wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de integratiesuites van de embedded runner gezond:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` en
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en compaction-gedrag nog steeds door de echte `run.ts`- / `compact.ts`-paden stromen; tests die alleen helpers testen, zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Standaarden voor Vitest-pool en isolatie">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de niet-geïsoleerde runner voor de root-projecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-standaarden van de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-processen om V8-compilechurn tijdens grote lokale runs te verminderen. Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-gedrag.
    - `scripts/run-vitest.mjs` beëindigt expliciete niet-watch-Vitest-runs na 5 minuten zonder stdout- of stderr-output. Stel `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` in om de watchdog uit te schakelen voor een opzettelijk stil onderzoek.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commit-hook doet alleen formatting. Deze staget geformatteerde bestanden opnieuw en voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór overdracht of push wanneer je de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent besluit dat een harness-, config-, package- of contractbewerking echt bredere Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag, alleen met een hogere workerlimiet.
    - Lokale automatische workerscaling is bewust conservatief en schaalt terug wanneer de load average van de host al hoog is, zodat meerdere gelijktijdige Vitest-runs standaard minder schade veroorzaken.
    - De basisconfiguratie van Vitest markeert de projecten/configbestanden als `forceRerunTriggers`, zodat changed-mode-reruns correct blijven wanneer testbedrading verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduur-rapportage plus import-breakdown-output in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`. Runs van volledige configuraties gebruiken het configuratiepad als sleutel; include-pattern-CI-shards voegen de shardnaam toe, zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van de tijd besteedt aan startup-imports, houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-grens en mock die grens direct in plaats van runtime-helpers diep te importeren alleen om ze door `vi.mock(...)` te leiden.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde `test:changed` met het native root-projectpad voor die gecommitte diff en print wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige dirty tree door de lijst met gewijzigde bestanden via `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main thread voor Vitest-/Vite-startup en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft CPU+heap-profielen van de runner voor de unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte loopback-Gateway met diagnostics ingeschakeld
  - Stuurt synthetische gateway-message-, memory- en large-payload-churn door het diagnostische eventpad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt helpers voor persistentie van de diagnostische stabiliteitsbundel
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure-budget blijven en queue-dieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder keys
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (repo-aggregaat)

- Commando: `pnpm test:e2e`
- Scope:
  - Voert de gateway smoke E2E-lane uit
  - Voert de gemockte Control UI browser E2E-lane uit
- Verwachtingen:
  - CI-veilig en zonder keys
  - Vereist dat Playwright Chromium is geïnstalleerd

### E2E (gateway smoke)

- Commando: `pnpm test:e2e:gateway`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en E2E-tests van gebundelde plugins onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Handige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-output opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van gateway met meerdere instanties
  - WebSocket-/HTTP-surfaces, node-pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte keys vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E (Control UI gemockte browser)

- Commando: `pnpm test:ui:e2e`
- Configuratie: `test/vitest/vitest.ui-e2e.config.ts`
- Bestanden: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Start de Vite Control UI
  - Stuurt een echte Chromium-pagina aan via Playwright
  - Vervangt de Gateway-WebSocket door deterministische in-browser mocks
- Verwachtingen:
  - Draait in CI als onderdeel van `pnpm test:e2e`
  - Geen echte Gateway, agents of provider-keys vereist
  - Browserdependency moet aanwezig zijn (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Hergebruikt een actieve lokale OpenShell-gateway
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox fs bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Vereist een actieve lokale OpenShell-gateway en de configuratiebron daarvan
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testsandbox
- Handige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig uitvoert
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` om de geregistreerde gatewayconfiguratie beschikbaar te maken voor de geïsoleerde test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` om het Docker-gateway-IP te overschrijven dat door de host-policy-fixture wordt gebruikt

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live tests voor gebundelde plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Scope:
  - "Werkt deze provider/dit model _vandaag_ echt met echte inloggegevens?"
  - Vang wijzigingen in providerindelingen, eigenaardigheden bij toolaanroepen, auth-problemen en rate-limitgedrag op
- Verwachtingen:
  - Ontwerpbewust niet CI-stabiel (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Voer liever ingeperkte subsets uit dan "alles"
- Live runs gebruiken al geexporteerde API-sleutels en gestagede auth-profielen.
- Standaard isoleren live runs nog steeds `HOME` en kopieren ze configuratie-/auth-materiaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer en dempt Gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of een override per live run via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limitreacties.
- Voortgangs-/Heartbeat-uitvoer:
  - Live suites geven nu voortgangsregels naar stderr, zodat lange provideraanroepen zichtbaar actief zijn, zelfs wanneer Vitest-consolecapturing stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels direct streamen tijdens live runs.
  - Stem Heartbeats voor directe modellen af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslistabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- "Mijn bot is uitgevallen" / providerspecifieke fouten / toolaanroepen debuggen: voer een ingeperkte `pnpm test:live` uit

## Live (netwerk-aanrakende) tests

Voor de live modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harness, en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - plus verwerking van inloggegevens voor live runs - zie
[Live suites testen](/nl/help/testing-live). Voor de speciale update- en
pluginvalidatiechecklist, zie
[Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele controles voor "werkt in Linux")

Deze Docker-runners zijn verdeeld in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun bijpassende live bestand met profielsleutels uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap, workspace en optionele profiel-env-bestand worden gemount. De bijpassende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners houden waar nodig hun eigen praktische limieten aan:
  `test:docker:live-models` gebruikt standaard de gecureerde ondersteunde set met veel signaal, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Stel `OPENCLAW_LIVE_MAX_MODELS`
  of de Gateway-env-vars in wanneer je expliciet een kleinere limiet of grotere scan wilt.
- `test:docker:all` bouwt de live Docker-image eenmalig via `test:docker:live-build`, pakt OpenClaw eenmalig als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install-/update-/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor functionaliteitslanes van de gebouwde app. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregatie gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` beheert processlots, terwijl resourcelimieten voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve limieten, kan de scheduler deze nog steeds starten wanneer de pool leeg is en hem daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert oude OpenClaw E2E-containers, drukt elke 30 seconden status af, slaat timings van succesvolle lanes op in `.artifacts/docker-tests/lane-timings.json`, en gebruikt die timings om langere lanes bij latere runs eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest af te drukken zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan af te drukken voor geselecteerde lanes, pakket-/imagebehoeften en inloggegevens.
- `Package Acceptance` is de GitHub-native pakketgate voor "werkt deze installeerbare tarball als product?" Het resolveert een kandidaatpakket uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test`, en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/plugincontract, de survivor-matrix voor gepubliceerde upgrades, release-standaarden en triage van fouten.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart package dependencies importeert zoals Commander, prompt-UI, undici of logging vóór command dispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. Packaged CLI-smoke dekt ook root-help, onboard-help, doctor-help, status, configuratieschema en een model-list-opdracht.
- Legacy-compatibiliteit voor Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die cutoff tolereert de harness alleen metadatahiaten van verzonden pakketten: weggelaten private QA-inventory-items, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy plugin install-record-locaties, ontbrekende persistentie van marketplace install-records, en configuratiemetadata-migratie tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten een of meer echte containers op en verifieren integratiepaden op hoger niveau.
- Docker/Bash E2E-lanes die de verpakte OpenClaw-tarball installeren via `scripts/lib/openclaw-e2e-instance.sh` begrenzen `npm install` op `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (standaard `600s`; stel `0` in om de wrapper voor debugging uit te schakelen).

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is ingeperkt), en kopieren die daarna naar de container-home vóór de run, zodat externe CLI-OAuth tokens kan verversen zonder de auth-store van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` en `pnpm qa:observability:smoke` zijn private QA source-checkout-lanes. Ze maken bewust geen deel uit van pakket-Docker-release-lanes omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding-/kanaal-/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en draait een gemockte OpenAI-agentbeurt. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoketest voor release-gebruikersreis: `pnpm test:docker:release-user-journey` installeert de verpakte OpenClaw-tarball globaal in een schone Docker-home, voert onboarding uit, configureert een gemockte OpenAI-provider, voert een agentbeurt uit, installeert/de-installeert externe plugins, configureert ClickClack tegen een lokale fixture, verifieert uitgaande/inkomende berichten, herstart Gateway en voert doctor uit.
- Smoketest voor getypte release-onboarding: `pnpm test:docker:release-typed-onboarding` installeert de verpakte tarball, stuurt `openclaw onboard` aan via een echte TTY, configureert OpenAI als env-ref-provider, verifieert dat er geen ruwe sleutel wordt opgeslagen en voert een gemockte agentbeurt uit.
- Smoketest voor release-media/geheugen: `pnpm test:docker:release-media-memory` installeert de verpakte tarball, verifieert beeldbegrip uit een PNG-bijlage, OpenAI-compatibele uitvoer voor beeldgeneratie, herinnering via geheugenzoekactie en behoud van herinnering na herstart van Gateway.
- Smoketest voor release-upgrade-gebruikersreis: `pnpm test:docker:release-upgrade-user-journey` installeert standaard de nieuwste gepubliceerde baseline die ouder is dan de kandidaat-tarball, configureert provider/plugin/ClickClack-status op het gepubliceerde pakket, upgradet naar de kandidaat-tarball en voert daarna de kernreis voor agent/plugin/kanaal opnieuw uit. Als er geen oudere gepubliceerde baseline bestaat, wordt de kandidaatversie hergebruikt. Overschrijf de baseline met `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoketest voor release-pluginmarktplaats: `pnpm test:docker:release-plugin-marketplace` installeert vanuit een lokale fixture-marktplaats, werkt de geïnstalleerde plugin bij, de-installeert die en verifieert dat de plugin-CLI verdwijnt terwijl installatiemetadata wordt opgeschoond.
- Smoketest voor Skills-installatie: `pnpm test:docker:skill-install` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt installatie van geüploade archieven uit in de configuratie, lost de huidige live ClawHub-skill-slug op vanuit zoekresultaten, installeert die met `openclaw skills install` en verifieert de geïnstalleerde skill plus `.clawhub`-origin/lock-metadata.
- Smoketest voor wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, wisselt van pakket `stable` naar git `dev`, verifieert het opgeslagen kanaal en pluginwerking na de update, wisselt daarna terug naar pakket `stable` en controleert de updatestatus.
- Smoketest voor upgrade-overlever: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vuile oude-gebruiker-fixture met agents, kanaalconfiguratie, plugin-toestaanlijsten, verouderde plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert een pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert configuratie-/statusbehoud plus opstart-/statusbudgetten.
- Smoketest voor gepubliceerde upgrade-overlever: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruiker-bestanden, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregate scheduler om exacte lokale baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de reported-issues-set bevat `configured-plugin-installs` voor automatische reparatie van externe OpenClaw-plugininstallaties. Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, lost meta-baseline-tokens zoals `last-stable-4` of `all-since-2026.4.23` op, en Full Release Validation breidt de release-soak-pakketgate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert verborgen persistentie van runtimecontexttranscript plus doctor-reparatie van getroffen gedupliceerde prompt-rewrite-takken.
- Smoketest voor globale Bun-installatie: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige tree, installeert die met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde beeldproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als de stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of op GitHub met de `update_baseline_version`-invoer van de Install Smoke-workflow. Niet-root installercontroles behouden een geïsoleerde npm-cache zodat cache-items die eigendom zijn van root het gedrag van gebruikerslokale installatie niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache over lokale heruitvoeringen heen te hergebruiken.
- Install Smoke CI slaat de dubbele directe globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- CLI-smoketest voor agents die gedeelde workspace verwijderen: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag waarbij de workspace behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoketest voor Browser CDP-snapshot: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met ruwe CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromoveerde klikbare elementen, iframe-refs en framemetadata dekken.
- Regressie voor minimale reasoning bij OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server uit via Gateway, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna afwijzing door het providerschema en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + ruwe Claude-notificatieframe-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw-bundel-MCP-tools (echte stdio-MCP-server + embedded OpenClaw-profiel allow/deny-smoketest): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-opruiming (echte Gateway + afbouw van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-registry met gehesen afhankelijkheden, misvormde npm-pakketmetadata, git moving refs, ClawHub kitchen-sink, marktplaatsupdates en Claude-bundel enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Smoketest voor ongewijzigde pluginupdate: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoketest voor pluginlevenscyclusmatrix: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt enable/disable om, upgradet en downgradet die via een lokale npm-registry, verwijdert de geïnstalleerde code en verifieert daarna dat de-installatie nog steeds verouderde status verwijdert terwijl RSS/CPU-metrics voor elke levenscyclusfase worden gelogd.
- Smoketest voor herladen van configuratiemetadata: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketests voor lokaal pad, `file:`, npm-registry met gehesen afhankelijkheden, git moving refs, ClawHub-fixtures, marktplaatsupdates en Claude-bundel enable/inspect. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte npm-plugininstallatie, enable, disable, upgrade, downgrade en de-installatie bij ontbrekende code.

Om de gedeelde functionele image vooraf te bouwen en handmatig te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hebben nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een gedeelde image op afstand verwijst, halen de scripts die op als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners koppelen de huidige checkout ook read-only aan en
plaatsen die in een tijdelijke workdir binnen de container. Dit houdt de runtime-
image klein, terwijl Vitest nog steeds tegen je exacte lokale bron/configuratie
draait.
De stagingstap slaat grote caches die alleen lokaal zijn en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputmappen, zodat Docker-live-runs geen minuten besteden aan het kopiëren van
machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen
echte Telegram/Discord/enz.-channel workers in de container starten.
`test:docker:live-models` voert nog steeds `pnpm test:live` uit, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-livecoverage uit die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteitssmoke op hoger niveau: deze start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-endpoints ingeschakeld,
start een vastgepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, controleert of `/api/models` `openclaw/default` beschikbaar maakt, en verzendt daarna een
echte chatrequest via Open WebUI's `/api/chat/completions`-proxy.
Stel `OPENWEBUI_SMOKE_MODE=models` in voor CI-checks op het releasepad die moeten stoppen
na aanmelding bij Open WebUI en modeldetectie, zonder te wachten op een live model-
completion.
De eerste run kan merkbaar trager zijn omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startsetup moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel. Lever die via de proces-
environment, gestagede auth-profielen, of een expliciet `OPENCLAW_PROFILE_FILE`.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een seeded Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
controleert daarna gerouteerde conversiedetectie, transcriptlezingen, attachmentmetadata,
live event-queuegedrag, routering van uitgaande verzendingen, en Claude-achtige channel- en
permissiemeldingen via de echte stdio MCP-bridge. De meldingscheck
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk uitzendt, niet alleen wat een specifieke client-SDK toevallig zichtbaar maakt.
`test:docker:agent-bundle-mcp-tools` is deterministisch en heeft geen live
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de ingebedde OpenClaw-bundel
MCP-runtime, voert de tool uit, en controleert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live model-
sleutel nodig. Het start een seeded Gateway met een echte stdio MCP-probeserver, voert een
geisoleerde cron-turn en een eenmalige `sessions_spawn`-childturn uit, en controleert daarna
dat het MCP-childproces na elke run eindigt.

Handmatige ACP-plain-language thread smoke (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadroutingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` gekoppeld en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te controleren die uit `OPENCLAW_PROFILE_FILE` worden gesourced, met tijdelijke config-/workspacemappen en zonder externe CLI-authmounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties binnen Docker
- Externe CLI-authmappen/-bestanden onder `$HOME` worden read-only gekoppeld onder `/host-auth...`, en daarna gekopieerd naar `/home/node/...` voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte providerruns koppelen alleen de benodigde mappen/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te verzekeren dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat de Gateway beschikbaar maakt voor de Open WebUI-smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de vastgepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docs-checks uit na documentatiebewerkingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook checks voor headings binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn "echte pipeline"-regressies zonder echte providers:

- Gateway-toolcalling (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevals (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als "agent-betrouwbaarheidsevals":

- Mock-toolcalling via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiewiring en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij vereiste stappen/args?
- **Workflowcontracten:** multi-turn scenario's die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen controleren.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner die mockproviders gebruikt om toolcalls + volgorde, skillbestandslezingen en sessiewiring te controleren.
- Een kleine suite met skillgerichte scenario's (gebruiken vs. vermijden, gating, promptinjectie).
- Optionele live evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (plugin- en channelvorm)

Contracttests controleren of elke geregistreerde plugin en channel voldoet aan zijn
interfacecontract. Ze itereren over alle ontdekte plugins en voeren een suite met
shape- en gedragsasserties uit. De standaard `pnpm test`-unitlane slaat deze gedeelde seam- en smokebestanden bewust
over; voer de contractcommando's expliciet uit
wanneer je gedeelde channel- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Te vinden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basispluginvorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Sessiebindingsgedrag
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Channelactiehandlers
- **threading** - Thread-ID-afhandeling
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channelstatusprobes
- **registry** - Pluginregistryvorm

### Providercontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugindetectie
- **loader** - Pluginladen
- **runtime** - Providerruntime
- **shape** - Pluginvorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een channel- of providerplugin
- Na het refactoren van pluginregistratie of detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shapetransformatie vast)
- Als het inherent live-only is (rate limits, authbeleid), houd de live test beperkt en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - provider-requestconversie-/replaybug → directe modeltest
  - Gateway-sessie-/geschiedenis-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversalguardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt een gesampled target per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat exec-ids met traversalsegmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target-ids, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
