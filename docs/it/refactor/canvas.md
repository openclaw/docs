---
read_when:
    - Spostamento della proprietà dell'host, degli strumenti, dei comandi, della documentazione o del protocollo di Canvas
    - Verifica se Canvas è ancora di proprietà del core
    - Preparazione o revisione della PR del Plugin Canvas sperimentale
summary: Piano e checklist di audit per spostare Canvas dal core a un Plugin sperimentale incluso.
title: Refactoring del Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Refactoring del Plugin Canvas

Canvas è poco usato e sperimentale. Trattalo come un Plugin in bundle, non come una funzionalità core. Il core può mantenere l’impianto generico di Gateway, Node, HTTP, auth, config e client nativo, ma il comportamento specifico di Canvas dovrebbe vivere sotto `extensions/canvas`.

## Obiettivo

Spostare la proprietà di Canvas in `extensions/canvas` preservando l’attuale comportamento del nodo abbinato:

- lo strumento `canvas` rivolto all’agente è registrato dal Plugin Canvas
- i comandi del nodo Canvas sono consentiti solo quando il Plugin Canvas li registra
- i file host/source A2UI vivono sotto il Plugin Canvas
- la materializzazione dei documenti Canvas vive sotto il Plugin Canvas
- l’implementazione del comando CLI vive sotto il Plugin Canvas, oppure delega tramite un barrel runtime di proprietà del Plugin
- la documentazione e l’inventario dei Plugin descrivono Canvas come sperimentale e supportato da Plugin

## Non obiettivi

- Non riprogettare l’interfaccia utente Canvas dell’app nativa in questo refactoring.
- Non rimuovere il supporto protocollo/client Canvas da iOS, Android o macOS a meno che una decisione di prodotto separata dica che Canvas deve essere eliminato.
- Non costruire un ampio framework di servizi Plugin solo per Canvas, a meno che almeno un altro Plugin in bundle non abbia bisogno della stessa cucitura.

## Stato attuale del branch

Fatto:

- Aggiunto il pacchetto Plugin in bundle in `extensions/canvas`.
- Aggiunto `extensions/canvas/openclaw.plugin.json`.
- Spostato lo strumento agente `canvas` da `src/agents/tools/canvas-tool.ts` a `extensions/canvas/src/tool.ts`.
- Rimossa la registrazione core di `createCanvasTool` da `src/agents/openclaw-tools.ts`.
- Spostata l’implementazione dell’host Canvas da `src/canvas-host` a `extensions/canvas/src/host`.
- Mantenuto `extensions/canvas/runtime-api.ts` come barrel di compatibilità di proprietà del Plugin per test, packaging e helper Canvas pubblici esterni.
- Spostata la materializzazione dei documenti Canvas da `src/gateway/canvas-documents.ts` a `extensions/canvas/src/documents.ts`.
- Spostata l’implementazione CLI Canvas e gli helper JSONL A2UI in `extensions/canvas/src/cli.ts`.
- Spostati l’URL host Canvas e gli helper di capability con ambito in `extensions/canvas/src`.
- Spostati i default dei comandi nodo Canvas fuori dagli elenchi core hardcoded e dentro `nodeInvokePolicies` del Plugin.
- Aggiunta la configurazione host Canvas di proprietà del Plugin in `plugins.entries.canvas.config.host`.
- Spostato il serving HTTP di Canvas e A2UI dietro la registrazione delle route HTTP del Plugin Canvas.
- Aggiunto dispatch generico dell’upgrade WebSocket dei Plugin per route HTTP di proprietà dei Plugin.
- Sostituiti l’URL host Gateway specifico di Canvas e l’autorizzazione capability del nodo con una superficie Plugin ospitata generica e helper capability del nodo.
- Aggiunti resolver dei media ospitati di proprietà del Plugin, così gli URL dei documenti Canvas si risolvono tramite il Plugin Canvas invece che tramite import core degli internals dei documenti Canvas.
- Aggiunto `api.registerNodeCliFeature(...)` così Canvas può dichiarare `openclaw nodes canvas` come funzionalità nodo di proprietà del Plugin senza scrivere manualmente il percorso del comando padre.
- Rimossi gli import di produzione `src/**` di `extensions/canvas/runtime-api.js`.
- Spostato il sorgente del bundle A2UI da `apps/shared/OpenClawKit/Tools/CanvasA2UI` a `extensions/canvas/src/host/a2ui-app`.
- Spostata l’implementazione build/copy A2UI sotto `extensions/canvas/scripts` e sostituito il wiring di build root con hook asset generici dei Plugin in bundle.
- Rimosso l’alias runtime legacy di configurazione top-level `canvasHost`.
- Mantenuta la migrazione doctor di Canvas così `openclaw doctor --fix` riscrive le vecchie configurazioni `canvasHost` in `plugins.entries.canvas.config.host`.
- Rimossa la compatibilità del protocollo Canvas per vecchi agenti dietro Gateway protocol v4. I client nativi e i Gateway ora usano solo `pluginSurfaceUrls.canvas` più `node.pluginSurface.refresh`; il percorso deprecato `canvasHostUrl`, `canvasCapability` e `node.canvas.capability.refresh` è intenzionalmente non supportato in questo refactoring sperimentale.
- Aggiornato l’inventario dei Plugin generato per includere Canvas.
- Aggiunta la documentazione di riferimento del Plugin in `docs/plugins/reference/canvas.md`.

Superfici Canvas note che restano di proprietà core:

- gli handler Canvas dell’app nativa sotto `apps/` consumano ancora intenzionalmente la superficie del Plugin Canvas
- gli handler protocollo/client Canvas dell’app nativa sotto `apps/`
- l’output degli artefatti pubblicati usa ancora `dist/canvas-host/a2ui` per lookup runtime compatibile all’indietro, ma lo step di copia ora è di proprietà del Plugin

## Forma target

`extensions/canvas` dovrebbe possedere:

- manifest del Plugin e metadati del pacchetto
- registrazione dello strumento agente
- policy dei comandi invoke del nodo
- host Canvas e runtime A2UI
- sorgente del bundle Canvas A2UI e script di build/copy degli asset
- creazione dei documenti Canvas e risoluzione degli asset
- implementazione CLI Canvas
- pagina docs Canvas e voce dell’inventario Plugin

Il core dovrebbe possedere solo cuciture generiche:

- scoperta e registrazione dei Plugin
- registro generico degli strumenti agente
- registro generico delle policy invoke del nodo
- dispatch generico di HTTP/auth e upgrade WebSocket del Gateway
- risoluzione generica degli URL delle superfici Plugin ospitate
- registrazione generica dei resolver dei media ospitati
- trasporto generico delle capability del nodo
- impianto generico di configurazione
- scoperta generica degli hook asset dei Plugin in bundle

Le app native possono mantenere gli handler dei comandi Canvas come client del protocollo. Non sono proprietarie del runtime del Plugin.

## Passaggi di migrazione

1. Tratta `plugins.entries.canvas.config.host` come superficie di configurazione di proprietà del Plugin.
2. Aggiorna la documentazione così Canvas è descritto come Plugin sperimentale in bundle.
3. Esegui test Canvas mirati, controlli dell’inventario Plugin, controlli API del Plugin SDK e gate di build/tipi influenzati dai confini runtime.

## Checklist di audit

Prima di considerare completo il refactoring:

- `rg "src/canvas-host|../canvas-host"` non restituisce import sorgente live.
- `rg "canvas-tool|createCanvasTool" src` non trova implementazioni dello strumento Canvas di proprietà core.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` non trova default allowlist hardcoded fuori dai test generici delle policy Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` è vuoto.
- `rg "canvas-documents" src` è vuoto.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` è vuoto; il Plugin Canvas registra `openclaw nodes canvas` tramite metadati CLI Plugin annidati.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` non restituisce proprietà runtime del Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` trova solo wrapper di compatibilità o percorsi di proprietà del Plugin.
- `pnpm plugins:inventory:check` passa.
- `pnpm plugin-sdk:api:check` passa, oppure le baseline API generate sono aggiornate e revisionate intenzionalmente.
- I test Canvas mirati passano.
- I test delle changed-lanes passano per i percorsi host/A2UI Canvas.
- Il corpo della PR dice esplicitamente che Canvas è sperimentale e supportato da Plugin.

## Comandi di verifica

Usa controlli locali mirati durante l’iterazione:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Esegui `pnpm build` prima del push se cambiano il barrel runtime, import lazy, packaging o superfici Plugin pubblicate.
