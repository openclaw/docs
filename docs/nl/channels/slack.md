---
read_when:
    - Slack instellen of de socket-, HTTP- of relaymodus van Slack debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode, HTTP Request URLs en relaymodus)
title: Slack
x-i18n:
    generated_at: "2026-07-16T15:13:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack-ondersteuning omvat privéberichten en kanalen via Slack-appintegraties. Het standaardtransport is Socket Mode; HTTP Request URLs worden ook ondersteund. Relay-modus is bedoeld voor beheerde implementaties waarbij een vertrouwde router de Slack-ingang beheert.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Slack-privéberichten gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van systeemeigen opdrachten en opdrachtencatalogus.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en draaiboeken voor herstel.
  </Card>
</CardGroup>

## Een transport kiezen

Socket Mode en HTTP Request URLs bieden dezelfde functionaliteit voor berichten, slash-opdrachten, App Home en interactiviteit. Kies op basis van de implementatievorm, niet van de functies.

| Aandachtspunt                | Socket Mode (standaard)                                                                                                                              | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Openbare Gateway-URL         | Niet vereist                                                                                                                                         | Vereist (DNS, TLS, reverse proxy of tunnel)                                                                    |
| Uitgaand netwerk             | Uitgaande WSS naar `wss-primary.slack.com` moet bereikbaar zijn                                                                                           | Geen uitgaande WS; alleen inkomende HTTPS                                                                      |
| Benodigde tokens             | Bot-token + App-Level Token met `connections:write`                                                                                                   | Bot-token + Signing Secret                                                                                     |
| Ontwikkellaptop / achter firewall | Werkt zonder aanpassingen                                                                                                                       | Vereist een openbare tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) of staging-Gateway                    |
| Horizontaal schalen          | Eén Socket Mode-sessie per app per host; meerdere Gateways vereisen afzonderlijke Slack-apps                                                         | Statusloze POST-handler; meerdere Gateway-replica's kunnen één app delen achter een loadbalancer               |
| Meerdere accounts op één Gateway | Ondersteund; elk account opent een eigen WS                                                                                                      | Ondersteund; elk account vereist een unieke `webhookPath` (standaard `/slack/events`) zodat registraties niet botsen |
| Transport voor slash-opdrachten | Geleverd via de WS-verbinding; `slash_commands[].url` wordt genegeerd                                                                                | Slack POST naar `slash_commands[].url`; het veld is vereist om de opdracht te routeren                             |
| Ondertekening van verzoeken  | Niet gebruikt (authenticatie verloopt via de App-Level Token)                                                                                        | Slack ondertekent elk verzoek; OpenClaw verifieert met `signingSecret`                                      |
| Herstel bij verbroken verbinding | Automatisch opnieuw verbinden door de Slack SDK is ingeschakeld; OpenClaw herstart ook mislukte Socket Mode-sessies met begrensde back-off. Transportafstemming voor pong-time-outs is van toepassing. | Geen permanente verbinding die kan worden verbroken; Slack voert nieuwe pogingen per verzoek uit              |

<Note>
  **Kies Socket Mode** voor hosts met één Gateway, ontwikkellaptops en on-premises netwerken die `*.slack.com` uitgaand kunnen bereiken, maar geen inkomende HTTPS kunnen accepteren.

**Kies HTTP Request URLs** wanneer je meerdere Gateway-replica's achter een loadbalancer uitvoert, uitgaande WSS is geblokkeerd maar inkomende HTTPS is toegestaan, of je Slack-webhooks al bij een reverse proxy afhandelt.
</Note>

<Warning>
  Slack kan voor één app meerdere Socket Mode-verbindingen onderhouden en elke payload aan om het even welke verbinding leveren. Afzonderlijke OpenClaw-gateways die een Slack-app delen, hebben daarom gelijkwaardige routerings- en autorisatieconfiguraties nodig. Gebruik anders een afzonderlijke Slack-app per gateway, één relay-ingang of HTTP Request URLs achter een loadbalancer. Zie [Socket Mode gebruiken](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Relay-modus

Relay-modus scheidt de Slack-ingang van de OpenClaw-gateway. Een vertrouwde router beheert de enige Slack Socket Mode-verbinding, kiest een doelgateway en stuurt een getypeerde gebeurtenis door via een geauthenticeerde websocket. De gateway gebruikt nog steeds zijn eigen bot-token voor uitgaande Slack Web API-aanroepen.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

De relay-URL moet `wss://` gebruiken, tenzij deze naar localhost verwijst. Behandel het bearer-token en de routetabel van de router als onderdeel van de Slack-autorisatiegrens: gerouteerde gebeurtenissen komen als geautoriseerde activeringen binnen bij de normale Slack-berichtenhandler. Een door de router verstrekte `slack_identity` in het websocket-`hello`-frame kan de standaard uitgaande gebruikersnaam en het pictogram instellen; een expliciete identiteit die door de aanroeper wordt opgegeven, heeft nog steeds voorrang. De relay-verbinding maakt opnieuw verbinding met dezelfde begrensde back-offtiming als Socket Mode en wist de door de router verstrekte identiteit telkens wanneer de verbinding wordt verbroken.

### Organisatiebrede Enterprise Grid-installaties

Eén Slack-account kan berichten ontvangen van elke werkruimte die onder een
organisatiebrede Enterprise Grid-installatie valt. Kies rechtstreeks Socket Mode of HTTP
Request URLs; relay-modus wordt niet ondersteund voor enterprise-accounts. Beide
onderstaande manifesten met minimale bevoegdheden schakelen alleen het V1-pad voor `message`- en `app_mention`-
gebeurtenissen, directe antwoorden en door de listener beheerde statusreacties in.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Laat een Enterprise Grid Org Admin of Org Owner de app goedkeuren, installeer deze op
organisatieniveau en kies de werkruimten waarop de installatie betrekking heeft.
Controleer voordat OpenClaw wordt gestart of de app in elke beoogde werkruimte beschikbaar is.
Genereer voor Socket Mode een token op appniveau met `connections:write`
en kopieer vervolgens het bot-token uit de organisatie-installatie. Configureer het account dat
het door de organisatie geïnstalleerde bot-token gebruikt:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

Gebruik de HTTP-modus wanneer de Gateway een openbaar HTTPS-eindpunt heeft en geen
Socket Mode-verbinding opent. Vervang de voorbeeld-URL door de openbare
`webhookPath`-URL van de Gateway (standaard `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Laat een Enterprise Grid Org Admin of Org Owner de app goedkeuren, installeer deze op
organisatieniveau en kies de werkruimten waarop de installatie betrekking heeft.
Nadat Slack de Request URL heeft geverifieerd, kopieer je het bot-token van de organisatie-installatie en
het **Basic Information -> App Credentials -> Signing Secret** van de app. Configureer
het enterprise-account met hetzelfde pad voor de Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Bij het opstarten verifieert OpenClaw `enterpriseOrgInstall` met Slack `auth.test`.
Een door de organisatie geïnstalleerd token zonder de vlag, of een werkruimtetoken met de vlag,
zorgt ervoor dat het opstarten mislukt. Slack blijft de bron van waarheid voor welke werkruimten
toestemming voor de installatie hebben verleend; OpenClaw past vervolgens het geconfigureerde kanaal-, gebruikers-,
privéberichten- en vermeldingenbeleid toe op elke geleverde gebeurtenis. Enterprise V1 weigert alle
door bots geschreven `message`- en `app_mention`-gebeurtenissen vóór routering, ongeacht
`allowBots`, omdat organisatie-installaties geen stabiele, aan een werkruimte gekoppelde
bot-identiteit bieden om lussen te voorkomen.

Enterprise-ondersteuning is bewust beperkt tot rechtstreekse Socket Mode- of HTTP-
`message`- en `app_mention`-gebeurtenissen en hun directe antwoorden. Relay-modus,
slash-opdrachten, interacties, App Home, listeners voor reactiegebeurtenissen, vastgemaakte items, Slack-
actietools, systeemeigen Slack-goedkeuringen, bindingen, levering in wachtrijen of volgens planning
en proactief verzenden zijn niet beschikbaar voor een enterprise-account. Uitgaande
bevestigings-, typ- en statusreacties worden ondersteund via de
door de listener beheerde Slack-client en vereisen `reactions:write`; inkomende meldingen van reacties
en actietools voor reacties blijven niet beschikbaar.

Directe antwoorden gebruiken opnieuw het standaardgedrag voor Slack-bezorging voor delen,
media, metadata, terugval voor identiteit, linkvoorvertoningen en ontvangstbevestigingen, maar alleen zolang de
gevalideerde client die eigendom is van de listener binnen de actieve eventverwerking blijft. De
verzendwachtrij in het geheugen en de registraties van deelname aan threads worden per workspace van dat
event gescheiden; de client zelf wordt nooit geserialiseerd of persistent opgeslagen.

Kanaalbeleidsleutels en `dm.groupChannels`-vermeldingen moeten onbewerkte stabiele Slack-kanaal-ID's of de
vorm `channel:<id>` gebruiken. OpenClaw normaliseert beide vormen naar het onbewerkte kanaal-ID voor
runtimevergelijking; de voorvoegsels `slack:`, `group:` en `mpim:` verhinderen het opstarten.
Vermeldingen in gebruikersbeleid moeten stabiele Slack-gebruikers-ID's gebruiken; namen, slugs, weergavenamen
en e-mailadressen verhinderen het opstarten. ID's moeten het canonieke hoofdlettervoorvoegsel en de hoofdlettertekst
van Slack gebruiken (bijvoorbeeld `C0123456789` of `U0123456789`); varianten in kleine letters en
korte, erop lijkende waarden verhinderen het opstarten. Enterprise-accounts kunnen
`dangerouslyAllowNameMatching` niet inschakelen. Enterprise-accounts mogen de globale
`mentionPatterns.mode` instellen, maar `mentionPatterns.allowIn` en
`mentionPatterns.denyIn` verhinderen het opstarten omdat kale Slack-kanaal-ID's niet
aan een workspace zijn gekoppeld en in meerdere workspaces opnieuw kunnen worden gebruikt. Workspace-installaties
behouden het bestaande gedrag voor vermeldingpatronen binnen hun bereik. Elke geaccepteerde workspace
krijgt afzonderlijke identiteiten voor routering, sessies, transcripties, deduplicatie, geschiedenis en caches,
zelfs wanneer Slack-ID's overlappen. Binnen de `message`-stroom worden gewone gebruikersberichten
en door gebruikers aangemaakte `file_share`-events ondersteund; andere berichtsubtypen worden
vóór autorisatie of verwerking van systeemevents geweigerd.

Enterprise-DM's moeten uitgeschakeld zijn (`dm.enabled=false` of
`dmPolicy="disabled"`) of expliciet worden opengesteld met `dmPolicy="open"` en
een effectieve account-`allowFrom` die de letterlijke waarde `"*"` bevat. Een lege
toelatingslijst of gebruikersspecifieke ID's zonder `"*"` verhindert het opstarten. Koppeling en
DM-toelatingslijsten per gebruiker worden geweigerd omdat Slack-gebruikers-ID's in die autorisatieopslag
niet aan een workspace zijn gekoppeld. Kanaal- en afzenderbeleid blijft van toepassing op kanaalberichten.

## Installeren

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registreert en activeert de plugin. De plugin doet niets totdat je de Slack-app en onderstaande kanaalinstellingen configureert. Zie [Plugins](/nl/tools/plugin) voor algemene regels voor het installeren van plugins.

## Snelle configuratie

De manifesten in deze sectie maken een installatie die aan een workspace is gekoppeld. Gebruik voor een
organisatiebrede installatie in een Enterprise Grid-organisatie in plaats daarvan het speciale
[organisatiebrede manifest en de bijbehorende workflow](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Socketmodus (standaard)">
    <Steps>
      <Step title="Een nieuwe Slack-app maken">
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecteer je workspace → plak een van de onderstaande manifesten → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindt Slack-assistentthreads met OpenClaw-agents.",
      "suggested_prompts": [
        { "title": "Wat kun je doen?", "message": "Waarmee kun je me helpen?" },
        {
          "title": "Dit kanaal samenvatten",
          "message": "Vat de recente activiteit in dit kanaal samen."
        },
        { "title": "Een antwoord opstellen", "message": "Help me een antwoord op te stellen." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false
      }
    ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindt Slack-assistentthreads met OpenClaw-agents.",
      "suggested_prompts": [
        { "title": "Wat kun je doen?", "message": "Waarmee kun je me helpen?" },
        {
          "title": "Dit kanaal samenvatten",
          "message": "Vat de recente activiteit in dit kanaal samen."
        },
        { "title": "Een antwoord opstellen", "message": "Help me een antwoord op te stellen." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false
      }
    ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** komt overeen met de volledige functieset van de Slack-plugin: App Home, slash-opdrachten, bestanden, reacties, vastgezette items, groeps-DM's en het lezen van emoji's en gebruikersgroepen. Kies **Minimal** wanneer het workspacebeleid scopes beperkt — dit omvat DM's, kanaal-/groepsgeschiedenis, vermeldingen en slash-opdrachten, maar laat bestanden, reacties, vastgezette items, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg. Zie [Controlelijst voor manifest en scopes](#manifest-and-scope-checklist) voor de reden per scope en aanvullende opties, zoals extra slash-opdrachten.
        </Note>

        Nadat Slack de app heeft gemaakt:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: voeg `connections:write` toe, sla op en kopieer de App-Level Token.
        - **Install App -> Install to Workspace**: kopieer de Bot User OAuth Token.

      </Step>

      <Step title="OpenClaw configureren">

        Aanbevolen SecretRef-configuratie:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Terugval op omgevingsvariabelen (alleen standaardaccount):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL's voor HTTP-verzoeken">
    <Steps>
      <Step title="Een nieuwe Slack-app maken">
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecteer je workspace → plak een van de onderstaande manifesten → vervang `https://gateway-host.example.com/slack/events` door je openbare Gateway-URL → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindt Slack-assistentthreads met OpenClaw-agents.",
      "suggested_prompts": [
        { "title": "Wat kun je doen?", "message": "Waarmee kun je me helpen?" },
        {
          "title": "Dit kanaal samenvatten",
          "message": "Vat de recente activiteit in dit kanaal samen."
        },
        { "title": "Een antwoord opstellen", "message": "Help me een antwoord op te stellen." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimaal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindt Slack-assistentthreads met OpenClaw-agents.",
      "suggested_prompts": [
        { "title": "Wat kun je doen?", "message": "Waarmee kun je me helpen?" },
        {
          "title": "Dit kanaal samenvatten",
          "message": "Vat de recente activiteit in dit kanaal samen."
        },
        { "title": "Een antwoord opstellen", "message": "Help me een antwoord op te stellen." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Aanbevolen** komt overeen met de volledige functieset van de Slack-plugin; **Minimaal** laat bestanden, reacties, vastgemaakte items, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg voor beperkte werkruimten. Zie [Checklist voor manifest en scopes](#manifest-and-scope-checklist) voor de motivering per scope.
        </Note>

        <Info>
          De drie URL-velden (`slash_commands[].url`, `event_subscriptions.request_url` en `interactivity.request_url` / `message_menu_options_url`) verwijzen allemaal naar hetzelfde OpenClaw-eindpunt. Het manifestschema van Slack vereist dat ze afzonderlijk worden benoemd, maar OpenClaw routeert op payloadtype, zodat één `webhookPath` (standaard `/slack/events`) voldoende is. Slash-opdrachten zonder `slash_commands[].url` doen in HTTP-modus stilzwijgend niets.
        </Info>

        Nadat Slack de app heeft gemaakt:

        - **Basic Information → App Credentials**: kopieer het **Signing Secret** voor verzoekverificatie.
        - **Install App -> Install to Workspace**: kopieer het Bot User OAuth Token.

      </Step>

      <Step title="OpenClaw configureren">

        Aanbevolen SecretRef-configuratie:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Gebruik unieke webhookpaden voor HTTP met meerdere accounts

        Geef elk account een afzonderlijke `webhookPath` (standaard `/slack/events`), zodat registraties niet conflicteren.
        </Note>

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Transportafstemming voor Socket Mode

OpenClaw stelt de pong-time-out van de Slack SDK-client voor Socket Mode standaard in op 15 seconden. Pas de transportinstellingen alleen aan wanneer afstemming voor een specifieke werkruimte of host nodig is:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Gebruik dit alleen voor Socket Mode-werkruimten die time-outs voor Slack-websocketpongs of serverpings registreren, of die worden uitgevoerd op hosts met bekende event-loopstarvation. `clientPingTimeout` is de wachttijd voor een pong nadat de SDK een clientping heeft verzonden; `serverPingTimeout` is de wachttijd voor serverpings van Slack. App-berichten en gebeurtenissen blijven applicatiestatus, geen signalen voor de beschikbaarheid van het transport.

Opmerkingen:

- `socketMode` wordt genegeerd in de HTTP Request URL-modus.
- Basisinstellingen voor `channels.slack.socketMode` gelden voor alle Slack-accounts, tenzij ze worden overschreven. Overschrijvingen per account gebruiken `channels.slack.accounts.<accountId>.socketMode`; omdat dit een objectoverschrijving is, moet je elk socketafstemmingsveld opnemen dat je voor dat account wilt gebruiken.
- Alleen `clientPingTimeout` heeft een OpenClaw-standaardwaarde (`15000`). `serverPingTimeout` en `pingPongLoggingEnabled` worden alleen aan de Slack SDK doorgegeven wanneer ze zijn geconfigureerd.
- De herstartvertraging van Socket Mode begint rond 2 seconden en loopt op tot maximaal ongeveer 30 seconden. Bij herstelbare fouten tijdens het starten, wachten op de start en verbreken van de verbinding wordt opnieuw geprobeerd totdat het kanaal stopt. Permanente account- en referentiefouten, zoals ongeldige authenticatie, ingetrokken tokens of ontbrekende scopes, mislukken direct in plaats van eindeloos opnieuw te proberen.

## Checklist voor manifest en scopes

Het basismanifest van de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het blok `settings` (en `url` van de slash-opdracht) verschilt.

Basismanifest (standaard voor Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-connector voor OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindt Slack-assistentthreads met OpenClaw-agents.",
      "suggested_prompts": [
        { "title": "Wat kun je doen?", "message": "Waarmee kun je me helpen?" },
        {
          "title": "Dit kanaal samenvatten",
          "message": "Vat de recente activiteit in dit kanaal samen."
        },
        { "title": "Een antwoord opstellen", "message": "Help me een antwoord op te stellen." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false
      }
    ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Vervang voor de **HTTP Request URLs-modus** `settings` door de HTTP-variant en voeg `url` toe aan elke slash-opdracht. Openbare URL vereist:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Een bericht naar OpenClaw sturen",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Aanvullende manifestinstellingen

Maak verschillende functies beschikbaar die de bovenstaande standaardinstellingen uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Home** in en abonneert zich op `app_home_opened`. Wanneer een lid van de werkruimte het tabblad Home opent, publiceert OpenClaw een veilige standaardweergave voor Home met `views.publish`; er worden geen gesprekspayload of privéconfiguratie opgenomen. Wanneer de modus met één slash-opdracht is ingeschakeld, gebruikt de opdrachthint `channels.slack.slashCommand.name`; installaties die systeemeigen opdrachten of geen slash-opdrachten gebruiken, laten die hint weg. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's. Het manifest schakelt ook Slack-assistentthreads in met `features.assistant_view`, `assistant:write`, `assistant_thread_started` en `assistant_thread_context_changed`; assistentthreads worden naar hun eigen OpenClaw-threadsessies gerouteerd en houden de door Slack verstrekte threadcontext beschikbaar voor de agent.

<AccordionGroup>
  <Accordion title="Optionele systeemeigen slash-opdrachten">

    Meerdere [systeemeigen slash-opdrachten](#commands-and-slash-behavior) kunnen in plaats van één geconfigureerde opdracht worden gebruikt, met de volgende nuances:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat de opdracht `/status` is gereserveerd.
    - Er kunnen niet meer dan 25 slash-opdrachten tegelijk voor een Slack-app worden geregistreerd (Slack-platformlimiet).

    Vervang je bestaande sectie `features.slash_commands` door een subset van de [beschikbare opdrachten](/nl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (standaard)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Een nieuwe sessie starten",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "De huidige sessie opnieuw instellen"
    },
    {
      "command": "/compact",
      "description": "De sessiecontext comprimeren",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "De huidige uitvoering stoppen"
    },
    {
      "command": "/session",
      "description": "De vervaltijd van threadkoppelingen beheren",
      "usage_hint": "inactief <duration|off> of maximale leeftijd <duration|off>"
    },
    {
      "command": "/think",
      "description": "Het denkniveau instellen",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Uitgebreide uitvoer in- of uitschakelen",
      "usage_hint": "aan|uit|volledig"
    },
    {
      "command": "/fast",
      "description": "Snelle modus weergeven of instellen",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "De zichtbaarheid van de redenering in- of uitschakelen",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Verhoogde modus in- of uitschakelen",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Standaardinstellingen voor uitvoering weergeven of instellen",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Openstaande goedkeuringsverzoeken goedkeuren of afwijzen",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Het model weergeven of instellen",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Providers/modellen weergeven",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "De korte helpsamenvatting weergeven"
    },
    {
      "command": "/commands",
      "description": "De gegenereerde opdrachtencatalogus weergeven"
    },
    {
      "command": "/tools",
      "description": "Weergeven wat de huidige agent op dit moment kan gebruiken",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "De runtimestatus weergeven, inclusief providergebruik/quotum indien beschikbaar"
    },
    {
      "command": "/tasks",
      "description": "Actieve/recente achtergrondtaken voor de huidige sessie weergeven"
    },
    {
      "command": "/context",
      "description": "Uitleggen hoe de context wordt samengesteld",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Je afzenderidentiteit weergeven"
    },
    {
      "command": "/skill",
      "description": "Een skill op naam uitvoeren",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Een tussenvraag stellen zonder de sessiecontext te wijzigen",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Een tussenvraag stellen zonder de sessiecontext te wijzigen",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "De gebruiksvoettekst beheren of een kostenoverzicht weergeven",
      "usage_hint": "uit|tokens|volledig|kosten"
    }
  ]
}
```

      </Tab>
      <Tab title="URL's voor HTTP-verzoeken">
        Gebruik dezelfde lijst `slash_commands` als voor Socket Mode hierboven en voeg `"url": "https://gateway-host.example.com/slack/events"` aan elk item toe. Voorbeeld:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Een nieuwe sessie starten",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "De korte helpsamenvatting weergeven",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Herhaal die waarde `url` voor elke opdracht in de lijst.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionele auteurschapsbereiken (schrijfbewerkingen)">
    Voeg het botbereik `chat:write.customize` toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en aangepast pictogram) in plaats van de standaardidentiteit van de Slack-app.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionele gebruikerstokenbereiken (leesbewerkingen)">
    Als je `channels.slack.userToken` configureert, zijn gebruikelijke leesbereiken:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (als je afhankelijk bent van zoekleesbewerkingen van Slack)

  </Accordion>
</AccordionGroup>

## Tokenmodel

- `botToken` + `appToken` zijn vereist voor Socket Mode.
- HTTP-modus vereist `botToken` + `signingSecret`.
- Relay-modus vereist `botToken` plus `relay.url`, `relay.authToken` en `relay.gatewayId`; deze gebruikt geen app-token of ondertekeningsgeheim.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` en `userToken` accepteren platte-tekststrings
  of SecretRef-objecten.
- Tokens in de configuratie hebben voorrang op de fallback via omgevingsvariabelen.
- De fallback via omgevingsvariabelen voor `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` en `SLACK_USER_TOKEN` is telkens alleen van toepassing op het standaardaccount.
- `userToken` gebruikt standaard alleen-lezen gedrag (`userTokenReadOnly: true`).

Gedrag van de statusmomentopname:

- Slack-accountinspectie houdt per referentie de velden `*Source` en `*Status`
  bij (`botToken`, `appToken`, `signingSecret`, `userToken`).
- De status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheimbron, maar dat het huidige opdracht-/runtimepad
  de werkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is
  het vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/mapleesbewerkingen kan het gebruikerstoken de voorkeur krijgen wanneer dit is geconfigureerd. Voor schrijfbewerkingen blijft het bottoken de voorkeur houden; schrijfbewerkingen met gebruikerstokens zijn alleen toegestaan wanneer `userTokenReadOnly: false` en het bottoken niet beschikbaar is.
</Tip>

## Acties en poorten

Slack-acties worden beheerd door `channels.slack.actions.*`.

Beschikbare actiegroepen in de huidige Slack-tooling:

| Groep      | Standaard |
| ---------- | --------- |
| messages   | ingeschakeld |
| reactions  | ingeschakeld |
| pins       | ingeschakeld |
| memberInfo | ingeschakeld |
| emojiList  | ingeschakeld |

De huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die in placeholders voor inkomende bestanden worden weergegeven en retourneert afbeeldingsvoorbeelden voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.slack.dmPolicy` beheert DM-toegang. `channels.slack.allowFrom` is de canonieke DM-toestemmingslijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.slack.allowFrom` `"*"` bevat)
    - `disabled`

    DM-vlaggen:

    - `dm.enabled` (standaard true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (verouderd)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-toestemmingslijst)

    Voorrang bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` is alleen van toepassing op het account `default`.
    - Benoemde accounts nemen `channels.slack.allowFrom` over wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts nemen `channels.slack.accounts.default.allowFrom` niet over.

    Verouderde `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden voor compatibiliteit nog steeds gelezen. `openclaw doctor --fix` migreert deze naar `dmPolicy` en `allowFrom` wanneer dat mogelijk is zonder de toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert de kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaaltoestemmingslijst staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (configuratie uitsluitend via omgevingsvariabelen), valt de runtime terug op `groupPolicy="allowlist"` en registreert deze een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Oplossing van naam/ID:

    - items in de kanaaltoestemmingslijst en de DM-toestemmingslijst worden bij het opstarten opgelost wanneer tokentoegang dit toestaat
    - niet-opgeloste items met kanaalnamen blijven geconfigureerd zoals opgegeven, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard primair op ID gebaseerd; directe matching van gebruikersnaam/slug vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op namen gebaseerde sleutels (`#channel-name` of `channel-name`) komen **niet** overeen onder `groupPolicy: "allowlist"`. De kanaalzoekopdracht is standaard primair op ID gebaseerd, waardoor een op namen gebaseerde sleutel nooit succesvol routeert en alle berichten in dat kanaal stilzwijgend worden geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op namen gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vind je deze: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de ID (`C...`) staat aan het einde van de URL.

    Correct:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Onjuist (stilzwijgend geblokkeerd onder `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Vermeldingen en kanaalgebruikers">
    Kanaalberichten vereisen standaard een vermelding.

    Bronnen voor vermeldingen:

    - expliciete appvermelding (`<@botId>`)
    - vermelding van een Slack-gebruikersgroep (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - reguliere-expressiepatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet gedrag voor antwoorden in een thread aan de bot (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via oplossing bij het opstarten of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; overschrijft de antwoordmodus van het account/chattype voor dit kanaal)
    - `users` (toestemmingslijst)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelindeling voor `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` of het jokerteken `"*"`
      (verouderde sleutels zonder voorvoegsel verwijzen nog steeds alleen naar `id:`)

    `ignoreOtherMentions` (standaard `false`) negeert kanaalberichten waarin een andere gebruiker of gebruikersgroep wordt genoemd, maar deze bot niet. DM's en groeps-DM's (MPIM's) worden niet beïnvloed. Het filter vereist een herleidbare botgebruikers-ID uit `auth.test`; als die identiteit niet beschikbaar is (bijvoorbeeld bij een identiteit met alleen een gebruikerstoken), blijft de poort open en worden berichten ongewijzigd doorgelaten.

    `allowBots` is conservatief voor kanalen en privékanalen: door bots opgestelde ruimteberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-toelatingslijst van die ruimte staat, of wanneer ten minste één expliciete Slack-eigenaars-ID uit `channels.slack.allowFrom` momenteel lid is van de ruimte. Jokertekens en eigenaarsvermeldingen met weergavenamen voldoen niet aan de aanwezigheidseis voor eigenaars. Voor de aanwezigheid van eigenaars wordt Slack `conversations.members` gebruikt; zorg dat de app het bijbehorende leesbereik voor het ruimtetype heeft (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het opzoeken van leden mislukt, negeert OpenClaw het door een bot opgestelde ruimtebericht.

    Geaccepteerde door bots opgestelde Slack-berichten gebruiken gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` voor het standaardbudget en overschrijf dit vervolgens met `channels.slack.botLoopProtection` of `channels.slack.channels.<id>.botLoopProtection` wanneer een werkruimte of kanaal een andere limiet nodig heeft.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's worden gerouteerd als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren onbewerkte peer-ID's plus Slack-doelvormen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met de standaardwaarde `session.dmScope=main` worden Slack-DM's samengevoegd in de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Gewone kanaalberichten op het hoogste niveau blijven in de sessie per kanaal, zelfs wanneer `replyToMode` niet `off` is.
- Slack-threadantwoorden gebruiken de bovenliggende Slack-`thread_ts` voor sessieachtervoegsels (`:thread:<threadTs>`), zelfs wanneer threads voor uitgaande antwoorden zijn uitgeschakeld met `replyToMode="off"`.
- OpenClaw plaatst een geschikte kanaalroot op het hoogste niveau in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` wanneer wordt verwacht dat die root een zichtbare Slack-thread start, zodat de root en latere threadantwoorden één OpenClaw-sessie delen. Dit geldt voor `app_mention`-gebeurtenissen, expliciete overeenkomsten met de bot of geconfigureerde vermeldingspatronen, en `requireMention: false`-kanalen met een niet-`off` `replyToMode`.
- De standaardwaarde van `channels.slack.thread.historyScope` is `thread`; de standaardwaarde van `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie begint (standaard `20`; stel in op `0` om dit uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, worden impliciete threadvermeldingen onderdrukt, zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-poort.

Besturing van antwoordthreads:

- `channels.slack.channels.<id>.replyToMode`: overschrijving per kanaal voor Slack-kanaalberichten en berichten in privékanalen
- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- verouderde terugvaloptie voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Voor expliciete Slack-threadantwoorden vanuit het hulpmiddel `message` stel je `replyBroadcast: true` in met `action: "send"` en `threadId` of `replyTo` om Slack te vragen het threadantwoord ook naar het bovenliggende kanaal uit te zenden. Dit wordt gekoppeld aan de `reply_broadcast`-vlag van Slack `chat.postMessage` en wordt alleen ondersteund voor tekst- of Block Kit-verzendingen, niet voor media-uploads.

Wanneer een aanroep van het hulpmiddel `message` binnen een Slack-thread wordt uitgevoerd en op hetzelfde kanaal is gericht, neemt OpenClaw normaal gesproken de huidige Slack-thread over volgens de effectieve `replyToMode` voor het account, chattype of kanaal. Automatische antwoorden en aanroepen van `send` of `upload-file` voor hetzelfde kanaal gebruiken dezelfde overschrijving per kanaal. Stel `topLevel: true` in op `action: "send"` of `action: "upload-file"` om in plaats daarvan een nieuw bericht in het bovenliggende kanaal af te dwingen. `threadId: null` wordt geaccepteerd als dezelfde afmelding op het hoogste niveau.

<Note>
`replyToMode="off"` schakelt threads voor uitgaande Slack-antwoorden uit, inclusief expliciete `[[reply_to_*]]`-tags. Het vlakt inkomende Slack-threadsessies niet af: berichten die al binnen een Slack-thread zijn geplaatst, worden nog steeds naar de `:thread:<threadTs>`-sessie gerouteerd. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gehonoreerd in de modus `"off"`. Slack-threads verbergen berichten voor het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Bevestigingsreacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt. `ackReactionScope` bepaalt _wanneer_ die emoji daadwerkelijk wordt verzonden.

Standaard blijft de bevestiging statisch terwijl de eigen threadstatus van de Slack-assistent voortgang toont met afwisselende laadberichten. Stel `messages.statusReactions.enabled: true` in om in plaats daarvan de reactielevenscyclus voor in wachtrij/denken/hulpmiddel/voltooid/fout in te schakelen.

### Emoji (`ackReaction`)

Volgorde van omzetting:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- terugvaloptie voor de identiteitsemoji van de agent (`agents.list[].identity.emoji`, anders `"eyes"` / 👀)

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

### Bereik (`messages.ackReactionScope`)

De Slack-provider leest het bereik uit `messages.ackReactionScope` (standaard `"group-mentions"`). Er bestaat momenteel geen overschrijving op Slack-account- of Slack-kanaalniveau; de waarde geldt globaal voor de Gateway.

Waarden:

- `"all"`: reageren in DM's en groepen, inclusief omgevingsgebeurtenissen in ruimtes.
- `"direct"`: alleen reageren in DM's.
- `"group-all"`: reageren op elk groepsbericht behalve omgevingsgebeurtenissen in ruimtes (geen DM's).
- `"group-mentions"` (standaard): reageren in groepen, maar alleen wanneer de bot wordt genoemd (of in groepsvermeldingen waarvoor dit is ingeschakeld). **DM's zijn uitgesloten.**
- `"off"` / `"none"`: nooit reageren.

<Note>
Het standaardbereik (`"group-mentions"`) activeert geen bevestigingsreacties in directe berichten of bij omgevingsgebeurtenissen in ruimtes. Om de geconfigureerde `ackReaction` (bijvoorbeeld `"eyes"`) te zien bij inkomende Slack-DM's en stille ruimtegebeurtenissen, stel je `messages.ackReactionScope` in op `"all"`. `messages.ackReactionScope` wordt gelezen wanneer de Slack-provider wordt gestart, dus de Gateway moet opnieuw worden gestart voordat de wijziging van kracht wordt.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // reageren in DM's en groepen
  },
}
```

## Tekststreaming

`channels.slack.streaming` bepaalt het gedrag van de livevoorvertoning:

- `off`: streaming van de livevoorvertoning uitschakelen.
- `partial` (standaard): de voorvertoningstekst vervangen door de nieuwste gedeeltelijke uitvoer.
- `block`: voorvertoningsupdates in delen toevoegen.
- `progress`: voortgangsstatustekst tonen tijdens het genereren en daarna de definitieve tekst verzenden.
- `streaming.preview.toolProgress`: wanneer de conceptvoorvertoning actief is, updates over hulpmiddelen en voortgang naar hetzelfde bewerkte voorvertoningsbericht routeren (standaard: `true`). Stel `false` in om afzonderlijke berichten over hulpmiddelen en voortgang te behouden.
- `streaming.preview.commandText` / `streaming.progress.commandText`: stel in op `status` om compacte voortgangsregels voor hulpmiddelen te behouden en onbewerkte opdracht-/uitvoeringstekst te verbergen (standaard: `raw`).

Onbewerkte opdracht-/uitvoeringstekst verbergen en compacte voortgangsregels behouden:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` bepaalt de eigen tekststreaming van Slack wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

Eigen voortgangstaakkaarten van Slack zijn optioneel voor de voortgangsmodus. Stel `channels.slack.streaming.progress.nativeTaskCards` in op `true` met `channels.slack.streaming.mode="progress"` om tijdens het werk een eigen plan-/taakkaart van Slack te verzenden en dezelfde taakkaart na voltooiing bij te werken. Zonder deze vlag behoudt de voortgangsmodus het overdraagbare gedrag van de conceptvoorvertoning.

- Er moet een antwoordthread beschikbaar zijn om de eigen tekststreaming en assistent-threadstatus van Slack weer te geven. De threadselectie volgt nog steeds `replyToMode`.
- Kanalen, groepschats en DM-roots op het hoogste niveau kunnen nog steeds de normale conceptvoorvertoning gebruiken wanneer eigen streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Slack-DM's op het hoogste niveau blijven standaard buiten threads en tonen daarom niet de threadachtige eigen stream-/statusvoorvertoning van Slack; OpenClaw plaatst en bewerkt in plaats daarvan een conceptvoorvertoning in de DM.
- Media en niet-tekstuele payloads vallen terug op normale aflevering.
- Definitieve media-/foutberichten annuleren wachtende bewerkingen van de voorvertoning; geschikte definitieve tekst-/blokberichten worden alleen verwerkt wanneer ze de voorvertoning ter plaatse kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw voor de resterende payloads terug op normale aflevering.

De conceptvoorvertoning gebruiken in plaats van de eigen tekststreaming van Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Eigen voortgangstaakkaarten van Slack inschakelen:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Verouderde sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) is een verouderde alias voor `channels.slack.streaming.mode`.
- Booleaanse `channels.slack.streaming` is een verouderde alias voor `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` en `channels.slack.nativeStreaming` op het hoogste niveau zijn verouderde aliassen voor `channels.slack.streaming.chunkMode` en `channels.slack.streaming.nativeTransport`.
- Verouderde aliassen worden tijdens runtime niet gelezen; voer `openclaw doctor --fix` uit om opgeslagen Slack-streamingconfiguratie te herschrijven naar de canonieke sleutels.

## Terugvalreactie voor typen

`typingReaction` voegt tijdelijk een reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt en verwijdert deze wanneer de uitvoering is voltooid. Dit is vooral nuttig buiten antwoordthreads, die een standaardstatusindicator "is typing..." gebruiken.

Volgorde van omzetting:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie wordt naar beste vermogen afgehandeld en er wordt automatisch geprobeerd deze op te ruimen nadat het antwoord- of foutpad is voltooid.

## Spraakinvoer

Om OpenClaw momenteel in Slack met spraak te gebruiken, stuur je een Slack-audiofragment naar de OpenClaw-app. De dicteermicrofoon van Slackbot is een afzonderlijke functie die eigendom is van Slack, geen app-API.

- **[Spraakdicteren met Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** vindt plaats in het privégesprek van de gebruiker met Slackbot. Slack zet de opname om in een Slackbot-prompt, maar geeft via de Events API geen audiobestand, dicteergebeurtenis, prompt of invoerbronmarkering door aan Slack-apps van derden. De Slack-plugin van OpenClaw kan dit niet inschakelen of ontvangen.
- **[Slack-audioclips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** zijn opgeslagen Slack-bestanden die in een OpenClaw-DM, kanaal of thread kunnen worden geplaatst. OpenClaw downloadt een toegankelijke clip met het bottoken, normaliseert de MIME-metadata van de Slack-clip en stuurt deze door de gedeelde [pijplijn voor audiotranscriptie](/nl/nodes/audio). Het aanbevolen appmanifest bevat het vereiste bereik `files:read`.

Audioclips en Slackbot-dicteren hebben verschillende privacykenmerken: clips vallen onder het bewaarbeleid voor Slack-bestanden en OpenClaw downloadt ze voor transcriptie, terwijl Slack aangeeft dat dicteeraudio niet wordt opgeslagen.

In een kanaal met `requireMention: true` kan een audioclip zonder bijschrift aan de voorwaarde voldoen door een geconfigureerd vermeldingspatroon uit te spreken (`agents.list[].groupChat.mentionPatterns`, met `messages.groupChat.mentionPatterns` als terugvaloptie). OpenClaw autoriseert de afzender voordat de clip wordt gedownload of getranscribeerd en laat deze vervolgens alleen toe als het transcript overeenkomt. Een mislukt of niet-overeenkomend speculatief transcript wordt samen met de gedownloade clip verwijderd; het wordt niet in de kanaalgeschiedenis bewaard. De eigen Slack-identiteit `@bot` kan niet uit spraak worden afgeleid. Configureer daarom een patroon voor een uitgesproken naam of voeg een getypte vermelding toe. Als het terugsturen van het transcript is ingeschakeld, wordt dit pas na toelating verzonden.

## Media, opsplitsing en bezorging

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload vanaf door Slack gehoste privé-URL's (een met een token geauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer het ophalen slaagt en de groottelimieten dit toestaan. Bestandsplaatsaanduidingen bevatten de Slack-`fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde time-outs voor inactiviteit en totale duur. Als het ophalen van een Slack-bestand vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaatsaanduiding.

    De standaardlimiet voor de grootte van inkomende gegevens tijdens runtime is `20MB`, tenzij deze wordt overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstfragmenten gebruiken `channels.slack.textChunkLimit` (standaard `8000`, begrensd op Slacks eigen limiet voor berichtlengte)
    - `channels.slack.streaming.chunkMode="newline"` schakelt opsplitsing met alinea's als eerste voorkeur in
    - voor het verzenden van bestanden worden de upload-API's van Slack gebruikt; dit kan antwoorden in threads bevatten (`thread_ts`)
    - bij lange bestandsbijschriften wordt het eerste tekstfragment dat veilig is voor Slack gebruikt als uploadopmerking en worden de resterende fragmenten als vervolgberichten verzonden
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer dit is geconfigureerd; anders gebruiken kanaalverzendingen de standaardwaarden per MIME-type uit de mediapijplijn

  </Accordion>

  <Accordion title="Bezorgingsdoelen">
    Expliciete doelen hebben de voorkeur:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst of blokken kunnen rechtstreeks naar gebruikers-ID's worden verzonden. Bij bestandsuploads en verzendingen in threads wordt de DM eerst via de gespreks-API's van Slack geopend, omdat voor deze paden een concreet gespreks-ID vereist is.

  </Accordion>
</AccordionGroup>

## Opdrachten en slashgedrag

Slashopdrachten verschijnen in Slack als één geconfigureerde opdracht of als meerdere native opdrachten. Configureer `channels.slack.slashCommand` om de standaardwaarden voor opdrachten te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Voor native opdrachten zijn [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app vereist. In globale configuraties worden ze in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true`.

- De automatische modus voor native opdrachten staat voor Slack **uit**, waardoor `commands.native: "auto"` de native Slack-opdrachten niet inschakelt.

```txt
/help
```

Menu's met native argumenten worden in de volgende prioriteitsvolgorde weergegeven:

- 3-5 opties die kort genoeg zijn: een overloopmenu ("...")
- meer dan 100 opties, waarbij asynchrone filtering van opties beschikbaar is: externe selectie
- 1-2 opties, of een optie waarvan de gecodeerde waarde te lang is voor een selectie: knopblokken
- anders (6-100 opties, of meer dan 100 zonder asynchrone filtering): statisch selectiemenu, opgesplitst in 100 opties per menu

```txt
/think
```

Slashsessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en leiden de uitvoering van opdrachten nog steeds naar de sessie van het doelgesprek via `CommandTargetSessionKey`.

## Native grafieken

Slacks openbare [`data_visualization` Block Kit-blok](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
geeft lijn-, staaf-, vlak- en cirkeldiagrammen weer in berichten. OpenClaw zet het overdraagbare
`presentation`-`chart`-blok om naar die native vorm; naast de normale
`chat:write`-berichttoegang zijn geen aanvullend OAuth-bereik,
bestandsupload, afbeeldingsrenderer of Slack-configuratie vereist.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quarterly revenue",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Revenue", "values": [120, 145] }],
      "xLabel": "Quarter"
    }
  ]
}
```

De limieten van Slack worden vóór native weergave gehandhaafd:

- titel en optionele aslabels: 50 tekens
- cirkel: 1-12 positieve segmenten
- lijn/staaf/vlak: 1-12 reeksen met unieke namen en 1-20 gedeelde categorieën
- labels voor segmenten, categorieën en reeksen: 20 tekens
- elke reeks moet voor elke categorie één eindige waarde bevatten; niet-cirkelwaarden
  mogen negatief zijn

Elke native grafiek bevat ook een tekstweergave op het hoogste niveau voor
schermlezers, meldingen, sessiespiegeling en clients die het blok niet kunnen
weergeven. Standaardpresentaties die naar andere OpenClaw-kanalen worden verzonden,
ontvangen dezelfde deterministische grafiekgegevens als tekst, tenzij ze native
grafiekondersteuning aangeven. Als Slack de grafiek tijdens een gefaseerde uitrol
weigert met `invalid_blocks`, verwijdert OpenClaw de geweigerde native gegevensblokken,
behoudt het eventuele naastliggende bedieningselementen en verzendt het de volledige
grafiekweergave als zichtbare tekst.

Slack accepteert momenteel maximaal twee `data_visualization`-blokken per bericht. Wanneer
een presentatie meer dan twee geldige grafieken bevat, behoudt OpenClaw de volgorde
en gaat het verder met native weergave in vervolgberichten, met niet meer dan twee
grafieken per bericht.

Slacks [lancering voor ontwikkelaars](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
beschrijft het blok als een appgerichte Block Kit-functie en vermeldt geen beperking
tot betaalde abonnementen. De voorwaarden voor Business+/Enterprise gelden voor
Slackerbots automatische AI-grafiekgeneratie, wat losstaat van een app die een
reeds gestructureerde Block Kit-grafiek verzendt. Grafieken zijn blokken die alleen
voor berichten bestemd zijn, niet voor App Home-, modale of Canvas-inhoud.

## Native tabellen

Slacks huidige [`data_table` Block Kit-blok](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
geeft gestructureerde rijen en kolommen weer in berichten. OpenClaw zet een expliciet
overdraagbaar `presentation`-`table`-blok om naar `data_table`; het gebruikt niet Slacks
verouderde [`table`-blok](https://docs.slack.dev/reference/block-kit/blocks/table-block/).
Naast de normale `chat:write`-berichttoegang is geen aanvullend OAuth-bereik of
Slack-configuratie vereist.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Open pipeline",
      "headers": ["Account", "Stage", "ARR"],
      "rows": [
        ["Acme", "Won", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw zet koptekst- en tekenreekscellen om naar Slack-`raw_text`-cellen. Numerieke cellen
worden omgezet naar `raw_number`, waarbij de eindige numerieke waarde behouden blijft voor native
sorteren en filteren. `rowHeaderColumnIndex` markeert, indien aanwezig, die op nul gebaseerde
kolom als Slack-rijkoppen.

Slacks gepubliceerde `data_table`-limieten worden vóór native weergave gehandhaafd:

- 1-20 kolommen
- 1-100 gegevensrijen, plus de koprij
- in elke rij hetzelfde aantal cellen
- maximaal 10.000 tekens in totaal voor alle tabelcellen in één bericht

Meerdere geldige tabelblokken kunnen native worden weergegeven zolang het bericht
binnen de totale tekenlimiet blijft. Een tabel die niet binnen het native kader
kan worden weergegeven, wordt omgezet in volledige deterministische tekst in plaats
van dat rijen of cellen verloren gaan. Als die tekst langer is dan één Slack-bericht,
gebruiken verzendingen en slashantwoorden geordende tekstfragmenten. Tabelbewerkingen
mislukken met een expliciete groottefout in plaats van rijen uit een bestaand bericht
stilzwijgend af te kappen.

Elke native tabel die uit een overdraagbare presentatie wordt gemaakt, bevat ook een
tekstweergave op het hoogste niveau voor schermlezers, meldingen, sessiespiegeling en
clients die het blok niet kunnen weergeven. Onbewerkte grafiek- en tabelwaarden blijven
letterlijk in de terugvalweergave, zodat celgegevens zoals `<@U123>` geen Slack-vermelding worden.
Als Slack native grafiek- of tabelblokken weigert met `invalid_blocks`, verwijdert OpenClaw
alle native gegevensblokken in één begrensde herstelstap, behoudt het geldige
naastliggende blokken zoals knoppen en selecties, en verzendt het volledige zichtbare
grafiek- en tabeltekst met uitgeschakelde Slack-opmaak. De bezorging van slashopdrachten
houdt voor de hele opdracht Slacks budget van vijf `response_url`-aanroepen bij. Vóór elke
antwoordbatch selecteert het een volledig plan dat binnen de resterende aanroepen past,
of mislukt het voordat die batch wordt geplaatst.

Alleen expliciete `presentation`-tabelblokken worden omgezet naar native tabellen.
Markdown-tabellen met pipes blijven opgestelde tekst; OpenClaw probeert de
tabelstructuur of celtypen niet te raden. Bestaande vertrouwde producenten van
native Slack-inhoud kunnen onbewerkte blokken blijven doorgeven via `channelData.slack.blocks`;
OpenClaw leidt terugvaltekst af uit geldige onbewerkte `data_table`-cellen, terwijl
ongeldige aangepaste blokken kunnen terugvallen op hun bijschrift of de algemene
Block Kit-terugvalweergave. Overdraagbare uitvoer van agents, de CLI en plugins moet
`presentation` gebruiken.

## Interactieve antwoorden

Slack kan door agents opgestelde interactieve antwoordbedieningselementen weergeven, maar deze functie is standaard uitgeschakeld.
Gebruik voor nieuwe uitvoer van agents, de CLI en plugins bij voorkeur de gedeelde
`presentation`-knoppen of selectieblokken. Ze gebruiken hetzelfde Slack-interactiepad
en kunnen ook op andere kanalen terugvallen.

Schakel dit globaal in:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Of schakel dit alleen voor één Slack-account in:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Wanneer dit is ingeschakeld, kunnen agents nog steeds verouderde, uitsluitend voor Slack
bestemde antwoordrichtlijnen uitvoeren:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze richtlijnen worden gecompileerd naar Slack Block Kit en leiden klikken of selecties
terug via het bestaande gebeurtenispad voor Slack-interacties. Behoud ze voor oude
prompts en Slack-specifieke uitwijkmogelijkheden; gebruik gedeelde presentatie voor
nieuwe overdraagbare bedieningselementen.

De API's voor de richtlijncompiler zijn eveneens verouderd voor nieuwe producentcode:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Gebruik `presentation`-payloads en `buildSlackPresentationBlocks(...)` voor nieuwe
bedieningselementen die door Slack worden weergegeven.

Opmerkingen:

- Dit is Slack-specifieke verouderde UI. Andere kanalen vertalen Slack Block
  Kit-instructies niet naar hun eigen knopsystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen onbewerkte door de agent opgestelde waarden.
- Als gegenereerde interactieve blokken de limieten van Slack Block Kit zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blokpayload te verzenden.

### Door de Plugin beheerde modale inzendingen

Slack-plugins die een interactieve handler registreren, kunnen ook modale
`view_submission`- en `view_closed`-levenscyclusgebeurtenissen ontvangen voordat OpenClaw
de payload comprimeert voor de voor de agent zichtbare systeemgebeurtenis. Gebruik een van deze routeringspatronen
bij het openen van een modaal venster in Slack:

- Stel `callback_id` in op `openclaw:<namespace>:<payload>`.
- Of behoud een bestaande `callback_id` en plaats `pluginInteractiveData:
"<namespace>:<payload>"` in de modale `private_metadata`.

De handler ontvangt `ctx.interaction.kind` als `view_submission` of
`view_closed`, genormaliseerde `inputs` en het volledige onbewerkte `stateValues`-object van
Slack. Routering uitsluitend op callback-ID is voldoende om de pluginhandler aan te roepen; neem
de bestaande gebruikers-/sessierouteringsvelden van de modale `private_metadata` op wanneer het
modale venster ook een voor de agent zichtbare systeemgebeurtenis moet produceren. De agent ontvangt een
compacte, geredigeerde `Slack interaction: ...`-systeemgebeurtenis. Als de handler
`systemEvent.summary`, `systemEvent.reference` of `systemEvent.data` retourneert, worden die
velden opgenomen in die compacte gebeurtenis, zodat de agent kan verwijzen naar
door de plugin beheerde opslag zonder de volledige formulierpayload te zien.

## Systeemeigen goedkeuringen in Slack

Slack kan fungeren als een systeemeigen goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de web-UI of terminal.

- Uitvoerings- en plugingoedkeuringen kunnen worden weergegeven als systeemeigen Slack-prompts van Block Kit.
- `channels.slack.execApprovals.*` blijft de configuratie voor het inschakelen van de systeemeigen client voor uitvoeringsgoedkeuringen en de routering naar DM's/kanalen.
- DM's voor uitvoeringsgoedkeuringen gebruiken `channels.slack.execApprovals.approvers` of `commands.ownerAllowFrom`.
- Plugingoedkeuringen gebruiken systeemeigen Slack-knoppen wanneer Slack is ingeschakeld als systeemeigen goedkeuringsclient voor de sessie van oorsprong, of wanneer `approvals.plugin` naar de oorspronkelijke Slack-sessie of een Slack-doel routeert.
- DM's voor plugingoedkeuringen gebruiken Slack-plugingoedkeurders uit `channels.slack.allowFrom`, `allowFrom` voor het benoemde account of de standaardroute van het account.
- De autorisatie van goedkeurders wordt nog steeds afgedwongen: goedkeurders die alleen uitvoeringsverzoeken mogen goedkeuren, kunnen geen pluginverzoeken goedkeuren tenzij ze ook plugingoedkeurders zijn.

Dit gebruikt hetzelfde gedeelde oppervlak voor goedkeuringsknoppen als andere kanalen. Wanneer `interactivity` is ingeschakeld in de instellingen van je Slack-app, worden goedkeuringsprompts rechtstreeks in het gesprek als Block Kit-knoppen weergegeven.
Wanneer die knoppen aanwezig zijn, vormen ze de primaire gebruikerservaring voor goedkeuring; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het gereedschapsresultaat aangeeft dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring de enige mogelijkheid is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt systeemeigen uitvoeringsgoedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
uitvoeringsgoedkeurder wordt gevonden. Slack kan via dit systeemeigen-clientpad ook systeemeigen plugingoedkeuringen afhandelen
wanneer Slack-plugingoedkeurders worden gevonden en het verzoek overeenkomt met de filters van de systeemeigen client. Stel
`enabled: false` in om Slack expliciet uit te schakelen als systeemeigen goedkeuringsclient. Stel `enabled: true` in om
systeemeigen goedkeuringen af te dwingen wanneer goedkeurders worden gevonden. Het uitschakelen van Slack-uitvoeringsgoedkeuringen schakelt
de levering van systeemeigen Slack-plugingoedkeuringen die via `approvals.plugin` is ingeschakeld niet uit; voor de levering van plugingoedkeuringen
worden in plaats daarvan Slack-plugingoedkeurders gebruikt.

Standaardgedrag zonder expliciete configuratie voor Slack-uitvoeringsgoedkeuringen:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete systeemeigen Slack-configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
levering aan de oorspronkelijke chat wilt inschakelen:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Gedeeld doorsturen via `approvals.exec` staat hiervan los. Gebruik dit alleen wanneer prompts voor uitvoeringsgoedkeuringen ook
naar andere chats of expliciete doelen buiten de normale band moeten worden gerouteerd. Gedeeld doorsturen via `approvals.plugin` staat eveneens
los hiervan; systeemeigen Slack-levering onderdrukt die terugval alleen wanneer Slack het verzoek om plugingoedkeuring
systeemeigen kan afhandelen.

`/approve` in dezelfde chat werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals) voor het volledige model voor het doorsturen van goedkeuringen.

## Gebeurtenissen en operationeel gedrag

- Bewerkingen/verwijderingen van berichten worden omgezet in systeemgebeurtenissen.
- Threaduitzendingen (threadantwoorden met "Also send to channel") worden verwerkt als normale gebruikersberichten.
- Gebeurtenissen voor het toevoegen/verwijderen van reacties worden omgezet in systeemgebeurtenissen.
- Gebeurtenissen voor toetredende/vertrekkende leden, gemaakte/hernoemde kanalen en toegevoegde/verwijderde vastgemaakte items worden omgezet in systeemgebeurtenissen.
- Optionele aanwezigheidspeiling kan een waargenomen overgang van `away` naar `active` van een menselijke deelnemer omzetten in een gebeurtenis in de meest recent actieve, geschikte Slack-sessie van de deelnemer. Dit is standaard uitgeschakeld.
- `channel_id_changed` kan configuratiesleutels van kanalen migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in de routeringscontext worden ingevoegd.
- De threadstarter en initiële contextinjectie uit de threadgeschiedenis worden, indien van toepassing, gefilterd aan de hand van geconfigureerde lijsten met toegestane afzenders.
- Blokacties, snelkoppelingen en modale interacties genereren gestructureerde `Slack interaction: ...`-systeemgebeurtenissen met uitgebreide payloadvelden:
  - blokacties: geselecteerde waarden, labels, keuzewaarden en `workflow_*`-metadata
  - algemene snelkoppelingen: callback- en actormetadata, gerouteerd naar de directe sessie van de actor
  - berichtsnelkoppelingen: callback, actor, kanaal, thread en context van het geselecteerde bericht
  - modale `view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

Definieer algemene of berichtsnelkoppelingen in de configuratie van je Slack-app en gebruik een niet-lege callback-ID. OpenClaw bevestigt overeenkomende snelkoppelingspayloads, past hetzelfde afzenderbeleid voor DM's/kanalen toe als bij andere Slack-interacties en plaatst de opgeschoonde gebeurtenis in de wachtrij voor de gerouteerde agentsessie. Trigger-ID's en antwoord-URL's worden uit de agentcontext geredigeerd.

### Aanwezigheidsgebeurtenissen

Slack verzendt aanwezigheidswijzigingen niet via de Events API of Socket Mode. OpenClaw kan in plaats daarvan [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) peilen voor menselijke deelnemers van wie de berichten de normale toegangs- en routeringscontroles van Slack hebben doorstaan.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (standaard): geen aanwezigheidstimer of Slack-API-aanroepen.
- `auto`: bewaak DM's, MPIM's en Slack-threads die in de afgelopen 24 uur actief waren, met maximaal 8 waargenomen menselijke deelnemers. Kanaalsessies op het hoogste niveau worden uitgesloten.
- `on`: bewaak dezelfde gesprekken zonder deelnemerslimiet en neem kanaalsessies op het hoogste niveau op. Gebruik een overschrijving per kanaal om één kanaal af te dwingen of te onderdrukken.

OpenClaw peilt per Slack-account maximaal 45 unieke gebruikers per minuut, initialiseert het eerste resultaat zonder de agent te wekken en wekt de agent alleen bij een waargenomen overgang van `away` naar `active`. Per Slack-account en gebruiker geldt een permanente afkoelperiode van 8 uur, zelfs als die persoon aan meerdere threads deelneemt. De gebeurtenis wordt alleen gerouteerd naar het meest recent actieve, geschikte gesprek van die persoon en instrueert de agent om het geheugen/de wiki en bekende tijdzonecontext te raadplegen voordat wordt besloten of één korte begroeting wordt verzonden. De agent mag stil blijven.

Het bottoken heeft `users:read` nodig, dat al in het aanbevolen manifest is opgenomen. Aanwezigheidsgebeurtenissen zijn niet beschikbaar voor organisatiebrede Enterprise Grid-installaties.

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Belangrijkste Slack-velden">

- modus/authenticatie: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (verouderd: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodoptie; laat uitgeschakeld tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- activering bij aanwezigheid: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; standaard `off`)
- levering: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- voorvertoningen: `unfurlLinks` (standaard: `false`), `unfurlMedia` voor beheer van link-/mediavoorvertoningen van `chat.postMessage`; stel `unfurlLinks: true` in om linkvoorvertoningen weer in te schakelen
- beheer/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Controleer in deze volgorde:

    - `groupPolicy`
    - lijst met toegestane kanalen (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels mislukken stilzwijgend onder `groupPolicy: "allowlist"`, omdat kanaalroutering standaard eerst op ID plaatsvindt. Een ID vinden: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de `C...`-waarde aan het einde van de URL is het kanaal-ID.
    - `requireMention`
    - lijst met toegestane `users` per kanaal
    - `messages.groupChat.visibleReplies`: normale groeps-/kanaalverzoeken gebruiken standaard `"automatic"`. Als je `"message_tool"` hebt ingeschakeld en de logboeken assistenttekst tonen zonder aanroep van `message(action=send)`, heeft het model het zichtbare pad via het berichtgereedschap gemist. Definitieve tekst blijft in deze modus privé; controleer het uitgebreide Gateway-logboek op onderdrukte payloadmetadata, of stel dit in op `"automatic"` als je wilt dat elk normaal definitief antwoord van de assistent via het verouderde pad wordt geplaatst.
    - `messages.groupChat.unmentionedInbound`: als dit `"room_event"` is, vormt niet-vermelde toegestane kanaalconversatie omgevingscontext en blijft deze stil, tenzij de agent het gereedschap `message` aanroept. Zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Nuttige opdrachten:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-berichten genegeerd">
    Controleer:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (of verouderde `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / vermeldingen in de toelatingslijst (`dmPolicy: "open"` vereist nog steeds `channels.slack.allowFrom: ["*"]`)
    - groeps-DM's gebruiken MPIM-verwerking; schakel `channels.slack.dm.groupEnabled` in en neem, indien geconfigureerd, de MPIM op in `channels.slack.dm.groupChannels`
    - DM-gebeurtenissen van Slack Assistant: uitgebreide logboeken met `drop message_changed`
      betekenen meestal dat Slack een bewerkte gebeurtenis uit een Assistant-thread heeft verzonden zonder een
      herstelbare menselijke afzender in de berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode maakt geen verbinding">
    Controleer de bot- en app-tokens en of Socket Mode is ingeschakeld in de instellingen van de Slack-app.
    Het App-Level Token heeft `connections:write` nodig en het bottoken van het Bot User OAuth Token
    moet bij dezelfde Slack-app/-werkruimte horen als het app-token.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` weergeeft, is het Slack-account
    geconfigureerd, maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet herleiden.

    Logboeken zoals `slack socket mode failed to start; retry ...` zijn herstelbare
    opstartfouten. Ontbrekende bereiken, ingetrokken tokens en ongeldige authenticatie veroorzaken
    daarentegen onmiddellijk een fout. Een logboek met `slack token mismatch ...` betekent dat het bot- en app-token
    bij verschillende Slack-apps lijken te horen; corrigeer de inloggegevens van de Slack-app.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen gebeurtenissen">
    Controleer:

    - ondertekeningsgeheim
    - Webhook-pad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account
    - de openbare URL beëindigt TLS en stuurt aanvragen door naar het Gateway-pad
    - het pad `request_url` van de Slack-app komt exact overeen met `channels.slack.webhookPath` (standaard `/slack/events`)

    Als `signingSecretStatus: "configured_unavailable"` in accountmomentopnamen
    verschijnt, is het HTTP-account geconfigureerd, maar kon de huidige runtime het door
    SecretRef ondersteunde ondertekeningsgeheim niet herleiden.

    Een herhaald logboek met `slack: webhook path ... already registered` betekent dat twee HTTP-
    accounts dezelfde `webhookPath` gebruiken; geef elk account een afzonderlijk pad.

  </Accordion>

  <Accordion title="Native/slash-opdrachten worden niet uitgevoerd">
    Controleer of je het volgende bedoelde:

    - native opdrachtmodus (`channels.slack.commands.native: true`) met overeenkomende slash-opdrachten die in Slack zijn geregistreerd
    - of de modus voor één slash-opdracht (`channels.slack.slashCommand.enabled: true`)

    Slack maakt of verwijdert slash-opdrachten niet automatisch. `commands.native: "auto"` schakelt native Slack-opdrachten niet in; gebruik `true` en maak de overeenkomende opdrachten in de Slack-app. In HTTP-modus moet elke Slack-slash-opdracht de Gateway-URL bevatten. In Socket Mode komen opdrachtpayloads binnen via de websocket en negeert Slack `slash_commands[].url`.

    Controleer ook `commands.useAccessGroups`, DM-autorisatie, toelatingslijsten voor kanalen
    en toelatingslijsten voor `users` per kanaal. Slack retourneert tijdelijke fouten voor
    geblokkeerde afzenders van slash-opdrachten, waaronder:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Naslaginformatie voor bijlagemedia

Slack kan gedownloade media aan de agentbeurt toevoegen wanneer het downloaden van Slack-bestanden slaagt en de groottelimieten dit toestaan. Audioclips kunnen worden getranscribeerd, afbeeldingsbestanden kunnen via het pad voor mediabegrip of rechtstreeks naar een antwoordmodel met beeldmogelijkheden worden geleid en andere bestanden blijven beschikbaar als downloadbare bestandscontext.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                     | Opmerkingen                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack-audioclips               | Slack-bestands-URL   | Gedownload en doorgeleid via gedeelde audiotranscriptie                           | Vereist `files:read` en een werkend `tools.media.audio`-model of CLI      |
| JPEG-/PNG-/GIF-/WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de beurt toegevoegd voor verwerking met beeldmogelijkheden      | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)                 |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gesteld als bestandscontext voor tools zoals `download-file` of `pdf` | Inkomende Slack-berichten zetten PDF's niet automatisch om in invoer voor beeldherkenning |
| Andere bestanden              | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gesteld als bestandscontext               | Binaire bestanden worden niet als afbeeldingsinvoer behandeld             |
| Thread-antwoorden             | Bestanden van threadstarter | Bestanden van het hoofbericht kunnen als context worden geladen wanneer het antwoord geen directe media bevat | Starters met alleen bestanden gebruiken een tijdelijke aanduiding voor bijlagen |
| Berichten met meerdere bestanden | Meerdere Slack-bestanden | Elk bestand wordt afzonderlijk beoordeeld                                      | Slack-verwerking is beperkt tot acht bestanden per bericht                 |

### Inkomende pijplijn

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand van de privé-URL van Slack met behulp van het bot-token.
2. Na een geslaagde download wordt het bestand naar de mediaopslag geschreven.
3. Paden en inhoudstypen van gedownloade media worden aan de inkomende context toegevoegd.
4. Audioclips worden naar de gedeelde transcriptiepijplijn geleid; model- en toolpaden met afbeeldingsmogelijkheden kunnen afbeeldingsbijlagen uit dezelfde context gebruiken.
5. Andere bestanden blijven beschikbaar als bestandsmetadata of mediaverwijzingen voor tools die ze kunnen verwerken.

### Overname van bijlagen uit de thread-hoofdtekst

Wanneer een bericht in een thread binnenkomt (een bovenliggend `thread_ts` heeft):

- Als het antwoord zelf geen directe media bevat en het opgenomen hoofbericht bestanden heeft, kan Slack de hoofdbestanden als context van de threadstarter laden.
- Hoofdbestanden worden alleen geladen bij het initialiseren van een nieuwe of opnieuw ingestelde threadsessie. Latere antwoorden met alleen tekst gebruiken de bestaande sessiecontext opnieuw en voegen hoofdbestanden niet opnieuw als nieuwe media toe.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het hoofbericht.
- Een hoofbericht dat alleen bestanden en geen tekst bevat, wordt weergegeven met een tijdelijke aanduiding voor bijlagen, zodat de terugvaloptie de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt afzonderlijk via de mediapijplijn verwerkt.
- Verwijzingen naar gedownloade media worden in de berichtcontext samengevoegd.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de gebeurtenispayload.
- Een mislukte download van één bijlage blokkeert de andere niet.

### Limieten voor grootte, downloads en modellen

- **Groottelimiet**: standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Limiet voor audiotranscriptie**: `tools.media.audio.maxBytes` is ook van toepassing wanneer het gedownloade bestand naar een transcriptieprovider of CLI wordt verzonden.
- **Downloadfouten**: bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en HTML-antwoorden voor Slack-authenticatie/-aanmelding worden overgeslagen in plaats van als niet-ondersteunde indelingen te worden gemeld.
- **Beeldmodel**: afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit beeld ondersteunt, of het afbeeldingsmodel dat is geconfigureerd bij `agents.defaults.imageModel`.

### Bekende beperkingen

| Scenario                                      | Huidig gedrag                                                                      | Tijdelijke oplossing                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL                   | Bestand overgeslagen; geen fout weergegeven                                        | Upload het bestand opnieuw in Slack                                             |
| Audiotranscriptie niet beschikbaar            | Clip blijft bijgevoegd, maar er wordt geen transcript geproduceerd                 | Configureer `tools.media.audio` of installeer een ondersteunde lokale transcriptie-CLI |
| Clip zonder bijschrift passeert geen vermeldingspoort | Verwijderd na persoonlijke speculatieve transcriptie; transcript en download verwijderd | Configureer een vermeldingspatroon voor een gesproken naam, voeg een getypte botvermelding toe of gebruik een DM |
| Beeldmodel niet geconfigureerd                | Afbeeldingsbijlagen worden als mediaverwijzingen opgeslagen, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel met beeldmogelijkheden |
| Zeer grote afbeeldingen (> 20 MB standaard)   | Overgeslagen vanwege de groottelimiet                                               | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                              |
| Doorgestuurde/gedeelde bijlagen               | Tekst en door Slack gehoste afbeeldings-/bestandsmedia worden naar beste vermogen verwerkt | Deel ze opnieuw rechtstreeks in de OpenClaw-thread                         |
| PDF-bijlagen                                  | Opgeslagen als bestands-/mediacontext, niet automatisch via beeldherkenning verwerkt | Gebruik `download-file` voor bestandsmetadata of de tool `pdf` voor PDF-analyse |

### Gerelateerde documentatie

- [Pijplijn voor mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraaknotities](/nl/nodes/audio)
- [PDF-tool](/nl/tools/pdf)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van kanalen en groeps-DM's.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en beveiliging.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Configuratie-indeling en voorrangsregels.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Opdrachtencatalogus en gedrag.
  </Card>
</CardGroup>
