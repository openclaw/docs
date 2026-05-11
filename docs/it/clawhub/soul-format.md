---
read_when:
    - Pubblicazione delle anime
    - Debug degli errori di pubblicazione di soul
summary: Formato del bundle Soul, file richiesti, limiti.
x-i18n:
    generated_at: "2026-05-11T20:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Formato soul

## Su disco

Un soul è un singolo file:

- `SOUL.md` (o `soul.md`)

Per ora, onlycrabs.ai rifiuta eventuali file aggiuntivi.

## `SOUL.md`

- Markdown con frontmatter YAML facoltativo.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` viene usato come riepilogo del soul nell'UI/ricerca.

## Limiti

- Dimensione totale del bundle: 50 MB.
- Il testo per gli embedding include solo `SOUL.md`.

## Slug

- Derivati per impostazione predefinita dal nome della cartella.
- Devono essere minuscoli e sicuri per gli URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è comunemente usato.
