---
read_when:
    - Twitch-chatintegratie instellen voor OpenClaw
sidebarTitle: Twitch
summary: 'Twitch-chatbot: installatie, inloggegevens, toegangsbeheer, tokenvernieuwing'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T08:40:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twitch-chatondersteuning via de chatinterface (IRC) van Twitch met behulp van de Twurple-client. OpenClaw meldt zich aan met een Twitch-botaccount, neemt per geconfigureerd account deel aan één kanaal en antwoordt in dat kanaal.

## Installeren

Twitch wordt geleverd als een officiële Plugin; het maakt geen deel uit van de kerninstallatie.

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

`plugins install` registreert en activeert de Plugin. Als je Twitch kiest tijdens `openclaw onboard` of `openclaw channels add`, wordt deze op aanvraag geïnstalleerd. Gebruik alleen de pakketnaam om de huidige release te volgen; zet alleen een exacte versie vast voor reproduceerbare installaties. Vereist OpenClaw 2026.4.10 of nieuwer.

Details: [Plugins](/nl/tools/plugin)

## Snel instellen

<Steps>
  <Step title="De Plugin installeren">
    Zie [Installeren](#install) hierboven.
  </Step>
  <Step title="Een Twitch-botaccount maken">
    Maak een speciaal Twitch-account voor de bot (of gebruik een bestaand account).
  </Step>
  <Step title="Aanmeldgegevens genereren">
    Gebruik [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecteer **Bot Token**
    - Controleer of de bereiken `chat:read` en `chat:write` zijn geselecteerd
    - Kopieer de **Client ID** en het **Access Token**

  </Step>
  <Step title="Je Twitch-gebruikers-ID vinden">
    Gebruik [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) om een gebruikersnaam naar een Twitch-gebruikers-ID om te zetten.
  </Step>
  <Step title="Het token configureren">
    - Omgevingsvariabele: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (alleen het standaardaccount)
    - Of configuratie: `channels.twitch.accessToken`

    Als beide zijn ingesteld, heeft de configuratie voorrang (de omgevingsvariabele dient alleen als terugvaloptie voor het standaardaccount).

  </Step>
  <Step title="De Gateway starten">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Voeg toegangsbeheer (`allowFrom` of `allowedRoles`) toe om te voorkomen dat onbevoegde gebruikers de bot activeren. `requireMention` is standaard ingesteld op `true`.
</Warning>

Minimale configuratie:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Twitch-account van de bot (verifieert de identiteit)
      accessToken: "oauth:abc123...", // OAuth-toegangstoken (of gebruik de omgevingsvariabele OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client-ID uit Token Generator
      channel: "yourchannel", // De chat van het Twitch-kanaal waaraan moet worden deelgenomen (verplicht)
      allowFrom: ["123456789"], // (aanbevolen) Alleen je Twitch-gebruikers-ID
    },
  },
}
```

## Wat het is

- Een Twitch-kanaal dat door de Gateway wordt beheerd.
- Deterministische routering: antwoorden gaan altijd terug naar het Twitch-kanaal waaruit het bericht afkomstig is.
- Elk kanaal waaraan wordt deelgenomen, wordt gekoppeld aan een geïsoleerde groepssessiesleutel `agent:<agentId>:twitch:group:<channel>`.
- `username` is het account van de bot (dat de identiteit verifieert), `channel` is de chatruimte waaraan moet worden deelgenomen. Eén accountvermelding neemt deel aan precies één kanaal.
- Tokens werken met of zonder het voorvoegsel `oauth:`; OpenClaw normaliseert beide vormen (de installatiewizard verwacht de vorm met `oauth:`).

## Token vernieuwen (optioneel)

Tokens van [Twitch Token Generator](https://twitchtokengenerator.com/) kunnen niet door OpenClaw worden vernieuwd. Genereer ze opnieuw wanneer ze zijn verlopen (ze blijven enkele uren geldig; er is geen appregistratie nodig).

Maak voor automatische vernieuwing je eigen app in de [Twitch Developer Console](https://dev.twitch.tv/console) en voeg het volgende toe:

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

Als beide zijn ingesteld, gebruikt de Plugin een vernieuwende authenticatieprovider die tokens vóór het verlopen vernieuwt en elke vernieuwing registreert. Zonder `refreshToken` wordt `token refresh disabled (no refresh token)` geregistreerd; zonder `clientSecret` wordt teruggevallen op een statisch token dat niet wordt vernieuwd.

## Ondersteuning voor meerdere accounts

Gebruik `channels.twitch.accounts` met aanmeldgegevens per account. Zie [Configuratie](/nl/gateway/configuration) voor het gedeelde patroon.

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
          channel: "yourchannel",
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
Elke accountvermelding heeft een eigen `accessToken` nodig (de omgevingsvariabele geldt alleen voor het standaardaccount). Een account neemt deel aan precies één kanaal, dus voor deelname aan twee kanalen zijn twee accounts nodig. `channels.twitch.defaultAccount` bepaalt welk account het standaardaccount is.
</Note>

## Toegangsbeheer

`allowFrom` is een strikte toestemmingslijst met Twitch-gebruikers-ID's. Wanneer deze is ingesteld, wordt `allowedRoles` genegeerd; laat `allowFrom` oningesteld om in plaats daarvan op rollen gebaseerd toegangsbeheer te gebruiken.

**Beschikbare rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Toestemmingslijst met gebruikers-ID's (veiligst)">
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
  <Tab title="Op rollen gebaseerd">
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
  </Tab>
  <Tab title="Vereiste @vermelding uitschakelen">
    `requireMention` is standaard ingesteld op `true`. Om op alle toegestane berichten te antwoorden:

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

<Note>
**Waarom gebruikers-ID's?** Gebruikersnamen kunnen veranderen, waardoor imitatie mogelijk wordt. Gebruikers-ID's zijn permanent.

Vind die van jou met de [omzetter van gebruikersnaam naar ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Problemen oplossen

Voer eerst diagnostische opdrachten uit:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot reageert niet op berichten">
    - **Controleer het toegangsbeheer:** Zorg ervoor dat je gebruikers-ID in `allowFrom` staat, of verwijder `allowFrom` tijdelijk en stel `allowedRoles: ["all"]` in om te testen.
    - **Controleer de vermeldingscontrole:** Met `requireMention: true` (standaard) moeten berichten de gebruikersnaam van de bot met een @ vermelden.
    - **Controleer of de bot zich in het kanaal bevindt:** De bot neemt alleen deel aan het kanaal dat in `channel` is opgegeven.

  </Accordion>
  <Accordion title="Tokenproblemen">
    `Failed to connect` of authenticatiefouten:

    - Controleer of `accessToken` de waarde van het OAuth-toegangstoken is (het voorvoegsel `oauth:` is optioneel)
    - Controleer of het token de bereiken `chat:read` en `chat:write` heeft
    - Controleer bij gebruik van tokenvernieuwing of `clientSecret` en `refreshToken` zijn ingesteld

  </Accordion>
  <Accordion title="Tokenvernieuwing werkt niet">
    Controleer de logboeken op vernieuwingsgebeurtenissen:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Als je `token refresh disabled (no refresh token)` ziet:

    - Zorg ervoor dat `clientSecret` is opgegeven
    - Zorg ervoor dat `refreshToken` is opgegeven

  </Accordion>
</AccordionGroup>

## Configuratie

### Accountconfiguratie

<ParamField path="username" type="string" required>
  Gebruikersnaam van de bot (het account dat de identiteit verifieert).
</ParamField>
<ParamField path="accessToken" type="string" required>
  OAuth-toegangstoken met `chat:read` en `chat:write` (configuratie of omgevingsvariabele voor het standaardaccount).
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch-client-ID (uit Token Generator of je app). Optioneel in het schema, maar vereist om verbinding te maken.
</ParamField>
<ParamField path="channel" type="string" required>
  Kanaal waaraan moet worden deelgenomen.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Dit account inschakelen.
</ParamField>
<ParamField path="clientSecret" type="string">
  Optioneel: voor automatische tokenvernieuwing.
</ParamField>
<ParamField path="refreshToken" type="string">
  Optioneel: voor automatische tokenvernieuwing.
</ParamField>
<ParamField path="expiresIn" type="number">
  Vervaltijd van het token in seconden (voor het bijhouden van vernieuwingen).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Tijdstempel waarop het token is verkregen (voor het bijhouden van vernieuwingen).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Toestemmingslijst met gebruikers-ID's. Wanneer deze is ingesteld, worden rollen genegeerd.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Op rollen gebaseerd toegangsbeheer.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Een @vermelding vereisen om de bot te activeren.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Aangepast voorvoegsel voor uitgaande antwoorden van dit account.
</ParamField>

### Provideropties

- `channels.twitch.enabled` - Het starten van het kanaal in- of uitschakelen
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Vereenvoudigde configuratie voor één account (impliciet `default`-account; heeft voorrang op `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configuratie voor meerdere accounts (alle bovenstaande accountvelden)
- `channels.twitch.defaultAccount` - Welke accountnaam de standaard is
- `channels.twitch.markdown.tables` - Weergavemodus voor Markdown-tabellen (`off` | `bullets` | `code` | `block`)

Volledig voorbeeld:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Toolacties

De agent kan Twitch-berichten verzenden via de actie `send` van de berichtentool:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` is optioneel en gebruikt standaard het geconfigureerde `channel` van het account.

## Veiligheid en beheer

- **Behandel tokens als wachtwoorden** - leg tokens nooit vast in git.
- **Gebruik automatische tokenvernieuwing** voor bots die langdurig actief zijn.
- **Gebruik toestemmingslijsten met gebruikers-ID's** in plaats van gebruikersnamen voor toegangsbeheer.
- **Bewaak logboeken** op tokenvernieuwingsgebeurtenissen en de verbindingsstatus.
- **Beperk tokenbereiken tot het minimum** - vraag alleen `chat:read` en `chat:write` aan.
- **Als je vastloopt**: start de Gateway opnieuw nadat je hebt gecontroleerd dat geen ander proces de sessie beheert.

## Limieten

- **500 tekens** per bericht; langere antwoorden worden op woordgrenzen opgesplitst.
- Markdown wordt vóór verzending verwijderd (Twitch-chat is platte tekst; nieuwe regels worden spaties).
- OpenClaw voegt zelf geen snelheidsbeperking toe; de Twurple-chatclient verwerkt de snelheidslimieten van Twitch.

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) — gedrag van groepschats en controle op vermeldingen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsproces
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiliging tegen aanvallen
