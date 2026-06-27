---
read_when:
    - Vuoi usare i modelli Amazon Bedrock con OpenClaw
    - Hai bisogno della configurazione delle credenziali AWS e della regione per le chiamate ai modelli
summary: Usare i modelli Amazon Bedrock (Converse API) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw può usare i modelli **Amazon Bedrock** tramite il suo provider di streaming **Bedrock Converse**. L'autenticazione Bedrock usa la **catena di credenziali predefinita dell'AWS SDK**, non una chiave API.

| Proprietà | Valore                                                      |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | Credenziali AWS (variabili env, configurazione condivisa o ruolo istanza) |
| Regione  | `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinito: `us-east-1`) |

## Guida introduttiva

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Access keys / env vars">
    **Ideale per:** macchine di sviluppo, CI o host in cui gestisci direttamente le credenziali AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        Non è richiesto alcun `apiKey`. Configura il provider con `auth: "aws-sdk"`:

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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con l'autenticazione tramite marcatori env (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw abilita automaticamente il provider Bedrock implicito per la scoperta dei modelli senza configurazione aggiuntiva.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Ideale per:** istanze EC2 con un ruolo IAM associato, usando il servizio di metadati dell'istanza per l'autenticazione.

    <Steps>
      <Step title="Enable discovery explicitly">
        Quando usi IMDS, OpenClaw non può rilevare l'autenticazione AWS dai soli marcatori env, quindi devi abilitarla esplicitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Se vuoi che funzioni anche il percorso di rilevamento automatico dei marcatori env (ad esempio, per le superfici di `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Non** hai bisogno di una chiave API fittizia.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Il ruolo IAM associato alla tua istanza EC2 deve avere le seguenti autorizzazioni:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (per la scoperta automatica)
    - `bedrock:ListInferenceProfiles` (per la scoperta dei profili di inferenza)

    Oppure associa la policy gestita `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Hai bisogno di `AWS_PROFILE=default` solo se vuoi specificamente un marcatore env per la modalità automatica o le superfici di stato. Il percorso di autenticazione runtime effettivo di Bedrock usa la catena predefinita dell'AWS SDK, quindi l'autenticazione tramite ruolo istanza IMDS funziona anche senza marcatori env.
    </Note>

  </Tab>
</Tabs>

## Scoperta automatica dei modelli

OpenClaw può scoprire automaticamente i modelli Bedrock che supportano lo **streaming**
e l'**output di testo**. La scoperta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e i risultati vengono memorizzati nella cache (predefinito: 1 ora).

Come viene abilitato il provider implicito:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` è `true`,
  OpenClaw proverà la scoperta anche quando non è presente alcun marcatore env AWS.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` non è impostato,
  OpenClaw aggiunge automaticamente il
  provider Bedrock implicito solo quando vede uno di questi marcatori di autenticazione AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- Il percorso di autenticazione runtime effettivo di Bedrock usa comunque la catena predefinita dell'AWS SDK, quindi
  configurazione condivisa, SSO e autenticazione tramite ruolo istanza IMDS possono funzionare anche quando la scoperta
  richiedeva `enabled: true` per essere abilitata.

<Note>
Per le voci esplicite `models.providers["amazon-bedrock"]`, OpenClaw può comunque risolvere in anticipo l'autenticazione Bedrock tramite marcatori env dai marcatori env AWS come `AWS_BEARER_TOKEN_BEDROCK` senza forzare il caricamento completo dell'autenticazione runtime. Il percorso di autenticazione effettivo per le chiamate al modello usa comunque la catena predefinita dell'AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
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
    | `enabled` | auto | In modalità automatica, OpenClaw abilita il provider Bedrock implicito solo quando vede un marcatore env AWS supportato. Imposta `true` per forzare la scoperta. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Regione AWS usata per le chiamate API di scoperta. |
    | `providerFilter` | (tutti) | Corrisponde ai nomi dei provider Bedrock (ad esempio `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durata della cache in secondi. Imposta a `0` per disabilitare la cache. |
    | `defaultContextWindow` | `32000` | Finestra di contesto usata per i modelli scoperti (sovrascrivi se conosci i limiti del modello). |
    | `defaultMaxTokens` | `4096` | Token massimi di output usati per i modelli scoperti (sovrascrivi se conosci i limiti del modello). |

  </Accordion>
</AccordionGroup>

## Configurazione rapida (percorso AWS)

Questa procedura dettagliata crea un ruolo IAM, associa le autorizzazioni Bedrock, associa
il profilo istanza e abilita la scoperta OpenClaw sull'host EC2.

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
  <Accordion title="Inference profiles">
    OpenClaw scopre i **profili di inferenza regionali e globali** insieme
    ai modelli foundation. Quando un profilo è mappato a un modello foundation noto, il
    profilo eredita le capacità di quel modello (finestra di contesto, token massimi,
    reasoning, visione) e la regione di richiesta Bedrock corretta viene iniettata
    automaticamente. Questo significa che i profili Claude cross-region funzionano senza
    override manuali del provider.

    Gli ID dei profili di inferenza hanno un formato come `us.anthropic.claude-opus-4-6-v1:0` (regionale)
    o `anthropic.claude-opus-4-6-v1:0` (globale). Se il modello sottostante è già
    nei risultati della scoperta, il profilo eredita l'intero set di capacità;
    altrimenti si applicano impostazioni predefinite sicure.

    Non è necessaria alcuna configurazione aggiuntiva. Finché la scoperta è abilitata e il principale IAM
    ha `bedrock:ListInferenceProfiles`, i profili vengono visualizzati insieme
    ai modelli foundation in `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Alcuni modelli Bedrock supportano un parametro `service_tier` per ottimizzare costi
    o latenza. Sono disponibili i seguenti livelli:

    | Livello | Descrizione |
    |------|-------------|
    | `default` | Livello Bedrock standard |
    | `flex` | Elaborazione scontata per carichi di lavoro che possono tollerare una latenza maggiore |
    | `priority` | Elaborazione prioritaria per carichi di lavoro sensibili alla latenza |
    | `reserved` | Capacità riservata per carichi di lavoro a stato stabile |

    Imposta `serviceTier` (o `service_tier`) tramite `agents.defaults.params` per
    le richieste ai modelli Bedrock, oppure per singolo modello in
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    I valori validi sono `default`, `flex`, `priority` e `reserved`. Non tutti
    i modelli supportano tutti i livelli: se viene richiesto un livello non supportato, Bedrock
    restituirà un errore di convalida. Nota: il messaggio di errore è in parte fuorviante;
    potrebbe dire "The provided model identifier is invalid" invece di indicare
    un livello di servizio non supportato. Se vedi questo errore, verifica se il modello
    supporta il livello richiesto.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock rifiuta il parametro `temperature` per Claude Opus 4.7. OpenClaw
    omette automaticamente `temperature` per qualsiasi riferimento Bedrock a Opus 4.7, inclusi
    gli ID dei modelli foundation, i profili di inferenza nominati, i profili di inferenza
    applicativi il cui modello sottostante si risolve in Opus 4.7 tramite
    `bedrock:GetInferenceProfile` e le varianti puntate `opus-4.7` con
    prefissi di regione opzionali (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Non è necessaria alcuna opzione di configurazione e l'omissione si applica sia
    all'oggetto delle opzioni di richiesta sia al campo del payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Usa `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1`, oppure gli
    ID di inferenza regionali come `us.anthropic.claude-fable-5`.
    OpenClaw applica la finestra di contesto da 1M di Fable, il limite di output
    da 128K, il pensiero adattivo sempre attivo e la mappatura dello sforzo
    supportata. `/think off` e `/think minimal` vengono mappati a `low`; i
    controlli non supportati per temperatura e scelta forzata degli strumenti
    vengono omessi. L'output in streaming viene trattenuto finché Bedrock non
    restituisce uno stato terminale, così i rifiuti a metà stream non espongono
    testo parziale. Fable supporta solo il livello di servizio standard; OpenClaw
    ignora i livelli configurati `flex`, `priority` e `reserved` per questo modello.

    AWS richiede un opt-in esplicito alla conservazione dei dati
    `provider_data_share` prima che Fable sia disponibile. Prompt e completamenti
    vengono condivisi con Anthropic e conservati fino a 30 giorni per fiducia e
    sicurezza. Esamina e configura la
    [conservazione dei dati di Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    prima di abilitare il modello.

  </Accordion>

  <Accordion title="Guardrails">
    Puoi applicare [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a tutte le invocazioni dei modelli Bedrock aggiungendo un oggetto `guardrail`
    alla configurazione del plugin `amazon-bedrock`. I Guardrails permettono di
    imporre filtri dei contenuti, diniego di argomenti, filtri di parole, filtri
    per informazioni sensibili e controlli di grounding contestuale.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opzione | Obbligatorio | Descrizione |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sì | ID del guardrail (ad es. `abc123`) o ARN completo (ad es. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sì | Numero di versione pubblicato, oppure `"DRAFT"` per la bozza di lavoro. |
    | `streamProcessingMode` | No | `"sync"` o `"async"` per la valutazione del guardrail durante lo streaming. Se omesso, Bedrock usa il valore predefinito. |
    | `trace` | No | `"enabled"` o `"enabled_full"` per il debug; ometti o imposta `"disabled"` per la produzione. |

    <Warning>
    Il principal IAM usato dal gateway deve avere l'autorizzazione `bedrock:ApplyGuardrail` oltre alle autorizzazioni di invocazione standard.
    </Warning>

  </Accordion>

  <Accordion title="Embedding per la ricerca in memoria">
    Bedrock può anche fungere da provider di embedding per la
    [ricerca in memoria](/it/concepts/memory-search). Questa configurazione è separata
    dal provider di inferenza: imposta `agents.defaults.memorySearch.provider` su `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Gli embedding Bedrock usano la stessa catena di credenziali dell'AWS SDK
    dell'inferenza (ruoli di istanza, SSO, chiavi di accesso, configurazione
    condivisa e identità web). Non è necessaria alcuna chiave API. Imposta
    esplicitamente `memorySearch.provider: "bedrock"` per usare gli embedding
    Bedrock.

    I modelli di embedding supportati includono Amazon Titan Embed (v1, v2),
    Amazon Nova Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulta il
    [riferimento alla configurazione della memoria: Bedrock](/it/reference/memory-config#bedrock-embedding-config)
    per l'elenco completo dei modelli e le opzioni di dimensione.

  </Accordion>

  <Accordion title="Note e avvertenze">
    - Bedrock richiede **l'accesso al modello** abilitato nel tuo account/regione AWS.
    - La scoperta automatica richiede le autorizzazioni `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se ti affidi alla modalità automatica, imposta uno dei marker env di autenticazione AWS supportati
      sull'host del gateway. Se preferisci l'autenticazione IMDS/configurazione condivisa senza marker env, imposta
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw espone l'origine delle credenziali in questo ordine: `AWS_BEARER_TOKEN_BEDROCK`,
      poi `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, poi `AWS_PROFILE`, poi la
      catena predefinita dell'AWS SDK.
    - Il supporto al ragionamento dipende dal modello; controlla la scheda del modello Bedrock per
      le capacità attuali.
    - Se preferisci un flusso di chiavi gestito, puoi anche posizionare un proxy
      compatibile con OpenAI davanti a Bedrock e configurarlo invece come provider OpenAI.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Ricerca in memoria" href="/it/concepts/memory-search" icon="magnifying-glass">
    Embedding Bedrock per la configurazione della ricerca in memoria.
  </Card>
  <Card title="Riferimento alla configurazione della memoria" href="/it/reference/memory-config#bedrock-embedding-config" icon="database">
    Elenco completo dei modelli di embedding Bedrock e opzioni di dimensione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
