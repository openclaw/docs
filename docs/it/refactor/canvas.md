---
read_when:
    - Trasferimento della proprietà dell'host Canvas, degli strumenti, dei comandi, della documentazione o del protocollo
    - Verifica se Canvas è ancora gestito dal core
    - Preparazione o revisione della PR del Plugin Canvas sperimentale
summary: Piano e lista di controllo per la verifica dello spostamento di Canvas dal core a un plugin sperimentale incluso.
title: Refactoring del plugin Canvas
x-i18n:
    generated_at: "2026-07-12T07:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactoring del plugin Canvas

Canvas è sperimentale e poco utilizzato. Trattalo come un plugin incluso, non come una funzionalità core. Il core può mantenere l'infrastruttura generica per Gateway, Node, HTTP, autenticazione, configurazione e client nativi, ma il comportamento specifico di Canvas deve risiedere in `extensions/canvas`.

## Obiettivo

Spostare la responsabilità di Canvas in `extensions/canvas`, preservando l'attuale comportamento dei nodi associati:

- lo strumento `canvas` rivolto all'agente viene registrato dal plugin Canvas
- i comandi del nodo Canvas sono consentiti solo quando il plugin Canvas li registra
- i file host/sorgente A2UI risiedono nel plugin Canvas
- la materializzazione dei documenti Canvas risiede nel plugin Canvas
- l'implementazione del comando CLI risiede nel plugin Canvas oppure delega tramite un barrel di runtime di proprietà del plugin
- la documentazione e l'inventario dei plugin descrivono Canvas come sperimentale e basato su plugin

## Non obiettivi

- Non riprogettare l'interfaccia utente Canvas dell'app nativa durante questo refactoring.
- Non rimuovere il supporto del protocollo/client Canvas da iOS, Android o macOS, a meno che una decisione di prodotto separata non stabilisca l'eliminazione di Canvas.
- Non creare un framework generale di servizi per plugin esclusivamente per Canvas, a meno che almeno un altro plugin incluso non necessiti della stessa interfaccia.

## Stato attuale del branch

Completato:

- Aggiunto il pacchetto del plugin incluso in `extensions/canvas`.
- Aggiunto `extensions/canvas/openclaw.plugin.json`.
- Spostato lo strumento `canvas` dell'agente da `src/agents/tools/canvas-tool.ts` a `extensions/canvas/src/tool.ts`.
- Rimossa la registrazione core di `createCanvasTool` da `src/agents/openclaw-tools.ts`.
- Spostata l'implementazione dell'host Canvas da `src/canvas-host` a `extensions/canvas/src/host`.
- Mantenuto `extensions/canvas/runtime-api.ts` come barrel di compatibilità di proprietà del plugin per test, pacchettizzazione e helper pubblici esterni di Canvas.
- Spostata la materializzazione dei documenti Canvas da `src/gateway/canvas-documents.ts` a `extensions/canvas/src/documents.ts`.
- Spostati l'implementazione della CLI Canvas e gli helper JSONL A2UI in `extensions/canvas/src/cli.ts`.
- Spostati in `extensions/canvas/src` l'URL dell'host Canvas e gli helper delle funzionalità con ambito definito.
- Spostate le impostazioni predefinite dei comandi del nodo Canvas fuori dagli elenchi core codificati direttamente e dentro `nodeInvokePolicies` del plugin.
- Aggiunta la configurazione dell'host Canvas di proprietà del plugin in `plugins.entries.canvas.config.host`.
- Spostata la distribuzione HTTP di Canvas e A2UI dietro la registrazione delle route HTTP del plugin Canvas.
- Aggiunto un instradamento generico degli upgrade WebSocket dei plugin per le route HTTP di proprietà dei plugin.
- Sostituiti l'URL dell'host Gateway specifico di Canvas e l'autorizzazione delle funzionalità del nodo con helper generici per le superfici dei plugin ospitati e le funzionalità dei nodi.
- Aggiunti resolver multimediali ospitati di proprietà del plugin, affinché gli URL dei documenti Canvas vengano risolti tramite il plugin Canvas anziché mediante l'importazione nel core degli elementi interni dei documenti Canvas.
- Aggiunto `api.registerNodeCliFeature(...)`, affinché Canvas possa dichiarare `openclaw nodes canvas` come funzionalità del nodo di proprietà del plugin senza specificare manualmente il percorso del comando padre.
- Rimossi gli import di produzione di `extensions/canvas/runtime-api.js` da `src/**`.
- Spostato il sorgente del bundle A2UI da `apps/shared/OpenClawKit/Tools/CanvasA2UI` a `extensions/canvas/src/host/a2ui-app`.
- Spostata l'implementazione di compilazione/copia di A2UI in `extensions/canvas/scripts` e sostituito il collegamento della compilazione radice con hook generici per le risorse dei plugin inclusi.
- Rimosso l'alias di configurazione legacy di primo livello `canvasHost` dal runtime.
- Mantenuta la migrazione Canvas del comando doctor, affinché `openclaw doctor --fix` riscriva le vecchie configurazioni `canvasHost` in `plugins.entries.canvas.config.host`.
- Rimossa la compatibilità del protocollo Canvas per agenti precedenti con il protocollo Gateway v4. I client nativi e i Gateway ora utilizzano esclusivamente `pluginSurfaceUrls.canvas` insieme a `node.pluginSurface.refresh`; il percorso deprecato `canvasHostUrl`, `canvasCapability` e `node.canvas.capability.refresh` non è intenzionalmente supportato in questo refactoring sperimentale.
- Aggiornato l'inventario generato dei plugin per includere Canvas.
- Aggiunta la documentazione di riferimento del plugin in `docs/plugins/reference/canvas.md`.

Superfici Canvas note ancora di proprietà del core:

- i gestori Canvas dell'app nativa in `apps/` continuano intenzionalmente a utilizzare la superficie del plugin Canvas
- i gestori del protocollo/client Canvas dell'app nativa in `apps/`
- l'output degli artefatti pubblicati utilizza ancora `dist/canvas-host/a2ui` per la ricerca retrocompatibile in fase di runtime, ma il passaggio di copia è ora di proprietà del plugin

## Struttura prevista

`extensions/canvas` deve possedere:

- manifest del plugin e metadati del pacchetto
- registrazione dello strumento dell'agente
- criterio dei comandi di invocazione del nodo
- host Canvas e runtime A2UI
- sorgente del bundle A2UI di Canvas e script di compilazione/copia delle risorse
- creazione dei documenti Canvas e risoluzione delle risorse
- implementazione della CLI Canvas
- pagina della documentazione Canvas e voce nell'inventario dei plugin

Il core deve possedere solo interfacce generiche:

- rilevamento e registrazione dei plugin
- registro generico degli strumenti dell'agente
- registro generico dei criteri di invocazione dei nodi
- HTTP/autenticazione generici del Gateway e instradamento degli upgrade WebSocket
- risoluzione generica degli URL delle superfici dei plugin ospitati
- registrazione generica dei resolver multimediali ospitati
- trasporto generico delle funzionalità dei nodi
- infrastruttura generica di configurazione
- rilevamento generico degli hook delle risorse dei plugin inclusi

Le app native possono mantenere i gestori dei comandi Canvas come client del protocollo. Non sono proprietarie del runtime del plugin.

## Passaggi della migrazione

1. Trattare `plugins.entries.canvas.config.host` come superficie di configurazione di proprietà del plugin.
2. Aggiornare la documentazione affinché Canvas sia descritto come plugin incluso sperimentale.
3. Eseguire test mirati di Canvas, controlli dell'inventario dei plugin, controlli dell'API SDK dei plugin e i gate di compilazione/tipizzazione interessati dai confini del runtime.

## Lista di controllo dell'audit

Prima di considerare completato il refactoring:

- `rg "src/canvas-host|../canvas-host"` non restituisce import attivi nel codice sorgente.
- `rg "canvas-tool|createCanvasTool" src` non trova implementazioni dello strumento Canvas di proprietà del core.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` non trova impostazioni predefinite di elenchi di elementi consentiti codificate direttamente al di fuori dei test generici dei criteri dei plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` non restituisce risultati.
- `rg "canvas-documents" src` non restituisce risultati.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` non restituisce risultati; il plugin Canvas registra `openclaw nodes canvas` tramite metadati CLI annidati del plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` non restituisce proprietà del runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` trova solo wrapper di compatibilità o percorsi di proprietà del plugin.
- `pnpm plugins:inventory:check` viene completato correttamente.
- `pnpm plugin-sdk:api:check` viene completato correttamente, oppure le baseline dell'API generate vengono aggiornate e revisionate intenzionalmente.
- I test mirati di Canvas vengono completati correttamente.
- I test delle corsie modificate vengono completati correttamente per i percorsi host Canvas/A2UI.
- Il corpo della PR dichiara esplicitamente che Canvas è sperimentale e basato su plugin.

## Comandi di verifica

Utilizzare controlli locali mirati durante l'iterazione:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Eseguire `pnpm build` prima del push se cambiano il barrel del runtime, gli import differiti, la pacchettizzazione o le superfici pubblicate del plugin.
