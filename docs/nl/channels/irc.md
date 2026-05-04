---
read_when:
    - Je wilt OpenClaw verbinden met IRC-kanalen of privéberichten
    - Je configureert IRC-toelatingslijsten, groepsbeleid of toegangscontrole voor vermeldingen
summary: IRC Plugin-installatie, toegangscontroles en probleemoplossing
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Gebruik IRC wanneer je OpenClaw in klassieke kanalen (`#room`) en directe berichten wilt gebruiken.
IRC wordt meegeleverd als gebundelde plugin, maar wordt geconfigureerd in de hoofdconfiguratie onder `channels.irc`.

## Snel aan de slag

1. Schakel IRC-configuratie in `~/.openclaw/openclaw.json` in.
2. Stel ten minste het volgende in:

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

Gebruik bij voorkeur een privé-IRC-server voor botcoördinatie. Als je bewust een openbaar IRC-netwerk gebruikt, zijn veelgebruikte keuzes Libera.Chat, OFTC en Snoonet. Vermijd voorspelbare openbare kanalen voor bot- of zwerm-backchannelverkeer.

3. Start/herstart de Gateway:

```bash
openclaw gateway run
```

## Beveiligingsstandaarden

- IRC gebruikt ruwe TCP/TLS-sockets buiten door OpenClaw-operators beheerde forward-proxy-routering. In implementaties waarin alle uitgaande verbindingen via die forward proxy moeten lopen, stel je `channels.irc.enabled=false` in tenzij directe uitgaande IRC-verbindingen expliciet zijn goedgekeurd.
- `channels.irc.dmPolicy` gebruikt standaard `"pairing"`.
- `channels.irc.groupPolicy` gebruikt standaard `"allowlist"`.
- Met `groupPolicy="allowlist"` stel je `channels.irc.groups` in om toegestane kanalen te definiëren.
- Gebruik TLS (`channels.irc.tls=true`), tenzij je bewust transport in platte tekst accepteert.

## Toegangsbeheer

Er zijn twee afzonderlijke “poorten” voor IRC-kanalen:

1. **Kanaaltoegang** (`groupPolicy` + `groups`): of de bot überhaupt berichten uit een kanaal accepteert.
2. **Afzendertoegang** (`groupAllowFrom` / per-kanaal `groups["#channel"].allowFrom`): wie de bot binnen dat kanaal mag activeren.

Configuratiesleutels:

- DM-toestaanlijst (DM-afzendertoegang): `channels.irc.allowFrom`
- Groepsafzender-toestaanlijst (kanaalafzendertoegang): `channels.irc.groupAllowFrom`
- Per-kanaal controles (kanaal + afzender + vermeldingsregels): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` staat niet-geconfigureerde kanalen toe (**nog steeds standaard achter vermeldingspoort**)

Toestaanlijstvermeldingen moeten stabiele afzenderidentiteiten gebruiken (`nick!user@host`).
Matchen op alleen nick is veranderlijk en alleen ingeschakeld wanneer `channels.irc.dangerouslyAllowNameMatching: true`.

### Veelvoorkomende valkuil: `allowFrom` is voor DM's, niet voor kanalen

Als je logs ziet zoals:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…betekent dit dat de afzender niet was toegestaan voor **groeps-/kanaalberichten**. Los dit op door ofwel:

- `channels.irc.groupAllowFrom` in te stellen (globaal voor alle kanalen), of
- per-kanaal afzender-toestaanlijsten in te stellen: `channels.irc.groups["#channel"].allowFrom`

Voorbeeld (iedereen in `#tuirc-dev` toestaan met de bot te praten):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Antwoorden activeren (vermeldingen)

Zelfs als een kanaal is toegestaan (via `groupPolicy` + `groups`) en de afzender is toegestaan, gebruikt OpenClaw in groepscontexten standaard **vermeldingspoorten**.

Dat betekent dat je logs kunt zien zoals `drop channel … (missing-mention)`, tenzij het bericht een vermeldingspatroon bevat dat overeenkomt met de bot.

Om de bot in een IRC-kanaal te laten antwoorden **zonder een vermelding nodig te hebben**, schakel je vermeldingspoorten uit voor dat kanaal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Of om **alle** IRC-kanalen toe te staan (geen per-kanaal toestaanlijst) en toch zonder vermeldingen te antwoorden:

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

Als je `allowFrom: ["*"]` in een openbaar kanaal toestaat, kan iedereen de bot prompten.
Beperk de tools voor dat kanaal om risico te verminderen.

### Dezelfde tools voor iedereen in het kanaal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### Verschillende tools per afzender (eigenaar krijgt meer macht)

Gebruik `toolsBySender` om een strenger beleid toe te passen op `"*"` en een soepeler beleid op je nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- `toolsBySender`-sleutels moeten `id:` gebruiken voor IRC-afzenderidentiteitswaarden:
  `id:eigen` of `id:eigen!~eigen@174.127.248.171` voor sterkere matching.
- Verouderde sleutels zonder prefix worden nog steeds geaccepteerd en alleen als `id:` gematcht.
- Het eerste overeenkomende afzenderbeleid wint; `"*"` is de wildcard-terugval.

Zie voor meer over groepstoegang versus vermeldingspoorten (en hoe ze op elkaar inwerken): [/channels/groups](/nl/channels/groups).

## NickServ

Om je na verbinding bij NickServ te identificeren:

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

Optionele eenmalige registratie bij verbinding:

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

Standaardaccount ondersteunt:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (kommagescheiden)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kan niet worden ingesteld vanuit een werkruimte-`.env`; zie [Werkruimte-`.env`-bestanden](/nl/gateway/security).

## Probleemoplossing

- Als de bot verbinding maakt maar nooit in kanalen antwoordt, controleer dan `channels.irc.groups` **en** of vermeldingspoorten berichten laten vallen (`missing-mention`). Als je wilt dat de bot zonder pings antwoordt, stel dan `requireMention:false` in voor het kanaal.
- Als inloggen mislukt, controleer dan de beschikbaarheid van de nick en het serverwachtwoord.
- Als TLS mislukt op een aangepast netwerk, controleer dan host/poort en certificaatconfiguratie.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschat en vermeldingspoorten
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
