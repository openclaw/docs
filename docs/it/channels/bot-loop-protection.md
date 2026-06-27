---
read_when:
    - Configurazione dei messaggi di canale creati dai bot
    - Regolazione della protezione dei loop tra bot
sidebarTitle: Bot loop protection
summary: Impostazioni predefinite della protezione dal loop tra bot e override dei canali
title: Protezione dai loop dei bot
x-i18n:
    generated_at: "2026-06-27T17:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Protezione dai loop tra bot

OpenClaw può accettare messaggi scritti da altri bot sui canali che supportano `allowBots`.
Quando quel percorso è abilitato, la protezione dai loop per coppia impedisce a due identità bot di
rispondersi tra loro all'infinito.

La protezione è applicata dal runner core delle risposte in ingresso. Ogni canale supportato
mappa il proprio evento in ingresso in fatti generici: account o ambito, ID conversazione,
ID bot del mittente e ID bot del destinatario. Il core quindi traccia la coppia di partecipanti in entrambe
le direzioni, applica un budget a finestra mobile e sopprime la coppia durante un
periodo di cooldown dopo il superamento del budget.

## Valori predefiniti

La protezione dai loop per coppia è attiva quando un canale lascia arrivare al
dispatch messaggi creati da bot. I valori predefiniti integrati sono:

- `maxEventsPerWindow: 20` - una coppia di bot può scambiare 20 eventi entro la finestra
- `windowSeconds: 60` - durata della finestra mobile
- `cooldownSeconds: 60` - tempo di soppressione dopo che la coppia supera il budget

La protezione non influisce sui normali messaggi creati da esseri umani, sulle distribuzioni con un solo bot,
sul filtraggio dei messaggi propri o sulle risposte bot una tantum che restano sotto il budget.

## Configurare i valori predefiniti condivisi

Imposta `channels.defaults.botLoopProtection` una sola volta per dare a ogni canale supportato
la stessa base. Gli override di canale e account possono comunque regolare le singole
superfici.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Imposta `enabled: false` solo quando la policy del tuo canale consente intenzionalmente
conversazioni bot-a-bot senza soppressione automatica.

## Override per canale o account

I canali supportati applicano la propria configurazione sopra il valore predefinito condiviso. La precedenza è:

- `channels.<channel>.<room-or-space>.botLoopProtection`, quando il canale supporta override per conversazione
- `channels.<channel>.accounts.<account>.botLoopProtection`, quando il canale supporta account
- `channels.<channel>.botLoopProtection`, quando il canale supporta valori predefiniti di livello superiore
- `channels.defaults.botLoopProtection`
- valori predefiniti integrati

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## Supporto dei canali

- Discord: fatti nativi `author.bot`, indicizzati per account Discord, canale e coppia di bot.
- Slack: fatti nativi `bot_id` per i messaggi creati da bot accettati, indicizzati per account Slack, canale e coppia di bot.
- Matrix: account bot Matrix configurati, indicizzati per account Matrix, stanza e coppia di bot configurata.
- Google Chat: fatti nativi `sender.type=BOT` per i messaggi creati da bot accettati, indicizzati per account, spazio e coppia di bot.

I canali che non espongono un'identità bot in ingresso affidabile continuano a usare i loro
normali filtri per messaggi propri e policy di accesso. Non dovrebbero aderire a questa
protezione finché non possono identificare entrambi i partecipanti nella coppia di bot.

Consulta [runtime SDK](/it/plugins/sdk-runtime#reusable-runtime-utilities) per i dettagli di implementazione dei Plugin.
