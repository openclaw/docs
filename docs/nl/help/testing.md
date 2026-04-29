---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Debuggen van Gateway- en agentgedrag
summary: 'Testkit: unit-, e2e- en live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-04-29T22:51:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een handleiding voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, vóór pushen, debugging).
- Hoe live tests inloggegevens vinden en modellen/providers selecteren.
- Hoe je regressies toevoegt voor model-/providerproblemen uit de praktijk.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt afzonderlijk gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runnersectie hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel starten

Meestal:

- Volledige gate (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watch-loop: `pnpm test:watch`
- Directe bestandstargeting routeert nu ook extension-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één failure werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra zekerheid wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Live suite (modellen + Gateway-tool-/image-probes): `pnpm test:live`
- Richt stil op één live bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model-sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt plus een kleine file-read-achtige probe uit.
    Modellen waarvan de metadata `image`-input adverteert, voeren ook een kleine image-beurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je provider-failures isoleert.
  - CI-dekking: de dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, wat afzonderlijke Docker live model
    matrixjobs omvat, geshard per provider.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe provider-secrets met hoge signaalwaarde toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna dat een gewone reactie en een image-bijlage
    via de native Plugin-binding lopen in plaats van ACP.
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de Plugin-eigen Codex app-server-harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-failures isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in extra controle voor de message-channel rescue command
    surface. Deze oefent `/crestodian status`, zet een persistente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes` en verifieert het audit-/config-write-pad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een nep-Claude-CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite typed
    config write.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup/model/agent/Discord Plugin + SecretRef-writes toe,
    valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setuppad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falende case nodig hebt, geef dan de voorkeur aan het beperken van live tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI voert QA Lab uit in dedicated workflows. `Parity gate` draait op matchende PR's en
via handmatige dispatch met mockproviders. `QA-Lab - All Lanes` draait elke nacht op
`main` en via handmatige dispatch met de mock parity gate, live Matrix-lane,
Convex-beheerde live Telegram-lane en Convex-beheerde live Discord-lane als
parallelle jobs. Geplande QA- en releasechecks geven Matrix `--profile fast`
expliciet mee, terwijl de standaardwaarde van de Matrix-CLI en handmatige workflowinput
`all` blijft; handmatige dispatch kan `all` sharden naar `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release Checks` draait parity plus
de snelle Matrix- en Telegram-lanes vóór releasegoedkeuring, met
`mock-openai/gpt-5.5` voor release-transportchecks zodat ze deterministisch blijven
en normale provider-Plugin-startup vermijden. Deze live transport-Gateways schakelen
memory search uit; memory-gedrag blijft gedekt door de QA parity-suites.

Volledige release live media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, waarin
`ffmpeg` en `ffprobe` al aanwezig zijn. Docker live model/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert meerdere geselecteerde scenario's standaard parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    geselecteerde aantal scenario's). Gebruik `--concurrency <count>` om het aantal workers
    af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Stopt met non-zero wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenario-bewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-startup-bench plus een klein mock QA Lab-scenariopakket uit
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hot-CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte startup-bursts als metrics worden vastgelegd
    zonder eruit te zien als de minutenlange gateway peg-regressie.
  - Gebruikt gebouwde `dist`-artifacts; voer eerst een build uit wanneer de checkout nog geen
    verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Houdt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectieflags als `qa suite`.
  - Live runs forwarden de ondersteunde QA-auth-inputs die praktisch zijn voor de guest:
    env-gebaseerde providersleutels, het QA live provider-configpad en `CODEX_HOME`
    wanneer aanwezig.
  - Outputdirs moeten onder de repo-root blijven zodat de guest via
    de gemounte workspace terug kan schrijven.
  - Schrijft het normale QA-rapport + samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operator-achtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-key-onboarding uit, configureert standaard Telegram,
    verifieert dat het inschakelen van de Plugin runtime-dependencies on demand installeert,
    voert doctor uit en voert één lokale agentbeurt uit tegen een gemockt OpenAI-
    endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install
    lane met Discord te draaien.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische built-app Docker-smoke uit voor embedded runtime context-
    transcripts. Deze verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven custom message in plaats van te lekken in de zichtbare gebruikersbeurt,
    seedt daarna een affected broken session JSONL en verifieert dat
    `openclaw doctor --fix` deze herschrijft naar de actieve branch met een backup.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-packagecandidate in Docker, voert installed-package-
    onboarding uit, configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram-QA-lane met dat geïnstalleerde package als de SUT Gateway.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installeren uit de registry een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-inloggegevens of Convex-credentialbron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en de rol-secret. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex role secret in CI aanwezig zijn,
    selecteert de Docker-wrapper automatisch Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-environment en Convex CI-credentialleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productproof als side-run
  tegen één candidate package. Deze accepteert een vertrouwde ref, gepubliceerde npm spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artifact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of custom
  lane-profielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram-QA-workflow tegen hetzelfde `package-under-test`-artifact te draaien.
  - Nieuwste beta-productproof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exacte tarball-URL-proof vereist een digest:

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

- `pnpm test:docker:bundled-channel-deps`
  - Pakt de huidige OpenClaw-build in en installeert deze in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt daarna gebundelde kanaal-/Plugins in via config-
    bewerkingen.
  - Verifieert dat setupdetectie ongeconfigureerde runtime-afhankelijkheden van Plugins
    afwezig laat, dat de eerste geconfigureerde Gateway- of doctor-run de runtime-
    afhankelijkheden van elke gebundelde Plugin op aanvraag installeert, en dat een tweede herstart
    afhankelijkheden die al waren geactiveerd niet opnieuw installeert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de post-update
    doctor van de kandidaat gebundelde runtime-afhankelijkheden van kanalen repareert zonder
    postinstall-reparatie aan de harness-kant.
- `pnpm test:parallels:npm-update`
  - Voert de native update-smoke voor packaged install uit op Parallels-gasten. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna
    de geïnstalleerde opdracht `openclaw update` uit in dezelfde gast en verifieert de
    geïnstalleerde versie, updatestatus, gereedheid van de Gateway en één lokale agent-
    beurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één gast. Gebruik `--json` voor het pad van het samenvattingsartifact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het bewijs met een live
    agentbeurt. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-timeout, zodat vastgelopen Parallels-transport
    niet de rest van het testvenster kan verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastloopt.
  - Windows-update kan op een koude gast 10 tot 15 minuten besteden aan post-update doctor-/
    runtime-afhankelijkheidsreparatie; dat is nog steeds gezond wanneer het geneste
    npm-debuglog vooruitgaat.
  - Voer deze aggregate wrapper niet parallel uit met afzonderlijke Parallels-
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen op
    snapshotherstel, pakketservering of Gateway-status van de gast.
  - Het post-updatebewijs voert het normale gebundelde Plugin-oppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en media-
    begrip worden geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt
    zelf alleen een eenvoudige tekstantwoordcontrole uitvoert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-provider-server voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een disposable Tuwunel-homeserver met Docker-backend. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder falende exitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam blootlegt.
  - Schakel voor stabiele bot-naar-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en artifact met waargenomen berichten onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het waargenomen SUT-antwoord.

Live transport-lanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een pool met Convex-backend, verstuurt Heartbeats
voor die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentieprojectscaffold voor Convex:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén secret voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van referentierol:
  - CLI: `--credential-role maintainer|ci`
  - Standaard env: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env-vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback-`http://`-Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` hoort bij normaal gebruik `https://` te gebruiken.

Beheeropdrachten voor maintainers (pool add/remove/list) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live runs om de Convex-site-URL, broker-secrets,
endpointprefix, HTTP-timeout en admin/list-bereikbaarheid te controleren zonder
secretwaarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

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
  - Actieve lease-guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainer-secret)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert verkeerd gevormde payloads.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab`-host-seam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat draait waar)

Zie de suites als “toenemende realiteitsgraad” (en toenemende flakiness/kosten):

### Unit / integration (standaard)

- Opdracht: `pnpm test`
- Config: niet-getargete runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-project-shards uitbreiden naar per-project-configs voor parallelle planning
- Bestanden: core-/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Scope:
  - Pure unittests
  - In-process integration-tests (Gateway-auth, routering, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte keys vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed `api.js`- en
    `runtime-api.js`-fallbackgedrag bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-loads horen thuis in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test`-runs voeren twaalf kleinere shard-configuraties uit (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één gigantisch native root-projectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-projectgrafiek `vitest.config.ts`, omdat een watch-loop met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via gescopete lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het root-project vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope gescopete lanes: directe testbewerkingen, aangrenzende `*.test.ts`-bestanden, expliciete bronmappings en lokale afhankelijken in de importgrafiek. Config-/setup-/package-bewerkingen voeren tests niet breed uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de bijpassende typecheck-, lint- en guard-commando's uit. Vitest-tests worden niet uitgevoerd; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Versiebumpen met alleen releasemetadata voeren gerichte versie-/config-/root-afhankelijkheidschecks uit, met een guard die package-wijzigingen buiten het top-level versieveld afwijst.
    - Bewerkingen aan de live Docker ACP-harness voeren gerichte checks uit: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-oppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Import-lichte unittests uit agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde helperbronbestanden voor `plugin-sdk` en `commands` mappen changed-mode-runs ook naar expliciete aangrenzende tests in die lichte lanes, zodat helperbewerkingen vermijden dat de volledige zware suite voor die directory opnieuw draait.
    - `auto-reply` heeft aparte buckets voor top-level core-helpers, top-level `reply.*`-integratietests en de subtree `src/auto-reply/reply/**`. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één import-zware bucket niet de volledige Node-staart bezit.
    - Normale PR/main-CI slaat bewust de extensiebatch-sweep en de release-only `agentic-plugins`-shard over. Volledige Release Validation dispatcht de aparte child-workflow `Plugin Prerelease` voor die plugin-/extensie-zware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Wanneer je inputs voor message-tool discovery of Compaction-runtimecontext wijzigt, behoud beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de embedded runner-integratiesuites gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat gescopete ids en Compaction-gedrag nog steeds
      via de echte `run.ts`- / `compact.ts`-paden stromen; tests met alleen helpers zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde standaardwaarden `threads` + `isolate: false`
      van de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compile-churn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commit-hook doet alleen formattering. Deze staged geformatteerde bestanden opnieuw en
      voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór handoff of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope gescopete lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, config-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag,
      alleen met een hogere workerlimiet.
    - Automatisch schalen van lokale workers is bewust conservatief en schaalt terug
      wanneer de gemiddelde hostbelasting al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade aanrichten.
    - De basisconfiguratie van Vitest markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat reruns in changed-mode correct blijven wanneer test-
      wiring wijzigt.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie voor directe profiling wilt.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus
      import-breakdown-output in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs voor de volledige configuratie gebruiken het configuratiepad als sleutel; CI-shards met include-pattern
      voegen de shardnaam toe, zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hete test nog steeds het grootste deel van zijn tijd besteedt aan opstartimports,
      houd zware dependencies achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtime-helpers diep te importeren alleen
      om ze door te geven aan `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en print wall time plus maximale macOS-RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de lijst met gewijzigde bestanden via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main-thread voor
      Vitest-/Vite-opstart- en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte loopback-Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische gateway-berichten, memory- en large-payload-churn door het diagnostische eventpad
  - Queryt `diagnostics.stability` via de Gateway WS RPC
  - Dekt helpers voor persistentie van de diagnostische stabiliteitsbundel
  - Bevestigt dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en E2E-tests van gebundelde plugins onder `extensions/`
- Runtime-standaardwaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (begrensd op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-output opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van de Gateway met meerdere instanties
  - WebSocket-/HTTP-oppervlakken, node-pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan trager zijn)

### E2E: OpenShell-backend smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-Gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent de OpenShell-backend van OpenClaw uit via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-Gateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Commando: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live-tests van gebundelde plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (zet `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - “Werkt deze provider/dit model _vandaag_ daadwerkelijk met echte credentials?”
  - Vangt providerformatwijzigingen, eigenaardigheden bij tool-calling, auth-problemen en rate-limitgedrag
- Verwachtingen:
  - Niet ontworpen om CI-stabiel te zijn (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai liever afgebakende subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze config-/auth-materiaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen muteren.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsoutput, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-geklets. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responses.
- Voortgangs-/Heartbeat-output:
  - Live-suites sturen nu voortgangsregels naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels onmiddellijk streamen tijdens live-runs.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppelen aanraken: voeg `pnpm test:e2e` toe
- “my bot is down” debuggen / provider-specifieke fouten / toolaanroepen: voer een ingeperkte `pnpm test:live` uit

## Live-tests (met netwerktoegang)

Voor de live modelmatrix, CLI-backend-smoketests, ACP-smoketests, de Codex app-server
harness en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus credentialafhandeling voor live runs — zie
[Testen — live-suites](/nl/help/testing-live).

## Docker-runners (optionele controles voor "werkt in Linux")

Deze Docker-runners zijn verdeeld in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende live bestand met profielsleutel uit binnen de Docker-image van de repo (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en werkruimte worden gemount (en `~/.profile` wordt gesourced als die is gemount). De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smokelimiet zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live Docker-image eenmalig via `test:docker:live-build`, verpakt OpenClaw eenmalig als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor lanes met functionaliteit van de gebouwde app. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregaatrunner gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en die daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer speelruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, drukt elke 30 seconden status af, slaat timings van succesvolle lanes op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om langere lanes bij latere runs eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest af te drukken zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan af te drukken voor geselecteerde lanes, package-/imagebehoeften en credentials.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Deze resolveert een kandidaatpackage uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt deze als `package-under-test` en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. `workflow_ref` selecteert de vertrouwde workflow-/harness-scripts, terwijl `package_ref` de source-commit/branch/tag selecteert die moet worden verpakt wanneer `source=ref`; hierdoor kan huidige acceptatielogica oudere vertrouwde commits valideren. Profielen zijn geordend op breedte: `smoke` is snelle installatie/channel/agent plus Gateway/config, `package` is het package/update/plugin-contract en de standaard native vervanging voor de meeste Parallels-package/update-dekking, `product` voegt MCP-channels, Cron/subagent-opschoning, OpenAI-webzoekfunctie en OpenWebUI toe, en `full` voert de Docker-chunks van het releasepad uit met OpenWebUI. Releasevalidatie voert een aangepaste packagedelta (`bundled-channel-deps-compat plugins-offline`) plus Telegram-package-QA uit, omdat de Docker-chunks van het releasepad de overlappende package/update/plugin-lanes al dekken. Gerichte GitHub-Docker-heruitvoercommando's die uit artifacts worden gegenereerd bevatten eerdere package-artifact- en voorbereide image-inputs wanneer beschikbaar, zodat mislukte lanes kunnen vermijden dat het package en de images opnieuw worden gebouwd.
- Build- en releasecontroles voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch startup packagedependencies zoals Commander, prompt-UI, undici of logging importeert vóór commandodispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. Packaged CLI-smoke dekt ook root-help, onboard-help, doctor-help, status, config schema en een model-list-commando.
- Legacy compatibiliteit van Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die cutoff tolereert de harness alleen metadatahiaten van geleverde packages: weggelaten private QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy plugin-install-record-locaties, ontbrekende marketplace-install-record-persistentie en configmetadatamigratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` en `test:docker:config-reload` starten een of meer echte containers op en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is ingeperkt), en kopiëren die daarna naar de container-home vóór de run zodat external-CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoketest voor het Codex app-server-testharnas: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + ontwikkelagent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-source-checkout-lane. Deze maakt bewust geen deel uit van Docker-release-lanes voor pakketten omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-smoketest voor onboarding/kanaal/agent: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, verifieert dat doctor geactiveerde runtime-afhankelijkheden van plugins heeft gerepareerd, en voert één gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoketest voor wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, wisselt van pakket `stable` naar git `dev`, verifieert het opgeslagen kanaal en de werking van plugins na de update, wisselt daarna terug naar pakket `stable` en controleert de updatestatus.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert persistente transcriptopslag van verborgen runtimecontext plus doctor-reparatie van getroffen gedupliceerde prompt-herschrijftakken.
- Bun-smoketest voor globale installatie: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert deze met `bun install -g` in een geïsoleerde home, en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-smoketest voor installer: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache over de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat wordt geüpgraded naar de kandidaat-tarball. Overschrijf dit lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of op GitHub met de `update_baseline_version`-invoer van de Install Smoke-workflow. Niet-root installercontroles houden een geïsoleerde npm-cache aan, zodat cachevermeldingen van root geen lokaal installatiegedrag van de gebruiker verhullen. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache bij lokale herhalingen te hergebruiken.
- Install Smoke CI slaat de gedupliceerde directe npm-globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die env uit wanneer dekking voor directe `npm install -g` nodig is.
- Smoketest voor agents die gedeelde werkruimte verwijderen via CLI: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één werkruimte in een geïsoleerde container-home, voert `agents delete --json` uit, en verifieert geldige JSON plus behoud van werkruimtegedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met ruwe CDP, voert `browser doctor --deep` uit, en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromoveerde klikbare elementen, iframe-referenties en framemetadata dekken.
- Regressie voor minimale reasoning van OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server uit via Gateway, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de provider-schema-afwijzing en controleert dat de ruwe details in Gateway-logboeken verschijnen.
- MCP-kanaalbrug (geseed Gateway + stdio-brug + ruwe smoketest voor Claude-notificatieframes): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingesloten Pi-profiel-smoketest voor toestaan/weigeren): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-opruiming (echte Gateway + teardown van stdio-MCP-child na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatiesmoketest, ClawHub kitchen-sink-installatie/de-installatie, marketplace-updates, en Claude-bundel inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Smoketest voor ongewijzigde plugin-update: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoketest voor metadata bij config-herladen: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-afhankelijkheden van gebundelde plugins: `pnpm test:docker:bundled-channel-deps` bouwt standaard een kleine Docker-runner-image, bouwt en pakt OpenClaw één keer in op de host, en mount die tarball daarna in elk Linux-installatiescenario. Hergebruik de image met `OPENCLAW_SKIP_DOCKER_BUILD=1`, sla de host-rebuild over na een verse lokale build met `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, of verwijs naar een bestaande tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. De volledige Docker-aggregate en bundled-channel-chunks van het releasepad pakken deze tarball één keer vooraf in, en sharden daarna gebundelde kanaalcontroles naar onafhankelijke lanes, inclusief aparte update-lanes voor Telegram, Discord, Slack, Feishu, memory-lancedb en ACPX. Releasechunks splitsen kanaalsmoketests, updatedoelen en setup/runtime-contracten op in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` en `bundled-channels-contracts`; de aggregate chunk `bundled-channels` blijft beschikbaar voor handmatige herhalingen. De releaseworkflow splitst ook provider-installerchunks en installatie-/de-installatiechunks voor gebundelde plugins; legacy chunks `package-update`, `plugins-runtime` en `plugins-integrations` blijven aggregate aliassen voor handmatige herhalingen. Gebruik `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` om de kanaalmatrix te versmallen wanneer de gebundelde lane direct wordt uitgevoerd, of `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` om het updatescenario te versmallen. Docker-runs per scenario gebruiken standaard `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; het updatescenario met meerdere doelen gebruikt standaard `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. De lane verifieert ook dat `channels.<id>.enabled=false` en `plugins.entries.<id>.enabled=false` doctor-/runtime-afhankelijkheidsreparatie onderdrukken.
- Versmal runtime-afhankelijkheden van gebundelde plugins tijdens iteratie door niet-gerelateerde scenario's uit te schakelen, bijvoorbeeld:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` winnen nog steeds wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image verwijst, trekken de scripts deze binnen als deze nog niet lokaal aanwezig is. De QR- en installer-Docker-tests houden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde runtime van de gebouwde app.

De Docker-runners voor live modellen binden ook de huidige checkout read-only en
stagen deze in een tijdelijke werkdir binnen de container. Dit houdt de runtime-
image slank terwijl Vitest nog steeds tegen je exacte lokale source/config wordt
uitgevoerd. De stagingstap slaat grote lokale-only caches en app-buildoutputs over,
zoals `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` en app-lokale `.build`-
of Gradle-outputdirectories, zodat Docker-live-runs geen minuten besteden aan het
kopiëren van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen echte
Telegram/Discord/etc.-kanaalworkers binnen de container starten.
`test:docker:live-models` voert nog steeds `pnpm test:live` uit, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-live-dekking vanuit die
Docker-lane moet versmallen of uitsluiten.
`test:docker:openwebui` is een compatibiliteitssmoketest op hoger niveau: deze start
een OpenClaw Gateway-container met de OpenAI-compatibele HTTP-endpoints ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` aanbiedt, en verzendt
daarna een echt chatverzoek via de `/api/chat/completions`-proxy van Open WebUI.
De eerste run kan merkbaar langzamer zijn omdat Docker mogelijk de Open WebUI-image
moet ophalen en Open WebUI mogelijk zijn eigen cold-start-setup moet afronden.
Deze lane verwacht een bruikbare sleutel voor een live model, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om deze in Docker-runs aan te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen echt
Telegram-, Discord- of iMessage-account nodig. Deze start een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en verifieert
daarna routed gesprekdetectie, transcriptlezingen, attachmentmetadata,
live-eventqueuegedrag, routering van uitgaande verzendingen, en kanaal- +
machtigingsnotificaties in Claude-stijl over de echte stdio-MCP-brug. De
notificatiecontrole inspecteert de ruwe stdio-MCP-frames direct, zodat de smoketest
valideert wat de brug daadwerkelijk emitteert, niet alleen wat een specifieke
client-SDK toevallig zichtbaar maakt.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-modelsleutel
nodig. Deze bouwt de repo-Docker-image, start een echte stdio-MCP-probeserver binnen
de container, materialiseert die server via de ingesloten Pi-bundel-MCP-runtime,
voert de tool uit, en verifieert daarna dat `coding` en `messaging` `bundle-mcp`-
tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-modelsleutel
nodig. Deze start een geseede Gateway met een echte stdio-MCP-probeserver, voert
een geïsoleerde cron-beurt en een eenmalige `/subagents spawn`-childbeurt uit, en
verifieert daarna dat het MCP-childproces na elke run afsluit.

Handmatige ACP-smoketest voor thread in gewone taal (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor validatie van ACP-threadroutering, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en ingelezen voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` worden ingelezen, met tijdelijke config-/workspace-mappen en zonder externe CLI-auth-koppelingen
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties binnen Docker
- Externe CLI-auth-mappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Versmalde provider-runs koppelen alleen de benodigde mappen/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Overschrijf handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te versmallen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor herhalingen die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat credentials uit de profielopslag komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke beschikbaar wordt gesteld
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-check-prompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-image-tag te overschrijven

## Docs-sanity

Voer docs-controles uit na docs-bewerkingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook controles van koppen binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de “echte pipeline” zonder echte providers:

- Gateway-toolaanroepen (mock OpenAI, echte Gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Betrouwbaarheidsevaluaties voor agenten (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als “betrouwbaarheidsevaluaties voor agenten”:

- Mock-toolaanroepen via de echte Gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en config-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** als skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt hij vereiste stappen/args?
- **Workflowcontracten:** scenario's met meerdere beurten die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen bevestigen.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolaanroepen + volgorde, skill-bestandslezingen en sessiebedrading te bevestigen.
- Een kleine suite met skillgerichte scenario's (gebruiken vs. vermijden, gating, promptinjectie).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite er is.

## Contracttests (Plugin- en kanaalvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd kanaal voldoet aan zijn interfacecontract. Ze itereren over alle ontdekte Plugins en voeren een suite met vorm- en gedragsasserties uit. De standaard `pnpm test`-unitlane slaat deze gedeelde seam- en smoke-bestanden bewust over; voer de contractcommando's expliciet uit wanneer je gedeelde kanaal- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basisvorm van de Plugin (id, naam, capabilities)
- **setup** - Setup-wizardcontract
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Structuur van berichtpayload
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Kanaalactiehandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Vorm van Plugin-register

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-detectie
- **loader** - Plugin laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setup-wizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaden
- Na het toevoegen of wijzigen van een kanaal- of provider-Plugin
- Na het refactoren van Plugin-registratie of -detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent alleen live is (rate limits, auth-beleid), houd de live-test smal en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug opvangt:
  - provider-requestconversie-/replaybug → directe modelltest
  - gateway-sessie-/geschiedenis-/toolpipelinebug → gateway-live-smoke of CI-veilige gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled doel per SecretRef-klasse af uit registermetadata (`listSecretTargetRegistryEntries()`) en bevestigt daarna dat exec-id's met traversal-segmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op ongeclassificeerde doel-id's zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [CI](/nl/ci)
