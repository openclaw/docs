---
read_when:
    - Потрібні структуровані зміни в кількох файлах
    - Ви хочете задокументувати або налагодити редагування на основі патчів
summary: Застосовуйте багатофайлові патчі за допомогою інструмента apply_patch
title: інструмент apply_patch
x-i18n:
    generated_at: "2026-05-06T01:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Застосовуйте зміни до файлів за допомогою структурованого формату патча. Це ідеально підходить для багатофайлових
або багатофрагментних редагувань, коли один виклик `edit` був би крихким.

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

- `input` (обов’язковий): повний вміст патча, включно з `*** Begin Patch` і `*** End Patch`.

## Примітки

- Шляхи патча підтримують відносні шляхи (від каталогу робочого простору) й абсолютні шляхи.
- `tools.exec.applyPatch.workspaceOnly` за замовчуванням має значення `true` (у межах робочого простору). Установлюйте його в `false` лише якщо ви навмисно хочете, щоб `apply_patch` записував або видаляв файли поза каталогом робочого простору.
- Використовуйте `*** Move to:` всередині фрагмента `*** Update File:`, щоб перейменовувати файли.
- `*** End of File` позначає вставлення лише в EOF, коли це потрібно.
- Доступний за замовчуванням для моделей OpenAI та OpenAI Codex. Установіть
  `tools.exec.applyPatch.enabled: false`, щоб вимкнути його.
- За потреби обмежуйте за моделлю через
  `tools.exec.applyPatch.allowModels`.
- Конфігурація є лише в `tools.exec`.

## Приклад

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Diffs" href="/uk/tools/diffs" icon="code-compare">
    Засіб перегляду diff лише для читання для представлення змін.
  </Card>
  <Card title="Exec tool" href="/uk/tools/exec" icon="terminal">
    Виконання команд shell з агента.
  </Card>
  <Card title="Code execution" href="/uk/tools/code-execution" icon="square-code">
    Ізольований віддалений аналіз Python з xAI.
  </Card>
</CardGroup>
