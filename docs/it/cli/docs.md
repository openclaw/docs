---
read_when:
    - Vuoi cercare nella documentazione aggiornata di OpenClaw dal terminale
    - Devi sapere quale API di ricerca in hosting chiama la CLI della documentazione
summary: Riferimento CLI per `openclaw docs` (cerca nell'indice della documentazione online)
title: Documentazione
x-i18n:
    generated_at: "2026-07-12T06:53:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cerca nell'indice aggiornato della documentazione di OpenClaw dal terminale.

## Utilizzo

```bash
openclaw docs                       # mostra il punto di accesso alla documentazione e un esempio di ricerca
openclaw docs <query...>            # cerca nell'indice aggiornato della documentazione
```

| Argomento    | Descrizione                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `[query...]` | Query di ricerca in formato libero. Le query composte da più parole vengono unite con spazi e inviate come un'unica query. |

Se non viene specificata alcuna query, `openclaw docs` mostra l'URL del punto di accesso alla documentazione e un comando di ricerca di esempio anziché eseguire una ricerca.

## Esempi

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Funzionamento

`openclaw docs` chiama `https://docs.openclaw.ai/api/search` e visualizza i risultati JSON. La richiesta di ricerca utilizza un timeout fisso di 30 secondi.

## Output

In un terminale avanzato (TTY), i risultati vengono visualizzati come un'intestazione seguita da un elenco puntato: titolo della pagina, URL collegato della documentazione e un breve estratto nella riga successiva. Se non ci sono risultati, viene mostrato "Nessun risultato.".

Nell'output non avanzato (reindirizzato tramite pipe, `--no-color`, script), gli stessi dati vengono visualizzati in Markdown:

```markdown
# Ricerca nella documentazione: <query>

- [Titolo](https://docs.openclaw.ai/...) - estratto
- [Titolo](https://docs.openclaw.ai/...) - estratto
```

## Codici di uscita

| Codice | Significato                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `0`    | Ricerca completata correttamente, incluse le risposte senza risultati.                                  |
| `1`    | La chiamata all'API ospitata per la ricerca nella documentazione non è riuscita; stderr mostra il messaggio di errore. |

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Documentazione aggiornata](https://docs.openclaw.ai)
