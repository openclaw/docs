---
read_when:
    - Je wilt OpenClaw verbinden met QQ
    - Je moet de inloggegevens voor QQ Bot instellen
    - Je wilt ondersteuning voor groeps- of privéchats met QQ Bot
summary: QQ Bot-installatie, -configuratie en -gebruik
title: QQ-bot
x-i18n:
    generated_at: "2026-07-12T08:39:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot maakt via de officiële QQ Bot-API (WebSocket-Gateway) verbinding met OpenClaw.
Privéchats (C2C) en `@`-vermeldingen in groepen zijn de belangrijkste chattypen, met rijke
media (afbeeldingen, spraak, video en bestanden). Berichten in guild-kanalen worden alleen
ondersteund voor tekst en afbeeldingen via externe URL's; spraak, video, bestandsuploads en
lokale/Base64-afbeeldingen zijn niet beschikbaar in guild-kanalen. Reacties en threads worden
nergens ondersteund.

Status: officiële downloadbare Plugin.

## Installeren

```bash
openclaw plugins install @openclaw/qqbot
```

## Instellen

1. Ga naar het [QQ Open Platform](https://q.qq.com/) en scan de QR-code met QQ op uw
   telefoon om u te registreren of aan te melden.
2. Klik op **Create Bot** om een nieuwe QQ-bot te maken.
3. Zoek **AppID** en **AppSecret** op de instellingenpagina van de bot en kopieer ze.

<Note>
AppSecret wordt niet als platte tekst opgeslagen. Als u de pagina verlaat zonder het op te slaan, moet u een nieuw AppSecret genereren.
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

De wizard biedt ook koppeling via een QR-code als alternatief voor het handmatig
invoeren van AppID/AppSecret: scan de code met de telefoonapp die aan de beoogde QQ Bot
is gekoppeld om de koppeling te voltooien. OpenClaw slaat de geretourneerde
referenties op binnen het configuratiebereik van het account.

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

Omgevingsvariabelen voor het standaardaccount (alleen het account op het hoogste niveau):

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

AppSecret als SecretRef uit een omgevingsvariabele:

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
  in; `appId` moet al zijn ingesteld in de configuratie of via `QQBOT_APP_ID`.
- `clientSecret` accepteert een tekenreeks met platte tekst, een bestandspad
  (`clientSecretFile`) of een gestructureerd SecretRef-object.
- Verouderde markeringstekenreeksen `secretref:...` / `secretref-env:...` worden voor
  `clientSecret` geweigerd; gebruik in plaats daarvan een gestructureerd SecretRef-object.

### Toegangsbeleid

- `allowFrom` / `groupAllowFrom` bepalen wie in C2C- en groepscontexten met de bot
  kan chatten. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  bepalen de handhavingsmodus. `dmPolicy` is standaard `allowlist` zodra
  `allowFrom` een concrete vermelding (geen jokerteken) bevat, en anders `open`.
  `groupPolicy` is standaard `allowlist` zodra `groupAllowFrom` of
  `allowFrom` een concrete vermelding bevat, en anders `open`.
- Slash-opdrachten met "Authenticatie: toelatingslijst" vereisen altijd een expliciete
  vermelding zonder jokerteken in `allowFrom` (of `groupAllowFrom` voor aanroepen vanuit
  een groep), ongeacht `dmPolicy` / `groupPolicy` — zie [Slash-opdrachten](#slash-commands).

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

Elk account heeft een geïsoleerde WebSocket-verbinding, API-client en tokencache,
geïndexeerd op `appId`. Logregels worden voorzien van de id van het bijbehorende account,
zodat diagnostische gegevens gescheiden blijven wanneer u meerdere bots onder één Gateway uitvoert.

Voeg een tweede bot toe via de CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Groepschats

Groepsondersteuning gebruikt OpenID's van QQ-groepen, geen weergavenamen. Voeg de bot
toe aan een groep en vermeld deze vervolgens, of configureer de groep om zonder vermelding te werken.

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

`groups["*"]` stelt de standaardwaarden voor elke groep in; een concrete vermelding
`groups.GROUP_OPENID` overschrijft die standaardwaarden voor één groep. Groepsinstellingen:

| Veld                  | Standaardwaarde     | Beschrijving                                                                                              |
| --------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`              | Vereis een `@`-vermelding voordat de bot antwoordt.                                                       |
| `commandLevel`        | `all`               | Welke ingebouwde slash-opdrachten in de groep kunnen worden uitgevoerd (zie hieronder).                   |
| `ignoreOtherMentions` | `false`             | Negeer berichten die iemand anders vermelden, maar niet de bot.                                          |
| `historyLimit`        | `50`                | Recente berichten zonder vermelding die als context voor de volgende beurt met vermelding worden bewaard. `0` schakelt geschiedenis uit. |
| `tools`               | —                   | Sta hulpmiddelen toe of weiger ze voor de hele groep.                                                     |
| `toolsBySender`       | —                   | Overschrijvingen van hulpmiddelen per afzender; zie [Groepen](/nl/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | openid-voorvoegsel  | Gebruiksvriendelijk label dat in logboeken en groepscontext wordt gebruikt.                              |
| `prompt`              | ingebouwde standaardwaarde | Gedragsprompt per groep die aan de agentcontext wordt toegevoegd.                                  |

`commandLevel` accepteert:

| Niveau   | Gedrag                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Bestaande ingebouwde opdrachten blijven beschikbaar. Sommige blijven verborgen in menu's, maar geautoriseerde gebruikers kunnen ze nog steeds in de groep uitvoeren. |
| `safety` | `/help`, `/btw` en `/stop` blijven zichtbaar in de groep; gevoelige opdrachten (`/config`, `/tools`, `/bash`, enzovoort) moeten in een privéchat worden uitgevoerd. |
| `strict` | Alleen besturingselementen voor groepssessies die nodig zijn voor strikte werking zijn toegestaan. `/stop` blijft werken, zodat een geautoriseerde afzender een actieve uitvoering kan onderbreken. |

Oude QQBot-vermeldingen voor `toolPolicy` zijn buiten gebruik gesteld. Voer `openclaw doctor --fix` uit om ze naar `tools` te migreren.

De activeringsmodi zijn `mention` en `always`. `requireMention: true` komt overeen met
`mention`; `requireMention: false` komt overeen met `always`. Een activeringsovername
op sessieniveau heeft, indien aanwezig, voorrang op de configuratie.

De wachtrij voor inkomende berichten is per gesprekspartner. Groepsgesprekspartners krijgen
een hogere wachtrijlimiet (50 tegenover 20 voor rechtstreekse gesprekspartners), verwijderen
bij een volle wachtrij berichten van de bot vóór die van mensen en voegen reeksen normale
groepsberichten samen tot één beurt met bronvermelding. Slash-opdrachten worden één voor één
uitgevoerd, onafhankelijk van een eventuele samenvoegbatch.

### Spraak (STT / TTS)

STT en TTS ondersteunen configuratie op twee niveaus met terugval volgens prioriteit:

| Instelling | Pluginspecifiek                                          | Terugval van het framework     |
| ---------- | -------------------------------------------------------- | ------------------------------ |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]`  |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                 |

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

Stel bij een van beide `enabled: false` in om deze uit te schakelen. TTS-overschrijvingen
op accountniveau gebruiken dezelfde structuur als `messages.tts` en worden diepgaand
samengevoegd boven op de TTS-configuratie van het kanaal en de globale configuratie.

STT-aanvragen verlopen standaard na 60 seconden. Pluginspecifieke STT gebruikt de
geselecteerde overschrijving `models.providers.<id>.timeoutSeconds`. STT voor audio
van het framework gebruikt `tools.media.audio.models[0].timeoutSeconds`, vervolgens
`tools.media.audio.timeoutSeconds` en daarna de geselecteerde provideroverschrijving.

Inkomende QQ-spraakbijlagen worden aan agents beschikbaar gesteld als metadata voor
audiomedia, terwijl onbewerkte spraakbestanden buiten de algemene `MediaPaths` blijven.
`[[audio_as_voice]]` in een antwoord met platte tekst genereert TTS en verzendt een
native QQ-spraakbericht wanneer TTS is geconfigureerd.

Het gedrag voor het uploaden en transcoderen van uitgaande audio kan ook worden
afgestemd met `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Doelindelingen

| Indeling                   | Beschrijving     |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | Privéchat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Groepschat       |
| `qqbot:channel:CHANNEL_ID` | Guild-kanaal     |

<Note>
Elke bot heeft een eigen verzameling OpenID's van gebruikers. Een OpenID dat door Bot A is ontvangen, kan **niet** worden gebruikt om berichten via Bot B te verzenden.
</Note>

## Slash-opdrachten

Ingebouwde opdrachten die vóór de AI-wachtrij worden onderschept:

| Opdracht             | Authenticatie     | Bereik       | Beschrijving                                                                                  |
| -------------------- | ----------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                 | overal       | Latentietest                                                                                  |
| `/bot-help`          | —                 | overal       | Alle opdrachten weergeven                                                                    |
| `/bot-me`            | —                 | alleen privé | De QQ-gebruikers-id (openid) van de afzender weergeven voor het instellen van `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                 | alleen privé | De versie van het OpenClaw-framework en de Pluginversie weergeven                             |
| `/bot-upgrade`       | —                 | alleen privé | De koppeling naar de QQBot-upgradehandleiding weergeven                                       |
| `/bot-approve`       | toelatingslijst   | alleen privé | De configuratie voor goedkeuring van opdrachtuitvoering beheren (aan / uit / altijd / opnieuw instellen / status) |
| `/bot-logs`          | toelatingslijst   | alleen privé | Recente Gateway-logboeken als bestand exporteren                                              |
| `/bot-clear-storage` | toelatingslijst   | alleen privé | Gecachte downloads onder de QQBot-mediamap verwijderen                                        |
| `/bot-streaming`     | toelatingslijst   | alleen privé | Streamingantwoorden in C2C in- of uitschakelen                                                |
| `/bot-group-allways` | toelatingslijst   | alleen privé | De standaardactiveringsmodus voor groepen omschakelen (vermelding vereist tegenover altijd actief) |

Voeg `?` toe aan een opdracht voor gebruikshulp (bijvoorbeeld `/bot-upgrade ?`).

Opdrachten met "Authenticatie: toelatingslijst" vereisen bovendien dat de openid van de
afzender voorkomt in een expliciete `allowFrom`-lijst zonder jokerteken (`groupAllowFrom`
heeft voorrang bij opdrachten vanuit groepen, met terugval naar `allowFrom`). Een jokerteken
`allowFrom: ["*"]` staat chatten toe, maar niet deze opdrachten. Als een van deze opdrachten
buiten een privéchat of zonder autorisatie wordt uitgevoerd, wordt een aanwijzing teruggestuurd
in plaats van het bericht stilzwijgend te negeren.

`/bot-me`, `/bot-version` en `/bot-upgrade` zijn alleen beschikbaar in privéchats, maar
vereisen de toelatingslijst niet — elke C2C-afzender kan ze uitvoeren.

Wanneer uitvoeringsgoedkeuringen van QQ Bot de standaardterugval op dezelfde chat gebruiken, volgen klikken op
ingebouwde goedkeuringsknoppen dezelfde expliciete opdrachttoelatingslijst zonder jokertekens. Configureer
`channels.qqbot.execApprovals.approvers` om uitsluitend toegang voor goedkeuringen te verlenen zonder
bredere toegang tot opdrachten. Ingebouwde uitvoeringsgoedkeuringen zijn standaard
ingeschakeld.

## Media en opslag

- Inkomende en uitgaande media en media via de Gateway-bridge delen één hoofdmap voor nettoladingen onder
  `~/.openclaw/media/qqbot` (waarbij `OPENCLAW_HOME` wordt gerespecteerd indien ingesteld), zodat uploads,
  downloads en transcoderingscaches binnen één beveiligde map blijven.
- De levering van rijke media aan C2C- en groepsdoelen verloopt via één `sendMedia`-
  pad. Lokale bestanden en buffers in het geheugen van 5&nbsp;MiB of meer gebruiken de
  endpoints van QQ voor uploads in delen; kleinere nettoladingen en bronnen met externe URL's/Base64 gebruiken
  de API voor uploads in één keer.
- Als een directe upgrade de Gateway onderbreekt voordat het schrijven van
  `openclaw.json` is voltooid, herstelt de Plugin bij de volgende start de laatst bekende `appId` / `clientSecret`
  voor dat account uit een interne momentopname (zonder ooit
  een opzettelijke configuratiewijziging te overschrijven), zodat de QR-code niet opnieuw hoeft te worden
  gescand.

## Probleemoplossing

- **Gateway start niet / geen inkomende berichten:** controleer of `appId` en
  `clientSecret` correct zijn en of de bot is ingeschakeld op het QQ Open Platform.
  Ontbrekende aanmeldgegevens worden weergegeven als "QQBot niet geconfigureerd (appId of
  clientSecret ontbreekt)".
- **Installatie met `--token-file` wordt nog steeds als niet-geconfigureerd weergegeven:** `--token-file` stelt alleen
  het AppSecret in. `appId` moet nog steeds worden ingesteld in de configuratie of via `QQBOT_APP_ID`.
- **Piekgewijze groepsantwoorden botsen:** wanneer de wachtrij van een gesprekspartner vol raakt, verwijdert de inkomende wachtrij
  door bots geschreven berichten vóór menselijke berichten en voegt deze
  pieken van normale groepsberichten (geen opdrachten) samen tot één beurt met bronvermelding, zodat
  een stortvloed aan botberichten menselijke berichten niet zou moeten verdringen.
- **Proactieve berichten komen niet aan:** QQ kan door bots geïnitieerde berichten blokkeren als
  de gebruiker recent geen interactie heeft gehad.
- **Spraak wordt niet getranscribeerd:** zorg dat STT is geconfigureerd en de provider
  bereikbaar is.

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
