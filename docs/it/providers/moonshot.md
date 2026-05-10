---
read_when:
    - Vuoi la configurazione di Moonshot K2 (Moonshot Open Platform) rispetto a Kimi Coding
    - È necessario comprendere endpoint, chiavi e riferimenti ai modelli separati
    - Vuoi una configurazione copia/incolla per uno dei due provider
summary: Configura Moonshot K2 rispetto a Kimi Coding (provider + chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:49:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.6`, oppure usa
Kimi Coding con `kimi/kimi-for-coding`.

<Warning>
Moonshot e Kimi Coding sono **provider separati**. Le chiavi non sono intercambiabili, gli endpoint sono diversi e i riferimenti dei modelli differiscono (`moonshot/...` rispetto a `kimi/...`).
</Warning>

## Catalogo modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Riferimento modello               | Nome                   | Ragionamento | Input             | Contesto | Output max |
| --------------------------------- | ---------------------- | ------------ | ----------------- | -------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No           | testo, immagine   | 262,144  | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No           | testo, immagine   | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sì           | testo             | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sì           | testo             | 262,144  | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No           | testo             | 256,000  | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Le stime dei costi incluse per gli attuali modelli K2 ospitati da Moonshot usano le
tariffe pay-as-you-go pubblicate da Moonshot: Kimi K2.6 costa $0.16/MTok per cache hit,
$0.95/MTok per input e $4.00/MTok per output; Kimi K2.5 costa $0.10/MTok per cache hit,
$0.60/MTok per input e $3.00/MTok per output. Le altre voci legacy del catalogo mantengono
segnaposto a costo zero, a meno che tu non le sovrascriva nella configurazione.

## Per iniziare

Scegli il tuo provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Moonshot API">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Scelta di autenticazione | Endpoint                       | Regione       |
        | ------------------------ | ------------------------------ | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | Internazionale |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | Cina          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oppure per l'endpoint Cina:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Usa una directory di stato isolata quando vuoi verificare l'accesso al modello e il tracciamento
        dei costi senza modificare le tue sessioni normali:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La risposta JSON dovrebbe riportare `provider: "moonshot"` e
        `model: "kimi-k2.6"`. La voce di trascrizione dell'assistente memorizza l'utilizzo
        normalizzato dei token più il costo stimato in `usage.cost` quando Moonshot restituisce
        i metadati di utilizzo.
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Ideale per:** attività orientate al codice tramite l'endpoint Kimi Coding.

    <Note>
    Kimi Coding usa una chiave API e un prefisso provider diversi (`kimi/...`) rispetto a Moonshot (`moonshot/...`). Il riferimento del modello API stabile è `kimi/kimi-for-coding`; i riferimenti legacy `kimi/kimi-code` e `kimi/k2p5` restano accettati e vengono normalizzati a quell'ID modello API.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Ricerca web Kimi

OpenClaw include anche **Kimi** come provider `web_search`, basato sulla ricerca
web di Moonshot.

<Steps>
  <Step title="Esegui la configurazione interattiva della ricerca web">
    ```bash
    openclaw configure --section web
    ```

    Scegli **Kimi** nella sezione della ricerca web per memorizzare
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la regione e il modello della ricerca web">
    La configurazione interattiva richiede:

    | Impostazione        | Opzioni                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Regione API         | `https://api.moonshot.ai/v1` (internazionale) or `https://api.moonshot.cn/v1` (Cina) |
    | Modello di ricerca web | Valore predefinito `kimi-k2.6`                                    |

  </Step>
</Steps>

La configurazione si trova in `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità di ragionamento nativa">
    Moonshot Kimi supporta il ragionamento nativo binario:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configuralo per modello tramite `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mappa anche i livelli `/think` di runtime per Moonshot:

    | Livello `/think`       | Comportamento Moonshot     |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Qualsiasi livello non off | `thinking.type=enabled`    |

    <Warning>
    Quando il pensiero di Moonshot è abilitato, `tool_choice` deve essere `auto` o `none`. OpenClaw normalizza i valori `tool_choice` incompatibili in `auto` per compatibilità.
    </Warning>

    Kimi K2.6 accetta anche un campo opzionale `thinking.keep` che controlla
    la conservazione multi-turn di `reasoning_content`. Impostalo su `"all"` per mantenere il
    ragionamento completo tra i turni; omettilo (o lascialo `null`) per usare la strategia
    predefinita del server. OpenClaw inoltra `thinking.keep` solo per
    `moonshot/kimi-k2.6` e lo rimuove dagli altri modelli.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Sanificazione degli id delle chiamate agli strumenti">
    Moonshot Kimi fornisce id tool_call con forma `functions.<name>:<index>`. OpenClaw li conserva invariati affinché le chiamate agli strumenti multi-turn continuino a funzionare.

    Per forzare una sanificazione rigorosa su un provider personalizzato compatibile con OpenAI, imposta `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibilità dell'utilizzo in streaming">
    Gli endpoint Moonshot nativi (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) dichiarano la compatibilità dell'utilizzo in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw la determina in base alle
    capacità dell'endpoint, quindi gli id di provider personalizzati compatibili che puntano agli stessi host
    Moonshot nativi ereditano lo stesso comportamento di utilizzo in streaming.

    Con i prezzi K2.6 inclusi, l'utilizzo in streaming che include token di input,
    output e lettura cache viene anche convertito in un costo stimato locale in USD per
    `/status`, `/usage full`, `/usage cost` e la contabilizzazione della sessione
    basata sulla trascrizione.

  </Accordion>

  <Accordion title="Riferimento per endpoint e model ref">
    | Provider   | Prefisso model ref | Endpoint                      | Variabile env di autenticazione |
    | ---------- | ------------------ | ----------------------------- | ------------------------------- |
    | Moonshot   | `moonshot/`        | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`              |
    | Moonshot CN| `moonshot/`        | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`              |
    | Kimi Coding| `kimi/`            | Endpoint Kimi Coding          | `KIMI_API_KEY`                  |
    | Ricerca web | N/D               | Uguale alla regione API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La ricerca web Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e per impostazione predefinita usa `https://api.moonshot.ai/v1` con il modello `kimi-k2.6`.
    - Sovrascrivi prezzi e metadati di contesto in `models.providers` se necessario.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, modifica `contextWindow` di conseguenza.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, model ref e comportamento di failover.
  </Card>
  <Card title="Ricerca web" href="/it/tools/web" icon="magnifying-glass">
    Configurazione dei provider di ricerca web, incluso Kimi.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo per provider, modelli e plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestione e documentazione delle chiavi API Moonshot.
  </Card>
</CardGroup>
