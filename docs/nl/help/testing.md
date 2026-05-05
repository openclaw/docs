---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-05-05T01:48:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke commando's je uitvoert voor gangbare workflows (lokaal, vóór pushen, debuggen).
- Hoe live-tests inloggegevens vinden en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt afzonderlijk gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario's schrijven.
- [Matrix QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transport-Plugin die door repo-ondersteunde scenario's wordt gebruikt.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runners-sectie hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de bovenstaande referenties.
</Note>

## Snel aan de slag

Meestal:

- Volledige gate (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watchlus: `pnpm test:watch`
- Directe bestandsdoelen routeren nu ook extension-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan één fout itereert.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Live-suite (modellen + Gateway-tool-/imageprobes): `pnpm test:live`
- Richt je stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte `openai/gpt-5.4` agentbeurt of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artifacts. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.4-lane-artifacts naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook cijfers op bronniveau voor Gateway-opstart, geheugen,
  plugin-pressure, herhaalde fake-model hello-loop en CLI-opstart.
- Docker live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model draait nu een tekstbeurt plus een kleine file-read-achtige probe.
    Modellen waarvan de metadata `image`-invoer adverteert, draaien ook een kleine imagebeurt.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, die afzonderlijke Docker live-model
    matrixjobs bevat, geshard per provider.
  - Voor gerichte CI-reruns dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de geplande/release-aanroepers daarvan.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Draait een Docker live-lane tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna dat een gewoon antwoord en een imagebijlage
    via de native Plugin-binding lopen in plaats van ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Draait Gateway-agentbeurten via de Plugin-eigen Codex app-server-harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron MCP, sub-agent en Guardian-probes. Schakel de sub-agentprobe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agentcontrole schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agentprobe, tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in extra veiligheidscontrole voor het message-channel rescue command-oppervlak.
    Deze oefent `/crestodian status`, zet een persistente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes` en verifieert het audit-/config-schrij pad.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Draait Crestodian in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite getypte
    configschrijfactie.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup-/model-/agent-/Discord-Plugin + SecretRef-schrijfacties toe,
    valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setuppad wordt
    ook in QA Lab gedekt door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falende casus nodig hebt, geef dan de voorkeur aan het beperken van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-lab-realiteit nodig hebt:

CI draait QA Lab in specifieke workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. Stabiele/standaard release
checks houden uitputtende live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel dwingt soak af. `QA-Lab - All Lanes`
draait elke nacht op `main` en via handmatige dispatch met de mock parity-lane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord
lane als parallelle jobs. Geplande QA en release checks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix CLI en handmatige workflow-invoer
standaard `all` blijven; handmatige dispatch kan `all` sharden naar `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` draait parity plus de snelle Matrix- en Telegram-lanes vóór releasegoedkeuring,
met `mock-openai/gpt-5.5` voor release-transportchecks zodat ze deterministisch blijven
en normale provider-Plugin-opstart vermijden. Deze live transport-Gateways
schakelen memory search uit; geheugengedrag blijft gedekt door de QA parity-suites.

Full release live-media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dat al
`ffmpeg` en `ffprobe` bevat. Docker live-model-/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-pluginproef uit via QA Lab. Deze
    installeert het externe Kitchen Sink-pakket, verifieert de inventaris van het plugin-SDK-oppervlak,
    test `/healthz` en `/readyz`, registreert Gateway CPU/RSS-
    bewijs, voert een live OpenAI-beurt uit en controleert adversariële diagnostiek.
    Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In gehydrateerde Testbox-
    sessies laadt dit automatisch het Testbox live-auth-profiel wanneer de
    `openclaw-testbox-env`-helper aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de gateway-startupbench uit plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hot-CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metrics worden
    geregistreerd zonder te lijken op de minutenlange gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout
    nog geen verse runtime-uitvoer heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider/model-selectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA live-providerconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Uitvoermappen moeten onder de repo-root blijven zodat de guest via
    de gemounte workspace kan terugschrijven.
  - Schrijft het normale QA-rapport + de samenvatting plus Multipass-logboeken onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorstijl QA-werk.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-sleutel-onboarding uit, configureert standaard
    Telegram, verifieert dat de verpakte plugin-runtime laadt zonder startup-
    dependency-reparatie, voert doctor uit en voert één lokale agentbeurt uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische built-app Docker-smoke uit voor ingesloten runtimecontext-
    transcripts. Deze verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven custom message in plaats van te lekken naar de zichtbare gebruikersbeurt,
    seedt daarna een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` die herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding van het geïnstalleerde pakket uit,
    configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als SUT Gateway.
  - Standaardwaarde is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit de registry
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI/release-automatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host voordat
    Docker-build/install-werk begint. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust pre-credential setup debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor side-run productbewijs
  tegen één kandidaatpakket. Het accepteert een vertrouwde ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of custom-
  laneprofielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow uit te voeren tegen hetzelfde `package-under-test`-artefact.
  - Nieuwste beta-productbewijs:

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
  - Pakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt daarna gebundelde channel/plugins in via config-
    bewerkingen.
  - Verifieert dat setup-discovery ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    plugin expliciet installeert en dat een tweede herstart geen verborgen dependency-
    reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat verouderde plugin-dependency-resten opruimt zonder een
    harness-side postinstall-reparatie.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het aangevraagde baselinepakket, voert daarna
    de geïnstalleerde opdracht `openclaw update` uit in dezelfde guest en verifieert de
    geïnstalleerde versie, updatestatus, gateway-gereedheid en één lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    itereren op één guest. Gebruik `--json` voor het pad van het samenvattingsartefact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agentbeurtbewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-time-out zodat Parallels-transportstalls niet
    de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logboeken onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper hangt.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor- en package-
    updatewerk op een koude guest; dat is nog steeds gezond wanneer het geneste npm-
    debuglogboek vordert.
  - Voer deze aggregaatwrapper niet parallel uit met individuele Parallels-
    smoke-lanes voor macOS, Windows of Linux. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, package serving of gatewaystatus van de guest.
  - Het post-updatebewijs voert het normale gebundelde plugin-oppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip
    worden geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt zelf
    alleen een eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel/scenariocatalogus, env vars en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groep-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Vereist twee afzonderlijke bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam heeft.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artefact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het geobserveerde SUT-antwoord.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een Convex-ondersteunde pool, heartbeats
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van referentierol:
  - CLI: `--credential-role maintainer|ci`
  - Env-standaard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback `http://` Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Adminopdrachten voor maintainers (pool add/remove/list) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-runs om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en bereikbaarheid van admin/list te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-hulpprogramma's.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Aanvraag: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succes: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succes: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainergeheim)
  - Aanvraag: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Aanvraag: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Actieve leasebewaking: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Aanvraag: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert onjuist gevormde payloads.

### Een kanaal toevoegen aan QA

De architectuur en namen van scenario-helpers voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab` host-seam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat draait waar)

Zie de suites als “toenemend realisme” (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de `vitest.full-*.config.ts` shardset en kunnen multi-projectshards uitbreiden naar per-projectconfiguraties voor parallelle planning
- Bestanden: core/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Bereik:
  - Zuivere unittests
  - In-process integratietests (Gateway-authenticatie, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte bron-API's van gebundelde Plugins. Echte Plugin-API-loads horen thuis in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Niet-gerichte `pnpm test` draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-projectproces. Dit verlaagt piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root `vitest.config.ts` projectgraaf, omdat een watchloop met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het rootproject vermijdt.
    - `pnpm test:changed` breidt gewijzigde gitpaden standaard uit naar goedkope scoped lanes: directe testbewerkingen, sibling `*.test.ts`-bestanden, expliciete bronmappings en lokale importgraafafhankelijken. Configuratie-/setup-/packagebewerkingen voeren geen brede testrun uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Het classificeert de diff in core, coretests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de bijbehorende typecheck-, lint- en guard-opdrachten uit. Het draait geen Vitest-tests; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Alleen-releasemetadata-versiebumpen draaien gerichte versie-/configuratie-/rootdependencychecks, met een guard die packagewijzigingen buiten het top-level versieveld afwijst.
    - Live Docker ACP-harnessbewerkingen draaien gerichte checks: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-surfacebewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unittests uit agents, opdrachten, Plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare zuivere hulpprogrammagebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen changed-mode-runs ook naar expliciete siblingtests in die lichte lanes, zodat helperbewerkingen de volledige zware suite voor die directory niet opnieuw hoeven te draaien.
    - `auto-reply` heeft toegewezen buckets voor top-level corehelpers, top-level `reply.*` integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één importzware bucket niet de volledige Node-tail bezit.
    - Normale PR/main-CI slaat bewust de extensie-batchsweep en de alleen-voor-release `agentic-plugins`-shard over. Full Release Validation dispatcht de aparte `Plugin Prerelease` child-workflow voor die Plugin-/extensie-zware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Wanneer je invoer voor message-tool-discovery of Compaction-runtimecontext wijzigt,
      behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor zuivere routerings- en normalisatiegrenzen.
    - Houd de embedded-runner-integratiesuites gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en Compaction-gedrag nog steeds door
      de echte `run.ts` / `compact.ts`-paden stromen; alleen-helpertests zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - De basis-Vitest-configuratie gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner in de rootprojecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`
      defaults uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commit hook doet alleen formatting. Hij staged geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai expliciet `pnpm check:changed` vóór overdracht of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, configuratie-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routeringsgedrag,
      alleen met een hogere workerlimiet.
    - Lokale worker-autoscaling is bewust conservatief en schaalt terug
      wanneer de gemiddelde hostbelasting al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade doen.
    - De basis-Vitest-configuratie markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat changed-mode-reruns correct blijven wanneer test-
      wiring verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timinggegevens worden geschreven naar `.artifacts/vitest-shard-timings.json`.
      Hele-configuratieruns gebruiken het configuratiepad als sleutel; include-pattern CI-
      shards voegen de shardnaam toe zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hete test nog steeds het grootste deel van zijn tijd besteedt aan opstartimports,
      houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze door te geven aan `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en drukt walltime plus macOS max RSS af.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de lijst met gewijzigde bestanden via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread CPU-profiel voor
      Vitest-/Vite-opstart en transformoverhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Opdracht: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Bereik:
  - Start standaard een echte loopback-Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische gatewayberichten, geheugen- en large-payload-churn door het diagnostische eventpad
  - Bevraagt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistentiehelpers voor de diagnostische stabiliteitsbundel
  - Controleert dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en queue-dieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Opdracht: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde Plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, gelijk aan de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om overhead door console-I/O te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers af te dwingen (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van Gateway met meerdere instanties
  - WebSocket/HTTP-oppervlakken, Node-koppeling en zwaardere netwerking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E: rooktest voor OpenShell-backend

- Opdracht: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-Gateway op de host via Docker
  - Maakt een sandbox aan vanuit een tijdelijk lokaal Dockerfile
  - Oefent de OpenShell-backend van OpenClaw via echte `sandbox ssh-config` + SSH-uitvoering
  - Controleert remote-canonical bestandssysteemgedrag via de sandbox-fs-brug
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaardrun `pnpm test:e2e`
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-Gateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer de bredere e2e-suite handmatig wordt uitgevoerd
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en gebundelde Plugin-live-tests onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Scope:
  - “Werkt deze provider/dit model _vandaag_ echt met echte referenties?”
  - Vangt wijzigingen in providerindelingen, eigenaardigheden bij tool-calling, auth-problemen en rate-limit-gedrag op
- Verwachtingen:
  - Ontworpen om niet CI-stabiel te zijn (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Geef de voorkeur aan het uitvoeren van vernauwde subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te pakken.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze configuratie-/auth-materiaal naar een tijdelijke test-home, zodat unitfixtures je echte `~/.openclaw` niet kunnen muteren.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je live-tests bewust je echte homedirectory moeten gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-geklets. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (provider-specifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of een per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responses.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites geven nu voortgangsregels uit naar stderr, zodat lange provider-aanroepen zichtbaar actief zijn, ook wanneer Vitest-consolecapturing stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels tijdens live-runs onmiddellijk streamen.
  - Stel direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stel Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerking / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- “mijn bot ligt eruit” / provider-specifieke fouten / tool-calling debuggen: voer een vernauwde `pnpm test:live` uit

## Live-tests (met netwerkcontact)

Voor de live-modelmatrix, CLI-backend-rooktests, ACP-rooktests, Codex app-server
harness en alle live-tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus referentieafhandeling voor live-runs — zie
[Live-suites testen](/nl/help/testing-live). Voor de specifieke update- en
Plugin-validatiechecklist, zie
[Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele controles "werkt in Linux")

Deze Docker-runners zijn verdeeld in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende profile-key live-bestand uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en workspace worden gemount (en `~/.profile` wordt gesourcet als die is gemount). De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere rooktestlimiet, zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live-Docker-image eenmaal via `test:docker:live-build`, verpakt OpenClaw eenmaal als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor built-app functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. Het aggregaat gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` regelt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en laat die dan alleen draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer speelruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw-E2E-containers, print elke 30 seconden status, slaat succesvolle lanetimings op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan te printen voor geselecteerde lanes, package-/imagebehoeften en referenties.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Deze lost één kandidaatpackage op vanuit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt die als `package-under-test` en voert daarna de herbruikbare Docker-E2E-lanes uit tegen precies die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het package-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, release-standaarden en foutentriage.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als opstartimports vóór commandodispatch package-afhankelijkheden importeren zoals Commander, prompt-UI, undici of logging; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. De verpakte CLI-rooktest dekt ook root-help, onboard-help, doctor-help, status, config-schema en een model-list-commando.
- Legacy-compatibiliteit van Package Acceptance is afgetopt op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die cutoff tolereert de harness alleen metadatahiaten van verzonden packages: weggelaten private QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin-install-record-locaties, ontbrekende persistentie van marketplace-install-records en config-metadatamigratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte fouten.
- Container-rooktestrunners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten één of meer echte containers en controleren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is vernauwd) en kopiëren die daarna vóór de run naar de container-home, zodat externe-CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte dekking voor Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harnas-smoketest: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-source-checkout-lane. Deze maakt bewust geen deel uit van de package-Docker-release-lanes, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-smoketest voor onboarding/kanaal/agent: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via onboarding met env-ref plus standaard Telegram, voert doctor uit en voert een gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoketest voor wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, wisselt van package `stable` naar git `dev`, verifieert dat het bewaarde kanaal en de plugin na de update werken, wisselt daarna terug naar package `stable` en controleert de updatestatus.
- Upgrade-overlevingssmoketest: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vervuilde oude-gebruikersfixture met agents, kanaalconfiguratie, plugin-toestaanlijsten, verouderde plugin-dependencystatus en bestaande workspace-/sessiebestanden. Deze voert package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van config/status plus startup-/statusbudgetten.
- Gepubliceerde upgrade-overlevingssmoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikersbestanden, configureert die baseline met een ingebakken opdrachtrecept, valideert de resulterende config, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, behoud van state, startup, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregatiescheduler exacte baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `all-since-2026.4.23`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de reported-issues-set bevat `configured-plugin-installs` voor automatisch herstel van externe OpenClaw-plugin-installaties. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`; Full Release Validation gebruikt de standaard latest-baseline in het blokkerende pad en breidt alleen uit naar all-since/reported-issues voor `run_release_soak=true` of `release_profile=full`.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert persistentie van verborgen runtimecontexttranscript plus doctor-herstel van getroffen gedupliceerde prompt-rewrite-branches.
- Bun globale-installatiesmoketest: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige tree, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-input van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan, zodat root-eigendom cache-items lokaal gebruikersinstallatiegedrag niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache te hergebruiken bij lokale herhalingen.
- Install Smoke CI slaat de dubbele directe npm-globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer directe `npm install -g`-dekking nodig is.
- Agents delete shared workspace CLI-smoketest: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus behoud van workspace-gedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, door cursor gepromote clickables, iframe-refs en frame-metadata dekken.
- OpenAI Responses web_search minimal reasoning-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server uit via Gateway, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna afwijzing door het providerschema en controleert dat de ruwe details in Gateway-logs verschijnen.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel-allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-cleanup (echte Gateway + afbraak van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/updatesmoketest voor lokaal pad, `file:`, npm-registry met gehoste dependencies, git-bewegende refs, ClawHub-kitchen-sink, marketplace-updates en Claude-bundel-enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecyclematrix-smoketest: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt enable/disable om, upgradet en downgradet deze via een lokale npm-registry, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde state verwijdert terwijl RSS-/CPU-metrics voor elke lifecyclefase worden gelogd.
- Config-reload-metadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/updatesmoketests voor lokaal pad, `file:`, npm-registry met gehoste dependencies, git-bewegende refs, ClawHub-fixtures, marketplace-updates en Claude-bundel-enable/inspect. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt met resources bijgehouden npm-plugin-installatie, enable, disable, upgrade, downgrade en missing-code-uninstall.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` winnen nog steeds wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image verwijst, trekken de scripts deze binnen als hij nog niet lokaal aanwezig is. De QR- en installer-Docker-tests houden hun eigen Dockerfiles omdat ze package-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model Docker-runners koppelen de huidige checkout ook alleen-lezen aan en
stagen deze naar een tijdelijke werkmap in de container. Hierdoor blijft de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale broncode/configuratie draait.
De staging-stap slaat grote lokale caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` en app-lokale `.build`- of
Gradle-outputmappen, zodat Docker-live-runs geen minuten besteden aan het kopiëren
van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen
echte Telegram/Discord/etc.-kanaalworkers in de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-live-dekking in die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een compatibility smoke op hoger niveau: het start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` blootstelt en stuurt daarna een
echt chatverzoek via de `/api/chat/completions`-proxy van Open WebUI.
De eerste run kan merkbaar langzamer zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startconfiguratie moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in Dockerized runs aan te leveren.
Succesvolle runs drukken een kleine JSON-payload af, zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt en
verifieert daarna gerouteerde gespreksdetectie, transcriptlezingen, bijlagemetadata,
live-eventqueuegedrag, uitgaande verzendroutering en Claude-stijl kanaal- en
machtigingsmeldingen over de echte stdio MCP-bridge. De meldingscontrole
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk uitzendt, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
in de container, materialiseert die server via de embedded Pi bundle
MCP-runtime, voert de tool uit en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-model
sleutel nodig. Het start een geseede Gateway met een echte stdio MCP-probeserver, draait een
geïsoleerde Cron-turn en een `/subagents spawn` one-shot child-turn, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP plain-language thread-smoke (niet CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor validatie van ACP-threadroutering, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspacemappen en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties in Docker
- Externe CLI-authmappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Vernauwde provider-runs koppelen alleen de benodigde mappen/bestanden die uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` worden afgeleid
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat de Gateway voor de Open WebUI-smoke blootstelt
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-image-tag te overschrijven

## Docs-sanity

Draai docs-controles na docs-bewerkingen: `pnpm check:docs`.
Draai volledige Mintlify-ankervalidatie wanneer je ook in-page heading-controles nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn “echte pipeline”-regressies zonder echte providers:

- Gateway-toolcalling (mock OpenAI, echte Gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevals (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als “agent-betrouwbaarheidsevals”:

- Mock-toolcalling via de echte Gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en config-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij vereiste stappen/args?
- **Workflowcontracten:** multi-turn scenario’s die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen assert-en.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolcalls + volgorde, skillbestandslezingen en sessiebedrading te assert-en.
- Een kleine suite met skillgerichte scenario’s (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en kanaalvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk kanaal aan zijn
interfacecontract voldoet. Ze itereren over alle ontdekte Plugins en draaien een suite met
vorm- en gedragsasserties. De standaard `pnpm test` unit-lane slaat deze gedeelde
seam- en smokebestanden bewust over; draai de contractcommando’s expliciet
wanneer je gedeelde kanaal- of provideroppervlakken aanraakt.

### Commando’s

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Gevestigd in `src/channels/plugins/contracts/*.contract.test.ts`:

- **Plugin** - Basisvorm van de Plugin (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Structuur van berichtpayload
- **inbound** - Verwerking van inkomende berichten
- **actions** - Kanaalactiehandlers
- **threading** - Thread-ID-afhandeling
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Gevestigd in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Vorm van Plugin-register

### Providercontracten

Gevestigd in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/-selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-detectie
- **loader** - Plugin-laden
- **runtime** - Providerruntime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer draaien

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een kanaal of provider-Plugin
- Na het refactoren van Plugin-registratie of detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent alleen live is (ratelimits, authbeleid), houd de live-test dan smal en opt-in via env-vars
- Richt bij voorkeur op de kleinste laag die de bug vangt:
  - provider-requestconversie-/replaybug → directe modeltest
  - gateway-sessie-/history-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled target per SecretRef-klasse af uit registermetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat exec-id’s met traversal-segmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target-id’s, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
