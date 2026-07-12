---
read_when:
    - Vuoi configurare l'ID del provider qwen-oauth
    - In precedenza hai utilizzato le credenziali OAuth di Qwen Portal
    - Ti servono l'endpoint di Qwen Portal o le indicazioni per la migrazione
summary: Usa l'ID del provider Qwen Portal con OpenClaw
title: OAuth / Portale Qwen
x-i18n:
    generated_at: "2026-07-12T07:28:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` è l'id del provider Qwen Portal, registrato dal plugin Qwen
(`@openclaw/qwen-provider`). Utilizza l'endpoint Qwen Portal all'indirizzo
`https://portal.qwen.ai/v1` e mantiene accessibili le configurazioni precedenti di Qwen OAuth / Portal
tramite un id provider distinto, separato dal provider canonico `qwen`.

Scegli `qwen-oauth` se disponi già di un token Qwen Portal funzionante, se stai
migrando un flusso di lavoro precedente basato su Qwen OAuth o Qwen CLI oppure se devi testare
specificamente l'endpoint Qwen Portal. Per le nuove configurazioni, preferisci
[Qwen](/it/providers/qwen) con l'endpoint Standard ModelStudio: supporta le nuove
configurazioni con chiave API, una scelta più ampia di endpoint, Standard con pagamento in base al consumo, Coding Plan
e il catalogo completo del plugin Qwen.

## Configurazione

Installa il plugin Qwen, se non lo hai già fatto:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Fornisci il token del portale tramite la procedura di configurazione iniziale:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Le esecuzioni non interattive leggono il token da `--qwen-oauth-token <token>`; in alternativa, imposta:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

La configurazione iniziale memorizza il token in un profilo di autenticazione `qwen-oauth`, inizializza il catalogo
dei modelli del portale e imposta `qwen-oauth/qwen3.5-plus` come modello predefinito quando
non ne è configurato alcuno.

## Valori predefiniti

- Provider: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL di base: `https://portal.qwen.ai/v1`
- Variabile di ambiente: `QWEN_API_KEY`
- Stile API: compatibile con OpenAI
- Modello predefinito: `qwen-oauth/qwen3.5-plus`

## Differenze rispetto a Qwen

OpenClaw dispone di due id provider destinati a Qwen:

| Provider     | Famiglia di endpoint                                      | Ideale per                                                                                         |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `qwen`       | Endpoint Qwen Cloud / Alibaba DashScope e Coding Plan    | Nuove configurazioni con chiave API, Standard con pagamento in base al consumo, Coding Plan, funzionalità multimodali di DashScope |
| `qwen-oauth` | Endpoint Qwen Portal all'indirizzo `portal.qwen.ai/v1`   | Token Qwen Portal esistenti e configurazioni precedenti di Qwen OAuth / CLI                        |

Entrambi i provider utilizzano formati di richiesta compatibili con OpenAI, ma costituiscono superfici di
autenticazione separate. Un token memorizzato per `qwen-oauth` non deve essere trattato come una chiave DashScope
o ModelStudio; una nuova chiave DashScope deve invece utilizzare il provider canonico `qwen`.

## Modelli

Il plugin Qwen inizializza questo catalogo statico per l'endpoint Qwen Portal. Tutte
le voci prevedono un output massimo di 65.536 token; la disponibilità dipende dall'account e dal token
Qwen Portal correnti.

| Riferimento modello                | Input        | Contesto  | Note                |
| --------------------------------- | ------------ | --------- | ------------------- |
| `qwen-oauth/qwen3.5-plus`         | testo, immagine | 1,000,000 | Modello predefinito |
| `qwen-oauth/qwen3.6-plus`         | testo, immagine | 1,000,000 |                     |
| `qwen-oauth/qwen3-max-2026-01-23` | testo        | 262,144   |                     |
| `qwen-oauth/qwen3-coder-next`     | testo        | 262,144   |                     |
| `qwen-oauth/qwen3-coder-plus`     | testo        | 1,000,000 |                     |
| `qwen-oauth/MiniMax-M2.5`         | testo        | 1,000,000 | Ragionamento        |
| `qwen-oauth/glm-5`                | testo        | 202,752   |                     |
| `qwen-oauth/glm-4.7`              | testo        | 202,752   |                     |
| `qwen-oauth/kimi-k2.5`            | testo, immagine | 262,144   |                     |

Se il tuo account utilizza invece chiavi API ModelStudio / DashScope, configura il
provider canonico `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migrazione

I profili OAuth precedenti di Qwen Portal non possono essere aggiornati; `openclaw doctor` li
segnala. Se un profilo del portale smette di funzionare, esegui nuovamente la configurazione iniziale con un token corrente
oppure passa al provider Qwen Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio Standard globale utilizza:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Risoluzione dei problemi

- Errori di aggiornamento OAuth del portale: i profili OAuth precedenti di Qwen Portal non possono essere
  aggiornati. Esegui nuovamente la configurazione iniziale con un token corrente.
- Errori relativi a un endpoint errato: verifica che il riferimento del modello inizi con `qwen-oauth/` quando
  utilizzi un token del portale. Usa riferimenti `qwen/` solo per il provider canonico Qwen.
- Ambiguità relativa a `QWEN_API_KEY`: entrambe le pagine di Qwen menzionano questa variabile di ambiente, ma la configurazione iniziale
  memorizza le credenziali con l'id del provider selezionato. Preferisci la configurazione iniziale quando
  mantieni disponibili sia `qwen` sia `qwen-oauth` sullo stesso computer.

## Contenuti correlati

- [Qwen](/it/providers/qwen)
- [Alibaba Model Studio](/it/providers/alibaba)
- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
