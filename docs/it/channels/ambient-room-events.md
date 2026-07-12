---
read_when:
    - Configurazione di stanze di gruppo o canale sempre attive
    - Vuoi che l'agente monitori le conversazioni nella stanza senza pubblicare automaticamente il testo finale
    - Debug del comportamento di digitazione e dell'utilizzo dei token senza messaggi visibili nella stanza
sidebarTitle: Ambient room events
summary: Consenti alle stanze di gruppo supportate di fornire un contesto silenzioso, a meno che l'agente non invii tramite lo strumento di messaggistica
title: Eventi ambientali della stanza
x-i18n:
    generated_at: "2026-07-12T06:49:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Gli eventi ambientali delle stanze consentono a OpenClaw di elaborare le conversazioni di gruppo o di canale senza menzioni come contesto silenzioso. L'agente può aggiornare la memoria e lo stato della sessione, ma la stanza rimane silenziosa a meno che l'agente non chiami esplicitamente lo strumento `message`.

Per le chat di gruppo sempre attive, combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. L'agente ascolta, decide quando è utile rispondere e non deve più usare il vecchio schema di prompt che prevedeva la risposta `NO_REPLY`.

Attualmente supportati: canali dei server Discord, canali pubblici e privati Slack, messaggi diretti Slack con più partecipanti e gruppi o supergruppi Telegram. Gli altri canali di gruppo mantengono il comportamento esistente, a meno che la pagina del canale non indichi il supporto per gli eventi ambientali delle stanze.

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

Quindi rendi la stanza sempre attiva disabilitando per quella stanza il requisito della menzione. La stanza deve comunque rispettare i normali criteri `groupPolicy`, l'elenco degli elementi consentiti per la stanza e quello dei mittenti.

Dopo aver salvato la configurazione, il Gateway applica immediatamente le impostazioni di `messages`. Riavvia solo quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato (`gateway.reload.mode: "off"`).

## Cosa cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- i messaggi consentiti di gruppi o canali senza menzioni diventano eventi silenziosi della stanza
- i messaggi con menzioni rimangono richieste dell'utente
- i comandi di controllo testuali e i comandi nativi rimangono richieste dell'utente
- le richieste di interruzione o arresto rimangono richieste dell'utente
- i messaggi diretti rimangono richieste dell'utente

Gli eventi della stanza usano una modalità rigorosa di recapito visibile. Il testo finale dell'assistente rimane privato. L'agente deve chiamare `message(action=send)` per pubblicare nella stanza.

Le indicazioni di digitazione e le reazioni sullo stato del ciclo di vita rimangono disabilitate per gli eventi della stanza. L'unica eccezione esplicita per la conferma di ricezione è `messages.ackReactionScope: "all"`, che invia la reazione di conferma configurata; usa un ambito più ristretto o `"off"` quando la stanza deve rimanere completamente silenziosa.

## Esempio per Discord

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

Usa la configurazione Discord per singolo canale quando solo un canale deve essere ambientale. Con `groupPolicy: "allowlist"`, è l'inserimento del canale nell'elenco a consentirlo (`enabled: false` disabilita una voce):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Esempio per Slack

Gli elenchi dei canali Slack consentiti usano prioritariamente gli ID. Usa ID di canale come `C12345678`, non `#channel-name`. È l'inserimento del canale in `channels.slack.channels` a consentirlo (`enabled: false` disabilita una voce):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Esempio per Telegram

Per i gruppi Telegram, il bot deve poter vedere i normali messaggi del gruppo. Se `requireMention: false`, disabilita la modalità privacy di BotFather oppure usa un'altra configurazione Telegram che recapiti al bot tutto il traffico del gruppo.

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

Gli ID dei gruppi Telegram sono in genere numeri negativi, come `-1001234567890`. Leggi `chat.id` da `openclaw logs --follow`, inoltra un messaggio del gruppo a un bot di supporto per gli ID oppure esamina `getUpdates` della Bot API.

## Criteri specifici per l'agente

Usa una sostituzione specifica per l'agente quando più agenti condividono la stessa stanza, ma solo uno deve trattare le conversazioni senza menzioni come contesto ambientale:

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

Il valore specifico dell'agente `agents.list[].groupChat.unmentionedInbound` sostituisce `messages.groupChat.unmentionedInbound` per quell'agente.

## Modalità delle risposte visibili

Il valore predefinito di `messages.groupChat.visibleReplies` è `"automatic"` per le normali richieste degli utenti nei gruppi o nei canali. Mantieni questa impostazione predefinita quando il testo finale dell'assistente deve essere pubblicato in modo visibile senza una chiamata esplicita allo strumento di messaggistica.

Per le stanze ambientali sempre attive, `messages.groupChat.visibleReplies: "message_tool"` rimane l'impostazione consigliata, soprattutto con modelli di ultima generazione affidabili nell'uso degli strumenti, come GPT-5.6 Sol. Consente all'agente di decidere quando intervenire chiamando lo strumento di messaggistica. Se il modello restituisce del testo finale senza chiamare lo strumento, OpenClaw mantiene privato tale testo e registra i metadati relativi alla mancata consegna.

Gli eventi della stanza rimangono soggetti alla modalità rigorosa anche quando le altre richieste di gruppo usano risposte automatiche. Gli eventi ambientali della stanza senza menzioni richiedono sempre `message(action=send)` per produrre un output visibile.

## Cronologia

`messages.groupChat.historyLimit` imposta il valore predefinito globale per la cronologia dei gruppi (50 se non impostato; deve essere un numero intero positivo). I canali possono sostituirlo con `channels.<channel>.historyLimit` e alcuni canali supportano anche limiti della cronologia per singolo account. Imposta `historyLimit: 0` a livello di canale per disabilitare il contesto della cronologia dei gruppi per quel canale.

I canali che supportano gli eventi della stanza mantengono come contesto i messaggi ambientali recenti. Telegram conserva per ogni gruppo una finestra scorrevole sempre attiva, limitata da `historyLimit`; i turni relativi alle richieste degli utenti selezionano le voci successive all'ultima risposta registrata del bot, mentre i turni degli eventi della stanza ricevono l'intera finestra recente, affinché il modello possa vedere i propri messaggi recenti. La chiave della modalità Telegram ritirata `includeGroupHistoryContext` viene rimossa da `openclaw doctor --fix`.

## Risoluzione dei problemi

Se la stanza mostra attività di digitazione o consumo di token, ma nessun messaggio visibile:

1. Verifica che la stanza sia consentita dall'elenco dei canali consentiti e da quello dei mittenti consentiti.
2. Verifica che `requireMention: false` sia impostato al livello della stanza previsto.
3. Controlla se `messages.groupChat.unmentionedInbound` o la sostituzione specifica per l'agente è impostata su `"room_event"`.
4. Esamina i registri per individuare i metadati del payload finale non recapitato o `didSendViaMessagingTool: false`.
5. Per le normali richieste di gruppo, mantieni o ripristina `messages.groupChat.visibleReplies: "automatic"` se vuoi che le risposte finali vengano pubblicate automaticamente. Per le stanze ambientali che usano `message_tool`, usa un modello o un ambiente di esecuzione che chiami gli strumenti in modo affidabile.

Se le stanze ambientali Telegram non si attivano affatto, controlla la modalità privacy di BotFather e verifica che il Gateway riceva i normali messaggi del gruppo.

Se le stanze ambientali Slack non si attivano, verifica che la chiave del canale sia l'ID del canale Slack e che l'app disponga dell'ambito di accesso alla cronologia per quel tipo di stanza: `channels:history` (pubblica), `groups:history` (privata) o `mpim:history` (messaggi diretti con più partecipanti).

## Argomenti correlati

- [Gruppi](/it/channels/groups)
- [Discord](/it/channels/discord)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Riferimento per la configurazione dei canali](/it/gateway/config-channels)
