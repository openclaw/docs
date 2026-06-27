---
read_when:
    - Je wilt OpenClaw verbinden met IRC-kanalen of DM's
    - Je configureert IRC-toestemmingslijsten, groepsbeleid of vermeldingsafscherming
summary: IRC-pluginconfiguratie, toegangsbeheer en probleemoplossing
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Gebruik IRC wanneer je OpenClaw in klassieke kanalen (`#room`) en directe berichten wilt gebruiken.
Installeer de officiële IRC-Plugin en configureer deze daarna onder `channels.irc`.

## Snelstart

1. Installeer de Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Schakel de IRC-configuratie in `~/.openclaw/openclaw.json` in.
3. Stel minimaal het volgende in:

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

Geef de voorkeur aan een private IRC-server voor botcoördinatie. Als je bewust een openbaar IRC-netwerk gebruikt, zijn veelgebruikte keuzes onder meer Libera.Chat, OFTC en Snoonet. Vermijd voorspelbare openbare kanalen voor bot- of zwerm-backchannelverkeer.

4. Start/herstart gateway:

```bash
openclaw gateway run
```

## Beveiligingsstandaarden

- IRC gebruikt raw TCP/TLS-sockets buiten de door OpenClaw-operators beheerde forward-proxyrouting. Stel in implementaties waarin alle uitgaande verbindingen via die forward proxy moeten lopen `channels.irc.enabled=false` in, tenzij directe uitgaande IRC-verbindingen expliciet zijn goedgekeurd.
- `channels.irc.dmPolicy` staat standaard op `"pairing"`.
- `channels.irc.groupPolicy` staat standaard op `"allowlist"`.
- Stel bij `groupPolicy="allowlist"` `channels.irc.groups` in om toegestane kanalen te definiëren.
- Gebruik TLS (`channels.irc.tls=true`), tenzij je bewust transport in platte tekst accepteert.

## Toegangsbeheer

Er zijn twee afzonderlijke "poorten" voor IRC-kanalen:

1. **Kanaaltoegang** (`groupPolicy` + `groups`): of de bot überhaupt berichten uit een kanaal accepteert.
2. **Afzendertoegang** (`groupAllowFrom` / per-kanaal `groups["#channel"].allowFrom`): wie de bot binnen dat kanaal mag triggeren.

Configuratiesleutels:

- DM-allowlist (DM-afzendertoegang): `channels.irc.allowFrom`
- Groepsafzender-allowlist (kanaalafzendertoegang): `channels.irc.groupAllowFrom`
- Regels per kanaal (kanaal + afzender + vermeldingsregels): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` staat niet-geconfigureerde kanalen toe (**nog steeds standaard mention-gated**)

Allowlist-vermeldingen moeten stabiele afzenderidentiteiten gebruiken (`nick!user@host`).
Bare nick-matching is veranderlijk en alleen ingeschakeld wanneer `channels.irc.dangerouslyAllowNameMatching: true`.

### Veelvoorkomende valkuil: `allowFrom` is voor DM's, niet voor kanalen

Als je logs ziet zoals:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...betekent dit dat de afzender niet was toegestaan voor **groeps-/kanaal**berichten. Los dit op door ofwel:

- `channels.irc.groupAllowFrom` in te stellen (globaal voor alle kanalen), of
- afzender-allowlists per kanaal in te stellen: `channels.irc.groups["#channel"].allowFrom`

Voorbeeld (iedereen in `#tuirc-dev` mag met de bot praten):

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

## Antwoordtriggering (vermeldingen)

Zelfs als een kanaal is toegestaan (via `groupPolicy` + `groups`) en de afzender is toegestaan, gebruikt OpenClaw standaard **mention-gating** in groepscontexten.

Dat betekent dat je logs kunt zien zoals `drop channel … (missing-mention)`, tenzij het bericht een vermeldingspatroon bevat dat overeenkomt met de bot.

Schakel mention-gating voor dat kanaal uit om de bot in een IRC-kanaal te laten antwoorden **zonder dat een vermelding nodig is**:

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

Of om **alle** IRC-kanalen toe te staan (geen allowlist per kanaal) en toch zonder vermeldingen te antwoorden:

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
Beperk de tools voor dat kanaal om het risico te verkleinen.

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
- Het eerste overeenkomende afzenderbeleid wint; `"*"` is de joker-fallback.

Zie voor meer over groepstoegang versus mention-gating (en hoe ze samenwerken): [/channels/groups](/nl/channels/groups).

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

Optionele eenmalige registratie bij verbinden:

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
- `IRC_CHANNELS` (komma-gescheiden)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).

## Probleemoplossing

- Als de bot verbinding maakt maar nooit in kanalen antwoordt, controleer dan `channels.irc.groups` **en** of mention-gating berichten laat vallen (`missing-mention`). Als je wilt dat hij zonder pings antwoordt, stel dan `requireMention:false` in voor het kanaal.
- Als inloggen mislukt, controleer dan de beschikbaarheid van de nick en het serverwachtwoord.
- Als TLS op een aangepast netwerk mislukt, controleer dan host/poort en de certificaatconfiguratie.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) — DM-authenticatie en pairing-flow
- [Groepen](/nl/channels/groups) — groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
