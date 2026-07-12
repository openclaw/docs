---
read_when:
    - Vuoi eseguire OpenClaw con un server vLLM locale
    - Vuoi endpoint /v1 compatibili con OpenAI per i tuoi modelli
summary: Esegui OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T07:27:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM espone modelli open source (e alcuni modelli personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si connette usando l'API `openai-completions` e può **rilevare automaticamente** i modelli quando si abilita questa funzionalità con `VLLM_API_KEY`.

| Proprietà                | Valore                                     |
| ------------------------ | ------------------------------------------ |
| ID provider              | `vllm`                                     |
| API                      | `openai-completions` (compatibile con OpenAI) |
| Autenticazione           | Variabile di ambiente `VLLM_API_KEY`       |
| URL di base predefinito  | `http://127.0.0.1:8000/v1`                 |
| Utilizzo in streaming    | Supportato (`stream_options.include_usage`) |

## Per iniziare

<Steps>
  <Step title="Avviare vLLM con un server compatibile con OpenAI">
    L'URL di base deve esporre endpoint `/v1` (`/v1/models`, `/v1/chat/completions`). In genere vLLM viene eseguito su:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Impostare la variabile di ambiente della chiave API">
    Se il server non impone l'autenticazione, è sufficiente qualsiasi valore non vuoto:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selezionare un modello">
    Sostituire il valore con uno degli ID modello di vLLM:

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
  <Step title="Verificare che il modello sia disponibile">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Per la configurazione non interattiva (CI, scripting), passare direttamente l'URL di base, la chiave e il modello:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Rilevamento dei modelli (provider implicito)

Quando `VLLM_API_KEY` è impostata (o esiste un profilo di autenticazione) e `models.providers.vllm` **non** è definito, OpenClaw interroga `GET http://127.0.0.1:8000/v1/models` e converte gli ID restituiti in voci di modello.

<Note>
Se si imposta esplicitamente `models.providers.vllm`, OpenClaw usa soltanto i modelli dichiarati. Aggiungere `"vllm/*": {}` a `agents.defaults.models` affinché OpenClaw interroghi anche l'endpoint `/models` del provider configurato e includa tutti i modelli vLLM pubblicizzati.
</Note>

## Configurazione esplicita

Eseguire una configurazione esplicita quando vLLM è in esecuzione su un host o una porta diversi, si desidera fissare `contextWindow`/`maxTokens`, il server richiede una vera chiave API oppure ci si connette a un endpoint loopback, LAN o Tailscale attendibile:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Per mantenere dinamico il provider senza elencare ogni modello, aggiungere un carattere jolly al catalogo dei modelli visibili:

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
    vLLM viene trattato come un backend `/v1` in stile proxy compatibile con OpenAI, non come un endpoint OpenAI nativo:

    | Comportamento                                      | Applicato?                           |
    | -------------------------------------------------- | ------------------------------------ |
    | Formattazione nativa delle richieste OpenAI        | No                                   |
    | `service_tier`                                     | Non inviato                          |
    | `store` delle Responses                            | Non inviato                          |
    | Indicazioni per la cache dei prompt                | Non inviate                          |
    | Formattazione del payload per compatibilità con il ragionamento OpenAI | Non applicata |
    | Intestazioni nascoste di attribuzione OpenClaw     | Non inserite negli URL di base personalizzati |

  </Accordion>

  <Accordion title="Controlli del ragionamento di Qwen">
    Per i modelli Qwen, impostare `compat.thinkingFormat: "qwen-chat-template"` nella riga del modello quando il server si aspetta gli argomenti del modello di chat Qwen. Questi modelli espongono un profilo binario `/think` (`off`, `on`) perché il ragionamento del modello di chat Qwen è un'opzione attivata/disattivata, non una scala di intensità in stile OpenAI.

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

    OpenClaw associa `/think off` a:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    I livelli di ragionamento diversi da `off` inviano `enable_thinking: true`. Se l'endpoint si aspetta invece opzioni di primo livello in stile DashScope, usare `compat.thinkingFormat: "qwen"` per inviare `enable_thinking` nella radice della richiesta.

  </Accordion>

  <Accordion title="Controlli del ragionamento di Nemotron 3">
    Per i modelli `vllm/nemotron-3-*` con il ragionamento disattivato, il Plugin incluso invia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Per personalizzare questi valori, impostare `chat_template_kwargs` nei parametri del modello. Se si imposta anche `params.extra_body.chat_template_kwargs`, tale valore ha la precedenza perché `extra_body` è l'ultima sostituzione applicata al corpo della richiesta.

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

  <Accordion title="Le chiamate agli strumenti di Qwen vengono visualizzate come testo">
    Verificare innanzitutto che vLLM sia stato avviato con il parser delle chiamate agli strumenti e il modello di chat corretti per il modello. La documentazione di vLLM indica `hermes` per i modelli Qwen2.5 e `qwen3_xml` per i modelli Qwen3-Coder.

    Sintomi: le Skills/gli strumenti non vengono mai eseguiti, l'assistente stampa JSON/XML non elaborato come `{"name":"read","arguments":...}` oppure vLLM restituisce un array `tool_calls` vuoto quando OpenClaw invia `tool_choice: "auto"`.

    Alcune combinazioni di Qwen/vLLM restituiscono chiamate agli strumenti strutturate solo quando la richiesta usa `tool_choice: "required"`. Forzarne l'uso per singolo modello tramite `params.extra_body`:

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

    Sostituire l'ID del modello con l'ID esatto restituito da `openclaw models list --provider vllm`, oppure applicare la stessa sostituzione dalla CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Questa è una soluzione alternativa facoltativa: forza ogni turno che include strumenti a effettuare una chiamata a uno strumento, quindi va usata solo per una voce di modello dedicata in cui tale comportamento sia accettabile. Non impostarla come valore predefinito globale per tutti i modelli vLLM e non abbinarla a un proxy che converte testo arbitrario dell'assistente in chiamate eseguibili agli strumenti.

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Se il server vLLM è in esecuzione su un host o una porta non predefiniti, impostare `baseUrl` nella configurazione esplicita del provider:

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
    Per modelli locali di grandi dimensioni, host LAN remoti o collegamenti tailnet, impostare un timeout delle richieste specifico del provider:

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

    `timeoutSeconds` si applica soltanto alle richieste HTTP dei modelli vLLM: configurazione della connessione, intestazioni della risposta, streaming del corpo e interruzione complessiva del recupero protetto. Aumenta inoltre il limite del watchdog di inattività/streaming dell'LLM oltre il valore predefinito implicito di circa 120 secondi per questo provider. È preferibile usare questa opzione anziché aumentare `agents.defaults.timeoutSeconds`, che controlla l'intera esecuzione dell'agente.

  </Accordion>

  <Accordion title="Server non raggiungibile">
    Verificare che il server vLLM sia in esecuzione e accessibile:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se viene visualizzato un errore di connessione, verificare l'host, la porta e che vLLM sia stato avviato in modalità server compatibile con OpenAI. OpenClaw considera attendibile l'origine esatta configurata in `models.providers.vllm.baseUrl` per le richieste protette ai modelli su endpoint loopback, LAN e Tailscale. Le origini di metadati/link-local rimangono bloccate senza un'abilitazione esplicita. Impostare `models.providers.vllm.request.allowPrivateNetwork: true` solo quando le richieste vLLM devono raggiungere un'altra origine privata, oppure `false` per disattivare l'attendibilità dell'origine esatta.

  </Accordion>

  <Accordion title="Errori di autenticazione nelle richieste">
    Se le richieste non riescono a causa di errori di autenticazione, impostare una vera `VLLM_API_KEY` che corrisponda alla configurazione del server oppure configurare esplicitamente il provider in `models.providers.vllm`.

    <Tip>
    Se il server vLLM non impone l'autenticazione, qualsiasi valore non vuoto di `VLLM_API_KEY` funziona come segnale di abilitazione per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello rilevato">
    Il rilevamento automatico richiede che `VLLM_API_KEY` sia impostata. Se è stato definito `models.providers.vllm`, OpenClaw usa soltanto i modelli dichiarati, a meno che `agents.defaults.models` non includa `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Gli strumenti vengono visualizzati come testo non elaborato">
    Se un modello Qwen stampa la sintassi JSON/XML degli strumenti invece di eseguire una Skill:

    - Avviare vLLM con il parser/modello corretto per quel modello.
    - Verificare l'ID esatto del modello con `openclaw models list --provider vllm`.
    - Aggiungere una sostituzione dedicata per modello `params.extra_body.tool_choice: "required"` solo se `tool_choice: "auto"` continua a restituire chiamate agli strumenti vuote o composte esclusivamente da testo.

  </Accordion>
</AccordionGroup>

<Warning>
Ulteriore assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Warning>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Provider OpenAI nativo e comportamento delle route compatibili con OpenAI.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole per il riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e relative soluzioni.
  </Card>
</CardGroup>
