---
read_when:
    - Vuoi servire i modelli dal tuo computer con GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Ti serve la guida più sicura per i modelli locali
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-06-27T17:32:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

I modelli locali sono fattibili. Alzano anche l'asticella per hardware, dimensione del contesto e difesa dalla prompt injection: schede piccole o quantizzate in modo aggressivo troncano il contesto e riducono la sicurezza. Questa pagina è la guida pragmatica per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI. Per un onboarding con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`.

Per i server locali che devono avviarsi solo quando un modello selezionato ne ha bisogno, consulta
[Servizi di modelli locali](/it/gateway/local-model-services).

## Base hardware minima

Punta in alto: **≥2 Mac Studio al massimo della configurazione o un rig GPU equivalente (~$30k+)** per un ciclo agente confortevole. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza maggiore. Esegui sempre la **variante più grande / full-size che puoi ospitare**; checkpoint piccoli o molto quantizzati aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

## Scegli un backend

| Backend                                              | Usalo quando                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [ds4](/it/providers/ds4)                                | DeepSeek V4 Flash locale su macOS Metal con chiamate di strumenti compatibili con OpenAI |
| [LM Studio](/it/providers/lmstudio)                     | Prima configurazione locale, loader GUI, Responses API nativa                   |
| LiteLLM / OAI-proxy / proxy personalizzato compatibile con OpenAI | Fai da front a un'altra API di modello e hai bisogno che OpenClaw la tratti come OpenAI |
| MLX / vLLM / SGLang                                  | Serving self-hosted ad alta produttività con endpoint HTTP compatibile con OpenAI |
| [Ollama](/it/providers/ollama)                          | Flusso di lavoro CLI, libreria di modelli, servizio systemd senza interventi    |

Usa Responses API (`api: "openai-responses"`) quando il backend la supporta (LM Studio lo fa). Altrimenti usa Chat Completions (`api: "openai-completions"`).

<Warning>
**Utenti WSL2 + Ollama + NVIDIA/CUDA:** l'installer Linux ufficiale di Ollama abilita un servizio systemd con `Restart=always`. Su configurazioni GPU WSL2, l'avvio automatico può ricaricare l'ultimo modello durante il boot e bloccare la memoria dell'host. Se la tua VM WSL2 si riavvia ripetutamente dopo aver abilitato Ollama, consulta [Ciclo di crash WSL2](/it/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Consigliato: LM Studio + grande modello locale (Responses API)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa Responses API per mantenere il ragionamento separato dal testo finale.

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
- In LM Studio, scarica la **build del modello più grande disponibile** (evita varianti "small"/molto quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` la elenchi.
- Sostituisci `my-local-model` con l'ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio differisce.
- Per WhatsApp, resta su Responses API così viene inviato solo il testo finale.

Mantieni configurati i modelli ospitati anche quando usi quelli locali; usa `models.mode: "merge"` così i fallback restano disponibili.

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

### Locale prima di tutto con rete di sicurezza ospitata

Scambia l'ordine di primario e fallback; mantieni lo stesso blocco providers e `models.mode: "merge"` così puoi passare a Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dati

- Varianti ospitate MiniMax/Kimi/GLM esistono anche su OpenRouter con endpoint vincolati a una regione (per esempio ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta, continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; l'instradamento regionale ospitato è la via intermedia quando hai bisogno di funzionalità del provider ma vuoi controllare il flusso dei dati.

## Altri proxy locali compatibili con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o gateway
personalizzati funzionano se espongono un endpoint `/v1/chat/completions`
in stile OpenAI. Usa l'adattatore Chat Completions a meno che il backend documenti
esplicitamente il supporto di `/v1/responses`. Sostituisci il blocco provider sopra
con il tuo endpoint e ID modello:

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

Se `api` viene omesso su un provider personalizzato con un `baseUrl`, OpenClaw usa per impostazione predefinita
`openai-completions`. Le voci di provider personalizzati/locali considerano attendibile la loro origine
`baseUrl` esatta configurata per richieste di modello protette, inclusi loopback, LAN, tailnet
e host DNS privati. Le richieste ad altre origini private richiedono comunque
`request.allowPrivateNetwork: true`; le origini metadata/link-local restano bloccate
senza opt-in esplicito. Impostalo su `false` per disattivare l'attendibilità dell'origine esatta.

Il valore `models.providers.<id>.models[].id` è locale al provider. Non
includere lì il prefisso del provider. Per esempio, un server MLX avviato con
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` dovrebbe usare questo
ID di catalogo e riferimento modello:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli vision locali o proxy così gli
allegati immagine vengono inseriti nei turni agente. L'onboarding interattivo per provider
personalizzati deduce gli ID comuni dei modelli vision e chiede solo per nomi sconosciuti.
L'onboarding non interattivo usa la stessa inferenza; usa `--custom-image-input`
per ID vision sconosciuti o `--custom-text-input` quando un modello che sembra noto è
solo testo dietro il tuo endpoint.

Mantieni `models.mode: "merge"` così i modelli ospitati restano disponibili come fallback.
Usa `models.providers.<id>.timeoutSeconds` per server di modelli locali o remoti lenti
prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider
si applica solo alle richieste HTTP del modello, inclusi connessione, header, streaming del corpo
e l'interruzione totale del guarded-fetch. Se il timeout dell'agente o dell'esecuzione è più basso, aumenta
anche quel limite, perché i timeout del provider non possono estendere l'intera esecuzione agente.

<Note>
Per provider personalizzati compatibili con OpenAI, è accettato persistere un marcatore locale non segreto come `apiKey: "ollama-local"` quando `baseUrl` si risolve in loopback, una LAN privata, `.local` o un hostname semplice. OpenClaw lo tratta come una credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetti un hostname pubblico.
</Note>

Nota di comportamento per backend locali/proxy `/v1`:

- OpenClaw li tratta come route compatibili con OpenAI in stile proxy, non come endpoint
  OpenAI nativi
- la modellazione delle richieste solo per OpenAI nativo non si applica qui: niente
  `service_tier`, niente `store` Responses, niente modellazione payload di compatibilità per ragionamento OpenAI
  e niente suggerimenti per prompt-cache
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigorosi:

- Alcuni server accettano solo `messages[].content` stringa su Chat Completions, non
  array strutturati di parti di contenuto. Imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true` per
  quegli endpoint.
- Alcuni modelli locali emettono richieste di strumenti autonome tra parentesi quadre come testo, ad esempio
  `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw promuove
  quelle richieste a vere chiamate di strumenti solo quando il nome corrisponde esattamente a uno strumento
  registrato per il turno; altrimenti il blocco viene trattato come testo non supportato ed è
  nascosto dalle risposte visibili all'utente.
- Se un modello emette JSON, XML o testo in stile ReAct che sembra una chiamata di strumento
  ma il provider non ha emesso un'invocazione strutturata, OpenClaw lo lascia come
  testo e registra un avviso con l'ID esecuzione, provider/modello, pattern rilevato e
  nome dello strumento quando disponibile. Trattalo come incompatibilità delle chiamate di strumenti
  del provider/modello, non come un'esecuzione di strumento completata.
- Se gli strumenti appaiono come testo dell'assistente invece di essere eseguiti, per esempio JSON grezzo,
  XML, sintassi ReAct o un array `tool_calls` vuoto nella risposta del provider,
  verifica prima che il server stia usando un template/parser chat capace di chiamate di strumenti. Per
  backend Chat Completions compatibili con OpenAI il cui parser funziona solo quando l'uso degli strumenti
  è forzato, imposta un override di richiesta per modello invece di fare affidamento sul parsing
  del testo:

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

  Usalo solo per modelli/sessioni in cui ogni turno normale dovrebbe chiamare uno strumento.
  Sovrascrive il valore proxy predefinito di OpenClaw di `tool_choice: "auto"`.
  Sostituisci `local/my-local-model` con il riferimento provider/modello esatto mostrato da
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se un modello personalizzato compatibile con OpenAI accetta sforzi di ragionamento OpenAI oltre
  il profilo integrato, dichiarali nel blocco compat del modello. Aggiungere `"xhigh"`
  qui fa sì che `/think xhigh`, i selettori di sessione, la validazione Gateway e la validazione `llm-task`
  espongano il livello per quel riferimento provider/modello configurato:

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

Se il modello si carica correttamente ma i turni completi dell'agente si comportano in modo anomalo, procedi dall'alto verso il basso: conferma prima il trasporto, poi restringi la superficie.

1. **Conferma che il modello locale stesso risponda.** Nessuno strumento, nessun contesto dell'agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Conferma il routing del Gateway.** Invia solo il prompt fornito: salta trascrizione, bootstrap di AGENTS, assemblaggio del motore di contesto, strumenti e server MCP in bundle, ma esercita comunque routing del Gateway, autenticazione e selezione del provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prova la modalità leggera.** Se entrambe le sonde passano ma i turni reali dell'agente falliscono con chiamate agli strumenti malformate o prompt sovradimensionati, abilita `agents.defaults.experimental.localModelLean: true`. Rimuove i tre strumenti predefiniti più pesanti (`browser`, `cron`, `message`) e mette per impostazione predefinita i cataloghi di strumenti più grandi dietro controlli strutturati di Ricerca strumenti, tranne per le esecuzioni che devono mantenere la semantica di consegna diretta di `message`. Consulta [Funzionalità sperimentali → Modalità leggera per modelli locali](/it/concepts/experimental-features#local-model-lean-mode) per la spiegazione completa, quando usarla e come confermare che sia attiva.

4. **Disabilita completamente gli strumenti come ultima risorsa.** Se la modalità leggera non basta, imposta `models.providers.<provider>.models[].compat.supportsTools: false` per quella voce del modello. L'agente opererà quindi senza chiamate agli strumenti su quel modello.

5. **Oltre questo punto, il collo di bottiglia è a monte.** Se il backend continua a fallire solo su esecuzioni OpenClaw più grandi dopo la modalità leggera e `supportsTools: false`, il problema rimanente è di solito la capacità del modello o del server a monte: finestra di contesto, memoria GPU, eliminazione della kv-cache o un bug del backend. A quel punto non è il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway può raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato? Ricaricalo; l'avvio a freddo è una causa comune di "blocco".
- Il server locale indica `terminated`, `ECONNRESET` o chiude lo stream a metà turno?
  OpenClaw registra un `model.call.error.failureKind` a bassa cardinalità più lo
  snapshot RSS/heap del processo OpenClaw nella diagnostica. Per la pressione
  di memoria di LM Studio/Ollama, confronta quel timestamp con il log del server o con il log di crash /
  jetsam di macOS per confermare se il server del modello è stato terminato.
- OpenClaw deriva le soglie di preflight della finestra di contesto dalla finestra del modello rilevata, o dalla finestra del modello senza limite quando `agents.defaults.contextTokens` abbassa la finestra effettiva. Avvisa sotto il 20% con un limite minimo di **8k**. I blocchi rigidi usano la soglia del 10% con un limite minimo di **4k**, con limite massimo alla finestra di contesto effettiva così che metadati del modello sovradimensionati non possano rifiutare un limite utente altrimenti valido. Se incontri quel preflight, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Abbassa `contextWindow` o aumenta il limite del server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` a quella voce del modello.
- Il server compatibile con OpenAI restituisce `validation.keys` o dice che le voci dei messaggi consentono solo `role` e `content`?
  Aggiungi `compat.strictMessageKeys: true` a quella voce del modello.
- Le chiamate dirette minuscole a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local`
  fallisce su Gemma o su un altro modello locale? Controlla prima l'URL del provider, il riferimento del modello, il marcatore di autenticazione
  e i log del server; `model run` locale non include gli strumenti dell'agente.
  Se `model run` locale riesce ma i turni dell'agente più grandi falliscono, riduci la
  superficie degli strumenti dell'agente con `localModelLean` o `compat.supportsTools: false`.
- Le chiamate agli strumenti compaiono come testo JSON/XML/ReAct grezzo, oppure il provider restituisce un
  array `tool_calls` vuoto? Non aggiungere un proxy che converte alla cieca il testo
  dell'assistente in esecuzione di strumenti. Correggi prima il template/parser della chat del server. Se il
  modello funziona solo quando l'uso degli strumenti è forzato, aggiungi l'override per modello
  `params.extra_body.tool_choice: "required"` sopra e usa quella voce del modello
  solo per sessioni in cui è prevista una chiamata a uno strumento a ogni turno.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti ristretti e la Compaction attiva per limitare il raggio d'impatto della prompt injection.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Failover del modello](/it/concepts/model-failover)
