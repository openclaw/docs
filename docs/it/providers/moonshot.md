---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) e Kimi Coding a confronto
    - Devi capire endpoint, chiavi e riferimenti dei modelli separati
    - Vuoi una configurazione pronta da copiare/incollare per uno dei due provider
summary: Configura Moonshot K2 e Kimi Coding (provider + chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T08:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fornisce la Kimi API con endpoint compatibili OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.6`, oppure usa
Kimi Coding con `kimi/kimi-code`.

<Warning>
Moonshot e Kimi Coding sono **provider separati**. Le chiavi non sono intercambiabili, gli endpoint sono diversi e i riferimenti dei modelli sono diversi (`moonshot/...` vs `kimi/...`).
</Warning>

## Catalogo dei modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Riferimento modello              | Nome                   | Reasoning | Input       | Contesto | Output max |
| -------------------------------- | ---------------------- | --------- | ----------- | -------- | ---------- |
| `moonshot/kimi-k2.6`             | Kimi K2.6              | No        | text, image | 262,144  | 262,144    |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | No        | text, image | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | Sì        | text        | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking-turbo`| Kimi K2 Thinking Turbo | Sì        | text        | 262,144  | 262,144    |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | No        | text        | 256,000  | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Le stime di costo integrate per gli attuali modelli K2 ospitati da Moonshot usano le
tariffe pay-as-you-go pubblicate da Moonshot: Kimi K2.6 costa $0.16/MTok cache hit,
$0.95/MTok input e $4.00/MTok output; Kimi K2.5 costa $0.10/MTok cache hit,
$0.60/MTok input e $3.00/MTok output. Le altre voci legacy del catalogo mantengono
placeholder a costo zero a meno che tu non le sovrascriva nella configurazione.

## Per iniziare

Scegli il tuo provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Moonshot API">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Scegli la regione del tuo endpoint">
        | Scelta auth             | Endpoint                       | Regione        |
        | ----------------------- | ------------------------------ | -------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Internazionale |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | Cina           |
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oppure per l'endpoint Cina:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
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
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Esegui un live smoke test">
        Usa una directory di stato isolata quando vuoi verificare accesso al modello e tracciamento
        dei costi senza toccare le tue sessioni normali:

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
        `model: "kimi-k2.6"`. La voce di trascrizione dell'assistente memorizza
        l'utilizzo normalizzato dei token più il costo stimato sotto `usage.cost` quando Moonshot restituisce
        metadati di utilizzo.
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
    Kimi Coding usa una API key e un prefisso provider diversi (`kimi/...`) rispetto a Moonshot (`moonshot/...`). Il riferimento modello legacy `kimi/k2p5` continua a essere accettato come id di compatibilità.
    </Note>

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
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
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw include anche **Kimi** come provider `web_search`, supportato da Moonshot web
search.

<Steps>
  <Step title="Esegui la configurazione interattiva di web search">
    ```bash
    openclaw configure --section web
    ```

    Scegli **Kimi** nella sezione web-search per memorizzare
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la regione e il modello della web search">
    La configurazione interattiva richiede:

    | Impostazione         | Opzioni                                                              |
    | -------------------- | -------------------------------------------------------------------- |
    | Regione API          | `https://api.moonshot.ai/v1` (internazionale) oppure `https://api.moonshot.cn/v1` (Cina) |
    | Modello web search   | Predefinito `kimi-k2.6`                                             |

  </Step>
</Steps>

La configurazione risiede sotto `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oppure usa KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="Modalità native thinking">
    Moonshot Kimi supporta thinking nativo binario:

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

    OpenClaw mappa anche i livelli runtime `/think` per Moonshot:

    | Livello `/think`     | Comportamento Moonshot       |
    | -------------------- | ---------------------------- |
    | `/think off`         | `thinking.type=disabled`     |
    | Qualsiasi livello non-off | `thinking.type=enabled` |

    <Warning>
    Quando il thinking Moonshot è abilitato, `tool_choice` deve essere `auto` o `none`. OpenClaw normalizza i valori `tool_choice` incompatibili in `auto` per compatibilità.
    </Warning>

    Kimi K2.6 accetta anche un campo facoltativo `thinking.keep` che controlla
    la conservazione multi-turn di `reasoning_content`. Impostalo su `"all"` per mantenere l'intero
    reasoning tra i turni; omettilo (o lascialo `null`) per usare la strategia
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

  <Accordion title="Sanitizzazione del tool call id">
    Moonshot Kimi restituisce tool_call id con forma `functions.<name>:<index>`. OpenClaw li mantiene invariati così le tool call multi-turn continuano a funzionare.

    Per forzare una sanitizzazione strict su un provider personalizzato compatibile OpenAI, imposta `sanitizeToolCallIds: true`:

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

  <Accordion title="Compatibilità streaming usage">
    Gli endpoint Moonshot nativi (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) dichiarano compatibilità streaming usage sul
    trasporto condiviso `openai-completions`. OpenClaw si basa sulle capability
    dell'endpoint, quindi id provider personalizzati compatibili che puntano agli stessi host
    Moonshot nativi ereditano lo stesso comportamento di streaming-usage.

    Con il prezzo K2.6 integrato, l'usage in streaming che include token di input,
    output e cache-read viene anche convertito in costo USD stimato locale per
    `/status`, `/usage full`, `/usage cost` e contabilità delle sessioni supportata da trascrizione.

  </Accordion>

  <Accordion title="Riferimento per endpoint e model ref">
    | Provider    | Prefisso model ref | Endpoint                      | Variabile env auth  |
    | ----------- | ------------------ | ----------------------------- | ------------------- |
    | Moonshot    | `moonshot/`        | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN | `moonshot/`        | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding | `kimi/`            | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Web search  | N/A                | Uguale alla regione API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La web search Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e usa come predefiniti `https://api.moonshot.ai/v1` con modello `kimi-k2.6`.
    - Sovrascrivi metadati di pricing e contesto in `models.providers` se necessario.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, regola `contextWindow` di conseguenza.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti del modello e comportamento di failover.
  </Card>
  <Card title="Web search" href="/it/tools/web" icon="magnifying-glass">
    Configurazione dei provider di web search inclusa Kimi.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di configurazione per provider, modelli e Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestione della API key Moonshot e documentazione.
  </Card>
</CardGroup>
