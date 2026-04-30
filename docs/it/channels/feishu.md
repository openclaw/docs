---
read_when:
    - Vuoi collegare un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-30T08:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark è una piattaforma di collaborazione all-in-one dove i team chattano, condividono documenti, gestiscono calendari e lavorano insieme.

**Stato:** pronta per la produzione per DM del bot + chat di gruppo. WebSocket è la modalità predefinita; la modalità webhook è opzionale.

---

## Avvio rapido

<Note>
Richiede OpenClaw 2026.4.25 o superiore. Esegui `openclaw --version` per controllare. Aggiorna con `openclaw update`.
</Note>

<Steps>
  <Step title="Esegui la procedura guidata di configurazione del canale">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scansiona il codice QR con la tua app mobile Feishu/Lark per creare automaticamente un bot Feishu/Lark.
  </Step>
  
  <Step title="Al termine della configurazione, riavvia il gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controllo accessi

### Messaggi diretti

Configura `dmPolicy` per controllare chi può inviare DM al bot:

- `"pairing"` — gli utenti sconosciuti ricevono un codice di associazione; approva tramite CLI
- `"allowlist"` — solo gli utenti elencati in `allowFrom` possono chattare (predefinito: solo il proprietario del bot)
- `"open"` — consenti DM pubblici solo quando `allowFrom` include `"*"`; con voci restrittive, possono chattare solo gli utenti corrispondenti
- `"disabled"` — disabilita tutti i DM

**Approva una richiesta di associazione:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Criterio di gruppo** (`channels.feishu.groupPolicy`):

| Valore        | Comportamento                                                                              |
| ------------- | ------------------------------------------------------------------------------------------ |
| `"open"`      | Rispondi a tutti i messaggi nei gruppi                                                     |
| `"allowlist"` | Rispondi solo ai gruppi in `groupAllowFrom` o configurati esplicitamente in `groups.<chat_id>` |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo; le voci esplicite `groups.<chat_id>` non lo sovrascrivono |

Predefinito: `allowlist`

**Requisito di menzione** (`channels.feishu.requireMention`):

- `true` — richiedi @mention (predefinito)
- `false` — rispondi senza @mention
- Sovrascrittura per gruppo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` solo broadcast non sono trattati come menzioni del bot. Un messaggio che menziona sia `@all` sia direttamente il bot conta comunque come menzione del bot.

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, nessuna @mention richiesta

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Consenti tutti i gruppi, richiedi comunque @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Consenti solo gruppi specifici

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

In modalità `allowlist`, puoi anche ammettere un gruppo aggiungendo una voce esplicita `groups.<chat_id>`. Le voci esplicite non sovrascrivono `groupPolicy: "disabled"`. I valori predefiniti con wildcard in `groups.*` configurano i gruppi corrispondenti, ma non ammettono gruppi da soli.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Limita i mittenti all'interno di un gruppo

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Ottieni ID di gruppo/utente

### ID di gruppo (`chat_id`, formato: `oc_xxx`)

Apri il gruppo in Feishu/Lark, fai clic sull'icona del menu nell'angolo in alto a destra e vai a **Impostazioni**. L'ID del gruppo (`chat_id`) è elencato nella pagina delle impostazioni.

![Ottieni ID gruppo](/images/feishu-get-group-id.png)

### ID utente (`open_id`, formato: `ou_xxx`)

Avvia il gateway, invia un DM al bot, quindi controlla i log:

```bash
openclaw logs --follow
```

Cerca `open_id` nell'output del log. Puoi anche controllare le richieste di associazione in sospeso:

```bash
openclaw pairing list feishu
```

---

## Comandi comuni

| Comando   | Descrizione                    |
| --------- | ------------------------------ |
| `/status` | Mostra lo stato del bot        |
| `/reset`  | Reimposta la sessione corrente |
| `/model`  | Mostra o cambia il modello AI  |

<Note>
Feishu/Lark non supporta menu nativi per comandi slash, quindi inviali come messaggi di testo normale.
</Note>

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia aggiunto al gruppo
2. Assicurati di @mention il bot (richiesto per impostazione predefinita)
3. Verifica che `groupPolicy` non sia `"disabled"`
4. Controlla i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurati che il bot sia pubblicato e approvato in Feishu Open Platform / Lark Developer
2. Assicurati che la sottoscrizione agli eventi includa `im.message.receive_v1`
3. Assicurati che sia selezionata **connessione persistente** (WebSocket)
4. Assicurati che tutti gli ambiti di autorizzazione richiesti siano concessi
5. Assicurati che il gateway sia in esecuzione: `openclaw gateway status`
6. Controlla i log: `openclaw logs --follow`

### App Secret trapelato

1. Reimposta l'App Secret in Feishu Open Platform / Lark Developer
2. Aggiorna il valore nella tua configurazione
3. Riavvia il gateway: `openclaw gateway restart`

---

## Configurazione avanzata

### Più account

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controlla quale account viene usato quando le API in uscita non specificano un `accountId`.
`accounts.<id>.tts` usa la stessa forma di `messages.tts` e viene unito in profondità sopra
la configurazione TTS globale, quindi le configurazioni Feishu multi-bot possono mantenere le credenziali
dei provider condivise a livello globale sovrascrivendo solo voce, modello, persona o modalità automatica
per account.

### Limiti dei messaggi

- `textChunkLimit` — dimensione dei blocchi di testo in uscita (predefinito: `2000` caratteri)
- `mediaMaxMb` — limite di upload/download dei media (predefinito: `30` MB)

### Streaming

Feishu/Lark supporta risposte in streaming tramite schede interattive. Quando è abilitato, il bot aggiorna la scheda in tempo reale mentre genera testo.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Imposta `streaming: false` per inviare la risposta completa in un unico messaggio.

### Ottimizzazione della quota

Riduci il numero di chiamate API Feishu/Lark con due flag opzionali:

- `typingIndicator` (predefinito `true`): imposta `false` per saltare le chiamate di reazione alla digitazione
- `resolveSenderNames` (predefinito `true`): imposta `false` per saltare le ricerche del profilo del mittente

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sessioni ACP

Feishu/Lark supporta ACP per DM e messaggi nei thread di gruppo. ACP di Feishu/Lark è guidato da comandi di testo: non ci sono menu nativi per comandi slash, quindi usa i messaggi `/acp ...` direttamente nella conversazione.

#### Binding ACP persistente

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Avvia ACP dalla chat

In un DM o thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funziona per DM e messaggi nei thread Feishu/Lark. I messaggi successivi nella conversazione associata vengono instradati direttamente a quella sessione ACP.

### Routing multi-agente

Usa `bindings` per instradare DM o gruppi Feishu/Lark ad agenti diversi.

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campi di routing:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) o `"group"` (chat di gruppo)
- `match.peer.id`: Open ID utente (`ou_xxx`) o ID gruppo (`oc_xxx`)

Consulta [Ottieni ID di gruppo/utente](#get-groupuser-ids) per suggerimenti sulla ricerca.

---

## Riferimento di configurazione

Configurazione completa: [Configurazione Gateway](/it/gateway/configuration)

| Impostazione                                      | Descrizione                                                                      | Predefinito      |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Abilita/disabilita il canale                                                     | `true`           |
| `channels.feishu.domain`                          | Dominio API (`feishu` o `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | Trasporto degli eventi (`websocket` o `webhook`)                                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Account predefinito per il routing in uscita                                     | `default`        |
| `channels.feishu.verificationToken`               | Obbligatorio per la modalità Webhook                                             | —                |
| `channels.feishu.encryptKey`                      | Obbligatorio per la modalità Webhook                                             | —                |
| `channels.feishu.webhookPath`                     | Percorso della route Webhook                                                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host di binding del Webhook                                                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta di binding del Webhook                                                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID app                                                                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Segreto app                                                                      | —                |
| `channels.feishu.accounts.<id>.domain`            | Override del dominio per account                                                 | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Override TTS per account                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Criterio DM                                                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | Allowlist DM (elenco open_id)                                                    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Criterio per i gruppi                                                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist dei gruppi                                                             | —                |
| `channels.feishu.requireMention`                  | Richiede @mention nei gruppi                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per gruppo; gli ID espliciti ammettono anche il gruppo in modalità allowlist | ereditato        |
| `channels.feishu.groups.<chat_id>.enabled`        | Abilita/disabilita un gruppo specifico                                           | `true`           |
| `channels.feishu.textChunkLimit`                  | Dimensione dei blocchi di messaggio                                              | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite di dimensione dei media                                                   | `30`             |
| `channels.feishu.streaming`                       | Output delle schede in streaming                                                 | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming a livello di blocco                                                    | `true`           |
| `channels.feishu.typingIndicator`                 | Invia reazioni di digitazione                                                    | `true`           |
| `channels.feishu.resolveSenderNames`              | Risolve i nomi visualizzati dei mittenti                                         | `true`           |

---

## Tipi di messaggio supportati

### Ricezione

- ✅ Testo
- ✅ Testo avanzato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Sticker

I messaggi audio in ingresso di Feishu/Lark vengono normalizzati come segnaposto media invece
del JSON `file_key` grezzo. Quando `tools.media.audio` è configurato, OpenClaw
scarica la risorsa della nota vocale ed esegue la trascrizione audio condivisa prima del
turno dell'agente, così l'agente riceve la trascrizione parlata. Se Feishu include
il testo della trascrizione direttamente nel payload audio, quel testo viene usato senza un'altra
chiamata ASR. Senza un provider di trascrizione audio, l'agente riceve comunque un
segnaposto `<media:audio>` più l'allegato salvato, non il payload grezzo della risorsa
Feishu.

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Schede interattive (inclusi aggiornamenti in streaming)
- ⚠️ Testo avanzato (formattazione in stile post; non supporta tutte le capacità di authoring di Feishu/Lark)

Le bolle audio native di Feishu/Lark usano il tipo di messaggio Feishu `audio` e richiedono
media di caricamento Ogg/Opus (`file_type: "opus"`). I media `.opus` e `.ogg` esistenti
vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri formati probabilmente audio vengono
transcodificati in Ogg/Opus a 48 kHz con `ffmpeg` solo quando la risposta richiede la consegna vocale
(`audioAsVoice` / strumento messaggio `asVoice`, incluse le risposte di note vocali TTS).
Gli allegati MP3 ordinari restano file normali. Se `ffmpeg` manca o
la conversione non riesce, OpenClaw ripiega su un allegato file e registra il motivo.

### Thread e risposte

- ✅ Risposte inline
- ✅ Risposte nei thread
- ✅ Le risposte con media restano consapevoli del thread quando rispondono a un messaggio in un thread

Per `groupSessionScope: "group_topic"` e `"group_topic_sender"`, i gruppi di argomenti nativi
Feishu/Lark usano l'evento `thread_id` (`omt_*`) come chiave canonica
della sessione argomento. Le normali risposte di gruppo che OpenClaw trasforma in thread continuano a
usare l'ID del messaggio radice della risposta (`om_*`), così il primo turno e il turno di follow-up
restano nella stessa sessione.

---

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
