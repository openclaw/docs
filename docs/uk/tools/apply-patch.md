---
read_when:
    - Вам потрібно структуровано редагувати кілька файлів
    - Ви хочете задокументувати або налагодити редагування на основі патчів
summary: Застосовуйте зміни до кількох файлів за допомогою інструмента apply_patch
title: інструмент apply_patch
x-i18n:
    generated_at: "2026-07-12T13:43:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Застосовуйте зміни до файлів за допомогою структурованого формату латки. Це ідеально підходить для редагування кількох файлів
або кількох фрагментів, коли один виклик `edit` був би ненадійним.

Інструмент приймає один рядок `input`, що охоплює одну або кілька операцій із файлами:

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

## Параметри

- `input` (обов’язковий): повний вміст латки, включно з `*** Begin Patch` і `*** End Patch`.

## Примітки

- Шляхи в латці підтримують відносні шляхи (від каталогу робочого простору) та абсолютні шляхи.
- Значенням `tools.exec.applyPatch.workspaceOnly` за замовчуванням є `true` (у межах робочого простору). Установлюйте його в `false`, лише якщо ви свідомо хочете, щоб `apply_patch` записував або видаляв файли поза каталогом робочого простору.
- Використовуйте `*** Move to:` у фрагменті `*** Update File:`, щоб перейменовувати файли.
- `*** End of File` позначає вставку лише в кінець файлу, коли це потрібно.
- Увімкнено за замовчуванням для кожної моделі. Установіть `tools.exec.applyPatch.enabled: false`,
  щоб вимкнути цю можливість, або обмежте її певними моделями за допомогою
  `tools.exec.applyPatch.allowModels` (приймає необроблені ідентифікатори на кшталт `gpt-5.4` або повні
  ідентифікатори на кшталт `openai/gpt-5.4`).
- Конфігурація міститься в `tools.exec.applyPatch.*`.

## Приклад

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Відмінності" href="/uk/tools/diffs" icon="code-compare">
    Засіб перегляду відмінностей лише для читання для представлення змін.
  </Card>
  <Card title="Інструмент Exec" href="/uk/tools/exec" icon="terminal">
    Виконання команд оболонки агентом.
  </Card>
  <Card title="Виконання коду" href="/uk/tools/code-execution" icon="square-code">
    Ізольований віддалений аналіз Python за допомогою xAI.
  </Card>
</CardGroup>
