---
read_when:
    - Begrijpen hoe de QA-stack in elkaar past
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - QA-scenario's met repo-ondersteuning toevoegen
    - QA-automatisering met hogere realismegraad rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanes, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-06-27T17:29:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw realistischer en meer
kanaalvormig te testen dan met een enkele unit-test mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtenkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerken en verwijderen.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van inkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-Plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): liveverificatie voor en na voor bugs die
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig hebben.

## Command surface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`-
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole zonder `--qa-profile`; taxonomy-ondersteunde runner voor maturiteitsprofielen met `--qa-profile smoke-ci`, `--qa-profile release` of `--qa-profile all`.                                                                                   |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                                   |
| `qa coverage`                                       | Druk de YAML-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                       |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport, of gebruik `--runtime-axis --token-efficiency` om Codex-vs-OpenClaw-runtimepariteit en token-efficiencyrapporten te schrijven vanuit een samenvatting van een runtime-paar. |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live-modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                              |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                                                                                              |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                                                                                                                  |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + Gateway-lane.                                                                                                                                                                                              |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; de `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                    |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                                                                                                |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-referentiepool.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Live-transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                                                                                                   |
| `qa telegram`                                       | Live-transport-lane tegen een echte private Telegram-groep.                                                                                                                                                                                                            |
| `qa discord`                                        | Live-transport-lane tegen een echt privékanaal in een Discord-guild.                                                                                                                                                                                                   |
| `qa slack`                                          | Live-transport-lane tegen een echt privékanaal in Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live-transport-lane tegen echte WhatsApp Web-accounts.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Verificatierunner voor en na voor live-transportbugs, met bewijs via Discord-statusreacties, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook).           |

Profielondersteunde `qa run` leest lidmaatschap uit `taxonomy.yaml` en stuurt
daarna de opgeloste scenario's door via `qa suite`. `--surface` en
`--category` filteren het geselecteerde profiel in plaats van aparte lanes te
definiëren. De resulterende `qa-evidence.json` bevat een samenvatting van de
profielscorekaart met aantallen geselecteerde categorieën en ontbrekende
dekkings-ID's; de individuele bewijsitems blijven de bron van waarheid voor de
tests, dekkingsrollen en resultaten. Featuredekkings-ID's uit de taxonomy zijn
exacte bewijsdoelen, geen aliassen. Primaire scenariodekking vervult
overeenkomende ID's; secundaire dekking blijft adviserend. Dekkings-ID's
gebruiken de gestippelde vorm `namespace.behavior` met kleine alfanumerieke/
streepjessegmenten; profiel-, surface- en categorie-ID's mogen nog steeds de
bestaande gestreepte of gestippelde taxonomy-ID's gebruiken.
Slank bewijs laat per item `execution` weg en zet `evidenceMode: "slim"`;
`smoke-ci` gebruikt standaard slank, en `--evidence-mode full` herstelt volledige items:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gebruik `smoke-ci` voor deterministisch profielbewijs met mock-modelproviders en
Crabline-nepservers voor providers. Gebruik `release` voor Stable/LTS-bewijs tegen live
kanalen. Gebruik `all` alleen voor expliciete bewijsruns over de volledige taxonomy; het selecteert
elke actieve maturiteitscategorie en kan worden uitgevoerd via de `QA Profile
Evidence`-workflow met `qa_profile=all`. Wanneer een commando ook een OpenClaw-
rootprofiel nodig heeft, plaats het rootprofiel vóór het QA-commando:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operator-flow

De huidige QA-operator-flow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de Docker-ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat
werkte, faalde of geblokkeerd bleef.

Voor snellere iteratie aan de QA Lab-UI zonder de Docker-image telkens opnieuw te bouwen,
start je de stack met een bind-gemounte QA Lab-bundel:

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

Voor een lokale OpenTelemetry-signaal-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-ontvanger, voert het `otel-trace-smoke`-QA-
scenario uit met de `diagnostics-otel`-Plugin ingeschakeld en controleert vervolgens of traces,
metrics en logs zijn geëxporteerd. Het decodeert de geëxporteerde protobuf-trace-spans
en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, een nieuwste GenAI semantic-convention
model-call-span, `openclaw.context.assembled` en `openclaw.message.delivery`
moeten aanwezig zijn. De smoke forceert
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, dus de model-call-
span moet de naam `{gen_ai.operation.name} {gen_ai.request.model}` gebruiken;
model-calls mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. De ruwe OTLP-
payloads mogen de prompt-sentinel, response-sentinel of QA-sessiesleutel niet
bevatten. Het schrijft `otel-smoke-summary.json` naast de QA-suite-artefacten.

Voor een door collector ondersteunde OpenTelemetry-smoke voer je uit:

```bash
pnpm qa:otel:collector-smoke
```

Die lane plaatst een echte OpenTelemetry Collector-Docker-container vóór dezelfde
lokale ontvanger. Gebruik dit bij wijzigingen aan endpoint-bedrading, collector-
compatibiliteit of OTLP-exportgedrag dat de in-process ontvanger zou kunnen maskeren.

Voor de beschermde Prometheus-scrape-smoke voer je uit:

```bash
pnpm qa:prometheus:smoke
```

Die alias voert het QA-scenario `docker-prometheus-smoke` uit met
`diagnostics-prometheus` ingeschakeld, verifieert dat niet-geverifieerde scrapes worden geweigerd,
en controleert daarna of de geverifieerde scrape releasekritieke metriekfamilies bevat
zonder promptinhoud, antwoordinhoud, ruwe diagnostische identifiers, auth
tokens of lokale paden.

Gebruik het volgende om beide observability-smokes direct na elkaar uit te voeren:

```bash
pnpm qa:observability:smoke
```

Gebruik voor de door een collector ondersteunde OpenTelemetry-baan plus de beschermde Prometheus-scrape
smoke:

```bash
pnpm qa:observability:collector-smoke
```

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus Docker-releasebanen voor pakketten voeren geen `qa`-opdrachten uit. Gebruik
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` of
`pnpm qa:observability:smoke` vanuit een gebouwde source-checkout wanneer je
diagnostics-instrumentatie wijzigt.

Voor een transportechte Matrix-smokebaan waarvoor geen modelproviderreferenties
nodig zijn, voer je het snelle profiel uit met de deterministische mock-OpenAI-provider:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Voor de live-frontier-providerbaan geef je OpenAI-compatibele referenties
expliciet op:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env-vars en artifactindeling voor deze baan staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: deze richt een wegwerpbare Tuwunel-homeserver in Docker in, registreert tijdelijke driver-/SUT-/observer-gebruikers, voert de echte Matrix-Plugin uit binnen een onderliggende QA-Gateway die is beperkt tot dat transport (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlogboek onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unittests niet end-to-end kunnen bewijzen: mention-gating, allow-bot-beleid, allowlists, antwoorden op topniveau en in threads, DM-routering, reactieafhandeling, onderdrukking van inkomende bewerkingen, deduplicatie van replay na herstart, herstel na homeserveronderbreking, levering van goedkeuringsmetadata, media-afhandeling en Matrix E2EE-bootstrap-/herstel-/verificatiestromen. Het E2EE-CLI-profiel stuurt ook `openclaw matrix encryption setup` en verificatieopdrachten via dezelfde wegwerpbare homeserver voordat Gateway-antwoorden worden gecontroleerd.

Discord heeft ook alleen-voor-Mantis opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete statusreactie-
tijdlijn, of `--scenario discord-thread-reply-filepath-attachment` om een
echte Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten de standaard live Discord-baan
omdat het voor/na-reproductieprobes zijn in plaats van brede smokedekking.
De Mantis-workflow voor threadbijlagen kan ook een ingelogde Discord Web-
getuigenvideo toevoegen wanneer `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-
omgeving is geconfigureerd. Dat viewerprofiel is alleen voor visuele vastlegging; de pass/fail-
beslissing komt nog steeds van het Discord REST-orakel.

CI gebruikt hetzelfde opdrachtoppervlak in `.github/workflows/qa-live-transports-convex.yml`.
Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met
door QA geleverde live-frontier-referenties, `--fast` en
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatige `matrix_profile=all` waaiert
uit naar de vijf profielshards.

Voor transportechte Telegram-, Discord-, Slack- en WhatsApp-smokebanen:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots of accounts (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-referentiepool zijn hieronder gedocumenteerd in [QA-referentie voor Telegram, Discord, Slack en WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Voor een volledige Slack-desktop-VM-run met VNC-redding voer je uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die opdracht leaset een Crabbox-desktop-/browsermachine, voert de Slack-livebaan
uit binnen de VM, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
wanneer video-opname beschikbaar is terug naar de Mantis-artifactmap. Crabbox-
desktop-/browserleases leveren de capturetools en browser-/native-build-helper-
pakketten vooraf, dus het scenario zou alleen fallbacks moeten installeren op oudere
leases. Mantis rapporteert totale en per-fase timings in
`mantis-slack-desktop-smoke-report.md`, zodat trage runs laten zien of tijd ging naar
lease-opwarming, verkrijging van referenties, remote setup of artifactkopie. Hergebruik
`--lease-id <cbx_...>` nadat je handmatig via VNC bent ingelogd bij Slack Web;
hergebruikte leases houden ook Crabbox' pnpm-storecache warm. De standaard
`--hydrate-mode source` verifieert vanuit een source-checkout en voert install/build
binnen de VM uit. Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte remote
workspace al `node_modules` en een gebouwde `dist/` heeft; die modus slaat de
dure install-/buildstap over en faalt gesloten wanneer de workspace niet klaar is.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-Gateway
draaien binnen de VM op poort `38973`; zonder dit voert de opdracht de normale
bot-naar-bot Slack-QA-baan uit en sluit af na artifactvastlegging.

Voer de Mantis-goedkeuringscheckpointmodus uit om native Slack-goedkeurings-UI met desktopbewijs te bewijzen:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Deze modus sluit `--gateway-setup` wederzijds uit. Deze voert de Slack-
goedkeuringsscenario's uit, weigert niet-goedkeuringsscenario-id's, wacht bij elke openstaande en
opgeloste goedkeuringsstatus, rendert het waargenomen Slack API-bericht naar
`approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png`, en faalt daarna als een checkpoint,
berichtbewijs, bevestiging of gerenderde screenshot ontbreekt of leeg is.
Koude CI-leases kunnen nog steeds Slack-aanmelding tonen in `slack-desktop-smoke.png`; de
goedkeuringscheckpointafbeeldingen zijn het visuele bewijs voor deze baan.

De operatorchecklist, GitHub-workflowdispatchopdracht, het evidence-comment-
contract, de hydrate-mode-beslissingstabel, timinginterpretatie en foutafhandelingsstappen
staan in [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voor een desktoptaak in agent-/CV-stijl voer je uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` leaset of hergebruikt een Crabbox-desktop-/browsermachine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit tegen de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een gestructureerd JSON-
oordeel en slaagt alleen wanneer het model positief zichtbaar bewijs rapporteert; een
negatief antwoord dat alleen de doeltekst citeert, faalt de assertie.
Gebruik `--vision-mode metadata` voor een rooktest zonder model die de desktop,
browser, screenshot en videoplumbing bewijst zonder een image-understanding-
provider aan te roepen. Opname is een vereist artifact voor `visual-task`; als Crabbox
geen niet-lege `visual-task.mp4` opneemt, faalt de taak zelfs wanneer de visuele driver
is geslaagd. Bij falen behoudt Mantis de lease voor VNC, tenzij de taak al
was geslaagd en `--keep-lease` niet was ingesteld.

Voer vóór het gebruik van gepoolde live-referenties uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert Convex-broker-env, valideert endpointinstellingen en verifieert bereikbaarheid van admin/list wanneer het maintainergeheim aanwezig is. Deze rapporteert voor secrets alleen set/missing-status.

## Live-transportdekking

Live-transportbanen delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te bedenken. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

Live-transportrunners moeten de gedeelde scenario-id's, baseline-
dekkingshelpers en scenarioselectiehelper importeren uit
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Baan     | Kanarie | Mention-gating | Bot-naar-bot | Allowlist-blokkering | Antwoord op topniveau | Citaatantwoord | Hervatten na herstart | Thread-opvolging | Thread-isolatie | Reactieobservatie | Helpcommando | Native opdrachtregistratie |
| -------- | ------- | -------------- | ------------ | -------------------- | --------------------- | -------------- | --------------------- | ---------------- | --------------- | ----------------- | ------------ | --------------------------- |
| Matrix   | x       | x              | x            | x                    | x                     |                | x                     | x                | x               | x                 |              |                             |
| Telegram | x       | x              | x            |                      |                       |                |                       |                  |                 |                   | x            |                             |
| Discord  | x       | x              | x            |                      |                       |                |                       |                  |                 |                   |              | x                           |
| Slack    | x       | x              | x            | x                    | x                     |                | x                     | x                | x               |                   |              |                             |
| WhatsApp | x       | x              |              | x                    | x                     | x              | x                     |                  |                 | x                 | x            |                             |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en andere live-transporten één expliciete checklist voor het transportcontract delen.

Voor een wegwerpbare Linux-VM-baan zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een nieuwe Multipass-guest, installeert afhankelijkheden, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert daarna het normale QA-rapport en
de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Deze hergebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren standaard meerdere geselecteerde scenario's parallel uit
met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
Gebruik `--pack personal-agent` om het benchmarkpakket voor de persoonlijke assistent uit te voeren. De
pakketselector is additief met herhaalde `--scenario`-flags: expliciete scenario's
worden eerst uitgevoerd, daarna pakketscenario's in pakketvolgorde met duplicaten verwijderd.
Gebruik `--pack observability` wanneer een aangepaste QA-runner al de
OpenTelemetry-collectorsetup levert en de OpenTelemetry- en Prometheus-
diagnostics-smokescenario's samen geselecteerd wil hebben.
De opdracht sluit af met niet-nul wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder een falende exitcode.
Live-runs forwarden de ondersteunde QA-auth-invoer die praktisch is voor de
guest: env-gebaseerde providersleutels, het QA live-providerconfigpad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
kan terugschrijven via de gemounte workspace.

## QA-referentie voor Telegram, Discord, Slack en WhatsApp

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en de Docker-ondersteunde provisioning van homeservers. Telegram, Discord, Slack en WhatsApp draaien tegen bestaande echte transports, dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaardwaarde                                    | Beschrijving                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                  | Voer alleen dit scenario uit. Herhaalbaar.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Waar rapporten, samenvattingen, bewijs, transport-specifieke artefacten en het uitvoerlogboek worden geschreven. Relatieve paden worden opgelost tegen `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                                                       |
| `--sut-account <id>`                  | `sut`                                              | Tijdelijke account-id binnen de QA Gateway-configuratie.                                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | standaardwaarde van provider                       | Primaire/alternatieve modelreferenties.                                                                                                                      |
| `--fast`                              | uit                                                | Snelle providermodus waar ondersteund.                                                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                              | Zie [Convex-referentiepool](#convex-credential-pool).                                                                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                    | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                                                 |

Elke lane sluit af met een niet-nulcode bij elk mislukt scenario. `--allow-failures` schrijft artefacten zonder een falende exitcode in te stellen.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Richt zich op een echte besloten Telegram-groep met twee afzonderlijke bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-botobservatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** ingeschakeld hebben in `@BotFather`.

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

De impliciete standaardset dekt altijd canary, mention gating, native command-antwoorden, command-adressering en bot-naar-bot-groepsantwoorden. `mock-openai`-standaardwaarden bevatten ook deterministische controles voor antwoordketens en streaming van eindberichten. `telegram-current-session-status-tool` blijft opt-in omdat het alleen stabiel is wanneer het direct na canary wordt gethread, niet na willekeurige native command-antwoorden. Gebruik `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` om de huidige verdeling tussen standaard en optioneel met regressiereferenties af te drukken.

Uitvoerartefacten:

- `telegram-qa-report.md`
- `qa-evidence.json` - bewijsvermeldingen voor de live transport-controles, inclusief profiel-, dekkings-, provider-, kanaal-, artefact-, resultaat- en RTT-velden.

Telegram-runs voor packages gebruiken hetzelfde Telegram-referentiecontract. Herhaalde RTT-meting maakt deel uit van de normale package Telegram live-lane; de RTT-distributie wordt opgenomen in `qa-evidence.json` onder `result.timing` voor de geselecteerde RTT-controle.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wanneer `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` is ingesteld, least de package live-wrapper een `kind: "telegram"`-referentie, exporteert de geleasete groeps-/driver-/SUT-bot-env naar de geïnstalleerde-package-run, heartbeatt de lease en geeft deze vrij bij afsluiten. De package-wrapper gebruikt standaard 20 RTT-controles van `telegram-mentioned-message-reply`, een RTT-time-out van 30 s en Convex-rol `maintainer` buiten CI wanneer Convex is geselecteerd. Overschrijf `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` of `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om RTT-meting af te stemmen zonder een afzonderlijk RTT-command of Telegram-specifiek samenvattingsformaat te maken.

### Discord QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt besloten Discord-guildkanaal met twee bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw Gateway wordt gestart via de gebundelde Discord Plugin. Verifieert kanaal-mentionafhandeling, dat de SUT-bot het native `/help`-command bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de SUT-bot-gebruikers-id die Discord retourneert (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het voice-/stagekanaal voor `discord-voice-autojoin`; zonder deze variabele kiest het scenario het eerste zichtbare voice-/stagekanaal voor de SUT-bot.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in voicescenario. Draait op zichzelf, schakelt `channels.discord.voice.autoJoin` in en verifieert dat de huidige Discord-voicestatus van de SUT-bot het doel-voice-/stagekanaal is. Convex Discord-referenties kunnen optioneel `voiceChannelId` bevatten; anders ontdekt de runner het eerste zichtbare voice-/stagekanaal in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait op zichzelf omdat het de SUT overschakelt naar altijd-aan, tool-only guildantwoorden met `messages.statusReactions.enabled=true`, en legt vervolgens een REST-reactietijdlijn plus HTML/PNG-visuele artefacten vast. Mantis voor/na-rapporten bewaren ook door het scenario geleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

Voer het Discord voice auto-join-scenario expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Voer het Mantis status-reactiescenario expliciet uit:

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
- `qa-evidence.json` - bewijsvermeldingen voor de live transport-controles.
- `discord-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het status-reactiescenario draait.

### Slack QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt besloten Slack-kanaal met twee afzonderlijke bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw Gateway wordt gestart via de gebundelde Slack Plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` schakelt visuele goedkeuringscheckpoints voor Mantis in. De runner schrijft `<scenario>.pending.json` en `<scenario>.resolved.json`, en wacht vervolgens op overeenkomende `.ack.json`-bestanden.
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
- `slack-approval-plugin-native` - opt-in native Slack Plugin-goedkeuringsscenario. Schakelt exec- en Plugin-goedkeuringsdoorsturing samen in zodat Plugin-events niet worden onderdrukt door exec-goedkeuringsroutering, en verifieert vervolgens hetzelfde pending/resolved native Slack UI-pad.

Uitvoerartefacten:

- `slack-qa-report.md`
- `qa-evidence.json` - bewijsvermeldingen voor de live transport-controles.
- `slack-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - alleen wanneer Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` instelt; bevat checkpoint-JSON, bevestigings-JSON en pending/resolved-screenshots.

#### De Slack-werkruimte instellen

De lane heeft twee afzonderlijke Slack-apps in één werkruimte nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een toegewezen kanaal; de lane plaatst berichten bij elke run.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een afzonderlijke Slack-app moet zijn van de driver zodat de botgebruikers-id onderscheidend is.
- `sutAppToken` - app-level token (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app events kan ontvangen.

Geef de voorkeur aan een Slack-werkruimte die is toegewezen aan QA boven het hergebruiken van een productie-werkruimte.

Het onderstaande SUT-manifest beperkt bewust de productie-installatie van de gebundelde Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) tot de rechten en events die door de live Slack QA-suite worden gedekt. Voor de productie-kanaalinstelling zoals gebruikers die zien, zie [snelle Slack-kanaalinstelling](/nl/channels/slack#quick-setup); het QA Driver/SUT-paar is bewust gescheiden omdat de lane twee afzonderlijke botgebruikers-id's in één werkruimte nodig heeft.

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

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app gebruikt bewust een smallere versie van het productiemanifest van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`): reaction-scopes en events zijn weggelaten omdat de live Slack QA-suite reaction-afhandeling nog niet dekt.

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

Controleer dat de twee bots verschillende user ids hebben door `auth.test` op elke token aan te roepen. De runtime onderscheidt driver en SUT op basis van user id; één app hergebruiken voor beide zal mention-gating onmiddellijk laten mislukken.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal aan (bijv. `#openclaw-qa`) en nodig beide bots uit vanuit het kanaal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de `Cxxxxxxxxxx`-id uit _channel info → About → Channel ID_ - dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-reads van de harness blijven slagen.

**4. Registreer de credentials**

Twee opties. Gebruik env-vars voor debugging op één machine (stel de vier `OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` door), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

Schrijf voor de Convex-pool de vier velden naar een JSON-bestand:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in je shell, registreer en controleer:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Verwacht `count: 1`, `status: "active"`, geen `lease`-veld.

**5. Controleer end-to-end**

Draai de lane lokaal om te bevestigen dat beide bots via de broker met elkaar kunnen praten:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Een groene run is ruim binnen 30 seconden klaar en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleased - `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Richt zich op twee toegewijde WhatsApp Web-accounts: een driver-account dat door
de harness wordt beheerd en een SUT-account dat door de child OpenClaw Gateway via de
gebundelde WhatsApp-Plugin wordt gestart.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optioneel:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` schakelt groepsscenario's in, zoals
  `whatsapp-mention-gating` en `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` bewaart berichtteksten in
  observed-message-artifacts.

Scenariocatalogus (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline en groeps-gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native commands: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Reply- en final-output-gedrag: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Inbound media en gestructureerde berichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Deze sturen echte WhatsApp-events voor afbeeldingen, audio,
  documenten, locaties, contacten en stickers via de driver.
- Outbound Gateway- en berichtactie-dekking:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Access-control-dekking: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native approvals: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreacties: `whatsapp-status-reactions`.

De catalogus bevat momenteel 36 scenario's. De standaardlane `live-frontier` is
klein gehouden met 10 scenario's voor snelle smoke-dekking. De standaardlane
`mock-openai` voert 31 deterministische scenario's uit via het echte WhatsApp-transport,
waarbij alleen modeloutput wordt gemockt. Approval-scenario's en een paar zwaardere/blokkerende checks
blijven expliciet per scenario-id.

De WhatsApp QA-driver observeert gestructureerde live events (`text`, `media`,
`location`, `reaction` en `poll`) en kan actief media, polls,
contacten, locaties en stickers verzenden. QA Lab importeert die driver via het
`@openclaw/whatsapp/api.js`-pakketoppervlak in plaats van private
WhatsApp-runtimebestanden te benaderen. Berichtinhoud wordt standaard geredigeerd. Dekking voor outbound
poll en upload-file loopt via deterministische Gateway-aanroepen `poll` en
`message.action` in plaats van toolinvocatie alleen via modelprompts.

Output-artifacts:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - evidence-items voor de live transport-checks.
- `whatsapp-qa-observed-messages.json` - teksten geredigeerd tenzij `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex credential pool

Telegram-, Discord-, Slack- en WhatsApp-lanes kunnen credentials leasen uit een gedeelde Convex-pool in plaats van de env-vars hierboven te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de run en geeft die vrij bij shutdown. Poolsoorten zijn `"telegram"`, `"discord"`, `"slack"` en `"whatsapp"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-string zijn.
- Telegram real user (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - alleen Mantis Telegram Desktop-proof. Generieke QA Lab-lanes mogen deze soort niet verkrijgen.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefoonnummers moeten verschillende E.164-strings zijn.

De Mantis Telegram Desktop-proofworkflow houdt één exclusieve Convex
`telegram-user`-lease vast voor zowel de TDLib CLI-driver als de Telegram Desktop-
witness, en geeft die daarna vrij na het publiceren van proof.

Wanneer een PR een deterministische visuele diff nodig heeft, kan Mantis hetzelfde mock-modelantwoord
gebruiken op `main` en op de PR-head terwijl de Telegram-formatter of delivery-
layer verandert. Capture-standaarden zijn afgestemd op PR-comments: standaard Crabbox-
klasse, 24fps desktopopname, 24fps motion-GIF en 1920px previewbreedte.
Before/after-comments moeten een schone bundel publiceren die alleen de
bedoelde GIF's bevat.

Slack-lanes kunnen de pool ook gebruiken. Slack-payloadvormchecks staan momenteel in de Slack QA-runner in plaats van in de broker; gebruik `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, met een Slack-kanaal-id zoals `Cxxxxxxxxxx`. Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env-vars en het endpointcontract van de Convex-broker staan in [Testing → Shared Telegram credentials via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór de multi-channel-pool; de lease-semantiek wordt gedeeld tussen soorten).

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
- optionele categorie-, capability-, lane- en risk-metadata in `scenario`
- docs- en coderefs in `scenario`
- optionele Plugin-vereisten in `scenario`
- optionele Gateway-configpatch in `scenario`
- uitvoerbare top-level `flow` voor flow-scenario's, of `scenario.execution.kind` /
  `scenario.execution.path` voor Vitest- en Playwright-scenario's

Het herbruikbare runtime-oppervlak waarop `flow` steunt, mag generiek
en cross-cutting blijven. YAML-scenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingebedde Control UI via de
Gateway-`browser.request`-seam aansturen zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapaciteit in plaats van
op source-tree-map. Houd scenario-ID's stabiel wanneer bestanden verplaatsen;
gebruik `docsRefs` en `codeRefs` voor traceerbaarheid van de implementatie.

De basislijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- thread-gedrag
- levenscyclus van berichtacties
- cron-callbacks
- geheugenherinnering
- modelwisseling
- overdracht aan subagent
- repo-lezen en docs-lezen
- een kleine buildtaak zoals Lobster Invaders

## Mock-lanes voor aanbieders

`qa suite` heeft twee lokale mock-lanes voor aanbieders:

- `mock-openai` is de scenariobewuste OpenClaw-mock. Dit blijft de standaard
  deterministische mock-lane voor repo-ondersteunde QA- en pariteitsgates.
- `aimock` start een door AIMock ondersteunde aanbiederserver voor experimentele
  protocol-, fixture-, record/replay- en chaosdekking. Het is aanvullend en
  vervangt de `mock-openai`-scenario-dispatcher niet.

De implementatie van aanbieders-lanes staat onder `extensions/qa-lab/src/providers/`.
Elke aanbieder beheert zijn eigen defaults, lokale serverstart, Gateway-modelconfiguratie,
stagingbehoeften voor auth-profielen en live/mock-capabilityvlaggen. Gedeelde suite- en
gateway-code moet via het aanbiedersregister routeren in plaats van op
aanbiedersnamen te branchen.

## Transportadapters

`qa-lab` beheert een generieke transport-seam voor YAML-QA-scenario's. `qa-channel` is
de synthetische default. `crabline` start lokale, aanbieder-vormige servers en voert
OpenClaw's normale kanaalplugins tegen ze uit. `live` is gereserveerd voor echte
aanbiedercredentials en externe kanalen.

Op architectuurniveau is de scheiding:

- `qa-lab` beheert generieke scenario-uitvoering, worker-concurrency, artifact-schrijven en rapportage.
- De transportadapter beheert Gateway-configuratie, readiness, inbound- en outbound-observatie, transportacties en genormaliseerde transportstatus.
- YAML-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` levert het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het YAML-QA-systeem vereist de kanaalimplementatie plus
een scenariopakket dat het kanaalcontract oefent. Voeg voor smoke-CI-dekking
de bijpassende nepaanbiederserver van Crabline toe en stel die beschikbaar via de
`crabline`-driver.

Voeg geen nieuwe top-level QA-commandoroot toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de `openclaw qa`-commandoroot
- suite-start en teardown
- worker-concurrency
- artifact-schrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe readiness wordt gecontroleerd
- hoe inbound events worden geïnjecteerd
- hoe outbound berichten worden geobserveerd
- hoe transcripties en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transport-specifieke reset of cleanup wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde `qa-lab`-host-seam.
3. Houd transport-specifieke mechanica binnen de runner-plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerend rootcommando te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een bijpassende `qaRunnerCliRegistrations`-array exporteren uit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter aparte entrypoints blijven.
5. Schrijf of pas YAML-scenario's aan onder de thematische `qa/scenarios/`-mappen.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het in die runner-plugin of pluginharness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaal-specifieke branch in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd het scenario dan transport-specifiek en maak dat expliciet in het scenariocontract.

### Namen van scenariohelpers

Voorkeursnamen voor generieke helpers in nieuwe scenario's:

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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuwe scenario-authoring moet de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport uit de geobserveerde bus-tijdlijn.
Het rapport moet beantwoorden:

- Wat werkte
- Wat faalde
- Wat geblokkeerd bleef
- Welke vervolgsccenario's de moeite waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's - nuttig bij het inschatten van vervolgwerk of het bedraden van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).
Wanneer je gerichte bewijslast kiest voor aangeraakt gedrag of een bestandspad, voer `pnpm openclaw qa coverage --match <query>` uit.
Het matchrapport doorzoekt scenariometadata, docs-refs, code-refs, dekkings-ID's, plugins en aanbiedervereisten, en print daarna overeenkomende `qa suite --scenario ...`-targets.
Elke `qa suite`-run schrijft top-level `qa-evidence.json`-,
`qa-suite-summary.json`- en `qa-suite-report.md`-artifacts voor de geselecteerde
scenarioset. Scenario's die `execution.kind: vitest` of
`execution.kind: playwright` declareren, voeren het bijpassende testpad uit en schrijven ook
logs per scenario. Scenario's die `execution.kind: script` declareren, voeren de
evidence-producer op `execution.path` uit via `node --import tsx` (met
`${outputDir}` en `${scenarioId}` uitgebreid in `execution.args`); de producer
schrijft zijn eigen `qa-evidence.json`, waarvan de entries in de suite-uitvoer
worden geïmporteerd en waarvan artifact-paden relatief worden opgelost ten opzichte van die producer-
`qa-evidence.json`. Wanneer `qa suite` wordt bereikt via
`qa run --qa-profile`, bevat dezelfde `qa-evidence.json` ook de profiel-
scorecardsamenvatting voor de geselecteerde taxonomiecategorieën.
Behandel het als ontdekkingshulpmiddel, niet als vervanging voor een gate; het geselecteerde scenario heeft nog steeds de juiste aanbiedermodus, live transport, Multipass, Testbox of release-lane nodig voor het gedrag onder test.
Zie [Maturity-scorecard](/nl/maturity/scorecard) voor scorecardcontext.

Voor karakter- en stijlcontroles voer je hetzelfde scenario uit tegen meerdere live model-
refs en schrijf je een beoordeeld Markdown-rapport:

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

De opdracht voert lokale QA-Gateway-childprocessen uit, geen Docker. Character-eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten uitvoeren
zoals chat, workspace-hulp en kleine bestandstaken. Het kandidaatmodel mag
niet worden verteld dat het wordt geëvalueerd. De opdracht bewaart elke volledige
transcriptie, registreert basale runstatistieken en vraagt de beoordelingsmodellen daarna in fast mode met
`xhigh` reasoning waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` bij het vergelijken van aanbieders: de beoordelingsprompt krijgt nog steeds
elke transcriptie en runstatus, maar kandidaatrefs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na het parsen terug aan
echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
voor compatibiliteit behouden.
OpenAI-kandidaatrefs gebruiken standaard fast mode zodat priority processing wordt gebruikt waar
de aanbieder dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een override nodig heeft. Geef `--fast` alleen door wanneer je
fast mode voor elk kandidaatmodel wilt forceren. Kandidaten- en beoordelaarsduur worden
in het rapport geregistreerd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en beoordelingsmodelruns gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer aanbiederlimieten of lokale Gateway-
druk een run te ruisachtig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt character eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-8,thinking=high`.

## Gerelateerde docs

- [Matrix-QA](/nl/concepts/qa-matrix)
- [Maturity-scorecard](/nl/maturity/scorecard)
- [Benchmarkpakket voor persoonlijke agent](/nl/concepts/personal-agent-benchmark-pack)
- [QA-kanaal](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
