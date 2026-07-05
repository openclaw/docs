---
read_when:
    - Ви запустили clawhub package validate і маєте виправити зауваження щодо Plugin
    - ClawHub відхилив або попередив під час публікації пакета Plugin
    - Ви оновлюєте метадані пакета Plugin перед релізом
summary: Виправте зауваження валідації пакета Plugin ClawHub перед публікацією
title: Виправлення валідації Plugin
x-i18n:
    generated_at: "2026-07-05T08:22:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення валідації Plugin

ClawHub перевіряє пакети Plugin перед публікацією, а також може показувати знахідки з
автоматизованих сканувань пакетів. Ця сторінка охоплює знахідки для авторів, тобто
знахідки, які автор Plugin може виправити в метаданих пакета, маніфесті, імпортах SDK
або опублікованому артефакті.

Вона не охоплює внутрішні знахідки покриття Plugin Inspector. Якщо повний звіт
містить коди обслуговування сканера без вказівок щодо виправлення автором, вони
призначені для супровідників OpenClaw, а не для авторів Plugin.

Після застосування будь-якого виправлення запустіть повторно:

```bash
clawhub package validate <path-to-plugin>
```

## Знахідки для авторів

| Код                                     | Почніть тут                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Додайте метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                          |
| `package-openclaw-metadata-missing`     | [Додайте блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                        |
| `package-openclaw-entry-missing`        | [Оголосіть точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                  |
| `package-entrypoint-missing`            | [Опублікуйте оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                          |
| `package-install-metadata-incomplete`   | [Заповніть метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                   |
| `package-plugin-api-compat-missing`     | [Оголосіть сумісність API Plugin](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                     |
| `package-min-host-version-drift`        | [Узгодьте мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                       |
| `package-manifest-version-drift`        | [Узгодьте версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                     |
| `package-openclaw-unsupported-metadata` | [Видаліть непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Зробіть npm-артефакт придатним до пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)              |
| `package-npm-pack-entrypoint-missing`   | [Додайте точки входу до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)            |
| `package-npm-pack-metadata-missing`     | [Додайте метадані до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                 |
| `manifest-name-missing`                 | [Додайте відображувану назву маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                           |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                        |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                   |
| `legacy-root-sdk-import`                | [Замініть кореневі імпорти SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                  |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                |
| `sdk-load-session-store`                | [Замініть доступ до сховища всього сеансу](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                       |
| `sdk-session-store-write`               | [Замініть записи до сховища всього сеансу](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                      |
| `sdk-session-file-helper`               | [Замініть допоміжні функції шляхів файлів сеансу](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)               |
| `sdk-session-transcript-file-target`    | [Замініть застарілі цілі файлів транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)        |
| `sdk-session-transcript-low-level`      | [Замініть низькорівневі допоміжні функції транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level) |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                 |
| `provider-auth-env-vars`                | [Перемістіть змінні середовища провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Віддзеркальте змінні середовища каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)          |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступні схеми маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)        |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може визначити
npm-пакет, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` із `name`, `version` і `type`.
- Додайте блок `openclaw`, коли пакет постачає OpenClaw Plugin.
- Скористайтеся [Створенням Plugin](/uk/plugins/building-plugins) для мінімального прикладу пакета
  та [Маніфестом Plugin](/uk/plugins/manifest#manifest-versus-packagejson)
  для розділення пакета й маніфесту.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет має `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точок входу, як-от `openclaw.extensions` або
  `openclaw.runtimeExtensions`.
- Додайте метадані сумісності й встановлення, коли пакет буде опубліковано або
  встановлено через ClawHub.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета існують, але вони не оголошують точку входу середовища виконання
OpenClaw.

- Додайте `openclaw.extensions` для нативних точок входу Plugin.
- Додайте `openclaw.runtimeExtensions`, коли опублікований пакет має завантажувати зібраний
  JavaScript.
- Тримайте всі шляхи точок входу всередині каталогу пакета.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints) і
  [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але файл, на який є посилання, відсутній
у пакеті, що перевіряється.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` і `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точка входу генерується в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як пакет має встановлюватися або оновлюватися.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, як-от
  `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, коли доступно більше одного джерела
  встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон API Plugin OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API Plugin OpenClaw або мінімальну semver-версію, відносно якої ви збирали й тестували.
- Тримайте це окремо від версії пакета. Версія пакета описує реліз
  Plugin; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не збігається з метаданими версії OpenClaw,
відносно яких пакет було зібрано.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте будь-які метадані збірки OpenClaw у пакеті, як-от версію OpenClaw,
  використану під час релізу.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет
  фактично підтримує.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту Plugin не збігаються.

- Надавайте перевагу `package.json#version` як версії релізу пакета.
- Якщо `openclaw.plugin.json` також має `version`, оновіть її, щоб вона збігалася, або видаліть
  застарілі метадані версії маніфесту, коли метадані пакета є авторитетними.
- Опублікуйте нову версію пакета після зміни опублікованих метаданих.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються
метаданими пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Тримайте нативні метадані Plugin в `openclaw.plugin.json`.
- Тримайте точки входу пакета, сумісність, встановлення, налаштування й метадані каталогу
  в підтримуваних полях `package.json#openclaw`.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет не можна запакувати в артефакт, який ClawHub перевіряв би або
публікував.

- Запустіть `npm pack --dry-run` із кореня пакета.
- Виправте некоректні метадані пакета, зламані lifecycle-скрипти або записи files, через які
  пакування завершується невдало.
- Видаліть `private: true`, якщо цей пакет призначено для публічної публікації.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить файли
точок входу, оголошені в `package.json#openclaw`.

- Запустіть `npm pack --dry-run` і перевірте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або вивід збірки, щоб оголошені точки входу були
  включені.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті бракує метаданих OpenClaw, які існують у вашому вихідному
пакеті.

- Запустіть `npm pack --dry-run` і перевірте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, коли пакет є нативним
  OpenClaw Plugin.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не були виключені.
- Див. [Створення Plugin](/uk/plugins/building-plugins).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Маніфест нативного Plugin не містить відображуваної назви.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Зробіть `name` зрозумілим для людей, а `id` залиште стабільним машинним ідентифікатором.
- Див. [маніфест Plugin](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест Plugin має поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть користувацькі поля з `openclaw.plugin.json`.
- Перенесіть метадані пакета або встановлення до підтримуваних полів `package.json#openclaw`
  замість маніфесту.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` з
  [довідником contracts](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі contract.
- Перенесіть поведінку runtime до коду реєстрації Plugin, а `contracts`
  обмежте статичними метаданими володіння можливостями.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## SDK і міграція сумісності

### legacy-root-sdk-import

Plugin імпортує із застарілого кореневого barrel SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого barrel на сфокусовані імпорти з публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних функцій точки входу каналу.
- Використовуйте [угоди щодо імпортів](/uk/plugins/building-plugins#import-conventions) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths), щоб знайти вузький імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin імпортує шлях SDK, зарезервований для вбудованих Plugin або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти OpenClaw SDK на документовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо поведінка не має публічного SDK, залиште допоміжну функцію всередині свого пакета або
  запросіть публічний OpenClaw API.
- Використовуйте [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths) і
  [міграцію SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin досі використовує застарілу допоміжну функцію всього сховища сесій
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сесії.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сесії.
- Уникайте завантаження, змінення та збереження всього об'єкта сховища сесій.
- Залишайте `loadSessionStore(...)` лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким це потрібно.
- Див. [Runtime API](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin досі використовує застарілу допоміжну функцію запису всього сховища сесій, як-от
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` під час оновлення полів наявного запису
  сесії.
- Використовуйте `upsertSessionEntry(...)` під час заміни або створення запису сесії.
- Уникайте завантаження, змінення та збереження всього об'єкта сховища сесій.
- Залишайте допоміжні функції запису всього сховища лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [Runtime API](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin досі використовує застарілі допоміжні функції шляхів до файлів сесій, як-от
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сесії за ідентичністю агента й сесії.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані сесії.
- Використовуйте ідентичність транскрипта або допоміжні функції target, коли код готує
  операцію з транскриптом.
- Не зберігайте застарілі шляхи до файлів транскриптів і не залежте від них.
- Див. [Runtime API](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin досі використовує застарілу допоміжну функцію target файла транскрипта
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сесії.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібен структурований
  target операції з транскриптом.
- Уникайте прямого читання або створення застарілих target файлів транскриптів.
- Залишайте застарілу допоміжну функцію лише доки ваш оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким вона потрібна.
- Див. [Runtime API](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin досі використовує застарілі низькорівневі допоміжні функції транскриптів, як-от
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для додавання до транскрипта.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  транскрипта.
- Надавайте перевагу структурованій runtime-поверхні транскриптів, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і обробку ідентичності.
- Залишайте низькорівневі допоміжні функції транскриптів лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [Runtime API](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin досі використовує застарілий hook `before_agent_start`.

- Перенесіть роботу з перевизначення моделі або провайдера до `before_model_resolve`.
- Перенесіть роботу зі змінення prompt або контексту до `before_prompt_build`.
- Залишайте `before_agent_start` лише доки ваш оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [Hooks](/uk/plugins/hooks) і
  [сумісність Plugin](/uk/plugins/compatibility).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані авторизації провайдера `providerAuthEnvVars`.

- Віддзеркальте метадані env-var провайдера в `setup.providers[].envVars`.
- Залишайте `providerAuthEnvVars` лише як метадані сумісності, доки ваш підтримуваний
  діапазон OpenClaw ще потребує їх.
- Див. [довідник setup](/uk/plugins/manifest#setup-reference) і
  [міграцію SDK](/uk/plugins/sdk-migration).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані env-var каналу без поточних
метаданих setup або config, які очікує ClawHub.

- Залишайте метадані env-var каналу декларативними, щоб OpenClaw міг перевіряти стан setup
  без завантаження runtime каналу.
- Віддзеркальте setup каналу на основі env до поточного setup, config каналу або
  метаданих каналу пакета, які використовує форма вашого Plugin.
- Залишайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw ще потребують їх.
- Див. [маніфест Plugin](/uk/plugins/manifest) і
  [Plugin каналів](/uk/plugins/sdk-channel-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачає `openclaw.security.json` з посиланням на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL схеми, якщо він має лише рекомендаційний характер.
- Використовуйте документовану версіоновану схему лише після того, як OpenClaw опублікує її.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачає непідтримуваний файл маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему маніфесту безпеки
  та поведінку ClawHub.
- Тримайте чутливу до безпеки поведінку задокументованою в публічній документації пакета або
  README, доки контракт маніфесту не існуватиме.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Пов'язане

- [ClawHub CLI](/uk/clawhub/cli)
- [публікація ClawHub](/uk/clawhub/publishing)
- [створення Plugins](/uk/plugins/building-plugins)
- [маніфест Plugin](/uk/plugins/manifest)
- [точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [сумісність Plugin](/uk/plugins/compatibility)
