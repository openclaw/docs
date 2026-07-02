---
read_when:
    - Ви запустили clawhub package validate і маєте виправити зауваження щодо Plugin
    - ClawHub відхилив або попередив під час публікації пакета Plugin
    - Ви оновлюєте метадані пакета Plugin перед релізом
summary: Виправити зауваження перевірки пакета Plugin ClawHub перед публікацією
title: Виправлення валідації Plugin
x-i18n:
    generated_at: "2026-07-02T17:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення валідації Plugin

ClawHub перевіряє пакети Plugin перед публікацією, а також може показувати висновки з
автоматизованих сканувань пакетів. Ця сторінка охоплює висновки для авторів, тобто
висновки, які автор Plugin може виправити в метаданих пакета, маніфесті, імпортах SDK
або опублікованому артефакті.

Вона не охоплює внутрішні висновки покриття Plugin Inspector. Якщо повний звіт
містить коди обслуговування сканера без інструкцій для автора щодо виправлення, вони
призначені для мейнтейнерів OpenClaw, а не для авторів Plugin.

Після застосування будь-якого виправлення запустіть повторно:

```bash
clawhub package validate <path-to-plugin>
```

## Висновки для авторів

| Код                                     | Почніть тут                                                                                                                |
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
| `package-npm-pack-unavailable`          | [Зробіть артефакт npm придатним до пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Додайте точки входу до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Додайте метадані до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Додайте відображувану назву маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Замініть кореневі імпорти SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Замініть доступ до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Замініть записи до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Замініть помічники шляхів до файлів сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Замініть застарілі файлові цілі транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Замініть низькорівневі помічники транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Перенесіть змінні середовища провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Віддзеркальте змінні середовища каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступні схеми маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може ідентифікувати
пакет npm, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` з `name`, `version` і `type`.
- Додайте блок `openclaw`, коли пакет постачає Plugin OpenClaw.
- Скористайтеся [Створенням Plugin](/uk/plugins/building-plugins) для мінімального прикладу
  пакета та [маніфестом Plugin](/uk/plugins/manifest#manifest-versus-packagejson)
  для поділу між пакетом і маніфестом.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет має `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точок входу, як-от `openclaw.extensions` або
  `openclaw.runtimeExtensions`.
- Додайте метадані сумісності та встановлення, коли пакет буде опубліковано або
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
- Оновіть метадані, якщо точку входу було переміщено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як пакет має встановлюватися або оновлюватися.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, наприклад
  `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, коли доступно більше ніж одне джерело
  встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон API Plugin OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API Plugin OpenClaw або нижню межу semver, з якою ви збирали й тестували
  пакет.
- Тримайте це окремо від версії пакета. Версія пакета описує
  випуск Plugin; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не збігається з метаданими версії OpenClaw,
проти якої було зібрано пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте будь-які метадані збірки OpenClaw у пакеті, як-от версію OpenClaw,
  використану під час випуску.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет
  фактично підтримує.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту Plugin не збігаються.

- Надавайте перевагу `package.json#version` як версії випуску пакета.
- Якщо `openclaw.plugin.json` також має `version`, оновіть його, щоб він збігався, або видаліть
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

- Запустіть `npm pack --dry-run` з кореня пакета.
- Виправте некоректні метадані пакета, зламані lifecycle scripts або записи файлів, які
  спричиняють збій пакування.
- Видаліть `private: true`, якщо цей пакет призначений для публічної публікації.
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить
файлів точок входу, оголошених у `package.json#openclaw`.

- Запустіть `npm pack --dry-run` і перевірте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або вивід збірки, щоб оголошені точки входу було
  включено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті відсутні метадані OpenClaw, які існують у вашому вихідному
пакеті.

- Запустіть `npm pack --dry-run` і перевірте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, коли пакет є нативним
  Plugin OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не були виключені.
- Див. [Створення Plugin](/uk/plugins/building-plugins).
- Запустіть повторно `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Власний маніфест plugin не містить відображуваної назви.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Залишайте `name` зручним для читання людиною, а `id` — стабільним машинним ідентифікатором.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест plugin має поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть користувацькі поля з `openclaw.plugin.json`.
- Натомість перемістіть метадані пакета або встановлення в підтримувані поля `package.json#openclaw`
  замість маніфесту.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` із
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перемістіть поведінку під час виконання в код реєстрації plugin, а `contracts`
  обмежте статичними метаданими володіння можливостями.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## SDK і міграція сумісності

### legacy-root-sdk-import

Plugin імпортує із застарілого кореневого barrel SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого barrel на цільові імпорти з публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних функцій точки входу каналу.
- Використовуйте [Угоди щодо імпорту](/uk/plugins/building-plugins#import-conventions) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths), щоб знайти вузький імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin імпортує шлях SDK, зарезервований для вбудованих plugin або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на задокументовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо для поведінки немає публічного SDK, залиште допоміжну функцію всередині свого пакета або
  запросіть публічний API OpenClaw.
- Використовуйте [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths) і
  [Міграцію SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin досі використовує застарілу допоміжну функцію цілого сховища сеансів
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сеансу.
- Уникайте завантаження, зміни й збереження всього об’єкта сховища сеансів.
- Залишайте `loadSessionStore(...)` лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким це потрібно.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin досі використовує застарілу допоміжну функцію запису всього сховища сеансів, як-от
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` під час оновлення полів у наявному записі
  сеансу.
- Використовуйте `upsertSessionEntry(...)` під час заміни або створення запису сеансу.
- Уникайте завантаження, зміни й збереження всього об’єкта сховища сеансів.
- Залишайте допоміжні функції запису всього сховища лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin досі використовує застарілі допоміжні функції шляхів до файлів сеансів, як-от
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сеансу за агентом та ідентичністю
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані
  сеансу.
- Використовуйте ідентичність transcript або допоміжні функції цілі, коли код готує
  операцію transcript.
- Не зберігайте й не залежте від застарілих шляхів до файлів transcript.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin досі використовує застарілу допоміжну функцію цілі файлу transcript
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сеансу.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібна структурована
  ціль операції transcript.
- Уникайте прямого читання або створення застарілих цілей файлів transcript.
- Залишайте застарілу допоміжну функцію лише доки ваш оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким вона потрібна.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin досі використовує застарілі низькорівневі допоміжні функції transcript, як-от
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для додавання до transcript.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  transcript.
- Надавайте перевагу структурованій runtime-поверхні transcript, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і обробку ідентичності.
- Залишайте низькорівневі допоміжні функції transcript лише доки ваш оголошений діапазон сумісності
  ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin досі використовує застарілий hook `before_agent_start`.

- Перемістіть роботу з перевизначення моделі або провайдера до `before_model_resolve`.
- Перемістіть роботу зі зміни prompt або контексту до `before_prompt_build`.
- Залишайте `before_agent_start` лише доки ваш оголошений діапазон сумісності ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [Hooks](/uk/plugins/hooks) і
  [Сумісність Plugin](/uk/plugins/compatibility).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані автентифікації провайдера `providerAuthEnvVars`.

- Віддзеркальте метадані env-var провайдера в `setup.providers[].envVars`.
- Залишайте `providerAuthEnvVars` лише як метадані сумісності, доки ваш підтримуваний
  діапазон OpenClaw ще потребує цього.
- Див. [довідник setup](/uk/plugins/manifest#setup-reference) і
  [Міграцію SDK](/uk/plugins/sdk-migration).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані env-var каналу без поточних
метаданих setup або config, яких очікує ClawHub.

- Залишайте метадані env-var каналу декларативними, щоб OpenClaw міг перевіряти стан setup
  без завантаження runtime каналу.
- Віддзеркальте керований env setup каналу в поточні setup, config каналу або
  метадані каналу пакета, які використовує форма вашого plugin.
- Залишайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw усе ще потребують цього.
- Див. [Маніфест Plugin](/uk/plugins/manifest) і
  [Plugin каналів](/uk/plugins/sdk-channel-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачає `openclaw.security.json` із посиланням на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL схеми, якщо він лише рекомендаційний.
- Використовуйте задокументовану версіоновану схему лише після того, як OpenClaw опублікує її.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачає непідтримуваний файл маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему маніфесту безпеки
  та поведінку ClawHub.
- Залишайте чутливу до безпеки поведінку задокументованою в публічній документації пакета або
  README, доки контракт маніфесту не існує.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Пов’язане

- [CLI ClawHub](/uk/clawhub/cli)
- [Публікація ClawHub](/uk/clawhub/publishing)
- [Створення plugin](/uk/plugins/building-plugins)
- [Маніфест Plugin](/uk/plugins/manifest)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Сумісність Plugin](/uk/plugins/compatibility)
