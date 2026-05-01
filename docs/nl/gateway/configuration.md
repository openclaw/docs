---
read_when:
    - OpenClaw voor het eerst instellen
    - Zoeken naar veelvoorkomende configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratieoverzicht: veelvoorkomende taken, snelle configuratie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-05-01T11:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6697f8800f29fbdf369f95bd442842d0bb6a341dcf8efa4698a2f43c8acc8981
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 ondersteunt opmerkingen en afsluitende komma's">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`.
Het actieve configuratiepad moet een normaal bestand zijn. Gesymlinkte `openclaw.json`-indelingen
worden niet ondersteund voor schrijfacties die OpenClaw beheert; een atomische schrijfactie kan
het pad vervangen in plaats van de symlink te behouden. Als je configuratie buiten de
standaard statusdirectory bewaart, wijs `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het echte bestand.

Als het bestand ontbreekt, gebruikt OpenClaw veilige standaardwaarden. Veelvoorkomende redenen om een configuratie toe te voegen:

- Kanalen verbinden en bepalen wie de bot berichten mag sturen
- Modellen, tools, sandboxing of automatisering instellen (cron, hooks)
- Sessies, media, netwerken of UI afstemmen

Zie de [volledige referentie](/nl/gateway/configuration-reference) voor elk beschikbaar veld.

Agents en automatisering moeten `config.schema.lookup` gebruiken voor exacte documentatie
op veldniveau voordat ze configuratie bewerken. Gebruik deze pagina voor taakgerichte richtlijnen en
[Configuratiereferentie](/nl/gateway/configuration-reference) voor de bredere
veldkaart en standaardwaarden.

<Tip>
**Nieuw met configuratie?** Begin met `openclaw onboard` voor interactieve installatie, of bekijk de gids [Configuratievoorbeelden](/nl/gateway/configuration-examples) voor volledige configuraties die je kunt kopiëren en plakken.
</Tip>

## Minimale configuratie

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Configuratie bewerken

<Tabs>
  <Tab title="Interactieve wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (eenregelige opdrachten)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Controle-UI">
    Open [http://127.0.0.1:18789](http://127.0.0.1:18789) en gebruik het tabblad **Config**.
    De Controle-UI rendert een formulier vanuit het live configuratieschema, inclusief
    documentatiemetadata voor `title` / `description` van velden plus Plugin- en kanaalschema's wanneer
    beschikbaar, met een **Raw JSON**-editor als uitweg. Voor drilldown-
    UI's en andere tooling stelt de gateway ook `config.schema.lookup` beschikbaar om
    één padgebonden schemaknooppunt plus samenvattingen van directe kinderen op te halen.
  </Tab>
  <Tab title="Direct bewerken">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig met het schema overeenkomen. Onbekende sleutels, verkeerd gevormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op rootniveau is `$schema` (string), zodat editors JSON Schema-metadata kunnen koppelen.
</Warning>

`openclaw config schema` drukt het canonieke JSON Schema af dat door de Controle-UI
en validatie wordt gebruikt. `config.schema.lookup` haalt één padgebonden knooppunt plus
samenvattingen van kinderen op voor drilldown-tooling. Documentatiemetadata voor velden `title`/`description`
wordt doorgegeven via geneste objecten, wildcard (`*`), array-item (`[]`) en `anyOf`/
`oneOf`/`allOf`-takken. Runtime Plugin- en kanaalschema's worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer validatie mislukt:

- De Gateway start niet op
- Alleen diagnostische opdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om de exacte problemen te bekijken
- Voer `openclaw doctor --fix` (of `--yes`) uit om reparaties toe te passen

De Gateway bewaart na elke succesvolle start een vertrouwde laatst-goed-bekende kopie.
Als `openclaw.json` later niet door validatie komt (of `gateway.mode` laat vallen, sterk
krimpt, of een verdwaalde logregel vooraan heeft staan), bewaart OpenClaw het kapotte bestand
als `.clobbered.*`, herstelt de laatst-goed-bekende kopie en logt de herstelreden.
De volgende agentbeurt ontvangt ook een systeemgebeurteniswaarschuwing zodat de hoofdagent
de herstelde configuratie niet blind herschrijft. Promotie naar laatst-goed-bekend
wordt overgeslagen wanneer een kandidaat geredigeerde geheime placeholders bevat, zoals `***`.
Wanneer elk validatieprobleem is beperkt tot `plugins.entries.<id>...`, voert OpenClaw
geen herstel van het hele bestand uit. Het houdt de huidige configuratie actief en
toont de Plugin-lokale fout, zodat een mismatch tussen een Plugin-schema of hostversie
niet ongerelateerde gebruikersinstellingen kan terugdraaien.

## Veelvoorkomende taken

<AccordionGroup>
  <Accordion title="Een kanaal instellen (WhatsApp, Telegram, Discord, enz.)">
    Elk kanaal heeft zijn eigen configuratiesectie onder `channels.<provider>`. Zie de specifieke kanaalpagina voor installatiestappen:

    - [WhatsApp](/nl/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/nl/channels/telegram) — `channels.telegram`
    - [Discord](/nl/channels/discord) — `channels.discord`
    - [Feishu](/nl/channels/feishu) — `channels.feishu`
    - [Google Chat](/nl/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/nl/channels/msteams) — `channels.msteams`
    - [Slack](/nl/channels/slack) — `channels.slack`
    - [Signal](/nl/channels/signal) — `channels.signal`
    - [iMessage](/nl/channels/imessage) — `channels.imessage`
    - [Mattermost](/nl/channels/mattermost) — `channels.mattermost`

    Alle kanalen delen hetzelfde DM-beleidspatroon:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modellen kiezen en configureren">
    Stel het primaire model en optionele fallbacks in:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als allowlist voor `/model`.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om allowlist-items toe te voegen zonder bestaande modellen te verwijderen. Platte vervangingen die items zouden verwijderen, worden geweigerd tenzij je `--replace` meegeeft.
    - Modelverwijzingen gebruiken de indeling `provider/model` (bijv. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` regelt het verkleinen van transcript-/toolafbeeldingen (standaard `1200`); lagere waarden verminderen meestal het gebruik van vision-tokens bij runs met veel screenshots.
    - Zie [Modellen-CLI](/nl/concepts/models) voor het wisselen van modellen in chat en [Model-failover](/nl/concepts/model-failover) voor auth-rotatie en fallbackgedrag.
    - Voor aangepaste/zelfgehoste providers, zie [Aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie.

  </Accordion>

  <Accordion title="Bepalen wie de bot berichten mag sturen">
    DM-toegang wordt per kanaal geregeld via `dmPolicy`:

    - `"pairing"` (standaard): onbekende afzenders krijgen een eenmalige koppelcode voor goedkeuring
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde allow-opslag)
    - `"open"`: alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` + `groupAllowFrom` of kanaalspecifieke allowlists.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Vermeldingspoortwachting voor groepschat instellen">
    Groepsberichten zijn standaard ingesteld op **vermelding vereist**. Configureer triggerpatronen per agent en houd zichtbare kamerantwoorden op het standaardpad van de berichtentool tenzij je bewust verouderde automatische eindantwoorden wilt:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadatavermeldingen**: native @-vermeldingen (WhatsApp tik-om-te-vermelden, Telegram @bot, enz.)
    - **Tekstpatronen**: veilige regex-patronen in `mentionPatterns`
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan wereldwijd verzendingen via de berichtentool vereisen; `messages.groupChat.visibleReplies` overschrijft dat voor groepen/kanalen.
    - Zie [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor modi voor zichtbare antwoorden, overschrijvingen per kanaal en zelfchatmodus.

  </Accordion>

  <Accordion title="Skills per agent beperken">
    Gebruik `agents.defaults.skills` voor een gedeelde basislijn en overschrijf daarna specifieke
    agents met `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Laat `agents.defaults.skills` weg voor standaard onbeperkte skills.
    - Laat `agents.list[].skills` weg om de standaardwaarden te erven.
    - Stel `agents.list[].skills: []` in voor geen skills.
    - Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config), en
      de [Configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Kanaalgezondheidsbewaking van de Gateway afstemmen">
    Regel hoe agressief de gateway kanalen herstart die verouderd lijken:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Stel `gateway.channelHealthCheckMinutes: 0` in om herstarts door gezondheidsbewaking wereldwijd uit te schakelen.
    - `channelStaleEventThresholdMinutes` moet groter zijn dan of gelijk zijn aan het controle-interval.
    - Gebruik `channels.<provider>.healthMonitor.enabled` of `channels.<provider>.accounts.<id>.healthMonitor.enabled` om automatische herstarts voor één kanaal of account uit te schakelen zonder de globale bewaking uit te schakelen.
    - Zie [Gezondheidscontroles](/nl/gateway/health) voor operationele debugging en de [volledige referentie](/nl/gateway/configuration-reference#gateway) voor alle velden.

  </Accordion>

  <Accordion title="Gateway WebSocket-handshake-time-out afstemmen">
    Geef lokale clients meer tijd om de pre-auth WebSocket-handshake te voltooien op
    belaste of energiezuinige hosts:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standaard is `15000` milliseconden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` blijft voorrang houden voor eenmalige service- of shelloverschrijvingen.
    - Los bij voorkeur eerst startup-/event-loop-haperingen op; deze knop is bedoeld voor hosts die gezond maar traag zijn tijdens het opwarmen.

  </Accordion>

  <Accordion title="Sessies en resets configureren">
    Sessies regelen gesprekscontinuïteit en isolatie:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
```

    - `dmScope`: `main` (gedeeld) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale standaardwaarden voor thread-gebonden sessieroutering (Discord ondersteunt `/focus`, `/unfocus`, `/agents`, `/session idle` en `/session max-age`).
    - Zie [Sessiebeheer](/nl/concepts/session) voor scope, identiteitskoppelingen en verzendbeleid.
    - Zie [volledige referentie](/nl/gateway/config-agents#session) voor alle velden.

  </Accordion>

  <Accordion title="Sandboxing inschakelen">
    Voer agentsessies uit in geisoleerde sandboxruntimes:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Bouw eerst de image — voer vanuit een source-checkout `scripts/sandbox-setup.sh` uit, of zie vanuit een npm-installatie de inline `docker build`-opdracht in [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige gids en [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Relay-ondersteunde push inschakelen voor officiele iOS-builds">
    Relay-ondersteunde push wordt geconfigureerd in `openclaw.json`.

    Stel dit in de Gateway-configuratie in:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI-equivalent:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Wat dit doet:

    - Laat de Gateway `push.test`, wake-nudges en reconnect-wakes via de externe relay verzenden.
    - Gebruikt een verzendgrant met registratiescope die wordt doorgestuurd door de gekoppelde iOS-app. De Gateway heeft geen deployment-breed relaytoken nodig.
    - Koppelt elke relay-ondersteunde registratie aan de Gateway-identiteit waarmee de iOS-app is gekoppeld, zodat een andere Gateway de opgeslagen registratie niet kan hergebruiken.
    - Houdt lokale/handmatige iOS-builds op directe APNs. Relay-ondersteunde verzendingen gelden alleen voor officiele gedistribueerde builds die via de relay zijn geregistreerd.
    - Moet overeenkomen met de relay-basis-URL die in de officiele/TestFlight-iOS-build is ingebouwd, zodat registratie- en verzendverkeer dezelfde relaydeployment bereiken.

    End-to-end-flow:

    1. Installeer een officiele/TestFlight-iOS-build die met dezelfde relay-basis-URL is gecompileerd.
    2. Configureer `gateway.push.apns.relay.baseUrl` op de Gateway.
    3. Koppel de iOS-app aan de Gateway en laat zowel node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de Gateway-identiteit op, registreert zich bij de relay met App Attest plus de app-receipt, en publiceert daarna de relay-ondersteunde `push.apns.register`-payload naar de gekoppelde Gateway.
    5. De Gateway slaat de relayhandle en verzendgrant op en gebruikt die daarna voor `push.test`, wake-nudges en reconnect-wakes.

    Operationele opmerkingen:

    - Als je de iOS-app naar een andere Gateway overschakelt, verbind de app dan opnieuw zodat deze een nieuwe relayregistratie kan publiceren die aan die Gateway is gekoppeld.
    - Als je een nieuwe iOS-build uitbrengt die naar een andere relaydeployment verwijst, vernieuwt de app de gecachete relayregistratie in plaats van de oude relayorigin te hergebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` werken nog steeds als tijdelijke env-overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een ontwikkelingsnooduitgang die alleen voor loopback geldt; sla HTTP-relay-URL's niet blijvend op in de configuratie.

    Zie [iOS-app](/nl/platforms/ios#relay-backed-push-for-official-builds) voor de end-to-end-flow en [Authenticatie- en vertrouwensflow](/nl/platforms/ios#authentication-and-trust-flow) voor het relaybeveiligingsmodel.

  </Accordion>

  <Accordion title="Heartbeat instellen (periodieke check-ins)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: duurstring (`30m`, `2h`). Stel `0m` in om uit te schakelen.
    - `target`: `last` | `none` | `<channel-id>` (bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`)
    - `directPolicy`: `allow` (standaard) of `block` voor DM-achtige Heartbeat-doelen
    - Zie [Heartbeat](/nl/gateway/heartbeat) voor de volledige gids.

  </Accordion>

  <Accordion title="Cronjobs configureren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: verwijder voltooide geisoleerde runsessies uit `sessions.json` (standaard `24h`; stel `false` in om uit te schakelen).
    - `runLog`: snoei `cron/runs/<jobId>.jsonl` op grootte en behouden regels.
    - Zie [Cronjobs](/nl/automation/cron-jobs) voor functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Webhooks instellen (hooks)">
    Schakel HTTP-Webhook-eindpunten in op de Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Beveiligingsopmerking:
    - Behandel alle hook-/Webhook-payloadinhoud als niet-vertrouwde invoer.
    - Gebruik een toegewezen `hooks.token`; hergebruik het gedeelde Gateway-token niet.
    - Hook-authenticatie werkt alleen via headers (`Authorization: Bearer ...` of `x-openclaw-token`); querystringtokens worden geweigerd.
    - `hooks.path` kan niet `/` zijn; houd Webhook-ingress op een toegewezen subpad zoals `/hooks`.
    - Houd bypassvlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), tenzij je nauw afgebakend debugt.
    - Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door callers gekozen sessiesleutels te begrenzen.
    - Gebruik voor hook-gestuurde agents bij voorkeur sterke moderne modeltiers en strikt toolbeleid (bijvoorbeeld alleen messaging plus sandboxing waar mogelijk).

    Zie [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle mappingopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Multi-agentroutering configureren">
    Voer meerdere geisoleerde agents uit met afzonderlijke workspaces en sessies:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Zie [Multi-Agent](/nl/concepts/multi-agent) en [volledige referentie](/nl/gateway/config-agents#multi-agent-routing) voor bindingsregels en toegangprofielen per agent.

  </Accordion>

  <Accordion title="Configuratie opsplitsen in meerdere bestanden ($include)">
    Gebruik `$include` om grote configuraties te organiseren:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Enkel bestand**: vervangt het bevattende object
    - **Array van bestanden**: deep-merged op volgorde (later wint)
    - **Sibling keys**: samengevoegd na includes (overschrijven opgenomen waarden)
    - **Geneste includes**: ondersteund tot 10 niveaus diep
    - **Relatieve paden**: opgelost relatief aan het includende bestand
    - **OpenClaw-owned writes**: wanneer een write slechts een top-level sectie wijzigt
      die wordt ondersteund door een single-file include zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat included bestand bij en laat `openclaw.json` intact
    - **Niet-ondersteunde write-through**: root-includes, include-arrays en includes
      met sibling-overrides falen gesloten voor OpenClaw-owned writes in plaats van
      de configuratie af te vlakken
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parsefouten en circulaire includes

  </Accordion>
</AccordionGroup>

## Hot reload van configuratie

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe — voor de meeste instellingen is geen handmatige herstart nodig.

Directe bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze valideren. De watcher wacht
tot temp-write-/rename-activiteit van de editor is gestabiliseerd, leest het uiteindelijke bestand en weigert
ongeldige externe bewerkingen door de laatst bekende goede configuratie te herstellen. OpenClaw-owned
configuratiewrites gebruiken dezelfde schemagate voordat ze schrijven; destructieve overschrijvingen zoals
het verwijderen van `gateway.mode` of het verkleinen van het bestand met meer dan de helft worden geweigerd
en opgeslagen als `.rejected.*` voor inspectie.

Plugin-lokale validatiefouten zijn de uitzondering: als alle issues onder
`plugins.entries.<id>...` vallen, behoudt reload de huidige configuratie en meldt het Plugin-issue
in plaats van `.last-good` te herstellen.

Als je `Config auto-restored from last-known-good` of
`config reload restored last-known-good config` in logs ziet, inspecteer dan het bijbehorende
`.clobbered.*`-bestand naast `openclaw.json`, herstel de geweigerde payload en voer daarna
`openclaw config validate` uit. Zie [Gateway-troubleshooting](/nl/gateway/troubleshooting#gateway-restored-last-known-good-config)
voor de herstelchecklist.

### Reloadmodi

| Modus                  | Gedrag                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (standaard) | Past veilige wijzigingen direct hot toe. Herstart automatisch voor kritieke wijzigingen. |
| **`hot`**              | Past alleen veilige wijzigingen hot toe. Logt een waarschuwing wanneer een herstart nodig is — jij handelt die af. |
| **`restart`**          | Herstart de Gateway bij elke configuratiewijziging, veilig of niet.                     |
| **`off`**              | Schakelt bestandsbewaking uit. Wijzigingen worden van kracht bij de volgende handmatige herstart. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Wat hot wordt toegepast versus wat een herstart nodig heeft

De meeste velden worden hot toegepast zonder downtime. In `hybrid`-modus worden wijzigingen die een herstart vereisen automatisch afgehandeld.

| Categorie           | Velden                                                            | Herstart nodig? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanalen             | `channels.*`, `web` (WhatsApp) — alle ingebouwde en pluginkanalen | Nee             |
| Agent en modellen   | `agent`, `agents`, `models`, `routing`                            | Nee             |
| Automatisering      | `hooks`, `cron`, `agent.heartbeat`                                | Nee             |
| Sessies en berichten | `session`, `messages`                                             | Nee             |
| Tools en media      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nee             |
| UI en overig        | `ui`, `logging`, `identity`, `bindings`                           | Nee             |
| Gateway-server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ja**          |
| Infrastructuur      | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen — het wijzigen ervan triggert **geen** herstart.
</Note>

### Reloadplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
de herlaadactie vanuit de door de bron geschreven indeling, niet vanuit de afgeplatte
in-memory weergave. Daardoor blijven hot-reload-beslissingen (hot toepassen versus herstarten)
voorspelbaar, zelfs wanneer een enkele top-level sectie in een eigen inbegrepen bestand staat,
zoals `plugins: { $include: "./plugins.json5" }`. Herlaadplanning faalt gesloten als de
bronindeling ambigu is.

## Config-RPC (programmatische updates)

Voor tooling die config schrijft via de Gateway-API, gebruik bij voorkeur deze flow:

- `config.schema.lookup` om één subtree te inspecteren (ondiepe schemanode + child
  samenvattingen)
- `config.get` om de huidige snapshot plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON-mergepatch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen)
- `config.apply` alleen wanneer je de volledige config wilt vervangen
- `update.run` voor expliciete self-update plus herstart
- `update.status` om de nieuwste update-herstartsentinel te inspecteren en de actieve versie na een herstart te verifiëren

Agents moeten `config.schema.lookup` beschouwen als eerste stop voor exacte
documentatie en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze de bredere config-map, standaardwaarden of links naar speciale
subsystemreferenties nodig hebben.

<Note>
Control-plane schrijfacties (`config.apply`, `config.patch`, `update.run`) zijn
rate-limited tot 3 aanvragen per 60 seconden per `deviceId+clientIp`. Herstartaanvragen
worden samengevoegd en dwingen daarna een cooldown van 30 seconden af tussen herstartcycli.
`update.status` is alleen-lezen, maar admin-scoped omdat de herstartsentinel
samenvattingen van updatestappen en staarten van commandouitvoer kan bevatten.
</Note>

Voorbeeld van een gedeeltelijke patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zowel `config.apply` als `config.patch` accepteren `raw`, `baseHash`, `sessionKey`,
`note` en `restartDelayMs`. `baseHash` is vereist voor beide methoden wanneer er
al een config bestaat.

## Omgevingsvariabelen

OpenClaw leest env vars uit het bovenliggende proces plus:

- `.env` uit de huidige werkmap (indien aanwezig)
- `~/.openclaw/.env` (globale fallback)

Geen van beide bestanden overschrijft bestaande env vars. Je kunt ook inline env vars instellen in config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Als dit is ingeschakeld en verwachte sleutels niet zijn ingesteld, voert OpenClaw je login-shell uit en importeert alleen de ontbrekende sleutels:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalent voor env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Verwijs naar env vars in elke stringwaarde in config met `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regels:

- Alleen hoofdletternamen worden gematcht: `[A-Z_][A-Z0-9_]*`
- Ontbrekende/lege vars geven een fout bij het laden
- Escape met `$${VAR}` voor letterlijke uitvoer
- Werkt binnen `$include`-bestanden
- Inline substitutie: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Voor velden die SecretRef-objecten ondersteunen, kun je gebruiken:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef-details (inclusief `secrets.providers` voor `env`/`file`/`exec`) staan in [Secrets Management](/nl/gateway/secrets).
Ondersteunde credential-paden staan vermeld in [SecretRef Credential Surface](/nl/reference/secretref-credential-surface).
</Accordion>

Zie [Omgeving](/nl/help/environment) voor volledige voorrang en bronnen.

## Volledige referentie

Voor de volledige veld-voor-veldreferentie, zie **[Configuratiereferentie](/nl/gateway/configuration-reference)**.

---

_Gerelateerd: [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Configuratiereferentie](/nl/gateway/configuration-reference) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
- [Gateway-runbook](/nl/gateway)
