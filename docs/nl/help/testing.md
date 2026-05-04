---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-testsuites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-05-04T07:06:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat die bewust _niet_ dekt).
- Welke commando's je moet uitvoeren voor gangbare workflows (lokaal, voor push, debugging).
- Hoe live-tests credentials ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** is apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-channel](/nl/channels/qa-channel) — de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runners-sectie hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel starten

Meestal:

- Volledige gate (verwacht voor push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandsdoelen routeren nu ook extensie-/channel-paden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één failure werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra zekerheid wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte credentials):

- Live-suite (modellen + Gateway-tool-/image-probes): `pnpm test:live`
- Richt je stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte `openai/gpt-5.4` agent-turn of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artifacts. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.4-lane-artifacts naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook source-level Gateway-boot, geheugen,
  plugin-pressure, herhaalde fake-model hello-loop en CLI-opstartcijfers.
- Docker live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een text-turn plus een kleine file-read-achtige probe uit.
    Modellen waarvan de metadata `image`-input adverteert, voeren ook een kleine image-turn uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je provider-failures isoleert.
  - CI-coverage: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, die afzonderlijke Docker live-model
    matrix-jobs bevat, geshard per provider.
  - Voor gerichte CI-reruns dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal provider secrets toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Draait een Docker live-lane tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, test `/codex fast` en
    `/codex permissions`, en verifieert daarna een gewoon antwoord en een image-attachment
    route via de native Plugin-binding in plaats van ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Draait Gateway-agent-turns via de Plugin-eigen Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en test standaard image,
    Cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-failures isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue-command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in extra-controle voor de rescue-command-surface van het message-channel.
    Deze test `/crestodian status`, queue't een persistente modelwijziging,
    antwoordt `/crestodian yes` en verifieert het audit-/config-write-pad.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Draait Crestodian in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite type-safe
    config-write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw state-dir, route bare `openclaw` naar
    Crestodian, past setup/model/agent/Discord-Plugin + SecretRef-writes toe,
    valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setup-pad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistant-transcript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het versmallen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-lab-realiteitswaarde nodig hebt:

CI draait QA Lab in dedicated workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. `QA-Lab - All Lanes`
draait elke nacht op `main` en vanuit handmatige dispatch met de mock parity-lane, live
Matrix-lane, Convex-managed live Telegram-lane en Convex-managed live Discord-
lane als parallelle jobs. Scheduled QA en release-checks geven Matrix
`--profile fast` expliciet mee, terwijl de Matrix CLI en handmatige workflow-input
standaard `all` blijven; handmatige dispatch kan `all` sharden naar `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` draait parity plus de snelle Matrix- en Telegram-lanes vóór release-
approval, met `mock-openai/gpt-5.5` voor release-transportchecks zodat ze
deterministisch blijven en normale provider-Plugin-startup vermijden. Deze live transport-
gateways schakelen memory search uit; geheugengedrag blijft gedekt door de QA parity-
suites.

Full release live media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, waarin
`ffmpeg` en `ffprobe` al aanwezig zijn. Docker live model/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die eenmaal per geselecteerde
commit wordt gebouwd, en pullen die daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    gateway-workers. `qa-channel` gebruikt standaard gelijktijdigheid 4 (begrensd door het
    geselecteerde aantal scenario's). Gebruik `--concurrency <count>` om het aantal workers
    af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Sluit af met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een foutieve afsluitcode.
  - Ondersteunt provider-modi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenario-bewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark uit plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metriek worden vastgelegd
    zonder eruit te zien als de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout nog geen
    verse runtime-uitvoer heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA live-providerconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Uitvoermappen moeten onder de repo-root blijven zodat de guest via
    de gemounte werkruimte kan terugschrijven.
  - Schrijft het normale QA-rapport + samenvatting plus Multipass-logboeken onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-sleutel-onboarding uit, configureert standaard Telegram,
    verifieert dat de verpakte Plugin-runtime laadt zonder opstartafhankelijke
    reparatie, voert doctor uit en voert één lokale agentbeurt uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische ingebouwde-app-Docker-smoke uit voor ingebedde runtimecontext-
    transcripts. Het verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven aangepast bericht in plaats van te lekken naar de zichtbare gebruikersbeurt,
    seedt daarna een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` die herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert installed-package-
    onboarding uit, configureert Telegram via de geïnstalleerde CLI, en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT Gateway.
  - Standaard ingesteld op `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het registry
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host vóór
    Docker-build-/installatiewerk. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je opzettelijk de pre-referentieconfiguratie debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Die draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor side-run productbewijs
  tegen één kandidaatpakket. Het accepteert een vertrouwde ref, gepubliceerde npm-specificatie,
  HTTPS-tarball-URL plus SHA-256, of tarball-artefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test`, en voert daarna de
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
    met OpenAI geconfigureerd, en schakelt daarna gebundelde channel/plugins in via config-
    bewerkingen.
  - Verifieert dat setup-discovery ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    plugin expliciet installeert, en dat een tweede herstart geen verborgen afhankelijkheids-
    reparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in vóór het uitvoeren van
    `openclaw update --tag <candidate>`, en verifieert dat de post-update doctor van de kandidaat
    verouderde Plugin-afhankelijkheidsresten opruimt zonder een
    harness-side postinstall-reparatie.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna
    de geïnstalleerde opdracht `openclaw update` uit in dezelfde guest en verifieert de
    geïnstalleerde versie, updatestatus, Gateway-gereedheid en één lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    itereren op één guest. Gebruik `--json` voor het samenvattingsartefactpad en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agent-turn-bewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-timeout zodat Parallels-transportstalls niet
    de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logboeken onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastloopt.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor en pakket-
    updatewerk op een koude guest; dat is nog steeds gezond wanneer het geneste npm-
    debuglogboek vooruitgaat.
  - Voer deze aggregate wrapper niet parallel uit met individuele Parallels
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen op
    snapshotherstel, pakketservering of guest-Gateway-status.
  - Het post-updatebewijs voert het normale gebundelde Plugin-oppervlak uit omdat
    capability-facades zoals spraak, beeldgeneratie en media-
    begrip worden geladen via gebundelde runtime-API's, zelfs wanneer de agent-
    beurt zelf alleen een eenvoudige tekstreactie controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout — verpakte installaties leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een foutieve afsluitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam blootlegt.
  - Schakel voor stabiele bot-tot-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artefact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT van driver-verzendverzoek tot geobserveerd SUT-antwoord.

Live-transportlanes delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een Convex-ondersteunde pool, Heartbeat
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat local loopback `http://` Convex-URL's toe voor alleen-lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Maintainer-beheeropdrachten (pool toevoegen/verwijderen/weergeven) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-runs om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en admin/list-bereikbaarheid te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI
-hulpprogramma's.

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
- `POST /admin/add` (alleen maintainergeheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Verzoek: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Guard voor actieve lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert ongeldige payloads.

### Een kanaal aan QA toevoegen

De architectuur en scenariohelpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimale lat: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en maak scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als “toenemend realisme” (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Commando: `pnpm test`
- Configuratie: runs zonder target gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-projectshards uitbreiden naar per-projectconfiguraties voor parallelle planning
- Bestanden: core/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Scope:
  - Pure unittests
  - In-process integratietests (Gateway-authenticatie, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-loads horen thuis in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - `pnpm test` zonder target draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-projectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensionwerk niet-gerelateerde suites uithongert.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorytargets eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige root-projectopstartkosten vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, sibling-`*.test.ts`-bestanden, expliciete bronmappings en lokale importgraaf-afhankelijken. Configuratie-/setup-/packagebewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Deze classificeert de diff in core, coretests, extensions, extensiontests, apps, docs, releasemetadata, live Docker-tooling en tooling, en draait daarna de bijpassende typecheck-, lint- en guardcommando's. Deze draait geen Vitest-tests; gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs. Alleen releasemetadata-versiebumpen draaien gerichte versie-/configuratie-/root-dependency-checks, met een guard die packagewijzigingen buiten het top-level versieveld weigert.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte checks: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. Wijzigingen aan `package.json` worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-surfacebewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unittests uit agents, commando's, plugins, auto-replyhelpers, `plugin-sdk` en vergelijkbare pure utilitygebieden routeren via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen changed-mode-runs ook naar expliciete siblingtests in die lichte lanes, zodat helperbewerkingen niet de volledige zware suite voor die directory opnieuw hoeven te draaien.
    - `auto-reply` heeft toegewezen buckets voor top-level corehelpers, top-level `reply.*`-integratietests en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR/main-CI slaat bewust de extension batch sweep en de alleen-voor-release `agentic-plugins`-shard over. Full Release Validation dispatcht de afzonderlijke child-workflow `Plugin Prerelease` voor die Plugin-/extensionzware suites op release candidates.

  </Accordion>

  <Accordion title="Dekking van embedded runner">

    - Wanneer je invoer voor message-tool-discovery of Compaction-runtimecontext
      wijzigt, behoud beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routerings- en normalisatiegrenzen.
    - Houd de integratiesuites voor de embedded runner gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en Compaction-gedrag nog steeds
      door de echte `run.ts`- / `compact.ts`-paden lopen; alleen-helpertests zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool en isolatiestandaarden">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner over de root-projecten, e2e en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`
      standaardwaarden uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commithook doet alleen formatting. Deze stagest geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai `pnpm check:changed` expliciet vóór overdracht of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, configuratie-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routeringsgedrag,
      alleen met een hogere workerlimiet.
    - Lokale automatische workerschaling is bewust conservatief en schaalt terug
      wanneer de host-loadaverage al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade veroorzaken.
    - De basisconfiguratie van Vitest markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat reruns in changed-mode correct blijven wanneer test-
      wiring verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus
      import-breakdownuitvoer in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shardtimingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Whole-config-runs gebruiken het configuratiepad als sleutel; include-pattern-CI-
      shards voegen de shardnaam toe, zodat gefilterde shards afzonderlijk kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van zijn tijd aan opstartimports besteedt,
      houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze via `vi.mock(...)` door te geven.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en toont wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      dirty tree door de gewijzigde bestandslijst via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread-CPU-profiel voor
      Vitest-/Vite-opstart- en transformoverhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+heap-profielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start een echte local loopback Gateway met diagnostiek standaard ingeschakeld
  - Stuurt synthetische Gateway-berichten, geheugen- en grote-payloadchurn door het diagnostische eventpad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostische stabiliteitsbundels
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde Plugin-E2E-tests onder `extensions/`
- Runtime-standaardwaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Handige overschrijvingen:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers af te dwingen (begrensd op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer weer in te schakelen.
- Bereik:
  - End-to-endgedrag van Gateway met meerdere instanties
  - WebSocket/HTTP-oppervlakken, node-koppeling en zwaardere netwerken
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unittests (kan langzamer zijn)

### E2E: OpenShell-backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Bereik:
  - Start een geïsoleerde OpenShell-gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH-uitvoering
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell` CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-Gateway en sandbox
- Handige overschrijvingen:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binair bestand of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Commando: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en gebundelde Plugin-live-tests onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (zet `OPENCLAW_LIVE_TEST=1`)
- Bereik:
  - “Werkt deze provider/dit model _vandaag_ echt met echte inloggegevens?”
  - Vangt wijzigingen in provider-indelingen, eigenaardigheden bij tool-calling, authenticatieproblemen en rate-limitgedrag op
- Verwachtingen:
  - Niet ontworpen om CI-stabiel te zijn (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai bij voorkeur versmalde subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze configuratie-/authenticatiemateriaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen muteren.
- Zet `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen wanneer je bewust wilt dat live-tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-ruis. Zet `OPENCLAW_LIVE_TEST_QUIET=0` als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): zet `*_API_KEYS` met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of een override per live-run via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limitresponses.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites geven nu voortgangsregels uit naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels direct streamen tijdens live-runs.
  - Stem direct-model-heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: draai `pnpm test` (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- “Mijn bot ligt eruit” / providerspecifieke fouten / tool-calling debuggen: draai een versmalde `pnpm test:live`

## Live-tests (met netwerktoegang)

Voor de live-modelmatrix, CLI-backend-smokes, ACP-smokes, Codex-app-server
harness en alle media-provider-live-tests (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus credentialafhandeling voor live-runs — zie
[Live-suites testen](/nl/help/testing-live). Voor de speciale update- en
Plugin-validatiechecklist, zie
[Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-checks)

Deze Docker-runners vallen uiteen in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` draaien alleen hun bijpassende profile-key-livebestand binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en workspace worden gemount (en `~/.profile` wordt gesourced indien gemount). De bijpassende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smoke-limiet, zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live-Docker-image één keer via `test:docker:live-build`, verpakt OpenClaw één keer als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor ingebouwde-app-functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregate gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` beheert processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en laat die dan alleen draaien totdat er weer capaciteit beschikbaar is. Standaardwaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw-E2E-containers, print elke 30 seconden status, slaat succesvolle lane-timings op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lane-manifest te printen zonder Docker te bouwen of te draaien, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, pakket-/imagebehoeften en credentials te printen.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Het lost één kandidaatpakket op vanuit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test` en draait daarna de herbruikbare Docker-E2E-lanes tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het package-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, release-standaardwaarden en foutentriage.
- Build- en releasechecks draaien `scripts/check-cli-bootstrap-imports.mjs` na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-startup pakketafhankelijkheden zoals Commander, prompt-UI, undici of logging importeert vóór commandodispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. Verpakte CLI-smoke dekt ook root-help, onboard-help, doctor-help, status, configuratieschema en een model-list-commando.
- Legacycompatibiliteit voor Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die cutoff tolereert de harness alleen metadatagaten in verzonden pakketten: weggelaten private QA-inventory-items, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin-install-record-locaties, ontbrekende marketplace-install-record-persistentie en configuratiemetadata-migratie tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten één of meer echte containers en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is versmald), en kopiëren die vervolgens vóór de run naar de container-home, zodat externe-CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoke: `pnpm qa:otel:smoke` is een private QA-lane voor bron-checkouts. Deze maakt bewust geen deel uit van package-Docker-release-lanes omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding-/kanaal-/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en draait één gemockte OpenAI-agentbeurt. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Updatekanaal-wissel-smoke: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, wisselt van package `stable` naar git `dev`, verifieert het opgeslagen kanaal en de Plugin-werking na de update, wisselt daarna terug naar package `stable` en controleert de updatestatus.
- Upgrade-overlevings-smoke: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vervuilde fixture van een oude gebruiker met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus opstart-/statusbudgetten.
- Gepubliceerde upgrade-overlevings-smoke: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestanden van bestaande gebruikers, configureert die baseline met een ingebakken opdrachtrecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaattarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten. Override één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, laat de aggregatiescheduler exacte baselines uitbreiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `all-since-2026.4.23`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de set reported-issues bevat `configured-plugin-installs` voor automatische reparatie van externe OpenClaw-Plugin-installaties. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.
- Sessieruntime-context-smoke: `pnpm test:docker:session-runtime-context` verifieert het voortbestaan van verborgen runtimecontext-transcripten plus doctor-reparatie van getroffen gedupliceerde prompt-rewrite-branches.
- Bun globale-installatie-smoke: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige tree, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoke: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. Update-smoke gebruikt standaard npm `latest` als de stabiele baseline voordat naar de kandidaattarball wordt geüpgraded. Override lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de invoer `update_baseline_version` van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan, zodat cache-items die eigendom zijn van root het gedrag van gebruikerslokale installaties niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root-/update-/direct-npm-cache opnieuw te gebruiken bij lokale herhalingen.
- Install Smoke CI slaat de dubbele directe globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die env uit wanneer dekking voor directe `npm install -g` nodig is.
- Agents verwijderen gedeelde-workspace-CLI-smoke: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag waarbij de workspace behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerk (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoke: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, naar cursor gepromote klikbare elementen, iframe-refs en frame-metadata dekken.
- OpenAI Responses web_search minimale-redenering-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) draait een gemockte OpenAI-server via Gateway, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de providerschema-afwijzing en controleert dat het raw detail in Gateway-logs verschijnt.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude notification-frame-smoke): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel allow/deny-smoke): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-opruiming (echte Gateway + teardown van stdio-MCP-child na geïsoleerde Cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoke voor lokaal pad, `file:`, npm-registry met gehoste afhankelijkheden, git moving refs, ClawHub kitchen-sink, marketplace-updates en Claude-bundle enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of override het standaard kitchen-sink-package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoke: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-levenscyclusmatrix-smoke: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt enable/disable om, upgradet en downgradet deze via een lokale npm-registry, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS-/CPU-metrieken voor elke levenscyclusfase worden gelogd.
- Configuratie-herlaad-metadata-smoke: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoke voor lokaal pad, `file:`, npm-registry met gehoste afhankelijkheden, git moving refs, ClawHub-fixtures, marketplace-updates en Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte npm-plugininstallatie, enable, disable, upgrade, downgrade en missing-code uninstall.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overrides zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` blijven voorgaan wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een gedeelde remote image wijst, halen de scripts deze op als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze package-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners koppelen de huidige checkout ook read-only via bind-mount en
stagen die naar een tijdelijke workdir binnen de container. Hierdoor blijft de runtime-
image klein, terwijl Vitest nog steeds tegen je exacte lokale source/config draait.
De stagingstap slaat grote local-only caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputdirectories, zodat Docker-live-runs geen minuten besteden aan het kopiëren van
machinespecifieke artifacts.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-live-probes geen
echte Telegram/Discord/etc.-kanaalworkers binnen de container starten.
`test:docker:live-models` voert nog steeds `pnpm test:live` uit, dus geef
`OPENCLAW_LIVE_GATEWAY_*` ook door wanneer je Gateway-
live-dekking vanuit die Docker-lane moet beperken of uitsluiten.
`test:docker:openwebui` is een smoke op hoger niveau voor compatibiliteit: het start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-endpoints ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` beschikbaar maakt, en stuurt daarna een
echte chatrequest via de `/api/chat/completions`-proxy van Open WebUI.
De eerste run kan merkbaar langzamer zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startconfiguratie moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in Dockerized runs aan te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een seeded Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert daarna gerouteerde conversatiediscovery, transcriptreads, attachmentmetadata,
live-eventqueuegedrag, outbound-sendrouting, en Claude-achtige kanaal- en
permissienotificaties via de echte stdio MCP-bridge. De notificatiecheck
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk emitteert, niet alleen wat een specifieke client-SDK toevallig zichtbaar maakt.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de embedded Pi-bundle
MCP-runtime, voert de tool uit, en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden, terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-model
sleutel nodig. Het start een seeded Gateway met een echte stdio MCP-probeserver, voert een
geïsoleerde Cron-turn en een `/subagents spawn` one-shot child-turn uit, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP plain-language thread-smoke (niet CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor validatie van ACP-threadrouting, dus verwijder het niet.

Nuttige env vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gemount naar `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gemount naar `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gemount naar `/home/node/.profile` en gesourced voordat tests draaien
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspacedirectories en zonder externe CLI-authmounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gemount naar `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-authdirs/-bestanden onder `$HOME` worden read-only gemount onder `/host-auth...`, en daarna gekopieerd naar `/home/node/...` voordat tests starten
  - Standaarddirs: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte provider-runs mounten alleen de benodigde dirs/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te waarborgen dat creds uit de profilestore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke wordt aangeboden
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Documentatiecontrole

Voer documentatiechecks uit na documentatiewijzigingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook headingchecks binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-safe)

Dit zijn regressies voor de “echte pipeline” zonder echte providers:

- Gateway-toolcalling (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agentbetrouwbaarheidsevals (Skills)

We hebben al een paar CI-safe tests die zich gedragen als “agentbetrouwbaarheidsevals”:

- Mock-toolcalling via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die session wiring en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt die irrelevante)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt die de vereiste stappen/args?
- **Workflowcontracten:** multi-turn scenario's die toolvolgorde, session history carryover en sandboxgrenzen assert'en.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolcalls + volgorde, skillfile-reads en session wiring te assert'en.
- Een kleine suite met skillgerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-safe suite aanwezig is.

## Contracttests (vorm van Plugin en kanaal)

Contracttests verifiëren dat elke geregistreerde Plugin en elk kanaal aan zijn
interfacecontract voldoet. Ze itereren over alle ontdekte Plugins en voeren een suite van
shape- en gedragsasserties uit. De standaard `pnpm test` unit-lane slaat deze shared seam- en smoke-bestanden bewust over; voer de contractcommando's expliciet uit
wanneer je gedeelde kanaal- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Te vinden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **Plugin** - Basale Plugin-vorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Session-bindinggedrag
- **outbound-payload** - Structuur van messagepayload
- **inbound** - Afhandeling van inbound messages
- **actions** - Kanaalactionhandlers
- **threading** - Afhandeling van thread-id's
- **directory** - Directory/roster-API
- **group-policy** - Afdwinging van group policy

### Providerstatuscontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Vorm van Plugin-registry

### Providercontracten

Te vinden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugindiscovery
- **loader** - Pluginloading
- **runtime** - Providerruntime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk exports of subpaths
- Na het toevoegen of wijzigen van een kanaal- of provider-Plugin
- Na het refactoren van Pluginregistratie of discovery

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelissue oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-safe regressie toe (mock/stubprovider, of leg de exacte request-shapetransformatie vast)
- Als het inherent live-only is (rate limits, auth policies), houd de livetest smal en opt-in via env vars
- Richt je bij voorkeur op de kleinste laag die de bug opvangt:
  - provider request conversion/replay bug → directe modeltest
  - gateway session/history/tool pipeline bug → Gateway-live-smoke of CI-safe Gateway-mocktest
- SecretRef-traversalguardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één sampled target per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat traversal-segment exec ids worden afgewezen.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target ids, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en Plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
