---
read_when:
    - Vuoi configurare l'ID del provider qwen-oauth
    - Hai usato in precedenza le credenziali OAuth di Qwen Portal
    - Ti serve l'endpoint del portale Qwen o la guida alla migrazione
summary: Usa l'id del provider Qwen Portal con OpenClaw
title: Qwen OAuth / Portale
x-i18n:
    generated_at: "2026-06-27T18:09:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` è l'id provider di Qwen Portal. Punta all'endpoint Qwen Portal
e mantiene raggiungibili le configurazioni Qwen OAuth / portal meno recenti tramite un
id provider distinto.

Usa questo provider quando hai specificamente un token Qwen Portal corrente per
`https://portal.qwen.ai/v1`, oppure quando stai migrando una configurazione Qwen Portal /
Qwen CLI meno recente e vuoi mantenere quelle credenziali separate dal provider canonico
Qwen Cloud. Non è la prima scelta consigliata per i nuovi utenti Qwen.

Per le nuove configurazioni Qwen Cloud, preferisci [Qwen](/it/providers/qwen) con l'endpoint Standard
ModelStudio, a meno che tu non abbia specificamente un token Qwen Portal corrente.

## Configurazione

Fornisci il tuo token portal tramite l'onboarding:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Oppure imposta:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Valori predefiniti

- Provider: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL di base: `https://portal.qwen.ai/v1`
- Variabile d'ambiente: `QWEN_API_KEY`
- Stile API: compatibile con OpenAI
- Modello predefinito: `qwen-oauth/qwen3.5-plus`

## Differenze rispetto a Qwen

OpenClaw ha due id provider rivolti a Qwen:

| Provider     | Famiglia di endpoint                                      | Ideale per                                                                             |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Endpoint Qwen Cloud / Alibaba DashScope e Coding Plan    | Nuove configurazioni con chiave API, Standard pay-as-you-go, Coding Plan, funzionalità multimodali DashScope |
| `qwen-oauth` | Endpoint Qwen Portal su `portal.qwen.ai/v1`              | Token Qwen Portal esistenti e configurazioni Qwen OAuth / CLI legacy                   |

Entrambi i provider usano forme di richiesta compatibili con OpenAI, ma sono superfici
di autenticazione separate. Un token archiviato per `qwen-oauth` non deve essere trattato
come una chiave DashScope o ModelStudio, e una nuova chiave DashScope deve invece usare
il provider canonico `qwen`.

## Quando scegliere Qwen OAuth / Portal

- Hai già un token Qwen Portal funzionante.
- Stai preservando un flusso di lavoro Qwen OAuth o Qwen CLI legacy durante il passaggio al
  modello di provider di OpenClaw.
- Devi testare specificamente la compatibilità con l'endpoint Qwen Portal.

Scegli [Qwen](/it/providers/qwen) per una nuova configurazione, scelte di endpoint più ampie, Standard
ModelStudio, Coding Plan e il catalogo completo del plugin Qwen.

## Modelli

Il catalogo del plugin Qwen inizializza il valore predefinito di Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

La disponibilità dipende dall'account e dal token Qwen Portal correnti. Se il tuo
account usa invece chiavi API ModelStudio / DashScope, configura il provider canonico
`qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migrazione

I profili OAuth Qwen Portal legacy potrebbero non essere aggiornabili. Se un profilo portal
smette di funzionare, autenticati di nuovo con un token corrente oppure passa al provider
Qwen Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio globale Standard usa:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Risoluzione dei problemi

- Errori di aggiornamento di Portal OAuth: i profili OAuth Qwen Portal legacy potrebbero non essere
  aggiornabili. Esegui di nuovo l'onboarding con un token corrente.
- Errori di endpoint errato: verifica che il riferimento del modello inizi con `qwen-oauth/` quando
  usi un token portal. Usa riferimenti `qwen/` solo per il provider canonico Qwen.
- Confusione su `QWEN_API_KEY`: entrambe le pagine Qwen menzionano questa variabile d'ambiente, ma l'onboarding
  archivia le credenziali sotto l'id provider selezionato. Preferisci l'onboarding quando
  mantieni disponibili sia `qwen` sia `qwen-oauth` sulla stessa macchina.

## Correlati

- [Qwen](/it/providers/qwen)
- [Alibaba Model Studio](/it/providers/alibaba)
- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
