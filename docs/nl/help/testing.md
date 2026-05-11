---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-testsuites, Docker-runners en wat elke test afdekt'
title: Testen
x-i18n:
    generated_at: "2026-05-11T20:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, pre-push, debuggen).
- Hoe live-tests inloggegevens ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, opdrachtoppervlak, scenario-authoring.
- [Matrix QA](/nl/concepts/qa-matrix) - referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runner-sectie hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel aan de slag

Op de meeste dagen:

- Volledige gate (verwacht vóór push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suite-run op een ruime machine: `pnpm test:max`
- Directe Vitest-watch-loop: `pnpm test:watch`
- Directe bestandsdoelen routeren nu ook extensie-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef eerst de voorkeur aan gerichte runs wanneer je aan één fout werkt.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Door Linux-VM ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests aanraakt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Live-suite (modellen + Gateway-tool-/image-probes): `pnpm test:live`
- Richt stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-prestatierapporten: dispatch `OpenClaw Performance` met
  `live_gpt54=true` voor een echte `openai/gpt-5.4`-agentbeurt of
  `deep_profile=true` voor Kova CPU-/heap-/trace-artefacten. Dagelijkse geplande runs
  publiceren mock-provider-, deep-profile- en GPT 5.4-lane-artefacten naar
  `openclaw/clawgrit-reports` wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd. Het
  mock-provider-rapport bevat ook source-level Gateway-boot-, geheugen-,
  plugin-pressure-, herhaalde fake-model hello-loop- en CLI-opstartcijfers.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt uit plus een kleine file-read-achtige probe.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine image-beurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, inclusief aparte Docker live model-matrixjobs
    die per provider zijn geshard.
  - Voor gerichte CI-reruns dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe providersecrets met hoog signaal toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-callers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live-lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert vervolgens dat een gewone reply en een image-attachment
    via de native plugin-binding routeren in plaats van ACP.
- Codex app-server harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de Plugin-beheerde Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Codex on-demand install-smoke: `pnpm test:docker:codex-on-demand`
  - Installeert de verpakte OpenClaw-tarball in Docker, voert OpenAI API-key-onboarding uit,
    en verifieert dat de Codex-Plugin plus `@openai/codex`-dependency
    on demand naar de beheerde npm-root zijn gedownload.
- Live plugin tool dependency-smoke: `pnpm test:docker:live-plugin-tool`
  - Pakt een fixture-Plugin met een echte `slugify`-dependency, installeert deze via
    `npm-pack:`, verifieert de dependency onder de beheerde npm-root, en vraagt daarna een
    live OpenAI-model om de plugin-tool aan te roepen en de verborgen slug terug te geven.
- Crestodian rescue command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders-check voor het message-channel rescue command-oppervlak.
    Deze oefent `/crestodian status`, zet een persistente modelwijziging in de wachtrij,
    antwoordt `/crestodian yes`, en verifieert het audit-/config-write-pad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner fallback wordt vertaald naar een geaudite typed
    config write.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup/model/agent/Discord Plugin + SecretRef-writes toe,
    valideert config, en verifieert auditvermeldingen. Hetzelfde Ring 0-setup-pad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost-smoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit, en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef dan de voorkeur aan het versmallen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI voert QA Lab uit in toegewezen workflows. Agentic parity is genest onder
`QA-Lab - All Lanes` en releasevalidatie, niet als een zelfstandige PR-workflow.
Brede validatie moet `Full Release Validation` gebruiken met
`rerun_group=qa-parity` of de release-checks QA-groep. Stabiele/standaard releasechecks
houden uitputtende live/Docker-soak achter `run_release_soak=true`; het
`full`-profiel forceert soak aan. `QA-Lab - All Lanes`
draait 's nachts op `main` en vanuit handmatige dispatch met de mock parity-lane, live
Matrix-lane, Convex-beheerde live Telegram-lane en Convex-beheerde live Discord
-lane als parallelle jobs. Geplande QA- en releasechecks geven Matrix
`--profile fast` expliciet mee, terwijl de Matrix CLI en handmatige workflowinvoer
standaard `all` blijven; handmatige dispatch kan `all` sharden naar `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release
Checks` voert parity plus de snelle Matrix- en Telegram-lanes uit vóór releasegoedkeuring,
met `mock-openai/gpt-5.5` voor release-transportchecks zodat ze deterministisch blijven
en normale provider-plugin-opstart vermijden. Deze live transport-Gateways
schakelen memory search uit; geheugengedrag blijft gedekt door de QA parity
-suites.

Full release live media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` heeft. Docker live model/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die één keer per geselecteerde
commit wordt gebouwd, en halen deze vervolgens op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Eindigt met een niet-nul exitcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenariobewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-pluginproef uit via QA Lab. Het
    installeert het externe Kitchen Sink-pakket, verifieert de inventaris van het plugin SDK-oppervlak,
    test `/healthz` en `/readyz`, registreert Gateway CPU/RSS-
    bewijs, voert een live OpenAI-beurt uit en controleert vijandige diagnostiek.
    Vereist live OpenAI-authenticatie zoals `OPENAI_API_KEY`. In gehydrateerde Testbox-
    sessies gebruikt het automatisch het Testbox live-authprofiel wanneer de
    `openclaw-testbox-env`-helper aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-opstartbenchmark uit plus een klein mock-QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hete CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte opstartpieken als metrieken worden geregistreerd
    zonder te lijken op de minutenlange Gateway-pegregressie.
  - Gebruikt gebouwde `dist`-artefacten; voer eerst een build uit wanneer de checkout nog geen
    verse runtime-uitvoer heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelkeuzevlaggen als `qa suite`.
  - Live-runs geven de ondersteunde QA-authinvoer door die praktisch is voor de guest:
    env-gebaseerde providersleutels, het QA live-providerconfiguratiepad en `CODEX_HOME`
    wanneer aanwezig.
  - Uitvoermappen moeten onder de repo-root blijven zodat de guest via
    de gemounte workspace kan terugschrijven.
  - Schrijft het normale QA-rapport + samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorachtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert die globaal in
    Docker, voert niet-interactieve OpenAI API-sleutel-onboarding uit, configureert standaard Telegram,
    verifieert dat de verpakte plugin-runtime laadt zonder afhankelijkheidsherstel bij het opstarten,
    voert doctor uit en voert één lokale agentbeurt uit tegen een
    gemockt OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoketest van de gebouwde app uit voor ingebedde runtimecontext-
    transcripties. Het verifieert dat verborgen OpenClaw-runtimecontext wordt opgeslagen als een
    niet-weergegeven aangepast bericht in plaats van te lekken in de zichtbare gebruikersbeurt,
    seedt vervolgens een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` die herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een kandidaat-OpenClaw-pakket in Docker, voert installed-package-
    onboarding uit, configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT Gateway.
  - De wrapper mount alleen de `qa-lab`-harnessbron vanuit de checkout; het
    geïnstalleerde pakket bezit `dist`, `openclaw/plugin-sdk` en gebundelde plugin-
    runtime, zodat de lane geen huidige checkout-plugins mengt in het pakket
    dat wordt getest.
  - Gebruikt standaard `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het registry
    een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-envreferenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert Telegram- of Convex-referentie-env op de host voordat
    Docker-build-/installatiewerk begint. Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    alleen in wanneer je bewust pre-credential setup debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-referentieleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor productbewijs als side-run
  tegen één kandidaatpakket. Het accepteert een vertrouwde ref, gepubliceerde npm-specificatie,
  HTTPS-tarball-URL plus SHA-256, of tarball-artefact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test` en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of aangepaste
  lane-profielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow uit te voeren tegen hetzelfde `package-under-test`-artefact.
  - Nieuwste beta-productbewijs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bewijs met exacte tarball-URL vereist een digest:

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
    met OpenAI geconfigureerd en schakelt daarna gebundelde channels/plugins in via configuratie-
    bewerkingen.
  - Verifieert dat setup-detectie ongeconfigureerde downloadbare plugins afwezig laat,
    dat de eerste geconfigureerde doctor-reparatie elke ontbrekende downloadbare
    plugin expliciet installeert en dat een tweede herstart geen verborgen afhankelijkheids-
    herstel uitvoert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd en verifieert dat de
    doctor na de update van de kandidaat oude plugin-afhankelijkheidsresten opruimt zonder een
    harness-side postinstall-reparatie.
- `pnpm test:parallels:npm-update`
  - Voert de native packaged-install update-smoke uit over Parallels-guests. Elk
    geselecteerd platform installeert eerst het aangevraagde baselinepakket, voert daarna de
    geïnstalleerde `openclaw update`-opdracht uit in dezelfde guest en verifieert de
    geïnstalleerde versie, updatestatus, Gateway-gereedheid en één lokale agent-
    beurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één guest. Gebruik `--json` voor het samenvattingsartefactpad en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live agentbeurtbewijs.
    Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-time-out zodat vastgelopen Parallels-transport
    niet de rest van het testvenster kan verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastloopt.
  - Windows-update kan op een koude guest 10 tot 15 minuten besteden aan post-update doctor en pakket-
    updatewerk; dat is nog steeds gezond wanneer de geneste npm-
    debuglog voortgang laat zien.
  - Voer deze aggregaatwrapper niet parallel uit met individuele Parallels-
    macOS-, Windows- of Linux-smokelanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of Gateway-status van de guest.
  - Het post-updatebewijs gebruikt het normale gebundelde plugin-oppervlak, omdat
    capability-facades zoals spraak, beeldgeneratie en media-
    begrip worden geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt
    zelf alleen een eenvoudige tekstreactie controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoke-
    tests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout - packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, env-vars en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit env.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om pooled leases te gebruiken.
  - Standaarden dekken canary, mention-gating, command-adressering, `/status`, bot-naar-bot genoemde antwoorden en core native command-antwoorden. `mock-openai`-standaarden dekken ook deterministische reply-chain- en Telegram final-message streaming-regressies. Gebruik `--list-scenarios` voor optionele probes zoals `session_status`.
  - Eindigt met een niet-nul exitcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Vereist twee afzonderlijke bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam exposeert.
  - Schakel voor stabiele bot-naar-botobservatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driverbot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artefact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het geobserveerde SUT-antwoord.

`Mantis Telegram Live` is de PR-bewijswrapper rond deze lane. Deze voert de
kandidaat-ref uit met door Convex geleasede Telegram-referenties, rendert het geredigeerde
observed-message-transcript in een Crabbox-desktopbrowser, neemt MP4-bewijs op,
genereert een bewegingsgetrimde GIF, uploadt de artefactbundel en plaatst inline PR-
bewijs via de Mantis GitHub App wanneer `pr_number` is ingesteld. Maintainers kunnen
deze starten vanuit de Actions-UI via `Mantis Scenario` (`scenario_id:
telegram-live`) of rechtstreeks vanuit een pull request-commentaar:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` is de agentic native Telegram Desktop-
voor/na-wrapper voor visueel PR-bewijs. Start deze vanuit de Actions-UI met
vrije `instructions`, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), of vanuit een PR-commentaar:

```text
@Mantis telegram desktop proof
```

De Mantis-agent leest de PR, bepaalt welk voor Telegram zichtbaar gedrag de
wijziging bewijst, voert de Crabbox Telegram Desktop-prooflane met echte gebruiker
uit op baseline- en kandidaatrefs, itereert totdat de native GIF's bruikbaar zijn,
schrijft een gekoppeld `motionPreview`-manifest en plaatst dezelfde GIF-tabel met
2 kolommen via de Mantis GitHub App wanneer `pr_number` is ingesteld.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least of hergebruikt een Crabbox Linux-desktop, installeert native Telegram Desktop, configureert OpenClaw met een geleased Telegram SUT-bottoken, start de Gateway en neemt screenshot-/MP4-bewijs op vanaf de zichtbare VNC-desktop.
  - Standaardwaarde is `--credential-source convex`, zodat workflows alleen het Convex-brokergeheim nodig hebben. Gebruik `--credential-source env` met dezelfde `OPENCLAW_QA_TELEGRAM_*`-variabelen als `pnpm openclaw qa telegram`.
  - Telegram Desktop heeft nog steeds een gebruikerslogin/-profiel nodig. Het bottoken configureert alleen OpenClaw. Gebruik `--telegram-profile-archive-env <name>` voor een base64 `.tgz`-profielarchief, of gebruik `--keep-lease` en log eenmalig handmatig in via VNC.
  - Schrijft `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` en `telegram-desktop-builder.mp4` onder de uitvoermap.

Live transportlanen delen één standaardcontract zodat nieuwe transports niet afwijken; de dekkingsmatrix per lane staat in [QA-overzicht → Live transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-inloggegevens via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
live transport-QA, verkrijgt QA lab een exclusieve lease uit een door Convex ondersteunde pool, stuurt heartbeats voor die
lease terwijl de lane draait en geeft de lease vrij bij afsluiten. De sectienaam dateert van voor
ondersteuning voor Discord, Slack en WhatsApp; het leasecontract wordt gedeeld door alle soorten.

Referentiescaffold voor Convex-project:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van inloggegevensrol:
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

Adminopdrachten voor maintainers (pool toevoegen/verwijderen/lijsten) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-helpers voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live runs om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en admin-/list-bereikbaarheid te controleren zonder
geheimwaarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Aanvraag: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Geslaagd: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Geslaagd: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Aanvraag: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainergeheim)
  - Aanvraag: `{ kind, actorId, payload, note?, status? }`
  - Geslaagd: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Aanvraag: `{ credentialId, actorId }`
  - Geslaagd: `{ status: "ok", changed, credential }`
  - Actieve-leasebeveiliging: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Aanvraag: `{ kind?, status?, includePayload?, limit? }`
  - Geslaagd: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-soort:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en wijst verkeerd gevormde payloads af.

Payloadvorm voor Telegram-soort met echte gebruiker:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` en `telegramApiId` moeten numerieke strings zijn.
- `tdlibArchiveSha256` en `desktopTdataArchiveSha256` moeten SHA-256-hexstrings zijn.
- `kind: "telegram-user"` vertegenwoordigt één Telegram-burneraccount. Behandel de lease als accountbreed: de TDLib CLI-driver en de visuele getuige van Telegram Desktop herstellen vanuit dezelfde payload, en slechts één job mag de lease tegelijk hebben.

Leaseherstel voor Telegram met echte gebruiker:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Gebruik het herstelde Desktop-profiel met `Telegram -workdir "$tmp/desktop"` wanneer een visuele opname nodig is. In lokale operatoromgevingen leest `scripts/e2e/telegram-user-credential.ts` standaard `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` als proces-env-vars ontbreken.

Agentgestuurde Crabbox-sessie:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` least de `telegram-user`-inloggegevens, herstelt hetzelfde account in
TDLib en Telegram Desktop op een Crabbox Linux-desktop, start een lokale mock-SUT-
Gateway vanuit de huidige checkout, opent de zichtbare Telegram-chat, start
desktopopname en schrijft een private `session.json`. Terwijl de sessie
actief is, kan een agent blijven testen tot het resultaat voldoet:

- `send --session <file> --text <message>` verzendt via de echte TDLib-gebruiker en wacht op het SUT-antwoord.
- `run --session <file> -- <remote command>` voert een willekeurige opdracht uit op de Crabbox en slaat de uitvoer op, bijvoorbeeld `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` legt de huidige zichtbare desktop vast.
- `status --session <file>` drukt de lease en WebVNC-opdracht af.
- `finish --session <file>` stopt de recorder, legt screenshot-/video-/motion-trim-artefacten vast, geeft de Convex-inloggegevens vrij, stopt lokale SUT-processen en stopt de Crabbox-lease tenzij `--keep-box` is meegegeven.
- `publish --session <file> --pr <number>` publiceert standaard een PR-commentaar met alleen GIF's. Geef `--full-artifacts` alleen mee wanneer logs of JSON-artefacten bewust nodig zijn.

Geef voor deterministische visuele repro's `--mock-response-file <path>` door aan `start`
of aan de eenopdracht-`probe`-shorthand. De runner gebruikt standaard een standaard
Crabbox-klasse, opname met 24fps, motion-GIF-previews met 24fps en 1920px GIF-
breedte. Overschrijf dit met `--class`, `--record-fps`, `--preview-fps` en
`--preview-width` alleen wanneer het bewijs andere opname-instellingen nodig heeft.

Crabbox-proof met één opdracht:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

De standaardopdracht `probe` is shorthand voor één start/send/finish-cyclus. Gebruik
deze voor een snelle `/status`-smoke. Gebruik de sessieopdrachten voor PR-review,
bugreproductiewerk of elk geval waarin de agent minuten aan willekeurige
experimenten nodig heeft voordat kan worden besloten dat het bewijs compleet is. Gebruik `--id <cbx_...>` om
een warme desktoplease te hergebruiken, `--keep-box` om VNC open te houden na finish,
`--desktop-chat-title <name>` om de zichtbare chat te kiezen en `--tdlib-url <tgz>`
wanneer een voorgebakken Linux-`libtdjson.so`-archief wordt gebruikt in plaats van TDLib te bouwen op
een verse box. De runner verifieert `--tdlib-url` met `--tdlib-sha256 <hex>` of,
standaard, met een aangrenzend `<url>.sha256`-bestand.

Door broker gevalideerde payloads voor meerdere kanalen:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-lanen kunnen ook uit de pool leasen, maar Slack-payloadvalidatie bevindt zich momenteel
in de Slack QA-runner in plaats van de broker. Gebruik
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
voor Slack-rijen.

### Een kanaal toevoegen aan QA

De architectuur en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>` en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als "toenemend realisme" (en toenemende flakiness/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Config: ongerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-project-shards uitbreiden naar per-project-configs voor parallelle planning
- Bestanden: core-/unitinventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Scope:
  - Zuivere unittests
  - In-process integratietests (Gateway-auth, routering, tooling, parsing, config)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte gebundelde Plugin-bron-API's. Echte Plugin-API-loads horen thuis in
    door de Plugin beheerde contract-/integratiesuites.

Beleid voor native dependencies:

- Standaard testinstallaties slaan optionele native Discord opus-builds over. Discord-spraakontvangst gebruikt de pure-JS `opusscript`-decoder, en `@discordjs/opus` blijft uitgeschakeld in `allowBuilds`, zodat lokale tests en Testbox-banen de native add-on niet compileren.
- Gebruik een speciale Discord-spraakprestatiebaan of live-baan als je bewust een native opus-build moet vergelijken. Zet `@discordjs/opus` niet op `true` in de standaard `allowBuilds`; daardoor gaan niet-gerelateerde installatie-/testlussen native code compileren.

<AccordionGroup>
  <Accordion title="Projecten, shards en gescopeerde banen">

    - Een ongerichte `pnpm test` voert twaalf kleinere shardconfiguraties uit (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één gigantisch native root-projectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat werk voor automatisch antwoorden/extensies niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een watch-lus met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via gescopeerde banen, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het root-project vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope gescopeerde banen: directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronmappingen en lokale importgraaf-afhankelijken. Configuratie-, setup- en package-bewerkingen voeren tests niet breed uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale checkpoort voor smal werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de bijbehorende typecheck-, lint- en guard-commando's uit. Het voert geen Vitest-tests uit; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Versiebumpen die alleen releasemetadata raken voeren gerichte versie-/configuratie-/root-afhankelijkheidschecks uit, met een guard die package-wijzigingen buiten het topniveauversieveld afwijst.
    - Bewerkingen aan de live Docker ACP-harnas voeren gerichte checks uit: shellsyntaxis voor de live Docker-authscripts en een dry-run van de live Docker-scheduler. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; afhankelijkheids-, export-, versie- en andere package-oppervlaktebewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unit-tests uit agents, commando's, plugins, helpers voor automatisch antwoorden, `plugin-sdk` en vergelijkbare pure utility-gebieden gaan via de `unit-fast`-baan, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande banen.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden mappen gewijzigde-modusruns ook naar expliciete naastgelegen tests in die lichte banen, zodat helperbewerkingen niet de volledige zware suite voor die directory opnieuw hoeven uit te voeren.
    - `auto-reply` heeft speciale buckets voor core-helpers op topniveau, `reply.*`-integratietests op topniveau en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder op in shards voor agent-runner, dispatch en commando-/state-routing, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extensiebatchcontrole en de release-only `agentic-plugins`-shard over. Volledige Release Validation dispatcht de afzonderlijke `Plugin Prerelease`-childworkflow voor die plugin-/extensie-intensieve suites op releasekandidaten.

  </Accordion>

  <Accordion title="Dekking van embedded runner">

    - Wanneer je discovery-invoer voor berichttools of runtimecontext voor Compaction
      wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatie-
      grenzen.
    - Houd de embedded-runner-integratiesuites gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat gescopeerde id's en Compaction-gedrag nog steeds
      door de echte `run.ts`- / `compact.ts`-paden stromen; tests met alleen helpers zijn
      geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Standaarden voor Vitest-pool en isolatie">

    - De basis-Vitest-configuratie gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner voor de root-projecten, e2e en live-configuraties.
    - De root-UI-baan behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de
      gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-
      standaarden uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compilatiechurn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architectuurbanen een diff activeert.
    - De pre-commit-hook is alleen voor formattering. Deze staged geformatteerde bestanden opnieuw en
      voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit voor overdracht of push wanneer je
      de slimme lokale checkpoort nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope gescopeerde banen. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      besluit dat een harnas-, configuratie-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routing-
      gedrag, alleen met een hogere workerlimiet.
    - Automatische schaling van lokale workers is bewust conservatief en schaalt terug
      wanneer de host-load average al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade aanrichten.
    - De basis-Vitest-configuratie markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat reruns in gewijzigde modus correct blijven wanneer test-
      bedrading verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profilering.

  </Accordion>

  <Accordion title="Prestatie-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-rapportage voor importduur plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` scoped dezelfde profileringsweergave naar
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs van de volledige configuratie gebruiken het configuratiepad als sleutel; CI-shards met
      include-pattern voegen de shardnaam toe, zodat gefilterde shards afzonderlijk kunnen worden gevolgd.
    - Wanneer één hete test nog steeds het grootste deel van zijn tijd kwijt is aan opstartimports,
      houd dan zware afhankelijkheden achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze door `vi.mock(...)` te halen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native root-projectpad voor die gecommitte diff en drukt wandtijd plus macOS max RSS af.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      vuile tree door de gewijzigdebestandenlijst via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main thread voor
      Vitest-/Vite-opstart- en transformatie-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+-heap-profielen voor de
      unit-suite met bestandsparallelisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte loopback-Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische gatewaybericht-, geheugen- en grote-payload-churn door het diagnostische eventpad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostische stabiliteitsbundels
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het drukbudget blijven en wachtrijdiepten per sessie terug naar nul leeglopen
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle baan voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en E2E-tests voor gebundelde plugins onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Handige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van gateways met meerdere instanties
  - WebSocket-/HTTP-oppervlakken, nodekoppeling en zwaardere netwerking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unit-tests (kan trager zijn)

### E2E: OpenShell-backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canoniek bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testgateway en sandbox
- Handige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en livetests voor gebundelde Plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Scope:
  - "Werkt deze provider/dit model _vandaag_ echt met echte referenties?"
  - Vang providerformaatwijzigingen, eigenaardigheden bij tool-calling, authenticatieproblemen en gedrag rond snelheidslimieten op
- Verwachtingen:
  - Niet CI-stabiel naar ontwerp (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt snelheidslimieten
  - Geef de voorkeur aan beperkte subsets in plaats van "alles"
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze configuratie-/authenticatiemateriaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen muteren.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat livetests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt Gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (provider-specifiek): stel `*_API_KEYS` in met komma-/puntkommaformaat of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live-override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij snelheidslimietreacties.
- Voortgangs-/Heartbeat-uitvoer:
  - Livesuites sturen nu voortgangsregels naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapturing stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/Gateway-voortgangsregels tijdens live-runs direct streamen.
  - Stem direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: draai `pnpm test` (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- "mijn bot is offline" / provider-specifieke fouten / tool-calling debuggen: draai een beperkte `pnpm test:live`

## Live (netwerk aanrakende) tests

Voor de live-modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harness en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - plus referentieafhandeling voor live-runs - zie
[Live suites testen](/nl/help/testing-live). Voor de speciale checklist voor updates en
Plugin-validatie, zie
[Updates en Plugins testen](/nl/help/testing-updates-plugins).

## Docker-runners (optionele controles "werkt in Linux")

Deze Docker-runners vallen uiteen in twee groepen:

- Live-model-runners: `test:docker:live-models` en `test:docker:live-gateway` draaien alleen hun bijpassende profile-key-livebestand binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configdirectory en workspace worden gemount (en `~/.profile` wordt gesourced als die is gemount). De bijpassende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smoke-limiet, zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live Docker-image eenmaal via `test:docker:live-build`, verpakt OpenClaw eenmaal als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor built-app-functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregatie gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` beheert processlots, terwijl resourceplafonds voorkomen dat zware live-, npm-install- en multi-service-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve plafonds, kan de scheduler die alsnog starten wanneer de pool leeg is en hem daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stem `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen af wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, slaat timings van succesvolle lanes op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of te draaien, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, pakket-/imagebehoeften en referenties te printen.
- `Package Acceptance` is de GitHub-native pakketpoort voor "werkt deze installeerbare tarball als product?" Het lost één kandidaatpakket op uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt dit als `package-under-test` en draait daarna de herbruikbare Docker E2E-lanes tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. Profielen zijn geordend op breedte: `smoke`, `package`, `product` en `full`. Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/Plugin-contract, de published-upgrade-survivor-matrix, release-standaarden en fouttriage.
- Build- en releasecontroles draaien `scripts/check-cli-bootstrap-imports.mjs` na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-opstart pakketdependencies zoals Commander, prompt-UI, undici of logging vóór commandodispatch importeert; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en wijst statische imports van bekende koude Gateway-paden af. Packaged CLI-smoke dekt ook root help, onboard help, doctor help, status, config-schema en een model-list-opdracht.
- Legacy-compatibiliteit van Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert de harness alleen metadatahiaten van verzonden pakketten: weggelaten privé-QA-inventarisitems, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de van tarball afgeleide git-fixture, ontbrekende persistente `update.channel`, verouderde locaties voor Plugin-install-records, ontbrekende persistente marketplace-install-records en configuratiemetadata-migratie tijdens `plugins update`. Voor pakketten na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten een of meer echte containers en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is beperkt) en kopiëren die daarna vóór de run naar de container-home, zodat externe CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoke: `pnpm qa:otel:smoke` is een private QA-broncheckout-lane. Deze maakt bewust geen deel uit van Docker-release-lanes voor pakketten, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball onboarding/kanaal/agent-smoke: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, voert doctor uit en voert één gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Skill-install-smoke: `pnpm test:docker:skill-install` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt geüploade archiefinstallaties uit in de configuratie, lost de huidige live ClawHub-skill-slug op vanuit zoeken, installeert deze met `openclaw skills install` en verifieert de geïnstalleerde skill plus `.clawhub`-origin/lock-metadata.
- Updatekanaalwissel-smoke: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt over van pakket `stable` naar git `dev`, verifieert dat het vastgelegde kanaal en Plugin-post-update werken, schakelt daarna terug naar pakket `stable` en controleert de updatestatus.
- Upgrade-survivor-smoke: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vervuilde old-user-fixture met agents, kanaalconfiguratie, Plugin-allowlists, verouderde Plugin-afhankelijkheidsstatus en bestaande workspace-/sessiebestanden. Het voert package update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Published upgrade survivor-smoke: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische existing-user-bestanden, configureert die baseline met een ingebakken opdrachtrecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert geconfigureerde intents, statusbehoud, startup, `/healthz`, `/readyz` en RPC-statusbudgetten. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, vraag de aggregate scheduler om exacte lokale baselines uit te vouwen met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en vouw issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; de set reported-issues bevat `configured-plugin-installs` voor automatische reparatie van externe OpenClaw-Plugin-installaties. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, lost meta-baseline-tokens op zoals `last-stable-4` of `all-since-2026.4.23`, en Full Release Validation breidt de release-soak package-gate uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Session runtime context-smoke: `pnpm test:docker:session-runtime-context` verifieert transcriptpersistentie van verborgen runtimecontext plus doctor-reparatie van getroffen gedupliceerde prompt-rewrite-branches.
- Bun globale installatie-smoke: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde image providers retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker-smoke: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de root-, update- en direct-npm-containers. Update-smoke gebruikt standaard npm `latest` als de stable baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-input van de Install Smoke-workflow op GitHub. Niet-root-installercontroles houden een geïsoleerde npm-cache aan, zodat root-eigendom-cache-items lokaal installatiegedrag van gebruikers niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache opnieuw te gebruiken bij lokale reruns.
- Install Smoke CI slaat de dubbele direct-npm globale update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer directe `npm install -g`-dekking nodig is.
- Agents verwijderen gedeelde workspace CLI-smoke: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus behoud van workspace-gedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP-snapshot-smoke: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote clickables, iframe-refs en frame-metadata dekken.
- OpenAI Responses web_search minimal reasoning-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna de provider schema reject en controleert dat de ruwe details in Gateway-logs verschijnen.
- MCP-kanaalbrug (geseedde Gateway + stdio-brug + raw Claude notification-frame-smoke): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel MCP-tools (echte stdio MCP-server + ingebed Pi-profiel allow/deny-smoke): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP-cleanup (echte Gateway + teardown van stdio MCP-child na geïsoleerde Cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update-smoke voor lokaal pad, `file:`, npm-registry met gehoiste afhankelijkheden, git moving refs, ClawHub kitchen-sink, marketplace-updates en Claude-bundel enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixture-server.
- Plugin-update ongewijzigd-smoke: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-lifecycle-matrix-smoke: `pnpm test:docker:plugin-lifecycle-matrix` installeert de ingepakte OpenClaw-tarball in een bare container, installeert een npm-Plugin, schakelt enable/disable, upgrade en downgrade deze via een lokale npm-registry, verwijdert de geïnstalleerde code en verifieert daarna dat uninstall nog steeds verouderde status verwijdert terwijl RSS/CPU-metrics voor elke lifecycle-fase worden gelogd.
- Config reload metadata-smoke: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt install/update-smoke voor lokaal pad, `file:`, npm-registry met gehoiste afhankelijkheden, git moving refs, ClawHub-fixtures, marketplace-updates en Claude-bundel enable/inspect. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt resource-getrackte npm-Plugin-installatie, enable, disable, upgrade, downgrade en missing-code uninstall.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` blijven winnen wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een remote gedeelde image wijst, trekken de scripts deze binnen als die nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles, omdat ze package-/installatiegedrag valideren in plaats van de gedeelde built-app runtime.

De live-model Docker-runners koppelen de huidige checkout ook read-only als bind mount en
stagen die naar een tijdelijke workdir binnen de container. Dit houdt de runtime-
image slank, terwijl Vitest nog steeds tegen je exacte lokale broncode/configuratie draait.
De staging-stap slaat grote lokale-only caches en app-builduitvoer over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`- of
Gradle-uitvoerdirectories, zodat Docker-live-runs geen minuten besteden aan het kopiëren
van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-live-probes geen
echte Telegram/Discord/enz. channel-workers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-live-dekking vanuit die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een compatibiliteits-smoke op hoger niveau: het start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-eindpunten ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, meldt zich aan via
Open WebUI, verifieert dat `/api/models` `openclaw/default` exposeert, en stuurt daarna een
echt chatverzoek via Open WebUI's `/api/chat/completions`-proxy.
Stel `OPENWEBUI_SMOKE_MODE=models` in voor CI-controles op het releasepad die moeten stoppen
na aanmelding bij Open WebUI en modelontdekking, zonder te wachten op voltooiing door een live model.
De eerste run kan merkbaar trager zijn, omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-start-installatie moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in Docker-runs te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert daarna gerouteerde gespreksontdekking, transcriptreads, bijlagemetadata,
gedrag van de live-eventqueue, routering van uitgaande verzending, en Claude-achtige channel- en
permissiemeldingen over de echte stdio MCP-bridge. De meldingscontrole
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk uitzendt, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de ingebedde Pi-bundel
MCP-runtime, voert de tool uit, en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-model
sleutel nodig. Het start een geseede Gateway met een echte stdio MCP-probeserver, draait een
geïsoleerde Cron-turn en een `/subagents spawn` eenmalige child-turn, en verifieert daarna
dat het MCP-childproces na elke run afsluit.

Handmatige ACP-plain-language-thread-smoke (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadrouteringsvalidatie, dus verwijder het niet.

Nuttige env vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en gesourced voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` worden gesourced, met tijdelijke config-/workspacedirectories en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-authdirs/-bestanden onder `$HOME` worden read-only gekoppeld onder `/host-auth...`, en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaarddirs: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte providerruns koppelen alleen de benodigde dirs/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat credentials uit de profielstore komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke wordt geëxposeerd
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docs-controles uit na docswijzigingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook in-page heading-controles nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway-toolaanroepen (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevals (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als "agent reliability evals":

- Mock-toolaanroepen via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiebedrading en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt hij de vereiste stappen/args?
- **Workflowcontracten:** multi-turnscenario's die toolvolgorde, overdracht van sessiegeschiedenis en sandboxgrenzen afdwingen.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner die mockproviders gebruikt om toolaanroepen + volgorde, skillbestandsreads en sessiebedrading te controleren.
- Een kleine suite van skillgerichte scenario's (gebruiken vs vermijden, gating, promptinjectie).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en channelvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd channel voldoet aan het
interfacecontract. Ze itereren over alle ontdekte Plugins en voeren een suite van
vorm- en gedragsasserties uit. De standaard `pnpm test` unit-lane slaat deze gedeelde
seam- en smokebestanden bewust over; voer de contractcommando's expliciet uit
wanneer je gedeelde channel- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basis-Pluginvorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Gedrag van sessiebinding
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Channel-actionhandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channelstatusprobes
- **registry** - Vorm van Pluginregistry

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Pluginontdekking
- **loader** - Pluginladen
- **runtime** - Providerruntime
- **shape** - Pluginvorm/interface
- **wizard** - Setupwizard

### Wanneer uitvoeren

- Na het wijzigen van plugin-sdk-exports of subpaths
- Na het toevoegen of wijzigen van een channel- of provider-Plugin
- Na het refactoren van Pluginregistratie of -ontdekking

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijn)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte transformatie van de requestvorm vast)
- Als het inherent live-only is (rate limits, authbeleid), houd de livetest dan smal en opt-in via env vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - provider-requestconversie-/replaybug → directe modeltest
  - Gateway-sessie-/geschiedenis-/toolpipelinebug → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversalguardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled target per SecretRef-klasse af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat exec-id's met traversal-segmenten worden geweigerd.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target-id's, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
