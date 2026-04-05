---
read_when:
    - Vuoi configurare Perplexity come provider di ricerca web
    - Ti servono la chiave API di Perplexity o la configurazione del proxy OpenRouter
summary: Configurazione del provider di ricerca web Perplexity (chiave API, modalità di ricerca, filtraggio)
title: Perplexity (Provider)
x-i18n:
    generated_at: "2026-04-05T14:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (provider di ricerca web)

Il plugin Perplexity fornisce capacità di ricerca web tramite l'API Perplexity
Search o Perplexity Sonar tramite OpenRouter.

<Note>
Questa pagina copre la configurazione del **provider** Perplexity. Per lo
**strumento** Perplexity (come lo usa l'agente), vedi [Perplexity tool](/tools/perplexity-search).
</Note>

- Tipo: provider di ricerca web (non un provider di modelli)
- Autenticazione: `PERPLEXITY_API_KEY` (diretta) oppure `OPENROUTER_API_KEY` (tramite OpenRouter)
- Percorso di configurazione: `plugins.entries.perplexity.config.webSearch.apiKey`

## Avvio rapido

1. Imposta la chiave API:

```bash
openclaw configure --section web
```

Oppure impostala direttamente:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. L'agente userà automaticamente Perplexity per le ricerche web quando configurato.

## Modalità di ricerca

Il plugin seleziona automaticamente il trasporto in base al prefisso della chiave API:

| Prefisso chiave | Trasporto                    | Funzionalità                                     |
| --------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`         | API Search nativa di Perplexity | Risultati strutturati, filtri per dominio/lingua/data |
| `sk-or-`        | OpenRouter (Sonar)           | Risposte sintetizzate dall'AI con citazioni      |

## Filtraggio dell'API nativa

Quando si usa l'API nativa di Perplexity (`pplx-` key), le ricerche supportano:

- **Paese**: codice paese di 2 lettere
- **Lingua**: codice lingua ISO 639-1
- **Intervallo di date**: giorno, settimana, mese, anno
- **Filtri di dominio**: allowlist/denylist (massimo 20 domini)
- **Budget del contenuto**: `max_tokens`, `max_tokens_per_page`

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
`PERPLEXITY_API_KEY` sia disponibile per quel processo (ad esempio in
`~/.openclaw/.env` o tramite `env.shellEnv`).
