---
read_when:
    - Si desidera connettere un bot Feishu/Lark
    - Si sta configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T13:49:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw si connette a Feishu/Lark (la piattaforma di collaborazione completa) tramite il Plugin ufficiale `@openclaw/feishu`: messaggi diretti al bot, chat di gruppo, risposte in streaming tramite schede e strumenti per documenti, wiki, drive e Bitable di Feishu.

**Stato:** pronto per la produzione per messaggi diretti al bot e chat di gruppo. WebSocket è il trasporto eventi predefinito (non è necessario un URL pubblico); la modalità Webhook è facoltativa.

## Avvio rapido

<Note>
Richiede OpenClaw 2026.5.29 o versione successiva. Eseguire `openclaw --version` per verificare. Eseguire l'aggiornamento con `openclaw update`.
</Note>

<Steps>
  <Step title="Eseguire la procedura guidata di configurazione del canale">
  ```bash
  openclaw channels login --channel feishu
  ```
  Il comando installa il Plugin `@openclaw/feishu` se non è presente, quindi guida nella configurazione:

- **Configurazione manuale**: incollare un App ID e un App Secret da Feishu Open Platform (`https://open.feishu.cn`) o Lark Developer (`https://open.larksuite.com`).
- **Configurazione tramite QR**: scansionare un codice QR nell'app Feishu per creare automaticamente un bot. Questo flusso limita i messaggi diretti al proprio account (`dmPolicy: "allowlist"` con il proprio `open_id`).

La procedura guidata richiede anche il dominio API (Feishu o Lark) e la politica dei gruppi. Se l'app mobile Feishu nazionale non reagisce al codice QR, eseguire nuovamente la configurazione e scegliere quella manuale.
</Step>

  <Step title="Al termine della configurazione, riavviare il Gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Controllo degli accessi

### Messaggi diretti

Configurare `channels.feishu.dmPolicy` (valore predefinito: `pairing`) per controllare chi può inviare messaggi diretti al bot:

| Valore         | Comportamento                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Gli utenti sconosciuti ricevono un codice di associazione; approvare tramite CLI                                                         |
| `"allowlist"` | Possono conversare solo gli utenti elencati in `allowFrom`                                                                     |
| `"open"`      | Messaggi diretti pubblici; la convalida della configurazione richiede che `allowFrom` includa `"*"`. Le voci senza caratteri jolly continuano a restringere l'accesso |

**Approvare una richiesta di associazione:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Politica dei gruppi** (`channels.feishu.groupPolicy`, valore predefinito: `allowlist`):

| Valore         | Comportamento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Risponde a tutti i messaggi nei gruppi                                                            |
| `"allowlist"` | Risponde solo ai gruppi in `groupAllowFrom` o configurati esplicitamente in `groups.<chat_id>` |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo; le voci esplicite `groups.<chat_id>` non sostituiscono questa impostazione         |

**Requisito di menzione** (`channels.feishu.requireMention`):

- Impostazione predefinita: è richiesta una @menzione, tranne quando la politica effettiva del gruppo è `"open"`; in tal caso, il valore predefinito è `false`, affinché i messaggi che non possono contenere menzioni (ad esempio le immagini) raggiungano comunque l'agente.
- Impostare esplicitamente `true` o `false` per sostituire il valore; impostazione specifica per gruppo: `channels.feishu.groups.<chat_id>.requireMention`.
- Le menzioni di sola trasmissione `@all` e `@_all` non sono considerate menzioni del bot. Un messaggio che menziona sia `@all` sia direttamente il bot viene comunque considerato una menzione del bot.

## Esempi di configurazione dei gruppi

### Consentire tutti i gruppi senza richiedere una @menzione

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### Consentire tutti i gruppi richiedendo comunque una @menzione

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

### Consentire solo gruppi specifici

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

In modalità `allowlist`, è inoltre possibile ammettere un gruppo aggiungendo una voce esplicita `groups.<chat_id>`. Le voci esplicite non sostituiscono `groupPolicy: "disabled"`. Le impostazioni predefinite con caratteri jolly in `groups.*` configurano i gruppi corrispondenti, ma non li ammettono autonomamente.

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

### Limitare i mittenti all'interno di un gruppo

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

`channels.feishu.groupSenderAllowFrom` imposta lo stesso elenco di mittenti consentiti per tutti i gruppi; un'impostazione `allowFrom` specifica per gruppo ha la precedenza.

<a id="get-groupuser-ids"></a>

## Ottenere gli ID di gruppi e utenti

### ID dei gruppi (`chat_id`, formato: `oc_xxx`)

Aprire il gruppo in Feishu/Lark, fare clic sull'icona del menu nell'angolo superiore destro e accedere a **Settings**. L'ID del gruppo (`chat_id`) è riportato nella pagina delle impostazioni.

![Ottenere l'ID del gruppo](/images/feishu-get-group-id.png)

### ID degli utenti (`open_id`, formato: `ou_xxx`)

Avviare il Gateway, inviare un messaggio diretto al bot, quindi controllare i log:

```bash
openclaw logs --follow
```

Cercare `open_id` nell'output dei log. È inoltre possibile controllare le richieste di associazione in sospeso:

```bash
openclaw pairing list feishu
```

## Comandi comuni

| Comando   | Descrizione                 |
| --------- | --------------------------- |
| `/status` | Mostra lo stato del bot             |
| `/reset`  | Reimposta la sessione corrente   |
| `/model`  | Mostra o cambia il modello di IA |

<Note>
Feishu/Lark non supporta menu nativi per i comandi slash, quindi occorre inviarli come messaggi di testo normale.
</Note>

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurarsi che il bot sia aggiunto al gruppo
2. Assicurarsi di @menzionare il bot (impostazione predefinita obbligatoria)
3. Verificare che `groupPolicy` non sia `"disabled"`
4. Controllare i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurarsi che il bot sia pubblicato e approvato in Feishu Open Platform / Lark Developer
2. Assicurarsi che la sottoscrizione agli eventi includa `im.message.receive_v1`
3. Assicurarsi che sia selezionata la **persistent connection** (WebSocket)
4. Assicurarsi che siano concessi tutti gli ambiti di autorizzazione richiesti
5. Assicurarsi che il Gateway sia in esecuzione: `openclaw gateway status`
6. Controllare i log: `openclaw logs --follow`

### La configurazione tramite QR non reagisce nell'app mobile Feishu

1. Eseguire nuovamente la configurazione: `openclaw channels login --channel feishu`
2. Scegliere la configurazione manuale
3. In Feishu Open Platform, creare un'app personalizzata e copiarne l'App ID e l'App Secret
4. Incollare queste credenziali nella procedura guidata di configurazione

### App Secret divulgato

1. Reimpostare l'App Secret in Feishu Open Platform / Lark Developer
2. Aggiornare il valore nella configurazione
3. Riavviare il Gateway: `openclaw gateway restart`

## Configurazione avanzata

### Account multipli

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

`defaultAccount` controlla quale account viene utilizzato quando le API in uscita non specificano un `accountId`. Le voci degli account ereditano le impostazioni di primo livello; la maggior parte delle chiavi di primo livello può essere sostituita per ciascun account.
`accounts.<id>.tts` usa la stessa struttura di `messages.tts` e viene unito in profondità alla configurazione TTS globale, consentendo alle configurazioni Feishu con più bot di mantenere globalmente le credenziali condivise dei provider e sostituire per ciascun account solo la voce, il modello, la persona o la modalità automatica.

### Limiti dei messaggi

- `textChunkLimit` - dimensione dei segmenti di testo in uscita (valore predefinito: `4000` caratteri)
- `streaming.chunkMode` - `"length"` (valore predefinito) divide al raggiungimento del limite; `"newline"` preferisce i confini delle nuove righe
- `mediaMaxMb` - limite di caricamento/scaricamento dei contenuti multimediali (valore predefinito: `30` MB)

### Streaming

Feishu/Lark supporta le risposte in streaming tramite schede interattive (API di streaming Card Kit). Quando la funzionalità è abilitata, il bot aggiorna la scheda in tempo reale durante la generazione del testo.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

Impostare `streaming.mode: "off"` per inviare la risposta completa in un unico messaggio; anche `renderMode: "raw"` (testo normale anziché schede) disabilita le schede in streaming. `streaming.block.enabled` è disattivato per impostazione predefinita; abilitarlo solo quando si desidera inviare i blocchi completati dell'assistente prima della risposta finale. Il valore booleano obsoleto `streaming` e le chiavi non nidificate `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` vengono migrati a questa struttura nidificata tramite `openclaw doctor --fix`.

### Ottimizzazione delle quote

Ridurre il numero di chiamate alle API Feishu/Lark tramite due flag facoltativi:

- `typingIndicator` (valore predefinito `true`): impostare `false` per ignorare le chiamate di reazione alla digitazione
- `resolveSenderNames` (valore predefinito `true`): impostare `false` per ignorare le ricerche del profilo del mittente

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

### Ambito delle sessioni di gruppo e thread degli argomenti

`channels.feishu.groupSessionScope` (a livello principale, per account o per gruppo) controlla il modo in cui i messaggi di gruppo vengono associati alle sessioni dell'agente:

| Valore                  | Sessione                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (valore predefinito)    | Una sessione per chat di gruppo                                       |
| `"group_sender"`       | Una sessione per (gruppo + mittente)                                 |
| `"group_topic"`        | Una sessione per thread dell'argomento; in alternativa usa la sessione del gruppo    |
| `"group_topic_sender"` | Una sessione per (argomento + mittente); in alternativa usa (gruppo + mittente) |

Per gli ambiti degli argomenti, i gruppi di argomenti nativi di Feishu/Lark usano l'evento `thread_id` (`omt_*`) come chiave canonica della sessione dell'argomento. Se un evento iniziale di un argomento nativo omette `thread_id`, OpenClaw lo recupera da Feishu prima di instradare il turno. Le normali risposte di gruppo che OpenClaw trasforma in thread continuano a usare l'ID del messaggio radice della risposta (`om_*`), affinché il primo turno e quelli successivi rimangano nella stessa sessione.

Impostare `replyInThread: "enabled"` (a livello principale o per gruppo) per fare in modo che le risposte del bot creino o continuino un thread di argomento Feishu anziché rispondere in linea. `topicSessionMode` è il predecessore deprecato di `groupSessionScope`; preferire `groupSessionScope`.

### Strumenti per l'area di lavoro Feishu

Il Plugin include strumenti per agenti dedicati a documenti, chat, base di conoscenza, archiviazione cloud, autorizzazioni e Bitable di Feishu, oltre alle Skills corrispondenti (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Le famiglie di strumenti sono controllate da `channels.feishu.tools`:

| Chiave          | Strumenti                                     | Valore predefinito  |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | operazioni sui documenti di `feishu_doc`              | `true`              |
| `tools.chat`    | informazioni sulla chat di `feishu_chat` + query sui membri      | `true`              |
| `tools.wiki`    | knowledge base di `feishu_wiki` (richiede `doc`) | `true`              |
| `tools.drive`   | archiviazione cloud di `feishu_drive`                  | `true`              |
| `tools.perm`    | gestione delle autorizzazioni di `feishu_perm`           | `false` (sensibile) |
| `tools.scopes`  | diagnostica degli ambiti dell'app di `feishu_app_scopes`     | `true`              |
| `tools.bitable` | operazioni Bitable/Base di `feishu_bitable_*`    | `true`              |

`tools.base` è un alias di `tools.bitable`; quando sono impostati entrambi, prevale il valore esplicito di `bitable`. Le limitazioni per account si trovano in `accounts.<id>.tools`.

Concedere `drive:drive.metadata:readonly` per le ricerche dirette di `feishu_drive info` al di fuori della directory
radice, a meno che l'app non disponga già dell'ambito completo `drive:drive`. Senza nessuno dei due ambiti, `info`
mantiene disponibile la ricerca legacy nella directory radice tramite `drive:drive:readonly`.

### Sessioni ACP

Feishu/Lark supporta ACP per i messaggi diretti e i messaggi nei thread di gruppo. ACP su Feishu/Lark è basato su comandi testuali: non sono disponibili menu nativi per i comandi slash, quindi utilizzare direttamente i messaggi `/acp ...` nella conversazione.

#### Associazione ACP persistente

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

#### Avvio di ACP dalla chat

In un messaggio diretto o thread di Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funziona per i messaggi diretti e per i messaggi nei thread di Feishu/Lark. I messaggi successivi nella conversazione associata vengono instradati direttamente a tale sessione ACP.

### Instradamento multi-agente

Utilizzare `bindings` per instradare i messaggi diretti o i gruppi di Feishu/Lark verso agenti diversi.

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

Campi di instradamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (messaggio diretto) o `"group"` (chat di gruppo)
- `match.peer.id`: Open ID dell'utente (`ou_xxx`) o ID del gruppo (`oc_xxx`)

Per suggerimenti sulla ricerca, consultare [Ottenere gli ID di gruppi/utenti](#get-groupuser-ids).

## Isolamento dell'agente per utente (creazione dinamica degli agenti)

Abilitare `dynamicAgentCreation` per creare automaticamente **istanze di agente isolate** per ciascun utente dei messaggi diretti. Ogni utente dispone di:

- Directory di lavoro indipendente
- `USER.md` / `SOUL.md` / `MEMORY.md` separati
- Cronologia delle conversazioni privata
- Skills e stato isolati

Questa funzionalità è essenziale per i bot pubblici nei quali si desidera offrire a ogni utente un'esperienza privata con il proprio assistente IA.

<Note>
Le associazioni dinamiche includono il valore `accountId` normalizzato di Feishu, pertanto gli account predefiniti e quelli denominati instradano ogni mittente verso l'agente dinamico corretto.

Se in una versione precedente un account denominato ha creato un agente dinamico senza ambito, tale agente legacy viene comunque conteggiato nel limite `maxAgents`. Prima di rimuoverlo, verificare che non sia utilizzato dall'account predefinito oppure aumentare temporaneamente `maxAgents`; OpenClaw non può determinare in modo sicuro quale account possieda uno stato legacy ambiguo.
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
    // Fondamentale: rende il messaggio diretto di ogni utente la sua "sessione principale"
    // Carica automaticamente USER.md / SOUL.md / MEMORY.md
    // Per un isolamento più forte, utilizzare invece "per-channel-peer"
    dmScope: "main",
  },
}
```

### Funzionamento

Quando un nuovo utente invia il suo primo messaggio diretto:

1. Il canale genera un `agentId` univoco: `feishu-{user_open_id}` per l'account predefinito oppure un digest dell'identità limitato e con prefisso dell'account per un account denominato
2. Crea una nuova directory di lavoro nel percorso `workspaceTemplate`
3. Registra l'agente e crea un'associazione per questo utente
4. L'helper della directory di lavoro garantisce la presenza dei file di bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md` e così via) al primo accesso
5. Instrada tutti i messaggi futuri di questo utente verso il suo agente dedicato

### Opzioni di configurazione

| Impostazione                                             | Descrizione                                | Valore predefinito                  |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Abilita la creazione automatica di agenti per utente   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modello di percorso per le directory di lavoro degli agenti dinamici | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modello del nome della directory dell'agente              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Numero massimo di agenti dinamici da creare | illimitato                            |

Variabili del modello:

- `{agentId}` - l'ID dell'agente generato (ad esempio, `feishu-ou_xxxxxx` o `feishu-support-<identity_digest>`)
- `{userId}` - l'open_id Feishu del mittente (ad esempio, `ou_xxxxxx`)

### Ambito della sessione

`session.dmScope` controlla il modo in cui i messaggi diretti vengono associati alle sessioni dell'agente. Si tratta di un'**impostazione globale** che interessa tutti i canali.

| Valore                       | Comportamento                                                       | Ideale per                                                          |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Il messaggio diretto di ogni utente viene associato alla sessione principale del relativo agente                   | Bot per singolo utente in cui si desidera il caricamento automatico di `USER.md` / `SOUL.md` |
| `"per-peer"`                 | Ogni interlocutore dispone di una sessione separata (indipendentemente dal canale)           | Isolamento basato esclusivamente sull'identità del mittente                            |
| `"per-channel-peer"`         | Ogni combinazione (canale + utente) dispone di una sessione separata           | Bot pubblici multiutente che richiedono un isolamento più forte                  |
| `"per-account-channel-peer"` | Ogni combinazione (account + canale + utente) dispone di una sessione separata | Bot multi-account che richiedono l'isolamento delle sessioni a livello di account         |

**Compromesso**: l'utilizzo di `"main"` abilita il caricamento automatico dei file di bootstrap (`USER.md`, `SOUL.md`, `MEMORY.md`), ma comporta che tutti i messaggi diretti su tutti i canali condividano lo stesso schema di chiavi di sessione. Per i bot pubblici multiutente in cui l'isolamento è più importante del caricamento automatico dei file di bootstrap, considerare `"per-channel-peer"` e gestire manualmente i file di bootstrap.

<Note>
Utilizzare `"per-account-channel-peer"` quando gli account Feishu denominati devono mantenere sessioni separate per lo stesso mittente. Le associazioni dinamiche preservano l'ambito dell'account.
</Note>

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
    // Scegliere dmScope in base alle esigenze di isolamento:
    // "main" per il caricamento automatico del bootstrap, "per-channel-peer" per un isolamento più forte
    dmScope: "main",
  },
  bindings: [], // Vuoto: gli agenti dinamici si associano automaticamente
}
```

### Verifica

Controllare i log del Gateway per verificare che la creazione dinamica funzioni:

```text
feishu: creazione dell'agente dinamico "feishu-ou_xxxxxx" per l'utente ou_xxxxxx
  directory di lavoro: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  directory dell'agente: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Elencare tutte le directory di lavoro create:

```bash
ls -la ~/.openclaw/workspace-*
```

### Note

- **Isolamento della directory di lavoro**: ogni utente dispone della propria directory di lavoro e istanza dell'agente. Nel normale flusso di messaggistica, gli utenti non possono vedere la cronologia delle conversazioni o i file degli altri utenti.
- **Confine di sicurezza**: si tratta di un meccanismo di isolamento del contesto di messaggistica, non di un confine di sicurezza tra co-tenant ostili. Il processo dell'agente e l'ambiente host sono condivisi.
- **Le scritture della configurazione devono rimanere abilitate**: la creazione dinamica degli agenti scrive agenti e associazioni nella configurazione; viene ignorata quando `channels.feishu.configWrites` è `false` (valore predefinito: abilitato).
- **`bindings` deve essere vuoto**: gli agenti dinamici registrano automaticamente le proprie associazioni
- **Percorso di aggiornamento**: le associazioni manuali esistenti continuano a funzionare insieme agli agenti dinamici
- **`session.dmScope` è globale**: interessa tutti i canali, non soltanto Feishu

## Riferimento per la configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                                             | Descrizione                                                                          | Predefinito                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Abilita/disabilita il canale                                                         | `true`                               |
| `channels.feishu.domain`                                 | Dominio API (`feishu`, `lark` o un URL di base `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Trasporto degli eventi (`websocket` o `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Account predefinito per l'instradamento in uscita                                    | `default`                            |
| `channels.feishu.verificationToken`                      | Obbligatorio per la modalità Webhook                                                 | -                                    |
| `channels.feishu.encryptKey`                             | Obbligatorio per la modalità Webhook                                                 | -                                    |
| `channels.feishu.webhookPath`                            | Percorso della route del Webhook                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host di binding del Webhook                                                          | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Porta di binding del Webhook                                                         | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID dell'app                                                                          | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Segreto dell'app                                                                     | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Sostituzione del dominio per account                                                 | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Sostituzione TTS per account                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Criterio per i messaggi diretti (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Elenco consentiti dei messaggi diretti (elenco open_id)                              | -                                    |
| `channels.feishu.groupPolicy`                            | Criterio per i gruppi (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Elenco consentiti dei gruppi                                                         | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Elenco consentiti dei mittenti applicato a tutti i gruppi                            | -                                    |
| `channels.feishu.requireMention`                         | Richiede una @menzione nei gruppi                                                    | `true` (`false` quando il criterio è `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Sostituzione della @menzione per gruppo; gli ID espliciti ammettono inoltre il gruppo nella modalità elenco consentiti     | ereditato                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Abilita/disabilita un gruppo specifico                                               | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Elenco consentiti dei mittenti per gruppo (sostituisce `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Mappatura delle sessioni di gruppo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Le risposte del bot creano/continuano thread di argomenti (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eventi di reazione in entrata (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Abilita la creazione automatica di agenti per utente                                 | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modello di percorso per gli spazi di lavoro degli agenti dinamici                    | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modello del nome della directory dell'agente                                         | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Numero massimo di agenti dinamici da creare                                          | illimitato                           |
| `channels.feishu.textChunkLimit`                         | Dimensione dei blocchi dei messaggi                                                  | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Suddivisione in blocchi (`length` o `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limite delle dimensioni dei contenuti multimediali                                   | `30`                                 |
| `channels.feishu.renderMode`                             | Rendering delle risposte (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Output delle schede in streaming (`partial` o `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Streaming delle risposte per blocchi completati                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | Invia reazioni di digitazione                                                        | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Risolve i nomi visualizzati dei mittenti                                             | `true`                               |
| `channels.feishu.configWrites`                           | Consente scritture della configurazione avviate dal canale (necessarie per gli agenti dinamici)                     | `true`                               |
| `channels.feishu.tools.doc`                              | Abilita gli strumenti per i documenti                                                | `true`                               |
| `channels.feishu.tools.chat`                             | Abilita gli strumenti per le informazioni delle chat                                 | `true`                               |
| `channels.feishu.tools.wiki`                             | Abilita gli strumenti della base di conoscenza (richiede `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Abilita gli strumenti di archiviazione cloud                                         | `true`                               |
| `channels.feishu.tools.perm`                             | Abilita gli strumenti di gestione delle autorizzazioni                               | `false`                              |
| `channels.feishu.tools.scopes`                           | Abilita lo strumento diagnostico degli ambiti dell'app                               | `true`                               |
| `channels.feishu.tools.bitable`                          | Abilita gli strumenti Bitable/Base                                                   | `true`                               |
| `channels.feishu.tools.base`                             | Alias di `channels.feishu.tools.bitable`; se sono impostati entrambi, prevale `bitable`     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Controllo degli strumenti Bitable/Base per account                                   | ereditato                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per account di `tools.bitable`                                                | ereditato                            |

## Tipi di messaggi supportati

### Ricezione

- ✅ Testo
- ✅ Testo formattato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/contenuti multimediali
- ✅ Adesivi

I messaggi audio Feishu/Lark in entrata vengono normalizzati come segnaposto multimediali anziché
come JSON `file_key` non elaborato. Quando `tools.media.audio` è configurato, OpenClaw
scarica la risorsa della nota vocale ed esegue la trascrizione audio condivisa prima del
turno dell'agente, in modo che l'agente riceva la trascrizione del parlato. Se Feishu include
direttamente il testo della trascrizione nel payload audio, tale testo viene utilizzato senza un'altra
chiamata ASR. Senza un provider di trascrizione audio, l'agente riceve comunque un
segnaposto `<media:audio>` insieme all'allegato salvato, non il payload non elaborato
della risorsa Feishu.

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/contenuti multimediali
- ✅ Schede interattive (inclusi gli aggiornamenti in streaming)
- ⚠️ Testo formattato (formattazione in stile post; non supporta tutte le funzionalità di creazione di Feishu/Lark)

I fumetti audio nativi di Feishu/Lark utilizzano il tipo di messaggio Feishu `audio` e richiedono
contenuti multimediali caricati in formato Ogg/Opus (`file_type: "opus"`). I contenuti multimediali `.opus` e `.ogg` esistenti
vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri formati probabilmente audio vengono
transcodificati in Ogg/Opus a 48kHz con `ffmpeg` solo quando la risposta richiede la consegna
vocale (`audioAsVoice` / strumento per i messaggi `asVoice`, incluse le risposte TTS sotto forma di nota
vocale). I normali allegati MP3 restano file ordinari. Se `ffmpeg` non è presente o
la conversione non riesce, OpenClaw ricorre a un allegato file e registra il motivo.

### Thread e risposte

- ✅ Risposte in linea
- ✅ Risposte nei thread
- ✅ Le risposte multimediali mantengono la consapevolezza del thread quando rispondono a un messaggio del thread

L'instradamento delle sessioni dei gruppi di argomenti è illustrato in
[Ambito delle sessioni di gruppo e thread di argomenti](#group-session-scope-and-topic-threads).

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
