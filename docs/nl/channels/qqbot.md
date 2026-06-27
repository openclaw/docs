---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet QQ Bot-inloggegevens configureren
    - Je wilt ondersteuning voor QQ Bot-groepen of privéchats
summary: QQ Bot-installatie, configuratie en gebruik
title: QQ bot
x-i18n:
    generated_at: "2026-06-27T17:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindt met OpenClaw via de officiële QQ Bot API (WebSocket-gateway). De
Plugin ondersteunt C2C-privéchat, @berichten in groepen en berichten in guildkanalen met
rijke media (afbeeldingen, spraak, video, bestanden).

Status: downloadbare Plugin. Directe berichten, groepschats, guildkanalen en
media worden ondersteund. Reacties en threads worden niet ondersteund.

## Installeren

Installeer QQ Bot vóór de setup:

```bash
openclaw plugins install @openclaw/qqbot
```

## Setup

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

Interactieve setuppaden:

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

- Env-fallback geldt alleen voor het standaard-QQ Bot-account.
- `openclaw channels add --channel qqbot --token-file ...` levert alleen de
  AppSecret; de AppID moet al zijn ingesteld in de configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert ook SecretRef-invoer, niet alleen een plattetekstreeks.
- Oude `secretref:/...`-markerteksten zijn geen geldige `clientSecret`-waarden;
  gebruik gestructureerde SecretRef-objecten zoals in het voorbeeld hierboven.

### Setup voor meerdere accounts

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

Ondersteuning voor groepschat in QQ Bot gebruikt QQ-groep-OpenID's, geen weergavenamen. Voeg de bot
toe aan een groep en vermeld hem daarna of configureer de groep om zonder vermelding te draaien.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
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
- `commandLevel`: bepaal welke ingebouwde slash-opdrachten in groepen kunnen draaien.
  Standaard: `all`, waarmee het bestaande QQBot-groepsgedrag behouden blijft wanneer de
  instelling wordt weggelaten.
- `ignoreOtherMentions`: verwijder berichten die iemand anders vermelden maar niet de bot.
- `historyLimit`: bewaar recente groepsberichten zonder vermelding als context voor de volgende vermelde beurt. Stel in op `0` om uit te schakelen.
- `tools`: sta tools toe/weiger tools voor de hele groep.
- `toolsBySender`: groepsoverschrijvingen voor tools per afzender; zie [Groepen](/nl/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: vriendelijk label dat wordt gebruikt in logs en groepscontext.
- `prompt`: gedragsprompt per groep die aan de agentcontext wordt toegevoegd.

`commandLevel` accepteert:

- `all`: houd herkende ingebouwde opdrachten beschikbaar zoals voorheen. Sommige opdrachten kunnen
  verborgen blijven in menu's, maar geautoriseerde gebruikers kunnen ze nog steeds in de groep uitvoeren.
- `safety`: sta gangbare samenwerkingsopdrachten toe zoals `/help`, `/btw` en
  `/stop`; vraag gebruikers om gevoelige opdrachten zoals `/config`, `/tools` en
  `/bash` in privéchat uit te voeren.
- `strict`: sta alleen de groepssessiebesturing toe die nodig is voor strikte groepswerking.
  `/stop` blijft urgent, zodat een geautoriseerde afzender een actieve uitvoering kan
  onderbreken.

Oude QQBot-`toolPolicy`-vermeldingen zijn uitgefaseerd. Voer `openclaw doctor --fix` uit om ze naar `tools` te migreren.

Activatiemodi zijn `mention` en `always`. `requireMention: true` wordt gekoppeld aan
`mention`; `requireMention: false` wordt gekoppeld aan `always`. Een activeringsoverschrijving
op sessieniveau, indien aanwezig, wint van de configuratie.

De inkomende wachtrij is per peer. Groepspeers krijgen een grotere wachtrijlimiet, houden menselijke
berichten vóór door bots geschreven tekst wanneer de wachtrij vol is, en voegen bursts van normale
groepsberichten samen tot één toegeschreven beurt. Slash-opdrachten worden nog steeds één voor één uitgevoerd.

### Spraak (STT / TTS)

STT- en TTS-ondersteuning gebruikt configuratie op twee niveaus met prioriteitsfallback:

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

Stel `enabled: false` op een van beide in om uit te schakelen.
TTS-overschrijvingen op accountniveau gebruiken dezelfde vorm als `messages.tts` en worden diep samengevoegd
over de kanaal-/globale TTS-configuratie.

Inkomende QQ-spraakbijlagen worden aan agents beschikbaar gesteld als metadata voor audiomedia terwijl
ruwe spraakbestanden buiten generieke `MediaPaths` blijven. `[[audio_as_voice]]`-antwoorden in platte
tekst synthetiseren TTS en sturen een native QQ-spraakbericht wanneer TTS is
geconfigureerd.

Gedrag voor uitgaande audiouploads/transcodering kan ook worden afgestemd met
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

> Elke bot heeft zijn eigen set gebruikers-OpenID's. Een OpenID die is ontvangen door Bot A **kan niet**
> worden gebruikt om berichten via Bot B te verzenden.

## Slash-opdrachten

Ingebouwde opdrachten die vóór de AI-wachtrij worden onderschept:

| Opdracht       | Beschrijving                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latentietest                                                                                            |
| `/bot-version` | Toon de OpenClaw-frameworkversie                                                                        |
| `/bot-help`    | Geef alle opdrachten weer                                                                               |
| `/bot-me`      | Toon de QQ-gebruikers-ID (openid) van de afzender voor `allowFrom`/`groupAllowFrom`-setup                |
| `/bot-upgrade` | Toon de link naar de QQBot-upgradehandleiding                                                           |
| `/bot-logs`    | Exporteer recente gatewaylogs als bestand                                                               |
| `/bot-approve` | Keur een openstaande QQ Bot-actie goed (bijvoorbeeld het bevestigen van een C2C- of groepsupload) via de native flow. |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Beheerdersopdrachten (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) zijn alleen voor directe berichten en vereisen de openid van de afzender in een expliciete niet-wildcard `allowFrom`-lijst. Een wildcard `allowFrom: ["*"]` staat chat toe, maar verleent geen toegang tot beheerdersopdrachten. Groepsberichten worden eerst gematcht tegen `groupAllowFrom` en vallen terug op `allowFrom`. Het uitvoeren van een beheerdersopdracht in een groep retourneert een hint in plaats van stilzwijgend te worden genegeerd.

Wanneer QQ Bot exec-goedkeuringen de standaardfallback voor dezelfde chat gebruiken, volgen native klikken
op goedkeuringsknoppen dezelfde expliciete niet-wildcard-toelatingslijst voor opdrachten. Configureer
`channels.qqbot.execApprovals.approvers` om alleen goedkeuringstoegang te verlenen zonder bredere opdrachttoegang.

## Engine-architectuur

QQ Bot wordt geleverd als een zelfstandige engine binnen de Plugin:

- Elk account bezit een geïsoleerde resourcestack (WebSocket-verbinding, API-client, tokencache, mediaopslagroot) gekoppeld aan `appId`. Accounts delen nooit inkomende/uitgaande status.
- De logger voor meerdere accounts tagt logregels met het eigenaaraccount, zodat diagnostiek gescheiden blijft wanneer je meerdere bots onder één gateway uitvoert.
- Inkomende, uitgaande en gatewaybridgepaden delen één root voor mediapayloads onder `~/.openclaw/media`, zodat uploads, downloads en transcoderingscaches onder één bewaakte map terechtkomen in plaats van een boom per subsysteem.
- Levering van rijke media loopt via één `sendMedia`-pad voor C2C- en groepsdoelen. Lokale bestanden en buffers boven de drempel voor grote bestanden gebruiken QQ's chunked-upload-eindpunten, terwijl kleinere payloads de eenmalige media-API gebruiken.
- Referenties kunnen worden geback-upt en hersteld als onderdeel van standaard OpenClaw-referentiesnapshots; de engine koppelt de resourcestack van elk account opnieuw bij herstel zonder een nieuw QR-codepaar te vereisen.

## Onboarding met QR-code

Als alternatief voor het handmatig plakken van `AppID:AppSecret` ondersteunt de engine een onboardingflow met QR-code om een QQ Bot aan OpenClaw te koppelen:

1. Voer het QQ Bot-setuppad uit (bijvoorbeeld `openclaw channels add --channel qqbot`) en kies de QR-codeflow wanneer daarom wordt gevraagd.
2. Scan de gegenereerde QR-code met de telefoonapp die aan de doel-QQ Bot is gekoppeld.
3. Keur de koppeling goed op de telefoon. OpenClaw bewaart de teruggegeven referenties in `credentials/` onder de juiste accountscope.

Goedkeuringsprompts die door de bot zelf worden gegenereerd (bijvoorbeeld "allow this action?"-flows die door de QQ Bot API worden blootgesteld) verschijnen als native OpenClaw-prompts die je met `/bot-approve` kunt accepteren in plaats van te antwoorden via de ruwe QQ-client.

## Probleemoplossing

- **Bot antwoordt "gone to Mars":** referenties zijn niet geconfigureerd of Gateway is niet gestart.
- **Geen inkomende berichten:** controleer of `appId` en `clientSecret` correct zijn en of de
  bot is ingeschakeld op het QQ Open Platform.
- **Herhaalde zelfantwoorden:** OpenClaw registreert QQ-indexen voor uitgaande verwijzingen als
  door de bot geschreven en negeert inkomende gebeurtenissen waarvan de huidige `msgIdx` overeenkomt met dat
  zelfde botaccount. Dit voorkomt platform-echoloops, terwijl gebruikers nog steeds eerdere botberichten
  kunnen citeren of erop kunnen antwoorden.
- **Setup met `--token-file` wordt nog steeds als niet-geconfigureerd weergegeven:** `--token-file` stelt alleen
  de AppSecret in. Je hebt nog steeds `appId` in de configuratie of `QQBOT_APP_ID` nodig.
- **Proactieve berichten komen niet aan:** QQ kan door de bot gestarte berichten onderscheppen als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak niet getranscribeerd:** zorg ervoor dat STT is geconfigureerd en de provider bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
