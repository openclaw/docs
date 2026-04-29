---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-inloggegevens instellen
    - Je wilt ondersteuning voor groeps- of privéchats met QQ Bot
summary: QQ Bot-installatie, configuratie en gebruik
title: QQ-bot
x-i18n:
    generated_at: "2026-04-29T22:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindt met OpenClaw via de officiële QQ Bot API (WebSocket-gateway). De
Plugin ondersteunt C2C-privéchats, @berichten in groepen en berichten in gildekanalen met
rijke media (afbeeldingen, spraak, video, bestanden).

Status: gebundelde Plugin. Directe berichten, groepschats, gildekanalen en
media worden ondersteund. Reacties en threads worden niet ondersteund.

## Gebundelde Plugin

Huidige OpenClaw-releases bundelen QQ Bot, dus normale verpakte builds hebben geen
aparte stap `openclaw plugins install` nodig.

## Instellen

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met je
   QQ op je telefoon om je te registreren / in te loggen.
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

Opmerkingen:

- Env-terugval geldt alleen voor het standaard QQ Bot-account.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen de
  AppSecret; de AppID moet al zijn ingesteld in de configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een plattetekstreeks.

### Instelling voor meerdere accounts

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

Ondersteuning voor QQ Bot-groepschats gebruikt QQ-groep-OpenID's, geen weergavenamen. Voeg de bot
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

- `requireMention`: vereis een @vermelding voordat de bot antwoordt. Standaard: `true`.
- `ignoreOtherMentions`: verwijder berichten die iemand anders vermelden maar niet de bot.
- `historyLimit`: bewaar recente groepsberichten zonder vermelding als context voor de volgende genoemde beurt. Stel `0` in om uit te schakelen.
- `toolPolicy`: `full`, `restricted` of `none` voor groepsgebonden tools.
- `name`: gebruiksvriendelijk label dat wordt gebruikt in logs en groepscontext.
- `prompt`: gedragsinstructie per groep die wordt toegevoegd aan de agentcontext.

Activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt gekoppeld aan
`mention`; `requireMention: false` wordt gekoppeld aan `always`. Een activeringsoverschrijving op sessieniveau,
indien aanwezig, wint van de configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een grotere wachtrijlimiet, houden menselijke
berichten vóór door bots geschreven chatter wanneer de wachtrij vol is, en voegen uitbarstingen van normale
groepsberichten samen tot één toegeschreven beurt. Slash-opdrachten worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT- en TTS-ondersteuning gebruiken tweelaagse configuratie met prioriteits-terugval:

| Instelling | Plugin-specifiek                                         | Framework-terugval            |
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
TTS-overschrijvingen op accountniveau gebruiken dezelfde vorm als `messages.tts` en worden diep samengevoegd
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents blootgesteld als audiomediametadata terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. Plattetekstantwoorden met `[[audio_as_voice]]`
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
| `qqbot:channel:CHANNEL_ID` | Gildekanaal        |

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID ontvangen door Bot A **kan niet**
> worden gebruikt om berichten te sturen via Bot B.

## Slash-opdrachten

Ingebouwde opdrachten die worden onderschept vóór de AI-wachtrij:

| Opdracht       | Beschrijving                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                                  |
| `/bot-version` | Toon de OpenClaw-frameworkversie                                                                              |
| `/bot-help`    | Lijst met alle opdrachten                                                                                     |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradehandleiding                                                                 |
| `/bot-logs`    | Exporteer recente gatewaylogs als bestand                                                                     |
| `/bot-approve` | Keur een openstaande QQ Bot-actie goed (bijvoorbeeld bevestiging van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resourcestack (WebSocket-verbinding, API-client, tokencache, mediaopslagroot) gekoppeld aan `appId`. Accounts delen nooit inkomende/uitgaande status.
- De logger voor meerdere accounts labelt logregels met het eigenaaraccount zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één Gateway uitvoert.
- Inkomende, uitgaande en gateway-bridgepaden delen één media-payloadroot onder `~/.openclaw/media`, zodat uploads, downloads en transcodeercaches in één bewaakte directory terechtkomen in plaats van een boom per subsysteem.
- Levering van rijke media loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de drempel voor grote bestanden gebruiken QQ's endpoints voor uploads in delen, terwijl kleinere payloads de eenmalige media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resourcestack van elk account opnieuw bij herstel zonder dat een nieuwe QR-codekoppeling nodig is.

## Onboarding met QR-code

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een onboardingflow met QR-code om een QQ Bot aan OpenClaw te koppelen:

1. Voer het instelpad voor QQ Bot uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoonapp die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling goed op de telefoon. OpenClaw bewaart de geretourneerde referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld flows "deze actie toestaan?" die door de QQ Bot API worden blootgesteld) verschijnen als native OpenClaw-prompts die je kunt accepteren met `/bot-approve` in plaats van te antwoorden via de ruwe QQ-client.

## Problemen oplossen

- **Bot antwoordt "gone to Mars":** referenties niet geconfigureerd of Gateway niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn, en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert QQ-uitgaande ref-indexen als
  door de bot geschreven en negeert inkomende gebeurtenissen waarvan de huidige `msgIdx` overeenkomt met dat
  zelfde botaccount. Dit voorkomt echo-loops van het platform terwijl gebruikers nog steeds
  eerdere botberichten kunnen citeren of beantwoorden.
- **Instellen met `--token-file` toont nog steeds ongeconfigureerd:** `--token-file` stelt alleen
  de AppSecret in. Je hebt nog steeds `appId` nodig in de configuratie of `QQBOT_APP_ID`.
- **Proactieve berichten komen niet aan:** QQ kan door bots geïnitieerde berichten onderscheppen als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak niet getranscribeerd:** zorg dat STT is geconfigureerd en de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
