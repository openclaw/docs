---
read_when:
    - Vuoi una ricerca web basata su Tavily
    - È necessaria una chiave API Tavily
    - Vuoi usare Tavily come fornitore web_search
    - Vuoi estrarre contenuti dagli URL
summary: Strumenti di ricerca ed estrazione di Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-11T20:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) è un'API di ricerca progettata per applicazioni di IA. OpenClaw la espone in due modi:

- come provider `web_search` per lo strumento di ricerca generico
- come strumenti espliciti del Plugin: `tavily_search` e `tavily_extract`

Tavily restituisce risultati strutturati ottimizzati per il consumo da parte degli LLM, con profondità di ricerca configurabile, filtro per argomento, filtri di dominio, riepiloghi di risposte generati dall'IA ed estrazione di contenuti dagli URL (incluse le pagine renderizzate con JavaScript).

| Proprietà          | Valore                              |
| ------------------ | ----------------------------------- |
| ID Plugin          | `tavily`                            |
| Autenticazione     | `TAVILY_API_KEY` o config `apiKey`  |
| URL di base        | `https://api.tavily.com` (predefinito) |
| Strumenti inclusi  | `tavily_search`, `tavily_extract`   |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea un account Tavily su [tavily.com](https://tavily.com), quindi genera una chiave API nella dashboard.
  </Step>
  <Step title="Configura il Plugin e il provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica l'esecuzione della ricerca">
    Attiva una `web_search` da qualsiasi agente oppure chiama direttamente `tavily_search`.
  </Step>
</Steps>

<Tip>
Scegliere Tavily durante l'onboarding o con `openclaw configure --section web` abilita automaticamente il Plugin Tavily incluso.
</Tip>

## Riferimento degli strumenti

### `tavily_search`

Usalo quando vuoi controlli di ricerca specifici di Tavily invece della `web_search` generica.

| Parametro         | Tipo         | Vincoli / predefinito                 | Descrizione                                      |
| ----------------- | ------------ | ------------------------------------- | ------------------------------------------------ |
| `query`           | string       | obbligatorio                          | Stringa della query di ricerca. Mantienila sotto i 400 caratteri. |
| `search_depth`    | enum         | `basic` (predefinito), `advanced`     | `advanced` è più lento ma offre maggiore rilevanza. |
| `topic`           | enum         | `general` (predefinito), `news`, `finance` | Filtra per famiglia di argomenti.            |
| `max_results`     | integer      | 1-20                                  | Numero di risultati.                             |
| `include_answer`  | boolean      | predefinito `false`                   | Include un riepilogo della risposta generato dall'IA di Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`        | Filtra i risultati per recenza.                  |
| `include_domains` | string array | (nessuno)                             | Include solo risultati da questi domini.         |
| `exclude_domains` | string array | (nessuno)                             | Esclude i risultati da questi domini.            |

Compromesso della profondità di ricerca:

| Profondità | Velocità | Rilevanza | Ideale per                            |
| ---------- | -------- | --------- | ------------------------------------- |
| `basic`    | Più veloce | Alta    | Query generiche (predefinito).        |
| `advanced` | Più lenta | Massima | Ricerca di precisione e verifica dei fatti. |

### `tavily_extract`

Usalo per estrarre contenuti puliti da uno o più URL. Gestisce pagine renderizzate con JavaScript e supporta la suddivisione in blocchi focalizzata sulla query per un'estrazione mirata.

| Parametro           | Tipo         | Vincoli / predefinito        | Descrizione                                                 |
| ------------------- | ------------ | ---------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | obbligatorio, 1-20           | URL da cui estrarre contenuti.                              |
| `query`             | string       | (facoltativo)                | Riordina i blocchi estratti in base alla rilevanza rispetto a questa query. |
| `extract_depth`     | enum         | `basic` (predefinito), `advanced` | Usa `advanced` per pagine con molto JS, SPA o tabelle dinamiche. |
| `chunks_per_source` | integer      | 1-5; **richiede `query`**    | Blocchi restituiti per URL. Genera un errore se impostato senza `query`. |
| `include_images`    | boolean      | predefinito `false`          | Include gli URL delle immagini nei risultati.               |

Compromesso della profondità di estrazione:

| Profondità | Quando usarla                              |
| ---------- | ------------------------------------------ |
| `basic`    | Pagine semplici. Provala per prima.        |
| `advanced` | SPA renderizzate con JS, contenuti dinamici, tabelle. |

<Tip>
Suddividi elenchi di URL più grandi in più chiamate `tavily_extract` (massimo 20 per richiesta). Usa `query` insieme a `chunks_per_source` per ottenere solo contenuti pertinenti invece di pagine complete.
</Tip>

## Scegliere lo strumento giusto

| Esigenza                              | Strumento        |
| ------------------------------------- | ---------------- |
| Ricerca web rapida, senza opzioni speciali | `web_search` |
| Ricerca con profondità, argomento, risposte IA | `tavily_search` |
| Estrarre contenuti da URL specifici   | `tavily_extract` |

<Note>
Lo strumento generico `web_search` con Tavily come provider supporta `query` e `count` (fino a 20 risultati). Per i controlli specifici di Tavily (`search_depth`, `topic`, `include_answer`, filtri di dominio, intervallo temporale), usa invece `tavily_search`.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Ordine di risoluzione della chiave API">
    Il client Tavily cerca la sua chiave API in questo ordine:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (risolta tramite SecretRefs).
    2. `TAVILY_API_KEY` dall'ambiente del Gateway.

    `tavily_extract` genera un errore di configurazione se non è presente nessuna delle due.

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Sovrascrivi `plugins.entries.tavily.config.webSearch.baseUrl` se instradi Tavily tramite un proxy. Il valore predefinito è `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` richiede `query`">
    `tavily_extract` rifiuta le chiamate che passano `chunks_per_source` senza una `query`. Tavily classifica i blocchi in base alla rilevanza rispetto alla query, quindi il parametro non ha significato senza una query.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Panoramica di Web Search" href="/it/tools/web" icon="magnifying-glass">
    Tutti i provider e le regole di rilevamento automatico.
  </Card>
  <Card title="Firecrawl" href="/it/tools/firecrawl" icon="fire">
    Ricerca più scraping con estrazione di contenuti.
  </Card>
  <Card title="Exa Search" href="/it/tools/exa-search" icon="binoculars">
    Ricerca neurale con estrazione di contenuti.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Schema di configurazione completo per le voci del Plugin e il routing degli strumenti.
  </Card>
</CardGroup>
