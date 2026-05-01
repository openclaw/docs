---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testkit: unit-/e2e-/live-suites, Docker-runners en wat elke test bestrijkt'
title: Testen
x-i18n:
    generated_at: "2026-05-01T11:19:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke opdrachten je uitvoert voor veelvoorkomende workflows (lokaal, vóór pushen, debuggen).
- Hoe live tests referenties ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor model-/providerproblemen uit de praktijk.

<Note>
**QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, opdrachtenoppervlak, scenario-authoring.
- [Matrix QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transport-Plugin die wordt gebruikt door repo-backed scenario's.

Deze pagina behandelt het draaien van de reguliere testsuites en Docker/Parallels-runners. De QA-specifieke runnerssectie hieronder ([QA-specifieke runners](#qa-specific-runners)) somt de concrete `qa`-aanroepen op en verwijst terug naar de referenties hierboven.
</Note>

## Snel starten

Op de meeste dagen:

- Volledige gate (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige-suiterun op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandstargeting routeert nu ook extension-/channel-paden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één fout itereert.
- Docker-backed QA-site: `pnpm qa:lab:up`
- Linux VM-backed QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests wijzigt of extra zekerheid wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte referenties):

- Live suite (modellen + gateway-tool-/imageprobes): `pnpm test:live`
- Richt je stil op één live bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model-sweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt uit plus een kleine file-read-achtige probe.
    Modellen waarvan de metadata `image`-invoer adverteert, voeren ook een kleine imagebeurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, wat aparte Docker live model
    matrixjobs bevat, geshard per provider.
  - Voor gerichte CI-reruns, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe providersgeheimen met hoge signaalwaarde toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-aanroepers ervan.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Draait een Docker live-lane tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, voert `/codex fast` en
    `/codex permissions` uit, en verifieert daarna dat een gewone reply en een imagebijlage
    via de native Plugin-binding lopen in plaats van ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Draait Gateway-agentbeurten via de Plugin-owned Codex app-server harness,
    verifieert `/codex status` en `/codex models`, en test standaard image,
    cron MCP, sub-agent en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agent-check, schakel de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in gordel-en-bretels-check voor het message-channel rescue command-
    oppervlak. Deze oefent `/crestodian status`, zet een persistente modelwijziging
    in de wachtrij, antwoordt `/crestodian yes`, en verifieert het audit-/config-schrijfpaden.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Draait Crestodian in een configloze container met een fake Claude CLI op `PATH`
    en verifieert dat de fuzzy planner-fallback wordt vertaald naar een geauditeerde getypte
    config-write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup/model/agent/Discord-Plugin + SecretRef-writes toe,
    valideert config en verifieert audit entries. Hetzelfde Ring 0-setuppad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-kostensmoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit, en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistant-transcript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je maar één falende case nodig hebt, geef de voorkeur aan het versmallen van live tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je QA-lab-realisme nodig hebt:

CI draait QA Lab in dedicated workflows. `Parity gate` draait op matchende PR's en
via handmatige dispatch met mockproviders. `QA-Lab - All Lanes` draait elke nacht op
`main` en via handmatige dispatch met de mock parity gate, live Matrix-lane,
Convex-managed live Telegram-lane en Convex-managed live Discord-lane als
parallelle jobs. Geplande QA- en releasechecks geven Matrix `--profile fast`
expliciet door, terwijl de Matrix CLI en handmatige workflowinvoerstandaard
`all` blijven; handmatige dispatch kan `all` sharden naar `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release Checks` draait parity plus
de snelle Matrix- en Telegram-lanes vóór releasegoedkeuring, met
`mock-openai/gpt-5.5` voor release-transportchecks zodat ze deterministisch blijven
en normale provider-Plugin-startup vermijden. Deze live transport-Gateways schakelen
memory search uit; memory-gedrag blijft gedekt door de QA parity-suites.

Volledige release live media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, die al
`ffmpeg` en `ffprobe` bevat. Docker live model/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>` image die eenmaal per geselecteerde
commit wordt gebouwd, en halen die dan op met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van opnieuw te bouwen
binnen elke shard.

- `pnpm openclaw qa suite`
  - Draait repo-backed QA-scenario's rechtstreeks op de host.
  - Draait meerdere geselecteerde scenario's standaard parallel met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal workers
    af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Stopt met non-zero wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder een falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-backed providerserver voor experimentele
    fixture- en protocol-mockdekking zonder de scenario-aware
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Draait de Gateway-startupbench plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hot CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte startup-pieken als metrics worden vastgelegd
    zonder te lijken op de minutenlange gateway peg-regressie.
  - Gebruikt gebouwde `dist`-artifacts; draai eerst een build wanneer de checkout nog geen
    verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Draait dezelfde QA-suite binnen een wegwerpbare Multipass Linux-VM.
  - Houdt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectieflags als `qa suite`.
  - Live runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de guest:
    env-based providersleutels, het QA live providerconfigpad, en `CODEX_HOME`
    wanneer aanwezig.
  - Outputdirs moeten onder de repo-root blijven zodat de guest kan terugschrijven via
    de gemounte workspace.
  - Schrijft het normale QA-rapport + samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-backed QA-site voor operator-achtige QA-werkzaamheden.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert die globaal in
    Docker, voert non-interactieve OpenAI API-key-onboarding uit, configureert standaard Telegram,
    verifieert dat het inschakelen van de Plugin runtime-dependencies on demand installeert,
    draait doctor, en draait één lokale agentbeurt tegen een gemockt OpenAI-
    endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install-
    lane met Discord te draaien.
- `pnpm test:docker:session-runtime-context`
  - Draait een deterministische built-app Docker smoke voor embedded runtimecontext-
    transcripts. Deze verifieert dat verborgen OpenClaw-runtimecontext wordt gepersisteerd als een
    non-display custom message in plaats van te lekken in de zichtbare user turn,
    seedt daarna een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` deze herschrijft naar de actieve branch met een backup.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, draait installed-package-
    onboarding, configureert Telegram via de geïnstalleerde CLI, en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT Gateway.
  - Standaard naar `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om een opgeloste lokale tarball te testen in plaats van
    uit de registry te installeren.
  - Gebruikt dezelfde Telegram-env-referenties of Convex-referentiebron als
    `pnpm openclaw qa telegram`. Voor CI-/releaseautomatisering, stel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim in. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions biedt deze lane aan als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-environment en Convex CI-referentieleases.
- GitHub Actions biedt ook `Package Acceptance` aan voor side-run productbewijs
  tegen één pakketkandidaat. Het accepteert een trusted ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artifact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test`, en draait daarna de
  bestaande Docker E2E-scheduler met smoke-, package-, product-, full- of custom
  lane-profielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artifact te draaien.
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

- `pnpm test:docker:bundled-channel-deps`
  - Pakt en installeert de huidige OpenClaw-build in Docker, start de Gateway
    met OpenAI geconfigureerd, en schakelt daarna gebundelde kanalen/plugins in via configuratie-
    wijzigingen.
  - Verifieert dat setupdetectie niet-geconfigureerde runtimeafhankelijkheden van plugins
    afwezig laat, dat de eerste geconfigureerde Gateway- of doctor-run elke gebundelde
    runtimeafhankelijkheid van een plugin op aanvraag installeert, en dat een tweede herstart geen
    afhankelijkheden opnieuw installeert die al waren geactiveerd.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat gebundelde runtimeafhankelijkheden van kanalen herstelt zonder een
    postinstall-herstel aan de harnaskant.
- `pnpm test:parallels:npm-update`
  - Voert de native smoke voor packaged-install-updates uit op Parallels-gasten. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna de
    geïnstalleerde opdracht `openclaw update` uit in dezelfde gast en verifieert de
    geïnstalleerde versie, updatestatus, gereedheid van de gateway en één lokale agent-
    beurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één gast. Gebruik `--json` voor het pad van het samenvattingsartefact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het live bewijs van de agentbeurt.
    Geef `--model <provider/model>` mee of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Verpak lange lokale runs in een host-time-out zodat vastgelopen Parallels-transporten niet
    de rest van het testvenster kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper vastloopt.
  - Windows-update kan 10 tot 15 minuten besteden aan post-update doctor-/runtime-
    afhankelijkheidsherstel op een koude gast; dat is nog steeds gezond wanneer het geneste
    npm-debuglog vordert.
  - Voer deze aggregaatwrapper niet parallel uit met afzonderlijke Parallels-
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketaanbieding of gatewaystatus van de gast.
  - Het post-update-bewijs voert het normale oppervlak van gebundelde plugins uit omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip worden
    geladen via gebundelde runtime-API's, zelfs wanneer de agentbeurt zelf alleen een eenvoudige
    tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe smoke-tests van het protocol.
- `pnpm openclaw qa matrix`
  - Voert de live Matrix-QA-lane uit tegen een wegwerpbare, Docker-backed Tuwunel-homeserver. Alleen source-checkout — packaged installs leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, omgevingsvariabelen en artefactindeling: [Matrix-QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de live Telegram-QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit de omgeving.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde referenties. Gebruik standaard de omgevingsmodus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Eindigt met een niet-nul exitcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder een falende exitcode.
  - Vereist twee afzonderlijke bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam blootstelt.
  - Schakel voor stabiele bot-tot-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram-QA-rapport, samenvatting en observed-messages-artefact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT vanaf het verzendverzoek van de driver tot het geobserveerde SUT-antwoord.

Live transport-lanes delen één standaardcontract zodat nieuwe transporten niet uiteenlopen; de dekkingsmatrix per lane staat in [QA-overzicht → Live transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA-lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeatt
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentie-scaffold voor Convex-project:

- `qa/convex-credential-broker/`

Vereiste omgevingsvariabelen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van referentierol:
  - CLI: `--credential-role maintainer|ci`
  - Standaard via omgeving: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele omgevingsvariabelen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback `http://` Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normale werking `https://` gebruiken.

Admin-opdrachten voor maintainers (pool toevoegen/verwijderen/lijsten) vereisen
specifiek `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-hulpen voor maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live runs om de Convex-site-URL, brokergeheimen,
endpointprefix, HTTP-time-out en bereikbaarheid van admin/list te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard endpointcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen maintainergeheim)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainergeheim)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainergeheim)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert misvormde payloads.

### Een kanaal aan QA toevoegen

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumeis: implementeer de transportrunner op de gedeelde `qa-lab`-host-seam, declareer `qaRunners` in het pluginmanifest, mount als `openclaw qa <runner>`, en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Beschouw de suites als “toenemend realistisch” (en met toenemende flakyheid/kosten):

### Unit / integratie (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de `vitest.full-*.config.ts`-shardset en kunnen multi-project-shards uitbreiden naar per-project-configuraties voor parallelle planning
- Bestanden: core-/unitinventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Bereik:
  - Zuivere unittests
  - In-process integratietests (gateway-authenticatie, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loadertests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine pluginfixtures, niet met
    echte bron-API's van gebundelde plugins. Echte plugin-API-loads horen thuis in
    plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test` voert twaalf kleinere shard-configuraties uit (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één enorm native root-project-proces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een multi-shard watch-loop niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` routeren expliciete bestands-/directorydoelen eerst via scoped lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het root-project vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope scoped lanes: directe testbewerkingen, aangrenzende `*.test.ts`-bestanden, expliciete bronmappings en lokale importgraaf-afhankelijken. Config-/setup-/package-bewerkingen voeren tests niet breed uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor smal werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, release-metadata, live Docker-tooling en tooling, en voert daarna de bijbehorende typecheck-, lint- en guard-commando's uit. Deze voert geen Vitest-tests uit; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Version bumps met alleen release-metadata voeren gerichte versie-/config-/root-dependency-checks uit, met een guard die package-wijzigingen buiten het versieveld op topniveau afwijst.
    - Bewerkingen aan de live Docker ACP-harness voeren gerichte checks uit: shell-syntaxis voor de live Docker-authscripts en een live Docker scheduler-dry-run. `package.json`-wijzigingen worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-surface-bewerkingen gebruiken nog steeds de bredere guards.
    - Import-lichte unit tests van agents, commando's, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden routeren via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde `plugin-sdk`- en `commands`-helperbronbestanden koppelen changed-mode-runs ook aan expliciete aangrenzende tests in die lichte lanes, zodat helperbewerkingen voorkomen dat de volledige zware suite voor die directory opnieuw wordt uitgevoerd.
    - `auto-reply` heeft specifieke buckets voor core-helpers op topniveau, `reply.*`-integratietests op topniveau en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in agent-runner-, dispatch- en commands/state-routing-shards, zodat één import-zware bucket niet de volledige Node-tail bezit.
    - Normale PR-/main-CI slaat bewust de extensie-batchsweep en de release-only `agentic-plugins`-shard over. Full Release Validation start de afzonderlijke `Plugin Prerelease`-child-workflow voor die plugin-/extensie-zware suites op release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Wanneer je discovery-invoer voor message-tools of Compaction-runtimecontext wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helper-regressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de embedded runner-integratiesuites gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat scoped ids en Compaction-gedrag nog steeds via de echte `run.ts`- / `compact.ts`-paden lopen; tests met alleen helpers zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie fixeert `isolate: false` en gebruikt de niet-geïsoleerde runner voor de root-projecten, e2e en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook op de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-standaarden van de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-processen om V8-compile-churn tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-gedrag.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` toont welke architecturale lanes een diff activeert.
    - De pre-commit-hook is alleen voor formattering. Deze staged geformatteerde bestanden opnieuw en voert geen lint, typecheck of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór overdracht of push wanneer je de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope scoped lanes. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent bepaalt dat een harness-, config-, package- of contractbewerking echt bredere Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag, alleen met een hogere workerlimiet.
    - Lokale worker-auto-scaling is bewust conservatief en schaalt terug wanneer de host-load-average al hoog is, zodat meerdere gelijktijdige Vitest-runs standaard minder schade aanrichten.
    - De basisconfiguratie van Vitest markeert de projecten/config-bestanden als `forceRerunTriggers`, zodat changed-mode-herhalingen correct blijven wanneer testbedrading wijzigt.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je één expliciete cachelocatie wilt voor directe profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` schakelt Vitest-importduurrapportage plus import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` scoped dezelfde profilingweergave naar bestanden die sinds `origin/main` zijn gewijzigd.
    - Shard-timingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs van volledige configuraties gebruiken het configuratiepad als sleutel; include-pattern-CI-shards voegen de shardnaam toe zodat gefilterde shards afzonderlijk kunnen worden gevolgd.
    - Wanneer één hot test nog steeds het grootste deel van zijn tijd besteedt aan opstartimports, houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en mock die seam direct in plaats van runtime-helpers diep te importeren alleen om ze door `vi.mock(...)` te halen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde `test:changed` met het native root-project-pad voor die gecommitte diff en print wall time plus macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige dirty tree door de lijst met gewijzigde bestanden via `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main thread voor Vitest-/Vite-opstart- en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft runner-CPU+-heapprofielen voor de unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start standaard een echte local loopback Gateway met diagnostiek ingeschakeld
  - Stuurt synthetische gateway-berichten, geheugen- en large-payload-churn via het diagnostische eventpad
  - Queryt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistentiehelpers voor diagnostic stability bundles
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure budget blijven en queue depths per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde-plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, passend bij de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Nuttige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Scope:
  - End-to-end-gedrag van gateways met meerdere instanties
  - WebSocket-/HTTP-surfaces, node pairing en zwaardere networking
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unit tests (kan trager zijn)

### E2E: OpenShell backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start via Docker een geïsoleerde OpenShell-gateway op de host
  - Maakt een sandbox vanuit een tijdelijke lokale Dockerfile
  - Oefent OpenClaw's OpenShell-backend via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canonical-bestandssysteemgedrag via de sandbox fs bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testgateway en sandbox
- Nuttige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig uitvoert
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapper-script te wijzen

### Live (echte providers + echte modellen)

- Commando: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en gebundelde-plugin-live-tests onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Scope:
  - “Werkt deze provider/dit model _vandaag_ daadwerkelijk met echte credentials?”
  - Vangt provider-formatwijzigingen, eigenaardigheden van tool-calling, auth-problemen en rate-limit-gedrag op
- Verwachtingen:
  - Bewust niet CI-stabiel (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Geef de voorkeur aan het uitvoeren van smallere subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te halen.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren ze config-/auth-materiaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen muteren.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkomma-indeling of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responses.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites emitten nu voortgangsregels naar stderr, zodat lange provider-calls zichtbaar actief zijn, zelfs wanneer Vitest-console-capture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/gateway-voortgangsregels direct streamen tijdens live-runs.
  - Stel direct-model-Heartbeats af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stel gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik uitvoeren?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Gateway-netwerken / WS-protocol / koppeling aanraken: voeg `pnpm test:e2e` toe
- “mijn bot is offline” / providerspecifieke fouten / toolaanroepen debuggen: voer een versmalde `pnpm test:live` uit

## Live-tests (met netwerktoegang)

Voor de live-modelmatrix, CLI-backend-smokes, ACP-smokes, Codex app-server
harness en alle live-tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus credential-afhandeling voor live-runs — zie
[Testing — live-suites](/nl/help/testing-live).

## Docker-runners (optionele “werkt in Linux”-checks)

Deze Docker-runners vallen uiteen in twee categorieën:

- Live-modelrunners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun bijbehorende live-bestand met profielsleutel uit binnen de repo-Docker-image (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), met je lokale configuratiemap en workspace gemount (en `~/.profile` gesourced als die is gemount). De bijbehorende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smokelimiet zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere, uitputtende scan wilt.
- `test:docker:all` bouwt de live-Docker-image één keer via `test:docker:live-build`, verpakt OpenClaw één keer als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor lanes met gebouwde-app-functionaliteit. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De aggregate gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multiservice-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en die daarna alleen laten draaien totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, slaat timings van geslaagde lanes op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om langere lanes bij latere runs eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan voor geselecteerde lanes, package/image-behoeften en credentials te printen.
- `Package Acceptance` is de GitHub-native package-gate voor “werkt deze installeerbare tarball als product?” Het lost één kandidaatpackage op uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt die als `package-under-test` en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. `workflow_ref` selecteert de vertrouwde workflow/harness-scripts, terwijl `package_ref` de source-commit/branch/tag selecteert om te verpakken wanneer `source=ref`; zo kan actuele acceptatielogica oudere vertrouwde commits valideren. Profielen zijn geordend op breedte: `smoke` is snelle installatie/channel/agent plus Gateway/config, `package` is het package/update/plugin-contract plus de keyless upgrade-survivor-fixture, de gepubliceerde baseline-upgrade-survivor-lane en de standaard native vervanging voor de meeste Parallels-package/update-dekking, `product` voegt MCP-kanalen, cron/subagent-opschoning, OpenAI web search en OpenWebUI toe, en `full` voert de Docker-chunks voor het releasepad uit met OpenWebUI. Voor `published-upgrade-survivor` gebruikt Package Acceptance altijd `package-under-test` als kandidaat en `published_upgrade_survivor_baseline` als de fallback-gepubliceerde baseline, standaard `openclaw@latest`; stel `published_upgrade_survivor_baselines=release-history` in om de lane te sharden over een gededupliceerde matrix van de laatste zes stabiele releases, `2026.4.23` en de laatste stabiele release vóór `2026-03-15`. De gepubliceerde lane configureert zijn baseline met een ingebakken `openclaw config set`-commandorecept en legt daarna receptstappen vast in de lanesamenvatting. Releasevalidatie voert een aangepaste packagedelta uit (`bundled-channel-deps-compat plugins-offline`) plus Telegram-package-QA, omdat de Docker-chunks voor het releasepad de overlappende package/update/plugin-lanes al dekken. Gerichte GitHub-Docker-reruncommando’s die uit artifacts worden gegenereerd, bevatten eerdere package-artifacts, voorbereide image-inputs en de lijst met published-upgrade-survivor-baselines wanneer beschikbaar, zodat mislukte lanes kunnen voorkomen dat package en images opnieuw worden gebouwd.
- Build- en releasechecks voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als pre-dispatch-startup packagedependencies zoals Commander, prompt-UI, undici of logging importeert vóór command dispatch; hij houdt ook de gebundelde Gateway-run-chunk binnen budget en weigert statische imports van bekende koude Gateway-paden. Packaged CLI-smoke dekt ook root help, onboard help, doctor help, status, config schema en een model-list-command.
- Legacy-compatibiliteit van Package Acceptance is begrensd op `2026.4.25` (inclusief `2026.4.25-beta.*`). Tot en met die grens tolereert de harness alleen metadatahiaten in verzonden packages: weggelaten private QA-inventoryvermeldingen, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de van de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy locaties voor plugin-install-records, ontbrekende persistentie van marketplace-install-records en config-metadatamigratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte fouten.
- Container-smokerunners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` en `test:docker:config-reload` starten één of meer echte containers en verifiëren integratiepaden op hoger niveau.

De live-model-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is versmald) en kopiëren die daarna vóór de run naar de container-home, zodat externe CLI-OAuth tokens kan verversen zonder de auth-store van de host te wijzigen:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoketest voor Codex app-server-harness: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-source-checkout-lane. Deze maakt bewust geen deel uit van de Docker-release-lanes voor pakketten, omdat de npm-tarball QA Lab weglaat.
- Open WebUI live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball onboarding/channel/agent-smoketest: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via env-ref-onboarding plus standaard Telegram, verifieert dat doctor geactiveerde runtime-afhankelijkheden van Plugins repareert, en voert een gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van channel met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update-channel-switch-smoketest: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, schakelt van package `stable` naar git `dev`, verifieert de opgeslagen channel en dat de Plugin na de update werkt, schakelt daarna terug naar package `stable` en controleert de updatestatus.
- Upgrade-survivor-smoketest: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vervuilde oude-gebruikersfixture met agents, channel-configuratie, Plugin-allowlists, verouderde runtime-deps-status van Plugins en bestaande workspace-/sessiebestanden. Het voert een package-update plus niet-interactieve doctor uit zonder live provider- of channel-keys, start daarna een loopback Gateway en controleert behoud van config/status plus startup-/statusbudgets.
- Gepubliceerde upgrade-survivor-smoketest: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikersbestanden, configureert die baseline met een ingebakken commandorecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback Gateway en controleert geconfigureerde intents, statusbehoud, startup, `/healthz`, `/readyz` en RPC-statusbudgets. Overschrijf een baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, laat de aggregate scheduler exacte baselines uitbreiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, en breid issue-vormige fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` zoals `reported-issues`; Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.
- Smoketest voor sessie-runtimecontext: `pnpm test:docker:session-runtime-context` verifieert persistente verborgen runtimecontext-transcripten plus doctor-reparatie van getroffen gedupliceerde prompt-rewrite-branches.
- Bun globale-installatie-smoketest: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert deze met `bun install -g` in een geïsoleerde home, en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt een npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de invoer `update_baseline_version` van de Install Smoke-workflow op GitHub. Niet-root-installercontroles behouden een geïsoleerde npm-cache zodat root-owned cachevermeldingen het gedrag van user-local installaties niet verhullen. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root/update/direct-npm-cache opnieuw te gebruiken bij lokale herhalingen.
- Install Smoke CI slaat de dubbele direct-npm global update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal uit zonder die env wanneer dekking voor directe `npm install -g` nodig is.
- CLI-smoketest voor agents verwijderen gedeelde workspace: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit, en verifieert geldige JSON plus gedrag waarbij de workspace behouden blijft. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de source-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit, en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote klikbare elementen, iframe-refs en framemetadata dekken.
- OpenAI Responses web_search minimal reasoning-regressie: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna dat de provider schema reject geeft en controleert dat het ruwe detail in Gateway-logs verschijnt.
- MCP-channelbridge (geseede Gateway + stdio-bridge + raw Claude notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundle MCP-tools (echte stdio MCP-server + ingebedde Pi-profiel allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP-cleanup (echte Gateway + teardown van stdio MCP-child na geïsoleerde Cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatiesmoketest, ClawHub kitchen-sink-install/uninstall, marketplace-updates, en Claude-bundle enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Smoketest voor ongewijzigde Plugin-update: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config-reload-metadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Gebundelde runtime-afhankelijkheden van Plugins: `pnpm test:docker:bundled-channel-deps` bouwt standaard een kleine Docker-runner-image, bouwt en pakt OpenClaw één keer op de host, en mount daarna die tarball in elk Linux-installatiescenario. Hergebruik de image met `OPENCLAW_SKIP_DOCKER_BUILD=1`, sla de host-rebuild over na een verse lokale build met `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, of wijs naar een bestaande tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. De volledige Docker-aggregate en release-path bundled-channel-chunks pre-packagen deze tarball één keer, en sharden daarna gebundelde channel-controles in onafhankelijke lanes, inclusief aparte update-lanes voor Telegram, Discord, Slack, Feishu, memory-lancedb en ACPX. Release-chunks splitsen channel-smoketests, update-targets en setup/runtime-contracten in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` en `bundled-channels-contracts`; de aggregate `bundled-channels`-chunk blijft beschikbaar voor handmatige herhalingen. De release-workflow splitst ook provider-installerchunks en gebundelde Plugin-install/uninstall-chunks; legacy `package-update`, `plugins-runtime` en `plugins-integrations`-chunks blijven aggregate aliassen voor handmatige herhalingen. Gebruik `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` om de channel-matrix te beperken wanneer de gebundelde lane direct wordt uitgevoerd, of `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` om het updatescenario te beperken. Docker-runs per scenario gebruiken standaard `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; het multi-target updatescenario gebruikt standaard `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. De lane verifieert ook dat `channels.<id>.enabled=false` en `plugins.entries.<id>.enabled=false` doctor-/runtime-dependency-reparatie onderdrukken.
- Beperk gebundelde runtime-afhankelijkheden van Plugins tijdens iteratie door niet-gerelateerde scenario's uit te schakelen, bijvoorbeeld:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` winnen nog steeds wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een remote gedeelde image wijst, halen de scripts deze op als hij nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze pakket-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model Docker-runners binden ook de huidige checkout read-only in en
stagen die in een tijdelijke workdir binnen de container. Dit houdt de runtime-
image slank terwijl Vitest nog steeds tegen je exacte lokale source/config
draait. De staging-stap slaat grote lokale caches en app-buildoutputs over,
zoals `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, en app-lokale `.build`-
of Gradle-outputmappen, zodat Docker live-runs geen minuten besteden aan het
kopiëren van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in zodat gateway live-probes geen
echte Telegram/Discord/etc. channel-workers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je gateway live-dekking vanuit die Docker
lane wilt beperken of uitsluiten.
`test:docker:openwebui` is een smoke-test voor compatibiliteit op hoger niveau:
die start een OpenClaw gateway-container met de OpenAI-compatibele HTTP-
endpoints ingeschakeld, start een gepinde Open WebUI-container tegen die gateway,
meldt zich aan via Open WebUI, verifieert dat `/api/models` `openclaw/default`
blootstelt, en stuurt vervolgens een echt chatverzoek via Open WebUI's
`/api/chat/completions`-proxy.
De eerste run kan merkbaar trager zijn omdat Docker mogelijk de Open WebUI-image
moet ophalen en Open WebUI mogelijk de eigen cold-startconfiguratie moet
afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(`~/.profile` standaard) is de primaire manier om die in Dockerized runs te
leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is bewust deterministisch en heeft geen echt
Telegram-, Discord- of iMessage-account nodig. Het boot een geseede Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert vervolgens gerouteerde conversiedetectie, transcript-reads,
bijlagemetadata, gedrag van de live-eventqueue, outbound send-routing, en
Claude-stijl channel- en permissionmeldingen via de echte stdio MCP-bridge. De
notificatiecheck inspecteert de ruwe stdio MCP-frames direct, zodat de smoke-
test valideert wat de bridge werkelijk emit, niet alleen wat een specifieke
client-SDK toevallig zichtbaar maakt.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-
probe-server binnen de container, materialiseert die server via de embedded Pi
bundle MCP-runtime, voert de tool uit, en verifieert vervolgens dat `coding` en
`messaging` `bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny:
["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-modelsleutel
nodig. Het start een geseede Gateway met een echte stdio MCP-probe-server, draait
een geïsoleerde cron-turn en een `/subagents spawn` one-shot child-turn, en
verifieert vervolgens dat het MCP-childproces na elke run wordt afgesloten.

Handmatige ACP plain-language thread-smoke (niet CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP thread-routingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gemount naar `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gemount naar `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gemount naar `/home/node/.profile` en gesourced voordat tests draaien
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspace-mappen en zonder externe CLI-auth-mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gemount naar `/home/node/.npm-global` voor gecachete CLI-installaties binnen Docker
- Externe CLI-auth-mappen/-bestanden onder `$HOME` worden read-only gemount onder `/host-auth...`, en vervolgens gekopieerd naar `/home/node/...` voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Beperkte provider-runs mounten alleen de benodigde mappen/bestanden die zijn afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in-container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te waarborgen dat credentials uit de profile store komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de gateway voor de Open WebUI-smoke wordt blootgesteld
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Draai docs-checks na docs-edits: `pnpm check:docs`.
Draai volledige Mintlify-ankervalidatie wanneer je ook checks voor in-page headings nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies voor de “echte pipeline” zonder echte providers:

- Gateway tool-calling (mock OpenAI, echte gateway + agent-loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevaluaties (Skills)

We hebben al een paar CI-veilige tests die zich gedragen als “agent-betrouwbaarheidsevaluaties”:

- Mock tool-calling via de echte gateway + agent-loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard-flows die sessiebedrading en config-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt die irrelevante)?
- **Naleving:** leest de agent `SKILL.md` voor gebruik en volgt die de vereiste stappen/args?
- **Workflowcontracten:** multi-turn-scenario's die toolvolgorde, carryover van sessiegeschiedenis en sandboxgrenzen bevestigen.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenario-runner met mock providers om tool-calls + volgorde, reads van skill-bestanden en sessiebedrading te bevestigen.
- Een kleine suite met skill-gerichte scenario's (gebruiken versus vermijden, gating, prompt injection).
- Optionele live-evaluaties (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (plugin- en channel-vorm)

Contracttests verifiëren dat elke geregistreerde plugin en channel voldoet aan
het interfacecontract. Ze itereren over alle ontdekte plugins en draaien een
suite van vorm- en gedragsasserties. De standaard `pnpm test` unit-lane slaat
deze gedeelde seam- en smoke-bestanden bewust over; draai de contractcommando's
expliciet wanneer je gedeelde channel- of provider-oppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channel-contracten: `pnpm test:contracts:channels`
- Alleen provider-contracten: `pnpm test:contracts:plugins`

### Channel-contracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basispluginvorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Gedrag voor sessiebinding
- **outbound-payload** - Berichtpayloadstructuur
- **inbound** - Afhandeling van inkomende berichten
- **actions** - Channel-actionhandlers
- **threading** - Afhandeling van thread-ID's
- **directory** - Directory-/roster-API
- **group-policy** - Handhaving van groepsbeleid

### Providerstatuscontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-statusprobes
- **registry** - Vorm van de Plugin-registry

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-flowcontract
- **auth-choice** - Auth-keuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugin-detectie
- **loader** - Plugin-laden
- **runtime** - Provider-runtime
- **shape** - Plugin-vorm/interface
- **wizard** - Setupwizard

### Wanneer draaien

- Na het wijzigen van plugin-sdk-exports of subpaths
- Na het toevoegen of wijzigen van een channel- of provider-plugin
- Na het refactoren van pluginregistratie of -detectie

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelissue oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock/stub provider, of leg de exacte transformatie van de request-shape vast)
- Als het inherent live-only is (rate limits, auth-beleid), houd de live-test beperkt en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - provider request conversion/replay-bug → directe modeltest
  - gateway session/history/tool pipeline-bug → gateway live-smoke of CI-veilige gateway-mocktest
- SecretRef traversal-guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled target per SecretRef-klasse af uit registry-metadata (`listSecretTargetRegistryEntries()`), en bevestigt vervolgens dat exec ids met traversal-segmenten worden afgewezen.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt bewust op niet-geclassificeerde target ids, zodat nieuwe klassen niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [CI](/nl/ci)
