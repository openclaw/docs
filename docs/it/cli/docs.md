---
read_when:
    - Vuoi cercare nella documentazione live di OpenClaw dal terminale
    - È necessario sapere quali binari di supporto la CLI della documentazione invoca tramite shell
summary: Riferimento CLI per `openclaw docs` (cerca nell'indice live della documentazione)
title: Documentazione
x-i18n:
    generated_at: "2026-05-10T19:28:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cerca l'indice della documentazione live di OpenClaw dal terminale. Il comando richiama l'endpoint pubblico di ricerca MCP della documentazione ospitata su Mintlify all'indirizzo `https://docs.openclaw.ai/mcp.SearchOpenClaw` e mostra i risultati nel terminale.

## Utilizzo

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argomenti:

| Argomento    | Descrizione                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `[query...]` | Query di ricerca in formato libero. Le query con più parole vengono unite con spazi e inviate come una sola. |

## Esempi

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Senza query, `openclaw docs` stampa l'URL del punto di ingresso della documentazione più un comando di ricerca di esempio, invece di eseguire una ricerca.

## Come funziona

`openclaw docs` invoca la CLI `mcporter` per chiamare lo strumento MCP di ricerca della documentazione, quindi analizza i blocchi `Title: / Link: / Content:` dall'output dello strumento in un elenco di risultati.

Per risolvere `mcporter`, OpenClaw controlla nell'ordine:

1. `mcporter` su `PATH` (usato direttamente se presente).
2. `pnpm dlx mcporter ...` se `pnpm` è installato.
3. `npx -y mcporter ...` se `npx` è installato.

Se nessuno è disponibile, il comando fallisce con un suggerimento per installare `pnpm` (`npm install -g pnpm`).

La chiamata di ricerca usa un timeout fisso di 30 secondi. Gli estratti dei risultati vengono troncati a circa 220 caratteri per voce.

## Output

In un terminale avanzato (TTY), i risultati vengono mostrati come un'intestazione seguita da un elenco puntato. Ogni punto mostra il titolo della pagina, l'URL collegato della documentazione e un breve estratto nella riga successiva. I risultati vuoti stampano "Nessun risultato.".

Nell'output non avanzato (reindirizzato tramite pipe, `--no-color`, script), gli stessi dati vengono mostrati come Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Codici di uscita

| Codice | Significato                                                        |
| ------ | ------------------------------------------------------------------ |
| `0`    | Ricerca riuscita (incluse le risposte con zero risultati).         |
| `1`    | La chiamata allo strumento MCP non è riuscita; stderr viene stampato inline. |

## Correlati

- [Riferimento CLI](/it/cli)
- [Documentazione live](https://docs.openclaw.ai)
