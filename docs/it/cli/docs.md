---
read_when:
    - Vuoi cercare nella documentazione live di OpenClaw dal terminale
    - Devi sapere quale API di ricerca ospitata chiama la CLI della documentazione
summary: Riferimento CLI per `openclaw docs` (cerca nell'indice della documentazione live)
title: Documentazione
x-i18n:
    generated_at: "2026-06-27T17:19:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cerca l'indice live della documentazione di OpenClaw dal terminale. Il comando chiama l'API di ricerca della documentazione di OpenClaw ospitata su Cloudflare e mostra i risultati nel terminale.

## Utilizzo

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argomenti:

| Argomento    | Descrizione                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| `[query...]` | Query di ricerca in formato libero. Le query con più parole vengono unite con spazi e inviate come una sola. |

## Esempi

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Senza query, `openclaw docs` stampa l'URL del punto di ingresso della documentazione più un comando di ricerca di esempio invece di eseguire una ricerca.

## Come funziona

`openclaw docs` chiama `https://docs.openclaw.ai/api/search` e mostra i risultati JSON. La chiamata di ricerca usa un timeout fisso di 30 secondi.

## Output

In un terminale avanzato (TTY), i risultati vengono mostrati come un'intestazione seguita da un elenco puntato. Ogni punto mostra il titolo della pagina, l'URL collegato della documentazione e un breve frammento nella riga successiva. I risultati vuoti stampano "Nessun risultato.".

Nell'output non avanzato (pipe, `--no-color`, script), gli stessi dati vengono mostrati come Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Codici di uscita

| Codice | Significato                                                             |
| ------ | ----------------------------------------------------------------------- |
| `0`    | Ricerca riuscita (incluse le risposte senza risultati).                 |
| `1`    | La chiamata all'API di ricerca della documentazione ospitata non è riuscita; stderr viene stampato inline. |

## Correlati

- [Riferimento CLI](/it/cli)
- [Documentazione live](https://docs.openclaw.ai)
