---
doc-schema-version: 1
read_when:
    - Vuoi trovare Plugin di terze parti per OpenClaw
    - Vuoi pubblicare o inserire il tuo Plugin su ClawHub
summary: Trova e pubblica Plugin OpenClaw gestiti dalla community
title: Plugin della community
x-i18n:
    generated_at: "2026-07-12T07:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

I plugin della community sono pacchetti di terze parti che estendono OpenClaw con
canali, strumenti, provider, hook o altre funzionalità. Usa
[ClawHub](/clawhub) come principale punto di riferimento per trovare i plugin
pubblici della community.

## Trovare i plugin

Cerca su ClawHub dalla CLI:

```bash
openclaw plugins search "calendar"
```

Installa un plugin di ClawHub con un prefisso di origine esplicito:

```bash
openclaw plugins install clawhub:<package-name>
```

Durante la transizione del lancio, npm rimane un metodo supportato per
l'installazione diretta:

```bash
openclaw plugins install npm:<package-name>
```

Consulta [Gestire i plugin](/it/plugins/manage-plugins) per esempi comuni di
installazione, aggiornamento, ispezione e disinstallazione. Consulta
[`openclaw plugins`](/it/cli/plugins) per il riferimento completo dei comandi e
le regole di selezione dell'origine.

## Pubblicare i plugin

Pubblica i plugin pubblici della community su ClawHub, affinché gli utenti di
OpenClaw possano trovarli e installarli. ClawHub gestisce l'elenco aggiornato
dei pacchetti, la cronologia delle versioni, lo stato della scansione e i
suggerimenti per l'installazione; la documentazione non mantiene un catalogo
statico dei plugin di terze parti.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Prima della pubblicazione, assicurati che il plugin disponga dei metadati del
pacchetto, di un manifest del plugin, della documentazione per la
configurazione e di un responsabile della manutenzione chiaramente
identificato. Prima di creare una versione, ClawHub convalida l'ambito del
proprietario, il nome e la versione del pacchetto, i limiti dei file e i
metadati dell'origine; mantiene quindi le nuove versioni nascoste dalle
normali interfacce di installazione e download fino al completamento della
revisione e della verifica.

Elenco di controllo prima della pubblicazione:

| Requisito                    | Motivo                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| Pubblicato su ClawHub        | I suggerimenti di `openclaw plugins install` devono funzionare    |
| Repository GitHub pubblico   | Revisione del codice sorgente, tracciamento dei problemi, trasparenza |
| Documentazione di configurazione e utilizzo | Gli utenti devono sapere come configurarlo              |
| Manutenzione attiva          | Aggiornamenti recenti o gestione tempestiva dei problemi          |

Contratto completo per la pubblicazione:

- [Pubblicazione su ClawHub](/it/clawhub/publishing) - proprietari, ambiti,
  versioni, revisione, convalida e trasferimento dei pacchetti
- [Creazione dei plugin](/it/plugins/building-plugins) - la struttura del
  pacchetto del plugin e il flusso di lavoro per la prima pubblicazione
- [Manifest del plugin](/it/plugins/manifest) - campi del manifest nativo del
  plugin

## Contenuti correlati

- [Plugin](/it/tools/plugin) - installazione, configurazione, riavvio e
  risoluzione dei problemi
- [Gestire i plugin](/it/plugins/manage-plugins) - esempi di comandi
- [Pubblicazione su ClawHub](/it/clawhub/publishing) - regole per la
  pubblicazione e le versioni
