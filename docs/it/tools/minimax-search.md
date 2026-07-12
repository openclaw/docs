---
read_when:
    - Vuoi usare MiniMax per `web_search`
    - È necessaria una chiave MiniMax Token Plan o un token OAuth
    - Vuoi indicazioni sull'host di ricerca MiniMax per la Cina o a livello globale
summary: Ricerca MiniMax tramite l'API di ricerca del piano Token
title: Ricerca MiniMax
x-i18n:
    generated_at: "2026-07-12T07:34:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw supporta MiniMax come provider `web_search` tramite l'API di ricerca del Token Plan di MiniMax. Restituisce risultati di ricerca strutturati con titoli, URL, estratti e query correlate.

## Ottenere una credenziale Token Plan

<Steps>
  <Step title="Creare una chiave">
    Crea o copia una chiave MiniMax Token Plan dalla
    [piattaforma MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Le configurazioni OAuth possono invece riutilizzare `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Archiviare la chiave">
    Imposta `MINIMAX_CODE_PLAN_KEY` nell'ambiente del Gateway oppure esegui la configurazione tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accetta anche `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` e
`MINIMAX_API_KEY` come alias di variabili d'ambiente, verificati in quest'ordine dopo
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` deve fare riferimento a una credenziale
Token Plan abilitata per la ricerca; le normali chiavi API dei modelli MiniMax potrebbero
non essere accettate dall'endpoint di ricerca del Token Plan.

## Configurazione

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // facoltativo se è impostata una variabile d'ambiente MiniMax Token Plan
            region: "global", // oppure "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternativa tramite ambiente:** imposta `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` oppure `MINIMAX_API_KEY` nell'ambiente del Gateway.
Per un'installazione del Gateway, inseriscila in `~/.openclaw/.env`.

## Selezione della regione

La ricerca MiniMax utilizza questi endpoint:

- Globale: `https://api.minimax.io/v1/coding_plan/search`
- Cina: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` non è impostato, OpenClaw determina
la regione nel seguente ordine:

1. `tools.web.search.minimax.region` / `webSearch.region` di proprietà del plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Ciò significa che l'onboarding per la Cina o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
mantengono automaticamente anche la ricerca MiniMax sull'host cinese.

Anche quando hai autenticato MiniMax tramite il percorso OAuth `minimax-portal`,
la ricerca web viene comunque registrata con l'ID provider `minimax`; l'URL di base
del provider OAuth viene utilizzato come indicazione della regione per selezionare
l'host cinese o globale e `MINIMAX_OAUTH_TOKEN` può fornire la credenziale bearer
per la ricerca MiniMax.

## Parametri supportati

| Parametro | Tipo    | Vincoli                    | Descrizione                                                                    |
| --------- | ------- | -------------------------- | ------------------------------------------------------------------------------ |
| `query`   | stringa | obbligatorio               | Stringa della query di ricerca.                                                |
| `count`   | intero  | 1-10, valore predefinito 5 | Numero di risultati da restituire. OpenClaw limita l'elenco restituito a questa dimensione. |

I filtri specifici del provider non sono attualmente supportati.

## Risorse correlate

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [MiniMax](/it/providers/minimax) -- configurazione di modelli, immagini, sintesi vocale e autenticazione
