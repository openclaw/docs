---
read_when:
    - Übertragung der Zuständigkeit für Canvas-Host, Tools, Befehle, Dokumentation oder Protokoll
    - Prüfen, ob Canvas weiterhin dem Core zugeordnet ist
    - Vorbereitung oder Überprüfung des PRs für das experimentelle Canvas-Plugin
summary: Planungs- und Audit-Checkliste für die Auslagerung von Canvas aus dem Kern in ein gebündeltes experimentelles Plugin.
title: Canvas-Plugin-Refaktorierung
x-i18n:
    generated_at: "2026-07-24T04:06:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas-Plugin-Refaktorierung

Canvas wird selten verwendet und ist experimentell. Behandeln Sie es als gebündeltes Plugin, nicht als Kernfunktion. Der Kern kann generische Gateway-, Node-, HTTP-, Authentifizierungs-, Konfigurations- und native Client-Infrastruktur beibehalten, Canvas-spezifisches Verhalten sollte jedoch unter `extensions/canvas` angesiedelt sein.

## Ziel

Die Zuständigkeit für Canvas nach `extensions/canvas` verschieben und dabei das aktuelle Verhalten gekoppelter Nodes beibehalten:

- Das agentenseitige Werkzeug `canvas` wird vom Canvas-Plugin registriert
- Canvas-Node-Befehle sind nur zulässig, wenn das Canvas-Plugin sie registriert
- A2UI-Host-/Quelldateien befinden sich unter dem Canvas-Plugin
- Die Materialisierung von Canvas-Dokumenten befindet sich unter dem Canvas-Plugin
- Die Implementierung des CLI-Befehls befindet sich unter dem Canvas-Plugin oder delegiert über ein Plugin-eigenes Runtime-Barrel
- Dokumentation und Plugin-Inventar beschreiben Canvas als experimentell und Plugin-basiert

## Nichtziele

- Die Canvas-Benutzeroberfläche der nativen App im Rahmen dieser Refaktorierung nicht neu gestalten.
- Die Canvas-Protokoll-/Client-Unterstützung nicht aus iOS, Android oder macOS entfernen, sofern nicht in einer separaten Produktentscheidung festgelegt wird, dass Canvas gelöscht werden soll.
- Kein umfassendes Plugin-Service-Framework ausschließlich für Canvas entwickeln, sofern nicht mindestens ein weiteres gebündeltes Plugin dieselbe Schnittstelle benötigt.

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
- Die Canvas-Host-URL und bereichsbezogene Capability-Hilfsfunktionen nach `extensions/canvas/src` verschoben.
- Die Standardwerte für Canvas-Node-Befehle aus hartcodierten Kernlisten in das Plugin `nodeInvokePolicies` verschoben.
- Plugin-eigene Canvas-Host-Konfiguration unter `plugins.entries.canvas.config.host` hinzugefügt.
- Die Bereitstellung von Canvas und A2UI per HTTP hinter die Registrierung von HTTP-Routen des Canvas-Plugins verschoben.
- Generische Plugin-WebSocket-Upgrade-Weiterleitung für Plugin-eigene HTTP-Routen hinzugefügt.
- Canvas-spezifische Gateway-Host-URL und Node-Capability-Authentifizierung durch generische Hilfsfunktionen für gehostete Plugin-Oberflächen und Node-Capabilities ersetzt.
- Plugin-eigene Resolver für gehostete Medien hinzugefügt, damit Canvas-Dokument-URLs über das Canvas-Plugin aufgelöst werden, anstatt dass der Kern interne Canvas-Dokumentkomponenten importiert.
- `api.registerNodeCliFeature(...)` hinzugefügt, damit Canvas `openclaw nodes canvas` als Plugin-eigene Node-Funktion deklarieren kann, ohne den übergeordneten Befehlspfad manuell auszuschreiben.
- Produktionsimporte von `extensions/canvas/runtime-api.js` aus `src/**` entfernt.
- Die Quelle des A2UI-Bundles von `apps/shared/OpenClawKit/Tools/CanvasA2UI` nach `extensions/canvas/src/host/a2ui-app` verschoben.
- Die Implementierung zum Erstellen/Kopieren von A2UI unter `extensions/canvas/scripts` verschoben und die Build-Verdrahtung im Stammverzeichnis durch generische Asset-Hooks für gebündelte Plugins ersetzt.
- Den alten Top-Level-Konfigurationsalias `canvasHost` aus der Runtime entfernt.
- Die Canvas-Doctor-Migration beibehalten, sodass `openclaw doctor --fix` alte `canvasHost`-Konfigurationen in `plugins.entries.canvas.config.host` umschreibt.
- Die Canvas-Protokollkompatibilität für alte Agenten hinter Gateway-Protokoll v4 entfernt. Native Clients und Gateways verwenden jetzt ausschließlich `pluginSurfaceUrls.canvas` zusammen mit `node.pluginSurface.refresh`; der veraltete Pfad über `canvasHostUrl`, `canvasCapability` und `node.canvas.capability.refresh` wird in dieser experimentellen Refaktorierung absichtlich nicht unterstützt.
- Das generierte Plugin-Inventar um Canvas ergänzt.
- Plugin-Referenzdokumentation unter `docs/plugins/reference/canvas.md` hinzugefügt.

Bekannte verbleibende Canvas-Oberflächen in Kernzuständigkeit:

- Canvas-Handler der nativen App unter `apps/` verwenden weiterhin absichtlich die Oberfläche des Canvas-Plugins
- Canvas-Protokoll-/Client-Handler der nativen App unter `apps/`
- Die Ausgabe veröffentlichter Artefakte verwendet für die abwärtskompatible Runtime-Suche weiterhin `dist/canvas-host/a2ui`, der Kopierschritt ist jetzt jedoch Plugin-eigen

## Zielstruktur

`extensions/canvas` sollte für Folgendes zuständig sein:

- Plugin-Manifest und Paketmetadaten
- Registrierung des Agentenwerkzeugs
- Richtlinie für Node-Aufrufbefehle
- Canvas-Host und A2UI-Runtime
- Quelle des Canvas-A2UI-Bundles und Skripte zum Erstellen/Kopieren von Assets
- Erstellung von Canvas-Dokumenten und Auflösung von Assets
- Canvas-CLI-Implementierung
- Canvas-Dokumentationsseite und Eintrag im Plugin-Inventar

Der Kern sollte ausschließlich für generische Schnittstellen zuständig sein:

- Erkennung und Registrierung von Plugins
- Generische Registrierung von Agentenwerkzeugen
- Generische Richtlinienregistrierung für Node-Aufrufe
- Generische Gateway-HTTP-/Authentifizierungs- und WebSocket-Upgrade-Weiterleitung
- Generische URL-Auflösung für gehostete Plugin-Oberflächen
- Generische Registrierung von Resolvern für gehostete Medien
- Generischer Transport von Node-Capabilities
- Generische Konfigurationsinfrastruktur
- Generische Erkennung von Asset-Hooks gebündelter Plugins

Native Apps dürfen Canvas-Befehlshandler als Clients des Protokolls beibehalten. Sie sind nicht für die Plugin-Runtime zuständig.

## Migrationsschritte

1. `plugins.entries.canvas.config.host` als Plugin-eigene Konfigurationsoberfläche behandeln.
2. Die Dokumentation so aktualisieren, dass Canvas als experimentelles gebündeltes Plugin beschrieben wird.
3. Gezielte Canvas-Tests, Prüfungen des Plugin-Inventars, Prüfungen der Plugin-SDK-API sowie die von Runtime-Grenzen betroffenen Build-/Typprüfungen ausführen.

## Audit-Checkliste

Vor Abschluss der Refaktorierung:

- `rg "src/canvas-host|../canvas-host"` gibt keine aktiven Quellimporte zurück.
- `rg "canvas-tool|createCanvasTool" src` findet keine Canvas-Werkzeugimplementierung in Kernzuständigkeit.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` findet keine hartcodierten Allowlist-Standardwerte außerhalb generischer Tests für Plugin-Richtlinien.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ist leer.
- `rg "canvas-documents" src` ist leer.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ist leer; das Canvas-Plugin registriert `openclaw nodes canvas` über verschachtelte Plugin-CLI-Metadaten.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` gibt keine Zuständigkeit für die Gateway-Runtime zurück.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` findet ausschließlich Kompatibilitäts-Wrapper oder Plugin-eigene Pfade.
- `pnpm plugins:inventory:check` ist erfolgreich.
- `pnpm plugin-sdk:api:check` ist erfolgreich, oder generierte Datensätze des API-Vertrags werden absichtlich aktualisiert und überprüft.
- Gezielte Canvas-Tests sind erfolgreich.
- Tests für geänderte Lanes sind für Canvas-Host-/A2UI-Pfade erfolgreich.
- Der PR-Text gibt ausdrücklich an, dass Canvas experimentell und Plugin-basiert ist.

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

Führen Sie `pnpm build` vor dem Push aus, wenn sich Runtime-Barrel, Lazy-Import, Paketierung oder veröffentlichte Plugin-Oberflächen ändern.
