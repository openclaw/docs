---
read_when:
    - Je wilt OpenClaw verbinden met IRC-kanalen of DM's
    - Je configureert IRC-toelatingslijsten, groepsbeleid of toegangscontrole voor vermeldingen
summary: IRC-Plugin instellen, toegangscontroles en probleemoplossing
title: IRC
x-i18n:
    generated_at: "2026-04-29T22:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 16
---

Gebruik IRC wanneer je OpenClaw in klassieke kanalen (`#room`) en directe berichten wilt gebruiken.
IRC wordt geleverd als gebundelde plugin, maar wordt geconfigureerd in de hoofdconfiguratie onder `channels.irc`.

## Snelstart

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

Gebruik bij voorkeur een private IRC-server voor botcoördinatie. Als je bewust een openbaar IRC-netwerk gebruikt, zijn veelgebruikte opties Libera.Chat, OFTC en Snoonet. Vermijd voorspelbare openbare kanalen voor bot- of swarm-backchannelverkeer.

3. Start/herstart de gateway:

```bash
openclaw gateway run
```

## Beveiligingsstandaarden

- `channels.irc.dmPolicy` is standaard `"pairing"`.
- `channels.irc.groupPolicy` is standaard `"allowlist"`.
- Stel met `groupPolicy="allowlist"` `channels.irc.groups` in om toegestane kanalen te definiëren.
- Gebruik TLS (`channels.irc.tls=true`), tenzij je bewust plaintext-transport accepteert.

## Toegangscontrole

Er zijn twee afzonderlijke “poorten” voor IRC-kanalen:

1. **Kanaaltoegang** (`groupPolicy` + `groups`): of de bot überhaupt berichten uit een kanaal accepteert.
2. **Afzendertoegang** (`groupAllowFrom` / per kanaal `groups["#channel"].allowFrom`): wie de bot binnen dat kanaal mag activeren.

Configuratiesleutels:

- DM-allowlist (DM-afzendertoegang): `channels.irc.allowFrom`
- Groepsafzender-allowlist (kanaalafzendertoegang): `channels.irc.groupAllowFrom`
- Regels per kanaal (kanaal + afzender + vermeldingsregels): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` staat niet-geconfigureerde kanalen toe (**nog steeds standaard achter vermeldingen afgeschermd**)

Allowlist-vermeldingen moeten stabiele afzenderidentiteiten gebruiken (`nick!user@host`).
Kale nick-matching is wijzigbaar en alleen ingeschakeld wanneer `channels.irc.dangerouslyAllowNameMatching: true`.

### Veelvoorkomende valkuil: `allowFrom` is voor DM’s, niet voor kanalen

Als je logs ziet zoals:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…betekent dit dat de afzender niet was toegestaan voor **groeps-/kanaalberichten**. Los dit op door:

- `channels.irc.groupAllowFrom` in te stellen (globaal voor alle kanalen), of
- afzender-allowlists per kanaal in te stellen: `channels.irc.groups["#channel"].allowFrom`

Voorbeeld (iedereen in `#tuirc-dev` toestaan om met de bot te praten):

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

Zelfs als een kanaal is toegestaan (via `groupPolicy` + `groups`) en de afzender is toegestaan, gebruikt OpenClaw standaard **vermeldingsafscherming** in groepscontexten.

Dat betekent dat je logs kunt zien zoals `drop channel … (missing-mention)`, tenzij het bericht een vermeldingspatroon bevat dat overeenkomt met de bot.

Schakel vermeldingsafscherming voor dat kanaal uit om de bot in een IRC-kanaal te laten antwoorden **zonder dat een vermelding nodig is**:

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

Of om **alle** IRC-kanalen toe te staan (geen allowlist per kanaal) en nog steeds zonder vermeldingen te antwoorden:

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
Beperk de tools voor dat kanaal om het risico te verlagen.

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

### Verschillende tools per afzender (eigenaar krijgt meer rechten)

Gebruik `toolsBySender` om een strenger beleid op `"*"` toe te passen en een soepeler beleid op je nick:

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
- Het eerste overeenkomende afzenderbeleid wint; `"*"` is de wildcard-fallback.

Zie voor meer over groepstoegang versus vermeldingsafscherming (en hoe ze samenwerken): [/channels/groups](/nl/channels/groups).

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

Optionele eenmalige registratie bij het verbinden:

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
- `IRC_CHANNELS` (kommagescheiden)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kan niet vanuit een workspace-`.env` worden ingesteld; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Probleemoplossing

- Als de bot verbinding maakt maar nooit antwoordt in kanalen, controleer dan `channels.irc.groups` **en** of vermeldingsafscherming berichten dropt (`missing-mention`). Als je wilt dat hij zonder pings antwoordt, stel dan `requireMention:false` in voor het kanaal.
- Als inloggen mislukt, controleer dan de beschikbaarheid van de nick en het serverwachtwoord.
- Als TLS op een aangepast netwerk mislukt, controleer dan host/poort en de certificaatconfiguratie.

## Gerelateerd

- [Kanaaloverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermeldingsafscherming
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
