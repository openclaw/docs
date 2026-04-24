---
read_when:
    - Vuoi usare Kimi per `web_search`
    - Ti serve un `KIMI_API_KEY` o `MOONSHOT_API_KEY`
summary: Ricerca web Kimi tramite ricerca web Moonshot
title: Ricerca Kimi
x-i18n:
    generated_at: "2026-04-24T09:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw supporta Kimi come provider `web_search`, usando la ricerca web Moonshot
per produrre risposte sintetizzate dall'AI con citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'ambiente del Gateway, oppure
    configura tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Quando scegli **Kimi** durante `openclaw onboard` oppure
`openclaw configure --section web`, OpenClaw può anche chiedere:

- la regione API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- il modello predefinito di ricerca web Kimi (predefinito `kimi-k2.6`)

## Configurazione

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // facoltativo se KIMI_API_KEY o MOONSHOT_API_KEY è impostato
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Se usi l'host API Cina per la chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw riusa lo stesso host per Kimi
`web_search` quando `tools.web.search.kimi.baseUrl` viene omesso, così le chiavi di
[platform.moonshot.cn](https://platform.moonshot.cn/) non colpiscono per errore
l'endpoint internazionale (che spesso restituisce HTTP 401). Esegui l'override
con `tools.web.search.kimi.baseUrl` quando ti serve un base URL di ricerca diverso.

**Alternativa tramite ambiente:** imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'
ambiente del Gateway. Per un'installazione gateway, inseriscilo in `~/.openclaw/.env`.

Se ometti `baseUrl`, OpenClaw usa come predefinito `https://api.moonshot.ai/v1`.
Se ometti `model`, OpenClaw usa come predefinito `kimi-k2.6`.

## Come funziona

Kimi usa la ricerca web Moonshot per sintetizzare risposte con citazioni inline,
simile all'approccio di risposta grounding di Gemini e Grok.

## Parametri supportati

La ricerca Kimi supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma Kimi
restituisce comunque una sola risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider al momento non sono supportati.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e auto-rilevamento
- [Moonshot AI](/it/providers/moonshot) -- documentazione del provider Moonshot model + Kimi Coding
- [Gemini Search](/it/tools/gemini-search) -- risposte sintetizzate dall'AI tramite grounding Google
- [Grok Search](/it/tools/grok-search) -- risposte sintetizzate dall'AI tramite grounding xAI
