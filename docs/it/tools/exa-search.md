---
read_when:
    - Vuoi usare Exa per web_search
    - Hai bisogno di `EXA_API_KEY`
    - Vuoi ricerca neurale o estrazione dei contenuti
summary: Ricerca AI Exa -- ricerca neurale e per parole chiave con estrazione dei contenuti
title: Ricerca Exa
x-i18n:
    generated_at: "2026-04-24T09:05:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw supporta [Exa AI](https://exa.ai/) come provider `web_search`. Exa
offre modalità di ricerca neurale, per parole chiave e ibride con estrazione dei contenuti integrata (highlights, testo, riepiloghi).

## Ottieni una chiave API

<Steps>
  <Step title="Crea un account">
    Registrati su [exa.ai](https://exa.ai/) e genera una chiave API dalla tua
    dashboard.
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `EXA_API_KEY` nell'ambiente del Gateway, oppure configura tramite:

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
            apiKey: "exa-...", // facoltativa se EXA_API_KEY è impostata
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

**Alternativa tramite ambiente:** imposta `EXA_API_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscila in `~/.openclaw/.env`.

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
Risultati dopo questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Risultati prima di questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opzioni di estrazione dei contenuti (vedi sotto).
</ParamField>

### Estrazione dei contenuti

Exa può restituire contenuto estratto insieme ai risultati della ricerca. Passa un oggetto `contents`
per abilitarlo:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // testo completo della pagina
    highlights: { numSentences: 3 }, // frasi chiave
    summary: true, // riepilogo AI
  },
});
```

| Opzione contents | Tipo                                                                  | Descrizione                 |
| ---------------- | --------------------------------------------------------------------- | --------------------------- |
| `text`           | `boolean \| { maxCharacters }`                                        | Estrae il testo completo della pagina |
| `highlights`     | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Estrae le frasi chiave      |
| `summary`        | `boolean \| { query }`                                                | Riepilogo generato dall'AI  |

### Modalità di ricerca

| Modalità         | Descrizione                            |
| ---------------- | -------------------------------------- |
| `auto`           | Exa sceglie la modalità migliore (predefinita) |
| `neural`         | Ricerca semantica/basata sul significato |
| `fast`           | Ricerca rapida per parole chiave       |
| `deep`           | Ricerca approfondita completa          |
| `deep-reasoning` | Ricerca approfondita con reasoning     |
| `instant`        | Risultati più rapidi                   |

## Note

- Se non viene fornita alcuna opzione `contents`, Exa usa per default `{ highlights: true }`
  così i risultati includono estratti di frasi chiave
- I risultati mantengono i campi `highlightScores` e `summary` dalla risposta API Exa quando disponibili
- Le descrizioni dei risultati vengono risolte prima dagli highlights, poi dal summary, poi dal testo completo — a seconda di ciò che è disponibile
- `freshness` e `date_after`/`date_before` non possono essere combinati — usa una sola modalità di filtro temporale
- Possono essere restituiti fino a 100 risultati per query (soggetti ai limiti
  del tipo di ricerca Exa)
- I risultati vengono messi in cache per 15 minuti per impostazione predefinita (configurabile tramite
  `cacheTtlMinutes`)
- Exa è un'integrazione API ufficiale con risposte JSON strutturate

## Correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con filtri paese/lingua
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro di dominio
