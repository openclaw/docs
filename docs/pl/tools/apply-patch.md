---
read_when:
    - Potrzebujesz ustrukturyzowanych zmian w wielu plikach
    - Chcesz udokumentować lub debugować edycje oparte na łatkach
summary: Stosuj poprawki obejmujące wiele plików za pomocą narzędzia apply_patch
title: narzędzie apply_patch
x-i18n:
    generated_at: "2026-07-12T15:39:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Wprowadzaj zmiany w plikach za pomocą ustrukturyzowanego formatu łaty. Jest to idealne rozwiązanie w przypadku edycji wielu plików
lub wielu fragmentów, gdy pojedyncze wywołanie `edit` byłoby zawodne.

Narzędzie przyjmuje pojedynczy ciąg `input`, który obejmuje co najmniej jedną operację na plikach:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parametry

- `input` (wymagany): Pełna zawartość łaty, włącznie z `*** Begin Patch` i `*** End Patch`.

## Uwagi

- Ścieżki w łacie mogą być względne (względem katalogu obszaru roboczego) lub bezwzględne.
- Domyślną wartością `tools.exec.applyPatch.workspaceOnly` jest `true` (ograniczenie do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało lub usuwało pliki poza katalogiem obszaru roboczego.
- Aby zmieniać nazwy plików, użyj `*** Move to:` we fragmencie `*** Update File:`.
- `*** End of File` oznacza wstawienie wyłącznie na końcu pliku, gdy jest to potrzebne.
- Funkcja jest domyślnie włączona dla każdego modelu. Ustaw `tools.exec.applyPatch.enabled: false`,
  aby ją wyłączyć, lub ogranicz ją do określonych modeli za pomocą
  `tools.exec.applyPatch.allowModels` (przyjmuje nieprzetworzone identyfikatory, takie jak `gpt-5.4`, lub pełne
  identyfikatory, takie jak `openai/gpt-5.4`).
- Konfiguracja znajduje się w `tools.exec.applyPatch.*`.

## Przykład

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Różnice" href="/pl/tools/diffs" icon="code-compare">
    Przeglądarka różnic tylko do odczytu, służąca do prezentowania zmian.
  </Card>
  <Card title="Narzędzie Exec" href="/pl/tools/exec" icon="terminal">
    Wykonywanie poleceń powłoki przez agenta.
  </Card>
  <Card title="Wykonywanie kodu" href="/pl/tools/code-execution" icon="square-code">
    Zdalna analiza w języku Python z użyciem xAI w środowisku izolowanym.
  </Card>
</CardGroup>
