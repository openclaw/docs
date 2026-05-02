---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-referentiegegevens instellen
    - Je wilt QQ Bot-ondersteuning voor groeps- of privéchats
summary: Installatie, configuratie en gebruik van QQ Bot
title: QQ-bot
x-i18n:
    generated_at: "2026-05-02T11:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot maakt verbinding met OpenClaw via de officiële QQ Bot API (WebSocket-gateway). De
Plugin ondersteunt C2C-privéchats, groeps-@berichten en gildekanaalberichten met
rich media (afbeeldingen, spraak, video, bestanden).

Status: downloadbare Plugin. Directe berichten, groepschats, gildekanalen en
media worden ondersteund. Reacties en threads worden niet ondersteund.

## Installeren

Installeer QQ Bot vóór de configuratie:

```bash
openclaw plugins install @openclaw/qqbot
```

## Instellen

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met je
   telefoon-QQ om je te registreren / in te loggen.
2. Klik op **Create Bot** om een nieuwe QQ-bot te maken.
3. Zoek **AppID** en **AppSecret** op de instellingenpagina van de bot en kopieer ze.

> AppSecret wordt niet als platte tekst opgeslagen — als je de pagina verlaat zonder het op te slaan,
> moet je een nieuwe genereren.

4. Voeg het kanaal toe:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Herstart de Gateway.

Interactieve instelpaden:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configureren

Minimale configuratie:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Omgevingsvariabelen voor het standaardaccount:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret vanuit een bestand:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Opmerkingen:

- Env-terugval geldt alleen voor het standaardaccount van QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen de
  AppSecret; de AppID moet al zijn ingesteld in de configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een platteteksttekenreeks.

### Instellen van meerdere accounts

Voer meerdere QQ-bots uit onder één OpenClaw-instantie:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Elk account start zijn eigen WebSocket-verbinding en onderhoudt een onafhankelijke
tokencache (geïsoleerd op `appId`).

Voeg een tweede bot toe via CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Groepschats

Ondersteuning voor QQ Bot-groepschats gebruikt QQ-groep-OpenID's, geen weergavenamen. Voeg de bot
toe aan een groep en vermeld hem daarna, of configureer de groep om zonder vermelding te werken.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` stelt standaardwaarden in voor elke groep, en een concrete
`groups.GROUP_OPENID`-vermelding overschrijft die standaardwaarden voor één groep. Groepsinstellingen
omvatten:

- `requireMention`: vereis een @vermelding voordat de bot antwoordt. Standaard: `true`.
- `ignoreOtherMentions`: laat berichten vallen die iemand anders vermelden, maar niet de bot.
- `historyLimit`: bewaar recente groepsberichten zonder vermelding als context voor de volgende vermelde beurt. Stel in op `0` om uit te schakelen.
- `toolPolicy`: `full`, `restricted` of `none` voor groepsgebonden tools.
- `name`: vriendelijke labelnaam die wordt gebruikt in logs en groepscontext.
- `prompt`: gedragsprompt per groep die wordt toegevoegd aan de agentcontext.

Activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt gekoppeld aan
`mention`; `requireMention: false` wordt gekoppeld aan `always`. Een activeringsoverschrijving
op sessieniveau, indien aanwezig, wint van de configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een hogere wachtrijlimiet, houden menselijke
berichten vóór door bots geschreven ruis wanneer de wachtrij vol is, en voegen uitbarstingen van normale
groepsberichten samen tot één toegeschreven beurt. Slash-commando's worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT- en TTS-ondersteuning gebruikt configuratie op twee niveaus met prioriteitsterugval:

| Instelling | Plugin-specifiek                                        | Framework-terugval           |
| ---------- | -------------------------------------------------------- | ---------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Stel `enabled: false` in op een van beide om uit te schakelen.
TTS-overschrijvingen op accountniveau gebruiken dezelfde vorm als `messages.tts` en worden diep samengevoegd
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents blootgesteld als metadata voor audiomedia, terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. `[[audio_as_voice]]`-platte
tekstantwoorden synthetiseren TTS en verzenden een native QQ-spraakbericht wanneer TTS is
geconfigureerd.

Uitgaand audio-upload-/transcodegedrag kan ook worden afgestemd met
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelformaten

| Formaat                   | Beschrijving       |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | Privéchat (C2C)    |
| `qqbot:group:GROUP_OPENID` | Groepschat         |
| `qqbot:channel:CHANNEL_ID` | Gildekanaal        |

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID die Bot A ontvangt **kan niet**
> worden gebruikt om berichten te verzenden via Bot B.

## Slash-commando's

Ingebouwde commando's die vóór de AI-wachtrij worden onderschept:

| Commando       | Beschrijving                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                              |
| `/bot-version` | Toon de OpenClaw-frameworkversie                                                                          |
| `/bot-help`    | Geef alle commando's weer                                                                                 |
| `/bot-me`      | Toon de QQ-gebruikers-ID (openid) van de afzender voor het instellen van `allowFrom`/`groupAllowFrom`      |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradehandleiding                                                             |
| `/bot-logs`    | Exporteer recente gatewaylogs als bestand                                                                 |
| `/bot-approve` | Keur een wachtende QQ Bot-actie goed (bijvoorbeeld het bevestigen van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een commando voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Beheerderscommando's (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) zijn alleen voor directe berichten en vereisen de openid van de afzender in een expliciete niet-wildcard `allowFrom`-lijst. Een wildcard `allowFrom: ["*"]` staat chat toe, maar geeft geen toegang tot beheerderscommando's. Groepsberichten worden eerst vergeleken met `groupAllowFrom` en vallen terug op `allowFrom`. Het uitvoeren van een beheerderscommando in een groep retourneert een hint in plaats van het stilzwijgend te laten vallen.

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resource-stack (WebSocket-verbinding, API-client, tokencache, opslagroot voor media) met `appId` als sleutel. Accounts delen nooit inkomende/uitgaande status.
- De multi-accountlogger tagt logregels met het eigenaaraccount, zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één Gateway uitvoert.
- Inkomende, uitgaande en gateway-bridgepaden delen één root voor mediapayloads onder `~/.openclaw/media`, zodat uploads, downloads en transcodecaches in één bewaakte directory terechtkomen in plaats van in een boom per subsysteem.
- Rich media-levering loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de grote-bestanddrempel gebruiken QQ's chunked upload-endpoints, terwijl kleinere payloads de eenmalige media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resource-stack van elk account opnieuw bij herstel zonder een nieuw QR-codepaar te vereisen.

## Onboarding met QR-code

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een onboardingflow met QR-code om een QQ Bot aan OpenClaw te koppelen:

1. Voer het QQ Bot-instelpad uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoonapp die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling goed op de telefoon. OpenClaw bewaart de geretourneerde referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld flows voor "deze actie toestaan?" die door de QQ Bot API worden blootgesteld) verschijnen als native OpenClaw-prompts die je kunt accepteren met `/bot-approve` in plaats van te antwoorden via de ruwe QQ-client.

## Problemen oplossen

- **Bot antwoordt "gone to Mars":** referenties niet geconfigureerd of Gateway niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn, en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert uitgaande QQ-refindexen als
  door de bot geschreven en negeert inkomende gebeurtenissen waarvan de huidige `msgIdx` overeenkomt met dat
 zelfde botaccount. Dit voorkomt platform-echolussen, terwijl gebruikers nog steeds kunnen
  citeren of antwoorden op eerdere botberichten.
- **Instellen met `--token-file` toont nog steeds niet-geconfigureerd:** `--token-file` stelt alleen
  de AppSecret in. Je hebt nog steeds `appId` nodig in de configuratie of `QQBOT_APP_ID`.
- **Proactieve berichten komen niet aan:** QQ kan door de bot geïnitieerde berichten onderscheppen als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak wordt niet getranscribeerd:** zorg ervoor dat STT is geconfigureerd en dat de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
