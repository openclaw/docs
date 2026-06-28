---
read_when:
    - Synology Chat instellen met OpenClaw
    - Foutopsporing voor Synology Chat Webhook-routering
summary: Synology Chat Webhook-installatie en OpenClaw-configuratie
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T11:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Status: gebundeld Plugin voor direct-message-kanaal dat Synology Chat-webhooks gebruikt.
De Plugin accepteert inkomende berichten van uitgaande webhooks van Synology Chat en verstuurt antwoorden
via een inkomende webhook van Synology Chat.

## Gebundelde Plugin

Synology Chat wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale
pakketbuilds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie waarin Synology Chat is uitgesloten,
installeer deze dan handmatig:

Installeren vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle installatie

1. Zorg dat de Synology Chat-Plugin beschikbaar is.
   - Huidige pakketversies van OpenClaw leveren deze al mee.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen vanuit een source-checkout met de bovenstaande opdracht.
   - `openclaw onboard` toont Synology Chat nu in dezelfde lijst voor kanaalinstellingen als `openclaw channels add`.
   - Niet-interactieve installatie: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In Synology Chat-integraties:
   - Maak een inkomende webhook en kopieer de URL.
   - Maak een uitgaande webhook met je geheime token.
3. Laat de URL van de uitgaande webhook naar je OpenClaw-Gateway wijzen:
   - `https://gateway-host/webhook/synology` standaard.
   - Of je aangepaste `channels.synology-chat.webhookPath`.
4. Rond de installatie af in OpenClaw.
   - Begeleid: `openclaw onboard`
   - Direct: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Herstart de Gateway en stuur een DM naar de Synology Chat-bot.

Details voor webhook-authenticatie:

- OpenClaw accepteert het token van de uitgaande webhook uit `body.token`, daarna
  `?token=...`, en daarna headers.
- Geaccepteerde headervormen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Lege of ontbrekende tokens falen gesloten.

Minimale configuratie:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Omgevingsvariabelen

Voor het standaardaccount kun je env vars gebruiken:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (komma-gescheiden)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Configuratiewaarden overschrijven env vars.

`SYNOLOGY_CHAT_INCOMING_URL` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## DM-beleid en toegangscontrole

- `dmPolicy: "allowlist"` is de aanbevolen standaard.
- `allowedUserIds` accepteert een lijst (of komma-gescheiden string) van Synology-gebruikers-ID's.
- In de modus `allowlist` wordt een lege lijst `allowedUserIds` als misconfiguratie behandeld en zal de webhookroute niet starten (gebruik `dmPolicy: "open"` met `allowedUserIds: ["*"]` om iedereen toe te staan).
- `dmPolicy: "open"` staat publieke DM's alleen toe wanneer `allowedUserIds` `"*"` bevat; met beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten.
- `dmPolicy: "disabled"` blokkeert DM's.
- Koppeling van antwoordontvangers blijft standaard gebaseerd op stabiele numerieke `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` is een break-glass-compatibiliteitsmodus die opzoeking via veranderbare gebruikersnaam/bijnaam opnieuw inschakelt voor antwoordbezorging.
- Koppelingsgoedkeuringen werken met:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Uitgaande bezorging

Gebruik numerieke Synology Chat-gebruikers-ID's als doelen.

Voorbeelden:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Mediaverzendingen worden ondersteund via bestandsbezorging op basis van URL's.
Uitgaande bestands-URL's moeten `http` of `https` gebruiken, en privé- of anderszins geblokkeerde netwerkdoelen worden geweigerd voordat OpenClaw de URL doorstuurt naar de NAS-webhook.

## Meerdere accounts

Meerdere Synology Chat-accounts worden ondersteund onder `channels.synology-chat.accounts`.
Elk account kan token, inkomende URL, webhookpad, DM-beleid en limieten overschrijven.
Direct-message-sessies zijn per account en gebruiker geïsoleerd, zodat dezelfde numerieke `user_id`
op twee verschillende Synology-accounts geen transcriptiestatus deelt.
Geef elk ingeschakeld account een eigen `webhookPath`. OpenClaw weigert nu dubbele exacte paden
en weigert genoemde accounts te starten die in configuraties met meerdere accounts alleen een gedeeld webhookpad erven.
Als je bewust verouderde overerving nodig hebt voor een genoemd account, stel dan
`dangerouslyAllowInheritedWebhookPath: true` in op dat account of bij `channels.synology-chat`,
maar dubbele exacte paden worden nog steeds fail-closed geweigerd. Geef de voorkeur aan expliciete paden per account.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Beveiligingsnotities

- Houd `token` geheim en roteer het als het is gelekt.
- Houd `allowInsecureSsl: false` tenzij je expliciet een zelfondertekend lokaal NAS-certificaat vertrouwt.
- Inkomende webhookverzoeken worden per afzender met token geverifieerd en aan snelheidslimieten onderworpen.
- Controles op ongeldige tokens gebruiken constante-tijd geheime vergelijking en falen gesloten.
- Geef voor productie de voorkeur aan `dmPolicy: "allowlist"`.
- Houd `dangerouslyAllowNameMatching` uitgeschakeld tenzij je expliciet verouderde antwoordbezorging op basis van gebruikersnaam nodig hebt.
- Houd `dangerouslyAllowInheritedWebhookPath` uitgeschakeld tenzij je expliciet het routeringsrisico van gedeelde paden accepteert in een configuratie met meerdere accounts.

## Probleemoplossing

- `Missing required fields (token, user_id, text)`:
  - de payload van de uitgaande webhook mist een van de vereiste velden
  - als Synology het token in headers verstuurt, zorg er dan voor dat de Gateway/proxy die headers behoudt
- `Invalid token`:
  - het geheim van de uitgaande webhook komt niet overeen met `channels.synology-chat.token`
  - het verzoek komt terecht bij het verkeerde account/webhookpad
  - een reverse proxy heeft de tokenheader verwijderd voordat het verzoek OpenClaw bereikte
- `Rate limit exceeded`:
  - te veel pogingen met ongeldige tokens vanaf dezelfde bron kunnen die bron tijdelijk buitensluiten
  - geauthenticeerde afzenders hebben ook een aparte berichtsnelheidslimiet per gebruiker
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` is ingeschakeld maar er zijn geen gebruikers geconfigureerd
- `User not authorized`:
  - de numerieke `user_id` van de afzender staat niet in `allowedUserIds`

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en gating voor vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
