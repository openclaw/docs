---
read_when:
    - Configurazione della policy `tools.*`, degli elenchi consentiti o delle funzionalità sperimentali
    - Registrazione di provider personalizzati o override degli URL di base
    - Configurazione di endpoint self-hosted compatibili con OpenAI
sidebarTitle: Tools and custom providers
summary: Configurazione degli strumenti (criteri, opzioni sperimentali, strumenti basati su provider) e configurazione di provider personalizzati/URL di base
title: Configurazione — strumenti e provider personalizzati
x-i18n:
    generated_at: "2026-06-27T17:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

Chiavi di configurazione `tools.*` e configurazione di provider personalizzati / URL di base. Per agenti, canali e altre chiavi di configurazione di primo livello, consulta il [Riferimento alla configurazione](/it/gateway/configuration-reference).

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

<Note>
L'onboarding locale imposta per impostazione predefinita le nuove configurazioni locali su `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).
</Note>

| Profilo     | Include                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                      |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Tutti gli strumenti integrati (esclude i plugin dei provider)                                                           |
| `group:plugins`    | Strumenti di proprietà dei plugin caricati, inclusi i server MCP configurati esposti tramite `bundle-mcp`               |

### Strumenti MCP e plugin nella policy degli strumenti della sandbox

I server MCP configurati sono esposti come strumenti di proprietà del plugin sotto l'id plugin `bundle-mcp`. I normali profili degli strumenti possono consentirli, ma `tools.sandbox.tools` è un gate aggiuntivo per le sessioni in sandbox. Se la modalità sandbox è `"all"` o `"non-main"`, includi una di queste voci nella allowlist degli strumenti della sandbox quando gli strumenti MCP/plugin devono essere visibili:

- `bundle-mcp` per i server MCP gestiti da OpenClaw da `mcp.servers`
- l'id plugin per un plugin nativo specifico
- `group:plugins` per tutti gli strumenti di proprietà dei plugin caricati
- nomi esatti degli strumenti del server MCP o glob di server come `outlook__send_mail` o `outlook__*` quando vuoi solo un server

I glob dei server usano il prefisso del server MCP sicuro per il provider, non necessariamente la chiave grezza `mcp.servers`. I caratteri non ` [A-Za-z0-9_-]` diventano `-`, i nomi che non iniziano con una lettera ricevono un prefisso `mcp-` e i prefissi lunghi o duplicati possono essere troncati o avere un suffisso; ad esempio, `mcp.servers["Outlook Graph"]` usa un glob come `outlook-graph__*`.

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

Senza quella voce a livello sandbox, il server MCP può comunque caricarsi correttamente mentre i suoi strumenti vengono filtrati prima della richiesta al provider. Usa `openclaw doctor` per rilevare questa forma per i server gestiti da OpenClaw in `mcp.servers`. I server MCP caricati dai manifest dei plugin in bundle o da `.mcp.json` di Claude usano lo stesso gate sandbox, ma questa diagnostica non enumera ancora quelle origini; usa le stesse voci della allowlist se i loro strumenti scompaiono nei turni in sandbox.

### `tools.codeMode`

`tools.codeMode` abilita la superficie generica della modalità codice di OpenClaw. Quando è abilitata
per un'esecuzione con strumenti, il modello vede solo `exec` e `wait`; i normali strumenti
OpenClaw passano dietro il bridge del catalogo `tools.*` nella sandbox, e gli strumenti MCP sono
disponibili tramite il namespace `MCP` generato.

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

Le dichiarazioni MCP sono esposte tramite la superficie di file API virtuale di sola lettura in
modalità codice. Il codice guest può chiamare `API.list("mcp")` e
`API.read("mcp/<server>.d.ts")` per ispezionare le firme in stile TypeScript prima di
chiamare `MCP.<server>.<tool>()`. Consulta [Modalità codice](/it/reference/code-mode) per il
contratto runtime, i limiti e i passaggi di debug.

### `tools.allow` / `tools.deny`

Policy globale di allow/deny degli strumenti (deny prevale). Non distingue tra maiuscole e minuscole, supporta i caratteri jolly `*`. Applicata anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` sono id strumento separati. `allow: ["write"]` abilita anche `apply_patch` per i modelli compatibili, ma `deny: ["write"]` non nega `apply_patch`. Per bloccare tutte le modifiche ai file, nega `group:fs` o elenca esplicitamente ogni strumento che può modificare:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Limita ulteriormente gli strumenti per provider o modelli specifici. Ordine: profilo di base → profilo del provider → allow/deny.

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

Limita gli strumenti per una specifica identità richiedente. Questa è una difesa in profondità sopra il controllo di accesso del canale; i valori sender devono provenire dall'adapter del canale, non dal testo del messaggio.

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

Le chiavi usano prefissi espliciti: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oppure `"*"`. Gli id canale sono id canonici di OpenClaw; alias come `teams` vengono normalizzati in `msteams`. Le chiavi legacy senza prefisso sono accettate solo come `id:`. L'ordine di corrispondenza è channel+id, id, e164, username, name, quindi wildcard.

`agents.list[].tools.toolsBySender` per agente sovrascrive la corrispondenza globale del sender quando corrisponde, anche con una policy vuota `{}`.

### `tools.elevated`

Controlla l'accesso exec elevato fuori dalla sandbox:

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

- L'override per agente (`agents.list[].tools.elevated`) può solo restringere ulteriormente.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano al singolo messaggio.
- `exec` elevato aggira la sandbox e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

I controlli di sicurezza per i loop degli strumenti sono **disabilitati per impostazione predefinita**. Imposta `enabled: true` per attivare il rilevamento. Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sovrascritte per agente in `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Cronologia massima delle chiamate strumento conservata per l'analisi dei loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Soglia dei pattern ripetuti senza avanzamento per gli avvisi.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Soglia di ripetizione più alta per bloccare i loop critici.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Soglia di arresto rigida per qualsiasi esecuzione senza avanzamento.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avvisa in caso di chiamate ripetute allo stesso strumento/con gli stessi argomenti.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avvisa/blocca su strumenti di polling noti (`process.poll`, `command_status`, ecc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avvisa/blocca sui pattern a coppie alternate senza avanzamento.
</ParamField>

<Warning>
Se `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la validazione non riesce.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Configura la comprensione dei media in ingresso (immagini/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Voce provider** (`type: "provider"` oppure omessa):

    - `provider`: id del provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
    - `model`: override dell'id del modello
    - `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

    **Voce CLI** (`type: "cli"`):

    - `command`: eseguibile da avviare
    - `args`: argomenti con template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.; `openclaw doctor --fix` migra i placeholder deprecati `{input}` a `{{MediaPath}}`)

    **Campi comuni:**

    - `capabilities`: elenco opzionale (`image`, `audio`, `video`). Valori predefiniti: `openai`/`anthropic`/`minimax` → immagine, `google` → immagine+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per voce.
    - `tools.media.image.timeoutSeconds` e le voci `timeoutSeconds` del modello immagine corrispondente si applicano anche quando l'agente chiama lo strumento esplicito `image`. Per la comprensione delle immagini, questo timeout si applica alla richiesta stessa e non viene ridotto dal lavoro di preparazione precedente.
    - Gli errori passano alla voce successiva.

    L'autenticazione del provider segue l'ordine standard: `auth-profiles.json` → variabili di ambiente → `models.providers.*.apiKey`.

    **Campi di completamento asincrono:**

    - `asyncCompletion.directSend`: flag di compatibilità deprecato. Le attività multimediali asincrone completate restano mediate dalla sessione del richiedente, così l'agente riceve il risultato, decide come comunicarlo all'utente e usa lo strumento messaggio quando la consegna di origine lo richiede.

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

Controlla quali sessioni possono essere indirizzate dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

Predefinito: `tree` (sessione corrente + sessioni generate da essa, come i sottoagenti).

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
  <Accordion title="Visibility scopes">
    - `self`: solo la chiave della sessione corrente.
    - `tree`: sessione corrente + sessioni generate dalla sessione corrente (sottoagenti).
    - `agent`: qualsiasi sessione appartenente all'id agente corrente (può includere altri utenti se esegui sessioni per mittente sotto lo stesso id agente).
    - `all`: qualsiasi sessione. Il targeting tra agenti richiede comunque `tools.agentToAgent`.
    - Vincolo sandbox: quando la sessione corrente è in sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.
    - Quando non è `all`, `sessions_list` include un campo compatto `visibility`
      che descrive la modalità effettiva e un avviso che alcune sessioni potrebbero essere
      omesse fuori dall'ambito corrente.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controlla il supporto per allegati inline per `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - Gli allegati richiedono `enabled: true`.
    - Gli allegati dei sottoagenti vengono materializzati nell'area di lavoro figlia in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
    - Gli allegati ACP sono solo immagini e vengono inoltrati inline al runtime ACP dopo il superamento degli stessi limiti di numero di file, byte per file e byte totali.
    - Il contenuto degli allegati viene automaticamente oscurato dalla persistenza della trascrizione.
    - Gli input Base64 vengono convalidati con controlli rigorosi su alfabeto/padding e una protezione sulla dimensione prima della decodifica.
    - I permessi dei file degli allegati dei sottoagenti sono `0700` per le directory e `0600` per i file.
    - La pulizia dei sottoagenti segue la policy `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag sperimentali per strumenti integrati. Disattivati per impostazione predefinita, a meno che si applichi una regola di abilitazione automatica strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento di lavoro multi-step non banale.
- Predefinito: `false`, a meno che `agents.defaults.embeddedAgent.executionContract` (o un override per agente) sia impostato su `"strict-agentic"` per un'esecuzione della famiglia GPT-5 OpenAI o OpenAI Codex. Imposta `true` per forzare l'attivazione dello strumento fuori da tale ambito, oppure `false` per mantenerlo disattivato anche per esecuzioni strict-agentic GPT-5.
- Quando abilitato, il prompt di sistema aggiunge anche indicazioni d'uso affinché il modello lo usi solo per lavori sostanziali e mantenga al massimo un passaggio `in_progress`.

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
- `allowAgents`: allowlist predefinita degli id degli agenti target configurati per `sessions_spawn` quando l'agente richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualsiasi target configurato; predefinito: solo lo stesso agente). Le voci obsolete la cui configurazione agente è stata eliminata vengono rifiutate da `sessions_spawn` e omesse da `agents_list`; esegui `openclaw doctor --fix` per ripulirle.
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn`. `0` significa nessun timeout.
- `announceTimeoutMs`: timeout per chiamata (millisecondi) per i tentativi di consegna dell'annuncio `agent` del Gateway. Predefinito: `120000`. I retry transitori possono rendere l'attesa totale dell'annuncio più lunga di un timeout configurato.
- Policy degli strumenti per sottoagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e URL di base

I Plugin provider pubblicano le proprie righe di catalogo modelli. Aggiungi provider personalizzati tramite `models.providers` nella configurazione o in `~/.openclaw/agents/<agentId>/agent/models.json`.

Configurare un `baseUrl` per un provider personalizzato/locale è anche la decisione ristretta di fiducia di rete per le richieste HTTP ai modelli: OpenClaw consente esattamente quell'origine `scheme://host:port` attraverso il percorso fetch protetto, senza aggiungere un'opzione di configurazione separata o considerare attendibili altre origini private.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
  <Accordion title="Auth and merge precedence">
    - Usa `authHeader: true` + `headers` per esigenze di autenticazione personalizzate.
    - Esegui l'override della radice di configurazione dell'agente con `OPENCLAW_AGENT_DIR`.
    - Precedenza di merge per ID provider corrispondenti:
      - I valori `baseUrl` non vuoti di `models.json` dell'agente prevalgono.
      - I valori `apiKey` non vuoti dell'agente prevalgono solo quando quel provider non è gestito da SecretRef nel contesto corrente di configurazione/profilo di autenticazione.
      - I valori `apiKey` dei provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di rendere persistenti i segreti risolti.
      - I valori header dei provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
      - `apiKey`/`baseUrl` dell'agente vuoti o mancanti fanno fallback a `models.providers` nella configurazione.
      - I `contextWindow`/`maxTokens` dei modelli corrispondenti usano il valore più alto tra la configurazione esplicita e i valori impliciti del catalogo.
      - `contextTokens` del modello corrispondente preserva un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
      - I cataloghi dei Plugin provider vengono archiviati come shard di catalogo generati e di proprietà del Plugin nello stato Plugin dell'agente.
      - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json` e gli shard attivi del catalogo Plugin.
      - La persistenza dei marker è autoritativa rispetto alla sorgente: i marker vengono scritti dallo snapshot di configurazione sorgente attivo (prima della risoluzione), non dai valori dei segreti runtime risolti.

  </Accordion>
</AccordionGroup>

### Dettagli dei campi provider

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
    - `models.providers`: mappa dei provider personalizzati indicizzata per id provider.
      - Modifiche sicure: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oppure `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` per aggiornamenti additivi. `config set` rifiuta sostituzioni distruttive a meno che tu non passi `--replace`.

  </Accordion>
  <Accordion title="Connessione e autenticazione del provider">
    - `models.providers.*.api`: adattatore di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.). Per backend `/v1/chat/completions` self-hosted come MLX, vLLM, SGLang e la maggior parte dei server locali compatibili con OpenAI, usa `openai-completions`. Un provider personalizzato con `baseUrl` ma senza `api` usa per impostazione predefinita `openai-completions`; imposta `openai-responses` solo quando il backend supporta `/v1/responses`.
    - `models.providers.*.apiKey`: credenziale del provider (preferisci la sostituzione SecretRef/env).
    - `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: finestra di contesto nativa predefinita per i modelli di questo provider quando la voce del modello non imposta `contextWindow`.
    - `models.providers.*.contextTokens`: limite di contesto effettivo di runtime predefinito per i modelli di questo provider quando la voce del modello non imposta `contextTokens`.
    - `models.providers.*.maxTokens`: limite predefinito dei token di output per i modelli di questo provider quando la voce del modello non imposta `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout opzionale per provider delle richieste HTTP al modello, in secondi, inclusa la gestione di connessione, intestazioni, corpo e interruzione totale della richiesta.
    - `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
    - `models.providers.*.authHeader`: forza il trasporto delle credenziali nell'intestazione `Authorization` quando richiesto.
    - `models.providers.*.baseUrl`: URL di base dell'API upstream.
    - `models.providers.*.headers`: intestazioni statiche aggiuntive per routing proxy/tenant.

  </Accordion>
  <Accordion title="Override del trasporto delle richieste">
    `models.providers.*.request`: override del trasporto per le richieste HTTP al provider del modello.

    - `request.headers`: intestazioni aggiuntive (unite ai valori predefiniti del provider). I valori accettano SecretRef.
    - `request.auth`: override della strategia di autenticazione. Modalità: `"provider-default"` (usa l'autenticazione integrata del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opzionale).
    - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` opzionale.
    - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, consente alle richieste HTTP al provider del modello di raggiungere reti private, CGNAT o intervalli simili attraverso la protezione fetch HTTP del provider. Gli URL di base dei provider personalizzati/locali considerano già attendibile l'origine esatta configurata, eccetto le origini metadata/link-local, che restano bloccate senza opt-in esplicito. Impostalo su `false` per disattivare l'attendibilità dell'origine esatta. WebSocket usa lo stesso `request` per intestazioni/TLS, ma non quel gate SSRF fetch. Predefinito `false`.

  </Accordion>
  <Accordion title="Voci del catalogo modelli">
    - `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
    - `models.providers.*.models.*.input`: modalità di input del modello. Usa `["text"]` per modelli solo testo e `["text", "image"]` per modelli nativi immagine/visione. Gli allegati immagine vengono iniettati nei turni dell'agente solo quando il modello selezionato è contrassegnato come compatibile con immagini.
    - `models.providers.*.models.*.contextWindow`: metadati della finestra di contesto nativa del modello. Questo sovrascrive `contextWindow` a livello di provider per quel modello.
    - `models.providers.*.models.*.contextTokens`: limite opzionale del contesto di runtime. Questo sovrascrive `contextTokens` a livello di provider; usalo quando vuoi un budget di contesto effettivo inferiore alla `contextWindow` nativa del modello; `openclaw models list` mostra entrambi i valori quando differiscono.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: suggerimento di compatibilità opzionale. Per `api: "openai-completions"` con un `baseUrl` non nativo e non vuoto (host diverso da `api.openai.com`), OpenClaw forza questo valore a `false` a runtime. `baseUrl` vuoto/omesso mantiene il comportamento OpenAI predefinito.
    - `models.providers.*.models.*.compat.requiresStringContent`: suggerimento di compatibilità opzionale per endpoint chat compatibili con OpenAI che accettano solo stringhe. Quando `true`, OpenClaw appiattisce gli array di puro testo `messages[].content` in stringhe semplici prima di inviare la richiesta.
    - `models.providers.*.models.*.compat.strictMessageKeys`: suggerimento di compatibilità opzionale per endpoint chat compatibili con OpenAI rigorosi. Quando `true`, OpenClaw riduce gli oggetti messaggio Chat Completions in uscita a `role` e `content` prima di inviare la richiesta.
    - `models.providers.*.models.*.compat.thinkingFormat`: suggerimento opzionale per il payload di thinking. Usa `"together"` per `reasoning.enabled` in stile Together, `"qwen"` per `enable_thinking` di primo livello, oppure `"qwen-chat-template"` per `chat_template_kwargs.enable_thinking` su server compatibili con OpenAI della famiglia Qwen che supportano kwargs chat-template a livello di richiesta, come vLLM. I modelli Qwen vLLM configurati espongono scelte binarie `/think` (`off`, `on`) per questi formati.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: suggerimento di compatibilità opzionale per backend Chat Completions in stile DeepSeek che richiedono ai messaggi assistant precedenti di mantenere `reasoning_content` durante il replay. Quando `true`, OpenClaw preserva quel campo nei messaggi assistant in uscita. Usalo quando colleghi un proxy personalizzato compatibile con DeepSeek che rifiuta richieste dopo la rimozione del reasoning. Predefinito `false`.

  </Accordion>
  <Accordion title="Rilevamento Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di rilevamento automatico Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva il rilevamento implicito.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per il rilevamento.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro provider-id opzionale per rilevamento mirato.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per aggiornare il rilevamento.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli rilevati.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token massimi di output di fallback per i modelli rilevati.

  </Accordion>
</AccordionGroup>

L'onboarding interattivo di provider personalizzati deduce l'input immagine per ID di modelli di visione comuni come GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V, e salta la domanda aggiuntiva per famiglie note solo testo. Gli ID modello sconosciuti richiedono comunque il supporto immagine. L'onboarding non interattivo usa la stessa inferenza; passa `--custom-image-input` per forzare metadati compatibili con immagini oppure `--custom-text-input` per forzare metadati solo testo.

### Esempi di provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Il Plugin provider esterno ufficiale `cerebras` può configurarlo tramite `openclaw onboard --auth-choice cerebras-api-key`. Usa la configurazione esplicita del provider solo quando sovrascrivi i valori predefiniti.

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

    Usa `cerebras/zai-glm-4.7` per Cerebras; `zai/glm-4.7` per Z.AI diretto.

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

    Compatibile con Anthropic, provider integrato. Scorciatoia: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelli locali (LM Studio)">
    Vedi [Modelli locali](/it/gateway/local-models). In breve: esegui un modello locale grande tramite LM Studio Responses API su hardware serio; mantieni uniti i modelli hosted per il fallback.
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

    Imposta `MINIMAX_API_KEY`. Scorciatoie: `openclaw onboard --auth-choice minimax-global-api` oppure `openclaw onboard --auth-choice minimax-cn-api`. Il catalogo modelli usa M3 come predefinito e include anche le varianti M2.7. Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax M2.x, a meno che tu non imposti esplicitamente `thinking`; MiniMax-M3 (e M3.x) resta per impostazione predefinita sul percorso di thinking omesso/adattivo del provider. `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

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

    Per l'endpoint Cina: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Gli endpoint Moonshot nativi dichiarano compatibilità con l'uso in streaming sul trasporto condiviso `openai-completions`, e OpenClaw lo determina in base alle capacità dell'endpoint anziché solo all'id del provider integrato.

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
  <Accordion title="Sintetico (compatibile con Anthropic)">
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

    Imposta `ZAI_API_KEY`. I riferimenti ai modelli usano l'ID provider canonico `zai/*`. Scorciatoia: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint generale: `https://api.z.ai/api/paas/v4`
    - Endpoint di coding (predefinito): `https://api.z.ai/api/coding/paas/v4`
    - Per l'endpoint generale, definisci un provider personalizzato con l'override dell'URL di base.

  </Accordion>
</AccordionGroup>

---

## Correlati

- [Configurazione — agenti](/it/gateway/config-agents)
- [Configurazione — canali](/it/gateway/config-channels)
- [Riferimento della configurazione](/it/gateway/configuration-reference) — altre chiavi di livello superiore
- [Strumenti e plugin](/it/tools)
