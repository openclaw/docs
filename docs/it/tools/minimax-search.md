---
read_when:
    - Vuoi usare MiniMax per web_search
    - È necessaria una chiave MiniMax Token Plan o un token OAuth
    - Vuoi indicazioni sull'host di ricerca CN/globale MiniMax
summary: MiniMax Search tramite l'API di ricerca di Token Plan
title: Ricerca MiniMax
x-i18n:
    generated_at: "2026-05-11T20:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw supporta MiniMax come provider `web_search` tramite l'API di ricerca MiniMax
Token Plan. Restituisce risultati di ricerca strutturati con titoli, URL,
frammenti e query correlate.

## Ottieni una credenziale Token Plan

<Steps>
  <Step title="Crea una chiave">
    Crea o copia una chiave MiniMax Token Plan da
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Le configurazioni OAuth possono invece riutilizzare `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Archivia la chiave">
    Imposta `MINIMAX_CODE_PLAN_KEY` nell'ambiente del Gateway oppure configura tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accetta anche `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` e
`MINIMAX_API_KEY` come alias env. `MINIMAX_API_KEY` deve puntare a una
credenziale Token Plan abilitata alla ricerca; le normali chiavi API per i modelli MiniMax potrebbero non
essere accettate dall'endpoint di ricerca Token Plan.

## Configurazione

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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
`MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscilo in `~/.openclaw/.env`.

## Selezione della regione

MiniMax Search usa questi endpoint:

- Globale: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` non è impostato, OpenClaw risolve
la regione in questo ordine:

1. `tools.web.search.minimax.region` / `webSearch.region` di proprietà del plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Ciò significa che l'onboarding CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
mantiene automaticamente anche MiniMax Search sull'host CN.

Anche quando hai autenticato MiniMax tramite il percorso OAuth `minimax-portal`,
la ricerca web viene comunque registrata con l'ID provider `minimax`; l'URL di base del provider OAuth
viene usato come indicazione della regione per la selezione dell'host CN/globale e `MINIMAX_OAUTH_TOKEN`
può soddisfare la credenziale bearer di MiniMax Search.

## Parametri supportati

| Parametro | Tipo    | Vincoli | Descrizione                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | required    | Stringa della query di ricerca.                                                        |
| `count`   | integer | 1-10        | Numero di risultati da restituire. OpenClaw riduce l'elenco restituito a questa dimensione. |

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [MiniMax](/it/providers/minimax) -- configurazione di modello, immagine, voce e autenticazione
