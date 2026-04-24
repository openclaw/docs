---
read_when:
    - Vuoi collegare OpenClaw a QQ
    - Ti serve la configurazione delle credenziali del bot QQ
    - Vuoi il supporto del bot QQ per gruppi o chat private
summary: Configurazione, impostazioni e utilizzo del bot QQ
title: bot QQ
x-i18n:
    generated_at: "2026-04-24T08:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

Il bot QQ si collega a OpenClaw tramite l'API ufficiale di QQ Bot (Gateway WebSocket). Il
Plugin supporta chat private C2C, @messaggi di gruppo e messaggi dei canali guild con
contenuti multimediali avanzati (immagini, voce, video, file).

Stato: Plugin incluso. Sono supportati messaggi diretti, chat di gruppo, canali
guild e contenuti multimediali. Reazioni e thread non sono supportati.

## Plugin incluso

Le versioni attuali di OpenClaw includono QQ Bot, quindi le normali build pacchettizzate non richiedono
un passaggio separato `openclaw plugins install`.

## Configurazione

1. Vai su [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene archiviato in chiaro — se lasci la pagina senza salvarlo,
> dovrai generarne uno nuovo.

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

- Il fallback alle variabili d'ambiente si applica solo all'account predefinito di QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  AppSecret; AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in chiaro.

### Configurazione multi-account

Esegui più bot QQ in una singola istanza di OpenClaw:

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

Ogni account avvia la propria connessione WebSocket e mantiene una cache dei token indipendente
(isolata da `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback di priorità:

| Impostazione | Specifica del Plugin   | Fallback del framework        |
| ------------ | ---------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`   | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`   | `messages.tts`                |

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

Imposta `enabled: false` su uno dei due per disattivarlo.

Il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati target

| Formato                    | Descrizione         |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Chat privata (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo      |
| `qqbot:channel:CHANNEL_ID` | Canale guild        |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Comando        | Descrizione                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test di latenza                                                                                                  |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                                        |
| `/bot-help`    | Elenca tutti i comandi                                                                                           |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento di QQBot                                                              |
| `/bot-logs`    | Esporta i log recenti del Gateway come file                                                                      |
| `/bot-approve` | Approva un'azione QQ Bot in sospeso (ad esempio, confermando un caricamento C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per la guida all'uso (ad esempio `/bot-upgrade ?`).

## Architettura del motore

QQ Bot viene distribuito come motore autonomo all'interno del Plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache dei token, radice di archiviazione dei contenuti multimediali) indicizzato da `appId`. Gli account non condividono mai lo stato in ingresso/uscita.
- Il logger multi-account etichetta le righe di log con l'account proprietario, così la diagnostica resta separabile quando esegui più bot sotto un unico Gateway.
- I percorsi di bridge in ingresso, in uscita e del Gateway condividono un'unica radice dei payload multimediali in `~/.openclaw/media`, quindi caricamenti, download e cache di transcodifica finiscono in un'unica directory protetta invece che in un albero per sottosistema.
- Le credenziali possono essere sottoposte a backup e ripristinate come parte delle normali istantanee delle credenziali di OpenClaw; il motore ricollega lo stack di risorse di ogni account al ripristino senza richiedere un nuovo abbinamento tramite codice QR.

## Onboarding con codice QR

In alternativa a incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding con codice QR per collegare un bot QQ a OpenClaw:

1. Esegui il percorso di configurazione di QQ Bot (ad esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono associata al bot QQ di destinazione.
3. Approva l'abbinamento sul telefono. OpenClaw salva le credenziali restituite in `credentials/` nell'ambito account corretto.

I prompt di approvazione generati dal bot stesso (ad esempio i flussi "consentire questa azione?" esposti dall'API di QQ Bot) appaiono come prompt nativi di OpenClaw che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti e che il
  bot sia abilitato su QQ Open Platform.
- **La configurazione con `--token-file` continua a risultare non configurata:** `--token-file` imposta solo
  AppSecret. Ti serve comunque `appId` nella configurazione o `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ può intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi del canale](/it/channels/troubleshooting)
