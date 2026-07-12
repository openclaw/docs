---
read_when:
    - Verschieben der Zuständigkeit für Canvas-Host, Tools, Befehle, Dokumentation oder Protokoll
    - Prüfen, ob Canvas weiterhin zum Core gehört
    - Vorbereiten oder Überprüfen des PRs für das experimentelle Canvas-Plugin
summary: Planungs- und Audit-Checkliste für die Auslagerung von Canvas aus dem Kern in ein gebündeltes experimentelles Plugin.
title: Canvas-Plugin-Refaktorierung
x-i18n:
    generated_at: "2026-07-12T02:07:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refaktorierung des Canvas-Plugins

Canvas wird wenig genutzt und ist experimentell. Behandeln Sie es als gebündeltes Plugin, nicht als Kernfunktion. Der Kern darf generische Gateway-, Node-, HTTP-, Authentifizierungs-, Konfigurations- und Native-Client-Infrastruktur beibehalten, Canvas-spezifisches Verhalten sollte jedoch unter `extensions/canvas` liegen.

## Ziel

Verlagern Sie die Zuständigkeit für Canvas nach `extensions/canvas` und bewahren Sie dabei das aktuelle Verhalten gekoppelter Nodes:

- Das agentenseitige Werkzeug `canvas` wird vom Canvas-Plugin registriert.
- Canvas-Node-Befehle sind nur zulässig, wenn das Canvas-Plugin sie registriert.
- A2UI-Host-/Quelldateien liegen unter dem Canvas-Plugin.
- Die Materialisierung von Canvas-Dokumenten liegt unter dem Canvas-Plugin.
- Die Implementierung des CLI-Befehls liegt unter dem Canvas-Plugin oder delegiert über ein Plugin-eigenes Runtime-Barrel.
- Dokumentation und Plugin-Inventar beschreiben Canvas als experimentell und Plugin-gestützt.

## Nichtziele

- Gestalten Sie die Canvas-Benutzeroberfläche der nativen App bei dieser Refaktorierung nicht neu.
- Entfernen Sie die Canvas-Protokoll-/Client-Unterstützung nicht aus iOS, Android oder macOS, sofern nicht eine separate Produktentscheidung die Löschung von Canvas vorsieht.
- Erstellen Sie nicht allein für Canvas ein umfassendes Plugin-Service-Framework, sofern nicht mindestens ein weiteres gebündeltes Plugin dieselbe Schnittstelle benötigt.

## Aktueller Branch-Stand

Erledigt:

- Gebündeltes Plugin-Paket in `extensions/canvas` hinzugefügt.
- `extensions/canvas/openclaw.plugin.json` hinzugefügt.
- Das Agentenwerkzeug `canvas` von `src/agents/tools/canvas-tool.ts` nach `extensions/canvas/src/tool.ts` verschoben.
- Die Kernregistrierung von `createCanvasTool` aus `src/agents/openclaw-tools.ts` entfernt.
- Die Canvas-Host-Implementierung von `src/canvas-host` nach `extensions/canvas/src/host` verschoben.
- `extensions/canvas/runtime-api.ts` als Plugin-eigenes Kompatibilitäts-Barrel für Tests, Paketierung und externe öffentliche Canvas-Hilfsfunktionen beibehalten.
- Die Materialisierung von Canvas-Dokumenten von `src/gateway/canvas-documents.ts` nach `extensions/canvas/src/documents.ts` verschoben.
- Die Canvas-CLI-Implementierung und A2UI-JSONL-Hilfsfunktionen nach `extensions/canvas/src/cli.ts` verschoben.
- Die Canvas-Host-URL und Hilfsfunktionen für bereichsbezogene Fähigkeiten nach `extensions/canvas/src` verschoben.
- Die Standardwerte für Canvas-Node-Befehle aus fest codierten Kernlisten in die Plugin-`nodeInvokePolicies` verschoben.
- Plugin-eigene Canvas-Host-Konfiguration unter `plugins.entries.canvas.config.host` hinzugefügt.
- Die HTTP-Bereitstellung von Canvas und A2UI hinter die HTTP-Routenregistrierung des Canvas-Plugins verschoben.
- Generische Plugin-WebSocket-Upgrade-Weiterleitung für Plugin-eigene HTTP-Routen hinzugefügt.
- Die Canvas-spezifische Gateway-Host-URL und Authentifizierung von Node-Fähigkeiten durch generische gehostete Plugin-Oberflächen und Hilfsfunktionen für Node-Fähigkeiten ersetzt.
- Plugin-eigene Resolver für gehostete Medien hinzugefügt, sodass Canvas-Dokument-URLs über das Canvas-Plugin aufgelöst werden, anstatt dass der Kern interne Canvas-Dokumentimplementierungen importiert.
- `api.registerNodeCliFeature(...)` hinzugefügt, sodass Canvas `openclaw nodes canvas` als Plugin-eigene Node-Funktion deklarieren kann, ohne den Pfad des übergeordneten Befehls manuell anzugeben.
- Produktive Importe von `extensions/canvas/runtime-api.js` aus `src/**` entfernt.
- Die Quelle des A2UI-Bundles von `apps/shared/OpenClawKit/Tools/CanvasA2UI` nach `extensions/canvas/src/host/a2ui-app` verschoben.
- Die A2UI-Build-/Kopierimplementierung nach `extensions/canvas/scripts` verschoben und die Build-Verknüpfung im Stammverzeichnis durch generische Asset-Hooks für gebündelte Plugins ersetzt.
- Den veralteten Top-Level-Konfigurationsalias `canvasHost` aus der Runtime entfernt.
- Die Canvas-Doctor-Migration beibehalten, sodass `openclaw doctor --fix` alte `canvasHost`-Konfigurationen in `plugins.entries.canvas.config.host` umschreibt.
- Die Canvas-Protokollkompatibilität für alte Agenten hinter Gateway-Protokoll v4 entfernt. Native Clients und Gateways verwenden jetzt ausschließlich `pluginSurfaceUrls.canvas` zusammen mit `node.pluginSurface.refresh`; der veraltete Pfad über `canvasHostUrl`, `canvasCapability` und `node.canvas.capability.refresh` wird bei dieser experimentellen Refaktorierung bewusst nicht unterstützt.
- Das generierte Plugin-Inventar um Canvas ergänzt.
- Plugin-Referenzdokumentation unter `docs/plugins/reference/canvas.md` hinzugefügt.

Bekannte verbleibende Canvas-Oberflächen im Besitz des Kerns:

- Canvas-Handler nativer Apps unter `apps/` verwenden weiterhin bewusst die Oberfläche des Canvas-Plugins.
- Canvas-Protokoll-/Client-Handler nativer Apps unter `apps/`.
- Die Ausgabe veröffentlichter Artefakte verwendet für abwärtskompatible Runtime-Auflösung weiterhin `dist/canvas-host/a2ui`, der Kopierschritt ist nun jedoch Plugin-eigen.

## Zielstruktur

`extensions/canvas` sollte für Folgendes zuständig sein:

- Plugin-Manifest und Paketmetadaten
- Registrierung des Agentenwerkzeugs
- Richtlinie für Node-Aufrufbefehle
- Canvas-Host und A2UI-Runtime
- Quelle des Canvas-A2UI-Bundles und Asset-Build-/Kopierskripte
- Erstellung von Canvas-Dokumenten und Asset-Auflösung
- Canvas-CLI-Implementierung
- Canvas-Dokumentationsseite und Eintrag im Plugin-Inventar

Der Kern sollte nur für generische Schnittstellen zuständig sein:

- Plugin-Erkennung und -Registrierung
- generische Registrierung von Agentenwerkzeugen
- generische Registrierung von Richtlinien für Node-Aufrufe
- generische Gateway-HTTP-/Authentifizierungs- und WebSocket-Upgrade-Weiterleitung
- generische URL-Auflösung für gehostete Plugin-Oberflächen
- generische Registrierung von Resolvern für gehostete Medien
- generischer Transport von Node-Fähigkeiten
- generische Konfigurationsinfrastruktur
- generische Erkennung von Asset-Hooks gebündelter Plugins

Native Apps dürfen Canvas-Befehlshandler als Clients des Protokolls beibehalten. Sie sind nicht für die Plugin-Runtime zuständig.

## Migrationsschritte

1. Behandeln Sie `plugins.entries.canvas.config.host` als Plugin-eigene Konfigurationsoberfläche.
2. Aktualisieren Sie die Dokumentation, sodass Canvas als experimentelles gebündeltes Plugin beschrieben wird.
3. Führen Sie gezielte Canvas-Tests, Prüfungen des Plugin-Inventars, Prüfungen der Plugin-SDK-API sowie Build-/Typprüfungen aus, die von Runtime-Grenzen betroffen sind.

## Audit-Checkliste

Bevor Sie die Refaktorierung als abgeschlossen betrachten:

- `rg "src/canvas-host|../canvas-host"` gibt keine aktiven Quellcodeimporte zurück.
- `rg "canvas-tool|createCanvasTool" src` findet keine Canvas-Werkzeugimplementierung im Besitz des Kerns.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` findet außerhalb generischer Tests für Plugin-Richtlinien keine fest codierten Standard-Zulassungslisten.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` gibt keine Ergebnisse zurück.
- `rg "canvas-documents" src` gibt keine Ergebnisse zurück.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` gibt keine Ergebnisse zurück; das Canvas-Plugin registriert `openclaw nodes canvas` über verschachtelte Plugin-CLI-Metadaten.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` gibt keine Zuständigkeit der Gateway-Runtime zurück.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` findet nur Kompatibilitäts-Wrapper oder Plugin-eigene Pfade.
- `pnpm plugins:inventory:check` wird erfolgreich ausgeführt.
- `pnpm plugin-sdk:api:check` wird erfolgreich ausgeführt oder generierte API-Baselines werden bewusst aktualisiert und geprüft.
- Gezielte Canvas-Tests werden erfolgreich ausgeführt.
- Tests für geänderte Lanes werden für Canvas-Host-/A2UI-Pfade erfolgreich ausgeführt.
- Der PR-Text gibt ausdrücklich an, dass Canvas experimentell und Plugin-gestützt ist.

## Verifizierungsbefehle

Verwenden Sie während der Iteration gezielte lokale Prüfungen:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Führen Sie vor dem Push `pnpm build` aus, wenn sich das Runtime-Barrel, Lazy Imports, die Paketierung oder veröffentlichte Plugin-Oberflächen ändern.
