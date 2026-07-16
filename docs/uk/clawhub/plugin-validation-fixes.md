---
read_when:
    - Ви запустили `clawhub package validate` і маєте виправити виявлені проблеми Plugin
    - ClawHub відхилив публікацію пакета плагіна або видав попередження щодо неї
    - Ви оновлюєте метадані пакета плагіна перед випуском
summary: Виправте виявлені проблеми перевірки пакета Plugin ClawHub перед публікацією
title: Виправлення перевірки Plugin
x-i18n:
    generated_at: "2026-07-16T17:36:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Виправлення помилок валідації плагінів

ClawHub перевіряє пакети плагінів перед публікацією, а також може показувати результати
автоматизованого сканування пакетів. На цій сторінці описано результати для авторів, тобто
проблеми, які автор плагіна може виправити в метаданих пакета, маніфесті, імпортах SDK
або опублікованому артефакті.

Тут не розглядаються внутрішні результати перевірки покриття Plugin Inspector. Якщо повний звіт
містить коди обслуговування сканера без рекомендацій щодо виправлення для автора, вони
призначені для супровідників OpenClaw, а не для авторів плагінів.

Після застосування будь-якого виправлення повторно виконайте:

```bash
clawhub package validate <path-to-plugin>
```

## Результати для авторів

| Код                                     | З чого почати                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Додати метадані пакета](/uk/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Додати блок openclaw пакета](/uk/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                                |
| `package-openclaw-entry-missing`        | [Оголосити точки входу пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Опублікувати оголошену точку входу](/uk/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                |
| `package-install-metadata-incomplete`   | [Заповнити метадані встановлення](/uk/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                           |
| `package-plugin-api-compat-missing`     | [Оголосити сумісність з API плагінів](/uk/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                         |
| `package-min-host-version-drift`        | [Узгодити мінімальну версію хоста](/uk/clawhub/plugin-validation-fixes#package-min-host-version-drift)                               |
| `package-manifest-version-drift`        | [Узгодити версії пакета й маніфесту](/uk/clawhub/plugin-validation-fixes#package-manifest-version-drift)                              |
| `package-openclaw-unsupported-metadata` | [Видалити непідтримувані метадані пакета OpenClaw](/uk/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)        |
| `package-npm-pack-unavailable`          | [Забезпечити можливість пакування npm-артефакту](/uk/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                    |
| `package-npm-pack-entrypoint-missing`   | [Додати точки входу до результату пакування npm](/uk/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)             |
| `package-npm-pack-metadata-missing`     | [Додати метадані до результату пакування npm](/uk/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                  |
| `manifest-name-missing`                 | [Додати відображуване ім’я маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-name-missing)                                    |
| `manifest-unknown-fields`               | [Видалити непідтримувані поля маніфесту](/uk/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                |
| `manifest-unknown-contracts`            | [Видалити непідтримувані ключі контрактів](/uk/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                           |
| `legacy-root-sdk-import`                | [Замінити імпорти з кореня SDK](/uk/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                         |
| `reserved-sdk-import`                   | [Видалити зарезервовані імпорти SDK](/uk/clawhub/plugin-validation-fixes#reserved-sdk-import)                                       |
| `sdk-load-session-store`                | [Замінити доступ до всього сховища сеансів](/uk/clawhub/plugin-validation-fixes#sdk-load-session-store)                              |
| `sdk-session-store-write`               | [Замінити запис у все сховище сеансів](/uk/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Замінити допоміжні засоби для шляхів до файлів сеансів](/uk/clawhub/plugin-validation-fixes#sdk-session-file-helper)                |
| `sdk-session-transcript-file-target`    | [Замінити застарілі цільові файли транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)               |
| `sdk-session-transcript-low-level`      | [Замінити низькорівневі допоміжні засоби для транскриптів](/uk/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)       |
| `legacy-before-agent-start`             | [Замінити before_agent_start](/uk/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Перемістити змінні середовища провайдера до метаданих налаштування](/uk/clawhub/plugin-validation-fixes#provider-auth-env-vars)      |
| `channel-env-vars`                      | [Відобразити змінні середовища каналу в поточних метаданих](/uk/clawhub/plugin-validation-fixes#channel-env-vars)                    |
| `security-manifest-schema-unavailable`  | [Видалити недоступні посилання на схему маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Видалити непідтримувані файли маніфесту безпеки](/uk/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                 |

## Метадані пакета

### package-json-missing

Корінь пакета не містить `package.json`, тому ClawHub не може визначити
пакет npm, версію, точки входу або метадані OpenClaw.

- Додайте `package.json` з `name`, `version` і `type`.
- Додайте блок `openclaw`, якщо пакет містить плагін OpenClaw.
- Скористайтеся розділом [Створення плагінів](/uk/plugins/building-plugins) для мінімального прикладу
  пакета та розділом [Маніфест плагіна](/uk/plugins/manifest#manifest-versus-packagejson)
  для пояснення відмінностей між пакетом і маніфестом.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет містить `package.json`, але не оголошує метадані
пакета OpenClaw.

- Додайте `package.json#openclaw`.
- Додайте метадані точки входу, як-от `openclaw.extensions` або
  `openclaw.runtimeExtensions`.
- Додайте метадані сумісності та встановлення, якщо пакет публікуватиметься або
  встановлюватиметься через ClawHub.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метадані пакета існують, але вони не оголошують точку входу
середовища виконання OpenClaw.

- Додайте `openclaw.extensions` для власних точок входу плагіна.
- Додайте `openclaw.runtimeExtensions`, якщо опублікований пакет має завантажувати зібраний
  JavaScript.
- Усі шляхи до точок входу мають бути всередині каталогу пакета.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints) і
  [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет оголошує точку входу OpenClaw, але файл, на який вона посилається, відсутній
у пакеті, що проходить валідацію.

- Перевірте кожен шлях у `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` і `openclaw.runtimeSetupEntry`.
- Зберіть пакет, якщо точка входу генерується в `dist`.
- Оновіть метадані, якщо точку входу переміщено.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не може визначити, як слід установлювати або оновлювати пакет.

- Заповніть `openclaw.install` підтримуваним джерелом встановлення, як-от
  `clawhubSpec`, `npmSpec` або `localPath`.
- Установіть `openclaw.install.defaultChoice`, якщо доступно кілька джерел
  встановлення.
- Використовуйте `openclaw.install.minHostVersion` для мінімальної версії хоста OpenClaw.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не оголошує підтримуваний діапазон API плагінів OpenClaw.

- Додайте `openclaw.compat.pluginApi` до `package.json`.
- Використовуйте версію API плагінів OpenClaw або нижню межу semver, для якої
  виконувалися збирання й тестування.
- Не плутайте це з версією пакета. Версія пакета описує випуск
  плагіна; `openclaw.compat.pluginApi` описує контракт API хоста.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Мінімальна версія хоста пакета не відповідає метаданим версії OpenClaw,
для якої було зібрано пакет.

- Перевірте `openclaw.install.minHostVersion`.
- Перевірте всі метадані збирання OpenClaw у пакеті, як-от версію OpenClaw,
  використану під час випуску.
- Узгодьте мінімальну версію хоста з діапазоном версій хоста, який пакет
  фактично підтримує.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версія пакета й версія маніфесту плагіна не збігаються.

- Віддавайте перевагу `package.json#version` як версії випуску пакета.
- Якщо `openclaw.plugin.json` також містить `version`, оновіть його відповідно або видаліть
  застарілі метадані версії маніфесту, якщо метадані пакета є авторитетними.
- Після зміни опублікованих метаданих опублікуйте нову версію пакета.
- Див. [Маніфест плагіна](/uk/plugins/manifest).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` містить поля, які не підтримуються
як метадані пакета OpenClaw.

- Видаліть непідтримувані поля, як-от `openclaw.bundle`.
- Зберігайте метадані власного плагіна в `openclaw.plugin.json`.
- Зберігайте точки входу пакета, метадані сумісності, встановлення, налаштування й каталогу
  в підтримуваних полях `package.json#openclaw`.
- Див. [Поля package.json, що впливають на виявлення](/uk/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

## Опублікований артефакт

### package-npm-pack-unavailable

Пакет не можна запакувати в артефакт, який ClawHub перевірятиме або
публікуватиме.

- Виконайте `npm pack --dry-run` із кореня пакета.
- Виправте недійсні метадані пакета, несправні сценарії життєвого циклу або записи файлів, через які
  пакування завершується помилкою.
- Видаліть `private: true`, якщо цей пакет призначений для загальнодоступної публікації.
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можна запакувати, але запакований артефакт не містить
файлів точок входу, оголошених у `package.json#openclaw`.

- Виконайте `npm pack --dry-run` і перевірте файли, які буде включено.
- Зберіть згенеровані точки входу перед пакуванням.
- Оновіть `files`, `.npmignore` або результат збирання, щоб оголошені точки входу було
  включено.
- Див. [Точки входу плагіна](/uk/plugins/sdk-entrypoints).
- Повторно виконайте `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

У запакованому артефакті відсутні метадані OpenClaw, які є у вихідному
пакеті.

- Запустіть `npm pack --dry-run` і перевірте включені файли метаданих.
- Переконайтеся, що `package.json` містить блок `openclaw` у запакованому артефакті.
- Переконайтеся, що `openclaw.plugin.json` включено, якщо пакунок є нативним
  плагіном OpenClaw.
- Оновіть `files` або `.npmignore`, щоб метадані пакунка не було виключено.
- Див. [Створення плагінів](/uk/plugins/building-plugins).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Метадані маніфесту

### manifest-name-missing

Маніфест нативного плагіна не містить відображуваної назви.

- Додайте непорожнє поле `name` до `openclaw.plugin.json`.
- Зберігайте `name` зрозумілим для людей, а `id` — стабільним машинним ідентифікатором.
- Див. [Маніфест плагіна](/uk/plugins/manifest).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Маніфест плагіна містить поля верхнього рівня, які OpenClaw не підтримує.

- Порівняйте кожне поле верхнього рівня з
  [довідником полів маніфесту](/uk/plugins/manifest#top-level-field-reference).
- Видаліть власні поля з `openclaw.plugin.json`.
- Перенесіть метадані пакунка або встановлення до підтримуваних полів `package.json#openclaw`,
  а не до маніфесту.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Маніфест оголошує непідтримувані ключі всередині `contracts`.

- Порівняйте кожен ключ у `contracts` з
  [довідником контрактів](/uk/plugins/manifest#contracts-reference).
- Видаліть непідтримувані ключі контрактів.
- Перенесіть поведінку середовища виконання до коду реєстрації плагіна, а `contracts`
  обмежте статичними метаданими про належність можливостей.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Міграція SDK і сумісності

### legacy-root-sdk-import

Плагін імпортує із застарілого кореневого агрегувального модуля SDK:
`openclaw/plugin-sdk`.

- Замініть імпорти з кореневого агрегувального модуля на цільові імпорти з публічних підшляхів.
- Використовуйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Використовуйте `openclaw/plugin-sdk/channel-core` для допоміжних засобів точок входу каналу.
- Скористайтеся [Правилами імпорту](/uk/plugins/building-plugins#import-conventions) і
  [Підшляхами SDK плагінів](/uk/plugins/sdk-subpaths), щоб знайти вузькоспеціалізований імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Плагін імпортує шлях SDK, зарезервований для вбудованих плагінів або внутрішньої
сумісності.

- Замініть зарезервовані внутрішні імпорти SDK OpenClaw на документовані публічні
  підшляхи `openclaw/plugin-sdk/*`.
- Якщо для цієї поведінки немає публічного SDK, залиште допоміжний засіб у своєму пакунку або
  надішліть запит на публічний API OpenClaw.
- Скористайтеся [Підшляхами SDK плагінів](/uk/plugins/sdk-subpaths) і
  [Міграцією SDK](/uk/plugins/sdk-migration), щоб вибрати підтримуваний імпорт.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Плагін досі використовує застарілий допоміжний засіб для всього сховища сеансів
`loadSessionStore`.

- Використовуйте `getSessionEntry(...)` або `listSessionEntries(...)` під час читання стану
  сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)` під час запису стану
  сеансу.
- Не завантажуйте, не змінюйте й не зберігайте весь об’єкт сховища сеансів.
- Зберігайте `loadSessionStore(...)` лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Плагін досі використовує застарілий допоміжний засіб запису всього сховища сеансів, наприклад
`saveSessionStore` або `updateSessionStore`.

- Використовуйте `patchSessionEntry(...)` під час оновлення полів наявного запису
  сеансу.
- Використовуйте `upsertSessionEntry(...)` під час заміни або створення запису сеансу.
- Не завантажуйте, не змінюйте й не зберігайте весь об’єкт сховища сеансів.
- Зберігайте допоміжні засоби запису всього сховища лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Плагін досі використовує застарілі допоміжні засоби для шляхів до файлів сеансів, наприклад
`resolveSessionFilePath` або `resolveAndPersistSessionFile`.

- Використовуйте `getSessionEntry(...)`, щоб читати метадані сеансу за ідентичністю агента й сеансу.
- Використовуйте `patchSessionEntry(...)` або `upsertSessionEntry(...)`, щоб зберігати метадані
  сеансу.
- Використовуйте ідентичність транскрипту або допоміжні засоби цілі, коли код готує
  операцію з транскриптом.
- Не зберігайте застарілі шляхи до файлів транскриптів і не залежте від них.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Плагін досі використовує застарілий допоміжний засіб цілі файлу транскрипту
`resolveSessionTranscriptLegacyFileTarget`.

- Використовуйте `resolveSessionTranscriptIdentity(...)`, коли коду потрібна лише публічна
  ідентичність сеансу.
- Використовуйте `resolveSessionTranscriptTarget(...)`, коли коду потрібна структурована
  ціль операції з транскриптом.
- Не читайте й не створюйте застарілі цілі файлів транскриптів безпосередньо.
- Зберігайте застарілий допоміжний засіб лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Плагін досі використовує застарілі низькорівневі допоміжні засоби для транскриптів, наприклад
`appendSessionTranscriptMessage` або `emitSessionTranscriptUpdate`.

- Використовуйте `appendSessionTranscriptMessageByIdentity(...)` для доповнення транскриптів.
- Використовуйте `publishSessionTranscriptUpdateByIdentity(...)` для сповіщень про оновлення
  транскриптів.
- Надавайте перевагу структурованому інтерфейсу середовища виконання для транскриптів, щоб OpenClaw міг застосовувати
  правильні межі транзакцій і належну обробку ідентичності.
- Зберігайте низькорівневі допоміжні засоби для транскриптів лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким вони потрібні.
- Див. [API середовища виконання](/uk/plugins/sdk-runtime#agent-session-state) і
  [Підшляхи SDK плагінів](/uk/plugins/sdk-subpaths).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Плагін досі використовує застарілий перехоплювач `before_agent_start`.

- Перенесіть перевизначення моделі або постачальника до `before_model_resolve`.
- Перенесіть змінення запиту або контексту до `before_prompt_build`.
- Зберігайте `before_agent_start` лише доки оголошений діапазон сумісності
  підтримує старіші версії OpenClaw, яким він потрібен.
- Див. [Перехоплювачі](/uk/plugins/hooks) і
  [Сумісність плагінів](/uk/plugins/compatibility).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Маніфест досі використовує застарілі метадані автентифікації постачальника `providerAuthEnvVars`.

- Продублюйте метадані змінних середовища постачальника в `setup.providers[].envVars`.
- Зберігайте `providerAuthEnvVars` лише як метадані сумісності, доки підтримуваний
  діапазон версій OpenClaw усе ще їх потребує.
- Див. [довідник із налаштування](/uk/plugins/manifest#setup-reference) і
  [Міграцію SDK](/uk/plugins/sdk-migration).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Маніфест використовує застарілі або старіші метадані змінних середовища каналу без актуальних
метаданих налаштування чи конфігурації, яких очікує ClawHub.

- Зберігайте метадані змінних середовища каналу декларативними, щоб OpenClaw міг перевіряти стан налаштування,
  не завантажуючи середовище виконання каналу.
- Продублюйте налаштування каналу через змінні середовища в актуальних метаданих налаштування, конфігурації каналу або
  каналу пакунка, які використовує структура вашого плагіна.
- Зберігайте `channelEnvVars` лише як метадані сумісності, доки старіші підтримувані
  версії OpenClaw усе ще їх потребують.
- Див. [Маніфест плагіна](/uk/plugins/manifest) і
  [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Маніфест безпеки

### security-manifest-schema-unavailable

Пакунок постачається з `openclaw.security.json`, що містить посилання на схему, яку ClawHub
не розпізнає як доступну.

- Видаліть URL-адресу схеми, якщо вона має лише рекомендаційний характер.
- Використовуйте документовану версіоновану схему лише після того, як OpenClaw її опублікує.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакунок постачається з непідтримуваним файлом маніфесту безпеки.

- Видаліть `openclaw.security.json`, доки OpenClaw не задокументує версіоновану схему маніфесту безпеки
  та поведінку ClawHub.
- Документуйте поведінку, чутливу до безпеки, у публічній документації пакунка або
  README, доки контракт маніфесту не існує.
- Повторно запустіть `clawhub package validate <path-to-plugin>`.

## Пов’язані матеріали

- [CLI ClawHub](/uk/clawhub/cli)
- [Публікація в ClawHub](/uk/clawhub/publishing)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Маніфест плагіна](/uk/plugins/manifest)
- [Точки входу плагіна](/uk/plugins/sdk-entrypoints)
- [Сумісність плагінів](/uk/plugins/compatibility)
