---
read_when:
    - Vuoi usare MiniMax per `web_search`
    - Hai bisogno di una chiave MiniMax Coding Plan
    - Vuoi indicazioni sull'host di ricerca MiniMax CN/global
summary: Ricerca MiniMax tramite l'API di ricerca Coding Plan
title: Ricerca MiniMax
x-i18n:
    generated_at: "2026-04-05T14:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# Ricerca MiniMax

OpenClaw supporta MiniMax come provider `web_search` tramite l'API di ricerca MiniMax
Coding Plan. Restituisce risultati di ricerca strutturati con titoli, URL,
snippet e query correlate.

## Ottieni una chiave Coding Plan

<Steps>
  <Step title="Crea una chiave">
    Crea o copia una chiave MiniMax Coding Plan da
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `MINIMAX_CODE_PLAN_KEY` nell'ambiente del Gateway, oppure configura tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accetta anche `MINIMAX_CODING_API_KEY` come alias env. `MINIMAX_API_KEY`
continua a essere letto come fallback di compatibilità quando punta già a un token coding-plan.

## Configurazione

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // facoltativo se MINIMAX_CODE_PLAN_KEY è impostato
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

**Alternativa tramite variabile d'ambiente:** imposta `MINIMAX_CODE_PLAN_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscilo in `~/.openclaw/.env`.

## Selezione della regione

MiniMax Search usa questi endpoint:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` non è impostato, OpenClaw risolve
la regione in questo ordine:

1. `tools.web.search.minimax.region` / `webSearch.region` del plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Questo significa che l'onboarding CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
mantiene automaticamente anche MiniMax Search sull'host CN.

Anche quando hai autenticato MiniMax tramite il percorso OAuth `minimax-portal`,
la ricerca web continua comunque a registrarsi come provider con id `minimax`; l'URL di base del provider OAuth
viene usato solo come suggerimento di regione per la selezione dell'host CN/global.

## Parametri supportati

MiniMax Search supporta:

- `query`
- `count` (OpenClaw riduce l'elenco dei risultati restituiti al conteggio richiesto)

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica di Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [MiniMax](/it/providers/minimax) -- configurazione di modelli, immagini, voce e auth
