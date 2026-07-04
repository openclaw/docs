---
read_when:
    - Ви запустили clawhub package validate і маєте виправити зауваження щодо Plugin
    - ClawHub відхилив або попередив під час публікації пакета Plugin
    - Ви оновлюєте метадані пакета Plugin перед випуском
summary: Виправте зауваження перевірки пакета плагіна ClawHub перед публікацією
title: Виправлення перевірки Plugin
x-i18n:
    generated_at: "2026-07-04T20:42:11Z"
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
містить коди обслуговування сканера без інструкцій для автора щодо виправлення, вони
призначені для супровідників OpenClaw, а не для авторів Plugin.

Після застосування будь-якого виправлення повторно запустіть:

```bash
clawhub package validate <path-to-plugin>
```

## Знахідки для авторів

| Код                                     | Почніть тут                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Додайте метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Додайте блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Оголосіть точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Опублікуйте оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Заповніть метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Оголосіть сумісність API Plugin](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Узгодьте мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Узгодьте версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Видаліть непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Зробіть npm-артефакт придатним до пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Включіть точки входу у вивід npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Включіть метадані у вивід npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Додайте відображувану назву маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Замініть кореневі імпорти SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Замініть доступ до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Замініть записи до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Замініть допоміжні функції шляхів до файлів сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Замініть застарілі файлові цілі транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Замініть низькорівневі допоміжні функції транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Перенесіть env vars провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Віддзеркальте env vars каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступну схему маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може визначити
npm-пакет, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` з `name`, `version` і `type`.
- Додайте блок `openclaw`, коли пакет постачає Plugin OpenClaw.
- Використовуйте [Створення plugins](/uk/plugins/building-plugins) як мінімальний приклад пакета
  і [Маніфест Plugin](/uk/plugins/manifest#manifest-versus-packagejson)
  для розділення пакета й маніфесту.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет має `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Включіть метадані точок входу, як-от `openclaw.extensions` або
  `openclaw.runtimeExtensions`.
- Додайте метадані сумісності й встановлення, коли пакет буде опубліковано або
  встановлено через ClawHub.
- Див. [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета існують, але вони не оголошують точку входу runtime OpenClaw.

- Додайте `openclaw.extensions` для нативних точок входу Plugin.
- Додайте `openclaw.runtimeExtensions`, коли опублікований пакет має завантажувати зібраний
  JavaScript.
- Тримайте всі шляхи точок входу всередині каталогу пакета.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints) і
  [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але файл, на який є посилання, відсутній
у пакеті, що перевіряється.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` і `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точка входу генерується в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як пакет має встановлюватися або оновлюватися.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, як-от
  `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, коли доступно більше ніж одне джерело
  встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон API Plugin OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API Plugin OpenClaw або нижню межу semver, з якою ви збирали
  й тестували.
- Тримайте це окремо від версії пакета. Версія пакета описує
  реліз Plugin; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не відповідає метаданим версії OpenClaw,
з якими було зібрано пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте будь-які метадані збірки OpenClaw у пакеті, як-от версію OpenClaw,
  використану під час релізу.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет
  фактично підтримує.
- Див. [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту Plugin не збігаються.

- Надавайте перевагу `package.json#version` як версії релізу пакета.
- Якщо `openclaw.plugin.json` також має `version`, оновіть її, щоб вона збігалася, або видаліть
  застарілі метадані версії маніфесту, коли метадані пакета є авторитетними.
- Опублікуйте нову версію пакета після зміни опублікованих метаданих.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються
як метадані пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Тримайте нативні метадані Plugin у `openclaw.plugin.json`.
- Тримайте точки входу пакета, сумісність, встановлення, налаштування та метадані каталогу
  в підтримуваних полях `package.json#openclaw`.
- Див. [Поля package.json, які впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет не можна запакувати в артефакт, який ClawHub перевіряв би або
публікував.

- Запустіть `npm pack --dry-run` з кореня пакета.
- Виправте недійсні метадані пакета, зламані lifecycle scripts або записи files, які
  призводять до помилки пакування.
- Видаліть `private: true`, якщо цей пакет призначений для публічної публікації.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить файлів точок
входу, оголошених у `package.json#openclaw`.

- Запустіть `npm pack --dry-run` і перегляньте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або вивід збірки, щоб оголошені точки входу було
  включено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті відсутні метадані OpenClaw, які існують у вашому вихідному
пакеті.

- Запустіть `npm pack --dry-run` і перегляньте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, коли пакет є нативним
  Plugin OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не виключалися.
- Див. [Створення plugins](/uk/plugins/building-plugins).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Нативний маніфест Plugin не містить відображуваного імені.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Залишайте `name` зрозумілим для людини, а `id` - стабільним машинним ідентифікатором.
- Див. [маніфест Plugin](/uk/plugins/manifest).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест Plugin має поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть користувацькі поля з `openclaw.plugin.json`.
- Перемістіть метадані пакета або встановлення в підтримувані поля
  `package.json#openclaw` замість маніфесту.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` з
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перемістіть поведінку середовища виконання в код реєстрації Plugin, а `contracts`
  обмежте статичними метаданими володіння можливостями.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Міграція SDK і сумісності

### legacy-root-sdk-import

Plugin імпортує із застарілого кореневого бареля SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого бареля на цільові публічні імпорти підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних засобів точки входу каналу.
- Використовуйте [умовності імпорту](/uk/plugins/building-plugins#import-conventions) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths), щоб знайти вузький імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin імпортує шлях SDK, зарезервований для вбудованих Plugin або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на задокументовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо поведінка не має публічного SDK, залиште допоміжний засіб усередині свого пакета або
  запросіть публічний API OpenClaw.
- Використовуйте [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths) і
  [міграцію SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin досі використовує застарілий допоміжний засіб усього сховища сеансу
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сеансу.
- Уникайте завантаження, змінення й збереження всього об'єкта сховища сеансу.
- Залишайте `loadSessionStore(...)` лише поки оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin досі використовує застарілий допоміжний засіб запису всього сховища сеансу, як-от
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` під час оновлення полів наявного запису
  сеансу.
- Використовуйте `upsertSessionEntry(...)` під час заміни або створення запису сеансу.
- Уникайте завантаження, змінення й збереження всього об'єкта сховища сеансу.
- Залишайте допоміжні засоби запису всього сховища лише поки оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin досі використовує застарілі допоміжні засоби шляхів до файлів сеансу, як-от
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сеансу за ідентичністю агента й сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані сеансу.
- Використовуйте ідентичність транскрипту або допоміжні засоби цілі, коли код готує
  операцію з транскриптом.
- Не зберігайте й не залежте від застарілих шляхів до файлів транскриптів.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin досі використовує застарілий допоміжний засіб цілі файлу транскрипту
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сеансу.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібна структурована
  ціль операції з транскриптом.
- Уникайте прямого читання або створення застарілих цілей файлів транскриптів.
- Залишайте застарілий допоміжний засіб лише поки оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin досі використовує застарілі низькорівневі допоміжні засоби транскрипту, як-от
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для додавання до транскрипту.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  транскрипту.
- Надавайте перевагу структурованій поверхні середовища виконання транскриптів, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і обробку ідентичності.
- Залишайте низькорівневі допоміжні засоби транскрипту лише поки оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin досі використовує застарілий хук `before_agent_start`.

- Перемістіть роботу з перевизначення моделі або провайдера до `before_model_resolve`.
- Перемістіть роботу зі змінення промпта або контексту до `before_prompt_build`.
- Залишайте `before_agent_start` лише поки оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [хуки](/uk/plugins/hooks) і
  [сумісність Plugin](/uk/plugins/compatibility).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані автентифікації провайдера `providerAuthEnvVars`.

- Віддзеркальте метадані змінних середовища провайдера в `setup.providers[].envVars`.
- Залишайте `providerAuthEnvVars` лише як метадані сумісності, поки підтримуваний
  діапазон OpenClaw ще потребує їх.
- Див. [довідник налаштування](/uk/plugins/manifest#setup-reference) і
  [міграцію SDK](/uk/plugins/sdk-migration).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані змінних середовища каналу без поточних
метаданих налаштування або конфігурації, яких очікує ClawHub.

- Залишайте метадані змінних середовища каналу декларативними, щоб OpenClaw міг перевіряти стан налаштування
  без завантаження середовища виконання каналу.
- Віддзеркальте кероване змінними середовища налаштування каналу в поточні метадані налаштування, конфігурації каналу або
  каналу пакета, які використовує форма вашого Plugin.
- Залишайте `channelEnvVars` лише як метадані сумісності, поки старіші підтримувані
  версії OpenClaw ще потребують їх.
- Див. [маніфест Plugin](/uk/plugins/manifest) і
  [Plugin каналів](/uk/plugins/sdk-channel-plugins).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачає `openclaw.security.json` із посиланням на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL схеми, якщо він має лише рекомендаційний характер.
- Використовуйте задокументовану версіоновану схему лише після того, як OpenClaw опублікує її.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачає непідтримуваний файл маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему маніфесту
  безпеки й поведінку ClawHub.
- Тримайте чутливу до безпеки поведінку задокументованою в публічній документації пакета або
  README, доки контракт маніфесту не існує.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Пов'язане

- [CLI ClawHub](/uk/clawhub/cli)
- [публікація в ClawHub](/uk/clawhub/publishing)
- [створення Plugin](/uk/plugins/building-plugins)
- [маніфест Plugin](/uk/plugins/manifest)
- [точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [сумісність Plugin](/uk/plugins/compatibility)
