---
read_when:
    - Configurazione dei criteri, delle liste di elementi consentiti o delle funzionalità sperimentali di `tools.*`
    - Registrazione di provider personalizzati o sostituzione degli URL di base
    - Configurazione di endpoint self-hosted compatibili con OpenAI
sidebarTitle: Tools and custom providers
summary: Configurazione degli strumenti (criteri, opzioni sperimentali, strumenti supportati da provider) e configurazione di provider personalizzati/URL di base
title: Configurazione — strumenti e provider personalizzati
x-i18n:
    generated_at: "2026-07-12T07:01:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Le chiavi di configurazione `tools.*` e la configurazione di provider personalizzati / URL di base. Per agenti, canali e altre chiavi di configurazione di primo livello, consulta il [riferimento per la configurazione](/it/gateway/configuration-reference).

## Strumenti

### Profili degli strumenti

`tools.profile` imposta un elenco di elementi consentiti di base prima di `tools.allow`/`tools.deny`:

<Note>
L'onboarding locale imposta per impostazione predefinita `tools.profile: "coding"` nelle nuove configurazioni locali quando non è definito (i profili espliciti esistenti vengono mantenuti).
</Note>

| Profilo     | Include                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Solo `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Nessuna restrizione (come quando non è definito)                                                                                                                                                                             |

`coding` e `messaging` consentono inoltre implicitamente `bundle-mcp` (server MCP configurati).

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Tutti gli strumenti integrati elencati sopra tranne `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (esclude gli strumenti dei plugin)    |
| `group:plugins`    | Strumenti appartenenti ai plugin caricati, inclusi i server MCP configurati esposti tramite `bundle-mcp`                                               |

`spawn_task` consente a un agente di programmazione di proporre un'attività di follow-up confermata senza avviarla. La Control UI mostra il titolo e il riepilogo come chip utilizzabile; una TUI supportata dal Gateway mostra una richiesta interattiva equivalente. Accettando una delle due opzioni, viene creata una nuova sessione con worktree gestito e le viene inviato il prompt completo, mentre il turno corrente prosegue. `dismiss_task` ritira un suggerimento ancora in sospeso tramite il `task_id` temporaneo restituito da `spawn_task`.

Gli strumenti vengono offerti solo quando la superficie operativa che avvia l'azione può ricevere e gestire gli eventi di suggerimento attività del Gateway. Le sessioni dei canali e le sessioni TUI locali/incorporate non li ricevono; i trasporti dei canali richiedono un'azione attività tipizzata e portabile prima di poter esporre questo flusso in sicurezza. I suggerimenti sono locali al processo e scompaiono al riavvio del Gateway. Entrambi gli strumenti rimangono nel profilo `coding` e in `group:sessions`, quindi i normali criteri `tools.allow` e `tools.deny` li configurano automaticamente quando la superficie li supporta.

### Strumenti MCP e dei plugin nei criteri degli strumenti della sandbox

I server MCP configurati vengono esposti come strumenti appartenenti ai plugin con l'ID plugin `bundle-mcp`. I normali profili degli strumenti possono consentirli, ma `tools.sandbox.tools` costituisce un controllo aggiuntivo per le sessioni in sandbox. Se la modalità sandbox è `"all"` o `"non-main"`, includi una delle seguenti voci nell'elenco degli strumenti consentiti della sandbox quando gli strumenti MCP/dei plugin devono essere visibili:

- `bundle-mcp` per i server MCP gestiti da OpenClaw definiti in `mcp.servers`
- l'ID plugin per uno specifico plugin nativo
- `group:plugins` per tutti gli strumenti appartenenti ai plugin caricati
- nomi esatti degli strumenti del server MCP o glob del server, come `outlook__send_mail` o `outlook__*`, quando vuoi consentire un solo server

I glob dei server utilizzano il prefisso del server MCP sicuro per il provider, non necessariamente la chiave `mcp.servers` grezza. I caratteri diversi da `[A-Za-z0-9_-]` diventano `-`, i nomi che non iniziano con una lettera ricevono il prefisso `mcp-` e i prefissi lunghi o duplicati possono essere troncati o ricevere un suffisso; ad esempio, `mcp.servers["Outlook Graph"]` utilizza un glob come `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Senza questa voce a livello di sandbox, il server MCP può comunque essere caricato correttamente mentre i suoi strumenti vengono filtrati prima della richiesta al provider. Usa `openclaw doctor` per rilevare questa configurazione nei server gestiti da OpenClaw definiti in `mcp.servers`. I server MCP caricati dai manifest dei plugin inclusi o da `.mcp.json` di Claude utilizzano lo stesso controllo della sandbox, ma questa diagnostica non elenca ancora tali origini; usa le stesse voci dell'elenco degli elementi consentiti se i relativi strumenti scompaiono nei turni in sandbox.

### `tools.codeMode`

`tools.codeMode` abilita la superficie generica della modalità codice di OpenClaw. Quando è abilitata
per un'esecuzione con strumenti, i normali strumenti di OpenClaw vengono spostati dietro il bridge del catalogo `tools.*`
nella sandbox e gli strumenti MCP sono disponibili tramite lo spazio dei nomi `MCP`
generato. Il modello normalmente vede `exec` e `wait`; gli strumenti come `computer`,
i cui risultati strutturati non possono attraversare il bridge solo JSON, rimangono diretti.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

È accettata anche la forma abbreviata:

```json5
{
  tools: { codeMode: true },
}
```

In modalità codice, le dichiarazioni MCP vengono esposte tramite la superficie virtuale di file API in sola lettura.
Il codice guest può chiamare `API.list("mcp")` e
`API.read("mcp/<server>.d.ts")` per esaminare le firme in stile TypeScript prima di
chiamare `MCP.<server>.<tool>()`. Consulta [Modalità codice](/it/reference/code-mode) per il
contratto di runtime, i limiti e i passaggi di debug.

### `tools.allow` / `tools.deny`

Criterio globale di autorizzazione/negazione degli strumenti (la negazione ha la precedenza). Non distingue tra maiuscole e minuscole e supporta i caratteri jolly `*`. Viene applicato anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` sono ID di strumenti distinti. `allow: ["write"]` abilita anche `apply_patch` per i modelli compatibili, ma `deny: ["write"]` non nega `apply_patch`. Per bloccare tutte le modifiche ai file, negare `group:fs` oppure elencare esplicitamente ogni strumento di modifica:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` e `alsoAllow` non possono essere impostati entrambi nello stesso ambito (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`): la convalida della configurazione lo impedisce. Unire le voci di `alsoAllow` in `allow`, oppure rimuovere `allow` e usare invece `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Limita ulteriormente gli strumenti per provider o modelli specifici. Ordine: profilo di base → profilo del provider → autorizzazione/negazione.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Limita gli strumenti per una specifica identità del richiedente. Si tratta di una misura di difesa in profondità aggiuntiva rispetto al controllo degli accessi al canale; i valori del mittente devono provenire dall'adattatore del canale, non dal testo del messaggio.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Le chiavi usano prefissi espliciti: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oppure `"*"`. Gli ID dei canali sono ID canonici di OpenClaw; gli alias come `teams` vengono normalizzati in `msteams`. Le chiavi legacy senza prefisso sono accettate solo come `id:`. L'ordine di corrispondenza è canale+ID, ID, e164, nome utente, nome e infine carattere jolly.

La configurazione per agente `agents.list[].tools.toolsBySender` sostituisce la corrispondenza globale del mittente quando trova una corrispondenza, anche con un criterio vuoto `{}`.

### `tools.elevated`

Controlla l'accesso con privilegi elevati a `exec` al di fuori della sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- La sostituzione per agente (`agents.list[].tools.elevated`) può solo imporre ulteriori restrizioni.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` con privilegi elevati ignora la sandbox e usa il percorso di uscita configurato (`gateway` per impostazione predefinita oppure `node` quando la destinazione di `exec` è `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

I valori mostrati sono quelli predefiniti, ad eccezione di `applyPatch.allowModels` (vuoto/non impostato per impostazione predefinita, il che significa che qualsiasi modello compatibile può usare `apply_patch`). `approvalRunningNoticeMs` emette un avviso di esecuzione in corso quando un'operazione `exec` soggetta ad approvazione dura a lungo; `0` lo disabilita.

### `tools.loopDetection`

I controlli di sicurezza sui cicli degli strumenti sono **disabilitati per impostazione predefinita**. Impostare `enabled: true` per attivare il rilevamento. Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sostituite per ciascun agente in `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Numero massimo di chiamate agli strumenti conservate nella cronologia per l'analisi dei cicli.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Soglia per gli avvisi relativa a schemi ripetuti senza avanzamento.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Blocca le chiamate ripetute allo stesso nome di strumento non disponibile o sconosciuto dopo questo numero di tentativi non riusciti.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Soglia di ripetizione più elevata per bloccare i cicli critici.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Soglia di arresto definitivo per qualsiasi sequenza senza avanzamento.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avvisa in caso di chiamate ripetute allo stesso strumento con gli stessi argomenti.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avvisa o blocca in caso di strumenti di polling noti (`process.poll`, `command_status` e così via).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avvisa o blocca in caso di schemi alternati a coppie senza avanzamento.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Numero di tentativi successivi alla Compaction automatica durante i quali la protezione resta attiva; l'esecuzione viene interrotta se l'agente ripete la stessa combinazione (strumento, argomenti, risultato) all'interno di tale intervallo.
</ParamField>

<Warning>
Se `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la convalida non riesce.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oppure variabile di ambiente BRAVE_API_KEY (provider Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // facoltativo; omettere per il rilevamento automatico
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

I valori mostrati sono quelli predefiniti, eccetto `provider` e `userAgent`. `maxResponseBytes` è limitato all'intervallo 32000–10000000; `maxChars` è limitato a `maxCharsCap` (aumentare `maxCharsCap` per consentire risposte più grandi).

### `tools.media`

Configura la comprensione dei contenuti multimediali in ingresso (immagini/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecato: i completamenti restano mediati dall'agente
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (valore predefinito `2`), `audio.maxBytes` (valore predefinito 20 MB) e `video.maxBytes` (valore predefinito 50 MB) sono mostrati con i rispettivi valori predefiniti; il valore predefinito di `image.maxBytes` è 10 MB. Timeout predefiniti delle richieste per funzionalità: immagine/audio `60` s, video `120` s.

<AccordionGroup>
  <Accordion title="Campi delle voci dei modelli multimediali">
    **Voce del provider** (`type: "provider"` oppure omesso):

    - `provider`: ID del provider API (`openai`, `anthropic`, `google`/`gemini`, `groq` e così via)
    - `model`: sostituzione dell'ID del modello
    - `profile` / `preferredProfile`: selezione del profilo di `auth-profiles.json`

    **Voce CLI** (`type: "cli"`):

    - `command`: eseguibile da avviare
    - `args`: argomenti basati su modello (supportano `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` e così via; `openclaw doctor --fix` migra i segnaposto deprecati `{input}` a `{{MediaPath}}`)

    **Campi comuni:**

    - `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Ogni Plugin del provider dichiara il proprio insieme predefinito di funzionalità; ad esempio, il provider `openai` incluso utilizza per impostazione predefinita immagine+audio, `anthropic`/`minimax` immagine, `google` immagine+audio+video e `groq` audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: sostituzioni per singola voce.
    - `tools.media.image.timeoutSeconds` e le corrispondenti voci `timeoutSeconds` del modello di immagini si applicano anche quando l'agente chiama esplicitamente lo strumento `image`. Per la comprensione delle immagini, questo timeout si applica alla richiesta stessa e non viene ridotto dal precedente lavoro di preparazione.
    - In caso di errore, si passa alla voce successiva.

    L'autenticazione del provider segue l'ordine standard: `auth-profiles.json` → variabili di ambiente → `models.providers.*.apiKey`.

    **Campi del completamento asincrono:**

    - `asyncCompletion.directSend`: flag di compatibilità deprecato. Le attività multimediali asincrone completate restano mediate dalla sessione del richiedente, in modo che l'agente riceva il risultato, decida come comunicarlo all'utente e utilizzi lo strumento per i messaggi quando la consegna all'origine lo richiede.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controlla quali sessioni possono essere destinatarie degli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

Valore predefinito: `tree` (sessione corrente + sessioni generate da essa, come i sottoagenti).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ambiti di visibilità">
    - `self`: solo la chiave della sessione corrente.
    - `tree`: sessione corrente + sessioni generate dalla sessione corrente (sottoagenti).
    - `agent`: qualsiasi sessione appartenente all'ID dell'agente corrente (può includere altri utenti se si eseguono sessioni per mittente con lo stesso ID agente).
    - `all`: qualsiasi sessione. La selezione tra agenti richiede comunque `tools.agentToAgent`.
    - Limitazione della sandbox: quando la sessione corrente è in una sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (valore predefinito), la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.
    - Quando il valore non è `all`, `sessions_list` include un campo compatto `visibility`
      che descrive la modalità effettiva e un avviso che alcune sessioni al di fuori
      dell'ambito corrente potrebbero essere omesse.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controlla il supporto degli allegati incorporati per `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // attivazione esplicita: impostare su true per consentire allegati di file incorporati
        maxTotalBytes: 5242880, // 5 MB totali per tutti i file
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // conserva gli allegati quando cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Note sugli allegati">
    - Gli allegati richiedono `enabled: true`.
    - Gli allegati dei sottoagenti vengono materializzati nell'area di lavoro figlia in `.openclaw/attachments/<uuid>/` con un file `.manifest.json`.
    - Gli allegati ACP sono limitati alle immagini e vengono inoltrati in linea al runtime ACP dopo aver superato gli stessi limiti relativi al numero di file, ai byte per file e ai byte totali.
    - Il contenuto degli allegati viene automaticamente oscurato nella persistenza della trascrizione.
    - Gli input Base64 vengono convalidati mediante controlli rigorosi dell'alfabeto e del riempimento, oltre a una protezione sulle dimensioni prima della decodifica.
    - I permessi dei file allegati dei sottoagenti sono `0700` per le directory e `0600` per i file.
    - La pulizia dei sottoagenti segue la policy `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag sperimentali degli strumenti integrati. Disattivati per impostazione predefinita, salvo quando si applica una regola di attivazione automatica per GPT-5 in modalità strict-agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // abilita update_plan sperimentale
    },
  },
}
```

- `planTool`: abilita lo strumento strutturato `update_plan` per monitorare attività non banali articolate in più passaggi.
- Valore predefinito: `false`, a meno che `agents.defaults.embeddedAgent.executionContract` (o una sostituzione per singolo agente) sia impostato su `"strict-agentic"` per un'esecuzione del provider `openai` con un ID modello della famiglia GPT-5 (ciò include anche le esecuzioni di OpenAI Codex CLI, poiché l'autenticazione e l'instradamento dei modelli di Codex risiedono nel provider `openai`). Impostare `true` per forzare l'attivazione dello strumento al di fuori di tale ambito oppure `false` per mantenerlo disattivato anche per le esecuzioni GPT-5 in modalità strict-agentic.
- Quando è abilitato, il prompt di sistema aggiunge anche indicazioni d'uso affinché il modello lo utilizzi solo per attività sostanziali e mantenga al massimo un passaggio `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modello predefinito per i sottoagenti generati. Se omesso, i sottoagenti ereditano il modello del chiamante.
- `allowAgents`: elenco di autorizzazione predefinito degli ID degli agenti di destinazione configurati per `sessions_spawn`, quando l'agente richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualsiasi destinazione configurata; valore predefinito: solo lo stesso agente). Le voci obsolete il cui agente è stato eliminato dalla configurazione vengono rifiutate da `sessions_spawn` e omesse da `agents_list`; eseguire `openclaw doctor --fix` per rimuoverle.
- `maxConcurrent`: numero massimo di esecuzioni simultanee di sottoagenti. Valore predefinito: `8`.
- `runTimeoutSeconds`: timeout (in secondi) per `sessions_spawn` quando il chiamante non specifica una propria sostituzione. Valore predefinito: `0` (nessun timeout); il valore `900` mostrato sopra è un valore comune ad attivazione esplicita, non quello predefinito integrato.
- `announceTimeoutMs`: timeout per singola chiamata (in millisecondi) per i tentativi di consegna degli annunci `agent` del Gateway. Valore predefinito: `120000`. I nuovi tentativi transitori possono rendere l'attesa totale dell'annuncio più lunga di un singolo timeout configurato.
- `archiveAfterMinutes`: minuti successivi al completamento di una sessione di un sottoagente prima che venga archiviata automaticamente. Valore predefinito: `60`; `0` disabilita l'archiviazione automatica.
- Policy degli strumenti per singolo sottoagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e URL di base

I Plugin dei provider pubblicano le proprie righe del catalogo dei modelli. Aggiungere provider personalizzati tramite `models.providers` nella configurazione oppure in `~/.openclaw/agents/<agentId>/agent/models.json`.

La configurazione di un `baseUrl` per un provider personalizzato/locale costituisce anche la decisione circoscritta di attendibilità della rete per le richieste HTTP dei modelli: OpenClaw consente l'origine esatta `scheme://host:port` attraverso il percorso di recupero protetto, senza aggiungere un'opzione di configurazione separata né considerare attendibili altre origini private.

```json5
{
  models: {
    mode: "merge", // merge (predefinito) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | ecc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Autenticazione e precedenza di unione">
    - Usa `authHeader: true` + `headers` per esigenze di autenticazione personalizzate.
    - Sovrascrivi la radice della configurazione dell'agente con `OPENCLAW_AGENT_DIR`.
    - Precedenza di unione per gli ID provider corrispondenti:
      - I valori `baseUrl` non vuoti del file `models.json` dell'agente hanno la precedenza.
      - I valori `apiKey` non vuoti dell'agente hanno la precedenza solo quando il provider non è gestito tramite SecretRef nel contesto corrente di configurazione/profilo di autenticazione.
      - I valori `apiKey` dei provider gestiti tramite SecretRef vengono aggiornati dagli indicatori di origine (`ENV_VAR_NAME` per i riferimenti alle variabili d'ambiente, `secretref-managed` per i riferimenti a file/exec), anziché rendere persistenti i segreti risolti.
      - I valori delle intestazioni dei provider gestiti tramite SecretRef vengono aggiornati dagli indicatori di origine (`secretref-env:ENV_VAR_NAME` per i riferimenti alle variabili d'ambiente, `secretref-managed` per i riferimenti a file/exec).
      - Se `apiKey`/`baseUrl` dell'agente sono vuoti o mancanti, vengono usati come ripiego i valori di `models.providers` nella configurazione.
      - Per `contextWindow`/`maxTokens` di un modello corrispondente, il valore esplicito della configurazione ha la precedenza quando è presente e valido (un numero finito positivo); altrimenti viene usato il valore implicito/generato del catalogo.
      - `contextTokens` di un modello corrispondente segue la stessa regola: il valore esplicito ha la precedenza, altrimenti viene usato quello implicito; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
      - I cataloghi dei Plugin provider vengono archiviati come frammenti di catalogo generati e di proprietà del Plugin nello stato dei Plugin dell'agente.
      - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json` e ignori l'unione dei frammenti di catalogo di proprietà dei Plugin.
      - La persistenza degli indicatori è determinata dall'origine: gli indicatori vengono scritti dall'istantanea attiva della configurazione di origine (prima della risoluzione), non dai valori segreti risolti in fase di esecuzione.

  </Accordion>
</AccordionGroup>

### Dettagli dei campi del provider

<AccordionGroup>
  <Accordion title="Catalogo di primo livello">
    - `models.mode`: comportamento del catalogo dei provider (`merge` o `replace`).
    - `models.providers`: mappa personalizzata dei provider indicizzata per ID provider.
      - Modifiche sicure: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oppure `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` per aggiornamenti incrementali. `config set` rifiuta le sostituzioni distruttive, a meno che non venga specificato `--replace`.

  </Accordion>
  <Accordion title="Connessione e autenticazione del provider">
    - `models.providers.*.api`: adattatore delle richieste (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Per backend `/v1/chat/completions` con hosting autonomo, come MLX, vLLM, SGLang e la maggior parte dei server locali compatibili con OpenAI, usa `openai-completions`. Un provider personalizzato con `baseUrl` ma senza `api` usa per impostazione predefinita `openai-completions`; imposta `openai-responses` solo quando il backend supporta `/v1/responses`.
    - `models.providers.*.apiKey`: credenziale del provider (preferisci SecretRef o la sostituzione tramite variabili d'ambiente).
    - `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: finestra di contesto nativa predefinita per i modelli di questo provider quando la voce del modello non imposta `contextWindow`.
    - `models.providers.*.contextTokens`: limite effettivo predefinito del contesto in fase di esecuzione per i modelli di questo provider quando la voce del modello non imposta `contextTokens`.
    - `models.providers.*.maxTokens`: limite predefinito dei token di output per i modelli di questo provider quando la voce del modello non imposta `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout facoltativo, specifico per provider e espresso in secondi, per le richieste HTTP al modello; include connessione, intestazioni, corpo e gestione dell'interruzione complessiva della richiesta.
    - `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inserisce `options.num_ctx` nelle richieste (impostazione predefinita: `true`).
    - `models.providers.*.authHeader`: forza il trasporto delle credenziali nell'intestazione `Authorization` quando necessario.
    - `models.providers.*.baseUrl`: URL di base dell'API upstream.
    - `models.providers.*.headers`: intestazioni statiche aggiuntive per l'instradamento tramite proxy/tenant.

  </Accordion>
  <Accordion title="Sovrascritture del trasporto delle richieste">
    `models.providers.*.request`: sovrascritture del trasporto per le richieste HTTP al provider del modello.

    - `request.headers`: intestazioni aggiuntive (unite alle impostazioni predefinite del provider). I valori accettano SecretRef.
    - `request.auth`: sovrascrittura della strategia di autenticazione. Modalità: `"provider-default"` (usa l'autenticazione integrata del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value` e `prefix` facoltativo).
    - `request.proxy`: sovrascrittura del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili d'ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
    - `request.tls`: sovrascrittura TLS per le connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando è `true`, consente alle richieste HTTP al provider del modello di raggiungere intervalli privati, CGNAT o simili attraverso la protezione delle richieste HTTP del provider. Gli URL di base dei provider personalizzati/locali considerano già attendibile l'origine esatta configurata, tranne le origini di metadati/link-local, che rimangono bloccate senza consenso esplicito. Imposta questo valore su `false` per disattivare l'attendibilità dell'origine esatta. WebSocket usa la stessa configurazione `request` per intestazioni/TLS, ma non quella protezione SSRF delle richieste. Valore predefinito: `false`.

  </Accordion>
  <Accordion title="Voci del catalogo dei modelli">
    - `models.providers.*.models`: voci esplicite del catalogo dei modelli del provider.
    - `models.providers.*.models.*.input`: modalità di input del modello. Usa `["text"]` per i modelli di solo testo e `["text", "image"]` per i modelli nativi con supporto di immagini/visione. Gli allegati immagine vengono inseriti nei turni dell'agente solo quando il modello selezionato è contrassegnato come compatibile con le immagini.
    - `models.providers.*.models.*.contextWindow`: metadati della finestra di contesto nativa del modello. Per questo modello, sostituisce `contextWindow` a livello di provider.
    - `models.providers.*.models.*.contextTokens`: limite facoltativo del contesto in fase di esecuzione. Sostituisce `contextTokens` a livello di provider; usalo quando vuoi un budget di contesto effettivo inferiore rispetto a `contextWindow` nativo del modello; `openclaw models list` mostra entrambi i valori quando sono diversi.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: indicazione facoltativa di compatibilità. Per `api: "openai-completions"` con un `baseUrl` non vuoto e non nativo (host diverso da `api.openai.com`), OpenClaw forza questo valore su `false` in fase di esecuzione. Un `baseUrl` vuoto/omesso mantiene il comportamento predefinito di OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: indicazione facoltativa di compatibilità per gli endpoint di chat compatibili con OpenAI che accettano solo stringhe. Quando è `true`, OpenClaw appiattisce gli array `messages[].content` contenenti solo testo in semplici stringhe prima di inviare la richiesta.
    - `models.providers.*.models.*.compat.strictMessageKeys`: indicazione facoltativa di compatibilità per gli endpoint di chat compatibili con OpenAI con requisiti rigidi. Quando è `true`, OpenClaw riduce gli oggetti dei messaggi Chat Completions in uscita ai soli campi `role` e `content` prima di inviare la richiesta.
    - `models.providers.*.models.*.compat.thinkingFormat`: indicazione facoltativa sul payload di ragionamento. Usa `"together"` per `reasoning.enabled` in stile Together, `"qwen"` per `enable_thinking` di primo livello oppure `"qwen-chat-template"` per `chat_template_kwargs.enable_thinking` sui server compatibili con OpenAI della famiglia Qwen che supportano gli argomenti della chat template a livello di richiesta, come vLLM. I modelli Qwen vLLM configurati espongono scelte binarie `/think` (`off`, `on`) per questi formati.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: indicazione facoltativa di compatibilità per i backend Chat Completions in stile DeepSeek che richiedono che i messaggi precedenti dell'assistente mantengano `reasoning_content` durante la riproduzione. Quando è `true`, OpenClaw conserva tale campo nei messaggi dell'assistente in uscita. Usalo quando colleghi un proxy personalizzato compatibile con DeepSeek che rifiuta le richieste dopo la rimozione del ragionamento. Valore predefinito: `false`.

  </Accordion>
  <Accordion title="Rilevamento di Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di rilevamento automatico di Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva il rilevamento implicito.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per il rilevamento.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo per ID provider per il rilevamento mirato.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento del rilevamento.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di ripiego per i modelli rilevati.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: numero massimo di token di output di ripiego per i modelli rilevati.

  </Accordion>
</AccordionGroup>

La configurazione interattiva di un provider personalizzato deduce l'input di immagini per i pattern noti degli ID dei modelli di visione, inclusi GPT-4o/GPT-4.1/GPT-5+, le famiglie di ragionamento `o1`/`o3`/`o4`, Claude, Gemini, qualsiasi ID con suffisso `-vl` (Qwen-VL e simili) e famiglie denominate come LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V; omette la domanda aggiuntiva per le famiglie note di solo testo (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama e gli ID Qwen semplici senza suffisso vl/vision). Per gli ID modello sconosciuti, viene comunque richiesto se è supportato l'input di immagini. La configurazione non interattiva usa la stessa deduzione; specifica `--custom-image-input` per forzare i metadati di compatibilità con le immagini oppure `--custom-text-input` per forzare i metadati di solo testo.

### Esempi di provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Il Plugin provider esterno ufficiale `cerebras` può configurarlo tramite `openclaw onboard --auth-choice cerebras-api-key`. Usa una configurazione esplicita del provider solo per sostituire le impostazioni predefinite.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Usa `cerebras/zai-glm-4.7` per Cerebras; `zai/glm-4.7` per l'accesso diretto a Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Provider integrato compatibile con Anthropic. Scorciatoia: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelli locali (LM Studio)">
    Consulta [Modelli locali](/it/gateway/local-models). In breve: esegui un modello locale di grandi dimensioni tramite l'API Responses di LM Studio su hardware potente; mantieni integrati i modelli ospitati come soluzione di riserva.
  </Accordion>
  <Accordion title="MiniMax M3 (diretto)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Imposta `MINIMAX_API_KEY`. Scorciatoie: `openclaw onboard --auth-choice minimax-global-api` oppure `openclaw onboard --auth-choice minimax-cn-api`. Il catalogo dei modelli usa M3 come valore predefinito e include anche le varianti M2.7. Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il ragionamento di MiniMax M2.x, a meno che tu non imposti esplicitamente `thinking`; MiniMax-M3 (e M3.x) mantiene invece per impostazione predefinita il percorso di ragionamento omesso/adattivo del provider. `/fast on` oppure `params.fastMode: true` sostituisce `MiniMax-M2.7` con `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Per l'endpoint cinese: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Gli endpoint nativi di Moonshot dichiarano la compatibilità dell'utilizzo in streaming sul trasporto condiviso `openai-completions` e OpenClaw la determina in base alle funzionalità dell'endpoint, anziché basarsi esclusivamente sull'ID integrato del provider.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Imposta `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen oppure riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    L'URL di base deve omettere `/v1` (il client Anthropic lo aggiunge). Scorciatoia: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Imposta `ZAI_API_KEY`. I riferimenti ai modelli usano l'ID canonico del provider `zai/*`. Scorciatoia: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint generale: `https://api.z.ai/api/paas/v4`
    - Endpoint per la programmazione: `https://api.z.ai/api/coding/paas/v4`
    - L'opzione di autenticazione predefinita `zai-api-key` verifica la chiave e rileva automaticamente a quale endpoint appartiene; se il rilevamento non è conclusivo, mostra una richiesta, con Global come valore predefinito. Sono disponibili anche opzioni di autenticazione dedicate per CN e Coding-Plan, per una selezione esplicita.
    - Per l'endpoint generale, definisci un provider personalizzato sostituendo l'URL di base.

  </Accordion>
</AccordionGroup>

---

## Contenuti correlati

- [Configurazione — agenti](/it/gateway/config-agents)
- [Configurazione — canali](/it/gateway/config-channels)
- [Riferimento della configurazione](/it/gateway/configuration-reference) — altre chiavi di primo livello
- [Strumenti e plugin](/it/tools)
