---
read_when:
    - Begrijpen hoe de QA-stack samenhangt
    - Uitbreiden van qa-lab, qa-channel of een transportadapter
    - Repo-ondersteunde QA-scenario's toevoegen
    - Meer realistische QA-automatisering rond het Gateway-dashboard bouwen
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportkanalen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-10T19:34:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalgerichte manier te testen dan met één unittest mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  injecteren van inkomende berichten en exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-Plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de opstarttaak en basis-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): voor- en naverificatie voor bugs waarvoor
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig zijn.

## Commando-interface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`-
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                                                                                                                            |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                                   |
| `qa coverage`                                       | Druk de markdown-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                   |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport.                                                                                                                                                                           |
| `qa character-eval`                                 | Voer het personage-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                              |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider-/model-lane.                                                                                                                                                                                            |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bouw de vooraf gebakken QA-Docker-image.                                                                                                                                                                                                                              |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + Gateway-lane.                                                                                                                                                                                             |
| `qa up`                                             | Bouw de QA-site, start de door Docker ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; de `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                                                                                               |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                                                                                             |
| `qa matrix`                                         | Live transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                                                                                                   |
| `qa telegram`                                       | Live transport-lane tegen een echte private Telegram-groep.                                                                                                                                                                                                           |
| `qa discord`                                        | Live transport-lane tegen een echt privaat Discord-guildkanaal.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport-lane tegen een echt privaat Slack-kanaal.                                                                                                                                                                                                              |
| `qa mantis`                                         | Voor- en naverificatierunner voor live transport-bugs, met Discord-statusreactiebewijs, Crabbox-desktop-/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook). |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer dit uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de door Docker ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een QA-
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte,
mislukte of geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder de Docker-image telkens opnieuw te bouwen,
start je de stack met een via bind mount gekoppelde QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een vooraf gebouwde image en bind-mount
`extensions/qa-lab/web/dist` in de `qa-lab`-container. `qa:lab:watch`
bouwt die bundel opnieuw bij wijzigingen, en de browser herlaadt automatisch wanneer de QA Lab-
assethash verandert.

Voer voor een lokale OpenTelemetry-trace-smoke uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-traceontvanger, voert het
`otel-trace-smoke`-QA-scenario uit met de `diagnostics-otel`-Plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen `StreamAbandoned` niet exporteren bij succesvolle beurten; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten uit de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostische
instrumentatie wijzigt.

Voer voor een transport-echte Matrix-smoke-lane uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env-vars en artifactindeling voor deze lane staan in [Matrix QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver-/SUT-/observer-gebruikers, voert de echte Matrix-Plugin uit binnen een onderliggende QA-Gateway die tot dat transport beperkt is (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unittests niet end-to-end kunnen bewijzen: mention-gating, allow-bot-beleid, allowlists, top-level en threaded antwoorden, DM-routering, reactieafhandeling, onderdrukking van inkomende bewerkingen, deduplicatie van herstart-replay, herstel na homeserver-onderbreking, levering van goedkeuringsmetadata, media-afhandeling en Matrix E2EE-bootstrap-/herstel-/verificatieflows. Het E2EE-CLI-profiel stuurt ook `openclaw matrix encryption setup` en verificatiecommando's door dezelfde wegwerpbare homeserver voordat Gateway-antwoorden worden gecontroleerd.

Discord heeft ook alleen voor Mantis opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete statusreactie-
tijdlijn, of `--scenario discord-thread-reply-filepath-attachment` om een
echte Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten de standaard live Discord-lane
omdat het voor/na-reproductieprobes zijn in plaats van brede smoke-dekking.
De Mantis-workflow voor threadbijlagen kan ook een ingelogde Discord Web-
getuigenvideo toevoegen wanneer `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-
omgeving is geconfigureerd. Dat viewerprofiel is alleen voor visuele vastlegging; de slaag-/faal-
beslissing komt nog steeds van het Discord REST-orakel.

CI gebruikt dezelfde commando-interface in `.github/workflows/qa-live-transports-convex.yml`. Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met live frontier-credentials, `--fast` en `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatig `matrix_profile=all` waaiert uit naar de vijf profielshards zodat de uitputtende catalogus parallel kan draaien terwijl er één artifactdirectory per shard behouden blijft.

Voor transport-echte Telegram-, Discord- en Slack-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Ze richten zich op een bestaand echt kanaal met twee bots (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-credentialpool zijn hieronder gedocumenteerd in [Telegram-, Discord- en Slack-QA-referentie](#telegram-discord-and-slack-qa-reference).

Voor een volledige Slack-desktop-VM-run met VNC-redding voer je uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die opdracht least een Crabbox-desktop/browsermachine, voert het Slack-live-traject
binnen de VM uit, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
wanneer video-opname beschikbaar is terug naar de Mantis-artifactmap. Crabbox-
desktop/browserleases leveren de opnametools en helperpakketten voor browser/native-build
vooraf, dus het scenario zou alleen fallbacks moeten installeren op oudere
leases. Mantis rapporteert totale en per-fase timing in
`mantis-slack-desktop-smoke-report.md`, zodat langzame runs laten zien of de tijd ging naar
lease-opwarming, het verkrijgen van referenties, externe setup of artifactkopie. Hergebruik
`--lease-id <cbx_...>` nadat je handmatig via VNC bent ingelogd bij Slack Web;
hergebruikte leases houden ook Crabbox' pnpm-storecache warm. De standaard
`--hydrate-mode source` verifieert vanuit een source checkout en voert install/build
binnen de VM uit. Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte externe
workspace al `node_modules` en een gebouwde `dist/` heeft; die modus slaat de
dure install/build-stap over en faalt gesloten wanneer de workspace niet gereed is.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-Gateway
binnen de VM draaien op poort `38973`; zonder dit voert de opdracht het normale
bot-naar-bot Slack-QA-traject uit en sluit af na artifactopname.

De operatorchecklist, GitHub-workflowdispatchopdracht, het evidence-commentcontract,
de hydrate-mode-beslissingstabel, timinginterpretatie en stappen voor foutafhandeling
staan in [Mantis Slack Desktop-runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voor een agent/CV-achtige desktoptaak voer je uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least of hergebruikt een Crabbox-desktop/browsermachine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit tegen de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de visionprompt om een gestructureerd JSON-
oordeel en slaagt alleen wanneer het model positief zichtbaar bewijs rapporteert; een
negatief antwoord dat alleen de doeltekst citeert, faalt de assertie.
Gebruik `--vision-mode metadata` voor een rooktest zonder model die de desktop-,
browser-, screenshot- en videopijplijn bewijst zonder een provider voor beeldbegrip
aan te roepen. Opname is een vereist artifact voor `visual-task`; als Crabbox
geen niet-lege `visual-task.mp4` opneemt, faalt de taak zelfs wanneer de visual driver
slaagde. Bij falen behoudt Mantis de lease voor VNC, tenzij de taak al was
geslaagd en `--keep-lease` niet was ingesteld.

Voer vóór het gebruik van gepoolde live-referenties uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert Convex-broker-env, valideert endpointinstellingen en verifieert admin/list-bereikbaarheid wanneer het maintainergeheim aanwezig is. Hij rapporteert alleen ingesteld/ontbrekend-status voor geheimen.

## Live-transportdekking

Live-transporttrajecten delen één contract in plaats van elk hun eigen scenariolijstvorm te verzinnen. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

| Traject  | Canary | Vermeldingsgating | Bot-naar-bot | Allowlist-blokkade | Topniveau-antwoord | Hervatten na herstart | Thread-follow-up | Thread-isolatie | Reactie-observatie | Helpopdracht | Registratie van native opdracht |
| -------- | ------ | ----------------- | ------------ | ------------------ | ------------------ | --------------------- | ---------------- | --------------- | ------------------ | ------------ | ------------------------------- |
| Matrix   | x      | x                 | x            | x                  | x                  | x                     | x                | x               | x                  |              |                                 |
| Telegram | x      | x                 | x            |                    |                    |                       |                  |                 |                    | x            |                                 |
| Discord  | x      | x                 | x            |                    |                    |                       |                  |                 |                    |              | x                               |
| Slack    | x      | x                 | x            | x                  | x                  | x                     | x                | x               |                    |              |                                 |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live-transporten één expliciete transportcontract-
checklist delen.

Voor een wegwerpbaar Linux-VM-traject zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een verse Multipass-gast, installeert afhankelijkheden, bouwt OpenClaw
binnen de gast, voert `qa suite` uit en kopieert daarna het normale QA-rapport en
de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren standaard meerdere geselecteerde scenario's parallel uit
met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
De opdracht sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder falende exitcode.
Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de
gast: env-gebaseerde providersleutels, het QA-live-providerconfiguratiepad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de gast
kan terugschrijven via de gemounte workspace.

## Telegram-, Discord- en Slack-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-ondersteunde homeserverprovisioning. Telegram, Discord en Slack zijn kleiner - elk een handvol scenario's, geen profielsysteem, tegen vooraf bestaande echte kanalen - dus hun referentie staat hier.

### Gedeelde CLI-flags

Deze trajecten registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde flags:

| Flag                                  | Standaard                                                       | Beschrijving                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Voer alleen dit scenario uit. Herhaalbaar.                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/geobserveerde berichten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-root bij aanroep vanuit een neutrale cwd.                                                                 |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijke account-id binnen de QA-Gatewayconfiguratie.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                            |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                               | Primaire/alternatieve modelrefs.                                                                                     |
| `--fast`                              | uit                                                             | Snelle providermodus waar ondersteund.                                                                               |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex-referentiepool](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                         |

Elk traject sluit af met een niet-nulcode bij een mislukt scenario. `--allow-failures` schrijft artifacts zonder een falende exitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte privé-Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** ingeschakeld hebben in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerieke chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behoudt berichtinhoud in geobserveerde-berichtenartifacts (standaard geredigeerd).

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

De impliciete standaardset dekt altijd canary, vermeldingsgating, native opdrachtantwoorden, opdrachtadressering en bot-naar-bot-groepsantwoorden. `mock-openai`-standaarden bevatten ook deterministische reply-chain- en final-message-streamingcontroles. `telegram-current-session-status-tool` blijft opt-in omdat deze alleen stabiel is wanneer hij direct na canary wordt gethread, niet na willekeurige native opdrachtantwoorden. Gebruik `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` om de huidige standaard/optioneel-verdeling met regressierefs af te drukken.

Uitvoerartifacts:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - bevat RTT per antwoord (driververzending → geobserveerd SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privé-Discord-guildkanaal met twee bots: een driverbot die door de harness wordt beheerd en een SUT-bot die door de child-OpenClaw-Gateway wordt gestart via de gebundelde Discord-Plugin. Verifieert verwerking van kanaalvermeldingen, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt teruggegeven (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` bewaart berichtinhoud in artefacten met waargenomen berichten.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het voice-/stage-kanaal voor `discord-voice-autojoin`; zonder deze variabele kiest het scenario het eerste zichtbare voice-/stage-kanaal voor de SUT-bot.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in voice-scenario. Draait afzonderlijk, schakelt `channels.discord.voice.autoJoin` in en verifieert dat de huidige Discord-voice-status van de SUT-bot het doel-voice-/stage-kanaal is. Convex Discord-referenties kunnen een optionele `voiceChannelId` bevatten; anders ontdekt de runner het eerste zichtbare voice-/stage-kanaal in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait afzonderlijk omdat het de SUT omschakelt naar altijd-aan, alleen-tool-guildantwoorden met `messages.statusReactions.enabled=true`, en vervolgens een REST-reactietijdlijn plus HTML-/PNG-visuele artefacten vastlegt. Mantis-rapporten voor/na bewaren ook door het scenario geleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

Voer het Discord-scenario voor automatisch deelnemen aan voice expliciet uit:

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
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Uitvoerartefacten:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - inhoud wordt geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario draait.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee verschillende bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de onderliggende OpenClaw Gateway via de meegeleverde Slack Plugin wordt gestart.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` bewaart berichtinhoud in artefacten met waargenomen berichten.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Uitvoerartefacten:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - inhoud wordt geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### De Slack-werkruimte instellen

De lane heeft twee verschillende Slack-apps in één werkruimte nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een toegewezen kanaal; de lane plaatst bij elke run berichten.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een afzonderlijke Slack-app van de driver moet zijn zodat de botgebruikers-id anders is.
- `sutAppToken` - token op appniveau (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app gebeurtenissen kan ontvangen.

Gebruik bij voorkeur een Slack-werkruimte die aan QA is toegewezen in plaats van een productiewerkruimte te hergebruiken.

Het onderstaande SUT-manifest beperkt de productie-installatie van de meegeleverde Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) bewust tot de machtigingen en gebeurtenissen die door de live Slack-QA-suite worden afgedekt. Zie [Slack-kanaal snel instellen](/nl/channels/slack#quick-setup) voor de setup van het productiekanaal zoals gebruikers die zien; het QA Driver/SUT-paar is bewust afzonderlijk omdat de lane twee verschillende botgebruikers-id's in één werkruimte nodig heeft.

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

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) - dat wordt `driverBotToken`. De driver hoeft alleen berichten te plaatsen en zichzelf te identificeren; geen gebeurtenissen, geen Socket Mode.

**2. Maak de SUT-app**

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app gebruikt bewust een smallere versie van het productiemanifest van de meegeleverde Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): reactiescopes en -gebeurtenissen zijn weggelaten omdat de live Slack-QA-suite reactieafhandeling nog niet afdekt.

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

Verifieer dat de twee bots verschillende gebruikers-id's hebben door `auth.test` op elk token aan te roepen. De runtime onderscheidt driver en SUT op gebruikers-id; één app voor beide hergebruiken laat mention-gating onmiddellijk falen.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal (bijv. `#openclaw-qa`) en nodig beide bots vanuit het kanaal uit:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de `Cxxxxxxxxxx`-id uit _channel info → About → Channel ID_ - dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-lezingen van de harness blijven slagen.

**4. Registreer de referenties**

Twee opties. Gebruik env-vars voor foutopsporing op één machine (stel de vier `OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` door), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

Schrijf voor de Convex-pool de vier velden naar een JSON-bestand:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in je shell registreer en verifieer je:

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

Een groene run is ruim binnen 30 seconden klaar en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleased - `qa credentials list --kind slack --status all --json` vertelt je welke situatie geldt.

### Convex-referentiepool

Telegram-, Discord-, Slack- en WhatsApp-lanes kunnen referenties leasen uit een gedeelde Convex-pool in plaats van de env-vars hierboven te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt deze gedurende de run en geeft deze vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"`, `"slack"` en `"whatsapp"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-string zijn.
- Telegram echte gebruiker (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - één exclusieve burner-accountlease die zowel door de TDLib CLI-driver als de visuele getuige van Telegram Desktop wordt gebruikt.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefoonnummers moeten verschillende E.164-strings zijn.

Gebruik voor visueel Telegram-bewijs met echte gebruiker bij voorkeur een vastgehouden Crabbox-sessie:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` houdt één exclusieve Convex `telegram-user`-lease vast voor zowel de TDLib CLI
driver als de Telegram Desktop-getuige, start desktopopname en laat de
Crabbox in leven voor willekeurige door agenten aangestuurde repro-stappen. Agenten kunnen `send`,
`run`, `screenshot` en `status` gebruiken totdat ze tevreden zijn; daarna verzamelt `finish`
de screenshot, video, beweging-bijgesneden video/GIF, TDLib-probe-uitvoer
en logs voordat de referentie wordt vrijgegeven. `publish --session <file> --pr
<number>` plaatst standaard alleen de bewegings-GIF als commentaar; `--full-artifacts` is de
expliciete opt-in voor logs en JSON-uitvoer. De standaardopdracht `probe` blijft een
één-opdrachtsteno voor snelle `/status`-smokechecks.

Gebruik `--mock-response-file <path>` wanneer een PR een deterministische visuele diff nodig heeft:
hetzelfde mockmodelantwoord kan worden uitgevoerd op `main` en op de PR-head terwijl de
Telegram-formatter of afleverlaag wijzigt. De standaardwaarden voor opnames zijn afgestemd op PR-
opmerkingen: standaard Crabbox-klasse, desktopopname met 24 fps, bewegings-GIF met 24 fps en
voorbeeldbreedte van 1920 px. Voor/na-opmerkingen moeten een nette bundel publiceren die
alleen de bedoelde GIF's bevat.

Slack-lanes kunnen ook de pool gebruiken. Controles op de vorm van Slack-payloads staan momenteel in de Slack QA-runner in plaats van in de broker; gebruik `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, met een Slack-kanaal-id zoals `Cxxxxxxxxxx`. Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env vars en het Convex-brokerendpointcontract staan in [Testen → Gedeelde Telegram-referenties via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór de pool voor meerdere kanalen; de leasesemantiek wordt gedeeld tussen soorten).

## Repo-ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testrun en moet het volgende definiëren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- docs- en codeverwijzingen
- optionele Plugin-vereisten
- optionele Gateway-configpatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak dat `qa-flow` ondersteunt, mag generiek
en cross-cutting blijven. Markdown-scenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingesloten Control-UI aansturen via de
Gateway-`browser.request`-seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op broncodeboommap.
Houd scenario-ID's stabiel wanneer bestanden verplaatsen; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van de implementatie.

De baseline-lijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- cron-callbacks
- memory-recall
- modelwisseling
- overdracht aan subagent
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Dit blijft de standaard
  deterministische mocklane voor repo-ondersteunde QA en parity-gates.
- `aimock` start een provider-server met AIMock-backend voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Dit is aanvullend en vervangt de
  `mock-openai`-scenariodispatcher niet.

De implementatie van provider-lanes staat onder `extensions/qa-lab/src/providers/`.
Elke provider is eigenaar van zijn standaardwaarden, lokale serverstart, Gateway-modelconfig,
stagingbehoeften voor auth-profielen en live/mock-capabilityflags. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` bezit een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten in dezelfde suite-runner kunnen worden ingeplugd in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de verdeling:

- `qa-lab` bezit generieke scenario-uitvoering, worker-concurrency, artifact-schrijven en rapportage.
- De transportadapter bezit Gateway-config, readiness, inbound en outbound observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract test.

Voeg geen nieuwe top-level QA-command root toe wanneer de gedeelde `qa-lab`-host de flow kan bezitten.

`qa-lab` bezit de gedeelde hostmechanica:

- de `openclaw qa`-command root
- suite-start en teardown
- worker-concurrency
- artifact-schrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins bezitten het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe readiness wordt gecontroleerd
- hoe inbound events worden geïnjecteerd
- hoe outbound berichten worden geobserveerd
- hoe transcripten en genormaliseerde transportstatus worden blootgesteld
- hoe transport-backed acties worden uitgevoerd
- hoe transportspecifieke reset of cleanup wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transportrunner op de gedeelde `qa-lab`-host-seam.
3. Houd transportspecifieke mechanica binnen de runner-plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende root-command te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; luie CLI- en runner-uitvoering moeten achter afzonderlijke entrypoints blijven.
5. Schrijf of pas markdown-scenario's aan onder de thematische `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend tenzij de repo een opzettelijke migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-plugin of pluginharness.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke vertakking in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd het scenario dan transportspecifiek en maak dat expliciet in het scenariocontract.

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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat faalde
- Wat geblokkeerd bleef
- Welke vervolgschema's het toevoegen waard zijn

Voor de inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare output).

Voor teken- en stijlcontroles voer je hetzelfde scenario uit over meerdere live model-
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

De command voert lokale QA-Gateway-childprocessen uit, geen Docker. Character-eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone user turns
uitvoeren, zoals chat, hulp in de workspace en kleine bestandstaken. Het kandidaatmodel mag
niet worden verteld dat het wordt geëvalueerd. De command bewaart elk volledig
transcript, registreert basisrunstatistieken en vraagt daarna de beoordelingsmodellen in fast mode met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` bij het vergelijken van providers: de beoordelingsprompt krijgt nog steeds
elk transcript en elke runstatus, maar kandidaatreferenties worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt rankings na parsing weer terug aan echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
voor compatibiliteit behouden.
OpenAI-kandidaatreferenties gebruiken standaard fast mode zodat priority processing wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een override nodig heeft. Geef `--fast` alleen door wanneer je
fast mode voor elk kandidaatmodel wilt afdwingen. Duurmetingen van kandidaat- en beoordelingsruns worden
in het rapport geregistreerd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en beoordelingsmodelruns gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
druk een run te rumoerig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt de character-eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt doorgegeven.
Wanneer geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde docs

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA-kanaal](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
