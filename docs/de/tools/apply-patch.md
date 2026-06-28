---
read_when:
    - Sie benötigen strukturierte Dateiänderungen über mehrere Dateien hinweg
    - Sie möchten patchbasierte Änderungen dokumentieren oder debuggen
summary: Patches für mehrere Dateien mit dem apply_patch-Tool anwenden
title: apply_patch-Tool
x-i18n:
    generated_at: "2026-05-06T07:04:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Wenden Sie Dateiänderungen mit einem strukturierten Patch-Format an. Dies ist ideal für Bearbeitungen über mehrere Dateien
oder mehrere Hunks hinweg, bei denen ein einzelner `edit`-Aufruf brüchig wäre.

Das Tool akzeptiert einen einzelnen `input`-String, der eine oder mehrere Dateioperationen umschließt:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parameter

- `input` (erforderlich): Vollständiger Patch-Inhalt einschließlich `*** Begin Patch` und `*** End Patch`.

## Hinweise

- Patch-Pfade unterstützen relative Pfade (ausgehend vom Workspace-Verzeichnis) und absolute Pfade.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie ausdrücklich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.
- Verwenden Sie `*** Move to:` innerhalb eines `*** Update File:`-Hunks, um Dateien umzubenennen.
- `*** End of File` markiert bei Bedarf eine reine EOF-Einfügung.
- Standardmäßig für OpenAI- und OpenAI Codex-Modelle verfügbar. Setzen Sie
  `tools.exec.applyPatch.enabled: false`, um es zu deaktivieren.
- Optional können Sie per Modell über
  `tools.exec.applyPatch.allowModels` einschränken.
- Die Konfiguration befindet sich nur unter `tools.exec`.

## Beispiel

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Verwandt

<CardGroup cols={2}>
  <Card title="Diffs" href="/de/tools/diffs" icon="code-compare">
    Schreibgeschützter Diff-Viewer für die Änderungspräsentation.
  </Card>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Ausführung von Shell-Befehlen durch den Agenten.
  </Card>
  <Card title="Code execution" href="/de/tools/code-execution" icon="square-code">
    Sandbox-gestützte entfernte Python-Analyse mit xAI.
  </Card>
</CardGroup>
