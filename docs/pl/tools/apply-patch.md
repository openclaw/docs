---
read_when:
    - Potrzebujesz ustrukturyzowanych zmian w wielu plikach
    - Chcesz dokumentować lub debugować edycje oparte na patchach
summary: Stosuj poprawki obejmujące wiele plików za pomocą narzędzia apply_patch
title: narzędzie apply_patch
x-i18n:
    generated_at: "2026-05-06T09:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Zastosuj zmiany w plikach przy użyciu ustrukturyzowanego formatu łaty. Jest to idealne w przypadku edycji obejmujących wiele plików
lub wiele fragmentów, gdzie pojedyncze wywołanie `edit` byłoby kruche.

Narzędzie przyjmuje pojedynczy ciąg `input`, który obejmuje jedną lub więcej operacji na plikach:

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

## Parametry

- `input` (wymagane): Pełna zawartość łaty, w tym `*** Begin Patch` i `*** End Patch`.

## Uwagi

- Ścieżki łaty obsługują ścieżki względne (z katalogu obszaru roboczego) i ścieżki bezwzględne.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem obszaru roboczego.
- Użyj `*** Move to:` w fragmencie `*** Update File:`, aby zmieniać nazwy plików.
- `*** End of File` oznacza wstawienie wyłącznie na końcu pliku, gdy jest potrzebne.
- Domyślnie dostępne dla modeli OpenAI i OpenAI Codex. Ustaw
  `tools.exec.applyPatch.enabled: false`, aby je wyłączyć.
- Opcjonalnie ogranicz według modelu za pomocą
  `tools.exec.applyPatch.allowModels`.
- Konfiguracja znajduje się tylko w `tools.exec`.

## Przykład

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Diffs" href="/pl/tools/diffs" icon="code-compare">
    Przeglądarka różnic tylko do odczytu służąca do prezentacji zmian.
  </Card>
  <Card title="Exec tool" href="/pl/tools/exec" icon="terminal">
    Wykonywanie poleceń powłoki przez agenta.
  </Card>
  <Card title="Code execution" href="/pl/tools/code-execution" icon="square-code">
    Izolowana zdalna analiza w Pythonie z xAI.
  </Card>
</CardGroup>
