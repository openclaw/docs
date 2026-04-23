---
read_when:
    - Додавання нової core-можливості та поверхні реєстрації Plugin иҭanalysis to=functions.read ៏ញ្ញា ҭарнакjson  content={"path":"docs/plugins/adding-capabilities.md","offset":1,"limit":400}
    - Вирішення, чи має код належати core, vendor Plugin чи feature Plugin
    - Підключення нового runtime helper-а для каналів або tools
sidebarTitle: Adding Capabilities
summary: Посібник для контриб’юторів щодо додавання нової спільної можливості до системи Plugin OpenClaw
title: Додавання можливостей (посібник для контриб’юторів)
x-i18n:
    generated_at: "2026-04-23T21:13:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5939c129d25ffe58bca97e77da99f12344c3ec3c1657bac3c9b756f89acb1de
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Це **посібник для контриб’юторів** для core-розробників OpenClaw. Якщо ви
  створюєте зовнішній Plugin, див. натомість [Building Plugins](/uk/plugins/building-plugins).
</Info>

Використовуйте це, коли OpenClaw потрібна нова доменна область, наприклад генерування зображень, генерування відео або якась майбутня функціональна область, керована vendor-ом.

Правило:

- plugin = межа володіння
- capability = спільний контракт core

Це означає, що не слід починати з прямого підключення vendor-а до каналу чи
tool. Починайте з визначення capability.

## Коли створювати capability

Створюйте нову capability, коли всі ці умови істинні:

1. її потенційно може реалізувати більше ніж один vendor
2. channels, tools або feature plugins повинні споживати її, не зважаючи на
   vendor-а
3. core має володіти fallback, policy, config або поведінкою доставки

Якщо робота стосується лише vendor-а і спільного контракту ще не існує, зупиніться й спочатку визначте контракт.

## Стандартна послідовність

1. Визначте типізований контракт core.
2. Додайте реєстрацію Plugin для цього контракту.
3. Додайте спільний runtime helper.
4. Підключіть один реальний Plugin vendor-а як доказ.
5. Переведіть споживачів feature/channel на runtime helper.
6. Додайте contract tests.
7. Задокументуйте операторську конфігурацію та модель володіння.

## Що куди належить

Core:

- типи request/response
- реєстр provider-ів + resolution
- поведінка fallback
- схема конфігурації плюс поширені метадані docs `title` / `description` на вкладені object, wildcard, array-item і composition nodes
- поверхня runtime helper-а

Vendor Plugin:

- виклики API vendor-а
- обробка auth vendor-а
- нормалізація запитів, специфічна для vendor-а
- реєстрація реалізації capability

Feature/channel Plugin:

- викликає `api.runtime.*` або відповідний helper `plugin-sdk/*-runtime`
- ніколи не викликає реалізацію vendor-а напряму

## Контрольний список файлів

Для нової capability очікуйте зміни в цих областях:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- один або кілька пакетів вбудованих plugins
- config/docs/tests

## Приклад: генерування зображень

Генерування зображень відповідає стандартній схемі:

1. core визначає `ImageGenerationProvider`
2. core відкриває `registerImageGenerationProvider(...)`
3. core відкриває `runtime.imageGeneration.generate(...)`
4. plugins `openai`, `google`, `fal` і `minimax` реєструють реалізації, керовані vendor-ами
5. майбутні vendors можуть реєструвати той самий контракт без змін у channels/tools

Ключ конфігурації відокремлений від маршрутизації аналізу vision:

- `agents.defaults.imageModel` = аналізувати зображення
- `agents.defaults.imageGenerationModel` = генерувати зображення

Тримайте їх окремо, щоб fallback і policy залишалися явними.

## Контрольний список перед рев’ю

Перед випуском нової capability перевірте:

- жоден channel/tool не імпортує код vendor-а напряму
- runtime helper є спільним шляхом
- принаймні один contract test перевіряє вбудоване володіння
- docs конфігурації називають новий ключ model/config
- docs Plugin пояснюють межу володіння

Якщо PR пропускає шар capability і зашиває поведінку vendor-а прямо в
channel/tool, заверніть його назад і спочатку визначте контракт.
