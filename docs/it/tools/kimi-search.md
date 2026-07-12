---
read_when:
    - Vuoi usare Kimi per web_search
    - È necessaria una KIMI_API_KEY o una MOONSHOT_API_KEY
summary: Ricerca web Kimi tramite la ricerca web di Moonshot
title: Ricerca Kimi
x-i18n:
    generated_at: "2026-07-12T07:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi è un provider di `web_search` basato sulla ricerca web nativa di Moonshot. Moonshot
sintetizza un'unica risposta con citazioni in linea, analogamente ai provider
di risposte basate su fonti di Gemini e Grok, anziché restituire un elenco ordinato di risultati.

## Configurazione

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Salva la chiave">
    Imposta `KIMI_API_KEY` o `MOONSHOT_API_KEY` nell'ambiente del Gateway (per
    un'installazione del Gateway, aggiungila a `~/.openclaw/.env`) oppure esegui la configurazione tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

La scelta di **Kimi** durante `openclaw onboard` o `openclaw configure --section web`
richiede anche:

- la regione dell'API Moonshot: `https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`
- il modello di ricerca web (il valore predefinito è `kimi-k2.6`)

## Configurazione

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // facoltativa se è impostata KIMI_API_KEY o MOONSHOT_API_KEY
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

Quando `tools.web.search.provider` viene omesso, è rilevato automaticamente in base alle chiavi API disponibili;
impostalo esplicitamente su `kimi` se sono configurate più credenziali di ricerca.

È supportata anche la forma equivalente con ambito `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`);
entrambe le strutture vengono unite nella stessa configurazione risolta.

Valori predefiniti: se omesso, `baseUrl` è `https://api.moonshot.ai/v1`, mentre `model`
è `kimi-k2.6`.

Se il traffico della chat usa l'host cinese (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `web_search` di Kimi riutilizza automaticamente tale host
quando il proprio `baseUrl` non è impostato, evitando che le chiavi `.cn` accedano accidentalmente
all'endpoint internazionale, che restituisce HTTP 401 per tali chiavi. Imposta un
`baseUrl` esplicito per Kimi per ignorare questa ereditarietà.

## Requisito delle fonti

OpenClaw restituisce un risultato di `web_search` di Kimi solo dopo che la risposta di Moonshot
include prove native dell'uso della ricerca web, come la riproduzione di una chiamata allo strumento
`$web_search`, `search_results` o URL di citazioni. Se Kimi risponde direttamente senza
fonti (ad esempio «Non posso navigare in Internet»), OpenClaw restituisce un errore
`kimi_web_search_ungrounded` anziché trattare il testo come risultato di ricerca.
Riprova la query, passa a un provider strutturato come Brave oppure usa
`web_fetch` / lo strumento browser se disponi già di un URL di destinazione.

## Parametri dello strumento

| Parametro                                                       | Supportato                                                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Sì                                                                                                                                 |
| `count`                                                         | Accettato per la compatibilità tra provider, ma ignorato: Kimi restituisce sempre un'unica risposta sintetizzata, non un elenco di N risultati |
| `country`, `language`, `freshness`, `date_after`, `date_before` | No                                                                                                                                 |

## Pagine correlate

- [Panoramica della ricerca web](/it/tools/web) - tutti i provider e il rilevamento automatico
- [Moonshot AI](/it/providers/moonshot) - documentazione del modello Moonshot e del provider Kimi Coding
- [Ricerca Gemini](/it/tools/gemini-search) - risposte sintetizzate dall'IA basate sulle fonti di Google
- [Ricerca Grok](/it/tools/grok-search) - risposte sintetizzate dall'IA basate sulle fonti di xAI
