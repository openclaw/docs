---
read_when:
    - Ви запустили `clawhub package validate` і маєте виправити висновки Plugin
    - ClawHub відхилив або видав попередження під час публікації пакета Plugin
    - Ви оновлюєте метадані пакета Plugin перед випуском
summary: Виправте зауваження щодо валідації пакета Plugin ClawHub перед публікацією
title: Виправлення валідації Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення перевірки Plugin

ClawHub перевіряє пакети плагінів перед публікацією, а також може показувати результати автоматизованого сканування пакетів. Ця сторінка охоплює результати для авторів, тобто результати, які автор плагіна може виправити в метаданих пакета, маніфесті, імпортах SDK або опублікованому артефакті.

Вона не охоплює внутрішні результати покриття Plugin Inspector. Якщо повний звіт містить коди обслуговування сканера без інструкцій з виправлення для автора, вони призначені для супровідників OpenClaw, а не для авторів плагінів.

Після застосування будь-якого виправлення запустіть повторно:

```bash
clawhub package validate <path-to-plugin>
```

## Результати для авторів

| Код                                     | Почніть тут                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Додайте метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Додайте блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [Оголосіть точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                     |
| `package-entrypoint-missing`            | [Опублікуйте оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                             |
| `package-install-metadata-incomplete`   | [Доповніть метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                      |
| `package-plugin-api-compat-missing`     | [Оголосіть сумісність API плагіна](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                       |
| `package-min-host-version-drift`        | [Узгодьте мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                          |
| `package-manifest-version-drift`        | [Узгодьте версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                        |
| `package-openclaw-unsupported-metadata` | [Видаліть непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)   |
| `package-npm-pack-unavailable`          | [Зробіть артефакт npm придатним для пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                |
| `package-npm-pack-entrypoint-missing`   | [Додайте точки входу до результату npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)           |
| `package-npm-pack-metadata-missing`     | [Додайте метадані до результату npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                |
| `manifest-name-missing`                 | [Додайте відображувану назву маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                              |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                           |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                      |
| `legacy-root-sdk-import`                | [Замініть кореневі імпорти SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                     |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                   |
| `sdk-load-session-store`                | [Замініть доступ до всього сховища сеансу](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                          |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                    |
| `provider-auth-env-vars`                | [Перенесіть змінні середовища провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Віддзеркальте змінні середовища каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)             |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступні схеми маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)           |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може визначити пакет npm, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` з `name`, `version` і `type`.
- Додайте блок `openclaw`, якщо пакет постачає плагін OpenClaw.
- Використайте [Створення плагінів](/uk/plugins/building-plugins) як мінімальний приклад пакета та [Маніфест Plugin](/uk/plugins/manifest#manifest-versus-packagejson) для розмежування пакета й маніфесту.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет має `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точок входу, як-от `openclaw.extensions` або `openclaw.runtimeExtensions`.
- Додайте метадані сумісності та встановлення, якщо пакет буде опубліковано або встановлено через ClawHub.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета існують, але вони не оголошують точку входу середовища виконання OpenClaw.

- Додайте `openclaw.extensions` для нативних точок входу плагіна.
- Додайте `openclaw.runtimeExtensions`, коли опублікований пакет має завантажувати зібраний JavaScript.
- Зберігайте всі шляхи точок входу всередині каталогу пакета.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints) і [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але зазначений файл відсутній у пакеті, що перевіряється.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` і `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точка входу генерується в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як пакет потрібно встановлювати або оновлювати.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, як-от `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, коли доступно більше ніж одне джерело встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон API плагіна OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API плагіна OpenClaw або мінімальну semver-версію, відносно якої ви збирали й тестували.
- Тримайте це окремо від версії пакета. Версія пакета описує випуск плагіна; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не відповідає метаданим версії OpenClaw, відносно якої було зібрано пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте будь-які метадані збірки OpenClaw у пакеті, як-от версію OpenClaw, використану під час випуску.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет фактично підтримує.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту плагіна не збігаються.

- Надавайте перевагу `package.json#version` як версії випуску пакета.
- Якщо `openclaw.plugin.json` також має `version`, оновіть її, щоб вона збігалася, або видаліть застарілі метадані версії маніфесту, коли метадані пакета є авторитетними.
- Опублікуйте нову версію пакета після зміни опублікованих метаданих.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються як метадані пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Зберігайте нативні метадані плагіна в `openclaw.plugin.json`.
- Зберігайте точки входу пакета, сумісність, встановлення, налаштування та метадані каталогу в підтримуваних полях `package.json#openclaw`.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет неможливо запакувати в артефакт, який ClawHub перевіряв би або публікував.

- Запустіть `npm pack --dry-run` з кореня пакета.
- Виправте недійсні метадані пакета, зламані lifecycle-скрипти або записи файлів, через які пакування не вдається.
- Видаліть `private: true`, якщо цей пакет призначений для публічного опублікування.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить файлів точок входу, оголошених у `package.json#openclaw`.

- Запустіть `npm pack --dry-run` і перевірте файли, які було б включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або результат збірки, щоб оголошені точки входу були включені.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті відсутні метадані OpenClaw, які існують у вашому вихідному пакеті.

- Запустіть `npm pack --dry-run` і перевірте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, коли пакет є нативним плагіном OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не виключалися.
- Див. [Створення плагінів](/uk/plugins/building-plugins).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Маніфест нативного плагіна не містить відображуваної назви.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Зробіть `name` зрозумілим для людей, а `id` залиште стабільним машинним ідентифікатором.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест плагіна має поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть власні поля з `openclaw.plugin.json`.
- Перемістіть метадані пакета або встановлення в підтримувані поля
  `package.json#openclaw` замість маніфесту.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` з
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перемістіть поведінку середовища виконання в код реєстрації плагіна, а
  `contracts` обмежте статичними метаданими володіння можливостями.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## SDK і міграція сумісності

### legacy-root-sdk-import

Плагін імпортує із застарілого кореневого barrel SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого barrel на цільові імпорти з публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних засобів точки входу каналу.
- Скористайтеся [умовностями імпорту](/uk/plugins/building-plugins#import-conventions) і
  [підшляхами Plugin SDK](/uk/plugins/sdk-subpaths), щоб знайти вузький імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Плагін імпортує шлях SDK, зарезервований для вбудованих плагінів або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на документовані
  публічні підшляхи `openclaw/plugin-sdk/*`.
- Якщо поведінка не має публічного SDK, залиште допоміжний засіб усередині свого пакета або
  надішліть запит на публічний API OpenClaw.
- Скористайтеся [підшляхами Plugin SDK](/uk/plugins/sdk-subpaths) і
  [міграцією SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Плагін досі використовує застарілий допоміжний засіб усього сховища сеансу
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сеансу.
- Уникайте завантаження, змінення та збереження всього об’єкта сховища сеансу.
- Залишайте `loadSessionStore(...)` лише доки оголошений вами діапазон сумісності
  все ще підтримує старіші версії OpenClaw, які його потребують.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Плагін досі використовує застарілий хук `before_agent_start`.

- Перемістіть роботу з перевизначення моделі або провайдера до `before_model_resolve`.
- Перемістіть роботу зі змінення промпта або контексту до `before_prompt_build`.
- Залишайте `before_agent_start` лише доки оголошений вами діапазон сумісності все ще
  підтримує старіші версії OpenClaw, які його потребують.
- Див. [Хуки](/uk/plugins/hooks) і
  [сумісність плагінів](/uk/plugins/compatibility).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані автентифікації провайдера `providerAuthEnvVars`.

- Віддзеркальте метадані env-var провайдера в `setup.providers[].envVars`.
- Залишайте `providerAuthEnvVars` лише як метадані сумісності, доки ваш підтримуваний
  діапазон OpenClaw усе ще їх потребує.
- Див. [довідник setup](/uk/plugins/manifest#setup-reference) і
  [міграцію SDK](/uk/plugins/sdk-migration).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані env-var каналу без поточних
метаданих setup або config, яких очікує ClawHub.

- Залишайте метадані env-var каналу декларативними, щоб OpenClaw міг перевіряти статус setup
  без завантаження середовища виконання каналу.
- Віддзеркальте налаштування каналу на основі env у поточні метадані setup, config каналу або
  пакета каналу, які використовує форма вашого плагіна.
- Залишайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw усе ще їх потребують.
- Див. [маніфест Plugin](/uk/plugins/manifest) і
  [плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачає `openclaw.security.json` із посиланням на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL схеми, якщо він має лише рекомендаційний характер.
- Використовуйте документовану версіоновану схему лише після того, як OpenClaw її опублікує.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачає непідтримуваний файл маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему
  маніфесту безпеки та поведінку ClawHub.
- Документуйте поведінку, чутливу до безпеки, у публічній документації пакета або
  README, доки контракт маніфесту не існує.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Пов’язане

- [CLI ClawHub](/uk/clawhub/cli)
- [публікація ClawHub](/uk/clawhub/publishing)
- [створення плагінів](/uk/plugins/building-plugins)
- [маніфест Plugin](/uk/plugins/manifest)
- [точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [сумісність плагінів](/uk/plugins/compatibility)
