---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - Hai bisogno della chiave API Perplexity o della configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtraggio)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T08:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (provider di ricerca web)

Il plugin Perplexity fornisce capacità di ricerca web tramite l'API Perplexity
Search oppure Perplexity Sonar tramite OpenRouter.

<Note>
Questa pagina copre la configurazione del **provider** Perplexity. Per lo
**strumento** Perplexity (come lo usa l'agente), vedi [strumento Perplexity](/it/tools/perplexity-search).
</Note>

| Proprietà   | Valore                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Tipo        | Provider di ricerca web (non un provider di modelli)                   |
| Auth        | `PERPLEXITY_API_KEY` (diretta) oppure `OPENROUTER_API_KEY` (tramite OpenRouter) |
| Percorso config | `plugins.entries.perplexity.config.webSearch.apiKey`                |

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
    L'agente userà automaticamente Perplexity per le ricerche web non appena la chiave sarà
    configurata. Non sono richiesti ulteriori passaggi.
  </Step>
</Steps>

## Modalità di ricerca

Il plugin seleziona automaticamente il trasporto in base al prefisso della chiave API:

<Tabs>
  <Tab title="API Perplexity nativa (pplx-)">
    Quando la tua chiave inizia con `pplx-`, OpenClaw usa l'API Search nativa di Perplexity.
    Questo trasporto restituisce risultati strutturati e supporta filtri per dominio, lingua
    e data (vedi le opzioni di filtraggio sotto).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando la tua chiave inizia con `sk-or-`, OpenClaw instrada tramite OpenRouter usando
    il modello Perplexity Sonar. Questo trasporto restituisce risposte sintetizzate dall'IA con
    citazioni.
  </Tab>
</Tabs>

| Prefisso chiave | Trasporto                    | Funzionalità                                     |
| --------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`         | API Perplexity Search nativa | Risultati strutturati, filtri dominio/lingua/data |
| `sk-or-`        | OpenRouter (Sonar)           | Risposte sintetizzate dall'IA con citazioni      |

## Filtraggio dell'API nativa

<Note>
Le opzioni di filtraggio sono disponibili solo quando si usa l'API Perplexity nativa
(chiave `pplx-`). Le ricerche OpenRouter/Sonar non supportano questi parametri.
</Note>

Quando usi l'API Perplexity nativa, le ricerche supportano i seguenti filtri:

| Filtro          | Descrizione                             | Esempio                             |
| --------------- | --------------------------------------- | ----------------------------------- |
| Paese           | Codice paese a 2 lettere                | `us`, `de`, `jp`                    |
| Lingua          | Codice lingua ISO 639-1                 | `en`, `fr`, `zh`                    |
| Intervallo date | Finestra di recenza                     | `day`, `week`, `month`, `year`      |
| Filtri dominio  | Allowlist o denylist (max 20 domini)    | `example.com`                       |
| Budget contenuto | Limiti di token per risposta / per pagina | `max_tokens`, `max_tokens_per_page` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Variabile di ambiente per processi demone">
    Se il Gateway OpenClaw viene eseguito come demone (launchd/systemd), assicurati che
    `PERPLEXITY_API_KEY` sia disponibile a quel processo.

    <Warning>
    Una chiave impostata solo in `~/.profile` non sarà visibile a un demone launchd/systemd
    a meno che quell'ambiente non venga importato esplicitamente. Imposta la chiave in
    `~/.openclaw/.env` oppure tramite `env.shellEnv` per assicurarti che il processo gateway possa
    leggerla.
    </Warning>

  </Accordion>

  <Accordion title="Configurazione proxy OpenRouter">
    Se preferisci instradare le ricerche Perplexity tramite OpenRouter, imposta una
    `OPENROUTER_API_KEY` (prefisso `sk-or-`) invece di una chiave Perplexity nativa.
    OpenClaw rileverà il prefisso e passerà automaticamente al trasporto Sonar.

    <Tip>
    Il trasporto OpenRouter è utile se hai già un account OpenRouter
    e vuoi una fatturazione consolidata su più provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento di ricerca Perplexity" href="/it/tools/perplexity-search" icon="magnifying-glass">
    Come l'agente invoca le ricerche Perplexity e interpreta i risultati.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione, incluse le voci dei plugin.
  </Card>
</CardGroup>
