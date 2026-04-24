---
read_when:
    - Vuoi usare modelli OSS ospitati su Bedrock Mantle con OpenClaw
    - Hai bisogno dell'endpoint compatibile con OpenAI di Mantle per GPT-OSS, Qwen, Kimi o GLM
summary: Usare modelli Amazon Bedrock Mantle (compatibili con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T08:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw include un provider **Amazon Bedrock Mantle** incluso che si connette
all'endpoint Mantle compatibile con OpenAI. Mantle ospita modelli open-source e
di terze parti (GPT-OSS, Qwen, Kimi, GLM e simili) tramite una superficie standard
`/v1/chat/completions` supportata dall'infrastruttura Bedrock.

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID provider    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (compatibile con OpenAI) o `anthropic-messages` (rotta Anthropic Messages) |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` esplicito o generazione del bearer token tramite catena di credenziali IAM |
| Regione predefinita | `us-east-1` (override con `AWS_REGION` o `AWS_DEFAULT_REGION`)                         |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Bearer token esplicito">
    **Ideale per:** ambienti in cui possiedi già un bearer token Mantle.

    <Steps>
      <Step title="Imposta il bearer token sull'host Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Facoltativamente imposta una regione (il valore predefinito è `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```

        I modelli rilevati compaiono sotto il provider `amazon-bedrock-mantle`. Non
        è richiesta alcuna configurazione aggiuntiva a meno che tu non voglia sovrascrivere i valori predefiniti.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenziali IAM">
    **Ideale per:** usare credenziali compatibili con AWS SDK (configurazione condivisa, SSO, web identity, ruoli di istanza o task).

    <Steps>
      <Step title="Configura le credenziali AWS sull'host Gateway">
        Qualsiasi sorgente auth compatibile con AWS SDK funziona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automaticamente un bearer token Mantle dalla catena di credenziali.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` non è impostato, OpenClaw emette per te il bearer token a partire dalla catena di credenziali predefinita AWS, incluse credenziali/profili di configurazione condivisi, SSO, web identity e ruoli di istanza o task.
    </Tip>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

Quando `AWS_BEARER_TOKEN_BEDROCK` è impostato, OpenClaw lo usa direttamente. Altrimenti,
OpenClaw tenta di generare un bearer token Mantle dalla catena di credenziali
predefinita AWS. Poi rileva i modelli Mantle disponibili interrogando
l'endpoint `/v1/models` della regione.

| Behavior          | Detail                    |
| ----------------- | ------------------------- |
| Cache del rilevamento | Risultati in cache per 1 ora |
| Refresh del token IAM | Ogni ora                 |

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
  <Accordion title="Supporto al reasoning">
    Il supporto al reasoning viene dedotto dagli ID modello che contengono pattern come
    `thinking`, `reasoner` o `gpt-oss-120b`. Durante il rilevamento, OpenClaw imposta `reasoning: true`
    automaticamente per i modelli corrispondenti.
  </Accordion>

  <Accordion title="Indisponibilità dell'endpoint">
    Se l'endpoint Mantle non è disponibile o non restituisce modelli, il provider viene
    saltato silenziosamente. OpenClaw non genera errori; gli altri provider configurati
    continuano a funzionare normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 tramite la rotta Anthropic Messages">
    Mantle espone anche una rotta Anthropic Messages che trasporta modelli Claude attraverso lo stesso percorso di streaming autenticato con bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) è richiamabile tramite questa rotta con streaming posseduto dal provider, quindi i bearer token AWS non vengono trattati come chiavi API Anthropic.

    Quando fissi un modello Anthropic Messages sul provider Mantle, OpenClaw usa la superficie API `anthropic-messages` invece di `openai-completions` per quel modello. L'auth continua a provenire da `AWS_BEARER_TOKEN_BEDROCK` (o dal bearer token IAM emesso).

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

  <Accordion title="Relazione con il provider Amazon Bedrock">
    Bedrock Mantle è un provider separato dal provider standard
    [Amazon Bedrock](/it/providers/bedrock). Mantle usa una superficie
    `/v1` compatibile con OpenAI, mentre il provider Bedrock standard usa
    l'API Bedrock nativa.

    Entrambi i provider condividono la stessa credenziale `AWS_BEARER_TOKEN_BEDROCK` quando
    presente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/it/providers/bedrock" icon="cloud">
    Provider Bedrock nativo per Anthropic Claude, Titan e altri modelli.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riuso delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
