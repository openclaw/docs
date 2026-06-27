---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-06-27T17:41:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een handleiding voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, voor push, debuggen).
- Hoe live-tests inloggegevens vinden en modellen/providers selecteren.
- Hoe je regressies toevoegt voor model-/providerproblemen uit de praktijk.

<Note>
**QA-stack (qa-lab, qa-channel, live-transportlanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, commandosurface, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) - referentie voor `pnpm openclaw qa matrix`.
- [Volwassenheidsscorecard](/nl/maturity/scorecard) - hoe QA-bewijs voor releases stabiliteits- en LTS-beslissingen ondersteunt.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transportplugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker-/Parallels-runners. De sectie met QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snelstart

Op de meeste dagen:

- Volledige gate (verwacht voor push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale run van de volledige suite op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandsdoelen routeren nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan een enkele fout werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

## Tijdelijke Testmappen

Geef de voorkeur aan de gedeelde helpers in `test/helpers/temp-dir.ts` voor tijdelijke
mappen die eigendom zijn van tests. Ze maken eigendom expliciet en houden opschoning binnen dezelfde
testlevenscyclus:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Gebruik `makeTempDir(tempDirs, prefix)` en `cleanupTempDirs(tempDirs)` wanneer een test
al eigenaar is van een array of set met paden. Vermijd nieuwe losse `fs.mkdtemp*`-aanroepen in
tests, tenzij een case expliciet onbewerkt temp-dir-gedrag verifieert. Voeg een
controleerbare allow-opmerking toe met een concrete reden wanneer een test bewust een
losse tijdelijke map nodig heeft:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Voor migratiezichtbaarheid rapporteert `node scripts/report-test-temp-creations.mjs`
nieuwe losse temp-dir-aanmaak in toegevoegde diffregels zonder bestaande opschoonstijlen
te blokkeren. De bestandsscope volgt bewust dezelfde testpadclassificatie
die wordt gebruikt door `scripts/changed-lanes.mjs`, in plaats van een aparte heuristiek
voor test-helperbestandsnamen te onderhouden, terwijl de gedeelde helperimplementatie zelf wordt overgeslagen.
`check:changed` voert dit rapport uit voor gewijzigde testpaden als een alleen-waarschuwing-CI-
signaal; bevindingen zijn GitHub-waarschuwingsannotaties, geen fouten.

Wanneer je echte providers/modellen debugt (vereist echte inloggegevens):

- Live-suite (modellen + gateway-tool-/afbeeldingsprobes): `pnpm test:live`
- Richt je stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-performancerapporten: dispatch `OpenClaw Performance` met
  `live_openai_candidate=true` voor een echte `openai/gpt-5.5` agent-turn of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artefacten. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.5-laneartefacten naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook bron-niveau gateway-boot-, geheugen-,
  plugin-pressure-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstturn uit plus een kleine file-read-achtige probe.
    Modellen waarvan metadata `image`-input adverteert, voeren ook een kleine afbeeldingsturn uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live-/E2E-workflow aan met
    `include_live_suites: true`, inclusief aparte Docker live-modelmatrixjobs
    geshard per provider.
  - Voor gerichte CI-reruns dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de geplande/release-callers ervan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live-lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna een gewoon antwoord en een afbeeldingbijlage
    die via de native pluginbinding routeren in plaats van ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agent-turns uit via de plugin-eigen Codex app-server-harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard afbeelding,
    Cron MCP, sub-agent en Guardian-probes. Schakel de sub-agentprobe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agentcontrole schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit sluit af na de sub-agentprobe, tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Codex on-demand install-smoke: `pnpm test:docker:codex-on-demand`
  - Installeert de verpakte OpenClaw-tarball in Docker, voert onboarding met een OpenAI API-key
    uit, en verifieert dat de Codex Plugin plus de `@openai/codex`-afhankelijkheid
    op aanvraag zijn gedownload naar de beheerde npm-projectroot.
- Live plugin-toolafhankelijkheid-smoke: `pnpm test:docker:live-plugin-tool`
  - Pakt een fixture-Plugin in met een echte `slugify`-afhankelijkheid, installeert deze via
    `npm-pack:`, verifieert de afhankelijkheid onder de beheerde npm-projectroot,
    vraagt daarna een live OpenAI-model om de plugintool aan te roepen en de verborgen
    slug terug te geven.
- Crestodian rescue-command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in controle met extra zekerheid voor de rescue-commandosurface van berichtkanalen.
    Deze oefent `/crestodian status`, plaatst een permanente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes`, en verifieert het audit-/config-schrijfpunt.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een nep-Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geauditeerde typed
    config-write.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, verifieert het moderne onboard
    Crestodian-entrypoint, past setup-/model-/agent-/Discord Plugin + SecretRef-
    writes toe, valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setup-
    pad wordt ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falende case nodig hebt, geef dan de voorkeur aan het vernauwen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realiteit nodig hebt:

CI voert QA Lab uit in toegewezen workflows. Agentic-pariteit is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. Stabiele/standaard release-
checks houden uitputtende live-/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait elke nacht op `main` en via handmatige dispatch met de mock-paritylane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord-
lane als parallelle jobs. Geplande QA- en releasechecks geven Matrix
`--profile fast` expliciet mee, terwijl de Matrix CLI en de standaardwaarde voor handmatige workflowinput
`all` blijven; handmatige dispatch kan `all` sharden in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert pariteit plus de snelle Matrix- en Telegram-lanes uit vóór release-
goedkeuring, met `mock-openai/gpt-5.5` voor releasetransportchecks zodat ze
deterministisch blijven en normale provider-pluginopstart vermijden. Deze live-transport-
gateways schakelen geheugenzoekopdrachten uit; geheugengedrag blijft gedekt door de QA-parity-
suites.

Full-release live-mediashards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dat al
`ffmpeg` en `ffprobe` bevat. Docker live-model-/backendshards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die eenmaal per geselecteerde
commit wordt gebouwd, en trekken deze daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Schrijft topniveau-artefacten `qa-evidence.json`, `qa-suite-summary.json` en
    `qa-suite-report.md` voor de geselecteerde scenarioset, inclusief selecties
    voor gemengde flow-, Vitest- en Playwright-scenario's.
  - Wanneer aangeroepen door `pnpm openclaw qa run --qa-profile <profile>`, neemt
    de geselecteerde taxonomy-profielscorekaart op in dezelfde `qa-evidence.json`.
    `smoke-ci` schrijft beknopt bewijs, wat `evidenceMode: "slim"` instelt en
    `execution` per item weglaat. `release` dekt de samengestelde slice voor
    releasegereedheid; `all` selecteert elke actieve volwassenheidscategorie en
    is bedoeld voor expliciete QA Profile Evidence-workflowdispatches wanneer een
    volledig scorekaartartefact nodig is.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door
    het geselecteerde aantal scenario's). Gebruik `--concurrency <count>` om het
    aantal workers af te stemmen, of `--concurrency 1` voor het oudere seriële pad.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik
    `--allow-failures` wanneer je artefacten wilt zonder een falende exitcode.
  - Ondersteunt provider-modi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale door AIMock ondersteunde provider-server voor
    experimentele fixture- en protocol-mockdekking zonder het scenario-bewuste
    `mock-openai`-pad te vervangen.
- `pnpm openclaw qa coverage --match <query>`
  - Doorzoekt scenario-ID's, titels, oppervlakken, coverage-ID's, docs-verwijzingen,
    codeverwijzingen, plugins en provider-vereisten, en print daarna overeenkomende
    suite-targets.
  - Gebruik dit vóór een QA Lab-run wanneer je het geraakte gedrag of bestandspad
    kent, maar niet het kleinste scenario. Dit is alleen adviserend; kies nog steeds
    mock-, live-, Multipass-, Matrix- of transportbewijs op basis van het gedrag
    dat wordt gewijzigd.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink Plugin-gauntlet uit via QA Lab. Het installeert
    het externe Kitchen Sink-pakket, verifieert de inventaris van het plugin-SDK-
    oppervlak, peilt `/healthz` en `/readyz`, registreert Gateway CPU/RSS-bewijs,
    voert een live OpenAI-turn uit en controleert adversariële diagnostiek.
    Vereist live OpenAI-auth zoals `OPENAI_API_KEY`. In gehydrateerde Testbox-
    sessies laadt het automatisch het Testbox live-auth-profiel wanneer de
    `openclaw-testbox-env`-helper aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark uit plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metriek worden
    vastgelegd zonder eruit te zien als de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout
    nog geen verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-auth-inputs door die praktisch zijn voor de
    guest: env-gebaseerde provider-sleutels, het QA live-providerconfiguratiepad en
    `CODEX_HOME` wanneer aanwezig.
  - Outputmappen moeten onder de repo-root blijven zodat de guest via de gemounte
    workspace kan terugschrijven.
  - Schrijft het normale QA-rapport plus samenvatting en Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de door Docker ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-sleutel-onboarding uit, configureert
    standaard Telegram, verifieert dat de verpakte plugin-runtime laadt zonder
    dependency-reparatie bij het opstarten, voert doctor uit en voert één lokale
    agent-turn uit tegen een gemockt OpenAI-endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om hetzelfde packaged-install-
    pad met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoke voor de gebouwde app uit voor ingesloten
    runtime-contexttranscripten. Het verifieert dat verborgen OpenClaw-runtimecontext
    wordt gepersisteerd als een niet-weergegeven custom message in plaats van te
    lekken naar de zichtbare user-turn, seedt daarna een getroffen kapotte sessie-
    JSONL en verifieert dat `openclaw doctor --fix` die herschrijft naar de actieve
    branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding voor het
    geïnstalleerde pakket uit, configureert Telegram via de geïnstalleerde CLI en
    hergebruikt daarna het live Telegram QA-pad met dat geïnstalleerde pakket als
    de SUT Gateway.
  - De wrapper mount alleen de `qa-lab`-harnessbron vanuit de checkout; het
    geïnstalleerde pakket bezit `dist`, `openclaw/plugin-sdk` en de gebundelde
    plugin-runtime, zodat het pad de huidige checkout-plugins niet mengt in het
    pakket dat wordt getest.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het registry
    een opgeloste lokale tarball te testen.
  - Emitteert standaard herhaalde RTT-timing in `qa-evidence.json` met
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Overschrijf
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om de RTT-run af te stemmen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepteert een kommagescheiden lijst met
    Telegram QA-check-ID's om te samplen; wanneer niet ingesteld, is de standaard
    RTT-geschikte check `telegram-mentioned-message-reply`.
  - Gebruikt dezelfde Telegram-env-credentials of Convex-credentialbron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en een rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - De wrapper valideert Telegram- of Convex-credential-env op de host vóór
    Docker-build-/installatiewerk. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust pre-credential-setup debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor dit pad. Wanneer Convex-credentials
    zijn geselecteerd en geen rol is ingesteld, gebruikt de wrapper `ci` in CI en
    `maintainer` buiten CI.
  - GitHub Actions biedt dit pad aan als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Het draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-credentialleases.
- GitHub Actions biedt ook `Package Acceptance` voor productbewijs als side-run
  tegen één kandidaatpakket. Het accepteert een trusted ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna
  de bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of
  custom-laneprofielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artefact uit te voeren.
  - Nieuwste beta-productbewijs:

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

- Enterprise-/private tarball-mirrors gebruiken een expliciet trusted-source-beleid:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` leest `.github/package-trusted-sources.json` uit de trusted
workflow-ref en accepteert geen URL-credentials of een workflow-input-bypass voor
private netwerken. Als het genoemde beleid bearer-auth declareert, configureer dan
het vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-geheim.

- Artefactbewijs downloadt een tarball-artefact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Verpakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt daarna gebundelde kanalen/plugins in via
    configuratie-edits.
  - Verifieert dat setup-discovery ongeconfigureerde downloadbare plugins afwezig
    laat, dat de eerste geconfigureerde doctor-reparatie elke ontbrekende
    downloadbare plugin expliciet installeert en dat een tweede herstart geen
    verborgen dependency-reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in vóór het
    uitvoeren van `openclaw update --tag <candidate>` en verifieert dat de
    post-update doctor van de kandidaat legacy plugin-dependencyresten opruimt
    zonder postinstall-reparatie aan de harness-zijde.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert
    daarna de geïnstalleerde opdracht `openclaw update` uit in dezelfde guest en
    verifieert de geïnstalleerde versie, updatestatus, Gateway-gereedheid en één
    lokale agent-turn.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één guest. Gebruik `--json` voor het pad naar het samenvattings-
    artefact en de status per pad.
  - Het OpenAI-pad gebruikt standaard `openai/gpt-5.5` voor het live agent-turn-
    bewijs. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander OpenAI-model
    valideert.
  - Wikkel lange lokale runs in een host-timeout zodat vastgelopen Parallels-
    transport niet de rest van het testvenster kan opslokken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastgelopen is.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor- en
    pakketupdatewerk op een koude guest; dat is nog steeds gezond wanneer het
    geneste npm-debuglog voortgang maakt.
  - Voer deze aggregate-wrapper niet parallel uit met afzonderlijke Parallels
    macOS-, Windows- of Linux-smokelanes. Ze delen VM-status en kunnen botsen op
    snapshotherstel, pakketservering of Gateway-status in de guest.
  - Het post-update-bewijs voert het normale gebundelde Plugin-oppervlak uit,
    omdat capability-facades zoals spraak, beeldgeneratie en mediabegrip via
    gebundelde runtime-API's worden geladen, zelfs wanneer de agent-turn zelf
    alleen een eenvoudige tekstantwoordcontrole uitvoert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix-live-QA-lane uit tegen een wegwerpbare, door Docker ondersteunde Tuwunel-homeserver. Alleen source-checkout - verpakte installaties leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifact-indeling: [Matrix-QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram-live-QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard de env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Standaarden dekken canary, mention gating, command-adressering, `/status`, bot-naar-bot-antwoorden met vermeldingen, en antwoorden op native kerncommando's. `mock-openai`-standaarden dekken ook deterministische reply-chain- en Telegram-regressies voor final-message streaming. Gebruik `--list-scenarios` voor optionele probes zoals `session_status`.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam heeft.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot botverkeer in de groep kan observeren.
  - Schrijft een Telegram-QA-rapport, samenvatting en `qa-evidence.json` onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het geobserveerde SUT-antwoord.

`Mantis Telegram Live` is de PR-evidence-wrapper rond deze lane. Deze voert de
candidate-ref uit met via Convex geleasede Telegram-referenties, rendert de geredigeerde QA-
rapport-/evidencebundel in een Crabbox-desktopbrowser, neemt MP4-evidence op,
genereert een op beweging getrimde GIF, uploadt de artifactbundel en plaatst inline PR-
evidence via de Mantis GitHub App wanneer `pr_number` is ingesteld. Maintainers kunnen
deze starten vanuit de Actions-UI via `Mantis Scenario` (`scenario_id:
telegram-live`) of rechtstreeks vanuit een pullrequestcommentaar:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` is de agentische native Telegram Desktop-
voor/na-wrapper voor visueel PR-bewijs. Start deze vanuit de Actions-UI met
vrije `instructions`, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), of vanuit een PR-commentaar:

```text
@openclaw-mantis telegram desktop proof
```

De Mantis-agent leest de PR, bepaalt welk Telegram-zichtbaar gedrag de
wijziging bewijst, voert de echte-gebruiker Crabbox Telegram Desktop proof-lane uit op baseline- en
candidate-refs, itereert totdat de native GIF's bruikbaar zijn, schrijft een gekoppeld
`motionPreview`-manifest en plaatst dezelfde GIF-tabel met 2 kolommen via de
Mantis GitHub App wanneer `pr_number` is ingesteld.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Leaset of hergebruikt een Crabbox Linux-desktop, installeert native Telegram Desktop, configureert OpenClaw met een geleased Telegram-SUT-bottoken, start de Gateway en neemt screenshot-/MP4-evidence op vanaf de zichtbare VNC-desktop.
  - Gebruikt standaard `--credential-source convex`, zodat workflows alleen het Convex-brokergeheim nodig hebben. Gebruik `--credential-source env` met dezelfde `OPENCLAW_QA_TELEGRAM_*`-variabelen als `pnpm openclaw qa telegram`.
  - Telegram Desktop heeft nog steeds een gebruikerslogin/-profiel nodig. Het bottoken configureert alleen OpenClaw. Gebruik `--telegram-profile-archive-env <name>` voor een base64 `.tgz`-profielarchief, of gebruik `--keep-lease` en log eenmalig handmatig in via VNC.
  - Schrijft `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` en `telegram-desktop-builder.mp4` onder de uitvoermap.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
live transport-QA, verkrijgt QA lab een exclusieve lease uit een door Convex ondersteunde pool, stuurt heartbeats voor die
lease terwijl de lane draait, en geeft de lease vrij bij afsluiten. De sectienaam dateert van vóór
Discord-, Slack- en WhatsApp-ondersteuning; het leasecontract wordt gedeeld over soorten heen.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback-`http://`-Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Maintainer-admincommando's (pool toevoegen/verwijderen/opsommen) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-runs om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en admin-/list-bereikbaarheid te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

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
- `POST /admin/add` (alleen maintainergeheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Verzoek: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Actieve-leaseguard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-soort:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert misvormde payloads.

Payloadvorm voor Telegram-echte-gebruiker-soort:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` en `telegramApiId` moeten numerieke strings zijn.
- `tdlibArchiveSha256` en `desktopTdataArchiveSha256` moeten SHA-256-hexstrings zijn.
- `kind: "telegram-user"` is gereserveerd voor de Mantis Telegram Desktop proof-workflow. Generieke QA Lab-lanes mogen deze niet verkrijgen.

Door de broker gevalideerde multi-channel-payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-lanes kunnen ook uit de pool leasen, maar Slack-payloadvalidatie bevindt zich momenteel
in de Slack-QA-runner in plaats van in de broker. Gebruik
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
voor Slack-rijen.

### Een kanaal toevoegen aan QA

De architectuur- en scenariohelpernamen voor nieuwe channel-adapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transport-runner op de gedeelde `qa-lab`-host seam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Beschouw de suites als "toenemende realismegraad" (en toenemende instabiliteit/kosten):

### Unit / integration (standaard)

- Commando: `pnpm test`
- Config: niet-gerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-projectshards uitbreiden naar per-projectconfigs voor parallelle planning
- Bestanden: core-/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de speciale `unit-ui`-shard
- Scope:
  - Zuivere unittests
  - In-process integratietests (Gateway-auth, routering, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loader-tests moeten breed `api.js`- en
    `runtime-api.js`-fallbackgedrag bewijzen met gegenereerde kleine Plugin-fixtures, niet
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-loads horen thuis in
    door Plugins beheerde contract-/integratiesuites.

Native dependency-beleid:

- Standaard testinstallaties slaan optionele native Discord opus-builds over. Discord voice gebruikt gebundelde `libopus-wasm`, en `@discordjs/opus` blijft uitgeschakeld in `allowBuilds`, zodat lokale tests en Testbox-lanes de native addon niet compileren.
- Vergelijk native opus-prestaties in de `libopus-wasm`-benchmarkrepo, niet in standaard OpenClaw-installatie-/testlussen. Stel `@discordjs/opus` niet in op `true` in de standaard `allowBuilds`; daardoor gaan niet-gerelateerde installatie-/testlussen native code compileren.

<AccordionGroup>
  <Accordion title="Projecten, shards en gescopete lanes">

    - Niet-gerichte `pnpm test` draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-projectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraph, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige opstartkosten van het root-project hoeft te betalen.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, sibling-`*.test.ts`-bestanden, expliciete bronmappings en lokale importgraph-afhankelijken. Configuratie-, setup- en pakketbewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Het classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en draait daarna de bijpassende typecheck-, lint- en guard-commando's. Het draait geen Vitest-tests; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Alleen-releasemetadata-versiebumpen draaien gerichte versie-/config-/root-dependencychecks, met een guard die pakketwijzigingen buiten het top-level versieveld afwijst.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte checks: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere pakketoppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unit-tests uit agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden routeren via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen changed-mode-runs ook naar expliciete siblingtests in die lichte lanes, zodat helperbewerkingen niet de volledige zware suite voor die directory opnieuw hoeven te draaien.
    - `auto-reply` heeft aparte buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR/main-CI slaat bewust de extensie-batchsweep en de release-only `agentic-plugins`-shard over. Full Release Validation dispatcht de afzonderlijke child-workflow `Plugin Prerelease` voor die plugin-/extensiezware suites op release candidates.

  </Accordion>

  <Accordion title="Dekking van ingebedde runner">

    - Wanneer je message-tool-discovery-inputs of compaction-runtimecontext
      wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de integratiesuites van de ingebedde runner gezond:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` en
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en Compaction-gedrag nog steeds door
      de echte `run.ts`- / `compact.ts`-paden stromen; tests met alleen helpers
      zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool en isolatiestandaarden">

    - De basisconfiguratie van Vitest staat standaard op `threads`.
    - De gedeelde Vitest-configuratie fixeert `isolate: false` en gebruikt de
      niet-geïsoleerde runner in de root-projecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook
      op de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-
      standaarden uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.
    - `scripts/run-vitest.mjs` beëindigt expliciete niet-watch-Vitest-runs na
      5 minuten zonder stdout- of stderr-output. Stel
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` in om de watchdog uit te schakelen voor een
      bewust stil onderzoek.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff triggert.
    - De pre-commit-hook is alleen voor formattering. Hij stagede geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai `pnpm check:changed` expliciet vóór overdracht of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      besluit dat een harness-, config-, pakket- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag,
      alleen met een hogere workerlimiet.
    - Lokale automatische worker-scaling is bewust conservatief en schaalt terug
      wanneer het host-loadgemiddelde al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade veroorzaken.
    - De basisconfiguratie van Vitest markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat changed-mode-herhalingen correct blijven wanneer test-
      wiring wijzigt.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Performance-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurreporting plus
      import-breakdown-output in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Whole-config-runs gebruiken het configuratiepad als sleutel; include-pattern-CI-
      shards voegen de shardnaam toe zodat gefilterde shards afzonderlijk gevolgd
      kunnen worden.
    - Wanneer één hete test nog steeds de meeste tijd aan opstartimports besteedt,
      houd zware dependencies achter een smalle lokale `*.runtime.ts`-grens en
      mock die grens direct in plaats van runtime-helpers diep te importeren alleen
      om ze door `vi.mock(...)` te sturen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en
      print wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de lijst met gewijzigde bestanden via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread-CPU-profiel voor
      opstart- en transform-overhead van Vitest/Vite.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unit-suite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte local loopback Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische Gateway-berichten, geheugen- en large-payload-churn door het diagnostische eventpad
  - Queryt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistence-helpers voor diagnostische stabiliteitsbundels
  - Assert dat de recorder bounded blijft, synthetische RSS-samples onder het pressurebudget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (repo-aggregaat)

- Commando: `pnpm test:e2e`
- Scope:
  - Draait de gateway-smoke-E2E-lane
  - Draait de mocked Control UI browser-E2E-lane
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Vereist dat Playwright Chromium is geïnstalleerd

### E2E (gateway-smoke)

- Commando: `pnpm test:e2e:gateway`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde-Plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, overeenkomend met de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om overhead door console-I/O te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om verbose console-output opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van multi-instance Gateway
  - WebSocket-/HTTP-oppervlakken, node-pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unit-tests (kan trager zijn)

### E2E (Control UI gemockte browser)

- Commando: `pnpm test:ui:e2e`
- Configuratie: `test/vitest/vitest.ui-e2e.config.ts`
- Bestanden: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Start de Vite Control UI
  - Stuurt een echte Chromium-pagina aan via Playwright
  - Vervangt de Gateway WebSocket door deterministische in-browser mocks
- Verwachtingen:
  - Draait in CI als onderdeel van `pnpm test:e2e`
  - Geen echte Gateway, agents of providersleutels vereist
  - Browserdependency moet aanwezig zijn (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell-backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Hergebruikt een actieve lokale OpenShell-gateway
  - Maakt een sandbox vanuit een tijdelijke lokale Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canonical-bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Vereist een actieve lokale OpenShell-gateway en de configuratiebron daarvan
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testsandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` om de geregistreerde gatewayconfiguratie bloot te stellen aan de geïsoleerde test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` om het Docker-gateway-IP te overschrijven dat door de host-policy-fixture wordt gebruikt

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live-tests voor gebundelde Plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Bereik:
  - "Werkt deze provider/dit model _vandaag_ echt met echte referenties?"
  - Vang wijzigingen in providerindeling, eigenaardigheden bij tool-aanroepen, authenticatieproblemen en rate-limitgedrag op
- Verwachtingen:
  - Niet CI-stabiel van opzet (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Voer liever beperkte subsets uit dan "alles"
- Live-runs gebruiken al geexporteerde API-sleutels en gestagede authenticatieprofielen.
- Standaard isoleren live-runs nog steeds `HOME` en kopieren ze configuratie-/authenticatiemateriaal naar een tijdelijke test-home, zodat unitfixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte homedirectory gebruiken.
- `pnpm test:live` gebruikt standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer en dempt Gateway-opstartlogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limitreacties.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites schrijven nu voortgangsregels naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecaptatie stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels tijdens live-runs direct streamen.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslistabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- "Mijn bot is offline" debuggen / providerspecifieke fouten / tool-aanroepen: voer een beperkte `pnpm test:live` uit

## Live (netwerk-aanrakende) tests

Voor de live-modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harness en alle live-tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - plus referentieafhandeling voor live-runs - zie
[Live-suites testen](/nl/help/testing-live). Zie voor de specifieke checklist voor updates en
Plugin-validatie
[Updates en Plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-controles)

Deze Docker-runners zijn in twee groepen verdeeld:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende live-bestand met profielsleutels uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configmap, werkruimte en optioneel profiel-env-bestand worden gemount. De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners behouden waar nodig hun eigen praktische limieten:
  `test:docker:live-models` gebruikt standaard de gecureerde ondersteunde set met hoge signaalwaarde, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Stel `OPENCLAW_LIVE_MAX_MODELS`
  of de Gateway-env-vars in wanneer je expliciet een kleinere limiet of grotere scan wilt.
- `test:docker:all` bouwt de live-Docker-image een keer via `test:docker:live-build`, pakt OpenClaw een keer als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install-/update-/Plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor built-app-functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. Het aggregaat gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt processlots, terwijl resourcelimieten voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve limieten, kan de scheduler die nog steeds starten wanneer de pool leeg is en hem daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, slaat succesvolle lanetimings op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om langere lanes bij latere runs eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, pakket-/imagebehoeften en referenties te printen.
- `Package Acceptance` is de GitHub-native pakketpoort voor "werkt deze installeerbare tarball als product?" Het resolveert een kandidaatpakket uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt het als `package-under-test` en voert daarna de herbruikbare Docker E2E-lanes uit tegen precies die tarball in plaats van de geselecteerde ref opnieuw te packen. Profielen zijn op breedte geordend: `smoke`, `package`, `product` en `full`. Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, release-standaarden en foutentriage.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graaf vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als opstarten voor commandodispatch pakketafhankelijkheden importeert, zoals Commander, prompt-UI, undici of logging; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. Packaged CLI-smoke dekt ook root help, onboard help, doctor help, status, configschema en een model-list-opdracht.
- Legacy-compatibiliteit van Package Acceptance is afgetopt op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert de harness alleen metadatahiaten van verzonden pakketten: weggelaten private QA-inventory-items, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide gitfixture, ontbrekende persistente `update.channel`, legacy Plugin-install-record-locaties, ontbrekende persistente marketplace-install-records en configuratiemetadata-migratie tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten een of meer echte containers en verifieren integratiepaden op hoger niveau.
- Docker/Bash E2E-lanes die de gepackte OpenClaw-tarball installeren via `scripts/lib/openclaw-e2e-instance.sh` begrenzen `npm install` op `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (standaard `600s`; stel `0` in om de wrapper voor debugging uit te schakelen).

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is beperkt) en kopieren die vervolgens naar de container-home voor de run, zodat externe-CLI OAuth tokens kan vernieuwen zonder de auth-store van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` en `pnpm qa:observability:smoke` zijn private QA-lanes voor source-checkouts. Ze zijn bewust geen onderdeel van package-Docker-release-lanes, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding-/kanaal-/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de gepackte OpenClaw-tarball globaal in Docker, configureert standaard OpenAI via env-ref-onboarding plus Telegram, voert doctor uit en voert een gemockte OpenAI-agentturn uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Release-gebruikersreis-smoketest: `pnpm test:docker:release-user-journey` installeert de ingepakte OpenClaw-tarball globaal in een schone Docker-home, voert onboarding uit, configureert een gemockte OpenAI-provider, voert een agentbeurt uit, installeert/de-installeert externe plugins, configureert ClickClack tegen een lokale fixture, verifieert uitgaande/inkomende berichtenuitwisseling, herstart Gateway en voert doctor uit.
- Release-typed-onboarding-smoketest: `pnpm test:docker:release-typed-onboarding` installeert de ingepakte tarball, stuurt `openclaw onboard` door een echte TTY, configureert OpenAI als een env-ref-provider, verifieert dat ruwe sleutels niet persistent worden opgeslagen en voert een gemockte agentbeurt uit.
- Release-media/geheugen-smoketest: `pnpm test:docker:release-media-memory` installeert de ingepakte tarball, verifieert beeldbegrip vanuit een PNG-bijlage, OpenAI-compatibele uitvoer voor beeldgeneratie, herinnering via geheugenzoekopdracht en behoud van herinnering na een Gateway-herstart.
- Release-upgrade-gebruikersreis-smoketest: `pnpm test:docker:release-upgrade-user-journey` installeert standaard de nieuwste gepubliceerde baseline die ouder is dan de kandidaat-tarball, configureert provider-/Plugin-/ClickClack-status op het gepubliceerde pakket, upgradet naar de kandidaat-tarball en voert daarna de kernreis voor agent/Plugin/kanaal opnieuw uit. Als er geen oudere gepubliceerde baseline bestaat, wordt de kandidaatversie hergebruikt. Overschrijf de baseline met `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Release-Plugin-marktplaats-smoketest: `pnpm test:docker:release-plugin-marketplace` installeert vanuit een lokale fixture-marktplaats, werkt de geïnstalleerde Plugin bij, de-installeert deze en verifieert dat de Plugin-CLI verdwijnt terwijl installatiemetadata zijn opgeschoond.
- Skill-install-smoketest: `pnpm test:docker:skill-install` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt geüploade archiefinstallaties uit in de configuratie, herleidt de huidige live ClawHub-Skill-slug vanuit zoeken, installeert deze met `openclaw skills install` en verifieert de geïnstalleerde Skill plus `.clawhub`-origin-/lock-metadata.
- Updatekanaal-switch-smoketest: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt van pakket `stable` naar git `dev`, verifieert het opgeslagen kanaal en post-updatewerk voor Plugins, schakelt daarna terug naar pakket `stable` en controleert de updatestatus.
- Upgrade-survivor-smoketest: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vuile oude-gebruiker-fixture met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert een pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Gepubliceerde-upgrade-survivor-smoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruiker-bestanden, configureert die baseline met een ingebakken opdrachtrecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, behoud van status, startup, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregatieplanner om exacte lokale baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de reported-issues-set bevat `configured-plugin-installs` voor automatisch herstel van externe OpenClaw-Plugin-installaties. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, herleidt meta-baseline-tokens zoals `last-stable-4` of `all-since-2026.4.23`, en Full Release Validation breidt de release-soak-pakketgate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Sessie-runtimecontext-smoketest: `pnpm test:docker:session-runtime-context` verifieert persistentie van verborgen runtimecontext-transcripten plus doctor-herstel van getroffen gedupliceerde prompt-rewrite-takken.
- Bun-globale-installatie-smoketest: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde beeldproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` vanuit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als de stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-invoer van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan, zodat cache-items die eigendom zijn van root het installatiegedrag van de lokale gebruiker niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root-/update-/direct-npm-cache bij lokale herhalingen opnieuw te gebruiken.
- Install Smoke CI slaat de dubbele direct-npm globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- Agents verwijderen gedeelde-workspace-CLI-smoketest: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus behoud van workspace-gedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + gezondheid): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met ruwe CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote klikbare elementen, iframe-refs en framemetadata afdekken.
- OpenAI Responses web_search minimal reasoning-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna dat het providerschema weigert en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-kanaalbrug (geseede Gateway + stdio-brug + ruwe Claude notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw-bundel-MCP-tools (echte stdio-MCP-server + ingesloten OpenClaw-profiel-allow/deny-smoketest): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-opruiming (echte Gateway + afbraak van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehoste afhankelijkheden, misvormde npm-pakketmetadata, bewegende git-refs, ClawHub-kitchen-sink, marktplaatsupdates en Claude-bundel inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecycle-matrix-smoketest: `pnpm test:docker:plugin-lifecycle-matrix` installeert de ingepakte OpenClaw-tarball in een kale container, installeert een npm-Plugin, schakelt in/uit, upgradet en downgradet deze via een lokaal npm-register, verwijdert de geïnstalleerde code en verifieert daarna dat de-installatie nog steeds verouderde status verwijdert terwijl RSS-/CPU-metrics voor elke lifecycle-fase worden gelogd.
- Config-reload-metadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehoste afhankelijkheden, bewegende git-refs, ClawHub-fixtures, marktplaatsupdates en Claude-bundel inschakelen/inspecteren. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde Plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte npm-Plugin-installatie, inschakelen, uitschakelen, upgrade, downgrade en de-installatie bij ontbrekende code.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` winnen nog steeds wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image wijst, halen de scripts deze op als hij nog niet lokaal aanwezig is. De QR- en installer-Docker-tests houden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De Docker-runners voor live modellen koppelen de huidige checkout ook alleen-lezen aan en
stagen die naar een tijdelijke werkmap in de container. Dit houdt de runtime-
image slank terwijl Vitest nog steeds tegen je exacte lokale source/config wordt uitgevoerd.
De stagingstap slaat grote alleen-lokale caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` en app-lokale `.build`- of
Gradle-outputmappen, zodat Docker-live-runs geen minuten besteden aan het kopiëren van
machinespecifieke artefacten.
Ze zetten ook `OPENCLAW_SKIP_CHANNELS=1`, zodat live Gateway-probes geen
echte Telegram/Discord/enz. channel-workers in de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je live Gateway-dekking vanuit die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteits-smoke op hoger niveau: het start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` exposeert en stuurt daarna een
echte chatrequest via Open WebUI's `/api/chat/completions`-proxy.
Zet `OPENWEBUI_SMOKE_MODE=models` voor CI-controles op releasepaden die moeten stoppen
na aanmelding bij Open WebUI en modelontdekking, zonder te wachten op voltooiing door een live model.
De eerste run kan merkbaar trager zijn omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-start-setup moet afronden.
Deze lane verwacht een bruikbare sleutel voor een live model. Lever die via de proces-
omgeving, gestagede auth-profielen of een expliciet `OPENCLAW_PROFILE_FILE`.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het boot een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt en
verifieert vervolgens gerouteerde conversieontdekking, transcriptlezingen, attachmentmetadata,
gedrag van de live-eventqueue, routering van uitgaande verzending en channel- en
permissienotificaties in Claude-stijl via de echte stdio MCP-bridge. De notificatiecontrole
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk emitteert, niet alleen wat een specifieke client-SDK toevallig zichtbaar maakt.
`test:docker:agent-bundle-mcp-tools` is deterministisch en heeft geen sleutel voor een live
model nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
in de container, materialiseert die server via de embedded OpenClaw-bundle
MCP-runtime, voert de tool uit en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen sleutel voor een live model
nodig. Het start een geseede Gateway met een echte stdio MCP-probeserver, draait een
geisoleerde cron-turn en een `sessions_spawn` eenmalige child-turn, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP-thread-smoke in gewone taal (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadrouteringsvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` gekoppeld en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspacemappen en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties in Docker
- Externe CLI-authmappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Versmalde provider-runs koppelen alleen de benodigde mappen/bestanden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te waarborgen dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke wordt aangeboden
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docs-controles uit na docs-wijzigingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook headingcontroles binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway-toolaanroep (mock-OpenAI, echte Gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agentbetrouwbaarheidsevaluaties (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als "agentbetrouwbaarheidsevaluaties":

- Mock-toolaanroepen via de echte Gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij verplichte stappen/args?
- **Workflowcontracten:** multi-turn scenario's die toolvolgorde, overname van sessiegeschiedenis en sandboxgrenzen assertiveren.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner die mockproviders gebruikt om toolcalls + volgorde, skillbestandslezingen en sessiebedrading te assertiveren.
- Een kleine suite met op Skills gerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en channel-vorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd channel aan zijn
interfacecontract voldoet. Ze itereren over alle ontdekte Plugins en voeren een suite met
vorm- en gedragsasserties uit. De standaard `pnpm test` unit-lane slaat deze gedeelde
seam- en smoke-bestanden bewust over; voer de contractcommando's expliciet uit
wanneer je gedeelde channel- of provider-surfaces wijzigt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Te vinden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basisvorm van de Plugin (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Structuur van messagepayload
- **inbound** - Afhandeling van inkomende messages
- **actions** - Channel-actionhandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-statusprobes
- **registry** - Vorm van Plugin-register

### Providercontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-ontdekking
- **loader** - Plugin laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een channel- of provider-Plugin
- Na het refactoren van Plugin-registratie of -ontdekking

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent alleen-live is (rate limits, authbeleid), houd de live test beperkt en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - providerrequest-conversie-/replaybug → directe modeltest
  - Gateway-sessie-/history-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt een gesampeld doel per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`) en assertiveert vervolgens dat exec-id's met traversalsegmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde doel-id's, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
