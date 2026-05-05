---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Debuggen van Gateway- en agentgedrag
summary: 'Testkit: unit-, e2e- en live-suites, Docker-runners en wat elke test afdekt'
title: Testen
x-i18n:
    generated_at: "2026-05-05T06:18:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat die bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, vóór pushen, debuggen).
- Hoe live tests inloggegevens ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, opdrachtoppervlak, scenario's schrijven.
- [Matrix QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-channel](/nl/channels/qa-channel) — de synthetische transportplugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De sectie voor QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de bovenstaande referenties.
</Note>

## Snelstart

Meestal:

- Volledige gate (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watch-loop: `pnpm test:watch`
- Directe bestandstargeting routeert nu ook extensie-/channelpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan één fout itereert.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Wanneer je echte providers/modellen debugt (vereist echte inloggegevens):

- Live suite (modellen + gateway-tool-/afbeeldingsprobes): `pnpm test:live`
- Eén live bestand stil targeten: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtimeprestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte agentbeurt met `openai/gpt-5.4` of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artifacts. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.4-lane-artifacts naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook source-level Gateway-opstart-, geheugen-,
  plugin-pressure-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live model-sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt uit plus een kleine file-read-achtige probe.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine afbeeldingsbeurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-coverage: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, waaronder aparte Docker live model-matrixjobs
    vallen die per provider zijn geshard.
  - Dispatch voor gerichte CI-herhalingen `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe high-signal providergeheimen toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live lane uit tegen het Codex app-serverpad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert vervolgens dat een gewone reactie en een afbeeldingsbijlage
    via de native pluginbinding worden gerouteerd in plaats van via ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de plugin-eigen Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard afbeeldings-,
    Cron MCP-, sub-agent- en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-serverfouten isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in dubbele controle voor het message-channel rescue command-oppervlak.
    Deze oefent `/crestodian status`, zet een permanente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes`, en verifieert het audit-/config-schrijfpad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een nep-Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geaudite getypte
    configschrijfactie.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup-/model-/agent-/Discord-plugin- + SecretRef-schrijfacties toe,
    valideert config en verifieert auditvermeldingen. Hetzelfde Ring 0-setup-pad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit en daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het vernauwen van live tests via de hieronder beschreven allowlist-env-vars.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realiteitsgetrouwheid nodig hebt:

CI voert QA Lab uit in speciale workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als een zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de QA-groep van release-checks. Stabiele/standaard release-checks
houden uitputtende live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait elke nacht op `main` en via handmatige dispatch met de mock parity-lane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord-lane
als parallelle jobs. Geplande QA- en release-checks geven Matrix
`--profile fast` expliciet door, terwijl de Matrix CLI en handmatige workflowinput
standaard `all` blijven; handmatige dispatch kan `all` sharden naar `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert parity plus de snelle Matrix- en Telegram-lanes uit vóór releasegoedkeuring,
met `mock-openai/gpt-5.5` voor releasetransportchecks zodat ze deterministisch blijven
en normale provider-plugin-opstart vermijden. Deze live transport-Gateways
schakelen memory search uit; geheugengedrag blijft gedekt door de QA parity-suites.

Full release live media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` bevat. Docker live model-/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd en halen die daarna op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale door AIMock ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink Plugin-proefreeks uit via QA Lab. Deze
    installeert het externe Kitchen Sink-pakket, verifieert de Plugin SDK-surface
    inventory, controleert `/healthz` en `/readyz`, registreert Gateway CPU/RSS-
    bewijs, voert een live OpenAI-turn uit en controleert vijandige diagnostiek.
    Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In gehydrateerde Testbox-
    sessies laadt deze automatisch het Testbox live-auth-profiel wanneer de
    `openclaw-testbox-env`-helper aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbench plus een klein mock-QA Lab-scenariopakket uit
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hot-CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metrics worden
    vastgelegd zonder te lijken op de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artifacts; voer eerst een build uit wanneer de checkout
    nog geen verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde gedrag voor scenarioselectie als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de gast:
    env-gebaseerde providersleutels, het QA-liveproviderconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Outputmappen moeten onder de repo-root blijven zodat de gast via de
    gemounte workspace kan terugschrijven.
  - Schrijft het normale QA-rapport + de samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de door Docker ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball uit de huidige checkout, installeert deze globaal in
    Docker, voert niet-interactieve OpenAI API-sleutel-onboarding uit, configureert standaard Telegram,
    verifieert dat de verpakte Plugin-runtime laadt zonder opstartreparatie van
    afhankelijkheden, voert doctor uit en voert één lokale agent-turn uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische built-app Docker-smoke uit voor embedded runtimecontext-
    transcripts. Deze verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven aangepast bericht in plaats van te lekken in de zichtbare user-turn,
    seedt vervolgens een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` deze herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert onboarding van het geïnstalleerde pakket uit,
    configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT Gateway.
  - Gebruikt standaard `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het register
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-credentials of Convex-credentialbron als
    `pnpm openclaw qa telegram`. Voor CI-/release-automatisering stel je
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim in. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert Telegram- of Convex-credential-env op de host voordat
    Docker-build-/installatiewerk begint. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust pre-credential-setup debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-credentialleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productbewijs in een nevenrun
  tegen één kandidaatpakket. Deze accepteert een vertrouwde ref, gepubliceerde npm-specificatie,
  HTTPS-tarball-URL plus SHA-256, of tarball-artifact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of custom-
  laneprofielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artifact uit te voeren.
  - Productbewijs voor nieuwste bèta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bewijs voor exacte tarball-URL vereist een digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact-bewijs downloadt een tarball-artifact uit een andere Actions-run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Verpakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd en schakelt vervolgens gebundelde kanalen/plugins in via
    configuratiebewerkingen.
  - Verifieert dat setupdetectie ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    Plugin expliciet installeert en dat een tweede herstart geen verborgen
    afhankelijkheidsreparatie uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat legacy-Plugin-afhankelijkheidsresten opruimt zonder een
    reparatie via postinstall aan de harness-zijde.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install-update-smoke uit over Parallels-gasten. Elk
    geselecteerd platform installeert eerst het aangevraagde baselinepakket, voert daarna de
    geïnstalleerde `openclaw update`-opdracht uit in dezelfde gast en verifieert de
    geïnstalleerde versie, updatestatus, Gateway-gereedheid en één lokale agent-turn.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` terwijl
    je op één gast itereert. Gebruik `--json` voor het samenvattingsartifactpad en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agent-turn-bewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Verpak lange lokale runs in een host-timeout zodat Parallels-transportstalls niet
    de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper is vastgelopen.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor en pakket-
    updatewerk op een koude gast; dat is nog steeds gezond wanneer het geneste npm-
    debuglog vordert.
  - Voer deze aggregate-wrapper niet parallel uit met afzonderlijke Parallels-
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of gast-Gateway-status.
  - Het post-update-bewijs voert de normale gebundelde Plugin-surface uit omdat
    capabilityfacades zoals spraak, beeldgeneratie en media-
    understanding via gebundelde runtime-API's worden geladen, zelfs wanneer de agent-
    turn zelf alleen een eenvoudige tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare door Docker ondersteunde Tuwunel-homeserver. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artifactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde credentials. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder een falende exitcode.
  - Vereist twee afzonderlijke bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam beschikbaar stelt.
  - Voor stabiele bot-naar-bot-observatie schakel je Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg je dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artifact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het geobserveerde SUT-antwoord.

Live-transportlanes delen één standaardcontract zodat nieuwe transports niet afdrijven; de dekkingsmatrix per lane staat in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-credentials via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA Lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeats
die lease terwijl de lane draait en geeft de lease vrij bij afsluiten.

Referentie-Convex-projectscaffold:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback `http://` Convex-URL's toe voor local-only ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normale werking `https://` gebruiken.

Beheerdersadmin-opdrachten (pool toevoegen/verwijderen/weergeven) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor beheerders:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live-uitvoeringen om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en bereikbaarheid van admin/list te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Aanvraag: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Geslaagd: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw probeerbaar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen beheerdersgeheim)
  - Aanvraag: `{ kind, actorId, payload, note?, status? }`
  - Geslaagd: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen beheerdersgeheim)
  - Aanvraag: `{ credentialId, actorId }`
  - Geslaagd: `{ status: "ok", changed, credential }`
  - Actieve lease-bewaking: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen beheerdersgeheim)
  - Aanvraag: `{ kind?, status?, includePayload?, limit? }`
  - Geslaagd: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-tekenreeks zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert onjuist gevormde payloads.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, koppel als `openclaw qa <runner>` en maak scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als “toenemend realisme” (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte uitvoeringen gebruiken de shardset `vitest.full-*.config.ts` en kunnen shards met meerdere projecten uitbreiden naar configuraties per project voor parallelle planning
- Bestanden: core/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Bereik:
  - Pure unittests
  - In-process integratietests (gateway-authenticatie, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte API's uit gebundelde Plugin-broncode. Echte Plugin-API-ladingen horen in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test` voert twaalf kleinere shardconfiguraties uit (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één gigantisch native root-projectproces. Dit verlaagt piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgrafiek, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` sturen expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige root-projectopstartkosten betaalt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronmappings en lokale importgrafiek-afhankelijken. Config-/setup-/packagebewerkingen draaien tests niet breed, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale controlegate voor smal werk. Het classificeert de diff in core, coretests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de passende typecheck-, lint- en guard-opdrachten uit. Het voert geen Vitest-tests uit; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Releasemetadata-only versiebumpen draaien gerichte versie-/config-/root-dependency-controles, met een guard die pakketwijzigingen buiten het bovenste versieveld weigert.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte controles: shell-syntaxis voor de live Docker-authenticatiescripts en een dry-run van de live Docker-scheduler. Wijzigingen in `package.json` worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere pakketoppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Import-lichte unittests uit agents, opdrachten, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen changed-mode-uitvoeringen ook naar expliciete naastgelegen tests in die lichte lanes, zodat helperbewerkingen niet de volledige zware suite voor die directory opnieuw hoeven te draaien.
    - `auto-reply` heeft toegewezen buckets voor top-level corehelpers, top-level `reply.*`-integratietests en de subtree `src/auto-reply/reply/**`. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één import-zware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extensiebatch-sweep en de release-only `agentic-plugins`-shard over. Full Release Validation start de aparte childworkflow `Plugin Prerelease` voor die Plugin-/extensie-zware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Ingebouwde runner-dekking">

    - Wanneer je message-tool discovery-inputs of Compaction-runtimecontext
      wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routerings- en normalisatie-
      grenzen.
    - Houd de integratiesuites van de ingebouwde runner gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en Compaction-gedrag nog steeds door
      de echte `run.ts`- / `compact.ts`-paden stromen; tests met alleen helpers zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool- en isolatiestandaarden">

    - De basis-Vitest-configuratie gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde standaarden `threads` + `isolate: false`
      uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor child-Node-
      processen van Vitest om V8-compilechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architectuurlanes een diff triggert.
    - De pre-commit-hook is alleen voor formattering. Hij staged geformatteerde bestanden opnieuw en
      voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór overdracht of push wanneer je
      de slimme lokale controlegate nodig hebt.
    - `pnpm test:changed` loopt standaard via goedkope scoped lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, config-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routerings-
      gedrag, alleen met een hogere workercap.
    - Lokale automatische workerschaling is bewust conservatief en schaalt terug
      wanneer de host-load average al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade aanrichten.
    - De basis-Vitest-configuratie markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat changed-mode-heruitvoeringen correct blijven wanneer de test-
      bedrading verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest import-duration-reporting plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profilingweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shardtimingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Whole-config-runs gebruiken het configpad als sleutel; include-pattern-CI-
      shards voegen de shardnaam toe, zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van zijn tijd besteedt aan startup-imports,
      houd zware dependencies achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze door `vi.mock(...)` te geven.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en drukt wandtijd plus macOS max RSS af.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      vuile tree door de gewijzigde-bestandenlijst via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een main-thread CPU-profiel voor
      Vitest-/Vite-opstart en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner CPU+heap-profielen voor de
      unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Opdracht: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Bereik:
  - Start een echte loopback-Gateway met diagnostiek standaard ingeschakeld
  - Stuurt synthetische Gateway-berichten, geheugen- en grote-payload-churn via het diagnostische eventpad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostische stabiliteitsbundels
  - Bevestigt dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure-budget blijven en wachtrijdiepten per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Opdracht: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, en gebundelde Plugin-E2E-tests onder `extensions/`
- Runtime-standaardinstellingen:
  - Gebruikt Vitest `threads` met `isolate: false`, overeenkomend met de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te beperken.
- Nuttige overschrijvingen:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers af te dwingen (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer weer in te schakelen.
- Bereik:
  - End-to-end-gedrag van Gateway met meerdere instanties
  - WebSocket/HTTP-oppervlakken, Node-koppeling en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unit-tests (kan trager zijn)

### E2E: OpenShell-backend-smoke

- Opdracht: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Bereik:
  - Start een geisoleerde OpenShell Gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Test de OpenShell-backend van OpenClaw via echte `sandbox ssh-config` + SSH-exec
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-brug
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell` CLI plus een werkende Docker-daemon
  - Gebruikt geisoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de test-Gateway en sandbox
- Nuttige overschrijvingen:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binair bestand of wrapperscript te verwijzen

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, en gebundelde Plugin-live-tests onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Bereik:
  - “Werkt deze provider/dit model _vandaag_ echt met echte referenties?”
  - Vang wijzigingen in providerformaten, eigenaardigheden bij tool-calling, auth-problemen en rate-limit-gedrag op
- Verwachtingen:
  - Ontwerptechnisch niet CI-stabiel (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai bij voorkeur beperkte subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopieren configuratie-/auth-materiaal naar een tijdelijke test-home zodat unit-fixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkommaformaat of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live-overschrijving via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responsen.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites sturen nu voortgangsregels naar stderr zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit zodat provider-/Gateway-voortgangsregels tijdens live-runs direct streamen.
  - Stel direct-model-heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stel Gateway-/probe-heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslistabel:

- Logica/tests bewerken: draai `pnpm test` (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-networking / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- “Mijn bot ligt eruit” debuggen / providerspecifieke fouten / tool-calling: draai een beperkte `pnpm test:live`

## Live-tests (die het netwerk raken)

Voor de live-modelmatrix, CLI-backend-smokes, ACP-smokes, Codex-app-server
harnas, en alle live-tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media-harnas) — plus credential-afhandeling voor live-runs — zie
[Live-suites testen](/nl/help/testing-live). Voor de speciale checklist voor updates en
Plugin-validatie, zie
[Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele "werkt in Linux"-checks)

Deze Docker-runners vallen uiteen in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` draaien alleen hun overeenkomende live-bestand met profielsleutel binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en workspace worden gemount (en `~/.profile` wordt gesourcet als die is gemount). De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smoke-cap zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere, uitputtende scan wilt.
- `test:docker:all` bouwt de live-Docker-image eenmalig via `test:docker:live-build`, verpakt OpenClaw eenmalig als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De bare image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor built-app-functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. Het aggregaat gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` regelt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als een enkele lane zwaarder is dan de actieve caps, kan de scheduler die toch starten wanneer de pool leeg is en deze vervolgens alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer speelruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw-E2E-containers, print elke 30 seconden status, bewaart timings van geslaagde lanes in `.artifacts/docker-tests/lane-timings.json`, en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lane-manifest te printen zonder Docker te bouwen of te draaien, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan te printen voor geselecteerde lanes, package-/image-behoeften en referenties.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Het resolved een kandidaat-package uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test`, en draait daarna de herbruikbare Docker-E2E-lanes tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn gerangschikt op breedte: `smoke`, `package`, `product`, en `full`. Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het package-/update-/Plugin-contract, de survivor-matrix voor gepubliceerde upgrades, release-standaarden en fouttriage.
- Build- en releasechecks draaien `scripts/check-cli-bootstrap-imports.mjs` na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart imports package-dependencies zoals Commander, prompt-UI, undici of logging importeert voordat commandodispatch plaatsvindt; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. Packaged CLI-smoke dekt ook root-help, onboard-help, doctor-help, status, config-schema en een model-list-opdracht.
- Legacy-compatibiliteit van Package Acceptance is afgetopt op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert het harnas alleen metadata-gaten van verzonden packages: weggelaten private QA-inventoryvermeldingen, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende persistente `update.channel`, legacy Plugin-install-record-locaties, ontbrekende persistentie van marketplace-install-records, en configuratiemetadata-migratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte failures.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, en `test:docker:config-reload` starten een of meer echte containers en verifieren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet beperkt is), en kopieren die vervolgens voor de run naar de container-home zodat OAuth van externe CLI's tokens kan verversen zonder de auth-store van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex-appserver-harnas-smoketest: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + ontwikkelagent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-bron-checkout-lane. Die maakt bewust geen deel uit van Docker-release-lanes voor pakketten omdat de npm-tarball QA Lab weglaat.
- Open WebUI-live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-onboarding/kanaal/agent-smoketest: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert een gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Updatekanaal-wissel-smoketest: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt van pakket `stable` naar git `dev`, verifieert dat het vastgelegde kanaal en de Plugin-na-update werken, schakelt daarna terug naar pakket `stable` en controleert de updatestatus.
- Upgrade-survivor-smoketest: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vuile oude-gebruiker-fixture met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van config/status plus opstart-/statusbudgetten.
- Gepubliceerde upgrade-survivor-smoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruiker-bestanden, configureert die baseline met een ingebakken opdrachtrecept, valideert de resulterende config, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de geaggregeerde scheduler exacte lokale baselines uit te breiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de reported-issues-set bevat `configured-plugin-installs` voor automatisch herstel van externe OpenClaw-Plugin-installatie. Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, lost meta-baseline-tokens zoals `last-stable-4` of `all-since-2026.4.23` op, en Full Release Validation breidt de release-soak-pakketgate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Sessie-runtimecontext-smoketest: `pnpm test:docker:session-runtime-context` verifieert verborgen runtimecontext-transcriptpersistentie plus doctor-herstel van getroffen gedupliceerde prompt-herschrijftakken.
- Bun globale-installatie-smoketest: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert die met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde afbeeldingsproviders retourneert in plaats van vast te lopen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. Update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-invoer van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache zodat root-owned cache-items lokaal gebruikersinstallatiegedrag niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache te hergebruiken tussen lokale herhalingen.
- Install Smoke CI slaat de dubbele directe globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die env uit wanneer directe `npm install -g`-dekking nodig is.
- CLI-smoketest voor agents verwijderen gedeelde workspace: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde containerhome, voert `agents delete --json` uit en verifieert geldige JSON plus gedrag waarbij de workspace behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + gezondheid): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, naar cursor gepromoveerde klikbare elementen, iframe-refs en framemetadata dekken.
- OpenAI Responses web_search-regressie voor minimale reasoning: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna provider-schema-afwijzing en controleert dat het raw detail in Gateway-logs verschijnt.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude-notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + ingebedde Pi-profiel-allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent-MCP-cleanup (echte Gateway + stdio-MCP-child-teardown na geïsoleerde cron- en one-shot-subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git moving refs, ClawHub kitchen-sink, marketplace-updates en Claude-bundel inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-pakket/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Plugin-update-ongewijzigd-smoketest: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecycle-matrix-smoketest: `pnpm test:docker:plugin-lifecycle-matrix` installeert de ingepakte OpenClaw-tarball in een kale container, installeert een npm-Plugin, schakelt enable/disable om, upgradet en downgradet die via een lokaal npm-register, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS-/CPU-metrics voor elke lifecycle-fase worden gelogd.
- Config-herlaadmetadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt installatie-/update-smoketest voor lokaal pad, `file:`, npm-register met gehesen afhankelijkheden, git moving refs, ClawHub-fixtures, marketplace-updates en Claude-bundel inschakelen/inspecteren. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde Plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte installatie, inschakeling, uitschakeling, upgrade, downgrade en missing-code-uninstall van npm-Plugins.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` krijgen nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een gedeelde remote image verwijst, halen de scripts die op als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners binden de huidige checkout ook read-only en
stagen deze in een tijdelijke workdir binnen de container. Zo blijft de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale broncode/configuratie draait.
De stagingstap slaat grote lokale-only caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-outputdirectories, zodat live Docker-runs geen minuten kwijt zijn aan het kopiëren
van machine-specifieke artefacten.
Ze zetten ook `OPENCLAW_SKIP_CHANNELS=1`, zodat Gateway-liveprobes geen
echte Telegram/Discord/etc.-kanaalworkers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je live Gateway-dekking in die
Docker-lane moet beperken of uitsluiten.
`test:docker:openwebui` is een smoke op hoger niveau voor compatibiliteit: deze start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-endpoints ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, logt in via
Open WebUI, controleert of `/api/models` `openclaw/default` blootstelt, en stuurt vervolgens een
echte chatrequest via Open WebUI's `/api/chat/completions`-proxy.
De eerste run kan merkbaar trager zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk de eigen cold-start-setup moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(standaard `~/.profile`) is de primaire manier om die in gedockeriseerde runs aan te leveren.
Geslaagde runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
controleert vervolgens gerouteerde conversatiedetectie, transcript-reads, bijlagemetadata,
gedrag van live event-queues, outbound send-routing, en Claude-achtige kanaal- +
toestemmingsmeldingen over de echte stdio MCP-bridge. De notificatiecontrole
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk emitteert, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de ingebedde Pi-bundle
MCP-runtime, voert de tool uit en controleert daarna of `coding` en `messaging`
`bundle-mcp`-tools behouden, terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-modelsleutel
nodig. Het start een geseede Gateway met een echte stdio MCP-probeserver, draait een
geisoleerde Cron-turn en een `/subagents spawn` eenmalige child-turn, en controleert vervolgens
of het MCP-childproces na elke run afsluit.

Handmatige ACP-thread-smoke in gewone taal (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadroutingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gemount naar `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gemount naar `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gemount naar `/home/node/.profile` en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te controleren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspacedirectories en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gemount naar `/home/node/.npm-global` voor gecachete CLI-installaties binnen Docker
- Externe CLI-auth-directories/-bestanden onder `$HOME` worden read-only gemount onder `/host-auth...` en daarna gekopieerd naar `/home/node/...` voordat tests starten
  - Standaarddirectories: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Runs met beperkte providers mounten alleen de benodigde directories/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor herhalingsruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te verzekeren dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway wordt blootgesteld voor de Open WebUI-smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Documentatiecontrole

Voer docs-checks uit na documentatiewijzigingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook in-page heading-checks nodig hebt: `pnpm docs:check-links:anchors`.

## Offline-regressie (CI-veilig)

Dit zijn regressies van de “echte pipeline” zonder echte providers:

- Gateway-toolcalling (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevaluaties (Skills)

We hebben al een paar CI-veilige tests die werken als “agent-betrouwbaarheidsevaluaties”:

- Mock-toolcalling via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt hij de vereiste stappen/argumenten?
- **Workflowcontracten:** multi-turn-scenario's die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen asserten.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolcalls + volgorde, skill-file-reads en sessiebedrading te asserten.
- Een kleine suite van skill-gerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en kanaalvorm)

Contracttests controleren of elke geregistreerde Plugin en elk geregistreerd kanaal voldoet aan het
interfacecontract. Ze itereren over alle ontdekte Plugins en voeren een suite van
vorm- en gedragsasserties uit. De standaard `pnpm test`-unitlane slaat deze gedeelde
seam- en smokebestanden bewust over; draai de contractcommando's expliciet
wanneer je gedeelde kanaal- of providersurfaces raakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basis-Plugin-vorm (id, naam, capabilities)
- **setup** - Setupwizard-contract
- **session-binding** - Sessiebindingsgedrag
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Inbound berichtverwerking
- **actions** - Kanaalactiehandlers
- **threading** - Thread-ID-afhandeling
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanaalstatusprobes
- **registry** - Plugin registry-vorm

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer uit te voeren

- Na het wijzigen van plugin-sdk-exports of subpaths
- Na het toevoegen of wijzigen van een kanaal- of provider-Plugin
- Na het refactoren van Plugin-registratie of discovery

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shape-transformatie vast)
- Als het inherent live-only is (rate limits, auth policies), houd de live-test beperkt en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - provider-requestconversie-/replay-bug → directe modeltest
  - Gateway-sessie-/geschiedenis-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt een gesampled target per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert vervolgens dat exec-id's met traversal-segmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op ongeclassificeerde target-id's, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en Plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
