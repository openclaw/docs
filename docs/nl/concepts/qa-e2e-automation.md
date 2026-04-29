---
read_when:
    - Inzicht in hoe de QA-stack in elkaar zit
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Repo-ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering rond het Gateway-dashboard bouwen
summary: 'Overzicht van QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanes, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-04-29T22:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalvormige manier te testen dan een enkele unit-test kan.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtenkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van binnenkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.

## Commandosurface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`-
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                             |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                  |
| `qa coverage`                                       | Druk de markdown-inventaris van scenariodekking af (`--json` voor machine-uitvoer).                                                                                    |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische parity-gate-rapport.                                                                        |
| `qa character-eval`                                 | Voer het karakter-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider-/modellane.                                                                                              |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Bouw de vooraf gebakken QA-Docker-image.                                                                                                                               |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + de Gateway-lane.                                                                                           |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack en druk de URL af (alias: `pnpm qa:lab:up`; de `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe). |
| `qa aimock`                                         | Start alleen de AIMock-providerserver.                                                                                                                                 |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-providerserver.                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                              |
| `qa matrix`                                         | Live-transportlane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix-QA](/nl/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | Live-transportlane tegen een echte private Telegram-groep.                                                                                                             |
| `qa discord`                                        | Live-transportlane tegen een echt privaat Discord-guildkanaal.                                                                                                         |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer dit uit met:

```bash
pnpm qa:lab:up
```

Dit bouwt de QA-site, start de Docker-ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een QA-
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, faalde of
geblokkeerd bleef.

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
bouwt die bundel opnieuw bij wijzigingen, en de browser laadt automatisch opnieuw wanneer de QA Lab-
assethash verandert.

Voor een lokale OpenTelemetry-trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-trace-ontvanger, voert het
`otel-trace-smoke`-QA-scenario uit met de `diagnostics-otel`-Plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen bij geslaagde turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-releaselanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostische
instrumentatie wijzigt.

Voor een transport-echte Matrix-smokelane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env-vars en artifactindeling voor deze lane staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver-/SUT-/observer-gebruikers, voert de echte Matrix-Plugin uit binnen een onderliggende QA-Gateway die tot dat transport is beperkt (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, artifact met geobserveerde events en gecombineerd uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

Voor transport-echte Telegram- en Discord-smokelanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Beide richten zich op een vooraf bestaand echt kanaal met twee bots (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-credentialpool zijn hieronder gedocumenteerd in [Telegram- en Discord-QA-referentie](#telegram-and-discord-qa-reference).

Voer dit uit voordat je gepoolde live credentials gebruikt:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin-/lijstbereikbaarheid wanneer het maintainer-geheim aanwezig is. Hij rapporteert voor secrets alleen de status ingesteld/ontbrekend.

## Live-transportdekking

Live-transportlanes delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te bedenken. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

| Lane     | Canary | Mention-gating | Bot-naar-bot | Allowlist-blokkade | Antwoord op topniveau | Hervatten na herstart | Thread-opvolging | Thread-isolatie | Reactie-observatie | Help-commando | Native command-registratie |
| -------- | ------ | -------------- | ------------ | ------------------ | --------------------- | --------------------- | ---------------- | ---------------- | ------------------ | ------------- | --------------------------- |
| Matrix   | x      | x              | x            | x                  | x                     | x                     | x                | x                | x                  |               |                             |
| Telegram | x      | x              | x            |                    |                       |                       |                  |                  |                    | x             |                             |
| Discord  | x      | x              | x            |                    |                       |                       |                  |                  |                    |               | x                           |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live transports één expliciete checklist voor transportcontracten
delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een nieuwe Multipass-guest, installeert afhankelijkheden, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert daarna het normale QA-rapport en de
samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren meerdere geselecteerde scenario's standaard parallel uit
met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
Het commando sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder een falende exitcode.
Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de
guest: env-gebaseerde providersleutels, het QA-live-providerconfigpad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
via de gemounte workspace terug kan schrijven.

## Telegram- en Discord-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-ondersteunde homeserver-provisioning. Telegram en Discord zijn kleiner: elk een handvol scenario's, geen profielsysteem, tegen vooraf bestaande echte kanalen, dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Beide lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaardwaarde                                           | Beschrijving                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Voer alleen dit scenario uit. Herhaalbaar.                                                                                    |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Waar rapporten/samenvatting/waargenomen berichten en het uitvoerlogboek worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Repositoryroot wanneer aangeroepen vanuit een neutrale cwd.                                                                   |
| `--sut-account <id>`                  | `sut`                                                     | Tijdelijke account-id binnen de QA-gatewayconfiguratie.                                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` of `live-frontier` (verouderde `live-openai` werkt nog steeds).                                                 |
| `--model <ref>` / `--alt-model <ref>` | standaardwaarde van provider                              | Primaire/alternatieve modelreferenties.                                                                                       |
| `--fast`                              | uit                                                       | Snelle providermodus waar ondersteund.                                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                     | Zie [Convex-referentiepool](#convex-credential-pool).                                                                         |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                           | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                  |

Beide sluiten af met een niet-nulcode bij elk mislukt scenario. `--allow-failures` schrijft artefacten zonder een falende exitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op een echte privé-Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het beste wanneer beide bots **Bot-to-Bot Communication Mode** ingeschakeld hebben in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerieke chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` bewaart berichtinhoud in artefacten met waargenomen berichten (standaard geredigeerd).

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

Richt zich op een echt privé-Discord-guildkanaal met twee bots: een driverbot die door de harness wordt aangestuurd en een SUT-bot die door de onderliggende OpenClaw-Gateway wordt gestart via de gebundelde Discord-Plugin. Verifieert kanaalvermeldingsafhandeling en dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` bewaart berichtinhoud in artefacten met waargenomen berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Uitvoerartefacten:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Convex-referentiepool

Zowel Telegram- als Discord-lanes kunnen referenties leasen uit een gedeelde Convex-pool in plaats van de env-vars hierboven te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeats die gedurende de uitvoering, en geeft die vrij bij afsluiten. Poolsoorten zijn `"telegram"` en `"discord"`.

Payloadvormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operationele env-vars en het endpointcontract van de Convex-broker staan in [Testen → Gedeelde Telegram-referenties via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Repository-ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testuitvoering en moet het volgende definiëren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- documentatie- en codereferenties
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak dat `qa-flow` ondersteunt mag generiek
en cross-cutting blijven. Markdown-scenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingebedde Control UI aansturen via de
Gateway-`browser.request`-seam, zonder een runner voor speciale gevallen toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op source-tree
map. Houd scenario-id's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en `codeRefs`
voor implementatietraceerbaarheid.

De basislijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- cron-callbacks
- geheugenherinnering
- modelwisseling
- overdracht naar subagent
- repository lezen en documentatie lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mock-lanes

`qa suite` heeft twee lokale provider-mock-lanes:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mock-lane voor repository-ondersteunde QA en parity-gates.
- `aimock` start een door AIMock ondersteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Deze is additief en vervangt de
  `mock-openai`-scenariodispatcher niet.

Provider-lane-implementatie staat onder `extensions/qa-lab/src/providers/`.
Elke provider beheert zijn standaardwaarden, lokale serverstart, Gateway-modelconfiguratie,
stagingbehoeften voor auth-profielen, en live/mock-capabilityvlaggen. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` beheert een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten in dezelfde suite-runner kunnen worden ingeplugd in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de splitsing:

- `qa-lab` beheert generieke scenario-uitvoering, workerconcurrency, artefactschrijven en rapportage.
- De transportadapter beheert Gateway-configuratie, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testuitvoering; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract oefent.

Voeg geen nieuwe top-level QA-opdrachtroot toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de `openclaw qa`-opdrachtroot
- suite-start en -teardown
- workerconcurrency
- artefactschrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-Plugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway wordt geconfigureerd voor dat transport
- hoe gereedheid wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden waargenomen
- hoe transcripts en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde `qa-lab`-host-seam.
3. Houd transportspecifieke mechanica binnen de runner-Plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende rootopdracht te registreren. Runner-Plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende `qaRunnerCliRegistrations`-array exporteren uit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter aparte entrypoints blijven.
5. Auteur of pas markdown-scenario's aan onder de gethematiseerde `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend tenzij de repository een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het in `qa-lab`.
- Als gedrag afhangt van één kanaaltransport, houd het in die runner-Plugin of Plugin-harness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke vertakking in `suite.ts`.
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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te voorkomen, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de waargenomen bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat faalde
- Wat geblokkeerd bleef
- Welke vervolscenario's de moeite waard zijn om toe te voegen

Voor een inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).

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

De opdracht voert lokale onderliggende QA Gateway-processen uit, geen Docker. Character eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten uitvoeren
zoals chat, hulp bij de werkruimte en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. De opdracht bewaart elk volledig
transcript, registreert basisstatistieken van de run en vraagt vervolgens de judge models in fast mode met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de judge-prompt krijgt nog steeds
elk transcript en elke runstatus, maar kandidaat-refs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt de rangschikkingen na het parsen terug aan echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-eval-refs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` blijft
behouden voor compatibiliteit.
OpenAI-kandidaat-refs gebruiken standaard fast mode zodat prioriteitsverwerking wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of judge een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je
fast mode voor elk kandidaatmodel wilt afdwingen. Duur van kandidaat- en judge-runs wordt
in het rapport vastgelegd voor benchmarkanalyse, maar judge-prompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en judge-modelruns gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
belasting een run te ruisgevoelig maken.
Wanneer geen kandidaat `--model` wordt doorgegeven, gebruikt character eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de judges standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde documentatie

- [Matrix QA](/nl/concepts/qa-matrix)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
