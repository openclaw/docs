---
read_when:
    - Inzicht in hoe de QA-stack samenhangt
    - Uitbreiden van qa-lab, qa-channel of een transportadapter
    - Repo-ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering rond het Gateway-dashboard bouwen
summary: 'QA-stackoverzicht: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportlanen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-07T13:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischere,
kanaalvormige manier te testen dan een enkele unit test kan.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerken en verwijderen.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van inkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): live verificatie vóór en na voor bugs die
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig hebben.

## Command surface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
script-aliassen; beide vormen worden ondersteund.

| Opdracht                                            | Doel                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-selfcheck; schrijft een Markdown-rapport.                                                                                                                                                                                                                |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                                    |
| `qa coverage`                                       | Druk de markdown-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                    |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentic pariteitsrapport.                                                                                                                                                                                |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                                |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                                                                                               |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                                                                                                                  |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + gateway-lane.                                                                                                                                                                                               |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack en druk de URL af (alias: `pnpm qa:lab:up`; de `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                  |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                                                                                                |
| `qa mock-openai`                                    | Start alleen de scenario-bewuste `mock-openai`-provider-server.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-referentiepool.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Live transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                                                                                                    |
| `qa telegram`                                       | Live transport-lane tegen een echte private Telegram-groep.                                                                                                                                                                                                            |
| `qa discord`                                        | Live transport-lane tegen een echt privaat Discord-guildkanaal.                                                                                                                                                                                                        |
| `qa slack`                                          | Live transport-lane tegen een echt privaat Slack-kanaal.                                                                                                                                                                                                               |
| `qa mantis`                                         | Verificatierunner vóór en na voor live transport-bugs, met Discord-statusreactie-bewijs, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook). |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de Docker-ondersteunde gateway-lane en maakt de
QA Lab-pagina beschikbaar waar een operator of automatiseringslus de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, faalde of
geblokkeerd bleef.

Voor snellere iteratie op de QA Lab-UI zonder telkens de Docker-image opnieuw te bouwen,
start je de stack met een bind-gemounte QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een voorgebouwde image en bind-mount
`extensions/qa-lab/web/dist` in de `qa-lab`-container. `qa:lab:watch`
bouwt die bundel opnieuw bij wijzigingen, en de browser herlaadt automatisch wanneer de QA Lab-
asset-hash verandert.

Voor een lokale OpenTelemetry trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-traceontvanger, voert het
`otel-trace-smoke` QA-scenario uit met de `diagnostics-otel`-Plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en assert de release-kritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen `StreamAbandoned` niet exporteren bij geslaagde beurten; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten uit de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-opdrachten uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostics-
instrumentatie wijzigt.

Voor een transport-echte Matrix-smoke-lane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel/scenariocatalogus, env-vars en artifactindeling voor deze lane staan in [Matrix QA](/nl/concepts/qa-matrix). In het kort: het voorziet een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver/SUT/observer-gebruikers, voert de echte Matrix-Plugin uit binnen een onderliggende QA-gateway die is beperkt tot dat transport (geen `qa-channel`), en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unit tests niet end-to-end kunnen bewijzen: mention-gating, allow-bot-beleid, allowlists, top-level en threaded replies, DM-routing, reactieafhandeling, suppressie van inkomende edits, replay-deduplicatie na herstart, herstel na homeserver-onderbreking, levering van approval-metadata, media-afhandeling en Matrix E2EE-bootstrap/herstel/verificatieflows. Het E2EE-CLI-profiel stuurt ook `openclaw matrix encryption setup` en verificatieopdrachten door dezelfde wegwerpbare homeserver voordat gateway-antwoorden worden gecontroleerd.

Discord heeft ook Mantis-only opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete statusreactie-
tijdlijn, of `--scenario discord-thread-reply-filepath-attachment` om een
echte Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten de standaard live Discord-lane
omdat ze vóór/na-reprobes zijn in plaats van brede smoke-dekking.
De Mantis-workflow voor thread-bijlagen kan ook een ingelogde Discord Web-
getuigenvideo toevoegen wanneer `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` is geconfigureerd in de QA-
omgeving. Dat viewer-profiel is alleen voor visuele capture; de pass/fail-
beslissing komt nog steeds van de Discord REST-oracle.

CI gebruikt hetzelfde command surface in `.github/workflows/qa-live-transports-convex.yml`. Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met live frontier-referenties, `--fast` en `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatig `matrix_profile=all` waaiert uit over de vijf profielshards zodat de uitputtende catalogus parallel kan draaien terwijl er één artifactmap per shard blijft.

Voor transport-echte Telegram-, Discord- en Slack-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots (driver + SUT). Vereiste env-vars, scenariolijsten, uitvoerartifacts en de Convex-referentiepool zijn gedocumenteerd in [Telegram-, Discord- en Slack-QA-referentie](#telegram-discord-and-slack-qa-reference) hieronder.

Voor een volledige Slack desktop-VM-run met VNC-redding voer je uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die opdracht least een Crabbox desktop-/browsermachine, voert de Slack live-lane
binnen de VM uit, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
wanneer video-opname beschikbaar is terug naar de Mantis-artifactdirectory. Crabbox
desktop-/browserleases leveren de opnametools en browser-/native-build-helperpakketten
vooraf, zodat het scenario alleen fallbacks zou moeten installeren op oudere
leases. Mantis rapporteert totale timings en timings per fase in
`mantis-slack-desktop-smoke-report.md`, zodat langzame runs laten zien of de tijd ging naar
lease-opwarming, credentialverwerving, remote-setup of artifactkopie. Hergebruik
`--lease-id <cbx_...>` nadat je handmatig via VNC bent ingelogd bij Slack Web;
hergebruikte leases houden ook Crabbox' pnpm-storecache warm. De standaardwaarde
`--hydrate-mode source` verifieert vanuit een source-checkout en voert install/build
binnen de VM uit. Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte remote
workspace al `node_modules` en een gebouwde `dist/` heeft; die modus slaat de
dure install/build-stap over en faalt gesloten wanneer de workspace niet gereed is.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack gateway
binnen de VM draaien op poort `38973`; zonder deze optie voert de opdracht de normale
bot-naar-bot Slack QA-lane uit en sluit af na het vastleggen van artifacts.

De operatorchecklist, GitHub workflow-dispatchopdracht, het contract voor bewijscomments,
de hydrate-mode-beslissingstabel, timinginterpretatie en stappen voor foutafhandeling
staan in [Mantis Slack Desktop-runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voor een desktoptaak in agent-/CV-stijl voer je uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least of hergebruikt een Crabbox desktop-/browsermachine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit op de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een gestructureerd JSON-oordeel
en slaagt alleen wanneer het model positief zichtbaar bewijs rapporteert; een
negatieve reactie die alleen de doeltekst citeert faalt de assertie.
Gebruik `--vision-mode metadata` voor een no-model smoke die de desktop,
browser, screenshot en videoplumbing bewijst zonder een image-understanding
provider aan te roepen. Opname is een vereist artifact voor `visual-task`; als Crabbox
geen niet-lege `visual-task.mp4` opneemt, faalt de taak zelfs wanneer de visuele driver
is geslaagd. Bij een fout behoudt Mantis de lease voor VNC, tenzij de taak al
was geslaagd en `--keep-lease` niet was ingesteld.

Voer vóór gebruik van gepoolde live credentials uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex broker-env, valideert endpointinstellingen en verifieert admin-/lijstbereikbaarheid wanneer het maintainergeheim aanwezig is. Hij rapporteert voor geheimen alleen de status ingesteld/ontbrekend.

## Live transport-dekking

Live transport-lanes delen één contract in plaats van elk hun eigen scenariolijstvorm uit te vinden. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live transport-dekkingsmatrix.

| Lane     | Canary | Vermeldingsgating | Bot-naar-bot | Allowlist-blokkering | Antwoord op topniveau | Hervatten na herstart | Thread-vervolg | Thread-isolatie | Reactie-observatie | Help-opdracht | Native opdrachtregistratie |
| -------- | ------ | ----------------- | ------------ | -------------------- | --------------------- | --------------------- | -------------- | ---------------- | ------------------ | ------------- | -------------------------- |
| Matrix   | x      | x                 | x            | x                    | x                     | x                     | x              | x                | x                  |               |                            |
| Telegram | x      | x                 | x            |                      |                       |                       |                |                  |                    | x             |                            |
| Discord  | x      | x                 | x            |                      |                       |                       |                |                  |                    |               | x                          |
| Slack    | x      | x                 | x            | x                    | x                     | x                     | x              | x                |                    |               |                            |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live transports één expliciete checklist voor het transportcontract
delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een verse Multipass-guest, installeert dependencies, bouwt OpenClaw
binnen de guest, voert `qa suite` uit en kopieert daarna het normale QA-rapport en de
samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren meerdere geselecteerde scenario's standaard parallel uit
met geïsoleerde gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
De opdracht sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder een falende exitcode.
Live runs forwarden de ondersteunde QA-authinputs die praktisch zijn voor de
guest: env-gebaseerde providerkeys, het QA live provider-configpad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
terug kan schrijven via de gemounte workspace.

## Telegram-, Discord- en Slack QA-referentie

Matrix heeft een [aparte pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-backed homeserver-provisioning. Telegram, Discord en Slack zijn kleiner - elk een handvol scenario's, geen profilesysteem, tegen vooraf bestaande echte kanalen - dus hun referentie staat hier.

### Gedeelde CLI-flags

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde flags:

| Flag                                  | Standaard                                                       | Beschrijving                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Voer alleen dit scenario uit. Herhaalbaar.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/geobserveerde berichten en de outputlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijk account-id binnen de QA gateway-config.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                             |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                               | Primaire/alternatieve modelrefs.                                                                                      |
| `--fast`                              | uit                                                             | Provider fast mode waar ondersteund.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex credentialpool](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                          |

Elke lane sluit af met een niet-nulcode bij een mislukt scenario. `--allow-failures` schrijft artifacts zonder een falende exitcode in te stellen.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte private Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-botobservatie werkt het beste wanneer beide bots **Bot-to-Bot Communication Mode** ingeschakeld hebben in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerieke chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behoudt berichtinhouden in observed-message artifacts (standaard geredigeerd).

Scenario's (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Outputartifacts:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - bevat RTT per antwoord (driver verzendt → geobserveerd SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privaat Discord-guildkanaal met twee bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw gateway wordt gestart via de meegeleverde Discord Plugin. Verifieert afhandeling van kanaalvermeldingen, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhouden in observed-message artifacts.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het voice-/stage-kanaal voor `discord-voice-autojoin`; zonder deze optie kiest het scenario het eerste zichtbare voice-/stage-kanaal voor de SUT-bot.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in spraakscenario. Draait zelfstandig, schakelt `channels.discord.voice.autoJoin` in en verifieert dat de huidige Discord-spraakstatus van de SUT-bot het doelspraak-/stagekanaal is. Convex Discord-inloggegevens kunnen optioneel `voiceChannelId` bevatten; anders ontdekt de runner het eerste zichtbare spraak-/stagekanaal in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait zelfstandig omdat het de SUT overschakelt naar altijd ingeschakelde, alleen-tool-guildantwoorden met `messages.statusReactions.enabled=true`, en daarna een REST-reactietijdlijn plus HTML/PNG-visuele artefacten vastlegt. Mantis-rapporten voor/na behouden ook door het scenario geleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

Voer het Discord-scenario voor automatisch toetreden tot spraak expliciet uit:

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
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario wordt uitgevoerd.

### Slack QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee afzonderlijke bots: een driverbot die door de harness wordt aangestuurd en een SUT-bot die door de child OpenClaw Gateway wordt gestart via de gebundelde Slack-Plugin.

Vereiste env bij `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met waargenomen berichten.

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

#### De Slack-workspace instellen

De baan heeft twee afzonderlijke Slack-apps in één workspace nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een speciaal kanaal; de baan post bij elke uitvoering.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een afzonderlijke Slack-app moet zijn ten opzichte van de driver zodat de botgebruiker-id verschillend is.
- `sutAppToken` - appniveau-token (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app events kan ontvangen.

Gebruik bij voorkeur een Slack-workspace die aan QA is gewijd in plaats van een productieworkspace te hergebruiken.

Het onderstaande SUT-manifest beperkt de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`) opzettelijk tot de machtigingen en events die door de live Slack QA-suite worden afgedekt. Zie [Snelle Slack-kanaalinstelling](/nl/channels/slack#quick-setup) voor de productiekanaalinstelling zoals gebruikers die zien; het QA Driver/SUT-paar is opzettelijk apart omdat de baan twee verschillende botgebruiker-id's in één workspace nodig heeft.

**1. Maak de Driver-app**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → kies de QA-workspace, plak het volgende manifest en kies daarna _Install to Workspace_:

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

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) - dat wordt `driverBotToken`. De driver hoeft alleen berichten te posten en zichzelf te identificeren; geen events, geen Socket Mode.

**2. Maak de SUT-app**

Herhaal _Create New App → From a manifest_ in dezelfde workspace. Deze QA-app gebruikt opzettelijk een smallere versie van het productiemanifest van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`): reactiemachtigingen en events zijn weggelaten omdat de live Slack QA-suite reactieafhandeling nog niet afdekt.

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de `xapp-...`-waarde → dat wordt `sutAppToken`.

Verifieer dat de twee bots verschillende gebruiker-id's hebben door `auth.test` op elk token aan te roepen. De runtime onderscheidt driver en SUT op gebruiker-id; één app voor beide hergebruiken laat mention-gating meteen mislukken.

**3. Maak het kanaal**

Maak in de QA-workspace een kanaal (bijv. `#openclaw-qa`) en nodig beide bots uit vanuit het kanaal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de `Cxxxxxxxxxx`-id uit _channel info → About → Channel ID_ - dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, waardoor de geschiedenislezingen van de harness nog steeds slagen.

**4. Registreer de inloggegevens**

Twee opties. Gebruik env-vars voor debugging op één machine (stel de vier `OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` mee), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

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

Verwacht `count: 1`, `status: "active"`, geen `lease`-veld.

**5. Verifieer end-to-end**

Voer de baan lokaal uit om te bevestigen dat beide bots via de broker met elkaar kunnen praten:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Een geslaagde uitvoering is ruim binnen 30 seconden voltooid en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de baan ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleaset - `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### Convex-inloggegevenspool

Telegram-, Discord- en Slack-banen kunnen inloggegevens leasen uit een gedeelde Convex-pool in plaats van de bovenstaande env-vars te lezen. Geef `--credential-source convex` mee (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de uitvoering en geeft die vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"` en `"slack"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` moet overeenkomen met `^[A-Z][A-Z0-9]+$` (een Slack-id zoals `Cxxxxxxxxxx`). Zie [De Slack-workspace instellen](#setting-up-the-slack-workspace) voor het provisionen van apps en scopes.

Operationele env-vars en het contract van het Convex-brokerendpoint staan in [Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Repo-ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan opzettelijk in git zodat het QA-plan zichtbaar is voor zowel mensen als de agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is de bron van waarheid voor één testuitvoering en moet het volgende definiëren:

- scenariometadata
- optionele metadata voor categorie, capability, baan en risico
- docs- en codeverwijzingen
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak dat `qa-flow` ondersteunt, mag generiek en cross-cutting blijven. Markdown-scenario's kunnen bijvoorbeeld transport-side helpers combineren met browser-side helpers die de ingesloten Control UI aansturen via de Gateway-`browser.request`-seam, zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op source tree-map. Houd scenario-id's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en `codeRefs` voor traceerbaarheid van de implementatie.

De baselinelijst moet breed genoeg blijven om het volgende af te dekken:

- DM- en kanaalchat
- thread-gedrag
- lifecycle van berichtacties
- Cron-callbacks
- geheugenherinnering
- modelwissel
- overdracht naar subagent
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Mockbanen voor providers

`qa suite` heeft twee lokale mockbanen voor providers:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Die blijft de standaard deterministische mockbaan voor repo-ondersteunde QA en parity gates.
- `aimock` start een door AIMock ondersteunde provider-server voor experimentele protocol-, fixture-, record/replay- en chaosdekking. Dit is additief en vervangt de `mock-openai`-scenariodispatcher niet.

De implementatie van providerbanen staat onder `extensions/qa-lab/src/providers/`. Elke provider beheert zijn eigen standaardwaarden, lokale serveropstart, Gateway-modelconfiguratie, stagingbehoeften voor auth-profielen en live/mock-capability-vlaggen. Gedeelde suite- en Gateway-code moet via de providerregistry routeren in plaats van te branchen op providernamen.

## Transportadapters

`qa-lab` beheert een generiek transportkoppelvlak voor Markdown-QA-scenario's. `qa-channel` is de eerste adapter op dat koppelvlak, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten op dezelfde suiterunner aansluiten in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de scheiding:

- `qa-lab` beheert generieke scenario-uitvoering, worker-concurrency, het schrijven van artefacten en rapportage.
- De transportadapter beheert Gateway-configuratie, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het Markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract test.

Voeg geen nieuwe QA-hoofdcommando-root toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de `openclaw qa`-commando-root
- het starten en afsluiten van suites
- worker-concurrency
- het schrijven van artefacten
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
- hoe transportondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptielat voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transportrunner op het gedeelde `qa-lab`-hostkoppelvlak.
3. Houd transportspecifieke mechanica binnen de runner-plugin of kanaalharness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerend rootcommando te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een bijpassende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter afzonderlijke entrypoints blijven.
5. Schrijf of pas Markdown-scenario's aan onder de thematische `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-plugin of plugin-harness.
- Als een scenario een nieuwe mogelijkheid nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke branch in `suite.ts`.
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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bus-tijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgsccenario's het waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).

Voor karakter- en stijlcontroles voer je hetzelfde scenario uit op meerdere live model
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

De opdracht voert lokale QA-Gateway-childprocessen uit, geen Docker. Character-eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten
uitvoeren, zoals chat, workspace-hulp en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. De opdracht bewaart elke volledige
transcriptie, registreert basale runstatistieken en vraagt daarna de beoordelingsmodellen in snelle modus met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, sfeer en humor.
Gebruik `--blind-judge-models` bij het vergelijken van providers: de beoordelingsprompt krijgt nog steeds
elke transcriptie en runstatus, maar kandidaatrefs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na het parsen weer terug aan
echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
behouden voor compatibiliteit.
OpenAI-kandidaatrefs gebruiken standaard snelle modus, zodat priority processing wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een override nodig heeft. Geef `--fast` alleen door wanneer je
snelle modus voor elk kandidaatmodel wilt forceren. Duur van kandidaten en beoordelaars wordt
in het rapport vastgelegd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en beoordelingsmodelruns gebruiken allebei standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
druk een run te ruisachtig maken.
Wanneer geen kandidaat-`--model` wordt meegegeven, gebruikt character eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt meegegeven.
Wanneer geen `--judge-model` wordt meegegeven, zijn de standaardbeoordelaars
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde documentatie

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
