---
read_when:
    - Вам потрібні структуровані редагування файлів у кількох файлах
    - Ви хочете задокументувати або налагодити редагування на основі patch-ів
summary: Застосовуйте багатофайлові patch-и за допомогою інструмента apply_patch
title: Інструмент apply_patch
x-i18n:
    generated_at: "2026-04-23T21:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b76404a9b3a039583c35b99167b63db639f27a1f0daf910973eb6cf05e7d3aab
    source_path: tools/apply-patch.md
    workflow: 15
---

Застосовуйте зміни до файлів за допомогою структурованого формату patch. Це ідеально підходить для багатофайлових
або багатофрагментних редагувань, де один виклик `edit` був би крихким.

Інструмент приймає один рядок `input`, який обгортає одну або кілька файлових операцій:

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

## Параметри

- `input` (обов’язково): Повний вміст patch, включно з `*** Begin Patch` і `*** End Patch`.

## Примітки

- Шляхи в patch підтримують відносні шляхи (від каталогу робочого простору) й абсолютні шляхи.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (лише в межах робочого простору). Установлюйте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.
- Використовуйте `*** Move to:` всередині фрагмента `*** Update File:`, щоб перейменовувати файли.
- `*** End of File` позначає вставку лише в кінець файла, коли це потрібно.
- Доступний типово для моделей OpenAI і OpenAI Codex. Установіть
  `tools.exec.applyPatch.enabled: false`, щоб вимкнути його.
- За бажанням можна обмежити за моделлю через
  `tools.exec.applyPatch.allowModels`.
- Конфігурація розміщується лише в `tools.exec`.

## Приклад

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
