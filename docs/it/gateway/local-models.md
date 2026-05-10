---
read_when:
    - Vuoi servire i modelli dalla tua macchina con GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Ti serve la guida più sicura sui modelli locali
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-05-10T19:36:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

I modelli locali sono realizzabili. Alzano anche l'asticella per hardware, dimensione del contesto e difesa dalla prompt injection: schede piccole o quantizzate in modo aggressivo troncano il contesto e riducono la sicurezza. Questa pagina è la guida orientata per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI. Per l'onboarding con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`.

Per i server locali che dovrebbero avviarsi solo quando un modello selezionato ne ha bisogno, vedi
[Servizi di modelli locali](/it/gateway/local-model-services).

## Soglia hardware minima

Punta in alto: **≥2 Mac Studio al massimo della configurazione o un rig GPU equivalente (~$30k+)** per un ciclo dell'agente confortevole. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza più alta. Esegui sempre la **variante più grande / a dimensione piena che puoi ospitare**; checkpoint piccoli o fortemente quantizzati aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

## Scegli un backend

| Backend                                              | Da usare quando                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/it/providers/lmstudio)                     | Prima configurazione locale, loader GUI, API Responses nativa               |
| [Ollama](/it/providers/ollama)                          | Flusso di lavoro CLI, libreria di modelli, servizio systemd senza interventi |
| MLX / vLLM / SGLang                                  | Serving self-hosted ad alto throughput con endpoint HTTP compatibile con OpenAI |
| LiteLLM / OAI-proxy / proxy personalizzato compatibile con OpenAI | Hai davanti un'altra API di modelli e devi fare in modo che OpenClaw la tratti come OpenAI |

Usa Responses API (`api: "openai-responses"`) quando il backend la supporta (LM Studio lo fa). Altrimenti resta su Chat Completions (`api: "openai-completions"`).

<Warning>
**Utenti WSL2 + Ollama + NVIDIA/CUDA:** l'installer Linux ufficiale di Ollama abilita un servizio systemd con `Restart=always`. Nelle configurazioni GPU su WSL2, l'avvio automatico può ricaricare l'ultimo modello durante il boot e bloccare la memoria dell'host. Se la tua VM WSL2 si riavvia ripetutamente dopo aver abilitato Ollama, vedi [loop di crash WSL2](/it/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Consigliato: LM Studio + modello locale grande (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio, una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per mantenere il ragionamento separato dal testo finale.

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
- In LM Studio, scarica la **build di modello più grande disponibile** (evita varianti "small"/fortemente quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` la elenchi.
- Sostituisci `my-local-model` con l'ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza all'avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio è diversa.
- Per WhatsApp, resta su Responses API in modo che venga inviato solo il testo finale.

Mantieni configurati i modelli ospitati anche quando esegui in locale; usa `models.mode: "merge"` in modo che i fallback restino disponibili.

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

### Local-first con rete di sicurezza ospitata

Scambia l'ordine di primario e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` in modo da poter ricorrere a Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / routing dei dati

- Varianti ospitate di MiniMax/Kimi/GLM esistono anche su OpenRouter con endpoint vincolati alla regione (ad esempio, ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta usando comunque `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso con la privacy più forte; il routing regionale ospitato è la via intermedia quando hai bisogno delle funzionalità del provider ma vuoi controllare il flusso dei dati.

## Altri proxy locali compatibili con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o Gateway personalizzati funzionano se espongono un endpoint `/v1/chat/completions` in stile OpenAI. Usa l'adapter Chat Completions a meno che il backend non documenti esplicitamente il supporto per `/v1/responses`. Sostituisci il blocco provider sopra con il tuo endpoint e l'ID modello:

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

Se `api` viene omesso su un provider personalizzato con un `baseUrl`, OpenClaw usa per impostazione predefinita `openai-completions`. Gli endpoint di loopback come `127.0.0.1` sono considerati attendibili automaticamente; gli endpoint LAN, tailnet e DNS privati richiedono comunque `request.allowPrivateNetwork: true`.

Il valore `models.providers.<id>.models[].id` è locale al provider. Non includere lì il prefisso del provider. Per esempio, un server MLX avviato con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` dovrebbe usare questo ID di catalogo e riferimento modello:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli di visione locali o proxati in modo che gli allegati immagine vengano inseriti nei turni dell'agente. L'onboarding interattivo di provider personalizzati inferisce gli ID dei modelli di visione comuni e chiede solo i nomi sconosciuti. L'onboarding non interattivo usa la stessa inferenza; usa `--custom-image-input` per ID di visione sconosciuti o `--custom-text-input` quando un modello che sembra noto è solo testo dietro il tuo endpoint.

Mantieni `models.mode: "merge"` in modo che i modelli ospitati restino disponibili come fallback.
Usa `models.providers.<id>.timeoutSeconds` per server di modelli locali o remoti lenti prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider si applica solo alle richieste HTTP del modello, inclusi connessione, header, streaming del corpo e abort guarded-fetch totale.

<Note>
Per provider personalizzati compatibili con OpenAI, la persistenza di un indicatore locale non segreto come `apiKey: "ollama-local"` è accettata quando `baseUrl` si risolve su loopback, una LAN privata, `.local` o un hostname semplice. OpenClaw lo tratta come una credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetta un hostname pubblico.
</Note>

Nota di comportamento per backend `/v1` locali/proxati:

- OpenClaw li tratta come rotte compatibili con OpenAI in stile proxy, non come endpoint OpenAI nativi
- lo shaping delle richieste solo OpenAI native non si applica qui: niente `service_tier`, niente Responses `store`, niente shaping del payload di compatibilità per il reasoning OpenAI e niente suggerimenti per la cache dei prompt
- gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`) non vengono iniettati su questi URL di proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigorosi:

- Alcuni server accettano solo `messages[].content` stringa su Chat Completions, non array strutturati di parti di contenuto. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true` per quegli endpoint.
- Alcuni modelli locali emettono richieste di strumenti tra parentesi quadre autonome come testo, ad esempio `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw le promuove a vere chiamate strumento solo quando il nome corrisponde esattamente a uno strumento registrato per il turno; altrimenti il blocco viene trattato come testo non supportato ed è nascosto dalle risposte visibili all'utente.
- Se un modello emette JSON, XML o testo in stile ReAct che sembra una chiamata strumento ma il provider non ha emesso un'invocazione strutturata, OpenClaw lo lascia come testo e registra un avviso con l'ID esecuzione, provider/modello, pattern rilevato e nome dello strumento quando disponibile. Consideralo un'incompatibilità delle chiamate strumento del provider/modello, non un'esecuzione dello strumento completata.
- Se gli strumenti appaiono come testo dell'assistente invece di essere eseguiti, per esempio JSON grezzo, XML, sintassi ReAct o un array `tool_calls` vuoto nella risposta del provider, verifica prima che il server stia usando un template/parser chat capace di chiamate strumento. Per backend Chat Completions compatibili con OpenAI il cui parser funziona solo quando l'uso degli strumenti è forzato, imposta un override di richiesta per modello invece di fare affidamento sul parsing del testo:

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

  Usalo solo per modelli/sessioni in cui ogni turno normale dovrebbe chiamare uno strumento. Sostituisce il valore proxy predefinito di OpenClaw di `tool_choice: "auto"`.
  Sostituisci `local/my-local-model` con il riferimento provider/modello esatto mostrato da `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se un modello personalizzato compatibile con OpenAI accetta livelli di impegno di reasoning OpenAI oltre il profilo integrato, dichiarali nel blocco compat del modello. Aggiungere `"xhigh"` qui fa sì che `/think xhigh`, i selettori di sessione, la validazione del Gateway e la validazione di `llm-task` espongano il livello per quel riferimento provider/modello configurato:

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

Se il modello si carica correttamente ma i turni completi dell’agente si comportano male, procedi dall’alto verso il basso: conferma prima il trasporto, poi restringi la superficie.

1. **Conferma che il modello locale risponda.** Nessuno strumento, nessun contesto dell’agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Conferma il routing del Gateway.** Invia solo il prompt fornito: salta transcript, bootstrap AGENTS, assemblaggio del context-engine, strumenti e server MCP inclusi, ma esercita comunque routing del Gateway, autenticazione e selezione del provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prova la modalità lean.** Se entrambe le sonde passano ma i turni reali dell’agente falliscono con chiamate a strumenti malformate o prompt troppo grandi, abilita `agents.defaults.experimental.localModelLean: true`. Rimuove i tre strumenti predefiniti più pesanti (`browser`, `cron`, `message`) così la forma del prompt è più piccola e meno fragile. Vedi [Funzionalità sperimentali → Modalità lean per modello locale](/it/concepts/experimental-features#local-model-lean-mode) per la spiegazione completa, quando usarla e come confermare che sia attiva.

4. **Disabilita completamente gli strumenti come ultima risorsa.** Se la modalità lean non basta, imposta `models.providers.<provider>.models[].compat.supportsTools: false` per quella voce di modello. L’agente opererà quindi senza chiamate a strumenti su quel modello.

5. **Oltre questo punto, il collo di bottiglia è upstream.** Se il backend continua a fallire solo su esecuzioni OpenClaw più grandi dopo la modalità lean e `supportsTools: false`, il problema restante è di solito la capacità del modello o del server upstream: finestra di contesto, memoria GPU, espulsione dalla kv-cache o un bug del backend. A quel punto non è il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway può raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato? Ricaricalo; l’avvio a freddo è una causa comune di “blocco”.
- Il server locale segnala `terminated`, `ECONNRESET` o chiude lo stream a metà turno?
  OpenClaw registra un `model.call.error.failureKind` a bassa cardinalità più lo
  snapshot RSS/heap del processo OpenClaw nella diagnostica. Per pressione di
  memoria di LM Studio/Ollama, confronta quel timestamp con il log del server o
  con il log di crash / jetsam di macOS per confermare se il server del modello è stato terminato.
- OpenClaw deriva le soglie di preflight della finestra di contesto dalla finestra del modello rilevata, o dalla finestra del modello senza limite quando `agents.defaults.contextTokens` abbassa la finestra effettiva. Avvisa sotto il 20% con un minimo di **8k**. I blocchi rigidi usano la soglia del 10% con un minimo di **4k**, limitata alla finestra di contesto effettiva così metadati del modello sovradimensionati non possono rifiutare un limite utente altrimenti valido. Se incontri quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Abbassa `contextWindow` o aumenta il limite del server.
- Un server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` a quella voce di modello.
- Un server compatibile con OpenAI restituisce `validation.keys` o dice che le voci dei messaggi consentono solo `role` e `content`?
  Aggiungi `compat.strictMessageKeys: true` a quella voce di modello.
- Le chiamate minuscole dirette a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local`
  fallisce su Gemma o su un altro modello locale? Controlla prima URL del provider, riferimento del modello, marker di autenticazione
  e log del server; `model run` locale non include strumenti dell’agente.
  Se `model run` locale riesce ma i turni dell’agente più grandi falliscono, riduci la superficie
  degli strumenti dell’agente con `localModelLean` o `compat.supportsTools: false`.
- Le chiamate a strumenti compaiono come testo JSON/XML/ReAct grezzo, o il provider restituisce un
  array `tool_calls` vuoto? Non aggiungere un proxy che converte alla cieca il testo
  dell’assistente in esecuzione di strumenti. Correggi prima il template/parser chat del server. Se il
  modello funziona solo quando l’uso degli strumenti è forzato, aggiungi l’override per modello
  `params.extra_body.tool_choice: "required"` sopra e usa quella voce di modello
  solo per sessioni in cui è prevista una chiamata a strumenti a ogni turno.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti mirati e Compaction attiva per limitare il raggio d’azione della prompt injection.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Failover dei modelli](/it/concepts/model-failover)
