---
read_when:
    - Vuoi usare i modelli Amazon Bedrock con OpenClaw
    - Ti serve la configurazione di credenziali/regione AWS per le chiamate ai modelli
summary: Usa i modelli Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T08:55:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw può usare modelli **Amazon Bedrock** tramite il provider di streaming **Bedrock Converse**
di pi-ai. L'autenticazione Bedrock usa la **catena predefinita di credenziali AWS SDK**,
non una API key.

| Proprietà | Valore                                                      |
| --------- | ----------------------------------------------------------- |
| Provider  | `amazon-bedrock`                                            |
| API       | `bedrock-converse-stream`                                   |
| Auth      | Credenziali AWS (env var, configurazione condivisa o ruolo dell'istanza) |
| Regione   | `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinita: `us-east-1`) |

## Per iniziare

Scegli il tuo metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Access key / env var">
    **Ideale per:** macchine di sviluppo, CI o host in cui gestisci direttamente le credenziali AWS.

    <Steps>
      <Step title="Imposta le credenziali AWS sull'host gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Facoltativo:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Facoltativo (API key/token bearer Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Aggiungi un provider Bedrock e un modello alla tua configurazione">
        Non è richiesta alcuna `apiKey`. Configura il provider con `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con auth env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw abilita automaticamente il provider Bedrock implicito per il discovery dei modelli senza configurazione aggiuntiva.
    </Tip>

  </Tab>

  <Tab title="Ruoli dell'istanza EC2 (IMDS)">
    **Ideale per:** istanze EC2 con un ruolo IAM associato, che usano l'instance metadata service per l'autenticazione.

    <Steps>
      <Step title="Abilita esplicitamente il discovery">
        Quando usi IMDS, OpenClaw non può rilevare l'autenticazione AWS dai soli env marker, quindi devi fare opt-in:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Facoltativamente aggiungi un env marker per la modalità auto">
        Se vuoi che funzioni anche il percorso di auto-rilevamento basato su env-marker (ad esempio per le superfici `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Non** hai bisogno di una falsa API key.
      </Step>
      <Step title="Verifica che i modelli vengano rilevati">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Il ruolo IAM associato alla tua istanza EC2 deve avere i seguenti permessi:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (per il discovery automatico)
    - `bedrock:ListInferenceProfiles` (per il discovery degli inference profile)

    Oppure associa la policy gestita `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Ti serve `AWS_PROFILE=default` solo se vuoi esplicitamente un env marker per la modalità auto o per le superfici di stato. Il percorso di autenticazione runtime reale di Bedrock usa la catena predefinita dell'AWS SDK, quindi l'autenticazione tramite ruolo di istanza IMDS funziona anche senza env marker.
    </Note>

  </Tab>
</Tabs>

## Discovery automatico dei modelli

OpenClaw può rilevare automaticamente i modelli Bedrock che supportano **streaming**
e **output testuale**. Il discovery usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e i risultati vengono mantenuti in cache (predefinito: 1 ora).

Come viene abilitato il provider implicito:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` è `true`,
  OpenClaw proverà il discovery anche quando non è presente alcun env marker AWS.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` non è impostato,
  OpenClaw aggiunge automaticamente il provider implicito
  Bedrock solo quando vede uno di questi marker auth AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- Il percorso di autenticazione runtime reale di Bedrock continua comunque a usare la catena predefinita dell'AWS SDK, quindi
  configurazione condivisa, SSO e autenticazione tramite ruolo di istanza IMDS possono funzionare anche quando il discovery
  ha richiesto `enabled: true` per l'opt-in.

<Note>
Per voci esplicite `models.providers["amazon-bedrock"]`, OpenClaw può comunque risolvere in anticipo l'autenticazione env-marker di Bedrock da marker AWS come `AWS_BEARER_TOKEN_BEDROCK` senza forzare il caricamento completo dell'autenticazione runtime. Il percorso di autenticazione effettivo delle chiamate al modello continua comunque a usare la catena predefinita dell'AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opzioni di configurazione del discovery">
    Le opzioni di configurazione si trovano sotto `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Opzione | Predefinito | Descrizione |
    | ------ | ------- | ----------- |
    | `enabled` | auto | In modalità auto, OpenClaw abilita il provider implicito Bedrock solo quando vede un env marker AWS supportato. Imposta `true` per forzare il discovery. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Regione AWS usata per le chiamate API di discovery. |
    | `providerFilter` | (tutti) | Corrisponde ai nomi dei provider Bedrock (ad esempio `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durata della cache in secondi. Imposta `0` per disabilitare la cache. |
    | `defaultContextWindow` | `32000` | Finestra di contesto usata per i modelli rilevati (sovrascrivila se conosci i limiti del tuo modello). |
    | `defaultMaxTokens` | `4096` | Numero massimo di token di output usati per i modelli rilevati (sovrascrivilo se conosci i limiti del tuo modello). |

  </Accordion>
</AccordionGroup>

## Configurazione rapida (percorso AWS)

Questa procedura crea un ruolo IAM, associa i permessi Bedrock, associa
l'instance profile e abilita il discovery OpenClaw sull'host EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Inference profile">
    OpenClaw rileva **inference profile regionali e globali** insieme ai
    foundation model. Quando un profile mappa a un foundation model noto, il
    profile eredita le capability di quel modello (finestra di contesto, max token,
    reasoning, vision) e la corretta regione di richiesta Bedrock viene iniettata
    automaticamente. Questo significa che i profile Claude cross-region funzionano senza override manuali del provider.

    Gli id degli inference profile hanno un aspetto come `us.anthropic.claude-opus-4-6-v1:0` (regionale)
    o `anthropic.claude-opus-4-6-v1:0` (globale). Se il modello sottostante è già
    nei risultati del discovery, il profile ne eredita l'intero set di capability;
    altrimenti si applicano valori predefiniti sicuri.

    Non è richiesta alcuna configurazione aggiuntiva. Finché il discovery è abilitato e il principal IAM
    ha `bedrock:ListInferenceProfiles`, i profile compaiono insieme ai
    foundation model in `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrail">
    Puoi applicare [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a tutte le invocazioni dei modelli Bedrock aggiungendo un oggetto `guardrail` alla
    configurazione del Plugin `amazon-bedrock`. I Guardrail ti permettono di applicare filtri dei contenuti,
    negazione di argomenti, filtri di parole, filtri per informazioni sensibili e controlli di contextual
    grounding.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID o ARN completo
                guardrailVersion: "1", // numero di versione oppure "DRAFT"
                streamProcessingMode: "sync", // facoltativo: "sync" o "async"
                trace: "enabled", // facoltativo: "enabled", "disabled" o "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opzione | Obbligatoria | Descrizione |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sì | Guardrail ID (es. `abc123`) o ARN completo (es. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sì | Numero della versione pubblicata, oppure `"DRAFT"` per la bozza di lavoro. |
    | `streamProcessingMode` | No | `"sync"` o `"async"` per la valutazione dei guardrail durante lo streaming. Se omesso, Bedrock usa il proprio valore predefinito. |
    | `trace` | No | `"enabled"` o `"enabled_full"` per il debug; ometti o imposta `"disabled"` in produzione. |

    <Warning>
    Il principal IAM usato dal gateway deve avere il permesso `bedrock:ApplyGuardrail` oltre ai permessi standard di invocazione.
    </Warning>

  </Accordion>

  <Accordion title="Embedding per la ricerca in memoria">
    Bedrock può anche fungere da provider di embedding per la
    [ricerca in memoria](/it/concepts/memory-search). Questo viene configurato separatamente dal
    provider di inferenza -- imposta `agents.defaults.memorySearch.provider` su `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // predefinito
          },
        },
      },
    }
    ```

    Gli embedding Bedrock usano la stessa catena di credenziali AWS SDK dell'inferenza (ruoli
    di istanza, SSO, access key, configurazione condivisa e web identity). Non è necessaria
    alcuna API key. Quando `provider` è `"auto"`, Bedrock viene rilevato automaticamente se quella
    catena di credenziali si risolve con successo.

    I modelli di embedding supportati includono Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Vedi
    [Memory configuration reference -- Bedrock](/it/reference/memory-config#bedrock-embedding-config)
    per l'elenco completo dei modelli e le opzioni di dimensione.

  </Accordion>

  <Accordion title="Note e limitazioni">
    - Bedrock richiede l'abilitazione dell'**accesso ai modelli** nel tuo account/regione AWS.
    - Il discovery automatico richiede i permessi `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se ti affidi alla modalità auto, imposta uno dei marker env auth AWS supportati sull'
      host gateway. Se preferisci l'autenticazione IMDS/shared-config senza env marker, imposta
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw espone la sorgente delle credenziali in quest'ordine: `AWS_BEARER_TOKEN_BEDROCK`,
      poi `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, poi `AWS_PROFILE`, poi la
      catena predefinita dell'AWS SDK.
    - Il supporto reasoning dipende dal modello; controlla la scheda del modello Bedrock per
      le capability correnti.
    - Se preferisci un flusso di chiavi gestito, puoi anche mettere un proxy
      compatibile OpenAI davanti a Bedrock e configurarlo invece come provider OpenAI.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti del modello e comportamento di failover.
  </Card>
  <Card title="Ricerca in memoria" href="/it/concepts/memory-search" icon="magnifying-glass">
    Configurazione degli embedding Bedrock per la ricerca in memoria.
  </Card>
  <Card title="Memory config reference" href="/it/reference/memory-config#bedrock-embedding-config" icon="database">
    Elenco completo dei modelli di embedding Bedrock e opzioni di dimensione.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
