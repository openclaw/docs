---
read_when:
    - OpenClaw voor het eerst instellen
    - Zoeken naar gangbare configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratie-overzicht: algemene taken, snelle installatie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-06-27T17:32:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`.
Het actieve configuratiepad moet een regulier bestand zijn. Symlinkindelingen voor `openclaw.json`
worden niet ondersteund voor schrijfbewerkingen die eigendom zijn van OpenClaw; een atomische schrijfbewerking kan
het pad vervangen in plaats van de symlink te behouden. Als je configuratie buiten de
standaardstatusmap bewaart, laat `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het echte bestand wijzen.

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
**Nieuw met configuratie?** Begin met `openclaw onboard` voor interactieve installatie, of bekijk de gids [Configuratievoorbeelden](/nl/gateway/configuration-examples) voor complete configuraties die je kunt kopiëren en plakken.
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
    De Control UI rendert een formulier op basis van het live configuratieschema, inclusief veldmetadata
    voor documentatie via `title` / `description`, plus plugin- en kanaalschema's wanneer
    beschikbaar, met een **Raw JSON**-editor als uitweg. Voor drill-down
    UI's en andere tooling stelt de Gateway ook `config.schema.lookup` beschikbaar om
    één padgebonden schemaknooppunt plus directe samenvattingen van onderliggende knooppunten op te halen.
  </Tab>
  <Tab title="Direct edit">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig overeenkomen met het schema. Onbekende sleutels, verkeerd gevormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op rootniveau is `$schema` (string), zodat editors JSON Schema-metadata kunnen koppelen.
</Warning>

`openclaw config schema` print het canonieke JSON Schema dat wordt gebruikt door Control UI
en validatie. `config.schema.lookup` haalt één padgebonden knooppunt plus
samenvattingen van onderliggende knooppunten op voor drill-down-tooling. Documentatiemetadata voor velden via `title`/`description`
wordt doorgegeven via geneste objecten, wildcard- (`*`), array-item- (`[]`) en `anyOf`/
`oneOf`/`allOf`-takken. Runtime plugin- en kanaalschema's worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer validatie mislukt:

- De Gateway start niet op
- Alleen diagnostische opdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om de exacte problemen te zien
- Voer `openclaw doctor --fix` (of `--yes`) uit om reparaties toe te passen

De Gateway bewaart na elke succesvolle start een vertrouwde laatst-bekende-goede kopie,
maar startup en hot reload herstellen die niet automatisch. Als `openclaw.json`
validatie niet doorstaat (inclusief plugin-lokale validatie), mislukt het starten van de Gateway of
wordt de herlaadactie overgeslagen en behoudt de huidige runtime de laatst geaccepteerde configuratie.
Voer `openclaw doctor --fix` (of `--yes`) uit om geprefixte/overschreven configuratie te repareren of
de laatst-bekende-goede kopie te herstellen. Promotie naar laatst-bekende-goed wordt overgeslagen wanneer een
kandidaat geredigeerde geheime placeholders bevat, zoals `***`.

## Veelvoorkomende taken

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Elk kanaal heeft zijn eigen configuratiesectie onder `channels.<provider>`. Zie de specifieke kanaalpagina voor installatiestappen:

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

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als de allowlist voor `/model`; `provider/*`-vermeldingen filteren `/model`, `/models` en modelkiezers tot geselecteerde providers, terwijl dynamische modelontdekking nog steeds wordt gebruikt.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om allowlist-vermeldingen toe te voegen zonder bestaande modellen te verwijderen. Gewone vervangingen die vermeldingen zouden verwijderen, worden geweigerd tenzij je `--replace` meegeeft.
    - Modelreferenties gebruiken de indeling `provider/model` (bijv. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` regelt het verkleinen van transcript-/toolafbeeldingen (standaard `1200`); lagere waarden verminderen meestal het gebruik van vision-tokens bij runs met veel screenshots.
    - Zie [Modellen-CLI](/nl/concepts/models) voor het wisselen van modellen in chat en [Modelfailover](/nl/concepts/model-failover) voor auth-rotatie en fallbackgedrag.
    - Zie voor aangepaste/zelfgehoste providers [Aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie.

  </Accordion>

  <Accordion title="Control who can message the bot">
    DM-toegang wordt per kanaal geregeld via `dmPolicy`:

    - `"pairing"` (standaard): onbekende afzenders krijgen een eenmalige koppelingscode om goed te keuren
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde allow-opslag)
    - `"open"`: alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` + `groupAllowFrom` of kanaalspecifieke allowlists.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Groepsberichten vereisen standaard een **vermelding**. Configureer triggerpatronen per agent. Normale groeps-/kanaalantwoorden worden automatisch geplaatst; kies expliciet voor het berichttoolpad voor gedeelde ruimtes waar de agent moet beslissen wanneer hij spreekt:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan berichttoolverzendingen globaal vereisen; `messages.groupChat.visibleReplies` overschrijft dat voor groepen/kanalen.
    - Zie de [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor zichtbare antwoordmodi, overschrijvingen per kanaal en zelfchatmodus.

  </Accordion>

  <Accordion title="Restrict skills per agent">
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
    - Zie [Statuscontroles](/nl/gateway/health) voor operationele debugging en de [volledige referentie](/nl/gateway/configuration-reference#gateway) voor alle velden.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Geef lokale clients meer tijd om de pre-auth WebSocket-handshake te voltooien op
    belaste hosts of hosts met weinig vermogen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standaard is `15000` milliseconden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft nog steeds voorrang voor eenmalige service- of shelloverschrijvingen.
    - Los startup-/event-loop-stalls bij voorkeur eerst op; deze knop is bedoeld voor hosts die gezond zijn maar traag tijdens het opwarmen.

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
    - `threadBindings`: globale standaardwaarden voor thread-gebonden sessieroutering (Discord ondersteunt `/focus`, `/unfocus`, `/agents`, `/session idle` en `/session max-age`).
    - Zie [Sessiebeheer](/nl/concepts/session) voor scoping, identiteitskoppelingen en verzendbeleid.
    - Zie [volledige referentie](/nl/gateway/config-agents#session) voor alle velden.

  </Accordion>

  <Accordion title="Sandboxing inschakelen">
    Voer agentsessies uit in geïsoleerde sandboxruntimes:

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

    Bouw eerst de image - voer vanuit een source-checkout `scripts/sandbox-setup.sh` uit, of zie vanuit een npm-installatie het inline `docker build`-commando in [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige handleiding en [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Relay-ondersteunde push voor officiële iOS-builds inschakelen">
    Relay-ondersteunde push voor openbare App Store/TestFlight-builds gebruikt de gehoste OpenClaw-relay: `https://ios-push-relay.openclaw.ai`.

    Aangepaste relay-implementaties vereisen een bewust afzonderlijk iOS-build-/implementatiepad waarvan de relay-URL overeenkomt met de gatewayrelay-URL. Als u een aangepaste relay-build gebruikt, stel dit dan in de gatewayconfiguratie in:

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

    - Laat de Gateway `push.test`, wekduwtjes en reconnect-wakes via de externe relay verzenden.
    - Gebruikt een registratiegescopeerde verzendtoekenning die door de gekoppelde iOS-app wordt doorgestuurd. De Gateway heeft geen implementatiebrede relay-token nodig.
    - Bindt elke relay-ondersteunde registratie aan de gatewayidentiteit waaraan de iOS-app is gekoppeld, zodat een andere Gateway de opgeslagen registratie niet kan hergebruiken.
    - Houdt lokale/handmatige iOS-builds op directe APNs. Relay-ondersteunde verzendingen gelden alleen voor officieel gedistribueerde builds die via de relay zijn geregistreerd.
    - Moet overeenkomen met de relaybasis-URL die in de iOS-build is ingebakken, zodat registratie- en verzendverkeer dezelfde relay-implementatie bereiken.

    End-to-end-flow:

    1. Installeer een officiële/TestFlight-iOS-build.
    2. Optioneel: configureer `gateway.push.apns.relay.baseUrl` op de Gateway alleen wanneer u een bewust afzonderlijke aangepaste relay-build gebruikt.
    3. Koppel de iOS-app aan de Gateway en laat zowel node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de gatewayidentiteit op, registreert zich bij de relay met App Attest plus de app-receipt en publiceert vervolgens de relay-ondersteunde `push.apns.register`-payload naar de gekoppelde Gateway.
    5. De Gateway slaat de relay-handle en verzendtoekenning op en gebruikt deze vervolgens voor `push.test`, wekduwtjes en reconnect-wakes.

    Operationele opmerkingen:

    - Als u de iOS-app naar een andere Gateway overschakelt, verbind de app dan opnieuw zodat deze een nieuwe relay-registratie kan publiceren die aan die Gateway is gebonden.
    - Als u een nieuwe iOS-build uitbrengt die naar een andere relay-implementatie verwijst, vernieuwt de app de gecachete relay-registratie in plaats van de oude relay-oorsprong te hergebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` werken nog steeds als tijdelijke env-overrides.
    - Aangepaste gatewayrelay-URL's moeten overeenkomen met de relaybasis-URL die in de iOS-build is ingebakken. De openbare App Store-releasebaan weigert aangepaste overrides voor iOS-relay-URL's.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een ontwikkelingsuitweg alleen voor loopback; sla HTTP-relay-URL's niet persistent op in configuratie.

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

    - `every`: duurtekenreeks (`30m`, `2h`). Stel `0m` in om uit te schakelen.
    - `target`: `last` | `none` | `<channel-id>` (bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`)
    - `directPolicy`: `allow` (standaard) of `block` voor DM-achtige heartbeatdoelen
    - Zie [Heartbeat](/nl/gateway/heartbeat) voor de volledige handleiding.

  </Accordion>

  <Accordion title="Cron-taken configureren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: voltooide geïsoleerde uitvoeringssessies uit `sessions.json` opschonen (standaard `24h`; stel `false` in om uit te schakelen).
    - `runLog`: bewaarde cron-runhistorierijen per taak opschonen. `maxBytes` blijft geaccepteerd voor oudere bestandsgebaseerde runlogs.
    - Zie [Cron-taken](/nl/automation/cron-jobs) voor functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Webhooks instellen (hooks)">
    Schakel HTTP-webhook-eindpunten op de Gateway in:

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
    - Gebruik een toegewezen `hooks.token`; hergebruik geen actieve Gateway-authgeheimen (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Hook-authenticatie is alleen via headers (`Authorization: Bearer ...` of `x-openclaw-token`); querystringtokens worden geweigerd.
    - `hooks.path` mag niet `/` zijn; houd webhook-ingress op een toegewezen subpad zoals `/hooks`.
    - Houd bypass-vlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), tenzij u strak afgebakend debugt.
    - Als u `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door de aanroeper gekozen sessiesleutels te begrenzen.
    - Geef voor hook-gestuurde agents de voorkeur aan sterke moderne modeltiers en strikt toolbeleid (bijvoorbeeld alleen messaging plus sandboxing waar mogelijk).

    Zie [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle mappingopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Multi-agent-routering configureren">
    Voer meerdere geïsoleerde agents uit met afzonderlijke werkruimten en sessies:

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

    Zie [Multi-Agent](/nl/concepts/multi-agent) en [volledige referentie](/nl/gateway/config-agents#multi-agent-routing) voor bindingsregels en toegangsprofielen per agent.

  </Accordion>

  <Accordion title="Config opsplitsen in meerdere bestanden ($include)">
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

    - **Eén bestand**: vervangt het bevattende object
    - **Array van bestanden**: diep samengevoegd op volgorde (later wint)
    - **Sleutels op hetzelfde niveau**: samengevoegd na includes (overschrijven opgenomen waarden)
    - **Geneste includes**: ondersteund tot 10 niveaus diep
    - **Relatieve paden**: opgelost relatief aan het includende bestand
    - **Padindeling**: include-paden mogen geen null-bytes bevatten en moeten vóór en na resolutie strikt korter zijn dan 4096 tekens
    - **Door OpenClaw beheerde schrijfbewerkingen**: wanneer een schrijfbewerking slechts één topniveausectie wijzigt
      die wordt ondersteund door een include met één bestand, zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat opgenomen bestand bij en laat `openclaw.json` intact
    - **Niet-ondersteund doorschrijven**: root-includes, include-arrays en includes
      met overrides op hetzelfde niveau falen gesloten voor door OpenClaw beheerde schrijfbewerkingen in plaats van
      de configuratie plat te maken
    - **Inperking**: `$include`-paden moeten oplossen onder de map die
      `openclaw.json` bevat. Om een boomstructuur tussen machines of gebruikers te delen, stelt u
      `OPENCLAW_INCLUDE_ROOTS` in op een padenlijst (`:` op POSIX, `;` op Windows) van
      aanvullende mappen waarnaar includes mogen verwijzen. Symlinks worden opgelost
      en opnieuw gecontroleerd, dus een pad dat lexicaal in een configuratiemap staat maar waarvan
      het echte doel buiten elke toegestane root valt, wordt alsnog geweigerd.
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parsefouten, circulaire includes, ongeldige padindeling en overmatige lengte

  </Accordion>
</AccordionGroup>

## Config-hot reload

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe - voor de meeste instellingen is geen handmatige herstart nodig.

Directe bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze valideren. De watcher wacht
tot editor-temp-write-/rename-churn is gestabiliseerd, leest het uiteindelijke bestand en weigert
ongeldige externe bewerkingen zonder `openclaw.json` te herschrijven. Door OpenClaw beheerde configuratie-
schrijfbewerkingen gebruiken dezelfde schemapoort vóór het schrijven; destructieve overschrijvingen zoals
het verwijderen van `gateway.mode` of het met meer dan de helft verkleinen van het bestand worden geweigerd en
opgeslagen als `.rejected.*` voor inspectie.

Als u `config reload skipped (invalid config)` ziet of de startup `Invalid
config` meldt, inspecteer dan de configuratie, voer `openclaw config validate` uit en voer daarna `openclaw
doctor --fix` uit voor herstel. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config)
voor de checklist.

### Reload-modi

| Modus                  | Gedrag                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (standaard) | Past veilige wijzigingen direct hot toe. Herstart automatisch voor kritieke wijzigingen. |
| **`hot`**              | Past alleen veilige wijzigingen hot toe. Logt een waarschuwing wanneer een herstart nodig is - u handelt dit af. |
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

De meeste velden worden zonder downtime hot toegepast. In de modus `hybrid` worden wijzigingen waarvoor een herstart nodig is automatisch afgehandeld.

| Categorie           | Velden                                                            | Herstart nodig? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanalen             | `channels.*`, `web` (WhatsApp) - alle ingebouwde en Plugin-kanalen | Nee             |
| Agent en modellen   | `agent`, `agents`, `models`, `routing`                            | Nee             |
| Automatisering      | `hooks`, `cron`, `agent.heartbeat`                                | Nee             |
| Sessies en berichten | `session`, `messages`                                             | Nee             |
| Tools en media      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nee             |
| UI en diversen      | `ui`, `logging`, `identity`, `bindings`                           | Nee             |
| Gateway-server      | `gateway.*` (poort, bind, auth, tailscale, TLS, HTTP)             | **Ja**          |
| Infrastructuur      | `discovery`, `plugins`                                            | **Ja**          |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen - het wijzigen ervan veroorzaakt **geen** herstart.
</Note>

### Herstartplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
de herlaadactie op basis van de in de bron vastgelegde indeling, niet op basis van de afgevlakte in-memory weergave.
Daardoor blijven hot-reload-beslissingen (hot-apply versus herstart) voorspelbaar, zelfs wanneer een
enkele top-level sectie in een eigen included bestand staat, zoals
`plugins: { $include: "./plugins.json5" }`. Herstartplanning faalt gesloten als de
bronindeling ambigu is.

## Config-RPC (programmatische updates)

Gebruik voor tooling die configuratie via de Gateway-API schrijft bij voorkeur deze flow:

- `config.schema.lookup` om één subtree te inspecteren (ondiepe schemanode + child-samenvattingen)
- `config.get` om de huidige snapshot plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON merge patch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen wanneer dit expliciet is bevestigd met `replacePaths` als
  entries zouden worden verwijderd)
- `config.apply` alleen wanneer je de volledige configuratie wilt vervangen
- `update.run` voor expliciete self-update plus herstart; voeg `continuationMessage` toe wanneer de sessie na de herstart nog één vervolgturt moet uitvoeren
- `update.status` om de nieuwste update-herstart-sentinel te inspecteren en de draaiende versie na een herstart te verifiëren

Agents moeten `config.schema.lookup` zien als het eerste adres voor exacte
docs en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze de bredere configuratiemap, defaults of links naar specifieke
subsystem-referenties nodig hebben.

<Note>
Control-plane-schrijfacties (`config.apply`, `config.patch`, `update.run`) zijn
beperkt tot 3 requests per 60 seconden per `deviceId+clientIp`. Herstartrequests
worden samengevoegd en dwingen daarna een cooldown van 30 seconden tussen herstartcycli af.
`update.status` is alleen-lezen, maar admin-scoped omdat de herstart-sentinel
samenvattingen van updatestappen en tails van command output kan bevatten.
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
al een configuratie bestaat.

`config.patch` accepteert ook `replacePaths`, een array met configuratiepaden waarvan arrayvervanging
bedoeld is. Als een patch een bestaande array zou vervangen of verwijderen
met minder entries, weigert de Gateway de schrijfactie tenzij dat exacte pad voorkomt
in `replacePaths`; geneste arrays onder array-entries gebruiken `[]`, zoals
`agents.list[].skills`. Dit voorkomt dat afgekorte `config.get`-snapshots
routing- of allowlist-arrays stilzwijgend overschrijven. Gebruik `config.apply` wanneer je
de volledige configuratie wilt vervangen.

## Omgevingsvariabelen

OpenClaw leest env vars uit het parent process plus:

- `.env` uit de huidige werkdirectory (indien aanwezig)
- `~/.openclaw/.env` (globale fallback)

Geen van beide bestanden overschrijft bestaande env vars. Je kunt inline env vars ook in de configuratie instellen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-env importeren (optioneel)">
  Als dit is ingeschakeld en verwachte keys niet zijn ingesteld, voert OpenClaw je login shell uit en importeert het alleen de ontbrekende keys:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalent als env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var-substitutie in configuratiewaarden">
  Verwijs naar env vars in elke stringwaarde in de configuratie met `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regels:

- Alleen hoofdletternamen matchen: `[A-Z_][A-Z0-9_]*`
- Ontbrekende/lege vars veroorzaken een fout tijdens het laden
- Escape met `$${VAR}` voor letterlijke output
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
Ondersteunde credential-paden staan in [SecretRef Credential Surface](/nl/reference/secretref-credential-surface).
</Accordion>

Zie [Omgeving](/nl/help/environment) voor volledige prioriteit en bronnen.

## Volledige referentie

Zie voor de volledige veld-voor-veld-referentie **[Configuratiereferentie](/nl/gateway/configuration-reference)**.

---

_Gerelateerd: [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Configuratiereferentie](/nl/gateway/configuration-reference) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
- [Gateway-runbook](/nl/gateway)
