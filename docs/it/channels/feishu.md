---
read_when:
    - Vuoi connettere un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:10:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark è una piattaforma di collaborazione tutto in uno in cui i team chattano, condividono documenti, gestiscono calendari e lavorano insieme.

**Stato:** pronta per la produzione per DM del bot + chat di gruppo. WebSocket è la modalità predefinita; la modalità webhook è opzionale.

---

## Avvio rapido

<Note>
Richiede OpenClaw 2026.5.29 o versione successiva. Esegui `openclaw --version` per verificare. Aggiorna con `openclaw update`.
</Note>

<Steps>
  <Step title="Esegui la procedura guidata di configurazione del canale">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scegli la configurazione manuale per incollare un App ID e un App Secret da Feishu Open Platform, oppure scegli la configurazione QR per creare automaticamente un bot. Se l'app mobile domestica Feishu non reagisce al codice QR, riesegui la configurazione e scegli la configurazione manuale.
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

- `"pairing"` - gli utenti sconosciuti ricevono un codice di associazione; approva tramite CLI
- `"allowlist"` - possono chattare solo gli utenti elencati in `allowFrom`
- `"open"` - consenti DM pubblici solo quando `allowFrom` include `"*"`; con voci restrittive, possono chattare solo gli utenti corrispondenti
- `"disabled"` - disabilita tutti i DM

**Approva una richiesta di associazione:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Criterio di gruppo** (`channels.feishu.groupPolicy`):

| Valore        | Comportamento                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `"open"`      | Risponde a tutti i messaggi nei gruppi                                                                      |
| `"allowlist"` | Risponde solo ai gruppi in `groupAllowFrom` o configurati esplicitamente sotto `groups.<chat_id>`          |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo; le voci esplicite `groups.<chat_id>` non sostituiscono questo valore |

Predefinito: `allowlist`

**Requisito di menzione** (`channels.feishu.requireMention`):

- `true` - richiede @menzione (predefinito)
- `false` - risponde senza @menzione
- Override per gruppo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` solo broadcast non sono trattati come menzioni del bot. Un messaggio che menziona sia `@all` sia direttamente il bot conta comunque come menzione del bot.

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, senza @menzione obbligatoria

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Consenti tutti i gruppi, richiedi comunque @menzione

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

In modalità `allowlist`, puoi anche ammettere un gruppo aggiungendo una voce esplicita `groups.<chat_id>`. Le voci esplicite non sostituiscono `groupPolicy: "disabled"`. I valori predefiniti con carattere jolly sotto `groups.*` configurano i gruppi corrispondenti, ma non ammettono gruppi da soli.

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

| Comando   | Descrizione                       |
| --------- | --------------------------------- |
| `/status` | Mostra lo stato del bot           |
| `/reset`  | Reimposta la sessione corrente    |
| `/model`  | Mostra o cambia il modello di IA  |

<Note>
Feishu/Lark non supporta menu nativi di comandi slash, quindi inviali come messaggi di testo semplice.
</Note>

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia aggiunto al gruppo
2. Assicurati di @menzionare il bot (obbligatorio per impostazione predefinita)
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
3. In Feishu Open Platform, crea un'app autonoma e copia il suo App ID e App Secret
4. Incolla queste credenziali nella procedura guidata di configurazione

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
`accounts.<id>.tts` usa la stessa forma di `messages.tts` e si fonde in profondità con
la configurazione TTS globale, quindi le configurazioni Feishu multi-bot possono mantenere globalmente
le credenziali dei provider condivisi sovrascrivendo solo voce, modello, persona o modalità automatica
per account.

### Limiti dei messaggi

- `textChunkLimit` - dimensione dei blocchi di testo in uscita (predefinito: `2000` caratteri)
- `mediaMaxMb` - limite di caricamento/scaricamento dei media (predefinito: `30` MB)

### Streaming

Feishu/Lark supporta le risposte in streaming tramite schede interattive. Quando è abilitato, il bot aggiorna la scheda in tempo reale mentre genera testo.

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

Imposta `streaming: false` per inviare la risposta completa in un unico messaggio. `blockStreaming` è disattivato per impostazione predefinita; abilitalo solo quando vuoi che i blocchi completati dell'assistente vengano inviati prima della risposta finale.

### Ottimizzazione della quota

Riduci il numero di chiamate API Feishu/Lark con due flag opzionali:

- `typingIndicator` (predefinito `true`): imposta `false` per saltare le chiamate di reazione di digitazione
- `resolveSenderNames` (predefinito `true`): imposta `false` per saltare le ricerche dei profili dei mittenti

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

Feishu/Lark supporta ACP per DM e messaggi nei thread di gruppo. ACP di Feishu/Lark è guidato da comandi testuali - non ci sono menu nativi di comandi slash, quindi usa i messaggi `/acp ...` direttamente nella conversazione.

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

### Routing multi-agent

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

Vedi [Ottieni ID di gruppo/utente](#get-groupuser-ids) per suggerimenti sulla ricerca.

---

## Isolamento agente per utente (Creazione dinamica di agenti)

Abilita `dynamicAgentCreation` per creare automaticamente **istanze di agente isolate** per ogni utente DM. Ogni utente ottiene il proprio:

- Directory workspace indipendente
- `USER.md` / `SOUL.md` / `MEMORY.md` separati
- Cronologia conversazioni privata
- Skills e stato isolati

Questo è essenziale per i bot pubblici in cui vuoi che ogni utente abbia la propria esperienza privata di assistente IA.

<Note>
I binding dinamici includono il `accountId` Feishu normalizzato, quindi gli account predefiniti e nominati instradano ogni mittente all'agente dinamico corretto.

Se un account nominato ha creato un agente dinamico senza ambito in una versione precedente, quell'agente legacy conta ancora per `maxAgents`. Conferma che non sia usato dall'account predefinito prima di rimuoverlo, oppure aumenta temporaneamente `maxAgents`; OpenClaw non può dedurre in sicurezza quale account possieda uno stato legacy ambiguo.
</Note>

### Configurazione rapida

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Come funziona

Quando un nuovo utente invia il suo primo DM:

1. Il canale genera un `agentId` univoco: `feishu-{user_open_id}` per l'account predefinito, oppure un digest di identità limitato con prefisso dell'account per un account nominato
2. Crea un nuovo workspace nel percorso `workspaceTemplate`
3. Registra l'agente e crea un binding per questo utente
4. L'helper del workspace garantisce i file di bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md`, ecc.) al primo accesso
5. Instrada tutti i messaggi futuri di questo utente al suo agente dedicato

### Opzioni di configurazione

| Impostazione                                             | Descrizione                                      | Predefinito                          |
| -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Abilita la creazione automatica di agent per utente | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modello di percorso per le aree di lavoro dinamiche degli agent | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modello del nome della directory dell'agent      | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Numero massimo di agent dinamici da creare       | illimitato                           |

Variabili del modello:

- `{agentId}` - l'ID agent generato (ad esempio, `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}` - l'open_id Feishu del mittente (ad esempio, `ou_xxxxxx`)

### Ambito della sessione

`session.dmScope` controlla il modo in cui i messaggi diretti vengono mappati alle sessioni agent. Questa è un'**impostazione globale** che interessa tutti i canali.

| Valore                       | Comportamento                                                     | Ideale per                                                         |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Il DM di ogni utente viene mappato alla sessione principale del suo agent | Bot monoutente in cui vuoi caricare automaticamente `USER.md` / `SOUL.md` |
| `"per-channel-peer"`         | Ogni combinazione (canale + utente) ottiene una sessione separata | Bot pubblici multiutente che richiedono un isolamento più forte    |
| `"per-account-channel-peer"` | Ogni combinazione (account + canale + utente) ottiene una sessione separata | Bot multi-account che richiedono isolamento delle sessioni a livello di account |

**Compromesso**: usare `"main"` abilita il caricamento automatico dei file di bootstrap (`USER.md`, `SOUL.md`, `MEMORY.md`), ma significa che tutti i DM su tutti i canali condividono lo stesso schema di chiave di sessione. Per bot pubblici multiutente in cui l'isolamento conta più del caricamento automatico del bootstrap, considera `"per-channel-peer"` e gestisci manualmente i file di bootstrap.

<Note>
Usa `"per-account-channel-peer"` quando gli account Feishu denominati devono mantenere sessioni separate per lo stesso mittente. I binding dinamici preservano l'ambito dell'account.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Distribuzione multiutente tipica

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Verifica

Controlla i log del Gateway per confermare che la creazione dinamica funzioni:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Elenca tutte le aree di lavoro create:

```bash
ls -la ~/.openclaw/workspace-*
```

### Note

- **Isolamento dell'area di lavoro**: ogni utente ottiene la propria directory dell'area di lavoro e la propria istanza agent. Gli utenti non possono vedere la cronologia delle conversazioni o i file degli altri nel normale flusso di messaggistica.
- **Confine di sicurezza**: questo è un meccanismo di isolamento del contesto di messaggistica, non un confine di sicurezza contro co-tenant ostili. Il processo agent e l'ambiente host sono condivisi.
- **`bindings` deve essere vuoto**: gli agent dinamici registrano automaticamente i propri binding
- **Percorso di upgrade**: i binding manuali esistenti continuano a funzionare insieme agli agent dinamici
- **`session.dmScope` è globale**: questo interessa tutti i canali, non solo Feishu

---

## Riferimento di configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                                             | Descrizione                                                                    | Predefinito                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Abilita/disabilita il canale                                                   | `true`                               |
| `channels.feishu.domain`                                 | Dominio API (`feishu` o `lark`)                                                | `feishu`                             |
| `channels.feishu.connectionMode`                         | Trasporto degli eventi (`websocket` o `webhook`)                               | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Account predefinito per l'instradamento in uscita                              | `default`                            |
| `channels.feishu.verificationToken`                      | Richiesto per la modalità webhook                                              | -                                    |
| `channels.feishu.encryptKey`                             | Richiesto per la modalità webhook                                              | -                                    |
| `channels.feishu.webhookPath`                            | Percorso della route Webhook                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host di bind del Webhook                                                       | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Porta di bind del Webhook                                                      | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID app                                                                         | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Segreto app                                                                    | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Override del dominio per account                                               | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Override TTS per account                                                       | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Criterio DM                                                                    | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista consentita DM (elenco open_id)                                           | -                                    |
| `channels.feishu.groupPolicy`                            | Criterio di gruppo                                                             | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista consentita di gruppo                                                     | -                                    |
| `channels.feishu.requireMention`                         | Richiedi @mention nei gruppi                                                   | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Override @mention per gruppo; gli ID espliciti ammettono anche il gruppo in modalità allowlist | ereditato                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Abilita/disabilita un gruppo specifico                                         | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Abilita la creazione automatica di agent per utente                            | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modello di percorso per le aree di lavoro dinamiche degli agent                | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modello del nome della directory dell'agent                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Numero massimo di agent dinamici da creare                                     | illimitato                           |
| `channels.feishu.textChunkLimit`                         | Dimensione dei segmenti di messaggio                                           | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limite di dimensione dei contenuti multimediali                                | `30`                                 |
| `channels.feishu.streaming`                              | Output delle schede in streaming                                               | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming delle risposte a blocchi completati                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | Invia reazioni di digitazione                                                  | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Risolvi i nomi visualizzati dei mittenti                                       | `true`                               |
| `channels.feishu.tools.bitable`                          | Abilita gli strumenti Bitable/Base                                             | `true`                               |
| `channels.feishu.tools.base`                             | Alias per `channels.feishu.tools.bitable`; `bitable` esplicito prevale quando sono impostati entrambi | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Gate degli strumenti Bitable/Base per account                                  | ereditato                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per account di `tools.bitable`                                           | ereditato                            |

---

## Tipi di messaggio supportati

### Ricezione

- ✅ Testo
- ✅ Testo avanzato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/contenuti multimediali
- ✅ Sticker

I messaggi audio Feishu/Lark in ingresso vengono normalizzati come placeholder multimediali invece
che come JSON `file_key` grezzo. Quando `tools.media.audio` è configurato, OpenClaw
scarica la risorsa della nota vocale ed esegue la trascrizione audio condivisa prima del
turno dell'agent, così l'agent riceve la trascrizione del parlato. Se Feishu include
testo della trascrizione direttamente nel payload audio, quel testo viene usato senza un'altra
chiamata ASR. Senza un provider di trascrizione audio, l'agent riceve comunque un
placeholder `<media:audio>` più l'allegato salvato, non il payload grezzo della risorsa
Feishu.

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Schede interattive (inclusi aggiornamenti in streaming)
- ⚠️ Testo ricco (formattazione in stile post; non supporta tutte le funzionalità di authoring di Feishu/Lark)

Le bolle audio native di Feishu/Lark usano il tipo di messaggio `audio` di Feishu e richiedono
media caricati in formato Ogg/Opus (`file_type: "opus"`). I media `.opus` e `.ogg` esistenti
vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri probabili formati audio
vengono transcodificati in Ogg/Opus a 48 kHz con `ffmpeg` solo quando la risposta richiede la
consegna vocale (`audioAsVoice` / strumento messaggio `asVoice`, incluse le risposte TTS con
nota vocale). Gli allegati MP3 ordinari restano file normali. Se `ffmpeg` manca o
la conversione non riesce, OpenClaw ripiega su un allegato file e registra il motivo.

### Thread e risposte

- ✅ Risposte in linea
- ✅ Risposte nei thread
- ✅ Le risposte con media restano consapevoli del thread quando rispondono a un messaggio in un thread

Per `groupSessionScope: "group_topic"` e `"group_topic_sender"`, i gruppi argomento
nativi di Feishu/Lark usano il `thread_id` dell'evento (`omt_*`) come chiave canonica
della sessione argomento. Se un evento nativo di avvio argomento omette `thread_id`, OpenClaw
lo idrata da Feishu prima di instradare il turno. Le normali risposte di gruppo che
OpenClaw trasforma in thread continuano a usare l'ID del messaggio radice della risposta (`om_*`) così
il primo turno e il turno successivo restano nella stessa sessione.

---

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Abbinamento](/it/channels/pairing) - flusso di autenticazione e abbinamento via DM
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
