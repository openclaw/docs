---
read_when:
    - Synology Chat instellen met OpenClaw
    - Routering van Synology Chat-webhooks debuggen
summary: Installatie van de Synology Chat-webhook en OpenClaw-configuratie
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T08:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat maakt verbinding met OpenClaw via een Webhook-paar: een uitgaande Webhook van Synology Chat plaatst inkomende privéberichten bij de Gateway en antwoorden worden teruggestuurd via een inkomende Webhook van Synology Chat.

Status: officiële Plugin, afzonderlijk geïnstalleerd. Alleen privéberichten; tekst en op URL gebaseerde bestandsverzending worden ondersteund.

## Installeren

```bash
openclaw plugins install @openclaw/synology-chat
```

Lokale checkout (bij uitvoering vanuit een git-repository):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

1. Installeer de Plugin (hierboven).
2. In de integraties van Synology Chat:
   - Maak een inkomende Webhook en kopieer de URL ervan.
   - Maak een uitgaande Webhook met uw geheime token.
3. Laat de URL van de uitgaande Webhook naar uw OpenClaw Gateway verwijzen:
   - Standaard `https://gateway-host/webhook/synology`.
   - Of uw aangepaste `channels.synology-chat.webhookPath`.
4. Voltooi de configuratie in OpenClaw. Synology Chat verschijnt in beide flows in dezelfde lijst voor kanaalconfiguratie:
   - Begeleid: `openclaw onboard` of `openclaw channels add`
   - Rechtstreeks: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Start de Gateway opnieuw en stuur een privébericht naar de Synology Chat-bot.

Details over Webhook-authenticatie:

- OpenClaw accepteert het token van de uitgaande Webhook eerst uit `body.token`, vervolgens uit
  `?token=...` en daarna uit headers.
- Geaccepteerde headerindelingen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Lege of ontbrekende tokens worden standaard geweigerd.
- Payloads mogen `application/x-www-form-urlencoded` of `application/json` zijn; `token`, `user_id` en `text` zijn vereist.

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

Voor het standaardaccount kunt u omgevingsvariabelen gebruiken:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (door komma's gescheiden)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Configuratiewaarden hebben voorrang op omgevingsvariabelen.

`SYNOLOGY_CHAT_INCOMING_URL` en `SYNOLOGY_NAS_HOST` kunnen niet vanuit een `.env` van een werkruimte worden ingesteld; zie [`.env`-bestanden van werkruimten](/nl/gateway/security#workspace-env-files).

## Beleid voor privéberichten en toegangscontrole

- Ondersteunde waarden voor `dmPolicy`: `allowlist` (standaard), `open` en `disabled`. Synology Chat heeft geen koppelingsflow; keur afzenders goed door hun numerieke Synology-gebruikers-ID's aan `allowedUserIds` toe te voegen.
- `allowedUserIds` accepteert een lijst (of een door komma's gescheiden tekenreeks) met Synology-gebruikers-ID's.
- In de modus `allowlist` wordt een lege lijst `allowedUserIds` als een onjuiste configuratie beschouwd en wordt de Webhook-route niet gestart.
- `dmPolicy: "open"` staat openbare privéberichten alleen toe wanneer `allowedUserIds` `"*"` bevat; bij beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten. Bij `open` met een lege lijst `allowedUserIds` wordt eveneens geweigerd de route te starten.
- `dmPolicy: "disabled"` blokkeert privéberichten.
- De koppeling van de ontvanger van antwoorden blijft standaard gebaseerd op de stabiele numerieke `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` is een compatibiliteitsmodus voor noodgevallen die het opzoeken via veranderlijke gebruikersnamen/bijnamen voor de bezorging van antwoorden opnieuw inschakelt.

## Uitgaande bezorging

Gebruik numerieke Synology Chat-gebruikers-ID's als doelen. De voorvoegsels `synology-chat:`, `synology_chat:` en `synology:` worden geaccepteerd.

Voorbeelden:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Uitgaande tekst wordt opgesplitst in delen van 2000 tekens. Mediaverzending wordt ondersteund via op URL gebaseerde bestandsbezorging: de NAS downloadt het bestand en voegt het als bijlage toe (maximaal 32 MB). URL's van uitgaande bestanden moeten `http` of `https` gebruiken en privé- of anderszins geblokkeerde netwerkdoelen worden geweigerd voordat OpenClaw de URL naar de NAS-Webhook doorstuurt.

## Meerdere accounts

Meerdere Synology Chat-accounts worden ondersteund onder `channels.synology-chat.accounts`.
Elk account kan het token, de inkomende URL, het Webhook-pad, het beleid voor privéberichten en de limieten overschrijven.
Sessies voor privéberichten worden per account en gebruiker geïsoleerd, zodat dezelfde numerieke `user_id`
op twee verschillende Synology-accounts geen transcriptstatus deelt.
Geef elk ingeschakeld account een afzonderlijk `webhookPath`. OpenClaw weigert exact dubbele paden
en weigert benoemde accounts te starten die in configuraties met meerdere accounts alleen een gedeeld Webhook-pad overnemen.
Als u bewust verouderde overname voor een benoemd account nodig hebt, stelt u
`dangerouslyAllowInheritedWebhookPath: true` in voor dat account of onder `channels.synology-chat`,
maar exact dubbele paden worden nog steeds standaard geweigerd. Geef de voorkeur aan expliciete paden per account.

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

## Beveiligingsopmerkingen

- Houd `token` geheim en roteer het als het is uitgelekt.
- Houd `allowInsecureSsl: false`, tenzij u een zelfondertekend lokaal NAS-certificaat expliciet vertrouwt.
- Inkomende Webhook-verzoeken worden op token gecontroleerd en per afzender beperkt (`rateLimitPerMinute`, standaard 30).
- Controles van ongeldige tokens gebruiken een vergelijking van geheimen met constante uitvoeringstijd en weigeren standaard; herhaalde pogingen met ongeldige tokens blokkeren het bron-IP-adres tijdelijk.
- De tekst van inkomende berichten wordt opgeschoond tegen bekende patronen voor promptinjectie en afgekapt op 4000 tekens.
- Geef voor productie de voorkeur aan `dmPolicy: "allowlist"`.
- Houd `dangerouslyAllowNameMatching` uitgeschakeld, tenzij u expliciet verouderde, op gebruikersnamen gebaseerde bezorging van antwoorden nodig hebt.
- Houd `dangerouslyAllowInheritedWebhookPath` uitgeschakeld, tenzij u bij een configuratie met meerdere accounts expliciet het routeringsrisico van een gedeeld pad accepteert.

## Probleemoplossing

- `Missing required fields (token, user_id, text)`:
  - in de payload van de uitgaande Webhook ontbreekt een van de vereiste velden
  - als Synology het token in headers verzendt, controleer dan of de Gateway/proxy die headers behoudt
- `Invalid token`:
  - het geheim van de uitgaande Webhook komt niet overeen met `channels.synology-chat.token`
  - het verzoek bereikt het verkeerde account of Webhook-pad
  - een reverse proxy heeft de tokenheader verwijderd voordat het verzoek OpenClaw bereikte
- `Rate limit exceeded`:
  - te veel pogingen met ongeldige tokens vanaf dezelfde bron kunnen die bron tijdelijk blokkeren
  - geauthenticeerde afzenders hebben daarnaast een afzonderlijke berichtlimiet per gebruiker
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` is ingeschakeld, maar er zijn geen gebruikers geconfigureerd
- `User not authorized`:
  - de numerieke `user_id` van de afzender staat niet in `allowedUserIds`

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) — gedrag van groepschats en beperking op basis van vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en versterking
