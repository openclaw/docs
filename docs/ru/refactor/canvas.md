---
read_when:
    - Перенос владения Canvas-хостом, инструментами, командами, документацией или протоколом
    - Проверка, остается ли Canvas в зоне владения ядра
    - Подготовка или проверка PR экспериментального plugin Canvas
summary: План и контрольный список аудита для выноса Canvas из ядра в комплектный экспериментальный plugin.
title: Рефакторинг Plugin Canvas
x-i18n:
    generated_at: "2026-06-28T23:41:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Рефакторинг Canvas Plugin

Canvas используется редко и является экспериментальным. Рассматривайте его как встроенный Plugin, а не как функцию ядра. Ядро может сохранять универсальную обвязку Gateway, Node, HTTP, аутентификации, конфигурации и нативного клиента, но поведение, специфичное для Canvas, должно находиться в `extensions/canvas`.

## Цель

Перенести владение Canvas в `extensions/canvas`, сохранив текущее поведение парного Node:

- агентский инструмент `canvas` регистрируется Canvas Plugin
- команды Canvas Node разрешены только тогда, когда Canvas Plugin регистрирует их
- файлы хоста/исходников A2UI находятся в Canvas Plugin
- материализация документов Canvas находится в Canvas Plugin
- реализация CLI-команды находится в Canvas Plugin или делегирует через runtime barrel, принадлежащий Plugin
- документация и инвентарь Plugin описывают Canvas как экспериментальный и поддерживаемый Plugin

## Не цели

- Не перерабатывать Canvas UI нативного приложения в рамках этого рефакторинга.
- Не удалять поддержку протокола/клиента Canvas из iOS, Android или macOS, если отдельное продуктовое решение не говорит, что Canvas нужно удалить.
- Не строить широкий фреймворк сервисов Plugin только для Canvas, если хотя бы одному другому встроенному Plugin не нужен такой же шов.

## Текущее состояние ветки

Готово:

- Добавлен пакет встроенного Plugin в `extensions/canvas`.
- Добавлен `extensions/canvas/openclaw.plugin.json`.
- Агентский инструмент `canvas` перемещен из `src/agents/tools/canvas-tool.ts` в `extensions/canvas/src/tool.ts`.
- Удалена регистрация `createCanvasTool` в ядре из `src/agents/openclaw-tools.ts`.
- Реализация хоста Canvas перемещена из `src/canvas-host` в `extensions/canvas/src/host`.
- `extensions/canvas/runtime-api.ts` сохранен как совместимый barrel, принадлежащий Plugin, для тестов, упаковки и внешних публичных вспомогательных средств Canvas.
- Материализация документов Canvas перемещена из `src/gateway/canvas-documents.ts` в `extensions/canvas/src/documents.ts`.
- Реализация Canvas CLI и вспомогательные средства A2UI JSONL перемещены в `extensions/canvas/src/cli.ts`.
- URL хоста Canvas и вспомогательные средства ограниченных capabilities перемещены в `extensions/canvas/src`.
- Значения по умолчанию для команд Canvas Node вынесены из жестко заданных списков ядра в `nodeInvokePolicies` Plugin.
- Добавлена конфигурация хоста Canvas, принадлежащая Plugin, в `plugins.entries.canvas.config.host`.
- HTTP-обслуживание Canvas и A2UI перенесено за регистрацию HTTP-маршрутов Canvas Plugin.
- Добавлена универсальная диспетчеризация WebSocket upgrade для HTTP-маршрутов, принадлежащих Plugin.
- Специфичные для Canvas URL хоста Gateway и авторизация capabilities Node заменены универсальной поверхностью размещенного Plugin и вспомогательными средствами capabilities Node.
- Добавлены резолверы размещенных медиа, принадлежащие Plugin, чтобы URL документов Canvas разрешались через Canvas Plugin, а не через импорт ядром внутренних модулей документов Canvas.
- Добавлен `api.registerNodeCliFeature(...)`, чтобы Canvas мог объявлять `openclaw nodes canvas` как функцию Node, принадлежащую Plugin, без ручного указания пути родительской команды.
- Удалены production-импорты `extensions/canvas/runtime-api.js` из `src/**`.
- Исходники A2UI bundle перемещены из `apps/shared/OpenClawKit/Tools/CanvasA2UI` в `extensions/canvas/src/host/a2ui-app`.
- Реализация сборки/копирования A2UI перемещена в `extensions/canvas/scripts`, а корневая проводка сборки заменена универсальными asset hooks встроенного Plugin.
- Удален runtime-legacy псевдоним конфигурации верхнего уровня `canvasHost`.
- Сохранена миграция doctor для Canvas, чтобы `openclaw doctor --fix` переписывал старые конфигурации `canvasHost` в `plugins.entries.canvas.config.host`.
- Удалена совместимость протокола Canvas для старых агентов за Gateway protocol v4. Нативные клиенты и Gateway теперь используют только `pluginSurfaceUrls.canvas` плюс `node.pluginSurface.refresh`; устаревший путь `canvasHostUrl`, `canvasCapability` и `node.canvas.capability.refresh` намеренно не поддерживается в этом экспериментальном рефакторинге.
- Обновлен сгенерированный инвентарь Plugin, чтобы включить Canvas.
- Добавлена справочная документация Plugin в `docs/plugins/reference/canvas.md`.

Известные оставшиеся поверхности Canvas, принадлежащие ядру:

- Обработчики Canvas нативного приложения в `apps/` все еще намеренно потребляют поверхность Canvas Plugin
- обработчики протокола/клиента Canvas нативного приложения в `apps/`
- выход опубликованного артефакта все еще использует `dist/canvas-host/a2ui` для обратно совместимого runtime lookup, но шаг копирования теперь принадлежит Plugin

## Целевая форма

`extensions/canvas` должен владеть:

- манифестом Plugin и метаданными пакета
- регистрацией агентского инструмента
- политикой команд node invoke
- хостом Canvas и runtime A2UI
- исходниками Canvas A2UI bundle и скриптами сборки/копирования assets
- созданием документов Canvas и разрешением assets
- реализацией Canvas CLI
- страницей документации Canvas и записью в инвентаре Plugin

Ядро должно владеть только универсальными швами:

- обнаружением и регистрацией Plugin
- универсальным реестром агентских инструментов
- универсальным реестром политик node invoke
- универсальными HTTP/аутентификацией Gateway и диспетчеризацией WebSocket upgrade
- универсальным разрешением URL поверхности размещенного Plugin
- универсальной регистрацией резолверов размещенных медиа
- универсальным транспортом capabilities Node
- универсальной проводкой конфигурации
- универсальным обнаружением asset hooks встроенного Plugin

Нативные приложения могут сохранять обработчики команд Canvas как клиенты протокола. Они не являются владельцем runtime Plugin.

## Шаги миграции

1. Рассматривать `plugins.entries.canvas.config.host` как поверхность конфигурации, принадлежащую Plugin.
2. Обновить документацию, чтобы Canvas описывался как экспериментальный встроенный Plugin.
3. Запустить целевые тесты Canvas, проверки инвентаря Plugin, проверки API Plugin SDK и build/type gates, затронутые runtime-границами.

## Аудит-чеклист

Перед тем как считать рефакторинг завершенным:

- `rg "src/canvas-host|../canvas-host"` не возвращает живых импортов исходного кода.
- `rg "canvas-tool|createCanvasTool" src` не находит реализации инструмента Canvas, принадлежащей ядру.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` не находит жестко заданных allowlist defaults вне тестов универсальной политики Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` пуст.
- `rg "canvas-documents" src` пуст.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` пуст; Canvas Plugin регистрирует `openclaw nodes canvas` через вложенные метаданные Plugin CLI.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` не возвращает runtime-владения Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` находит только совместимые wrappers или пути, принадлежащие Plugin.
- `pnpm plugins:inventory:check` проходит.
- `pnpm plugin-sdk:api:check` проходит, либо сгенерированные базовые линии API намеренно обновлены и проверены.
- Целевые тесты Canvas проходят.
- Changed-lanes tests проходят для путей Canvas host/A2UI.
- Тело PR явно говорит, что Canvas экспериментальный и поддерживается Plugin.

## Команды проверки

Используйте целевые локальные проверки во время итераций:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Запустите `pnpm build` перед push, если изменяются runtime barrel, lazy import, упаковка или опубликованные поверхности Plugin.
