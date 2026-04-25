---
read_when:
    - Vuoi instradare OpenClaw tramite un proxy LiteLLM
    - Hai bisogno del monitoraggio dei costi, del logging o del routing dei modelli tramite LiteLLM
summary: Esegui OpenClaw tramite LiteLLM Proxy per un accesso unificato ai modelli e il monitoraggio dei costi
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:21:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) è un gateway LLM open-source che fornisce un'API unificata per oltre 100 provider di modelli. Instrada OpenClaw tramite LiteLLM per ottenere monitoraggio centralizzato dei costi, logging e la flessibilità di cambiare backend senza modificare la configurazione di OpenClaw.

<Tip>
**Perché usare LiteLLM con OpenClaw?**

- **Monitoraggio dei costi** — Vedi esattamente quanto OpenClaw spende su tutti i modelli
- **Routing dei modelli** — Passa da Claude a GPT-4, Gemini, Bedrock senza modifiche alla configurazione
- **Chiavi virtuali** — Crea chiavi con limiti di spesa per OpenClaw
- **Logging** — Log completi di richiesta/risposta per il debug
- **Fallback** — Failover automatico se il tuo provider primario non è disponibile

</Tip>

## Avvio rapido

<Tabs>
  <Tab title="Onboarding (consigliato)">
    **Ideale per:** il percorso più rapido verso una configurazione LiteLLM funzionante.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configurazione manuale">
    **Ideale per:** pieno controllo su installazione e configurazione.

    <Steps>
      <Step title="Avvia LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Punta OpenClaw a LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Fatto. OpenClaw ora viene instradato tramite LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione

### Variabili d'ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File di configurazione

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Configurazione avanzata

### Generazione di immagini

LiteLLM può anche supportare lo strumento `image_generate` tramite route OpenAI-compatible
`/images/generations` e `/images/edits`. Configura un modello immagine LiteLLM
in `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Gli URL LiteLLM loopback come `http://localhost:4000` funzionano senza un override globale
della rete privata. Per un proxy ospitato in LAN, imposta
`models.providers.litellm.request.allowPrivateNetwork: true` perché la chiave API
verrà inviata all'host proxy configurato.

<AccordionGroup>
  <Accordion title="Chiavi virtuali">
    Crea una chiave dedicata per OpenClaw con limiti di spesa:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Usa la chiave generata come `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Routing dei modelli">
    LiteLLM può instradare le richieste di modello verso backend diversi. Configura nel tuo `config.yaml` di LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw continua a richiedere `claude-opus-4-6` — LiteLLM gestisce il routing.

  </Accordion>

  <Accordion title="Visualizzazione dell'utilizzo">
    Controlla la dashboard o l'API di LiteLLM:

    ```bash
    # Informazioni sulla chiave
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Log di spesa
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Note sul comportamento del proxy">
    - LiteLLM viene eseguito su `http://localhost:4000` per impostazione predefinita
    - OpenClaw si connette tramite l'endpoint `/v1`
      OpenAI-compatible in stile proxy di LiteLLM
    - La modellazione nativa delle richieste solo OpenAI non si applica tramite LiteLLM:
      niente `service_tier`, niente `store` di Responses, niente suggerimenti di prompt-cache e nessuna
      modellazione del payload di compatibilità del reasoning OpenAI
    - Le intestazioni di attribuzione nascoste di OpenClaw (`originator`, `version`, `User-Agent`)
      non vengono iniettate su URL base LiteLLM personalizzati
  </Accordion>
</AccordionGroup>

<Note>
Per la configurazione generale del provider e il comportamento di failover, vedi [Provider di modelli](/it/concepts/model-providers).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Documentazione LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentazione ufficiale e riferimento API di LiteLLM.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti di modello e comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
</CardGroup>
