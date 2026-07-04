---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerfouten
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-07-04T03:55:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke commando's je uitvoert voor veelvoorkomende workflows (lokaal, pre-push, debuggen).
- Hoe live tests inloggegevens ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport lanes)** wordt afzonderlijk gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, commandosurface, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) - referentie voor `pnpm openclaw qa matrix`.
- [Maturity scorecard](/nl/maturity/scorecard) - hoe QA-bewijs voor releases stabiliteits- en LTS-beslissingen ondersteunt.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De sectie met QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel aan de slag

De meeste dagen:

- Volledige gate (verwacht vóór push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandstargeting routeert nu ook extension-/channel-paden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan één failure werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

## Tijdelijke testmappen

Geef de voorkeur aan de gedeelde helpers in `test/helpers/temp-dir.ts` voor
test-eigen tijdelijke mappen. Ze maken eigenaarschap expliciet en houden cleanup in dezelfde
testlevenscyclus:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` stelt bewust geen handmatige cleanup-methode beschikbaar; Vitest
is eigenaar van cleanup na elke test. Bestaande lower-level helpers blijven beschikbaar voor tests die
nog niet zijn verplaatst, maar nieuwe en gemigreerde tests moeten de automatisch opschonende
tracker gebruiken. Vermijd nieuw handmatig gebruik van `makeTempDir`, `cleanupTempDirs` of
`createTempDirTracker` en vermijd nieuwe kale `fs.mkdtemp*`-aanroepen in tests,
tenzij een case expliciet raw temp-dir-gedrag verifieert. Voeg een auditeerbare
allow-comment toe met een concrete reden wanneer een test bewust een kale tijdelijke
map nodig heeft:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Voor migratiezichtbaarheid rapporteert `node scripts/report-test-temp-creations.mjs`
nieuwe kale temp-dir-aanmaak en nieuw handmatig gebruik van gedeelde helpers in toegevoegde diffregels
zonder bestaande cleanup-stijlen te blokkeren. De bestandsscope volgt bewust
dezelfde testpadclassificatie die door `scripts/changed-lanes.mjs` wordt gebruikt,
in plaats van een aparte test-helper-bestandsnaamheuristiek te onderhouden, terwijl
de gedeelde helperimplementatie zelf wordt overgeslagen. `check:changed` voert dit rapport uit voor
gewijzigde testpaden als een waarschuwing-only CI-signaal; bevindingen zijn GitHub-waarschuwingsannotaties,
geen failures.

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Live suite (modellen + Gateway tool-/image-probes): `pnpm test:live`
- Target één live bestand stil: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtimeperformancerapporten: dispatch `OpenClaw Performance` met
  `live_openai_candidate=true` voor een echte `openai/gpt-5.5` agent-turn of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artefacten. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.5-lane-artefacten naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook source-level Gateway-boot-, geheugen-,
  plugin-pressure-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een text-turn plus een kleine file-read-achtige probe uit.
    Modellen waarvan de metadata `image`-input adverteert, voeren ook een tiny image-turn uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfailures isoleert.
  - CI-coverage: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen allebei de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, wat afzonderlijke Docker live model
    matrixjobs bevat die per provider zijn geshard.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providersecrets toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna dat een gewone reply en een image attachment
    via de native Plugin-binding worden gerouteerd in plaats van via ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway agent-turns uit via de Plugin-eigen Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    Cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-failures isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Installeert de verpakte OpenClaw-tarball in Docker, voert OpenAI API-key
    onboarding uit en verifieert dat de Codex-Plugin plus de `@openai/codex`-dependency
    on demand zijn gedownload naar de beheerde npm-projectroot.
- Live Plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Pakt een fixture-Plugin met een echte `slugify`-dependency, installeert die via
    `npm-pack:`, verifieert de dependency onder de beheerde npm-projectroot,
    en vraagt vervolgens een live OpenAI-model om de Plugin-tool aan te roepen en de verborgen
    slug terug te geven.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders-check voor de rescue-command-surface van message-channel.
    Deze oefent `/crestodian status`, zet een permanente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes` en verifieert het audit-/config-write-pad.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner fallback wordt vertaald naar een geaudite typed
    config-write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw state-dir, verifieert de moderne onboard
    Crestodian-entrypoint, past setup-/model-/agent-/Discord-Plugin + SecretRef
    writes toe, valideert config en verifieert auditentries. Hetzelfde Ring 0 setup-pad
    wordt ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistant-transcript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het vernauwen van live tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI voert QA Lab uit in dedicated workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als standalone PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. Stabiele/standaard release
checks houden uitputtende live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait nightly op `main` en via handmatige dispatch met de mock parity lane, live
Matrix lane, Convex-beheerde live Telegram lane en Convex-beheerde live Discord
lane als parallelle jobs. Geplande QA- en releasechecks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix CLI en handmatige workflowinput
standaard `all` blijven; handmatige dispatch kan `all` sharden in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert parity plus de snelle Matrix- en Telegram-lanes uit vóór releasegoedkeuring,
met `mock-openai/gpt-5.5` voor release transport checks zodat ze
deterministisch blijven en normale provider-Plugin-startup vermijden. Deze live transport
gateways schakelen memory search uit; memory-gedrag blijft gedekt door de QA parity
suites.

Volledige release live media shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, waarin
`ffmpeg` en `ffprobe` al aanwezig zijn. Docker live model/backend shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en pullen die daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Schrijft artefacten op topniveau `qa-evidence.json`, `qa-suite-summary.json` en
    `qa-suite-report.md` voor de geselecteerde scenarioset, inclusief
    selecties voor gemengde flow-, Vitest- en Playwright-scenario's.
  - Wanneer gestart door `pnpm openclaw qa run --qa-profile <profile>`, wordt de
    scorekaart van het geselecteerde taxonomieprofiel in dezelfde `qa-evidence.json`
    opgenomen. `smoke-ci` schrijft beperkte bewijsgegevens, waarmee
    `evidenceMode: "slim"` wordt ingesteld en `execution` per vermelding wordt
    weggelaten. `release` dekt de samengestelde releasegereedheidsdoorsnede;
    `all` selecteert elke actieve volwassenheidscategorie en is bedoeld voor
    expliciete workflow-dispatches voor QA-profielbewijs wanneer een volledig
    scorekaartartefact nodig is.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geisoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door
    het aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het
    aantal workers af te stemmen, of `--concurrency 1` voor de oudere seriele baan.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik
    `--allow-failures` wanneer je artefacten wilt zonder falende afsluitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale, door AIMock ondersteunde provider-server voor
    experimentele fixture- en protocolmock-dekking zonder de scenariobewuste
    `mock-openai`-baan te vervangen.
- `pnpm openclaw qa coverage --match <query>`
  - Doorzoekt scenario-ID's, titels, oppervlakken, dekkings-ID's, docs-verwijzingen,
    codeverwijzingen, Plugins en providervereisten, en drukt daarna overeenkomende
    suitedoelen af.
  - Gebruik dit voor een QA Lab-run wanneer je het gewijzigde gedrag of bestandspad
    kent, maar niet het kleinste scenario. Het is alleen adviserend; kies nog steeds
    mock-, live-, Multipass-, Matrix- of transportbewijs op basis van het gedrag dat
    wordt gewijzigd.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-Pluginproef uit via QA Lab. Het
    installeert het externe Kitchen Sink-pakket, verifieert de inventaris van het
    Plugin SDK-oppervlak, peilt `/healthz` en `/readyz`, registreert Gateway
    CPU/RSS-bewijs, voert een live OpenAI-beurt uit en controleert vijandige
    diagnostiek. Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In
    gehydrateerde Testbox-sessies laadt het automatisch het Testbox live-auth-profiel
    wanneer de helper `openclaw-testbox-env` aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark uit plus een klein mock-QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatiesamenvatting
    onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als meetwaarden worden
    geregistreerd zonder eruit te zien als de minutenlange Gateway-pegregressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout
    nog geen verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-authenticatie-invoer door die praktisch is
    voor de guest: provider-sleutels via env, het configuratiepad voor de QA-liveprovider
    en `CODEX_HOME` wanneer aanwezig.
  - Uitvoermappen moeten onder de repo-root blijven zodat de guest via de gemounte
    workspace kan terugschrijven.
  - Schrijft het normale QA-rapport plus samenvatting en Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de door Docker ondersteunde QA-site voor QA-werk in operatorstijl.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve onboarding met OpenAI API-sleutel uit, configureert
    standaard Telegram, verifieert dat de verpakte Plugin-runtime zonder
    opstartafhankelijkheidsherstel wordt geladen, voert doctor uit en voert een
    lokale agentbeurt uit tegen een gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde verpakte-installatiebaan
    met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoke voor de gebouwde app uit voor ingebedde
    runtimecontexttranscripten. Het verifieert dat verborgen OpenClaw-runtimecontext
    wordt bewaard als een aangepast bericht dat niet wordt weergegeven in plaats van
    in de zichtbare gebruikersbeurt te lekken, seedt daarna een getroffen kapotte
    sessie-JSONL en verifieert dat `openclaw doctor --fix` die herschrijft naar de
    actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding voor het
    geinstalleerde pakket uit, configureert Telegram via de geinstalleerde CLI en
    hergebruikt daarna de live Telegram QA-baan met dat geinstalleerde pakket als
    de SUT-Gateway.
  - De wrapper mount alleen de `qa-lab`-harnessbron uit de checkout; het
    geinstalleerde pakket bezit `dist`, `openclaw/plugin-sdk` en de gebundelde
    Plugin-runtime, zodat de baan huidige checkout-Plugins niet mengt in het
    pakket dat wordt getest.
  - Gebruikt standaard `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het register
    een opgeloste lokale tarball te testen.
  - Geeft standaard herhaalde RTT-timing in `qa-evidence.json` uit met
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Overschrijf
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om de RTT-run af te stemmen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepteert een door komma's gescheiden lijst
    met Telegram QA-check-ID's om te samplen; wanneer niet ingesteld, is de standaard
    RTT-geschikte check `telegram-mentioned-message-reply`.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en een rolsecret. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolsecret aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host voordat
    Docker-build-/installatiewerk begint. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je doelbewust de setup voor referenties debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze baan. Wanneer Convex-referenties
    zijn geselecteerd en geen rol is ingesteld, gebruikt de wrapper `ci` in CI en
    `maintainer` buiten CI.
  - GitHub Actions stelt deze baan beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Die draait niet bij merge. De workflow gebruikt de
    omgeving `qa-live-shared` en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor aanvullend
  productbewijs tegen een kandidaatpakket. Het accepteert een vertrouwde ref,
  gepubliceerde npm-specificatie, HTTPS-tarball-URL plus SHA-256, of tarballartefact
  uit een andere run, uploadt de genormaliseerde `openclaw-current.tgz` als
  `package-under-test` en voert daarna de bestaande Docker E2E-planner uit met
  smoke-, package-, product-, full- of aangepaste baanprofielen. Stel
  `telegram_mode=mock-openai` of `live-frontier` in om de Telegram QA-workflow
  tegen hetzelfde `package-under-test`-artefact uit te voeren.
  - Productbewijs voor de nieuwste beta:

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

- Enterprise-/prive-tarball-mirrors gebruiken een expliciet beleid voor vertrouwde
  bronnen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` leest `.github/package-trusted-sources.json` uit de vertrouwde
workflow-ref en accepteert geen URL-referenties of een private-network-bypass via
workflowinvoer. Als het genoemde beleid bearer-auth declareert, configureer dan het
vaste secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artefactbewijs downloadt een tarballartefact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Verpakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt daarna gebundelde kanalen/Plugins in via
    configuratiebewerkingen.
  - Verifieert dat setupdetectie niet-geconfigureerde downloadbare Plugins afwezig
    laat, dat de eerste geconfigureerde doctor-reparatie elke ontbrekende
    downloadbare Plugin expliciet installeert, en dat een tweede herstart geen
    verborgen afhankelijkheidsherstel uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat verouderde Plugin-afhankelijkheidsresten
    opruimt zonder postinstall-reparatie aan de harnesszijde.
- `pnpm test:parallels:npm-update`
  - Voert de native smoke voor verpakte-installatie-updates uit over Parallels-guests.
    Elk geselecteerd platform installeert eerst het gevraagde baselinepakket, voert
    daarna de geinstalleerde opdracht `openclaw update` in dezelfde guest uit en
    verifieert de geinstalleerde versie, updatestatus, Gateway-gereedheid en een
    lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` terwijl
    je aan een guest itereert. Gebruik `--json` voor het pad van het samenvattingsartefact
    en de status per baan.
  - De OpenAI-baan gebruikt standaard `openai/gpt-5.5` voor het bewijs van de live
    agentbeurt. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je doelbewust een ander OpenAI-model
    valideert.
  - Wikkel lange lokale runs in een host-timeout zodat Parallels-transportstalls
    niet de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste baanlogs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper hangt.
  - Windows-update kan op een koude guest 10 tot 15 minuten besteden aan post-update
    doctor- en pakketupdatewerk; dat is nog steeds gezond wanneer het geneste
    npm-debuglog vooruitgaat.
  - Voer deze aggregatiewrapper niet parallel uit met afzonderlijke Parallels-smokebanen
    voor macOS, Windows of Linux. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of guest-Gateway-status.
  - Het post-updatebewijs voert het normale gebundelde Plugin-oppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip via gebundelde
    runtime-API's worden geladen, zelfs wanneer de agentbeurt zelf alleen een
    eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-provider-server voor directe protocol-smoke
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare, door Docker ondersteunde Tuwunel-homeserver. Alleen source-checkout - verpakte installaties leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifact-indeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde credentials. Gebruik standaard de env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Standaardinstellingen dekken canary, mention-gating, command-adressering, `/status`, bot-naar-bot genoemde antwoorden en native core-commandantwoorden. `mock-openai`-standaarden dekken ook deterministische regressies voor reply-chain en Telegram final-message streaming. Gebruik `--list-scenarios` voor optionele probes zoals `session_status`.
  - Sluit af met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder een falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam beschikbaar stelt.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en `qa-evidence.json` onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het driver-verzendverzoek tot het geobserveerde SUT-antwoord.

`Mantis Telegram Live` is de PR-evidence-wrapper rond deze lane. Deze voert de
candidate-ref uit met door Convex geleasede Telegram-credentials, rendert de geredigeerde QA
report/evidence-bundel in een Crabbox-desktopbrowser, neemt MP4-evidence op,
genereert een op beweging getrimde GIF, uploadt de artifact-bundel en plaatst inline PR
evidence via de Mantis GitHub App wanneer `pr_number` is ingesteld. Maintainers kunnen
dit starten vanuit de Actions-UI via `Mantis Scenario` (`scenario_id:
telegram-live`) of direct vanuit een pull request-comment:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` is de agentische native Telegram Desktop
before/after-wrapper voor visueel PR-bewijs. Start deze vanuit de Actions-UI met
vrije `instructions`, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), of vanuit een PR-comment:

```text
@openclaw-mantis telegram desktop proof
```

De Mantis-agent leest de PR, bepaalt welk Telegram-zichtbaar gedrag de
wijziging bewijst, voert de real-user Crabbox Telegram Desktop proof-lane uit op baseline- en
candidate-refs, itereert tot de native GIF's bruikbaar zijn, schrijft een gekoppeld
`motionPreview`-manifest en plaatst dezelfde 2-koloms GIF-tabel via de
Mantis GitHub App wanneer `pr_number` is ingesteld.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Leaset of hergebruikt een Crabbox Linux-desktop, installeert native Telegram Desktop, configureert OpenClaw met een geleased Telegram SUT-bottoken, start de Gateway en neemt screenshot-/MP4-evidence op vanaf de zichtbare VNC-desktop.
  - Gebruikt standaard `--credential-source convex` zodat workflows alleen het Convex broker-secret nodig hebben. Gebruik `--credential-source env` met dezelfde `OPENCLAW_QA_TELEGRAM_*`-variabelen als `pnpm openclaw qa telegram`.
  - Telegram Desktop heeft nog steeds een gebruikerslogin/-profiel nodig. Het bottoken configureert alleen OpenClaw. Gebruik `--telegram-profile-archive-env <name>` voor een base64 `.tgz`-profielarchief, of gebruik `--keep-lease` en log eenmalig handmatig in via VNC.
  - Schrijft `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` en `telegram-desktop-builder.mp4` onder de uitvoermap.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-credentials via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
live transport QA, verkrijgt QA lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeatt die
lease terwijl de lane draait en geeft de lease vrij bij afsluiten. De sectienaam dateert van vóór
Discord-, Slack- en WhatsApp-ondersteuning; het leasecontract wordt gedeeld tussen soorten.

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

`OPENCLAW_QA_CONVEX_SITE_URL` moet in normaal gebruik `https://` gebruiken.

Maintainer-admincommands (pool toevoegen/verwijderen/listen) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live runs om de Convex-site-URL, broker-secrets,
endpoint-prefix, HTTP-timeout en admin/list-bereikbaarheid te controleren zonder
secretwaarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI
utilities.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Verzoek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succes: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Succes: `{ status: "ok", index, data }`
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
  - Actieve lease-guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainer-secret)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payload-vorm voor Telegram-soort:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert verkeerd gevormde payloads.

Payload-vorm voor Telegram real-user-soort:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` en `telegramApiId` moeten numerieke strings zijn.
- `tdlibArchiveSha256` en `desktopTdataArchiveSha256` moeten SHA-256-hexstrings zijn.
- `kind: "telegram-user"` is gereserveerd voor de Mantis Telegram Desktop proof-workflow. Generieke QA Lab-lanes mogen deze niet verkrijgen.

Door de broker gevalideerde multi-channel-payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-lanes kunnen ook uit de pool leasen, maar Slack-payloadvalidatie
bevindt zich momenteel in de Slack QA-runner in plaats van de broker. Gebruik
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
voor Slack-rijen.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe channel-adapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumbasis: implementeer de transport-runner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het pluginmanifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als "toenemend realisme" (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Command: `pnpm test`
- Config: ongerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-project-shards uitbreiden naar per-project-configs voor parallelle planning
- Bestanden: core-/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de speciale `unit-ui`-shard
- Scope:
  - Pure unittests
  - In-process integratietests (Gateway-auth, routing, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed `api.js`- en
    `runtime-api.js`-fallbackgedrag bewijzen met gegenereerde kleine plugin-fixtures, niet met
    echte gebundelde plugin source-API's. Echte plugin-API-loads horen thuis in
    plugin-eigen contract-/integratiesuites.

Native dependency-beleid:

- Standaard testinstallaties slaan optionele native Discord opus-builds over. Discord voice gebruikt gebundelde `libopus-wasm`, en `@discordjs/opus` blijft uitgeschakeld in `allowBuilds` zodat lokale tests en Testbox-lanes de native addon niet compileren.
- Vergelijk native opus-prestaties in de `libopus-wasm`-benchmarkrepo, niet in standaard OpenClaw-installatie-/testloops. Zet `@discordjs/opus` niet op `true` in de standaard `allowBuilds`; daardoor gaan niet-gerelateerde installatie-/testloops native code compileren.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Een niet-gerichte `pnpm test` draait twaalf kleinere shard-configuraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-projectproces. Dit verlaagt de piek-RSS op zwaar belaste machines en voorkomt dat auto-reply-/extensionwerk niet-gerelateerde suites uithongert.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgrafiek, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` leiden expliciete bestands-/directorytargets eerst door scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige opstartkosten van het root-project hoeft te betalen.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete source-mappings en lokale import-grafiekafhankelijken. Config-/setup-/packagebewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Het classificeert de diff in core, core-tests, extensions, extension-tests, apps, docs, release-metadata, live Docker-tooling en tooling, en draait daarna de bijpassende typecheck-, lint- en guard-commando's. Het draait geen Vitest-tests; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Versiebumpen met alleen release-metadata draaien gerichte versie-/config-/root-dependencychecks, met een guard die packagewijzigingen buiten het top-level version-veld afwijst.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte checks: shell-syntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-oppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Import-lichte unit-tests uit agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helpersourcebestanden mappen changed-mode-runs ook naar expliciete naastliggende tests in die lichte lanes, zodat helperbewerkingen voorkomen dat de volledige zware suite voor die directory opnieuw draait.
    - `auto-reply` heeft aparte buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in shards voor agent-runner, dispatch en commands/state-routing, zodat één import-zware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extension-batchsweep en de release-only `agentic-plugins`-shard over. Full Release Validation dispatcht de aparte child-workflow `Plugin Prerelease` voor die plugin-/extension-zware suites op release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Wanneer je inputs voor message-tool discovery of Compaction-runtimecontext
      wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routerings- en normalisatie-
      grenzen.
    - Houd de integratiesuites voor de embedded runner gezond:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` en
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped id's en Compaction-gedrag nog steeds
      door de echte `run.ts`- / `compact.ts`-paden lopen; helper-only tests zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - De basis-Vitest-config gebruikt standaard `threads`.
    - De gedeelde Vitest-config zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e en live configs.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op
      de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde standaardwaarden `threads` + `isolate: false`
      uit de gedeelde Vitest-config.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.
    - `scripts/run-vitest.mjs` beëindigt expliciete niet-watch Vitest-runs na
      5 minuten zonder stdout- of stderr-output. Stel
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` in om de watchdog uit te schakelen voor een
      bewust stil onderzoek.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commit-hook is alleen voor formattering. Hij staged geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai `pnpm check:changed` expliciet vóór handoff of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` loopt standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      besluit dat een harness-, config-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routerings-
      gedrag, alleen met een hogere workerlimiet.
    - Lokale worker-autoscaling is bewust conservatief en schaalt terug
      wanneer de load average van de host al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade veroorzaken.
    - De basis-Vitest-config markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat changed-mode reruns correct blijven wanneer test-
      wiring verandert.
    - De config houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduur-rapportage plus
      import-breakdown-output in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Whole-config-runs gebruiken het configpad als key; include-pattern-CI-
      shards voegen de shardnaam toe, zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van zijn tijd in startupimports doorbrengt,
      houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtime-helpers deep te importeren alleen
      om ze door `vi.mock(...)` te halen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff
      en print wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de lijst met gewijzigde bestanden via
      `scripts/test-projects.mjs` en de root-Vitest-config te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread CPU-profiel voor
      Vitest-/Vite-opstart en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heapprofielen voor de
      unit-suite met bestandsparallelisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte loopback-Gateway met diagnostics ingeschakeld
  - Stuurt synthetische gateway message-, memory- en large-payload-churn door het diagnostic-eventpad
  - Bevraagt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostic-stabilitybundles
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure-budget blijven en per-session queuedieptes terug naar nul leeglopen
- Verwachtingen:
  - CI-veilig en keyless
  - Smalle lane voor follow-up van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (repo-aggregaat)

- Commando: `pnpm test:e2e`
- Scope:
  - Draait de gateway-smoke-E2E-lane
  - Draait de gemockte Control UI-browser-E2E-lane
- Verwachtingen:
  - CI-veilig en keyless
  - Vereist dat Playwright Chromium is geïnstalleerd

### E2E (gateway smoke)

- Commando: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde-plugin-E2E-tests onder `extensions/`
- Runtime-standaardwaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, gelijk aan de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in silent mode om console-I/O-overhead te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om verbose console-output opnieuw in te schakelen.
- Scope:
  - End-to-end gedrag van multi-instance gateway
  - WebSocket-/HTTP-oppervlakken, node-pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte keys vereist
  - Meer bewegende delen dan unit-tests (kan langzamer zijn)

### E2E (Control UI gemockte browser)

- Commando: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Bestanden: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Start de Vite Control UI
  - Stuurt een echte Chromium-pagina aan via Playwright
  - Vervangt de Gateway WebSocket door deterministische in-browser mocks
- Verwachtingen:
  - Draait in CI als onderdeel van `pnpm test:e2e`
  - Geen echte Gateway, agents of providerkeys vereist
  - Browserdependency moet aanwezig zijn (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Hergebruikt een actieve lokale OpenShell-gateway
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canoniek filesystemgedrag via de sandbox fs bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Vereist een actieve lokale OpenShell-gateway en de configbron daarvan
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testsandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen bij het handmatig draaien van de bredere e2e-suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapper-script te wijzen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` om de geregistreerde gatewayconfig beschikbaar te maken voor de geïsoleerde test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` om het Docker-gateway-IP te overschrijven dat door de host-policy-fixture wordt gebruikt

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live tests voor gebundelde Plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Bereik:
  - "Werkt deze provider/dit model _vandaag_ echt met echte referenties?"
  - Vang wijzigingen in providerindeling, eigenaardigheden bij tool-aanroepen, authenticatieproblemen en rate-limitgedrag op
- Verwachtingen:
  - Ontwerp is niet CI-stabiel (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Voer bij voorkeur beperkte subsets uit in plaats van "alles"
- Live runs gebruiken al geexporteerde API-sleutels en voorbereide authenticatieprofielen.
- Standaard isoleren live runs nog steeds `HOME` en kopieren ze configuratie-/authenticatiemateriaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live tests je echte home-map gebruiken.
- `pnpm test:live` gebruikt standaard een stillere modus: deze behoudt `[live] ...`-voortgangsuitvoer en dempt Gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- Rotatie van API-sleutels (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limitantwoorden.
- Voortgangs-/Heartbeat-uitvoer:
  - Live suites schrijven nu voortgangsregels naar stderr, zodat lange provideraanroepen zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels tijdens live runs direct streamen.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslistabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- Debuggen van "mijn bot ligt eruit" / providerspecifieke fouten / tool-aanroepen: voer een beperkte `pnpm test:live` uit

## Live (netwerk-aanrakende) tests

Voor de live modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harness, en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - plus referentieafhandeling voor live runs - zie
[Live suites testen](/nl/help/testing-live). Voor de speciale checklist voor updates en
Plugin-validatie, zie
[Updates en Plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-controles)

Deze Docker-runners zijn opgesplitst in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende live bestand met profielsleutel uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap, workspace en optioneel profiel-env-bestand worden gemount. De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners behouden waar nodig hun eigen praktische limieten:
  `test:docker:live-models` gebruikt standaard de samengestelde ondersteunde set met hoge signaalwaarde, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Stel `OPENCLAW_LIVE_MAX_MODELS`
  of de Gateway-env-vars in wanneer je expliciet een kleinere limiet of grotere scan wilt.
- `test:docker:all` bouwt de live Docker-image eenmalig via `test:docker:live-build`, verpakt OpenClaw eenmalig als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor lanes voor ingebouwde-appfunctionaliteit. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregaatrunner gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt processlots, terwijl resourcelimieten voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve limieten, kan de scheduler deze nog steeds starten wanneer de pool leeg is en deze daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, bewaart timings van geslaagde lanes in `.artifacts/docker-tests/lane-timings.json`, en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, pakket-/imagebehoeften en referenties te printen.
- `Package Acceptance` is de GitHub-native pakketpoort voor "werkt deze installeerbare tarball als product?" Deze lost een kandidaatpakket op uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt het als `package-under-test`, en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn gerangschikt op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, releasestandaarden en fouttriage.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graaf vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart package-afhankelijkheden importeert, zoals Commander, prompt-UI, undici of logging voor commandodispatch; deze houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. Packaged CLI smoke dekt ook roothelp, onboard-help, doctor-help, status, config-schema en een model-list-opdracht.
- Legacycompatibiliteit voor Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert de harness alleen metadatahiaten van verzonden pakketten: weggelaten prive-QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacylocaties voor Plugin-install-records, ontbrekende persistentie van marketplace-install-records en configuratiemetadata-migratie tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten een of meer echte containers en verifieren integratiepaden op hoger niveau.
- Docker/Bash E2E-lanes die de verpakte OpenClaw-tarball installeren via `scripts/lib/openclaw-e2e-instance.sh`, begrenzen `npm install` op `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (standaard `600s`; stel `0` in om de wrapper uit te schakelen voor debuggen).

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde homes wanneer de run niet is beperkt), en kopieren die daarna naar de container-home voor de run, zodat external-CLI-OAuth tokens kan vernieuwen zonder de host-auth-store te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` en `pnpm qa:observability:smoke` zijn prive-QA-lanes voor source-checkout. Ze maken bewust geen deel uit van package-Docker-releaselanes, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding/channel/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert een gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Release-gebruikersreis-smoketest: `pnpm test:docker:release-user-journey` installeert de verpakte OpenClaw-tarball globaal in een schone Docker-home, voert onboarding uit, configureert een gemockte OpenAI-provider, voert een agent-turn uit, installeert/deïnstalleert externe plugins, configureert ClickClack tegen een lokale fixture, verifieert uitgaande/inkomende berichten, herstart Gateway en voert doctor uit.
- Release-getypte-onboarding-smoketest: `pnpm test:docker:release-typed-onboarding` installeert de verpakte tarball, stuurt `openclaw onboard` via een echte TTY aan, configureert OpenAI als een env-ref-provider, verifieert dat er geen ruwe sleutel persistent wordt opgeslagen en voert een gemockte agent-turn uit.
- Release-media/geheugen-smoketest: `pnpm test:docker:release-media-memory` installeert de verpakte tarball, verifieert beeldbegrip uit een PNG-bijlage, OpenAI-compatibele uitvoer voor beeldgeneratie, geheugenzoekherinnering en behoud van herinnering na een Gateway-herstart.
- Release-upgrade-gebruikersreis-smoketest: `pnpm test:docker:release-upgrade-user-journey` installeert standaard de nieuwste gepubliceerde baseline die ouder is dan de kandidaat-tarball, configureert provider-/plugin-/ClickClack-status op het gepubliceerde pakket, upgradet naar de kandidaat-tarball en voert daarna de kernreis voor agent/plugin/kanaal opnieuw uit. Als er geen oudere gepubliceerde baseline bestaat, wordt de kandidaatversie opnieuw gebruikt. Overschrijf de baseline met `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Release-plugin-marktplaats-smoketest: `pnpm test:docker:release-plugin-marketplace` installeert vanuit een lokale fixture-marktplaats, werkt de geïnstalleerde plugin bij, deïnstalleert deze en verifieert dat de plugin-CLI verdwijnt terwijl installatiemetadata worden opgeschoond.
- Skill-installatie-smoketest: `pnpm test:docker:skill-install` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt geüploade archiefinstallaties uit in de configuratie, haalt de huidige live ClawHub-skill-slug op uit zoeken, installeert deze met `openclaw skills install` en verifieert de geïnstalleerde skill plus `.clawhub`-origin-/lock-metadata.
- Update-kanaalwissel-smoketest: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt van pakket `stable` naar git `dev`, verifieert het persistent opgeslagen kanaal en plugin-werking na de update, schakelt daarna terug naar pakket `stable` en controleert de updatestatus.
- Upgrade-overlevings-smoketest: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vuile fixture voor een oude gebruiker met agents, kanaalconfiguratie, plugin-allowlists, verouderde plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Deze voert een pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Gepubliceerde-upgrade-overlevings-smoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikersbestanden, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, behoud van status, startup, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregatiescheduler om exacte lokale baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de reported-issues-set bevat `configured-plugin-installs` voor automatische reparatie van installatie van externe OpenClaw-plugins. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, lost meta-baseline-tokens op zoals `last-stable-4` of `all-since-2026.4.23`, en Full Release Validation breidt de release-soak-pakketgate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Sessie-runtimecontext-smoketest: `pnpm test:docker:session-runtime-context` verifieert persistentie van verborgen runtimecontexttranscripten plus doctor-reparatie van getroffen gedupliceerde prompt-herschrijfvertakkingen.
- Bun-globale-installatie-smoketest: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige tree, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde beeldproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. Update-smoketest gebruikt standaard npm `latest` als de stabiele baseline vóór upgrade naar de kandidaat-tarball. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-input van de Install Smoke-workflow op GitHub. Niet-root-installatiecontroles houden een geïsoleerde npm-cache bij zodat cachevermeldingen van root geen gebruikerslokale installatiegedrag maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root-/update-/direct-npm-cache opnieuw te gebruiken bij lokale heruitvoeringen.
- Install Smoke CI slaat de dubbele directe globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- Agents-gedeelde-workspace-verwijderen-CLI-smoketest: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag voor behouden workspace. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met ruwe CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, tot cursor gepromoveerde klikbare elementen, iframe-refs en framemetadata dekken.
- OpenAI Responses web_search minimale-redenering-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server uit via Gateway, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de provider-schema-afwijzing en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-kanaalbrug (geseede Gateway + stdio-brug + ruwe Claude-notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw-bundel-MCP-tools (echte stdio-MCP-server + ingebedde OpenClaw-profiel-allow/deny-smoketest): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-cleanup (echte Gateway + afbreken van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, misvormde npm-pakketmetadata, git moving refs, ClawHub kitchen-sink, marktplaatsupdates en Claude-bundel inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-levenscyclusmatrix-smoketest: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt enable/disable om, upgradet en downgradet deze via een lokaal npm-register, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS-/CPU-metrics voor elke levenscyclusfase worden gelogd.
- Configuratie-herlaadmetadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git moving refs, ClawHub-fixtures, marktplaatsupdates en Claude-bundel inschakelen/inspecteren. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt met resources bijgehouden npm-plugin-installatie, inschakelen, uitschakelen, upgrade, downgrade en uninstall bij ontbrekende code.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` winnen nog steeds wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een gedeelde externe image wijst, halen de scripts deze op als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat zij pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners koppelen de huidige checkout ook alleen-lezen via een bind mount en
plaatsen die in een tijdelijke werkmap binnen de container. Zo blijft de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale source/config draait.
De stagingstap slaat grote, alleen lokale caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputmappen, zodat Docker-live-runs geen minuten besteden aan het kopiëren van
machine-specifieke artefacten.
Ze zetten ook `OPENCLAW_SKIP_CHANNELS=1`, zodat Gateway-liveprobes geen
echte Telegram/Discord/enz.-kanaalworkers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je live Gateway-dekking in die Docker-baan
wilt beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteits-smoketest op hoger niveau: deze start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een vastgepinde Open WebUI-container tegen die Gateway, meldt aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` toont, en stuurt daarna een
echt chatverzoek via Open WebUI's `/api/chat/completions`-proxy.
Stel `OPENWEBUI_SMOKE_MODE=models` in voor CI-controles op het releasepad die moeten stoppen
na aanmelden bij Open WebUI en modeldetectie, zonder te wachten op een live
modelvoltooiing.
De eerste run kan merkbaar trager zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-start-setup moet afronden.
Deze baan verwacht een bruikbare live modelsleutel. Geef die door via de procesomgeving,
gestagede auth-profielen, of een expliciet `OPENCLAW_PROFILE_FILE`.
Geslaagde runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen echt
Telegram-, Discord- of iMessage-account nodig. Het start een seeded Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert daarna gerouteerde gespreksdetectie, transcriptreads, attachmentmetadata,
live eventqueue-gedrag, routering van uitgaande verzendingen, en Claude-stijl kanaal- en
toestemmingsmeldingen over de echte stdio MCP-bridge. De meldingscontrole
inspecteert de ruwe stdio MCP-frames rechtstreeks, zodat de smoketest valideert wat de
bridge echt uitzendt, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:agent-bundle-mcp-tools` is deterministisch en heeft geen live
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de ingebedde OpenClaw-bundel
MCP-runtime, voert de tool uit, en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden, terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live model
sleutel nodig. Het start een seeded Gateway met een echte stdio MCP-probeserver, draait een
geisoleerde cron-turn en een `sessions_spawn` one-shot child-turn, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP-thread-smoketest in gewone taal (niet CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadrouteringsvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gemount naar `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gemount naar `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` gemount en gesourcet voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourcet, met tijdelijke config-/werkmapmappen en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gemount naar `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-auth-mappen/-bestanden onder `$HOME` worden alleen-lezen gemount onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte providerruns mounten alleen de benodigde mappen/bestanden die uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` worden afgeleid
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor herhalingen die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te verzekeren dat credentials uit de profielopslag komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoketest wordt getoond
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoketest wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de vastgepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Draai docs-controles na docs-wijzigingen: `pnpm check:docs`.
Draai volledige Mintlify-ankervalidatie wanneer je ook controles op koppen binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway-toolaanroepen (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevaluaties (Skills)

We hebben al een paar CI-veilige tests die zich gedragen als "agent-betrouwbaarheidsevaluaties":

- Mock-toolaanroepen via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste Skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij de vereiste stappen/args?
- **Werkstroomcontracten:** multi-turn-scenario's die toolvolgorde, behoud van sessiegeschiedenis en sandboxgrenzen afdwingen.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolaanroepen + volgorde, Skill-bestandsreads en sessiebedrading te controleren.
- Een kleine suite met Skill-gerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite er is.

## Contracttests (Plugin- en kanaalvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk kanaal aan het
interfacecontract voldoet. Ze itereren over alle ontdekte Plugins en draaien een suite met
vorm- en gedragsasserties. De standaard `pnpm test` unit-baan slaat deze gedeelde
seam- en smokebestanden bewust over; draai de contractcommando's expliciet
wanneer je gedeelde kanaal- of providersurfaces aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Te vinden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basis-Plugin-vorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Sessiebindinggedrag
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Kanaalactiehandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory/roster-API
- **group-policy** - Afdwinging van groepsbeleid

### Providerstatuscontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Vorm van Plugin-register

### Providercontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-detectie
- **loader** - Plugin-laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer draaien

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een kanaal- of provider-Plugin
- Na het refactoren van Plugin-registratie of -detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent alleen live is (ratelimits, authbeleid), houd de live test dan smal en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - provider-requestconversie-/replaybug → directe modeltest
  - Gateway-sessie-/history-/toolpipelinebug → Gateway-live-smoketest of CI-veilige Gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled doel per SecretRef-klasse af uit registermetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat exec-id's met traversalsegmenten worden afgewezen.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde doel-id's, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
