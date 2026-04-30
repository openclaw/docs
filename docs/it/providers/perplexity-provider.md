---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - È necessaria la chiave API di Perplexity o la configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtraggio)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T09:09:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Il Plugin Perplexity fornisce funzionalità di ricerca web tramite l'API di ricerca Perplexity
o Perplexity Sonar tramite OpenRouter.

<Note>
Questa pagina riguarda la configurazione del **provider** Perplexity. Per lo **strumento** Perplexity (come l'agente lo usa), vedi [strumento Perplexity](/it/tools/perplexity-search).
</Note>

| Proprietà  | Valore                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Tipo        | Provider di ricerca web (non un provider di modelli)                   |
| Autenticazione | `PERPLEXITY_API_KEY` (diretta) o `OPENROUTER_API_KEY` (tramite OpenRouter) |
| Percorso config | `plugins.entries.perplexity.config.webSearch.apiKey`               |

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

Il Plugin seleziona automaticamente il trasporto in base al prefisso della chiave API:

<Tabs>
  <Tab title="API Perplexity nativa (pplx-)">
    Quando la tua chiave inizia con `pplx-`, OpenClaw usa l'API di ricerca
    Perplexity nativa. Questo trasporto restituisce risultati strutturati e supporta filtri per dominio, lingua
    e data (vedi le opzioni di filtro sotto).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando la tua chiave inizia con `sk-or-`, OpenClaw instrada tramite OpenRouter usando
    il modello Perplexity Sonar. Questo trasporto restituisce risposte sintetizzate dall'IA con
    citazioni.
  </Tab>
</Tabs>

| Prefisso chiave | Trasporto                    | Funzionalità                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API di ricerca Perplexity nativa | Risultati strutturati, filtri dominio/lingua/data |
| `sk-or-`   | OpenRouter (Sonar)           | Risposte sintetizzate dall'IA con citazioni      |

## Filtri dell'API nativa

<Note>
Le opzioni di filtro sono disponibili solo quando usi l'API Perplexity nativa
(chiave `pplx-`). Le ricerche OpenRouter/Sonar non supportano questi parametri.
</Note>

Quando usi l'API Perplexity nativa, le ricerche supportano i seguenti filtri:

| Filtro         | Descrizione                            | Esempio                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Paese          | Codice paese a 2 lettere               | `us`, `de`, `jp`                    |
| Lingua         | Codice lingua ISO 639-1                | `en`, `fr`, `zh`                    |
| Intervallo di date | Finestra di recenza               | `day`, `week`, `month`, `year`      |
| Filtri dominio | Allowlist o denylist (massimo 20 domini) | `example.com`                       |
| Budget contenuto | Limiti di token per risposta / per pagina | `max_tokens`, `max_tokens_per_page` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile d'ambiente per processi daemon">
    Se il Gateway OpenClaw viene eseguito come daemon (launchd/systemd), assicurati che
    `PERPLEXITY_API_KEY` sia disponibile per quel processo.

    <Warning>
    Una chiave impostata solo in `~/.profile` non sarà visibile a un daemon
    launchd/systemd a meno che quell'ambiente non venga importato esplicitamente. Imposta la chiave in
    `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo Gateway possa
    leggerla.
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
    Riferimento completo della configurazione, incluse le voci Plugin.
  </Card>
</CardGroup>
