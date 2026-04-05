---
read_when:
    - Vuoi connettere OpenClaw a QQ
    - Hai bisogno della configurazione delle credenziali di QQ Bot
    - Vuoi il supporto di QQ Bot per gruppi o chat private
summary: Configurazione, impostazioni e utilizzo di QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T13:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot si connette a OpenClaw tramite l'API ufficiale QQ Bot (gateway WebSocket). Il
plugin supporta chat private C2C, @message di gruppo e messaggi nei canali guild con
rich media (immagini, voce, video, file).

Stato: plugin incluso. I messaggi diretti, le chat di gruppo, i canali guild e i
contenuti multimediali sono supportati. Reazioni e thread non sono supportati.

## Plugin incluso

Le attuali release di OpenClaw includono QQ Bot, quindi le normali build pacchettizzate non richiedono
un passaggio separato `openclaw plugins install`.

## Configurazione

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene memorizzato in chiaro: se lasci la pagina senza salvarlo,
> dovrai rigenerarne uno nuovo.

4. Aggiungi il canale:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Riavvia il Gateway.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurare

Configurazione minima:

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

Variabili d'ambiente dell'account predefinito:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret supportato da file:

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

Note:

- Il fallback alle variabili d'ambiente si applica solo all'account QQ Bot predefinito.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  AppSecret; AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in chiaro.

### Configurazione multi-account

Esegui più bot QQ in una singola istanza OpenClaw:

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

Ogni account avvia la propria connessione WebSocket e mantiene una cache token indipendente
(isolata da `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voce (STT / TTS)

STT e TTS supportano una configurazione a due livelli con fallback per priorità:

| Setting | Specifico del plugin  | Fallback del framework         |
| ------- | --------------------- | ------------------------------ |
| STT     | `channels.qqbot.stt`  | `tools.media.audio.models[0]`  |
| TTS     | `channels.qqbot.tts`  | `messages.tts`                 |

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
    },
  },
}
```

Imposta `enabled: false` su uno dei due per disabilitarlo.

Il comportamento di upload/transcodifica dell'audio in uscita può anche essere regolato con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Format                     | Descrizione       |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo    |
| `qqbot:channel:CHANNEL_ID` | Canale guild      |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non**
> può essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Command        | Descrizione                                 |
| -------------- | ------------------------------------------- |
| `/bot-ping`    | Test di latenza                             |
| `/bot-version` | Mostra la versione del framework OpenClaw   |
| `/bot-help`    | Elenca tutti i comandi                      |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento di QQBot |
| `/bot-logs`    | Esporta i log recenti del gateway come file |

Aggiungi `?` a qualsiasi comando per ottenere la guida all'uso (ad esempio `/bot-upgrade ?`).

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti e che il
  bot sia abilitato sulla QQ Open Platform.
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  AppSecret. Hai comunque bisogno di `appId` nella configurazione o di `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ può intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.
