---
read_when:
    - Potrzebujesz uporządkowanych edycji plików w wielu plikach
    - Chcesz udokumentować lub debugować edycje oparte na patchach
summary: Stosowanie wieloplikowych poprawek za pomocą narzędzia apply_patch
title: Narzędzie apply_patch
x-i18n:
    generated_at: "2026-04-05T14:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# narzędzie apply_patch

Stosuj zmiany w plikach za pomocą uporządkowanego formatu patch. Jest to idealne rozwiązanie dla edycji wieloplikowych
lub wielohunkowych, gdzie pojedyncze wywołanie `edit` byłoby kruche.

Narzędzie przyjmuje pojedynczy ciąg `input`, który zawiera jedną lub więcej operacji na plikach:

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

- `input` (wymagany): Pełna zawartość patcha, w tym `*** Begin Patch` i `*** End Patch`.

## Uwagi

- Ścieżki w patchach obsługują ścieżki względne (od katalogu workspace) i bezwzględne.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczenie do workspace). Ustaw `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywał/usunął pliki poza katalogiem workspace.
- Użyj `*** Move to:` wewnątrz hunka `*** Update File:`, aby zmieniać nazwy plików.
- `*** End of File` oznacza wstawienie wyłącznie na EOF, gdy jest potrzebne.
- Dostępne domyślnie dla modeli OpenAI i OpenAI Codex. Ustaw
  `tools.exec.applyPatch.enabled: false`, aby to wyłączyć.
- Opcjonalnie można ograniczyć według modelu przez
  `tools.exec.applyPatch.allowModels`.
- Konfiguracja znajduje się wyłącznie pod `tools.exec`.

## Przykład

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
