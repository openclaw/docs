---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) oppure Kimi Coding
    - Devi comprendere endpoint, chiavi e riferimenti ai modelli separati
    - Vuoi una configurazione da copiare e incollare per uno dei due provider
summary: Configura Moonshot K2 rispetto a Kimi Coding (provider e chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T07:28:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Imposta il
modello predefinito su `moonshot/kimi-k2.6` per Moonshot Open Platform oppure
su `kimi/kimi-for-coding` per Kimi Coding.

<Warning>
Moonshot e Kimi Coding sono **provider distinti**, ciascuno distribuito come Plugin esterno separato. Le chiavi non sono intercambiabili, gli endpoint sono diversi e anche i riferimenti ai modelli differiscono (`moonshot/...` rispetto a `kimi/...`).
</Warning>

## Catalogo dei modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Riferimento modello               | Nome                   | Ragionamento       | Input           | Contesto | Output massimo |
| --------------------------------- | ---------------------- | ------------------ | --------------- | -------- | -------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No                 | testo, immagine | 262,144  | 262,144        |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Sempre attivo      | testo, immagine | 262,144  | 262,144        |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No                 | testo, immagine | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sì                 | testo           | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sì                 | testo           | 262,144  | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No                 | testo           | 256,000  | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

Le stime dei costi del catalogo utilizzano le tariffe a consumo pubblicate da Moonshot: per Kimi
K2.7 Code, $0.19/MTok in caso di hit della cache, $0.95/MTok di input e $4.00/MTok di output; per Kimi
K2.6, $0.16/MTok in caso di hit della cache, $0.95/MTok di input e $4.00/MTok di output; per Kimi K2.5,
$0.10/MTok in caso di hit della cache, $0.60/MTok di input e $3.00/MTok di output. Le altre voci del catalogo
mantengono segnaposto a costo zero, a meno che non vengano sovrascritti nella configurazione.

Kimi K2.7 Code usa sempre il ragionamento nativo. OpenClaw espone solo lo stato
`on` del ragionamento per questo modello e omette i campi in uscita `thinking` e
`reasoning_effort`, come richiesto da Moonshot. Omette inoltre le sovrascritture
dei parametri di campionamento (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), che K2.7 mantiene sui valori predefiniti del provider. Kimi K2.6 rimane
il modello predefinito per la configurazione iniziale.

## Per iniziare

Moonshot e Kimi Coding sono entrambi Plugin esterni: installane uno prima
della configurazione iniziale.

<Tabs>
  <Tab title="API Moonshot">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Installa il Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Scegli la regione dell'endpoint">
        | Scelta di autenticazione | Endpoint                       | Regione        |
        | ------------------------ | ------------------------------ | -------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | Internazionale |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | Cina           |
      </Step>
      <Step title="Esegui la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oppure, per l'endpoint cinese:

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
      <Step title="Esegui uno smoke test in tempo reale">
        Usa una directory di stato isolata se vuoi verificare l'accesso al modello e il monitoraggio
        dei costi senza modificare le sessioni abituali:

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
        `model: "kimi-k2.6"`. La voce della trascrizione dell'assistente memorizza
        l'utilizzo normalizzato dei token e il costo stimato in `usage.cost` quando Moonshot restituisce
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
    **Ideale per:** attività incentrate sul codice tramite l'endpoint Kimi Coding.

    <Note>
    Kimi Coding utilizza una chiave API e un prefisso del provider (`kimi/...`) diversi da quelli di Moonshot (`moonshot/...`). Il riferimento stabile del modello è `kimi/kimi-for-coding`; i riferimenti precedenti `kimi/kimi-code` e `kimi/k2p5` rimangono accettati e vengono normalizzati a tale ID modello.
    </Note>

    <Steps>
      <Step title="Installa il Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Esegui la configurazione iniziale">
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

## Ricerca web di Kimi

Il Plugin Moonshot registra anche **Kimi** come provider `web_search`, basato sulla ricerca web di Moonshot.

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

    | Impostazione            | Opzioni                                                              |
    | ----------------------- | -------------------------------------------------------------------- |
    | Regione API             | `https://api.moonshot.ai/v1` (internazionale) oppure `https://api.moonshot.cn/v1` (Cina) |
    | Modello di ricerca web  | Il valore predefinito è `kimi-k2.6`                                  |

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
  <Accordion title="Modalità di ragionamento nativo">
    Kimi K2.7 Code usa sempre il ragionamento nativo. Moonshot richiede ai client di
    omettere il campo `thinking` per questo modello, pertanto OpenClaw espone solo `on` e
    ignora le impostazioni `off` obsolete. K2.7 fissa inoltre `temperature`, `top_p`, `n`,
    `presence_penalty` e `frequency_penalty`; OpenClaw omette le sovrascritture configurate
    per questi campi.

    Gli altri modelli Moonshot Kimi supportano il ragionamento nativo binario:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configuralo per ciascun modello tramite `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw associa i livelli `/think` di runtime per questi modelli:

    | Livello `/think`       | Comportamento di Moonshot |
    | ---------------------- | ------------------------- |
    | `/think off`           | `thinking.type=disabled`  |
    | Qualsiasi livello diverso da off | `thinking.type=enabled` |

    <Warning>
    Quando il ragionamento di Moonshot è abilitato, `tool_choice` deve essere `auto` o `none`. Una scelta dello strumento vincolata (`type: "tool"` o `type: "function"`) forza invece il ragionamento su `disabled`, affinché lo strumento richiesto venga comunque eseguito; `tool_choice: "required"` viene invece normalizzato in `auto`. Questo vale per ogni modello Moonshot tranne Kimi K2.7 Code, la cui modalità di ragionamento non può essere disabilitata: il relativo `tool_choice` viene normalizzato in `auto` quando non è compatibile.
    </Warning>

    Kimi K2.6 accetta anche un campo facoltativo `thinking.keep` che controlla
    la conservazione multi-turno di `reasoning_content`. Impostalo su `"all"` per conservare il
    ragionamento completo tra i turni; omettilo (o lascialo `null`) per utilizzare la strategia
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

  <Accordion title="Sanitizzazione degli ID delle chiamate agli strumenti">
    Moonshot Kimi fornisce ID `tool_call` nativi nel formato `functions.<name>:<index>`. OpenClaw conserva la prima occorrenza di ciascun ID Kimi nativo e riscrive i duplicati successivi come ID deterministici `call_*` in stile OpenAI. I risultati degli strumenti corrispondenti vengono rimappati con lo stesso ID, affinché la riproduzione rimanga univoca senza rimuovere il primo ID nativo di Kimi. Questo comportamento è integrato nel provider Moonshot incluso e non è un'impostazione configurabile dall'utente.
  </Accordion>

  <Accordion title="Compatibilità dell'utilizzo in streaming">
    Gli endpoint Moonshot nativi (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) dichiarano la compatibilità con il conteggio dell'utilizzo in streaming.
    OpenClaw determina questo comportamento in base all'host dell'endpoint, non all'ID del provider, pertanto un ID
    provider personalizzato che punta allo stesso host Moonshot nativo eredita lo stesso
    comportamento relativo all'utilizzo in streaming.

    Con i prezzi K2.6 del catalogo, l'utilizzo in streaming che include token di input, output
    e lettura dalla cache viene inoltre convertito in una stima locale del costo in USD per
    `/status`, `/usage full`, `/usage cost` e la contabilizzazione delle sessioni
    basata sulle trascrizioni.

  </Accordion>

  <Accordion title="Riferimento per endpoint e riferimenti dei modelli">
    | Provider   | Prefisso del riferimento del modello | Endpoint                       | Variabile di ambiente per l'autenticazione |
    | ---------- | ------------------------------------ | ------------------------------ | ------------------------------------------ |
    | Moonshot   | `moonshot/`                          | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                         |
    | Moonshot CN| `moonshot/`                          | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                         |
    | Kimi Coding| `kimi/`                              | Endpoint Kimi Coding           | `KIMI_API_KEY`                             |
    | Ricerca web| N/D                                  | Stessa regione dell'API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY`      |

    - La ricerca web di Kimi utilizza `KIMI_API_KEY` o `MOONSHOT_API_KEY` e per impostazione predefinita usa `https://api.moonshot.ai/v1` con il modello `kimi-k2.6`.
    - Se necessario, sovrascrivi i prezzi e i metadati del contesto in `models.providers`.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, modifica `contextWindow` di conseguenza.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Ricerca web" href="/it/tools/web" icon="magnifying-glass">
    Configurazione dei provider di ricerca web, incluso Kimi.
  </Card>
  <Card title="Riferimento alla configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo per provider, modelli e plugin.
  </Card>
  <Card title="Piattaforma aperta Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Gestione delle chiavi API Moonshot e documentazione.
  </Card>
</CardGroup>
