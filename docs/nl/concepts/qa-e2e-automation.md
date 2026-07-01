---
read_when:
    - Begrijpen hoe de QA-stack in elkaar past
    - Uitbreiding van qa-lab, qa-channel of een transportadapter
    - QA-scenario's met repo-ondersteuning toevoegen
    - QA-automatisering met hogere realismegraad bouwen rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanes, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-07-01T08:16:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalvormige manier te testen dan met een enkele unit test mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtenkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerken en verwijderen.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  injecteren van inkomende berichten en exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een child QA-gateway.
- `qa/`: door de repo ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): verificatie voor en na live voor bugs waarvoor
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig zijn.

## Command surface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Opdracht                                            | Doel                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole zonder `--qa-profile`; door taxonomie ondersteunde runner voor volwassenheidsprofielen met `--qa-profile smoke-ci`, `--qa-profile release` of `--qa-profile all`.                                                                          |
| `qa suite`                                          | Voer door de repo ondersteunde scenario's uit tegen de QA-gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                          |
| `qa coverage`                                       | Druk de YAML-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                       |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentic-pariteitsrapport, of gebruik `--runtime-axis --token-efficiency` om Codex-vs-OpenClaw-runtimepariteits- en tokenefficiëntierapporten uit één runtime-pair-samenvatting te schrijven.            |
| `qa character-eval`                                 | Voer het karakter-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                               |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                                                                                              |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                                                                                                                  |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor de QA-dashboard- + gateway-lane.                                                                                                                                                                                              |
| `qa up`                                             | Bouw de QA-site, start de door Docker ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                  |
| `qa aimock`                                         | Start alleen de AIMock-providerserver.                                                                                                                                                                                                                                 |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-providerserver.                                                                                                                                                                                                         |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Live-transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix-QA](/nl/concepts/qa-matrix).                                                                                                                                                                   |
| `qa telegram`                                       | Live-transport-lane tegen een echte private Telegram-groep.                                                                                                                                                                                                            |
| `qa discord`                                        | Live-transport-lane tegen een echt privékanaal in een Discord-gilde.                                                                                                                                                                                                   |
| `qa slack`                                          | Live-transport-lane tegen een echt privékanaal in Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live-transport-lane tegen echte WhatsApp Web-accounts.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner voor verificatie voor en na live-transportbugs, met bewijs via Discord-statusreacties, Crabbox desktop-/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook).          |

Door profielen ondersteunde `qa run` leest lidmaatschap uit `taxonomy.yaml` en dispatcht
daarna de opgeloste scenario's via `qa suite`. `--surface` en
`--category` filteren het geselecteerde profiel in plaats van aparte lanes te definiëren.
De resulterende `qa-evidence.json` bevat een scorecardsamenvatting voor het profiel met
aantallen geselecteerde categorieën en ontbrekende dekkings-ID's; de afzonderlijke evidence-
entries blijven de bron van waarheid voor de tests, dekkingsrollen en resultaten.
Taxonomie-featuredekkings-ID's zijn exacte bewijsdoelen, geen aliassen. Primaire
scenariodekking vervult overeenkomende ID's; secundaire dekking blijft adviserend.
Dekkings-ID's gebruiken de gestippelde vorm `namespace.behavior` met segmenten in kleine letters
met alfanumerieke tekens/streepjes; profiel-, surface- en categorie-ID's mogen nog steeds
de bestaande gestreepte of gestippelde taxonomie-ID's gebruiken.
Slank bewijs laat per-entry `execution` weg en zet `evidenceMode: "slim"`;
`smoke-ci` gebruikt standaard slank, en `--evidence-mode full` herstelt volledige entries:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gebruik `smoke-ci` voor deterministisch profielbewijs met mock-modelproviders en
Crabline lokale provider-servers. Gebruik `release` voor Stable/LTS-bewijs tegen live
kanalen. Gebruik `all` alleen voor expliciete volledige taxonomie-evidenceruns; het selecteert
elke actieve volwassenheidscategorie en kan worden gedispatcht via de `QA Profile
Evidence`-workflow met `qa_profile=all`. Wanneer een opdracht ook een OpenClaw
rootprofiel nodig heeft, plaats het rootprofiel dan vóór de QA-opdracht:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de door Docker ondersteunde gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringsloop de agent een QA-
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, faalde of
geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder telkens de Docker-image opnieuw te bouwen,
start u de stack met een bind-mounted QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een vooraf gebouwde image en bind-mount
`extensions/qa-lab/web/dist` in de `qa-lab`-container. `qa:lab:watch`
bouwt die bundel opnieuw bij wijzigingen, en de browser herlaadt automatisch wanneer de QA Lab-
asset-hash verandert.

Voor een lokale OpenTelemetry-signaal-smoke voert u uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-receiver, voert het `otel-trace-smoke` QA-
scenario uit met de `diagnostics-otel`-plugin ingeschakeld, en controleert daarna of traces,
metrics en logs worden geëxporteerd. Het decodeert de geëxporteerde protobuf-tracespans
en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, een model-call-span volgens de nieuwste GenAI semantic convention,
`openclaw.context.assembled` en `openclaw.message.delivery`
moeten aanwezig zijn. De smoke forceert
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, dus de model-call-
span moet de naam `{gen_ai.operation.name} {gen_ai.request.model}` gebruiken;
model-calls mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. De ruwe OTLP-
payloads mogen de prompt-sentinel, response-sentinel of QA-sessiesleutel niet bevatten.
Het schrijft `otel-smoke-summary.json` naast de QA-suite-artifacts.

Voor een door collector ondersteunde OpenTelemetry-smoke voert u uit:

```bash
pnpm qa:otel:collector-smoke
```

Die lane plaatst een echte OpenTelemetry Collector-Docker-container vóór dezelfde
lokale receiver. Gebruik dit wanneer u endpoint-bedrading, collector-
compatibiliteit of OTLP-exportgedrag wijzigt dat de in-process receiver zou kunnen maskeren.

Voor de beschermde Prometheus-scrape-smoke voert u uit:

```bash
pnpm qa:prometheus:smoke
```

Die alias voert het QA-scenario `docker-prometheus-smoke` uit met
`diagnostics-prometheus` ingeschakeld, verifieert dat niet-geauthenticeerde
scrapes worden geweigerd, en controleert daarna dat de geauthenticeerde scrape
release-kritieke metricafamilies bevat zonder promptinhoud, antwoordinhoud,
ruwe diagnostische identificatoren, auth-tokens of lokale paden.

Gebruik het volgende om beide waarneembaarheids-smoke-tests achter elkaar uit
te voeren:

```bash
pnpm qa:observability:smoke
```

Gebruik voor de door een collector ondersteunde OpenTelemetry-baan plus de
beschermde Prometheus-scrape-smoke-test:

```bash
pnpm qa:observability:collector-smoke
```

Waarneembaarheids-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-releasebanen voeren geen `qa`-commando's
uit. Gebruik `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` of
`pnpm qa:observability:smoke` vanuit een gebouwde source-checkout wanneer je
diagnostische instrumentatie wijzigt.

Voer voor een transport-echte Matrix-smoke-baan die geen modelproviderreferenties
vereist het snelle profiel uit met de deterministische mock-OpenAI-provider:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Geef voor de live-frontier-providerbaan expliciet OpenAI-compatibele
referenties op:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, omgevingsvariabelen en artifact-indeling voor deze baan staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: deze richt een wegwerpbare Tuwunel-homeserver in Docker in, registreert tijdelijke driver-/SUT-/waarnemersgebruikers, voert de echte Matrix-Plugin uit binnen een child-QA-gateway die tot dat transport is beperkt (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, artifact met waargenomen gebeurtenissen en gecombineerd uitvoerlogboek onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unittests niet end-to-end kunnen bewijzen: mention-gating, allow-bot-beleid, allowlists, top-level en threaded antwoorden, DM-routering, reactieafhandeling, onderdrukking van inkomende bewerkingen, deduplicatie van herstart-replay, herstel na homeserveronderbreking, levering van goedkeuringsmetadata, media-afhandeling en Matrix E2EE-bootstrap-/herstel-/verificatiestromen. Het E2EE-CLI-profiel voert ook `openclaw matrix encryption setup` en verificatiecommando's via dezelfde wegwerpbare homeserver uit voordat Gateway-antwoorden worden gecontroleerd.

Discord heeft ook alleen-Mantis opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete
statusreactietijdlijn, of `--scenario discord-thread-reply-filepath-attachment`
om een echte Discord-thread te maken en te verifiëren dat `message.thread-reply`
een `filePath`-bijlage behoudt. Deze scenario's blijven buiten de standaard
live Discord-baan omdat ze voor/na-reproductiesondes zijn in plaats van brede
smoke-dekking. De Mantis-workflow voor threadbijlagen kan ook een
ingelogde Discord Web-getuigenvideo toevoegen wanneer
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-omgeving is
geconfigureerd. Dat kijkersprofiel is alleen voor visuele opname; de
pass/fail-beslissing komt nog steeds van het Discord REST-orakel.

CI gebruikt hetzelfde commando-oppervlak in `.github/workflows/qa-live-transports-convex.yml`.
Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met
door QA geleverde live-frontier-referenties, `--fast` en
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatig `matrix_profile=all`
waaiert uit naar de vijf profielshards.

Voor transport-echte Telegram-, Discord-, Slack- en WhatsApp-smoke-banen:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots of accounts (driver + SUT). Vereiste omgevingsvariabelen, scenariolijsten, uitvoerartifacts en de Convex-referentiepool zijn hieronder gedocumenteerd in [QA-referentie voor Telegram, Discord, Slack en WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Voer voor een volledige Slack-desktop-VM-run met VNC-redding uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dat commando huurt een Crabbox-desktop-/browsermachine, voert de Slack-livebaan
binnen de VM uit, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en
`slack-desktop-smoke.mp4` terug naar de Mantis-artifactmap wanneer video-opname
beschikbaar is. Crabbox-desktop-/browserleases leveren de opnamehulpmiddelen en
browser-/native-build-helperpakketten vooraf, dus het scenario zou alleen
fallbacks op oudere leases moeten installeren. Mantis rapporteert totale en
per-fase timings in `mantis-slack-desktop-smoke-report.md`, zodat trage runs
laten zien of de tijd naar lease-warmup, referentieverkrijging, remote setup of
artifactkopie ging. Hergebruik `--lease-id <cbx_...>` nadat je handmatig via
VNC bij Slack Web bent ingelogd; hergebruikte leases houden ook Crabbox'
pnpm-storecache warm. De standaard `--hydrate-mode source` verifieert vanuit een
source-checkout en voert installatie/build binnen de VM uit. Gebruik
`--hydrate-mode prehydrated` alleen wanneer de hergebruikte remote workspace al
`node_modules` en een gebouwde `dist/` heeft; die modus slaat de dure
installatie-/buildstap over en faalt gesloten wanneer de workspace niet klaar
is. Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-Gateway
binnen de VM draaien op poort `38973`; zonder deze optie voert het commando de
normale bot-naar-bot Slack-QA-baan uit en sluit het af na artifact-opname.

Voer de Mantis-goedkeuringscheckpointmodus uit om native Slack-goedkeurings-UI
met desktopbewijs te bewijzen:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Deze modus sluit `--gateway-setup` uit. Hij voert de Slack-goedkeuringsscenario's
uit, weigert niet-goedkeuringsscenario-id's, wacht bij elke lopende en opgeloste
goedkeuringsstatus, rendert het waargenomen Slack API-bericht naar
`approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png`, en faalt vervolgens als een
checkpoint, berichtbewijs, bevestiging of gerenderde screenshot ontbreekt of
leeg is. Koude CI-leases kunnen nog steeds Slack-aanmelding tonen in
`slack-desktop-smoke.png`; de goedkeuringscheckpointafbeeldingen zijn het
visuele bewijs voor deze baan.

De operatorchecklist, GitHub-workflowdispatchopdracht, evidence-commentcontract,
hydrate-mode-beslissingstabel, timinginterpretatie en stappen voor foutafhandeling
staan in [Mantis Slack Desktop-runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voer voor een desktoptaak in agent-/CV-stijl uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` huurt of hergebruikt een Crabbox-desktop-/browsermachine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit op de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een
gestructureerd JSON-oordeel en slaagt alleen wanneer het model positief zichtbaar
bewijs rapporteert; een negatieve reactie die alleen de doeltekst citeert, laat
de assertie falen. Gebruik `--vision-mode metadata` voor een no-model smoke-test
die de desktop-, browser-, screenshot- en videoplumbing bewijst zonder een
provider voor beeldbegrip aan te roepen. Opname is een vereist artifact voor
`visual-task`; als Crabbox geen niet-lege `visual-task.mp4` opneemt, faalt de
taak zelfs wanneer de visuele driver is geslaagd. Bij falen behoudt Mantis de
lease voor VNC, tenzij de taak al was geslaagd en `--keep-lease` niet was
ingesteld.

Voer vóór het gebruik van gepoolde live-referenties uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-brokeromgeving, valideert endpointinstellingen en verifieert admin-/lijstbereikbaarheid wanneer het maintainergeheim aanwezig is. Hij rapporteert voor geheimen alleen de status ingesteld/ontbrekend.

## Live-transportdekking

Live-transportbanen delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te verzinnen. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

Live-transportrunners moeten de gedeelde scenario-id's,
baseline-dekkingshelpers en scenarioselectiehelper importeren uit
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Baan     | Canary | Mention-gating | Bot-naar-bot | Allowlist-blokkade | Top-level antwoord | Quote-antwoord | Herstart hervatten | Thread-opvolging | Thread-isolatie | Reactiewaarneming | Helpcommando | Native commandoregistratie |
| -------- | ------ | -------------- | ------------ | ------------------ | ------------------ | -------------- | ------------------ | ---------------- | ---------------- | ----------------- | ------------ | -------------------------- |
| Matrix   | x      | x              | x            | x                  | x                  |                | x                  | x                | x                | x                 |              |                            |
| Telegram | x      | x              | x            |                    |                    |                |                    |                  |                  |                   | x            |                            |
| Discord  | x      | x              | x            |                    |                    |                |                    |                  |                  |                   |              | x                          |
| Slack    | x      | x              | x            | x                  | x                  |                | x                  | x                | x                |                   |              |                            |
| WhatsApp | x      | x              |              | x                  | x                  | x              | x                  |                  |                  | x                 | x            |                            |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en andere live-transports één expliciete checklist voor het
transportcontract delen.

Voer voor een wegwerpbare Linux-VM-baan zonder Docker in het QA-pad te brengen
uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een nieuwe Multipass-guest, installeert dependencies, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert daarna het normale QA-rapport
en de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
Host- en Multipass-suiteruns voeren standaard meerdere geselecteerde scenario's
parallel uit met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard
concurrency 4, begrensd door het aantal geselecteerde scenario's. Gebruik
`--concurrency <count>` om het aantal workers af te stemmen, of
`--concurrency 1` voor seriële uitvoering.
Gebruik `--pack personal-agent` om het benchmarkpakket voor persoonlijke
assistenten uit te voeren. De pakketselector is additief met herhaalde
`--scenario`-flags: expliciete scenario's worden eerst uitgevoerd, daarna
pakketscenario's in pakketvolgorde, met duplicaten verwijderd.
Gebruik `--pack observability` wanneer een aangepaste QA-runner de
OpenTelemetry-collectorsetup al levert en de OpenTelemetry- en
Prometheus-diagnostiek-smoke-scenario's samen wil selecteren.
Het commando sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik
`--allow-failures` wanneer je artifacts wilt zonder een falende exitcode.
Live-runs geven de ondersteunde QA-authinvoer door die praktisch is voor de
guest: omgevingsgebaseerde providersleutels, het QA-live-providerconfigpad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de
guest via de gemounte workspace kan terugschrijven.

## Telegram, Discord, Slack en WhatsApp QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en de door Docker ondersteunde homeserver-provisioning. Telegram, Discord, Slack en WhatsApp draaien tegen vooraf bestaande echte transports, dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren zich via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaard                                          | Beschrijving                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Voer alleen dit scenario uit. Herhaalbaar.                                                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Waar rapporten, samenvattingen, bewijs, transportspecifieke artefacten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost vanaf `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                                                          |
| `--sut-account <id>`                  | `sut`                                              | Tijdelijke account-id binnen de QA-gatewayconfiguratie.                                                                                                         |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                                                                       |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                  | Primaire/alternatieve modelverwijzingen.                                                                                                                        |
| `--fast`                              | uit                                                | Snelle providermodus waar ondersteund.                                                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                              | Zie [Convex-referentiepool](#convex-credential-pool).                                                                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                    | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                                                    |

Elke lane sluit af met een niet-nulcode bij een mislukt scenario. `--allow-failures` schrijft artefacten zonder een falende exitcode in te stellen.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte privé-Telegram-groep met twee afzonderlijke bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het beste wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

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

De impliciete standaardset dekt altijd canary, mention gating, native command-antwoorden, commando-adressering en bot-naar-bot-groepsantwoorden. `mock-openai`-standaarden bevatten ook deterministische checks voor reply-chains en final-message streaming. `telegram-current-session-status-tool` blijft opt-in omdat het alleen stabiel is wanneer het direct na canary wordt uitgevoerd, niet na willekeurige native command-antwoorden. Gebruik `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` om de huidige standaard/optionele verdeling met regressieverwijzingen af te drukken.

Uitvoerartefacten:

- `telegram-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transport-checks, inclusief profiel-, coverage-, provider-, channel-, artefact-, resultaat- en RTT-velden.

Package-Telegram-runs gebruiken hetzelfde Telegram-referentiecontract. Herhaalde RTT-meting maakt deel uit van de normale package Telegram live lane; de RTT-distributie wordt opgenomen in `qa-evidence.json` onder `result.timing` voor de geselecteerde RTT-check.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wanneer `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` is ingesteld, least de package-live-wrapper een `kind: "telegram"`-referentie, exporteert de geleasede groeps-/driver-/SUT-bot-env naar de installed-package-run, verstuurt Heartbeats voor de lease en geeft deze vrij bij afsluiten. De package-wrapper gebruikt standaard 20 RTT-checks van `telegram-mentioned-message-reply`, een RTT-time-out van 30 s en Convex-rol `maintainer` buiten CI wanneer Convex is geselecteerd. Overschrijf `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om RTT-meting af te stemmen zonder een apart RTT-commando of Telegram-specifiek samenvattingsformaat te maken.

### Discord QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privé-Discord-guildchannel met twee bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw-gateway via de gebundelde Discord-Plugin wordt gestart. Verifieert channel-mention-afhandeling, dat de SUT-bot het native `/help`-commando bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` bewaart berichtinhoud in observed-message-artefacten.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het voice/stage-channel voor `discord-voice-autojoin`; zonder deze waarde kiest het scenario het eerste zichtbare voice/stage-channel voor de SUT-bot.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in voicescenario. Draait op zichzelf, schakelt `channels.discord.voice.autoJoin` in en verifieert dat de huidige Discord-voicestatus van de SUT-bot het doel-voice/stage-channel is. Convex Discord-referenties kunnen optioneel `voiceChannelId` bevatten; anders ontdekt de runner het eerste zichtbare voice/stage-channel in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait op zichzelf omdat het de SUT overschakelt naar always-on, tool-only guild-antwoorden met `messages.statusReactions.enabled=true`, en legt vervolgens een REST-reactietijdlijn plus visuele HTML/PNG-artefacten vast. Mantis before/after-rapporten behouden ook door het scenario geleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

Voer het Discord voice-auto-join-scenario expliciet uit:

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
- `qa-evidence.json` - bewijsitems voor de live transport-checks.
- `discord-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario draait.

### Slack QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-channel met twee afzonderlijke bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw-gateway via de gebundelde Slack-Plugin wordt gestart.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` bewaart berichtinhoud in observed-message-artefacten.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` schakelt visuele goedkeuringscheckpoints voor Mantis in. De runner schrijft `<scenario>.pending.json` en `<scenario>.resolved.json`, en wacht daarna op overeenkomende `.ack.json`-bestanden.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` overschrijft de time-out voor checkpointbevestiging. De standaardwaarde is `120000`.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in native Slack exec-goedkeuringsscenario. Vraagt een exec-goedkeuring aan via de Gateway, verifieert dat het Slack-bericht native goedkeuringsknoppen heeft, lost deze op en verifieert de opgeloste Slack-update.
- `slack-approval-plugin-native` - opt-in native Slack Plugin-goedkeuringsscenario. Schakelt exec- en Plugin-goedkeuringsforwarding samen in, zodat Plugin-events niet worden onderdrukt door exec-goedkeuringsroutering, en verifieert daarna hetzelfde pending/resolved native Slack UI-pad.

Uitvoerartefacten:

- `slack-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transport-checks.
- `slack-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - alleen wanneer Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` instelt; bevat checkpoint-JSON, bevestigings-JSON en pending/resolved-screenshots.

#### De Slack-workspace instellen

De lane heeft twee afzonderlijke Slack-apps in één workspace nodig, plus een channel waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een channel waarvoor beide bots zijn uitgenodigd. Gebruik een dedicated channel; de lane post bij elke run.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een aparte Slack-app van de driver moet zijn zodat de bot user id daarvan afzonderlijk is.
- `sutAppToken` - app-level token (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app events kan ontvangen.

Geef de voorkeur aan een Slack-workspace die is toegewijd aan QA boven hergebruik van een productieworkspace.

Het SUT-manifest hieronder beperkt bewust de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`) tot de permissies en events die door de live Slack QA-suite worden gedekt. Voor de productiechannelsetup zoals gebruikers die zien, zie [Slack-channel-snelinstelling](/nl/channels/slack#quick-setup); het QA Driver/SUT-paar is bewust apart omdat de lane twee afzonderlijke bot user ids in één workspace nodig heeft.

**1. Maak de Driver-app**

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

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app gebruikt bewust een smallere versie van het productiemanifest van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`): reaction-scopes en events zijn weggelaten omdat de live Slack-QA-suite reaction-afhandeling nog niet dekt.

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

Nadat Slack de app heeft gemaakt, doe je twee dingen op de instellingenpagina:

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → dat wordt `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de waarde `xapp-...` → dat wordt `sutAppToken`.

Controleer dat de twee bots verschillende gebruikers-id's hebben door `auth.test` op elk token aan te roepen. De runtime onderscheidt driver en SUT op basis van gebruikers-id; één app voor beide hergebruiken laat mention-gating onmiddellijk falen.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal (bijv. `#openclaw-qa`) en nodig beide bots uit vanuit het kanaal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de id `Cxxxxxxxxxx` uit _channel info → About → Channel ID_ - dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-reads van de harness blijven slagen.

**4. Registreer de inloggegevens**

Twee opties. Gebruik env vars voor debugging op één machine (stel de vier `OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` mee), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

Schrijf voor de Convex-pool de vier velden naar een JSON-bestand:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in je shell, registreer en verifieer je:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Verwacht `count: 1`, `status: "active"`, geen veld `lease`.

**5. Verifieer end-to-end**

Voer de lane lokaal uit om te bevestigen dat beide bots via de broker met elkaar kunnen praten:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Een groene run voltooit ruim binnen 30 seconden en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden hangt en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleaset - `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Richt zich op twee toegewezen WhatsApp Web-accounts: een driver-account dat door
de harness wordt bestuurd en een SUT-account dat door de onderliggende OpenClaw-Gateway wordt gestart via de
gebundelde WhatsApp-Plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optioneel:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` schakelt groepsscenario's in zoals
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenario's voor groepsacties/media/polls en
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` behoudt berichtteksten in
  observed-message-artefacten.

Scenariocatalogus (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline en group gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Native opdrachten: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwoord- en final-output-gedrag: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Berichtacties in het gebruikerspad: `whatsapp-agent-message-action-react` begint vanuit
  een echte driver-DM, laat het model de tool `message` aanroepen en observeert de
  native WhatsApp-reactie. `whatsapp-agent-message-action-upload-file` gebruikt
  dezelfde opstelling voor `message(action=upload-file)` en observeert native
  WhatsApp-media. `whatsapp-group-agent-message-action-react` en
  `whatsapp-group-agent-message-action-upload-file` bewijzen dezelfde gebruikerszichtbare
  acties in een echte WhatsApp-groep.
- Group fanout: `whatsapp-broadcast-group-fanout` begint met één genoemde
  WhatsApp-groepsbericht en verifieert verschillende zichtbare antwoorden van `main` en
  `qa-second`.
- Groepsactivatie: `whatsapp-group-activation-always` wijzigt een echte groepssessie
  naar `/activation always`, bewijst dat een groepsbericht zonder mention de
  agent activeert, en herstelt daarna `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  seedt een botantwoord, stuurt een native geciteerd antwoord daarop zonder expliciete
  mention, en verifieert dat de agent vanuit die antwoordcontext activeert.
- Inkomende media en gestructureerde berichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Deze sturen echte WhatsApp-image-, audio-, document-, locatie-, contact-, sticker-
  en reaction-events via de driver.
- Directe Gateway-contractprobes:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Deze omzeilen modelprompting bewust en
  bewijzen deterministische Gateway-/kanaalcontracten voor `send`, `poll` en `message.action`.
- Access-control-dekking: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native approvals: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreacties: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

De catalogus bevat momenteel 50 scenario's. De standaardlane `live-frontier` is
klein gehouden met 10 scenario's voor snelle smoke-dekking. De standaardlane `mock-openai`
voert 44 deterministische scenario's uit via de echte WhatsApp-transportlaag, terwijl
alleen modeluitvoer wordt gemockt. Approval-scenario's en enkele zwaardere/blokkerende checks
blijven expliciet per scenario-id.

De WhatsApp-QA-driver observeert gestructureerde live events (`text`, `media`,
`location`, `reaction` en `poll`) en kan actief media, polls,
contacten, locaties en stickers verzenden. QA Lab importeert die driver via het
pakketoppervlak `@openclaw/whatsapp/api.js` in plaats van private
WhatsApp-runtimebestanden te benaderen. Voor groepsobservaties is `fromJid` de groeps-JID terwijl
`participantJid` en `fromPhoneE164` de verzendende deelnemer identificeren. Berichtinhoud
wordt standaard geredigeerd. Directe Gateway-
poll-, upload-file-, media-, groepspoll-, groepsmedia- en reply-shape-probes zijn transport-/API-contract
checks; ze worden niet behandeld als bewijs dat een gebruikersprompt de agent dezelfde
actie liet kiezen. Bewijs voor acties in het gebruikerspad komt uit scenario's zoals
`whatsapp-agent-message-action-react` en
`whatsapp-group-agent-message-action-react`, waarbij de driver een normaal
WhatsApp-bericht stuurt en QA Lab het resulterende native WhatsApp-artefact observeert.
WhatsApp-rapporten bevatten de opstelling van elk scenario (`user-path`, `direct-gateway`
of `native-approval`) zodat bewijs niet kan worden verward met een sterker contract
dan het werkelijk bewijst.

Uitvoerartefacten:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - bewijsitems voor de live transport-checks.
- `whatsapp-qa-observed-messages.json` - berichtteksten geredigeerd tenzij `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex-inloggegevenspool

Telegram-, Discord-, Slack- en WhatsApp-lanes kunnen inloggegevens leasen uit een gedeelde Convex-pool in plaats van de env vars hierboven te lezen. Geef `--credential-source convex` mee (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, stuurt Heartbeats gedurende de run en geeft de lease vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"`, `"slack"` en `"whatsapp"`.

Payloadvormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-tekenreeks zijn.
- Echte Telegram-gebruiker (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - alleen Mantis Telegram Desktop-bewijs. Generieke QA Lab-lanes mogen dit type niet verkrijgen.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefoonnummers moeten verschillende E.164-tekenreeksen zijn.

De Mantis Telegram Desktop-bewijsworkflow houdt één exclusieve Convex
`telegram-user`-lease vast voor zowel de TDLib CLI-driver als de Telegram Desktop-
getuige, en geeft die vervolgens vrij na het publiceren van bewijs.

Wanneer een PR een deterministische visuele diff nodig heeft, kan Mantis hetzelfde mockmodel-
antwoord gebruiken op `main` en op de PR-head terwijl de Telegram-formatter of bezorgings-
laag verandert. De vastleggingsstandaarden zijn afgestemd op PR-opmerkingen: standaard Crabbox-
klasse, desktopopname met 24 fps, bewegende GIF met 24 fps en voorbeeldbreedte van 1920 px.
Voor/na-opmerkingen moeten een schone bundel publiceren die alleen de
bedoelde GIF's bevat.

Slack-lanes kunnen ook de pool gebruiken. Controles op de Slack-payloadvorm staan momenteel in de Slack QA-runner in plaats van in de broker; gebruik `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, met een Slack-kanaal-id zoals `Cxxxxxxxxxx`. Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-inrichting.

Operationele env-vars en het contract van het Convex-broker-eindpunt staan in [Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór de multikanaal-pool; de leasesemantiek wordt gedeeld tussen typen).

## Repo-ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke YAML-scenariorunner blijven. Elk scenario-YAML-bestand is
de bron van waarheid voor één testrun en moet definiëren:

- top-level `title`
- `scenario`-metadata
- optionele categorie-, capability-, lane- en risicometadata in `scenario`
- docs- en coderefs in `scenario`
- optionele Plugin-vereisten in `scenario`
- optionele Gateway-configpatch in `scenario`
- uitvoerbare top-level `flow` voor flowscenario's, of `scenario.execution.kind` /
  `scenario.execution.path` voor Vitest- en Playwright-scenario's

Het herbruikbare runtime-oppervlak achter `flow` mag generiek
en cross-cutting blijven. YAML-scenario's kunnen bijvoorbeeld transportzijdige
helpers combineren met browserzijdige helpers die de ingesloten Control UI aansturen via de
Gateway-`browser.request`-seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op bronstructuur-
map. Houd scenario-ID's stabiel wanneer bestanden verplaatsen; gebruik `docsRefs` en `codeRefs`
voor implementatie-traceerbaarheid.

De baselijnlijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- cron-callbacks
- geheugenherinnering
- modelwisseling
- overdracht aan subagent
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mocklane voor repo-ondersteunde QA en pariteitsgates.
- `aimock` start een AIMock-ondersteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Dit is aanvullend en vervangt de
  `mock-openai`-scenariodispatcher niet.

Provider-lane-implementatie staat onder `extensions/qa-lab/src/providers/`.
Elke provider beheert zijn standaarden, lokale serveropstart, Gateway-modelconfig,
stagingbehoeften voor auth-profielen en live/mock-capabilityvlaggen. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` beheert een generieke transportseam voor YAML-QA-scenario's. `qa-channel` is
de synthetische standaard. `crabline` start lokale provider-vormige servers en voert
OpenClaw's normale kanaal-Plugins ertegen uit. `live` is gereserveerd voor echte
provider-inloggegevens en externe kanalen.

Op architectuurniveau is de verdeling:

- `qa-lab` beheert generieke scenariouitvoering, worker-concurrency, artefactschrijven en rapportage.
- De transportadapter beheert Gateway-config, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- YAML-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het YAML-QA-systeem vereist de kanaalimplementatie plus
een scenariopakket dat het kanaalcontract oefent. Voeg voor smoke-CI-dekking
de bijpassende lokale Crabline-providerserver toe en stel die beschikbaar via de `crabline`-
driver.

Voeg geen nieuwe top-level QA-commandoroot toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de `openclaw qa`-commandoroot
- suite-opstart en teardown
- worker-concurrency
- artefactschrijven
- rapportgeneratie
- scenariouitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-Plugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway wordt geconfigureerd voor dat transport
- hoe gereedheid wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripts en genormaliseerde transportstatus worden blootgesteld
- hoe transport-ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transportrunner op de gedeelde `qa-lab`-hostseam.
3. Houd transportspecifieke mechanica binnen de runner-Plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende rootcommand te registreren. Runner-Plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een bijpassende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runneruitvoering moeten achter afzonderlijke entrypoints blijven.
5. Maak of pas YAML-scenario's aan onder de thematische `qa/scenarios/`-mappen.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhangt van één kanaaltransport, houd het dan in die runner-Plugin of Plugin-harness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke branch in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd het scenario transportspecifiek en maak dat expliciet in het scenariocontract.

### Namen van scenariohelpers

Voorkeurshelpers voor nieuwe scenario's:

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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuw scenario-auteurswerk moet de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bus-tijdlijn.
Het rapport moet beantwoorden:

- Wat werkte
- Wat faalde
- Wat geblokkeerd bleef
- Welke vervolgsceanario's het waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare output).
Wanneer je gericht bewijs kiest voor geraakt gedrag of een bestandspad, voer `pnpm openclaw qa coverage --match <query>` uit.
Het matchrapport doorzoekt scenariometadata, docsrefs, coderefs, coverage-ID's, Plugins en providervereisten, en drukt vervolgens overeenkomende `qa suite --scenario ...`-targets af.
Elke `qa suite`-run schrijft top-level `qa-evidence.json`-,
`qa-suite-summary.json`- en `qa-suite-report.md`-artefacten voor de geselecteerde
scenarioset. Scenario's die `execution.kind: vitest` of
`execution.kind: playwright` declareren, voeren het bijpassende testpad uit en schrijven ook
logs per scenario. Scenario's die `execution.kind: script` declareren, voeren de
bewijsproducent op `execution.path` uit via `node --import tsx` (met
`${outputDir}` en `${scenarioId}` uitgebreid in `execution.args`); de producent
schrijft zijn eigen `qa-evidence.json`, waarvan de entries in de suite-
output worden geïmporteerd en waarvan de artefactpaden worden opgelost relatief aan die producent-
`qa-evidence.json`. Wanneer `qa suite` wordt bereikt via
`qa run --qa-profile`, bevat dezelfde `qa-evidence.json` ook de profiel-
scorecardsamenvatting voor de geselecteerde taxonomiecategorieën.
Behandel het als een ontdekkingshulpmiddel, niet als vervanging voor een gate; het geselecteerde scenario heeft nog steeds de juiste providermodus, live transport, Multipass, Testbox of release-lane nodig voor het gedrag dat wordt getest.
Zie voor scorecardcontext [Maturiteitsscorecard](/nl/maturity/scorecard).

Voer voor karakter- en stijlcontroles hetzelfde scenario uit over meerdere live model-
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

De opdracht voert lokale QA Gateway-childprocessen uit, geen Docker. Character-eval-scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten uitvoeren, zoals chat, werkruimtehulp en kleine bestandstaken. Het kandidaatmodel mag niet worden verteld dat het wordt geëvalueerd. De opdracht bewaart elk volledig transcript, registreert basisstatistieken van de run en vraagt daarna de beoordelingsmodellen in snelle modus met `xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de beoordelingsprompt krijgt nog steeds elk transcript en elke runstatus, maar kandidaatverwijzingen worden vervangen door neutrale labels zoals `candidate-01`; het rapport koppelt rangschikkingen na het parsen terug aan echte verwijzingen.
Kandidaatruns gebruiken standaard `high`-denken, met `medium` voor GPT-5.5 en `xhigh` voor oudere OpenAI-evalverwijzingen die dit ondersteunen. Overschrijf een specifieke kandidaat inline met `--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` blijft behouden voor compatibiliteit.
OpenAI-kandidaatverwijzingen gebruiken standaard snelle modus, zodat prioriteitsverwerking wordt gebruikt waar de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer één kandidaat of beoordelaar een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je snelle modus voor elk kandidaatmodel wilt afdwingen. Duurmetingen van kandidaten en beoordelaars worden in het rapport geregistreerd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet dat er niet op snelheid moet worden gerangschikt.
Runs van kandidaat- en beoordelingsmodellen gebruiken beide standaard concurrency 16. Verlaag `--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-druk een run te ruisachtig maken.
Wanneer er geen kandidaat-`--model` wordt doorgegeven, gebruikt de character-eval standaard `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` en `google/gemini-3.1-pro-preview` wanneer er geen `--model` wordt doorgegeven.
Wanneer er geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard `openai/gpt-5.5,thinking=xhigh,fast` en `anthropic/claude-opus-4-8,thinking=high`.

## Gerelateerde documentatie

- [Matrix-QA](/nl/concepts/qa-matrix)
- [Maturity-scorecard](/nl/maturity/scorecard)
- [Benchmarkpakket voor persoonlijke agent](/nl/concepts/personal-agent-benchmark-pack)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
