---
read_when:
    - Vuoi usare i modelli OSS ospitati su Bedrock Mantle con OpenClaw
    - Hai bisogno dell'endpoint compatibile con OpenAI di Mantle per GPT-OSS, Qwen, Kimi o GLM
summary: Usa i modelli Amazon Bedrock Mantle (compatibili con OpenAI) con OpenClaw
title: Mantle di Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:05:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw include un provider **Amazon Bedrock Mantle** in bundle che si collega
all'endpoint Mantle compatibile con OpenAI. Mantle ospita modelli open-source e
di terze parti (GPT-OSS, Qwen, Kimi, GLM e simili) tramite una superficie
`/v1/chat/completions` standard supportata dall'infrastruttura Bedrock.

| Proprietà      | Valore                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID provider    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (compatibile con OpenAI) o `anthropic-messages` (route Anthropic Messages) |
| Autenticazione | `AWS_BEARER_TOKEN_BEDROCK` esplicito o generazione del bearer token tramite catena di credenziali IAM |
| Regione predefinita | `us-east-1` (sovrascrivibile con `AWS_REGION` o `AWS_DEFAULT_REGION`)                  |

## Introduzione

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Explicit bearer token">
    **Ideale per:** ambienti in cui disponi già di un bearer token Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Facoltativamente, imposta una regione (predefinita: `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        Claude Fable 5 e i modelli Bedrock di classe Claude Mythos richiedono la modalità `provider_data_share` dell'API Mantle Data Retention prima dell'invocazione. Questa adesione consente a Bedrock di condividere prompt e completamenti con Anthropic e di conservarli fino a 30 giorni per la revisione di fiducia e sicurezza.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Usa un altro modello Bedrock nella configurazione se non puoi accettare quella modalità di conservazione.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        I modelli rilevati compaiono sotto il provider `amazon-bedrock-mantle`. Non è
        richiesta alcuna configurazione aggiuntiva, a meno che tu non voglia sovrascrivere i valori predefiniti.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Ideale per:** usare credenziali compatibili con AWS SDK (configurazione condivisa, SSO, identità web, ruoli di istanza o attività).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Funziona qualsiasi origine di autenticazione compatibile con AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automaticamente un bearer token Mantle dalla catena di credenziali.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` non è impostato, OpenClaw crea per te il bearer token dalla catena di credenziali predefinita di AWS, inclusi credenziali condivise, profili di configurazione, SSO, identità web e ruoli di istanza o attività.
    </Tip>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

Quando `AWS_BEARER_TOKEN_BEDROCK` è impostato, OpenClaw lo usa direttamente. Altrimenti,
OpenClaw tenta di generare un bearer token Mantle dalla catena di credenziali
predefinita di AWS. Quindi rileva i modelli Mantle disponibili interrogando
l'endpoint `/v1/models` della regione.

| Comportamento       | Dettaglio                         |
| ------------------- | --------------------------------- |
| Cache di rilevamento | Risultati memorizzati in cache per 1 ora |
| Aggiornamento token IAM | Ogni ora                      |

Per mantenere abilitato il Plugin Mantle ma sopprimere il rilevamento automatico e la
generazione del bearer token IAM, disabilita il toggle di rilevamento di proprietà del Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Il bearer token è lo stesso `AWS_BEARER_TOKEN_BEDROCK` usato dal provider standard [Amazon Bedrock](/it/providers/bedrock).
</Note>

### Regioni supportate

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configurazione manuale

Se preferisci una configurazione esplicita invece del rilevamento automatico:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Reasoning support">
    Il supporto al reasoning viene dedotto dagli ID dei modelli che contengono pattern come
    `thinking`, `reasoner` o `gpt-oss-120b`. OpenClaw imposta automaticamente `reasoning: true`
    per i modelli corrispondenti durante il rilevamento.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Se l'endpoint Mantle non è disponibile o non restituisce modelli, il provider viene
    ignorato silenziosamente. OpenClaw non genera errori; gli altri provider configurati
    continuano a funzionare normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle espone anche una route Anthropic Messages che trasporta i modelli Claude attraverso lo stesso percorso di streaming autenticato con bearer token. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) è invocabile tramite questa route con streaming di proprietà del provider, quindi i bearer token AWS non vengono trattati come chiavi API Anthropic.

    Quando fissi un modello Anthropic Messages sul provider Mantle, OpenClaw usa la superficie API `anthropic-messages` invece di `openai-completions` per quel modello. L'autenticazione proviene comunque da `AWS_BEARER_TOKEN_BEDROCK` (o dal bearer token IAM creato).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle è un provider separato dal provider standard
    [Amazon Bedrock](/it/providers/bedrock). Mantle usa una superficie `/v1`
    compatibile con OpenAI, mentre il provider Bedrock standard usa
    l'API nativa Bedrock.

    Entrambi i provider condividono la stessa credenziale `AWS_BEARER_TOKEN_BEDROCK`
    quando è presente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/it/providers/bedrock" icon="cloud">
    Provider Bedrock nativo per Anthropic Claude, Titan e altri modelli.
  </Card>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="OAuth and auth" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riuso delle credenziali.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
