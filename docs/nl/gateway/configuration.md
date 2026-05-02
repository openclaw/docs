---
read_when:
    - OpenClaw voor het eerst instellen
    - Zoeken naar gangbare configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratieoverzicht: veelvoorkomende taken, snelle configuratie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-05-02T11:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 ondersteunt opmerkingen en afsluitende komma's">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`.
Het actieve configuratiepad moet een regulier bestand zijn. Gesymlinkte `openclaw.json`-
indelingen worden niet ondersteund voor schrijfbewerkingen die OpenClaw beheert; een atomische schrijfopdracht kan
het pad vervangen in plaats van de symlink te behouden. Als je configuratie buiten de
standaard statusmap bewaart, wijs `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het echte bestand.

Als het bestand ontbreekt, gebruikt OpenClaw veilige standaardwaarden. Veelvoorkomende redenen om een configuratie toe te voegen:

- Kanalen verbinden en bepalen wie de bot berichten mag sturen
- Modellen, tools, sandboxing of automatisering instellen (cron, hooks)
- Sessies, media, netwerken of UI afstemmen

Zie de [volledige referentie](/nl/gateway/configuration-reference) voor elk beschikbaar veld.

Agents en automatisering moeten `config.schema.lookup` gebruiken voor exacte documentatie op veldniveau
voordat ze configuratie bewerken. Gebruik deze pagina voor taakgerichte begeleiding en de
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
  <Tab title="Interactieve wizard">
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
    De Control UI rendert een formulier op basis van het live configuratieschema, inclusief veldmetadata voor
    `title` / `description` in de documentatie plus schema's voor Plugins en kanalen wanneer
    beschikbaar, met een **Raw JSON**-editor als uitweg. Voor detailweergaven
    en andere tooling biedt de Gateway ook `config.schema.lookup` om
    één padafgebakend schemaknooppunt plus samenvattingen van directe onderliggende items op te halen.
  </Tab>
  <Tab title="Direct bewerken">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig met het schema overeenkomen. Onbekende sleutels, verkeerd gevormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op rootniveau is `$schema` (string), zodat editors JSON Schema-metadata kunnen koppelen.
</Warning>

`openclaw config schema` drukt het canonieke JSON Schema af dat door Control UI
en validatie wordt gebruikt. `config.schema.lookup` haalt één padafgebakend knooppunt plus
samenvattingen van onderliggende items op voor detailgerichte tooling. Veldmetadata voor `title`/`description` in de documentatie
wordt doorgegeven via geneste objecten, wildcard (`*`), array-item (`[]`) en `anyOf`/
`oneOf`/`allOf`-vertakkingen. Runtime-schema's van Plugins en kanalen worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer validatie mislukt:

- De Gateway start niet op
- Alleen diagnoseopdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om de exacte problemen te zien
- Voer `openclaw doctor --fix` (of `--yes`) uit om reparaties toe te passen

De Gateway bewaart na elke succesvolle start een vertrouwde laatst bekende goede kopie.
Als `openclaw.json` later niet door validatie komt (of `gateway.mode` laat vallen, sterk
krimpt, of een losse logregel vooraan heeft), behoudt OpenClaw het kapotte bestand
als `.clobbered.*`, herstelt de laatst bekende goede kopie en logt de herstelreden.
De volgende agentbeurt ontvangt ook een waarschuwing als systeemgebeurtenis, zodat de hoofdagent
de herstelde configuratie niet blind herschrijft. Promotie naar laatst bekende goede
wordt overgeslagen wanneer een kandidaat geredigeerde geheime placeholders bevat, zoals `***`.
Wanneer elk validatieprobleem is afgebakend tot `plugins.entries.<id>...`, voert OpenClaw
geen herstel van het volledige bestand uit. Het houdt de huidige configuratie actief en
toont de Plugin-lokale fout, zodat een Plugin-schema of mismatch met de hostversie
geen niet-gerelateerde gebruikersinstellingen kan terugdraaien.

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

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als de allowlist voor `/model`.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om allowlist-vermeldingen toe te voegen zonder bestaande modellen te verwijderen. Gewone vervangingen die vermeldingen zouden verwijderen, worden geweigerd tenzij je `--replace` meegeeft.
    - Modelrefs gebruiken de indeling `provider/model` (bijv. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` regelt het verkleinen van afbeeldingen in transcript/tools (standaard `1200`); lagere waarden verminderen meestal het gebruik van vision-tokens bij runs met veel screenshots.
    - Zie [Models CLI](/nl/concepts/models) voor het wisselen van modellen in chat en [Model Failover](/nl/concepts/model-failover) voor auth-rotatie en fallbackgedrag.
    - Zie voor aangepaste/zelfgehoste providers [Aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie.

  </Accordion>

  <Accordion title="Bepalen wie de bot berichten mag sturen">
    DM-toegang wordt per kanaal geregeld via `dmPolicy`:

    - `"pairing"` (standaard): onbekende afzenders krijgen een eenmalige koppelingscode om goed te keuren
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde toestemmingsopslag)
    - `"open"`: alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` + `groupAllowFrom` of kanaalspecifieke allowlists.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Vermeldingsgating voor groepschats instellen">
    Groepsberichten vereisen standaard een **vermelding**. Configureer triggerpatronen per agent en houd zichtbare kamerantwoorden op het standaardpad van de berichttool, tenzij je bewust verouderde automatische eindantwoorden wilt:

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
    - **Tekstpatronen**: veilige regexpatronen in `mentionPatterns`
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan wereldwijd verzending via de berichttool vereisen; `messages.groupChat.visibleReplies` overschrijft dat voor groepen/kanalen.
    - Zie de [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor zichtbare antwoordmodi, overschrijvingen per kanaal en self-chatmodus.

  </Accordion>

  <Accordion title="Skills per agent beperken">
    Gebruik `agents.defaults.skills` voor een gedeelde basis en overschrijf daarna specifieke
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

  <Accordion title="Kanaalstatusbewaking van de Gateway afstemmen">
    Bepaal hoe agressief de Gateway kanalen herstart die verouderd lijken:

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

    - Stel `gateway.channelHealthCheckMinutes: 0` in om herstarts door statusbewaking wereldwijd uit te schakelen.
    - `channelStaleEventThresholdMinutes` moet groter zijn dan of gelijk zijn aan het controle-interval.
    - Gebruik `channels.<provider>.healthMonitor.enabled` of `channels.<provider>.accounts.<id>.healthMonitor.enabled` om automatische herstarts voor één kanaal of account uit te schakelen zonder de globale monitor uit te schakelen.
    - Zie [Health Checks](/nl/gateway/health) voor operationele debugging en de [volledige referentie](/nl/gateway/configuration-reference#gateway) voor alle velden.

  </Accordion>

  <Accordion title="WebSocket-handshaketime-out van de Gateway afstemmen">
    Geef lokale clients meer tijd om de pre-auth WebSocket-handshake te voltooien op
    belaste of minder krachtige hosts:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standaard is `15000` milliseconden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` blijft voorrang houden voor eenmalige service- of shell-overschrijvingen.
    - Geef de voorkeur aan het eerst oplossen van vastlopers bij opstarten of in de eventloop; deze knop is bedoeld voor hosts die gezond maar traag zijn tijdens warmup.

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
    - Zie [Sessiebeheer](/nl/concepts/session) voor afbakening, identiteitskoppelingen en verzendbeleid.
    - Zie [volledige referentie](/nl/gateway/config-agents#session) voor alle velden.

  </Accordion>

  <Accordion title="Enable sandboxing">
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

    Bouw eerst de image: voer vanuit een source-checkout `scripts/sandbox-setup.sh` uit, of bekijk bij een npm-installatie de inline `docker build`-opdracht in [Sandboxing § Images and setup](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige gids en [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
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
    - Gebruikt een registratiegebonden verzendmachtiging die wordt doorgestuurd door de gekoppelde iOS-app. De Gateway heeft geen relay-token voor de hele deployment nodig.
    - Bindt elke relay-ondersteunde registratie aan de Gateway-identiteit waarmee de iOS-app is gekoppeld, zodat een andere Gateway de opgeslagen registratie niet opnieuw kan gebruiken.
    - Houdt lokale/handmatige iOS-builds op directe APNs. Relay-ondersteunde verzendingen gelden alleen voor officieel gedistribueerde builds die via de relay zijn geregistreerd.
    - Moet overeenkomen met de relay-basis-URL die in de officiele/TestFlight-iOS-build is ingebakken, zodat registratie- en verzendverkeer dezelfde relay-deployment bereiken.

    End-to-end-stroom:

    1. Installeer een officiele/TestFlight-iOS-build die met dezelfde relay-basis-URL is gecompileerd.
    2. Configureer `gateway.push.apns.relay.baseUrl` op de Gateway.
    3. Koppel de iOS-app aan de Gateway en laat zowel Node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de Gateway-identiteit op, registreert zich bij de relay met App Attest plus het app-bewijs, en publiceert daarna de relay-ondersteunde `push.apns.register`-payload naar de gekoppelde Gateway.
    5. De Gateway slaat de relay-handle en verzendmachtiging op en gebruikt die vervolgens voor `push.test`, wake-nudges en reconnect-wakes.

    Operationele opmerkingen:

    - Als je de iOS-app overschakelt naar een andere Gateway, verbind de app dan opnieuw zodat deze een nieuwe relay-registratie kan publiceren die aan die Gateway is gebonden.
    - Als je een nieuwe iOS-build uitbrengt die naar een andere relay-deployment wijst, vernieuwt de app zijn gecachete relay-registratie in plaats van de oude relay-oorsprong opnieuw te gebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` werken nog steeds als tijdelijke env-overschrijvingen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een ontwikkeluitweg die alleen voor loopback geldt; sla HTTP-relay-URL's niet blijvend op in config.

    Zie [iOS-app](/nl/platforms/ios#relay-backed-push-for-official-builds) voor de end-to-end-stroom en [Authenticatie- en vertrouwensstroom](/nl/platforms/ios#authentication-and-trust-flow) voor het beveiligingsmodel van de relay.

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
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

  <Accordion title="Configure cron jobs">
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
    - `runLog`: snoei `cron/runs/<jobId>.jsonl` op grootte en bewaarde regels.
    - Zie [Cron-taken](/nl/automation/cron-jobs) voor een functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
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
    - Gebruik een speciale `hooks.token`; hergebruik de gedeelde Gateway-token niet.
    - Hook-authenticatie werkt alleen via headers (`Authorization: Bearer ...` of `x-openclaw-token`); querystringtokens worden geweigerd.
    - `hooks.path` mag niet `/` zijn; houd Webhook-ingress op een speciaal subpad zoals `/hooks`.
    - Houd bypassvlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), behalve bij strikt afgebakende debugging.
    - Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door aanroepers gekozen sessiesleutels te begrenzen.
    - Geef voor hook-gedreven agents de voorkeur aan sterke moderne modellagen en strikt toolbeleid (bijvoorbeeld alleen berichten plus sandboxing waar mogelijk).

    Zie [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle mappingopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    Voer meerdere geisoleerde agents uit met afzonderlijke werkruimten en sessies:

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

  <Accordion title="Split config into multiple files ($include)">
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

    - **Enkel bestand**: vervangt het omvattende object
    - **Array van bestanden**: diep samengevoegd in volgorde (later wint)
    - **Zusterkeys**: samengevoegd na includes (overschrijven opgenomen waarden)
    - **Geneste includes**: ondersteund tot 10 niveaus diep
    - **Relatieve paden**: opgelost relatief aan het includende bestand
    - **Door OpenClaw beheerde schrijfacties**: wanneer een schrijfactie slechts een top-level sectie wijzigt
      die wordt ondersteund door een single-file include zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat opgenomen bestand bij en laat het `openclaw.json` intact
    - **Niet-ondersteunde write-through**: root-includes, include-arrays en includes
      met zusteroverschrijvingen falen gesloten voor door OpenClaw beheerde schrijfacties in plaats van
      de configuratie plat te maken
    - **Inperking**: `$include`-paden moeten uitkomen onder de directory met
      `openclaw.json`. Om een boomstructuur tussen machines of gebruikers te delen, stel je
      `OPENCLAW_INCLUDE_ROOTS` in op een padlijst (`:` op POSIX, `;` op Windows) van
      extra directory's waar includes naar mogen verwijzen. Symlinks worden opgelost
      en opnieuw gecontroleerd, dus een pad dat lexicaal in een configdirectory staat maar waarvan
      het echte doel buiten elke toegestane root valt, wordt nog steeds geweigerd.
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parseerfouten en circulaire includes

  </Accordion>
</AccordionGroup>

## Config hot reload

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe: voor de meeste instellingen is geen handmatige herstart nodig.

Directe bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze valideren. De watcher wacht
tot tijdelijke schrijf-/hernoemactiviteit van de editor is gestabiliseerd, leest het definitieve bestand en weigert
ongeldige externe bewerkingen door de laatst bekende goede configuratie te herstellen. Door OpenClaw beheerde
configschrijfacties gebruiken dezelfde schemapoort voordat ze schrijven; destructieve overschrijvingen zoals
het laten vallen van `gateway.mode` of het verkleinen van het bestand met meer dan de helft worden geweigerd
en opgeslagen als `.rejected.*` voor inspectie.

Plugin-lokale validatiefouten zijn de uitzondering: als alle problemen onder
`plugins.entries.<id>...` vallen, behoudt reload de huidige configuratie en rapporteert het Plugin-
probleem in plaats van `.last-good` te herstellen.

Als je `Config auto-restored from last-known-good` of
`config reload restored last-known-good config` in logs ziet, inspecteer dan het bijbehorende
`.clobbered.*`-bestand naast `openclaw.json`, repareer de geweigerde payload en voer daarna
`openclaw config validate` uit. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-restored-last-known-good-config)
voor de herstelchecklist.

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

De meeste velden worden hot toegepast zonder downtime. In `hybrid`-modus worden wijzigingen waarvoor een herstart nodig is automatisch afgehandeld.

| Categorie          | Velden                                                            | Herstart nodig? |
| ------------------ | ----------------------------------------------------------------- | --------------- |
| Kanalen            | `channels.*`, `web` (WhatsApp) — alle ingebouwde en plugin-kanalen | Nee             |
| Agent en modellen  | `agent`, `agents`, `models`, `routing`                            | Nee             |
| Automatisering     | `hooks`, `cron`, `agent.heartbeat`                                | Nee             |
| Sessies en berichten | `session`, `messages`                                           | Nee             |
| Tools en media     | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nee             |
| UI en diversen     | `ui`, `logging`, `identity`, `bindings`                           | Nee             |
| Gateway-server     | `gateway.*` (poort, bind, auth, tailscale, TLS, HTTP)             | **Ja**          |
| Infrastructuur     | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen — het wijzigen ervan triggert **geen** herstart.
</Note>

### Herlaadplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
de herlaadactie op basis van de door de bron gedefinieerde indeling, niet op basis van de afgevlakte weergave in het geheugen.
Daardoor blijven beslissingen voor hot-reload (hot-apply versus herstart) voorspelbaar, zelfs wanneer een
enkele top-level sectie in een eigen opgenomen bestand staat, zoals
`plugins: { $include: "./plugins.json5" }`. Herlaadplanning faalt gesloten als de
bronindeling ambigu is.

## Configuratie-RPC (programmatische updates)

Voor tooling die configuratie via de Gateway-API schrijft, heeft deze flow de voorkeur:

- `config.schema.lookup` om één subtree te inspecteren (ondiep schema-node + samenvattingen van children)
- `config.get` om de huidige snapshot plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON merge patch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen)
- `config.apply` alleen wanneer je de volledige configuratie wilt vervangen
- `update.run` voor expliciete zelfupdate plus herstart
- `update.status` om de nieuwste update-herstartsentinel te inspecteren en de draaiende versie na een herstart te verifiëren

Agents moeten `config.schema.lookup` behandelen als de eerste plek voor exacte
documentatie en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze de bredere configuratiekaart, standaardwaarden of links naar specifieke
subsystem-referenties nodig hebben.

<Note>
Control-plane schrijfacties (`config.apply`, `config.patch`, `update.run`) zijn
beperkt tot 3 aanvragen per 60 seconden per `deviceId+clientIp`. Herstartaanvragen
worden samengevoegd en dwingen daarna een afkoelperiode van 30 seconden af tussen herstartcycli.
`update.status` is alleen-lezen maar admin-scoped, omdat de herstartsentinel
samenvattingen van update-stappen en tails van command-uitvoer kan bevatten.
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

Geen van beide bestanden overschrijft bestaande env vars. Je kunt ook inline env vars instellen in configuratie:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-env importeren (optioneel)">
  Indien ingeschakeld en verwachte sleutels niet zijn ingesteld, voert OpenClaw je login-shell uit en importeert het alleen de ontbrekende sleutels:

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

- Alleen hoofdletternamen komen overeen: `[A-Z_][A-Z0-9_]*`
- Ontbrekende/lege vars veroorzaken een fout tijdens het laden
- Escape met `$${VAR}` voor letterlijke uitvoer
- Werkt binnen `$include`-bestanden
- Inline substitutie: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Voor velden die SecretRef-objecten ondersteunen, kun je het volgende gebruiken:

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

Zie [Omgeving](/nl/help/environment) voor volledige prioriteit en bronnen.

## Volledige referentie

Voor de complete referentie per veld, zie **[Configuratiereferentie](/nl/gateway/configuration-reference)**.

---

_Gerelateerd: [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Configuratiereferentie](/nl/gateway/configuration-reference) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
- [Gateway-runbook](/nl/gateway)
