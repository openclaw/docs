---
read_when:
    - Inzicht in hoe de QA-stack samenhangt
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Repositorygebaseerde kwaliteitsborgingsscenario's toevoegen
    - QA-automatisering met hogere realiteitsgetrouwheid bouwen rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live-transportlanes, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-06T09:10:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischere,
kanaalvormige manier te testen dan met één unit-test mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerken en verwijderen.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  injecteren van inkomende berichten en exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA
  scenario's.
- [Mantis](/nl/concepts/mantis): live-verificatie voor en na bugs die
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig hebben.

## Commandosurface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                                                                                                                               |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                                                                                                     |
| `qa coverage`                                       | Druk de markdown-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                                                                                                     |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentic pariteitsrapport.                                                                                                                                                                                 |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                                 |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                                                                                                 |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                      |
| `qa docker-build-image`                             | Bouw de vooraf gebakken QA-Docker-image.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + de gateway-lane.                                                                                                                                                                                             |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; variant `:fast` voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                         |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                                                                                                |
| `qa matrix`                                         | Live transport-lane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix-QA](/nl/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport-lane tegen een echte private Telegram-groep.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport-lane tegen een echt privékanaal in een Discord-guild.                                                                                                                                                                                                     |
| `qa slack`                                          | Live transport-lane tegen een echt privékanaal in Slack.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Verificatierunner voor en na live transport-bugs, met bewijs via Discord-statusreacties, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop-runbook](/nl/concepts/mantis-slack-desktop-runbook).                 |

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
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, faalde of
geblokkeerd bleef.

Voor snellere QA Lab UI-iteratie zonder telkens de Docker-image opnieuw te bouwen,
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
asset-hash wijzigt.

Voer voor een lokale OpenTelemetry trace-smoke uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-trace-ontvanger, voert het
`otel-trace-smoke`-QA-scenario uit met de `diagnostics-otel`-plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de release-kritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten uit de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artefacten.

Observability-QA blijft alleen voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostische
instrumentatie wijzigt.

Voer voor een transport-echte Matrix-smoke-lane uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env vars en artefactindeling voor deze lane staan in [Matrix-QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver-/SUT-/observer-gebruikers, voert de echte Matrix-plugin uit binnen een onderliggende QA-gateway die tot dat transport is beperkt (geen `qa-channel`), en schrijft vervolgens een Markdown-rapport, JSON-samenvatting, artefact met geobserveerde events en gecombineerde uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

De scenario's dekken transportgedrag dat unit-tests niet end-to-end kunnen bewijzen: mention-gating, allow-bot-beleid, allowlists, top-level en threaded replies, DM-routing, reactieafhandeling, onderdrukking van inkomende bewerkingen, dedupe van replay na herstart, herstel na homeserver-onderbreking, levering van approval-metadata, media-afhandeling en Matrix E2EE-bootstrap-/herstel-/verificatieflows. Het E2EE-CLI-profiel voert ook `openclaw matrix encryption setup` en verificatiecommando's uit via dezelfde wegwerpbare homeserver voordat gateway-antwoorden worden gecontroleerd.

Discord heeft ook Mantis-only opt-in-scenario's voor bugreproductie. Gebruik
`--scenario discord-status-reactions-tool-only` voor de expliciete tijdlijn met statusreacties,
of `--scenario discord-thread-reply-filepath-attachment` om een
echte Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten de standaard live Discord-lane
omdat het voor/na-reprobes zijn in plaats van brede smoke-dekking.
De Mantis-workflow voor thread-bijlagen kan ook een ingelogde Discord Web-
getuigevideo toevoegen wanneer `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-
omgeving is geconfigureerd. Dat viewerprofiel is alleen voor visuele opname; de pass/fail-
beslissing komt nog steeds van de Discord REST-oracle.

CI gebruikt dezelfde commandosurface in `.github/workflows/qa-live-transports-convex.yml`. Geplande en standaard handmatige runs voeren het snelle Matrix-profiel uit met live frontier-credentials, `--fast` en `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Handmatig `matrix_profile=all` waaiert uit naar de vijf profielshards zodat de volledige catalogus parallel kan draaien terwijl er één artefactdirectory per shard behouden blijft.

Voor transport-echte Telegram-, Discord- en Slack-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Ze richten zich op een bestaand echt kanaal met twee bots (driver + SUT). Vereiste env vars, scenariolijsten, uitvoerartefacten en de Convex-credentialpool zijn hieronder gedocumenteerd in [Telegram-, Discord- en Slack-QA-referentie](#telegram-discord-and-slack-qa-reference).

Voor een volledige Slack-desktop-VM-run met VNC-redding, voer uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die opdracht least een Crabbox-desktop/browser-machine, draait de Slack-live-lane
binnen de VM, opent Slack Web in de VNC-browser, legt het bureaublad vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
wanneer video-opname beschikbaar is terug naar de Mantis-artifactmap. Crabbox
desktop/browser-leases leveren de opnametools en browser/native-build-helper-
pakketten vooraf, dus het scenario zou alleen fallbacks moeten installeren op
oudere leases. Mantis rapporteert totale timings en timings per fase in
`mantis-slack-desktop-smoke-report.md`, zodat trage runs laten zien of tijd ging
naar lease-warmup, het ophalen van referenties, remote setup of artifactkopie. Hergebruik
`--lease-id <cbx_...>` nadat je handmatig via VNC bij Slack Web bent ingelogd;
hergebruikte leases houden ook Crabbox' pnpm-storecache warm. De standaard
`--hydrate-mode source` verifieert vanuit een source checkout en draait install/build
binnen de VM. Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte remote
workspace al `node_modules` en een gebouwde `dist/` heeft; die modus slaat de
dure install/build-stap over en faalt gesloten wanneer de workspace niet gereed is.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-gateway
binnen de VM op poort `38973` draaien; zonder dit draait de opdracht de normale
bot-naar-bot Slack-QA-lane en sluit af na artifactopname.

De operatorchecklist, GitHub-workflowdispatchopdracht, evidence-comment-
contract, hydrate-mode-beslissingstabel, timinginterpretatie en stappen voor
foutafhandeling staan in [Mantis Slack Desktop Runbook](/nl/concepts/mantis-slack-desktop-runbook).

Voor een agent/CV-achtige desktoptaak, voer uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least of hergebruikt een Crabbox-desktop/browser-machine, start
`crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, draait `openclaw infer image describe`
tegen de screenshot wanneer `--vision-mode image-describe` is geselecteerd, en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een gestructureerd JSON-
oordeel en slaagt alleen wanneer het model positieve zichtbare bewijzen rapporteert; een
negatief antwoord dat alleen de doeltekst citeert laat de assertion mislukken.
Gebruik `--vision-mode metadata` voor een smoke zonder model die de desktop,
browser, screenshot en videopijplijn bewijst zonder een image-understanding-
provider aan te roepen. Opname is een vereist artifact voor `visual-task`; als Crabbox
geen niet-lege `visual-task.mp4` opneemt, faalt de taak zelfs wanneer de visual driver
is geslaagd. Bij falen behoudt Mantis de lease voor VNC, tenzij de taak al
was geslaagd en `--keep-lease` niet was ingesteld.

Voer vóór het gebruik van gepoolde live-referenties uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert Convex-broker-env, valideert endpointinstellingen en verifieert admin/list-bereikbaarheid wanneer het maintainergeheim aanwezig is. Hij rapporteert alleen ingesteld/ontbrekend-status voor geheimen.

## Live-transportdekking

Live-transportlanes delen één contract in plaats van dat elke lane zijn eigen scenariolijstopmaak bedenkt. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

| Lane     | Canary | Vermeldingsgating | Bot-naar-bot | Allowlist-blokkering | Antwoord op topniveau | Hervatten na herstart | Thread-vervolg | Thread-isolatie | Reactieobservatie | Help-opdracht | Registratie van native opdracht |
| -------- | ------ | ----------------- | ------------ | -------------------- | --------------------- | --------------------- | -------------- | ---------------- | ----------------- | ------------- | -------------------------------- |
| Matrix   | x      | x                 | x            | x                    | x                     | x                     | x              | x                | x                 |               |                                  |
| Telegram | x      | x                 | x            |                      |                       |                       |                |                  |                   | x             |                                  |
| Discord  | x      | x                 | x            |                      |                       |                       |                |                  |                   |               | x                                |
| Slack    | x      | x                 | x            | x                    | x                     | x                     | x              | x                |                   |               |                                  |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live-transporten één expliciete checklist voor
transportcontracten delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een verse Multipass-guest, installeert afhankelijkheden, bouwt OpenClaw
binnen de guest, draait `qa suite` en kopieert daarna het normale QA-rapport en de
samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.
Host- en Multipass-suiteruns voeren standaard meerdere geselecteerde scenario's parallel
uit met geïsoleerde gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
De opdracht sluit af met een niet-nulstatus wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder een falende exitcode.
Live-runs forwarden de ondersteunde QA-auth-invoer die praktisch is voor de
guest: env-gebaseerde providersleutels, het QA-live-providerconfiguratiepad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
terug kan schrijven via de gemounte workspace.

## Telegram-, Discord- en Slack-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-ondersteunde homeserverprovisioning. Telegram, Discord en Slack zijn kleiner - elk een handvol scenario's, geen profielsysteem, tegen bestaande echte kanalen - dus hun referentie staat hier.

### Gedeelde CLI-flags

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde flags:

| Flag                                  | Standaard                                                       | Beschrijving                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                               | Draai alleen dit scenario. Herhaalbaar.                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/geobserveerde berichten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                         |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijk account-id binnen de QA-gatewayconfiguratie.                                                                         |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                                      |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                               | Primaire/alternatieve modelrefs.                                                                                               |
| `--fast`                              | uit                                                             | Provider-snelle modus waar ondersteund.                                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex-referentiepool](#convex-credential-pool).                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol gebruikt wanneer `--credential-source convex`.                                                                             |

Elke lane sluit af met een niet-nulstatus bij elk mislukt scenario. `--allow-failures` schrijft artifacts zonder een falende exitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte private Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** ingeschakeld hebben in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeriek chat-id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behoudt berichtinhoud in artifacts met geobserveerde berichten (standaard geredigeerd).

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

Uitvoerartifacts:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - bevat RTT per antwoord (driver send → geobserveerd SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` - inhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privaat Discord-guildkanaal met twee bots: een driverbot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw-gateway wordt gestart via de gebundelde Discord-Plugin. Verifieert kanaalvermeldingsafhandeling, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met het SUT-botgebruikers-id dat door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artifacts met geobserveerde berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Draait zelfstandig omdat het de SUT omschakelt naar always-on, tool-only guild-antwoorden met `messages.statusReactions.enabled=true`, en daarna een REST-reactietijdlijn plus HTML/PNG-visuele artifacts vastlegt. Mantis voor/na-rapporten behouden ook door het scenario geleverde MP4-artifacts als `baseline.mp4` en `candidate.mp4`.

Draai het Mantis-statusreactiescenario expliciet:

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
- `discord-qa-observed-messages.json` - bodies worden geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het scenario voor statusreacties wordt uitgevoerd.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee verschillende bots: een driverbot die door de harness wordt aangestuurd en een SUT-bot die door de onderliggende OpenClaw Gateway wordt gestart via de gebundelde Slack-Plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt bericht-bodies in artefacten met geobserveerde berichten.

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
- `slack-qa-observed-messages.json` - bodies worden geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### De Slack-werkruimte instellen

De lane heeft twee verschillende Slack-apps in één werkruimte nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een speciaal kanaal; de lane plaatst berichten bij elke run.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een aparte Slack-app moet zijn ten opzichte van de driver, zodat de botgebruikers-id verschillend is.
- `sutAppToken` - app-niveautoken (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app gebeurtenissen kan ontvangen.

Geef de voorkeur aan een Slack-werkruimte die aan QA is gewijd boven het hergebruiken van een productie-werkruimte.

Het onderstaande SUT-manifest beperkt de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`) bewust tot de machtigingen en gebeurtenissen die door de live Slack-QA-suite worden gedekt. Voor de productiekanalenconfiguratie zoals gebruikers die zien, zie [Snelle instelling van Slack-kanaal](/nl/channels/slack#quick-setup); het QA Driver/SUT-paar is bewust gescheiden omdat de lane twee verschillende botgebruikers-id's in één werkruimte nodig heeft.

**1. Maak de Driver-app**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → kies de QA-werkruimte, plak het volgende manifest en kies daarna _Install to Workspace_:

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

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) - die wordt `driverBotToken`. De driver hoeft alleen berichten te plaatsen en zichzelf te identificeren; geen gebeurtenissen, geen Socket Mode.

**2. Maak de SUT-app**

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app gebruikt bewust een smallere versie van het productiemanifest van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`): reactiemachtigingen en -gebeurtenissen zijn weggelaten omdat de live Slack-QA-suite reactieafhandeling nog niet dekt.

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

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → die wordt `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de `xapp-...`-waarde → die wordt `sutAppToken`.

Controleer of de twee bots verschillende gebruikers-id's hebben door `auth.test` op elk token aan te roepen. De runtime onderscheidt driver en SUT op gebruikers-id; één app voor beide hergebruiken laat mention-gating onmiddellijk mislukken.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal aan (bijv. `#openclaw-qa`) en nodig beide bots vanuit het kanaal uit:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de `Cxxxxxxxxxx`-id uit _channel info → About → Channel ID_ - die wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-reads van de harness zullen nog steeds slagen.

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

Met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in je shell, registreer en verifieer:

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

Een groene run wordt ruim binnen 30 seconden voltooid en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ~90 seconden hangt en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleased - `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### Convex-pool voor inloggegevens

Telegram-, Discord- en Slack-lanes kunnen inloggegevens leasen uit een gedeelde Convex-pool in plaats van de bovenstaande env-vars te lezen. Geef `--credential-source convex` mee (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeats deze gedurende de run en geeft deze vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"` en `"slack"`.

Payloadvormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` moet overeenkomen met `^[A-Z][A-Z0-9]+$` (een Slack-id zoals `Cxxxxxxxxxx`). Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env-vars en het endpointcontract van de Convex-broker staan in [Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Repo-backed seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testrun en moet definiëren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- docs- en codeverwijzingen
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak achter `qa-flow` mag generiek
en cross-cutting blijven. Markdownscenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingesloten Control UI aansturen via de
Gateway-`browser.request`-seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op source tree-
map. Houd scenario-ID's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van de implementatie.

De baseline-lijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- Cron-callbacks
- geheugenoproep
- modelwisseling
- subagent-overdracht
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenariobewuste OpenClaw-mock. Dit blijft de standaard
  deterministische mocklane voor repo-backed QA en parity-gates.
- `aimock` start een door AIMock ondersteunde providerserver voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Deze is aanvullend en vervangt
  de `mock-openai`-scenariodispatcher niet.

De provider-lane-implementatie staat onder `extensions/qa-lab/src/providers/`.
Elke provider beheert zijn eigen defaults, lokale serverstart, Gateway-modelconfiguratie,
stagingbehoeften voor auth-profielen en live/mock-capabilityvlaggen. Gedeelde suite- en
Gateway-code moet via de providerregistry routeren in plaats van te branch-en op
providernamen.

## Transportadapters

`qa-lab` beheert een generieke transportseam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten in dezelfde suiterunner kunnen worden ingeplugd in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de splitsing:

- `qa-lab` beheert generieke scenario-uitvoering, worker-concurrency, schrijven van artefacten en rapportage.
- De transportadapter beheert Gateway-configuratie, gereedheid, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdownscenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` levert het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract oefent.

Voeg geen nieuwe top-level QA-commandoroot toe wanneer de gedeelde `qa-lab`-host de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanica:

- de commandoroot `openclaw qa`
- opstarten en teardown van de suite
- worker-concurrency
- schrijven van artefacten
- rapportgeneratie
- uitvoering van scenario's
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins zijn eigenaar van het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gekoppeld
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe gereedheid wordt gecontroleerd
- hoe inkomende gebeurtenissen worden geïnjecteerd
- hoe uitgaande berichten worden waargenomen
- hoe transcripties en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde host-seam van `qa-lab`.
3. Houd transportspecifieke mechanismen binnen de runner-plugin of kanaalharnas.
4. Koppel de runner als `openclaw qa <runner>` in plaats van een concurrerende root-command te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende array `qaRunnerCliRegistrations` exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter aparte entrypoints blijven.
5. Maak of pas markdownscenario's aan onder de thematische directories `qa/scenarios/`.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-plugin of dat pluginharnas.
- Als een scenario een nieuwe capability nodig heeft die meer dan één kanaal kan gebruiken, voeg dan een generieke helper toe in plaats van een kanaalspecifieke branch in `suite.ts`.
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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te voorkomen, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de waargenomen bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgscenario's de moeite waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's - handig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport - voer `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare output).

Voer voor teken- en stijlcontroles hetzelfde scenario uit over meerdere live model-
refs en schrijf een beoordeeld Markdown-rapport:

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

De command voert lokale QA Gateway-childprocessen uit, geen Docker. Character-eval-
scenario's moeten de persona instellen via `SOUL.md` en daarna gewone gebruikersbeurten uitvoeren,
zoals chat, workspace-hulp en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. De command bewaart elke volledige
transcriptie, legt basisstatistieken van de run vast en vraagt de beoordelingsmodellen daarna in snelle modus met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, sfeer en humor.
Gebruik `--blind-judge-models` bij het vergelijken van providers: de beoordelingsprompt krijgt nog steeds
elke transcriptie en runstatus, maar kandidaatrefs worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na het parsen terug aan echte refs.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evalrefs die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
voor compatibiliteit behouden.
OpenAI-kandidaatrefs gebruiken standaard snelle modus, zodat prioriteitsverwerking wordt gebruikt waar
de provider dit ondersteunt. Voeg `,fast`, `,no-fast` of `,fast=false` inline toe wanneer een
enkele kandidaat of beoordelaar een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je
snelle modus voor elk kandidaatmodel wilt forceren. Duur van kandidaten en beoordelaars wordt
in het rapport vastgelegd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Runs van kandidaat- en beoordelingsmodellen gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-
druk een run te ruisachtig maken.
Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt character-eval standaard
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
