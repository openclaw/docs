---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-referenties instellen
    - Je wilt ondersteuning voor groepschats of privéchats met QQ Bot
summary: QQ Bot-installatie, configuratie en gebruik
title: QQ-bot
x-i18n:
    generated_at: "2026-05-03T21:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindt met OpenClaw via de officiële QQ Bot API (WebSocket-Gateway). De
Plugin ondersteunt C2C-privéchats, groep-@berichten en gildekanaalberichten met
rijke media (afbeeldingen, spraak, video, bestanden).

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

5. Start de Gateway opnieuw.

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

- Env fallback geldt alleen voor het standaard QQ Bot-account.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen de
  AppSecret; de AppID moet al in de configuratie of `QQBOT_APP_ID` zijn ingesteld.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een platte-teksttekenreeks.
- Verouderde `secretref:/...`-markeringstekenreeksen zijn geen geldige `clientSecret`-waarden;
  gebruik gestructureerde SecretRef-objecten zoals in het voorbeeld hierboven.

### Instellen met meerdere accounts

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

Ondersteuning voor QQ Bot-groepschats gebruikt QQ-groeps-OpenID's, geen weergavenamen. Voeg de bot
toe aan een groep en vermeld hem vervolgens, of configureer de groep zodat die zonder vermelding draait.

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
- `toolPolicy`: `full`, `restricted` of `none` voor groepsgebonden tools.
- `name`: vriendelijk label dat wordt gebruikt in logs en groepscontext.
- `prompt`: gedragsprompt per groep die aan de agentcontext wordt toegevoegd.

Activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt toegewezen aan
`mention`; `requireMention: false` wordt toegewezen aan `always`. Een activeringsoverride
op sessieniveau, wanneer aanwezig, heeft voorrang op configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een grotere wachtrijlimiet, houden menselijke
berichten vóór botgeschreven chatter wanneer de wachtrij vol is, en voegen bursts van normale
groepsberichten samen tot één toegewezen beurt. Slash-opdrachten worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT- en TTS-ondersteuning gebruiken configuratie op twee niveaus met prioriteitsfallback:

| Instelling | Plugin-specifiek                                         | Framework-fallback           |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
TTS-overrides op accountniveau gebruiken dezelfde vorm als `messages.tts` en deep-mergen
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents blootgesteld als audiomedia-metadata terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. `[[audio_as_voice]]`-antwoorden in platte
tekst synthetiseren TTS en sturen een native QQ-spraakbericht wanneer TTS is
geconfigureerd.

Het gedrag voor uitgaande audio-upload/transcodering kan ook worden afgestemd met
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelindelingen

| Indeling                   | Beschrijving       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privéchat (C2C) |
| `qqbot:group:GROUP_OPENID` | Groepschat         |
| `qqbot:channel:CHANNEL_ID` | Gildekanaal      |

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID die door Bot A is ontvangen **kan niet**
> worden gebruikt om berichten via Bot B te sturen.

## Slash-opdrachten

Ingebouwde opdrachten die vóór de AI-wachtrij worden onderschept:

| Opdracht       | Beschrijving                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                             |
| `/bot-version` | Toon de OpenClaw-frameworkversie                                                                      |
| `/bot-help`    | Toon alle opdrachten                                                                                        |
| `/bot-me`      | Toon de QQ-gebruikers-ID (openid) van de afzender voor `allowFrom`/`groupAllowFrom`-instelling                             |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradegids                                                                        |
| `/bot-logs`    | Exporteer recente gatewaylogs als bestand                                                                     |
| `/bot-approve` | Keur een wachtende QQ Bot-actie goed (bijvoorbeeld het bevestigen van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Beheerdersopdrachten (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) zijn alleen voor directe berichten en vereisen de openid van de afzender in een expliciete niet-wildcard `allowFrom`-lijst. Een wildcard `allowFrom: ["*"]` staat chat toe maar verleent geen toegang tot beheerdersopdrachten. Groepsberichten worden eerst vergeleken met `groupAllowFrom` en vallen terug op `allowFrom`. Het uitvoeren van een beheerdersopdracht in een groep retourneert een hint in plaats van die stil te laten vallen.

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resourcestack (WebSocket-verbinding, API-client, tokencache, hoofdmap voor mediaopslag) gesleuteld op `appId`. Accounts delen nooit inkomende/uitgaande status.
- De multi-accountlogger tagt logregels met het eigenaaraccount, zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één gateway uitvoert.
- Inkomende, uitgaande en gateway-bridgepaden delen één hoofdmap voor mediapayloads onder `~/.openclaw/media`, zodat uploads, downloads en transcodecaches in één bewaakte map terechtkomen in plaats van in een boom per subsysteem.
- Levering van rijke media loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de drempel voor grote bestanden gebruiken QQ's chunked upload-endpoints, terwijl kleinere payloads de eenmalige media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resourcestack van elk account opnieuw bij herstel zonder dat een nieuw QR-codepaar nodig is.

## Onboarding met QR-code

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een onboardingflow met QR-code om een QQ Bot aan OpenClaw te koppelen:

1. Voer het QQ Bot-instelpad uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoonapp die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling goed op de telefoon. OpenClaw bewaart de geretourneerde referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld "allow this action?"-flows die door de QQ Bot API worden blootgesteld) verschijnen als native OpenClaw-prompts die je met `/bot-approve` kunt accepteren in plaats van via de ruwe QQ-client te antwoorden.

## Probleemoplossing

- **Bot antwoordt "gone to Mars":** referenties niet geconfigureerd of Gateway niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn, en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert QQ-uitgaande ref-indexen als
  door de bot geschreven en negeert inkomende events waarvan de huidige `msgIdx` overeenkomt met dat
  zelfde botaccount. Dit voorkomt platform-echo-loops, terwijl gebruikers nog steeds
  eerdere botberichten kunnen citeren of erop kunnen antwoorden.
- **Instellen met `--token-file` toont nog steeds niet-geconfigureerd:** `--token-file` stelt alleen
  de AppSecret in. Je hebt nog steeds `appId` in de configuratie of `QQBOT_APP_ID` nodig.
- **Proactieve berichten komen niet aan:** QQ kan door de bot geïnitieerde berichten onderscheppen als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak niet getranscribeerd:** zorg dat STT is geconfigureerd en dat de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
