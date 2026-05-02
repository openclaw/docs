---
read_when:
    - Vuoi servire modelli dalla tua macchina GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Hai bisogno delle indicazioni più sicure per il modello locale
summary: Eseguire OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-05-02T22:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

I modelli locali sono fattibili. Alzano anche l'asticella su hardware, dimensione del contesto e difesa dalla prompt injection: schede piccole o quantizzate aggressivamente troncano il contesto e compromettono la sicurezza. Questa pagina è la guida pragmatica per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI. Per un onboarding con il minimo attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`.

## Requisiti hardware minimi

Punta in alto: **≥2 Mac Studio al massimo della configurazione o un rig GPU equivalente (~$30k+)** per un ciclo agent confortevole. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza maggiore. Esegui sempre la **variante più grande / a dimensione intera che puoi ospitare**; checkpoint piccoli o fortemente quantizzati aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

## Scegli un backend

| Backend                                              | Usalo quando                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [LM Studio](/it/providers/lmstudio)                     | Prima configurazione locale, loader GUI, Responses API nativa                |
| [Ollama](/it/providers/ollama)                          | Workflow CLI, libreria di modelli, servizio systemd senza interventi manuali |
| MLX / vLLM / SGLang                                  | Serving self-hosted ad alta velocità con endpoint HTTP compatibile OpenAI    |
| LiteLLM / OAI-proxy / proxy personalizzato compatibile OpenAI | Metti davanti un'altra API di modello e vuoi che OpenClaw la tratti come OpenAI |

Usa Responses API (`api: "openai-responses"`) quando il backend la supporta (LM Studio lo fa). Altrimenti resta su Chat Completions (`api: "openai-completions"`).

<Warning>
**Utenti WSL2 + Ollama + NVIDIA/CUDA:** l'installer Linux ufficiale di Ollama abilita un servizio systemd con `Restart=always`. Nelle configurazioni WSL2 GPU, l'avvio automatico può ricaricare l'ultimo modello durante il boot e bloccare memoria dell'host. Se la tua VM WSL2 si riavvia ripetutamente dopo aver abilitato Ollama, vedi [ciclo di crash WSL2](/it/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Consigliato: LM Studio + modello locale grande (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio, una build Qwen, DeepSeek o Llama a dimensione intera), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per tenere il ragionamento separato dal testo finale.

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
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza all'avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio differisce.
- Per WhatsApp, resta su Responses API così viene inviato solo il testo finale.

Mantieni configurati i modelli hosted anche quando esegui in locale; usa `models.mode: "merge"` così i fallback restano disponibili.

### Configurazione ibrida: primary hosted, fallback locale

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

### Prima locale con rete di sicurezza hosted

Inverti l'ordine di primary e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` così puoi ripiegare su Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Esistono anche varianti hosted MiniMax/Kimi/GLM su OpenRouter con endpoint vincolati alla regione (per esempio hosted negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta, continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; l'instradamento regionale hosted è la via intermedia quando ti servono funzionalità del provider ma vuoi controllo sul flusso dei dati.

## Altri proxy locali compatibili OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o Gateway personalizzati funzionano se espongono un endpoint `/v1/chat/completions` in stile OpenAI. Usa l'adapter Chat Completions a meno che il backend non documenti esplicitamente il supporto a `/v1/responses`. Sostituisci il blocco provider sopra con il tuo endpoint e ID modello:

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

Se `api` viene omesso su un provider personalizzato con un `baseUrl`, OpenClaw usa per impostazione predefinita `openai-completions`. Gli endpoint di loopback come `127.0.0.1` sono considerati attendibili automaticamente; endpoint LAN, tailnet e DNS privati richiedono comunque `request.allowPrivateNetwork: true`.

Il valore `models.providers.<id>.models[].id` è locale al provider. Non includere lì il prefisso del provider. Per esempio, un server MLX avviato con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` dovrebbe usare questo ID catalogo e riferimento modello:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli vision locali o proxied così gli allegati immagine vengono inseriti nei turni agent. L'onboarding interattivo dei provider personalizzati inferisce gli ID modello vision comuni e chiede solo per nomi sconosciuti. L'onboarding non interattivo usa la stessa inferenza; usa `--custom-image-input` per ID vision sconosciuti o `--custom-text-input` quando un modello che sembra noto è solo testo dietro il tuo endpoint.

Mantieni `models.mode: "merge"` così i modelli hosted restano disponibili come fallback. Usa `models.providers.<id>.timeoutSeconds` per server di modelli locali o remoti lenti prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider si applica solo alle richieste HTTP del modello, inclusi connessione, header, streaming del corpo e l'abort totale del guarded fetch.

<Note>
Per provider personalizzati compatibili OpenAI, persistere un marker locale non segreto come `apiKey: "ollama-local"` è accettato quando `baseUrl` risolve a loopback, una LAN privata, `.local` o un hostname senza dominio. OpenClaw lo tratta come una credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetti un hostname pubblico.
</Note>

Nota di comportamento per backend `/v1` locali/proxied:

- OpenClaw li tratta come route compatibili OpenAI in stile proxy, non come endpoint OpenAI nativi
- lo shaping delle richieste solo OpenAI native non si applica qui: niente `service_tier`, niente Responses `store`, niente shaping del payload compatibile con il ragionamento OpenAI e niente suggerimenti di prompt cache
- gli header di attribuzione OpenClaw nascosti (`originator`, `version`, `User-Agent`) non vengono inseriti su questi URL proxy personalizzati

Note di compatibilità per backend compatibili OpenAI più rigorosi:

- Alcuni server accettano solo `messages[].content` stringa su Chat Completions, non array strutturati di parti di contenuto. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true` per quegli endpoint.
- Alcuni modelli locali emettono richieste di tool autonome tra parentesi quadre come testo, ad esempio `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw le promuove a vere chiamate tool solo quando il nome corrisponde esattamente a un tool registrato per il turno; altrimenti il blocco viene trattato come testo non supportato e nascosto dalle risposte visibili all'utente.
- Se un modello emette JSON, XML o testo in stile ReAct che sembra una chiamata tool ma il provider non ha emesso un'invocazione strutturata, OpenClaw lo lascia come testo e registra un avviso con run id, provider/modello, pattern rilevato e nome del tool quando disponibile. Trattalo come incompatibilità delle chiamate tool del provider/modello, non come esecuzione tool completata.
- Se i tool appaiono come testo dell'assistente invece di essere eseguiti, per esempio JSON grezzo, XML, sintassi ReAct o un array `tool_calls` vuoto nella risposta del provider, verifica prima che il server stia usando un chat template/parser capace di chiamate tool. Per backend Chat Completions compatibili OpenAI il cui parser funziona solo quando l'uso dei tool è forzato, imposta un override di richiesta per modello invece di fare affidamento sul parsing del testo:

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

  Usalo solo per modelli/sessioni in cui ogni turno normale dovrebbe chiamare un tool. Sovrascrive il valore proxy predefinito di OpenClaw di `tool_choice: "auto"`. Sostituisci `local/my-local-model` con il riferimento provider/modello esatto mostrato da `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se un modello personalizzato compatibile OpenAI accetta efforts di ragionamento OpenAI oltre il profilo integrato, dichiarali nel blocco compat del modello. Aggiungere `"xhigh"` qui fa sì che `/think xhigh`, i selettori di sessione, la validazione del Gateway e la validazione `llm-task` espongano il livello per quel riferimento provider/modello configurato:

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

Se il modello si carica correttamente ma i turni agent completi si comportano male, procedi dall'alto verso il basso: conferma prima il trasporto, poi restringi la superficie.

1. **Conferma che il modello locale stesso risponda.** Nessuno strumento, nessun contesto agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Conferma l'instradamento del Gateway.** Invia solo il prompt fornito — salta transcript, bootstrap AGENTS, assemblaggio del context-engine, strumenti e server MCP in bundle, ma esercita comunque l'instradamento del Gateway, l'autenticazione e la selezione del provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prova la modalità snella.** Se entrambe le verifiche passano ma i turni reali dell'agente falliscono con chiamate agli strumenti malformate o prompt troppo grandi, abilita `agents.defaults.experimental.localModelLean: true`. Rimuove i tre strumenti predefiniti più pesanti (`browser`, `cron`, `message`) così la forma del prompt è più piccola e meno fragile. Vedi [Funzionalità sperimentali → Modalità snella per modello locale](/it/concepts/experimental-features#local-model-lean-mode) per la spiegazione completa, quando usarla e come confermare che sia attiva.

4. **Disabilita completamente gli strumenti come ultima risorsa.** Se la modalità snella non basta, imposta `models.providers.<provider>.models[].compat.supportsTools: false` per quella voce del modello. L'agente opererà quindi senza chiamate agli strumenti su quel modello.

5. **Oltre questo punto, il collo di bottiglia è a monte.** Se il backend continua a fallire solo su esecuzioni OpenClaw più grandi dopo la modalità snella e `supportsTools: false`, il problema rimanente è di solito la capacità del modello o del server a monte — finestra di contesto, memoria GPU, eviction della kv-cache o un bug del backend. A quel punto non è il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway può raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio non caricato? Ricaricalo; l'avvio a freddo è una causa comune di “blocco”.
- Il server locale indica `terminated`, `ECONNRESET` o chiude lo stream a metà turno?
  OpenClaw registra un `model.call.error.failureKind` a bassa cardinalità più lo
  snapshot RSS/heap del processo OpenClaw nella diagnostica. Per pressione sulla
  memoria di LM Studio/Ollama, confronta quel timestamp con il log del server o
  il log di crash / jetsam di macOS per confermare se il server del modello è stato terminato.
- OpenClaw deriva le soglie di preflight della finestra di contesto dalla finestra del modello rilevata, oppure dalla finestra del modello senza limite quando `agents.defaults.contextTokens` abbassa la finestra effettiva. Avvisa sotto il 20% con un minimo di **8k**. I blocchi rigidi usano la soglia del 10% con un minimo di **4k**, limitata alla finestra di contesto effettiva così metadati di modello sovradimensionati non possono rifiutare un limite utente altrimenti valido. Se incontri quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Abbassa `contextWindow` o aumenta il limite del server.
- Un server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` su quella voce del modello.
- Le chiamate minuscole dirette a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local`
  fallisce su Gemma o su un altro modello locale? Controlla prima URL del provider, riferimento del modello, marcatore di autenticazione
  e log del server; `model run` locale non include gli strumenti dell'agente.
  Se `model run` locale riesce ma i turni agente più grandi falliscono, riduci la superficie
  degli strumenti dell'agente con `localModelLean` o `compat.supportsTools: false`.
- Le chiamate agli strumenti compaiono come testo JSON/XML/ReAct grezzo, oppure il provider restituisce un
  array `tool_calls` vuoto? Non aggiungere un proxy che converte alla cieca il testo dell'assistente
  in esecuzione di strumenti. Correggi prima il template/parser di chat del server. Se il
  modello funziona solo quando l'uso degli strumenti è forzato, aggiungi l'override per modello
  `params.extra_body.tool_choice: "required"` qui sopra e usa quella voce del modello
  solo per sessioni in cui è prevista una chiamata agli strumenti a ogni turno.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti mirati e la Compaction attiva per limitare il raggio d'impatto della prompt injection.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Failover del modello](/it/concepts/model-failover)
