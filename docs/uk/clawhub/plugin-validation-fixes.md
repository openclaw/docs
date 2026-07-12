---
read_when:
    - Ви запустили `clawhub package validate` і маєте виправити зауваження щодо плагіна
    - ClawHub відхилив публікацію пакета Plugin або видав попередження щодо неї
    - Ви оновлюєте метадані пакета плагіна перед випуском
summary: Виправте зауваження перевірки пакета Plugin ClawHub перед публікацією
title: Виправлення перевірки Plugin
x-i18n:
    generated_at: "2026-07-12T13:05:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення помилок валідації плагінів

ClawHub перевіряє пакети плагінів перед публікацією, а також може показувати результати автоматизованого сканування пакетів. На цій сторінці описано результати для авторів, тобто проблеми, які автор плагіна може виправити в метаданих пакета, маніфесті, імпортах SDK або опублікованому артефакті.

Тут не розглядаються внутрішні результати перевірки покриття Plugin Inspector. Якщо повний звіт містить коди обслуговування сканера без указівок щодо виправлення для автора, вони призначені для супровідників OpenClaw, а не для авторів плагінів.

Після застосування будь-якого виправлення повторно виконайте:

```bash
clawhub package validate <path-to-plugin>
```

## Результати для авторів

| Код                                     | З чого почати                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `package-json-missing`                  | [Додайте метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                                |
| `package-openclaw-metadata-missing`     | [Додайте блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                              |
| `package-openclaw-entry-missing`        | [Оголосіть точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                        |
| `package-entrypoint-missing`            | [Опублікуйте оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                |
| `package-install-metadata-incomplete`   | [Заповніть метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                         |
| `package-plugin-api-compat-missing`     | [Оголосіть сумісність з API плагінів](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                       |
| `package-min-host-version-drift`        | [Узгодьте мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                             |
| `package-manifest-version-drift`        | [Узгодьте версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                           |
| `package-openclaw-unsupported-metadata` | [Видаліть непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)       |
| `package-npm-pack-unavailable`          | [Зробіть артефакт npm придатним для пакування](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                    |
| `package-npm-pack-entrypoint-missing`   | [Додайте точки входу до результату пакування npm](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)         |
| `package-npm-pack-metadata-missing`     | [Додайте метадані до результату пакування npm](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)               |
| `manifest-name-missing`                 | [Додайте відображуване ім’я маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                                  |
| `manifest-unknown-fields`               | [Видаліть непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                              |
| `manifest-unknown-contracts`            | [Видаліть непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                         |
| `legacy-root-sdk-import`                | [Замініть імпорти кореневого SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                     |
| `reserved-sdk-import`                   | [Видаліть зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                     |
| `sdk-load-session-store`                | [Замініть доступ до всього сховища сеансів](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                            |
| `sdk-session-store-write`               | [Замініть операції запису до всього сховища сеансів](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                  |
| `sdk-session-file-helper`               | [Замініть допоміжні функції шляхів до файлів сеансу](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)                  |
| `sdk-session-transcript-file-target`    | [Замініть застарілі цільові файли транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)            |
| `sdk-session-transcript-low-level`      | [Замініть низькорівневі допоміжні функції транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)      |
| `legacy-before-agent-start`             | [Замініть before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                      |
| `provider-auth-env-vars`                | [Перенесіть змінні середовища провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars)    |
| `channel-env-vars`                      | [Відтворіть змінні середовища каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)                   |
| `security-manifest-schema-unavailable`  | [Видаліть посилання на недоступні схеми маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видаліть непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)              |

## Метадані пакета

### package-json-missing

Кореневий каталог пакета не містить `package.json`, тому ClawHub не може визначити пакет npm, його версію, точки входу або метадані OpenClaw.

- Додайте `package.json` із полями `name`, `version` і `type`.
- Додайте блок `openclaw`, якщо пакет постачає плагін OpenClaw.
- Скористайтеся розділом [Створення плагінів](/uk/plugins/building-plugins) для перегляду мінімального прикладу пакета та розділом [Маніфест плагіна](/uk/plugins/manifest#manifest-versus-packagejson), щоб дізнатися про розподіл даних між пакетом і маніфестом.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет містить `package.json`, але не оголошує метадані пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точок входу, як-от `openclaw.extensions` або `openclaw.runtimeExtensions`.
- Додайте метадані сумісності та встановлення, якщо пакет буде опубліковано або встановлено через ClawHub.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета наявні, але в них не оголошено точку входу середовища виконання OpenClaw.

- Додайте `openclaw.extensions` для нативних точок входу плагіна.
- Додайте `openclaw.runtimeExtensions`, якщо опублікований пакет має завантажувати скомпільований JavaScript.
- Усі шляхи точок входу мають розташовуватися всередині каталогу пакета.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints) і [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але файл, на який вона посилається, відсутній у пакеті, що проходить перевірку.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` та `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точка входу генерується в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як слід установлювати або оновлювати пакет.

- Заповніть `openclaw.install`, указавши підтримуване джерело встановлення, як-от `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, якщо доступно кілька джерел встановлення.
- Використовуйте `openclaw.install.minHostVersion`, щоб указати мінімальну версію хоста OpenClaw.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує діапазон версій API плагінів OpenClaw, який він підтримує.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Укажіть версію API плагінів OpenClaw або мінімальну версію semver, для якої ви створили й протестували пакет.
- Не змішуйте її з версією пакета. Версія пакета описує випуск плагіна, а `openclaw.compat.pluginApi` — контракт API хоста.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не відповідає метаданим версії OpenClaw, для якої було створено пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте всі метадані збірки OpenClaw у пакеті, як-от версію OpenClaw, використану під час випуску.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет фактично підтримує.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета не збігається з версією маніфесту плагіна.

- Використовуйте `package.json#version` як основну версію випуску пакета.
- Якщо `openclaw.plugin.json` також містить поле `version`, оновіть його відповідно або видаліть застарілі метадані версії маніфесту, якщо метадані пакета є авторитетними.
- Після зміни опублікованих метаданих опублікуйте нову версію пакета.
- Див. [Маніфест плагіна](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються як метадані пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Зберігайте метадані нативного плагіна в `openclaw.plugin.json`.
- Зберігайте точки входу пакета, дані сумісності, встановлення, налаштування й каталогу в підтримуваних полях `package.json#openclaw`.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет неможливо запакувати в артефакт, який ClawHub перевірятиме або публікуватиме.

- Виконайте `npm pack --dry-run` із кореневого каталогу пакета.
- Виправте недійсні метадані пакета, несправні сценарії життєвого циклу або записи файлів, через які пакування завершується помилкою.
- Видаліть `private: true`, якщо цей пакет призначений для загальнодоступної публікації.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить файлів точок входу, оголошених у `package.json#openclaw`.

- Виконайте `npm pack --dry-run` і перевірте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або результати збірки, щоб оголошені точки входу було включено.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті відсутні метадані OpenClaw, наявні у вихідному пакеті.

- Виконайте `npm pack --dry-run` і перевірте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, якщо пакет є нативним плагіном OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакета не було виключено.
- Див. [Створення плагінів](/uk/plugins/building-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Нативний маніфест плагіна не містить відображуваного імені.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Зробіть `name` зрозумілим для людини, а `id` залиште стабільним машинним ідентифікатором.
- Див. [Маніфест плагіна](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест плагіна містить поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть користувацькі поля з `openclaw.plugin.json`.
- Перемістіть метадані пакета або встановлення до підтримуваних полів `package.json#openclaw`,
  а не до маніфесту.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` із
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перемістіть поведінку під час виконання до коду реєстрації плагіна, а `contracts`
  обмежте статичними метаданими про належність можливостей.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## SDK і міграція сумісності

### legacy-root-sdk-import

Плагін імпортує із застарілого кореневого реекспорту SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого реекспорту на імпорти зі спеціалізованих публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних засобів точок входу каналів.
- Скористайтеся розділами [Угоди щодо імпорту](/uk/plugins/building-plugins#import-conventions) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths), щоб знайти вузькоспеціалізований імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Плагін імпортує шлях SDK, зарезервований для вбудованих плагінів або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на документовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо для цієї поведінки немає публічного SDK, залиште допоміжний засіб у своєму пакеті або
  надішліть запит на публічний API OpenClaw.
- Скористайтеся розділами [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths) і
  [Міграція SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Плагін усе ще використовує застарілий допоміжний засіб для всього сховища сеансів
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` для читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` для запису стану
  сеансу.
- Не завантажуйте, не змінюйте та не зберігайте об’єкт усього сховища сеансів.
- Зберігайте `loadSessionStore(...)` лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Плагін усе ще використовує застарілий допоміжний засіб запису всього сховища сеансів, наприклад
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` для оновлення полів наявного запису
  сеансу.
- Використовуйте `upsertSessionEntry(...)` для заміни або створення запису сеансу.
- Не завантажуйте, не змінюйте та не зберігайте об’єкт усього сховища сеансів.
- Зберігайте допоміжні засоби запису всього сховища лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Плагін усе ще використовує застарілі допоміжні засоби шляхів до файлів сеансу, наприклад
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сеансу за ідентичністю агента й
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані
  сеансу.
- Використовуйте допоміжні засоби ідентичності або цілі транскрипту, коли код готує
  операцію з транскриптом.
- Не зберігайте застарілі шляхи до файлів транскриптів і не залежте від них.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Плагін усе ще використовує застарілий допоміжний засіб файлової цілі транскрипту
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сеансу.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібна структурована
  ціль операції з транскриптом.
- Не читайте й не створюйте застарілі файлові цілі транскриптів безпосередньо.
- Зберігайте застарілий допоміжний засіб лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Плагін усе ще використовує застарілі низькорівневі допоміжні засоби транскриптів, наприклад
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для додавання до транскрипту.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  транскрипту.
- Надавайте перевагу структурованій поверхні середовища виконання транскриптів, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і обробку ідентичності.
- Зберігайте низькорівневі допоміжні засоби транскриптів лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Плагін усе ще використовує застарілий хук `before_agent_start`.

- Перемістіть перевизначення моделі або постачальника до `before_model_resolve`.
- Перемістіть зміну запиту або контексту до `before_prompt_build`.
- Зберігайте `before_agent_start` лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [Хуки](/uk/plugins/hooks) і
  [Сумісність плагінів](/uk/plugins/compatibility).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест усе ще використовує застарілі метадані автентифікації постачальника `providerAuthEnvVars`.

- Віддзеркальте метадані змінних середовища постачальника в `setup.providers[].envVars`.
- Зберігайте `providerAuthEnvVars` лише як метадані сумісності, доки підтримуваний
  діапазон OpenClaw усе ще їх потребує.
- Див. [Довідник setup](/uk/plugins/manifest#setup-reference) і
  [Міграція SDK](/uk/plugins/sdk-migration).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані змінних середовища каналу без актуальних
метаданих налаштування чи конфігурації, яких очікує ClawHub.

- Зберігайте метадані змінних середовища каналу декларативними, щоб OpenClaw міг перевіряти стан налаштування
  без завантаження середовища виконання каналу.
- Віддзеркальте налаштування каналу через змінні середовища в актуальні метадані налаштування, конфігурації каналу або
  каналу пакета, які використовує структура вашого плагіна.
- Зберігайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw усе ще їх потребують.
- Див. [Маніфест плагіна](/uk/plugins/manifest) і
  [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакет постачається з `openclaw.security.json`, що містить посилання на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL-адресу схеми, якщо вона має лише рекомендаційний характер.
- Використовуйте документовану версійну схему лише після того, як OpenClaw її опублікує.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет постачається з непідтримуваним файлом маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версійну схему маніфесту
  безпеки та поведінку ClawHub.
- До появи контракту маніфесту документуйте чутливу до безпеки поведінку в публічній документації пакета або
  README.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Пов’язані матеріали

- [CLI ClawHub](/uk/clawhub/cli)
- [Публікація в ClawHub](/uk/clawhub/publishing)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Маніфест плагіна](/uk/plugins/manifest)
- [Точки входу плагіна](/uk/plugins/sdk-entrypoints)
- [Сумісність плагінів](/uk/plugins/compatibility)
