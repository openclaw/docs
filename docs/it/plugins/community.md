---
doc-schema-version: 1
read_when:
    - Vuoi trovare Plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo Plugin su ClawHub
summary: Trova e pubblica Plugin OpenClaw mantenuti dalla community
title: Plugin della community
x-i18n:
    generated_at: "2026-06-27T17:48:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con canali,
strumenti, provider, hook o altre funzionalità. Usa [ClawHub](/it/clawhub) come
superficie principale di scoperta per i plugin pubblici della community.

## Trova plugin

Cerca in ClawHub dalla CLI:

```bash
openclaw plugins search "calendar"
```

Installa un plugin ClawHub con un prefisso di origine esplicito:

```bash
openclaw plugins install clawhub:<package-name>
```

npm rimane un percorso di installazione diretta supportato durante la transizione di lancio:

```bash
openclaw plugins install npm:<package-name>
```

Usa [Gestire i plugin](/it/plugins/manage-plugins) per esempi comuni di installazione, aggiornamento,
ispezione e disinstallazione. Usa [`openclaw plugins`](/it/cli/plugins) per il
riferimento completo dei comandi e le regole di selezione dell'origine.

## Pubblica plugin

Pubblica i plugin pubblici della community su ClawHub quando vuoi che gli utenti di OpenClaw li
scoprano e li installino. ClawHub gestisce l'elenco live dei pacchetti, la cronologia delle
release, lo stato di scansione e i suggerimenti di installazione; la documentazione non mantiene un catalogo
statico di plugin di terze parti.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Prima della pubblicazione, assicurati che il plugin abbia metadati del pacchetto, un manifesto del plugin,
documentazione di configurazione e un proprietario della manutenzione chiaro. ClawHub convalida l'ambito del proprietario,
il nome del pacchetto, la versione, i limiti dei file e i metadati dell'origine prima di creare una
release, quindi mantiene le nuove release nascoste dalle normali superfici di installazione e download
finché revisione e verifica non sono completate.

Usa questa checklist prima di pubblicare:

| Requisito            | Perché                                              |
| -------------------- | --------------------------------------------------- |
| Pubblicato su ClawHub | Gli utenti hanno bisogno che i suggerimenti di `openclaw plugins install` funzionino |
| Repository GitHub pubblico | Revisione del sorgente, tracciamento dei problemi, trasparenza |
| Documentazione di configurazione e uso | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva  | Aggiornamenti recenti o gestione reattiva dei problemi |

Usa queste pagine per il contratto completo di pubblicazione:

- [Pubblicazione su ClawHub](/it/clawhub/publishing) spiega proprietari, ambiti, release,
  revisione, convalida dei pacchetti e trasferimento dei pacchetti.
- [Creazione di plugin](/it/plugins/building-plugins) mostra la struttura del pacchetto plugin
  e il primo flusso di pubblicazione.
- [Manifesto del plugin](/it/plugins/manifest) definisce i campi del manifesto del plugin nativo.

## Correlati

- [Plugin](/it/tools/plugin) - installazione, configurazione, riavvio e risoluzione dei problemi
- [Gestire i plugin](/it/plugins/manage-plugins) - esempi di comandi
- [Pubblicazione su ClawHub](/it/clawhub/publishing) - regole di pubblicazione e release
