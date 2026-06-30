---
read_when:
    - Begrijpen hoe de QA-stack samenhangt
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Repo-ondersteunde QA-scenario's toevoegen
    - QA-automatisering met hogere realisme rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-06-30T14:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischere,
kanaalvormige manier te oefenen dan met een enkele unit-test mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM,
  kanaal, thread, reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van inkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de kickoff-taak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): verificatie vóór en na live-uitvoering voor bugs die
  echte transporten, browserschermafbeeldingen, VM-status en PR-bewijs nodig hebben.

## Commando-oppervlak

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Gebundelde QA-zelfcontrole zonder `--qa-profile`; door taxonomie ondersteunde maturity-profielrunner met `--qa-profile smoke-ci`, `--qa-profile release` of `--qa-profile all`.                                                                                          |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                                     |
| `qa coverage`                                       | Druk de YAML-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                         |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport, of gebruik `--runtime-axis --token-efficiency` om Codex-vs-OpenClaw-runtimepariteits- en tokenefficiëntierapporten te schrijven vanuit één runtime-pair-samenvatting.        |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live-modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                                |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider-/modellane.                                                                                                                                                                                               |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                     |
| `qa docker-build-image`                             | Bouw de vooraf gebakken QA-Docker-image.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor de QA-dashboard- en Gateway-lane.                                                                                                                                                                                              |
| `qa up`                                             | Bouw de QA-site, start de door Docker ondersteunde stack en druk de URL af (alias: `pnpm qa:lab:up`; de variant `:fast` voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                                                                                                |
| `qa matrix`                                         | Live-transportlane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix-QA](/nl/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-transportlane tegen een echte private Telegram-groep.                                                                                                                                                                                                               |
| `qa discord`                                        | Live-transportlane tegen een echt privaat Discord-guildkanaal.                                                                                                                                                                                                          |
| `qa slack`                                          | Live-transportlane tegen een echt privaat Slack-kanaal.                                                                                                                                                                                                                  |
| `qa whatsapp`                                       | Live-transportlane tegen echte WhatsApp Web-accounts.                                                                                                                                                                                                                   |
| `qa mantis`                                         | Runner voor verificatie vóór en na live-transportbugs, met bewijs via Discord-statusreacties, Crabbox-desktop-/browsersmoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop-runbook](/nl/concepts/mantis-slack-desktop-runbook).            |

Door profielen ondersteunde `qa run` leest lidmaatschap uit `taxonomy.yaml` en
dispatcht daarna de opgeloste scenario's via `qa suite`. `--surface` en
`--category` filteren het geselecteerde profiel in plaats van aparte lanes te
definiëren. De resulterende `qa-evidence.json` bevat een samenvatting van de
profielscorecard met aantallen voor geselecteerde categorieën en ontbrekende
dekkings-ID's; de afzonderlijke evidence-items blijven de bron van waarheid voor
de tests, dekkingsrollen en resultaten. Taxonomie-featuredekkings-ID's zijn
exacte bewijsdoelen, geen aliassen. Primaire scenariodekking vervult
overeenkomende ID's; secundaire dekking blijft adviserend. Dekkings-ID's gebruiken
de vorm `namespace.behavior` met kleine alfanumerieke segmenten en streepjes;
profiel-, surface- en categorie-ID's mogen nog steeds de bestaande gestreepte of
gestippelde taxonomie-ID's gebruiken.
Slim bewijs laat `execution` per entry weg en zet `evidenceMode: "slim"`;
`smoke-ci` gebruikt standaard slim, en `--evidence-mode full` herstelt volledige entries:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gebruik `smoke-ci` voor deterministisch profielbewijs met mock-modelproviders en
Crabline-lokale providerservers. Gebruik `release` voor Stable/LTS-bewijs tegen
live-kanalen. Gebruik `all` alleen voor expliciete evidence-runs over de volledige
taxonomie; het selecteert elke actieve maturity-categorie en kan worden
gedispatcht via de `QA Profile Evidence`-workflow met `qa_profile=all`. Wanneer
een commando ook een OpenClaw-rootprofiel nodig heeft, plaats het rootprofiel vóór
het QA-commando:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatorstroom

De huidige QA-operatorstroom is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de door Docker ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat
werkte, mislukte of geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder de Docker-image telkens opnieuw te
bouwen, start je de stack met een bind-mounted QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een vooraf gebouwde image en
bind-mount `extensions/qa-lab/web/dist` in de `qa-lab`-container.
`qa:lab:watch` bouwt die bundel opnieuw bij wijzigingen, en de browser herlaadt
automatisch wanneer de assethash van QA Lab verandert.

Voor een lokale OpenTelemetry-signaalsmoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-receiver, voert het `otel-trace-smoke`-
QA-scenario uit met de Plugin `diagnostics-otel` ingeschakeld en controleert
daarna of traces, metrics en logs worden geëxporteerd. Het decodeert de
geëxporteerde protobuf-tracespans en controleert de release-kritieke vorm:
`openclaw.run`, `openclaw.harness.run`, een model-call-span volgens de nieuwste
GenAI-semantic-convention, `openclaw.context.assembled` en
`openclaw.message.delivery` moeten aanwezig zijn. De smoke forceert
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, dus de model-call-span
moet de naam `{gen_ai.operation.name} {gen_ai.request.model}` gebruiken;
model-calls mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe
diagnostische ID's en `openclaw.content.*`-attributen moeten buiten de trace
blijven. De ruwe OTLP-payloads mogen de promptsentinel, responsesentinel of
QA-sessiesleutel niet bevatten. Het schrijft `otel-smoke-summary.json` naast de
QA-suite-artifacts.

Voor een door een collector ondersteunde OpenTelemetry-smoke voer je uit:

```bash
pnpm qa:otel:collector-smoke
```

Die lane plaatst een echte OpenTelemetry Collector-Docker-container vóór dezelfde
lokale receiver. Gebruik dit wanneer je endpoint-bedrading, collector-
compatibiliteit of OTLP-exportgedrag wijzigt dat door de in-process receiver
gemaskeerd zou kunnen worden.

Voor de beschermde Prometheus-scrape-smoke voer je uit:

```bash
pnpm qa:prometheus:smoke
```

Die alias voert het QA-scenario `docker-prometheus-smoke` uit met
`diagnostics-prometheus` ingeschakeld, verifieert dat niet-geauthenticeerde scrapes
worden geweigerd en controleert vervolgens dat de geauthenticeerde scrape
releasekritieke metriekfamilies bevat zonder promptinhoud, responsinhoud, ruwe
diagnostische identifiers, auth-tokens of lokale paden.

Gebruik het volgende om beide observability-smokes direct na elkaar uit te voeren:

```bash
pnpm qa:observability:smoke
```

Gebruik voor het door een collector ondersteunde OpenTelemetry-traject plus de
beschermde Prometheus-scrape-smoke:

```bash
pnpm qa:observability:collector-smoke
```

Observability-QA blijft uitsluitend voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus Docker-release-trajecten voor pakketten voeren geen
`qa`-commando's uit. Gebruik `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` of `pnpm qa:observability:smoke` vanuit een gebouwde
source-checkout wanneer je diagnostische instrumentatie wijzigt.

Voer voor een transport-echt Matrix-smoke-traject dat geen model-provider
credentials vereist het snelle profiel uit met de deterministische mock-OpenAI-provider:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Geef voor het live-frontier-providertraject expliciet OpenAI-compatibele
credentials op:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env-vars en artifactindeling voor dit traject staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver-/SUT-/observer-gebruikers, draait de echte Matrix-Plugin binnen een child-QA-Gateway die tot dat transport is beperkt (geen `qa-channel`) en schrijft vervolgens een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlogboek onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unit tests niet end-to-end kunnen bewijzen: vermeldingsafscherming, allow-bot-beleid, allowlists, antwoorden op topniveau en in threads, DM-routering, reactieafhandeling, onderdrukking van binnenkomende bewerkingen, deduplicatie van herstart-replay, herstel na homeserver-onderbreking, levering van goedkeuringsmetadata, media-afhandeling en Matrix E2EE-bootstrap-/herstel-/verificatieflows. Het E2EE-CLI-profiel voert ook `openclaw matrix encryption setup` en verificatiecommando's uit via dezelfde wegwerpbare homeserver voordat Gateway-antwoorden worden gecontroleerd.

Discord heeft ook Mantis-only opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete tijdlijn met
statusreacties, of `--scenario discord-thread-reply-filepath-attachment` om een
echte Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten het standaard live
Discord-traject omdat het voor/na-reprobes zijn en geen brede smoke-dekking.
De Mantis-workflow voor thread-bijlagen kan ook een ingelogde Discord Web-
getuigenvideo toevoegen wanneer `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-omgeving is
geconfigureerd. Dat viewerprofiel is alleen voor visuele capture; de
pass/fail-beslissing komt nog steeds van de Discord REST-oracle.

CI gebruikt hetzelfde commando-oppervlak in `.github/workflows/qa-live-transports-convex.yml`.
Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met
door QA geleverde live-frontier-credentials, `--fast` en
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatige `matrix_profile=all`
waaiert uit naar de vijf profielshards.

Voor transport-echte smoke-trajecten voor Telegram, Discord, Slack en WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots of accounts (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-credentialpool zijn hieronder gedocumenteerd in de [QA-referentie voor Telegram, Discord, Slack en WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Voer voor een volledige Slack-desktop-VM-run met VNC-redding uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dat commando least een Crabbox-desktop-/browsermachine, voert het Slack-live-traject
binnen de VM uit, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
terug naar de Mantis-artifactdirectory wanneer video-opname beschikbaar is.
Crabbox-desktop-/browserleases leveren de capture-tools en helperpakketten voor
browser/native-build vooraf, zodat het scenario alleen fallbacks op oudere
leases zou moeten installeren. Mantis rapporteert totale timings en timings per
fase in `mantis-slack-desktop-smoke-report.md`, zodat trage runs laten zien of
de tijd naar lease-warmup, credentialverwerving, remote setup of artifactkopie
ging. Hergebruik `--lease-id <cbx_...>` nadat je handmatig via VNC bij Slack Web
bent ingelogd; hergebruikte leases houden ook de pnpm-storecache van Crabbox
warm. De standaard `--hydrate-mode source` verifieert vanuit een source-checkout
en voert install/build binnen de VM uit. Gebruik `--hydrate-mode prehydrated`
alleen wanneer de hergebruikte remote workspace al `node_modules` en een
gebouwde `dist/` heeft; die modus slaat de dure install/build-stap over en
faalt gesloten wanneer de workspace niet gereed is. Met `--gateway-setup` laat
Mantis een persistente OpenClaw Slack-Gateway binnen de VM draaien op poort
`38973`; zonder die optie voert het commando het normale bot-naar-bot
Slack-QA-traject uit en stopt het na artifactcapture.

Voer de Mantis-goedkeuringscheckpointmodus uit om de native Slack-goedkeurings-UI
met desktopbewijs te bewijzen:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Deze modus sluit `--gateway-setup` wederzijds uit. Hij voert de
Slack-goedkeuringsscenario's uit, weigert niet-goedkeuringsscenario-id's, wacht
bij elke pending en resolved goedkeuringsstatus, rendert het waargenomen
Slack API-bericht naar `approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png` en faalt vervolgens als een
checkpoint, berichtbewijs, bevestiging of gerenderde screenshot ontbreekt of
leeg is. Koude CI-leases kunnen nog steeds Slack-aanmelding tonen in
`slack-desktop-smoke.png`; de goedkeuringscheckpointafbeeldingen vormen het
visuele bewijs voor dit traject.

De operatorchecklist, het GitHub-workflow-dispatchcommando, het contract voor
evidence-comments, de hydrate-mode-beslissingstabel, timinginterpretatie en
stappen voor foutafhandeling staan in het [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voer voor een agent-/CV-achtige desktoptaak uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` least of hergebruikt een Crabbox-desktop-/browsermachine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit op de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een
gestructureerd JSON-oordeel en slaagt alleen wanneer het model positief zichtbaar
bewijs rapporteert; een negatieve respons die alleen de doeltekst citeert faalt
de assertion. Gebruik `--vision-mode metadata` voor een no-model-smoke die de
desktop-, browser-, screenshot- en videoplumbing bewijst zonder een
image-understanding-provider aan te roepen. Opname is een vereist artifact voor
`visual-task`; als Crabbox geen niet-lege `visual-task.mp4` opneemt, faalt de
taak zelfs wanneer de visual driver is geslaagd. Bij falen behoudt Mantis de
lease voor VNC, tenzij de taak al was geslaagd en `--keep-lease` niet was
ingesteld.

Voer het volgende uit voordat je gepoolde live credentials gebruikt:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin-/list-bereikbaarheid wanneer het maintainer-geheim aanwezig is. Hij rapporteert voor geheimen alleen de status ingesteld/ontbreekt.

## Live transportdekking

Live transporttrajecten delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te bedenken. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live transportdekkingsmatrix.

Live transportrunners zouden de gedeelde scenario-id's, baseline-
dekkingshelpers en scenarioselectiehelper moeten importeren uit
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Traject  | Canary | Vermeldingsafscherming | Bot-naar-bot | Allowlist-blokkade | Antwoord op topniveau | Citaatantwoord | Hervatten na herstart | Thread-opvolging | Thread-isolatie | Reactie-observatie | Helpcommando | Native commandoregistratie |
| -------- | ------ | ---------------------- | ------------ | ------------------ | --------------------- | -------------- | --------------------- | ---------------- | --------------- | ------------------ | ------------ | -------------------------- |
| Matrix   | x      | x                      | x            | x                  | x                     |                | x                     | x                | x               | x                  |              |                            |
| Telegram | x      | x                      | x            |                    |                       |                |                       |                  |                 |                    | x            |                            |
| Discord  | x      | x                      | x            |                    |                       |                |                       |                  |                 |                    |              | x                          |
| Slack    | x      | x                      | x            | x                  | x                     |                | x                     | x                | x               |                    |              |                            |
| WhatsApp | x      | x                      |              | x                  | x                     | x              | x                     |                  |                 | x                  | x            |                            |

Dit houdt `qa-channel` als de brede productgedragsuite, terwijl Matrix,
Telegram en andere live transports één expliciete transportcontractchecklist delen.

Voer voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een verse Multipass-guest, installeert dependencies, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert vervolgens het normale
QA-rapport en de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren standaard meerdere geselecteerde scenario's
parallel uit met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard
concurrency 4, begrensd door het aantal geselecteerde scenario's. Gebruik
`--concurrency <count>` om het aantal workers af te stemmen, of `--concurrency 1`
voor seriële uitvoering.
Gebruik `--pack personal-agent` om het benchmarkpakket voor de persoonlijke
assistent uit te voeren. De pakketselector is additief met herhaalde
`--scenario`-flags: expliciete scenario's worden eerst uitgevoerd, daarna
pakketscenario's in pakketvolgorde met duplicaten verwijderd.
Gebruik `--pack observability` wanneer een aangepaste QA-runner de
OpenTelemetry-collector-setup al levert en de OpenTelemetry- en
Prometheus-diagnostische smoke-scenario's samen wil selecteren.
Het commando sluit af met een niet-nulwaarde wanneer een scenario faalt. Gebruik
`--allow-failures` wanneer je artifacts wilt zonder een falende exitcode.
Live-runs geven de ondersteunde QA-auth-inputs door die praktisch zijn voor de
guest: env-gebaseerde providersleutels, het configpad voor de QA-live-provider
en `CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat
de guest via de gemounte workspace kan terugschrijven.

## QA-referentie voor Telegram, Discord, Slack en WhatsApp

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en de door Docker ondersteunde homeserver-provisioning. Telegram, Discord, Slack en WhatsApp draaien tegen vooraf bestaande echte transports, dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaard                                         | Beschrijving                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Voer alleen dit scenario uit. Herhaalbaar.                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Waar rapporten, samenvattingen, bewijs, transportspecifieke artefacten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                                            |
| `--sut-account <id>`                  | `sut`                                             | Tijdelijke account-id binnen de QA-Gateway-configuratie.                                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                                                         |
| `--model <ref>` / `--alt-model <ref>` | standaard van provider                            | Primaire/alternatieve modelrefs.                                                                                                                  |
| `--fast`                              | uit                                               | Snelle providermodus waar ondersteund.                                                                                                            |
| `--credential-source <env\|convex>`   | `env`                                             | Zie [Convex-credentialpool](#convex-credential-pool).                                                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                   | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                                      |

Elke lane eindigt met een niet-nulcode bij een mislukt scenario. `--allow-failures` schrijft artefacten zonder een falende afsluitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte privé-Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerieke chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Scenario's (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

De impliciete standaardset dekt altijd canary, vermeldingsgating, native opdrachtantwoorden, opdrachtadressering en bot-naar-bot-groepsantwoorden. `mock-openai`-standaarden bevatten ook deterministische controles voor antwoordketens en streaming van eindberichten. `telegram-current-session-status-tool` blijft opt-in omdat het alleen stabiel is wanneer het direct na canary wordt gethread, niet na willekeurige native opdrachtantwoorden. Gebruik `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` om de huidige standaard/optionele verdeling met regressierefs af te drukken.

Uitvoerartefacten:

- `telegram-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transportcontroles, inclusief profiel-, dekking-, provider-, kanaal-, artefact-, resultaat- en RTT-velden.

Telegram-runs voor pakketten gebruiken hetzelfde Telegram-credentialcontract. Herhaalde RTT-meting maakt deel uit van de normale Telegram-live-lane voor pakketten; de RTT-verdeling wordt opgenomen in `qa-evidence.json` onder `result.timing` voor de geselecteerde RTT-controle.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wanneer `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` is ingesteld, least de live pakketwrapper een `kind: "telegram"`-credential, exporteert de geleasede groep/driver/SUT-bot-env naar de geïnstalleerde pakketrun, stuurt Heartbeats voor de lease en geeft deze vrij bij afsluiten. De pakketwrapper gebruikt standaard 20 RTT-controles van `telegram-mentioned-message-reply`, een RTT-time-out van 30s en Convex-rol `maintainer` buiten CI wanneer Convex is geselecteerd. Overschrijf `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om RTT-meting af te stemmen zonder een aparte RTT-opdracht of Telegram-specifieke samenvattingsindeling te maken.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privé-Discord-guildkanaal met twee bots: een driverbot die door het testharnas wordt bestuurd en een SUT-bot die door de onderliggende OpenClaw-Gateway wordt gestart via de gebundelde Discord-Plugin. Verifieert verwerking van kanaalvermeldingen, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het spraak-/stagekanaal voor `discord-voice-autojoin`; zonder deze variabele kiest het scenario het eerste zichtbare spraak-/stagekanaal voor de SUT-bot.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in spraakscenario. Draait op zichzelf, schakelt `channels.discord.voice.autoJoin` in en verifieert dat de huidige Discord-spraakstatus van de SUT-bot het doelspraak-/stagekanaal is. Convex Discord-credentials kunnen optioneel `voiceChannelId` bevatten; anders ontdekt de runner het eerste zichtbare spraak-/stagekanaal in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait op zichzelf omdat het de SUT omschakelt naar altijd-aan, alleen-tool-guildantwoorden met `messages.statusReactions.enabled=true`, en legt daarna een REST-reactietijdlijn plus HTML/PNG-visuele artefacten vast. Mantis voor/na-rapporten behouden ook door het scenario aangeleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

Voer het Discord-scenario voor automatisch deelnemen aan spraak expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Voer het Mantis-statusreactiescenario expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Uitvoerartefacten:

- `discord-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transportcontroles.
- `discord-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario draait.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee verschillende bots: een driverbot die door het testharnas wordt bestuurd en een SUT-bot die door de onderliggende OpenClaw-Gateway wordt gestart via de gebundelde Slack-Plugin.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` schakelt visuele goedkeuringscheckpoints voor Mantis in. De runner schrijft `<scenario>.pending.json` en `<scenario>.resolved.json`, en wacht daarna op overeenkomende `.ack.json`-bestanden.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` overschrijft de time-out voor checkpointbevestigingen. De standaard is `120000`.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in native Slack-scenario voor exec-goedkeuring.
  Vraagt een exec-goedkeuring aan via de Gateway, verifieert dat het Slack-bericht native goedkeuringsknoppen heeft, lost deze op en verifieert de opgeloste Slack-update.
- `slack-approval-plugin-native` - opt-in native Slack-scenario voor Plugin-goedkeuring.
  Schakelt doorsturen van exec- en Plugin-goedkeuring samen in, zodat Plugin-gebeurtenissen niet worden onderdrukt door exec-goedkeuringsrouting, en verifieert daarna hetzelfde native Slack-UI-pad voor in behandeling/opgelost.

Uitvoerartefacten:

- `slack-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transportcontroles.
- `slack-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - alleen wanneer Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` instelt; bevat checkpoint-JSON, bevestigings-JSON en screenshots voor in behandeling/opgelost.

#### De Slack-workspace instellen

De lane heeft twee verschillende Slack-apps in één workspace nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een speciaal kanaal; de lane post bij elke run.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een aparte Slack-app moet zijn ten opzichte van de driver zodat de botgebruikers-id verschillend is.
- `sutAppToken` - app-level token (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app gebeurtenissen kan ontvangen.

Geef de voorkeur aan een Slack-workspace die aan QA is gewijd boven het hergebruiken van een productie-workspace.

Het onderstaande SUT-manifest beperkt de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`) bewust tot de machtigingen en gebeurtenissen die door de live Slack-QA-suite worden gedekt. Voor de productie-kanaalinstelling zoals gebruikers die zien, zie [Snelle installatie van Slack-kanaal](/nl/channels/slack#quick-setup); het QA-Driver/SUT-paar is bewust apart omdat de lane twee verschillende botgebruikers-id's in één workspace nodig heeft.

**1. Maak de Driver-app aan**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → kies de QA-werkruimte, plak het volgende manifest en daarna _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) - dat wordt `driverBotToken`. De driver hoeft alleen berichten te plaatsen en zichzelf te identificeren; geen events, geen Socket Mode.

**2. Maak de SUT-app**

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app gebruikt bewust een smallere versie van het productiemanifest van de gebundelde Slack-plugin (`extensions/slack/src/setup-shared.ts:10`): reaction-scopes en events zijn weggelaten omdat de live Slack QA-suite reaction-afhandeling nog niet dekt.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Doe twee dingen op de instellingenpagina nadat Slack de app heeft gemaakt:

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → dat wordt `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de `xapp-...`-waarde → dat wordt `sutAppToken`.

Controleer of de twee bots verschillende gebruikers-id's hebben door `auth.test` op elke token aan te roepen. De runtime onderscheidt driver en SUT op gebruikers-id; één app voor beide hergebruiken laat mention-gating onmiddellijk mislukken.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal aan (bijv. `#openclaw-qa`) en nodig beide bots uit vanuit het kanaal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer het `Cxxxxxxxxxx`-id uit _channel info → About → Channel ID_ - dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, zodat de history-lezingen van de harness nog steeds slagen.

**4. Registreer de inloggegevens**

Er zijn twee opties. Gebruik env vars voor debuggen op één machine (stel de vier `OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` mee), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

Schrijf voor de Convex-pool de vier velden naar een JSON-bestand:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Registreer en verifieer met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in je shell:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Verwacht `count: 1`, `status: "active"`, geen `lease`-veld.

**5. Verifieer end-to-end**

Voer de lane lokaal uit om te bevestigen dat beide bots via de broker met elkaar kunnen praten:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Een groene run voltooit ruim binnen 30 seconden en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden hangt en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleased - `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Richt zich op twee specifieke WhatsApp Web-accounts: een driver-account dat door
de harness wordt bestuurd en een SUT-account dat door de child OpenClaw-gateway
wordt gestart via de gebundelde WhatsApp-plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optioneel:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` schakelt groepsscenario's in zoals
  `whatsapp-mention-gating` en `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` bewaart berichtinhoud in
  observed-message-artefacten.

Scenariocatalogus (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline en group gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native commands: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwoord- en final-output-gedrag: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Inkomende media en gestructureerde berichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Deze sturen echte WhatsApp-image-, audio-,
  document-, locatie-, contact- en sticker-events via de driver.
- Uitgaande Gateway- en message action-dekking:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Access-control-dekking: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native approvals: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Status reactions: `whatsapp-status-reactions`.

De catalogus bevat momenteel 36 scenario's. De standaardlane `live-frontier` is
klein gehouden met 10 scenario's voor snelle smoke-dekking. De standaardlane
`mock-openai` voert 31 deterministische scenario's uit via het echte
WhatsApp-transport, terwijl alleen modeluitvoer wordt gemockt. Approval-scenario's
en enkele zwaardere/blokkerende checks blijven expliciet per scenario-id.

De WhatsApp QA-driver observeert gestructureerde live-events (`text`, `media`,
`location`, `reaction` en `poll`) en kan actief media, polls,
contacten, locaties en stickers versturen. QA Lab importeert die driver via het
`@openclaw/whatsapp/api.js`-pakketoppervlak in plaats van private
WhatsApp-runtimebestanden te benaderen. Berichtinhoud wordt standaard geredigeerd. Dekking voor
uitgaande polls en upload-file loopt via deterministische Gateway-`poll`- en
`message.action`-aanroepen in plaats van alleen model-prompt-toolaanroepen.

Uitvoerartefacten:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - evidence-items voor de live transport-checks.
- `whatsapp-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex-inloggegevenspool

Telegram-, Discord-, Slack- en WhatsApp-lanes kunnen inloggegevens leasen uit een gedeelde Convex-pool in plaats van de env vars hierboven te lezen. Geef `--credential-source convex` mee (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de run en geeft deze vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"`, `"slack"` en `"whatsapp"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-string zijn.
- Echte Telegram-gebruiker (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - alleen Mantis Telegram Desktop-proof. Generieke QA Lab-lanes mogen deze soort niet verkrijgen.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefoonnummers moeten verschillende E.164-strings zijn.

De Mantis Telegram Desktop-proofworkflow houdt één exclusieve Convex-
`telegram-user`-lease vast voor zowel de TDLib CLI-driver als de Telegram Desktop-
witness, en geeft deze daarna vrij na het publiceren van proof.

Wanneer een PR een deterministische visuele diff nodig heeft, kan Mantis dezelfde
mockmodelreactie gebruiken op `main` en op de PR-head terwijl de Telegram-formatter
of delivery-laag verandert. Capture-standaarden zijn afgestemd op PR-comments:
standaard Crabbox-klasse, 24fps desktopopname, 24fps motion-GIF en 1920px
previewbreedte. Before/after-comments moeten een schone bundel publiceren die
alleen de beoogde GIF's bevat.

Slack-lanes kunnen de pool ook gebruiken. Slack-payloadvormchecks leven momenteel in de Slack QA-runner in plaats van in de broker; gebruik `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, met een Slack-kanaal-id zoals `Cxxxxxxxxxx`. Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env vars en het Convex broker-endpointcontract staan in [Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór de multi-channel-pool; de lease-semantiek wordt gedeeld tussen soorten).

## Repo-backed seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke YAML-scenariorunner blijven. Elk scenario-YAML-bestand is
de bron van waarheid voor één testrun en moet definiëren:

- top-level `title`
- `scenario`-metadata
- optionele category-, capability-, lane- en risk-metadata in `scenario`
- docs- en code-refs in `scenario`
- optionele pluginvereisten in `scenario`
- optionele gatewayconfiguratiepatch in `scenario`
- uitvoerbare top-level `flow` voor flow-scenario's, of `scenario.execution.kind` /
  `scenario.execution.path` voor Vitest- en Playwright-scenario's

Het herbruikbare runtime-oppervlak dat `flow` ondersteunt, mag generiek
en domeinoverstijgend blijven. YAML-scenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingebedde Control UI aansturen via de
Gateway-`browser.request`-seam zonder een special-case runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapaciteit in plaats van op source tree
folder. Houd scenario-ID's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van de implementatie.

De basislijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- thread-gedrag
- levenscyclus van berichtacties
- cron-callbacks
- geheugenherinnering
- modelwisseling
- subagent-overdracht
- repo lezen en docs lezen
- een kleine buildtaak zoals Lobster Invaders

## Mock-lanes voor providers

`qa suite` heeft twee lokale mock-lanes voor providers:

- `mock-openai` is de scenariobewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mock-lane voor repo-ondersteunde QA en pariteitsgates.
- `aimock` start een door AIMock ondersteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Deze is aanvullend en vervangt de
  `mock-openai`-scenariodispatcher niet.

De implementatie van provider-lanes staat onder `extensions/qa-lab/src/providers/`.
Elke provider is eigenaar van zijn defaults, het opstarten van de lokale server, gateway-modelconfiguratie,
behoeften voor auth-profiel-staging en capability-flags voor live/mock. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te branchen op
providernamen.

## Transportadapters

`qa-lab` is eigenaar van een generieke transport-seam voor YAML-QA-scenario's. `qa-channel` is
de synthetische default. `crabline` start lokale provider-vormige servers en voert
OpenClaw's normale kanaalplugins daartegen uit. `live` is gereserveerd voor echte
providercredentials en externe kanalen.

Op architectuurniveau is de splitsing:

- `qa-lab` is eigenaar van generieke scenario-uitvoering, worker-concurrency, schrijven van artifacts en rapportage.
- De transportadapter is eigenaar van Gateway-configuratie, readiness, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- YAML-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het YAML-QA-systeem vereist de kanaalimplementatie plus
een scenariopakket dat het kanaalcontract oefent. Voeg voor smoke-CI-dekking
de bijbehorende lokale Crabline-providerserver toe en stel deze beschikbaar via de `crabline`
driver.

Voeg geen nieuwe top-level QA-command root toe wanneer de gedeelde `qa-lab`-host eigenaar van de flow kan zijn.

`qa-lab` is eigenaar van de gedeelde hostmechanica:

- de `openclaw qa`-command root
- opstarten en afsluiten van de suite
- worker-concurrency
- schrijven van artifacts
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins zijn eigenaar van het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway wordt geconfigureerd voor dat transport
- hoe readiness wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripties en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde `qa-lab`-host-seam.
3. Houd transportspecifieke mechanica binnen de runner-plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende root-command te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter aparte entrypoints blijven.
5. Schrijf of pas YAML-scenario's aan onder de thematische `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een opzettelijke migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-plugin of pluginharness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke branch in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd het scenario dan transportspecifiek en maak dat expliciet in het scenariocontract.

### Namen van scenariohelpers

Aanbevolen generieke helpers voor nieuwe scenario's:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuwe scenario-authoring moet de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bustijdlijn.
Het rapport moet beantwoorden:

- Wat werkte
- Wat faalde
- Wat geblokkeerd bleef
- Welke vervolscenario's het waard zijn om toe te voegen

Voer voor de inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare output).
Wanneer je gerichte proof kiest voor aangeraakt gedrag of een bestandspad, voer `pnpm openclaw qa coverage --match <query>` uit.
Het matchrapport doorzoekt scenariometadata, docs-refs, code-refs, coverage-ID's, plugins en providervereisten, en print vervolgens overeenkomende `qa suite --scenario ...`-targets.
Elke `qa suite`-run schrijft top-level `qa-evidence.json`,
`qa-suite-summary.json` en `qa-suite-report.md`-artifacts voor de geselecteerde
scenarioset. Scenario's die `execution.kind: vitest` of
`execution.kind: playwright` declareren, voeren het bijbehorende testpad uit en schrijven ook
logs per scenario. Scenario's die `execution.kind: script` declareren, voeren de
evidence-producer op `execution.path` uit via `node --import tsx` (waarbij
`${outputDir}` en `${scenarioId}` worden uitgebreid in `execution.args`); de producer
schrijft zijn eigen `qa-evidence.json`, waarvan de entries in de suite-output worden geïmporteerd
en waarvan de artifact-paden relatief ten opzichte van die producer
`qa-evidence.json` worden resolved. Wanneer `qa suite` wordt bereikt via
`qa run --qa-profile`, bevat dezelfde `qa-evidence.json` ook de
scorecard-samenvatting van het profiel voor de geselecteerde taxonomiecategorieën.
Behandel het als een ontdekkingshulpmiddel, niet als vervanging van een gate; het geselecteerde scenario heeft nog steeds de juiste providermodus, live transport, Multipass, Testbox of release-lane nodig voor het gedrag dat wordt getest.
Zie [Maturity scorecard](/nl/maturity/scorecard) voor scorecard-context.

Voer voor karakter- en stijlchecks hetzelfde scenario uit over meerdere live model
refs en schrijf een beoordeeld Markdown-rapport:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

De opdracht voert lokale QA-Gateway-childprocesses uit, geen Docker. Character-eval
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten uitvoeren
zoals chat, werkruimtehulp en kleine bestandstaken. Het kandidaatmodel mag
niet worden verteld dat het wordt geëvalueerd. De opdracht bewaart elke volledige
transcriptie, registreert basisrunstatistieken en vraagt vervolgens de beoordelingsmodellen in fast mode met
`xhigh`-reasoning waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de judge-prompt krijgt nog steeds
elke transcriptie en runstatus, maar kandidaatrefs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport mapt rankings na parsing terug naar echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
voor compatibiliteit behouden.
OpenAI-kandidaatrefs gebruiken standaard fast mode, zodat priority processing wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of judge een override nodig heeft. Geef `--fast` alleen door wanneer je
fast mode wilt forceren voor elk kandidaatmodel. Duurmetingen van kandidaten en judges worden
in het rapport geregistreerd voor benchmarkanalyse, maar judge-prompts zeggen expliciet
dat ze niet op snelheid moeten rangschikken.
Runs van kandidaat- en judge-modellen gebruiken allebei standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
druk een run te ruisig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt character eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de judges standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-8,thinking=high`.

## Gerelateerde docs

- [Matrix-QA](/nl/concepts/qa-matrix)
- [Maturity scorecard](/nl/maturity/scorecard)
- [Personal agent-benchmarkpakket](/nl/concepts/personal-agent-benchmark-pack)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
