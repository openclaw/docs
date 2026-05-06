---
read_when:
    - Vuoi servire modelli dalla tua macchina con GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Ti servono le indicazioni più sicure per il modello locale
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-05-06T08:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

I modelli locali sono fattibili. Alzano però l’asticella per hardware, dimensione del contesto e difesa dalla prompt injection: schede piccole o quantizzate in modo aggressivo troncano il contesto e indeboliscono la sicurezza. Questa pagina è la guida orientata per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI. Per un onboarding con il minimo attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`.

## Requisiti hardware minimi

Punta in alto: **≥2 Mac Studio al massimo della configurazione o un rig GPU equivalente (~30.000 $+)** per un loop agente confortevole. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza più alta. Esegui sempre la **variante più grande / full-size che puoi ospitare**; checkpoint piccoli o pesantemente quantizzati aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

## Scegli un backend

| Backend                                              | Usare quando                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/it/providers/lmstudio)                     | Prima configurazione locale, caricatore GUI, Responses API nativa           |
| [Ollama](/it/providers/ollama)                          | Flusso di lavoro CLI, libreria modelli, servizio systemd senza intervento   |
| MLX / vLLM / SGLang                                  | Serving self-hosted ad alta produttività con endpoint HTTP compatibile con OpenAI |
| LiteLLM / OAI-proxy / proxy personalizzato compatibile con OpenAI | Fai da frontend a un’altra API di modello e devi farla trattare da OpenClaw come OpenAI |

Usa Responses API (`api: "openai-responses"`) quando il backend la supporta (LM Studio lo fa). Altrimenti resta su Chat Completions (`api: "openai-completions"`).

<Warning>
**Utenti WSL2 + Ollama + NVIDIA/CUDA:** l’installer Linux ufficiale di Ollama abilita un servizio systemd con `Restart=always`. Nelle configurazioni GPU su WSL2, l’avvio automatico può ricaricare l’ultimo modello durante il boot e bloccare la memoria host. Se la tua VM WSL2 si riavvia ripetutamente dopo aver abilitato Ollama, vedi [loop di crash WSL2](/it/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Consigliato: LM Studio + modello locale grande (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per tenere il ragionamento separato dal testo finale.

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
- In LM Studio, scarica la **build del modello più grande disponibile** (evita varianti "small"/pesantemente quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` la elenchi.
- Sostituisci `my-local-model` con l’ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio è diversa.
- Per WhatsApp, resta su Responses API così viene inviato solo il testo finale.

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

### Prima locale con rete di sicurezza ospitata

Scambia l’ordine di primario e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` così puoi ripiegare su Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / routing dei dati

- Esistono anche varianti ospitate MiniMax/Kimi/GLM su OpenRouter con endpoint vincolati alla regione (per esempio ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; il routing regionale ospitato è la via intermedia quando ti servono funzionalità del provider ma vuoi controllo sul flusso dei dati.

## Altri proxy locali compatibili con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o gateway personalizzati funzionano se espongono un endpoint `/v1/chat/completions` in stile OpenAI. Usa l’adapter Chat Completions a meno che il backend documenti esplicitamente il supporto per `/v1/responses`. Sostituisci il blocco provider sopra con il tuo endpoint e ID modello:

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

Se `api` viene omesso su un provider personalizzato con una `baseUrl`, OpenClaw usa per impostazione predefinita `openai-completions`. Gli endpoint loopback come `127.0.0.1` sono considerati attendibili automaticamente; gli endpoint LAN, tailnet e DNS privati richiedono comunque `request.allowPrivateNetwork: true`.

Il valore `models.providers.<id>.models[].id` è locale al provider. Non includere lì il prefisso del provider. Per esempio, un server MLX avviato con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` dovrebbe usare questo ID catalogo e questo riferimento modello:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli vision locali o proxati così gli allegati immagine vengono iniettati nei turni agente. L’onboarding interattivo per provider personalizzati inferisce gli ID dei modelli vision comuni e chiede solo per i nomi sconosciuti. L’onboarding non interattivo usa la stessa inferenza; usa `--custom-image-input` per ID vision sconosciuti o `--custom-text-input` quando un modello dall’aspetto noto è solo testuale dietro il tuo endpoint.

Mantieni `models.mode: "merge"` così i modelli ospitati restano disponibili come fallback. Usa `models.providers.<id>.timeoutSeconds` per server di modelli locali o remoti lenti prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider si applica solo alle richieste HTTP del modello, inclusi connessione, header, streaming del corpo e abort totale del fetch protetto.

<Note>
Per provider personalizzati compatibili con OpenAI, la persistenza di un marker locale non segreto come `apiKey: "ollama-local"` è accettata quando `baseUrl` risolve a loopback, una LAN privata, `.local` o un hostname semplice. OpenClaw lo tratta come credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetta un hostname pubblico.
</Note>

Nota di comportamento per backend `/v1` locali/proxati:

- OpenClaw li tratta come route compatibili con OpenAI in stile proxy, non come endpoint OpenAI nativi
- il request shaping solo per OpenAI nativo non si applica qui: niente `service_tier`, niente `store` Responses, niente shaping del payload compatibile con il ragionamento OpenAI e niente suggerimenti per la cache dei prompt
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigorosi:

- Alcuni server accettano solo `messages[].content` stringa su Chat Completions, non array strutturati di parti di contenuto. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true` per quegli endpoint.
- Alcuni modelli locali emettono richieste tool autonome tra parentesi come testo, per esempio `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw le promuove a vere chiamate tool solo quando il nome corrisponde esattamente a un tool registrato per il turno; altrimenti il blocco viene trattato come testo non supportato ed è nascosto dalle risposte visibili all’utente.
- Se un modello emette JSON, XML o testo in stile ReAct che sembra una chiamata tool ma il provider non ha emesso un’invocazione strutturata, OpenClaw lo lascia come testo e registra un avviso con l’ID esecuzione, provider/modello, pattern rilevato e nome del tool quando disponibile. Trattalo come incompatibilità provider/modello nelle chiamate tool, non come esecuzione tool completata.
- Se i tool appaiono come testo dell’assistente invece di essere eseguiti, per esempio JSON grezzo, XML, sintassi ReAct o un array `tool_calls` vuoto nella risposta del provider, verifica prima che il server stia usando un template/parser chat capace di chiamate tool. Per backend Chat Completions compatibili con OpenAI il cui parser funziona solo quando l’uso dei tool è forzato, imposta un override di richiesta per modello invece di affidarti al parsing del testo:

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

  Usalo solo per modelli/sessioni in cui ogni turno normale dovrebbe chiamare un tool. Sovrascrive il valore proxy predefinito di OpenClaw `tool_choice: "auto"`. Sostituisci `local/my-local-model` con il riferimento provider/modello esatto mostrato da `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se un modello personalizzato compatibile con OpenAI accetta livelli di reasoning effort OpenAI oltre il profilo integrato, dichiarali nel blocco compat del modello. Aggiungere `"xhigh"` qui fa sì che `/think xhigh`, i selettori di sessione, la validazione Gateway e la validazione `llm-task` espongano il livello per quel riferimento provider/modello configurato:

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

## Backend più piccoli o più rigorosi

Se il modello si carica correttamente ma i turni agente completi si comportano male, procedi dall’alto verso il basso: conferma prima il trasporto, poi restringi la superficie.

1. **Conferma che il modello locale risponda.** Nessuno strumento, nessun contesto agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Conferma l'instradamento del Gateway.** Invia solo il prompt fornito: salta trascrizione, bootstrap AGENTS, assemblaggio del motore di contesto, strumenti e server MCP in bundle, ma esercita comunque l'instradamento del Gateway, l'autenticazione e la selezione del provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prova la modalità snella.** Se entrambi i controlli passano ma i turni reali dell'agente falliscono con chiamate agli strumenti malformate o prompt sovradimensionati, abilita `agents.defaults.experimental.localModelLean: true`. Rimuove i tre strumenti predefiniti più pesanti (`browser`, `cron`, `message`) così la forma del prompt è più piccola e meno fragile. Consulta [Funzionalità sperimentali → modalità snella per i modelli locali](/it/concepts/experimental-features#local-model-lean-mode) per la spiegazione completa, quando usarla e come confermare che sia attiva.

4. **Disabilita completamente gli strumenti come ultima risorsa.** Se la modalità snella non basta, imposta `models.providers.<provider>.models[].compat.supportsTools: false` per quella voce del modello. L'agente opererà quindi senza chiamate agli strumenti su quel modello.

5. **Oltre questo punto, il collo di bottiglia è upstream.** Se il backend continua a fallire solo nelle esecuzioni OpenClaw più grandi dopo la modalità snella e `supportsTools: false`, il problema restante è di solito la capacità del modello o del server upstream: finestra di contesto, memoria GPU, eliminazione kv-cache o un bug del backend. A quel punto non è il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato? Ricaricalo; l'avvio a freddo è una causa comune di "blocco".
- Il server locale dice `terminated`, `ECONNRESET` o chiude lo stream a metà turno?
  OpenClaw registra una `model.call.error.failureKind` a bassa cardinalità più lo
  snapshot RSS/heap del processo OpenClaw nella diagnostica. Per la pressione di
  memoria di LM Studio/Ollama, confronta quel timestamp con il log del server o
  con il log di crash / jetsam di macOS per confermare se il server del modello
  è stato terminato.
- OpenClaw deriva le soglie di preflight della finestra di contesto dalla finestra del modello rilevata, o dalla finestra del modello non limitata quando `agents.defaults.contextTokens` abbassa la finestra effettiva. Avvisa sotto il 20% con un limite minimo di **8k**. I blocchi rigidi usano la soglia del 10% con un limite minimo di **4k**, limitata alla finestra di contesto effettiva così i metadati del modello sovradimensionati non possono rifiutare un limite utente altrimenti valido. Se raggiungi quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Abbassa `contextWindow` o aumenta il limite del tuo server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` a quella voce del modello.
- Le chiamate dirette minime a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local`
  fallisce su Gemma o un altro modello locale? Controlla prima l'URL del provider, il riferimento del modello, il marker di autenticazione
  e i log del server; `model run` locale non include gli strumenti dell'agente.
  Se `model run` locale riesce ma i turni agente più grandi falliscono, riduci la superficie
  degli strumenti dell'agente con `localModelLean` o `compat.supportsTools: false`.
- Le chiamate agli strumenti compaiono come testo JSON/XML/ReAct grezzo, o il provider restituisce un
  array `tool_calls` vuoto? Non aggiungere un proxy che converte alla cieca il testo
  dell'assistente in esecuzione di strumenti. Correggi prima il template/parser chat del server. Se il
  modello funziona solo quando l'uso degli strumenti è forzato, aggiungi l'override per modello
  `params.extra_body.tool_choice: "required"` indicato sopra e usa quella voce del modello
  solo per sessioni in cui è prevista una chiamata a uno strumento a ogni turno.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti circoscritti e la compaction attiva per limitare il raggio d'impatto della prompt injection.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Failover del modello](/it/concepts/model-failover)
