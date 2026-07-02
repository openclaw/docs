---
read_when:
    - OpenClaw voor het eerst instellen
    - Zoeken naar veelvoorkomende configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratieoverzicht: veelvoorkomende taken, snelle configuratie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-07-02T08:33:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 ondersteunt opmerkingen en afsluitende komma's">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`.
Het actieve configuratiepad moet een normaal bestand zijn. Gesymlinkte `openclaw.json`-
indelingen worden niet ondersteund voor schrijfacties die eigendom zijn van OpenClaw; een atomische schrijfaanroep kan
het pad vervangen in plaats van de symlink te behouden. Als je configuratie buiten de
standaard statusmap bewaart, laat `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het echte bestand wijzen.

Als het bestand ontbreekt, gebruikt OpenClaw veilige standaardwaarden. Veelvoorkomende redenen om een configuratie toe te voegen:

- Kanalen verbinden en bepalen wie de bot berichten mag sturen
- Modellen, tools, sandboxing of automatisering instellen (cron, hooks)
- Sessies, media, netwerken of UI afstemmen

Zie de [volledige referentie](/nl/gateway/configuration-reference) voor elk beschikbaar veld.

Agents en automatisering moeten `config.schema.lookup` gebruiken voor exacte docs
op veldniveau voordat ze configuratie bewerken. Gebruik deze pagina voor taakgerichte richtlijnen en
[Configuratiereferentie](/nl/gateway/configuration-reference) voor de bredere
veldenkaart en standaardwaarden.

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
  <Tab title="Interactieve wizard">
    ```bash
    openclaw onboard       # volledige onboarding-flow
    openclaw configure     # configuratiewizard
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
    De Control UI rendert een formulier uit het live configuratieschema, inclusief veldmetadata voor docs
    `title` / `description`, plus plugin- en kanaalschema's wanneer
    beschikbaar, met een **Raw JSON**-editor als uitwijkmogelijkheid. Voor drill-down
    UI's en andere tooling biedt de gateway ook `config.schema.lookup` om
    één padgescope schema-node plus samenvattingen van directe kinderen op te halen.
  </Tab>
  <Tab title="Direct bewerken">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig overeenkomen met het schema. Onbekende sleutels, misvormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op rootniveau is `$schema` (string), zodat editors JSON Schema-metadata kunnen koppelen.
</Warning>

`openclaw config schema` print het canonieke JSON Schema dat door Control UI
en validatie wordt gebruikt. `config.schema.lookup` haalt één padgescope node plus
samenvattingen van kinderen op voor drill-down tooling. Docs-metadata voor velden `title`/`description`
wordt doorgegeven via geneste objecten, wildcard- (`*`), array-item- (`[]`) en `anyOf`/
`oneOf`/`allOf`-takken. Runtime plugin- en kanaalschema's worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer validatie mislukt:

- De Gateway start niet op
- Alleen diagnostische opdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om exacte problemen te zien
- Voer `openclaw doctor --fix` (of `--yes`) uit om reparaties toe te passen

De Gateway bewaart na elke succesvolle start een vertrouwde laatst-bekende-goede kopie,
maar startup en hot reload herstellen die niet automatisch. Als `openclaw.json`
validatie niet doorstaat (inclusief plugin-lokale validatie), mislukt het starten van de Gateway of
wordt het herladen overgeslagen en behoudt de huidige runtime de laatst geaccepteerde configuratie.
Voer `openclaw doctor --fix` (of `--yes`) uit om geprefixte/overschreven configuratie te repareren of
de laatst-bekende-goede kopie te herstellen. Promotie naar laatst-bekende-goed wordt overgeslagen wanneer een
kandidaat geredigeerde geheime placeholders bevat, zoals `***`.

## Veelvoorkomende taken

<AccordionGroup>
  <Accordion title="Een kanaal instellen (WhatsApp, Telegram, Discord, enz.)">
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

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als allowlist voor `/model`; `provider/*`-vermeldingen filteren `/model`, `/models` en modelkiezers naar geselecteerde providers, terwijl ze nog steeds dynamische modelontdekking gebruiken.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om allowlist-vermeldingen toe te voegen zonder bestaande modellen te verwijderen. Gewone vervangingen die vermeldingen zouden verwijderen, worden geweigerd tenzij je `--replace` doorgeeft.
    - Modelrefs gebruiken de indeling `provider/model` (bijv. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` bepaalt het verkleinen van transcript-/toolafbeeldingen (standaard `1200`); lagere waarden verminderen meestal het gebruik van vision-tokens bij runs met veel screenshots.
    - Zie [Models CLI](/nl/concepts/models) voor het wisselen van modellen in chat en [Model Failover](/nl/concepts/model-failover) voor auth-rotatie en fallbackgedrag.
    - Zie [Custom providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie voor aangepaste/zelfgehoste providers.

  </Accordion>

  <Accordion title="Bepalen wie de bot berichten mag sturen">
    DM-toegang wordt per kanaal beheerd via `dmPolicy`:

    - `"pairing"` (standaard): onbekende afzenders krijgen een eenmalige koppelcode om goed te keuren
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde allow-opslag)
    - `"open"`: alle binnenkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` + `groupAllowFrom` of kanaalspecifieke allowlists.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Vermeldingsgating voor groepschats instellen">
    Groepsberichten vereisen standaard **een vermelding**. Configureer triggerpatronen per agent. Normale groeps-/kanaalantwoorden worden automatisch geplaatst; kies het message-tool-pad voor gedeelde rooms waar de agent moet beslissen wanneer hij spreekt:

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
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan message-tool-verzendingen globaal verplicht maken; `messages.groupChat.visibleReplies` overschrijft dat voor groepen/kanalen.
    - Zie [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor zichtbare-antwoordmodi, overschrijvingen per kanaal en self-chat-modus.

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
    - Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en
      de [Configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Gateway-kanaalgezondheidsbewaking afstemmen">
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

  <Accordion title="Gateway WebSocket-handshaketime-out afstemmen">
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
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` blijft voorrang hebben voor eenmalige service- of shell-overschrijvingen.
    - Los bij voorkeur eerst startup-/event-loop-haperingen op; deze knop is voor hosts die gezond zijn maar traag tijdens het opwarmen.

  </Accordion>

  <Accordion title="Sessies en resets configureren">
    Sessies beheren gesprekscontinuïteit en isolatie:

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
    - `threadBindings`: globale standaardinstellingen voor sessierouting die aan threads is gebonden (Discord ondersteunt `/focus`, `/unfocus`, `/agents`, `/session idle` en `/session max-age`).
    - Zie [Sessiebeheer](/nl/concepts/session) voor scoping, identiteitskoppelingen en verzendbeleid.
    - Zie [volledige referentie](/nl/gateway/config-agents#session) voor alle velden.

  </Accordion>

  <Accordion title="Sandboxing inschakelen">
    Voer agentsessies uit in geisoleerde sandbox-runtimes:

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

    Bouw eerst de image: voer vanuit een broncheckout `scripts/sandbox-setup.sh` uit, of zie vanuit een npm-installatie de inline `docker build`-opdracht in [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige gids en [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Relay-ondersteunde push inschakelen voor officiele iOS-builds">
    Relay-ondersteunde push voor openbare App Store-builds gebruikt de gehoste OpenClaw-relay: `https://ios-push-relay.openclaw.ai`.

    Aangepaste relay-implementaties vereisen een bewust gescheiden iOS-build-/implementatiepad waarvan de relay-URL overeenkomt met de Gateway-relay-URL. Als je een aangepaste relay-build gebruikt, stel dit dan in de Gateway-configuratie in:

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

    - Laat de Gateway `push.test`, wake nudges en reconnect wakes verzenden via de externe relay.
    - Gebruikt een registratiegebonden verzendmachtiging die wordt doorgestuurd door de gekoppelde iOS-app. De Gateway heeft geen implementatiebrede relay-token nodig.
    - Bindt elke relay-ondersteunde registratie aan de Gateway-identiteit waarmee de iOS-app is gekoppeld, zodat een andere Gateway de opgeslagen registratie niet opnieuw kan gebruiken.
    - Houdt lokale/handmatige iOS-builds op directe APNs. Relay-ondersteunde verzendingen gelden alleen voor officieel gedistribueerde builds die via de relay zijn geregistreerd.
    - Moet overeenkomen met de relay-basis-URL die in de iOS-build is ingebakken, zodat registratie- en verzendverkeer dezelfde relay-implementatie bereiken.

    End-to-end-flow:

    1. Installeer de officiele iOS-app.
    2. Optioneel: configureer `gateway.push.apns.relay.baseUrl` op de Gateway alleen wanneer je een bewust gescheiden aangepaste relay-build gebruikt.
    3. Koppel de iOS-app aan de Gateway en laat zowel node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de Gateway-identiteit op, registreert zich bij de relay met App Attest plus de app-bon, en publiceert daarna de relay-ondersteunde `push.apns.register`-payload naar de gekoppelde Gateway.
    5. De Gateway slaat de relay-handle en verzendmachtiging op en gebruikt deze daarna voor `push.test`, wake nudges en reconnect wakes.

    Operationele opmerkingen:

    - Als je de iOS-app naar een andere Gateway overschakelt, verbind de app dan opnieuw zodat deze een nieuwe relay-registratie kan publiceren die aan die Gateway is gebonden.
    - Als je een nieuwe iOS-build uitbrengt die naar een andere relay-implementatie wijst, vernieuwt de app de gecachte relay-registratie in plaats van de oude relay-origin opnieuw te gebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` blijven werken als tijdelijke env-overrides.
    - Aangepaste Gateway-relay-URL's moeten overeenkomen met de relay-basis-URL die in de iOS-build is ingebakken. De openbare App Store-release-lane weigert aangepaste iOS-relay-URL-overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een ontwikkelingsuitweg alleen voor local loopback; sla geen HTTP-relay-URL's permanent op in configuratie.

    Zie [iOS-app](/nl/platforms/ios#relay-backed-push-for-official-builds) voor de end-to-end-flow en [Authenticatie- en vertrouwensflow](/nl/platforms/ios#authentication-and-trust-flow) voor het relay-beveiligingsmodel.

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
    - `directPolicy`: `allow` (standaard) of `block` voor DM-achtige Heartbeat-doelen
    - Zie [Heartbeat](/nl/gateway/heartbeat) voor de volledige gids.

  </Accordion>

  <Accordion title="Cron-jobs configureren">
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

    - `sessionRetention`: ruim voltooide geisoleerde runsessies op uit `sessions.json` (standaard `24h`; stel `false` in om uit te schakelen).
    - `runLog`: ruim bewaarde Cron-runhistorierijen per taak op. `maxBytes` blijft geaccepteerd voor oudere bestandsgebaseerde runlogs.
    - Zie [Cron-jobs](/nl/automation/cron-jobs) voor een functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Webhooks (hooks) instellen">
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
    - Gebruik een specifieke `hooks.token`; hergebruik geen actieve Gateway-authgeheimen (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Hook-authenticatie werkt alleen via headers (`Authorization: Bearer ...` of `x-openclaw-token`); querystring-tokens worden geweigerd.
    - `hooks.path` mag niet `/` zijn; houd Webhook-ingress op een specifiek subpad zoals `/hooks`.
    - Houd bypass-vlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), behalve bij strak afgebakende debugging.
    - Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door callers gekozen sessiesleutels te begrenzen.
    - Geef voor hook-gestuurde agents de voorkeur aan sterke moderne modeltiers en strikt toolbeleid (bijvoorbeeld alleen berichten plus sandboxing waar mogelijk).

    Zie [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle mappingopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Multi-agent-routing configureren">
    Voer meerdere geisoleerde agents uit met gescheiden workspaces en sessies:

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
    - **Array van bestanden**: diep samengevoegd in volgorde (latere wint)
    - **Zusterkeys**: samengevoegd na includes (overschrijven opgenomen waarden)
    - **Geneste includes**: ondersteund tot 10 niveaus diep
    - **Relatieve paden**: opgelost relatief aan het include-bestand
    - **Padindeling**: include-paden mogen geen null-bytes bevatten en moeten strikt korter zijn dan 4096 tekens voor en na resolutie
    - **OpenClaw-beheerde writes**: wanneer een write slechts een top-levelsectie wijzigt
      die wordt ondersteund door een enkelbestand-include zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat opgenomen bestand bij en laat het `openclaw.json` intact
    - **Niet-ondersteunde write-through**: root-includes, include-arrays en includes
      met zuster-overschrijvingen falen gesloten voor OpenClaw-beheerde writes in plaats van
      de configuratie af te vlakken
    - **Insluiting**: `$include`-paden moeten oplossen onder de directory die
      `openclaw.json` bevat. Om een boom tussen machines of gebruikers te delen, stel je
      `OPENCLAW_INCLUDE_ROOTS` in op een padenlijst (`:` op POSIX, `;` op Windows) van
      extra directories waarnaar includes mogen verwijzen. Symlinks worden opgelost
      en opnieuw gecontroleerd, dus een pad dat lexicaal in een configuratiedirectory staat maar waarvan
      het echte doel buiten elke toegestane root valt, wordt nog steeds geweigerd.
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parsefouten, circulaire includes, ongeldige padindeling en overmatige lengte

  </Accordion>
</AccordionGroup>

## Configuratie hot reload

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe: voor de meeste instellingen is geen handmatige herstart nodig.

Directe bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze valideren. De watcher wacht
tot editor-temp-write-/rename-ruis is gestabiliseerd, leest het definitieve bestand en weigert
ongeldige externe bewerkingen zonder `openclaw.json` te herschrijven. OpenClaw-beheerde configuratie-
writes gebruiken dezelfde schemagate voordat ze schrijven; destructieve overschrijvingen zoals
het verwijderen van `gateway.mode` of het met meer dan de helft verkleinen van het bestand worden geweigerd en
opgeslagen als `.rejected.*` voor inspectie.

Als je `config reload skipped (invalid config)` ziet of het opstarten `Invalid
config` meldt, inspecteer dan de configuratie, voer `openclaw config validate` uit en voer daarna `openclaw
doctor --fix` uit voor reparatie. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config)
voor de checklist.

### Reload-modi

| Modus                  | Gedrag                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (standaard) | Past veilige wijzigingen direct hot toe. Herstart automatisch voor kritieke wijzigingen. |
| **`hot`**              | Past alleen veilige wijzigingen hot toe. Logt een waarschuwing wanneer een herstart nodig is: jij handelt dit af. |
| **`restart`**          | Herstart de Gateway bij elke configuratiewijziging, veilig of niet.                     |
| **`off`**              | Schakelt bestandsbewaking uit. Wijzigingen worden actief bij de volgende handmatige herstart. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Wat hot wordt toegepast versus wat een herstart nodig heeft

De meeste velden worden zonder downtime hot toegepast. In `hybrid`-modus worden wijzigingen waarvoor een herstart nodig is automatisch afgehandeld.

| Categorie           | Velden                                                            | Herstart nodig? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanalen             | `channels.*`, `web` (WhatsApp) - alle ingebouwde en Plugin-kanalen | Nee             |
| Agent en modellen   | `agent`, `agents`, `models`, `routing`                            | Nee             |
| Automatisering      | `hooks`, `cron`, `agent.heartbeat`                                | Nee             |
| Sessies en berichten | `session`, `messages`                                             | Nee             |
| Tools en media      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nee             |
| UI en overig        | `ui`, `logging`, `identity`, `bindings`                           | Nee             |
| Gateway-server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ja**          |
| Infrastructuur      | `discovery`, `plugins`                                            | **Ja**          |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen - als je ze wijzigt, wordt er **geen** herstart geactiveerd.
</Note>

### Herlaadplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
het herladen op basis van de door de bron gedefinieerde indeling, niet op basis van de afgevlakte weergave in het geheugen.
Daardoor blijven hot-reload-beslissingen (direct toepassen versus herstarten) voorspelbaar, zelfs wanneer een
enkele sectie op het hoogste niveau in een eigen opgenomen bestand staat, zoals
`plugins: { $include: "./plugins.json5" }`. Herlaadplanning faalt gesloten als de
bronindeling dubbelzinnig is.

## Config-RPC (programmatische updates)

Voor tooling die configuratie via de Gateway-API schrijft, heeft deze flow de voorkeur:

- `config.schema.lookup` om één subtree te inspecteren (ondiepe schemanode + samenvattingen van children)
- `config.get` om de huidige snapshot plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON merge patch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen wanneer dit expliciet is bevestigd met `replacePaths` als
  entries zouden worden verwijderd)
- `config.apply` alleen wanneer je de volledige configuratie wilt vervangen
- `update.run` voor expliciete zelfupdate plus herstart; voeg `continuationMessage` toe wanneer de sessie na de herstart nog één vervolgronde moet uitvoeren
- `update.status` om de nieuwste update-herstartsentinel te inspecteren en de draaiende versie na een herstart te verifiëren

Agents moeten `config.schema.lookup` behandelen als het eerste startpunt voor exacte
documentatie en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze de bredere configuratiekaart, standaardwaarden of links naar specifieke
subsystem-referenties nodig hebben.

<Note>
Control-plane-schrijfacties (`config.apply`, `config.patch`, `update.run`) zijn
beperkt tot 3 requests per 60 seconden per `deviceId+clientIp`. Herstartrequests
worden samengevoegd en dwingen daarna een cooldown van 30 seconden af tussen herstartcycli.
`update.status` is alleen-lezen, maar admin-scoped omdat de herstartsentinel
samenvattingen van updatestappen en staarten van commandoutput kan bevatten.
</Note>

Voorbeeld van een gedeeltelijke patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zowel `config.apply` als `config.patch` accepteert `raw`, `baseHash`, `sessionKey`,
`note` en `restartDelayMs`. `baseHash` is vereist voor beide methoden wanneer er al een
configuratie bestaat.

`config.patch` accepteert ook `replacePaths`, een array met configuratiepaden waarvan arrayvervanging
bedoeld is. Als een patch een bestaande array zou vervangen of verwijderen
met minder entries, wijst de Gateway de schrijfactie af tenzij dat exacte pad voorkomt
in `replacePaths`; geneste arrays onder array-entries gebruiken `[]`, zoals
`agents.list[].skills`. Dit voorkomt dat afgekorte `config.get`-snapshots
routing- of allowlist-arrays stilzwijgend overschrijven. Gebruik `config.apply` wanneer je
de volledige configuratie wilt vervangen.

## Omgevingsvariabelen

OpenClaw leest env-vars uit het bovenliggende proces plus:

- `.env` uit de huidige werkdirectory (indien aanwezig)
- `~/.openclaw/.env` (globale fallback)

Geen van beide bestanden overschrijft bestaande env-vars. Je kunt ook inline env-vars in configuratie instellen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-env importeren (optioneel)">
  Indien ingeschakeld en verwachte sleutels niet zijn ingesteld, voert OpenClaw je login-shell uit en importeert alleen de ontbrekende sleutels:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalent als env-var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env-var-substitutie in configuratiewaarden">
  Verwijs naar env-vars in elke stringwaarde in de configuratie met `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regels:

- Alleen namen in hoofdletters matchen: `[A-Z_][A-Z0-9_]*`
- Ontbrekende/lege vars veroorzaken een fout tijdens het laden
- Escape met `$${VAR}` voor letterlijke output
- Werkt binnen `$include`-bestanden
- Inline-substitutie: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, bestand, exec)">
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
Ondersteunde credentialpaden staan vermeld in [SecretRef Credential Surface](/nl/reference/secretref-credential-surface).
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
