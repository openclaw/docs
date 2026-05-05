---
read_when:
    - Begrijpen hoe de QA-opzet in elkaar zit
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - Repo-ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering rond het Gateway-dashboard bouwen
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, scenario''s met repo-ondersteuning, live transportlanen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-05T06:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalvormige manier te testen dan met één unit-test kan.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM,
  kanaal, thread, reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  injecteren van inkomende berichten en exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-plugins: live-transportadapters die
  een echt kanaal aansturen binnen een onderliggende QA-Gateway.
- `qa/`: door de repo ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): live-verificatie voor en na bugs waarvoor echte
  transports, browserscreenshots, VM-status en PR-bewijs nodig zijn.

## Commando-oppervlak

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel flows hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                                                   |
| `qa suite`                                          | Voer door de repo ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                |
| `qa coverage`                                       | Druk de markdown-inventaris voor scenariodekking af (`--json` voor machine-uitvoer).                                                                                                        |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport.                                                                                                 |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live-modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                    |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                    |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                          |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                                        |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + Gateway-lane.                                                                                                                    |
| `qa up`                                             | Bouw de QA-site, start de door Docker ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; de `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).      |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                      |
| `qa mock-openai`                                    | Start alleen de scenario-bewuste `mock-openai`-provider-server.                                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-credentialpool.                                                                                                                                                    |
| `qa matrix`                                         | Live-transportlane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                          |
| `qa telegram`                                       | Live-transportlane tegen een echte private Telegram-groep.                                                                                                                                   |
| `qa discord`                                        | Live-transportlane tegen een echt privaat Discord-guildkanaal.                                                                                                                               |
| `qa slack`                                          | Live-transportlane tegen een echt privaat Slack-kanaal.                                                                                                                                      |
| `qa mantis`                                         | Verificatierunner voor en na live-transportbugs, met bewijs via Discord-statusreacties, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis).                |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer dit uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de door Docker ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringsloop de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, faalde of
geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder telkens de Docker-image opnieuw te bouwen,
start je de stack met een bind-gemonteerde QA Lab-bundel:

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

Voor een lokale OpenTelemetry-trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-trace-ontvanger, voert het
`otel-trace-smoke`-QA-scenario uit met de `diagnostics-otel`-plugin ingeschakeld en
decodeert daarna de geëxporteerde protobuf-spans en controleert de release-kritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten buiten de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft uitsluitend voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostics-
instrumentatie wijzigt.

Voor een transport-echte Matrix-smoke-lane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env-vars en artifact-indeling voor deze lane staan in [Matrix QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver/SUT/observer-gebruikers, voert de echte Matrix-plugin uit binnen een onderliggende QA-Gateway die tot dat transport is beperkt (geen `qa-channel`) en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerd uitvoerlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

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

Dat commando least een Crabbox-desktop/browser-machine, voert de Slack-live-lane
uit binnen de VM, opent Slack Web in de VNC-browser, legt het bureaublad vast en
kopieert `slack-qa/`, `slack-desktop-smoke.png` en `slack-desktop-smoke.mp4`
wanneer video-opname beschikbaar is terug naar de Mantis-artifactdirectory. Hergebruik `--lease-id <cbx_...>` nadat je handmatig via VNC bij Slack Web bent ingelogd.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-
Gateway in de VM draaien op poort `38973`; zonder die optie voert het commando de
normale bot-naar-bot Slack-QA-lane uit en sluit het af na artifact-capture.

Voor een agent/CV-achtige desktoptaak voer je uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least of hergebruikt een Crabbox-desktop/browser-machine, start
`crabbox record --while`, stuurt de zichtbare browser aan via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image describe`
uit tegen de screenshot wanneer `--vision-mode image-describe` is geselecteerd en
schrijft `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` en `mantis-visual-task-report.md`.
Wanneer `--expect-text` is ingesteld, vraagt de vision-prompt om een gestructureerd JSON-
oordeel en slaagt alleen wanneer het model positieve zichtbare bewijzen rapporteert; een
negatieve respons die alleen de doeltekst citeert, laat de assertion falen.
Gebruik `--vision-mode metadata` voor een no-model-smoke die de desktop-,
browser-, screenshot- en videopijplijn bewijst zonder een image-understanding-
provider aan te roepen. Opname is een vereist artifact voor `visual-task`; als Crabbox
geen niet-lege `visual-task.mp4` opneemt, faalt de taak zelfs wanneer de visual driver
is geslaagd. Bij falen behoudt Mantis de lease voor VNC, tenzij de taak al
geslaagd was en `--keep-lease` niet was ingesteld.

Voer vóór gebruik van gepoolde live-credentials uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin-/list-bereikbaarheid wanneer het maintainersecret aanwezig is. Voor secrets rapporteert hij alleen de status ingesteld/ontbrekend.

## Live-transportdekking

Live-transportlanes delen één contract in plaats van elk hun eigen scenariolijstvork uit te vinden. `qa-channel` is de brede synthetische suite voor productgedrag en maakt geen deel uit van de live-transportdekkingsmatrix.

| Lane     | Canary | Vermeldingsgating | Bot-naar-bot | Allowlist-blokkering | Antwoord op topniveau | Hervatten na herstart | Thread-opvolging | Thread-isolatie | Reactie-observatie | Help-opdracht | Registratie van native opdracht |
| -------- | ------ | ----------------- | ------------ | -------------------- | --------------------- | --------------------- | ---------------- | --------------- | ------------------ | ------------- | -------------------------------- |
| Matrix   | x      | x                 | x            | x                    | x                     | x                     | x                | x               | x                  |               |                                  |
| Telegram | x      | x                 | x            |                      |                       |                       |                  |                 |                    | x             |                                  |
| Discord  | x      | x                 | x            |                      |                       |                       |                  |                 |                    |               | x                                |
| Slack    | x      | x                 | x            |                      |                       |                       |                  |                 |                    |               |                                  |

Dit houdt `qa-channel` als de brede suite voor productgedrag, terwijl Matrix,
Telegram en toekomstige live transporten één expliciete checklist voor
transportcontracten delen.

Voer voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een nieuwe Multipass-gast, installeert afhankelijkheden, bouwt OpenClaw
binnen de gast, voert `qa suite` uit en kopieert vervolgens het normale QA-rapport en
de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het hergebruikt hetzelfde gedrag voor scenariokeuze als `qa suite` op de host.
Host- en Multipass-suiteruns voeren standaard meerdere geselecteerde scenario's parallel uit
met geïsoleerde Gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
De opdracht eindigt met een niet-nul exitcode wanneer een scenario mislukt. Gebruik `--allow-failures` wanneer
je artefacten wilt zonder een falende exitcode.
Live runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de
gast: env-gebaseerde providersleutels, het QA-liveproviderconfiguratiepad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de gast
terug kan schrijven via de gemounte werkruimte.

## Telegram-, Discord- en Slack-QA-referentie

Matrix heeft een [aparte pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-gebaseerde homeserver-provisioning. Telegram, Discord en Slack zijn kleiner — elk een handvol scenario's, geen profielsysteem, tegen vooraf bestaande echte kanalen — dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaard                                                       | Beschrijving                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Voer alleen dit scenario uit. Herhaalbaar.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/geobserveerde berichten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijk account-id binnen de QA-Gateway-configuratie.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                             |
| `--model <ref>` / `--alt-model <ref>` | standaard van provider                                          | Primaire/alternatieve modelrefs.                                                                                      |
| `--fast`                              | uit                                                             | Snelle providermodus waar ondersteund.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex-credentialpool](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                          |

Elke lane eindigt met een niet-nul exitcode bij een mislukt scenario. `--allow-failures` schrijft artefacten zonder een falende exitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte private Telegram-groep met twee afzonderlijke bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerieke chat-id (tekenreeks).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optioneel:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten (standaard geredigeerd).

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

Uitvoerartefacten:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bevat RTT per antwoord (driver verzendt → geobserveerd SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privaat Discord-guildkanaal met twee bots: een driverbot die door de harness wordt beheerd en een SUT-bot die door de child OpenClaw-Gateway wordt gestart via de meegeleverde Discord-Plugin. Verifieert verwerking van kanaalvermeldingen, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — moet overeenkomen met de SUT-botgebruikers-id die door Discord wordt geretourneerd (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis-scenario. Wordt zelfstandig uitgevoerd omdat het de SUT overschakelt naar altijd-aan, tool-only guild-antwoorden met `messages.statusReactions.enabled=true`, en vervolgens een REST-reactietijdlijn plus HTML/PNG-visuele artefacten vastlegt. Mantis-voor/na-rapporten behouden ook door scenario's geleverde MP4-artefacten als `baseline.mp4` en `candidate.mp4`.

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
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario wordt uitgevoerd.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privaat Slack-kanaal met twee afzonderlijke bots: een driverbot die door de harness wordt beheerd en een SUT-bot die door de child OpenClaw-Gateway wordt gestart via de meegeleverde Slack-Plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artefacten met geobserveerde berichten.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Uitvoerartefacten:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — inhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### De Slack-werkruimte instellen

De lane heeft twee afzonderlijke Slack-apps in één werkruimte nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` — de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een toegewezen kanaal; de lane plaatst bij elke run berichten.
- `driverBotToken` — bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` — bottoken (`xoxb-...`) van de **SUT**-app, die een aparte Slack-app van de driver moet zijn zodat de botgebruikers-id ervan verschillend is.
- `sutAppToken` — app-level token (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app events kan ontvangen.

Geef de voorkeur aan een Slack-werkruimte die aan QA is gewijd boven het hergebruiken van een productie-werkruimte.

Het onderstaande SUT-manifest weerspiegelt de productie-installatie van de meegeleverde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`). Voor de productiekanalen-setup zoals gebruikers die zien, zie [Snelle Slack-kanaalsetup](/nl/channels/slack#quick-setup); het QA-Driver/SUT-paar is opzettelijk gescheiden omdat de lane twee afzonderlijke botgebruikers-id's in één werkruimte nodig heeft.

**1. Maak de Driver-app**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → kies de QA-werkruimte, plak het volgende manifest en vervolgens _Install to Workspace_:

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

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) — dat wordt `driverBotToken`. De driver hoeft alleen berichten te plaatsen en zichzelf te identificeren; geen events, geen Socket Mode.

**2. Maak de SUT-app**

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. De scopeset weerspiegelt de productie-installatie van de meegeleverde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Nadat Slack de app heeft aangemaakt, doe je twee dingen op de instellingenpagina:

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → dat wordt `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de waarde `xapp-...` → dat wordt `sutAppToken`.

Controleer of de twee bots verschillende gebruikers-id's hebben door `auth.test` aan te roepen op elk token. De runtime onderscheidt driver en SUT op gebruikers-id; één app voor beide hergebruiken laat mention-gating meteen mislukken.

**3. Maak het kanaal aan**

Maak in de QA-werkruimte een kanaal aan (bijv. `#openclaw-qa`) en nodig beide bots uit vanuit het kanaal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de id `Cxxxxxxxxxx` uit _kanaalinfo → Info → Channel ID_ — dat wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-reads van de harness slagen nog steeds.

**4. Registreer de referenties**

Twee opties. Gebruik env vars voor debugging op één machine (stel de vier variabelen `OPENCLAW_QA_SLACK_*` in en geef `--credential-source env` mee), of seed de gedeelde Convex-pool zodat CI en andere maintainers ze kunnen leasen.

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

Een groene run is ruim binnen 30 seconden klaar en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted for kind "slack"`, dan is de pool leeg of is elke rij geleaset — `qa credentials list --kind slack --status all --json` vertelt je welke van de twee.

### Convex-referentiepool

Telegram-, Discord- en Slack-lanes kunnen referenties leasen uit een gedeelde Convex-pool in plaats van de bovenstaande env vars te lezen. Geef `--credential-source convex` mee (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de run en geeft die vrij bij afsluiten. Poolsoorten zijn `"telegram"`, `"discord"` en `"slack"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` moet overeenkomen met `^[A-Z][A-Z0-9]+$` (een Slack-id zoals `Cxxxxxxxxxx`). Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env vars en het endpoint-contract van de Convex-broker staan in [Testen → Gedeelde Telegram-referenties via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Door de repo ondersteunde seeds

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan bewust in git, zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testrun en moet definiëren:

- scenariometadata
- optionele metadata voor categorie, capability, lane en risico
- docs- en codeverwijzingen
- optionele Plugin-vereisten
- optionele Gateway-configpatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak achter `qa-flow` mag generiek
en cross-cutting blijven. Markdown-scenario's kunnen bijvoorbeeld transport-side
helpers combineren met browser-side helpers die de ingebedde Control UI aansturen via de
Gateway-`browser.request` seam zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op product-capability in plaats van op
source-tree-map. Houd scenario-id's stabiel wanneer bestanden verplaatsen; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van de implementatie.

De baselinelijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- thread-gedrag
- levenscyclus van berichtacties
- cron-callbacks
- memory recall
- modelwissel
- subagent-handoff
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Provider-mocklanes

`qa suite` heeft twee lokale provider-mocklanes:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mocklane voor repo-ondersteunde QA en parity gates.
- `aimock` start een door AIMock ondersteunde provider-server voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Deze is additief en vervangt
  de `mock-openai`-scenario-dispatcher niet.

De provider-lane-implementatie staat onder `extensions/qa-lab/src/providers/`.
Elke provider is eigenaar van zijn defaults, lokale serverstart, Gateway-modelconfiguratie,
auth-profile-stagingbehoeften en live/mock-capabilityflags. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te branchen op
providernamen.

## Transportadapters

`qa-lab` is eigenaar van een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten op dezelfde suite-runner aansluiten in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de splitsing:

- `qa-lab` is eigenaar van generieke scenario-uitvoering, worker-concurrency, artifactschrijven en rapportage.
- De transportadapter is eigenaar van Gateway-configuratie, readiness, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` levert het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract test.

Voeg geen nieuwe top-level QA-commandoroot toe wanneer de gedeelde `qa-lab`-host de flow kan bezitten.

`qa-lab` is eigenaar van de gedeelde hostmechanica:

- de commandoroot `openclaw qa`
- suite-start en teardown
- worker-concurrency
- artifactschrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-Plugins zijn eigenaar van het transportcontract:

- hoe `openclaw qa <runner>` wordt gemount onder de gedeelde `qa`-root
- hoe de Gateway wordt geconfigureerd voor dat transport
- hoe readiness wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripten en genormaliseerde transportstatus worden blootgesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of cleanup wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde `qa-lab`-hostseam.
3. Houd transportspecifieke mechanica binnen de runner-Plugin of kanaal-harness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerende root-command te registreren. Runner-Plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende array `qaRunnerCliRegistrations` exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter afzonderlijke entrypoints blijven.
5. Schrijf of pas markdown-scenario's aan onder de thematische mappen `qa/scenarios/`.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd het dan in die runner-Plugin of Plugin-harness.
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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — maar nieuw scenario-auteurschap moet de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te voorkomen, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport uit de geobserveerde bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgsceanrio's het waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's — nuttig bij het inschatten van vervolgwerk of het bedraden van een nieuw transport — voer je `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare output).

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

De opdracht voert lokale QA-Gateway-kindprocessen uit, geen Docker. Character-eval-scenario's
moeten de persona instellen via `SOUL.md` en vervolgens gewone gebruikersbeurten uitvoeren,
zoals chat, hulp in de workspace en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. De opdracht bewaart elk volledig
transcript, registreert basisstatistieken voor de run en vraagt daarna de beoordelingsmodellen in fast-modus met
`xhigh`-redenering waar ondersteund om de runs te rangschikken op natuurlijkheid, sfeer en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de beoordelingsprompt krijgt nog steeds
elk transcript en elke runstatus, maar kandidaatverwijzingen worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt ranglijsten na het parsen terug aan echte verwijzingen.
Kandidaatruns gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evaluatieverwijzingen die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` wordt
behouden voor compatibiliteit.
OpenAI-kandidaatverwijzingen gebruiken standaard fast-modus, zodat priority processing wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je
fast-modus voor elk kandidaatmodel wilt afdwingen. De duur van kandidaat- en beoordelaarruns wordt
in het rapport geregistreerd voor benchmarkanalyse, maar beoordelaarsprompts zeggen expliciet
dat er niet op snelheid gerangschikt moet worden.
Kandidaat- en beoordelaarsmodelruns gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-belasting
een run te ruisachtig maken.
Wanneer er geen kandidaat-`--model` wordt doorgegeven, gebruikt de character-eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer er geen `--model` wordt doorgegeven.
Wanneer er geen `--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Gerelateerde docs

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA-kanaal](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
