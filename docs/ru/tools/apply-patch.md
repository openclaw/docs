---
read_when:
    - Вам нужно внести структурированные изменения в несколько файлов
    - Вы хотите документировать или отлаживать изменения на основе патчей
summary: Применяйте изменения к нескольким файлам с помощью инструмента apply_patch
title: инструмент apply_patch
x-i18n:
    generated_at: "2026-07-12T11:53:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Применяйте изменения файлов с помощью структурированного формата патча. Это идеально подходит для правок в нескольких файлах
или нескольких фрагментах, когда один вызов `edit` был бы ненадёжным.

Инструмент принимает одну строку `input`, содержащую одну или несколько операций с файлами:

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

## Параметры

- `input` (обязательный): полное содержимое патча, включая `*** Begin Patch` и `*** End Patch`.

## Примечания

- Пути в патче могут быть относительными (от каталога рабочей области) или абсолютными.
- По умолчанию `tools.exec.applyPatch.workspaceOnly` имеет значение `true` (только в пределах рабочей области). Устанавливайте значение `false`, только если намеренно хотите разрешить `apply_patch` записывать или удалять файлы за пределами каталога рабочей области.
- Используйте `*** Move to:` внутри фрагмента `*** Update File:`, чтобы переименовывать файлы.
- `*** End of File` обозначает вставку исключительно в конец файла, когда это необходимо.
- По умолчанию включено для каждой модели. Установите `tools.exec.applyPatch.enabled: false`,
  чтобы отключить эту возможность, либо ограничьте её определёнными моделями с помощью
  `tools.exec.applyPatch.allowModels` (принимает простые идентификаторы, например `gpt-5.4`, или полные,
  например `openai/gpt-5.4`).
- Настройки находятся в разделе `tools.exec.applyPatch.*`.

## Пример

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Различия" href="/ru/tools/diffs" icon="code-compare">
    Средство просмотра различий только для чтения, предназначенное для представления изменений.
  </Card>
  <Card title="Инструмент Exec" href="/ru/tools/exec" icon="terminal">
    Выполнение команд оболочки агентом.
  </Card>
  <Card title="Выполнение кода" href="/ru/tools/code-execution" icon="square-code">
    Изолированный удалённый анализ Python с помощью xAI.
  </Card>
</CardGroup>
