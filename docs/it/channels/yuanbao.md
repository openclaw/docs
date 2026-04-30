---
read_when:
    - Vuoi collegare un bot Yuanbao
    - Stai configurando il canale Yuanbao
summary: Panoramica, funzionalità e configurazione del bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T08:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao è la piattaforma di assistente AI di Tencent. Il Plugin di canale OpenClaw
connette i bot Yuanbao a OpenClaw tramite WebSocket, così possono interagire con gli utenti
tramite messaggi diretti e chat di gruppo.

**Stato:** pronto per la produzione per DM dei bot + chat di gruppo. WebSocket è l'unica modalità di connessione supportata.

---

## Avvio rapido

> **Richiede OpenClaw 2026.4.10 o versioni successive.** Esegui `openclaw --version` per controllare. Aggiorna con `openclaw update`.

<Steps>
  <Step title="Aggiungi il canale Yuanbao con le tue credenziali">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Il valore `--token` usa il formato `appKey:appSecret` separato da due punti. Puoi ottenerli dall'app Yuanbao creando un robot nelle impostazioni della tua applicazione.
  </Step>

  <Step title="Al termine della configurazione, riavvia il gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configurazione interattiva (alternativa)

Puoi anche usare la procedura guidata interattiva:

```bash
openclaw channels login --channel yuanbao
```

Segui le istruzioni per inserire l'ID app e il segreto app.

---

## Controllo degli accessi

### Messaggi diretti

Configura `dmPolicy` per controllare chi può inviare DM al bot:

- `"pairing"` — gli utenti sconosciuti ricevono un codice di abbinamento; approva tramite CLI
- `"allowlist"` — solo gli utenti elencati in `allowFrom` possono chattare
- `"open"` — consenti tutti gli utenti (predefinito)
- `"disabled"` — disabilita tutti i DM

**Approva una richiesta di abbinamento:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chat di gruppo

**Requisito di menzione** (`channels.yuanbao.requireMention`):

- `true` — richiede @mention (predefinito)
- `false` — risponde senza @mention

Rispondere al messaggio del bot in una chat di gruppo viene trattato come una menzione implicita.

---

## Esempi di configurazione

### Configurazione di base con criterio DM aperto

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

### Limita i DM a utenti specifici

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

### Disabilita il requisito @mention nei gruppi

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Ottimizza la consegna dei messaggi in uscita

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Regola la strategia merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Comandi comuni

| Comando    | Descrizione                      |
| ---------- | -------------------------------- |
| `/help`    | Mostra i comandi disponibili     |
| `/status`  | Mostra lo stato del bot          |
| `/new`     | Avvia una nuova sessione         |
| `/stop`    | Arresta l'esecuzione corrente    |
| `/restart` | Riavvia OpenClaw                 |
| `/compact` | Compatta il contesto di sessione |

> Yuanbao supporta menu nativi per comandi slash. I comandi vengono sincronizzati automaticamente con la piattaforma all'avvio del gateway.

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia stato aggiunto al gruppo
2. Assicurati di usare @mention con il bot (richiesto per impostazione predefinita)
3. Controlla i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurati che il bot sia creato e approvato nell'app Yuanbao
2. Assicurati che `appKey` e `appSecret` siano configurati correttamente
3. Assicurati che il gateway sia in esecuzione: `openclaw gateway status`
4. Controlla i log: `openclaw logs --follow`

### Il bot invia risposte vuote o di fallback

1. Controlla se il modello AI restituisce contenuti validi
2. La risposta di fallback predefinita è: "暂时无法解答，你可以换个问题问问我哦"
3. Personalizzala tramite `channels.yuanbao.fallbackReply`

### Segreto app trapelato

1. Reimposta il segreto app in YuanBao APP
2. Aggiorna il valore nella tua configurazione
3. Riavvia il gateway: `openclaw gateway restart`

---

## Configurazione avanzata

### Account multipli

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

`defaultAccount` controlla quale account viene usato quando le API in uscita non specificano un `accountId`.

### Limiti dei messaggi

- `maxChars` — numero massimo di caratteri per singolo messaggio (predefinito: `3000` caratteri)
- `mediaMaxMb` — limite di caricamento/download dei media (predefinito: `20` MB)
- `overflowPolicy` — comportamento quando il messaggio supera il limite: `"split"` (predefinito) o `"stop"`

### Streaming

Yuanbao supporta l'output in streaming a livello di blocco. Quando è abilitato, il bot invia il testo a blocchi mentre lo genera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Imposta `disableBlockStreaming: true` per inviare la risposta completa in un unico messaggio.

### Contesto della cronologia delle chat di gruppo

Controlla quanti messaggi storici vengono inclusi nel contesto AI per le chat di gruppo:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Modalità reply-to

Controlla come il bot cita i messaggi quando risponde nelle chat di gruppo:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valore    | Comportamento                                              |
| --------- | ---------------------------------------------------------- |
| `"off"`   | Nessuna risposta con citazione                             |
| `"first"` | Cita solo la prima risposta per messaggio in entrata (predefinito) |
| `"all"`   | Cita ogni risposta                                         |

### Iniezione di suggerimenti Markdown

Per impostazione predefinita, il bot inserisce istruzioni nel prompt di sistema per impedire al modello AI di racchiudere l'intera risposta in blocchi di codice markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Modalità debug

Abilita l'output di log non sanificato per ID bot specifici:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Instradamento multi-agente

Usa `bindings` per instradare DM o gruppi Yuanbao verso agenti diversi.

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

Campi di instradamento:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) o `"group"` (chat di gruppo)
- `match.peer.id`: ID utente o codice gruppo

---

## Riferimento di configurazione

Configurazione completa: [Configurazione del gateway](/it/gateway/configuration)

| Impostazione                              | Descrizione                                      | Predefinito                            |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `channels.yuanbao.enabled`               | Abilita/disabilita il canale                     | `true`                                 |
| `channels.yuanbao.defaultAccount`        | Account predefinito per l'instradamento in uscita | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`  | Chiave app (usata per la firma e la generazione del ticket) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | Segreto app (usato per la firma)                | —                                      |
| `channels.yuanbao.accounts.<id>.token`   | Token prefirmato (salta la firma automatica del ticket) | —                                      |
| `channels.yuanbao.accounts.<id>.name`    | Nome visualizzato dell'account                   | —                                      |
| `channels.yuanbao.accounts.<id>.enabled` | Abilita/disabilita un account specifico          | `true`                                 |
| `channels.yuanbao.dm.policy`             | Criterio DM                                      | `open`                                 |
| `channels.yuanbao.dm.allowFrom`          | Allowlist DM (elenco di ID utente)               | —                                      |
| `channels.yuanbao.requireMention`        | Richiede @mention nei gruppi                     | `true`                                 |
| `channels.yuanbao.overflowPolicy`        | Gestione dei messaggi lunghi (`split` o `stop`)  | `split`                                |
| `channels.yuanbao.replyToMode`           | Strategia reply-to di gruppo (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy` | Strategia in uscita (`merge-text` o `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`              | Merge-text: caratteri minimi per attivare l'invio | `2800`                                 |
| `channels.yuanbao.maxChars`              | Merge-text: caratteri massimi per messaggio      | `3000`                                 |
| `channels.yuanbao.idleMs`                | Merge-text: timeout di inattività prima dell'auto-flush (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`            | Limite dimensione media (MB)                     | `20`                                   |
| `channels.yuanbao.historyLimit`          | Voci di contesto della cronologia chat di gruppo | `100`                                  |
| `channels.yuanbao.disableBlockStreaming` | Disabilita l'output in streaming a livello di blocco | `false`                                |
| `channels.yuanbao.fallbackReply`         | Risposta di fallback quando l'AI non restituisce contenuti | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`   | Inserisce istruzioni anti-wrapping markdown      | `true`                                 |
| `channels.yuanbao.debugBotIds`           | ID bot nella whitelist di debug (log non sanificati) | `[]`                                   |

---

## Tipi di messaggi supportati

### Ricezione

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio / Voce
- ✅ Video
- ✅ Sticker / Emoji personalizzate
- ✅ Elementi personalizzati (schede di link, ecc.)

### Invio

- ✅ Testo (con supporto markdown)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video
- ✅ Sticker

### Thread e risposte

- ✅ Risposte con citazione (configurabili tramite `replyToMode`)
- ❌ Risposte nei thread (non supportate dalla piattaforma)

---

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gate delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
