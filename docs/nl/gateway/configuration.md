---
read_when:
    - OpenClaw voor het eerst instellen
    - Op zoek naar veelgebruikte configuratiepatronen
    - Navigeren naar specifieke configuratiesecties
summary: 'Configuratieoverzicht: veelvoorkomende taken, snelle installatie en links naar de volledige referentie'
title: Configuratie
x-i18n:
    generated_at: "2026-07-16T15:37:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw leest een optionele <Tooltip tip="JSON5 ondersteunt opmerkingen en afsluitende komma's">**JSON5**</Tooltip>-configuratie uit `~/.openclaw/openclaw.json`. Als het bestand ontbreekt, gebruikt OpenClaw veilige standaardwaarden.

Het actieve configuratiepad moet een regulier bestand zijn. Schrijfbewerkingen door OpenClaw vervangen het atomair (door hernoemen naar het pad), zodat bij een via een symbolische koppeling gekoppeld `openclaw.json` het doel wordt vervangen in plaats van er via de koppeling naar te schrijven. Vermijd daarom configuratie-indelingen met symbolische koppelingen. Als je de configuratie buiten de standaardstatusmap bewaart, laat `OPENCLAW_CONFIG_PATH` dan rechtstreeks naar het werkelijke bestand verwijzen.

Veelvoorkomende redenen om een configuratie toe te voegen:

- Kanalen verbinden en bepalen wie de bot berichten kan sturen
- Modellen, tools, sandboxing of automatisering instellen (cron, hooks)
- Sessies, media, netwerken of de gebruikersinterface afstemmen

Zie de [volledige referentie](/nl/gateway/configuration-reference) voor elk beschikbaar veld.

Agents en automatisering moeten vóór het bewerken van de configuratie
`config.schema.lookup` gebruiken voor exacte documentatie op veldniveau. Gebruik deze pagina voor taakgerichte richtlijnen en
de [configuratiereferentie](/nl/gateway/configuration-reference) voor het bredere
veldenoverzicht en de standaardwaarden.

<Tip>
**Nieuw met configuratie?** Begin met `openclaw onboard` voor een interactieve installatie of bekijk de handleiding [Configuratievoorbeelden](/nl/gateway/configuration-examples) voor volledige configuraties die je kunt kopiëren en plakken.
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
    openclaw onboard       # volledige onboardingprocedure
    openclaw configure     # configuratiewizard
    ```
  </Tab>
  <Tab title="CLI (eenregelige opdrachten)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Bedieningsinterface">
    Open [http://127.0.0.1:18789](http://127.0.0.1:18789) en gebruik het tabblad **Configuratie**.
    De bedieningsinterface genereert een formulier op basis van het actieve configuratieschema, inclusief documentatiemetagegevens voor de velden
    `title` / `description` en, indien beschikbaar, schema's voor plugins en kanalen,
    met een **Raw JSON**-editor als uitwijkmogelijkheid. Voor interfaces
    voor detailnavigatie en andere tools stelt de Gateway ook `config.schema.lookup` beschikbaar om
    één schemaknooppunt binnen een specifiek pad plus samenvattingen van directe onderliggende knooppunten op te halen.
  </Tab>
  <Tab title="Rechtstreeks bewerken">
    Bewerk `~/.openclaw/openclaw.json` rechtstreeks. De Gateway bewaakt het bestand en past wijzigingen automatisch toe (zie [direct herladen](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte validatie

<Warning>
OpenClaw accepteert alleen configuraties die volledig overeenkomen met het schema. Onbekende sleutels, onjuist gevormde typen of ongeldige waarden zorgen ervoor dat de Gateway **weigert te starten**. De enige uitzondering op hoofdniveau is `$schema` (tekenreeks), zodat editors metagegevens van JSON Schema kunnen toevoegen.
</Warning>

`openclaw config schema` toont het canonieke JSON Schema dat wordt gebruikt door de bedieningsinterface
en voor validatie. `config.schema.lookup` haalt één knooppunt binnen een specifiek pad plus
samenvattingen van onderliggende knooppunten op voor tools voor detailnavigatie. Documentatiemetagegevens van de velden `title`/`description`
worden doorgegeven via geneste objecten, jokertekens (`*`), array-items (`[]`) en vertakkingen van `anyOf`/
`oneOf`/`allOf`. Runtimeschema's voor plugins en kanalen worden samengevoegd wanneer het
manifestregister is geladen.

Wanneer de validatie mislukt:

- De Gateway start niet op
- Alleen diagnostische opdrachten werken (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Voer `openclaw doctor` uit om de exacte problemen te bekijken
- Voer `openclaw doctor --fix` uit (`--repair` is dezelfde vlag; `--yes` slaat vragen over) om reparaties toe te passen

Na elke geslaagde opstart bewaart de Gateway een vertrouwde kopie van de laatst bekende werkende configuratie,
maar bij het opstarten en direct herladen wordt deze niet automatisch hersteld; alleen `openclaw doctor --fix`
doet dat. Als `openclaw.json` niet door de validatie komt (inclusief lokale validatie van plugins), mislukt het
opstarten van de Gateway of wordt het herladen overgeslagen en blijft de huidige runtime de laatst geaccepteerde
configuratie gebruiken. Een geweigerde schrijfbewerking wordt voor inspectie ook opgeslagen als `<path>.rejected.<timestamp>`.
De Gateway blokkeert schrijfbewerkingen die op onbedoeld overschrijven lijken: het verwijderen van `gateway.mode`,
het verliezen van het blok `meta` of het met meer dan de helft verkleinen van het bestand, tenzij de schrijfbewerking
destructieve wijzigingen expliciet toestaat. Promotie tot de laatst bekende werkende configuratie wordt overgeslagen wanneer een
kandidaat een tijdelijke aanduiding voor een geredigeerd geheim bevat, zoals `***` of `[redacted]`.

## Veelvoorkomende taken

<AccordionGroup>
  <Accordion title="Een kanaal instellen (WhatsApp, Telegram, Discord enzovoort)">
    Elk kanaal heeft een eigen configuratiesectie onder `channels.<provider>`. Zie de specifieke kanaalpagina voor de installatiestappen:

    - [Discord](/nl/channels/discord) - `channels.discord`
    - [Feishu](/nl/channels/feishu) - `channels.feishu`
    - [Google Chat](/nl/channels/googlechat) - `channels.googlechat`
    - [iMessage](/nl/channels/imessage) - `channels.imessage`
    - [Mattermost](/nl/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/nl/channels/msteams) - `channels.msteams`
    - [Signal](/nl/channels/signal) - `channels.signal`
    - [Slack](/nl/channels/slack) - `channels.slack`
    - [Telegram](/nl/channels/telegram) - `channels.telegram`
    - [WhatsApp](/nl/channels/whatsapp) - `channels.whatsapp`

    Alle kanalen gebruiken hetzelfde patroon voor DM-beleid:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // alleen voor allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modellen kiezen en configureren">
    Stel het primaire model en optionele terugvalmodellen in:

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

    - `agents.defaults.models` definieert de modelcatalogus en fungeert als toelatingslijst voor `/model`; vermeldingen in `provider/*` filteren `/model`, `/models` en modelkiezers tot de geselecteerde providers, terwijl dynamische modeldetectie actief blijft.
    - Gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om vermeldingen aan de toelatingslijst toe te voegen zonder bestaande modellen te verwijderen. Gewone vervangingen die vermeldingen zouden verwijderen, worden geweigerd tenzij je `--replace` meegeeft.
    - Modelverwijzingen gebruiken de indeling `provider/model` (bijvoorbeeld `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` bepaalt het verkleinen van afbeeldingen in transcripties en tools (standaard `1200`); lagere waarden verminderen doorgaans het gebruik van vision-tokens bij uitvoeringen met veel schermafbeeldingen.
    - Zie [CLI voor modellen](/nl/concepts/models) voor het wisselen van modellen in chats en [Model-failover](/nl/concepts/model-failover) voor authenticatierotatie en terugvalgedrag.
    - Zie voor aangepaste of zelfgehoste providers [Aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls) in de referentie.

  </Accordion>

  <Accordion title="Bepalen wie de bot berichten kan sturen">
    DM-toegang wordt per kanaal geregeld via `dmPolicy` (standaard `"pairing"`):

    - `"pairing"`: onbekende afzenders krijgen een eenmalige koppelingscode ter goedkeuring
    - `"allowlist"`: alleen afzenders in `allowFrom` (of de gekoppelde toelatingsopslag)
    - `"open"`: alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)
    - `"disabled"`: alle DM's negeren

    Gebruik voor groepen `groupPolicy` (`"allowlist" | "open" | "disabled"`) plus `groupAllowFrom` of kanaalspecifieke toelatingslijsten.

    Zie de [volledige referentie](/nl/gateway/config-channels#dm-and-group-access) voor details per kanaal.

  </Accordion>

  <Accordion title="Vermeldingscontrole voor groepschats instellen">
    Voor groepsberichten is standaard een **vermelding vereist**. Configureer activeringspatronen per agent. Normale antwoorden in groepen en kanalen worden automatisch geplaatst; kies voor gedeelde ruimten waarin de agent moet bepalen wanneer deze spreekt expliciet voor het pad via de berichtentool:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // stel "message_tool" in om overal verzending via de berichtentool te vereisen
        groupChat: {
          visibleReplies: "message_tool", // expliciete keuze; zichtbare uitvoer vereist message(action=send)
          unmentionedInbound: "room_event", // niet-vermelde, voortdurend actieve groepsgesprekken vormen stille context
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

    - **Vermeldingen in metagegevens**: native @-vermeldingen (tikken om iemand te vermelden in WhatsApp, @bot in Telegram enzovoort)
    - **Tekstpatronen**: veilige regex-patronen in `mentionPatterns`
    - **Zichtbare antwoorden**: `messages.visibleReplies` kan verzending via de berichtentool globaal vereisen; `messages.groupChat.visibleReplies` overschrijft dit voor groepen en kanalen.
    - Zie de [volledige referentie](/nl/gateway/config-channels#group-chat-mention-gating) voor modi voor zichtbare antwoorden, kanaalspecifieke overschrijvingen en de modus voor chats met jezelf.

  </Accordion>

  <Accordion title="Skills per agent beperken">
    Gebruik `agents.defaults.skills` voor een gedeelde basislijn en overschrijf vervolgens specifieke
    agents met `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // neemt github en weather over
          { id: "docs", skills: ["docs-search"] }, // vervangt de standaardwaarden
          { id: "locked-down", skills: [] }, // geen skills
        ],
      },
    }
    ```

    - Laat `agents.defaults.skills` weg om standaard onbeperkte Skills toe te staan.
    - Laat `agents.list[].skills` weg om de standaardwaarden over te nemen.
    - Stel `agents.list[].skills: []` in voor geen Skills.
    - Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en
      de [configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Statusbewaking van Gateway-kanalen afstemmen">
    Bepaal hoe agressief de Gateway kanalen opnieuw start die verouderd lijken:

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

    - De weergegeven waarden zijn de standaardwaarden. Stel `gateway.channelHealthCheckMinutes: 0` in om herstarts door de statusmonitor globaal uit te schakelen.
    - `channelStaleEventThresholdMinutes` moet groter dan of gelijk aan het controle-interval zijn.
    - Gebruik `channels.<provider>.healthMonitor.enabled` of `channels.<provider>.accounts.<id>.healthMonitor.enabled` om automatische herstarts voor één kanaal of account uit te schakelen zonder de globale monitor uit te schakelen.
    - Zie [Statuscontroles](/nl/gateway/health) voor operationele foutopsporing en de [volledige referentie](/nl/gateway/configuration-reference#gateway) voor alle velden.

  </Accordion>

  <Accordion title="Time-out voor de WebSocket-handshake van de Gateway afstemmen">
    Geef lokale clients meer tijd om de WebSocket-handshake vóór authenticatie te voltooien op
    zwaarbelaste hosts of hosts met weinig rekenkracht:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - De standaardwaarde is `15000` milliseconden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft nog steeds voorrang voor eenmalige service- of shelloverschrijvingen.
    - Los eerst vastlopers tijdens het opstarten of in de eventloop op; deze instelling is bedoeld voor hosts die gezond zijn, maar traag tijdens het opwarmen.

  </Accordion>

  <Accordion title="Sessies en resets configureren">
    Sessies bepalen de continuïteit en isolatie van gesprekken:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // aanbevolen voor meerdere gebruikers
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
    - `threadBindings`: algemene standaardwaarden voor sessieroutering die aan threads is gekoppeld. `/focus`, `/unfocus`, `/agents`, `/session idle` en `/session max-age` koppelen, ontkoppelen, tonen en configureren dit per sessie (Discord koppelt threads, Telegram koppelt onderwerpen/gesprekken).
    - Zie [Sessiebeheer](/nl/concepts/session) voor bereik, identiteitskoppelingen en verzendbeleid.
    - Zie de [volledige referentie](/nl/gateway/config-agents#session) voor alle velden.

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

    Bouw eerst de image: voer vanuit een broncheckout `scripts/sandbox-setup.sh` uit, of raadpleeg bij een npm-installatie de inlineopdracht `docker build` in [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup).

    Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige handleiding en de [volledige referentie](/nl/gateway/config-agents#agentsdefaultssandbox) voor alle opties.

  </Accordion>

  <Accordion title="Push via een relay inschakelen voor officiële iOS-builds">
    Push via een relay voor openbare App Store-builds gebruikt de gehoste OpenClaw-relay: `https://ios-push-relay.openclaw.ai`.

    Aangepaste relayimplementaties vereisen een bewust afzonderlijk iOS-build- en implementatietraject waarvan de relay-URL overeenkomt met de relay-URL van de Gateway. Stel bij gebruik van een aangepaste relaybuild dit in de Gateway-configuratie in:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optioneel. Standaard: 10000
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

    - Hiermee kan de Gateway `push.test`, activeringssignalen en activeringssignalen voor opnieuw verbinden via de externe relay verzenden.
    - Gebruikt een aan de registratie gekoppelde verzendmachtiging die door de gekoppelde iOS-app wordt doorgestuurd. De Gateway heeft geen relaytoken voor de volledige implementatie nodig.
    - Koppelt elke registratie via de relay aan de Gateway-identiteit waarmee de iOS-app is gekoppeld, zodat een andere Gateway de opgeslagen registratie niet opnieuw kan gebruiken.
    - Laat lokale/handmatige iOS-builds rechtstreeks APNs gebruiken. Verzending via de relay geldt alleen voor officieel gedistribueerde builds die zich via de relay hebben geregistreerd.
    - Moet overeenkomen met de relaybasis-URL die in de iOS-build is ingebakken, zodat registratie- en verzendverkeer dezelfde relayimplementatie bereiken.

    End-to-endproces:

    1. Installeer de officiële iOS-app.
    2. Optioneel: configureer `gateway.push.apns.relay.baseUrl` alleen op de Gateway wanneer je een bewust afzonderlijke aangepaste relaybuild gebruikt.
    3. Koppel de iOS-app aan de Gateway en laat zowel Node- als operatorsessies verbinding maken.
    4. De iOS-app haalt de Gateway-identiteit op, registreert zich bij de relay met App Attest en het app-ontvangstbewijs en publiceert vervolgens de via de relay ondersteunde `push.apns.register`-payload naar de gekoppelde Gateway.
    5. De Gateway slaat de relayhandle en verzendmachtiging op en gebruikt deze vervolgens voor `push.test`, activeringssignalen en activeringssignalen voor opnieuw verbinden.

    Operationele opmerkingen:

    - Als je de iOS-app naar een andere Gateway overschakelt, verbind je de app opnieuw zodat deze een nieuwe, aan die Gateway gekoppelde relayregistratie kan publiceren.
    - Als je een nieuwe iOS-build uitbrengt die naar een andere relayimplementatie verwijst, vernieuwt de app de gecachete relayregistratie in plaats van de oude relayoorsprong opnieuw te gebruiken.

    Compatibiliteitsopmerking:

    - `OPENCLAW_APNS_RELAY_BASE_URL` en `OPENCLAW_APNS_RELAY_TIMEOUT_MS` werken nog steeds als tijdelijke omgevingsoverschrijvingen.
    - Aangepaste Gateway-relay-URL's moeten overeenkomen met de relaybasis-URL die in de iOS-build is ingebakken; het openbare App Store-releasetraject weigert aangepaste overschrijvingen van de iOS-relay-URL.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` blijft een uitsluitend voor loopback bestemde ontsnappingsroute voor ontwikkeling; sla HTTP-relay-URL's niet blijvend op in de configuratie.

    Zie [iOS-app](/nl/platforms/ios#relay-backed-push-for-official-builds) voor het end-to-endproces en [Authenticatie- en vertrouwensproces](/nl/platforms/ios#authentication-and-trust-flow) voor het beveiligingsmodel van de relay.

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

    - `every`: duurtekenreeks (`30m`, `2h`). Stel `0m` in om uit te schakelen. Standaard: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`)
    - `directPolicy`: `allow` (standaard) of `block` voor Heartbeat-doelen in DM-stijl
    - Zie [Heartbeat](/nl/gateway/heartbeat) voor de volledige handleiding.

  </Accordion>

  <Accordion title="Cron-taken configureren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // standaard; Cron-dispatch + geïsoleerde uitvoering van Cron-agentbeurten
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: verwijder voltooide geïsoleerde uitvoeringssessies uit SQLite-sessierijen (standaard `24h`; stel `false` in om uit te schakelen).
    - De uitvoeringsgeschiedenis bewaart automatisch de nieuwste 2000 terminalrijen per taak; verloren rijen behouden hun opschoningsperiode van 24 uur.
    - Zie [Cron-taken](/nl/automation/cron-jobs) voor een functieoverzicht en CLI-voorbeelden.

  </Accordion>

  <Accordion title="Webhooks (hooks) instellen">
    Schakel HTTP-webhookeindpunten op de Gateway in:

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
    - Behandel alle inhoud van hook-/webhookpayloads als niet-vertrouwde invoer.
    - Gebruik een afzonderlijke `hooks.token`; gebruik actieve Gateway-authenticatiegeheimen (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) niet opnieuw.
    - Hookauthenticatie werkt uitsluitend via headers (`Authorization: Bearer ...` of `x-openclaw-token`); tokens in queryreeksen worden geweigerd.
    - `hooks.path` mag niet `/` zijn; houd webhookinvoer op een afzonderlijk subpad, zoals `/hooks`.
    - Houd omzeilingsvlaggen voor onveilige inhoud uitgeschakeld (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), tenzij je zeer gericht fouten opspoort.
    - Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om door de aanroeper gekozen sessiesleutels te begrenzen.
    - Geef voor door hooks aangestuurde agents de voorkeur aan sterke moderne modellagen en een strikt toolbeleid (bijvoorbeeld alleen berichten plus waar mogelijk sandboxing).

    Zie de [volledige referentie](/nl/gateway/configuration-reference#hooks) voor alle toewijzingsopties en Gmail-integratie.

  </Accordion>

  <Accordion title="Routering voor meerdere agents configureren">
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

    Zie [Meerdere agents](/nl/concepts/multi-agent) en de [volledige referentie](/nl/gateway/config-agents#multi-agent-routing) voor koppelingsregels en toegangsprofielen per agent.

  </Accordion>

  <Accordion title="Configuratie over meerdere bestanden verdelen ($include)">
    Gebruik `$include` om grote configuraties te ordenen:

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
    - **Bestandsarray**: wordt op volgorde diep samengevoegd (latere waarden winnen), tot 10 geneste niveaus diep
    - **Nevensleutels**: worden na de invoegingen samengevoegd (overschrijven ingevoegde waarden)
    - **Relatieve paden**: worden opgelost ten opzichte van het invoegende bestand
    - **Padindeling**: invoegpaden mogen geen nullbytes bevatten en moeten voor en na het oplossen strikt korter dan 4096 tekens zijn
    - **Door OpenClaw beheerde schrijfbewerkingen**: wanneer een schrijfbewerking slechts één sectie op het hoogste niveau wijzigt
      die wordt ondersteund door een invoeging van één bestand, zoals `plugins: { $include: "./plugins.json5" }`,
      werkt OpenClaw dat ingevoegde bestand bij en laat het `openclaw.json` intact
    - **Niet-ondersteund doorschrijven**: invoegingen op hoofdniveau, invoegarrays en invoegingen
      met nevenoverschrijvingen worden voor door OpenClaw beheerde schrijfbewerkingen standaard geweigerd in plaats van
      de configuratie af te vlakken
    - **Begrenzing**: paden van `$include` moeten worden opgelost binnen de map die
      `openclaw.json` bevat. Als je een boomstructuur tussen machines of gebruikers wilt delen, stel je
      `OPENCLAW_INCLUDE_ROOTS` in op een padenlijst (`:` op POSIX, `;` op Windows) met
      aanvullende mappen waarnaar invoegingen mogen verwijzen. Symbolische koppelingen worden opgelost
      en opnieuw gecontroleerd. Daardoor wordt een pad dat tekstueel in een configuratiemap staat, maar waarvan
      het werkelijke doel buiten elke toegestane hoofdmap valt, nog steeds geweigerd.
    - **Foutafhandeling**: duidelijke fouten voor ontbrekende bestanden, parseerfouten, circulaire invoegingen, ongeldige padindeling en overmatige lengte

  </Accordion>
</AccordionGroup>

## Configuratie dynamisch herladen

De Gateway bewaakt `~/.openclaw/openclaw.json` en past wijzigingen automatisch toe. Voor de meeste instellingen is geen handmatige herstart nodig.

Rechtstreekse bestandsbewerkingen worden als niet-vertrouwd behandeld totdat ze zijn gevalideerd. De watcher wacht
tot tijdelijke schrijf- en hernoemactiviteiten van de editor zijn gestabiliseerd, leest het definitieve bestand en weigert
ongeldige externe bewerkingen zonder `openclaw.json` te herschrijven. Door OpenClaw beheerde schrijfbewerkingen van de configuratie
gebruiken vóór het schrijven dezelfde schemavalidatie (zie [Strikte validatie](#strict-validation)
voor de regels voor overschrijven en terugdraaien die op elke schrijfbewerking van toepassing zijn).

Als je `config reload skipped (invalid config)` ziet of bij het opstarten `Invalid
config` wordt gemeld, controleer dan de configuratie, voer `openclaw config validate` uit en voer vervolgens `openclaw
doctor --fix` uit om deze te herstellen. Zie [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting#gateway-rejected-invalid-config)
voor de controlelijst.

### Herlaadmodi

| Modus                  | Gedrag                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (standaard) | Past veilige wijzigingen direct dynamisch toe. Start automatisch opnieuw bij kritieke wijzigingen. |
| **`hot`**              | Past alleen veilige wijzigingen dynamisch toe. Logt een waarschuwing wanneer opnieuw starten nodig is — je handelt dit zelf af. |
| **`restart`**          | Start de Gateway opnieuw bij elke configuratiewijziging, veilig of niet.                |
| **`off`**              | Schakelt bestandsbewaking uit. Wijzigingen worden van kracht bij de volgende handmatige herstart. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Wat dynamisch wordt toegepast en waarvoor een herstart nodig is

De meeste velden worden zonder uitvaltijd dynamisch toegepast; sommige dynamisch toegepaste secties starten alleen dat
subsysteem opnieuw (kanaal, cron, heartbeat, statusmonitor) in plaats van de volledige Gateway. In de modus
`hybrid` worden wijzigingen waarvoor de Gateway opnieuw moet worden gestart automatisch afgehandeld.

| Categorie           | Velden                                                                  | Herstart van Gateway nodig? |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kanalen             | `channels.*`, `web` (WhatsApp) — alle ingebouwde kanalen en pluginkanalen | Nee (start dat kanaal opnieuw) |
| Agent en modellen   | `agent`, `agents`, `models`, `routing`                                  | Nee                          |
| Automatisering      | `hooks`, `cron`, `agent.heartbeat`                                      | Nee (start dat subsysteem opnieuw) |
| Sessies en berichten | `session`, `messages`                                                  | Nee                          |
| Tools en media      | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Nee                          |
| Pluginconfiguratie  | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Nee (herlaadt de pluginruntime) |
| UI en overig        | `ui`, `logging`, `identity`, `bindings`                                 | Nee                          |
| Gateway-server      | `gateway.*` (poort, binding, authenticatie, Tailscale, TLS, HTTP, push) | **Ja**                       |
| Infrastructuur      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ja**                       |

<Note>
`gateway.reload` en `gateway.remote` zijn uitzonderingen onder `gateway.*` — wijzigingen daaraan veroorzaken **geen** herstart. Afzonderlijke plugins kunnen deze tabel ook overschrijven: een geladen plugin kan eigen configuratievoorvoegsels declareren die een herstart veroorzaken (de meegeleverde Canvas-plugin start de Gateway bijvoorbeeld opnieuw voor `plugins.enabled`, `plugins.allow` en `plugins.deny`, en niet alleen voor zijn eigen `plugins.entries.canvas`), waardoor het daadwerkelijke gedrag afhangt van welke plugins actief zijn.
</Note>

### Herlaadplanning

Wanneer je een bronbestand bewerkt waarnaar via `$include` wordt verwezen, plant OpenClaw
het herladen op basis van de indeling zoals die in de bron is vastgelegd, niet op basis van de afgevlakte weergave in het geheugen.
Daardoor blijven beslissingen over dynamisch herladen (dynamisch toepassen of opnieuw starten) voorspelbaar, zelfs wanneer één
sectie op het hoogste niveau in een afzonderlijk opgenomen bestand staat, zoals
`plugins: { $include: "./plugins.json5" }`. Herlaadplanning wordt uit veiligheid geweigerd als de
bronindeling dubbelzinnig is.

## Configuratie-RPC (programmatische updates)

Gebruik voor tools die configuratie via de Gateway-API schrijven bij voorkeur deze procedure:

- `config.schema.lookup` om één substructuur te inspecteren (oppervlakkig schemaknooppunt en samenvattingen van onderliggende knooppunten)
- `config.get` om de huidige momentopname plus `hash` op te halen
- `config.patch` voor gedeeltelijke updates (JSON-samenvoegpatch: objecten worden samengevoegd, `null`
  verwijdert, arrays worden vervangen wanneer dit expliciet wordt bevestigd met `replacePaths` als
  vermeldingen zouden worden verwijderd)
- `config.apply` alleen wanneer je de volledige configuratie wilt vervangen
- `update.run` voor een expliciete zelfupdate plus herstart; neem `continuationMessage` op wanneer de sessie na de herstart nog één vervolgronde moet uitvoeren
- `update.status` om de nieuwste herstartmarkering voor updates te inspecteren en na een herstart de actieve versie te verifiëren

Agents moeten `config.schema.lookup` als eerste informatiebron gebruiken voor exacte
documentatie en beperkingen op veldniveau. Gebruik [Configuratiereferentie](/nl/gateway/configuration-reference)
wanneer ze het bredere configuratieoverzicht, standaardwaarden of links naar specifieke
subsysteemreferenties nodig hebben.

<Note>
Schrijfbewerkingen op het besturingsvlak (`config.apply`, `config.patch`, `update.run`) zijn
beperkt tot 3 verzoeken per 60 seconden per `deviceId+clientIp`. Herstartverzoeken
worden samengevoegd, waarna tussen herstartcycli een afkoelperiode van 30 seconden geldt.
`update.status` is alleen-lezen, maar beperkt tot beheerders, omdat de herstartmarkering
samenvattingen van updatestappen en de laatste regels van opdrachtuitvoer kan bevatten.
</Note>

Voorbeeld van een gedeeltelijke patch:

```bash
openclaw gateway call config.get --params '{}'  # leg payload.hash vast
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zowel `config.apply` als `config.patch` accepteert `raw`, `baseHash`, `sessionKey`,
`note` en `restartDelayMs`. `baseHash` is voor beide methoden vereist zodra er al een
configuratiebestand bestaat (bij een eerste schrijfbewerking zonder bestaande configuratie wordt de controle overgeslagen).

`config.patch` accepteert ook `replacePaths`, een array met configuratiepaden waarvan de vervanging
van de array opzettelijk is. Als een patch een bestaande array zou vervangen door of verwijderen ten gunste van
een array met minder vermeldingen, weigert de Gateway de schrijfbewerking tenzij dat exacte pad voorkomt
in `replacePaths`; geneste arrays binnen arrayvermeldingen gebruiken `[]`, zoals
`agents.list[].skills`. Dit voorkomt dat afgekorte momentopnamen van `config.get`
routerings- of toelatingslijstarrays ongemerkt overschrijven. Gebruik `config.apply` wanneer je
de volledige configuratie wilt vervangen.

## Omgevingsvariabelen

OpenClaw leest omgevingsvariabelen uit het bovenliggende proces en daarnaast uit:

- `.env` uit de huidige werkmap (indien aanwezig)
- `~/.openclaw/.env` (globale terugvaloptie)

Geen van beide bestanden overschrijft bestaande omgevingsvariabelen. Je kunt omgevingsvariabelen ook rechtstreeks in de configuratie instellen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-omgevingsvariabelen importeren (optioneel)">
  Als dit is ingeschakeld en verwachte sleutels niet zijn ingesteld, voert OpenClaw je loginshell uit en importeert het alleen de ontbrekende sleutels:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalent als omgevingsvariabele: `OPENCLAW_LOAD_SHELL_ENV=1`. Standaardwaarde voor `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Vervanging door omgevingsvariabelen in configuratiewaarden">
  Verwijs in elke tekenreekswaarde van de configuratie naar omgevingsvariabelen met `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regels:

- Alleen namen in hoofdletters komen overeen: `[A-Z_][A-Z0-9_]*`
- Ontbrekende of lege variabelen veroorzaken tijdens het laden een fout
- Escape met `$${VAR}` voor letterlijke uitvoer
- Werkt binnen `$include`-bestanden
- Inlinevervanging: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Geheime verwijzingen (omgeving, bestand, uitvoering)">
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

Details over SecretRef (waaronder `secrets.providers` voor `env`/`file`/`exec`) staan in [Beheer van geheimen](/nl/gateway/secrets).
Ondersteunde referentiepaden voor aanmeldgegevens staan vermeld in [SecretRef-aanmeldgegevensoppervlak](/nl/reference/secretref-credential-surface).
</Accordion>

Zie [Omgeving](/nl/help/environment) voor de volledige prioriteitsvolgorde en bronnen.

## Volledige referentie

Zie **[Configuratiereferentie](/nl/gateway/configuration-reference)** voor de volledige referentie per veld.

---

_Gerelateerd: [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Configuratiereferentie](/nl/gateway/configuration-reference) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
- [Gateway-draaiboek](/nl/gateway)
