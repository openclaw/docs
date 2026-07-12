---
read_when:
    - Vuoi utilizzare Exa per web_search
    - È necessaria una EXA_API_KEY
    - Vuoi una ricerca neurale o l'estrazione di contenuti
summary: Ricerca Exa AI -- ricerca neurale e per parole chiave con estrazione dei contenuti
title: Ricerca Exa
x-i18n:
    generated_at: "2026-07-12T07:32:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) è un provider di `web_search` con modalità di ricerca
neurale, per parole chiave e ibrida, oltre all'estrazione integrata dei contenuti
(passaggi evidenziati, testo, riepiloghi).

## Installare il Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Ottenere una chiave API

<Steps>
  <Step title="Creare un account">
    Registrati su [exa.ai](https://exa.ai/) e genera una chiave API dalla tua
    dashboard.
  </Step>
  <Step title="Memorizzare la chiave">
    Imposta `EXA_API_KEY` nell'ambiente del Gateway oppure esegui la configurazione tramite:

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
            baseUrl: "https://api.exa.ai", // facoltativo; OpenClaw aggiunge /search
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

**Alternativa tramite ambiente:** imposta `EXA_API_KEY` nell'ambiente del Gateway. Per
un'installazione del Gateway, inseriscila in `~/.openclaw/.env`. Consulta
[Variabili d'ambiente](/it/help/faq#env-vars-and-env-loading).

## Sostituzione dell'URL di base

Imposta `plugins.entries.exa.config.webSearch.baseUrl` per instradare le richieste
di ricerca Exa attraverso un proxy compatibile o un endpoint alternativo. OpenClaw
normalizza gli host senza protocollo anteponendo `https://` e aggiunge `/search`, a meno
che il percorso non termini già così. L'endpoint risolto fa parte della chiave della
cache di ricerca, quindi i risultati provenienti da endpoint diversi non vengono mai condivisi.

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Risultati da restituire (1-100, in base ai limiti del tipo di ricerca Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modalità di ricerca.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale. Non può essere combinato con `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Risultati successivi a questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Risultati precedenti a questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opzioni per l'estrazione dei contenuti (vedi sotto).
</ParamField>

### Estrazione dei contenuti

Passa un oggetto `contents` per controllare i contenuti estratti nei risultati:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // testo completo della pagina
    highlights: { numSentences: 3 }, // frasi principali
    summary: true, // riepilogo generato dall'IA
  },
});
```

| Opzione dei contenuti | Tipo                                                                  | Descrizione                         |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `text`                | `boolean \| { maxCharacters }`                                        | Estrae il testo completo della pagina |
| `highlights`          | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Estrae le frasi principali          |
| `summary`             | `boolean \| { query }`                                                | Riepilogo generato dall'IA          |

Se `contents` viene omesso, il valore predefinito di Exa è `{ highlights: true }`, quindi
i risultati includono estratti delle frasi principali. Le descrizioni dei risultati vengono
ricavate prima dai passaggi evidenziati, poi dal riepilogo e infine dal testo completo,
in base al primo contenuto disponibile. Quando disponibili, i risultati conservano anche
i campi non elaborati `highlightScores` e `summary` della risposta dell'API Exa.

### Modalità di ricerca

| Modalità         | Descrizione                                        |
| ---------------- | -------------------------------------------------- |
| `auto`           | Exa sceglie la modalità migliore (predefinita)     |
| `neural`         | Ricerca semantica/basata sul significato           |
| `fast`           | Ricerca rapida per parole chiave                    |
| `deep`           | Ricerca approfondita ed esaustiva                   |
| `deep-reasoning` | Ricerca approfondita con ragionamento               |
| `instant`        | Risultati più rapidi                                |

## Note

- `count` accetta valori fino a 100, in base ai limiti del tipo di ricerca Exa.
- Per impostazione predefinita, i risultati vengono memorizzati nella cache per 15 minuti.
  Configura i parametri condivisi `tools.web.search.cacheTtlMinutes` (minuti) e
  `tools.web.search.timeoutSeconds` (valore predefinito: 30 s) per modificare la durata
  della cache e il timeout delle richieste per tutti i provider di `web_search`, incluso Exa.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con filtri per paese/lingua
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro per dominio
