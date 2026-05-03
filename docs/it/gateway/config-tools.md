---
read_when:
    - Configurazione del criterio `tools.*`, degli elenchi consentiti o delle funzionalità sperimentali
    - Registrazione di provider personalizzati o override degli URL di base
    - Configurazione di endpoint ospitati in proprio compatibili con OpenAI
sidebarTitle: Tools and custom providers
summary: Configurazione degli strumenti (criteri, opzioni sperimentali, strumenti supportati da provider) e configurazione di provider/base-URL personalizzati
title: Configurazione — strumenti e provider personalizzati
x-i18n:
    generated_at: "2026-05-03T21:32:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75a39342f40e9c329a7c61855e805ec43532cbdb89fbe801acc26830fd63b4da
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` chiavi di configurazione e configurazione di provider personalizzati / URL base. Per agenti, canali e altre chiavi di configurazione di primo livello, vedi [Riferimento di configurazione](/it/gateway/configuration-reference).

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

<Note>
L'onboarding locale imposta per impostazione predefinita le nuove configurazioni locali su `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).
</Note>

| Profilo     | Include                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                    |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias per `exec`)                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Tutti gli strumenti integrati (esclude i Plugin provider)                                                               |

### `tools.allow` / `tools.deny`

Criterio globale allow/deny degli strumenti (deny ha la precedenza). Non distingue maiuscole/minuscole, supporta caratteri jolly `*`. Applicato anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` sono ID di strumenti separati. `allow: ["write"]` abilita anche `apply_patch` per i modelli compatibili, ma `deny: ["write"]` non nega `apply_patch`. Per bloccare tutte le modifiche ai file, nega `group:fs` oppure elenca esplicitamente ogni strumento che modifica:

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
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` elevato bypassa la sandbox e usa il percorso di escape configurato (`gateway` per impostazione predefinita, o `node` quando la destinazione exec è `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

I controlli di sicurezza dei cicli degli strumenti sono **disattivati per impostazione predefinita**. Imposta `enabled: true` per attivare il rilevamento. Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sovrascritte per agente in `agents.list[].tools.loopDetection`.

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
  Cronologia massima delle chiamate agli strumenti conservata per l'analisi dei cicli.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Soglia del pattern ripetuto senza avanzamento per gli avvisi.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Soglia ripetuta più alta per bloccare i cicli critici.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Soglia di arresto forzato per qualsiasi esecuzione senza avanzamento.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avvisa in caso di chiamate ripetute con stesso strumento/stessi argomenti.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avvisa/blocca per strumenti di polling noti (`process.poll`, `command_status`, ecc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avvisa/blocca sui pattern a coppia alternati senza avanzamento.
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

Configura la comprensione dei media in ingresso (immagine/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async video directly to the channel
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
    **Voce provider** (`type: "provider"` o omesso):

    - `provider`: ID del provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
    - `model`: override dell'ID del modello
    - `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

    **Voce CLI** (`type: "cli"`):

    - `command`: eseguibile da avviare
    - `args`: argomenti con template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.; `openclaw doctor --fix` migra i placeholder deprecati `{input}` a `{{MediaPath}}`)

    **Campi comuni:**

    - `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Valori predefiniti: `openai`/`anthropic`/`minimax` → immagine, `google` → immagine+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per voce.
    - `tools.media.image.timeoutSeconds` e le voci `timeoutSeconds` del modello immagine corrispondenti si applicano anche quando l'agente chiama lo strumento esplicito `image`.
    - Gli errori ripiegano sulla voce successiva.

    L'autenticazione del provider segue l'ordine standard: `auth-profiles.json` → variabili d'ambiente → `models.providers.*.apiKey`.

    **Campi di completamento asincrono:**

    - `asyncCompletion.directSend`: quando è `true`, le attività multimediali asincrone completate che supportano il recapito diretto del completamento provano prima il recapito diretto al canale. Valore predefinito: `false` (percorso di riattivazione sessione richiedente/recapito modello). Oggi si applica a `video_generate` asincrono; i completamenti `music_generate` asincroni restano mediati dalla sessione richiedente anche quando questa opzione è abilitata.

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

Controlla quali sessioni possono essere prese come destinazione dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

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
    - `agent`: qualsiasi sessione appartenente all'ID dell'agente corrente (può includere altri utenti se esegui sessioni per mittente sotto lo stesso ID agente).
    - `all`: qualsiasi sessione. La destinazione tra agenti richiede comunque `tools.agentToAgent`.
    - Vincolo sandbox: quando la sessione corrente è in sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controlla il supporto agli allegati inline per `sessions_spawn`.

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
  <Accordion title="Note sugli allegati">
    - Gli allegati sono supportati solo per `runtime: "subagent"`. Il runtime ACP li rifiuta.
    - I file vengono materializzati nell'area di lavoro figlia in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
    - Il contenuto degli allegati viene automaticamente oscurato dalla persistenza della trascrizione.
    - Gli input Base64 vengono convalidati con controlli rigorosi su alfabeto/padding e una protezione sulla dimensione prima della decodifica.
    - I permessi dei file sono `0700` per le directory e `0600` per i file.
    - La pulizia segue la policy `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag degli strumenti integrati sperimentali. Disattivati per impostazione predefinita, salvo quando si applica una regola di abilitazione automatica per GPT-5 strict-agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento di lavori non banali in più passaggi.
- Predefinito: `false`, salvo quando `agents.defaults.embeddedPi.executionContract` (o una sostituzione per singolo agente) è impostato su `"strict-agentic"` per un'esecuzione OpenAI o OpenAI Codex della famiglia GPT-5. Imposta `true` per forzare l'attivazione dello strumento fuori da quell'ambito, oppure `false` per mantenerlo disattivato anche per esecuzioni GPT-5 strict-agentic.
- Quando è abilitato, il prompt di sistema aggiunge anche indicazioni d'uso affinché il modello lo usi solo per lavori sostanziali e mantenga al massimo un passaggio `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modello predefinito per i sotto-agenti generati. Se omesso, i sotto-agenti ereditano il modello del chiamante.
- `allowAgents`: allowlist predefinita degli ID degli agenti di destinazione per `sessions_spawn` quando l'agente richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata allo strumento omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Policy degli strumenti per sotto-agente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e URL base

OpenClaw usa il catalogo modelli integrato. Aggiungi provider personalizzati tramite `models.providers` nella configurazione o in `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Autenticazione e precedenza del merge">
    - Usa `authHeader: true` + `headers` per esigenze di autenticazione personalizzate.
    - Sostituisci la radice della configurazione dell'agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, un alias legacy di variabile d'ambiente).
    - Precedenza del merge per ID provider corrispondenti:
      - I valori `baseUrl` non vuoti di `models.json` dell'agente prevalgono.
      - I valori `apiKey` non vuoti dell'agente prevalgono solo quando quel provider non è gestito da SecretRef nel contesto di configurazione/profilo di autenticazione corrente.
      - I valori `apiKey` dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec) invece di persistere i segreti risolti.
      - I valori degli header dei provider gestiti da SecretRef vengono aggiornati dai marcatori di origine (`secretref-env:ENV_VAR_NAME` per riferimenti env, `secretref-managed` per riferimenti file/exec).
      - `apiKey`/`baseUrl` dell'agente vuoti o mancanti ripiegano su `models.providers` nella configurazione.
      - `contextWindow`/`maxTokens` del modello corrispondente usano il valore più alto tra la configurazione esplicita e i valori impliciti del catalogo.
      - `contextTokens` del modello corrispondente conserva un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
      - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json`.
      - La persistenza dei marcatori è autoritativa rispetto alla sorgente: i marcatori vengono scritti dallo snapshot della configurazione sorgente attiva (prima della risoluzione), non dai valori dei segreti runtime risolti.

  </Accordion>
</AccordionGroup>

### Dettagli dei campi del provider

<AccordionGroup>
  <Accordion title="Catalogo di primo livello">
    - `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
    - `models.providers`: mappa di provider personalizzati indicizzata per ID provider.
      - Modifiche sicure: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` per aggiornamenti additivi. `config set` rifiuta sostituzioni distruttive salvo che tu passi `--replace`.

  </Accordion>
  <Accordion title="Connessione e autenticazione del provider">
    - `models.providers.*.api`: adattatore di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.). Per backend self-hosted `/v1/chat/completions` come MLX, vLLM, SGLang e la maggior parte dei server locali compatibili con OpenAI, usa `openai-completions`. Un provider personalizzato con `baseUrl` ma senza `api` usa per impostazione predefinita `openai-completions`; imposta `openai-responses` solo quando il backend supporta `/v1/responses`.
    - `models.providers.*.apiKey`: credenziale del provider (preferisci sostituzione SecretRef/env).
    - `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: finestra di contesto nativa predefinita per i modelli sotto questo provider quando la voce del modello non imposta `contextWindow`.
    - `models.providers.*.contextTokens`: limite di contesto runtime effettivo predefinito per i modelli sotto questo provider quando la voce del modello non imposta `contextTokens`.
    - `models.providers.*.maxTokens`: limite predefinito di token di output per i modelli sotto questo provider quando la voce del modello non imposta `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout HTTP opzionale per provider per le richieste al modello, in secondi, inclusa la gestione di connessione, header, corpo e interruzione totale della richiesta.
    - `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
    - `models.providers.*.authHeader`: forza il trasporto delle credenziali nell'header `Authorization` quando richiesto.
    - `models.providers.*.baseUrl`: URL base dell'API upstream.
    - `models.providers.*.headers`: header statici extra per routing proxy/tenant.

  </Accordion>
  <Accordion title="Sostituzioni del trasporto delle richieste">
    `models.providers.*.request`: sostituzioni del trasporto per le richieste HTTP del provider di modelli.

    - `request.headers`: header extra (uniti ai valori predefiniti del provider). I valori accettano SecretRef.
    - `request.auth`: sostituzione della strategia di autenticazione. Modalità: `"provider-default"` (usa l'autenticazione integrata del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opzionale).
    - `request.proxy`: sostituzione del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili d'ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` opzionale.
    - `request.tls`: sostituzione TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, consente HTTPS verso `baseUrl` quando DNS risolve in intervalli privati, CGNAT o simili, tramite la protezione fetch HTTP del provider (opt-in dell'operatore per endpoint compatibili con OpenAI self-hosted e attendibili). Gli URL di stream del provider di modelli su loopback come `localhost`, `127.0.0.1` e `[::1]` sono consentiti automaticamente salvo che questo sia impostato esplicitamente su `false`; host LAN, tailnet e DNS privati richiedono comunque opt-in. WebSocket usa lo stesso `request` per header/TLS ma non quel gate fetch SSRF. Predefinito `false`.

  </Accordion>
  <Accordion title="Voci del catalogo modelli">
    - `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
    - `models.providers.*.models.*.input`: modalità di input del modello. Usa `["text"]` per modelli solo testo e `["text", "image"]` per modelli nativi immagine/visione. Gli allegati immagine vengono inseriti nei turni dell'agente solo quando il modello selezionato è contrassegnato come compatibile con le immagini.
    - `models.providers.*.models.*.contextWindow`: metadati della finestra di contesto nativa del modello. Questo sostituisce `contextWindow` a livello di provider per quel modello.
    - `models.providers.*.models.*.contextTokens`: limite di contesto runtime opzionale. Questo sostituisce `contextTokens` a livello di provider; usalo quando vuoi un budget di contesto effettivo più piccolo della `contextWindow` nativa del modello; `openclaw models list` mostra entrambi i valori quando differiscono.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: suggerimento di compatibilità opzionale. Per `api: "openai-completions"` con un `baseUrl` non nativo e non vuoto (host diverso da `api.openai.com`), OpenClaw forza questo valore a `false` in runtime. `baseUrl` vuoto/omesso mantiene il comportamento OpenAI predefinito.
    - `models.providers.*.models.*.compat.requiresStringContent`: suggerimento di compatibilità opzionale per endpoint chat compatibili con OpenAI solo stringa. Quando `true`, OpenClaw appiattisce gli array di puro testo `messages[].content` in stringhe semplici prima di inviare la richiesta.

  </Accordion>
  <Accordion title="Scoperta Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di scoperta automatica Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva la scoperta implicita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per la scoperta.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opzionale per ID provider per la scoperta mirata.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento della scoperta.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli scoperti.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token di output massimi di fallback per i modelli scoperti.

  </Accordion>
</AccordionGroup>

L'onboarding interattivo dei provider personalizzati deduce l'input immagine per ID comuni di modelli vision come GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V, e salta la domanda aggiuntiva per famiglie note solo testo. Gli ID modello sconosciuti richiedono comunque il supporto immagini. L'onboarding non interattivo usa la stessa inferenza; passa `--custom-image-input` per forzare metadati compatibili con le immagini oppure `--custom-text-input` per forzare metadati solo testo.

### Esempi di provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Il Plugin provider `cerebras` incluso può configurarlo tramite `openclaw onboard --auth-choice cerebras-api-key`. Usa la configurazione esplicita del provider solo quando sostituisci i valori predefiniti.

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
  <Accordion title="Codifica Kimi">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Provider integrato compatibile con Anthropic. Scorciatoia: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelli locali (LM Studio)">
    Consulta [Modelli locali](/it/gateway/local-models). TL;DR: esegui un grande modello locale tramite LM Studio Responses API su hardware serio; mantieni i modelli ospitati uniti per il fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (diretto)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Imposta `MINIMAX_API_KEY`. Scorciatoie: `openclaw onboard --auth-choice minimax-global-api` oppure `openclaw onboard --auth-choice minimax-cn-api`. Il catalogo modelli usa solo M2.7 come impostazione predefinita. Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax, a meno che tu non imposti esplicitamente `thinking`. `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

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

    Per l’endpoint Cina: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Gli endpoint Moonshot nativi dichiarano compatibilità con l’utilizzo dello streaming sul trasporto condiviso `openai-completions`, e OpenClaw la determina in base alle capacità dell’endpoint anziché solo all’id del provider integrato.

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

    Imposta `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Usa i riferimenti `opencode/...` per il catalogo Zen o i riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    L’URL di base deve omettere `/v1` (il client Anthropic lo aggiunge). Scorciatoia: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Imposta `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` sono alias accettati. Scorciatoia: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint generale: `https://api.z.ai/api/paas/v4`
    - Endpoint di codifica (predefinito): `https://api.z.ai/api/coding/paas/v4`
    - Per l’endpoint generale, definisci un provider personalizzato con l’override dell’URL di base.

  </Accordion>
</AccordionGroup>

---

## Correlati

- [Configurazione — agenti](/it/gateway/config-agents)
- [Configurazione — canali](/it/gateway/config-channels)
- [Riferimento di configurazione](/it/gateway/configuration-reference) — altre chiavi di primo livello
- [Strumenti e plugins](/it/tools)
