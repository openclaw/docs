---
read_when:
    - Vuoi utilizzare i modelli Amazon Bedrock con OpenClaw
    - È necessario configurare le credenziali AWS e la regione per le chiamate al modello
summary: Usa i modelli Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T07:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw può utilizzare i modelli **Amazon Bedrock** tramite il proprio provider di streaming **Bedrock Converse**. L'autenticazione Bedrock utilizza la **catena di credenziali predefinita dell'AWS SDK**, non una chiave API.

| Proprietà | Valore                                                              |
| --------- | ------------------------------------------------------------------- |
| Provider  | `amazon-bedrock`                                                    |
| API       | `bedrock-converse-stream`                                           |
| Autenticazione | Credenziali AWS (variabili di ambiente, configurazione condivisa o ruolo dell'istanza) |
| Regione   | `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinita: `us-east-1`)       |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Access keys / env vars">
    **Ideale per:** computer degli sviluppatori, CI o host in cui gestisci direttamente le credenziali AWS.

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
    Con l'autenticazione tramite indicatore di ambiente (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw abilita automaticamente il provider Bedrock implicito per il rilevamento dei modelli senza configurazione aggiuntiva.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Ideale per:** istanze EC2 con un ruolo IAM associato, che utilizzano il servizio di metadati dell'istanza per l'autenticazione.

    <Steps>
      <Step title="Enable discovery explicitly">
        Quando si utilizza IMDS, OpenClaw non può rilevare l'autenticazione AWS soltanto dagli indicatori di ambiente, pertanto devi abilitarla esplicitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Se desideri che funzioni anche il rilevamento automatico tramite indicatore di ambiente, ad esempio per le superfici di `openclaw status`:

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Non** è necessaria una chiave API fittizia.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Il ruolo IAM associato all'istanza EC2 deve disporre delle autorizzazioni seguenti:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (per il rilevamento automatico)
    - `bedrock:ListInferenceProfiles` (per il rilevamento dei profili di inferenza)

    In alternativa, associa la policy gestita `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` è necessario soltanto se desideri specificamente un indicatore di ambiente per la modalità automatica o per le superfici di stato. Il percorso effettivo di autenticazione del runtime Bedrock utilizza la catena predefinita dell'AWS SDK, quindi l'autenticazione tramite ruolo dell'istanza IMDS funziona anche senza indicatori di ambiente.
    </Note>

  </Tab>
</Tabs>

## Rilevamento automatico dei modelli

OpenClaw può rilevare automaticamente i modelli Bedrock che supportano lo **streaming**
e l'**output testuale**. Il rilevamento utilizza `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles` e i risultati vengono memorizzati nella cache (impostazione predefinita: 1 ora).

Modalità di abilitazione del provider implicito:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` è `true`,
  OpenClaw tenta il rilevamento anche quando non è presente alcun indicatore di ambiente AWS.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` non è impostato,
  OpenClaw aggiunge automaticamente il
  provider Bedrock implicito soltanto quando rileva uno dei seguenti indicatori di autenticazione AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oppure `AWS_PROFILE`.
- Il percorso effettivo di autenticazione del runtime Bedrock utilizza comunque la catena predefinita dell'AWS SDK, quindi
  la configurazione condivisa, SSO e l'autenticazione tramite ruolo dell'istanza IMDS possono funzionare anche quando per il rilevamento
  è stato necessario impostare `enabled: true`.

<Note>
Per le voci esplicite `models.providers["amazon-bedrock"]`, OpenClaw può comunque risolvere anticipatamente l'autenticazione Bedrock tramite indicatori di ambiente AWS come `AWS_BEARER_TOKEN_BEDROCK`, senza forzare il caricamento completo dell'autenticazione del runtime. Il percorso effettivo di autenticazione delle chiamate ai modelli utilizza comunque la catena predefinita dell'AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Le opzioni di configurazione si trovano in `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Opzione | Valore predefinito | Descrizione |
    | ------- | ------------------ | ----------- |
    | `enabled` | automatico | In modalità automatica, OpenClaw abilita il provider Bedrock implicito soltanto quando rileva un indicatore di ambiente AWS supportato. Imposta `true` per forzare il rilevamento. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Regione AWS utilizzata per le chiamate API di rilevamento. |
    | `providerFilter` | (tutti) | Corrisponde ai nomi dei provider Bedrock, ad esempio `anthropic` e `amazon`. |
    | `refreshInterval` | `3600` | Durata della cache in secondi. Imposta `0` per disabilitare la memorizzazione nella cache. |
    | `defaultContextWindow` | `32000` | Finestra di contesto utilizzata per i modelli rilevati privi di limiti di token noti; sostituisci il valore se conosci i limiti del modello. |
    | `defaultMaxTokens` | `4096` | Numero massimo di token di output utilizzato per i modelli rilevati privi di limiti di token noti; sostituisci il valore se conosci i limiti del modello. |

  </Accordion>

  <Accordion title="Context window and max-token limits">
    Le API Bedrock `ListFoundationModels` e `GetFoundationModel` non restituiscono
    metadati sui limiti di token, ma soltanto ID, nome, modalità e stato del ciclo di vita
    del modello. OpenClaw include una tabella di ricerca con le finestre di contesto e i limiti
    di output noti per i modelli Bedrock più diffusi (Claude, Nova, Llama, Mistral, DeepSeek
    e altri), affinché la gestione delle sessioni, le soglie di Compaction e
    il rilevamento del superamento del contesto funzionino correttamente per tali modelli.

    I modelli rilevati che non sono presenti nella tabella utilizzano come ripiego `defaultContextWindow`
    e `defaultMaxTokens`. Se un modello che utilizzi non dispone di limiti accurati,
    sostituiscili mediante una voce esplicita
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Configurazione rapida (percorso AWS)

Questa procedura guidata crea un ruolo IAM, associa le autorizzazioni Bedrock, collega
il profilo dell'istanza e abilita il rilevamento di OpenClaw sull'host EC2.

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
    OpenClaw rileva i **profili di inferenza regionali e globali** insieme
    ai modelli di base. Quando un profilo è associato a un modello di base noto,
    eredita le capacità del modello (finestra di contesto, token massimi,
    ragionamento, visione) e la regione corretta per le richieste Bedrock viene inserita
    automaticamente. Ciò consente ai profili Claude interregionali di funzionare senza
    sostituzioni manuali del provider. I profili interregionali globali (`global.*`) sono elencati
    per primi in `openclaw models list`, poiché generalmente offrono una capacità migliore
    e un failover automatico.

    Gli ID dei profili di inferenza hanno un aspetto simile a `us.anthropic.claude-opus-4-6-v1:0` (regionale)
    o `anthropic.claude-opus-4-6-v1:0` (globale). Se il modello sottostante è già
    presente nei risultati del rilevamento, il profilo ne eredita l'intero insieme di capacità;
    in caso contrario, vengono applicati valori predefiniti sicuri.

    Non è necessaria alcuna configurazione aggiuntiva. Finché il rilevamento è abilitato e il principal IAM
    dispone di `bedrock:ListInferenceProfiles`, i profili vengono visualizzati insieme
    ai modelli di base in `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Alcuni modelli Bedrock supportano un parametro `service_tier` per ottimizzare i costi
    o la latenza. Sono disponibili i livelli seguenti:

    | Livello | Descrizione |
    |---------|-------------|
    | `default` | Livello Bedrock standard |
    | `flex` | Elaborazione scontata per carichi di lavoro che possono tollerare una latenza maggiore |
    | `priority` | Elaborazione prioritaria per carichi di lavoro sensibili alla latenza |
    | `reserved` | Capacità riservata per carichi di lavoro stabili |

    Imposta `serviceTier` (o `service_tier`) tramite `agents.defaults.params` per
    le richieste ai modelli Bedrock oppure per singolo modello in
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

    I valori validi sono `default`, `flex`, `priority` e `reserved`. Claude
    Fable 5 e Sonnet 5 supportano solo il livello `default`; OpenClaw avvisa e
    ignora `flex`, `priority` o `reserved` richiesti per questi modelli. Per
    gli altri modelli, non tutti i modelli supportano ogni livello: un livello
    non supportato restituisce un errore di convalida di Bedrock e il messaggio
    di errore può essere fuorviante (ad esempio "The provided model identifier is invalid"
    anziché indicare il livello come causa del problema). Se viene visualizzato
    questo errore, verificare se il modello supporta il livello richiesto.

  </Accordion>

  <Accordion title="Temperatura di Claude Opus 4.7 e 4.8">
    Bedrock rifiuta il parametro `temperature` per Claude Opus 4.7 e Opus
    4.8. OpenClaw omette automaticamente `temperature` per qualsiasi riferimento
    Bedrock corrispondente, inclusi gli ID dei modelli di base, i profili di
    inferenza denominati, i profili di inferenza delle applicazioni il cui modello
    sottostante viene risolto in Opus 4.7/4.8 tramite `bedrock:GetInferenceProfile`
    e le varianti con punti `opus-4.7`/`opus-4.8` con prefissi di regione
    facoltativi (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`).
    Non è necessaria alcuna opzione di configurazione e l'omissione si applica sia
    all'oggetto delle opzioni della richiesta sia al campo `inferenceConfig` del payload.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Utilizzare `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1` oppure
    gli ID di inferenza regionali, come `us.anthropic.claude-fable-5`.
    OpenClaw applica la finestra di contesto da 1 milione di token di Fable, il
    limite di output di 128.000 token, il ragionamento adattivo sempre attivo e
    la mappatura dei livelli di impegno supportata. `/think off` e
    `/think minimal` vengono mappati a `low`; i controlli della temperatura e
    della scelta forzata degli strumenti vengono omessi, come nel percorso di
    Opus 4.7/4.8. L'output in streaming viene trattenuto finché Bedrock non
    restituisce uno stato terminale, affinché i rifiuti durante lo streaming
    non espongano testo parziale.

    AWS richiede un consenso esplicito alla conservazione dei dati tramite
    `provider_data_share` prima che Fable sia disponibile. I prompt e i
    completamenti vengono condivisi con Anthropic e conservati per un massimo
    di 30 giorni per finalità di affidabilità e sicurezza. Esaminare e configurare
    la [conservazione dei dati di Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    prima di abilitare il modello.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 è disponibile tramite Bedrock solo per gli account che
    dispongono della necessaria approvazione per l'accesso limitato. OpenClaw
    riconosce il modello di base `anthropic.claude-mythos-5` e i profili di
    inferenza regionali o globali, come `us.anthropic.claude-mythos-5`.

    OpenClaw applica la finestra di contesto da 1.000.000 di token, il limite
    di output di 128.000 token, l'input di immagini, la memorizzazione nella
    cache dei prompt, lo streaming protetto dai rifiuti e i livelli di impegno
    nativi. Il ragionamento adattivo è sempre abilitato: `/think off` e
    `/think minimal` vengono mappati a `low`, mentre `xhigh` e `max` restano
    disponibili. I valori personalizzati di campionamento e scelta forzata
    degli strumenti vengono omessi.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS documenta Sonnet 5 sia per gli endpoint
    [`bedrock-runtime` sia `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw riconosce il modello di base Bedrock
    `anthropic.claude-sonnet-5` e i profili di inferenza regionali o globali,
    come `us.anthropic.claude-sonnet-5`. Applica la finestra di contesto da
    1.000.000 di token, il limite di output di 128.000 token, l'input di immagini,
    i livelli di impegno nativi, la memorizzazione nella cache dei prompt e lo
    streaming protetto dai rifiuti.

    Bedrock mantiene abilitato il ragionamento adattivo per Sonnet 5. Il valore
    predefinito di OpenClaw è `high`; `/think off` e `/think minimal` vengono
    mappati a `low` perché questo percorso non può disabilitare il ragionamento.
    I valori personalizzati della temperatura e della scelta forzata degli
    strumenti vengono omessi mentre il ragionamento adattivo è attivo.

  </Accordion>

  <Accordion title="Misure di protezione">
    È possibile applicare le [misure di protezione di Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a tutte le invocazioni dei modelli Bedrock aggiungendo un oggetto `guardrail`
    alla configurazione del Plugin `amazon-bedrock`. Le misure di protezione
    consentono di applicare il filtraggio dei contenuti, il blocco degli argomenti,
    i filtri delle parole, i filtri delle informazioni sensibili e i controlli
    di ancoraggio contestuale.

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

    `guardrailIdentifier` e `guardrailVersion` sono obbligatori.

    | Opzione | Descrizione |
    | ------- | ----------- |
    | `guardrailIdentifier` | ID della misura di protezione (ad esempio `abc123`) o ARN completo (ad esempio `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Numero della versione pubblicata oppure `"DRAFT"` per la bozza di lavoro. |
    | `streamProcessingMode` | `"sync"` o `"async"` per la valutazione della misura di protezione durante lo streaming. Se omesso, Bedrock utilizza il proprio valore predefinito. |
    | `trace` | `"enabled"` o `"enabled_full"` per il debug; omettere o impostare `"disabled"` in produzione. |

    <Warning>
    L'identità IAM utilizzata dal Gateway deve disporre dell'autorizzazione `bedrock:ApplyGuardrail` oltre alle autorizzazioni standard di invocazione.
    </Warning>

  </Accordion>

  <Accordion title="Embedding per la ricerca nella memoria">
    Bedrock può anche fungere da fornitore di embedding per la
    [ricerca nella memoria](/it/concepts/memory-search). Questa funzionalità viene
    configurata separatamente dal fornitore di inferenza: impostare
    `agents.defaults.memorySearch.provider` su `"bedrock"`:

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

    Gli embedding di Bedrock utilizzano la stessa catena di credenziali AWS SDK
    dell'inferenza (ruoli delle istanze, SSO, chiavi di accesso, configurazione
    condivisa e identità web). Non è necessaria alcuna chiave API.

    I modelli di embedding supportati includono Amazon Titan Embed (v1, v2),
    Amazon Nova Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consultare
    [Riferimento per la configurazione della memoria — Bedrock](/it/reference/memory-config#bedrock-embedding-config)
    per l'elenco completo dei modelli e le opzioni relative alle dimensioni.

  </Accordion>

  <Accordion title="Note e avvertenze">
    - Bedrock richiede che l'**accesso al modello** sia abilitato nell'account o
      nella regione AWS.
    - Il rilevamento automatico richiede le autorizzazioni
      `bedrock:ListFoundationModels` e `bedrock:ListInferenceProfiles`.
    - Se si utilizza la modalità automatica, impostare uno degli indicatori delle
      variabili di ambiente per l'autenticazione AWS supportati sull'host del
      Gateway. Se si preferisce l'autenticazione IMDS o tramite configurazione
      condivisa senza indicatori nelle variabili di ambiente, impostare
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw mostra l'origine delle credenziali nel seguente ordine:
      `AWS_BEARER_TOKEN_BEDROCK`, quindi `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, poi `AWS_PROFILE` e infine la catena predefinita
      di AWS SDK.
    - Il supporto del ragionamento dipende dal modello; consultare la scheda del
      modello Bedrock per verificare le funzionalità attuali.
    - Se si preferisce un flusso gestito delle chiavi, è anche possibile
      posizionare un proxy compatibile con OpenAI davanti a Bedrock e
      configurarlo invece come fornitore OpenAI.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei fornitori, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Ricerca nella memoria" href="/it/concepts/memory-search" icon="magnifying-glass">
    Embedding Bedrock per la configurazione della ricerca nella memoria.
  </Card>
  <Card title="Riferimento per la configurazione della memoria" href="/it/reference/memory-config#bedrock-embedding-config" icon="database">
    Elenco completo dei modelli di embedding Bedrock e opzioni relative alle dimensioni.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
