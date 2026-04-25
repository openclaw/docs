---
read_when:
    - Mantieni un Plugin OpenClaw
    - Vedi un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK del Plugin o del manifest
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene i contratti dei Plugin meno recenti instradati tramite adapter di compatibilità con nome prima di rimuoverli. Questo protegge i Plugin esistenti, sia integrati sia esterni, mentre i contratti di SDK, manifest, setup, configurazione e runtime dell'agente evolvono.

## Registro di compatibilità

I contratti di compatibilità dei Plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record ha:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, configurazione, setup, canale, provider, esecuzione del Plugin, runtime dell'agente o core
- date di introduzione e deprecazione, quando applicabili
- indicazioni sulla sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per i futuri controlli del plugin inspector. Se un comportamento esposto ai Plugin cambia, aggiungi o aggiorna il record di compatibilità nello stesso cambiamento che aggiunge l'adapter.

## Pacchetto plugin inspector

Il plugin inspector dovrebbe trovarsi fuori dal repo core di OpenClaw come pacchetto/repository separato supportato dai contratti versionati di compatibilità e manifest.

La CLI del primo giorno dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione del manifest/schema
- la versione di compatibilità del contratto che viene controllata
- controlli dei metadati di installazione/origine
- controlli di import del percorso cold-path
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile leggibile dalle macchine nelle annotazioni CI. Il core di OpenClaw dovrebbe esporre contratti e fixture che l'inspector può usare, ma non dovrebbe pubblicare il binario inspector dal pacchetto principale `openclaw`.

## Policy di deprecazione

OpenClaw non dovrebbe rimuovere un contratto Plugin documentato nella stessa release che introduce il suo sostituto.

La sequenza di migrazione è:

1. Aggiungere il nuovo contratto.
2. Mantenere il vecchio comportamento instradato tramite un adapter di compatibilità con nome.
3. Emettere diagnostica o avvisi quando gli autori di Plugin possono intervenire.
4. Documentare il sostituto e la timeline.
5. Testare sia il percorso vecchio sia quello nuovo.
6. Attendere per tutta la finestra di migrazione annunciata.
7. Rimuovere solo con approvazione esplicita per release breaking.

I record deprecati devono includere una data di inizio dell'avviso, il sostituto, il link alla documentazione e la data di rimozione prevista, quando nota.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- import SDK legacy ampi come `openclaw/plugin-sdk/compat`
- forme di Plugin legacy basate solo su hook e `before_agent_start`
- comportamento di allowlist e abilitazione dei Plugin integrati
- metadati legacy del manifest per env var di provider/canale
- activation hints che vengono sostituiti dalla ownership dei contributi del manifest
- alias di denominazione `embeddedHarness` e `agent-harness` mentre la denominazione pubblica si sposta verso `agentRuntime`
- fallback dei metadati generati della configurazione dei canali integrati mentre arrivano i metadati `channelConfigs` registry-first
- l'env legacy di disabilitazione del registro dei Plugin persistito mentre i flussi di riparazione migrano gli operatori verso `openclaw plugins registry --refresh` e `openclaw doctor --fix`

Il nuovo codice dei Plugin dovrebbe preferire il sostituto elencato nel registro e nella guida di migrazione specifica. I Plugin esistenti possono continuare a usare un percorso di compatibilità finché documentazione, diagnostica e note di rilascio non annunciano una finestra di rimozione.

## Note di rilascio

Le note di rilascio dovrebbero includere le prossime deprecazioni dei Plugin con date previste e link alla documentazione di migrazione. Questo avviso deve comparire prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
