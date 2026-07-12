---
read_when:
    - Vuoi utilizzare i modelli OSS ospitati su Bedrock Mantle con OpenClaw
    - Ti serve l'endpoint di Mantle compatibile con OpenAI per GPT-OSS, Qwen, Kimi o GLM
    - Vuoi utilizzare Claude Sonnet 5 o Mythos 5 tramite Amazon Bedrock Mantle
summary: Usa i modelli Amazon Bedrock Mantle compatibili con OpenAI e Claude Messages con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T07:23:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw include un provider **Amazon Bedrock Mantle** integrato che si connette
all'endpoint di Mantle compatibile con OpenAI. Mantle ospita modelli open source e
di terze parti (GPT-OSS, Qwen, Kimi, GLM e simili) tramite un'interfaccia standard
`/v1/chat/completions` basata sull'infrastruttura Bedrock. Mantle espone inoltre
i modelli Anthropic Claude tramite una route Anthropic Messages.

| Proprietà        | Valore                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| ID provider      | `amazon-bedrock-mantle`                                                                                  |
| API              | `openai-completions` per i modelli OSS rilevati, `anthropic-messages` per i modelli Claude               |
| Autenticazione   | `AWS_BEARER_TOKEN_BEDROCK` esplicito o generazione di un token bearer tramite la catena di credenziali IAM |
| Regione predefinita | `us-east-1` (sostituibile con `AWS_REGION` o `AWS_DEFAULT_REGION`)                                    |

## Introduzione

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Token bearer esplicito">
    **Ideale per:** ambienti in cui disponi già di un token bearer Mantle.

    <Steps>
      <Step title="Imposta il token bearer sull'host del Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Facoltativamente, imposta una regione (il valore predefinito è `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```

        I modelli rilevati vengono visualizzati sotto il provider
        `amazon-bedrock-mantle`. Non è necessaria alcuna configurazione
        aggiuntiva, a meno che tu non voglia sostituire i valori predefiniti.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenziali IAM">
    **Ideale per:** l'utilizzo di credenziali compatibili con AWS SDK (configurazione condivisa, SSO, identità Web, ruoli di istanza o attività).

    <Steps>
      <Step title="Configura le credenziali AWS sull'host del Gateway">
        È supportata qualsiasi origine di autenticazione compatibile con AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automaticamente un token bearer Mantle dalla catena di credenziali.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` non è impostato, OpenClaw genera per te il token bearer dalla catena di credenziali predefinita di AWS, incluse credenziali condivise, profili di configurazione, SSO, identità Web e ruoli di istanza o attività.
    </Tip>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

Quando `AWS_BEARER_TOKEN_BEDROCK` è impostato, OpenClaw lo utilizza direttamente.
In caso contrario, OpenClaw tenta di generare un token bearer Mantle dalla catena
di credenziali predefinita di AWS. Successivamente rileva i modelli Mantle
disponibili interrogando l'endpoint `/v1/models` della regione.

| Comportamento               | Dettagli                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Cache del rilevamento       | I risultati vengono memorizzati nella cache per 1 ora per regione; in caso di errore di recupero viene restituito l'ultimo risultato memorizzato |
| Aggiornamento del token IAM | Ogni 2 ore, con memorizzazione nella cache per regione                                                                    |

Per mantenere abilitato il plugin Mantle ma disattivare il rilevamento automatico
e la generazione del token bearer IAM, disabilita l'opzione di rilevamento
gestita dal plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Il token bearer è lo stesso `AWS_BEARER_TOKEN_BEDROCK` utilizzato dal provider standard [Amazon Bedrock](/it/providers/bedrock).
</Note>

### Regioni supportate

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configurazione manuale

Se preferisci una configurazione esplicita al rilevamento automatico:

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

Un elenco `models` esplicito e non vuoto è determinante e sostituisce ogni
voce rilevata, incluse le voci Claude riportate di seguito. Ometti `models` per
mantenere il catalogo Mantle automatico oppure includi tutte le voci dei modelli
Claude che desideri utilizzare.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Supporto al ragionamento">
    Il supporto al ragionamento viene dedotto dagli ID dei modelli che contengono
    schemi come `thinking`, `reasoner`, `reasoning`, `deepseek.r`,
    `gpt-oss-120b` o `gpt-oss-safeguard-120b`. Durante il rilevamento, OpenClaw
    imposta automaticamente `reasoning: true` per i modelli corrispondenti.
  </Accordion>

  <Accordion title="Endpoint non disponibile">
    Se l'endpoint Mantle non è disponibile, non restituisce modelli o la
    risoluzione del token bearer non riesce, il rilevamento restituisce un
    risultato vuoto e il provider implicito viene ignorato. OpenClaw non
    restituisce un errore; gli altri provider configurati continuano a
    funzionare normalmente.
  </Accordion>

  <Accordion title="Claude tramite la route Anthropic Messages">
    Quando il rilevamento automatico gestisce l'elenco dei modelli, OpenClaw
    aggiunge quattro modelli Claude dopo una ricerca riuscita, indipendentemente
    da ciò che restituisce `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) e
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), oltre a
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (anteprima di Claude
    Mythos). Utilizzano l'interfaccia API `anthropic-messages` e trasmettono il
    flusso tramite lo stesso endpoint compatibile con Anthropic e autenticato
    mediante bearer (`<mantle-base>/anthropic`), pertanto il token bearer AWS non
    viene trattato come una chiave API Anthropic.

    Claude Sonnet 5 utilizza sempre il pensiero adattivo e il livello di impegno
    predefinito è `high`. `/think off` e `/think minimal` vengono associati a
    `low` perché la route Mantle non può disabilitare il pensiero. OpenClaw
    omette inoltre la temperatura personalizzata per le richieste Sonnet 5.

    Claude Mythos 5 è ad accesso limitato. Offre una finestra di contesto di
    1.000.000 di token e un limite di output di 128.000 token, utilizza sempre
    il pensiero adattivo, associa `/think off` e `/think minimal` a `low` e
    omette i parametri di campionamento selezionati dal chiamante.

    Claude Mythos Preview richiede sempre il ragionamento, con un livello di
    impegno predefinito pari a `high` quando non è impostato alcun livello
    `/think` (`xhigh`/`max` vengono ridotti a `high` e `minimal` viene aumentato
    a `low`). Opus 4.7 su Mantle trasmette il flusso senza ragionamento fornito
    dal modello e OpenClaw ne omette il parametro `temperature`, poiché Opus 4.7
    non accetta sostituzioni dei parametri di campionamento su questa route;
    Mythos Preview accetta normalmente una sostituzione di `temperature`.

    Un elenco esplicito e non vuoto
    `models.providers["amazon-bedrock-mantle"].models` sostituisce l'intero
    catalogo rilevato. Ometti tale elenco se desideri queste voci Claude
    integrate.

  </Accordion>

  <Accordion title="Relazione con il provider Amazon Bedrock">
    Bedrock Mantle è un provider distinto dal provider standard
    [Amazon Bedrock](/it/providers/bedrock). Mantle utilizza un'interfaccia `/v1`
    compatibile con OpenAI per il proprio catalogo OSS, mentre il provider
    Bedrock standard utilizza l'API nativa Bedrock Converse.

    Entrambi i provider condividono la stessa credenziale
    `AWS_BEARER_TOKEN_BEDROCK`, quando presente.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/it/providers/bedrock" icon="cloud">
    Provider Bedrock nativo per Anthropic Claude, Titan e altri modelli.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole per il riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e relative soluzioni.
  </Card>
</CardGroup>
