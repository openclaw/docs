---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) rispetto a Kimi Coding
    - Devi comprendere endpoint, chiavi e riferimenti di modello separati
    - Vuoi una configurazione pronta da copiare e incollare per uno dei due provider
summary: Configurare Moonshot K2 vs Kimi Coding (provider e chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T08:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.6`, oppure usa
Kimi Coding con `kimi/kimi-code`.

<Warning>
Moonshot e Kimi Coding sono **provider separati**. Le chiavi non sono intercambiabili, gli endpoint sono diversi e i riferimenti ai modelli sono diversi (`moonshot/...` vs `kimi/...`).
</Warning>

## Catalogo modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nome                   | Reasoning | Input       | Context | Output max |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sì        | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sì        | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Le stime di costo integrate per gli attuali modelli K2 ospitati da Moonshot usano
le tariffe pay-as-you-go pubblicate da Moonshot: Kimi K2.6 costa $0.16/MTok per cache hit,
$0.95/MTok in input e $4.00/MTok in output; Kimi K2.5 costa $0.10/MTok per cache hit,
$0.60/MTok in input e $3.00/MTok in output. Le altre voci legacy del catalogo mantengono
segnaposto a costo zero, a meno che tu non le sovrascriva nella configurazione.

## Per iniziare

Scegli il tuo provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API Moonshot">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Scegli la regione del tuo endpoint">
        | Scelta auth             | Endpoint                       | Regione       |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Internazionale |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | Cina          |
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
      <Step title="Esegui uno smoke test live">
        Usa una directory di stato isolata quando vuoi verificare l'accesso al modello e il tracciamento
        dei costi senza toccare le tue normali sessioni:

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
        `model: "kimi-k2.6"`. La voce transcript dell'assistente memorizza
        l'utilizzo normalizzato dei token più il costo stimato in `usage.cost` quando Moonshot restituisce
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
    Kimi Coding usa una API key diversa e un prefisso provider diverso (`kimi/...`) rispetto a Moonshot (`moonshot/...`). Il riferimento legacy del modello `kimi/k2p5` continua a essere accettato come id di compatibilità.
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

## Ricerca web Kimi

OpenClaw include anche **Kimi** come provider `web_search`, supportato dalla ricerca web Moonshot.

<Steps>
  <Step title="Esegui la configurazione interattiva della ricerca web">
    ```bash
    openclaw configure --section web
    ```

    Scegli **Kimi** nella sezione web-search per salvare
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la regione e il modello della ricerca web">
    La configurazione interattiva richiede:

    | Impostazione        | Opzioni                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Regione API         | `https://api.moonshot.ai/v1` (internazionale) oppure `https://api.moonshot.cn/v1` (Cina) |
    | Modello ricerca web | Predefinito: `kimi-k2.6`                                             |

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

## Avanzate

<AccordionGroup>
  <Accordion title="Modalità thinking nativa">
    Moonshot Kimi supporta la modalità thinking nativa binaria:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configurala per modello tramite `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw mappa anche i livelli runtime di `/think` per Moonshot:

    | Livello `/think`    | Comportamento Moonshot      |
    | ------------------- | --------------------------- |
    | `/think off`        | `thinking.type=disabled`    |
    | Qualsiasi livello non-off | `thinking.type=enabled` |

    <Warning>
    Quando il thinking di Moonshot è abilitato, `tool_choice` deve essere `auto` oppure `none`. OpenClaw normalizza i valori `tool_choice` incompatibili in `auto` per compatibilità.
    </Warning>

    Kimi K2.6 accetta anche un campo facoltativo `thinking.keep` che controlla
    la conservazione multi-turn di `reasoning_content`. Impostalo su `"all"` per mantenere
    il reasoning completo tra i turni; omettilo (o lascialo `null`) per usare la
    strategia predefinita del server. OpenClaw inoltra `thinking.keep` solo per
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

  <Accordion title="Sanitizzazione degli id delle chiamate agli strumenti">
    Moonshot Kimi restituisce id `tool_call` nel formato `functions.<name>:<index>`. OpenClaw li preserva invariati così le chiamate agli strumenti multi-turn continuano a funzionare.

    Per forzare una sanitizzazione rigorosa su un provider personalizzato compatibile con OpenAI, imposta `sanitizeToolCallIds: true`:

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
    `https://api.moonshot.cn/v1`) dichiarano compatibilità dell'utilizzo in streaming sul
    transport condiviso `openai-completions`. OpenClaw basa questo sulle capability
    dell'endpoint, quindi gli id provider personalizzati compatibili che puntano agli stessi host
    Moonshot nativi ereditano lo stesso comportamento di utilizzo in streaming.

    Con il pricing K2.6 incluso, l'utilizzo in streaming che include token di input, output
    e cache-read viene anche convertito in costo USD stimato locale per
    `/status`, `/usage full`, `/usage cost` e per la contabilità delle sessioni supportata dalla transcript.

  </Accordion>

  <Accordion title="Riferimento di endpoint e model ref">
    | Provider     | Prefisso model ref | Endpoint                      | Variabile env auth  |
    | ------------ | ------------------ | ----------------------------- | ------------------- |
    | Moonshot     | `moonshot/`        | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN  | `moonshot/`        | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding  | `kimi/`            | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Ricerca web  | N/A                | Uguale alla regione API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La ricerca web Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e usa come predefiniti `https://api.moonshot.ai/v1` con il modello `kimi-k2.6`.
    - Sovrascrivi pricing e metadati di contesto in `models.providers` se necessario.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, regola `contextWindow` di conseguenza.

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
    Schema completo della configurazione per provider, modelli e plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestione delle API key Moonshot e documentazione.
  </Card>
</CardGroup>
