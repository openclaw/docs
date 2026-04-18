---
x-i18n:
    generated_at: "2026-04-18T06:12:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# QA-Refaktorierung

Status: grundlegende Migration abgeschlossen.

## Ziel

OpenClaw QA von einem Modell mit aufgeteilter Definition auf eine einzige Quelle der Wahrheit umstellen:

- Szenario-Metadaten
- an das Modell gesendete Prompts
- Setup und Teardown
- Harness-Logik
- Assertions und Erfolgskriterien
- Artefakte und Hinweise für Berichte

Der gewünschte Endzustand ist ein generisches QA-Harness, das leistungsfähige Szenario-Definitionsdateien lädt, anstatt den Großteil des Verhaltens in TypeScript fest zu verdrahten.

## Aktueller Stand

Die primäre Quelle der Wahrheit befindet sich jetzt in `qa/scenarios/index.md` plus einer Datei pro Szenario unter `qa/scenarios/<theme>/*.md`.

Implementiert:

- `qa/scenarios/index.md`
  - kanonische QA-Pack-Metadaten
  - Operator-Identität
  - Startmission
- `qa/scenarios/<theme>/*.md`
  - eine Markdown-Datei pro Szenario
  - Szenario-Metadaten
  - Handler-Bindings
  - szenariospezifische Ausführungskonfiguration
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown-Pack-Parser + Zod-Validierung
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Plan-Rendering aus dem Markdown-Pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - erzeugt generierte Kompatibilitätsdateien plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wählt ausführbare Szenarien über in Markdown definierte Handler-Bindings aus
- QA-Bus-Protokoll + UI
  - generische Inline-Anhänge für Bild-/Video-/Audio-/Datei-Rendering

Verbleibende aufgeteilte Oberflächen:

- `extensions/qa-lab/src/suite.ts`
  - enthält weiterhin den Großteil der ausführbaren benutzerdefinierten Handler-Logik
- `extensions/qa-lab/src/report.ts`
  - leitet die Berichtsstruktur weiterhin aus Laufzeitausgaben ab

Die Aufteilung der Quelle der Wahrheit ist also behoben, aber die Ausführung ist weiterhin größtenteils Handler-gestützt statt vollständig deklarativ.

## Wie die echte Szenario-Oberfläche aussieht

Beim Lesen der aktuellen Suite zeigen sich einige unterschiedliche Szenarioklassen.

### Einfache Interaktion

- Kanal-Baseline
- DM-Baseline
- Thread-Follow-up
- Modellwechsel
- Approval-Follow-through
- Reaktion/Bearbeiten/Löschen

### Konfigurations- und Laufzeitmutation

- Config-Patch: Skill deaktivieren
- Config anwenden: Neustart-Aufwachvorgang
- Config-Neustart: Fähigkeitsumschaltung
- Laufzeit-Inventardrift-Prüfung

### Dateisystem- und Repo-Assertions

- Quellcode-/Docs-Discovery-Bericht
- Lobster Invaders bauen
- Suche nach generiertem Bildartefakt

### Speicher-Orchestrierung

- Speicherabruf
- Speicher-Tools im Kanal-Kontext
- Fallback bei Speicherfehlern
- Sitzungs-Speicher-Ranking
- Thread-Speicher-Isolation
- Memory Dreaming Sweep

### Tool- und Plugin-Integration

- MCP-Plugin-Tools-Aufruf
- Skill-Sichtbarkeit
- Skill-Hot-Install
- native Bilderzeugung
- Bild-Roundtrip
- Bildverständnis aus Anhang

### Multi-Turn und Multi-Akteur

- Subagent-Handoff
- Subagent-Fanout-Synthese
- Neustart-/Recovery-ähnliche Abläufe

Diese Kategorien sind wichtig, weil sie die DSL-Anforderungen bestimmen. Eine flache Liste aus Prompt + erwartetem Text reicht nicht aus.

## Richtung

### Eine einzige Quelle der Wahrheit

`qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` als gepflegte Quelle der Wahrheit verwenden.

Das Pack soll bleiben:

- in Reviews für Menschen lesbar
- maschinenlesbar
- ausreichend reichhaltig, um Folgendes zu steuern:
  - Suite-Ausführung
  - QA-Workspace-Bootstrap
  - QA-Lab-UI-Metadaten
  - Docs-/Discovery-Prompts
  - Berichtserzeugung

### Bevorzugtes Authoring-Format

Markdown als Top-Level-Format verwenden, mit strukturiertem YAML darin.

Empfohlene Form:

- YAML-Frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - Modell-/Anbieter-Overrides
  - Voraussetzungen
- Prosa-Abschnitte
  - objective
  - notes
  - debugging hints
- YAML-Blöcke mit Fence
  - setup
  - steps
  - assertions
  - cleanup

Das bietet:

- bessere PR-Lesbarkeit als riesiges JSON
- reichhaltigeren Kontext als reines YAML
- strenges Parsen und Zod-Validierung

Rohes JSON ist nur als erzeugtes Zwischenformat akzeptabel.

## Vorgeschlagene Form der Szenariodatei

Beispiel:

````md
---
id: image-generation-roundtrip
title: Bildgenerierungs-Roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Ziel

Verifizieren, dass generierte Medien im Follow-up-Turn erneut angehängt werden.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Schritte

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Bildgenerierungsprüfung: Erzeuge ein QA-Leuchtturm-Bild und fasse es in einem kurzen Satz zusammen.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Bildgenerierungsprüfung
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip-Bildprüfung: Beschreibe den generierten Leuchtturm-Anhang in einem kurzen Satz.
  attachments:
    - fromArtifact: lighthouseImage
```

# Erwartung

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip-Bildprüfung
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Runner-Fähigkeiten, die die DSL abdecken muss

Basierend auf der aktuellen Suite benötigt der generische Runner mehr als nur Prompt-Ausführung.

### Umgebungs- und Setup-Aktionen

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Agent-Turn-Aktionen

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Konfigurations- und Laufzeitaktionen

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Datei- und Artefaktaktionen

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Speicher- und Cron-Aktionen

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP-Aktionen

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variablen und Artefaktverweise

Die DSL muss gespeicherte Ausgaben und spätere Verweise unterstützen.

Beispiele aus der aktuellen Suite:

- einen Thread erstellen und anschließend `threadId` wiederverwenden
- eine Sitzung erstellen und anschließend `sessionKey` wiederverwenden
- ein Bild erzeugen und die Datei im nächsten Turn anhängen
- eine Wake-Markierungszeichenfolge erzeugen und später prüfen, dass sie erscheint

Benötigte Fähigkeiten:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typisierte Verweise für Pfade, Sitzungsschlüssel, Thread-IDs, Markierungen und Tool-Ausgaben

Ohne Variablenunterstützung wird das Harness weiterhin Szenariologik zurück in TypeScript auslaufen lassen.

## Was als Escape Hatches bleiben sollte

Ein vollständig rein deklarativer Runner ist in Phase 1 nicht realistisch.

Einige Szenarien sind naturgemäß stark orchestrierungsgetrieben:

- Memory Dreaming Sweep
- Config anwenden: Neustart-Aufwachvorgang
- Config-Neustart: Fähigkeitsumschaltung
- Auflösung generierter Bildartefakte nach Zeitstempel/Pfad
- Discovery-Report-Auswertung

Diese sollten vorerst explizite benutzerdefinierte Handler verwenden.

Empfohlene Regel:

- 85–90 % deklarativ
- explizite `customHandler`-Schritte für den schwierigen Rest
- nur benannte und dokumentierte benutzerdefinierte Handler
- kein anonymer Inline-Code in der Szenariodatei

So bleibt die generische Engine sauber und es ist trotzdem Fortschritt möglich.

## Architekturänderung

### Aktuell

Szenario-Markdown ist bereits die Quelle der Wahrheit für:

- Suite-Ausführung
- QA-Workspace-Bootstrap-Dateien
- QA-Lab-UI-Szenariokatalog
- Berichtsmetadaten
- Discovery-Prompts

Erzeugte Kompatibilität:

- der erzeugte Workspace enthält weiterhin `QA_KICKOFF_TASK.md`
- der erzeugte Workspace enthält weiterhin `QA_SCENARIO_PLAN.md`
- der erzeugte Workspace enthält jetzt zusätzlich `QA_SCENARIOS.md`

## Refaktorierungsplan

### Phase 1: Loader und Schema

Erledigt.

- `qa/scenarios/index.md` hinzugefügt
- Szenarien in `qa/scenarios/<theme>/*.md` aufgeteilt
- Parser für benannte Markdown-YAML-Pack-Inhalte hinzugefügt
- mit Zod validiert
- Consumer auf das geparste Pack umgestellt
- Repo-weite `qa/seed-scenarios.json` und `qa/QA_KICKOFF_TASK.md` entfernt

### Phase 2: generische Engine

- `extensions/qa-lab/src/suite.ts` aufteilen in:
  - Loader
  - Engine
  - Aktions-Registry
  - Assertion-Registry
  - benutzerdefinierte Handler
- bestehende Hilfsfunktionen als Engine-Operationen beibehalten

Ergebnis:

- Engine führt einfache deklarative Szenarien aus

Mit Szenarien beginnen, die überwiegend aus Prompt + Warten + Assertion bestehen:

- Thread-Follow-up
- Bildverständnis aus Anhang
- Skill-Sichtbarkeit und -Aufruf
- Kanal-Baseline

Ergebnis:

- erste echte Markdown-definierte Szenarien, die über die generische Engine ausgeliefert werden

### Phase 4: mittlere Szenarien migrieren

- Bildgenerierungs-Roundtrip
- Speicher-Tools im Kanal-Kontext
- Sitzungs-Speicher-Ranking
- Subagent-Handoff
- Subagent-Fanout-Synthese

Ergebnis:

- Variablen, Artefakte, Tool-Assertions und Request-Log-Assertions praktisch nachgewiesen

### Phase 5: schwierige Szenarien bei benutzerdefinierten Handlern belassen

- Memory Dreaming Sweep
- Config anwenden: Neustart-Aufwachvorgang
- Config-Neustart: Fähigkeitsumschaltung
- Laufzeit-Inventardrift

Ergebnis:

- gleiches Authoring-Format, aber bei Bedarf mit expliziten Custom-Step-Blöcken

### Phase 6: hartcodierte Szenariomap löschen

Sobald die Pack-Abdeckung gut genug ist:

- den Großteil des szenariospezifischen TypeScript-Branchings aus `extensions/qa-lab/src/suite.ts` entfernen

## Fake-Slack- / Rich-Media-Unterstützung

Der aktuelle QA-Bus ist textzentriert.

Relevante Dateien:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Heute unterstützt der QA-Bus:

- Text
- Reaktionen
- Threads

Inline-Medienanhänge werden noch nicht modelliert.

### Benötigter Transportvertrag

Ein generisches Modell für QA-Bus-Anhänge hinzufügen:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Dann `attachments?: QaBusAttachment[]` hinzufügen zu:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Warum zuerst generisch

Kein nur auf Slack beschränktes Medienmodell bauen.

Stattdessen:

- ein generisches QA-Transportmodell
- mehrere Renderer darauf aufbauend
  - aktueller QA-Lab-Chat
  - zukünftiges Fake-Slack-Web
  - alle anderen zukünftigen Fake-Transport-Ansichten

Dadurch wird doppelte Logik vermieden und Medienszenarien bleiben transportagnostisch.

### Erforderliche UI-Arbeit

Die QA-UI aktualisieren, damit Folgendes gerendert wird:

- Inline-Bildvorschau
- Inline-Audioplayer
- Inline-Videoplayer
- Datei-Anhang-Chip

Die aktuelle UI kann bereits Threads und Reaktionen rendern, daher sollte sich das Rendern von Anhängen auf dasselbe Nachrichtenkartenmodell aufsetzen lassen.

### Durch Medientransport ermöglichte Szenarioarbeit

Sobald Anhänge durch den QA-Bus fließen, können wir reichhaltigere Fake-Chat-Szenarien hinzufügen:

- Inline-Bildantwort in Fake Slack
- Verständnis von Audioanhängen
- Verständnis von Videoanhängen
- gemischte Anhangsreihenfolge
- Thread-Antwort mit beibehaltenen Medien

## Empfehlung

Der nächste Implementierungsblock sollte sein:

1. Markdown-Szenario-Loader + Zod-Schema hinzufügen
2. den aktuellen Katalog aus Markdown erzeugen
3. zuerst einige einfache Szenarien migrieren
4. generische QA-Bus-Anhangsunterstützung hinzufügen
5. Inline-Bilder in der QA-UI rendern
6. dann auf Audio und Video erweitern

Dies ist der kleinste Weg, um beide Ziele zu belegen:

- generische Markdown-definierte QA
- reichhaltigere Fake-Messaging-Oberflächen

## Offene Fragen

- ob Szenariodateien eingebettete Markdown-Prompt-Templates mit Variableninterpolation erlauben sollten
- ob Setup/Cleanup benannte Abschnitte oder einfach geordnete Aktionslisten sein sollten
- ob Artefaktverweise im Schema stark typisiert oder zeichenkettenbasiert sein sollten
- ob benutzerdefinierte Handler in einer Registry oder in Registries pro Oberfläche liegen sollten
- ob die erzeugte JSON-Kompatibilitätsdatei während der Migration weiterhin eingecheckt bleiben sollte
