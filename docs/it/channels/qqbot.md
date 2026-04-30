---
read_when:
    - Vuoi collegare OpenClaw a QQ
    - È necessario configurare le credenziali di QQ Bot
    - Vuoi il supporto per chat di gruppo o private di QQ Bot
summary: Installazione, configurazione e utilizzo di QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-04-30T08:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale QQ Bot (Gateway WebSocket). Il
Plugin supporta chat private C2C, @messaggi di gruppo e messaggi dei canali guild con
contenuti multimediali avanzati (immagini, voce, video, file).

Stato: Plugin in bundle. Sono supportati messaggi diretti, chat di gruppo, canali guild e
contenuti multimediali. Reazioni e thread non sono supportati.

## Plugin in bundle

Le versioni attuali di OpenClaw includono QQ Bot, quindi le build pacchettizzate normali non richiedono
un passaggio separato `openclaw plugins install`.

## Configurazione

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene archiviato in testo normale: se lasci la pagina senza salvarlo,
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

Variabili di ambiente dell'account predefinito:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret basato su file:

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

- Il fallback env si applica solo all'account QQ Bot predefinito.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  l'AppSecret; l'AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in testo normale.

### Configurazione multi-account

Esegui più bot QQ sotto una singola istanza OpenClaw:

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

Ogni account avvia la propria connessione WebSocket e mantiene una cache dei token
indipendente (isolata da `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto delle chat di gruppo di QQ Bot usa gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungi il bot
a un gruppo, quindi menzionalo o configura il gruppo per funzionare senza menzione.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` imposta i valori predefiniti per ogni gruppo e una voce concreta
`groups.GROUP_OPENID` sovrascrive questi valori predefiniti per un gruppo. Le impostazioni di gruppo
includono:

- `requireMention`: richiede una @mention prima che il bot risponda. Predefinito: `true`.
- `ignoreOtherMentions`: scarta i messaggi che menzionano qualcun altro ma non il bot.
- `historyLimit`: conserva i messaggi recenti del gruppo senza menzione come contesto per il prossimo turno menzionato. Imposta `0` per disabilitare.
- `toolPolicy`: `full`, `restricted` o `none` per gli strumenti con ambito di gruppo.
- `name`: etichetta leggibile usata nei log e nel contesto del gruppo.
- `prompt`: prompt di comportamento per gruppo aggiunto al contesto dell'agente.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` mappa a
`mention`; `requireMention: false` mappa a `always`. Una sovrascrittura di attivazione
a livello di sessione, quando presente, ha la precedenza sulla configurazione.

La coda in ingresso è per peer. I peer di gruppo ottengono un limite di coda maggiore, mantengono i messaggi
umani davanti alle chiacchiere generate dal bot quando la coda è piena e uniscono raffiche di normali
messaggi di gruppo in un unico turno attribuito. I comandi slash vengono comunque eseguiti uno per volta.

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback prioritario:

| Impostazione | Specifica del Plugin                                      | Fallback del framework        |
| ------------ | --------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                |

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
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Imposta `enabled: false` su uno dei due per disabilitarlo.
Le sovrascritture TTS a livello di account usano la stessa forma di `messages.tts` ed eseguono un deep merge
sulla configurazione TTS del canale/globale.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati multimediali audio, mantenendo
i file vocali grezzi fuori da `MediaPaths` generici. Le risposte in testo normale `[[audio_as_voice]]`
sintetizzano TTS e inviano un messaggio vocale QQ nativo quando TTS è
configurato.

Il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                    | Descrizione        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo     |
| `qqbot:channel:CHANNEL_ID` | Canale guild       |

> Ogni bot ha il proprio set di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Comando        | Descrizione                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test di latenza                                                                                                |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                                      |
| `/bot-help`    | Elenca tutti i comandi                                                                                         |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento QQBot                                                               |
| `/bot-logs`    | Esporta i log recenti del gateway come file                                                                    |
| `/bot-approve` | Approva un'azione QQ Bot in sospeso (ad esempio, la conferma di un caricamento C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per l'aiuto all'uso (ad esempio `/bot-upgrade ?`).

## Architettura del motore

QQ Bot viene fornito come motore autonomo all'interno del Plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache dei token, radice di archiviazione multimediale) indicizzato da `appId`. Gli account non condividono mai lo stato in ingresso/in uscita.
- Il logger multi-account contrassegna le righe di log con l'account proprietario, in modo che la diagnostica resti separabile quando esegui più bot sotto un unico gateway.
- I percorsi in ingresso, in uscita e bridge del gateway condividono una singola radice di payload multimediali sotto `~/.openclaw/media`, quindi upload, download e cache di transcodifica finiscono in una directory protetta invece che in un albero per sottosistema.
- La consegna di contenuti multimediali avanzati passa attraverso un unico percorso `sendMedia` per destinazioni C2C e di gruppo. File locali e buffer sopra la soglia per file di grandi dimensioni usano gli endpoint di upload a blocchi di QQ, mentre i payload più piccoli usano l'API multimediale one-shot.
- È possibile eseguire il backup e il ripristino delle credenziali come parte degli snapshot standard delle credenziali OpenClaw; al ripristino il motore riaggancia lo stack di risorse di ogni account senza richiedere una nuova coppia tramite codice QR.

## Onboarding con codice QR

In alternativa all'incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding con codice QR per collegare un QQ Bot a OpenClaw:

1. Esegui il percorso di configurazione di QQ Bot (ad esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono collegata al QQ Bot di destinazione.
3. Approva l'associazione sul telefono. OpenClaw conserva le credenziali restituite in `credentials/` sotto l'ambito dell'account corretto.

I prompt di approvazione generati dal bot stesso (ad esempio, flussi "allow this action?" esposti dall'API QQ Bot) emergono come prompt OpenClaw nativi che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti e che il
  bot sia abilitato sulla QQ Open Platform.
- **Autorisposte ripetute:** OpenClaw registra gli indici ref in uscita di QQ come
  generati dal bot e ignora gli eventi in ingresso il cui `msgIdx` corrente corrisponde a quello
  dello stesso account bot. Questo impedisce loop di eco della piattaforma consentendo comunque agli utenti
  di citare o rispondere a messaggi precedenti del bot.
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  l'AppSecret. Serve comunque `appId` nella configurazione o `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ può intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi del canale](/it/channels/troubleshooting)
