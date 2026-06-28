---
read_when:
    - Vuoi usare Kimi per web_search
    - È necessaria una KIMI_API_KEY o una MOONSHOT_API_KEY
summary: Ricerca web Kimi tramite ricerca web Moonshot
title: Ricerca Kimi
x-i18n:
    generated_at: "2026-05-02T08:36:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw supporta Kimi come provider `web_search`, usando la ricerca web di Moonshot
per produrre risposte sintetizzate dall'AI con citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'ambiente Gateway, oppure
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
- il modello predefinito di ricerca web Kimi (predefinito: `kimi-k2.6`)

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

Se usi l'host API cinese per la chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw riutilizza lo stesso host per Kimi
`web_search` quando `tools.web.search.kimi.baseUrl` viene omesso, quindi le chiavi da
[platform.moonshot.cn](https://platform.moonshot.cn/) non raggiungono per errore
l'endpoint internazionale (che spesso restituisce HTTP 401). Esegui l'override
con `tools.web.search.kimi.baseUrl` quando hai bisogno di un URL di base di ricerca diverso.

**Alternativa con variabile d'ambiente:** imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'ambiente
Gateway. Per un'installazione Gateway, inseriscila in `~/.openclaw/.env`.

Se ometti `baseUrl`, OpenClaw usa come valore predefinito `https://api.moonshot.ai/v1`.
Se ometti `model`, OpenClaw usa come valore predefinito `kimi-k2.6`.

## Come funziona

Kimi usa la ricerca web di Moonshot per sintetizzare risposte con citazioni inline,
in modo simile all'approccio di risposta ancorata di Gemini e Grok.

OpenClaw considera Kimi `web_search` riuscito solo dopo che Moonshot restituisce
prove native di grounding della ricerca web, come un payload dello strumento `$web_search`
rieseguibile, `search_results` o URL di citazione. Se Kimi si interrompe immediatamente con una
semplice risposta di chat come "Non posso navigare in internet" e senza prove di grounding,
OpenClaw restituisce invece un errore strutturato `kimi_web_search_ungrounded`, anziché
racchiudere quel testo come risultato di ricerca. Riprova la query, passa a un provider strutturato
come Brave oppure usa `web_fetch` / lo strumento browser quando hai già
un URL di destinazione.

## Parametri supportati

La ricerca Kimi supporta `query`.

`count` è accettato per la compatibilità condivisa di `web_search`, ma Kimi restituisce comunque
una sola risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Moonshot AI](/it/providers/moonshot) -- documentazione del provider di modelli Moonshot + Kimi Coding
- [Ricerca Gemini](/it/tools/gemini-search) -- risposte sintetizzate dall'AI tramite grounding Google
- [Ricerca Grok](/it/tools/grok-search) -- risposte sintetizzate dall'AI tramite grounding xAI
