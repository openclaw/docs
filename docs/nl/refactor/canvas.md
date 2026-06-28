---
read_when:
    - Canvas-host, hulpmiddelen, commando's, documentatie of protocol-eigenaarschap verplaatsen
    - Controleren of Canvas nog steeds eigendom is van de core
    - De experimentele Canvas Plugin-PR voorbereiden of beoordelen
summary: Plan en auditchecklist voor het verplaatsen van Canvas uit de kern naar een gebundelde experimentele Plugin.
title: Herstructurering van de Canvas Plugin
x-i18n:
    generated_at: "2026-05-07T13:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Refactor van de Canvas-Plugin

Canvas wordt weinig gebruikt en is experimenteel. Behandel het als een gebundelde Plugin, niet als een kernfunctie. De core mag generieke Gateway-, Node-, HTTP-, authenticatie-, configuratie- en native-client-bedrading behouden, maar Canvas-specifiek gedrag moet onder `extensions/canvas` staan.

## Doel

Verplaats het eigenaarschap van Canvas naar `extensions/canvas` en behoud daarbij het huidige gedrag met gekoppelde nodes:

- de agentgerichte `canvas`-tool wordt geregistreerd door de Canvas-Plugin
- Canvas-nodecommando's zijn alleen toegestaan wanneer de Canvas-Plugin ze registreert
- A2UI-host-/bronbestanden staan onder de Canvas-Plugin
- Canvas-documentmaterialisatie staat onder de Canvas-Plugin
- de implementatie van CLI-commando's staat onder de Canvas-Plugin, of delegeert via een Plugin-eigen runtime-barrel
- documentatie en Plugin-inventaris beschrijven Canvas als experimenteel en Plugin-ondersteund

## Geen doelen

- Ontwerp de Canvas-UI van de native app niet opnieuw in deze refactor.
- Verwijder geen ondersteuning voor het Canvas-protocol/de Canvas-client uit iOS, Android of macOS, tenzij een afzonderlijke productbeslissing zegt dat Canvas moet worden verwijderd.
- Bouw geen breed Plugin-serviceframework alleen voor Canvas, tenzij minstens één andere gebundelde Plugin dezelfde seam nodig heeft.

## Huidige branchstatus

Gereed:

- Gebundeld Plugin-pakket toegevoegd in `extensions/canvas`.
- `extensions/canvas/openclaw.plugin.json` toegevoegd.
- De agenttool `canvas` verplaatst van `src/agents/tools/canvas-tool.ts` naar `extensions/canvas/src/tool.ts`.
- Core-registratie van `createCanvasTool` verwijderd uit `src/agents/openclaw-tools.ts`.
- Canvas-hostimplementatie verplaatst van `src/canvas-host` naar `extensions/canvas/src/host`.
- `extensions/canvas/runtime-api.ts` behouden als de Plugin-eigen compatibiliteitsbarrel voor tests, packaging en externe publieke Canvas-helpers.
- Canvas-documentmaterialisatie verplaatst van `src/gateway/canvas-documents.ts` naar `extensions/canvas/src/documents.ts`.
- Canvas CLI-implementatie en A2UI JSONL-helpers verplaatst naar `extensions/canvas/src/cli.ts`.
- Canvas-host-URL en scoped capability-helpers verplaatst naar `extensions/canvas/src`.
- Standaarden voor Canvas-nodecommando's verplaatst uit hardgecodeerde corelijsten naar Plugin-`nodeInvokePolicies`.
- Plugin-eigen Canvas-hostconfiguratie toegevoegd op `plugins.entries.canvas.config.host`.
- Canvas- en A2UI-HTTP-serving achter registratie van HTTP-routes door de Canvas-Plugin geplaatst.
- Generieke Plugin-WebSocket-upgrade-dispatch toegevoegd voor Plugin-eigen HTTP-routes.
- Canvas-specifieke Gateway-host-URL en node-capability-authenticatie vervangen door generieke gehoste Plugin-surface- en node-capability-helpers.
- Plugin-eigen resolvers voor gehoste media toegevoegd, zodat Canvas-document-URL's via de Canvas-Plugin worden opgelost in plaats van dat core Canvas-documentinternals importeert.
- `api.registerNodeCliFeature(...)` toegevoegd, zodat Canvas `openclaw nodes canvas` kan declareren als een Plugin-eigen nodefunctie zonder het bovenliggende commandopad handmatig uit te schrijven.
- Productie-imports van `extensions/canvas/runtime-api.js` in `src/**` verwijderd.
- De A2UI-bundelbron verplaatst van `apps/shared/OpenClawKit/Tools/CanvasA2UI` naar `extensions/canvas/src/host/a2ui-app`.
- A2UI-build-/kopieerimplementatie verplaatst onder `extensions/canvas/scripts` en root-buildbedrading vervangen door generieke asset-hooks voor gebundelde Plugins.
- De legacy runtime-alias `canvasHost` op topniveau verwijderd.
- De Canvas-doctor-migratie behouden, zodat `openclaw doctor --fix` oude `canvasHost`-configuraties herschrijft naar `plugins.entries.canvas.config.host`.
- Compatibiliteit met het Canvas-protocol voor oude agents achter Gateway-protocol v4 verwijderd. Native clients en Gateways gebruiken nu alleen `pluginSurfaceUrls.canvas` plus `node.pluginSurface.refresh`; het verouderde pad `canvasHostUrl`, `canvasCapability` en `node.canvas.capability.refresh` wordt in deze experimentele refactor bewust niet ondersteund.
- Gegenereerde Plugin-inventaris bijgewerkt om Canvas op te nemen.
- Plugin-referentiedocumentatie toegevoegd op `docs/plugins/reference/canvas.md`.

Bekende resterende Canvas-surfaces die nog door core worden beheerd:

- Canvas-handlers van native apps onder `apps/` gebruiken nog bewust de Canvas-Plugin-surface
- Canvas-protocol-/clienthandlers van native apps onder `apps/`
- gepubliceerde artifact-output gebruikt nog `dist/canvas-host/a2ui` voor achterwaarts compatibele runtime-lookup, maar de kopieerstap is nu Plugin-eigen

## Doelvorm

`extensions/canvas` moet eigenaar zijn van:

- Plugin-manifest en pakketmetadata
- registratie van agenttool
- beleid voor node-invoke-commando's
- Canvas-host en A2UI-runtime
- Canvas A2UI-bundelbron en asset-build-/kopieerscripts
- Canvas-documentcreatie en assetresolutie
- Canvas CLI-implementatie
- Canvas-documentatiepagina en Plugin-inventarisitem

Core moet alleen eigenaar zijn van generieke seams:

- Plugin-detectie en -registratie
- generiek register voor agenttools
- generiek register voor node-invoke-beleid
- generieke Gateway-HTTP/authenticatie en WebSocket-upgrade-dispatch
- generieke URL-resolutie voor gehoste Plugin-surfaces
- generieke registratie van gehoste-media-resolvers
- generiek node-capability-transport
- generieke configuratiebedrading
- generieke ontdekking van asset-hooks voor gebundelde Plugins

Native apps mogen Canvas-commandhandlers behouden als clients van het protocol. Zij zijn niet de eigenaar van de Plugin-runtime.

## Migratiestappen

1. Behandel `plugins.entries.canvas.config.host` als de Plugin-eigen configuratiesurface.
2. Werk de documentatie bij zodat Canvas wordt beschreven als een experimentele gebundelde Plugin.
3. Voer gerichte Canvas-tests, Plugin-inventariscontroles, Plugin SDK API-controles en build-/typegates uit die door runtimegrenzen worden geraakt.

## Auditchecklist

Voordat de refactor als compleet wordt beschouwd:

- `rg "src/canvas-host|../canvas-host"` retourneert geen live bronimporten.
- `rg "canvas-tool|createCanvasTool" src` vindt geen Canvas-toolimplementatie die door core wordt beheerd.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` vindt geen hardgecodeerde allowlist-standaarden buiten generieke tests voor Plugin-beleid.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` is leeg.
- `rg "canvas-documents" src` is leeg.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` is leeg; de Canvas-Plugin registreert `openclaw nodes canvas` via geneste Plugin CLI-metadata.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` retourneert geen Gateway-runtime-eigenaarschap.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` vindt alleen compatibiliteitswrappers of Plugin-eigen paden.
- `pnpm plugins:inventory:check` slaagt.
- `pnpm plugin-sdk:api:check` slaagt, of gegenereerde API-baselines zijn bewust bijgewerkt en beoordeeld.
- Gerichte Canvas-tests slagen.
- Changed-lanes-tests slagen voor Canvas-host-/A2UI-paden.
- De PR-body zegt expliciet dat Canvas experimenteel en Plugin-ondersteund is.

## Verificatiecommando's

Gebruik gerichte lokale controles tijdens het itereren:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Voer `pnpm build` uit vóór push als runtime-barrel, lazy import, packaging of gepubliceerde Plugin-surfaces veranderen.
