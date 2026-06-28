---
read_when:
    - Twitch-chatintegratie instellen voor OpenClaw
sidebarTitle: Twitch
summary: Configuratie en installatie van de Twitch-chatbot
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Twitch-chatondersteuning via IRC-verbinding. OpenClaw maakt verbinding als Twitch-gebruiker (botaccount) om berichten in kanalen te ontvangen en te verzenden.

## Gebundelde Plugin

<Note>
Twitch wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale verpakte builds hebben geen aparte installatie nodig.
</Note>

Als je een oudere build gebruikt of een aangepaste installatie waarin Twitch is uitgesloten, installeer dan het npm-pakket rechtstreeks:

<Tabs>
  <Tab title="npm-register">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Lokale checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

Details: [Plugins](/nl/tools/plugin)

## Snelle installatie (beginner)

<Steps>
  <Step title="Zorg dat de Plugin beschikbaar is">
    Huidige verpakte OpenClaw-releases bundelen deze al. Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
  </Step>
  <Step title="Maak een Twitch-botaccount aan">
    Maak een speciaal Twitch-account voor de bot (of gebruik een bestaand account).
  </Step>
  <Step title="Genereer inloggegevens">
    Gebruik [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecteer **Bot Token**
    - Controleer of scopes `chat:read` en `chat:write` zijn geselecteerd
    - Kopieer de **Client ID** en **Access Token**

  </Step>
  <Step title="Vind je Twitch-gebruikers-ID">
    Gebruik [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) om een gebruikersnaam naar een Twitch-gebruikers-ID om te zetten.
  </Step>
  <Step title="Configureer het token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (alleen standaardaccount)
    - Of configuratie: `channels.twitch.accessToken`

    Als beide zijn ingesteld, heeft configuratie voorrang (env-fallback is alleen voor het standaardaccount).

  </Step>
  <Step title="Start de Gateway">
    Start de Gateway met het geconfigureerde kanaal.
  </Step>
</Steps>

<Warning>
Voeg toegangscontrole (`allowFrom` of `allowedRoles`) toe om te voorkomen dat onbevoegde gebruikers de bot activeren. `requireMention` staat standaard op `true`.
</Warning>

Minimale configuratie:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Wat het is

- Een Twitch-kanaal dat eigendom is van de Gateway.
- Deterministische routering: antwoorden gaan altijd terug naar Twitch.
- Elk account wordt gekoppeld aan een geïsoleerde sessiesleutel `agent:<agentId>:twitch:<accountName>`.
- `username` is het account van de bot (wie zich authenticeert), `channel` is de chatruimte waaraan wordt deelgenomen.

## Installatie (gedetailleerd)

### Inloggegevens genereren

Gebruik [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecteer **Bot Token**
- Controleer of scopes `chat:read` en `chat:write` zijn geselecteerd
- Kopieer de **Client ID** en **Access Token**

<Note>
Geen handmatige appregistratie nodig. Tokens verlopen na enkele uren.
</Note>

### De bot configureren

<Tabs>
  <Tab title="Env-var (alleen standaardaccount)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Configuratie">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Als zowel env als configuratie zijn ingesteld, heeft configuratie voorrang.

### Toegangscontrole (aanbevolen)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Geef de voorkeur aan `allowFrom` voor een harde toelatingslijst. Gebruik in plaats daarvan `allowedRoles` als je rolgebaseerde toegang wilt.

**Beschikbare rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Waarom gebruikers-ID's?** Gebruikersnamen kunnen veranderen, wat impersonatie mogelijk maakt. Gebruikers-ID's zijn permanent.

Vind je Twitch-gebruikers-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Zet je Twitch-gebruikersnaam om naar ID)
</Note>

## Token vernieuwen (optioneel)

Tokens van [Twitch Token Generator](https://twitchtokengenerator.com/) kunnen niet automatisch worden vernieuwd - genereer ze opnieuw wanneer ze zijn verlopen.

Voor automatische tokenvernieuwing maak je je eigen Twitch-applicatie aan op [Twitch Developer Console](https://dev.twitch.tv/console) en voeg je dit toe aan de configuratie:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

De bot vernieuwt tokens automatisch vóór de vervaldatum en logt vernieuwingsgebeurtenissen.

## Ondersteuning voor meerdere accounts

Gebruik `channels.twitch.accounts` met tokens per account. Zie [Configuratie](/nl/gateway/configuration) voor het gedeelde patroon.

Voorbeeld (één botaccount in twee kanalen):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Elk account heeft een eigen token nodig (één token per kanaal).
</Note>

## Toegangscontrole

<Tabs>
  <Tab title="Gebruikers-ID-toelatingslijst (meest veilig)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Rolgebaseerd">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` is een harde toelatingslijst. Wanneer deze is ingesteld, zijn alleen die gebruikers-ID's toegestaan. Als je rolgebaseerde toegang wilt, laat `allowFrom` dan oningesteld en configureer in plaats daarvan `allowedRoles`.

  </Tab>
  <Tab title="@mention-vereiste uitschakelen">
    Standaard is `requireMention` `true`. Om dit uit te schakelen en op alle berichten te reageren:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Probleemoplossing

Voer eerst diagnostische opdrachten uit:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot reageert niet op berichten">
    - **Controleer toegangscontrole:** Zorg dat je gebruikers-ID in `allowFrom` staat, of verwijder `allowFrom` tijdelijk en stel `allowedRoles: ["all"]` in om te testen.
    - **Controleer of de bot in het kanaal zit:** De bot moet deelnemen aan het kanaal dat is opgegeven in `channel`.

  </Accordion>
  <Accordion title="Tokenproblemen">
    "Kan geen verbinding maken" of authenticatiefouten:

    - Controleer of `accessToken` de OAuth-toegangstokenwaarde is (begint meestal met het voorvoegsel `oauth:`)
    - Controleer of het token scopes `chat:read` en `chat:write` heeft
    - Als je tokenvernieuwing gebruikt, controleer dan of `clientSecret` en `refreshToken` zijn ingesteld

  </Accordion>
  <Accordion title="Tokenvernieuwing werkt niet">
    Controleer logs op vernieuwingsgebeurtenissen:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Als je "token refresh disabled (no refresh token)" ziet:

    - Zorg dat `clientSecret` is opgegeven
    - Zorg dat `refreshToken` is opgegeven

  </Accordion>
</AccordionGroup>

## Configuratie

### Accountconfiguratie

<ParamField path="username" type="string">
  Botgebruikersnaam.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth-toegangstoken met `chat:read` en `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (van Token Generator of je app).
</ParamField>
<ParamField path="channel" type="string" required>
  Kanaal om aan deel te nemen.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Schakel dit account in.
</ParamField>
<ParamField path="clientSecret" type="string">
  Optioneel: voor automatische tokenvernieuwing.
</ParamField>
<ParamField path="refreshToken" type="string">
  Optioneel: voor automatische tokenvernieuwing.
</ParamField>
<ParamField path="expiresIn" type="number">
  Tokenverval in seconden.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Tijdstempel waarop token is verkregen.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Gebruikers-ID-toelatingslijst.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rolgebaseerde toegangscontrole.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Vereis @mention.
</ParamField>

### Provideropties

- `channels.twitch.enabled` - Schakel kanaalstart in/uit
- `channels.twitch.username` - Botgebruikersnaam (vereenvoudigde configuratie voor één account)
- `channels.twitch.accessToken` - OAuth-toegangstoken (vereenvoudigde configuratie voor één account)
- `channels.twitch.clientId` - Twitch Client ID (vereenvoudigde configuratie voor één account)
- `channels.twitch.channel` - Kanaal om aan deel te nemen (vereenvoudigde configuratie voor één account)
- `channels.twitch.accounts.<accountName>` - Configuratie voor meerdere accounts (alle bovenstaande accountvelden)

Volledig voorbeeld:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Toolacties

De agent kan `twitch` aanroepen met actie:

- `send` - Stuur een bericht naar een kanaal

Voorbeeld:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Veiligheid en beheer

- **Behandel tokens als wachtwoorden** — Commit tokens nooit naar git.
- **Gebruik automatische tokenvernieuwing** voor langlopende bots.
- **Gebruik gebruikers-ID-toelatingslijsten** in plaats van gebruikersnamen voor toegangscontrole.
- **Monitor logs** voor tokenvernieuwingsgebeurtenissen en verbindingsstatus.
- **Beperk tokens minimaal** — Vraag alleen `chat:read` en `chat:write` aan.
- **Als je vastloopt**: Herstart de Gateway nadat je hebt bevestigd dat geen ander proces eigenaar is van de sessie.

## Limieten

- **500 tekens** per bericht (automatisch op woordgrenzen opgesplitst).
- Markdown wordt verwijderd vóór het opsplitsen.
- Geen snelheidsbeperking (gebruikt de ingebouwde snelheidslimieten van Twitch).

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention-gating
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
