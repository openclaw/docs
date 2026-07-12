---
read_when:
    - Tests lokaal of in CI uitvoeren
    - Regressietests toevoegen voor model-/providerbugs
    - Gateway- en agentgedrag debuggen
summary: 'Testpakket: unit-/e2e-/live-testsuites, Docker-runners en wat elke test omvat'
title: Testen
x-i18n:
    generated_at: "2026-07-12T08:54:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw heeft drie Vitest-suites (unit/integratie, e2e, live) plus Docker-
runners. Deze pagina beschrijft wat elke suite omvat, welke opdracht je voor
een bepaalde workflow uitvoert, hoe livetests inloggegevens vinden en hoe je
regressietests toevoegt voor praktijkproblemen met providers/modellen.

<Note>
De **QA-stack (qa-lab, qa-channel, live transport-lanes)** wordt afzonderlijk gedocumenteerd:

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - architectuur, opdrachtinterface en scenario-ontwikkeling.
- [Matrix-QA](/nl/concepts/qa-matrix) - naslag voor `pnpm openclaw qa matrix`.
- [Volwassenheidsscorekaart](/nl/maturity/scorecard) - hoe QA-bewijs voor releases stabiliteits- en LTS-beslissingen ondersteunt.
- [QA-kanaal](/nl/channels/qa-channel) - de synthetische transportplugin die wordt gebruikt door scenario's uit de repository.

Deze pagina behandelt de reguliere testsuites en Docker/Parallels-runners. [QA-specifieke runners](#qa-specific-runners) hieronder vermeldt de concrete `qa`-aanroepen en verwijst terug naar de bovenstaande naslagdocumentatie.
</Note>

## Snel aan de slag

Op de meeste dagen:

- Volledige controle (verwacht vóór pushen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Snellere lokale uitvoering van de volledige suite op een ruim bemeten machine: `pnpm test:max`
- Directe Vitest-watchlus: `pnpm test:watch`
- Directe bestandsselectie routeert ook plugin-/kanaalpaden: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Geef bij het itereren op één fout eerst de voorkeur aan gerichte uitvoeringen.
- Door Docker ondersteunde QA-site: `pnpm qa:lab:up`
- Door een Linux-VM ondersteunde QA-lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wanneer je tests wijzigt of extra zekerheid wilt:

- Informatief V8-dekkingsrapport: `pnpm test:coverage`
- E2E-suite: `pnpm test:e2e`

## Tijdelijke testmappen

Gebruik de gedeelde helpers in `test/helpers/temp-dir.ts` voor tijdelijke mappen
die eigendom zijn van tests, zodat het eigendom expliciet is en opschoning
binnen de testlevenscyclus blijft:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` biedt bewust geen handmatige
opschoningsmethode: Vitest beheert de opschoning na elke test. Oudere helpers
op lager niveau (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`)
bestaan nog voor tests die niet zijn gemigreerd; vermijd nieuw gebruik ervan
en vermijd nieuwe directe aanroepen van `fs.mkdtemp*`, tenzij een test
expliciet het onbewerkte gedrag van tijdelijke mappen verifieert. Wanneer een
direct aangemaakte tijdelijke map echt nodig is, voeg je een controleerbare
toestemmingsopmerking met een reden toe:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` rapporteert nieuwe directe
aanmaak van tijdelijke mappen en nieuw handmatig gebruik van de gedeelde
helper in toegevoegde diffregels, zonder bestaande opschoningsstijlen te
blokkeren. Het volgt dezelfde classificatie van testpaden als
`scripts/changed-lanes.mjs` en slaat de implementatie van de gedeelde helper
zelf over. `check:changed` voert dit rapport voor gewijzigde testpaden uit als
CI-signaal dat alleen waarschuwt (GitHub-waarschuwingsannotaties, geen fouten).

## Live- en Docker/Parallels-workflows

Bij het debuggen van echte providers/modellen (vereist echte inloggegevens):

- Livesuite (modellen + Gateway-tool-/afbeeldingsprobes): `pnpm test:live`
- Eén livebestand stil gericht uitvoeren: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapporten over runtimeprestaties: start `OpenClaw Performance` met
  `live_openai_candidate=true` voor een echte agentbeurt met `openai/gpt-5.6-luna` of
  `deep_profile=true` voor Kova-artefacten voor CPU/heap/tracering. Dagelijks geplande
  uitvoeringen publiceren rapporten voor de mockprovider-, deep-profile- en
  GPT-5.6 Luna-lanes naar `openclaw/clawgrit-reports` vanuit een afzonderlijke
  publicatietaak die artefacten verwerkt; ontbrekende of ongeldige authenticatie
  voor publicatie laat geplande uitvoeringen en uitvoeringen met
  `profile=release` mislukken. Handmatige uitvoeringen die geen release betreffen,
  behouden de GitHub-artefacten en behandelen rapportpublicatie als adviserend.
  Het mockproviderrapport bevat ook broncijfers voor het opstarten van de Gateway,
  geheugen, pluginbelasting, herhaalde hello-lussen met nepmodellen en het
  opstarten van de CLI.
- Docker-sweep van live modellen: `pnpm test:docker:live-models`
  - Elk geselecteerd model voert een tekstbeurt uit plus een kleine probe die
    lijkt op het lezen van een bestand. Modellen waarvan de metadata
    `image`-invoer vermeldt, voeren ook een kleine afbeeldingsbeurt uit.
    Schakel de extra probes uit met `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` of
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` wanneer je providerfouten isoleert.
  - CI-dekking: zowel de dagelijkse `OpenClaw Scheduled Live And E2E Checks`
    als de handmatige `OpenClaw Release Checks` roepen de herbruikbare
    live-/E2E-workflow aan met `include_live_suites: true`, inclusief
    Docker-matrixtaken voor live modellen, opgesplitst per provider.
  - Start voor gerichte CI-heruitvoeringen `OpenClaw Live And E2E Checks (Reusable)`
    met `include_live_suites: true` en `live_models_only: true`.
  - Voeg nieuwe providergeheimen met hoge signaalwaarde toe aan
    `scripts/ci-hydrate-live-auth.sh` plus
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` en de
    geplande/release-aanroepers daarvan.
- Native Codex-smoketest voor gekoppelde chat: `pnpm test:docker:live-codex-bind`
  - Voert een Docker-livelane uit tegen het app-serverpad van Codex, koppelt een
    synthetisch Slack-privébericht met `/codex bind`, oefent `/codex fast` en
    `/codex permissions`, en verifieert vervolgens dat een gewoon antwoord en
    een afbeeldingsbijlage via de native pluginkoppeling worden gerouteerd in
    plaats van via ACP.
- Smoketest voor het Codex-app-serverharnas: `pnpm test:docker:live-codex-harness`
  - Voert Gateway-agentbeurten uit via het harnas van de Codex-app-server dat
    eigendom is van de plugin, verifieert `/codex status` en `/codex models`,
    en voert standaard probes uit voor afbeeldingen, cron-MCP, subagents en
    Guardian. Schakel de subagentprobe uit met
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` wanneer je andere fouten
    isoleert. Schakel voor een gerichte subagentcontrole de andere probes uit:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dit stopt na de subagentprobe, tenzij
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` is ingesteld.
- Codex-smoketest voor installatie op aanvraag: `pnpm test:docker:codex-on-demand`
  - Installeert het verpakte OpenClaw-tarball in Docker, voert onboarding met
    een OpenAI-API-sleutel uit en verifieert dat de Codex-plugin plus de
    afhankelijkheid `@openai/codex` op aanvraag naar de hoofdmap van het
    beheerde npm-project zijn gedownload.
- Live-smoketest voor afhankelijkheid van een plugintool: `pnpm test:docker:live-plugin-tool`
  - Verpakt een fixtureplugin met een echte `slugify`-afhankelijkheid,
    installeert deze via `npm-pack:`, verifieert de afhankelijkheid onder de
    hoofdmap van het beheerde npm-project en vraagt vervolgens een live
    OpenAI-model om de plugintool aan te roepen en de verborgen slug terug te geven.
- Smoketest voor de Crestodian-reddingsopdracht: `pnpm test:live:crestodian-rescue-channel`
  - Optionele extra controle voor het oppervlak van de reddingsopdracht in het
    berichtkanaal. Voert `/crestodian status` uit, zet een blijvende
    modelwijziging in de wachtrij, antwoordt met `/crestodian yes` en verifieert
    het schrijfpad voor audit/configuratie.
- Docker-smoketest voor de eerste uitvoering van Crestodian: `pnpm test:docker:crestodian-first-run`
  - Begint met een lege OpenClaw-statusmap en bewijst eerst dat de verpakte
    CLI `openclaw crestodian` veilig weigert zonder inferentie. Vervolgens
    test en activeert deze nep-Claude via de verpakte activeringsmodule.
    Pas daarna bereikt een onnauwkeurig geformuleerd verzoek via de verpakte
    CLI de planner en wordt het omgezet in getypeerde configuratie, gevolgd
    door eenmalige bewerkingen voor model, agent, Discord-plugin en SecretRef.
    De test valideert configuratie- en auditvermeldingen. Dit is ondersteunend
    bewijs voor controles/bewerkingen, geen bewijs voor interactieve onboarding
    of voor een Crestodian-agent/tool/goedkeuringsproces. Dezelfde lane is in
    QA Lab beschikbaar via
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-kostensmoketest: voer met ingestelde `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` uit en voer vervolgens een
  geïsoleerde
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  uit tegen `moonshot/kimi-k2.6`. Controleer of de JSON Moonshot/K2.6 rapporteert
  en het transcript van de assistent genormaliseerde `usage.cost` opslaat.

<Tip>
Wanneer je slechts één falend geval nodig hebt, kun je livetests het beste beperken via de hieronder beschreven allowlist-omgevingsvariabelen.
</Tip>

## QA-specifieke runners

Deze opdrachten staan naast de hoofdtestsuites wanneer je het realisme van QA Lab nodig hebt.

CI voert QA Lab uit in speciale workflows. Pariteit voor agents valt onder
`QA-Lab - All Lanes` en releasevalidatie, niet onder een zelfstandige
PR-workflow. Gebruik voor brede validatie `Full Release Validation` met
`rerun_group=qa-parity` of de QA-groep van de releasecontroles. Stabiele/standaard
releasecontroles houden uitgebreide live-/Docker-duurtests achter
`run_release_soak=true`; het profiel `full` schakelt duurtests verplicht in.
`QA-Lab - All Lanes` wordt elke nacht op `main` en via handmatige uitvoering
gestart, met de mockpariteitslane, live Matrix-lane, door Convex beheerde live
Telegram-lane en door Convex beheerde live Discord-lane als parallelle taken.
Geplande QA- en releasecontroles geven voor Matrix expliciet `--profile fast`
door, terwijl de standaardwaarde voor de Matrix-CLI en de invoer van de
handmatige workflow `all` blijft; handmatige uitvoering kan `all` opsplitsen
in de taken `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.
`OpenClaw Release Checks` voert vóór releasegoedkeuring pariteit plus de snelle
Matrix- en Telegram-lanes uit en gebruikt `mock-openai/gpt-5.6-luna` voor
transportcontroles van releases, zodat deze deterministisch blijven en het
normale opstarten van providerplugins vermijden. Deze live transport-Gateways
schakelen geheugenzoekopdrachten uit; geheugengedrag blijft gedekt door de
QA-pariteitssuites.

Live-mediashards voor volledige releases gebruiken
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, waarin `ffmpeg` en
`ffprobe` al aanwezig zijn. Docker-shards voor live modellen/backends gebruiken
de gedeelde image `ghcr.io/openclaw/openclaw-live-test:<sha>`, die eenmaal per
geselecteerde commit wordt gebouwd, en halen deze vervolgens op met
`OPENCLAW_SKIP_DOCKER_BUILD=1` in plaats van deze in elke shard opnieuw te bouwen.

- `pnpm openclaw qa suite`
  - Voert repositoryondersteunde QA-scenario's rechtstreeks op de host uit.
  - Schrijft de artefacten `qa-evidence.json`, `qa-suite-summary.json` en
    `qa-suite-report.md` op het hoogste niveau voor de geselecteerde scenarioset,
    inclusief selecties van scenario's voor gemengde stromen, Vitest en Playwright.
  - Bij aanroep via `pnpm openclaw qa run --qa-profile <profile>` wordt
    de scorekaart van het geselecteerde taxonomieprofiel in dezelfde `qa-evidence.json`
    opgenomen. `smoke-ci` schrijft beknopt bewijs (`evidenceMode: "slim"`, geen
    `execution` per vermelding). `release` omvat de samengestelde selectie voor
    releasegereedheid; `all` selecteert elke actieve volwassenheidscategorie en is
    gericht op expliciete workflowaanroepen van QA-profielbewijs wanneer een volledig
    scorekaartartefact nodig is.
  - Voert standaard meerdere geselecteerde scenario's parallel uit met geïsoleerde
    Gateway-workers. `qa-channel` gebruikt standaard gelijktijdigheid 4 (begrensd door
    het aantal geselecteerde scenario's). Gebruik `--concurrency <count>` om het aantal
    workers af te stemmen, of `--concurrency 1` voor het oudere seriële traject.
  - Sluit af met een niet-nulcode wanneer een scenario mislukt. Gebruik
    `--allow-failures` voor artefacten zonder een afsluitcode die een fout aangeeft.
  - Ondersteunt de providermodi `live-frontier`, `mock-openai` en `aimock`.
    `aimock` start een lokale, door AIMock ondersteunde providerserver voor experimentele
    dekking van fixtures en protocolmocks, zonder het scenariobewuste
    `mock-openai`-traject te vervangen.
- `pnpm openclaw qa coverage --match <query>`
  - Doorzoekt scenario-ID's, titels, oppervlakken, dekkings-ID's, documentatiereferenties,
    codereferenties, plugins en providervereisten en toont vervolgens overeenkomende
    suitedoelen.
  - Gebruik dit vóór een QA Lab-uitvoering wanneer u het gewijzigde gedrag of bestandspad
    kent, maar niet het kleinste scenario. Dit is alleen adviserend: kies nog steeds
    bewijs via een mock, live-uitvoering, Multipass, Matrix of transport op basis van
    het gedrag dat wordt gewijzigd.
- `pnpm test:plugins:kitchen-sink-live`
  - Voert de live OpenAI Kitchen Sink-pluginproef uit via QA Lab.
    Installeert het externe Kitchen Sink-pakket, verifieert de inventaris van het
    plugin-SDK-oppervlak, test `/healthz` en `/readyz`, registreert bewijs voor
    CPU/RSS van de Gateway, voert een live OpenAI-beurt uit en controleert
    vijandige diagnostiek. Vereist live OpenAI-authenticatie, zoals
    `OPENAI_API_KEY`. In gehydrateerde Testbox-sessies wordt automatisch het
    Testbox-profiel voor live-authenticatie ingeladen wanneer de helper
    `openclaw-testbox-env` aanwezig is.
- `pnpm test:gateway:cpu-scenarios`
  - Voert de opstartbenchmark van de Gateway uit, plus een klein pakket
    mockscenario's van QA Lab (`channel-chat-baseline`,
    `memory-failure-fallback`, `gateway-restart-inflight-run`) en schrijft een
    gecombineerde samenvatting van CPU-waarnemingen onder
    `.artifacts/gateway-cpu-scenarios/`.
  - Markeert standaard alleen aanhoudende waarnemingen van hoge CPU-belasting
    (`--cpu-core-warn`, standaard `0.9`; `--hot-wall-warn-ms`, standaard
    `30000`), zodat korte pieken tijdens het opstarten als metingen worden
    geregistreerd zonder te lijken op de regressie waarbij de Gateway minutenlang
    de CPU volledig belast.
  - Wordt uitgevoerd met gebouwde `dist`-artefacten; voer eerst een build uit
    wanneer de checkout nog geen recente runtime-uitvoer bevat.
- `pnpm openclaw qa suite --runner multipass`
  - Voert dezelfde QA-suite uit binnen een tijdelijke Multipass Linux-VM, met
    dezelfde vlaggen voor scenarioselectie, provider en model als `qa suite`.
  - Live-uitvoeringen sturen de QA-authenticatie-invoer door die bruikbaar is
    voor de gast: providerkeys uit omgevingsvariabelen, het configuratiepad van
    de live QA-provider en `CODEX_HOME` indien aanwezig.
  - Uitvoermappen moeten onder de hoofdmap van de repository blijven, zodat de
    gast via de gekoppelde werkruimte kan terugschrijven.
  - Schrijft het normale QA-rapport en de samenvatting, plus Multipass-logboeken,
    onder `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Start de door Docker ondersteunde QA-site voor QA-werk door operators.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Bouwt een npm-tarball vanuit de huidige checkout, installeert deze globaal
    in Docker, voert niet-interactieve onboarding met een OpenAI-API-key uit,
    configureert standaard Telegram, verifieert dat de runtime van de verpakte
    plugin wordt geladen zonder herstel van afhankelijkheden tijdens het opstarten,
    voert doctor uit en voert één lokale agentbeurt uit tegen een gemockt
    OpenAI-eindpunt.
  - Gebruik `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` om hetzelfde traject voor
    verpakte installatie met Discord uit te voeren.
- `pnpm test:docker:session-runtime-context`
  - Voert een deterministische Docker-smoketest van de gebouwde app uit voor
    transcripties van ingebedde runtimecontext. Verifieert dat verborgen
    OpenClaw-runtimecontext behouden blijft als een niet-weergegeven aangepast
    bericht in plaats van in de zichtbare gebruikersbeurt terecht te komen,
    initialiseert vervolgens een getroffen, defecte sessie-JSONL en verifieert
    dat `openclaw doctor --fix` deze met een back-up herschrijft naar de actieve
    vertakking.
- `pnpm test:docker:npm-telegram-live`
  - Installeert een kandidaat-OpenClaw-pakket in Docker, voert onboarding voor
    het geïnstalleerde pakket uit, configureert Telegram via de geïnstalleerde
    CLI en hergebruikt vervolgens het live Telegram-QA-traject met dat
    geïnstalleerde pakket als de te testen Gateway.
  - De wrapper koppelt alleen de broncode van het `qa-lab`-harnas vanuit de
    checkout; het geïnstalleerde pakket beheert `dist`, `openclaw/plugin-sdk`
    en de runtime van gebundelde plugins, zodat het traject geen plugins uit
    de huidige checkout vermengt met het geteste pakket.
  - Standaard wordt `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` gebruikt;
    stel `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` of
    `OPENCLAW_CURRENT_PACKAGE_TGZ` in om in plaats van installatie vanuit het
    register een opgeloste lokale tarball te testen.
  - Schrijft standaard herhaalde RTT-tijdmetingen naar `qa-evidence.json` met
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Overschrijf
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om de uitvoering af te stemmen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepteert een door komma's gescheiden
    lijst met ID's van Telegram-QA-controles om te bemonsteren; wanneer deze
    niet is ingesteld, is de standaard RTT-geschikte controle
    `telegram-mentioned-message-reply`.
  - Gebruikt dezelfde Telegram-inloggegevens uit omgevingsvariabelen of
    Convex-inloggegevensbron als `pnpm openclaw qa telegram`. Stel voor
    CI-/releaseautomatisering `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`
    in, samen met `OPENCLAW_QA_CONVEX_SITE_URL` en een rolgeheim. Als
    `OPENCLAW_QA_CONVEX_SITE_URL` en een Convex-rolgeheim aanwezig zijn in CI,
    selecteert de Docker-wrapper automatisch Convex.
  - De wrapper valideert de omgevingsvariabelen met Telegram- of
    Convex-inloggegevens op de host voordat Docker met bouwen/installeren begint.
    Stel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` alleen in wanneer
    u doelbewust de installatie vóór het instellen van inloggegevens debugt.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` overschrijft alleen
    voor dit traject de gedeelde `OPENCLAW_QA_CREDENTIAL_ROLE`. Wanneer
    Convex-inloggegevens zijn geselecteerd en geen rol is ingesteld, gebruikt
    de wrapper `ci` binnen CI en `maintainer` buiten CI.
  - GitHub Actions biedt dit traject aan als de handmatige maintainerworkflow
    `NPM Telegram Beta E2E`. Deze wordt niet uitgevoerd bij samenvoegen. De
    workflow gebruikt de omgeving `qa-live-shared` en leases voor
    Convex-CI-inloggegevens.
- GitHub Actions biedt ook `Package Acceptance` voor afzonderlijk uitgevoerd
  productbewijs tegen één kandidaatpakket. De workflow accepteert een Git-ref,
  gepubliceerde npm-specificatie, HTTPS-tarball-URL plus SHA-256, beleid voor
  vertrouwde URL's of een tarballartefact uit een andere uitvoering
  (`source=ref|npm|url|trusted-url|artifact`), uploadt het genormaliseerde
  `openclaw-current.tgz` als `package-under-test` en voert vervolgens de
  bestaande Docker-E2E-planner uit met de trajectprofielen `smoke`, `package`,
  `product`, `full` of `custom`. Stel `telegram_mode=mock-openai` of
  `live-frontier` in om de Telegram-QA-workflow tegen hetzelfde
  `package-under-test`-artefact uit te voeren.
  - Productbewijs voor de nieuwste bèta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bewijs met een exacte tarball-URL vereist een digest en gebruikt het
  veiligheidsbeleid voor openbare URL's:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Tarballmirrors voor ondernemingen of privégebruik gebruiken een expliciet
  beleid voor vertrouwde bronnen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` leest `.github/package-trusted-sources.json` uit de
vertrouwde workflowref en accepteert geen inloggegevens in URL's of een via
workflowinvoer opgegeven omzeiling voor privénetwerken. Als het genoemde beleid
bearer-authenticatie voorschrijft, configureert u het vaste geheim
`OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artefactbewijs downloadt een tarballartefact uit een andere Actions-uitvoering:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Verpakt en installeert de huidige OpenClaw-build in Docker, start de
    Gateway met geconfigureerde OpenAI en schakelt vervolgens gebundelde
    kanalen/plugins in via configuratiewijzigingen.
  - Verifieert dat installatiedetectie niet-geconfigureerde downloadbare
    plugins afwezig laat, dat het eerste geconfigureerde herstel door doctor
    elke ontbrekende downloadbare plugin expliciet installeert en dat een
    tweede herstart geen verborgen herstel van afhankelijkheden uitvoert.
  - Installeert ook een bekende oudere npm-basisversie, schakelt Telegram in
    vóór uitvoering van `openclaw update --tag <candidate>` en verifieert dat
    doctor na de update van de kandidaat verouderde resten van
    pluginafhankelijkheden opruimt zonder herstel via postinstall aan de kant
    van het harnas.
- `pnpm test:parallels:npm-update`
  - Voert de native smoketest voor updates van verpakte installaties uit op
    Parallels-gasten. Elk geselecteerd platform installeert eerst het gevraagde
    basispakket, voert vervolgens de geïnstalleerde opdracht `openclaw update`
    uit in dezelfde gast en verifieert de geïnstalleerde versie, updatestatus,
    gereedheid van de Gateway en één lokale agentbeurt.
  - Gebruik `--platform macos`, `--platform windows` of `--platform linux`
    tijdens iteraties op één gast. Gebruik `--json` voor het pad van het
    samenvattingsartefact en de status per traject.
  - Het OpenAI-traject gebruikt standaard `openai/gpt-5.6-luna` voor het bewijs
    van de live agentbeurt. Geef `--model <provider/model>` door of stel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` in om een ander OpenAI-model te valideren.
  - Omwikkel lange lokale uitvoeringen met een time-out op de host, zodat
    vastlopers in het Parallels-transport niet de rest van het testvenster
    kunnen verbruiken:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Het script schrijft geneste trajectlogboeken onder
    `/tmp/openclaw-parallels-npm-update.*`. Inspecteer `windows-update.log`,
    `macos-update.log` of `linux-update.log` voordat u aanneemt dat de buitenste
    wrapper is vastgelopen.
  - Een Windows-update kan op een koude gast 10 tot 15 minuten besteden aan
    doctor na de update en aan het bijwerken van pakketten; dit is nog steeds
    normaal zolang het geneste npm-debuglogboek voortgang vertoont.
  - Voer deze verzamelwrapper niet parallel uit met afzonderlijke
    Parallels-smoketrajecten voor macOS, Windows of Linux. Ze delen VM-status
    en kunnen botsen bij het herstellen van momentopnamen, het aanbieden van
    pakketten of de Gateway-status van de gast.
  - Het bewijs na de update voert het normale oppervlak van gebundelde plugins
    uit, omdat capaciteitsfacades zoals spraak, afbeeldingsgeneratie en
    mediabegrip via gebundelde runtime-API's worden geladen, zelfs wanneer de
    agentbeurt zelf alleen een eenvoudige tekstreactie controleert.

- `pnpm openclaw qa aimock`
  - Start alleen de lokale AIMock-providerserver voor directe protocolrooktests.
- `pnpm openclaw qa matrix`
  - Voert de live QA-lane voor Matrix uit op een tijdelijke, door Docker ondersteunde Tuwunel-homeserver. Alleen voor broncodecheck-outs; verpakte installaties bevatten `qa-lab` niet.
  - Volledige CLI, profiel-/scenariocatalogus, omgevingsvariabelen en artefactindeling:
    [Matrix-QA](/nl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Voert de live QA-lane voor Telegram uit in een echte privégroep met de bot-tokens voor het stuurprogramma en het te testen systeem uit de omgeving.
  - Vereist `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` en
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. De groeps-id moet de numerieke
    Telegram-chat-id zijn.
  - Ondersteunt `--credential-source convex` voor gedeelde referenties uit een pool.
    Gebruik standaard de omgevingsmodus of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    in om leases uit de pool te gebruiken.
  - De standaardinstellingen omvatten canary-controle, vermeldingstoegang, opdrachtadressering, `/status`,
    vermelde antwoorden tussen bots en antwoorden op ingebouwde kernopdrachten.
    De standaardinstellingen van `mock-openai` omvatten ook deterministische regressies voor antwoordketens en
    het streamen van definitieve Telegram-berichten. Gebruik `--list-scenarios`
    voor optionele controles zoals `session_status`.
  - Sluit af met een niet-nulcode wanneer een scenario mislukt. Gebruik `--allow-failures` voor
    artefacten zonder een afsluitcode die een fout aangeeft.
  - Vereist twee verschillende bots in dezelfde privégroep, waarbij de bot van het te testen systeem
    een Telegram-gebruikersnaam heeft.
  - Schakel voor stabiele waarneming tussen bots de Bot-to-Bot Communication Mode
    in `@BotFather` voor beide bots in en zorg dat de stuurprogrammabot
    botverkeer in de groep kan waarnemen.
  - Schrijft een Telegram-QA-rapport, samenvatting en `qa-evidence.json` naar
    `.artifacts/qa-e2e/...`. Antwoordscenario's bevatten de retourtijd vanaf het verzendverzoek
    van het stuurprogramma tot het waargenomen antwoord van het te testen systeem.

`Mantis Telegram Live` is de PR-bewijswrapper rond deze lane. Deze voert
de kandidaatref uit met via Convex geleasete Telegram-referenties, geeft de
geredigeerde QA-rapport-/bewijsbundel weer in een Crabbox-desktopbrowser, neemt MP4-bewijs
op, genereert een op beweging bijgesneden GIF, uploadt de artefactbundel en
plaatst inline PR-bewijs via de Mantis GitHub App wanneer `pr_number` is
ingesteld. Beheerders kunnen deze vanuit de Actions-UI starten via `Mantis Scenario`
(`scenario_id: telegram-live`) of rechtstreeks vanuit een opmerking bij een pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` is de agentgestuurde wrapper met systeemeigen Telegram Desktop
voor visueel voor-en-na-bewijs van een PR. Start deze vanuit de Actions-UI met
vrije `instructions`, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) of vanuit een PR-opmerking:

```text
@openclaw-mantis telegram desktop proof
```

De Mantis-agent leest de PR, bepaalt welk in Telegram zichtbaar gedrag de
wijziging bewijst, voert de Crabbox-bewijslane voor Telegram Desktop met een echte gebruiker uit op
basis- en kandidaatrefs, itereert totdat de systeemeigen GIF's bruikbaar zijn,
schrijft een gekoppeld `motionPreview`-manifest en plaatst via de Mantis GitHub App
dezelfde GIF-tabel met twee kolommen wanneer `pr_number` is ingesteld.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Leaset of hergebruikt een Crabbox Linux-desktop, installeert het systeemeigen Telegram
    Desktop, configureert OpenClaw met een geleaset Telegram-bot-token voor het te testen systeem,
    start de Gateway en neemt schermafbeeldings-/MP4-bewijs op van het
    zichtbare VNC-bureaublad.
  - Gebruikt standaard `--credential-source convex`, zodat werkstromen alleen het
    geheim van de Convex-broker nodig hebben. Gebruik `--credential-source env` met dezelfde
    `OPENCLAW_QA_TELEGRAM_*`-variabelen als `pnpm openclaw qa telegram`.
  - Telegram Desktop heeft nog steeds een gebruikersaanmelding/-profiel nodig. Het bot-token
    configureert alleen OpenClaw. Gebruik `--telegram-profile-archive-env <name>`
    voor een base64-`.tgz`-profielarchief of gebruik `--keep-lease` en meld u
    eenmaal handmatig aan via VNC.
  - Schrijft `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` en `telegram-desktop-builder.mp4`
    naar de uitvoermap.

Live transportlanes delen één standaardcontract, zodat nieuwe transporten niet
uiteenlopen; de dekkingsmatrix per lane staat in
[QA-overzicht - Dekking van live transporten](/nl/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` is de brede synthetische suite en maakt geen deel uit van die matrix.

### Gedeelde Telegram-referenties via Convex (v1)

Wanneer `--credential-source convex` (of `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
is ingeschakeld voor live transport-QA, verkrijgt het QA-lab een exclusieve lease uit een
door Convex ondersteunde pool, stuurt het tijdens de uitvoering van de lane Heartbeats voor die lease en
geeft het de lease vrij bij afsluiten. De sectienaam dateert van vóór ondersteuning voor Discord, Slack en
WhatsApp; het leasecontract wordt tussen de typen gedeeld.

Referentiesjabloon voor het Convex-project: `qa/convex-credential-broker/`

Vereiste omgevingsvariabelen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (bijvoorbeeld `https://your-deployment.convex.site`)
- Eén geheim voor de geselecteerde rol:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` voor `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` voor `ci`
- Selectie van referentierol:
  - CLI: `--credential-role maintainer|ci`
  - Standaardwaarde uit omgeving: `OPENCLAW_QA_CREDENTIAL_ROLE` (standaard `ci` in CI, anders `maintainer`)

Optionele omgevingsvariabelen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standaard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standaard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standaard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standaard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standaard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionele tracerings-id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` staat Convex-URL's met local loopback via `http://` toe voor uitsluitend lokale ontwikkeling.

`OPENCLAW_QA_CONVEX_SITE_URL` moet bij normaal gebruik `https://` gebruiken.

Beheeropdrachten voor beheerders (toevoegen aan/verwijderen uit/weergeven van pool) vereisen specifiek
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-hulpprogramma's voor beheerders:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gebruik `doctor` vóór live uitvoeringen om de Convex-site-URL, brokergeheimen,
het eindpuntvoorvoegsel, de HTTP-time-out en de bereikbaarheid van beheer/weergave te controleren zonder
geheime waarden af te drukken. Gebruik `--json` voor machineleesbare uitvoer in scripts en CI-
hulpprogramma's.

Standaard eindpuntcontract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Verzoeken verifiëren zich met een `Authorization: Bearer <role secret>`-header;
de onderstaande berichtlichamen laten die header weg:

- `POST /acquire`
  - Verzoek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Geslaagd: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Uitgeput/opnieuw te proberen: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Geslaagd: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /release`
  - Verzoek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Geslaagd: `{ status: "ok" }` (of lege `2xx`)
- `POST /admin/add` (alleen beheerdersgeheim)
  - Verzoek: `{ kind, actorId, payload, note?, status? }`
  - Geslaagd: `{ status: "ok", credential }`
- `POST /admin/remove` (alleen beheerdersgeheim)
  - Verzoek: `{ credentialId, actorId }`
  - Geslaagd: `{ status: "ok", changed, credential }`
  - Beveiliging tegen actieve lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (alleen beheerdersgeheim)
  - Verzoek: `{ kind?, status?, includePayload?, limit? }`
  - Geslaagd: `{ status: "ok", credentials, count }`

Structuur van de payload voor het Telegram-type:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` moet een tekenreeks met een numerieke Telegram-chat-id zijn.
- `admin/add` valideert deze structuur voor `kind: "telegram"` en weigert onjuist gevormde payloads.

Structuur van de payload voor het Telegram-type met echte gebruiker:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` en `telegramApiId` moeten numerieke tekenreeksen zijn.
- `tdlibArchiveSha256` en `desktopTdataArchiveSha256` moeten hexadecimale SHA-256-tekenreeksen zijn.
- `kind: "telegram-user"` is gereserveerd voor de Mantis-werkstroom voor Telegram Desktop-bewijs. Algemene QA-lablanes mogen dit type niet verkrijgen.

Door de broker gevalideerde payloads voor meerdere kanalen:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-lanes kunnen ook uit de pool leasen, maar de validatie van Slack-payloads
bevindt zich momenteel in de Slack-QA-runner in plaats van in de broker. Gebruik
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
voor Slack-rijen.

### Een kanaal aan QA toevoegen

De architectuur en namen van scenariohulpprogramma's voor nieuwe kanaaladapters staan in
[QA-overzicht - Een kanaal toevoegen](/nl/concepts/qa-e2e-automation#adding-a-channel).
De minimumvereisten: implementeer de transportrunner op de gedeelde `qa-lab`-host-
naad, voeg een `adapterFactory` toe voor gedeelde scenario's, declareer `qaRunners` in het
Plugin-manifest, koppel deze als `openclaw qa <runner>` en schrijf scenario's onder
`qa/scenarios/`.

## Testsuites (wat waar wordt uitgevoerd)

Beschouw de suites als een reeks met „toenemend realisme” (en toenemende instabiliteit/kosten).

### Unit-/integratietests (standaard)

- Opdracht: `pnpm test`
- Configuratie: niet-gerichte uitvoeringen gebruiken de shardset `vitest.full-*.config.ts` en kunnen
  shards met meerdere projecten uitbreiden naar configuraties per project voor parallelle
  planning
- Bestanden: kern-/unitinventarissen onder `src/**/*.test.ts`,
  `packages/**/*.test.ts` en `test/**/*.test.ts`; UI-unittests worden uitgevoerd in de
  afzonderlijke `unit-ui`-shard
- Bereik:
  - Zuivere unittests
  - Integratietests binnen het proces (Gateway-authenticatie, routering, hulpmiddelen, parsering, configuratie)
  - Deterministische regressietests voor bekende fouten
- Verwachtingen:
  - Wordt uitgevoerd in CI
  - Geen echte sleutels vereist
  - Moet snel en stabiel zijn
  - Tests voor resolvers en loaders van openbare oppervlakken moeten breed terugvalgedrag voor `api.js` en
    `runtime-api.js` aantonen met gegenereerde minimale Plugin-fixtures,
    niet met echte bron-API's van gebundelde Plugins. Het laden van echte Plugin-API's hoort thuis in
    contractsuites/integratiesuites van de betreffende Plugin.

Beleid voor systeemeigen afhankelijkheden:

- Standaard testinstallaties slaan optionele systeemeigen Discord-opusbuilds over. Discord-
  spraak gebruikt de gebundelde `libopus-wasm` en `@discordjs/opus` blijft uitgeschakeld in
  `allowBuilds`, zodat lokale tests en Testbox-lanes de systeemeigen
  add-on niet compileren.
- Vergelijk de prestaties van systeemeigen opus in de benchmarkrepository van `libopus-wasm`, niet
  in de standaard installatie-/testlussen van OpenClaw. Stel `@discordjs/opus` niet in op
  `true` in de standaardwaarde van `allowBuilds`; daardoor compileren niet-gerelateerde installatie-/testlussen
  systeemeigen code.

<AccordionGroup>
  <Accordion title="Projecten, shards en afgebakende lanes">

    - Niet-doelgerichte uitvoeringen van `pnpm test` gebruiken dertien kleinere shardconfiguraties (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) in plaats van één gigantisch native hoofdprojectproces. Dit verlaagt het maximale RSS-gebruik op zwaarbelaste machines en voorkomt dat auto-reply-/Plugin-werk niet-gerelateerde suites verdringt.
    - `pnpm test --watch` gebruikt nog steeds de native `vitest.config.ts`-projectgraaf van het hoofdproject, omdat een watch-lus met meerdere shards niet praktisch is.
    - `pnpm test`, `pnpm test:watch` en `pnpm test:perf:imports` leiden expliciete bestands-/mapdoelen eerst door afgebakende lanes, zodat `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` niet de volledige opstartkosten van het hoofdproject hoeft te dragen.
    - `pnpm test:changed` breidt gewijzigde git-paden standaard uit naar goedkope afgebakende lanes: directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronkoppelingen en afhankelijke onderdelen uit de lokale importgraaf. Bewerkingen aan configuratie, installatie of pakketten voeren tests niet breed uit, tenzij u expliciet `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` gebruikt.
    - `pnpm check:changed` is de normale slimme lokale controlepoort voor beperkt werk. Deze classificeert de diff in kern, kerntests, plugins, plugintests, apps, documentatie, releasemetagegevens, live Docker-hulpmiddelen en tooling, en voert vervolgens de bijbehorende typecontrole-, lint- en bewakingsopdrachten uit. Vitest-tests worden niet uitgevoerd; roep `pnpm test:changed` of expliciet `pnpm test <target>` aan als testbewijs. Versieverhogingen die uitsluitend releasemetagegevens wijzigen, voeren gerichte controles van versies, configuratie en hoofdafhankelijkheden uit, met een bewaking die pakketwijzigingen buiten het versieveld op het hoogste niveau afwijst.
    - Bewerkingen aan de live Docker ACP-harnas voeren gerichte controles uit: shellsyntaxis voor de live Docker-authenticatiescripts en een proefuitvoering van de live Docker-planner. Wijzigingen in `package.json` worden alleen meegenomen wanneer de diff beperkt is tot `scripts["test:docker:live-*"]`; bewerkingen van afhankelijkheden, exports, versies en andere pakketoppervlakken gebruiken nog steeds de bredere bewakingen.
    - Importarme unittests van agents, opdrachten, plugins, auto-reply-helpers, `plugin-sdk` en vergelijkbare gebieden met pure hulpprogramma's worden door de lane `unit-fast` geleid, die `test/setup-openclaw-runtime.ts` overslaat; bestanden met veel status- of runtimegebruik blijven op de bestaande lanes.
    - Geselecteerde bronbestanden met helpers uit `plugin-sdk` en `commands` koppelen uitvoeringen in gewijzigde modus ook aan expliciete naastgelegen tests in die lichte lanes, zodat helperbewerkingen niet de volledige zware suite voor die map opnieuw uitvoeren.
    - `auto-reply` heeft speciale groepen voor kernhelpers op het hoogste niveau, integratietests van `reply.*` op het hoogste niveau en de substructuur `src/auto-reply/reply/**`. CI splitst de reply-substructuur verder op in shards voor agent-runner, dispatch en opdracht-/statusroutering, zodat één importzware groep niet de volledige Node-staart beheert.
    - Normale CI voor PR/main slaat bewust de batchsweep voor gebundelde plugins en de uitsluitend voor releases bedoelde shard `agentic-plugins` over. Volledige releasevalidatie start voor deze Plugin-zware suites bij releasekandidaten de afzonderlijke onderliggende workflow `Plugin Prerelease`.

  </Accordion>

  <Accordion title="Dekking van de ingebedde runner">

    - Wanneer u invoer voor de detectie van berichttools of de runtimecontext van Compaction wijzigt, moet u beide dekkingsniveaus behouden.
    - Voeg gerichte helperregressietests toe voor zuivere routerings- en normalisatiegrenzen.
    - Houd de integratiesuites van de ingebedde runner gezond:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` en
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Deze suites verifiëren dat afgebakende id's en Compaction-gedrag nog steeds
      door de echte paden `run.ts` / `compact.ts` stromen; tests die alleen
      helpers testen, zijn geen voldoende vervanging voor die integratiepaden.

  </Accordion>

  <Accordion title="Standaardwaarden voor Vitest-pool en -isolatie">

    - De basisconfiguratie van Vitest gebruikt standaard `threads`.
    - De gedeelde Vitest-configuratie stelt `isolate: false` vast en gebruikt de
      niet-geïsoleerde runner in de hoofdprojecten en de e2e- en liveconfiguraties.
    - De UI-lane van het hoofdproject behoudt de `jsdom`-installatie en optimalisator, maar gebruikt
      eveneens de gedeelde niet-geïsoleerde runner.
    - Elke `pnpm test`-shard neemt dezelfde standaardwaarden `threads` + `isolate: false`
      over van de gedeelde Vitest-configuratie.
    - `scripts/run-vitest.mjs` voegt standaard `--no-maglev` toe voor onderliggende Node-processen
      van Vitest om V8-compilatieverloop tijdens grote lokale uitvoeringen te beperken.
      Stel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` in om te vergelijken met standaard V8-gedrag.
    - `scripts/run-vitest.mjs` beëindigt expliciete Vitest-uitvoeringen buiten de watch-modus
      na 5 minuten zonder uitvoer naar stdout of stderr. Stel
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` in om de bewaking uit te schakelen voor
      een bewust stil onderzoek.

  </Accordion>

  <Accordion title="Snelle lokale iteratie">

    - `pnpm changed:lanes` toont welke architecturale lanes door een diff worden geactiveerd.
    - De pre-commithaak voert alleen formattering uit. Deze voegt geformatteerde bestanden
      opnieuw toe aan de staging en voert geen lint, typecontrole of tests uit.
    - Voer `pnpm check:changed` expliciet uit vóór overdracht of push wanneer u
      de slimme lokale controlepoort nodig hebt.
    - `pnpm test:changed` routeert standaard via goedkope afgebakende lanes. Gebruik
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de agent
      bepaalt dat een bewerking aan het harnas, de configuratie, een pakket of een contract
      werkelijk bredere Vitest-dekking nodig heeft.
    - `pnpm test:max` en `pnpm test:changed:max` behouden hetzelfde routeringsgedrag,
      maar met een hogere limiet voor workers.
    - Automatische schaling van lokale workers is bewust conservatief en schaalt terug
      wanneer het gemiddelde belastingsniveau van de host al hoog is, zodat meerdere gelijktijdige
      Vitest-uitvoeringen standaard minder schade aanrichten.
    - De basisconfiguratie van Vitest markeert de projecten/configuratiebestanden als
      `forceRerunTriggers`, zodat heruitvoeringen in gewijzigde modus correct blijven wanneer
      de testbedrading verandert.
    - De configuratie houdt `OPENCLAW_VITEST_FS_MODULE_CACHE` ingeschakeld op
      ondersteunde hosts; stel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      in voor één expliciete cachelocatie voor directe profilering.

  </Accordion>

  <Accordion title="Prestatieproblemen opsporen">

    - `pnpm test:perf:imports` schakelt Vitest-rapportage van importduur en
      uitvoer met een uitsplitsing van imports in.
    - `pnpm test:perf:imports:changed` beperkt dezelfde profileringsweergave tot
      bestanden die sinds `origin/main` zijn gewijzigd.
    - Timinggegevens van shards worden naar `.artifacts/vitest-shard-timings.json` geschreven.
      Uitvoeringen van volledige configuraties gebruiken het configuratiepad als sleutel; CI-shards
      met opnamepatronen voegen de shardnaam toe, zodat gefilterde shards
      afzonderlijk kunnen worden gevolgd.
    - Wanneer één zware test nog steeds het grootste deel van de tijd besteedt aan imports tijdens het opstarten,
      houdt u zware afhankelijkheden achter een smalle lokale `*.runtime.ts`-grens en
      mockt u die grens rechtstreeks in plaats van runtimehelpers diep te importeren
      om ze alleen door te geven aan `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergelijkt de gerouteerde
      `test:changed` met het native hoofdprojectpad voor die
      vastgelegde diff en toont de verstreken tijd plus het maximale RSS-gebruik op macOS.
    - `pnpm test:perf:changed:bench -- --worktree` meet de prestaties van de huidige
      onopgeslagen werkstructuur door de lijst met gewijzigde bestanden te routeren via
      `scripts/test-projects.mjs` en de Vitest-configuratie van het hoofdproject.
    - `pnpm test:perf:profile:main` schrijft een CPU-profiel van de hoofdthread voor
      de opstart- en transformatieoverhead van Vitest/Vite.
    - `pnpm test:perf:profile:runner` schrijft CPU- en heap-profielen van de runner voor
      de unitsuite met bestandsparallellisme uitgeschakeld.

  </Accordion>
</AccordionGroup>

### Stabiliteit (Gateway)

- Opdracht: `pnpm test:stability:gateway`
- Configuratie: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` en `test/vitest/vitest.infra.config.ts`, elk geforceerd tot één worker
- Bereik:
  - Start een echte local loopback Gateway waarbij diagnostiek standaard is ingeschakeld
  - Stuurt synthetische Gateway-berichten, geheugenactiviteit en verwerking van grote payloads door het diagnostische gebeurtenispad
  - Vraagt `diagnostics.stability` op via de Gateway WS RPC
  - Dekt helpers voor het persistent opslaan van diagnostische stabiliteitsbundels
  - Controleert dat de recorder begrensd blijft, synthetische RSS-metingen onder het drukbudget blijven en wachtrijdieptes per sessie weer tot nul afnemen
- Verwachtingen:
  - Veilig voor CI en zonder sleutels
  - Smalle lane voor opvolging van stabiliteitsregressies, geen vervanging voor de volledige Gateway-suite

### E2E (repo-aggregaat)

- Opdracht: `pnpm test:e2e`
- Bereik:
  - Voert de E2E-lane voor de Gateway-rooktest uit
  - Voert de E2E-lane voor de browser met gemockte Control UI uit
- Verwachtingen:
  - Veilig voor CI en zonder sleutels
  - Vereist dat Playwright Chromium is geïnstalleerd

### E2E (Gateway-rooktest)

- Opdracht: `pnpm test:e2e:gateway`
- Configuratie: `test/vitest/vitest.e2e.config.ts`
- Bestanden: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` en E2E-tests van gebundelde plugins onder `extensions/`
- Standaardwaarden voor runtime:
  - Gebruikt Vitest `threads` met `isolate: false`, overeenkomstig de rest van de repo.
  - Gebruikt adaptieve workers (CI: maximaal 2, lokaal: standaard 1).
  - Draait standaard in stille modus om overhead van console-I/O te verminderen.
- Nuttige overschrijvingen:
  - `OPENCLAW_E2E_WORKERS=<n>` om het aantal workers af te dwingen (beperkt tot 16).
  - `OPENCLAW_E2E_VERBOSE=1` om uitgebreide console-uitvoer opnieuw in te schakelen.
- Bereik:
  - End-to-endgedrag van de Gateway met meerdere instanties
  - WebSocket-/HTTP-oppervlakken, Node-koppeling en zwaarder netwerkverkeer
- Verwachtingen:
  - Wordt uitgevoerd in CI (wanneer ingeschakeld in de pijplijn)
  - Geen echte sleutels vereist
  - Meer bewegende onderdelen dan unittests (kan langzamer zijn)

### E2E (gemockte browser voor Control UI)

- Opdracht: `pnpm test:ui:e2e`
- Configuratie: `test/vitest/vitest.ui-e2e.config.ts`
- Bestanden: `ui/src/**/*.e2e.test.ts`
- Bereik:
  - Start de Vite Control UI
  - Stuurt een echte Chromium-pagina aan via Playwright
  - Vervangt de Gateway-WebSocket door deterministische mocks in de browser
- Verwachtingen:
  - Wordt in CI uitgevoerd als onderdeel van `pnpm test:e2e`
  - Geen echte Gateway, agents of providersleutels vereist
  - Browserafhankelijkheid moet aanwezig zijn (`pnpm --dir ui exec playwright install chromium`)

### E2E: rooktest voor OpenShell-backend

- Opdracht: `pnpm test:e2e:openshell`
- Bestand: `extensions/openshell/src/backend.e2e.test.ts`
- Bereik:
  - Hergebruikt een actieve lokale OpenShell Gateway
  - Maakt een sandbox op basis van een tijdelijk lokaal Dockerfile
  - Test de OpenShell-backend van OpenClaw via echte `sandbox ssh-config` + SSH-uitvoering
  - Verifieert op de externe omgeving gebaseerde canonieke bestandssysteemwerking via de bestandssysteembrug van de sandbox
- Verwachtingen:
  - Alleen na expliciete inschakeling; geen onderdeel van de standaarduitvoering van `pnpm test:e2e`
  - Vereist een lokale `openshell`-CLI plus een werkende Docker-daemon
  - Vereist een actieve lokale OpenShell Gateway en de bijbehorende configuratiebron
  - Gebruikt geïsoleerde `HOME` / `XDG_CONFIG_HOME` en vernietigt daarna de testsandbox
- Nuttige overschrijvingen:
  - `OPENCLAW_E2E_OPENSHELL=1` om de test in te schakelen wanneer de bredere e2e-suite handmatig wordt uitgevoerd
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` om naar een niet-standaard CLI-binair bestand of wrapperscript te verwijzen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` om de geregistreerde Gateway-configuratie beschikbaar te maken voor de geïsoleerde test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` om het IP-adres van de Docker Gateway te overschrijven dat door de hostbeleidsfixture wordt gebruikt

### Live (echte providers + echte modellen)

- Opdracht: `pnpm test:live`
- Configuratie: `test/vitest/vitest.live.config.ts`
- Bestanden: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` en live-tests voor meegeleverde plugins onder `extensions/`
- Standaard: **ingeschakeld** door `pnpm test:live` (stelt `OPENCLAW_LIVE_TEST=1` in)
- Bereik:
  - "Werkt deze provider/dit model _vandaag_ daadwerkelijk met echte referenties?"
  - Detecteer wijzigingen in providerindelingen, eigenaardigheden bij het aanroepen van tools, authenticatieproblemen en gedrag rond snelheidslimieten
- Verwachtingen:
  - Ontworpen om niet CI-stabiel te zijn (echte netwerken, echt providerbeleid, quota, storingen)
  - Kost geld / gebruikt snelheidslimieten
  - Voer bij voorkeur beperkte subsets uit in plaats van "alles"
- Live-uitvoeringen gebruiken reeds geëxporteerde API-sleutels en voorbereide authenticatieprofielen.
- Standaard isoleren live-uitvoeringen nog steeds `HOME` en kopiëren ze configuratie- en authenticatiemateriaal naar een tijdelijke testthuismap, zodat eenheidsfixtures je echte `~/.openclaw` niet kunnen wijzigen.
- Stel `OPENCLAW_LIVE_USE_REAL_HOME=1` alleen in wanneer je bewust wilt dat live-tests je echte thuismap gebruiken.
- `pnpm test:live` gebruikt standaard een stillere modus: de voortgangsuitvoer `[live] ...` blijft zichtbaar en opstartlogboeken van de Gateway en Bonjour-berichten worden gedempt. Stel `OPENCLAW_LIVE_TEST_QUIET=0` in als je de volledige opstartlogboeken weer wilt zien.
- Rotatie van API-sleutels (providerspecifiek): stel `*_API_KEYS` in met een komma-/puntkomma-indeling of gebruik `*_API_KEY_1`, `*_API_KEY_2` (bijvoorbeeld `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), of gebruik per live-uitvoering een overschrijving via `OPENCLAW_LIVE_*_KEY`; tests proberen het opnieuw bij antwoorden wegens snelheidslimieten.
- Voortgangs-/Heartbeat-uitvoer:
  - Live-testsuites schrijven voortgangsregels naar stderr, zodat langdurige provideraanroepen zichtbaar actief blijven, zelfs wanneer de consolevastlegging van Vitest stil is.
  - `test/vitest/vitest.live.config.ts` schakelt de consoleonderschepping van Vitest uit, zodat voortgangsregels van providers/de Gateway tijdens live-uitvoeringen direct worden doorgestuurd.
  - Stem Heartbeats voor rechtstreekse modellen af met `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Stem Heartbeats voor de Gateway/controles af met `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welke testsuite moet ik uitvoeren?

Gebruik deze beslissingstabel:

- Logica/tests bewerken: voer `pnpm test` uit (en `pnpm test:coverage` als je veel hebt gewijzigd)
- Netwerken van de Gateway / het WS-protocol / koppeling wijzigen: voeg `pnpm test:e2e` toe
- Problemen opsporen bij "mijn bot werkt niet" / providerspecifieke fouten / het aanroepen van tools: voer een beperkte `pnpm test:live` uit

## Live-tests (met netwerktoegang)

Voor de livemodelmatrix, snelle controles van CLI-backends, snelle ACP-controles, de
Codex-appserverharnas en alle live-tests voor mediaproviders (Deepgram, BytePlus,
ComfyUI, afbeeldingen, muziek, video, mediaharnas), plus de verwerking van referenties
voor live-uitvoeringen:

- zie [Live-testsuites testen](/nl/help/testing-live). Zie voor de specifieke controlelijst
  voor updates en pluginvalidatie
  [Updates en plugins testen](/nl/help/testing-updates-plugins).

## Docker-uitvoeringen (optionele controles op "werkt onder Linux")

Deze Docker-uitvoeringen zijn verdeeld in twee categorieën:

- Uitvoeringen voor livemodellen: `test:docker:live-models` en `test:docker:live-gateway` voeren alleen het bijbehorende live-bestand met profielsleutels uit binnen de Docker-installatiekopie van de repository (`src/agents/models.profiles.live.test.ts` en `src/gateway/gateway-models.profiles.live.test.ts`), waarbij je lokale configuratiemap, werkruimte en optionele profielomgevingsbestand worden gekoppeld. De bijbehorende lokale toegangspunten zijn `test:live:models-profiles` en `test:live:gateway-profiles`.
- Docker-live-uitvoeringen behouden waar nodig hun eigen praktische limieten:
  `test:docker:live-models` gebruikt standaard de samengestelde, ondersteunde set met veel informatieve waarde, en
  `test:docker:live-gateway` gebruikt standaard `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` en
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Stel `OPENCLAW_LIVE_MAX_MODELS`
  of de omgevingsvariabelen van de Gateway in wanneer je expliciet een lagere limiet of grotere scan wilt.
- `test:docker:all` bouwt de live-Docker-installatiekopie eenmaal via `test:docker:live-build`, verpakt OpenClaw eenmaal als npm-tarball via `scripts/package-openclaw-for-docker.mjs` en bouwt/hergebruikt vervolgens twee `scripts/e2e/Dockerfile`-installatiekopieën. De kale installatiekopie is alleen de Node/Git-uitvoerder voor installatie-, update- en plugin-afhankelijkheidstrajecten; deze trajecten koppelen de vooraf gebouwde tarball. De functionele installatiekopie installeert dezelfde tarball in `/app` voor trajecten voor de functionaliteit van de gebouwde toepassing. Definities van Docker-trajecten staan in `scripts/lib/docker-e2e-scenarios.mjs`; de plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. De gecombineerde uitvoering gebruikt een gewogen lokale planner: `OPENCLAW_DOCKER_ALL_PARALLELISM` bepaalt het aantal processlots, terwijl resourcelimieten voorkomen dat zware live-, npm-installatie- en multiservicetrajecten allemaal tegelijk starten. Als één traject zwaarder is dan de actieve limieten, kan de planner het toch starten wanneer de pool leeg is en laat deze het vervolgens alleen doorlopen totdat er weer capaciteit beschikbaar is. De standaardwaarden zijn 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; pas `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (en andere overschrijvingen van `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) alleen aan wanneer de Docker-host meer capaciteit heeft. De uitvoerder voert standaard een Docker-voorcontrole uit, verwijdert verouderde OpenClaw E2E-containers, toont elke 30 seconden de status, slaat tijdmetingen van geslaagde trajecten op in `.artifacts/docker-tests/lane-timings.json` en gebruikt die tijdmetingen om bij latere uitvoeringen langere trajecten eerst te starten. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het gewogen trajectmanifest af te drukken zonder Docker te bouwen of uit te voeren, of `node scripts/test-docker-all.mjs --plan-json` om het CI-plan af te drukken voor geselecteerde trajecten, pakket-/installatiekopiebehoeften en referenties.
- `Package Acceptance` is de systeemeigen GitHub-pakketcontrole voor "werkt deze installeerbare tarball als product?" Deze bepaalt één kandidaatpakket uit `source=npm`, `source=ref`, `source=url`, `source=trusted-url` of `source=artifact`, uploadt dit als `package-under-test` en voert vervolgens de herbruikbare Docker E2E-trajecten uit met precies die tarball, in plaats van de geselecteerde referentie opnieuw te verpakken. Profielen zijn geordend op omvang: `smoke`, `package`, `product` en `full` (plus `custom` voor een expliciete trajectlijst). Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het pakket-/update-/plugincontract, de overlevingsmatrix voor gepubliceerde upgrades, standaardwaarden voor releases en fouttriage.
- Bouw- en releasecontroles voeren na tsdown `scripts/check-cli-bootstrap-imports.mjs` uit. De controle doorloopt de statisch gebouwde graaf vanaf `dist/entry.js` en `dist/cli/run-main.js` en mislukt als die opstartgraaf vóór de opdrachtdispatch statisch een extern pakket importeert (Commander, gebruikersinterfaces voor prompts, undici, logregistratie en vergelijkbare opstartintensieve afhankelijkheden tellen allemaal mee); daarnaast beperkt deze het meegebundelde uitvoeringssegment van de Gateway tot 70 KB en weigert deze statische imports van bekende zelden gebruikte Gateway-paden (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) vanuit dat segment. `scripts/release-check.ts` voert afzonderlijk snelle tests uit op de verpakte CLI met `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` en `models list --provider openai`.
- Verouderde compatibiliteit van Package Acceptance is begrensd op `2026.4.25` (inclusief `2026.4.25-beta.*`). Tot en met die grens tolereert het harnas alleen hiaten in metadata van uitgebrachte pakketten: weggelaten vermeldingen in de persoonlijke QA-inventaris, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide Git-fixture, ontbrekende opgeslagen `update.channel`, verouderde locaties van plugin-installatierecords, ontbrekende opslag van marketplace-installatierecords en migratie van configuratiemetadata tijdens `plugins update`. Voor pakketten na `2026.4.25` gelden deze paden als strikte fouten.
- Uitvoerders voor snelle containertests: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` en `test:docker:config-reload` starten een of meer echte containers en verifiëren integratiepaden op hoger niveau.
- Docker/Bash E2E-trajecten die de verpakte OpenClaw-tarball installeren via `scripts/lib/openclaw-e2e-instance.sh`, begrenzen `npm install` met `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (standaard `600s`; stel `0` in om de omhulling uit te schakelen voor foutopsporing).

De Docker-uitvoeringen voor livemodellen koppelen bovendien alleen de benodigde
CLI-authenticatiethuismappen (of alle ondersteunde mappen wanneer de uitvoering niet
is beperkt) en kopiëren deze vervolgens vóór de uitvoering naar de thuismap van de
container, zodat OAuth van externe CLI's tokens kan vernieuwen zonder de
authenticatieopslag van de host te wijzigen:

- Rechtstreekse modellen: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Snelle ACP-bindingscontrole: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; omvat standaard Claude, Codex en Gemini, met strikte dekking voor Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` en `pnpm test:docker:live-acp-bind:opencode`)
- Snelle controle van de CLI-backend: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Snelle controle van het Codex-appserverharnas: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + ontwikkelagent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Snelle controles voor observeerbaarheid: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` en `pnpm qa:observability:smoke` zijn persoonlijke QA-trajecten voor broncodecheck-outs. Ze maken bewust geen deel uit van Docker-releasetrajecten voor pakketten, omdat de npm-tarball QA Lab weglaat.
- Snelle live-controle van Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard voor eerste configuratie (TTY, volledige basisstructuur): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Snelle controle van eerste configuratie/kanaal/agent met een npm-tarball: `pnpm test:docker:npm-onboard-channel-agent` installeert de verpakte OpenClaw-tarball globaal in Docker, configureert OpenAI via eerste configuratie met een omgevingsverwijzing en standaard ook Telegram, voert doctor uit en voert één nagebootste OpenAI-agentbeurt uit. Hergebruik een vooraf gebouwde tarball met `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de herbouw op de host over met `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` of wissel van kanaal met `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` of `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-test voor de gebruikersreis van een release: `pnpm test:docker:release-user-journey` installeert de verpakte OpenClaw-tarball globaal in een schone Docker-homemap, voert de onboarding uit, configureert een nagebootste OpenAI-provider, voert een agentbeurt uit, installeert en verwijdert externe plugins, configureert ClickClack met een lokale fixture, verifieert uitgaande en inkomende berichten, herstart de Gateway en voert doctor uit.
- Smoke-test voor getypeerde onboarding van een release: `pnpm test:docker:release-typed-onboarding` installeert de verpakte tarball, doorloopt `openclaw onboard` via een echte TTY, configureert OpenAI als provider met een omgevingsvariabelereferentie, verifieert dat de onbewerkte sleutel niet wordt opgeslagen en voert een nagebootste agentbeurt uit.
- Smoke-test voor media/geheugen van een release: `pnpm test:docker:release-media-memory` installeert de verpakte tarball en verifieert beeldbegrip van een PNG-bijlage, uitvoer van OpenAI-compatibele beeldgeneratie, herinnering via geheugenzoekopdrachten en het behoud daarvan na een herstart van de Gateway.
- Smoke-test voor de gebruikersreis bij een release-upgrade: `pnpm test:docker:release-upgrade-user-journey` installeert standaard de nieuwste gepubliceerde basisversie die ouder is dan de kandidaat-tarball, configureert de status van de provider, plugin en ClickClack in het gepubliceerde pakket, voert een upgrade uit naar de kandidaat-tarball en doorloopt vervolgens opnieuw de kernreis voor agent, plugin en kanaal. Als er geen oudere gepubliceerde basisversie bestaat, wordt de kandidaatversie opnieuw gebruikt. Overschrijf de basisversie met `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-test voor de pluginmarktplaats van een release: `pnpm test:docker:release-plugin-marketplace` installeert vanuit een lokale fixturemarktplaats, werkt de geïnstalleerde plugin bij, verwijdert deze en verifieert dat de plugin-CLI verdwijnt en de installatiemetadata wordt opgeschoond.
- Smoke-test voor de installatie van een Skill: `pnpm test:docker:skill-install` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt installaties van geüploade archieven uit in de configuratie, bepaalt via zoeken de slug van de huidige live ClawHub-Skill, installeert deze met `openclaw skills install` en verifieert de geïnstalleerde Skill plus de oorsprongs- en vergrendelingsmetadata van `.clawhub`.
- Smoke-test voor het wisselen van updatekanaal: `pnpm test:docker:update-channel-switch` installeert de verpakte OpenClaw-tarball globaal in Docker, schakelt over van pakketkanaal `stable` naar git-kanaal `dev`, verifieert het opgeslagen kanaal en de werking van de plugin na de update, schakelt vervolgens terug naar pakketkanaal `stable` en controleert de updatestatus.
- Smoke-test voor behoud na upgrades: `pnpm test:docker:upgrade-survivor` installeert de verpakte OpenClaw-tarball over een vervuilde fixture van een bestaande gebruiker met agents, kanaalconfiguratie, plugin-toelatingslijsten, verouderde status van pluginafhankelijkheden en bestaande werkruimte- en sessiebestanden. De test voert zonder actieve provider- of kanaalsleutels een pakketupdate en niet-interactieve doctor uit, start vervolgens een Gateway via local loopback en controleert het behoud van configuratie en status, plus de budgetten voor opstarten en status.
- Smoke-test voor behoud na een gepubliceerde upgrade: `pnpm test:docker:published-upgrade-survivor` installeert standaard `openclaw@latest`, maakt realistische bestanden voor een bestaande gebruiker aan, configureert die basisversie met een ingebouwd opdrachtrecept, valideert de resulterende configuratie, werkt die gepubliceerde installatie bij naar de kandidaat-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json` en start vervolgens een Gateway via local loopback om geconfigureerde intenties, statusbehoud, opstarten, `/healthz`, `/readyz` en RPC-statusbudgetten te controleren. Overschrijf één basisversie met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, laat de overkoepelende planner exacte lokale basisversies uitbreiden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, en breid probleemgerichte fixtures uit met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, zoals `reported-issues`; de verzameling gemelde problemen bevat `configured-plugin-installs` voor automatisch herstel van de installatie van externe OpenClaw-plugins. Pakketacceptatie stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, zet metatokens voor basisversies zoals `last-stable-4` of `all-since-2026.4.23` om en breidt bij volledige releasevalidatie de langdurige pakketcontrole van de release uit naar `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke-test voor sessieruntimecontext: `pnpm test:docker:session-runtime-context` verifieert het opslaan van verborgen runtimecontext in het transcript, plus herstel door doctor van getroffen dubbele vertakkingen voor het herschrijven van prompts.
- Smoke-test voor globale installatie met Bun: `bash scripts/e2e/bun-global-install-smoke.sh` verpakt de huidige bronstructuur, installeert deze met `bun install -g` in een geïsoleerde homemap en verifieert dat `openclaw infer image providers --json` gebundelde beeldproviders retourneert in plaats van te blijven hangen. Gebruik een vooraf gebouwde tarball opnieuw met `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, sla de build op de host over met `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` of kopieer `dist/` uit een gebouwde Docker-image met `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-smoke-test voor het installatieprogramma: `bash scripts/test-install-sh-docker.sh` deelt één npm-cache tussen de containers voor root, updates en rechtstreekse npm-installaties. De smoke-test voor updates gebruikt standaard npm `latest` als stabiele basisversie voordat een upgrade naar de kandidaat-tarball wordt uitgevoerd. Overschrijf dit lokaal met `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` of op GitHub met de invoer `update_baseline_version` van de workflow voor de installatiesmoke-test. Controles van het installatieprogramma zonder rootrechten behouden een geïsoleerde npm-cache, zodat cachevermeldingen die eigendom zijn van root het gedrag van gebruikerslokale installaties niet verhullen. Stel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` in om de cache voor root, updates en rechtstreekse npm-installaties opnieuw te gebruiken bij lokale herhalingen.
- De CI voor installatiesmoke-tests slaat de dubbele rechtstreekse globale npm-update over met `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; voer het script lokaal zonder die omgevingsvariabele uit wanneer dekking van een rechtstreekse `npm install -g` nodig is.
- CLI-smoke-test voor agents die een gedeelde werkruimte verwijderen: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) bouwt standaard de image uit het Dockerfile in de hoofdmap, maakt in een geïsoleerde container-homemap twee agents met één werkruimte aan, voert `agents delete --json` uit en verifieert geldige JSON plus het behoud van de werkruimte. Gebruik de image van de installatiesmoke-test opnieuw met `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-netwerken en levenscyclus van de host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) behoudt de LAN-smoke-test voor WebSocket-authenticatie en status met twee containers en gebruikt vervolgens Admin HTTP via local loopback om afscherming tijdens voorbereiding, toegang voor behouden besturing, herstel bij hervatting en een voorbereide stop/start in dezelfde container aan te tonen. De herstartcontrole moet zijn voltooid voordat de oorspronkelijke lease verloopt, verifieert dat de opschortingsstatus proceslokaal is terwijl de opgeslagen Gateway-configuratie en containeridentiteit behouden blijven, en produceert machineleesbare JSON met fasetijden.
- Smoke-test voor CDP-snapshots van de browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) bouwt de E2E-image uit de broncode plus een Chromium-laag, start Chromium met onbewerkte CDP, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots URL's van links, door de cursor als klikbaar aangemerkte elementen, iframe-verwijzingen en framemetadata omvatten.
- Regressietest voor minimale redeneerinspanning bij OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) voert via de Gateway een nagebootste OpenAI-server uit, verifieert dat `web_search` `reasoning.effort` verhoogt van `minimal` naar `low`, forceert vervolgens een afwijzing door het providerschema en controleert of de onbewerkte details in de Gateway-logboeken verschijnen.
- MCP-kanaalbrug (vooraf gevulde Gateway + stdio-brug + smoke-test met onbewerkte Claude-meldingsframes): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-hulpmiddelen in de OpenClaw-bundel (echte stdio-MCP-server + smoke-test voor toestaan/weigeren met een ingebed OpenClaw-profiel): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- MCP-opruiming voor Cron/subagents (echte Gateway + beëindiging van onderliggende stdio-MCP-processen na geïsoleerde Cron-uitvoeringen en eenmalige subagentuitvoeringen): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-test voor installatie/update via lokaal pad, `file:`, npm-register met omhooggetilde afhankelijkheden, ongeldige metadata van npm-pakketten, veranderende git-verwijzingen, uitgebreide ClawHub-fixture, marktplaatsupdates en inschakelen/inspecteren van Claude-bundels): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok over te slaan, of overschrijf het standaardpaar van uitgebreid pakket en runtime met `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` en `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Zonder `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` gebruikt de test een hermetische lokale ClawHub-fixtureserver.
- Smoke-test voor een ongewijzigde plugin-update: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-test voor de levenscyclusmatrix van plugins: `pnpm test:docker:plugin-lifecycle-matrix` installeert de verpakte OpenClaw-tarball in een kale container, installeert een npm-plugin, schakelt deze in en uit, voert via een lokaal npm-register upgrades en downgrades uit, verwijdert de geïnstalleerde code en verifieert vervolgens dat verwijdering nog steeds de verouderde status opruimt, terwijl voor elke levenscyclusfase RSS- en CPU-metrieken worden vastgelegd.
- Smoke-test voor metadata bij het herladen van configuratie: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` dekt smoke-tests voor installatie/update via een lokaal pad, `file:`, een npm-register met omhooggetilde afhankelijkheden, veranderende git-verwijzingen, ClawHub-fixtures, marktplaatsupdates en het inschakelen/inspecteren van Claude-bundels. `pnpm test:docker:plugin-update` dekt ongewijzigd updategedrag voor geïnstalleerde plugins. `pnpm test:docker:plugin-lifecycle-matrix` dekt met resourcebewaking uitgevoerde installatie, inschakeling, uitschakeling, upgrade, downgrade en verwijdering bij ontbrekende code van npm-plugins.

Om de gedeelde functionele image handmatig vooraf te bouwen en opnieuw te gebruiken:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suitespecifieke image-overschrijvingen zoals `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hebben nog steeds voorrang wanneer ze zijn ingesteld. Wanneer `OPENCLAW_SKIP_DOCKER_BUILD=1` naar een externe gedeelde image verwijst, halen de scripts deze op als de image nog niet lokaal aanwezig is. De Docker-tests voor QR en het installatieprogramma behouden hun eigen Dockerfiles, omdat ze het gedrag van pakketten en installaties valideren in plaats van de gedeelde runtime van de gebouwde app.

De Docker-runners voor live modellen koppelen de huidige checkout ook alleen-lezen aan
en plaatsen deze in een tijdelijke werkmap in de container. Zo blijft de
runtime-image klein, terwijl Vitest toch wordt uitgevoerd op exact uw lokale
broncode en configuratie. De voorbereidingsstap slaat grote uitsluitend lokale caches en builduitvoer
van apps over, zoals `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` en
app-lokale `.build`- of Gradle-uitvoermappen, zodat live Docker-uitvoeringen niet
minutenlang machinespecifieke artefacten kopiëren. Ze stellen ook
`OPENCLAW_SKIP_CHANNELS=1` in, zodat live Gateway-controles geen echte
kanaalworkers voor Telegram/Discord/enzovoort in de container starten.
`test:docker:live-models` voert nog steeds `pnpm test:live` uit, dus geef ook
`OPENCLAW_LIVE_GATEWAY_*` door wanneer u de live Gateway-dekking in die
Docker-lane wilt beperken of uitsluiten.

`test:docker:openwebui` is een compatibiliteits-smoketest op een hoger niveau: deze start een
OpenClaw Gateway-container waarin de OpenAI-compatibele HTTP-eindpunten zijn ingeschakeld,
start een vastgezette Open WebUI-container die met die Gateway is verbonden, meldt zich aan via
Open WebUI, controleert of `/api/models` `openclaw/default` beschikbaar stelt en verzendt vervolgens een
echt chatverzoek via de proxy `/api/chat/completions` van Open WebUI. Stel
`OPENWEBUI_SMOKE_MODE=models` in voor CI-controles van het releasepad die moeten stoppen
na aanmelding bij Open WebUI en modeldetectie, zonder te wachten op de voltooiing door een live model.
De eerste uitvoering kan merkbaar langzamer zijn omdat Docker mogelijk de
Open WebUI-image moet ophalen en Open WebUI mogelijk de eigen
installatie voor een koude start moet voltooien. Deze lane verwacht een bruikbare sleutel voor een live model, aangeleverd via
de procesomgeving, voorbereide authenticatieprofielen of een expliciet
`OPENCLAW_PROFILE_FILE`. Geslaagde uitvoeringen tonen een kleine JSON-payload zoals
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` is opzettelijk deterministisch en heeft geen
echt Telegram-, Discord- of iMessage-account nodig. Deze test start een vooraf gevulde Gateway-
container, start een tweede container die `openclaw mcp serve` uitvoert en
controleert vervolgens gerouteerde gespreksdetectie, het lezen van transcripties, metagegevens van
bijlagen, het gedrag van de live-gebeurteniswachtrij, routering van uitgaande verzendingen en Claude-achtige
kanaal- en machtigingsmeldingen via de echte stdio-MCP-brug. De
meldingscontrole inspecteert de onbewerkte stdio-MCP-frames rechtstreeks, zodat de smoketest
valideert wat de brug daadwerkelijk uitstuurt en niet alleen wat een specifieke client-SDK
toevallig beschikbaar stelt.

`test:docker:agent-bundle-mcp-tools` is deterministisch en heeft geen
sleutel voor een live model nodig. Deze test bouwt de Docker-image van de repo, start een echte stdio-MCP-
probeserver in de container, realiseert die server via de
ingebedde MCP-runtime van de OpenClaw-bundel, voert de tool uit en controleert vervolgens
of `coding` en `messaging` de `bundle-mcp`-tools behouden, terwijl `minimal` en
`tools.deny: ["bundle-mcp"]` ze uitfilteren.

`test:docker:cron-mcp-cleanup` is deterministisch en heeft geen sleutel voor een live
model nodig. Deze test start een vooraf gevulde Gateway met een echte stdio-MCP-probeserver,
voert een geïsoleerde Cron-beurt en een eenmalige onderliggende `sessions_spawn`-beurt uit en
controleert vervolgens of het onderliggende MCP-proces na elke uitvoering wordt afgesloten.

Handmatige ACP-smoketest voor threads in gewone taal (niet voor CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewaar dit script voor regressie- en foutopsporingsworkflows. Het kan opnieuw nodig zijn voor de validatie van ACP-threadroutering, dus verwijder het niet.

Nuttige omgevingsvariabelen:

- `OPENCLAW_CONFIG_DIR=...` (standaard: `~/.openclaw`) gekoppeld aan `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (standaard: `~/.openclaw/workspace`) gekoppeld aan `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` gekoppeld en ingelezen voordat tests worden uitgevoerd
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` om alleen omgevingsvariabelen te controleren die uit `OPENCLAW_PROFILE_FILE` zijn ingelezen, met tijdelijke configuratie-/werkruimtemappen en zonder externe CLI-authenticatiekoppelingen
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (standaard: `~/.cache/openclaw/docker-cli-tools`, tenzij de uitvoering al een door CI/beheer bepaalde gekoppelde map gebruikt) gekoppeld aan `/home/node/.npm-global` voor gecachete CLI-installaties in Docker
- Externe mappen/bestanden voor CLI-authenticatie onder `$HOME` worden als alleen-lezen gekoppeld onder `/host-auth...` en vervolgens naar `/home/node/...` gekopieerd voordat tests starten
  - Standaardmappen (gebruikt wanneer de uitvoering niet tot specifieke providers is beperkt): `.factory`, `.gemini`, `.minimax`
  - Standaardbestanden: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Uitvoeringen die tot providers zijn beperkt, koppelen alleen de benodigde mappen/bestanden die zijn afgeleid uit `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Overschrijf dit handmatig met `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` of een door komma's gescheiden lijst zoals `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` om de uitvoering te beperken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` om providers in de container te filteren
- `OPENCLAW_SKIP_DOCKER_BUILD=1` om een bestaande `openclaw:local-live`-image te hergebruiken voor nieuwe uitvoeringen waarvoor geen herbouw nodig is
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om te waarborgen dat aanmeldgegevens uit de profielopslag komen (niet uit de omgeving)
- `OPENCLAW_OPENWEBUI_MODEL=...` om het model te kiezen dat de Gateway voor de Open WebUI-smoketest beschikbaar stelt
- `OPENCLAW_OPENWEBUI_PROMPT=...` om de prompt voor nonce-controle te overschrijven die door de Open WebUI-smoketest wordt gebruikt
- `OPENWEBUI_IMAGE=...` om de vastgezette tag van de Open WebUI-image te overschrijven

## Documentatiecontrole

Voer na documentatiewijzigingen documentatiecontroles uit: `pnpm check:docs`.
Voer de volledige Mintlify-validatie van ankers uit wanneer u ook koppen binnen pagina's moet controleren: `pnpm docs:check-links:anchors`.

## Offline regressie (veilig voor CI)

Dit zijn regressies van de „echte pijplijn” zonder echte providers:

- Toolaanroepen via de Gateway (nagebootste OpenAI, echte Gateway + agentlus): `src/gateway/gateway.test.ts` (testgeval: „voert een nagebootste OpenAI-toolaanroep end-to-end uit via de agentlus van de Gateway”)
- Gateway-wizard (WS `wizard.start`/`wizard.next`, schrijft configuratie + dwingt authenticatie af): `src/gateway/gateway.test.ts` (testgeval: „voert de wizard uit via ws en schrijft de configuratie van het authenticatietoken”)

## Evaluaties van agentbetrouwbaarheid (Skills)

We hebben al enkele CI-veilige tests die zich gedragen als „evaluaties van agentbetrouwbaarheid”:

- Nagebootste toolaanroepen via de echte Gateway + agentlus (`src/gateway/gateway.test.ts`).
- End-to-end wizardstromen die sessiekoppeling en configuratie-effecten valideren (`src/gateway/gateway.test.ts`).

Wat nog ontbreekt voor Skills (zie [Skills](/nl/tools/skills)):

- **Besluitvorming:** wanneer Skills in de prompt worden vermeld, kiest de agent dan de juiste Skill (of vermijdt deze irrelevante Skills)?
- **Naleving:** leest de agent `SKILL.md` vóór gebruik en volgt deze de vereiste stappen/argumenten?
- **Workflowcontracten:** scenario's met meerdere beurten die de toolvolgorde, het meenemen van de sessiegeschiedenis en sandboxgrenzen controleren.

Toekomstige evaluaties moeten eerst deterministisch blijven:

- Een scenariorunner die nagebootste providers gebruikt om toolaanroepen + volgorde, het lezen van Skill-bestanden en sessiekoppeling te controleren.
- Een kleine suite met op Skills gerichte scenario's (gebruiken versus vermijden, poortcontrole, promptinjectie).
- Optionele live-evaluaties (opt-in, gestuurd via omgevingsvariabelen), maar pas nadat de CI-veilige suite beschikbaar is.

## Contracttests (vorm van plugins en kanalen)

Contracttests controleren of elke geregistreerde plugin en elk geregistreerd kanaal voldoet aan
het bijbehorende interfacecontract. Ze doorlopen alle gedetecteerde plugins en voeren een
suite met controles op vorm en gedrag uit. De standaard unit-lane van `pnpm test`
slaat deze gedeelde overgangs- en smoketestbestanden opzettelijk over; voer de contract-
opdrachten expliciet uit wanneer u gedeelde kanaal- of provideroppervlakken wijzigt.

### Opdrachten

- Alle contracten: `pnpm test:contracts`
- Alleen kanaalcontracten: `pnpm test:contracts:channels`
- Alleen providercontracten: `pnpm test:contracts:plugins`

### Kanaalcontracten

Bevinden zich in `src/channels/plugins/contracts/*.contract.test.ts`. Huidige
hoofdcategorieën:

- **kanaalcatalogus** - metagegevens van kanaalcatalogusvermeldingen uit de bundel/registry
- **plugin** (gebaseerd op de registry, geshard) - basisvorm van pluginregistratie
- **alleen-oppervlakken** (gebaseerd op de registry, geshard) - vormcontroles per oppervlak voor `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` en `gateway`
- **sessiekoppeling** (gebaseerd op de registry) - gedrag van sessiekoppeling
- **uitgaande-payload** - structuur en normalisatie van berichtpayloads
- **groepsbeleid** (fallback) - afdwinging van het standaardgroepsbeleid per kanaal
- **threads** (gebaseerd op de registry, geshard) - verwerking van thread-id's
- **map** (gebaseerd op de registry, geshard) - API voor mappen/deelnemerslijsten
- **registry** en **plugins-core.\*** - internals voor het kanaalpluginregister, de lader en autorisatie voor het schrijven van configuratie

Helpers voor het testharnas voor het vastleggen van inkomende dispatches en uitgaande payloads die door deze
suites worden gebruikt, zijn intern beschikbaar via `src/plugin-sdk/channel-contract-testing.ts`
(uitgesloten van npm, geen openbaar SDK-subpad); er is geen zelfstandig
bestand `inbound.contract.test.ts` in deze map.

### Providercontracten

Bevinden zich in `src/plugins/contracts/*.contract.test.ts`. Huidige categorieën
omvatten:

- **vorm** - vorm van het pluginmanifest, de API en runtime-exports
- **pluginregistratie** (+ parallel) - gevallen voor manifestregistratie
- **pakketmanifest** - vereisten voor pakketmanifesten
- **lader** - gedrag bij het instellen/afbreken van de pluginlader
- **registry** - inhoud en zoekfunctionaliteit van de registry voor plugincontracten
- **providers** - gedeeld providergedrag voor gebundelde providers, plus providers voor zoeken op het web
- **authenticatiekeuze** - metagegevens van de authenticatiekeuze en installatiegedrag
- **veroudering-providercatalogus** - metagegevens van verouderde providercatalogi
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contracten van de wizard voor providerinstallatie
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - mogelijkhedenpecifieke providercontracten
- **session-actions**, **session-attachments**, **session-entry-projection** - contracten voor sessiestatus in eigendom van plugins
- **scheduled-turns** - metagegevens en tijdstempelgrenzen voor geplande pluginbeurten
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contracten voor de levenscyclus en importgrenzen van pluginhosts/runtimes
- **extension-runtime-dependencies** - plaatsing van runtime-afhankelijkheden voor extensies

### Wanneer uitvoeren

- Na het wijzigen van plugin-SDK-exports of subpaden
- Na het toevoegen of wijzigen van een kanaal- of providerplugin
- Na het herstructureren van pluginregistratie of -detectie

Contracttests worden uitgevoerd in CI en vereisen geen echte API-sleutels.

## Regressies toevoegen (richtlijnen)

Wanneer u een live ontdekt provider-/modelprobleem oplost:

- Voeg indien mogelijk een CI-veilige regressie toe (nagebootste/gestubde provider of leg de exacte transformatie van de verzoekvorm vast)
- Als het probleem inherent alleen live optreedt (snelheidslimieten, authenticatiebeleid), houd de live-test dan beperkt en opt-in via omgevingsvariabelen
- Richt u bij voorkeur op de kleinste laag die de fout opvangt:
  - fout bij conversie/herhaling van providerverzoeken -> directe modeltest
  - fout in de sessie-/geschiedenis-/toolpijplijn van de Gateway -> live-smoketest van de Gateway of CI-veilige nagebootste Gateway-test
- Beveiliging voor het doorlopen van SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leidt per SecretRef-klasse één bemonsterd doel af uit registrymetagegevens (`listSecretTargetRegistryEntries()`) en controleert vervolgens of exec-id's met doorloopsegmenten worden geweigerd.
  - Als u een nieuwe `includeInPlan`-SecretRef-doelfamilie toevoegt in `src/secrets/target-registry-data.ts`, werk dan `classifyTargetClass` in die test bij. De test faalt opzettelijk bij niet-geclassificeerde doel-id's, zodat nieuwe klassen niet ongemerkt kunnen worden overgeslagen.

## Gerelateerd

- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
- [CI](/nl/ci)
