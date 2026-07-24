---
read_when:
    - Sie müssen strukturierte Dateiänderungen über mehrere Dateien hinweg vornehmen
    - Sie möchten Patch-basierte Änderungen dokumentieren oder debuggen
summary: Wenden Sie Patches für mehrere Dateien mit dem Tool apply_patch an
title: apply_patch-Tool
x-i18n:
    generated_at: "2026-07-24T04:11:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Wenden Sie Dateiänderungen mithilfe eines strukturierten Patch-Formats an. Dies eignet sich ideal für Änderungen an mehreren Dateien
oder mit mehreren Hunks, bei denen ein einzelner `edit`-Aufruf fehleranfällig wäre.

Das Tool akzeptiert eine einzelne `input`-Zeichenfolge, die eine oder mehrere Dateioperationen umschließt:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+Zeile 1
+Zeile 2
*** Update File: src/app.ts
@@ optionaler Änderungskontext
-alte Zeile
+neue Zeile
*** Delete File: obsolete.txt
*** End Patch
```

## Parameter

- `input` (erforderlich): Vollständiger Patch-Inhalt einschließlich `*** Begin Patch` und `*** End Patch`.

## Hinweise

- Patch-Pfade unterstützen relative Pfade (ausgehend vom Workspace-Verzeichnis) und absolute Pfade.
- `tools.exec.applyPatch.workspaceOnly` verwendet standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie den Wert nur dann auf `false`, wenn `apply_patch` absichtlich außerhalb des Workspace-Verzeichnisses schreiben oder löschen soll.
- Verwenden Sie `*** Move to:` innerhalb eines `*** Update File:`-Hunks, um Dateien umzubenennen.
- `*** End of File` kennzeichnet bei Bedarf eine Einfügung ausschließlich am Dateiende.
- Standardmäßig für jedes Modell aktiviert. Setzen Sie `tools.exec.applyPatch.enabled: false`,
  um es zu deaktivieren, oder beschränken Sie es mit
  `tools.exec.applyPatch.allowModels` auf bestimmte Modelle (akzeptiert einfache IDs wie `gpt-5.4` oder vollständige
  IDs wie `openai/gpt-5.4`).
- Die Konfiguration befindet sich unter `tools.exec.applyPatch.*`.

## Beispiel

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Diffs" href="/de/tools/diffs" icon="code-compare">
    Schreibgeschützter Diff-Viewer zur Darstellung von Änderungen.
  </Card>
  <Card title="Ausführungstool" href="/de/tools/exec" icon="terminal">
    Ausführung von Shell-Befehlen durch den Agenten.
  </Card>
  <Card title="Codeausführung" href="/de/tools/code-execution" icon="square-code">
    Abgeschirmte Remote-Python-Analyse mit xAI.
  </Card>
</CardGroup>
