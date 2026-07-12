---
read_when:
    - Je wilt OpenClaw verbinden met IRC-kanalen of privéberichten
    - U configureert IRC-toelatingslijsten, groepsbeleid of vermeldingsbeperkingen
summary: Installatie, toegangsbeheer en probleemoplossing voor de IRC-plugin
title: IRC
x-i18n:
    generated_at: "2026-07-12T08:36:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Gebruik IRC wanneer je OpenClaw wilt gebruiken in klassieke kanalen (`#room`) en directe berichten.
Installeer de officiële IRC-Plugin en configureer deze vervolgens onder `channels.irc`.

## Snel aan de slag

1. Installeer de Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Stel in `~/.openclaw/openclaw.json` ten minste de host, nick en de kanalen om deel te nemen in:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Start of herstart de Gateway:

```bash
openclaw gateway run
```

Gebruik bij voorkeur een privé-IRC-server voor botcoördinatie. Als je bewust een openbaar IRC-netwerk gebruikt, zijn Libera.Chat, OFTC en Snoonet gangbare keuzes. Vermijd voorspelbare openbare kanalen voor achterliggend verkeer van bots of zwermen.

## Verbindingsinstellingen

| Sleutel                       | Standaard                     | Opmerkingen                                                        |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `host`                        | geen (vereist)                | Hostnaam van de IRC-server                                         |
| `port`                        | `6697` met TLS, `6667` zonder | 1-65535                                                            |
| `tls`                         | `true`                        | Stel alleen `false` in als bewust platte tekst wordt gebruikt      |
| `nick`                        | geen (vereist)                | Nick van de bot                                                    |
| `username`                    | nick, anders `openclaw`       | IRC-gebruikersnaam                                                 |
| `realname`                    | `OpenClaw`                    | Realname-/GECOS-veld                                                |
| `password` / `passwordFile`   | geen                          | Serverwachtwoord; bestand moet een regulier bestand zijn           |
| `channels`                    | geen                          | Kanalen om aan deel te nemen (`["#openclaw"]`)                     |
| `accounts` / `defaultAccount` | geen                          | Configuratie met meerdere accounts; omgevingsvariabelen vullen alleen het standaardaccount |

## Standaardbeveiliging

- IRC gebruikt onbewerkte TCP-/TLS-sockets buiten de door de OpenClaw-beheerder beheerde routering via een forward proxy. Stel in implementaties waarin al het uitgaande verkeer via die forward proxy moet lopen `channels.irc.enabled=false` in, tenzij direct uitgaand IRC-verkeer expliciet is goedgekeurd.
- `channels.irc.dmPolicy` is standaard `"pairing"`: onbekende afzenders van directe berichten ontvangen een koppelingscode die je goedkeurt met `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` is standaard `"allowlist"`.
- Stel bij `groupPolicy="allowlist"` `channels.irc.groups` in om toegestane kanalen te definiëren.
- Gebruik TLS (`channels.irc.tls=true`), tenzij je bewust transport in platte tekst accepteert.

## Toegangsbeheer

Er zijn twee afzonderlijke 'poorten' voor IRC-kanalen:

1. **Kanaaltoegang** (`groupPolicy` + `groups`): of de bot überhaupt berichten uit een kanaal accepteert.
2. **Afzendertoegang** (`groupAllowFrom` / `groups["#channel"].allowFrom` per kanaal): wie de bot binnen dat kanaal mag activeren.

Configuratiesleutels:

- Toelatingslijst voor directe berichten (afzendertoegang voor directe berichten): `channels.irc.allowFrom`
- Toelatingslijst voor groepsafzenders (afzendertoegang voor kanalen): `channels.irc.groupAllowFrom`
- Instellingen per kanaal (regels voor kanaal, afzender en vermeldingen): `channels.irc.groups["#channel"]` met `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` en `systemPrompt`
- `channels.irc.groupPolicy="open"` staat niet-geconfigureerde kanalen toe (**vermeldingen blijven standaard vereist**)

Vermeldingen in de toelatingslijst moeten stabiele afzenderidentiteiten gebruiken (`nick!user@host`).
Vergelijking op alleen de nick is veranderlijk en wordt alleen ingeschakeld wanneer `channels.irc.dangerouslyAllowNameMatching: true`.

### Veelvoorkomende valkuil: `allowFrom` is voor directe berichten, niet voor kanalen

Als je logboeken ziet zoals:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...betekent dit dat de afzender niet was toegestaan voor **groeps-/kanaalberichten**. Los dit op door:

- `channels.irc.groupAllowFrom` in te stellen (globaal voor alle kanalen), of
- toelatingslijsten voor afzenders per kanaal in te stellen: `channels.irc.groups["#channel"].allowFrom`

Voorbeeld (sta iedereen in `#openclaw` toe om met de bot te praten):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Antwoorden activeren (vermeldingen)

Zelfs als een kanaal is toegestaan (via `groupPolicy` + `groups`) en de afzender is toegestaan, vereist OpenClaw in groepscontexten standaard een **vermelding**. De bot geldt als vermeld wanneer het bericht de verbonden botnick bevat of overeenkomt met je geconfigureerde vermeldingspatronen.

Dit betekent dat je logboeken zoals `drop channel … (missing-mention)` kunt zien, tenzij het bericht een vermeldingspatroon bevat dat met de bot overeenkomt.

Schakel de vermeldingsvereiste voor dat kanaal uit om de bot in een IRC-kanaal te laten antwoorden **zonder dat een vermelding nodig is**:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Of om **alle** IRC-kanalen toe te staan (zonder toelatingslijst per kanaal) en nog steeds zonder vermeldingen te antwoorden:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Beveiligingsopmerking (aanbevolen voor openbare kanalen)

Als je `allowFrom: ["*"]` in een openbaar kanaal toestaat, kan iedereen de bot een prompt geven.
Beperk de hulpmiddelen voor dat kanaal om het risico te verminderen.

### Dezelfde hulpmiddelen voor iedereen in het kanaal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Verschillende hulpmiddelen per afzender (de eigenaar krijgt meer bevoegdheden)

Gebruik `toolsBySender` om een strenger beleid toe te passen op `"*"` en een soepeler beleid op je nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Opmerkingen:

- Sleutels voor `toolsBySender` moeten expliciete voorvoegsels gebruiken (`channel:`, `id:`, `e164:`, `username:`, `name:`). Gebruik voor IRC `id:` met de identiteitswaarde van de afzender: `id:alice` of `id:alice!~alice@203.0.113.7` voor een strengere overeenkomst.
- Verouderde sleutels zonder voorvoegsel worden nog steeds geaccepteerd, worden alleen als `id:` vergeleken en geven een verouderingswaarschuwing.
- Het beleid van de eerste overeenkomende afzender wordt toegepast; `"*"` is de algemene terugvaloptie.

Zie voor meer informatie over groepstoegang versus de vermeldingsvereiste (en hoe deze op elkaar inwerken): [/channels/groups](/nl/channels/groups).

## NickServ

Om je na het verbinden bij NickServ te identificeren:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

NickServ-identificatie wordt standaard uitgevoerd wanneer een wachtwoord is ingesteld (`enabled` hoeft alleen `false` te zijn om dit uit te schakelen). `service` is standaard `NickServ`; `passwordFile` is een alternatief voor een inline `password`.

Optionele eenmalige registratie bij het verbinden (`register: true` vereist `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Schakel `register` uit nadat de nick is geregistreerd om herhaalde REGISTER-pogingen te voorkomen.

## Omgevingsvariabelen

Het standaardaccount ondersteunt:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (door komma's gescheiden)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kan niet vanuit een `.env`-bestand in een werkruimte worden ingesteld; zie [`.env`-bestanden van werkruimten](/nl/gateway/security).

## Probleemoplossing

- Als de bot verbinding maakt maar nooit in kanalen antwoordt, controleer dan `channels.irc.groups` **en** of berichten door de vermeldingsvereiste worden geweigerd (`missing-mention`). Stel voor het kanaal `requireMention:false` in als je wilt dat de bot zonder pings antwoordt.
- Als aanmelden mislukt, controleer dan de beschikbaarheid van de nick en het serverwachtwoord.
- Als TLS op een aangepast netwerk mislukt, controleer dan de host/poort en de certificaatconfiguratie.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — authenticatie voor directe berichten en het koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en de vermeldingsvereiste
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiliging aanscherpen
