---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway + agentgedrag debuggen
summary: 'Testkit: unit-, e2e- en live-suites, Docker-runners en wat elke test dekt'
title: Testen
x-i18n:
    generated_at: "2026-04-30T18:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) en een kleine set
Docker-runners. Dit document is een gids voor "hoe we testen":

- Wat elke suite dekt (en wat deze bewust _niet_ dekt).
- Welke commando's je uitvoert voor gangbare workflows (lokaal, vóór push, foutopsporing).
- Hoe live-tests inloggegevens ontdekken en modellen/providers selecteren.
- Hoe je regressies toevoegt voor echte model-/providerproblemen.

<Note>
**QA-stack (qa-lab, qa-channel, live transport lanes)** wordt apart gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — architectuur, commandosurface, scenario's schrijven.
- [Matrix-QA](/nl/concepts/qa-matrix) — referentie voor `pnpm openclaw qa matrix`.
- [QA-kanaal](/nl/channels/qa-channel) — de synthetische transport-Plugin die wordt gebruikt door repo-ondersteunde scenario's.

Deze pagina behandelt het uitvoeren van de reguliere testsuites en Docker/Parallels-runners. De sectie met QA-specifieke runners hieronder ([QA-specifieke runners](#qa-specific-runners)) vermeldt de concrete `qa`-aanroepen en verwijst terug naar de referenties hierboven.
</Note>

## Snel starten

Op de meeste dagen:

- Volledige gate (verwacht vóór push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale volledige suiterun op een ruime machine: `pnpm test:max`
- Directe Vitest-watchloop: `pnpm test:watch`
- Directe bestandsselectie routeert nu ook extension-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef de voorkeur aan gerichte runs wanneer je aan één fout itereert.
- Docker-ondersteunde QA-site: `pnpm qa:lab:up`
- Linux-VM-ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests wijzigt of extra vertrouwen wilt:

- Coverage-gate: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Live-suite (modellen + Gateway-tool-/afbeeldingsprobes): `pnpm test:live`
- Richt je stil op één live-bestand: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live-modelsweep: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert nu een tekstbeurt uit plus een kleine probe in bestandsleesstijl.
    Modellen waarvan de metadata `image`-input adverteert, voeren ook een kleine afbeeldingsbeurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-coverage: dagelijkse `OpenClaw Scheduled Live And E2E Checks` en handmatige
    `OpenClaw Release Checks` roepen beide de herbruikbare live/E2E-workflow aan met
    `include_live_suites: true`, inclusief afzonderlijke Docker live-model
    matrix-jobs geshard per provider.
  - Voor gerichte CI-herhalingen dispatch je `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe providergeheimen met hoge signaalwaarde toe aan `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-aanroepers daarvan.
- Native Codex bound-chat-smoke: `pnpm test:docker:live-codex-bind`
  - Voert een Docker live-lane uit tegen het Codex app-server-pad, bindt een synthetische
    Slack-DM met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert daarna dat een normaal antwoord en een afbeeldingsbijlage
    via de native Plugin-binding worden gerouteerd in plaats van ACP.
- Codex app-server-harness-smoke: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via de Plugin-eigen Codex app-server-harness,
    verifieert `/codex status` en `/codex models`, en oefent standaard image,
    cron MCP, sub-agent- en Guardian-probes. Schakel de sub-agent-probe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere Codex
    app-server-fouten isoleert. Voor een gerichte sub-agent-check schakel je de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de sub-agent-probe tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Crestodian rescue-command-smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in riem-en-bretels-check voor de message-channel rescue-command
    surface. Deze oefent `/crestodian status`, zet een permanente modelwijziging
    in de wachtrij, antwoordt `/crestodian yes`, en verifieert het audit-/config-schrijppad.
- Crestodian planner Docker-smoke: `pnpm test:docker:crestodian-planner`
  - Voert Crestodian uit in een configloze container met een nep-Claude CLI op `PATH`
    en verifieert dat de fuzzy planner fallback wordt vertaald naar een geaudite, getypte
    configschrijfactie.
- Crestodian first-run Docker-smoke: `pnpm test:docker:crestodian-first-run`
  - Start vanuit een lege OpenClaw-state-dir, routeert kale `openclaw` naar
    Crestodian, past setup/model/agent/Discord Plugin + SecretRef-schrijfacties toe,
    valideert config en verifieert audit-items. Hetzelfde Ring 0-setuppad wordt
    ook gedekt in QA Lab door
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-kostensmoke: met `MOONSHOT_API_KEY` ingesteld, voer
  `openclaw models list --provider moonshot --json` uit, en voer daarna een geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Verifieer dat de JSON Moonshot/K2.6 rapporteert en dat het
  assistenttranscript genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falende case nodig hebt, geef dan de voorkeur aan het versmallen van live-tests via de allowlist-env-vars die hieronder worden beschreven.
</Tip>

## QA-specifieke runners

Deze commando's staan naast de hoofdtestsuites wanneer je QA-lab-realiteit nodig hebt:

CI voert QA Lab uit in toegewijde workflows. `Parity gate` draait op overeenkomende PR's en
via handmatige dispatch met mockproviders. `QA-Lab - All Lanes` draait elke nacht op
`main` en via handmatige dispatch met de mock parity gate, live Matrix-lane,
Convex-beheerde live Telegram-lane en Convex-beheerde live Discord-lane als
parallelle jobs. Geplande QA- en releasechecks geven Matrix `--profile fast`
expliciet mee, terwijl de Matrix CLI en de handmatige workflowinput standaard
`all` blijven; handmatige dispatch kan `all` sharden naar `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` en `e2ee-cli`-jobs. `OpenClaw Release Checks` voert parity plus
de snelle Matrix- en Telegram-lanes uit vóór releasegoedkeuring, met
`mock-openai/gpt-5.5` voor release-transportchecks zodat ze deterministisch blijven
en normale provider-Plugin-startup vermijden. Deze live transport-Gateways schakelen
memory search uit; memory-gedrag blijft gedekt door de QA parity-suites.

Volledige release live-media-shards gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, dat al
`ffmpeg` en `ffprobe` bevat. Docker live-model-/backend-shards gebruiken de gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image die eenmaal per geselecteerde
commit wordt gebouwd, en pullen die daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van
opnieuw te bouwen binnen elke shard.

- `pnpm openclaw qa suite`
  - Voert repo-ondersteunde QA-scenario's rechtstreeks op de host uit.
  - Voert meerdere geselecteerde scenario's standaard parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard concurrency 4 (begrensd door het
    aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor de oudere seriële lane.
  - Stopt met een niet-nul exitcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artifacts wilt zonder falende exitcode.
  - Ondersteunt providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale AIMock-ondersteunde providerserver voor experimentele
    fixture- en protocol-mock-coverage zonder de scenario-bewuste
    `mock-openai`-lane te vervangen.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de Gateway-startup-bench uit plus een klein mock QA Lab-scenariopakket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) en schrijft een gecombineerde CPU-observatie-
    samenvatting onder `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende hot-CPU-observaties (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), zodat korte startpieken als metrics worden vastgelegd
    zonder eruit te zien als de minutenlange Gateway-peg-regressie.
  - Gebruikt gebouwde `dist`-artifacts; voer eerst een build uit wanneer de checkout nog geen
    verse runtime-output heeft.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een wegwerpbare Multipass Linux-VM.
  - Behoudt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
  - Hergebruikt dezelfde provider-/modelselectievlaggen als `qa suite`.
  - Live-runs forwarden de ondersteunde QA-auth-inputs die praktisch zijn voor de guest:
    env-gebaseerde providersleutels, het QA live-providerconfigpad en `CODEX_HOME`
    wanneer aanwezig.
  - Outputdirs moeten onder de repo-root blijven zodat de guest kan terugschrijven via
    de gemounte workspace.
  - Schrijft het normale QA-rapport + samenvatting plus Multipass-logs onder
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de Docker-ondersteunde QA-site voor operatorstijl-QA-werk.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert deze globaal in
    Docker, voert niet-interactieve OpenAI API-key-onboarding uit, configureert standaard Telegram,
    verifieert dat het inschakelen van de Plugin runtime-afhankelijkheden op aanvraag installeert,
    voert doctor uit en voert één lokale agentbeurt uit tegen een gemockt OpenAI
    endpoint.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om dezelfde packaged-install
    lane met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische built-app Docker-smoke uit voor ingebedde runtime-context-
    transcripties. Deze verifieert dat verborgen OpenClaw-runtimecontext wordt bewaard als een
    niet-weergegeven aangepast bericht in plaats van te lekken naar de zichtbare gebruikersbeurt,
    seedt daarna een getroffen kapotte sessie-JSONL en verifieert dat
    `openclaw doctor --fix` deze herschrijft naar de actieve branch met een back-up.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een OpenClaw-pakketkandidaat in Docker, voert installed-package
    onboarding uit, configureert Telegram via de geïnstalleerde CLI en hergebruikt daarna de
    live Telegram QA-lane met dat geïnstalleerde pakket als de SUT-Gateway.
  - Standaard is `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; stel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie uit het registry een opgeloste lokale tarball te testen.
  - Gebruikt dezelfde Telegram-env-inloggegevens of Convex-inloggegevensbron als
    `pnpm openclaw qa telegram`. Stel voor CI-/releaseautomatisering
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` in plus
    `OPENCLAW_QA_CONVEX_SITE_URL` en het rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper Convex automatisch.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft de gedeelde
    `OPENCLAW_QA_CREDENTIAL_ROLE` alleen voor deze lane.
  - GitHub Actions stelt deze lane beschikbaar als de handmatige maintainer-workflow
    `NPM Telegram Beta E2E`. Deze draait niet bij merge. De workflow gebruikt de
    `qa-live-shared`-omgeving en Convex CI-credentialleases.
- GitHub Actions stelt ook `Package Acceptance` beschikbaar voor side-run productbewijs
  tegen één kandidaatpakket. Deze accepteert een vertrouwde ref, gepubliceerde npm-spec,
  HTTPS-tarball-URL plus SHA-256, of tarball-artifact uit een andere run, uploadt
  de genormaliseerde `openclaw-current.tgz` als `package-under-test`, en voert daarna de
  bestaande Docker E2E-scheduler uit met smoke-, package-, product-, full- of custom
  lane-profielen. Stel `telegram_mode=mock-openai` of `live-frontier` in om de
  Telegram QA-workflow tegen hetzelfde `package-under-test`-artifact uit te voeren.
  - Nieuwste bèta-productbewijs:

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
    met OpenAI geconfigureerd, en schakelt daarna gebundelde kanalen/Plugins in
    via configuratiebewerkingen.
  - Verifieert dat setup-discovery niet-geconfigureerde runtimeafhankelijkheden
    van Plugins afwezig laat, dat de eerste geconfigureerde Gateway- of doctor-run
    de runtimeafhankelijkheden van elke gebundelde Plugin op aanvraag installeert,
    en dat een tweede herstart afhankelijkheden die al waren geactiveerd niet
    opnieuw installeert.
  - Installeert ook een bekende oudere npm-baseline, schakelt Telegram in voordat
    `openclaw update --tag <candidate>` wordt uitgevoerd, en verifieert dat de
    post-update doctor van de kandidaat gebundelde kanaal-runtimeafhankelijkheden
    herstelt zonder postinstall-herstel aan de kant van de testharnas.
- `pnpm test:parallels:npm-update`
  - Voert de native update-smoke voor verpakte installaties uit over Parallels-gasten. Elk
    geselecteerd platform installeert eerst het gevraagde baselinepakket, voert daarna
    het geïnstalleerde commando `openclaw update` uit in dezelfde gast en verifieert de
    geïnstalleerde versie, updatestatus, Gateway-gereedheid en één lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux` tijdens
    iteratie op één gast. Gebruik `--json` voor het pad naar het samenvattingsartefact en
    de status per lane.
  - De OpenAI-lane gebruikt standaard `openai/gpt-5.5` voor het bewijs met een live
    agentbeurt. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in wanneer je bewust een ander
    OpenAI-model valideert.
  - Wikkel lange lokale runs in een host-time-out zodat vastlopende Parallels-transporten
    de rest van het testvenster niet kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste lane-logs onder `/tmp/openclaw-parallels-npm-update.*`.
    Inspecteer `windows-update.log`, `macos-update.log` of `linux-update.log`
    voordat je aanneemt dat de buitenste wrapper is vastgelopen.
  - Windows-update kan op een koude gast 10 tot 15 minuten besteden aan post-update
    doctor-/runtimeafhankelijkheidsherstel; dat is nog steeds gezond wanneer de geneste
    npm-debuglog vooruitgaat.
  - Voer deze aggregatiewrapper niet parallel uit met individuele Parallels
    macOS-, Windows- of Linux-smoke-lanes. Ze delen VM-status en kunnen botsen bij
    snapshotherstel, pakketservering of Gateway-status van de gast.
  - Het post-updatebewijs gebruikt het normale oppervlak van gebundelde Plugins omdat
    capability-facades zoals spraak, beeldgeneratie en mediabegrip worden geladen via
    gebundelde runtime-API's, zelfs wanneer de agentbeurt zelf alleen een eenvoudige
    tekstrespons controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocol-smoketests.
- `pnpm openclaw qa matrix`
  - Voert de Matrix live QA-lane uit tegen een wegwerpbare Docker-ondersteunde Tuwunel-homeserver. Alleen source-checkout — verpakte installaties leveren `qa-lab` niet mee.
  - Volledige CLI, profiel-/scenariocatalogus, omgevingsvariabelen en artefactindeling: [Matrix QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de Telegram live QA-lane uit tegen een echte privégroep met de driver- en SUT-bottokens uit de omgeving.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde gepoolde inloggegevens. Gebruik standaard de env-modus, of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in om gepoolde leases te gebruiken.
  - Sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer je
    artefacten wilt zonder falende afsluitcode.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de SUT-bot een Telegram-gebruikersnaam exposeert.
  - Schakel voor stabiele bot-tot-bot-observatie Bot-to-Bot Communication Mode in `@BotFather` in voor beide bots en zorg dat de driver-bot groepsbotverkeer kan observeren.
  - Schrijft een Telegram QA-rapport, samenvatting en observed-messages-artefact onder `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten RTT van driver-verzendverzoek tot geobserveerd SUT-antwoord.

Live transport-lanes delen één standaardcontract zodat nieuwe transporten niet afdrijven; de dekkingsmatrix per lane staat in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-inloggegevens via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) is ingeschakeld voor
`openclaw qa telegram`, verkrijgt QA lab een exclusieve lease uit een door Convex ondersteunde pool, heartbeats
die lease terwijl de lane draait, en geeft de lease vrij bij afsluiten.

Referentiescaffold voor Convex-project:

- `qa/convex-credential-broker/`

Vereiste env-vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van inloggegevensrol:
  - CLI: `--credential-role maintainer|ci`
  - Standaardwaarde via env: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele env-vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele trace-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat loopback-`http://` Convex-URL's toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Maintainer-beheercommando's (pool toevoegen/verwijderen/weergeven) vereisen specifiek
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
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI
utilities.

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
- `POST /admin/add` (alleen maintainer-geheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Succes: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen maintainer-geheim)
  - Verzoek: `{ credentialId, actorId }`
  - Succes: `{ status: "ok", changed, credential }`
  - Guard voor actieve lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen maintainer-geheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Succes: `{ status: "ok", credentials, count }`

Payloadvorm voor Telegram-kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een numerieke Telegram-chat-id-string zijn.
- `admin/add` valideert deze vorm voor `kind: "telegram"` en weigert misvormde payloads.

### Een kanaal toevoegen aan QA

De architectuur- en scenario-helpernamen voor nieuwe kanaaladapters staan in [QA-overzicht → Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel). De minimumbalk: implementeer de transportrunner op de gedeelde `qa-lab`-hostseam, declareer `qaRunners` in het Plugin-manifest, mount als `openclaw qa <runner>`, en schrijf scenario's onder `qa/scenarios/`.

## Testsuites (wat waar draait)

Zie de suites als “toenemend realisme” (en toenemende instabiliteit/kosten):

### Unit / integratie (standaard)

- Commando: `pnpm test`
- Configuratie: niet-gerichte runs gebruiken de shardset `vitest.full-*.config.ts` en kunnen multi-projectshards uitbreiden naar per-projectconfiguraties voor parallelle planning
- Bestanden: core-/unit-inventarissen onder `src/**/*.test.ts`, `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests draaien in de toegewezen `unit-ui`-shard
- Bereik:
  - Zuivere unittests
  - In-process integratietests (Gateway-auth, routering, tooling, parsing, configuratie)
  - Deterministische regressies voor bekende bugs
- Verwachtingen:
  - Draait in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Resolver- en public-surface-loader-tests moeten breed fallbackgedrag van `api.js` en
    `runtime-api.js` bewijzen met gegenereerde kleine Plugin-fixtures, niet met
    echte bron-API's van gebundelde Plugins. Echte Plugin-API-loads horen thuis in
    Plugin-eigen contract-/integratiesuites.

<AccordionGroup>
  <Accordion title="Projecten, shards en scoped lanes">

    - Niet-gerichte `pnpm test` draait twaalf kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één gigantisch native rootprojectproces. Dit verlaagt de piek-RSS op belaste machines en voorkomt dat auto-reply-/extensiewerk niet-gerelateerde suites uithongert.
    - `pnpm test --watch` gebruikt nog steeds de native root-`vitest.config.ts`-projectgraaf, omdat een watch-lus met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` leiden expliciete bestands-/directorydoelen eerst via gescopete lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` de volledige opstartkosten van het rootproject vermijdt.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope gescopete lanes: directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete bronmappings en lokale importgraaf-afhankelijken. Configuratie-/setup-/packagebewerkingen voeren geen brede testrun uit, tenzij je expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale check-gate voor nauw werk. Deze classificeert de diff in core, core-tests, extensies, extensietests, apps, docs, releasemetadata, live Docker-tooling en tooling, en voert daarna de bijbehorende typecheck-, lint- en guard-commando’s uit. Deze draait geen Vitest-tests; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan voor testbewijs. Versiebumpen met alleen releasemetadata draait gerichte versie-/config-/root-dependency-checks, met een guard die packagewijzigingen buiten het versieveld op topniveau afwijst.
    - Bewerkingen aan de live Docker ACP-harness draaien gerichte checks: shellsyntaxis voor de live Docker-auth-scripts en een dry-run van de live Docker-scheduler. Wijzigingen in `package.json` worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; dependency-, export-, versie- en andere package-oppervlakbewerkingen gebruiken nog steeds de bredere guards.
    - Importlichte unit-tests uit agents, commands, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare pure utility-gebieden lopen via de `unit-fast`-lane, die `test/setup-openclaw-runtime.ts` overslaat; stateful/runtime-zware bestanden blijven op de bestaande lanes.
    - Geselecteerde helperbronbestanden uit `plugin-sdk` en `commands` mappen runs in changed-modus ook naar expliciete naastliggende tests in die lichte lanes, zodat helperbewerkingen de volledige zware suite voor die directory niet opnieuw draaien.
    - `auto-reply` heeft aparte buckets voor core-helpers op topniveau, `reply.*`-integratietests op topniveau en de `src/auto-reply/reply/**`-subtree. CI splitst de reply-subtree verder in shards voor agent-runner, dispatch en commands/state-routing, zodat één importzware bucket niet de volledige Node-staart bezit.
    - Normale PR-/main-CI slaat bewust de extensie-batchsweep en de release-only `agentic-plugins`-shard over. Full Release Validation start de aparte `Plugin Prerelease`-childworkflow voor die plugin-/extensiezware suites op releasekandidaten.

  </Accordion>

  <Accordion title="Ingebedde runner-dekking">

    - Wanneer je message-tool-discovery-invoer of runtimecontext voor Compaction wijzigt, behoud dan beide dekkingsniveaus.
    - Voeg gerichte helperregressies toe voor pure routing- en normalisatiegrenzen.
    - Houd de integratiesuites van de ingebedde runner gezond:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` en
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Die suites verifiëren dat gescopete id’s en Compaction-gedrag nog steeds
      door de echte `run.ts`- / `compact.ts`-paden stromen; alleen helpertests
      zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Vitest-pool- en isolatiestandaarden">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie zet `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner in de rootprojecten, e2e- en live-configuraties.
    - De root-UI-lane behoudt zijn `jsdom`-setup en optimizer, maar draait ook
      op de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard erft dezelfde `threads` + `isolate: false`-standaarden
      uit de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor Vitest-child-Node-
      processen om V8-compileverloop tijdens grote lokale runs te verminderen.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-
      gedrag.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architectuurlanes een diff triggert.
    - De pre-commit-hook is alleen voor formattering. Deze staged geformatteerde bestanden opnieuw en
      draait geen lint, typecheck of tests.
    - Draai `pnpm check:changed` expliciet vóór overdracht of push wanneer je
      de slimme lokale check-gate nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope gescopete lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      beslist dat een harness-, config-, package- of contractbewerking echt bredere
      Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routinggedrag,
      alleen met een hogere workerlimiet.
    - Lokale automatische workerschaling is bewust conservatief en schaalt terug
      wanneer de load average van de host al hoog is, zodat meerdere gelijktijdige
      Vitest-runs standaard minder schade doen.
    - De basisconfiguratie van Vitest markeert de projecten/configbestanden als
      `forceRerunTriggers`, zodat herhalingen in changed-modus correct blijven wanneer testbedrading
      wijzigt.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op ondersteunde
      hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` in als je
      één expliciete cachelocatie wilt voor directe profilering.

  </Accordion>

  <Accordion title="Perf-debugging">

    - `pnpm test:perf:imports` schakelt Vitest-rapportage van importduur plus
      import-breakdown-uitvoer in.
    - `pnpm test:perf:imports:changed` scopet dezelfde profileringsweergave naar
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Shardtimingdata wordt geschreven naar `.artifacts/vitest-shard-timings.json`.
      Runs van de hele configuratie gebruiken het configuratiepad als sleutel; include-pattern-CI-
      shards voegen de shardnaam toe, zodat gefilterde shards apart kunnen worden gevolgd.
    - Wanneer één hete test nog steeds de meeste tijd kwijt is aan opstartimports,
      houd zware dependencies dan achter een smalle lokale `*.runtime.ts`-seam en
      mock die seam direct in plaats van runtimehelpers diep te importeren alleen
      om ze door `vi.mock(...)` te geven.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt gerouteerde
      `test:changed` met het native rootprojectpad voor die gecommitte diff en drukt
      wandtijd plus macOS max RSS af.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige
      vuile tree door de gewijzigde-bestandenlijst via
      `scripts/test-projects.mjs` en de root-Vitest-configuratie te routeren.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de main thread voor
      Vitest-/Vite-opstart en transform-overhead.
    - `pnpm test:perf:profile:runner` schrijft CPU+-heapprofielen van de runner voor de
      unit-suite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Commando: `pnpm test:stability:gateway`
- Configuratie: `vitest.gateway.config.ts`, geforceerd naar één worker
- Scope:
  - Start een echte loopback-Gateway met diagnostiek standaard ingeschakeld
  - Stuurt synthetische gatewayberichten, geheugen- en large-payload-verloop door het diagnostische eventpad
  - Queryt `diagnostics.stability` via de Gateway WS RPC
  - Dekt persistentiehelpers voor de diagnostische stabiliteitsbundel
  - Assert dat de recorder begrensd blijft, synthetische RSS-samples onder het pressure-budget blijven en wachtrijdieptes per sessie teruglopen naar nul
- Verwachtingen:
  - CI-veilig en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (Gateway-smoke)

- Commando: `pnpm test:e2e`
- Configuratie: `vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en gebundelde Plugin-E2E-tests onder `extensions/`
- Runtime-standaarden:
  - Gebruikt Vitest `threads` met `isolate: false`, overeenkomstig de rest van de repo.
  - Gebruikt adaptieve workers (CI: tot 2, lokaal: standaard 1).
  - Draait standaard in stille modus om console-I/O-overhead te verminderen.
- Handige overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers te forceren (afgetopt op 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer weer in te schakelen.
- Scope:
  - End-to-endgedrag van meerdere gateway-instanties
  - WebSocket-/HTTP-oppervlakken, node-pairing en zwaardere netwerkfunctionaliteit
- Verwachtingen:
  - Draait in CI (wanneer ingeschakeld in de pipeline)
  - Geen echte sleutels vereist
  - Meer bewegende delen dan unit-tests (kan langzamer zijn)

### E2E: OpenShell-backend-smoke

- Commando: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Start een geïsoleerde OpenShell-gateway op de host via Docker
  - Maakt een sandbox vanuit een tijdelijk lokaal Dockerfile
  - Oefent de OpenShell-backend van OpenClaw uit via echte `sandbox ssh-config` + SSH exec
  - Verifieert remote-canonical bestandssysteemgedrag via de sandbox-fs-bridge
- Verwachtingen:
  - Alleen opt-in; geen onderdeel van de standaard `pnpm test:e2e`-run
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME`, en vernietigt daarna de testgateway en sandbox
- Handige overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer je de bredere e2e-suite handmatig draait
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binary of wrapperscript te wijzen

### Live (echte providers + echte modellen)

- Commando: `pnpm test:live`
- Configuratie: `vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live-tests van gebundelde plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (zet `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - “Werkt deze provider/dit model _vandaag_ echt met echte credentials?”
  - Vangt providerformatwijzigingen, eigenaardigheden rond tool-calling, auth-problemen en rate-limit-gedrag op
- Verwachtingen:
  - Niet CI-stabiel by design (echte netwerken, echte providerpolicies, quota, storingen)
  - Kost geld / gebruikt rate limits
  - Draai bij voorkeur vernauwde subsets in plaats van “alles”
- Live-runs sourcen `~/.profile` om ontbrekende API-sleutels op te pikken.
- Standaard isoleren live-runs nog steeds `HOME` en kopiëren config-/authmateriaal naar een tijdelijke test-home, zodat unit-fixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte home-directory gebruiken.
- `pnpm test:live` gebruikt nu standaard een stillere modus: het behoudt `[live] ...`-voortgangsuitvoer, maar onderdrukt de extra `~/.profile`-melding en dempt gateway-bootstraplogs/Bonjour-ruis. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogs terug wilt.
- API-sleutelrotatie (providerspecifiek): stel `*_API_KEYS` in met komma-/puntkommaformaat of `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) of per-live override via `OPENCLAW_LIVE_*_KEY`; tests proberen opnieuw bij rate-limit-responses.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-suites sturen nu voortgangsregels naar stderr, zodat lange providercalls zichtbaar actief zijn, zelfs wanneer Vitest-consolecapture stil is.
  - `vitest.live.config.ts` schakelt Vitest-console-interceptie uit, zodat provider-/gatewayvoortgangsregels direct streamen tijdens live-runs.
  - Stel Heartbeats voor directe modellen af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stel Gateway-/probe-Heartbeats af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke suite moet ik draaien?

Gebruik deze beslissingstabel:

- Bewerkingslogica/tests: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Raak je Gateway-netwerken / WS-protocol / koppelen aan: voeg `pnpm test:e2e` toe
- Debuggen van “mijn bot ligt eruit” / provider-specifieke fouten / toolaanroepen: voer een versmalde `pnpm test:live` uit

## Live (netwerkgebruikende) tests

Voor de livemodelmatrix, CLI-backend-smokes, ACP-smokes, Codex-app-server
harness en alle live tests voor mediaproviders (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus credentialverwerking voor live-runs — zie
[Testing — live suites](/nl/help/testing-live).

## Docker-runners (optionele "werkt in Linux"-checks)

Deze Docker-runners zijn opgesplitst in twee groepen:

- Livemodel-runners: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen hun overeenkomende livebestand met profielsleutel uit binnen de repo-Dockerimage (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap en werkruimte worden gemount (en `~/.profile` wordt gesourcet als die is gemount). De overeenkomende lokale entrypoints zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-runners gebruiken standaard een kleinere smoke-limiet zodat een volledige Docker-sweep praktisch blijft:
  `test:docker:live-models` gebruikt standaard `OPENCLAW_LIVE_MAX_MODELS=12`, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Overschrijf die env-vars wanneer je
  expliciet de grotere uitputtende scan wilt.
- `test:docker:all` bouwt de live-Dockerimage één keer via `test:docker:live-build`, verpakt OpenClaw één keer als npm-tarball via `scripts/package-openclaw-for-docker.mjs`, en bouwt/hergebruikt daarna twee `scripts/e2e/Dockerfile`-images. De kale image is alleen de Node/Git-runner voor install/update/plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball. De functionele image installeert dezelfde tarball in `/app` voor lanes met gebouwde-app-functionaliteit. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. Het aggregaat gebruikt een gewogen lokale scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` beheert processlots, terwijl resourcecaps voorkomen dat zware live-, npm-install- en multiservice-lanes allemaal tegelijk starten. Als één lane zwaarder is dan de actieve caps, kan de scheduler die nog steeds starten wanneer de pool leeg is en houdt die lane daarna alleen draaiend totdat er weer capaciteit beschikbaar is. Standaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` alleen aan wanneer de Docker-host meer ruimte heeft. De runner voert standaard een Docker-preflight uit, verwijdert verouderde OpenClaw E2E-containers, print elke 30 seconden status, bewaart succesvolle lanetimings in `.artifacts/docker-tests/lane-timings.json` en gebruikt die timings om bij latere runs langere lanes eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen lanemanifest te printen zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan te printen voor geselecteerde lanes, package-/imagevereisten en credentials.
- `Package Acceptance` is de GitHub-native package-gate voor "werkt deze installeerbare tarball als product?" Het bepaalt één kandidaatpackage uit `source=npm`, `source=ref`, `source=url` of `source=artifact`, uploadt die als `package-under-test`, en voert daarna de herbruikbare Docker E2E-lanes uit tegen exact die tarball in plaats van de geselecteerde ref opnieuw te verpakken. `workflow_ref` selecteert de vertrouwde workflow-/harnessscripts, terwijl `package_ref` de sourcecommit/-branch/-tag selecteert om te verpakken wanneer `source=ref`; hierdoor kan huidige acceptatielogica oudere vertrouwde commits valideren. Profielen zijn geordend op breedte: `smoke` is een snelle installatie/channel/agent plus Gateway/config, `package` is het package-/update-/Plugin-contract plus de keyless upgrade-survivor-fixture en de standaard native vervanger voor de meeste Parallels-package-/updatedekking, `product` voegt MCP-channels, Cron-/subagent-opruiming, OpenAI-webzoekopdrachten en OpenWebUI toe, en `full` voert de releasepad-Dockerchunks met OpenWebUI uit. Releasevalidatie voert een aangepaste packagedelta uit (`bundled-channel-deps-compat plugins-offline`) plus Telegram-package-QA omdat de releasepad-Dockerchunks de overlappende package-/update-/Plugin-lanes al dekken. Gerichte GitHub-Docker-reruncommando's die uit artifacts worden gegenereerd, bevatten eerdere package-artifacts en voorbereide image-inputs wanneer beschikbaar, zodat gefaalde lanes kunnen voorkomen dat package en images opnieuw worden gebouwd.
- Build- en releasechecks voeren `scripts/check-cli-bootstrap-imports.mjs` uit na tsdown. De guard doorloopt de statische gebouwde graph vanaf `dist/entry.js` en `dist/cli/run-main.js` en faalt als startupimports vóór dispatch packagedependencies importeren, zoals Commander, prompt-UI, undici of logging; die houdt ook de gebundelde Gateway-runchunk binnen budget en weigert statische imports van bekende koude Gateway-paden. De packaged CLI-smoke dekt ook roothelp, onboardhelp, doctorhelp, status, configschema en een model-list-commando.
- Legacycompatibiliteit voor Package Acceptance is begrensd op `2026.4.25` (`2026.4.25-beta.*` inbegrepen). Tot en met die grens tolereert de harness alleen metadatagaten in verzonden packages: weggelaten private QA-inventory-items, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin-install-record-locaties, ontbrekende persistentie van marketplace-install-records en configmetadatamigratie tijdens `plugins update`. Voor packages na `2026.4.25` zijn die paden strikte fouten.
- Container-smoke-runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` en `test:docker:config-reload` starten één of meer echte containers en verifiëren integratiepaden op hoger niveau.

De livemodel-Docker-runners bind-mounten ook alleen de benodigde CLI-auth-homes (of alle ondersteunde wanneer de run niet is versmald), en kopiëren die daarna naar de container-home vóór de run, zodat externe-CLI-OAuth tokens kan vernieuwen zonder de auth-store van de host te muteren:

- Directe modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP-bind-smoketest: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; dekt standaard Claude, Codex en Gemini, met strikte Droid/OpenCode-dekking via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- CLI-backend-smoketest: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server-harness-smoketest: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability-smoketest: `pnpm qa:otel:smoke` is een private QA-lane voor source-checkouts. Deze maakt bewust geen deel uit van Docker-release-lanes voor pakketten, omdat de npm-tarball QA Lab weglaat.
- Open WebUI-live-smoketest: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboardingwizard (TTY, volledige scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm-tarball-smoketest voor onboarding/kanaal/agent: `pnpm test:docker:npm-onboard-channel-agent` installeert de ingepakte OpenClaw-tarball globaal in Docker, configureert OpenAI via onboarding met env-verwijzing plus standaard Telegram, verifieert dat doctor geactiveerde plugin-runtime-deps heeft gerepareerd en voert een gemockte OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-rebuild over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update-kanaalwissel-smoketest: `pnpm test:docker:update-channel-switch` installeert de ingepakte OpenClaw-tarball globaal in Docker, wisselt van package `stable` naar git `dev`, verifieert het bewaarde kanaal en de werking van plugins na de update, wisselt daarna terug naar package `stable` en controleert de updatestatus.
- Upgrade-survivor-smoketest: `pnpm test:docker:upgrade-survivor` installeert de ingepakte OpenClaw-tarball over een vervuilde fixture van een oude gebruiker met agents, kanaalconfiguratie, plugin-allowlists, verouderde plugin-runtime-deps-status en bestaande workspace-/sessiebestanden. Deze voert een package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert behoud van configuratie/status plus startup-/statusbudgetten.
- Smoketest voor runtimecontext van sessies: `pnpm test:docker:session-runtime-context` verifieert persistentie van verborgen runtimecontext-transcripten plus doctor-reparatie van getroffen gedupliceerde prompt-rewrite-branches.
- Smoketest voor globale Bun-installatie: `bash scripts/e2e/bun-global-install-smoke.sh` pakt de huidige tree in, installeert deze met `bun install -g` in een geïsoleerde home en verifieert dat `openclaw infer image providers --json` gebundelde imageproviders retourneert in plaats van te blijven hangen. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de host-build over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-smoketest: `bash scripts/test-install-sh-docker.sh` deelt een npm-cache tussen de root-, update- en direct-npm-containers. De update-smoketest gebruikt standaard npm `latest` als stabiele baseline voordat naar de kandidaat-tarball wordt geüpgraded. Overschrijf dit lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, of met de `update_baseline_version`-input van de Install Smoke-workflow op GitHub. Niet-root-installatiecontroles houden een geïsoleerde npm-cache aan, zodat root-owned cache-items het gebruikerslokale installatiegedrag niet maskeren. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de root-/update-/direct-npm-cache bij lokale herhalingen te hergebruiken.
- Install Smoke CI slaat de dubbele directe globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die env uit wanneer directe `npm install -g`-dekking nodig is.
- CLI-smoketest voor agents die gedeelde workspace verwijderen: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de root-Dockerfile-image, seedt twee agents met één workspace in een geïsoleerde container-home, voert `agents delete --json` uit en verifieert geldige JSON plus behoud van workspace-gedrag. Hergebruik de install-smoke-image met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken (twee containers, WS-auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-snapshot-smoketest: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de bron-E2E-image plus een Chromium-laag, start Chromium met raw CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote klikbare elementen, iframe-referenties en framemetadata dekken.
- Regressie voor minimale reasoning met OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert een gemockte OpenAI-server via Gateway uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert daarna een afwijzing door het providerschema en controleert dat de raw details in Gateway-logs verschijnen.
- MCP-kanaalbridge (geseede Gateway + stdio-bridge + raw Claude-notification-frame-smoketest): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-bundel-MCP-tools (echte stdio-MCP-server + embedded Pi-profiel-allow/deny-smoketest): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/subagent-MCP-cleanup (echte Gateway + stdio-MCP-child-teardown na geïsoleerde cron- en eenmalige subagent-runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (installatiesmoketest, ClawHub kitchen-sink-installatie/-de-installatie, marketplace-updates en Claude-bundle inschakelen/inspecteren): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaard kitchen-sink-package/runtime-paar met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixture-server.
- Smoketest voor ongewijzigde plugin-update: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config-reload-metadata-smoketest: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-deps van gebundelde plugins: `pnpm test:docker:bundled-channel-deps` bouwt standaard een kleine Docker-runner-image, bouwt en pakt OpenClaw één keer op de host in, en mount die tarball vervolgens in elk Linux-installatiescenario. Hergebruik de image met `OPENCLAW_SKIP_DOCKER_BUILD=1`, sla de host-rebuild na een verse lokale build over met `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, of wijs naar een bestaande tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. De volledige Docker-aggregate en release-path bundled-channel-chunks pakken deze tarball één keer vooraf in en sharden daarna controles van gebundelde kanalen in onafhankelijke lanes, inclusief afzonderlijke update-lanes voor Telegram, Discord, Slack, Feishu, memory-lancedb en ACPX. Release-chunks splitsen kanaal-smoketests, update-targets en setup-/runtimecontracten in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` en `bundled-channels-contracts`; de aggregate `bundled-channels`-chunk blijft beschikbaar voor handmatige herhalingen. De release-workflow splitst ook provider-installer-chunks en gebundelde plugin-installatie-/de-installatiechunks; legacy `package-update`-, `plugins-runtime`- en `plugins-integrations`-chunks blijven aggregate-aliassen voor handmatige herhalingen. Gebruik `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` om de kanaalmatrix te beperken wanneer de gebundelde lane direct wordt uitgevoerd, of `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` om het updatescenario te beperken. Docker-runs per scenario gebruiken standaard `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; het multi-target-updatescenario gebruikt standaard `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. De lane verifieert ook dat `channels.<id>.enabled=false` en `plugins.entries.<id>.enabled=false` doctor-/runtime-dependency-reparatie onderdrukken.
- Beperk runtime-deps van gebundelde plugins tijdens iteratie door niet-gerelateerde scenario's uit te schakelen, bijvoorbeeld:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Om de gedeelde functionele image handmatig vooraf te bouwen en te hergebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` blijven voorrang hebben wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een remote gedeelde image wijst, trekken de scripts deze op als hij nog niet lokaal aanwezig is. De QR- en installer-Docker-tests behouden hun eigen Dockerfiles omdat ze package-/installatiegedrag valideren in plaats van de gedeelde gebouwde-app-runtime.

De live-model-Docker-runners koppelen ook de huidige checkout alleen-lezen aan en
plaatsen die in een tijdelijke werkmap binnen de container. Zo blijft de runtime-
image slank terwijl Vitest nog steeds tegen je exacte lokale bron/configuratie draait.
De stagingstap slaat grote lokale caches en app-buildoutputs over, zoals
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` en app-lokale `.build`- of
Gradle-outputmappen, zodat Docker-live-runs geen minuten besteden aan het kopiëren
van machinespecifieke artefacten.
Ze stellen ook `OPENCLAW_SKIP_CHANNELS=1` in, zodat Gateway-liveprobes geen
echte Telegram/Discord/etc.-channel workers binnen de container starten.
`test:docker:live-models` draait nog steeds `pnpm test:live`, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer je Gateway-live-dekking uit die Docker-lane
moet beperken of uitsluiten.
`test:docker:openwebui` is een hogere-orde compatibiliteitssmoke: het start een
OpenClaw Gateway-container met de OpenAI-compatibele HTTP-endpoints ingeschakeld,
start een gepinde Open WebUI-container tegen die Gateway, logt in via
Open WebUI, verifieert dat `/api/models` `openclaw/default` toont, en stuurt dan een
echte chatrequest via Open WebUI's `/api/chat/completions`-proxy.
De eerste run kan merkbaar trager zijn omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk zijn eigen cold-startsetup moet afronden.
Deze lane verwacht een bruikbare live-modelsleutel, en `OPENCLAW_PROFILE_FILE`
(standaard `~/.profile`) is de primaire manier om die in Dockerized runs te leveren.
Succesvolle runs printen een kleine JSON-payload zoals `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is opzettelijk deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Het start een seeded Gateway-
container, start een tweede container die `openclaw mcp serve` spawnt, en
verifieert vervolgens gerouteerde gespreksdetectie, transcriptlezingen, attachmentmetadata,
live-eventqueuegedrag, outbound send-routing en Claude-achtige channel- +
permission-notificaties via de echte stdio MCP-bridge. De notificatiecheck
inspecteert de ruwe stdio MCP-frames direct, zodat de smoke valideert wat de
bridge daadwerkelijk emitteert, niet alleen wat een specifieke client-SDK toevallig toont.
`test:docker:pi-bundle-mcp-tools` is deterministisch en heeft geen live-
modelsleutel nodig. Het bouwt de repo-Docker-image, start een echte stdio MCP-probeserver
binnen de container, materialiseert die server via de embedded Pi bundle
MCP-runtime, voert de tool uit en verifieert daarna dat `coding` en `messaging`
`bundle-mcp`-tools behouden terwijl `minimal` en `tools.deny: ["bundle-mcp"]` ze filteren.
`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen live-model-
sleutel nodig. Het start een seeded Gateway met een echte stdio MCP-probeserver, draait een
geïsoleerde cronbeurt en een `/subagents spawn` eenmalige child turn, en verifieert daarna
dat het MCP-childproces na elke run stopt.

Handmatige ACP plain-language thread smoke (geen CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie-/debugworkflows. Het kan opnieuw nodig zijn voor ACP-threadroutingvalidatie, dus verwijder het niet.

Nuttige env-vars:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (standaard: `~/.profile`) gekoppeld aan `/home/node/.profile` en gesourced voordat tests draaien
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen env-vars te verifiëren die uit `OPENCLAW_PROFILE_FILE` zijn gesourced, met tijdelijke config-/workspacemappen en zonder externe CLI-authmounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`) gekoppeld aan `/home/node/.npm-global` voor gecachte CLI-installaties binnen Docker
- Externe CLI-authmappen/-bestanden onder `$HOME` worden alleen-lezen gekoppeld onder `/host-auth...` en daarna naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen: `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Verkleinde providerruns koppelen alleen de benodigde mappen/bestanden die worden afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Handmatig overschrijven met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, of een kommagescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de run te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers binnen de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image opnieuw te gebruiken voor reruns die geen rebuild nodig hebben
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te garanderen dat creds uit de profile store komen (niet uit env)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat door de Gateway voor de Open WebUI-smoke wordt getoond
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de nonce-checkprompt te overschrijven die door de Open WebUI-smoke wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de gepinde Open WebUI-imagetag te overschrijven

## Docs-sanity

Voer docschecks uit na docs-bewerkingen: `pnpm check:docs`.
Voer volledige Mintlify-ankervalidatie uit wanneer je ook headingchecks binnen pagina's nodig hebt: `pnpm docs:check-links:anchors`.

## Offline regressie (CI-veilig)

Dit zijn regressies van de "echte pipeline" zonder echte providers:

- Gateway tool calling (mock OpenAI, echte Gateway + agentloop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft config + auth afgedwongen): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent-betrouwbaarheidsevals (Skills)

We hebben al een paar CI-veilige tests die zich gedragen als "agent-betrouwbaarheidsevals":

- Mock tool-calling via de echte Gateway + agentloop (`src/gateway/gateway.test.ts`).
- End-to-end wizardflows die sessiewiring en configeffecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste skill (of vermijdt hij irrelevante)?
- **Compliance:** leest de agent `SKILL.md` vóór gebruik en volgt hij de vereiste stappen/args?
- **Workflowcontracten:** multi-turn-scenario's die toolvolgorde, behoud van sessiegeschiedenis en sandboxgrenzen assert-en.

Toekomstige evals moeten eerst deterministisch blijven:

- Een scenariorunner met mockproviders om toolcalls + volgorde, skillbestandlezingen en sessiewiring te assert-en.
- Een kleine suite met skillgerichte scenario's (gebruiken versus vermijden, gating, promptinjectie).
- Optionele live-evals (opt-in, env-gated) pas nadat de CI-veilige suite aanwezig is.

## Contracttests (Plugin- en channelvorm)

Contracttests verifiëren dat elke geregistreerde Plugin en elk geregistreerd channel aan zijn
interfacecontract voldoet. Ze itereren over alle ontdekte plugins en draaien een suite met
shape- en gedragsasserties. De standaard `pnpm test`-unitlane slaat deze gedeelde seam- en smoke-bestanden opzettelijk over; draai de contractcommando's expliciet
wanneer je gedeelde channel- of provideroppervlakken aanraakt.

### Commando's

- Alle contracten: `pnpm test:contracts`
- Alleen channelcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Channelcontracten

Gelokaliseerd in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basale Plugin-vorm (id, naam, capabilities)
- **setup** - Setupwizardcontract
- **session-binding** - Session-bindinggedrag
- **outbound-payload** - Structuur van messagepayload
- **inbound** - Afhandeling van inbound messages
- **actions** - Channel-actionhandlers
- **threading** - Thread-ID-afhandeling
- **directory** - Directory/roster-API
- **group-policy** - Afdwingen van groepsbeleid

### Providerstatuscontracten

Gelokaliseerd in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channelstatusprobes
- **registry** - Vorm van Plugin registry

### Providercontracten

Gelokaliseerd in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authflowcontract
- **auth-choice** - Authkeuze/selectie
- **catalog** - Modelcatalogus-API
- **discovery** - Plugindiscovery
- **loader** - Pluginladen
- **runtime** - Providerruntime
- **shape** - Pluginvorm/interface
- **wizard** - Setupwizard

### Wanneer draaien

- Na het wijzigen van plugin-sdk-exports of subpaths
- Na het toevoegen of wijzigen van een channel- of provider-Plugin
- Na het refactoren van Plugin-registratie of discovery

Contracttests draaien in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer je een provider-/modelprobleem oplost dat live is ontdekt:

- Voeg indien mogelijk een CI-veilige regressie toe (mock-/stubprovider, of leg de exacte request-shapetransformatie vast)
- Als het inherent alleen live is (rate limits, authbeleid), houd de live-test smal en opt-in via env-vars
- Richt je bij voorkeur op de kleinste laag die de bug vangt:
  - bug in provider-requestconversie/replay → directe modeltest
  - bug in Gateway-sessie/geschiedenis/toolpipeline → Gateway-live-smoke of CI-veilige Gateway-mocktest
- SecretRef-traversalguardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt één gesampled target per SecretRef-class af uit registrymetadata (`listSecretTargetRegistryEntries()`), en assert daarna dat exec-id's met traversalsegmenten worden afgewezen.
  - Als je een nieuwe `includeInPlan` SecretRef-targetfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt opzettelijk op niet-geclassificeerde target-id's, zodat nieuwe classes niet stilzwijgend kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [CI](/nl/ci)
