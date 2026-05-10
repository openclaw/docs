---
read_when:
    - OpenClaw voor het eerst instellen
    - Zoeken naar veelvoorkomende configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratieoverzicht: veelvoorkomende taken, snelle configuratie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-05-10T19:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`.
Het actieve configuratiepad moet een regulier bestand zijn. Symlinked `openclaw.json`-
lay-outs worden niet ondersteund voor schrijfbewerkingen die eigendom zijn van OpenClaw; een atomische schrijfbewerking kan
het pad vervangen in plaats van de symlink te behouden. Als je de configuratie buiten de
standaard statusmap bewaart, wijs `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het echte bestand.

Als het bestand ontbreekt, gebruikt OpenClaw veilige standaardwaarden. Veelvoorkomende redenen om een configuratie toe te voegen:

- Kanalen verbinden en bepalen wie de bot berichten kan sturen
- Modellen, tools, sandboxing of automatisering instellen (cron, hooks)
- Sessies, media, netwerk of UI afstemmen

Zie de [volledige referentie](/nl/gateway/configuration-reference) voor elk beschikbaar veld.

Agenten en automatisering moeten `config.schema.lookup` gebruiken voor exacte documentatie
op veldniveau voordat ze configuratie bewerken. Gebruik deze pagina voor taakgerichte richtlijnen en
[Configuratiereferentie](/nl/gateway/configuration-reference) voor de bredere
veldenkaart en standaardwaarden.

<Tip>
**Nieuw met configuratie?** Begin met `openclaw onboard` voor interactieve installatie, of bekijk de gids [Configuratievoorbeelden](/nl/gateway/configuration-examples) voor volledige copy-paste-configuraties.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Open [http://127.0.0.1:18789](http://127.0.0.1:18789) en gebruik het tabblad **Config**.
    De Control UI rendert een formulier vanuit het live configuratieschema, inclusief
    documentatiemetadata voor de velden `title` / `description`, plus Plugin- en kanaalschema's wanneer
    beschikbaar, met een **Raw JSON**-editor als uitweg. Voor doorklik-
    UI's en andere tooling biedt de Gateway ook `config.schema.lookup` om
    een schemaknooppunt met padbereik plus samenvattingen van directe onderliggende items op te halen.
  </Tab>
  <Tab title="Direct edit">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig met het schema overeenkomen. Onbekende sleutels, verkeerd gevormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op rootniveau is `$schema` (string), zodat editors JSON Schema-metadata kunnen koppelen.
</Warning>

`openclaw config schema` print het canonieke JSON Schema dat door Control UI
en validatie wordt gebruikt. `config.schema.lookup` haalt één knooppunt met padbereik op plus
samenvattingen van onderliggende items voor doorklik-tooling. Documentatiemetadata voor velden `title`/`description`
wordt doorgegeven via geneste objecten, wildcard (`*`), array-item (`[]`) en `anyOf`/
`oneOf`/`allOf`-takken. Runtime Plugin- en kanaalschema's worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer validatie mislukt:

- De Gateway start niet op
- Alleen diagnostische opdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om de exacte problemen te zien
- Voer `openclaw doctor --fix` (of `--yes`) uit om reparaties toe te passen

De Gateway bewaart na elke succesvolle start een vertrouwde laatst bekende werkende kopie,
maar start en hot reload herstellen die niet automatisch. Als `openclaw.json`
validatie niet doorstaat (inclusief Plugin-lokale validatie), mislukt het starten van de Gateway of
wordt de herlaadactie overgeslagen en behoudt de huidige runtime de laatst geaccepteerde configuratie.
Voer `openclaw doctor --fix` (of `--yes`) uit om configuratie met prefixes/overschrijvingen te repareren of
de laatst bekende werkende kopie te herstellen. Promotie naar laatst bekende werkende configuratie wordt overgeslagen wanneer een
kandidaat geredigeerde geheime placeholders bevat, zoals `***`.

## Veelvoorkomende taken

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Elk kanaal heeft zijn eigen configuratiesectie onder `channels.<provider>`. Zie de speciale kanaalpagina voor installatiestappen:

    - [WhatsApp](/nl/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/nl/channels/telegram) - `channels.telegram`
    - [Discord](/nl/channels/discord) - `channels.discord`
    - [Feishu](/nl/channels/feishu) - `channels.feishu`
    - [Google Chat](/nl/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/nl/channels/msteams) - `channels.msteams`
    - [Slack](/nl/channels/slack) - `channels.slack`
    - [Signal](/nl/channels/signal) - `channels.signal`
    - [iMessage](/nl/channels/imessage) - `channels.imessage`
    - [Mattermost](/nl/channels/mattermost) - `channels.mattermost`

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

  <Accordion title="Choose and configure models">
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

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als de allowlist voor `/model`; `provider/*`-items filteren `/model`, `/models` en modelkiezers tot geselecteerde providers, terwijl ze nog steeds dynamische modelontdekking gebruiken.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om allowlist-items toe te voegen zonder bestaande modellen te verwijderen. Gewone vervangingen die items zouden verwijderen, worden geweigerd tenzij je `--replace` doorgeeft.
    - Modelverwijzingen gebruiken de indeling `provider/model` (bijv. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` regelt het verkleinen van transcript-/toolafbeeldingen (standaard `1200`); lagere waarden verminderen meestal het gebruik van vision-tokens bij runs met veel screenshots.
    - Zie [Models CLI](/nl/concepts/models) voor het wisselen van modellen in chat en [Model Failover](/nl/concepts/model-failover) voor auth-rotatie en fallback-gedrag.
    - Voor aangepaste/zelf gehoste providers, zie [Aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie.

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM-toegang wordt per kanaal beheerd via `dmPolicy`:

    - `"pairing"` (standaard): onbekende afzenders krijgen een eenmalige koppelcode om goed te keuren
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde allow-store)
    - `"open"`: alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` + `groupAllowFrom` of kanaalspecifieke allowlists.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Groepsberichten vereisen standaard een **vermelding**. Configureer triggerpatronen per agent, en houd zichtbare kamerantwoorden op het standaard bericht-toolpad tenzij je bewust oude automatische eindantwoorden wilt:

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
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan bericht-toolverzendingen globaal vereisen; `messages.groupChat.visibleReplies` overschrijft dat voor groepen/kanalen.
    - Zie [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor modi voor zichtbare antwoorden, overschrijvingen per kanaal en zelfchatmodus.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Gebruik `agents.defaults.skills` voor een gedeelde basislijn en overschrijf daarna specifieke
    agenten met `agents.list[].skills`:

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

    - Laat `agents.defaults.skills` weg voor standaard onbeperkte Skills.
    - Laat `agents.list[].skills` weg om de standaardwaarden te erven.
    - Stel `agents.list[].skills: []` in voor geen Skills.
    - Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en
      de [Configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Bepaal hoe agressief de gateway kanalen herstart die verouderd lijken:

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

    - Stel `gateway.channelHealthCheckMinutes: 0` in om health-monitor-herstarts globaal uit te schakelen.
    - `channelStaleEventThresholdMinutes` moet groter zijn dan of gelijk zijn aan het controle-interval.
    - Gebruik `channels.<provider>.healthMonitor.enabled` of `channels.<provider>.accounts.<id>.healthMonitor.enabled` om automatische herstarts voor één kanaal of account uit te schakelen zonder de globale monitor uit te schakelen.
    - Zie [Health Checks](/nl/gateway/health) voor operationeel debuggen en de [volledige referentie](/nl/gateway/configuration-reference#gateway) voor alle velden.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
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
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft nog steeds voorrang voor eenmalige service- of shell-overschrijvingen.
    - Los bij voorkeur eerst startup-/event-loop-stalls op; deze knop is bedoeld voor hosts die gezond zijn maar traag tijdens het opwarmen.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Sessies regelen gesprekscontinuiteit en isolatie:

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
    - `threadBindings`: globale standaardwaarden voor sessieroutering die aan threads is gebonden (Discord ondersteunt `/focus`, `/unfocus`, `/agents`, `/session idle` en `/session max-age`).
    - Zie [Sessiebeheer](/nl/concepts/session) voor scoping, identiteitskoppelingen en verzendbeleid.
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

    Bouw eerst de image - voer vanuit een broncheckout `scripts/sandbox-setup.sh` uit, of zie vanuit een npm-installatie de inline `docker build`-opdracht in [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige handleiding en [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Relay-ondersteunde push inschakelen voor officiele iOS-builds">
    Relay-ondersteunde push wordt geconfigureerd in `openclaw.json`.

    Stel dit in de gatewayconfiguratie in:

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

    - Laat de gateway `push.test`, wake-nudges en reconnect-wakes via de externe relay verzenden.
    - Gebruikt een registratie-gebonden verzendmachtiging die door de gekoppelde iOS-app wordt doorgestuurd. De gateway heeft geen implementatiebrede relay-token nodig.
    - Bindt elke relay-ondersteunde registratie aan de gatewayidentiteit waarmee de iOS-app is gekoppeld, zodat een andere gateway de opgeslagen registratie niet opnieuw kan gebruiken.
    - Houdt lokale/handmatige iOS-builds op directe APNs. Relay-ondersteunde verzendingen gelden alleen voor officieel gedistribueerde builds die via de relay zijn geregistreerd.
    - Moet overeenkomen met de relay-basis-URL die in de officiele/TestFlight iOS-build is ingebakken, zodat registratie- en verzendverkeer dezelfde relay-implementatie bereiken.

    End-to-end-flow:

    1. Installeer een officiele/TestFlight iOS-build die met dezelfde relay-basis-URL is gecompileerd.
    2. Configureer `gateway.push.apns.relay.baseUrl` op de gateway.
    3. Koppel de iOS-app aan de gateway en laat zowel node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de gatewayidentiteit op, registreert zich bij de relay met App Attest plus de appreceipt en publiceert daarna de relay-ondersteunde `push.apns.register`-payload naar de gekoppelde gateway.
    5. De gateway slaat de relay-handle en verzendmachtiging op en gebruikt ze daarna voor `push.test`, wake-nudges en reconnect-wakes.

    Operationele opmerkingen:

    - Als je de iOS-app naar een andere gateway omschakelt, verbind de app dan opnieuw zodat deze een nieuwe relayregistratie kan publiceren die aan die gateway is gebonden.
    - Als je een nieuwe iOS-build verzendt die naar een andere relay-implementatie verwijst, vernieuwt de app de gecachete relayregistratie in plaats van de oude relay-oorsprong opnieuw te gebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` werken nog steeds als tijdelijke omgevingsoverschrijvingen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een local loopback-ontwikkeluitweg; sla geen HTTP-relay-URL's blijvend op in configuratie.

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
    - `directPolicy`: `allow` (standaard) of `block` voor DM-achtige heartbeatdoelen
    - Zie [Heartbeat](/nl/gateway/heartbeat) voor de volledige handleiding.

  </Accordion>

  <Accordion title="Cron-taken configureren">
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
    - Zie [Cron-taken](/nl/automation/cron-jobs) voor een functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Webhooks instellen (hooks)">
    Schakel HTTP-webhookeindpunten in op de Gateway:

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
    - Behandel alle hook-/webhookpayloadinhoud als niet-vertrouwde invoer.
    - Gebruik een speciale `hooks.token`; hergebruik de gedeelde Gateway-token niet.
    - Hookauthenticatie werkt alleen via headers (`Authorization: Bearer ...` of `x-openclaw-token`); querystringtokens worden geweigerd.
    - `hooks.path` mag niet `/` zijn; houd webhookingress op een speciaal subpad zoals `/hooks`.
    - Houd bypassvlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), behalve bij strikt afgebakende debugging.
    - Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door de aanroeper gekozen sessiesleutels te begrenzen.
    - Geef voor hook-gestuurde agents de voorkeur aan sterke moderne modelniveaus en strikt toolbeleid (bijvoorbeeld alleen messaging plus waar mogelijk sandboxing).

    Zie [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle mappingopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Multi-agentrouting configureren">
    Voer meerdere geisoleerde agents uit met aparte workspaces en sessies:

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

  <Accordion title="Configuratie splitsen over meerdere bestanden ($include)">
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
    - **Array van bestanden**: in volgorde diep samengevoegd (latere wint)
    - **Sibling keys**: samengevoegd na includes (overschrijven geinclude waarden)
    - **Geneste includes**: ondersteund tot 10 niveaus diep
    - **Relatieve paden**: opgelost relatief aan het includende bestand
    - **OpenClaw-owned writes**: wanneer een schrijfactie slechts een top-level sectie wijzigt
      die wordt ondersteund door een single-file include zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat geinclude bestand bij en laat `openclaw.json` intact
    - **Niet-ondersteunde write-through**: root-includes, include-arrays en includes
      met sibling-overschrijvingen falen gesloten voor OpenClaw-owned writes in plaats van
      de configuratie af te vlakken
    - **Inperking**: `$include`-paden moeten uitkomen onder de directory die
      `openclaw.json` bevat. Om een boomstructuur tussen machines of gebruikers te delen, stel
      `OPENCLAW_INCLUDE_ROOTS` in op een padenlijst (`:` op POSIX, `;` op Windows) met
      extra directories waarnaar includes mogen verwijzen. Symlinks worden opgelost
      en opnieuw gecontroleerd, dus een pad dat lexicaal in een configuratiedirectory staat maar waarvan
      het echte doel buiten elke toegestane root valt, wordt nog steeds geweigerd.
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parsefouten en circulaire includes

  </Accordion>
</AccordionGroup>

## Configuratie-hot reload

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe - voor de meeste instellingen is geen handmatige herstart nodig.

Directe bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze valideren. De watcher wacht
tot editor-temp-write-/rename-activiteit is gestabiliseerd, leest het uiteindelijke bestand en weigert
ongeldige externe bewerkingen zonder `openclaw.json` te herschrijven. OpenClaw-owned configuratie
schrijfacties gebruiken dezelfde schemagate voordat ze schrijven; destructieve overschrijvingen zoals
het laten vallen van `gateway.mode` of het met meer dan de helft verkleinen van het bestand worden geweigerd en
opgeslagen als `.rejected.*` voor inspectie.

Als je `config reload skipped (invalid config)` ziet of de startup `Invalid
config` meldt, inspecteer dan de configuratie, voer `openclaw config validate` uit en voer daarna `openclaw
doctor --fix` uit voor reparatie. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config)
voor de checklist.

### Herlaadmodi

| Modus                  | Gedrag                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (standaard) | Past veilige wijzigingen direct hot toe. Herstart automatisch voor kritieke wijzigingen. |
| **`hot`**              | Past alleen veilige wijzigingen hot toe. Logt een waarschuwing wanneer een herstart nodig is - jij handelt dit af. |
| **`restart`**          | Herstart de Gateway bij elke configuratiewijziging, veilig of niet.                     |
| **`off`**              | Schakelt bestandsbewaking uit. Wijzigingen worden van kracht bij de volgende handmatige herstart. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Wat hot wordt toegepast versus wat een herstart vereist

De meeste velden worden hot toegepast zonder downtime. In `hybrid`-modus worden wijzigingen die een herstart vereisen automatisch afgehandeld.

| Categorie          | Velden                                                            | Herstart nodig? |
| ------------------ | ----------------------------------------------------------------- | --------------- |
| Kanalen            | `channels.*`, `web` (WhatsApp) - alle ingebouwde en plugin-kanalen | Nee             |
| Agent en modellen  | `agent`, `agents`, `models`, `routing`                            | Nee             |
| Automatisering     | `hooks`, `cron`, `agent.heartbeat`                                | Nee             |
| Sessies en berichten | `session`, `messages`                                           | Nee             |
| Tools en media     | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nee             |
| UI en overig       | `ui`, `logging`, `identity`, `bindings`                           | Nee             |
| Gatewayserver      | `gateway.*` (poort, bind, auth, tailscale, TLS, HTTP)             | **Ja**          |
| Infrastructuur     | `discovery`, `plugins`                                            | **Ja**          |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen - als je ze wijzigt, wordt er **geen** herstart geactiveerd.
</Note>

### Herlaadplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
het herladen vanuit de door de bron geschreven indeling, niet vanuit de afgeplatte weergave in het geheugen.
Daardoor blijven beslissingen voor hot-reload (hot-apply versus herstart) voorspelbaar, zelfs wanneer een
enkele sectie op topniveau in een eigen opgenomen bestand staat, zoals
`plugins: { $include: "./plugins.json5" }`. Herlaadplanning faalt gesloten als de
bronindeling dubbelzinnig is.

## Configuratie-RPC (programmatische updates)

Gebruik voor tooling die configuratie schrijft via de Gateway-API bij voorkeur deze flow:

- `config.schema.lookup` om één subtree te inspecteren (ondiep schemaknooppunt + onderliggende
  samenvattingen)
- `config.get` om de huidige snapshot plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON merge patch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen)
- `config.apply` alleen wanneer je de volledige configuratie wilt vervangen
- `update.run` voor expliciete zelfupdate plus herstart; neem `continuationMessage` op wanneer de sessie na de herstart één vervolgronde moet uitvoeren
- `update.status` om de nieuwste update-herstartsentinel te inspecteren en de actieve versie na een herstart te verifiëren

Agents moeten `config.schema.lookup` behandelen als de eerste plek voor exacte
documentatie en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze de bredere configuratiekaart, standaardwaarden of links naar specifieke
subsystemreferenties nodig hebben.

<Note>
Control-plane-schrijfacties (`config.apply`, `config.patch`, `update.run`) zijn
rate-limited tot 3 aanvragen per 60 seconden per `deviceId+clientIp`. Herstartaanvragen
worden samengevoegd en dwingen daarna een cooldown van 30 seconden af tussen herstartcycli.
`update.status` is alleen-lezen, maar admin-scoped omdat de herstartsentinel
samenvattingen van updatestappen en staarten van opdrachtuitvoer kan bevatten.
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
`note` en `restartDelayMs`. `baseHash` is vereist voor beide methoden wanneer er al een
configuratie bestaat.

## Omgevingsvariabelen

OpenClaw leest env vars uit het bovenliggende proces plus:

- `.env` uit de huidige werkdirectory (indien aanwezig)
- `~/.openclaw/.env` (globale fallback)

Geen van beide bestanden overschrijft bestaande env vars. Je kunt ook inline env vars instellen in de configuratie:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-env importeren (optioneel)">
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

<Accordion title="Env var-substitutie in configuratiewaarden">
  Verwijs naar env vars in elke configuratiestringwaarde met `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regels:

- Alleen hoofdletternamen komen overeen: `[A-Z_][A-Z0-9_]*`
- Ontbrekende/lege vars veroorzaken een fout tijdens het laden
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

SecretRef-details (inclusief `secrets.providers` voor `env`/`file`/`exec`) staan in [Geheimenbeheer](/nl/gateway/secrets).
Ondersteunde credential-paden staan vermeld in [SecretRef-credentialoppervlak](/nl/reference/secretref-credential-surface).
</Accordion>

Zie [Omgeving](/nl/help/environment) voor volledige prioriteit en bronnen.

## Volledige referentie

Zie **[Configuratiereferentie](/nl/gateway/configuration-reference)** voor de volledige referentie per veld.

---

_Gerelateerd: [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Configuratiereferentie](/nl/gateway/configuration-reference) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
- [Gateway-runbook](/nl/gateway)
