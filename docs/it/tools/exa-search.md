---
read_when:
    - Vuoi usare Exa per web_search
    - È necessaria una EXA_API_KEY
    - Vuoi la ricerca neurale o l’estrazione di contenuti
summary: Ricerca Exa AI -- ricerca neurale e per parole chiave con estrazione dei contenuti
title: Ricerca Exa
x-i18n:
    generated_at: "2026-06-27T18:19:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw supporta [Exa AI](https://exa.ai/) come provider `web_search`. Exa
offre modalità di ricerca neurale, per parole chiave e ibrida con estrazione
dei contenuti integrata (evidenziazioni, testo, riepiloghi).

## Installa Plugin

Installa il Plugin ufficiale, poi riavvia Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Ottieni una chiave API

<Steps>
  <Step title="Crea un account">
    Registrati su [exa.ai](https://exa.ai/) e genera una chiave API dalla tua
    dashboard.
  </Step>
  <Step title="Archivia la chiave">
    Imposta `EXA_API_KEY` nell'ambiente Gateway, oppure configura tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configurazione

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternativa di ambiente:** imposta `EXA_API_KEY` nell'ambiente Gateway.
Per un'installazione gateway, inseriscilo in `~/.openclaw/.env`.

## Override dell'URL di base

Imposta `plugins.entries.exa.config.webSearch.baseUrl` quando le richieste di
ricerca Exa devono passare attraverso un proxy compatibile o un endpoint Exa
alternativo. OpenClaw normalizza gli host semplici anteponendo `https://` e
aggiunge `/search` a meno che il percorso non termini già così. L'endpoint
risolto è incluso nella chiave della cache di ricerca, quindi i risultati da
endpoint Exa diversi non vengono condivisi.

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number">
Risultati da restituire (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modalità di ricerca.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale.
</ParamField>

<ParamField path="date_after" type="string">
Risultati successivi a questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Risultati precedenti a questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opzioni di estrazione dei contenuti (vedi sotto).
</ParamField>

### Estrazione dei contenuti

Exa può restituire contenuti estratti insieme ai risultati di ricerca. Passa un
oggetto `contents` per abilitarla:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Opzione Contents | Tipo                                                                  | Descrizione                         |
| ---------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `text`           | `boolean \| { maxCharacters }`                                        | Estrai il testo completo della pagina |
| `highlights`     | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Estrai frasi chiave                 |
| `summary`        | `boolean \| { query }`                                                | Riepilogo generato dall'IA          |

### Modalità di ricerca

| Modalità         | Descrizione                                  |
| ---------------- | -------------------------------------------- |
| `auto`           | Exa sceglie la modalità migliore (predefinita) |
| `neural`         | Ricerca semantica/basata sul significato     |
| `fast`           | Ricerca rapida per parole chiave             |
| `deep`           | Ricerca approfondita                         |
| `deep-reasoning` | Ricerca approfondita con ragionamento        |
| `instant`        | Risultati più rapidi                         |

## Note

- Se non viene fornita alcuna opzione `contents`, Exa usa per impostazione
  predefinita `{ highlights: true }`, quindi i risultati includono estratti di
  frasi chiave
- I risultati preservano i campi `highlightScores` e `summary` dalla risposta
  dell'API Exa quando disponibili
- Le descrizioni dei risultati vengono risolte prima dalle evidenziazioni, poi
  dal riepilogo, poi dal testo completo — a seconda di ciò che è disponibile
- `freshness` e `date_after`/`date_before` non possono essere combinati — usa
  una sola modalità di filtro temporale
- Possono essere restituiti fino a 100 risultati per query (soggetto ai limiti
  del tipo di ricerca Exa)
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione
  predefinita (configurabile tramite `cacheTtlMinutes`)
- Exa è un'integrazione API ufficiale con risposte JSON strutturate

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con filtri paese/lingua
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro per dominio
