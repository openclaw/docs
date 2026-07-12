---
read_when:
    - Tests uitvoeren of repareren
summary: Tests lokaal uitvoeren (vitest) en wanneer je de modi voor forceren/dekking gebruikt
title: Tests
x-i18n:
    generated_at: "2026-07-12T09:25:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)
- Validatie van updates en Plugin-pakketten: [Updates en Plugins testen](/nl/help/testing-updates-plugins)

## Standaardinstelling voor agents

Agentsessies voeren tests en rekenintensieve validatie op afstand uit
via Crabbox. Voor vertrouwde code van beheerders wordt standaard Blacksmith Testbox gebruikt. De
geconfigureerde Testbox-workflow laadt inloggegevens, dus niet-vertrouwde code van bijdragers of
forks moet in plaats daarvan CI voor forks zonder geheimen of een opgeschoonde directe AWS Crabbox gebruiken.

Wanneer voor een vertrouwde codetaak waarschijnlijk tests of zwaar bewijsmateriaal nodig zijn, warm dan
onmiddellijk vooraf op in een opdrachtensessie op de achtergrond, werk door terwijl deze wordt voorbereid,
gebruik de geretourneerde `tbx_...`-id opnieuw, synchroniseer bij elke uitvoering de huidige checkout en
stop deze vóór de overdracht:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Na het eerste geslaagde hergebruik registreert de wrapper de basis-, afhankelijkheids-
en Testbox-workflowvingerafdruk van de lease onder `.crabbox/testbox-leases/`.
Bij uitsluitend broncodewijzigingen blijft de voorverwarmde box hergebruikt worden. Een gewijzigde samenvoegbasis, lockfile,
pakketbeheerinvoer, wrapper of Testbox-workflow leidt tot een veilige weigering en vereist een
nieuwe lease. Bij elke uitvoering wordt de huidige checkout nog steeds gesynchroniseerd.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` is uitsluitend bedoeld voor doelbewuste diagnostiek, niet
als bewijs voor een release.

De onderstaande lokale testopdrachten zijn bedoeld voor menselijke workflows of voor een expliciete terugvaloptie voor agents
waarom de gebruiker heeft gevraagd. Onbeschikbaarheid van de externe provider moet worden gemeld; dit
geeft geen toestemming om stilzwijgend een brede lokale controle uit te voeren.

Warm voor niet-vertrouwde code vooraf op met `--provider aws`. Elke uitvoering moet
`CRABBOX_ENV_ALLOW=CI` instellen, `--provider aws --no-hydrate` doorgeven en
een nieuwe tijdelijke externe `HOME` gebruiken voordat afhankelijkheden worden geïnstalleerd of
tests worden uitgevoerd. Gebruik een nieuw voorverwarmde lease die uitsluitend voor die niet-vertrouwde bron bestemd is; hergebruik
nooit een vertrouwde of eerder met inloggegevens geladen lease. Start een geïnstalleerd, vertrouwd Crabbox-
binair bestand vanuit een schone, vertrouwde `main`-checkout en haal alleen de externe PR op met
`--fresh-pr`; voer de wrapper of configuratie van de niet-vertrouwde checkout nooit lokaal uit.
Maak `CRABBOX_AWS_INSTANCE_PROFILE` leeg en weiger veilig tenzij de bepaalde waarde van
`aws.instanceProfile` leeg is. Gebruik vóór elke installatie/test vertrouwde
hulpmiddelen met absolute paden om een IMDSv2-token te vereisen, aan te tonen dat het eindpunt voor IAM-inloggegevens
404 retourneert en te verifiëren dat de externe uitvoer van `git rev-parse HEAD` gelijk is aan de volledige
beoordeelde SHA van de PR-head. Koppel de lease aan die SHA en stop/warm opnieuw op wanneer de head
wijzigt. Upload het vertrouwde `scripts/crabbox-untrusted-bootstrap.sh` vanuit een schone
`main` naast `--fresh-pr`; dit installeert vastgezette versies van Node/pnpm, verifieert de SHA
en de vastgezette pakketbeheerversie, isoleert `HOME`, installeert afhankelijkheden en voert vervolgens
de gevraagde test uit. Als de broker niet kan aantonen dat er geen rol is of als er geen externe PR bestaat,
gebruik dan CI voor forks zonder geheimen. Gebruik geen `hydrate-github`, `--no-sync` of een
Testbox-workflow waarin inloggegevens zijn geladen.
Maak alle `CRABBOX_TAILSCALE*`-overschrijvingen leeg, dwing `--network public
--tailscale=false` af, wis exit-node-/LAN-vlaggen en vereis dat `crabbox inspect`
openbare netwerktoegang zonder Tailscale-status meldt voordat een script wordt geüpload.

## Gebruikelijke lokale volgorde

1. `pnpm test:changed` voor Vitest-bewijs binnen het gewijzigde bereik.
2. `pnpm test <path-or-filter>` voor één bestand, map of expliciet doel.
3. `pnpm test` alleen wanneer u bewust de volledige lokale Vitest-suite nodig hebt.

In een Codex-worktree of gekoppelde/sparse checkout vermijden agents directe lokale uitvoering van
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Expliciet door de gebruiker gevraagde lokale terugvaloptie voor een klein bestand:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Gewijzigde controles of breed bewijs: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, zodat pnpm binnen Testbox wordt uitgevoerd.
- De uiteindelijke `exitCode` en timing-JSON van de wrapper vormen het opdrachtresultaat. Een gedelegeerde Blacksmith GitHub Actions-uitvoering kan na een geslaagde SSH-opdracht `cancelled` tonen, omdat de Testbox van buiten de keepalive-actie wordt gestopt; controleer de wrappersamenvatting en opdrachtuitvoer voordat u dit als een fout beschouwt.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: houdt de serialisatie van zware controles binnen de huidige worktree in plaats van de gemeenschappelijke Git-map voor opdrachten zoals `pnpm check:changed` en gerichte `pnpm test ...`. Gebruik dit alleen op lokale hosts met hoge capaciteit wanneer u bewust onafhankelijke controles over gekoppelde worktrees uitvoert.

## Kernopdrachten

Uitvoeringen van de testwrapper eindigen met een korte samenvatting `[test] passed|failed|skipped ... in ...`; de eigen duurregel van Vitest blijft de detailinformatie per shard.

| Opdracht                                          | Functie                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Expliciete bestands-/mapdoelen worden via gerichte Vitest-lanes geleid. Uitvoeringen zonder doel vormen bewijs voor de volledige suite: vaste shardgroepen worden uitgebreid naar leaf-configuraties voor lokale parallelle uitvoering, waarbij de verwachte shardverdeling vóór de start wordt weergegeven. De extensiegroep wordt altijd uitgebreid naar shardconfiguraties per extensie in plaats van één gigantisch root-projectproces. |
| `pnpm test:changed`                               | Goedkope, slimme uitvoering van gewijzigde tests: nauwkeurige doelen uit directe testbewerkingen, aangrenzende `*.test.ts`-bestanden, expliciete brontoewijzingen en de lokale importgrafiek. Brede wijzigingen in configuratie/pakketten worden overgeslagen tenzij ze aan specifieke tests kunnen worden gekoppeld.                                                                 |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Expliciete brede uitvoering van gewijzigde tests; gebruik dit wanneer een wijziging aan een testharnas, configuratie of pakket moet terugvallen op het bredere gedrag van Vitest voor gewijzigde tests.                                                                                                                                                 |
| `pnpm test:force`                                 | Maakt de geconfigureerde OpenClaw Gateway-poort vrij (standaard `18789`) en voert vervolgens de volledige suite uit met een geïsoleerde Gateway-poort, zodat servertests niet botsen met een actieve instantie.                                                                                                                                          |
| `pnpm test:coverage`                              | Genereert een informatief V8-dekkingsrapport voor de standaardunitlane (`vitest.unit.config.ts`); er worden geen dekkingsdrempels afgedwongen.                                                                                                                                                                                                          |
| `pnpm test:coverage:changed`                      | Alleen unitdekking voor bestanden die sinds `origin/main` zijn gewijzigd.                                                                                                                                                                                                                                                                              |
| `pnpm changed:lanes`                              | Toont de architectuurlanes die worden geactiveerd door het verschil met `origin/main`.                                                                                                                                                                                                                                                                 |
| `pnpm check:changed`                              | Delegeert buiten CI standaard naar Crabbox/Testbox en voert vervolgens binnen het externe child-proces de slimme controlepoort voor wijzigingen uit: opmaak plus typecontrole-, lint- en bewakingsopdrachten voor getroffen lanes. Voert Vitest niet uit; gebruik `pnpm test:changed` of `pnpm test <target>` als testbewijs.                            |

## Gedeelde teststatus en proceshelpers

- `src/test-utils/openclaw-test-state.ts`: gebruik dit vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, werkruimte, agentmap of opslag voor authenticatieprofielen nodig heeft.
- `pnpm test:env-mutations:report`: niet-blokkerend rapport van tests/harnassen die `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` of verwante omgevingssleutels rechtstreeks wijzigen. Gebruik dit om migratiekandidaten voor de gedeelde helper voor teststatus te vinden.
- `test/helpers/openclaw-test-instance.ts`: E2E-tests op procesniveau die op één plek een actieve Gateway, CLI-omgeving, logregistratie en opschoning nodig hebben.
- Docker-/Bash-E2E-lanes die `scripts/lib/docker-e2e-image.sh` inladen, kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` aan de container doorgeven en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; scripts met meerdere home-mappen kunnen `docker_e2e_test_state_function_b64` doorgeven en in elke flow `openclaw_test_state_create <label> <scenario>` aanroepen. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` schrijft een op de host in te laden omgevingsbestand (de `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als een Node-vlag behandelen). Lanes die een Gateway starten, kunnen `scripts/lib/openclaw-e2e-instance.sh` inladen voor het bepalen van het toegangspunt, het starten van een nagebootste OpenAI, uitvoering op de voorgrond/achtergrond, gereedheidscontroles, export van statusomgevingsvariabelen, logdumps en procesopschoning.

## Lanes voor Control UI, TUI en extensies

- **Gesimuleerde E2E voor de Control UI:** `pnpm test:ui:e2e` voert de Vitest- en Playwright-lane uit die de Vite Control UI start en een echte Chromium-pagina aanstuurt via een gesimuleerde Gateway-WebSocket. Tests staan in `ui/src/**/*.e2e.test.ts`; gedeelde mocks en besturingselementen staan in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` omvat deze lane. Agent-uitvoeringen gebruiken standaard Testbox/Crabbox, ook voor gerichte bewijsvoering; gebruik `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` alleen als expliciete lokale terugvaloptie.
- **TUI-PTY-tests:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` voert de snelle PTY-lane met een nagebootste backend uit. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` of `pnpm tui:pty:test:watch --mode local` voert de tragere `tui --local`-rooktest uit, die alleen het externe modeleindpunt nabootst. Controleer stabiele zichtbare tekst of fixture-aanroepen, niet onbewerkte ANSI-snapshots.
- `pnpm test:extensions` en `pnpm test extensions` voeren alle shards voor extensies/plugins uit. Zware kanaalplugins, de browserplugin en OpenAI worden als afzonderlijke shards uitgevoerd; andere plugingroepen blijven gebundeld. `pnpm test extensions/<id>` voert één gebundelde Plugin-lane uit.
- Bronbestanden met tests op hetzelfde niveau worden eerst aan die tests gekoppeld voordat wordt teruggevallen op bredere directory-globs. Bewerkingen aan helpers onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgrafiek om importerende tests uit te voeren, in plaats van elke shard breed uit te voeren wanneer het afhankelijkheidspad exact is.
- Doelen voor contractdirectory's waaieren uit naar hun contractlanes: `pnpm test src/channels/plugins/contracts` voert de vier kanaalcontractconfiguraties uit en `pnpm test src/plugins/contracts` voert de configuratie voor Plugin-contracten uit, omdat de generieke projecten `channels`/`plugins` `contracts/**` uitsluiten.
- `auto-reply` is opgesplitst in drie afzonderlijke configuraties (`core`, `top-level`, `reply`), zodat de antwoordtestomgeving de lichtere status-, token- en helpertests op het hoogste niveau niet overheerst.
- Geselecteerde testbestanden van `plugin-sdk` en `commands` worden via afzonderlijke lichte lanes uitgevoerd die alleen `test/setup.ts` behouden; runtime-intensieve gevallen blijven op hun bestaande lanes.
- De basisconfiguratie van Vitest gebruikt standaard `pool: "threads"` en `isolate: false`, waarbij de gedeelde niet-geïsoleerde runner in alle repositoryconfiguraties is ingeschakeld.
- `pnpm test:channels` voert `vitest.channels.config.ts` uit.

## Gateway en E2E

- Gateway-integratie is opt-in: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: geaggregeerde repository-E2E = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: end-to-end-rooktests voor de Gateway (koppeling van meerdere instanties via WS/HTTP/Node). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stel af met `OPENCLAW_E2E_WORKERS=<n>` en schakel uitgebreide logboeken in met `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: live tests voor providers (Claude/Minimax/DeepSeek/z.ai/enzovoort, afgeschermd door `*.live.test.ts`). Vereist API-sleutels en `LIVE=1` (of `OPENCLAW_LIVE_TEST=1`) om het overslaan uit te schakelen; uitgebreide uitvoer met `OPENCLAW_LIVE_TEST_QUIET=0`.

## Volledige Docker-testsuite (`pnpm test:docker:all`)

Bouwt de gedeelde live-testimage, verpakt OpenClaw eenmaal als een npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en voert vervolgens Docker-rooktestlanes uit via een gewogen planner. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-packer voor pakketten en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker deze gebruikt.

- Kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): lanes voor installatieprogramma's, updates en Plugin-afhankelijkheden; koppelt de vooraf gebouwde tarball aan in plaats van gekopieerde repositorybronnen.
- Functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): lanes voor normale functionaliteit van de gebouwde toepassing.
- Lanedefinities: `scripts/lib/docker-e2e-scenarios.mjs`. Planner: `scripts/lib/docker-e2e-plan.mjs`. Uitvoerder: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` genereert het door de planner beheerde CI-plan (lanes, imagetypen, behoeften aan pakketten/live-images, statusscenario's, controle van inloggegevens) zonder Docker te bouwen of uit te voeren.

Planningsinstellingen (omgevingsvariabelen, standaardwaarden tussen haakjes):

| Omgevingsvariabele                                                                                              | Standaard           | Doel                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Processlots.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Providergevoelige eindpool.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limiet voor zware live-providerlanes.                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limiet voor lanes met npm-resources.                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limiet voor lanes met serviceresources.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limieten voor zware lanes per provider.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Strengere limieten per provider.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Overschrijving voor grotere hosts.                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Vertraging tussen het starten van lanes; voorkomt pieken in aanmaakverzoeken aan de lokale Docker-daemon.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Terugvaltime-out per lane; geselecteerde live-/eindlanes gebruiken strengere limieten.                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nieuwe pogingen bij tijdelijke storingen van live providers.                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | uit                 | Drukt het lanemanifest af zonder Docker uit te voeren.                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Interval voor het afdrukken van de status van actieve lanes.                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | aan                 | Hergebruikt `.artifacts/docker-tests/lane-timings.json` voor ordening van langste naar kortste; stel in op `0` om dit uit te schakelen.                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` voor uitsluitend deterministische/lokale lanes, `only` voor uitsluitend live-providerlanes. Aliassen: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. De modus met alleen live tests voegt de hoofd- en eindlanes voor live tests samen in één pool, geordend van langste naar kortste, zodat providergroepen Claude/Codex/Gemini-taken samen inplannen. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Docker-installatietime-out voor de CLI-backend.                                                                                                                                                                                                                                                                                                       |

Het patroon voor omgevingsvariabelen voor resourcelimieten is `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (resourcenaam in hoofdletters, niet-alfanumerieke tekens samengevouwen tot `_`).

Ander gedrag: de runner voert standaard een preflightcontrole voor Docker uit, ruimt verouderde OpenClaw E2E-containers op, deelt caches van CLI-tools van providers tussen compatibele lanes en plant na de eerste fout geen nieuwe gepoolde lanes meer in, tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is ingesteld. Als één lane de effectieve gewichts-/resourcelimiet op een host met geringe parallelliteit overschrijdt, kan deze toch vanuit een lege pool starten en alleen worden uitgevoerd totdat er capaciteit wordt vrijgegeven. Logs per lane, `summary.json`, `failures.json` en fasetimings worden opgeslagen onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om trage lanes te onderzoeken en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope, gerichte opdrachten voor opnieuw uitvoeren af te drukken.

### Opmerkelijke Docker-lanes

| Opdracht                                                                    | Verifieert                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Brongebaseerde E2E-container met Chromium, onbewerkte CDP en een geïsoleerde Gateway; momentopnamen van CDP-rollen van `browser doctor --deep` bevatten link-URL's, door de cursor gepromoveerde klikbare elementen, iframe-verwijzingen en framemetadata.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:skill-install`                                            | Installeert de ingepakte tarball in een kale Docker-runner met `skills.install.allowUploadedArchives: false`, vindt via een livezoekopdracht in ClawHub de slug van een actuele skill, installeert deze via `openclaw skills install` en verifieert `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` en `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Gerichte livecontroles voor de CLI-backend; Gemini heeft overeenkomstige aliassen `:resume` en `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI in Docker: aanmelden, `/api/models` controleren en een echte geproxiede chat uitvoeren via `/api/chat/completions`. Vereist een bruikbare sleutel voor een live model en haalt een externe image op; er wordt niet verwacht dat dit even CI-stabiel is als de unit-/E2E-suites.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:mcp-channels`                                             | Vooraf gevulde Gateway-container plus een clientcontainer die `openclaw mcp serve` start: gerouteerde gespreksdetectie, transcriptlezingen, metagegevens van bijlagen, gedrag van de live-gebeurtenissenwachtrij, routering van uitgaande verzendingen en kanaal- en machtigingsmeldingen in Claude-stijl via de echte stdio-brug (de assertie leest onbewerkte stdio-MCP-frames rechtstreeks).                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:upgrade-survivor`                                         | Installeert de ingepakte tarball over een vervuilde fixture van een oude gebruiker, voert een pakketupdate plus een niet-interactieve doctor uit zonder live provider-/kanaalsleutels, start een local loopback-Gateway en controleert of agents, kanaalconfiguratie, Plugin-toegestane lijsten, werkruimte-/sessiebestanden, verouderde afhankelijkheidsstatus van legacy-Plugins, opstartstatus en RPC-status behouden blijven.                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:published-upgrade-survivor`                               | Installeert standaard `openclaw@latest`, vult realistische bestanden van bestaande gebruikers, configureert via een ingebouwd `openclaw config set`-recept, werkt bij naar de ingepakte tarball, voert een niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json` en controleert `/healthz`, `/readyz` en de RPC-status. Overschrijf met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, breid een matrix uit met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` of voeg scenariofixtures toe met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (omvat `configured-plugin-installs` en `stale-source-plugin-shadow`). Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline(s)` / `_scenarios` en verwerkt metatokens zoals `last-stable-4` of `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Testharnas voor het overleven van een gepubliceerde upgrade in het scenario `plugin-deps-cleanup`, dat standaard begint bij `openclaw@2026.4.23`. De workflow `Update Migration` breidt dit uit met `baselines=all-since-2026.4.23` om het opschonen van afhankelijkheden van geconfigureerde Plugins buiten de volledige release-CI aan te tonen.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:plugins`                                                  | Installatie-/updaterooktest voor lokale paden, `file:`, pakketten uit het npm-register met opgeheven afhankelijkheden, bewegende git-verwijzingen, ClawHub-fixtures, marketplace-updates en het inschakelen/inspecteren van Claude-bundels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Lokale PR-gate

Voer voor lokale controles voor het landen/de gate van een PR het volgende uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` sporadisch faalt op een zwaar belaste host, voer het dan eenmaal opnieuw uit voordat u dit als een regressie beschouwt en isoleer het probleem vervolgens met `pnpm test <path/to/test>`. Voor hosts met beperkt geheugen:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Hulpmiddelen voor testprestaties

- `pnpm test:perf:imports`: schakelt rapportage van Vitest-importduur en importuitsplitsing in, terwijl voor expliciete bestands-/mapdoelen nog steeds routering via afgebakende lanes wordt gebruikt. `pnpm test:perf:imports:changed` beperkt dezelfde profilering tot bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarktest het gerouteerde pad voor de gewijzigde modus ten opzichte van de systeemeigen uitvoering van het hoofdproject voor dezelfde vastgelegde git-diff; `pnpm test:perf:changed:bench -- --worktree` benchmarktest de huidige wijzigingen in de werkboom zonder ze eerst vast te leggen.
- `pnpm test:perf:profile:main` schrijft een CPU-profiel voor de hoofdthread van Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` schrijft CPU- en heap-profielen voor de unit-runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: voert elke Vitest-bladconfiguratie van de volledige testsuite serieel uit en schrijft gegroepeerde duurgegevens plus JSON-/logartefacten per configuratie. Rapporten van de volledige testsuite isoleren standaard bestanden, zodat behouden modulegrafen en GC-pauzes van eerdere bestanden niet worden toegerekend aan latere assertions; geef `-- --no-isolate` alleen door wanneer u bewust de accumulatie in een gedeelde worker profileert. De Testprestatieagent gebruikt dit als uitgangsmeting voordat deze trage tests probeert te verbeteren. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` vergelijkt gegroepeerde rapporten na een prestatiegerichte wijziging.
- Uitvoeringen van shards voor volledige configuraties, plugins en include-patronen werken lokale timinggegevens bij in `.artifacts/vitest-shard-timings.json`; latere uitvoeringen van volledige configuraties gebruiken deze timings om langzame en snelle shards te balanceren. CI-shards met include-patronen voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder timinggegevens van volledige configuraties te vervangen. Stel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` in om het lokale timingartefact te negeren.

## Benchmarks

<Accordion title="Modellatentie (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Optionele omgevingsvariabelen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Standaardprompt: "Antwoord met één woord: ok. Geen leestekens of extra tekst."

</Accordion>

<Accordion title="Opstarten van de CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Voorinstellingen:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide voorinstellingen gecombineerd

De uitvoer bevat `sampleCount`, gemiddelde, p50, p95, minimum/maximum, verdeling van afsluitcodes/signalen en maximale RSS per opdracht. `--cpu-prof-dir` / `--heap-prof-dir` schrijven per uitvoering V8-profielen.

Opgeslagen uitvoer: `pnpm test:startup:bench:smoke` schrijft `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` schrijft `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Ingecheckte fixture: `test/fixtures/cli-startup-bench.json`, vernieuwd door `pnpm test:startup:bench:update` en vergeleken door `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Opstarten van de Gateway (scripts/bench-gateway-startup.ts)">

Gebruikt standaard het gebouwde CLI-startpunt in `dist/entry.js`; voer eerst `pnpm build` uit. Geef `--entry scripts/run-node.mjs` door om in plaats daarvan de bronrunner te meten en houd die resultaten gescheiden van uitgangsmetingen voor het gebouwde startpunt.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Casus-id's: `default`, `skipChannels` (opstarten van kanalen overgeslagen), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 manifestplugins), `fiftyStartupLazyPlugins` (50 bij het opstarten lui geladen manifestplugins).

De uitvoer bevat de eerste procesuitvoer, `/healthz`, `/readyz`, de tijd van het HTTP-luisterlogboek, de tijd van het logboek waarin de Gateway gereed is, CPU-tijd, verhouding van CPU-kernen, maximale RSS, heap, metrische gegevens van de opstarttrace, vertraging van de eventloop en gedetailleerde metrische gegevens van de Plugin-opzoektabel. Het script stelt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in de omgeving van de onderliggende Gateway in.

`/healthz` geeft aan dat het proces actief is (de HTTP-server kan antwoorden). `/readyz` geeft bruikbare gereedheid aan (sidecars van opstartplugins, kanalen en voor gereedheid essentiële werkzaamheden na koppeling zijn afgerond). Opstarthooks worden asynchroon aangeroepen en vallen niet onder de gereedheidsgarantie. De tijd van het gereedheidslogboek is de interne tijdstempel van de Gateway, nuttig voor toerekening aan de proceszijde, maar geen vervanging voor de externe `/readyz`-controle.

Gebruik JSON-uitvoer of `--output` bij het vergelijken van wijzigingen. Gebruik `--cpu-prof-dir` alleen nadat trace-uitvoer wijst op import-, compilatie- of CPU-gebonden werk dat niet alleen met fasetimings kan worden verklaard.

</Accordion>

<Accordion title="Herstarten van de Gateway (scripts/bench-gateway-restart.ts)">

Alleen macOS en Linux (gebruikt SIGUSR1 voor herstarts binnen het proces; mislukt onmiddellijk op Windows). Dezelfde standaard voor het gebouwde startpunt en overschrijving met `--entry scripts/run-node.mjs` als bij het opstarten van de Gateway hierboven.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Casus-id's: `skipChannels`, `skipChannelsAcpxProbe` (ACPX-opstartcontrole ingeschakeld), `skipChannelsNoAcpxProbe` (controle uitgeschakeld), `default`, `fiftyPlugins`.

De uitvoer bevat de volgende `/healthz`, de volgende `/readyz`, uitvaltijd, timing totdat de herstart gereed is, CPU, RSS, metrische gegevens van de opstarttrace voor het vervangende proces en metrische gegevens van de herstarttrace voor signaalafhandeling, het laten leeglopen van actief werk, afsluitfasen, de volgende start, gereedheidstiming en geheugenmomentopnamen. Het script stelt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en `OPENCLAW_GATEWAY_RESTART_TRACE=1` in.

Gebruik deze benchmark wanneer een wijziging betrekking heeft op herstartsignalering, afsluitafhandelaars, opstarten na een herstart, afsluiten van sidecars, overdracht van services of gereedheid na een herstart. Begin met `skipChannels` om de werking van de Gateway te isoleren van het opstarten van kanalen; gebruik `default` of casussen met veel plugins pas nadat de beperkte casus het herstartpad verklaart. Metrische gegevens van traces zijn aanwijzingen voor toerekening, geen eindoordelen — beoordeel een herstartwijziging aan de hand van meerdere metingen, het bijbehorende eigenaarsbereik, het gedrag van `/healthz`/`/readyz` en het voor de gebruiker zichtbare herstartcontract.

</Accordion>

## E2E voor onboarding (Docker)

Optioneel; alleen nodig voor gecontaineriseerde rooktests van onboarding. Volledige koude-startstroom in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Stuurt de interactieve wizard aan via een pseudo-TTY, verifieert configuratie-, werkruimte- en sessiebestanden, start vervolgens de Gateway en voert `openclaw health` uit.

## Rooktest voor QR-import (Docker)

Waarborgt dat de onderhouden QR-runtimehelper wordt geladen onder de ondersteunde Docker-runtimes voor Node (standaard Node 24, compatibel met Node 22):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
