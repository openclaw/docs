---
read_when:
    - Vuoi usare modelli OSS ospitati da Bedrock Mantle con OpenClaw
    - Hai bisogno dell'endpoint compatibile con OpenAI di Mantle per GPT-OSS, Qwen, Kimi o GLM
summary: Usare i modelli Amazon Bedrock Mantle (compatibili con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T08:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw include un provider **Amazon Bedrock Mantle** integrato che si connette
all'endpoint compatibile con OpenAI di Mantle. Mantle ospita modelli open-source e
di terze parti (GPT-OSS, Qwen, Kimi, GLM e simili) tramite una superficie standard
`/v1/chat/completions` supportata dall'infrastruttura Bedrock.

| Proprietà       | Valore                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| ID provider     | `amazon-bedrock-mantle`                                                                     |
| API             | `openai-completions` (compatibile con OpenAI) o `anthropic-messages` (percorso Anthropic Messages) |
| Auth            | `AWS_BEARER_TOKEN_BEDROCK` esplicito o generazione di bearer token dalla catena di credenziali IAM |
| Regione predefinita | `us-east-1` (sovrascrivi con `AWS_REGION` o `AWS_DEFAULT_REGION`)                       |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Bearer token esplicito">
    **Ideale per:** ambienti in cui hai già un bearer token Mantle.

    <Steps>
      <Step title="Imposta il bearer token sull'host del gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opzionalmente imposta una regione (predefinita `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```

        I modelli rilevati appaiono sotto il provider `amazon-bedrock-mantle`. Non
        è richiesta alcuna configurazione aggiuntiva, a meno che tu non voglia sovrascrivere i valori predefiniti.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenziali IAM">
    **Ideale per:** uso di credenziali compatibili con AWS SDK (configurazione condivisa, SSO, web identity, ruoli di istanza o task).

    <Steps>
      <Step title="Configura le credenziali AWS sull'host del gateway">
        Qualsiasi sorgente di autenticazione compatibile con AWS SDK funziona:

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
    Quando `AWS_BEARER_TOKEN_BEDROCK` non è impostato, OpenClaw genera per te il bearer token a partire dalla catena di credenziali predefinita di AWS, incluse credenziali/configurazioni condivise, SSO, web identity e ruoli di istanza o task.
    </Tip>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

Quando `AWS_BEARER_TOKEN_BEDROCK` è impostato, OpenClaw lo usa direttamente. Altrimenti,
OpenClaw tenta di generare un bearer token Mantle dalla catena di credenziali predefinita
di AWS. Quindi rileva i modelli Mantle disponibili interrogando l'endpoint
`/v1/models` della regione.

| Comportamento          | Dettaglio                    |
| ---------------------- | ---------------------------- |
| Cache del rilevamento  | Risultati memorizzati per 1 ora |
| Refresh del token IAM  | Ogni ora                     |

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

## Note avanzate

<AccordionGroup>
  <Accordion title="Supporto del reasoning">
    Il supporto del reasoning viene dedotto dagli ID dei modelli che contengono pattern come
    `thinking`, `reasoner` o `gpt-oss-120b`. OpenClaw imposta automaticamente `reasoning: true`
    per i modelli corrispondenti durante il rilevamento.
  </Accordion>

  <Accordion title="Indisponibilità dell'endpoint">
    Se l'endpoint Mantle non è disponibile o non restituisce modelli, il provider viene
    saltato silenziosamente. OpenClaw non genera errori; gli altri provider configurati
    continuano a funzionare normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 tramite il percorso Anthropic Messages">
    Mantle espone anche un percorso Anthropic Messages che trasporta i modelli Claude tramite lo stesso percorso di streaming autenticato con bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) è richiamabile tramite questo percorso con streaming gestito dal provider, quindi i bearer token AWS non vengono trattati come chiavi API Anthropic.

    Quando fissi un modello Anthropic Messages sul provider Mantle, OpenClaw usa per quel modello la superficie API `anthropic-messages` invece di `openai-completions`. L'auth continua comunque a provenire da `AWS_BEARER_TOKEN_BEDROCK` (o dal bearer token IAM generato).

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
    Bedrock Mantle è un provider separato rispetto al provider standard
    [Amazon Bedrock](/it/providers/bedrock). Mantle usa una
    superficie `/v1` compatibile con OpenAI, mentre il provider Bedrock standard usa
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
    Dettagli auth e regole di riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
