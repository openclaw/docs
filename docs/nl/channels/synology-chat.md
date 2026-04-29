---
read_when:
    - Synology Chat instellen met OpenClaw
    - Debuggen van Synology Chat Webhook-routering
summary: Synology Chat Webhook instellen en OpenClaw-configuratie
title: Synology Chat
x-i18n:
    generated_at: "2026-04-29T22:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: gebundeld direct-message-kanaal van plugin via Synology Chat-webhooks.
De plugin accepteert inkomende berichten van uitgaande Synology Chat-webhooks en verzendt antwoorden
via een inkomende Synology Chat-webhook.

## Gebundelde plugin

Synology Chat wordt meegeleverd als gebundelde plugin in huidige OpenClaw-releases, dus normale
pakketbuilds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Synology Chat uitsluit,
installeer deze dan handmatig:

Installeren vanuit een lokale checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle installatie

1. Zorg dat de Synology Chat-plugin beschikbaar is.
   - Huidige pakketversies van OpenClaw bevatten deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen vanuit een source-checkout met de opdracht hierboven.
   - `openclaw onboard` toont Synology Chat nu in dezelfde lijst voor kanaalconfiguratie als `openclaw channels add`.
   - Niet-interactieve configuratie: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In Synology Chat-integraties:
   - Maak een inkomende webhook aan en kopieer de URL.
   - Maak een uitgaande webhook aan met je geheime token.
3. Wijs de URL van de uitgaande webhook naar je OpenClaw Gateway:
   - Standaard `https://gateway-host/webhook/synology`.
   - Of je aangepaste `channels.synology-chat.webhookPath`.
4. Rond de configuratie af in OpenClaw.
   - Begeleid: `openclaw onboard`
   - Direct: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Herstart de Gateway en stuur een DM naar de Synology Chat-bot.

Details voor webhook-authenticatie:

- OpenClaw accepteert het uitgaande webhook-token eerst uit `body.token`, daarna
  uit `?token=...`, en daarna uit headers.
- Geaccepteerde header-vormen:
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

Voor het standaardaccount kun je env-vars gebruiken:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (kommagescheiden)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Configuratiewaarden overschrijven env-vars.

`SYNOLOGY_CHAT_INCOMING_URL` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## DM-beleid en toegangscontrole

- `dmPolicy: "allowlist"` is de aanbevolen standaard.
- `allowedUserIds` accepteert een lijst (of kommagescheiden tekenreeks) met Synology-gebruikers-ID's.
- In `allowlist`-modus wordt een lege `allowedUserIds`-lijst behandeld als verkeerde configuratie en start de webhookroute niet (gebruik `dmPolicy: "open"` met `allowedUserIds: ["*"]` om alles toe te staan).
- `dmPolicy: "open"` staat openbare DM's alleen toe wanneer `allowedUserIds` `"*"` bevat; met beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten.
- `dmPolicy: "disabled"` blokkeert DM's.
- Antwoordontvangerbinding blijft standaard op stabiele numerieke `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` is een noodcompatibiliteitsmodus die veranderlijke gebruikersnaam-/bijnaamlookup opnieuw inschakelt voor antwoordbezorging.
- Koppelingsgoedkeuringen werken met:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Uitgaande bezorging

Gebruik numerieke Synology Chat-gebruikers-ID's als doelen.

Voorbeelden:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Mediaverzending wordt ondersteund via URL-gebaseerde bestandsbezorging.
Uitgaande bestands-URL's moeten `http` of `https` gebruiken, en private of anderszins geblokkeerde netwerkdoelen worden geweigerd voordat OpenClaw de URL doorstuurt naar de NAS-webhook.

## Meerdere accounts

Meerdere Synology Chat-accounts worden ondersteund onder `channels.synology-chat.accounts`.
Elk account kan token, inkomende URL, webhookpad, DM-beleid en limieten overschrijven.
Direct-message-sessies zijn geïsoleerd per account en gebruiker, dus dezelfde numerieke `user_id`
op twee verschillende Synology-accounts deelt geen transcriptiestatus.
Geef elk ingeschakeld account een uniek `webhookPath`. OpenClaw weigert nu dubbele exacte paden
en weigert benoemde accounts te starten die in multi-accountconfiguraties alleen een gedeeld webhookpad erven.
Als je bewust legacy-erfenis nodig hebt voor een benoemd account, stel dan
`dangerouslyAllowInheritedWebhookPath: true` in op dat account of op `channels.synology-chat`,
maar dubbele exacte paden worden nog steeds gesloten geweigerd. Geef de voorkeur aan expliciete paden per account.

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
- Houd `allowInsecureSsl: false`, tenzij je expliciet een zelfondertekend lokaal NAS-certificaat vertrouwt.
- Inkomende webhook-aanvragen worden per afzender op token gecontroleerd en rate-limited.
- Controles op ongeldige tokens gebruiken constante-tijd geheime vergelijking en falen gesloten.
- Geef voor productie de voorkeur aan `dmPolicy: "allowlist"`.
- Houd `dangerouslyAllowNameMatching` uitgeschakeld, tenzij je expliciet legacy antwoordbezorging op basis van gebruikersnaam nodig hebt.
- Houd `dangerouslyAllowInheritedWebhookPath` uitgeschakeld, tenzij je expliciet het routeringsrisico van gedeelde paden accepteert in een multi-accountconfiguratie.

## Probleemoplossing

- `Missing required fields (token, user_id, text)`:
  - de payload van de uitgaande webhook mist een van de verplichte velden
  - als Synology het token in headers verzendt, zorg er dan voor dat de Gateway/proxy die headers behoudt
- `Invalid token`:
  - het geheime uitgaande webhook-token komt niet overeen met `channels.synology-chat.token`
  - de aanvraag komt terecht bij het verkeerde account/webhookpad
  - een reverse proxy heeft de token-header verwijderd voordat de aanvraag OpenClaw bereikte
- `Rate limit exceeded`:
  - te veel pogingen met ongeldige tokens vanaf dezelfde bron kunnen die bron tijdelijk buitensluiten
  - geauthenticeerde afzenders hebben ook een aparte berichtlimiet per gebruiker
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` is ingeschakeld maar er zijn geen gebruikers geconfigureerd
- `User not authorized`:
  - de numerieke `user_id` van de afzender staat niet in `allowedUserIds`

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
