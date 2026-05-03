---
read_when:
    - Begrijpen hoe de QA-stack samenhangt
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Repo-ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering rond het Gateway-dashboard bouwen
summary: 'QA-stackoverzicht: qa-lab, qa-channel, door de repo ondersteunde scenario''s, live transportlanes, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-03T21:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalvormige manier te oefenen dan met een enkele unit test kan.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtenkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus om het transcript te observeren,
  inkomende berichten te injecteren en een Markdown-rapport te exporteren.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA
  scenario's.
- [Mantis](/nl/concepts/mantis): liveverificatie voor en na voor bugs die
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig hebben.

## Commando-interface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                           |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                 |
| `qa coverage`                                       | Print de markdown-inventaris voor scenariodekking (`--json` voor machine-uitvoer).                                                                                   |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport.                                                                          |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                             |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                            |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                  |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + de Gateway-lane.                                                                                         |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack, print de URL (alias: `pnpm qa:lab:up`; variant `:fast` voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe). |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                              |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                            |
| `qa matrix`                                         | Live transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix-QA](/nl/concepts/qa-matrix).                                                                  |
| `qa telegram`                                       | Live transport-lane tegen een echte private Telegram-groep.                                                                                                          |
| `qa discord`                                        | Live transport-lane tegen een echt privaat Discord-guildkanaal.                                                                                                      |
| `qa mantis`                                         | Verificatierunner voor en na voor live-transportbugs, met het eerste Discord-statusreactiescenario. Zie [Mantis](/nl/concepts/mantis).                                  |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de Docker-ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, mislukte of
geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder de Docker-image telkens opnieuw te bouwen,
start je de stack met een bind-gemounte QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een vooraf gebouwde image en bind-mount
`extensions/qa-lab/web/dist` in de `qa-lab`-container. `qa:lab:watch`
bouwt die bundel opnieuw bij wijzigingen, en de browser herlaadt automatisch wanneer de QA Lab
asset-hash verandert.

Voor een lokale OpenTelemetry-trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-traceontvanger, voert het
`otel-trace-smoke` QA-scenario uit met de `diagnostics-otel`-plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
model-calls mogen bij geslaagde turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostische
instrumentatie wijzigt.

Voor een transport-echte Matrix-smoke-lane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env vars en artifact-indeling voor deze lane staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver/SUT/observer-gebruikers, voert de echte Matrix-plugin uit binnen een onderliggende QA-Gateway die tot dat transport is beperkt (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

Voor transport-echte Telegram- en Discord-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Beide richten zich op een vooraf bestaand echt kanaal met twee bots (driver + SUT). Vereiste env vars, scenariolijsten, uitvoer-artifacts en de Convex-credentialpool zijn hieronder gedocumenteerd in [Telegram- en Discord-QA-referentie](#telegram-and-discord-qa-reference).

Voer vóór gebruik van gepoolde live credentials uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin/list-bereikbaarheid wanneer het maintainer-secret aanwezig is. Hij rapporteert voor secrets alleen de status gezet/ontbrekend.

## Live transport-dekking

Live transport-lanes delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te bedenken. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live transport-dekkingsmatrix.

| Lane     | Canary | Mention-gating | Bot-naar-bot | Allowlist-blokkade | Top-level antwoord | Herstart hervatten | Thread-follow-up | Thread-isolatie | Reactie-observatie | Help-commando | Registratie van native commando |
| -------- | ------ | -------------- | ------------ | ------------------ | ------------------ | ------------------ | ---------------- | ---------------- | ------------------ | ------------- | ------------------------------- |
| Matrix   | x      | x              | x            | x                  | x                  | x                  | x                | x                | x                  |               |                                 |
| Telegram | x      | x              | x            |                    |                    |                    |                  |                  |                    | x             |                                 |
| Discord  | x      | x              | x            |                    |                    |                    |                  |                  |                    |               | x                               |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live transports één expliciete transportcontract-
checklist delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een verse Multipass-guest, installeert afhankelijkheden, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert daarna het normale QA-rapport en
de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren standaard meerdere geselecteerde scenario's parallel uit
met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het geselecteerde aantal scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
Het commando eindigt met een niet-nul exitcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder falende exitcode.
Live runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de
guest: env-gebaseerde providersleutels, het pad naar de QA-liveproviderconfiguratie en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
via de gemounte workspace kan terugschrijven.

## Telegram- en Discord-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en de Docker-ondersteunde homeserver-provisioning. Telegram en Discord zijn kleiner — een handvol scenario's elk, geen profielsysteem, tegen vooraf bestaande echte kanalen — dus hun referentie staat hier.

### Gedeelde CLI-flags

Beide lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde flags:

| Vlag                                  | Standaard                                                | Beschrijving                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                        | Voer alleen dit scenario uit. Herhaalbaar.                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Waar rapporten/samenvatting/waargenomen berichten en het uitvoerlogboek worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                          | Repository-root wanneer je aanroept vanuit een neutrale cwd.                                                                              |
| `--sut-account <id>`                  | `sut`                                                    | Tijdelijke account-id binnen de QA Gateway-configuratie.                                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                          | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                                                 |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                        | Primaire/alternatieve modelrefs.                                                                                                          |
| `--fast`                              | uit                                                      | Snelle providermodus waar ondersteund.                                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                    | Zie [Convex-pool voor inloggegevens](#convex-credential-pool).                                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                          | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                              |

Beide sluiten af met een niet-nulcode bij een mislukt scenario. `--allow-failures` schrijft artefacten zonder een foutieve exitcode in te stellen.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte private Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

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
- `telegram-qa-observed-messages.json` — inhoud wordt geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privaat Discord-guildkanaal met twee bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw Gateway wordt gestart via de gebundelde Discord Plugin. Verifieert verwerking van kanaalvermeldingen, dat de SUT-bot de native opdracht `/help` bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (de lane faalt anders snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met waargenomen berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis-scenario. Draait zelfstandig omdat het de SUT omschakelt naar altijd-aan, tool-only guildantwoorden met `messages.statusReactions.enabled=true`, en vervolgens een REST-reactietijdlijn plus een HTML/PNG-visueel artefact vastlegt.

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
- `discord-qa-observed-messages.json` — inhoud wordt geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario draait.

### Convex-pool voor inloggegevens

Zowel Telegram- als Discord-lanes kunnen inloggegevens leasen uit een gedeelde Convex-pool in plaats van de bovenstaande env-vars te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeats die gedurende de run, en geeft die vrij bij afsluiten. Poolsoorten zijn `"telegram"` en `"discord"`.

Payloadvormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operationele env-vars en het endpointcontract van de Convex-broker staan in [Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam stamt van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Repository-gesteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testrun en moet definiëren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- docs- en coderefs
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak achter `qa-flow` mag generiek
en cross-cutting blijven. Markdownscenario's kunnen bijvoorbeeld transportzijdige
helpers combineren met browserzijdige helpers die de ingebedde Control UI aansturen via de
Gateway-`browser.request`-seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op source-tree
map. Houd scenario-id's stabiel wanneer bestanden verplaatsen; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van implementatie.

De baselinelijst moet breed genoeg blijven om te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- Cron-callbacks
- geheugenoproep
- modelwisseling
- overdracht aan subagent
- repository-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenariobewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mocklane voor repository-gesteunde QA en pariteitsgates.
- `aimock` start een AIMock-gesteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Deze is additief en vervangt de
  `mock-openai`-scenariodispatcher niet.

De implementatie van providerlanes staat onder `extensions/qa-lab/src/providers/`.
Elke provider beheert zijn defaults, lokale serverstart, Gateway-modelconfiguratie,
auth-profielstagingbehoeften en live/mock-capabilityvlaggen. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te branchen op
providernamen.

## Transportadapters

`qa-lab` beheert een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten in dezelfde suite-runner kunnen inpluggen in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de splitsing:

- `qa-lab` beheert generieke scenario-uitvoering, workerconcurrency, artefactschrijven en rapportage.
- De transportadapter beheert Gateway-configuratie, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract oefent.

Voeg geen nieuwe top-level QA-commandoroot toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de `openclaw qa`-commandoroot
- suite-start en teardown
- workerconcurrency
- artefactschrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-Plugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe gereedheid wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden waargenomen
- hoe transcripties en genormaliseerde transportstatus worden blootgesteld
- hoe transport-gesteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiebalk voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transportrunner op de gedeelde `qa-lab`-hostseam.
3. Houd transportspecifieke mechanica binnen de runner-Plugin of channel-harness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende rootopdracht te registreren. Runner-Plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een bijbehorende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; luie CLI- en runneruitvoering moeten achter aparte entrypoints blijven.
5. Maak of pas markdownscenario's aan onder de thematische `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend tenzij de repository een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het in die runner-Plugin of Plugin-harness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke branch in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd het scenario transportspecifiek en maak dat expliciet in het scenariocontract.

### Namen van scenariohelpers

Voorkeursgenerieke helpers voor nieuwe scenario's:

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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een alles-in-één migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de waargenomen bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke opvolgscenario's het waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's — handig bij het inschatten van opvolgwerk of het aansluiten van een nieuw transport — voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).

Voor teken- en stijlcontroles voer je hetzelfde scenario uit over meerdere live modelreferenties
en schrijf je een beoordeeld Markdown-rapport:

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

De opdracht voert lokale onderliggende QA-Gateway-processen uit, geen Docker. Character-eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten
uitvoeren, zoals chat, hulp bij de werkruimte en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. De opdracht bewaart elk volledig
transcript, legt basisstatistieken van de run vast en vraagt de beoordelingsmodellen vervolgens in fast-modus met
`xhigh`-redenering, waar ondersteund, om de runs te rangschikken op natuurlijkheid, sfeer en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de beoordelingsprompt krijgt nog steeds
elk transcript en elke runstatus, maar kandidaat-referenties worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na het parsen weer terug aan
echte referenties.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evaluatiereferenties die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` blijft
behouden voor compatibiliteit.
OpenAI-kandidaatreferenties gebruiken standaard fast-modus, zodat prioriteitsverwerking wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je
fast-modus voor elk kandidaatmodel wilt afdwingen. Duurmetingen van kandidaat- en beoordelaarsruns worden
in het rapport vastgelegd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Runs van kandidaat- en beoordelingsmodellen gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
belasting een run te ruisachtig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt character eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde documentatie

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA-kanaal](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
