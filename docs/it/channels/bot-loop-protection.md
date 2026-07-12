---
read_when:
    - Configurazione dei messaggi del canale creati dai bot
    - Ottimizzazione della protezione dai loop tra bot
sidebarTitle: Bot loop protection
summary: Valori predefiniti per la protezione dai cicli tra bot e override dei canali
title: Protezione dai loop dei bot
x-i18n:
    generated_at: "2026-07-12T06:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw può accettare messaggi scritti da altri bot nei canali che supportano `allowBots`. Quando questo percorso è abilitato, la protezione dai cicli tra coppie impedisce a due identità bot di rispondersi indefinitamente.

La protezione viene applicata dal gestore principale delle risposte in ingresso. Ogni canale compatibile converte il proprio evento in ingresso in informazioni generiche: account o ambito, ID della conversazione, ID del bot mittente e ID del bot destinatario. Il componente principale tiene traccia della coppia di partecipanti in entrambe le direzioni (da A a B e da B ad A sono considerate la stessa coppia), applica un limite in una finestra temporale scorrevole e sospende la coppia per un periodo di attesa dopo il superamento del limite.

## Valori predefiniti

La protezione dai cicli tra coppie è attiva ogni volta che un canale consente ai messaggi creati da bot di raggiungere lo smistamento. Valori predefiniti integrati:

| Chiave               | Valore predefinito | Significato                                                   |
| -------------------- | ------------------- | ------------------------------------------------------------- |
| `enabled`            | `true`              | Protezione attiva per i canali che la supportano.              |
| `maxEventsPerWindow` | `20`                | Eventi che una coppia di bot può scambiarsi entro la finestra. |
| `windowSeconds`      | `60`                | Durata della finestra temporale scorrevole.                    |
| `cooldownSeconds`    | `60`                | Tempo di sospensione dopo che la coppia supera il limite.      |

La protezione non influisce sui messaggi scritti da persone, sulle distribuzioni con un solo bot, sul filtraggio dei messaggi inviati a sé stessi o sulle risposte dei bot che rimangono entro il limite.

## Configurare i valori predefiniti condivisi

Imposta una sola volta `channels.defaults.botLoopProtection` per fornire a tutti i canali compatibili la stessa configurazione di base. Le sostituzioni a livello di canale, account e stanza possono comunque adattare le singole superfici.

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

Imposta `enabled: false` solo quando la politica del canale consente intenzionalmente conversazioni tra bot senza sospensione automatica.

## Sostituire i valori per canale, account o stanza

I canali compatibili sovrappongono la propria configurazione al valore predefinito condiviso, chiave per chiave. Precedenza, dal livello più specifico:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, quando il canale supporta sostituzioni per singola conversazione
2. `channels.<channel>.accounts.<account>.botLoopProtection`, quando il canale supporta gli account
3. `channels.<channel>.botLoopProtection`, quando il canale supporta valori predefiniti di primo livello
4. `channels.defaults.botLoopProtection`
5. valori predefiniti integrati

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
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Compatibilità dei canali

- Discord: informazioni native `author.bot`, indicizzate per account Discord, canale e coppia di bot.
- Google Chat: informazioni native `sender.type=BOT` per i messaggi accettati creati da bot, indicizzate per account, spazio e coppia di bot.
- Matrix: account bot Matrix configurati, indicizzati per account Matrix, stanza e coppia di bot configurata.
- Slack: informazioni native `bot_id` per i messaggi accettati creati da bot, indicizzate per account Slack, canale e coppia di bot.

I canali che non espongono un'identità bot in ingresso affidabile continuano a utilizzare i normali filtri per i messaggi inviati a sé stessi e per le politiche di accesso. Non devono adottare questa protezione finché non sono in grado di identificare entrambi i partecipanti della coppia di bot.

Consulta [Runtime dell'SDK](/it/plugins/sdk-runtime#reusable-runtime-utilities) per i dettagli di implementazione dei plugin.
