---
read_when:
    - Vuoi eseguire OpenClaw con un server vLLM locale
    - Vuoi endpoint /v1 compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM può servire modelli open-source (e alcuni personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si connette a vLLM usando l'API `openai-completions`.

OpenClaw può anche **scoprire automaticamente** i modelli disponibili da vLLM quando acconsenti con `VLLM_API_KEY` (qualsiasi valore funziona se il tuo server non applica l'autenticazione). Usa `vllm/*` in `agents.defaults.models` per mantenere dinamica la scoperta quando configuri anche un URL di base vLLM personalizzato.

OpenClaw tratta `vllm` come un provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'uso in streaming, quindi i conteggi dei token di stato/contesto possono aggiornarsi dalle
risposte `stream_options.include_usage`.

| Proprietà        | Valore                                  |
| ---------------- | --------------------------------------- |
| ID provider      | `vllm`                                  |
| API              | `openai-completions` (compatibile con OpenAI) |
| Autenticazione   | variabile d'ambiente `VLLM_API_KEY`     |
| URL di base predefinito | `http://127.0.0.1:8000/v1`       |

## Per iniziare

<Steps>
  <Step title="Avvia vLLM con un server compatibile con OpenAI">
    Il tuo URL di base deve esporre endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). vLLM di solito viene eseguito su:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Imposta la variabile d'ambiente della chiave API">
    Qualsiasi valore funziona se il tuo server non applica l'autenticazione:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleziona un modello">
    Sostituisci con uno degli ID modello vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Scoperta dei modelli (provider implicito)

Quando `VLLM_API_KEY` è impostato (o esiste un profilo di autenticazione) e **non** definisci `models.providers.vllm`, OpenClaw interroga:

```
GET http://127.0.0.1:8000/v1/models
```

e converte gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.vllm`, OpenClaw usa per impostazione predefinita i modelli dichiarati. Aggiungi `"vllm/*": {}` a `agents.defaults.models` quando vuoi che OpenClaw interroghi l'endpoint `/models` di quel provider configurato e includa tutti i modelli vLLM pubblicizzati.
</Note>

## Configurazione esplicita (modelli manuali)

Usa la configurazione esplicita quando:

- vLLM viene eseguito su un host o una porta diversi
- Vuoi fissare i valori `contextWindow` o `maxTokens`
- Il tuo server richiede una chiave API reale (o vuoi controllare gli header)
- Ti connetti a un endpoint vLLM loopback, LAN o Tailscale attendibile

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Per mantenere dinamico questo provider senza elencare manualmente ogni modello, aggiungi un
carattere jolly del provider al catalogo dei modelli visibile:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento in stile proxy">
    vLLM viene trattato come backend `/v1` in stile proxy compatibile con OpenAI, non come endpoint
    OpenAI nativo. Ciò significa:

    | Comportamento | Applicato? |
    |----------|----------|
    | Modellazione delle richieste OpenAI native | No |
    | `service_tier` | Non inviato |
    | Responses `store` | Non inviato |
    | Suggerimenti per la cache dei prompt | Non inviati |
    | Modellazione del payload di compatibilità reasoning OpenAI | Non applicata |
    | Header di attribuzione OpenClaw nascosti | Non iniettati su URL di base personalizzati |

  </Accordion>

  <Accordion title="Controlli di thinking Qwen">
    Per i modelli Qwen serviti tramite vLLM, imposta
    `compat.thinkingFormat: "qwen-chat-template"` sulla riga del modello del provider configurato
    quando il server si aspetta kwargs del template chat Qwen. I modelli
    configurati in questo modo espongono un profilo `/think` binario (`off`, `on`) perché
    il thinking del template Qwen è un flag di richiesta on/off, non una scala di effort
    in stile OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw mappa `/think off` a:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    I livelli di thinking diversi da `off` inviano `enable_thinking: true`. Se il tuo endpoint
    si aspetta invece flag di primo livello in stile DashScope, usa
    `compat.thinkingFormat: "qwen"` per inviare `enable_thinking` alla radice
    della richiesta.

  </Accordion>

  <Accordion title="Controlli di thinking Nemotron 3">
    vLLM/Nemotron 3 può usare kwargs del template chat per controllare se il reasoning viene
    restituito come reasoning nascosto o testo di risposta visibile. Quando una sessione OpenClaw
    usa `vllm/nemotron-3-*` con thinking disattivato, il Plugin vLLM in bundle invia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Per personalizzare questi valori, imposta `chat_template_kwargs` nei parametri del modello.
    Se imposti anche `params.extra_body.chat_template_kwargs`, quel valore ha
    precedenza finale perché `extra_body` è l'ultimo override del corpo della richiesta.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Le chiamate agli strumenti Qwen appaiono come testo">
    Per prima cosa assicurati che vLLM sia stato avviato con il parser per le chiamate agli strumenti e il template chat
    corretti per il modello. Ad esempio, vLLM documenta `hermes` per i modelli Qwen2.5
    e `qwen3_xml` per i modelli Qwen3-Coder.

    Sintomi:

    - Skills o strumenti non vengono mai eseguiti
    - l'assistente stampa JSON/XML grezzo come `{"name":"read","arguments":...}`
    - vLLM restituisce un array `tool_calls` vuoto quando OpenClaw invia
      `tool_choice: "auto"`

    Alcune combinazioni Qwen/vLLM restituiscono chiamate agli strumenti strutturate solo quando la
    richiesta usa `tool_choice: "required"`. Per quelle voci di modello, forza il
    campo della richiesta compatibile con OpenAI con `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
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

    Sostituisci `Qwen-Qwen2.5-Coder-32B-Instruct` con l'ID esatto restituito da:

    ```bash
    openclaw models list --provider vllm
    ```

    Puoi applicare lo stesso override dalla CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Questa è una soluzione di compatibilità opt-in. Fa sì che ogni turno del modello con
    strumenti richieda una chiamata a uno strumento, quindi usala solo per una voce di modello locale dedicata
    in cui quel comportamento è accettabile. Non usarla come default globale per tutti i
    modelli vLLM e non usare un proxy che converte alla cieca testo arbitrario
    dell'assistente in chiamate a strumenti eseguibili.

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Se il tuo server vLLM viene eseguito su un host o una porta non predefiniti, imposta `baseUrl` nella configurazione esplicita del provider:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Prima risposta lenta o timeout del server remoto">
    Per modelli locali grandi, host LAN remoti o collegamenti tailnet, imposta un
    timeout di richiesta con ambito provider:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` si applica solo alle richieste HTTP dei modelli vLLM, inclusi
    configurazione della connessione, header di risposta, streaming del corpo e l'abort
    totale del guarded-fetch. Preferiscilo prima di aumentare
    `agents.defaults.timeoutSeconds`, che controlla l'intera esecuzione dell'agente.

  </Accordion>

  <Accordion title="Server non raggiungibile">
    Controlla che il server vLLM sia in esecuzione e accessibile:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se vedi un errore di connessione, verifica host, porta e che vLLM sia stato avviato con la modalità server compatibile con OpenAI.
    Per endpoint loopback, LAN o Tailscale espliciti, OpenClaw considera attendibile
    l'origine esatta `models.providers.vllm.baseUrl` configurata per le richieste di modello
    protette. Le origini metadata/link-local restano bloccate senza opt-in
    esplicito. Imposta `models.providers.vllm.request.allowPrivateNetwork: true` solo
    quando le richieste vLLM devono raggiungere un'altra origine privata, e impostalo su `false`
    per disattivare l'attendibilità dell'origine esatta.

  </Accordion>

  <Accordion title="Errori di autenticazione nelle richieste">
    Se le richieste falliscono con errori di autenticazione, imposta una `VLLM_API_KEY` reale che corrisponda alla configurazione del server, oppure configura esplicitamente il provider in `models.providers.vllm`.

    <Tip>
    Se il tuo server vLLM non applica l'autenticazione, qualsiasi valore non vuoto per `VLLM_API_KEY` funziona come segnale opt-in per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello scoperto">
    La scoperta automatica richiede che `VLLM_API_KEY` sia impostato. Se hai definito `models.providers.vllm`, OpenClaw usa solo i modelli dichiarati a meno che `agents.defaults.models` non includa `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Gli strumenti vengono renderizzati come testo grezzo">
    Se un modello Qwen stampa sintassi JSON/XML degli strumenti invece di eseguire una skill,
    controlla la guida Qwen nella Configurazione avanzata sopra. La correzione abituale è:

    - avviare vLLM con il parser/template corretto per quel modello
    - confermare l'ID modello esatto con `openclaw models list --provider vllm`
    - aggiungere un override dedicato per modello `params.extra_body.tool_choice: "required"`
      solo se `tool_choice: "auto"` restituisce ancora chiamate agli strumenti vuote o solo testuali

  </Accordion>
</AccordionGroup>

<Warning>
Altra assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Provider OpenAI nativo e comportamento delle route compatibili con OpenAI.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
