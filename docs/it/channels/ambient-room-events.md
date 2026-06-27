---
read_when:
    - Configurazione di stanze di gruppo o canale sempre attive
    - Vuoi che l’agente osservi le conversazioni della stanza senza pubblicare automaticamente il testo finale
    - Debug dell'indicatore di digitazione e dell'utilizzo dei token senza un messaggio visibile nella stanza
sidebarTitle: Ambient room events
summary: Consenti alle stanze di gruppo supportate di fornire contesto discreto a meno che l'agente non invii con lo strumento messaggi
title: Eventi ambientali della stanza
x-i18n:
    generated_at: "2026-06-27T17:09:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Gli eventi di stanza ambientali permettono a OpenClaw di elaborare le conversazioni di gruppo o canale non menzionate come contesto silenzioso. L'agente può aggiornare memoria e stato della sessione, ma la stanza resta silenziosa a meno che l'agente non chiami esplicitamente lo strumento `message`.

Per le chat di gruppo sempre attive, questa è la modalità consigliata: combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. Usala quando l'agente deve ascoltare, decidere quando una risposta è utile ed evitare il vecchio pattern di prompt che rispondeva `NO_REPLY`.

Supportati oggi: canali guild Discord, canali Slack e canali privati, DM Slack con più persone e gruppi o supergruppi Telegram. Gli altri canali di gruppo mantengono il comportamento di gruppo esistente, a meno che la pagina del loro canale indichi il supporto per gli eventi di stanza ambientali.

## Configurazione consigliata

Imposta il comportamento globale delle chat di gruppo:

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

Poi configura la stanza stessa come sempre attiva disabilitando il gating tramite menzione per quella stanza. Il canale deve comunque essere consentito dalla sua normale `groupPolicy`, dall'allowlist della stanza e dall'allowlist dei mittenti.

Dopo aver salvato la configurazione, il Gateway ricarica a caldo le impostazioni `messages`. Riavvia solo quando il monitoraggio dei file o il ricaricamento della configurazione sono disabilitati.

## Cosa cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- i messaggi di gruppo o canale consentiti e non menzionati diventano eventi di stanza silenziosi
- i messaggi menzionati restano richieste dell'utente
- i comandi testuali e i comandi nativi restano richieste dell'utente
- le richieste di interruzione o arresto restano richieste dell'utente
- i messaggi diretti restano richieste dell'utente

Gli eventi di stanza usano una consegna visibile rigorosa. Il testo finale dell'assistente è privato. L'agente deve chiamare `message(action=send)` per pubblicare nella stanza.

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

Le allowlist dei canali Slack privilegiano gli ID. Usa ID di canale come `C12345678`, non `#channel-name`.

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

Gli ID dei gruppi Telegram sono di solito numeri negativi come `-1001234567890`. Leggi `chat.id` da `openclaw logs --follow`, inoltra un messaggio di gruppo a un bot helper per ID oppure ispeziona `getUpdates` della Bot API.

## Policy specifica dell'agente

Usa un override dell'agente quando più agenti condividono la stessa stanza ma solo uno deve trattare le conversazioni non menzionate come contesto ambientale:

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

`messages.groupChat.visibleReplies` ha come valore predefinito `"automatic"` per le normali richieste utente in gruppi/canali. Mantieni quel valore predefinito quando vuoi che il testo finale dell'assistente venga pubblicato visibilmente senza richiedere una chiamata esplicita allo strumento di messaggistica.

Per le stanze ambientali sempre attive, `messages.groupChat.visibleReplies: "message_tool"` resta comunque consigliato, soprattutto con modelli di ultima generazione affidabili nell'uso degli strumenti, come GPT 5.5. Permette all'agente di decidere quando parlare chiamando lo strumento di messaggistica. Se il modello restituisce testo finale senza chiamare lo strumento, OpenClaw mantiene privato quel testo finale e registra metadati di consegna soppressa.

Gli eventi di stanza restano rigorosi anche quando altre richieste di gruppo usano risposte automatiche. Gli eventi di stanza ambientali non menzionati richiedono comunque `message(action=send)` per produrre output visibile.

## Cronologia

`messages.groupChat.historyLimit` controlla il valore predefinito globale della cronologia di gruppo. I canali possono sovrascriverlo con `channels.<channel>.historyLimit`, e alcuni canali supportano anche limiti di cronologia per account.

Imposta `historyLimit: 0` per disabilitare il contesto della cronologia di gruppo.

I canali con supporto per eventi di stanza mantengono i messaggi di stanza ambientali recenti come contesto. Discord conserva la cronologia degli eventi di stanza finché un invio Discord visibile non riesce, così il contesto silenzioso non viene perso prima della consegna tramite lo strumento di messaggistica.

## Risoluzione dei problemi

Se la stanza mostra digitazione o utilizzo di token ma nessun messaggio visibile:

1. Conferma che la stanza sia consentita dall'allowlist del canale e dall'allowlist dei mittenti.
2. Conferma che `requireMention: false` sia impostato al livello di stanza previsto.
3. Controlla se `messages.groupChat.unmentionedInbound` o l'override dell'agente è `"room_event"`.
4. Ispeziona i log per metadati del payload finale soppressi o `didSendViaMessagingTool: false`.
5. Per le normali richieste di gruppo, mantieni o ripristina `messages.groupChat.visibleReplies: "automatic"` se vuoi che le risposte finali vengano pubblicate automaticamente. Per le stanze ambientali che usano `message_tool`, usa un modello/runtime che chiami gli strumenti in modo affidabile.

Se le stanze ambientali Telegram non si attivano affatto, controlla la modalità privacy di BotFather e verifica che il Gateway stia ricevendo i normali messaggi di gruppo.

Se le stanze ambientali Slack non si attivano, verifica che la chiave del canale sia l'ID del canale Slack e che l'app abbia l'ambito `channels:history` o `groups:history` richiesto per quel tipo di stanza.

## Correlati

- [Gruppi](/it/channels/groups)
- [Discord](/it/channels/discord)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Riferimento alla configurazione dei canali](/it/gateway/config-channels)
