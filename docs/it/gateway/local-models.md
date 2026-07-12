---
read_when:
    - Vuoi eseguire i modelli sul tuo server dotato di GPU
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Hai bisogno di indicazioni sul modello locale più sicuro
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-07-12T07:03:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

I modelli locali funzionano, ma impongono requisiti più elevati in termini di hardware, dimensione del contesto e difesa dalla prompt injection: i modelli piccoli o quantizzati in modo aggressivo troncano il contesto e non applicano i filtri di sicurezza lato provider. Questa pagina tratta stack locali di fascia alta e server personalizzati compatibili con OpenAI. Per il percorso più semplice, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`.

Per i server locali che devono avviarsi solo quando sono necessari a un modello selezionato, consulta [Servizi per modelli locali](/it/gateway/local-model-services).

## Requisiti hardware minimi

Punta ad almeno **2 Mac Studio con configurazione massima o a un sistema GPU equivalente (~30.000 $ o più)** per un ciclo dell'agente fluido. Una singola GPU da **24 GB** gestisce solo prompt più leggeri con una latenza maggiore. Esegui sempre la **variante più grande / a dimensione completa che puoi ospitare**: i checkpoint piccoli o fortemente quantizzati aumentano il rischio di prompt injection (consulta [Sicurezza](/it/gateway/security)).

## Scegli un backend

| Backend                                              | Quando usarlo                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [ds4](/it/providers/ds4)                                | DeepSeek V4 Flash locale su macOS Metal con chiamate agli strumenti compatibili con OpenAI            |
| [LM Studio](/it/providers/lmstudio)                     | Prima configurazione locale, caricatore con GUI, API Responses nativa                                 |
| LiteLLM / OAI-proxy / proxy personalizzato compatibile con OpenAI | Quando esponi un'altra API per modelli e vuoi che OpenClaw la tratti come OpenAI            |
| MLX / vLLM / SGLang                                  | Servizio self-hosted ad alta capacità con un endpoint HTTP compatibile con OpenAI                      |
| [Ollama](/it/providers/ollama)                          | Flusso di lavoro CLI, libreria di modelli, servizio systemd senza necessità di gestione manuale        |

Usa `api: "openai-responses"` quando il backend lo supporta (LM Studio lo supporta). Altrimenti usa `api: "openai-completions"`. Se `api` viene omesso in un provider personalizzato con un `baseUrl`, OpenClaw usa per impostazione predefinita `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** il programma di installazione ufficiale di Ollama per Linux abilita un servizio systemd con `Restart=always`. Nelle configurazioni GPU WSL2, l'avvio automatico può ricaricare l'ultimo modello durante l'avvio e occupare stabilmente la memoria dell'host, causando riavvii ripetuti della macchina virtuale. Consulta [Ciclo di arresti anomali di WSL2](/it/providers/ollama#troubleshooting).
</Warning>

## LM Studio + modello locale di grandi dimensioni (API Responses)

Questo è attualmente il miglior stack locale. Carica un modello di grandi dimensioni in LM Studio (una build completa di Qwen, DeepSeek o Llama), abilita il server locale (valore predefinito `http://127.0.0.1:1234`) e usa l'API Responses per mantenere il ragionamento separato dal testo finale.

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

Elenco di controllo per la configurazione:

- Installa LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Scarica la **build del modello più grande disponibile** (evita le varianti "small"/fortemente quantizzate), avvia il server e verifica che `http://127.0.0.1:1234/v1/models` la elenchi.
- Sostituisci `my-local-model` con l'ID effettivo del modello mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aumenta la latenza di avvio.
- Modifica `contextWindow`/`maxTokens` se la tua build di LM Studio usa valori diversi.
- Per WhatsApp, usa l'API Responses affinché venga inviato solo il testo finale.
- Mantieni `models.mode: "merge"` affinché i modelli ospitati restino disponibili come ripieghi.

### Configurazione ibrida: primario ospitato, ripiego locale

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

Per dare priorità al modello locale con un modello ospitato come rete di sicurezza, inverti l'ordine di `primary`/`fallbacks` e mantieni invariati il blocco `providers` e `models.mode: "merge"`.

### Hosting regionale / instradamento dei dati

Le varianti ospitate di MiniMax/Kimi/GLM sono disponibili anche su OpenRouter con endpoint vincolati a una regione (ad esempio, ospitati negli Stati Uniti). Scegli la variante regionale per mantenere il traffico nella giurisdizione selezionata, continuando a usare `models.mode: "merge"` per i ripieghi Anthropic/OpenAI. L'esecuzione esclusivamente locale rimane la soluzione che offre la massima privacy; l'instradamento regionale ospitato è una via di mezzo quando servono le funzionalità del provider ma si desidera mantenere il controllo sul flusso dei dati.

## Altri proxy locali compatibili con OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy o qualsiasi gateway personalizzato funzionano se espongono un endpoint `/v1/chat/completions` in stile OpenAI. Usa `openai-completions`, a meno che il backend non documenti esplicitamente il supporto di `/v1/responses`.

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

Le voci dei provider personalizzati/locali considerano attendibile l'origine esatta del `baseUrl` configurato per le richieste protette ai modelli, inclusi gli host di loopback, LAN, tailnet e DNS privato. Le origini di metadati/link-local sono sempre bloccate, indipendentemente dalla configurazione. Le richieste verso altre origini private richiedono comunque `models.providers.<id>.request.allowPrivateNetwork: true`; imposta il flag di attendibilità su `false` per disattivare l'attendibilità dell'origine esatta.

`models.providers.<id>.models[].id` è locale al provider: non includere il prefisso del provider. Per un server MLX avviato con `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Imposta `input: ["text", "image"]` sui modelli di visione locali o accessibili tramite proxy, affinché gli allegati immagine vengano inseriti nei turni dell'agente. La configurazione interattiva dei provider personalizzati riconosce gli ID comuni dei modelli di visione e pone domande solo per i nomi sconosciuti; la configurazione non interattiva usa lo stesso riconoscimento, con `--custom-image-input` / `--custom-text-input` per sostituirne il risultato.

Usa `models.providers.<id>.timeoutSeconds` per i server di modelli locali/remoti lenti prima di aumentare `agents.defaults.timeoutSeconds`. Il timeout del provider comprende connessione, intestazioni, streaming del corpo e interruzione complessiva del recupero protetto solo per le richieste HTTP al modello; se il timeout dell'agente/esecuzione è inferiore, aumenta anche quello, poiché il timeout del provider non può prolungare l'intera esecuzione.

<Note>
Per i provider personalizzati compatibili con OpenAI, viene accettato un indicatore locale non segreto come `apiKey: "ollama-local"` quando `baseUrl` viene risolto come loopback, LAN privata, `.local` o nome host semplice: OpenClaw lo considera una credenziale locale valida invece di segnalare una chiave mancante. Usa un valore reale per qualsiasi provider che accetti un nome host pubblico.
</Note>

Note sul comportamento dei backend `/v1` locali/accessibili tramite proxy:

- OpenClaw li tratta come route proxy compatibili con OpenAI, non come endpoint OpenAI nativi.
- La definizione delle richieste specifica degli endpoint OpenAI nativi non si applica: niente `service_tier`, niente `store` di Responses, niente adattamento del payload per la compatibilità del ragionamento OpenAI, niente suggerimenti per la cache dei prompt.
- Le intestazioni di attribuzione nascoste di OpenClaw (`originator`, `version`, `User-Agent`) non vengono inserite negli URL dei proxy personalizzati.

Override di compatibilità per backend compatibili con OpenAI più rigorosi:

- **Contenuto solo stringa**: alcuni server accettano per `messages[].content` solo stringhe, non array strutturati di parti del contenuto. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Chiavi dei messaggi rigorose**: se il server rifiuta le voci dei messaggi contenenti chiavi diverse da `role`/`content`, imposta `compat.strictMessageKeys: true`.
- **Testo degli strumenti tra parentesi quadre**: alcuni modelli locali emettono come testo richieste autonome agli strumenti tra parentesi quadre, ad esempio `[tool_name]` seguito da JSON e `[END_TOOL_REQUEST]`. OpenClaw le trasforma in vere chiamate agli strumenti solo quando il nome corrisponde esattamente a uno strumento registrato per il turno; in caso contrario, rimangono testo nascosto non supportato.
- **Testo non strutturato simile a una chiamata a uno strumento**: se un modello emette testo in stile JSON/XML/ReAct che sembra una chiamata a uno strumento ma non era un'invocazione strutturata, OpenClaw lo lascia come testo e registra un avviso con l'ID dell'esecuzione, il provider/modello, il modello sintattico rilevato e, quando disponibile, il nome dello strumento. Si tratta di un'incompatibilità del provider/modello, non di un'esecuzione dello strumento completata.
- **Forzare l'uso degli strumenti**: se gli strumenti compaiono come testo dell'assistente (JSON/XML/ReAct grezzo oppure un array `tool_calls` vuoto), verifica innanzitutto che il template/parser di chat del server supporti le chiamate agli strumenti. Se il parser funziona solo quando l'uso degli strumenti è forzato, sostituisci il valore proxy predefinito `tool_choice: "auto"` per il singolo modello:

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

  Usalo solo quando ogni turno normale deve chiamare uno strumento. Sostituisci `local/my-local-model` con il riferimento esatto restituito da `openclaw models list` oppure impostalo tramite CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Livelli di ragionamento aggiuntivi**: se un modello personalizzato compatibile con OpenAI accetta livelli di ragionamento OpenAI oltre al profilo integrato, dichiarali nel blocco di compatibilità del modello. L'aggiunta di `"xhigh"` lo rende disponibile per il riferimento del modello in `/think xhigh`, nei selettori di sessione, nella convalida del Gateway e nella convalida di `llm-task`:

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

Se il modello viene caricato correttamente ma i turni completi dell'agente si comportano in modo anomalo, procedi dall'alto verso il basso: verifica prima il trasporto, quindi restringi la superficie.

1. **Verifica che il modello locale risponda**: senza strumenti, senza contesto dell'agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Conferma l'instradamento del Gateway** - invia solo il prompt, omettendo la trascrizione, il bootstrap di AGENTS, l'assemblaggio del motore di contesto, gli strumenti e i server MCP inclusi, ma verifica comunque l'instradamento del Gateway, l'autenticazione e la selezione del provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Prova la modalità snella** se entrambe le verifiche riescono, ma le interazioni reali dell'agente non vanno a buon fine a causa di chiamate agli strumenti non valide o prompt sovradimensionati: imposta `agents.defaults.experimental.localModelLean: true`. Questa modalità esclude gli strumenti pesanti per browser, Cron, messaggistica, generazione multimediale, voce e PDF, a meno che non siano esplicitamente necessari, e per impostazione predefinita rende disponibili i cataloghi di strumenti più ampi tramite controlli strutturati di ricerca degli strumenti, mantenendo `exec` direttamente visibile. Per i dettagli e per sapere come verificare che sia attiva, consulta [Funzionalità sperimentali -> Modalità snella per i modelli locali](/it/concepts/experimental-features#local-model-lean-mode).

4. **Disabilita completamente gli strumenti come ultima risorsa** impostando `models.providers.<provider>.models[].compat.supportsTools: false` per quel modello; l'agente verrà quindi eseguito senza chiamate agli strumenti.

5. **Oltre questo punto, il collo di bottiglia è a monte.** Se, dopo aver attivato la modalità snella e `supportsTools: false`, il backend continua a non funzionare solo nelle esecuzioni OpenClaw più grandi, il problema residuo riguarda in genere il modello o il server stesso, ad esempio la finestra di contesto, la memoria della GPU, l'espulsione dalla cache KV o un bug del backend, e non il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- **Il Gateway non riesce a raggiungere il proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **Il modello di LM Studio è stato scaricato dalla memoria?** Ricaricalo; l'avvio a freddo è una causa comune di apparente blocco.
- **Il server locale segnala `terminated`, `ECONNRESET` o chiude il flusso durante un'interazione?** OpenClaw registra nella diagnostica un valore `model.call.error.failureKind` a bassa cardinalità insieme a un'istantanea della memoria RSS/heap del processo OpenClaw. In caso di pressione sulla memoria di LM Studio/Ollama, confronta il relativo timestamp con il log del server o con un log di arresto anomalo/jetsam di macOS per verificare se il server del modello è stato terminato.
- **Errori di contesto?** OpenClaw ricava le soglie di verifica preliminare della finestra di contesto dalla finestra rilevata per il modello, oppure dalla finestra limitata quando `agents.defaults.contextTokens` la riduce: genera un avviso sotto il 20%, con un minimo di **8k**, e blocca l'esecuzione sotto il 10%, con un minimo di **4k**. Le soglie sono limitate alla finestra di contesto effettiva, affinché metadati sovradimensionati del modello non possano invalidare un limite utente valido. Riduci `contextWindow` oppure aumenta il limite di contesto del server o del modello.
- **`messages[].content ... expected a string`?** Aggiungi `compat.requiresStringContent: true` alla voce di quel modello.
- **`validation.keys` oppure "message entries only allow `role` and `content`"?** Aggiungi `compat.strictMessageKeys: true` alla voce di quel modello.
- **Le chiamate dirette a `/v1/chat/completions` funzionano, ma `openclaw infer model run --local` non riesce con Gemma o un altro modello locale?** Controlla prima l'URL del provider, il riferimento al modello, l'indicatore di autenticazione e i log del server: `model run` omette completamente gli strumenti dell'agente. Se `model run` riesce, ma le interazioni più grandi dell'agente non vanno a buon fine, riduci l'insieme degli strumenti con `localModelLean` o `compat.supportsTools: false`.
- **Le chiamate agli strumenti vengono visualizzate come testo JSON/XML/ReAct non elaborato oppure il provider restituisce un array `tool_calls` vuoto?** Non aggiungere un proxy che converta indiscriminatamente il testo dell'assistente in esecuzioni di strumenti: correggi prima il modello di chat o il parser del server. Se il modello funziona solo quando l'uso degli strumenti è obbligatorio, aggiungi la sostituzione `params.extra_body.tool_choice: "required"` indicata sopra e utilizza quella voce del modello solo per le sessioni in cui è prevista una chiamata a uno strumento a ogni interazione.
- **Sicurezza**: i modelli locali non applicano i filtri lato provider. Mantieni gli agenti circoscritti e la Compaction attiva per limitare l'impatto delle iniezioni nel prompt.

## Contenuti correlati

- [Riferimento per la configurazione](/it/gateway/configuration-reference)
- [Failover del modello](/it/concepts/model-failover)
