---
read_when:
    - Configurazione di stanze di gruppo o canale sempre attive
    - Vuoi che l’agente monitori le conversazioni nella stanza senza pubblicare automaticamente il testo finale
    - Debug di digitazione e utilizzo dei token senza messaggio visibile nella stanza
sidebarTitle: Ambient room events
summary: Lascia che le stanze di gruppo supportate forniscano un contesto silenzioso, a meno che l'agente non invii tramite lo strumento di messaggistica
title: Eventi ambientali della stanza
x-i18n:
    generated_at: "2026-07-02T17:38:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Gli eventi ambientali della stanza consentono a OpenClaw di elaborare il parlato di gruppo o canale non menzionato come contesto silenzioso. L'agente può aggiornare la memoria e lo stato della sessione, ma la stanza resta silenziosa a meno che l'agente non chiami esplicitamente lo strumento `message`.

Per le chat di gruppo sempre attive, questa è la modalità consigliata: combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. Usala quando l'agente deve ascoltare, decidere quando una risposta è utile ed evitare il vecchio schema di prompt che rispondeva `NO_REPLY`.

Supportati oggi: canali guild di Discord, canali Slack e canali privati, DM Slack multi-persona e gruppi o supergruppi Telegram. Gli altri canali di gruppo mantengono il comportamento di gruppo esistente, a meno che la loro pagina del canale indichi che supportano gli eventi ambientali della stanza.

## Configurazione consigliata

Imposta il comportamento globale della chat di gruppo:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Poi configura la stanza stessa come sempre attiva disabilitando il gating delle menzioni per quella stanza. Il canale deve comunque essere consentito dalla sua normale `groupPolicy`, dalla allowlist della stanza e dalla allowlist dei mittenti.

Dopo aver salvato la configurazione, il Gateway ricarica a caldo le impostazioni `messages`. Riavvia solo quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato.

## Cosa cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- i messaggi di gruppo o canale consentiti e non menzionati diventano eventi silenziosi della stanza
- i messaggi menzionati restano richieste utente
- i comandi di testo e i comandi nativi restano richieste utente
- le richieste di annullamento o arresto restano richieste utente
- i messaggi diretti restano richieste utente

Gli eventi della stanza usano una consegna visibile rigorosa. Il testo finale dell'assistente è privato. L'agente deve chiamare `message(action=send)` per pubblicare nella stanza.

## Esempio Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Usa la configurazione Discord per canale quando solo un canale deve essere ambientale:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Esempio Slack

Le allowlist dei canali Slack danno priorità agli ID. Usa ID di canale come `C12345678`, non `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Esempio Telegram

Per i gruppi Telegram, il bot deve poter vedere i normali messaggi di gruppo. Se `requireMention: false`, disabilita la modalità privacy di BotFather oppure usa un'altra configurazione Telegram che consegni al bot tutto il traffico del gruppo.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Gli ID dei gruppi Telegram sono di solito numeri negativi come `-1001234567890`. Leggi `chat.id` da `openclaw logs --follow`, inoltra un messaggio del gruppo a un bot helper per ID oppure ispeziona `getUpdates` della Bot API.

## Policy specifica dell'agente

Usa un override dell'agente quando più agenti condividono la stessa stanza ma solo uno deve trattare il parlato non menzionato come contesto ambientale:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Il valore `agents.list[].groupChat.unmentionedInbound` specifico dell'agente sovrascrive `messages.groupChat.unmentionedInbound` per quell'agente.

## Modalità di risposta visibile

`messages.groupChat.visibleReplies` usa per impostazione predefinita `"automatic"` per le normali richieste utente di gruppo/canale. Mantieni questa impostazione predefinita quando vuoi che il testo finale dell'assistente venga pubblicato in modo visibile senza richiedere una chiamata esplicita allo strumento message.

Per le stanze ambientali sempre attive, `messages.groupChat.visibleReplies: "message_tool"` resta consigliato, soprattutto con modelli di ultima generazione affidabili nell'uso degli strumenti, come GPT 5.5. Consente all'agente di decidere quando parlare chiamando lo strumento message. Se il modello restituisce testo finale senza chiamare lo strumento, OpenClaw mantiene privato quel testo finale e registra metadati di consegna soppressa.

Gli eventi della stanza restano rigorosi anche quando altre richieste di gruppo usano risposte automatiche. Gli eventi ambientali della stanza non menzionati richiedono comunque `message(action=send)` per l'output visibile.

## Cronologia

`messages.groupChat.historyLimit` controlla il valore predefinito globale della cronologia di gruppo. I canali possono sovrascriverlo con `channels.<channel>.historyLimit`, e alcuni canali supportano anche limiti di cronologia per account.

Imposta `historyLimit: 0` per disabilitare il contesto della cronologia di gruppo.

I canali room-event supportati mantengono i messaggi ambientali recenti della stanza come contesto. Telegram mantiene una finestra per gruppo sempre attiva e scorrevole, limitata da `historyLimit`; i turni di richiesta utente selezionano le voci dopo l'ultima risposta registrata del bot, mentre i turni room-event ricevono l'intera finestra recente in modo che il modello possa vedere i propri post recenti. La chiave di modalità Telegram ritirata `includeGroupHistoryContext` viene rimossa da `openclaw doctor --fix`.

## Risoluzione dei problemi

Se la stanza mostra digitazione o uso di token ma nessun messaggio visibile:

1. Conferma che la stanza sia consentita dalla allowlist del canale e dalla allowlist dei mittenti.
2. Conferma che `requireMention: false` sia impostato al livello di stanza previsto.
3. Controlla se `messages.groupChat.unmentionedInbound` o l'override dell'agente è `"room_event"`.
4. Ispeziona i log per i metadati del payload finale soppresso o `didSendViaMessagingTool: false`.
5. Per le normali richieste di gruppo, mantieni o ripristina `messages.groupChat.visibleReplies: "automatic"` se vuoi che le risposte finali vengano pubblicate automaticamente. Per le stanze ambientali che usano `message_tool`, usa un modello/runtime che chiami gli strumenti in modo affidabile.

Se le stanze ambientali Telegram non si attivano affatto, controlla la modalità privacy di BotFather e verifica che il Gateway stia ricevendo i normali messaggi di gruppo.

Se le stanze ambientali Slack non si attivano, verifica che la chiave del canale sia l'ID del canale Slack e che l'app abbia lo scope richiesto `channels:history` o `groups:history` per quel tipo di stanza.

## Correlati

- [Gruppi](/it/channels/groups)
- [Discord](/it/channels/discord)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Riferimento della configurazione dei canali](/it/gateway/config-channels)
