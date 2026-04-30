---
read_when:
    - Vuoi eseguire OpenClaw con un server vLLM locale
    - Vuoi endpoint /v1 compatibili con OpenAI per i tuoi modelli
summary: Esegui OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T09:10:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM può servire modelli open-source (e alcuni personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si connette a vLLM usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da vLLM quando aderisci impostando `VLLM_API_KEY` (qualsiasi valore funziona se il tuo server non impone l'autenticazione) e non definisci una voce esplicita `models.providers.vllm`.

OpenClaw tratta `vllm` come un fornitore locale compatibile con OpenAI che supporta
la contabilizzazione dell'utilizzo in streaming, quindi i conteggi dei token di stato/contesto possono aggiornarsi dalle
risposte `stream_options.include_usage`.

| Proprietà            | Valore                                   |
| -------------------- | ---------------------------------------- |
| ID fornitore         | `vllm`                                   |
| API                  | `openai-completions` (compatibile con OpenAI) |
| Autenticazione       | variabile d'ambiente `VLLM_API_KEY`      |
| URL di base predefinito | `http://127.0.0.1:8000/v1`            |

## Per iniziare

<Steps>
  <Step title="Avvia vLLM con un server compatibile con OpenAI">
    Il tuo URL di base dovrebbe esporre endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). vLLM viene comunemente eseguito su:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Imposta la variabile d'ambiente della chiave API">
    Qualsiasi valore funziona se il tuo server non impone l'autenticazione:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleziona un modello">
    Sostituisci con uno degli ID modello di vLLM:

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

## Rilevamento dei modelli (fornitore implicito)

Quando `VLLM_API_KEY` è impostata (oppure esiste un profilo di autenticazione) e **non** definisci `models.providers.vllm`, OpenClaw interroga:

```
GET http://127.0.0.1:8000/v1/models
```

e converte gli ID restituiti in voci modello.

<Note>
Se imposti esplicitamente `models.providers.vllm`, il rilevamento automatico viene saltato e devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- vLLM viene eseguito su un host o una porta diversi
- Vuoi bloccare i valori `contextWindow` o `maxTokens`
- Il tuo server richiede una chiave API reale (oppure vuoi controllare le intestazioni)
- Ti connetti a un endpoint vLLM local loopback, LAN o Tailscale attendibile

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
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

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento in stile proxy">
    vLLM viene trattato come backend `/v1` in stile proxy compatibile con OpenAI, non come endpoint
    OpenAI nativo. Questo significa:

    | Comportamento | Applicato? |
    |----------|----------|
    | Modellazione della richiesta OpenAI nativa | No |
    | `service_tier` | Non inviato |
    | `store` delle risposte | Non inviato |
    | Suggerimenti per la cache dei prompt | Non inviati |
    | Modellazione del payload per la compatibilità con il ragionamento OpenAI | Non applicata |
    | Intestazioni di attribuzione OpenClaw nascoste | Non iniettate su URL di base personalizzati |

  </Accordion>

  <Accordion title="Controlli del pensiero Qwen">
    Per i modelli Qwen serviti tramite vLLM, imposta
    `params.qwenThinkingFormat: "chat-template"` nella voce modello quando il
    server si aspetta kwargs del template chat Qwen. OpenClaw mappa `/think off` a:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    I livelli di pensiero diversi da `off` inviano `enable_thinking: true`. Se il tuo endpoint
    si aspetta invece flag di primo livello in stile DashScope, usa
    `params.qwenThinkingFormat: "top-level"` per inviare `enable_thinking` alla
    radice della richiesta. È accettato anche `params.qwen_thinking_format` in snake case.

  </Accordion>

  <Accordion title="Controlli del pensiero Nemotron 3">
    vLLM/Nemotron 3 può usare kwargs del template chat per controllare se il ragionamento viene
    restituito come ragionamento nascosto o come testo di risposta visibile. Quando una sessione OpenClaw
    usa `vllm/nemotron-3-*` con il pensiero disattivato, il Plugin vLLM incluso invia:

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
    la precedenza finale perché `extra_body` è l'ultimo override del corpo della richiesta.

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
    Per prima cosa assicurati che vLLM sia stato avviato con il parser di chiamate agli strumenti e il template chat
    corretti per il modello. Ad esempio, vLLM documenta `hermes` per i modelli Qwen2.5
    e `qwen3_xml` per i modelli Qwen3-Coder.

    Sintomi:

    - Skills o strumenti non vengono mai eseguiti
    - l'assistente stampa JSON/XML grezzo come `{"name":"read","arguments":...}`
    - vLLM restituisce un array `tool_calls` vuoto quando OpenClaw invia
      `tool_choice: "auto"`

    Alcune combinazioni Qwen/vLLM restituiscono chiamate agli strumenti strutturate solo quando la
    richiesta usa `tool_choice: "required"`. Per quelle voci modello, forza il
    campo di richiesta compatibile con OpenAI con `params.extra_body`:

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

    Sostituisci `Qwen-Qwen2.5-Coder-32B-Instruct` con l'id esatto restituito da:

    ```bash
    openclaw models list --provider vllm
    ```

    Puoi applicare lo stesso override dalla CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Questa è una soluzione di compatibilità opzionale. Fa sì che ogni turno del modello con
    strumenti richieda una chiamata a uno strumento, quindi usala solo per una voce modello locale dedicata
    in cui quel comportamento sia accettabile. Non usarla come impostazione predefinita globale per tutti i
    modelli vLLM e non usare un proxy che converta alla cieca testo arbitrario
    dell'assistente in chiamate a strumenti eseguibili.

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Se il tuo server vLLM viene eseguito su un host o una porta non predefiniti, imposta `baseUrl` nella configurazione esplicita del fornitore:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
    Per modelli locali di grandi dimensioni, host LAN remoti o collegamenti tailnet, imposta un
    timeout di richiesta con ambito del fornitore:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` si applica solo alle richieste HTTP dei modelli vLLM, inclusi
    configurazione della connessione, intestazioni della risposta, streaming del corpo e l'interruzione
    guarded-fetch totale. Preferisci questo prima di aumentare
    `agents.defaults.timeoutSeconds`, che controlla l'intera esecuzione dell'agente.

  </Accordion>

  <Accordion title="Server non raggiungibile">
    Controlla che il server vLLM sia in esecuzione e accessibile:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se vedi un errore di connessione, verifica l'host, la porta e che vLLM sia stato avviato con la modalità server compatibile con OpenAI.
    Per endpoint local loopback, LAN o Tailscale espliciti, imposta anche
    `models.providers.vllm.request.allowPrivateNetwork: true`; le richieste del fornitore
    bloccano per impostazione predefinita gli URL di reti private, a meno che il fornitore non sia
    esplicitamente attendibile.

  </Accordion>

  <Accordion title="Errori di autenticazione nelle richieste">
    Se le richieste falliscono con errori di autenticazione, imposta una `VLLM_API_KEY` reale che corrisponda alla configurazione del tuo server oppure configura esplicitamente il fornitore in `models.providers.vllm`.

    <Tip>
    Se il tuo server vLLM non impone l'autenticazione, qualsiasi valore non vuoto per `VLLM_API_KEY` funziona come segnale opzionale per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello rilevato">
    Il rilevamento automatico richiede che `VLLM_API_KEY` sia impostata **e** che non sia presente alcuna voce di configurazione esplicita `models.providers.vllm`. Se hai definito manualmente il fornitore, OpenClaw salta il rilevamento e usa solo i modelli dichiarati.
  </Accordion>

  <Accordion title="Gli strumenti vengono renderizzati come testo grezzo">
    Se un modello Qwen stampa sintassi JSON/XML degli strumenti invece di eseguire una skill,
    consulta le indicazioni su Qwen nella Configurazione avanzata sopra. La correzione abituale è:

    - avviare vLLM con il parser/template corretto per quel modello
    - confermare l'id esatto del modello con `openclaw models list --provider vllm`
    - aggiungere un override dedicato per modello `params.extra_body.tool_choice: "required"`
      solo se `tool_choice: "auto"` restituisce ancora chiamate agli strumenti vuote o solo testuali

  </Accordion>
</AccordionGroup>

<Warning>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei fornitori, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Fornitore OpenAI nativo e comportamento delle route compatibili con OpenAI.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
