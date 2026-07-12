---
read_when:
    - Vuoi connettere un bot Yuanbao
    - Stai configurando il canale Yuanbao
summary: Panoramica, funzionalità e configurazione del bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T06:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao è la piattaforma di assistenza IA di Tencent. Il plugin `openclaw-plugin-yuanbao`, gestito dalla community, connette i bot Yuanbao a OpenClaw tramite WebSocket per messaggi diretti e chat di gruppo.

**Stato:** pronto per la produzione per i messaggi diretti ai bot e le chat di gruppo. WebSocket è l'unica modalità di connessione supportata. Questo plugin è gestito dal team Tencent Yuanbao come voce di catalogo esterna, non dal nucleo di OpenClaw; i dettagli di configurazione e comportamento riportati di seguito (oltre all'installazione e all'interfaccia CLI generica) provengono dalla documentazione del plugin e non sono stati verificati rispetto al codice sorgente del nucleo di OpenClaw.

## Avvio rapido

Richiede OpenClaw 2026.4.10 o versione successiva. Verifica con `openclaw --version`; esegui l'aggiornamento con `openclaw update`.

<Steps>
  <Step title="Aggiungi il canale Yuanbao con le tue credenziali">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` usa `appKey:appSecret` separati da due punti. Ottienili dall'app Yuanbao creando un bot nelle impostazioni dell'applicazione.
  </Step>

  <Step title="Riavvia il Gateway per applicare la modifica">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configurazione interattiva (alternativa)

```bash
openclaw channels login --channel yuanbao
```

Segui le istruzioni per inserire l'ID app e l'App Secret.

## Controllo degli accessi

### Messaggi diretti

`channels.yuanbao.dm.policy`:

| Valore           | Comportamento                                                        |
| ---------------- | -------------------------------------------------------------------- |
| `open` (predefinito) | Consente l'accesso a tutti gli utenti                            |
| `pairing`        | Gli utenti sconosciuti ricevono un codice di associazione; approva tramite CLI |
| `allowlist`      | Possono chattare solo gli utenti presenti in `allowFrom`             |
| `disabled`       | Disabilita tutti i messaggi diretti                                  |

Approva una richiesta di associazione:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chat di gruppo

`channels.yuanbao.requireMention` (valore predefinito `true`): richiede una @menzione prima che il bot risponda in un gruppo. Una risposta al messaggio del bot stesso viene considerata una menzione implicita.

## Esempi di configurazione

Configurazione di base, criterio aperto per i messaggi diretti:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Limita i messaggi diretti a utenti specifici:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Disabilita il requisito della @menzione nei gruppi:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Ottimizzazione della consegna in uscita:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // accumula fino a questo numero di caratteri
      maxChars: 3000, // forza la suddivisione oltre questo limite
      idleMs: 5000, // invio automatico dopo il timeout di inattività (ms)
    },
  },
}
```

Imposta `outboundQueueStrategy: "immediate"` per inviare ogni segmento senza accumulo.

## Comandi comuni

| Comando    | Descrizione                        |
| ---------- | ---------------------------------- |
| `/help`    | Mostra i comandi disponibili       |
| `/status`  | Mostra lo stato del bot            |
| `/new`     | Avvia una nuova sessione           |
| `/stop`    | Arresta l'esecuzione corrente      |
| `/restart` | Riavvia OpenClaw                   |
| `/compact` | Compattta il contesto della sessione |

Yuanbao supporta menu nativi per i comandi slash; i comandi vengono sincronizzati automaticamente con la piattaforma all'avvio del Gateway.

## Risoluzione dei problemi

**Il bot non risponde nelle chat di gruppo:**

1. Verifica che il bot sia stato aggiunto al gruppo
2. Verifica di aver @menzionato il bot (obbligatorio per impostazione predefinita)
3. Controlla i log: `openclaw logs --follow`

**Il bot non riceve messaggi:**

1. Verifica che il bot sia stato creato e approvato nell'app Yuanbao
2. Verifica che `appKey` e `appSecret` siano configurati correttamente
3. Verifica che il Gateway sia in esecuzione: `openclaw gateway status`
4. Controlla i log: `openclaw logs --follow`

**Il bot invia risposte vuote o di ripiego:**

1. Controlla se il modello IA restituisce contenuti validi
2. Risposta di ripiego predefinita: "暂时无法解答，你可以换个问题问问我哦"
3. Personalizzala con `channels.yuanbao.fallbackReply`

**App Secret divulgato:**

1. Reimposta l'App Secret nell'app Yuanbao
2. Aggiorna il valore nella configurazione
3. Riavvia il Gateway: `openclaw gateway restart`

## Configurazione avanzata

### Più account

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` determina quale account viene utilizzato quando le API in uscita non specificano un `accountId`.

### Limiti dei messaggi

- `maxChars`: numero massimo di caratteri di un singolo messaggio (valore predefinito `3000`)
- `mediaMaxMb`: limite per il caricamento e il download di contenuti multimediali (valore predefinito `20` MB)
- `overflowPolicy`: comportamento quando un messaggio supera il limite, `"split"` (predefinito) o `"stop"`

### Streaming

Yuanbao supporta l'output in streaming a livello di blocco; il bot invia il testo in segmenti durante la generazione.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // streaming a blocchi abilitato (predefinito)
    },
  },
}
```

Imposta `disableBlockStreaming: true` per inviare la risposta completa in un solo messaggio.

### Contesto della cronologia delle chat di gruppo

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // predefinito: 100, imposta 0 per disabilitare
    },
  },
}
```

Determina quanti messaggi della cronologia vengono inclusi nel contesto IA per le chat di gruppo.

### Modalità di risposta

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (predefinito: "first")
    },
  },
}
```

| Valore  | Comportamento                                                       |
| ------- | ------------------------------------------------------------------- |
| `off`   | Nessuna risposta con citazione                                      |
| `first` | Cita solo la prima risposta per ogni messaggio in entrata (predefinito) |
| `all`   | Cita ogni risposta                                                   |

### Inserimento del suggerimento Markdown

Per impostazione predefinita, il bot inserisce un'istruzione nel prompt di sistema per impedire al modello di racchiudere l'intera risposta in un blocco di codice Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // predefinito: true
    },
  },
}
```

### Modalità di debug

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Abilita l'output dei log non anonimizzato per gli ID bot elencati.

### Instradamento multi-agente

Usa `bindings` per instradare i messaggi diretti o i gruppi Yuanbao verso agenti diversi:

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (messaggio diretto) o `"group"` (chat di gruppo)
- `match.peer.id`: ID utente o codice del gruppo

## Riferimento della configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                               | Descrizione                                                       | Valore predefinito                     |
| ------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Abilita/disabilita il canale                                      | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Account predefinito per l'instradamento in uscita                 | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (firma + generazione dei ticket)                           | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (firma)                                                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Token prefirmato (ignora la firma automatica dei ticket)          | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Nome visualizzato dell'account                                    | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Abilita/disabilita un account specifico                           | `true`                                 |
| `channels.yuanbao.dm.policy`               | Criterio per i messaggi diretti                                   | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Elenco consentiti per i messaggi diretti (elenco di ID utente)    | -                                      |
| `channels.yuanbao.requireMention`          | Richiede una @menzione nei gruppi                                 | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Gestione dei messaggi lunghi (`split` o `stop`)                    | `split`                                |
| `channels.yuanbao.replyToMode`             | Strategia di risposta nei gruppi (`off`, `first`, `all`)           | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Strategia in uscita (`merge-text` o `immediate`)                   | `merge-text`                           |
| `channels.yuanbao.minChars`                | Unione del testo: caratteri minimi per attivare l'invio            | `2800`                                 |
| `channels.yuanbao.maxChars`                | Unione del testo: caratteri massimi per messaggio                  | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Unione del testo: timeout di inattività prima dell'invio automatico (ms) | `5000`                          |
| `channels.yuanbao.mediaMaxMb`              | Limite delle dimensioni dei contenuti multimediali (MB)            | `20`                                   |
| `channels.yuanbao.historyLimit`            | Voci del contesto della cronologia delle chat di gruppo            | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Disabilita l'output in streaming a livello di blocco               | `false`                                |
| `channels.yuanbao.fallbackReply`           | Risposta di ripiego quando il modello non restituisce contenuti    | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Inserisce istruzioni per impedire l'incapsulamento in Markdown     | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID bot nell'elenco consentiti per il debug (log non anonimizzati)  | `[]`                                   |

## Tipi di messaggi supportati

**Ricezione:** testo, immagini, file, audio/voce, video, adesivi/emoji personalizzate, elementi personalizzati (schede di collegamento).

**Invio:** testo (Markdown), immagini, file, audio, video, adesivi.

**Thread e risposte:** risposte con citazione (configurabili tramite `replyToMode`); le risposte nei thread non sono supportate dalla piattaforma.

## Contenuti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
