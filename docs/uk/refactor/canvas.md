---
read_when:
    - Перенесення відповідальності за хост Canvas, інструменти, команди, документацію або протокол
    - Перевірка, чи Canvas досі належить ядру
    - Підготовка або перевірка PR експериментального Canvas Plugin
summary: План і контрольний список аудиту для перенесення Canvas з ядра до вбудованого експериментального Plugin.
title: Рефакторинг Canvas Plugin
x-i18n:
    generated_at: "2026-05-07T15:13:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Рефакторинг Canvas Plugin

Canvas використовується мало й є експериментальним. Розглядайте його як вбудований Plugin, а не як основну функцію ядра. Ядро може зберігати загальну обв’язку Gateway, Node, HTTP, автентифікації, конфігурації та нативного клієнта, але специфічна для Canvas поведінка має жити в `extensions/canvas`.

## Мета

Перенести володіння Canvas до `extensions/canvas`, зберігши поточну поведінку спареного Node:

- агентський інструмент `canvas` реєструється Canvas Plugin
- команди Canvas Node дозволені лише тоді, коли Canvas Plugin їх реєструє
- файли хоста/джерел A2UI живуть у Canvas Plugin
- матеріалізація документів Canvas живе у Canvas Plugin
- реалізація команди CLI живе у Canvas Plugin або делегує через runtime barrel, яким володіє Plugin
- документація та інвентар Plugin описують Canvas як експериментальний і підтриманий Plugin

## Нецілі

- Не переробляти Canvas UI нативного застосунку в цьому рефакторингу.
- Не видаляти підтримку протоколу/клієнта Canvas з iOS, Android або macOS, якщо окреме продуктове рішення не каже, що Canvas потрібно видалити.
- Не будувати широкий фреймворк сервісів Plugin лише для Canvas, якщо принаймні один інший вбудований Plugin не потребує такого самого шва.

## Поточний стан гілки

Зроблено:

- Додано пакет вбудованого Plugin у `extensions/canvas`.
- Додано `extensions/canvas/openclaw.plugin.json`.
- Переміщено агентський інструмент `canvas` з `src/agents/tools/canvas-tool.ts` до `extensions/canvas/src/tool.ts`.
- Видалено реєстрацію `createCanvasTool` у ядрі з `src/agents/openclaw-tools.ts`.
- Переміщено реалізацію хоста Canvas з `src/canvas-host` до `extensions/canvas/src/host`.
- Залишено `extensions/canvas/runtime-api.ts` як сумісний barrel, яким володіє Plugin, для тестів, пакування та зовнішніх публічних помічників Canvas.
- Переміщено матеріалізацію документів Canvas з `src/gateway/canvas-documents.ts` до `extensions/canvas/src/documents.ts`.
- Переміщено реалізацію Canvas CLI та JSONL-помічники A2UI до `extensions/canvas/src/cli.ts`.
- Переміщено URL хоста Canvas і scoped capability-помічники до `extensions/canvas/src`.
- Переміщено типові значення команд Canvas Node з жорстко закодованих списків ядра до Plugin `nodeInvokePolicies`.
- Додано конфігурацію хоста Canvas, якою володіє Plugin, у `plugins.entries.canvas.config.host`.
- Переміщено HTTP-обслуговування Canvas і A2UI за реєстрацію HTTP-маршрутів Canvas Plugin.
- Додано загальну диспетчеризацію оновлень WebSocket Plugin для HTTP-маршрутів, якими володіє Plugin.
- Замінено специфічні для Canvas URL хоста Gateway та автентифікацію capability Node на загальну поверхню розміщеного Plugin і помічники capability Node.
- Додано hosted media resolver, яким володіє Plugin, щоб URL документів Canvas розв’язувалися через Canvas Plugin, а не через імпорт ядром внутрішніх частин документів Canvas.
- Додано `api.registerNodeCliFeature(...)`, щоб Canvas міг оголошувати `openclaw nodes canvas` як функцію Node, якою володіє Plugin, без ручного прописування шляху батьківської команди.
- Видалено production-імпорти `extensions/canvas/runtime-api.js` з `src/**`.
- Переміщено джерело пакета A2UI з `apps/shared/OpenClawKit/Tools/CanvasA2UI` до `extensions/canvas/src/host/a2ui-app`.
- Переміщено реалізацію збирання/копіювання A2UI під `extensions/canvas/scripts` і замінено кореневу прив’язку збірки загальними хуками ресурсів вбудованих Plugin.
- Видалено runtime-застарілий верхньорівневий псевдонім конфігурації `canvasHost`.
- Залишено міграцію Canvas doctor, щоб `openclaw doctor --fix` переписував старі конфігурації `canvasHost` у `plugins.entries.canvas.config.host`.
- Видалено сумісність протоколу Canvas для старих агентів за Gateway protocol v4. Нативні клієнти та Gateway тепер використовують лише `pluginSurfaceUrls.canvas` плюс `node.pluginSurface.refresh`; застарілий шлях `canvasHostUrl`, `canvasCapability` і `node.canvas.capability.refresh` навмисно не підтримується в цьому експериментальному рефакторингу.
- Оновлено згенерований інвентар Plugin, щоб включити Canvas.
- Додано довідкову документацію Plugin у `docs/plugins/reference/canvas.md`.

Відомі поверхні Canvas, якими й далі володіє ядро:

- обробники Canvas нативного застосунку під `apps/` досі навмисно споживають поверхню Canvas Plugin
- обробники протоколу/клієнта Canvas нативного застосунку під `apps/`
- вихід опублікованого артефакту досі використовує `dist/canvas-host/a2ui` для зворотно сумісного runtime-пошуку, але крок копіювання тепер належить Plugin

## Цільова форма

`extensions/canvas` має володіти:

- маніфестом Plugin і метаданими пакета
- реєстрацією агентського інструмента
- політикою команд виклику Node
- хостом Canvas і runtime A2UI
- джерелом пакета Canvas A2UI і скриптами збирання/копіювання ресурсів
- створенням документів Canvas і розв’язанням ресурсів
- реалізацією Canvas CLI
- сторінкою документації Canvas і записом інвентарю Plugin

Ядро має володіти лише загальними швами:

- виявленням і реєстрацією Plugin
- загальним реєстром агентських інструментів
- загальним реєстром політик виклику Node
- загальними Gateway HTTP/автентифікацією і диспетчеризацією оновлень WebSocket
- загальним розв’язанням URL поверхні розміщеного Plugin
- загальною реєстрацією hosted media resolver
- загальним транспортом capability Node
- загальною обв’язкою конфігурації
- загальним виявленням хуків ресурсів вбудованого Plugin

Нативні застосунки можуть зберігати обробники команд Canvas як клієнти протоколу. Вони не є власником runtime Plugin.

## Кроки міграції

1. Розглядати `plugins.entries.canvas.config.host` як конфігураційну поверхню, якою володіє Plugin.
2. Оновити документацію, щоб Canvas описувався як експериментальний вбудований Plugin.
3. Запустити сфокусовані тести Canvas, перевірки інвентарю Plugin, перевірки API Plugin SDK і build/type-гейти, на які впливають runtime-межі.

## Контрольний список аудиту

Перед тим як вважати рефакторинг завершеним:

- `rg "src/canvas-host|../canvas-host"` не повертає живих імпортів джерел.
- `rg "canvas-tool|createCanvasTool" src` не знаходить реалізації інструмента Canvas, якою володіє ядро.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` не знаходить жорстко закодованих типових allowlist поза загальними тестами політики Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` порожній.
- `rg "canvas-documents" src` порожній.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` порожній; Canvas Plugin реєструє `openclaw nodes canvas` через вкладені метадані Plugin CLI.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` не повертає володіння runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` знаходить лише сумісні wrappers або шляхи, якими володіє Plugin.
- `pnpm plugins:inventory:check` проходить.
- `pnpm plugin-sdk:api:check` проходить, або згенеровані базові лінії API навмисно оновлені й переглянуті.
- Цільові тести Canvas проходять.
- Тести changed-lanes проходять для шляхів Canvas host/A2UI.
- Тіло PR явно каже, що Canvas експериментальний і підтриманий Plugin.

## Команди перевірки

Використовуйте цільові локальні перевірки під час ітерацій:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Запустіть `pnpm build` перед push, якщо змінюється runtime barrel, lazy import, пакування або опубліковані поверхні Plugin.
