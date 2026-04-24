---
read_when:
    - Potrzebujesz uporządkowanych edycji plików w wielu plikach
    - Chcesz udokumentować lub debugować edycje oparte na poprawkach
summary: Stosuj poprawki wieloplikowe za pomocą narzędzia apply_patch
title: narzędzie apply_patch
x-i18n:
    generated_at: "2026-04-24T09:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Stosuj zmiany w plikach za pomocą uporządkowanego formatu poprawek. Jest to idealne rozwiązanie przy edycjach wieloplikowych
lub wieloblokowych, gdzie pojedyncze wywołanie `edit` byłoby kruche.

Narzędzie przyjmuje pojedynczy ciąg `input`, który zawija jedną lub więcej operacji na plikach:

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

- `input` (wymagane): Pełna zawartość poprawki, łącznie z `*** Begin Patch` i `*** End Patch`.

## Uwagi

- Ścieżki w poprawkach obsługują ścieżki względne (od katalogu obszaru roboczego) i bezwzględne.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczenie do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywał/usuwał pliki poza katalogiem obszaru roboczego.
- Użyj `*** Move to:` wewnątrz bloku `*** Update File:`, aby zmieniać nazwy plików.
- `*** End of File` oznacza wstawienie wyłącznie na końcu pliku, gdy jest potrzebne.
- Dostępne domyślnie dla modeli OpenAI i OpenAI Codex. Ustaw
  `tools.exec.applyPatch.enabled: false`, aby je wyłączyć.
- Opcjonalnie możesz ograniczyć dostęp według modelu przez
  `tools.exec.applyPatch.allowModels`.
- Konfiguracja znajduje się wyłącznie pod `tools.exec`.

## Przykład

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Powiązane

- [Diffy](/pl/tools/diffs)
- [Narzędzie Exec](/pl/tools/exec)
- [Wykonywanie kodu](/pl/tools/code-execution)
