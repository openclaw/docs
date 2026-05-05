---
read_when:
    - Begrijpen hoe de QA-stack in elkaar zit
    - Uitbreiden van qa-lab, qa-channel of een transportadapter
    - Repo-ondersteunde QA-scenario's toevoegen
    - Realistischere QA-automatisering bouwen rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, transportroutes voor echte verbindingen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-05-05T01:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack is bedoeld om OpenClaw op een realistischer,
kanaalvormige manier te testen dan met een enkele unit test mogelijk is.

Huidige onderdelen:

- `extensions/qa-channel`: synthetisch berichtkanaal met oppervlakken voor DM, kanaal, thread,
  reactie, bewerking en verwijdering.
- `extensions/qa-lab`: debugger-UI en QA-bus voor het observeren van het transcript,
  het injecteren van inkomende berichten en het exporteren van een Markdown-rapport.
- `extensions/qa-matrix`, toekomstige runner-Plugins: live-transportadapters die
  een echt kanaal aansturen binnen een child-QA-Gateway.
- `qa/`: repo-ondersteunde seed-assets voor de starttaak en baseline-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): verificatie vóór en na live voor bugs waarvoor
  echte transports, browserscreenshots, VM-status en PR-bewijs nodig zijn.

## Commandosurface

Elke QA-flow draait onder `pnpm openclaw qa <subcommand>`. Veel hebben `pnpm qa:*`
scriptaliassen; beide vormen worden ondersteund.

| Commando                                            | Doel                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole; schrijft een Markdown-rapport.                                                                                                                                   |
| `qa suite`                                          | Voer repo-ondersteunde scenario's uit tegen de QA-Gateway-lane. Aliassen: `pnpm openclaw qa suite --runner multipass` voor een wegwerpbare Linux-VM.                                        |
| `qa coverage`                                       | Druk de markdown-inventaris van scenariodekking af (`--json` voor machine-output).                                                                                                           |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden en schrijf het agentische pariteitsrapport.                                                                                                 |
| `qa character-eval`                                 | Voer het character-QA-scenario uit over meerdere live modellen met een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                     |
| `qa manual`                                         | Voer een eenmalige prompt uit tegen de geselecteerde provider/model-lane.                                                                                                                    |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                          |
| `qa docker-build-image`                             | Bouw de voorgebakken QA-Docker-image.                                                                                                                                                        |
| `qa docker-scaffold`                                | Schrijf een docker-compose-scaffold voor het QA-dashboard + Gateway-lane.                                                                                                                    |
| `qa up`                                             | Bouw de QA-site, start de Docker-ondersteunde stack, druk de URL af (alias: `pnpm qa:lab:up`; `:fast`-variant voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).              |
| `qa aimock`                                         | Start alleen de AIMock-provider-server.                                                                                                                                                      |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-provider-server.                                                                                                                               |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-referentiepool.                                                                                                                                                    |
| `qa matrix`                                         | Live-transportlane tegen een wegwerpbare Tuwunel-homeserver. Zie [Matrix QA](/nl/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Live-transportlane tegen een echte privé-Telegram-groep.                                                                                                                                     |
| `qa discord`                                        | Live-transportlane tegen een echt privé-Discord-guildkanaal.                                                                                                                                 |
| `qa slack`                                          | Live-transportlane tegen een echt privé-Slack-kanaal.                                                                                                                                        |
| `qa mantis`                                         | Runner voor verificatie vóór en na voor live-transportbugs, met Discord-statusreactiebewijs, Crabbox-desktop/browser-smoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis).           |

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer het uit met:

```bash
pnpm qa:lab:up
```

Dat bouwt de QA-site, start de Docker-ondersteunde Gateway-lane en stelt de
QA Lab-pagina beschikbaar waar een operator of automatiseringsloop de agent een
QA-missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte,
mislukte of geblokkeerd bleef.

Voor snellere QA Lab-UI-iteratie zonder telkens de Docker-image opnieuw te bouwen,
start je de stack met een bind-gemonteerde QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` houdt de Docker-services op een voorgebouwde image en bind-mount
`extensions/qa-lab/web/dist` in de `qa-lab`-container. `qa:lab:watch`
bouwt die bundel opnieuw bij wijzigingen, en de browser laadt automatisch opnieuw wanneer de QA Lab-
asset-hash verandert.

Voor een lokale OpenTelemetry-trace-smoke voer je uit:

```bash
pnpm qa:otel:smoke
```

Dat script start een lokale OTLP/HTTP-trace-ontvanger, voert het
`otel-trace-smoke`-QA-scenario uit met de `diagnostics-otel`-Plugin ingeschakeld, decodeert daarna
de geëxporteerde protobuf-spans en controleert de releasekritieke vorm:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` en `openclaw.message.delivery` moeten aanwezig zijn;
modelaanroepen mogen bij succesvolle turns geen `StreamAbandoned` exporteren; ruwe diagnostische ID's en
`openclaw.content.*`-attributen moeten uit de trace blijven. Het schrijft
`otel-smoke-summary.json` naast de QA-suite-artifacts.

Observability-QA blijft uitsluitend voor source-checkouts. De npm-tarball laat
QA Lab bewust weg, dus package-Docker-release-lanes voeren geen `qa`-commando's uit. Gebruik
`pnpm qa:otel:smoke` vanuit een gebouwde source-checkout wanneer je diagnostische
instrumentatie wijzigt.

Voor een transport-echte Matrix-smoke-lane voer je uit:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

De volledige CLI-referentie, profiel-/scenariocatalogus, env vars en artifact-layout voor deze lane staan in [Matrix QA](/nl/concepts/qa-matrix). In het kort: het provisiont een wegwerpbare Tuwunel-homeserver in Docker, registreert tijdelijke driver-/SUT-/observer-gebruikers, draait de echte Matrix-Plugin binnen een child-QA-Gateway die tot dat transport is beperkt (geen `qa-channel`) en schrijft daarna een Markdown-rapport, JSON-samenvatting, observed-events-artifact en gecombineerde outputlog onder `.artifacts/qa-e2e/matrix-<timestamp>/`.

Voor transport-echte Telegram-, Discord- en Slack-smoke-lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Ze richten zich op een vooraf bestaand echt kanaal met twee bots (driver + SUT). Vereiste env vars, scenariolijsten, output-artifacts en de Convex-referentiepool zijn hieronder gedocumenteerd in [Telegram-, Discord- en Slack-QA-referentie](#telegram-discord-and-slack-qa-reference).

Voor een volledige Slack-desktop-VM-run met VNC-redding voer je uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dat commando least een Crabbox-desktop/browser-machine, voert de Slack-live-lane
uit binnen de VM, opent Slack Web in de VNC-browser, legt de desktop vast en
kopieert `slack-qa/` plus `slack-desktop-smoke.png` terug naar de Mantis-artifact-
directory. Hergebruik `--lease-id <cbx_...>` nadat je handmatig via VNC bij Slack Web bent ingelogd.
Met `--gateway-setup` laat Mantis een persistente OpenClaw Slack-
Gateway binnen de VM draaien op poort `38973`; zonder dit voert het commando de
normale bot-naar-bot Slack-QA-lane uit en sluit het af na artifact-capturing.

Voer vóór het gebruik van gepoolde live-referenties uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de Convex-broker-env, valideert endpointinstellingen en verifieert admin-/list-bereikbaarheid wanneer het maintainer-geheim aanwezig is. Hij rapporteert voor geheimen alleen de status ingesteld/ontbrekend.

## Live-transportdekking

Live-transportlanes delen één contract in plaats van elk hun eigen vorm voor scenariolijsten te bedenken. `qa-channel` is de brede synthetische productgedragsuite en maakt geen deel uit van de live-transportdekkingsmatrix.

| Lane     | Canary | Vermeldingsgating | Bot-naar-bot | Allowlist-blokkade | Top-level antwoord | Herstart hervatten | Thread-follow-up | Thread-isolatie | Reactie-observatie | Help-commando | Native command-registratie |
| -------- | ------ | ----------------- | ------------ | ------------------ | ------------------ | ------------------ | ---------------- | ---------------- | ------------------ | ------------- | --------------------------- |
| Matrix   | x      | x                 | x            | x                  | x                  | x                  | x                | x                | x                  |               |                             |
| Telegram | x      | x                 | x            |                    |                    |                    |                  |                  |                    | x             |                             |
| Discord  | x      | x                 | x            |                    |                    |                    |                  |                  |                    |               | x                           |
| Slack    | x      | x                 | x            |                    |                    |                    |                  |                  |                    |               |                             |

Dit houdt `qa-channel` als de brede productgedragsuite, terwijl Matrix,
Telegram en toekomstige live-transports één expliciete transportcontract-
checklist delen.

Voor een wegwerpbare Linux-VM-lane zonder Docker in het QA-pad te brengen, voer je uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Hiermee wordt een nieuwe Multipass-guest opgestart, worden afhankelijkheden geïnstalleerd, wordt OpenClaw
binnen de guest gebouwd, wordt `qa suite` uitgevoerd en worden daarna het normale QA-rapport en de
samenvatting teruggekopieerd naar `.artifacts/qa-e2e/...` op de host.
Het gebruikt hetzelfde scenariokeuzegedrag als `qa suite` op de host.
Host- en Multipass-suite-runs voeren standaard meerdere geselecteerde scenario's parallel uit
met geïsoleerde gateway-workers. `qa-channel` gebruikt standaard concurrency
4, begrensd door het aantal geselecteerde scenario's. Gebruik `--concurrency <count>` om
het aantal workers af te stemmen, of `--concurrency 1` voor seriële uitvoering.
De opdracht sluit af met een niet-nulcode wanneer een scenario faalt. Gebruik `--allow-failures` wanneer
je artifacts wilt zonder een falende afsluitcode.
Live-runs sturen de ondersteunde QA-auth-invoer door die praktisch is voor de
guest: provider-sleutels via env, het QA live-providerconfiguratiepad en
`CODEX_HOME` wanneer aanwezig. Houd `--output-dir` onder de repo-root zodat de guest
terug kan schrijven via de gemounte workspace.

## Telegram-, Discord- en Slack-QA-referentie

Matrix heeft een [eigen pagina](/nl/concepts/qa-matrix) vanwege het aantal scenario's en Docker-backed homeserver-provisioning. Telegram, Discord en Slack zijn kleiner — elk een handvol scenario's, geen profielsysteem, tegen vooraf bestaande echte kanalen — dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren zich via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en accepteren dezelfde vlaggen:

| Vlag                                  | Standaard                                                       | Beschrijving                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Voer alleen dit scenario uit. Herhaalbaar.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Waar rapporten/samenvatting/geobserveerde berichten en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-root bij aanroepen vanuit een neutrale cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Tijdelijke account-id binnen de QA-gatewayconfiguratie.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` of `live-frontier` (legacy `live-openai` werkt nog steeds).                                             |
| `--model <ref>` / `--alt-model <ref>` | providerstandaard                                               | Primaire/alternatieve modelrefs.                                                                                      |
| `--fast`                              | uit                                                             | Snelle providermodus waar ondersteund.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                           | Zie [Convex-credentialpool](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                          |

Elke lane sluit af met een niet-nulcode bij een gefaald scenario. `--allow-failures` schrijft artifacts zonder een falende afsluitcode in te stellen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte privé-Telegram-groep met twee verschillende bots (driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben; bot-naar-bot-observatie werkt het best wanneer beide bots **Bot-to-Bot Communication Mode** hebben ingeschakeld in `@BotFather`.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerieke chat-id (string).
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

Uitvoerartifacts:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bevat RTT per antwoord (driver verzenden → geobserveerd SUT-antwoord), beginnend met de canary.
- `telegram-qa-observed-messages.json` — berichtinhoud geredigeerd tenzij `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privé-Discord-guildkanaal met twee bots: een driver-bot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw-gateway wordt gestart via de gebundelde Discord-Plugin. Verifieert kanaalvermeldingsafhandeling, dat de SUT-bot de native `/help`-opdracht bij Discord heeft geregistreerd, en opt-in Mantis-bewijsscenario's.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — moet overeenkomen met de SUT-botgebruikers-id die Discord retourneert (anders faalt de lane snel).

Optioneel:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behoudt berichtinhoud in artifacts met geobserveerde berichten.

Scenario's (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis-scenario. Wordt zelfstandig uitgevoerd omdat het de SUT omschakelt naar always-on, tool-only guild-antwoorden met `messages.statusReactions.enabled=true`, en daarna een REST-reactietijdlijn plus een HTML/PNG-visueel artifact vastlegt.

Voer het Mantis-statusreactiescenario expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Uitvoerartifacts:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — berichtinhoud geredigeerd tenzij `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` en `discord-status-reactions-tool-only-timeline.png` wanneer het statusreactiescenario wordt uitgevoerd.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee verschillende bots: een driver-bot die door de harness wordt bestuurd en een SUT-bot die door de child OpenClaw-gateway wordt gestart via de gebundelde Slack-Plugin.

Vereiste env wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behoudt berichtinhoud in artifacts met geobserveerde berichten.

Scenario's (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Uitvoerartifacts:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — berichtinhoud geredigeerd tenzij `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### De Slack-workspace instellen

De lane heeft twee verschillende Slack-apps in één workspace nodig, plus een kanaal waarvan beide bots lid zijn:

- `channelId` — de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn uitgenodigd. Gebruik een toegewezen kanaal; de lane plaatst berichten bij elke run.
- `driverBotToken` — bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` — bottoken (`xoxb-...`) van de **SUT**-app, die een aparte Slack-app van de driver moet zijn zodat de botgebruikers-id ervan verschillend is.
- `sutAppToken` — token op app-niveau (`xapp-...`) van de SUT-app met `connections:write`, gebruikt door Socket Mode zodat de SUT-app events kan ontvangen.

Geef de voorkeur aan een Slack-workspace die aan QA is toegewezen boven het hergebruiken van een productieworkspace.

Het SUT-manifest hieronder weerspiegelt de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`). Voor de instelling van het productiekanaal zoals gebruikers die zien, zie [Snelle Slack-kanaalinstelling](/nl/channels/slack#quick-setup); het QA Driver/SUT-paar is bewust apart omdat de lane twee verschillende botgebruikers-id's in één workspace nodig heeft.

**1. Maak de Driver-app**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → kies de QA-workspace, plak het volgende manifest en daarna _Install to Workspace_:

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

Herhaal _Create New App → From a manifest_ in dezelfde workspace. De scopeset weerspiegelt de productie-installatie van de gebundelde Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`):

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

Nadat Slack de app heeft gemaakt, doe je twee dingen op de instellingenpagina:

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → dat wordt `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg scope `connections:write` toe → sla op → kopieer de `xapp-...`-waarde → dat wordt `sutAppToken`.

Controleer of de twee bots verschillende gebruikers-id's hebben door `auth.test` op elk token aan te roepen. De runtime onderscheidt driver en SUT op basis van gebruikers-id; als u één app voor beide hergebruikt, mislukt de vermeldingsfiltering onmiddellijk.

**3. Maak het kanaal aan**

Maak in de QA-werkruimte een kanaal aan (bijv. `#openclaw-qa`) en nodig beide bots vanuit het kanaal uit:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer de `Cxxxxxxxxxx`-id uit _kanaalinformatie → Over → Kanaal-ID_ — dat wordt `channelId`. Een openbaar kanaal werkt; als u een privékanaal gebruikt, hebben beide apps al `groups:history`, dus de history-lezingen van de harness blijven slagen.

**4. Registreer de referenties**

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

Met `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` geëxporteerd in uw shell, registreert en controleert u:

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

Een groene run is ruim binnen 30 seconden voltooid en `slack-qa-report.md` toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de lane ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted for kind "slack"`, is de pool leeg of is elke rij geleased — `qa credentials list --kind slack --status all --json` vertelt u welke van de twee.

### Convex-referentiepool

Telegram-, Discord- en Slack-lanes kunnen referenties leasen uit een gedeelde Convex-pool in plaats van de bovenstaande env-vars te lezen. Geef `--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in); QA Lab verkrijgt een exclusieve lease, heartbeatt die gedurende de run en geeft die vrij bij het afsluiten. Poolsoorten zijn `"telegram"`, `"discord"` en `"slack"`.

Payload-vormen die de broker valideert op `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` moet een numerieke chat-id-string zijn.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` moet overeenkomen met `^[A-Z][A-Z0-9]+$` (een Slack-id zoals `Cxxxxxxxxxx`). Zie [De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor app- en scope-provisioning.

Operationele env-vars en het endpoint-contract van de Convex-broker staan in [Testen → Gedeelde Telegram-referenties via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1) (de sectienaam dateert van vóór Discord-ondersteuning; de brokersemantiek is identiek voor beide soorten).

## Seeds vanuit de repo

Seed-assets staan in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Deze staan opzettelijk in git, zodat het QA-plan zichtbaar is voor zowel mensen als de
agent.

`qa-lab` moet een generieke markdown-runner blijven. Elk scenario-markdownbestand is
de bron van waarheid voor één testrun en moet het volgende definiëren:

- scenariometadata
- optionele categorie-, capability-, lane- en risicometadata
- docs- en coderefs
- optionele Plugin-vereisten
- optionele Gateway-configuratiepatch
- de uitvoerbare `qa-flow`

Het herbruikbare runtime-oppervlak dat `qa-flow` ondersteunt, mag generiek
en cross-cutting blijven. Markdown-scenario's kunnen bijvoorbeeld helpers aan de transportzijde
combineren met helpers aan de browserzijde die de ingebedde Control UI via de
Gateway-`browser.request`-seam aansturen zonder een speciale runner toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productcapability in plaats van op source tree
folder. Houd scenario-ID's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en `codeRefs`
voor traceerbaarheid van de implementatie.

De basislijst moet breed genoeg blijven om het volgende te dekken:

- DM- en kanaalchat
- thread-gedrag
- lifecycle van berichtacties
- Cron-callbacks
- memory recall
- modelwisseling
- subagent-overdracht
- repo-lezen en docs-lezen
- één kleine buildtaak zoals Lobster Invaders

## Mock-lanes voor providers

`qa suite` heeft twee lokale mock-lanes voor providers:

- `mock-openai` is de scenario-bewuste OpenClaw-mock. Deze blijft de standaard
  deterministische mock-lane voor repo-gebaseerde QA en parity-gates.
- `aimock` start een AIMock-gebaseerde provider-server voor experimentele protocol-,
  fixture-, record/replay- en chaosdekking. Dit is additief en vervangt de
  `mock-openai`-scenariodispatcher niet.

De implementatie van provider-lanes staat onder `extensions/qa-lab/src/providers/`.
Elke provider bezit zijn standaardinstellingen, lokale serverstart, Gateway-modelconfiguratie,
stagingbehoeften voor auth-profielen en capability-vlaggen voor live/mock. Gedeelde suite- en
Gateway-code moet via het providerregister routeren in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` bezit een generieke transport-seam voor markdown-QA-scenario's. `qa-channel` is de eerste adapter op die seam, maar het ontwerpdoel is breder: toekomstige echte of synthetische kanalen moeten op dezelfde suite-runner aansluiten in plaats van een transportspecifieke QA-runner toe te voegen.

Op architectuurniveau is de scheiding:

- `qa-lab` bezit generieke scenario-uitvoering, workerconcurrency, artifact-schrijven en rapportage.
- De transportadapter bezit Gateway-configuratie, readiness, inkomende en uitgaande observatie, transportacties en genormaliseerde transportstatus.
- Markdown-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab` biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Een kanaal toevoegen aan het markdown-QA-systeem vereist precies twee dingen:

1. Een transportadapter voor het kanaal.
2. Een scenariopakket dat het kanaalcontract uitoefent.

Voeg geen nieuwe QA-commandoroot op topniveau toe wanneer de gedeelde `qa-lab`-host de flow kan bezitten.

`qa-lab` bezit de gedeelde hostmechanica:

- de `openclaw qa`-commandoroot
- suite-start en teardown
- workerconcurrency
- artifact-schrijven
- rapportgeneratie
- scenario-uitvoering
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runner-plugins bezitten het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gemount
- hoe de Gateway voor dat transport wordt geconfigureerd
- hoe readiness wordt gecontroleerd
- hoe inkomende events worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripten en genormaliseerde transportstatus worden blootgesteld
- hoe transport-ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of cleanup wordt afgehandeld

De minimale adoptiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als eigenaar van de gedeelde `qa`-root.
2. Implementeer de transport-runner op de gedeelde `qa-lab`-host-seam.
3. Houd transportspecifieke mechanica binnen de runner-Plugin of kanaal-harness.
4. Mount de runner als `openclaw qa <runner>` in plaats van een concurrerend root-commando te registreren. Runner-plugins moeten `qaRunners` declareren in `openclaw.plugin.json` en een overeenkomende `qaRunnerCliRegistrations`-array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; lazy CLI- en runner-uitvoering moeten achter aparte entrypoints blijven.
5. Schrijf of pas markdown-scenario's aan onder de thematische `qa/scenarios/`-directories.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een opzettelijke migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats het dan in `qa-lab`.
- Als gedrag afhangt van één kanaaltransport, houd het dan in die runner-Plugin of Plugin-harness.
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

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — maar nieuwe scenario's moeten de generieke namen gebruiken. De aliassen bestaan om een flag-day-migratie te vermijden, niet als het model voor de toekomst.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport vanuit de geobserveerde bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgsccenario's het waard zijn om toe te voegen

Voor de inventaris van beschikbare scenario's — nuttig bij het inschatten van vervolgwerk of het aansluiten van een nieuw transport — voert u `pnpm openclaw qa coverage` uit (voeg `--json` toe voor machineleesbare uitvoer).

Voor karakter- en stijlcontroles voert u hetzelfde scenario uit op meerdere live model
refs en schrijft u een beoordeeld Markdown-rapport:

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

Het commando voert lokale QA-Gateway-childprocessen uit, niet Docker. Character-eval-scenario's
moeten de persona via `SOUL.md` instellen en daarna gewone gebruikersbeurten uitvoeren,
zoals chat, werkruimtehulp en kleine bestandstaken. Het kandidaatmodel mag
niet te horen krijgen dat het wordt geëvalueerd. Het commando bewaart elk volledig
transcript, registreert eenvoudige uitvoeringsstatistieken en vraagt daarna de beoordelingsmodellen in snelle modus met
`xhigh`-redenering waar ondersteund om de uitvoeringen te rangschikken op natuurlijkheid, vibe en humor.
Gebruik `--blind-judge-models` wanneer je providers vergelijkt: de beoordelingsprompt krijgt nog steeds
elk transcript en elke uitvoeringsstatus, maar kandidaatverwijzingen worden vervangen door neutrale
labels zoals `candidate-01`; het rapport koppelt rangschikkingen na
het parsen weer terug aan echte verwijzingen.
Kandidaatuitvoeringen gebruiken standaard `high` thinking, met `medium` voor GPT-5.5 en `xhigh`
voor oudere OpenAI-evaluatieverwijzingen die dit ondersteunen. Overschrijf een specifieke kandidaat inline met
`--model provider/model,thinking=<level>`. `--thinking <level>` stelt nog steeds een
globale fallback in, en de oudere vorm `--model-thinking <provider/model=level>` blijft
behouden voor compatibiliteit.
OpenAI-kandidaatverwijzingen gebruiken standaard snelle modus, zodat prioriteitsverwerking wordt gebruikt waar
de provider dit ondersteunt. Voeg inline `,fast`, `,no-fast` of `,fast=false` toe wanneer een
enkele kandidaat of beoordelaar een overschrijving nodig heeft. Geef `--fast` alleen door wanneer je
snelle modus voor elk kandidaatmodel wilt afdwingen. Duurwaarden voor kandidaten en beoordelaars worden
in het rapport geregistreerd voor benchmarkanalyse, maar beoordelingsprompts zeggen expliciet
niet op snelheid te rangschikken.
Kandidaat- en beoordelingsmodeluitvoeringen gebruiken beide standaard concurrency 16. Verlaag
`--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale Gateway-belasting
een uitvoering te rumoerig maken.
Wanneer geen kandidaat `--model` wordt meegegeven, gebruikt de character-eval standaard
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en
`google/gemini-3.1-pro-preview` wanneer geen `--model` wordt meegegeven.
Wanneer geen `--judge-model` wordt meegegeven, zijn de standaardbeoordelaars
`openai/gpt-5.5,thinking=xhigh,fast` en
`anthropic/claude-opus-4-6,thinking=high`.

## Verwante documentatie

- [Matrix-QA](/nl/concepts/qa-matrix)
- [QA Channel](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
