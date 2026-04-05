---
read_when:
    - Vuoi usare i modelli Amazon Bedrock con OpenClaw
    - Hai bisogno della configurazione delle credenziali AWS/regione per le chiamate ai modelli
summary: Usa i modelli Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T14:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw può usare i modelli **Amazon Bedrock** tramite il provider di streaming **Bedrock Converse**
di pi‑ai. L'autenticazione Bedrock usa la **catena di credenziali predefinita dell'SDK AWS**,
non una chiave API.

## Cosa supporta pi-ai

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: credenziali AWS (variabili env, configurazione condivisa o ruolo dell'istanza)
- Regione: `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinita: `us-east-1`)

## Rilevamento automatico dei modelli

OpenClaw può rilevare automaticamente i modelli Bedrock che supportano **streaming**
e **output testuale**. Il rilevamento usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e i risultati vengono memorizzati nella cache (predefinita: 1 ora).

Come viene abilitato il provider implicito:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` è `true`,
  OpenClaw tenterà il rilevamento anche quando non è presente alcun marker env AWS.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` non è impostato,
  OpenClaw aggiunge automaticamente il provider
  Bedrock implicito solo quando vede uno di questi marker di autenticazione AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, oppure `AWS_PROFILE`.
- Il percorso auth runtime effettivo di Bedrock continua comunque a usare la catena predefinita dell'SDK AWS, quindi
  la configurazione condivisa, SSO e l'autenticazione IMDS con ruolo dell'istanza possono funzionare anche quando il rilevamento
  ha avuto bisogno di `enabled: true` per l'opt-in.

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

Note:

- `enabled` usa per impostazione predefinita la modalità automatica. In modalità automatica, OpenClaw abilita il
  provider Bedrock implicito solo quando vede un marker env AWS supportato.
- `region` usa per impostazione predefinita `AWS_REGION` o `AWS_DEFAULT_REGION`, poi `us-east-1`.
- `providerFilter` corrisponde ai nomi dei provider Bedrock (ad esempio `anthropic`).
- `refreshInterval` è espresso in secondi; impostalo a `0` per disabilitare la cache.
- `defaultContextWindow` (predefinito: `32000`) e `defaultMaxTokens` (predefinito: `4096`)
  vengono usati per i modelli rilevati (sovrascrivili se conosci i limiti del tuo modello).
- Per voci esplicite `models.providers["amazon-bedrock"]`, OpenClaw può comunque
  risolvere anticipatamente l'autenticazione Bedrock basata su env-marker da marker env AWS come
  `AWS_BEARER_TOKEN_BEDROCK` senza forzare il caricamento completo dell'autenticazione runtime. Il
  percorso auth effettivo per le chiamate al modello continua però a usare la catena predefinita dell'SDK AWS.

## Onboarding

1. Assicurati che le credenziali AWS siano disponibili sull'**host gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Aggiungi un provider e un modello Bedrock alla tua configurazione (non è richiesto `apiKey`):

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

## Ruoli istanza EC2

Quando OpenClaw viene eseguito su un'istanza EC2 con un ruolo IAM associato, l'SDK AWS
può usare l'instance metadata service (IMDS) per l'autenticazione. Per il rilevamento dei modelli
Bedrock, OpenClaw abilita automaticamente il provider implicito solo a partire dai marker env AWS
a meno che tu non imposti esplicitamente
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configurazione consigliata per host supportati da IMDS:

- Imposta `plugins.entries.amazon-bedrock.config.discovery.enabled` su `true`.
- Imposta `plugins.entries.amazon-bedrock.config.discovery.region` (oppure esporta `AWS_REGION`).
- **Non** hai bisogno di una chiave API fittizia.
- Ti serve `AWS_PROFILE=default` solo se vuoi specificamente un marker env
  per la modalità automatica o per le superfici di stato.

```bash
# Recommended: explicit discovery enable + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: add an env marker if you want auto mode without explicit enable
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permessi IAM richiesti** per il ruolo dell'istanza EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (per il rilevamento automatico)
- `bedrock:ListInferenceProfiles` (per il rilevamento dei profili di inferenza)

Oppure associa la policy gestita `AmazonBedrockFullAccess`.

## Configurazione rapida (percorso AWS)

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

## Profili di inferenza

OpenClaw rileva **profili di inferenza regionali e globali** insieme ai
foundation model. Quando un profilo corrisponde a un foundation model noto, il
profilo eredita le capacità di quel modello (finestra di contesto, token massimi,
ragionamento, visione) e viene iniettata automaticamente la corretta regione Bedrock della richiesta.
Questo significa che i profili Claude cross-region funzionano senza override manuali del provider.

Gli ID dei profili di inferenza hanno questo aspetto: `us.anthropic.claude-opus-4-6-v1:0` (regionali)
oppure `anthropic.claude-opus-4-6-v1:0` (globali). Se il modello sottostante è già
nei risultati del rilevamento, il profilo eredita il suo set completo di capacità;
altrimenti vengono applicati valori predefiniti sicuri.

Non è necessaria alcuna configurazione aggiuntiva. Finché il rilevamento è abilitato e il principal IAM
ha `bedrock:ListInferenceProfiles`, i profili compaiono insieme ai
foundation model in `openclaw models list`.

## Note

- Bedrock richiede che l'**accesso al modello** sia abilitato nel tuo account/regione AWS.
- Il rilevamento automatico richiede i permessi `bedrock:ListFoundationModels` e
  `bedrock:ListInferenceProfiles`.
- Se fai affidamento sulla modalità automatica, imposta uno dei marker env di autenticazione AWS supportati sull'
  host gateway. Se preferisci l'autenticazione IMDS/shared-config senza marker env, imposta
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw espone la sorgente delle credenziali in questo ordine: `AWS_BEARER_TOKEN_BEDROCK`,
  poi `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, poi `AWS_PROFILE`, poi la
  catena predefinita dell'SDK AWS.
- Il supporto al ragionamento dipende dal modello; controlla la scheda del modello Bedrock per
  le capacità correnti.
- Se preferisci un flusso con chiave gestita, puoi anche mettere un proxy
  compatibile con OpenAI davanti a Bedrock e configurarlo invece come provider OpenAI.

## Guardrail

Puoi applicare [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
a tutte le invocazioni di modelli Bedrock aggiungendo un oggetto `guardrail` alla
configurazione del plugin `amazon-bedrock`. I Guardrail consentono di imporre il filtraggio dei contenuti,
il rifiuto di argomenti, filtri sulle parole, filtri per informazioni sensibili e controlli di
grounding contestuale.

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

- `guardrailIdentifier` (obbligatorio) accetta un ID guardrail (ad esempio `abc123`) oppure un
  ARN completo (ad esempio `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (obbligatorio) specifica quale versione pubblicata usare, oppure
  `"DRAFT"` per la bozza di lavoro.
- `streamProcessingMode` (opzionale) controlla se la valutazione del guardrail viene eseguita
  in modo sincrono (`"sync"`) o asincrono (`"async"`) durante lo streaming. Se
  omesso, Bedrock usa il proprio comportamento predefinito.
- `trace` (opzionale) abilita l'output di trace del guardrail nella risposta API. Impostalo su
  `"enabled"` o `"enabled_full"` per il debug; omettilo oppure impostalo su `"disabled"` per
  la produzione.

Il principal IAM usato dal gateway deve avere il permesso `bedrock:ApplyGuardrail`
oltre ai permessi standard di invocazione.
