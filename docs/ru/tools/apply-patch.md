---
read_when:
    - Вам нужны структурированные правки файлов в нескольких файлах
    - Вы хотите документировать или отлаживать правки на основе патчей
summary: Применяйте многофайловые патчи с помощью инструмента apply_patch
title: инструмент apply_patch
x-i18n:
    generated_at: "2026-06-28T23:49:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Применяйте изменения файлов с помощью структурированного формата патчей. Это идеально подходит для многофайловых
или многофрагментных правок, когда один вызов `edit` был бы ненадежным.

Инструмент принимает одну строку `input`, которая оборачивает одну или несколько файловых операций:

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

## Параметры

- `input` (обязательно): Полное содержимое патча, включая `*** Begin Patch` и `*** End Patch`.

## Примечания

- Пути в патче поддерживают относительные пути (от каталога рабочей области) и абсолютные пути.
- `tools.exec.applyPatch.workspaceOnly` по умолчанию имеет значение `true` (в пределах рабочей области). Устанавливайте `false` только если намеренно хотите, чтобы `apply_patch` записывал/удалял файлы за пределами каталога рабочей области.
- Используйте `*** Move to:` внутри фрагмента `*** Update File:`, чтобы переименовывать файлы.
- `*** End of File` при необходимости помечает вставку только в конец файла.
- Доступно по умолчанию для моделей OpenAI и OpenAI Codex. Установите
  `tools.exec.applyPatch.enabled: false`, чтобы отключить это.
- При необходимости ограничьте по модели через
  `tools.exec.applyPatch.allowModels`.
- Конфигурация находится только в `tools.exec`.

## Пример

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Связанное

<CardGroup cols={2}>
  <Card title="Различия" href="/ru/tools/diffs" icon="code-compare">
    Средство просмотра различий только для чтения для представления изменений.
  </Card>
  <Card title="Инструмент Exec" href="/ru/tools/exec" icon="terminal">
    Выполнение команд оболочки из агента.
  </Card>
  <Card title="Выполнение кода" href="/ru/tools/code-execution" icon="square-code">
    Изолированный удаленный анализ Python с xAI.
  </Card>
</CardGroup>
