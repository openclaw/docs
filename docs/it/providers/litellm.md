---
read_when:
    - Vuoi instradare OpenClaw tramite un proxy LiteLLM
    - Hai bisogno del monitoraggio dei costi, della registrazione dei log o dell'instradamento dei modelli tramite LiteLLM
summary: Esegui OpenClaw tramite LiteLLM Proxy per un accesso unificato ai modelli e il monitoraggio dei costi
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T07:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) è un gateway LLM open source con un'API unificata per oltre 100 provider
di modelli. Instrada OpenClaw tramite LiteLLM per centralizzare il monitoraggio dei costi, la registrazione, le chiavi virtuali con
limiti di spesa e il failover del backend senza modificare la configurazione di OpenClaw.

## Avvio rapido

<Tabs>
  <Tab title="Configurazione iniziale (consigliata)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Per una configurazione non interattiva con un proxy remoto, specifica esplicitamente l'URL del proxy:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Configurazione manuale">
    <Steps>
      <Step title="Avvia il proxy LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Indirizza OpenClaw a LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Configurazione

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

Il modello predefinito scritto dalla configurazione iniziale è `litellm/claude-opus-4-6`.

## Generazione di immagini

LiteLLM può supportare lo strumento `image_generate` tramite le route compatibili con OpenAI `/images/generations` e
`/images/edits`. Il modello di immagini predefinito è `gpt-image-2`; configurane uno diverso in
`agents.defaults.imageGenerationModel`:

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

Gli URL local loopback di LiteLLM (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) funzionano
senza un'eccezione globale per la rete privata. Per un proxy ospitato sulla LAN, imposta
`models.providers.litellm.request.allowPrivateNetwork: true` perché la chiave API viene inviata a tale host.

## Funzionalità avanzate

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

  <Accordion title="Instradamento dei modelli">
    LiteLLM può instradare le richieste dei modelli verso backend diversi. Configuralo nel file `config.yaml` di LiteLLM:

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

    OpenClaw continua a richiedere `claude-opus-4-6`; LiteLLM gestisce l'instradamento.

  </Accordion>

  <Accordion title="Visualizzazione dell'utilizzo">
    ```bash
    # Informazioni sulla chiave
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Registri di spesa
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Note sul comportamento del proxy">
    - Per impostazione predefinita, LiteLLM viene eseguito su `http://localhost:4000`.
    - OpenClaw si connette tramite l'endpoint `/v1` compatibile con OpenAI in stile proxy di LiteLLM.
    - La strutturazione delle richieste riservata agli endpoint OpenAI nativi non si applica quando si usa un URL di base LiteLLM configurato:
      niente `service_tier`, niente `store` di Responses, niente suggerimenti per la cache dei prompt, niente strutturazione del payload
      relativa all'intensità di ragionamento di OpenAI.
    - Le intestazioni nascoste di attribuzione di OpenClaw (`originator`, `version`, `User-Agent`) vengono inviate solo agli
      endpoint OpenAI nativi verificati, quindi non vengono inserite in un URL di base LiteLLM personalizzato.
  </Accordion>
</AccordionGroup>

<Note>
Per la configurazione generale dei provider e il comportamento di failover, consulta [Provider di modelli](/it/concepts/model-providers).
</Note>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Documentazione di LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentazione ufficiale di LiteLLM e riferimento dell'API.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
  <Card title="Modelli" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
</CardGroup>
