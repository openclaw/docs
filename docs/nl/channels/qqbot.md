---
read_when:
    - Je wilt OpenClaw met QQ verbinden
    - Je moet de inloggegevens voor QQ Bot instellen
    - Je wilt ondersteuning voor groeps- of privéchats met QQ Bot
summary: Installatie, configuratie en gebruik van QQ Bot
title: QQ-bot
x-i18n:
    generated_at: "2026-07-16T15:11:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot maakt via de officiële QQ Bot API (WebSocket-gateway) verbinding met OpenClaw.
Privéchats (C2C) en `@`-vermeldingen in groepen zijn de belangrijkste chattypen, met uitgebreide
mediaondersteuning (afbeeldingen, spraak, video, bestanden). Guild-kanaalberichten worden alleen ondersteund voor
tekst en afbeeldingen via externe URL's; spraak, video, bestandsuploads en lokale/Base64-
afbeeldingen zijn niet beschikbaar in guild-kanalen. Reacties en threads worden
nergens ondersteund.

Status: officiële downloadbare plugin.

## Installeren

```bash
openclaw plugins install @openclaw/qqbot
```

## Instellen

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met QQ op je
   telefoon om je te registreren / aan te melden.
2. Klik op **Create Bot** om een nieuwe QQ-bot te maken.
3. Zoek **AppID** en **AppSecret** op de instellingenpagina van de bot en kopieer ze.

<Note>
AppSecret wordt niet als platte tekst opgeslagen. Als je de pagina verlaat zonder het op te slaan, moet je een nieuw exemplaar genereren.
</Note>

4. Voeg het kanaal toe:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Start de Gateway opnieuw.

Interactieve configuratie:

```bash
openclaw channels add
```

De wizard biedt ook koppeling via een QR-code als alternatief voor het handmatig invoeren
van AppID/AppSecret: scan de code met de telefoonapp die aan de beoogde QQ Bot is gekoppeld
om de koppeling te voltooien. OpenClaw bewaart de geretourneerde referenties binnen het
configuratiebereik van het account.

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

Omgevingsvariabelen voor het standaardaccount (alleen account op het hoogste niveau):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret uit een bestand:

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

AppSecret via een SecretRef naar een omgevingsvariabele:

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

- `openclaw channels add --channel qqbot --token-file ...` stelt alleen het AppSecret
  in; `appId` moet al zijn ingesteld in de configuratie of `QQBOT_APP_ID`.
- `clientSecret` accepteert een tekenreeks met platte tekst, een bestandspad (`clientSecretFile`)
  of een gestructureerd SecretRef-object.
- Verouderde markertekenreeksen `secretref:...` / `secretref-env:...` worden geweigerd voor
  `clientSecret`; gebruik in plaats daarvan een gestructureerd SecretRef-object.

### Streaming

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // block streaming: "partial" (default) or "off"
        nativeTransport: true, // use QQ's official C2C stream_messages API for DMs
      },
    },
  },
}
```

- `streaming.mode: "off"` schakelt blokstreaming voor het account uit.
- `streaming.nativeTransport: true` streamt C2C-antwoorden (privéberichten) via de officiële
  `stream_messages`-API van QQ; doelen in groepen/kanalen worden niet beïnvloed.
- Verouderde scalaire waarden voor `streaming: true|false` en de sleutel `streaming.c2cStreamApi`
  worden via `openclaw doctor --fix` naar deze structuur gemigreerd.
- `/bot-streaming on|off` schakelt dezelfde configuratie vanuit een privébericht om.

### Toegangsbeleid

- `allowFrom` / `groupAllowFrom` bepalen wie in C2C-/
  groepscontexten met de bot kan chatten. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  regelen de afdwingingsmodus. `dmPolicy` wordt standaard `allowlist` zodra
  `allowFrom` een concrete vermelding (zonder jokerteken) bevat, anders `open`.
  `groupPolicy` wordt standaard `allowlist` zodra `groupAllowFrom` of
  `allowFrom` een concrete vermelding bevat, anders `open`.
- Slash-opdrachten van het type "Auth: allowlist" vereisen altijd een expliciete vermelding zonder jokerteken in
  `allowFrom` (of `groupAllowFrom` voor aanroepen vanuit groepen), ongeacht
  `dmPolicy` / `groupPolicy` — zie [Slash-opdrachten](#slash-commands).

### Configuratie met meerdere accounts

Voer meerdere QQ-bots uit binnen één OpenClaw-instantie:

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

Elk account heeft een geïsoleerde WebSocket-verbinding, API-client en token-
cache, geïndexeerd op `appId`. Logregels worden voorzien van de id van het bijbehorende account, zodat
diagnostische gegevens gescheiden blijven wanneer je meerdere bots onder één Gateway uitvoert.

Voeg via de CLI een tweede bot toe:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Groepschats

Groepsondersteuning gebruikt QQ-groeps-OpenID's, geen weergavenamen. Voeg de bot toe aan een
groep en vermeld deze vervolgens, of configureer de groep zodat deze zonder vermelding werkt.

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

`groups["*"]` stelt standaardwaarden voor elke groep in; een concrete vermelding voor `groups.GROUP_OPENID`
overschrijft die standaardwaarden voor één groep. Groepsinstellingen:

| Veld                  | Standaardwaarde  | Beschrijving                                                                                       |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Vereis een `@`-vermelding voordat de bot antwoordt.                                                |
| `commandLevel`        | `all`            | Welke ingebouwde slash-opdrachten in de groep kunnen worden uitgevoerd (zie hieronder).            |
| `ignoreOtherMentions` | `false`          | Negeer berichten die iemand anders vermelden, maar niet de bot.                                    |
| `historyLimit`        | `50`             | Recente berichten zonder vermelding die als context voor de volgende beurt met vermelding worden bewaard. `0` schakelt de geschiedenis uit. |
| `tools`               | —                | Hulpmiddelen voor de hele groep toestaan/weigeren.                                                 |
| `toolsBySender`       | —                | Overschrijvingen van hulpmiddelen per afzender; zie [Groepen](/nl/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | OpenID-voorvoegsel | Gebruiksvriendelijk label dat in logboeken en groepscontext wordt gebruikt.                        |
| `prompt`              | ingebouwde standaardwaarde | Gedragsprompt per groep die aan de agentcontext wordt toegevoegd.                                  |

`commandLevel` accepteert:

| Niveau   | Gedrag                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Bestaande ingebouwde opdrachten blijven beschikbaar. Sommige blijven verborgen in menu's, maar geautoriseerde gebruikers kunnen ze nog steeds in de groep uitvoeren. |
| `safety` | `/help`, `/btw`, `/stop` blijven zichtbaar in de groep; gevoelige opdrachten (`/config`, `/tools`, `/bash`, enz.) moeten in een privéchat worden uitgevoerd. |
| `strict` | Alleen besturingselementen voor groepssessies die nodig zijn voor een strikte werking zijn toegestaan. `/stop` blijft werken, zodat een geautoriseerde afzender een actieve uitvoering kan onderbreken. |

Oude QQBot-vermeldingen voor `toolPolicy` zijn buiten gebruik gesteld. Voer `openclaw doctor --fix` uit om ze naar `tools` te migreren.

De activeringsmodi zijn `mention` en `always`. `requireMention: true` wordt toegewezen aan
`mention`; `requireMention: false` wordt toegewezen aan `always`. Een activeringsoverride
op sessieniveau heeft, indien aanwezig, voorrang op de configuratie.

De wachtrij voor inkomende berichten is per peer. Groepspeers krijgen een hogere wachtrijlimiet (50 tegenover 20
voor directe peers), verwijderen bij een volle wachtrij berichten van de bot vóór berichten van mensen
en voegen reeksen normale groepsberichten samen tot één beurt met bronvermelding. Slash-
opdrachten worden één voor één uitgevoerd, onafhankelijk van een eventuele samenvoegbatch.

### Spraak (STT / TTS)

STT en TTS ondersteunen configuratie op twee niveaus met terugval op basis van prioriteit:

| Instelling | Pluginspecifiek                                          | Terugval van het framework    |
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

Stel `enabled: false` voor een van beide in om deze uit te schakelen. TTS-overschrijvingen op accountniveau gebruiken
dezelfde structuur als `messages.tts` en worden diepgaand samengevoegd over de TTS-configuratie van het kanaal/globale niveau.

STT-aanvragen verlopen standaard na 60 seconden. Pluginspecifieke STT gebruikt de
geselecteerde overschrijving voor `models.providers.<id>.timeoutSeconds`. Audio-STT van het framework
gebruikt `tools.media.audio.models[0].timeoutSeconds`, vervolgens
`tools.media.audio.timeoutSeconds` en daarna de overschrijving van de geselecteerde provider.

Inkomende QQ-spraakbijlagen worden aan agents beschikbaar gesteld als metagegevens van audiomedia,
terwijl onbewerkte spraakbestanden buiten de algemene `MediaPaths` blijven. `[[audio_as_voice]]`
in een antwoord met platte tekst synthetiseert TTS en verzendt een native QQ-spraakbericht wanneer
TTS is geconfigureerd.

Het gedrag voor uploads/transcodering van uitgaande audio kan ook worden aangepast met
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelindelingen

| Indeling                   | Beschrijving       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privéchat (C2C)    |
| `qqbot:group:GROUP_OPENID` | Groepschat         |
| `qqbot:channel:CHANNEL_ID` | Guild-kanaal       |

<Note>
Elke bot heeft een eigen verzameling gebruikers-OpenID's. Een OpenID dat Bot A heeft ontvangen, kan **niet** worden gebruikt om berichten via Bot B te verzenden.
</Note>

## Slash-opdrachten

Ingebouwde opdrachten die vóór de AI-wachtrij worden onderschept:

| Opdracht              | Auth      | Bereik       | Beschrijving                                                                   |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | alle         | Latentietest                                                                   |
| `/bot-help`          | —         | alle         | Alle opdrachten weergeven                                                      |
| `/bot-me`            | —         | alleen privé | De QQ-gebruikers-ID (openid) van de afzender weergeven voor het instellen van `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | alleen privé | De versie van het OpenClaw-framework en de pluginversie weergeven              |
| `/bot-upgrade`       | —         | alleen privé | De link naar de QQBot-upgradehandleiding weergeven                             |
| `/bot-approve`       | toelatingslijst | alleen privé | De configuratie voor goedkeuring van opdrachtuitvoering beheren (aan / uit / altijd / resetten / status) |
| `/bot-logs`          | toelatingslijst | alleen privé | Recente Gateway-logboeken als bestand exporteren                               |
| `/bot-clear-storage` | toelatingslijst | alleen privé | Downloads in de QQBot-mediamap uit de cache verwijderen                        |
| `/bot-streaming`     | toelatingslijst | alleen privé | Streamingantwoorden voor C2C in- of uitschakelen                               |
| `/bot-group-allways` | toelatingslijst | alleen privé | De standaardactiveringsmodus voor groepen omschakelen (vermelding vereist of altijd actief) |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Opdrachten met "Auth: toelatingslijst" vereisen bovendien dat de openid van de afzender in een
expliciete `allowFrom`-lijst zonder jokerteken staat (`groupAllowFrom` heeft voorrang voor
opdrachten die vanuit een groep worden gegeven, met `allowFrom` als terugvaloptie). Een jokerteken
`allowFrom: ["*"]` staat chatten toe, maar niet deze opdrachten. Als een van deze opdrachten
buiten een privéchat of zonder autorisatie wordt uitgevoerd, wordt een aanwijzing teruggegeven in plaats van
het bericht stilzwijgend te negeren.

`/bot-me`, `/bot-version` en `/bot-upgrade` zijn uitsluitend voor privéchats, maar vereisen
geen toelatingslijst — elke C2C-afzender kan ze uitvoeren.

Wanneer goedkeuringen voor opdrachtuitvoering van QQ Bot de standaardterugval naar dezelfde chat gebruiken, volgen klikken op de ingebouwde
goedkeuringsknoppen dezelfde expliciete toelatingslijst voor opdrachten zonder jokerteken. Configureer
`channels.qqbot.execApprovals.approvers` om uitsluitend toegang tot goedkeuringen te verlenen, zonder bredere toegang tot opdrachten.
Ingebouwde goedkeuringen voor opdrachtuitvoering zijn standaard
ingeschakeld.

## Media en opslag

- Inkomende, uitgaande en via de Gateway-bridge verwerkte media delen één hoofdmap voor payloads onder
  `~/.openclaw/media/qqbot` (waarbij `OPENCLAW_HOME` wordt gerespecteerd indien ingesteld), zodat uploads,
  downloads en transcoderingscaches binnen één beveiligde map blijven.
- De levering van rijke media aan C2C- en groepsdoelen verloopt via één `sendMedia`-
  pad. Lokale bestanden en buffers in het geheugen van 5&nbsp;MiB of groter gebruiken de
  eindpunten van QQ voor uploads in delen; kleinere payloads en bronnen via externe URL's/Base64 gebruiken
  de API voor uploads in één keer.
- Als een hot-upgrade de Gateway onderbreekt voordat het schrijven van
  `openclaw.json` is voltooid, herstelt de plugin bij de volgende start de laatst bekende `appId` / `clientSecret`
  voor dat account vanuit een interne momentopname (waarbij een opzettelijke configuratiewijziging nooit
  wordt overschreven), zodat de QR-code niet opnieuw hoeft te worden
  gescand.

## Problemen oplossen

- **Gateway start niet / geen inkomende berichten:** controleer of `appId` en
  `clientSecret` correct zijn en de bot is ingeschakeld op het QQ Open Platform.
  Een ontbrekende referentie geeft de melding "QQBot niet geconfigureerd (appId of
  clientSecret ontbreekt)".
- **Instellen met `--token-file` geeft nog steeds aan dat er niets is geconfigureerd:** `--token-file` stelt alleen
  het AppSecret in. `appId` moet nog steeds in de configuratie of `QQBOT_APP_ID` worden ingesteld.
- **Piekgewijze groepsantwoorden botsen:** wanneer de wachtrij van een peer volloopt, verwijdert de inkomende wachtrij
  berichten van bots vóór berichten van mensen en worden
  pieken van normale groepsberichten (geen opdrachten) samengevoegd tot één beurt met bronvermelding, zodat
  een stortvloed aan botberichten menselijke berichten niet zou moeten verdringen.
- **Proactieve berichten komen niet aan:** QQ kan door de bot geïnitieerde berichten blokkeren als
  de gebruiker niet recent interactie heeft gehad.
- **Spraak wordt niet getranscribeerd:** zorg dat STT is geconfigureerd en de provider
  bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
