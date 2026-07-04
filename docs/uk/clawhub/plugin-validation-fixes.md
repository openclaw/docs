---
read_when:
    - Ви запустили clawhub package validate і маєте виправити зауваження щодо Plugin
    - ClawHub відхилив або попередив під час публікації пакета plugin
    - Ви оновлюєте метадані пакета plugin перед випуском
summary: Виправте зауваження валідації пакета Plugin ClawHub перед публікацією
title: Виправлення перевірки Plugin
x-i18n:
    generated_at: "2026-07-04T04:04:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення валідації Plugin

ClawHub перевіряє пакети Plugin перед публікацією, а також може показувати результати автоматизованого сканування пакетів. Ця сторінка охоплює результати, призначені для авторів, тобто ті, які автор Plugin може виправити в метаданих пакета, маніфесті, імпортах SDK або опублікованому артефакті.

Вона не охоплює внутрішні результати покриття Plugin Inspector. Якщо повний звіт містить коди обслуговування сканера без інструкцій для виправлення автором, вони призначені для супровідників OpenClaw, а не для авторів Plugin.

Після застосування будь-якого виправлення повторно виконайте:

```bash
clawhub package validate <path-to-plugin>
```

## Результати для авторів

| Код                                     | Почніть тут                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Додайте метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                              |
| `package-openclaw-metadata-missing`     | [Додайте блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [Оголосіть точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                     |
| `package-entrypoint-missing`            | [Опублікуйте оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                             |
| `package-install-metadata-incomplete`   | [Заповніть метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                       |
| `package-plugin-api-compat-missing`     | [Оголосіть сумісність API Plugin](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                        |
| `package-min-host-version-drift`        | [Узгодьте мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                          |
| `package-manifest-version-drift`        | [Узгодьте версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                        |
| `package-openclaw-unsupported-metadata` | [Видаліть непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)   |
| `package-npm-pack-unavailable`          | [Зробіть npm-артефакт придатним до пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                 |
| `package-npm-pack-entrypoint-missing`   | [Додайте точки входу до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)               |
| `package-npm-pack-metadata-missing`     | [Додайте метадані до виводу npm pack](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                    |
| `manifest-name-missing`                 | [Додайте відображувану назву маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                              |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                           |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                      |
| `legacy-root-sdk-import`                | [Замініть кореневі імпорти SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                      |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                    |
| `sdk-load-session-store`                | [Замініть доступ до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `sdk-session-store-write`               | [Замініть записи до всього сховища сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                          |
| `sdk-session-file-helper`               | [Замініть допоміжні засоби шляхів до файлів сесії](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)                 |
| `sdk-session-transcript-file-target`    | [Замініть застарілі цілі файлів транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)           |
| `sdk-session-transcript-low-level`      | [Замініть низькорівневі допоміжні засоби транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)    |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`                | [Перемістіть env vars провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars)         |
| `channel-env-vars`                      | [Віддзеркальте env vars каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)                      |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступні схеми маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)           |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може визначити npm-пакет, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` з `name`, `version` і `type`.
- Додайте блок `openclaw`, коли пакет постачає Plugin OpenClaw.
- Використовуйте [Створення plugins](/uk/plugins/building-plugins) для мінімального прикладу пакета та [Маніфест Plugin](/uk/plugins/manifest#manifest-versus-packagejson) для поділу між пакетом і маніфестом.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет має `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точок входу, як-от `openclaw.extensions` або `openclaw.runtimeExtensions`.
- Додайте метадані сумісності та встановлення, коли пакет буде опубліковано або встановлено через ClawHub.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета існують, але вони не оголошують точку входу середовища виконання OpenClaw.

- Додайте `openclaw.extensions` для нативних точок входу Plugin.
- Додайте `openclaw.runtimeExtensions`, коли опублікований пакет має завантажувати зібраний JavaScript.
- Зберігайте всі шляхи точок входу всередині каталогу пакета.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints) і [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але файл, на який є посилання, відсутній у пакеті, що перевіряється.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` і `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точку входу згенеровано в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як пакет слід встановлювати або оновлювати.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, як-от `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, коли доступно більше ніж одне джерело встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон API Plugin OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API Plugin OpenClaw або мінімальну semver-версію, на основі якої ви виконували збірку й тестування.
- Тримайте це окремо від версії пакета. Версія пакета описує випуск Plugin; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не відповідає метаданим версії OpenClaw, на основі яких було зібрано пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте будь-які метадані збірки OpenClaw у пакеті, наприклад версію OpenClaw, використану під час випуску.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет фактично підтримує.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту Plugin не збігаються.

- Надавайте перевагу `package.json#version` як версії випуску пакета.
- Якщо `openclaw.plugin.json` також має `version`, оновіть її, щоб вона збігалася, або видаліть застарілі метадані версії маніфесту, коли метадані пакета є авторитетними.
- Опублікуйте нову версію пакета після зміни опублікованих метаданих.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються як метадані пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Зберігайте нативні метадані Plugin в `openclaw.plugin.json`.
- Зберігайте точки входу пакета, сумісність, встановлення, налаштування та метадані каталогу в підтримуваних полях `package.json#openclaw`.
- Див. [поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет не можна запакувати в артефакт, який ClawHub перевіряв би або публікував.

- Виконайте `npm pack --dry-run` з кореня пакета.
- Виправте недійсні метадані пакета, зламані lifecycle-скрипти або entries у `files`, через які пакування завершується помилкою.
- Видаліть `private: true`, якщо цей пакет призначений для публічної публікації.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить файлів точок входу, оголошених у `package.json#openclaw`.

- Виконайте `npm pack --dry-run` і перегляньте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або вивід збірки так, щоб оголошені точки входу було включено.
- Див. [Точки входу Plugin](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті бракує метаданих OpenClaw, які існують у вашому вихідному пакеті.

- Виконайте `npm pack --dry-run` і перегляньте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, коли пакет є нативним Plugin OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не виключалися.
- Див. [Створення plugins](/uk/plugins/building-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Нативний маніфест плагіна не містить відображуваної назви.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Зробіть `name` зрозумілим для людини, а `id` залиште стабільним машинним ідентифікатором.
- Див. [Маніфест Plugin](/uk/plugins/manifest).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест плагіна має поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть користувацькі поля з `openclaw.plugin.json`.
- Перемістіть метадані пакета або встановлення до підтримуваних полів `package.json#openclaw`
  замість маніфесту.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` із
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перемістіть поведінку часу виконання в код реєстрації плагіна, а `contracts`
  обмежте статичними метаданими володіння можливостями.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## SDK і міграція сумісності

### legacy-root-sdk-import

Плагін імпортує із застарілого кореневого бареля SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого бареля на цільові імпорти публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних засобів точки входу каналу.
- Використовуйте [угоди щодо імпортів](/uk/plugins/building-plugins#import-conventions) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths), щоб знайти вузький імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Плагін імпортує шлях SDK, зарезервований для вбудованих плагінів або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на задокументовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо поведінка не має публічного SDK, залиште допоміжний засіб у своєму пакеті або
  запросіть публічний API OpenClaw.
- Використовуйте [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths) і
  [міграцію SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Плагін досі використовує застарілий допоміжний засіб усього сховища сеансів
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сеансу.
- Уникайте завантаження, змінювання та збереження всього об’єкта сховища сеансів.
- Залишайте `loadSessionStore(...)` лише доки оголошений діапазон сумісності
  все ще підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API часу виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Плагін досі використовує застарілий допоміжний засіб запису всього сховища сеансів, як-от
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` під час оновлення полів наявного запису
  сеансу.
- Використовуйте `upsertSessionEntry(...)` під час заміни або створення запису сеансу.
- Уникайте завантаження, змінювання та збереження всього об’єкта сховища сеансів.
- Залишайте допоміжні засоби запису всього сховища лише доки оголошений діапазон сумісності
  все ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API часу виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Плагін досі використовує застарілі допоміжні засоби шляхів до файлів сеансів, як-от
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сеансу за ідентичністю агента й
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані
  сеансу.
- Використовуйте ідентичність транскрипта або допоміжні засоби цілі, коли код готує
  операцію з транскриптом.
- Не зберігайте й не покладайтеся на застарілі шляхи до файлів транскриптів.
- Див. [API часу виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Плагін досі використовує застарілий допоміжний засіб цілі файлу транскрипта
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сеансу.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібна структурована
  ціль операції з транскриптом.
- Уникайте прямого читання або створення застарілих цілей файлів транскриптів.
- Залишайте застарілий допоміжний засіб лише доки оголошений діапазон сумісності все ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API часу виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Плагін досі використовує застарілі низькорівневі допоміжні засоби транскриптів, як-от
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для додавання до транскрипта.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  транскрипта.
- Надавайте перевагу структурованій поверхні часу виконання транскриптів, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і обробку ідентичності.
- Залишайте низькорівневі допоміжні засоби транскриптів лише доки оголошений діапазон сумісності
  все ще підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API часу виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Плагін досі використовує застарілий хук `before_agent_start`.

- Перемістіть роботу з перевизначення моделі або провайдера до `before_model_resolve`.
- Перемістіть роботу зі зміни промпта або контексту до `before_prompt_build`.
- Залишайте `before_agent_start` лише доки оголошений діапазон сумісності все ще
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [хуки](/uk/plugins/hooks) і
  [сумісність Plugin](/uk/plugins/compatibility).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані автентифікації провайдера `providerAuthEnvVars`.

- Віддзеркальте метадані env-var провайдера в `setup.providers[].envVars`.
- Залишайте `providerAuthEnvVars` лише як метадані сумісності, доки підтримуваний
  діапазон OpenClaw усе ще потребує їх.
- Див. [довідник setup](/uk/plugins/manifest#setup-reference) і
  [міграцію SDK](/uk/plugins/sdk-migration).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані env-var каналу без поточних
метаданих setup або конфігурації, яких очікує ClawHub.

- Залишайте метадані env-var каналу декларативними, щоб OpenClaw міг перевіряти стан setup
  без завантаження часу виконання каналу.
- Віддзеркальте налаштування каналу на основі env у поточні setup, конфігурацію каналу або
  метадані каналу пакета, які використовує форма вашого плагіна.
- Залишайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw усе ще потребують їх.
- Див. [маніфест Plugin](/uk/plugins/manifest) і
  [плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачає `openclaw.security.json` із посиланням на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL схеми, якщо вона має лише рекомендаційний характер.
- Використовуйте задокументовану версіоновану схему лише після того, як OpenClaw її опублікує.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачає непідтримуваний файл маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему маніфесту
  безпеки та поведінку ClawHub.
- Документуйте поведінку, чутливу до безпеки, у публічній документації пакета або
  README, доки контракт маніфесту не існує.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Пов’язане

- [ClawHub CLI](/uk/clawhub/cli)
- [Публікація ClawHub](/uk/clawhub/publishing)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Маніфест Plugin](/uk/plugins/manifest)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Сумісність Plugin](/uk/plugins/compatibility)
