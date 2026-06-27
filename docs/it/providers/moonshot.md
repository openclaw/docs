---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) rispetto a Kimi Coding
    - Devi comprendere endpoint, chiavi e riferimenti ai modelli separati
    - Vuoi una configurazione da copiare e incollare per entrambi i provider
summary: Configura Moonshot K2 rispetto a Kimi Coding (provider e chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.6`, oppure usa
Kimi Coding con `kimi/kimi-for-coding`.

<Warning>
Moonshot e Kimi Coding sono **provider separati**. Le chiavi non sono intercambiabili, gli endpoint sono diversi e i riferimenti dei modelli differiscono (`moonshot/...` rispetto a `kimi/...`).
</Warning>

## Catalogo dei modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Riferimento modello               | Nome                   | Ragionamento   | Input            | Contesto | Output massimo |
| --------------------------------- | ---------------------- | -------------- | ---------------- | -------- | -------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No             | testo, immagine  | 262,144  | 262,144        |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Sempre attivo  | testo, immagine  | 262,144  | 262,144        |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No             | testo, immagine  | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sì             | testo            | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sì             | testo            | 262,144  | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No             | testo            | 256,000  | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

Le stime dei costi del catalogo per gli attuali modelli K2 ospitati da Moonshot usano le
tariffe a consumo pubblicate da Moonshot: Kimi K2.7 Code costa $0.19/MTok per cache hit,
$0.95/MTok per input e $4.00/MTok per output; Kimi K2.6 costa $0.16/MTok per cache hit,
$0.95/MTok per input e $4.00/MTok per output; Kimi K2.5 costa $0.10/MTok per cache hit,
$0.60/MTok per input e $3.00/MTok per output. Le altre voci legacy del catalogo mantengono
segnaposto a costo zero, salvo override nella configurazione.

Kimi K2.7 Code usa sempre il thinking nativo. OpenClaw espone solo lo stato di thinking `on`
per questo modello e omette i controlli in uscita `thinking` e
`reasoning_effort`, come richiesto da Moonshot. OpenClaw omette anche
gli override di campionamento che K2.7 fissa sui valori predefiniti del provider. Kimi K2.6 rimane il
valore predefinito dell'onboarding.

## Per iniziare

Scegli il provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API Moonshot">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Scelta di autenticazione | Endpoint                       | Regione        |
        | ------------------------ | ------------------------------ | -------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | Internazionale |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | Cina           |
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
        dei costi senza toccare le sessioni normali:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La risposta JSON dovrebbe indicare `provider: "moonshot"` e
        `model: "kimi-k2.6"`. La voce della trascrizione dell'assistente archivia l'uso normalizzato
        dei token più il costo stimato in `usage.cost` quando Moonshot restituisce
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    Installa il plugin ufficiale, quindi riavvia Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Ideale per:** attività incentrate sul codice tramite l'endpoint Kimi Coding.

    <Note>
    Kimi Coding usa una chiave API diversa e un prefisso provider (`kimi/...`) diverso da Moonshot (`moonshot/...`). Il riferimento stabile del modello API è `kimi/kimi-for-coding`; i riferimenti legacy `kimi/kimi-code` e `kimi/k2p5` rimangono accettati e vengono normalizzati a quell'ID modello API.
    </Note>

    <Steps>
      <Step title="Installa il plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
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
              model: { primary: "kimi/kimi-for-coding" },
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

Il plugin Moonshot registra anche **Kimi** come provider `web_search`, basato sulla ricerca web Moonshot.

<Steps>
  <Step title="Esegui la configurazione interattiva della ricerca web">
    ```bash
    openclaw configure --section web
    ```

    Scegli **Kimi** nella sezione della ricerca web per archiviare
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la regione e il modello della ricerca web">
    La configurazione interattiva richiede:

    | Impostazione        | Opzioni                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Regione API         | `https://api.moonshot.ai/v1` (internazionale) o `https://api.moonshot.cn/v1` (Cina) |
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
  <Accordion title="Modalità thinking nativa">
    Kimi K2.7 Code usa sempre il thinking nativo. Moonshot richiede ai client di
    omettere il campo `thinking` per questo modello, quindi OpenClaw espone solo `on` e
    ignora le impostazioni `off` obsolete. K2.7 fissa anche `temperature`, `top_p`, `n`,
    `presence_penalty` e `frequency_penalty`; OpenClaw omette gli override configurati
    per questi campi.

    Gli altri modelli Moonshot Kimi supportano il thinking nativo binario:

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

    OpenClaw mappa i livelli runtime `/think` per questi modelli:

    | Livello `/think`    | Comportamento Moonshot    |
    | ------------------- | ------------------------- |
    | `/think off`        | `thinking.type=disabled`  |
    | Qualsiasi livello non-off | `thinking.type=enabled` |

    <Warning>
    Quando il thinking Moonshot è abilitato, `tool_choice` deve essere `auto` o `none`. OpenClaw normalizza i valori incompatibili in `auto`. Questo include Kimi K2.7 Code, la cui modalità thinking non può essere disabilitata per preservare una scelta di strumento fissata.
    </Warning>

    Kimi K2.6 accetta anche un campo opzionale `thinking.keep` che controlla
    la conservazione multi-turn di `reasoning_content`. Impostalo su `"all"` per mantenere il
    ragionamento completo tra i turni; omettilo (o lascialo `null`) per usare la strategia
    predefinita del server. OpenClaw inoltra `thinking.keep` solo per
    `moonshot/kimi-k2.6` e lo rimuove dagli altri modelli. Kimi K2.7 Code
    conserva per impostazione predefinita la cronologia completa del ragionamento, mentre OpenClaw omette l'intero
    campo `thinking`.

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
    Moonshot Kimi fornisce id `tool_call` nativi con formato `functions.<name>:<index>`. Per il trasporto OpenAI-completions, OpenClaw conserva la prima occorrenza di ogni id Kimi nativo e riscrive i duplicati successivi in id `call_*` deterministici in stile OpenAI. I risultati degli strumenti corrispondenti vengono rimappati con lo stesso id, così la riproduzione rimane univoca senza rimuovere il primo id nativo di Kimi.

    Per forzare la sanificazione rigorosa su un provider personalizzato compatibile con OpenAI, imposta `sanitizeToolCallIds: true`:

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

    Con i prezzi K2.6 del catalogo, l'utilizzo in streaming che include token di input,
    output e lettura dalla cache viene anche convertito in una stima locale del costo in USD per
    `/status`, `/usage full`, `/usage cost` e la contabilizzazione delle sessioni basata sulle trascrizioni.

  </Accordion>

  <Accordion title="Riferimento per endpoint e model ref">
    | Provider   | Prefisso model ref | Endpoint                      | Variabile env di autenticazione |
    | ---------- | ------------------ | ----------------------------- | ------------------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Ricerca web | N/D              | Uguale alla regione dell'API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La ricerca web di Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e per impostazione predefinita usa `https://api.moonshot.ai/v1` con il modello `kimi-k2.6`.
    - Sovrascrivi prezzi e metadati del contesto in `models.providers` se necessario.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, modifica `contextWindow` di conseguenza.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei model ref e del comportamento di failover.
  </Card>
  <Card title="Ricerca web" href="/it/tools/web" icon="magnifying-glass">
    Configurazione dei provider di ricerca web, incluso Kimi.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo per provider, modelli e plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestione e documentazione delle chiavi API Moonshot.
  </Card>
</CardGroup>
