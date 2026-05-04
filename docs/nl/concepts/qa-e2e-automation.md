---
read_when:
    - Begrijpen hoe de QA-stack samenhangt
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Door de repository ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering rond het Gateway-dashboard bouwen
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-04T07:04:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischere,
kanaalvormige manier te oefenen dan een enkele unit-test kan.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerken en verwijderen.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van inkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): verificatie voor en na live uitvoering voor bugs die
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig hebben.

## Commandosurface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                                                   |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                       |
| `qa coverage`                                       | Print de markdown-scenario-dekkingsinventaris (`--json` voor machine-uitvoer).                                                                                                              |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport.                                                                                                |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                    |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                    |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                          |
| `qa docker-build-image`                             | Bouw de vooraf gebakken QA-Docker-image.                                                                                                                                                     |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + gateway-lane.                                                                                                                    |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack, print de URL (alias: `pnpm qa:lab:up`; `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                      |
| `qa mock-openai`                                    | Start alleen de scenario-bewuste `mock-openai`-provider-server.                                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                    |
| `qa matrix`                                         | Live transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                         |
| `qa telegram`                                       | Live transport-lane tegen een echte private Telegram-groep.                                                                                                                                  |
| `qa discord`                                        | Live transport-lane tegen een echt privaat Discord-guildkanaal.                                                                                                                              |
| `qa slack`                                          | Live transport-lane tegen een echt privaat Slack-kanaal.                                                                                                                                     |
| `qa mantis`                                         | Verificatierunner voor en na voor live transport-bugs, met Discord-statusreactie-bewijs, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis).                |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer dit uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de Docker-ondersteunde gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een QA-
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte,
mislukte of geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder telkens de Docker-image opnieuw te bouwen,
start je de stack met een bind-mounted QA Lab-bundel:

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

Voor een lokale OpenTelemetry trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-traceontvanger, voert het
`otel-trace-smoke` QA-scenario uit met de `diagnostics-otel` Plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen `StreamAbandoned` niet exporteren bij geslaagde turns; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostics-
instrumentatie wijzigt.

Voor een transport-echte Matrix-smoke-lane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel/scenario-catalogus, env-vars en artifactindeling voor deze lane staan in [Matrix QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver/SUT/observer-gebruikers, voert de echte Matrix-Plugin uit binnen een onderliggende QA-gateway die tot dat transport is beperkt (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerde uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

Voor transport-echte Telegram-, Discord- en Slack-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-credentialpool zijn hieronder gedocumenteerd in [Telegram-, Discord- en Slack-QA-referentie](#telegram-discord-and-slack-qa-reference).

Voor een volledige Slack-desktop-VM-run met VNC-redding voer je uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dat commando leaset een Crabbox-desktop/browser-machine, voert de Slack-live-lane
uit binnen de VM, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/` plus `slack-desktop-smoke.png` terug naar de Mantis-artifact-
directory. Hergebruik `--lease-id <cbx_...>` nadat je handmatig via VNC bij Slack Web bent ingelogd.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-
gateway draaien binnen de VM op poort `38973`; zonder dit voert het commando de
normale bot-naar-bot Slack-QA-lane uit en stopt het na artifact-vastlegging.

Voer dit uit voordat je gepoolde live credentials gebruikt:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin/list-bereikbaarheid wanneer het maintainer-secret aanwezig is. Het rapporteert alleen ingesteld/ontbrekend-status voor secrets.

## Live transport-dekking

Live transport-lanes delen één contract in plaats van elk hun eigen scenariolijstvorm te bedenken. `qa-channel` is de brede synthetische productgedrag-suite en maakt geen deel uit van de live transport-dekkingsmatrix.

| Lane     | Canary | Mention-gating | Bot-naar-bot | Allowlist-blokkade | Top-level antwoord | Herstart hervatten | Thread-opvolging | Thread-isolatie | Reactie-observatie | Helpcommando | Native command-registratie |
| -------- | ------ | -------------- | ------------ | ------------------ | ------------------ | ------------------ | ---------------- | --------------- | ------------------ | ------------ | -------------------------- |
| Matrix   | x      | x              | x            | x                  | x                  | x                  | x                | x               | x                  |              |                            |
| Telegram | x      | x              | x            |                    |                    |                    |                  |                 |                    | x            |                            |
| Discord  | x      | x              | x            |                    |                    |                    |                  |                 |                    |              | x                          |
| Slack    | x      | x              | x            |                    |                    |                    |                  |                 |                    |              |                            |

Dit houdt `qa-channel` als de brede productgedrag-suite terwijl Matrix,
Telegram en toekomstige live transports één expliciete transport-contract-
checklist delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Hiermee start je een verse Multipass-gast, installeer je afhankelijkheden, bouw je OpenClaw
binnen de gast, voer je `qa suite` uit en kopieer je daarna het normale QA-rapport en de
samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het gebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
Host- en Multipass-suite-uitvoeringen voeren standaard meerdere geselecteerde scenario's parallel uit
met geisoleerde Gateway-workers. `qa-channel` gebruikt standaard gelijktijdigheid
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriele uitvoering.
De opdracht sluit af met een niet-nulstatus wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer
je artefacten wilt zonder een foutieve exitcode.
Live-uitvoeringen sturen de ondersteunde QA-authenticatie-invoer door die praktisch is voor de
gast: op env gebaseerde providersleutels, het pad naar de QA-liveproviderconfiguratie en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de gast
kan terugschrijven via de aangekoppelde werkruimte.

## Telegram-, Discord- en Slack-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-ondersteunde homeserver-provisioning. Telegram, Discord en Slack zijn kleiner: elk een handvol scenario's, geen profielsysteem, tegen vooraf bestaande echte kanalen. Daarom staat hun referentie hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaard                                                       | Beschrijving                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Voer alleen dit scenario uit. Herhaalbaar.                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/waargenomen berichten en het uitvoerlog worden weggeschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repo-root wanneer je aanroept vanuit een neutrale cwd.                                                                           |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijke account-id binnen de QA-Gatewayconfiguratie.                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (verouderde `live-openai` werkt nog steeds).                                                    |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                               | Primaire/alternatieve modelrefs.                                                                                                 |
| `--fast`                              | uit                                                             | Snelle providermodus waar ondersteund.                                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex-referentiepool](#convex-credential-pool).                                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                     |

Elke lane sluit af met een niet-nulstatus bij elk mislukt scenario. `--allow-failures` schrijft artefacten zonder een foutieve exitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op een echte private Telegram-groep met twee afzonderlijke bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-botobservatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerieke chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met waargenomen berichten (standaard geredigeerd).

Scenario's (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Uitvoerartefacten:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bevat RTT per antwoord (driver verzendt → waargenomen SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op een echt privaat Discord-guildkanaal met twee bots: een driverbot die door de harness wordt beheerd en een SUT-bot die door de child-OpenClaw-Gateway wordt gestart via de gebundelde Discord-plugin. Verifieert afhandeling van kanaalvermeldingen, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — moet overeenkomen met de SUT-botgebruiker-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met waargenomen berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis-scenario. Draait op zichzelf omdat het de SUT overschakelt naar altijd-aan, alleen-tools-guildantwoorden met `messages.statusReactions.enabled=true`, en daarna een REST-reactietijdlijn plus een HTML/PNG-visueel artefact vastlegt.

Voer het Mantis-statusreactiescenario expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Uitvoerartefacten:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario draait.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op een echt privaat Slack-kanaal met twee afzonderlijke bots: een driverbot die door de harness wordt beheerd en een SUT-bot die door de child-OpenClaw-Gateway wordt gestart via de gebundelde Slack-plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met waargenomen berichten.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Uitvoerartefacten:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Convex-referentiepool

Telegram-, Discord- en Slack-lanes kunnen referenties leasen uit een gedeelde Convex-pool in plaats van de env-vars hierboven te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de uitvoering en geeft die vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"` en `"slack"`.

Payloadvormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operationele env-vars en het contract van het Convex-brokerendpoint staan in [Testen → Gedeelde Telegram-referenties via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van voor Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Repo-ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor een testuitvoering en moet het volgende definieren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- docs- en coderefs
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak dat `qa-flow` ondersteunt mag generiek
en cross-cutting blijven. Markdownscenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingebedde Control UI aansturen via de
Gateway-`browser.request`-seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op bronboommap. Houd scenario-id's stabiel wanneer bestanden verplaatsen; gebruik `docsRefs` en `codeRefs`
voor implementatietraceerbaarheid.

De baselinelijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- cron-callbacks
- geheugenherinnering
- modelwisseling
- overdracht aan subagent
- repo-lezen en docs-lezen
- een kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Dit blijft de standaard
  deterministische mocklane voor repo-ondersteunde QA en pariteitsgates.
- `aimock` start een AIMock-ondersteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Het is aanvullend en vervangt de
  `mock-openai`-scenariodispatcher niet.

Provider-lane-implementatie staat onder `extensions/qa-lab/src/providers/`.
Elke provider bezit zijn standaardinstellingen, lokale serverstart, Gateway-modelconfiguratie,
stagingbehoeften voor auth-profielen en live/mock-capabilityvlaggen. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` bezit een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten in dezelfde suite-runner kunnen worden ingeplugd in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de splitsing:

- `qa-lab` bezit generieke scenario-uitvoering, worker-gelijktijdigheid, artefactschrijven en rapportage.
- De transportadapter bezit Gateway-configuratie, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definieren de testuitvoering; `qa-lab` levert het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract oefent.

Voeg geen nieuwe top-level QA-opdrachtroot toe wanneer de gedeelde `qa-lab`-host de flow kan bezitten.

`qa-lab` beheert de gedeelde hostmechanica:

- de commandoroot `openclaw qa`
- het opstarten en afsluiten van suites
- worker-gelijktijdigheid
- schrijven van artefacten
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe gereedheid wordt gecontroleerd
- hoe inkomende gebeurtenissen worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripties en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transportrunner op de gedeelde `qa-lab`-hostnaad.
3. Houd transportspecifieke mechanica binnen de runner-plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende rootcommand te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende array `qaRunnerCliRegistrations` exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; luie CLI- en runner-uitvoering moeten achter afzonderlijke entrypoints blijven.
5. Schrijf of pas markdownscenario's aan onder de thematische mappen `qa/scenarios/`.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-plugin of pluginharness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke vertakking in `suite.ts`.
- Als gedrag alleen zinvol is voor één transport, houd het scenario dan transportspecifiek en maak dat expliciet in het scenariocontract.

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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bustijdlijn.
Het rapport moet beantwoorden:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgsceanrio's de moeite waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's — nuttig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport — voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).

Voor teken- en stijlcontroles voer je hetzelfde scenario uit over meerdere live model
refs en schrijf je een beoordeeld Markdown-rapport:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

De command voert lokale QA Gateway-childprocessen uit, geen Docker. Scenario's voor tekenevaluatie
moeten de persona via `SOUL.md` instellen en daarna gewone gebruikersbeurten uitvoeren
zoals chat, workspacehulp en kleine bestandstaken. Het kandidaatmodel mag
niet worden verteld dat het wordt geëvalueerd. De command bewaart elke volledige
transcriptie, legt basisrunstatistieken vast en vraagt daarna de beoordelingsmodellen in snelle modus met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de beoordelingsprompt krijgt nog steeds
elke transcriptie en runstatus, maar kandidaatrefs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na parsing terug aan echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
voor compatibiliteit behouden.
OpenAI-kandidaatrefs gebruiken standaard snelle modus, zodat prioriteitsverwerking wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een override nodig heeft. Geef `--fast` alleen door wanneer je
snelle modus voor elk kandidaatmodel wilt afdwingen. Kandidaat- en beoordelaarsduur worden
in het rapport vastgelegd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en beoordelingsmodelruns gebruiken beide standaard gelijktijdigheid 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-druk
een run te ruisachtig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt de karakterevaluatie standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde docs

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
