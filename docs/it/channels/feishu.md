---
read_when:
    - Vuoi connettere un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark è una piattaforma di collaborazione all-in-one in cui i team chattano, condividono documenti, gestiscono calendari e lavorano insieme.

**Stato:** pronto per la produzione per DM al bot + chat di gruppo. WebSocket è la modalità predefinita; la modalità webhook è opzionale.

---

## Avvio rapido

<Note>
Richiede OpenClaw 2026.4.25 o versione successiva. Esegui `openclaw --version` per controllare. Aggiorna con `openclaw update`.
</Note>

<Steps>
  <Step title="Esegui la procedura guidata di configurazione del canale">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scegli la configurazione manuale per incollare un App ID e un App Secret da Feishu Open Platform, oppure scegli la configurazione QR per creare automaticamente un bot. Se l'app mobile Feishu nazionale non reagisce al codice QR, riesegui la configurazione e scegli la configurazione manuale.
  </Step>
  
  <Step title="Al termine della configurazione, riavvia il gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controllo degli accessi

### Messaggi diretti

Configura `dmPolicy` per controllare chi può inviare DM al bot:

- `"pairing"` - gli utenti sconosciuti ricevono un codice di abbinamento; approva tramite CLI
- `"allowlist"` - solo gli utenti elencati in `allowFrom` possono chattare (predefinito: solo proprietario del bot)
- `"open"` - consenti DM pubblici solo quando `allowFrom` include `"*"`; con voci restrittive, solo gli utenti corrispondenti possono chattare
- `"disabled"` - disabilita tutti i DM

**Approva una richiesta di abbinamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Criterio per i gruppi** (`channels.feishu.groupPolicy`):

| Valore        | Comportamento                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `"open"`      | Risponde a tutti i messaggi nei gruppi                                                                 |
| `"allowlist"` | Risponde solo ai gruppi in `groupAllowFrom` o configurati esplicitamente in `groups.<chat_id>`         |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo; le voci esplicite `groups.<chat_id>` non hanno la precedenza    |

Predefinito: `allowlist`

**Requisito di menzione** (`channels.feishu.requireMention`):

- `true` - richiede @mention (predefinito)
- `false` - risponde senza @mention
- Override per gruppo: `channels.feishu.groups.<chat_id>.requireMention`
- Gli `@all` e `@_all` solo broadcast non sono trattati come menzioni del bot. Un messaggio che menziona sia `@all` sia direttamente il bot conta comunque come menzione del bot.

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, senza @mention richiesta

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

In modalità `allowlist`, puoi anche ammettere un gruppo aggiungendo una voce esplicita `groups.<chat_id>`. Le voci esplicite non hanno la precedenza su `groupPolicy: "disabled"`. Le impostazioni predefinite con carattere jolly in `groups.*` configurano i gruppi corrispondenti, ma non ammettono gruppi da sole.

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

## Ottieni gli ID gruppo/utente

### ID gruppo (`chat_id`, formato: `oc_xxx`)

Apri il gruppo in Feishu/Lark, fai clic sull'icona del menu nell'angolo in alto a destra e vai a **Impostazioni**. L'ID del gruppo (`chat_id`) è elencato nella pagina delle impostazioni.

![Ottieni ID gruppo](/images/feishu-get-group-id.png)

### ID utente (`open_id`, formato: `ou_xxx`)

Avvia il gateway, invia un DM al bot, quindi controlla i log:

```bash
openclaw logs --follow
```

Cerca `open_id` nell'output del log. Puoi anche controllare le richieste di abbinamento in sospeso:

```bash
openclaw pairing list feishu
```

---

## Comandi comuni

| Comando   | Descrizione                   |
| --------- | ----------------------------- |
| `/status` | Mostra lo stato del bot       |
| `/reset`  | Reimposta la sessione attuale |
| `/model`  | Mostra o cambia il modello AI |

<Note>
Feishu/Lark non supporta menu nativi per comandi slash, quindi inviali come semplici messaggi di testo.
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
3. Assicurati che sia selezionata la **connessione persistente** (WebSocket)
4. Assicurati che tutti gli ambiti di autorizzazione richiesti siano concessi
5. Assicurati che il gateway sia in esecuzione: `openclaw gateway status`
6. Controlla i log: `openclaw logs --follow`

### La configurazione QR non reagisce nell'app mobile Feishu

1. Riesegui la configurazione: `openclaw channels login --channel feishu`
2. Scegli la configurazione manuale
3. In Feishu Open Platform, crea un'app self-built e copia il suo App ID e App Secret
4. Incolla queste credenziali nella procedura guidata di configurazione

### App Secret divulgato

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
`accounts.<id>.tts` usa la stessa struttura di `messages.tts` e viene unito in profondità alla configurazione TTS globale, quindi le configurazioni Feishu multi-bot possono mantenere globalmente le credenziali condivise dei provider, sovrascrivendo per account solo voce, modello, persona o modalità automatica.

### Limiti dei messaggi

- `textChunkLimit` - dimensione dei blocchi di testo in uscita (predefinito: `2000` caratteri)
- `mediaMaxMb` - limite di caricamento/download dei media (predefinito: `30` MB)

### Streaming

Feishu/Lark supporta risposte in streaming tramite schede interattive. Quando è abilitato, il bot aggiorna la scheda in tempo reale mentre genera testo.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Imposta `streaming: false` per inviare la risposta completa in un solo messaggio. `blockStreaming` è disattivato per impostazione predefinita; abilitalo solo quando vuoi che i blocchi assistente completati vengano inviati prima della risposta finale.

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

Feishu/Lark supporta ACP per DM e messaggi nei thread di gruppo. ACP di Feishu/Lark è guidato da comandi testuali: non ci sono menu nativi per comandi slash, quindi usa direttamente i messaggi `/acp ...` nella conversazione.

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

#### Genera ACP dalla chat

In un DM o thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funziona per DM e messaggi nei thread Feishu/Lark. I messaggi successivi nella conversazione associata vengono instradati direttamente a quella sessione ACP.

### Routing multi-agente

Usa `bindings` per instradare DM o gruppi Feishu/Lark verso agenti diversi.

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

Vedi [Ottieni gli ID gruppo/utente](#get-groupuser-ids) per suggerimenti sulla ricerca.

---

## Riferimento di configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                                      | Descrizione                                                                      | Predefinito      |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Abilita/disabilita il canale                                                     | `true`           |
| `channels.feishu.domain`                          | Dominio API (`feishu` o `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | Trasporto eventi (`websocket` o `webhook`)                                       | `websocket`      |
| `channels.feishu.defaultAccount`                  | Account predefinito per il routing in uscita                                     | `default`        |
| `channels.feishu.verificationToken`               | Richiesto per la modalità Webhook                                                | -                |
| `channels.feishu.encryptKey`                      | Richiesto per la modalità Webhook                                                | -                |
| `channels.feishu.webhookPath`                     | Percorso della rotta Webhook                                                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host di binding del Webhook                                                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta di binding del Webhook                                                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID app                                                                           | -                |
| `channels.feishu.accounts.<id>.appSecret`         | Segreto app                                                                      | -                |
| `channels.feishu.accounts.<id>.domain`            | Override del dominio per account                                                 | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Override TTS per account                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Criterio DM                                                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | Elenco consentiti DM (elenco open_id)                                            | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Criterio di gruppo                                                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Elenco consentiti del gruppo                                                     | -                |
| `channels.feishu.requireMention`                  | Richiedi @mention nei gruppi                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per gruppo; gli ID espliciti ammettono anche il gruppo in modalità elenco consentiti | ereditato        |
| `channels.feishu.groups.<chat_id>.enabled`        | Abilita/disabilita un gruppo specifico                                           | `true`           |
| `channels.feishu.textChunkLimit`                  | Dimensione dei blocchi di messaggio                                              | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite di dimensione dei media                                                   | `30`             |
| `channels.feishu.streaming`                       | Output di schede in streaming                                                    | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming delle risposte a blocchi completati                                    | `false`          |
| `channels.feishu.typingIndicator`                 | Invia reazioni di digitazione                                                    | `true`           |
| `channels.feishu.resolveSenderNames`              | Risolvi i nomi visualizzati dei mittenti                                         | `true`           |

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

I messaggi audio Feishu/Lark in ingresso vengono normalizzati come segnaposto multimediali invece
che come JSON `file_key` grezzo. Quando `tools.media.audio` è configurato, OpenClaw
scarica la risorsa della nota vocale ed esegue la trascrizione audio condivisa prima del
turno dell'agente, così l'agente riceve la trascrizione del parlato. Se Feishu include
testo di trascrizione direttamente nel payload audio, quel testo viene usato senza un'altra
chiamata ASR. Senza un provider di trascrizione audio, l'agente riceve comunque un
segnaposto `<media:audio>` più l'allegato salvato, non il payload della risorsa Feishu
grezzo.

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Schede interattive (inclusi aggiornamenti in streaming)
- ⚠️ Testo avanzato (formattazione in stile post; non supporta tutte le funzionalità di authoring Feishu/Lark)

Le bolle audio native Feishu/Lark usano il tipo di messaggio `audio` di Feishu e richiedono
media caricati in Ogg/Opus (`file_type: "opus"`). I media `.opus` e `.ogg` esistenti
vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri formati audio probabili vengono
transcodificati in Ogg/Opus a 48 kHz con `ffmpeg` solo quando la risposta richiede la consegna vocale
(`audioAsVoice` / strumento messaggio `asVoice`, incluse le risposte di note vocali TTS).
Gli allegati MP3 ordinari restano file normali. Se `ffmpeg` manca o
la conversione non riesce, OpenClaw ripiega su un allegato file e registra il motivo.

### Thread e risposte

- ✅ Risposte inline
- ✅ Risposte in thread
- ✅ Le risposte multimediali restano consapevoli del thread quando rispondono a un messaggio in thread

Per `groupSessionScope: "group_topic"` e `"group_topic_sender"`, i gruppi argomento
nativi Feishu/Lark usano l'evento `thread_id` (`omt_*`) come chiave canonica
della sessione argomento. Se un evento nativo di avvio argomento omette `thread_id`, OpenClaw
lo integra da Feishu prima di instradare il turno. Le risposte di gruppo normali che
OpenClaw trasforma in thread continuano a usare l'ID del messaggio radice della risposta (`om_*`), così il
primo turno e il turno successivo restano nella stessa sessione.

---

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento della chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) - routing della sessione per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
