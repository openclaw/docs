---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - Ti serve la chiave API di Perplexity o la configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtro)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Il plugin Perplexity fornisce funzionalità di ricerca web tramite la Perplexity
Search API o Perplexity Sonar tramite OpenRouter.

<Note>
Questa pagina riguarda la configurazione del **provider** Perplexity. Per lo **strumento** Perplexity (come lo usa l'agente), vedi [strumento Perplexity](/it/tools/perplexity-search).
</Note>

| Proprietà   | Valore                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Tipo        | Provider di ricerca web (non un provider di modelli)                   |
| Auth        | `PERPLEXITY_API_KEY` (diretta) o `OPENROUTER_API_KEY` (tramite OpenRouter) |
| Percorso config | `plugins.entries.perplexity.config.webSearch.apiKey`               |

## Installa il plugin

Installa il plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui il flusso interattivo di configurazione della ricerca web:

    ```bash
    openclaw configure --section web
    ```

    Oppure imposta direttamente la chiave:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Inizia a cercare">
    L'agente userà automaticamente Perplexity per le ricerche web una volta che la chiave è
    configurata. Non sono necessari passaggi aggiuntivi.
  </Step>
</Steps>

## Modalità di ricerca

Il plugin seleziona automaticamente il trasporto in base al prefisso della chiave API:

<Tabs>
  <Tab title="API Perplexity nativa (pplx-)">
    Quando la tua chiave inizia con `pplx-`, OpenClaw usa la Perplexity Search
    API nativa. Questo trasporto restituisce risultati strutturati e supporta filtri per dominio, lingua
    e data (vedi le opzioni di filtro sotto).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando la tua chiave inizia con `sk-or-`, OpenClaw instrada tramite OpenRouter usando
    il modello Perplexity Sonar. Questo trasporto restituisce risposte sintetizzate dall'IA con
    citazioni.
  </Tab>
</Tabs>

| Prefisso chiave | Trasporto                    | Funzionalità                                    |
| --------------- | ---------------------------- | ---------------------------------------------- |
| `pplx-`         | Perplexity Search API nativa | Risultati strutturati, filtri dominio/lingua/data |
| `sk-or-`        | OpenRouter (Sonar)           | Risposte sintetizzate dall'IA con citazioni    |

## Filtri dell'API nativa

<Note>
Le opzioni di filtro sono disponibili solo quando si usa l'API Perplexity nativa
(chiave `pplx-`). Le ricerche OpenRouter/Sonar non supportano questi parametri.
</Note>

Quando si usa l'API Perplexity nativa, le ricerche supportano i seguenti filtri:

| Filtro          | Descrizione                           | Esempio                             |
| --------------- | ------------------------------------- | ----------------------------------- |
| Paese           | Codice paese a 2 lettere              | `us`, `de`, `jp`                    |
| Lingua          | Codice lingua ISO 639-1               | `en`, `fr`, `zh`                    |
| Intervallo date | Finestra di attualità                 | `day`, `week`, `month`, `year`      |
| Filtri dominio  | Allowlist o denylist (max 20 domini)  | `example.com`                       |
| Budget contenuti | Limiti di token per risposta / per pagina | `max_tokens`, `max_tokens_per_page` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi daemon">
    Se OpenClaw Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `PERPLEXITY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave esportata solo in una shell interattiva non sarà visibile a un
    daemon launchd/systemd a meno che quell'ambiente non venga importato esplicitamente. Imposta
    la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo gateway
    possa leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Configurazione proxy OpenRouter">
    Se preferisci instradare le ricerche Perplexity tramite OpenRouter, imposta una
    `OPENROUTER_API_KEY` (prefisso `sk-or-`) invece di una chiave Perplexity nativa.
    OpenClaw rileverà il prefisso e passerà automaticamente al trasporto Sonar.

    <Tip>
    Il trasporto OpenRouter è utile se hai già un account OpenRouter
    e vuoi una fatturazione consolidata tra più provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento di ricerca Perplexity" href="/it/tools/perplexity-search" icon="magnifying-glass">
    Come l'agente invoca le ricerche Perplexity e interpreta i risultati.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione, incluse le voci dei plugin.
  </Card>
</CardGroup>
