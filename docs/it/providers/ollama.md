---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di indicazioni per setup e configurazione di Ollama
summary: Esegui OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T14:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama è un runtime LLM locale che rende semplice eseguire modelli open-source sulla tua macchina. OpenClaw si integra con l'API nativa di Ollama (`/api/chat`), supporta streaming e tool calling e può rilevare automaticamente i modelli Ollama locali quando abiliti `OLLAMA_API_KEY` (o un profilo auth) e non definisci una voce esplicita `models.providers.ollama`.

<Warning>
**Utenti di Ollama remoto**: non usare l'URL compatibile con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Questo interrompe il tool calling e i modelli possono produrre JSON di tool grezzo come testo normale. Usa invece l'URL dell'API nativa di Ollama: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

## Avvio rapido

### Onboarding (consigliato)

Il modo più rapido per configurare Ollama è tramite l'onboarding:

```bash
openclaw onboard
```

Seleziona **Ollama** dall'elenco dei provider. L'onboarding:

1. Chiederà il base URL di Ollama dove la tua istanza è raggiungibile (predefinito `http://127.0.0.1:11434`).
2. Ti permetterà di scegliere **Cloud + Local** (modelli cloud e locali) oppure **Local** (solo modelli locali).
3. Aprirà un flusso di accesso via browser se scegli **Cloud + Local** e non hai effettuato l'accesso a ollama.com.
4. Rileverà i modelli disponibili e suggerirà i valori predefiniti.
5. Eseguirà automaticamente il pull del modello selezionato se non è disponibile localmente.

È supportata anche la modalità non interattiva:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Facoltativamente puoi specificare un base URL o un modello personalizzati:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Configurazione manuale

1. Installa Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Esegui il pull di un modello locale se vuoi inferenza locale:

```bash
ollama pull glm-4.7-flash
# oppure
ollama pull gpt-oss:20b
# oppure
ollama pull llama3.3
```

3. Se vuoi anche i modelli cloud, effettua l'accesso:

```bash
ollama signin
```

4. Esegui l'onboarding e scegli `Ollama`:

```bash
openclaw onboard
```

- `Local`: solo modelli locali
- `Cloud + Local`: modelli locali più modelli cloud
- I modelli cloud come `kimi-k2.5:cloud`, `minimax-m2.5:cloud` e `glm-5:cloud` **non** richiedono un `ollama pull` locale

OpenClaw al momento suggerisce:

- predefinito locale: `glm-4.7-flash`
- predefiniti cloud: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Se preferisci la configurazione manuale, abilita direttamente Ollama per OpenClaw (qualsiasi valore va bene; Ollama non richiede una chiave reale):

```bash
# Imposta la variabile d'ambiente
export OLLAMA_API_KEY="ollama-local"

# Oppure configura nel file di configurazione
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Ispeziona o cambia modello:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Oppure imposta il predefinito nella configurazione:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Rilevamento dei modelli (provider implicito)

Quando imposti `OLLAMA_API_KEY` (o un profilo auth) e **non** definisci `models.providers.ollama`, OpenClaw rileva i modelli dall'istanza Ollama locale su `http://127.0.0.1:11434`:

- Interroga `/api/tags`
- Usa lookup `/api/show` best-effort per leggere `contextWindow` quando disponibile
- Contrassegna `reasoning` con un'euristica sul nome del modello (`r1`, `reasoning`, `think`)
- Imposta `maxTokens` al limite massimo di token predefinito di Ollama usato da OpenClaw
- Imposta tutti i costi a `0`

Questo evita voci di modello manuali mantenendo il catalogo allineato con l'istanza Ollama locale.

Per vedere quali modelli sono disponibili:

```bash
ollama list
openclaw models list
```

Per aggiungere un nuovo modello, esegui semplicemente il pull con Ollama:

```bash
ollama pull mistral
```

Il nuovo modello verrà rilevato automaticamente e sarà disponibile all'uso.

Se imposti esplicitamente `models.providers.ollama`, il rilevamento automatico viene saltato e dovrai definire i modelli manualmente (vedi sotto).

## Configurazione

### Configurazione di base (rilevamento implicito)

Il modo più semplice per abilitare Ollama è tramite variabile d'ambiente:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Configurazione esplicita (modelli manuali)

Usa la configurazione esplicita quando:

- Ollama è in esecuzione su un altro host/porta.
- Vuoi forzare specifiche finestre di contesto o elenchi di modelli.
- Vuoi definizioni di modelli completamente manuali.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Se `OLLAMA_API_KEY` è impostata, puoi omettere `apiKey` nella voce provider e OpenClaw la userà per i controlli di disponibilità.

### Base URL personalizzato (configurazione esplicita)

Se Ollama è in esecuzione su un host o una porta diversi (la configurazione esplicita disabilita il rilevamento automatico, quindi definisci i modelli manualmente):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Nessun /v1 - usa l'URL dell'API nativa di Ollama
        api: "ollama", // Impostalo esplicitamente per garantire il comportamento nativo del tool calling
      },
    },
  },
}
```

<Warning>
Non aggiungere `/v1` all'URL. Il percorso `/v1` usa la modalità compatibile con OpenAI, in cui il tool calling non è affidabile. Usa il base URL di Ollama senza suffisso di percorso.
</Warning>

### Selezione del modello

Una volta configurato, tutti i tuoi modelli Ollama sono disponibili:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Modelli cloud

I modelli cloud ti permettono di eseguire modelli ospitati nel cloud (per esempio `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) insieme ai tuoi modelli locali.

Per usare i modelli cloud, seleziona la modalità **Cloud + Local** durante il setup. La procedura guidata controlla se hai effettuato l'accesso e apre un flusso di login via browser quando necessario. Se l'autenticazione non può essere verificata, la procedura guidata torna ai valori predefiniti dei modelli locali.

Puoi anche effettuare l'accesso direttamente su [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw supporta anche **Ollama Web Search** come provider bundled `web_search`.

- Usa l'host Ollama configurato (`models.providers.ollama.baseUrl` quando impostato, altrimenti `http://127.0.0.1:11434`).
- Non richiede chiave.
- Richiede che Ollama sia in esecuzione e che tu abbia effettuato l'accesso con `ollama signin`.

Scegli **Ollama Web Search** durante `openclaw onboard` oppure
`openclaw configure --section web`, oppure imposta:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Per i dettagli completi di setup e comportamento, vedi [Ollama Web Search](/tools/ollama-search).

## Avanzato

### Modelli di reasoning

OpenClaw tratta per default come compatibili con il reasoning i modelli con nomi come `deepseek-r1`, `reasoning` o `think`:

```bash
ollama pull deepseek-r1:32b
```

### Costi dei modelli

Ollama è gratuito e gira localmente, quindi tutti i costi dei modelli sono impostati a $0.

### Configurazione dello streaming

L'integrazione Ollama di OpenClaw usa per default l'**API nativa di Ollama** (`/api/chat`), che supporta pienamente streaming e tool calling contemporaneamente. Non è necessaria alcuna configurazione speciale.

#### Modalità legacy compatibile con OpenAI

<Warning>
**Il tool calling non è affidabile in modalità compatibile con OpenAI.** Usa questa modalità solo se hai bisogno del formato OpenAI per un proxy e non dipendi dal comportamento nativo del tool calling.
</Warning>

Se hai bisogno di usare invece l'endpoint compatibile con OpenAI (ad esempio dietro un proxy che supporta solo il formato OpenAI), imposta esplicitamente `api: "openai-completions"`:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // predefinito: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Questa modalità potrebbe non supportare contemporaneamente streaming + tool calling. Potresti dover disabilitare lo streaming con `params: { streaming: false }` nella configurazione del modello.

Quando `api: "openai-completions"` viene usato con Ollama, OpenClaw inietta `options.num_ctx` per default così Ollama non ricade silenziosamente su una finestra di contesto di 4096. Se il tuo proxy/upstream rifiuta campi `options` sconosciuti, disabilita questo comportamento:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Finestre di contesto

Per i modelli rilevati automaticamente, OpenClaw usa la finestra di contesto riportata da Ollama quando disponibile, altrimenti usa la finestra di contesto predefinita di Ollama usata da OpenClaw. Puoi sovrascrivere `contextWindow` e `maxTokens` nella configurazione esplicita del provider.

## Risoluzione dei problemi

### Ollama non viene rilevato

Assicurati che Ollama sia in esecuzione, che tu abbia impostato `OLLAMA_API_KEY` (o un profilo auth) e che **non** abbia definito una voce esplicita `models.providers.ollama`:

```bash
ollama serve
```

E che l'API sia accessibile:

```bash
curl http://localhost:11434/api/tags
```

### Nessun modello disponibile

Se il tuo modello non è elencato, puoi:

- eseguire il pull del modello localmente, oppure
- definire esplicitamente il modello in `models.providers.ollama`.

Per aggiungere modelli:

```bash
ollama list  # Vedi cosa è installato
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Oppure un altro modello
```

### Connessione rifiutata

Controlla che Ollama sia in esecuzione sulla porta corretta:

```bash
# Controlla se Ollama è in esecuzione
ps aux | grep ollama

# Oppure riavvia Ollama
ollama serve
```

## Vedi anche

- [Provider di modelli](/concepts/model-providers) - panoramica di tutti i provider
- [Selezione del modello](/concepts/models) - come scegliere i modelli
- [Configurazione](/gateway/configuration) - riferimento completo della configurazione
