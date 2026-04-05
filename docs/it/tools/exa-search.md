---
read_when:
    - Vuoi usare Exa per `web_search`
    - Hai bisogno di una `EXA_API_KEY`
    - Vuoi la ricerca neurale o l'estrazione dei contenuti
summary: Ricerca Exa AI -- ricerca neurale e per parole chiave con estrazione dei contenuti
title: Ricerca Exa
x-i18n:
    generated_at: "2026-04-05T14:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Ricerca Exa

OpenClaw supporta [Exa AI](https://exa.ai/) come provider `web_search`. Exa
offre modalità di ricerca neurale, per parole chiave e ibride con estrazione
dei contenuti integrata (evidenziazioni, testo, riepiloghi).

## Ottenere una chiave API

<Steps>
  <Step title="Crea un account">
    Registrati su [exa.ai](https://exa.ai/) e genera una chiave API dal tuo
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
            apiKey: "exa-...", // facoltativo se EXA_API_KEY è impostata
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

**Alternativa tramite variabile d'ambiente:** imposta `EXA_API_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscila in `~/.openclaw/.env`.

## Parametri dello strumento

| Parametro     | Descrizione                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `query`       | Query di ricerca (obbligatoria)                                              |
| `count`       | Risultati da restituire (1-100)                                              |
| `type`        | Modalità di ricerca: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` o `instant` |
| `freshness`   | Filtro temporale: `day`, `week`, `month` o `year`                            |
| `date_after`  | Risultati dopo questa data (YYYY-MM-DD)                                      |
| `date_before` | Risultati prima di questa data (YYYY-MM-DD)                                  |
| `contents`    | Opzioni di estrazione dei contenuti (vedi sotto)                             |

### Estrazione dei contenuti

Exa può restituire contenuti estratti insieme ai risultati di ricerca. Passa un oggetto
`contents` per abilitarla:

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
| --------------- | --------------------------------------------------------------------- | --------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Estrae il testo completo della pagina |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Estrae le frasi chiave      |
| `summary`       | `boolean \| { query }`                                                | Riepilogo generato dall'AI  |

### Modalità di ricerca

| Modalità         | Descrizione                            |
| ---------------- | -------------------------------------- |
| `auto`           | Exa sceglie la modalità migliore (predefinita) |
| `neural`         | Ricerca semantica/basata sul significato |
| `fast`           | Ricerca rapida per parole chiave       |
| `deep`           | Ricerca approfondita completa          |
| `deep-reasoning` | Ricerca approfondita con ragionamento  |
| `instant`        | Risultati più rapidi                   |

## Note

- Se non viene fornita alcuna opzione `contents`, Exa usa per impostazione predefinita `{ highlights: true }`
  così i risultati includono estratti con frasi chiave
- I risultati preservano i campi `highlightScores` e `summary` dalla risposta API di Exa
  quando disponibili
- Le descrizioni dei risultati vengono risolte prima dalle evidenziazioni, poi dal riepilogo, quindi dal
  testo completo — a seconda di ciò che è disponibile
- `freshness` e `date_after`/`date_before` non possono essere combinati — usa una sola
  modalità di filtro temporale
- È possibile restituire fino a 100 risultati per query (soggetto ai limiti
  del tipo di ricerca Exa)
- I risultati sono memorizzati nella cache per 15 minuti per impostazione predefinita (configurabile tramite
  `cacheTtlMinutes`)
- Exa è un'integrazione API ufficiale con risposte JSON strutturate

## Correlati

- [Panoramica Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/tools/brave-search) -- risultati strutturati con filtri per paese/lingua
- [Perplexity Search](/tools/perplexity-search) -- risultati strutturati con filtro per dominio
