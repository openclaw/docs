---
read_when:
    - Vuoi usare Kimi per `web_search`
    - Hai bisogno di un `KIMI_API_KEY` o `MOONSHOT_API_KEY`
summary: Ricerca web di Kimi tramite la ricerca web di Moonshot
title: Ricerca Kimi
x-i18n:
    generated_at: "2026-04-05T14:06:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Ricerca Kimi

OpenClaw supporta Kimi come provider `web_search`, usando la ricerca web di Moonshot
per produrre risposte sintetizzate dall'IA con citazioni.

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

Quando scegli **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw può anche chiedere:

- la regione API di Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- il modello predefinito di ricerca web Kimi (predefinito: `kimi-k2.5`)

## Configurazione

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
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

Se usi l'host API cinese per la chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw riutilizza lo stesso host anche per `web_search`
di Kimi quando `tools.web.search.kimi.baseUrl` viene omesso, così le chiavi di
[platform.moonshot.cn](https://platform.moonshot.cn/) non finiscono per errore
sull'endpoint internazionale (che spesso restituisce HTTP 401). Sovrascrivi
con `tools.web.search.kimi.baseUrl` quando ti serve un URL base di ricerca diverso.

**Alternativa con variabile d'ambiente:** imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'
ambiente del Gateway. Per un'installazione del gateway, inseriscilo in `~/.openclaw/.env`.

Se ometti `baseUrl`, OpenClaw usa per impostazione predefinita `https://api.moonshot.ai/v1`.
Se ometti `model`, OpenClaw usa per impostazione predefinita `kimi-k2.5`.

## Come funziona

Kimi usa la ricerca web di Moonshot per sintetizzare risposte con citazioni inline,
in modo simile all'approccio con risposte basate su grounding di Gemini e Grok.

## Parametri supportati

La ricerca Kimi supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma Kimi restituisce comunque
una risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica di Ricerca Web](/tools/web) -- tutti i provider e il rilevamento automatico
- [Moonshot AI](/it/providers/moonshot) -- documentazione del provider di modelli Moonshot + Kimi Coding
- [Ricerca Gemini](/tools/gemini-search) -- risposte sintetizzate dall'IA tramite grounding Google
- [Ricerca Grok](/tools/grok-search) -- risposte sintetizzate dall'IA tramite grounding xAI
