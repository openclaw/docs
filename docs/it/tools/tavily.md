---
read_when:
    - Vuoi una ricerca sul web basata su Tavily
    - È necessaria una chiave API di Tavily
    - Vuoi Tavily come provider di web_search
    - Vuoi estrarre contenuti dagli URL
summary: Strumenti di ricerca ed estrazione Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T07:35:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) è un'API di ricerca progettata per applicazioni di IA. OpenClaw la rende disponibile in due modi:

- come provider `web_search` per lo strumento di ricerca generico
- come strumenti Plugin espliciti: `tavily_search` e `tavily_extract`

Tavily restituisce risultati strutturati ottimizzati per l'uso da parte degli LLM, con profondità di ricerca configurabile, filtro per argomento, filtri per dominio, riepiloghi delle risposte generati dall'IA ed estrazione di contenuti dagli URL (incluse le pagine sottoposte a rendering tramite JavaScript).

| Proprietà  | Valore                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| ID Plugin | `tavily`                                                                                      |
| Pacchetto   | `@openclaw/tavily-plugin`                                                                     |
| Autenticazione      | Variabile di ambiente `TAVILY_API_KEY` o configurazione `apiKey`                                                   |
| URL di base  | `https://api.tavily.com` (predefinito); variabile di ambiente `TAVILY_BASE_URL` o configurazione `baseUrl` per sovrascriverlo |
| Timeout  | 30 s per la ricerca, 60 s per l'estrazione (valori predefiniti)                                                             |
| Strumenti     | `tavily_search`, `tavily_extract`                                                             |

## Per iniziare

<Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
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
                apiKey: "tvly-...", // facoltativo se TAVILY_API_KEY è impostata
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
    Avvia una `web_search` da qualsiasi agente oppure chiama direttamente `tavily_search`.
  </Step>
</Steps>

<Tip>
La scelta di Tavily durante la configurazione iniziale o tramite `openclaw configure --section web` installa e abilita il Plugin Tavily ufficiale quando necessario.
</Tip>

## Riferimento degli strumenti

### `tavily_search`

Usalo quando desideri controlli di ricerca specifici di Tavily anziché la ricerca generica `web_search`.

| Parametro         | Tipo         | Vincoli / valore predefinito                  | Descrizione                                   |
| ----------------- | ------------ | -------------------------------------- | --------------------------------------------- |
| `query`           | stringa       | obbligatorio                               | Stringa della query di ricerca.                          |
| `search_depth`    | enumerazione         | `basic` (predefinito), `advanced`          | `advanced` è più lento ma offre una rilevanza maggiore.    |
| `topic`           | enumerazione         | `general` (predefinito), `news`, `finance` | Filtra per categoria di argomento.                       |
| `max_results`     | numero intero      | 1-20, valore predefinito `5`                      | Numero di risultati.                            |
| `include_answer`  | valore booleano      | valore predefinito `false`                        | Include un riepilogo della risposta generato dall'IA di Tavily. |
| `time_range`      | enumerazione         | `day`, `week`, `month`, `year`         | Filtra i risultati in base alla recenza.                    |
| `include_domains` | array di stringhe | (nessuno)                                 | Include solo i risultati provenienti da questi domini.      |
| `exclude_domains` | array di stringhe | (nessuno)                                 | Esclude i risultati provenienti da questi domini.           |

Confronto della profondità di ricerca:

| Profondità      | Velocità  | Rilevanza | Ideale per                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | Più veloce | Alta      | Query generiche (valore predefinito).   |
| `advanced` | Più lenta | Massima   | Ricerche di precisione e verifica dei fatti. |

### `tavily_extract`

Usalo per estrarre contenuti puliti da uno o più URL. Gestisce le pagine sottoposte a rendering tramite JavaScript e supporta la suddivisione in blocchi incentrata sulla query per un'estrazione mirata.

| Parametro           | Tipo         | Vincoli / valore predefinito         | Descrizione                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | array di stringhe | obbligatorio, 1-20                | URL da cui estrarre i contenuti.                               |
| `query`             | stringa       | (facoltativo)                    | Riordina i blocchi estratti in base alla rilevanza rispetto a questa query.         |
| `extract_depth`     | enumerazione         | `basic` (predefinito), `advanced` | Usa `advanced` per pagine con un uso intensivo di JavaScript, SPA o tabelle dinamiche. |
| `chunks_per_source` | numero intero      | 1-5; **richiede `query`**     | Blocchi restituiti per URL. Genera un errore se impostato senza `query`.     |
| `include_images`    | valore booleano      | valore predefinito `false`               | Include gli URL delle immagini nei risultati.                              |

Confronto della profondità di estrazione:

| Profondità      | Quando usarla                                |
| ---------- | ------------------------------------------ |
| `basic`    | Pagine semplici. Prova prima questa opzione.              |
| `advanced` | SPA sottoposte a rendering tramite JavaScript, contenuti dinamici, tabelle. |

<Tip>
Suddividi gli elenchi di URL più lunghi in più chiamate `tavily_extract` (massimo 20 per richiesta). Usa `query` insieme a `chunks_per_source` per ottenere solo i contenuti pertinenti anziché le pagine complete.
</Tip>

## Scelta dello strumento giusto

| Esigenza                                 | Strumento             |
| ------------------------------------ | ---------------- |
| Ricerca web rapida, senza opzioni speciali | `web_search`     |
| Ricerca con profondità, argomento e risposte dell'IA | `tavily_search`  |
| Estrazione di contenuti da URL specifici   | `tavily_extract` |

<Note>
Lo strumento generico `web_search` con Tavily come provider supporta `query` e `count` (fino a 20 risultati). Per i controlli specifici di Tavily (`search_depth`, `topic`, `include_answer`, filtri per dominio, intervallo temporale), usa invece `tavily_search`.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Ordine di risoluzione della chiave API">
    Il client Tavily cerca la propria chiave API nel seguente ordine:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (risolta tramite SecretRefs).
    2. `TAVILY_API_KEY` dall'ambiente del Gateway.

    Sia `tavily_search` sia `tavily_extract` generano un errore di configurazione se nessuno dei due valori è presente.

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Sovrascrivi `plugins.entries.tavily.config.webSearch.baseUrl` oppure imposta `TAVILY_BASE_URL` se accedi a Tavily tramite un proxy. La configurazione ha la priorità sulla variabile di ambiente. Il valore predefinito è `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` richiede `query`">
    `tavily_extract` rifiuta le chiamate che passano `chunks_per_source` senza una `query`. Tavily classifica i blocchi in base alla pertinenza rispetto alla query, quindi il parametro non ha significato senza di essa.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Panoramica della ricerca web" href="/it/tools/web" icon="magnifying-glass">
    Tutti i provider e le regole di rilevamento automatico.
  </Card>
  <Card title="Firecrawl" href="/it/tools/firecrawl" icon="fire">
    Ricerca e scraping con estrazione dei contenuti.
  </Card>
  <Card title="Ricerca Exa" href="/it/tools/exa-search" icon="binoculars">
    Ricerca neurale con estrazione dei contenuti.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Schema di configurazione completo per le voci dei Plugin e l'instradamento degli strumenti.
  </Card>
</CardGroup>
