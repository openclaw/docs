---
read_when:
    - Zuständigkeit für Canvas-Host, Werkzeuge, Befehle, Dokumentation oder Protokoll verschieben
    - Überprüfen, ob Canvas weiterhin vom Core verantwortet wird
    - Vorbereiten oder Prüfen des experimentellen Canvas-Plugin-PRs
summary: Plan und Audit-Checkliste für die Verlagerung von Canvas aus dem Kern in ein gebündeltes experimentelles Plugin.
title: Refaktorierung des Canvas-Plugins
x-i18n:
    generated_at: "2026-05-07T13:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Refactoring des Canvas-Plugins

Canvas wird wenig genutzt und ist experimentell. Behandeln Sie es als mitgeliefertes Plugin, nicht als Core-Funktion. Der Core darf generische Gateway-, Node-, HTTP-, Authentifizierungs-, Config- und Native-Client-Infrastruktur behalten, Canvas-spezifisches Verhalten sollte jedoch unter `extensions/canvas` liegen.

## Ziel

Die Zuständigkeit für Canvas nach `extensions/canvas` verschieben und dabei das aktuelle Verhalten gekoppelter Nodes beibehalten:

- das agentenseitige `canvas`-Tool wird vom Canvas-Plugin registriert
- Canvas-Node-Befehle sind nur erlaubt, wenn das Canvas-Plugin sie registriert
- A2UI-Host-/Quelldateien liegen unter dem Canvas-Plugin
- Canvas-Dokumentmaterialisierung liegt unter dem Canvas-Plugin
- die CLI-Befehlsimplementierung liegt unter dem Canvas-Plugin oder delegiert über ein Plugin-eigenes Runtime-Barrel
- Dokumentation und Plugin-Inventar beschreiben Canvas als experimentell und Plugin-gestützt

## Nichtziele

- Die native App-Canvas-UI in diesem Refactoring nicht neu entwerfen.
- Canvas-Protokoll-/Client-Unterstützung nicht aus iOS, Android oder macOS entfernen, es sei denn, eine separate Produktentscheidung besagt, dass Canvas gelöscht werden soll.
- Kein breites Plugin-Service-Framework nur für Canvas bauen, es sei denn, mindestens ein anderes mitgeliefertes Plugin benötigt dieselbe Schnittstelle.

## Aktueller Branch-Zustand

Erledigt:

- Mitgeliefertes Plugin-Paket in `extensions/canvas` hinzugefügt.
- `extensions/canvas/openclaw.plugin.json` hinzugefügt.
- Das Agent-`canvas`-Tool von `src/agents/tools/canvas-tool.ts` nach `extensions/canvas/src/tool.ts` verschoben.
- Core-Registrierung von `createCanvasTool` aus `src/agents/openclaw-tools.ts` entfernt.
- Canvas-Host-Implementierung von `src/canvas-host` nach `extensions/canvas/src/host` verschoben.
- `extensions/canvas/runtime-api.ts` als Plugin-eigenes Kompatibilitäts-Barrel für Tests, Paketierung und externe öffentliche Canvas-Hilfsfunktionen beibehalten.
- Canvas-Dokumentmaterialisierung von `src/gateway/canvas-documents.ts` nach `extensions/canvas/src/documents.ts` verschoben.
- Canvas-CLI-Implementierung und A2UI-JSONL-Hilfsfunktionen nach `extensions/canvas/src/cli.ts` verschoben.
- Canvas-Host-URL und Hilfsfunktionen für bereichsgebundene Capabilities nach `extensions/canvas/src` verschoben.
- Canvas-Node-Befehlsdefaults aus hartcodierten Core-Listen in Plugin-`nodeInvokePolicies` verschoben.
- Plugin-eigene Canvas-Host-Config unter `plugins.entries.canvas.config.host` hinzugefügt.
- Canvas- und A2UI-HTTP-Bereitstellung hinter die HTTP-Routenregistrierung des Canvas-Plugins verschoben.
- Generisches Plugin-WebSocket-Upgrade-Dispatching für Plugin-eigene HTTP-Routen hinzugefügt.
- Canvas-spezifische Gateway-Host-URL und Node-Capability-Authentifizierung durch generische gehostete Plugin-Oberfläche und Node-Capability-Hilfsfunktionen ersetzt.
- Plugin-eigene Resolver für gehostete Medien hinzugefügt, damit Canvas-Dokument-URLs über das Canvas-Plugin aufgelöst werden, statt dass der Core Canvas-Dokumentinterna importiert.
- `api.registerNodeCliFeature(...)` hinzugefügt, damit Canvas `openclaw nodes canvas` als Plugin-eigenes Node-Feature deklarieren kann, ohne den übergeordneten Befehlspfad manuell auszuschreiben.
- Produktionsimporte von `extensions/canvas/runtime-api.js` aus `src/**` entfernt.
- Die A2UI-Bundle-Quelle von `apps/shared/OpenClawKit/Tools/CanvasA2UI` nach `extensions/canvas/src/host/a2ui-app` verschoben.
- A2UI-Build-/Copy-Implementierung unter `extensions/canvas/scripts` verschoben und Root-Build-Verdrahtung durch generische Asset-Hooks für mitgelieferte Plugins ersetzt.
- Den Runtime-Legacy-Top-Level-Config-Alias `canvasHost` entfernt.
- Canvas-Doctor-Migration beibehalten, damit `openclaw doctor --fix` alte `canvasHost`-Configs in `plugins.entries.canvas.config.host` umschreibt.
- Alte Agent-Canvas-Protokollkompatibilität hinter Gateway-Protokoll v4 entfernt. Native Clients und Gateways verwenden jetzt nur noch `pluginSurfaceUrls.canvas` plus `node.pluginSurface.refresh`; der veraltete Pfad `canvasHostUrl`, `canvasCapability` und `node.canvas.capability.refresh` wird in diesem experimentellen Refactoring absichtlich nicht unterstützt.
- Generiertes Plugin-Inventar aktualisiert, um Canvas einzuschließen.
- Plugin-Referenzdokumentation unter `docs/plugins/reference/canvas.md` hinzugefügt.

Bekannte verbleibende Core-eigene Canvas-Oberflächen:

- Native App-Canvas-Handler unter `apps/` konsumieren weiterhin absichtlich die Canvas-Plugin-Oberfläche
- Native App-Canvas-Protokoll-/Client-Handler unter `apps/`
- Die veröffentlichte Artefaktausgabe verwendet weiterhin `dist/canvas-host/a2ui` für rückwärtskompatible Runtime-Lookups, aber der Copy-Schritt ist jetzt Plugin-eigen

## Zielstruktur

`extensions/canvas` sollte Folgendes besitzen:

- Plugin-Manifest und Paketmetadaten
- Agent-Tool-Registrierung
- Node-Invoke-Befehlspolicy
- Canvas-Host und A2UI-Runtime
- Canvas-A2UI-Bundle-Quelle und Asset-Build-/Copy-Skripte
- Canvas-Dokumenterstellung und Asset-Auflösung
- Canvas-CLI-Implementierung
- Canvas-Dokumentationsseite und Plugin-Inventareintrag

Der Core sollte nur generische Schnittstellen besitzen:

- Plugin-Erkennung und -Registrierung
- generische Agent-Tool-Registry
- generische Node-Invoke-Policy-Registry
- generisches Gateway-HTTP/Auth und WebSocket-Upgrade-Dispatching
- generische URL-Auflösung für gehostete Plugin-Oberflächen
- generische Registrierung von Resolvern für gehostete Medien
- generischer Node-Capability-Transport
- generische Config-Infrastruktur
- generische Asset-Hook-Erkennung für mitgelieferte Plugins

Native Apps dürfen Canvas-Befehlshandler als Clients des Protokolls behalten. Sie sind nicht der Runtime-Eigentümer des Plugins.

## Migrationsschritte

1. `plugins.entries.canvas.config.host` als Plugin-eigene Config-Oberfläche behandeln.
2. Dokumentation aktualisieren, sodass Canvas als experimentelles mitgeliefertes Plugin beschrieben wird.
3. Fokussierte Canvas-Tests, Plugin-Inventarprüfungen, Plugin-SDK-API-Prüfungen sowie Build-/Typ-Gates ausführen, die von Runtime-Grenzen betroffen sind.

## Audit-Checkliste

Bevor das Refactoring als abgeschlossen gilt:

- `rg "src/canvas-host|../canvas-host"` gibt keine Live-Quellimporte zurück.
- `rg "canvas-tool|createCanvasTool" src` findet keine Core-eigene Canvas-Tool-Implementierung.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` findet keine hartcodierten Allowlist-Defaults außerhalb generischer Plugin-Policy-Tests.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ist leer.
- `rg "canvas-documents" src` ist leer.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ist leer; das Canvas-Plugin registriert `openclaw nodes canvas` über verschachtelte Plugin-CLI-Metadaten.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` gibt keine Gateway-Runtime-Zuständigkeit zurück.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` findet nur Kompatibilitäts-Wrapper oder Plugin-eigene Pfade.
- `pnpm plugins:inventory:check` besteht.
- `pnpm plugin-sdk:api:check` besteht, oder generierte API-Baselines werden absichtlich aktualisiert und überprüft.
- Zielgerichtete Canvas-Tests bestehen.
- Changed-Lanes-Tests für Canvas-Host-/A2UI-Pfade bestehen.
- Der PR-Body sagt ausdrücklich, dass Canvas experimentell und Plugin-gestützt ist.

## Verifizierungsbefehle

Verwenden Sie beim Iterieren zielgerichtete lokale Prüfungen:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Führen Sie `pnpm build` vor dem Push aus, wenn sich Runtime-Barrel, Lazy Import, Paketierung oder veröffentlichte Plugin-Oberflächen ändern.
