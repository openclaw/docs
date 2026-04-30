---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-inloggegevens instellen
    - Je wilt ondersteuning voor groeps- of privéchats met QQ Bot
summary: QQ Bot instellen, configureren en gebruiken
title: QQ-bot
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindt met OpenClaw via de officiële QQ Bot-API (WebSocket-gateway). De
Plugin ondersteunt C2C-privéchats, groeps-@berichten en guildkanaalberichten met
rich media (afbeeldingen, spraak, video, bestanden).

Status: gebundelde Plugin. Directe berichten, groepschats, guildkanalen en
media worden ondersteund. Reacties en threads worden niet ondersteund.

## Gebundelde Plugin

Huidige OpenClaw-releases bundelen QQ Bot, dus normale verpakte builds hebben
geen aparte stap `openclaw plugins install` nodig.

## Installatie

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met je
   telefoon-QQ om te registreren / in te loggen.
2. Klik op **Create Bot** om een nieuwe QQ-bot te maken.
3. Zoek **AppID** en **AppSecret** op de instellingenpagina van de bot en kopieer ze.

> AppSecret wordt niet als platte tekst opgeslagen — als je de pagina verlaat zonder het op te slaan,
> moet je een nieuwe genereren.

4. Voeg het kanaal toe:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Herstart de Gateway.

Interactieve installatiepaden:

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

AppSecret ondersteund door bestand:

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

- Env-fallback is alleen van toepassing op het standaard-QQ Bot-account.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen het
  AppSecret; het AppID moet al zijn ingesteld in configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een plattetekstreeks.

### Installatie met meerdere accounts

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
tokencache (geïsoleerd per `appId`).

Voeg een tweede bot toe via de CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Groepschats

Ondersteuning voor QQ Bot-groepschats gebruikt OpenID's van QQ-groepen, geen weergavenamen. Voeg de bot
toe aan een groep en noem hem vervolgens of configureer de groep om zonder vermelding te werken.

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
- `ignoreOtherMentions`: verwijder berichten die iemand anders vermelden maar niet de bot.
- `historyLimit`: bewaar recente groepsberichten zonder vermelding als context voor de volgende vermelde beurt. Stel `0` in om uit te schakelen.
- `toolPolicy`: `full`, `restricted` of `none` voor groepsgebonden tools.
- `name`: vriendelijk label dat wordt gebruikt in logs en groepscontext.
- `prompt`: gedrags-prompt per groep die aan de agentcontext wordt toegevoegd.

Activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt toegewezen aan
`mention`; `requireMention: false` wordt toegewezen aan `always`. Een activeringsoverschrijving op sessieniveau
heeft, wanneer aanwezig, voorrang op configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een grotere wachtrijlimiet, houden menselijke
berichten vóór botgeschreven chatter wanneer de wachtrij vol is, en voegen bursts van normale
groepsberichten samen tot één toegeschreven beurt. Slash-opdrachten worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT- en TTS-ondersteuning gebruikt configuratie op twee niveaus met prioriteitsfallback:

| Instelling | Pluginspecifiek                                           | Framework-fallback            |
| ---------- | --------------------------------------------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                |

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

Stel `enabled: false` op een van beide in om uit te schakelen.
TTS-overschrijvingen op accountniveau gebruiken dezelfde vorm als `messages.tts` en worden diep samengevoegd
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents beschikbaar gesteld als audiomediametadata, terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. Antwoorden in platte tekst met `[[audio_as_voice]]`
synthetiseren TTS en sturen een native QQ-spraakbericht wanneer TTS is
geconfigureerd.

Gedrag voor uitgaande audio-upload/transcodering kan ook worden afgestemd met
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelformaten

| Formaat                    | Beschrijving       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privéchat (C2C)    |
| `qqbot:group:GROUP_OPENID` | Groepschat         |
| `qqbot:channel:CHANNEL_ID` | Guildkanaal        |

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID die door Bot A is ontvangen **kan niet**
> worden gebruikt om berichten via Bot B te verzenden.

## Slash-opdrachten

Ingebouwde opdrachten die vóór de AI-wachtrij worden onderschept:

| Opdracht       | Beschrijving                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                               |
| `/bot-version` | Toon de OpenClaw-frameworkversie                                                                           |
| `/bot-help`    | Toon alle opdrachten                                                                                       |
| `/bot-me`      | Toon de QQ-gebruikers-ID (openid) van de afzender voor `allowFrom`/`groupAllowFrom`-installatie            |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradehandleiding                                                              |
| `/bot-logs`    | Exporteer recente gatewaylogs als bestand                                                                  |
| `/bot-approve` | Keur een wachtende QQ Bot-actie goed (bijvoorbeeld het bevestigen van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Adminopdrachten (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) zijn alleen voor directe berichten en vereisen dat de openid van de afzender in een expliciete niet-wildcard `allowFrom`-lijst staat. Een wildcard `allowFrom: ["*"]` staat chat toe maar verleent geen toegang tot adminopdrachten. Groepsberichten worden eerst vergeleken met `groupAllowFrom` en vallen terug op `allowFrom`. Het uitvoeren van een adminopdracht in een groep retourneert een hint in plaats van stilzwijgend te worden genegeerd.

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resourcestack (WebSocket-verbinding, API-client, tokencache, mediaopslagroot) gesleuteld op `appId`. Accounts delen nooit inkomende/uitgaande status.
- De multi-accountlogger tagt logregels met het eigenaaraccount zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één gateway uitvoert.
- Inkomende, uitgaande en gateway-bridgepaden delen één media-payloadroot onder `~/.openclaw/media`, zodat uploads, downloads en transcodecaches onder één bewaakte directory terechtkomen in plaats van in een boom per subsysteem.
- Richmediabelevering loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de drempel voor grote bestanden gebruiken QQ's chunked upload-eindpunten, terwijl kleinere payloads de eenmalige media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resourcestack van elk account opnieuw aan bij herstel zonder dat een nieuw QR-codepaar nodig is.

## QR-code-onboarding

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een QR-code-onboardingflow voor het koppelen van een QQ Bot aan OpenClaw:

1. Voer het QQ Bot-installatiepad uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoon-app die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling op de telefoon goed. OpenClaw bewaart de geretourneerde referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld flows voor "deze actie toestaan?" die door de QQ Bot-API worden aangeboden) verschijnen als native OpenClaw-prompts die je kunt accepteren met `/bot-approve` in plaats van te antwoorden via de ruwe QQ-client.

## Probleemoplossing

- **Bot antwoordt "gone to Mars":** referenties niet geconfigureerd of Gateway niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert QQ-uitgaande ref-indexen als
  botgeschreven en negeert inkomende gebeurtenissen waarvan de huidige `msgIdx` overeenkomt met dat
  zelfde botaccount. Dit voorkomt echo-lussen van het platform terwijl gebruikers nog steeds
  eerdere botberichten kunnen citeren of beantwoorden.
- **Installatie met `--token-file` toont nog steeds ongeconfigureerd:** `--token-file` stelt alleen
  het AppSecret in. Je hebt nog steeds `appId` nodig in configuratie of `QQBOT_APP_ID`.
- **Proactieve berichten komen niet aan:** QQ kan door de bot geïnitieerde berichten onderscheppen als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak wordt niet getranscribeerd:** zorg dat STT is geconfigureerd en dat de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
