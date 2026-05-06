---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerfouten
    - Debuggen van Gateway- en agentgedrag
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-05-06T09:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integration, e2e, live) en een kleine set
Docker-runners. Dit document is een handleiding voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor gangbare workflows (lokaal, pre-push, debugging).
- Hoe live tests referenties vinden en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, opdrachtoppervlak, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) - naslag voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transport-Plugin die wordt gebruikt door repo-backed scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker-/Parallels-runners. De sectie QA-specifieke uitvoerders hieronder ([QA-specifieke uitvoerders](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de bovenstaande referenties.
</Note>

## Snel starten

Op de meeste dagen:

- Volledige gate (verwacht voor push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige-suiterun op een ruime machine: `pnpm test:max`
- Directe Vitest-watch-loop: `pnpm test:watch`
- Directe bestandsdoelkeuze routeert nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan een enkele fout itereert.
- Docker-backed QA-site: `pnpm qa:lab:up`
- Door Linux-VM ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte referenties):

- Live suite (modellen + Gateway-tool-/image-probes): `pnpm test:live`
- Eén live bestand stil richten: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte agentbeurt met `openai/gpt-5.4` of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artefacten. Dagelijkse geplande runs
  publiceren artefacten voor mock-provider, deep-profile en GPT 5.4-lanes naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook bronniveaugetallen voor Gateway-opstart,
  geheugen, Plugin-druk, herhaalde fake-model hello-loop en CLI-opstart.
- Docker live model-sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt uit plus een kleine probe in bestandsleesstijl.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine image-beurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, inclusief afzonderlijke Docker live model-matrixjobs
    geshard per provider.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de bijbehorende
    geplande/release-aanroepers.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna dat een gewoon antwoord en een image-bijlage
    via de native Plugin-binding lopen in plaats van ACP.
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de door de Plugin beheerde Codex app-server-harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron-MCP, subagent- en Guardian-probes. Schakel de subagent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte subagentcontrole schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de subagent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders-controle voor het oppervlak van rescue command voor berichtenkanalen.
    Deze oefent `/crestodian status`, wachtrijt een persistente modelwijziging,
    antwoordt `/crestodian yes` en verifieert het audit-/configuratieschrijfpad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geauditeerde getypte
    configuratieschrijving.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup/model/agent/Discord-Plugin + SecretRef-schrijvingen toe,
    valideert configuratie en verifieert auditvermeldingen. Hetzelfde Ring 0-setup-pad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-kostensmoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het versmallen van live tests via de hieronder beschreven allowlist-env-vars.
</Tip>

## QA-specifieke uitvoerders

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI voert QA Lab uit in toegewezen workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. Stabiele/standaard release-checks
houden uitgebreide live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait 's nachts op `main` en vanuit handmatige dispatch met de mock parity-lane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord-lane
als parallelle jobs. Geplande QA en release-checks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix-CLI en handmatige workflowinvoer
standaard `all` blijven; handmatige dispatch kan `all` sharden in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert parity plus de snelle Matrix- en Telegram-lanes uit vóór releasegoedkeuring,
met `mock-openai/gpt-5.5` voor release-transportcontroles zodat ze
deterministisch blijven en normale provider-Plugin-opstart vermijden. Deze live transport-
Gateways schakelen memory search uit; geheugengedrag blijft gedekt door de QA parity-
suites.

Volledige release-live-mediashards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` bevat. Docker live model-/backendshards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die eenmaal per geselecteerde
commit is gebouwd, en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Eindigt met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocolmockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-Plugin-beproeving uit via QA Lab. Het
    installeert het externe Kitchen Sink-pakket, verifieert de inventaris van het Plugin SDK-oppervlak,
    test `/healthz` en `/readyz`, registreert Gateway CPU/RSS-
    bewijs, voert een live OpenAI-turn uit en controleert adversariële diagnostiek.
    Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In gehydrateerde Testbox-
    sessies wordt automatisch het Testbox live-auth-profiel geladen wanneer de
    `openclaw-testbox-env`-helper aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark uit plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudend hoge CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metriek worden geregistreerd
    zonder te lijken op de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout nog
    geen verse runtime-uitvoer heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-authenticatie-invoer door die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA live-providerconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Uitvoerdirs moeten onder de repo-root blijven zodat de guest via
    de gemounte workspace kan terugschrijven.
  - Schrijft het normale QA-rapport + de samenvatting plus Multipass-logboeken onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball van de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-key-onboarding uit, configureert standaard
    Telegram, verifieert dat de verpakte Plugin-runtime laadt zonder opstart-
    afhankelijkheidsherstel, voert doctor uit en voert één lokale agent-turn uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoke voor de gebouwde app uit voor ingebedde runtimecontext-
    transcripts. Het verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven aangepast bericht in plaats van te lekken naar de zichtbare gebruikers-turn,
    seedt vervolgens een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` die herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert installed-package-
    onboarding uit, configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT Gateway.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het register
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim in. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host vóór
    Docker-build-/installatiewerk. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust pre-credential-inrichting debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productbewijs in een zijrun
  tegen één kandidaatpakket. Het accepteert een vertrouwde ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of aangepaste
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
    met OpenAI geconfigureerd en schakelt daarna gebundelde kanalen/plugins in via config-
    edits.
  - Verifieert dat setup-detectie ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    Plugin expliciet installeert, en dat een tweede herstart geen verborgen afhankelijkheids-
    reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat legacy-Plugin-afhankelijkheidsresten opruimt zonder
    harness-side postinstall-reparatie.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het aangevraagde baselinepakket, voert daarna de
    geïnstalleerde opdracht `openclaw update` uit in dezelfde guest en verifieert de
    geïnstalleerde versie, updatestatus, Gateway-gereedheid en één lokale agent-
    turn.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één guest. Gebruik `--json` voor het samenvattingsartefactpad en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agent-turn-bewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-timeout zodat Parallels-transportstalls niet
    de rest van het testvenster kunnen opslokken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logboeken onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper hangt.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor- en pakket-
    updatewerk op een koude guest; dat is nog steeds gezond wanneer het geneste npm-
    debuglogboek vooruitgaat.
  - Voer deze aggregatiewrapper niet parallel uit met afzonderlijke Parallels
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of guest-Gateway-status.
  - Het post-update-bewijs voert het normale gebundelde Plugin-oppervlak uit omdat
    capabilityfacades zoals spraak, beeldgeneratie en mediabegrip worden geladen
    via gebundelde runtime-API's, zelfs wanneer de agent-turn zelf alleen een eenvoudige
    tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout - packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard de env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Eindigt met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam exposeert.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en artefact met geobserveerde berichten onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT van driver-verzendverzoek tot geobserveerd SUT-antwoord.

Live-transportlanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een Convex-ondersteunde pool, heartbeats
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Referentierolselectie:
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

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normale werking `https://` gebruiken.

Beheerder-adminopdrachten (pool add/remove/list) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor beheerders:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-runs om de Convex-site-URL, brokergeheimen,
endpointvoorvoegsel, HTTP-time-out en admin-/lijstbereikbaarheid te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Verzoek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succes: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw probeerbaar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen beheerdersgeheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen beheerdersgeheim)
  - Verzoek: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Bewaking voor actieve lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen beheerdersgeheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-type:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-tekenreeks zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert ongeldige payloads.

### Een kanaal toevoegen aan QA

De architectuur en namen van scenariohelpers voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab` host-seam, declareer `qaRunners` in het Plugin-manifest, koppel als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar wordt uitgevoerd)

Zie de suites als "toenemend realistisch" (en toenemend foutgevoelig/kostbaar):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de `vitest.full-*.config.ts` shardset en kunnen multi-project-shards uitbreiden naar configuraties per project voor parallelle planning
- Bestanden: core-/unitinventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de speciale `unit-ui`-shard
- Bereik:
  - Pure unittests
  - In-proces integratietests (Gateway-authenticatie, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loader-tests moeten breed fallbackgedrag voor `api.js` en
    `runtime-api.js` aantonen met gegenereerde kleine Plugin-fixtures, niet met
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-ladingen horen thuis in
    contract-/integratiesuites die eigendom zijn van de Plugin.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test` draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-project-proces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een watch-loop met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` sturen expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het root-project vermijdt.
    - `pnpm test:changed` breidt gewijzigde gitpaden standaard uit naar goedkope scoped lanes: directe testbewerkingen, aangrenzende `*.test.ts`-bestanden, expliciete bronmappings en lokale import-graafafhankelijken. Config-/setup-/packagebewerkingen draaien geen brede tests tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, release-metadata, live Docker-tooling en tooling, en voert vervolgens de bijpassende typecheck-, lint- en guard-opdrachten uit. Vitest-tests worden niet uitgevoerd; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Versiebumpen met alleen release-metadata draaien gerichte versie-/config-/root-dependency-checks, met een guard die packagewijzigingen buiten het top-level versieveld weigert.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte checks: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. Wijzigingen in `package.json` worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-surface-bewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unittests van agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure hulpprogrammagebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen runs in changed-modus ook naar expliciete aangrenzende tests in die lichte lanes, zodat helperbewerkingen vermijden dat de volledige zware suite voor die directory opnieuw draait.
    - `auto-reply` heeft speciale buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands-/state-routing-shards, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de batchsweep voor extensies en de release-only `agentic-plugins`-shard over. Full Release Validation dispatcht de aparte `Plugin Prerelease`-child-workflow voor die Plugin-/extensie-zware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Dekking van embedded runner">

    - Wanneer je invoer voor message-tool-discovery of Compaction-runtime
      context wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routerings- en normalisatie-
      grenzen.
    - Houd de integratiesuites van de embedded runner gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped id's en Compaction-gedrag nog steeds
      door de echte `run.ts`- / `compact.ts`-paden lopen; tests met alleen
      helpers zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool en isolatiestandaarden">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-
      standaarden uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compileverloop tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architectuurlanes een diff triggert.
    - De pre-commit-hook doet alleen formattering. Deze staged geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Voer `pnpm check:changed` expliciet uit vóór overdracht of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, config-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routerings-
      gedrag, alleen met een hogere workerlimiet.
    - Automatische schaling van lokale workers is bewust conservatief en schaalt terug
      wanneer de load average van de host al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade doen.
    - De basisconfiguratie van Vitest markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat her-runs in changed-modus correct blijven wanneer test-
      wiring verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie voor directe profilering wilt.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduur-rapportage plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profileringsweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shardtiminggegevens worden geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs voor volledige configuraties gebruiken het configuratiepad als sleutel; CI-
      shards met include-patronen voegen de shardnaam toe, zodat gefilterde shards
      apart kunnen worden gevolgd.
    - Wanneer één hete test nog steeds de meeste tijd besteedt aan opstartimports,
      houd zware dependencies achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtime-helpers diep te importeren alleen
      om ze door `vi.mock(...)` te halen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-project-pad voor die gecommitte diff
      en drukt wall time plus maximale RSS op macOS af.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de lijst met gewijzigde bestanden via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main-thread voor
      Vitest-/Vite-opstart en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unitsuite met bestandsparallelisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Opdracht: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Bereik:
  - Start een echte local loopback Gateway met diagnostiek standaard ingeschakeld
  - Stuurt synthetische gatewayberichten, geheugen- en grote-payload-churn via het diagnostische eventpad
  - Bevraagt `diagnostics.stability` via de Gateway WS RPC
  - Dekt helpers voor persistentie van diagnostische stabiliteitsbundels
  - Verifieert dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Opdracht: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en E2E-tests voor gebundelde plugins onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repository.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om overhead door console-I/O te beperken.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers af te dwingen (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Scope:
  - End-to-endgedrag van multi-instance Gateway
  - WebSocket/HTTP-oppervlakken, Node-koppeling en zwaardere netwerkfunctionaliteit
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E: OpenShell-backend-smoketest

- Opdracht: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-Gateway op de host via Docker
  - Maakt een sandbox aan vanuit een tijdelijk lokaal Dockerfile
  - Test OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH-uitvoering
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-Gateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te verwijzen

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live tests voor gebundelde plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Scope:
  - "Werkt deze provider/dit model _vandaag_ daadwerkelijk met echte referenties?"
  - Vangt wijzigingen in providerformaten, eigenaardigheden bij tool-calling, auth-problemen en gedrag rond rate limits op
- Verwachtingen:
  - Niet ontworpen om CI-stabiel te zijn (echte netwerken, echte providerbeleidsregels, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai bij voorkeur beperkte subsets in plaats van "alles"
- Live-runs laden `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze configuratie-/auth-materiaal naar een tijdelijke test-home zodat unit-fixtures je echte `~/.openclaw` niet kunnen muteren.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live tests je echte homedirectory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-geruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- Rotatie van API-sleutels (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkommaformaat of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limitresponsen.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites geven nu voortgangsregels uit naar stderr zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapturing stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit zodat provider-/Gateway-voortgangsregels onmiddellijk streamen tijdens live-runs.
  - Stem directe-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslistabel:

- Logica/tests bewerken: draai `pnpm test` (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerkfunctionaliteit / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- "mijn bot ligt eruit" debuggen / providerspecifieke fouten / tool-calling: draai een beperkte `pnpm test:live`

## Live (netwerk-aanrakende) tests

Voor de live modelmatrix, CLI-backend-smoketests, ACP-smoketests, Codex app-server
harness en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - plus referentiebeheer voor live-runs - zie
[Live suites testen](/nl/help/testing-live). Voor de specifieke checklist voor updates en
Plugin-validatie, zie
[Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-controles)

Deze Docker-runners zijn opgesplitst in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` draaien alleen hun bijbehorende profiel-sleutel-livebestand binnen de Docker-image van de repository (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en workspace worden gemount (en `~/.profile` wordt geladen als die is gemount). De bijbehorende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker live-runners gebruiken standaard een kleinere smoke-cap zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live Docker-image één keer via `test:docker:live-build`, verpakt OpenClaw één keer als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor functionaliteitslanes van de gebouwde app. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. Het aggregaat gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en laat die dan alleen draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, slaat timings van succesvolle lanes op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes als eerste te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of te draaien, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan te printen voor geselecteerde lanes, package-/imagebehoeften en referenties.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Het lost één kandidaat-package op uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test` en draait daarna de herbruikbare Docker E2E-lanes tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het package-/update-/Plugin-contract, de published-upgrade survivor-matrix, release-standaarden en triage bij fouten.
- Build- en releasecontroles draaien `scripts/check-cli-bootstrap-imports.mjs` na tsdown. De guard loopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` door en faalt als pre-dispatch-opstart package-afhankelijkheden importeert, zoals Commander, prompt-UI, undici of logging vóór command dispatch; deze houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. De packaged CLI-smoketest dekt ook root-help, onboard-help, doctor-help, status, configschema en een model-list-opdracht.
- Legacycompatibiliteit van Package Acceptance is afgetopt op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die cutoff tolereert de harness alleen metadatagaten van verzonden packages: weggelaten private QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin install-record-locaties, ontbrekende persistentie van marketplace install-records en configuratiemetadata-migratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten één of meer echte containers en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is beperkt) en kopiëren die daarna naar de container-home vóór de run, zodat OAuth van externe CLI's tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex-app-server-harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + ontwikkelagent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoke: `pnpm qa:otel:smoke` is een private QA-source-checkout-lane. Deze maakt bewust geen deel uit van package-Docker-release-lanes omdat de npm-tarball QA Lab weglaat.
- Open WebUI-live-smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding/channel/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert één gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Update-channel-switch-smoke: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, wisselt van package `stable` naar git `dev`, verifieert dat het bewaarde kanaal en Plugin-post-update werken, wisselt daarna terug naar package `stable` en controleert de updatestatus.
- Upgrade-survivor-smoke: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vervuilde oude-gebruiker-fixture met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Published-upgrade-survivor-smoke: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruiker-bestanden, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, startup, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregatescheduler om exacte lokale baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de set reported-issues bevat `configured-plugin-installs` voor automatische reparatie van externe OpenClaw-Plugin-installaties. Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, lost meta-baseline-tokens op zoals `last-stable-4` of `all-since-2026.4.23`, en Full Release Validation breidt de release-soak-package-gate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Session-runtime-context-smoke: `pnpm test:docker:session-runtime-context` verifieert verborgen persistentie van runtimecontexttranscripten plus doctor-reparatie van getroffen dubbele prompt-rewrite-branches.
- Bun-globale-installatie-smoke: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert die met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoke: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. Update-smoke gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de invoer `update_baseline_version` van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan zodat root-owned cache-items het installatiegedrag van de lokale gebruiker niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root-/update-/direct-npm-cache te hergebruiken tussen lokale herhalingen.
- Install Smoke CI slaat de dubbele direct-npm-globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- Agents-delete-shared-workspace-CLI-smoke: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus behoud-van-workspace-gedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerking (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoke: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met ruwe CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolesnapshots link-URL's, cursor-gepromoveerde klikbare elementen, iframe-referenties en framemetadata dekken.
- OpenAI Responses web_search-minimal-reasoning-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna dat het providerschema afwijst en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-channel-bridge (geseede Gateway + stdio-bridge + ruwe Claude-notification-frame-smoke): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel-allow/deny-smoke): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-cleanup (echte Gateway + teardown van stdio-MCP-child na geïsoleerde cron- en one-shot-subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update-smoke voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git moving refs, ClawHub kitchen-sink, marketplace-updates en Claude-bundel enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-unchanged-smoke: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecycle-matrix-smoke: `pnpm test:docker:plugin-lifecycle-matrix` installeert de ingepakte OpenClaw-tarball in een kale container, installeert een npm-Plugin, schakelt enable/disable om, upgradet en downgradet die via een lokaal npm-register, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS-/CPU-metrics voor elke lifecycle-fase worden gelogd.
- Config-reload-metadata-smoke: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt install/update-smoke voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git moving refs, ClawHub-fixtures, marketplace-updates en Claude-bundel enable/inspect. `pnpm test:docker:plugin-update` dekt unchanged-update-gedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt npm-Plugin-installatie met resource-tracking, enable, disable, upgrade, downgrade en uninstall bij ontbrekende code.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hebben nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een gedeelde remote image verwijst, pullen de scripts die als deze nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze package-/installatiegedrag valideren in plaats van de gedeelde built-app-runtime.

De live-model Docker-runners koppelen ook de huidige checkout alleen-lezen aan en
stagen die naar een tijdelijke werkmap binnen de container. Dit houdt de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale bron/configuratie
draait.
De stagingstap slaat grote lokale-only caches en app-builduitvoer over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-uitvoermappen, zodat Docker-live-runs geen minuten besteden aan het
kopiëren van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen
echte Telegram/Discord/enz. channel-workers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-livecoverage van die
Docker-lane wilt beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteits-smoke op hoger niveau: het start
een OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten
ingeschakeld, start een gepinde Open WebUI-container tegen die Gateway, meldt
zich aan via Open WebUI, verifieert dat `/api/models` `openclaw/default`
blootstelt, en stuurt vervolgens een echte chatrequest via de
`/api/chat/completions`-proxy van Open WebUI.
De eerste run kan merkbaar langzamer zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-start-setup
moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(standaard `~/.profile`) is de primaire manier om die in gedockeriseerde runs te
leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen echt
Telegram-, Discord- of iMessage-account nodig. Het start een gezaaide Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert daarna gerouteerde conversiedetectie, transcriptlezingen,
bijlagemetadata, gedrag van de live-eventwachtrij, routering van uitgaande
verzendingen, en Claude-achtige channel- en permissiemeldingen via de echte
stdio MCP-brug. De meldingscontrole inspecteert de ruwe stdio MCP-frames direct,
zodat de smoke valideert wat de brug daadwerkelijk emitteert, niet alleen wat
een specifieke client-SDK toevallig blootstelt.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen
live-modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio
MCP-probeserver binnen de container, materialiseert die server via de ingebedde
Pi-bundle MCP-runtime, voert de tool uit, en verifieert daarna dat `coding` en
`messaging` `bundle-mcp`-tools behouden, terwijl `minimal` en `tools.deny:
["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-modelsleutel
nodig. Het start een gezaaide Gateway met een echte stdio MCP-probeserver, voert
een geïsoleerde Cron-turn en een `/subagents spawn` eenmalige child-turn uit, en
verifieert daarna dat het MCP-childproces na elke run afsluit.

Handmatige ACP-thread-smoke in gewone taal (niet CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor validatie van ACP-threadroutering, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` worden gesourced, met tijdelijke configuratie-/werkmapmappen en zonder externe CLI-authmounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-authmappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...`, en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte provider-runs koppelen alleen de benodigde mappen/bestanden die uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` worden afgeleid
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor herhalingen die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke wordt blootgesteld
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-controleprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Documentatie-sanity

Voer documentatiecontroles uit na documentatiebewerkingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook checks op koppen binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway-toolaanroepen (mock-OpenAI, echte Gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft configuratie + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Betrouwbaarheidsevals voor agenten (skills)

We hebben al een paar CI-veilige tests die zich gedragen als "betrouwbaarheidsevals voor agenten":

- Mock-toolaanroepen via de echte Gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en configuratie-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij de vereiste stappen/args?
- **Workflowcontracten:** multi-turnscenario's die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen bevestigen.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolcalls + volgorde, skillbestandlezingen en sessiebedrading te bevestigen.
- Een kleine suite skillgerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (vorm van Plugin en channel)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd channel aan het interfacecontract voldoet. Ze itereren over alle ontdekte plugins en voeren een suite vorm- en gedragsasserties uit. De standaard `pnpm test` unit-lane slaat deze gedeelde seam- en smokebestanden bewust over; voer de contractopdrachten expliciet uit wanneer je gedeelde channel- of provideroppervlakken aanraakt.

### Opdrachten

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basisvorm van Plugin (id, naam, capabilities)
- **setup** - Contract voor setupwizard
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Structuur van berichtpayload
- **inbound** - Afhandeling van binnenkomende berichten
- **actions** - Channel-actionhandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory-/roster-API
- **group-policy** - Afdwinging van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-statusprobes
- **registry** - Vorm van Plugin-register

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract voor auth-flow
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-detectie
- **loader** - Plugin-laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een channel- of providerplugin
- Na het refactoren van Plugin-registratie of -detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-vormtransformatie vast)
- Als het inherent live-only is (rate limits, authbeleid), houd de live-test beperkt en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - bug in provider-requestconversie/-replay → directe modeltest
  - bug in Gateway-sessie-/geschiedenis-/toolpipeline → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled doel per SecretRef-klasse af uit registermetadata (`listSecretTargetRegistryEntries()`), en bevestigt daarna dat traversal-segment exec ids worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op ongeclassificeerde target ids, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
