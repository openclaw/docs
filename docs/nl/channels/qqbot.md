---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-inloggegevens instellen
    - Je wilt ondersteuning voor groeps- of privéchats met QQ Bot
summary: QQ Bot instellen, configureren en gebruiken
title: QQ-bot
x-i18n:
    generated_at: "2026-05-04T02:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindt met OpenClaw via de officiële QQ Bot API (WebSocket gateway). De
Plugin ondersteunt C2C-privéchats, @berichten in groepen en berichten in guild-kanalen met
rijke media (afbeeldingen, spraak, video, bestanden).

Status: downloadbare Plugin. Directe berichten, groepschats, guild-kanalen en
media worden ondersteund. Reacties en threads worden niet ondersteund.

## Installeren

Installeer QQ Bot vóór de configuratie:

```bash
openclaw plugins install @openclaw/qqbot
```

## Instellen

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met je
   telefoon-QQ om je te registreren / in te loggen.
2. Klik op **Bot maken** om een nieuwe QQ-bot te maken.
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

Omgevingsvariabelen voor standaardaccount:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Bestandsgebaseerde AppSecret:

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

Env SecretRef AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Opmerkingen:

- Env-terugval geldt alleen voor het standaard QQ Bot-account.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen de
  AppSecret; de AppID moet al zijn ingesteld in de configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een plattetekststring.
- Verouderde `secretref:/...`-markeringsstrings zijn geen geldige `clientSecret`-waarden;
  gebruik gestructureerde SecretRef-objecten zoals in het voorbeeld hierboven.

### Multi-account instellen

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

Voeg een tweede bot toe via de CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Groepschats

Ondersteuning voor QQ Bot-groepschats gebruikt QQ-groep-OpenID's, geen weergavenamen. Voeg de bot toe
aan een groep en vermeld hem vervolgens of configureer de groep om zonder vermelding te werken.

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

- `requireMention`: vereist een @vermelding voordat de bot antwoordt. Standaard: `true`.
- `ignoreOtherMentions`: laat berichten vallen die iemand anders vermelden maar niet de bot.
- `historyLimit`: bewaar recente groepsberichten zonder vermelding als context voor de volgende vermelde beurt. Stel in op `0` om uit te schakelen.
- `toolPolicy`: `full`, `restricted` of `none` voor tools binnen de groepsscope.
- `name`: gebruiksvriendelijk label dat in logs en groepscontext wordt gebruikt.
- `prompt`: gedragsprompt per groep die aan de agentcontext wordt toegevoegd.

Activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt gekoppeld aan
`mention`; `requireMention: false` wordt gekoppeld aan `always`. Een activeringsoverride op sessieniveau,
indien aanwezig, wint van de configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een grotere wachtrijlimiet, houden menselijke
berichten vóór botgeschreven chatter wanneer de wachtrij vol is, en voegen uitbarstingen van normale
groepsberichten samen tot één toegeschreven beurt. Slash-commando's worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT en TTS ondersteunen configuratie op twee niveaus met prioritaire terugval:

| Instelling | Plugin-specifiek                                         | Framework-terugval            |
| ---------- | -------------------------------------------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
        "qq-main": {
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
TTS-overrides op accountniveau gebruiken dezelfde vorm als `messages.tts` en worden diep samengevoegd
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents beschikbaar gesteld als audiomedia-metadata, terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. `[[audio_as_voice]]`-antwoorden in platte
tekst synthetiseren TTS en verzenden een native QQ-spraakbericht wanneer TTS is
geconfigureerd.

Upload-/transcodeergedrag voor uitgaande audio kan ook worden afgestemd met
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelformaten

| Formaat                    | Beschrijving       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privéchat (C2C)    |
| `qqbot:group:GROUP_OPENID` | Groepschat         |
| `qqbot:channel:CHANNEL_ID` | Guild-kanaal       |

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID die door Bot A is ontvangen **kan niet**
> worden gebruikt om berichten via Bot B te verzenden.

## Slash-commando's

Ingebouwde commando's die vóór de AI-wachtrij worden onderschept:

| Commando       | Beschrijving                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                                   |
| `/bot-version` | Toon de versie van het OpenClaw-framework                                                                      |
| `/bot-help`    | Alle commando's weergeven                                                                                      |
| `/bot-me`      | Toon de QQ-gebruikers-ID (openid) van de afzender voor `allowFrom`/`groupAllowFrom`-instelling                 |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradehandleiding                                                                  |
| `/bot-logs`    | Exporteer recente Gateway-logs als bestand                                                                     |
| `/bot-approve` | Keur een wachtende QQ Bot-actie goed (bijvoorbeeld het bevestigen van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een commando voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Admin-commando's (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) zijn alleen voor directe berichten en vereisen de openid van de afzender in een expliciete niet-wildcard `allowFrom`-lijst. Een wildcard `allowFrom: ["*"]` staat chat toe maar verleent geen toegang tot admin-commando's. Groepsberichten worden eerst tegen `groupAllowFrom` gematcht en vallen terug op `allowFrom`. Het uitvoeren van een admin-commando in een groep retourneert een hint in plaats van stilzwijgend te worden genegeerd.

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resourcestack (WebSocket-verbinding, API-client, tokencache, root voor mediaopslag) met `appId` als sleutel. Accounts delen nooit inkomende/uitgaande status.
- De multi-accountlogger tagt logregels met het eigenaaraccount, zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één gateway uitvoert.
- Inkomende, uitgaande en gateway-bridgepaden delen één root voor mediapayloads onder `~/.openclaw/media`, zodat uploads, downloads en transcodeercaches in één bewaakte directory terechtkomen in plaats van in een boom per subsysteem.
- Levering van rijke media loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de drempel voor grote bestanden gebruiken QQ's chunked-upload-eindpunten, terwijl kleinere payloads de one-shot media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resourcestack van elk account opnieuw bij herstel zonder een nieuwe QR-codekoppeling te vereisen.

## Onboarding met QR-code

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een onboardingflow met QR-code om een QQ Bot aan OpenClaw te koppelen:

1. Voer het instelpad voor QQ Bot uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoonapp die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling goed op de telefoon. OpenClaw bewaart de geretourneerde referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld flows "deze actie toestaan?" die door de QQ Bot API worden aangeboden) verschijnen als native OpenClaw-prompts die je kunt accepteren met `/bot-approve` in plaats van via de ruwe QQ-client te antwoorden.

## Probleemoplossing

- **Bot antwoordt "gone to Mars":** referenties zijn niet geconfigureerd of Gateway is niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn, en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert QQ-uitgaande ref-indexen als
  door de bot geschreven en negeert inkomende events waarvan de huidige `msgIdx` overeenkomt met dat
 zelfde botaccount. Dit voorkomt platform-echolussen, terwijl gebruikers nog steeds
  eerdere botberichten kunnen citeren of erop kunnen antwoorden.
- **Setup met `--token-file` toont nog steeds niet-geconfigureerd:** `--token-file` stelt alleen
  de AppSecret in. Je hebt nog steeds `appId` nodig in de configuratie of `QQBOT_APP_ID`.
- **Proactieve berichten komen niet aan:** QQ kan door de bot geïnitieerde berichten onderscheppen als
  de gebruiker niet recent heeft geïnterageerd.
- **Spraak wordt niet getranscribeerd:** zorg dat STT is geconfigureerd en dat de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
