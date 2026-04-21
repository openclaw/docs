---
read_when:
    - Vuoi usare Kimi per `web_search`
    - Hai bisogno di un `KIMI_API_KEY` o `MOONSHOT_API_KEY`
summary: Ricerca web Kimi tramite la ricerca web Moonshot
title: Ricerca Kimi
x-i18n:
    generated_at: "2026-04-21T08:29:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Ricerca Kimi

OpenClaw supporta Kimi come provider `web_search`, usando la ricerca web Moonshot
per produrre risposte sintetizzate dall'IA con citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `KIMI_API_KEY` oppure `MOONSHOT_API_KEY` nell'ambiente del Gateway, oppure
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
- il modello predefinito di ricerca web Kimi, predefinito `kimi-k2.6`

## Configurazione

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // facoltativo se è impostato KIMI_API_KEY o MOONSHOT_API_KEY
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
`https://api.moonshot.cn/v1`), OpenClaw riusa lo stesso host anche per Kimi
`web_search` quando `tools.web.search.kimi.baseUrl` è omesso, così le chiavi da
[platform.moonshot.cn](https://platform.moonshot.cn/) non raggiungono per errore
l'endpoint internazionale, che spesso restituisce HTTP 401. Sostituiscilo con
`tools.web.search.kimi.baseUrl` quando ti serve un URL base diverso per la ricerca.

**Alternativa tramite ambiente:** imposta `KIMI_API_KEY` oppure `MOONSHOT_API_KEY` nell'ambiente
del Gateway. Per un'installazione Gateway, inseriscilo in `~/.openclaw/.env`.

Se ometti `baseUrl`, OpenClaw usa per impostazione predefinita `https://api.moonshot.ai/v1`.
Se ometti `model`, OpenClaw usa per impostazione predefinita `kimi-k2.6`.

## Come funziona

Kimi usa la ricerca web Moonshot per sintetizzare risposte con citazioni inline,
in modo simile all'approccio di risposta grounded di Gemini e Grok.

## Parametri supportati

La ricerca Kimi supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma Kimi
restituisce comunque una sola risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Moonshot AI](/it/providers/moonshot) -- documentazione del provider Moonshot model + Kimi Coding
- [Gemini Search](/it/tools/gemini-search) -- risposte sintetizzate dall'IA tramite grounding Google
- [Grok Search](/it/tools/grok-search) -- risposte sintetizzate dall'IA tramite grounding xAI
