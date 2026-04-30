---
read_when:
    - Vuoi servire modelli dalla tua macchina con GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Ti servono le indicazioni più sicure sui modelli locali
summary: Eseguire OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-04-30T08:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Il locale è fattibile, ma OpenClaw si aspetta un contesto ampio e forti difese contro la prompt injection. Le schede piccole troncano il contesto e indeboliscono la sicurezza. Punta in alto: **≥2 Mac Studio al massimo delle specifiche o un rig GPU equivalente (~$30k+)**. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza maggiore. Usa la **variante di modello più grande / full-size che riesci a eseguire**; checkpoint molto quantizzati o “small” aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

Se vuoi la configurazione locale con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`. Questa pagina è la guida orientata per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI.

<Warning>
**Utenti WSL2 + Ollama + NVIDIA/CUDA:** l'installer Linux ufficiale di Ollama abilita un servizio systemd con `Restart=always`. Nelle configurazioni GPU WSL2, l'avvio automatico può ricaricare l'ultimo modello durante il boot e bloccare la memoria dell'host. Se la tua VM WSL2 si riavvia ripetutamente dopo aver abilitato Ollama, vedi [ciclo di arresti anomali WSL2](/it/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Consigliato: LM Studio + modello locale grande (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio una build full-size Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per mantenere il ragionamento separato dal testo finale.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist di configurazione**

- Installa LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- In LM Studio, scarica la **build di modello più grande disponibile** (evita varianti “small”/fortemente quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` la elenchi.
- Sostituisci `my-local-model` con l'ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build LM Studio differisce.
- Per WhatsApp, usa Responses API in modo che venga inviato solo il testo finale.

Mantieni configurati i modelli ospitati anche quando esegui in locale; usa `models.mode: "merge"` così i fallback restano disponibili.

### Configurazione ibrida: primario ospitato, fallback locale

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Locale come prima scelta con rete di sicurezza ospitata

Scambia l'ordine di primario e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` così puoi ripiegare su Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Su OpenRouter esistono anche varianti ospitate MiniMax/Kimi/GLM con endpoint vincolati per regione (ad esempio ospitate negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta, continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; l'instradamento regionale ospitato è la via intermedia quando ti servono funzionalità del provider ma vuoi controllo sul flusso dei dati.

## Altri proxy locali compatibili con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o Gateway personalizzati funzionano se espongono un endpoint `/v1/chat/completions` in stile OpenAI. Usa l'adapter Chat Completions a meno che il backend documenti esplicitamente il supporto a `/v1/responses`. Sostituisci il blocco provider sopra con il tuo endpoint e ID modello:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Se `api` viene omesso su un provider personalizzato con `baseUrl`, OpenClaw usa per impostazione predefinita `openai-completions`. Gli endpoint loopback come `127.0.0.1` sono considerati attendibili automaticamente; gli endpoint LAN, tailnet e DNS privati richiedono comunque `request.allowPrivateNetwork: true`.

Il valore `models.providers.<id>.models[].id` è locale al provider. Non includere lì il prefisso del provider. Per esempio, un server MLX avviato con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` dovrebbe usare questo ID catalogo e riferimento modello:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli di visione locali o proxati in modo che gli allegati immagine vengano iniettati nei turni dell'agente. L'onboarding interattivo dei provider personalizzati deduce gli ID comuni dei modelli di visione e chiede solo per i nomi sconosciuti. L'onboarding non interattivo usa la stessa inferenza; usa `--custom-image-input` per ID di visione sconosciuti o `--custom-text-input` quando un modello che sembra noto è solo testo dietro il tuo endpoint.

Mantieni `models.mode: "merge"` così i modelli ospitati restano disponibili come fallback. Usa `models.providers.<id>.timeoutSeconds` per server di modelli locali o remoti lenti prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider si applica solo alle richieste HTTP del modello, inclusi connessione, header, streaming del corpo e l'interruzione totale della fetch protetta.

<Note>
Per provider personalizzati compatibili con OpenAI, è accettato persistere un marcatore locale non segreto come `apiKey: "ollama-local"` quando `baseUrl` si risolve in loopback, una LAN privata, `.local` o un hostname semplice. OpenClaw lo tratta come una credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetti un hostname pubblico.
</Note>

Nota di comportamento per backend `/v1` locali/proxati:

- OpenClaw li tratta come route compatibili con OpenAI in stile proxy, non come endpoint OpenAI nativi
- la modellazione delle richieste esclusiva di OpenAI nativa non si applica qui: niente `service_tier`, niente Responses `store`, niente modellazione payload di compatibilità con il ragionamento OpenAI e niente suggerimenti per la cache dei prompt
- gli header di attribuzione OpenClaw nascosti (`originator`, `version`, `User-Agent`) non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigidi:

- Alcuni server accettano solo `messages[].content` stringa su Chat Completions, non array strutturati di parti di contenuto. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true` per quegli endpoint.
- Alcuni modelli locali emettono come testo richieste di strumenti autonome tra parentesi quadre, come `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw le promuove a vere chiamate di strumenti solo quando il nome corrisponde esattamente a uno strumento registrato per il turno; altrimenti il blocco viene trattato come testo non supportato ed è nascosto dalle risposte visibili all'utente.
- Se un modello emette JSON, XML o testo in stile ReAct che sembra una chiamata di strumento ma il provider non ha emesso un'invocazione strutturata, OpenClaw lo lascia come testo e registra un avviso con l'id di esecuzione, provider/modello, pattern rilevato e nome dello strumento quando disponibile. Trattalo come incompatibilità di chiamata strumenti del provider/modello, non come un'esecuzione strumento completata.
- Se gli strumenti appaiono come testo dell'assistente invece di essere eseguiti, per esempio JSON grezzo, XML, sintassi ReAct o un array `tool_calls` vuoto nella risposta del provider, verifica prima che il server stia usando un template/parser chat capace di chiamate strumento. Per backend Chat Completions compatibili con OpenAI il cui parser funziona solo quando l'uso degli strumenti è forzato, imposta un override di richiesta per modello invece di affidarti al parsing del testo:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Usalo solo per modelli/sessioni in cui ogni turno normale dovrebbe chiamare uno strumento. Sovrascrive il valore proxy predefinito di OpenClaw di `tool_choice: "auto"`.
  Sostituisci `local/my-local-model` con il riferimento provider/modello esatto mostrato da `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se un modello personalizzato compatibile con OpenAI accetta effort di ragionamento OpenAI oltre il profilo integrato, dichiarali nel blocco compat del modello. Aggiungere `"xhigh"` qui fa sì che `/think xhigh`, i selettori di sessione, la validazione Gateway e la validazione `llm-task` espongano il livello per quel riferimento provider/modello configurato:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Alcuni backend locali più piccoli o più rigidi sono instabili con la forma completa del prompt agent-runtime di OpenClaw, specialmente quando sono inclusi gli schemi degli strumenti. Verifica prima il percorso del provider con la sonda locale snella:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Per verificare la route Gateway senza la forma completa del prompt agente, usa invece la sonda modello Gateway:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Entrambe le sonde modello locali e Gateway inviano solo il prompt fornito. La sonda Gateway valida comunque instradamento Gateway, autenticazione e selezione del provider, ma salta intenzionalmente transcript precedenti della sessione, contesto AGENTS/bootstrap, assemblaggio del context-engine, strumenti e server MCP inclusi.

  Se l'operazione riesce ma i normali turni degli agenti OpenClaw falliscono, prova prima
  `agents.defaults.experimental.localModelLean: true` per rimuovere strumenti
  predefiniti pesanti come `browser`, `cron` e `message`; questo è un flag
  sperimentale, non un'impostazione stabile della modalità predefinita. Vedi
  [Funzionalità sperimentali](/it/concepts/experimental-features). Se il problema persiste, prova
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Se il backend continua a fallire solo nelle esecuzioni OpenClaw più grandi, il problema rimanente
  di solito riguarda la capacità del modello/server a monte o un bug del backend, non il
  livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato? Ricaricalo; l'avvio a freddo è una causa comune di “blocco”.
- Il server locale indica `terminated`, `ECONNRESET` o chiude il flusso a metà turno?
  OpenClaw registra nei diagnostici un `model.call.error.failureKind` a bassa cardinalità più
  l'istantanea RSS/heap del processo OpenClaw. Per la pressione sulla memoria di LM Studio/Ollama,
  confronta quel timestamp con il registro del server o con il registro di crash /
  jetsam di macOS per confermare se il server del modello è stato terminato.
- OpenClaw ricava le soglie di preflight della finestra di contesto dalla finestra del modello rilevata, oppure dalla finestra del modello senza limite quando `agents.defaults.contextTokens` riduce la finestra effettiva. Avvisa sotto il 20% con una soglia minima di **8k**. I blocchi rigidi usano la soglia del 10% con una soglia minima di **4k**, limitata alla finestra di contesto effettiva in modo che metadati del modello sovradimensionati non possano rifiutare un limite utente altrimenti valido. Se incontri quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Riduci `contextWindow` o aumenta il limite del server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` a quella voce del modello.
- Le chiamate dirette minime a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local`
  fallisce con Gemma o un altro modello locale? Controlla prima l'URL del provider, il riferimento del modello, il
  marcatore di autenticazione e i registri del server; `model run` locale non include strumenti agente.
  Se `model run` locale riesce ma i turni agente più grandi falliscono, riduci la superficie degli
  strumenti agente con `localModelLean` o `compat.supportsTools: false`.
- Le chiamate agli strumenti compaiono come testo JSON/XML/ReAct grezzo, oppure il provider restituisce un
  array `tool_calls` vuoto? Non aggiungere un proxy che converte ciecamente il testo
  dell'assistente in esecuzione di strumenti. Correggi prima il template/parser della chat del server. Se il
  modello funziona solo quando l'uso degli strumenti è forzato, aggiungi l'override per modello
  `params.extra_body.tool_choice: "required"` sopra e usa quella voce del modello
  solo per sessioni in cui è prevista una chiamata a uno strumento a ogni turno.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti circoscritti e Compaction attiva per limitare il raggio d'impatto della prompt injection.

## Correlati

- [Riferimento alla configurazione](/it/gateway/configuration-reference)
- [Failover dei modelli](/it/concepts/model-failover)
