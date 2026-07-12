---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - È necessaria la chiave API di Perplexity oppure la configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtri)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T07:28:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Il plugin Perplexity registra un provider `web_search` con due modalità di trasporto: l'API nativa Perplexity Search (risultati strutturati con filtri) e i completamenti chat Perplexity Sonar, direttamente o tramite OpenRouter (risposte sintetizzate dall'IA con citazioni).

<Note>
Questa pagina descrive la configurazione del **provider** Perplexity. Per lo **strumento** Perplexity (come viene utilizzato dall'agente), consulta [Ricerca Perplexity](/it/tools/perplexity-search).
</Note>

| Proprietà             | Valore                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| Tipo                  | Provider di ricerca web (non un provider di modelli)                       |
| Autenticazione        | `PERPLEXITY_API_KEY` (nativa) o `OPENROUTER_API_KEY` (tramite OpenRouter)  |
| Percorso configurazione | `plugins.entries.perplexity.config.webSearch.apiKey`                     |
| Sostituzioni          | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`           |
| Ottieni una chiave    | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)       |

## Installare il plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw configure --section web
    ```

    In alternativa, imposta direttamente la chiave:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Funziona anche una chiave esportata come `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY` nell'ambiente del Gateway.

  </Step>
  <Step title="Inizia a cercare">
    `web_search` rileva automaticamente Perplexity quando la relativa chiave è la credenziale di ricerca disponibile; non è necessaria alcuna configurazione aggiuntiva. Per specificare esplicitamente il provider:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Modalità di ricerca

Il plugin determina la modalità di trasporto nel seguente ordine:

1. Se `webSearch.baseUrl` o `webSearch.model` è impostato, instrada sempre la richiesta tramite i completamenti chat Sonar verso tale endpoint, indipendentemente dal tipo di chiave.
2. In caso contrario, l'origine della chiave determina l'endpoint: il prefisso di una chiave configurata seleziona la modalità di trasporto (la configurazione ha la precedenza sulle variabili d'ambiente); una chiave d'ambiente utilizza direttamente l'endpoint corrispondente.

| Prefisso chiave | Modalità di trasporto                                     | Funzionalità                                           |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| `pplx-`         | API nativa Perplexity Search (`https://api.perplexity.ai`) | Risultati strutturati, filtri per dominio/lingua/data |
| `sk-or-`        | OpenRouter (`https://openrouter.ai/api/v1`), modello Sonar | Risposte sintetizzate dall'IA con citazioni           |

Una chiave configurata con qualsiasi altro prefisso utilizza anch'essa l'API Search nativa. Il percorso dei completamenti chat utilizza per impostazione predefinita il modello `perplexity/sonar-pro`; puoi sostituirlo con `plugins.entries.perplexity.config.webSearch.model`.

## Filtri dell'API nativa

| Filtro                               | Descrizione                                                           | Modalità di trasporto |
| ------------------------------------ | --------------------------------------------------------------------- | --------------------- |
| `count`                              | Risultati per ricerca, 1-10 (valore predefinito: 5)                   | Solo nativa           |
| `freshness`                          | Intervallo di aggiornamento: `day`, `week`, `month`, `year`           | Entrambe              |
| `country`                            | Codice paese di 2 lettere (`us`, `de`, `jp`)                          | Solo nativa           |
| `language`                           | Codice lingua ISO 639-1 (`en`, `fr`, `zh`)                            | Solo nativa           |
| `date_after` / `date_before`         | Intervallo delle date di pubblicazione nel formato `YYYY-MM-DD`       | Solo nativa           |
| `domain_filter`                      | Massimo 20 domini; elenco consentito o elenco negato con prefisso `-`, mai combinati | Solo nativa |
| `max_tokens` / `max_tokens_per_page` | Budget dei contenuti per tutti i risultati / per pagina               | Solo nativa           |

I filtri disponibili solo per l'API nativa restituiscono un errore descrittivo nel percorso dei completamenti chat. `freshness` non può essere combinato con `date_after`/`date_before`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per i processi daemon">
    <Warning>
    Una chiave esportata esclusivamente in una shell interattiva non è visibile a un daemon Gateway launchd/systemd, a meno che tale ambiente non venga importato esplicitamente. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` affinché il processo Gateway possa leggerla. Consulta [Variabili d'ambiente](/it/help/environment) per l'ordine completo di precedenza.
    </Warning>
  </Accordion>

  <Accordion title="Configurazione del proxy OpenRouter">
    Per instradare le ricerche Perplexity tramite OpenRouter, imposta una `OPENROUTER_API_KEY` (prefisso `sk-or-`) anziché una chiave Perplexity nativa. OpenClaw rileva la chiave e passa automaticamente alla modalità di trasporto Sonar. È utile se hai già configurato la fatturazione di OpenRouter e desideri consolidare lì i provider.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Strumento di ricerca Perplexity" href="/it/tools/perplexity-search" icon="magnifying-glass">
    Come l'agente richiama le ricerche Perplexity e interpreta i risultati.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione, incluse le voci dei plugin.
  </Card>
</CardGroup>
