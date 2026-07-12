---
read_when:
    - Eigenaarschap van Canvas-host, tools, opdrachten, documentatie of protocol verplaatsen
    - Controleren of Canvas nog steeds onder kernbeheer valt
    - De experimentele Canvas-plugin-PR voorbereiden of beoordelen
summary: Plan- en auditchecklist voor het verplaatsen van Canvas uit de kern naar een gebundelde experimentele plugin.
title: Refactor van de Canvas-plugin
x-i18n:
    generated_at: "2026-07-12T09:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactor van de Canvas-plugin

Canvas wordt weinig gebruikt en is experimenteel. Behandel het als een gebundelde plugin, niet als een kernfunctie. De kern mag generieke infrastructuur voor de Gateway, Node, HTTP, authenticatie, configuratie en systeemeigen clients behouden, maar Canvas-specifiek gedrag hoort thuis onder `extensions/canvas`.

## Doel

Verplaats het eigenaarschap van Canvas naar `extensions/canvas` met behoud van het huidige gedrag voor gekoppelde Nodes:

- de agentgerichte `canvas`-tool wordt geregistreerd door de Canvas-plugin
- Canvas-Node-opdrachten zijn alleen toegestaan wanneer de Canvas-plugin ze registreert
- A2UI-host-/bronbestanden staan onder de Canvas-plugin
- de materialisatie van Canvas-documenten staat onder de Canvas-plugin
- de implementatie van CLI-opdrachten staat onder de Canvas-plugin of delegeert via een runtime-barrel waarvan de plugin eigenaar is
- de documentatie en plugininventaris beschrijven Canvas als experimenteel en door een plugin ondersteund

## Geen doelen

- Ontwerp de Canvas-UI van de systeemeigen app niet opnieuw in deze refactor.
- Verwijder geen ondersteuning voor Canvas-protocollen/-clients uit iOS, Android of macOS, tenzij in een afzonderlijke productbeslissing is bepaald dat Canvas moet worden verwijderd.
- Bouw niet alleen voor Canvas een breed framework voor pluginservices, tenzij minstens één andere gebundelde plugin dezelfde koppeling nodig heeft.

## Huidige status van de branch

Voltooid:

- Gebundeld pluginpakket toegevoegd in `extensions/canvas`.
- `extensions/canvas/openclaw.plugin.json` toegevoegd.
- De agenttool `canvas` verplaatst van `src/agents/tools/canvas-tool.ts` naar `extensions/canvas/src/tool.ts`.
- Kernregistratie van `createCanvasTool` verwijderd uit `src/agents/openclaw-tools.ts`.
- De Canvas-hostimplementatie verplaatst van `src/canvas-host` naar `extensions/canvas/src/host`.
- `extensions/canvas/runtime-api.ts` behouden als het plugin-eigen compatibiliteitsbarrel voor tests, pakkettering en externe openbare Canvas-helpers.
- De materialisatie van Canvas-documenten verplaatst van `src/gateway/canvas-documents.ts` naar `extensions/canvas/src/documents.ts`.
- De Canvas-CLI-implementatie en A2UI-JSONL-helpers verplaatst naar `extensions/canvas/src/cli.ts`.
- Helpers voor de Canvas-host-URL en afgebakende mogelijkheden verplaatst naar `extensions/canvas/src`.
- Standaardwaarden voor Canvas-Node-opdrachten uit hardgecodeerde kernlijsten verwijderd en naar `nodeInvokePolicies` van de plugin verplaatst.
- Plugin-eigen Canvas-hostconfiguratie toegevoegd bij `plugins.entries.canvas.config.host`.
- De HTTP-bediening van Canvas en A2UI achter de registratie van HTTP-routes van de Canvas-plugin geplaatst.
- Generieke plugin-WebSocket-upgradedispatch toegevoegd voor HTTP-routes waarvan plugins eigenaar zijn.
- De Canvas-specifieke Gateway-host-URL en authenticatie voor Node-mogelijkheden vervangen door generieke helpers voor gehoste pluginoppervlakken en Node-mogelijkheden.
- Plugin-eigen resolvers voor gehoste media toegevoegd, zodat URL's van Canvas-documenten via de Canvas-plugin worden omgezet in plaats van dat de kern interne onderdelen van Canvas-documenten importeert.
- `api.registerNodeCliFeature(...)` toegevoegd, zodat Canvas `openclaw nodes canvas` kan declareren als een Node-functie waarvan de plugin eigenaar is zonder het pad van de bovenliggende opdracht handmatig uit te schrijven.
- Productie-importen van `extensions/canvas/runtime-api.js` uit `src/**` verwijderd.
- De bron van de A2UI-bundel verplaatst van `apps/shared/OpenClawKit/Tools/CanvasA2UI` naar `extensions/canvas/src/host/a2ui-app`.
- De implementatie voor het bouwen/kopiëren van A2UI verplaatst naar `extensions/canvas/scripts` en de bedrading van de hoofdbuild vervangen door generieke asset-hooks voor gebundelde plugins.
- De verouderde runtime-alias `canvasHost` op het hoogste configuratieniveau verwijderd.
- De Canvas-doctormigratie behouden, zodat `openclaw doctor --fix` oude `canvasHost`-configuraties herschrijft naar `plugins.entries.canvas.config.host`.
- Compatibiliteit met het Canvas-protocol voor oude agents achter Gateway-protocol v4 verwijderd. Systeemeigen clients en Gateways gebruiken nu uitsluitend `pluginSurfaceUrls.canvas` plus `node.pluginSurface.refresh`; het verouderde pad met `canvasHostUrl`, `canvasCapability` en `node.canvas.capability.refresh` wordt opzettelijk niet ondersteund in deze experimentele refactor.
- De gegenereerde plugininventaris bijgewerkt om Canvas op te nemen.
- Referentiedocumentatie voor de plugin toegevoegd in `docs/plugins/reference/canvas.md`.

Bekende resterende Canvas-oppervlakken waarvan de kern eigenaar is:

- Canvas-handlers van systeemeigen apps onder `apps/` gebruiken nog steeds opzettelijk het oppervlak van de Canvas-plugin
- Canvas-protocol-/clienthandlers van systeemeigen apps onder `apps/`
- de uitvoer van gepubliceerde artefacten gebruikt nog steeds `dist/canvas-host/a2ui` voor achterwaarts compatibele runtimezoekacties, maar de kopieerstap is nu eigendom van de plugin

## Beoogde vorm

`extensions/canvas` hoort eigenaar te zijn van:

- het pluginmanifest en de pakketmetadata
- registratie van agenttools
- beleid voor het aanroepen van Node-opdrachten
- de Canvas-host en A2UI-runtime
- de bron van de Canvas-A2UI-bundel en scripts voor het bouwen/kopiëren van assets
- het maken van Canvas-documenten en het omzetten van assets
- de Canvas-CLI-implementatie
- de Canvas-documentatiepagina en vermelding in de plugininventaris

De kern hoort alleen eigenaar te zijn van generieke koppelingen:

- detectie en registratie van plugins
- generiek register voor agenttools
- generiek beleidsregister voor het aanroepen van Node-opdrachten
- generieke Gateway-HTTP/-authenticatie en WebSocket-upgradedispatch
- generieke bepaling van URL's voor gehoste pluginoppervlakken
- generieke registratie van resolvers voor gehoste media
- generiek transport voor Node-mogelijkheden
- generieke configuratie-infrastructuur
- generieke detectie van asset-hooks voor gebundelde plugins

Systeemeigen apps mogen Canvas-opdrachthandlers behouden als clients van het protocol. Zij zijn niet de eigenaar van de pluginruntime.

## Migratiestappen

1. Behandel `plugins.entries.canvas.config.host` als het configuratieoppervlak waarvan de plugin eigenaar is.
2. Werk de documentatie bij, zodat Canvas wordt beschreven als een experimentele gebundelde plugin.
3. Voer gerichte Canvas-tests, controles van de plugininventaris, controles van de plugin-SDK-API en door runtimegrenzen beïnvloede build-/typecontroles uit.

## Auditcontrolelijst

Voordat de refactor als voltooid wordt beschouwd:

- `rg "src/canvas-host|../canvas-host"` levert geen actieve bronimporten op.
- `rg "canvas-tool|createCanvasTool" src` vindt geen Canvas-toolimplementatie waarvan de kern eigenaar is.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` vindt geen hardgecodeerde standaardwaarden voor toestemmingslijsten buiten generieke tests voor pluginbeleid.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` levert niets op.
- `rg "canvas-documents" src` levert niets op.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` levert niets op; de Canvas-plugin registreert `openclaw nodes canvas` via geneste CLI-metadata van de plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` vindt geen Gateway-runtime-eigenaarschap.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` vindt alleen compatibiliteitswrappers of paden waarvan de plugin eigenaar is.
- `pnpm plugins:inventory:check` slaagt.
- `pnpm plugin-sdk:api:check` slaagt, of gegenereerde API-basislijnen zijn opzettelijk bijgewerkt en beoordeeld.
- Gerichte Canvas-tests slagen.
- Tests voor gewijzigde lanes slagen voor Canvas-host-/A2UI-paden.
- De PR-beschrijving vermeldt expliciet dat Canvas experimenteel is en door een plugin wordt ondersteund.

## Verificatieopdrachten

Gebruik tijdens het itereren gerichte lokale controles:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Voer vóór het pushen `pnpm build` uit als het runtimebarrel, lazy imports, de pakkettering of gepubliceerde pluginoppervlakken veranderen.
