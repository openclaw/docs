---
read_when:
    - Ви виконуєте рефакторинг допоміжних функцій файлової системи OpenClaw
    - Ви змінюєте імпорти @openclaw/fs-safe, обгортки або файлові API SDK Plugin
    - Ви визначаєте, чи має допоміжний модуль для локальних файлів бути в OpenClaw чи в fs-safe
summary: План консолідації допоміжних функцій файлової системи OpenClaw навколо @openclaw/fs-safe
title: План очищення, безпечного для файлової системи
x-i18n:
    generated_at: "2026-05-06T01:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 447cea05795539f0ca14364cd1d722798d8f00babacd1cc609040912cc96fab4
    source_path: refactor/fs-cleanup.md
    workflow: 16
---

## Статус

Реалізовано в `codex/extract-fs-safe-primitives`. Залиште цей файл як
контрольний список очищення для подальших перевірок і майбутніх змін поверхні fs-safe.

## Мета

Зробити доступ OpenClaw до файлової системи простим і передбачуваним:

- Основний код використовує один невеликий набір обгорток OpenClaw, які застосовують політику OpenClaw.
- Сумісні псевдоніми Plugin SDK залишаються навмисними й задокументованими.
- fs-safe зберігає невелику публічну історію навколо `root()`, а нижчорівневі
  примітиви розміщені за явними підшляхами.
- Дубльовані імена помічників для JSON, тимчасових файлів, приватного сховища та шляхів зникають із
  внутрішнього коду OpenClaw.
- Чутлива до безпеки поведінка зберігає регресійні тести перед перенесенням імен.

## Нецілі

- Не видаляйте публічні експорти Plugin SDK у цьому очищенні. Зберігайте застарілі
  псевдоніми, доки версійована міграція SDK не видалить їх.
- Не перетворюйте fs-safe на пісочницю. Він залишається бібліотечним захисним обмеженням для локального файлового
  доступу, а не ізоляцією ОС.
- Не перетворюйте всі читання абсолютних шляхів на читання, обмежені коренем. Деякі шляхи OpenClaw
  є довіреними абсолютними шляхами й мають залишатися явними.
- Не женіться за косметичними змінами імпортів без зменшення кількості помічників або уточнення
  меж довіри.

## Закріплення пакета fs-safe

`@openclaw/fs-safe` опубліковано в npm і споживається через semver-діапазон.
Свіжі checkout-и та CI-ранери мають установлювати пакет із публічного
реєстру, а не з локального `link:../fs-safe` checkout-а чи GitHub-архіву.

Поточний діапазон:

- `^0.1.0`

Опублікований пакет постачається зі зібраними файлами `dist`, тому OpenClaw не має вказувати його
в `pnpm.onlyBuiltDependencies`.

## Поточна форма

Основний вхід fs-safe навмисно вузький:

- `root`
- `FsSafeError`
- `categorizeFsSafeError`
- типи параметрів/результатів root
- конфігурація Python-помічника

Ширша поверхня розташована за підшляхами:

- `/json`
- `/store`
- `/temp`
- `/atomic`
- `/root`
- `/advanced`
- `/archive`
- `/walk`

OpenClaw тепер тримає fs-safe за невеликою межею обгорток:

- локальні обгортки `src/infra/*` для типових значень політики ядра
- публічні псевдоніми Plugin SDK, включно зі старішими назвами до fs-safe
- пакетно-локальні утилітарні експорти там, де імпорт `src/infra` перетинав би
  межу пакета

Тест меж імпорту відхиляє нові прямі імпорти fs-safe поза цими
дозволеними зонами.

## Мапа використання

### Доступ, обмежений коренем

Репрезентативне використання:

- `src/gateway/server-methods/agents.ts`
- `src/agents/pi-tools.read.ts`
- `src/agents/apply-patch.ts`
- `src/plugins/install.ts`
- `src/auto-reply/reply/stage-sandbox-media.ts`
- `src/gateway/canvas-documents.ts`

Збережіть цю групу. `root()` є продуктовою поверхнею fs-safe, до якої OpenClaw має спрямовувати
викликачів.

### JSON-помічники

OpenClaw досі використовує багато назв для тих самих операцій:

- `readJsonFile`
- `readJsonFileStrict`
- `readDurableJsonFile`
- `writeJsonAtomic`
- `loadJsonFile`
- `saveJsonFile`
- `readJsonFileWithFallback`
- `writeJsonFileAtomically`

Канонічні назви fs-safe зрозуміліші:

- `tryReadJson`
- `readJson`
- `readJsonIfExists`
- `writeJson`
- `readJsonSync`
- `tryReadJsonSync`
- `writeJsonSync`

Це було найцінніше очищення, бо воно прибрало розходження в назвах без
зміни семантики. Сумісні псевдоніми залишаються в `src/infra/json-files.ts` і
барелях Plugin SDK.

### Приватний стан і сховища

Репрезентативне використання:

- `src/commitments/store.ts`
- `src/agents/models-config.ts`
- `src/agents/pi-auth-json.ts`
- `src/cron/run-log.ts`
- `src/secrets/shared.ts`
- `src/infra/device-auth-store.ts`
- `src/infra/device-identity.ts`

Поточний перетин:

- `fileStore`
- `fileStore({ private: true })`
- псевдоніми приватного стану Plugin SDK

Тепер ці концепції є однією групою. fs-safe надає приватний режим через
`fileStore({ private: true })`; внутрішній код OpenClaw і вбудовані плагіни використовують
обгортки у формі сховища замість окремих приватних JSON/текстових помічників.

### Тимчасові робочі області

Репрезентативне використання:

- `src/media/qr-image.ts`
- `extensions/discord/src/send.voice.ts`
- `extensions/discord/src/voice/audio.ts`
- `extensions/qa-lab/src/temp-dir.test-helper.ts`

`tempWorkspace` є стабільним корисним примітивом. Одноразові тимчасові цілі та
помічники sibling-temp є нижчорівневими інструментами реалізації.

### Атомарні записи

Репрезентативне використання:

- сховища конфігурації та сесій
- сховища Cron
- шляхи встановлення плагінів
- файли стану розширень

Збережіть атомарну заміну як публічний підшлях fs-safe. OpenClaw має використовувати
ті самі канонічні JSON/текстові помічники, де можливо, замість ручного вибору нижчорівневих
атомарних викликів для звичайного JSON-стану.

### Звичайні, безпечні та root-читання файлів

Це не справжні дублікати:

- `root()` захищає root-relative недовірені шляхи.
- помічники regular-file читають довірені абсолютні шляхи з перевірками звичайного файла.
- помічники secure-file додають перевірки власника та режиму для посилань на секрети.

Тримайте їх окремо. Документуйте межу довіри замість приховування її за одним
загальним помічником "читати файл".

### Архівні помічники

Репрезентативне використання:

- встановлення плагіна
- встановлення skill
- marketplace і архівні потоки ClawHub

Зберігайте як окремий підшлях fs-safe. Не протікайте сантехніку архівних записів у
місця виклику ядра OpenClaw, якщо викликач фактично не валідує
метадані архіву.

## Цільовий дизайн

### Імпорти OpenClaw

Основний код OpenClaw має використовувати локальні обгортки політики:

- `src/infra/fs-safe.ts` для спільних root/error помічників
- `src/infra/json-files.ts` для тимчасового шару JSON-сумісності
- `src/infra/private-file-store.ts` до уніфікації приватних сховищ
- `src/infra/replace-file.ts` для низькорівневої атомарної заміни
- `src/infra/boundary-file-read.ts` для читань на межі loader/package
- `src/infra/archive.ts` для політики розпакування архівів
- `src/infra/file-lock-manager.ts` для рідкісного сервісу ядра, якому потрібен
  життєвий цикл/діагностика блокувань у стилі manager

Нові прямі імпорти з `@openclaw/fs-safe/*` мають бути зарезервовані для:

- утиліт рівня пакета поза ядром, які не можуть імпортувати `src/infra`
- shim-ів сумісності
- коду, який навмисно споживає вузький підшлях fs-safe, наприклад
  `openclaw/plugin-sdk/file-lock` із використанням `@openclaw/fs-safe/file-lock`

### Експорти Plugin SDK

Експорти Plugin SDK є контрактними. Зберігайте псевдоніми, навіть коли внутрішній код OpenClaw
переходить на канонічні назви.

Позначайте старіші назви як застарілі в типах/документації, коли заміна стабільна:

- `readJsonFileWithFallback` -> `readJsonIfExists` або метод сховища
- `writeJsonFileAtomically` -> `writeJson`
- `loadJsonFile` -> `tryReadJson`
- `saveJsonFile` -> `writeJson`
- `readFileWithinRoot` -> `root(...).read*`
- `writeFileWithinRoot` -> `root(...).write`

### Сховища fs-safe

Рухайтеся до однієї групи сховищ:

```ts
const store = fileStore({
  rootDir,
  private: true,
  mode: 0o600,
  dirMode: 0o700,
});
```

або тонкого псевдоніма:

```ts
const store = stateStore({ rootDir, private: true });
```

Група сховищ має покривати:

- `read`
- `readText`
- `readJson`
- `readTextIfExists`
- `readJsonIfExists`
- `write`
- `writeJson`
- `remove`
- `exists`
- `open`
- `copyIn`
- `writeStream`
- `pruneExpired`

Це очищення додало таку форму сховища у fs-safe, видалило непоставлену
поверхню `privateStateStore` і перевело внутрішній код OpenClaw та вбудовані плагіни
на явні читання/записи сховища.

### Temp

Тримайте стабільну публічну поверхню temp невеликою:

```ts
await using workspace = await tempWorkspace({ prefix: "openclaw-" });
const target = workspace.path("payload.bin");
```

Перемістіть одноразові помічники тимчасових цілей і sibling-temp помічники до advanced/internal,
якщо конкретному викликачу OpenClaw не потрібен публічний контракт.

## Фази рефакторингу

### Фаза 1: Інвентаризація та запобіжники

- Додайте невеликий тест меж імпорту, який перелічує дозволені прямі
  імпорти `@openclaw/fs-safe/*` у ядрі OpenClaw.
- Додайте регресійні тести для поведінки JSON symlink, яку зберігає
  `src/infra/json-file.ts`.
- Додайте регресійні тести для публічних псевдонімів Plugin SDK, які мають і далі резолвитися.
- Додайте примітку в документацію runtime Plugin SDK після позначення псевдонімів
  застарілими.

Критерії виходу:

- Поточна поверхня сумісності покрита виконуваними тестами.
- Нові прямі імпорти fs-safe видимі під час review.

### Фаза 2: Очищення назв JSON

- Переведіть внутрішніх викликачів OpenClaw зі старих JSON-назв на канонічні назви fs-safe
  там, де семантика ідентична.
- Залиште псевдоніми Plugin SDK без змін.
- Згорніть `src/infra/json-file.ts` і `src/infra/json-files.ts` в один
  модуль сумісності, якщо це зменшить непрямість без втрати семантики
  symlink.
- Зберігайте поведінку `saveJsonFile` щодо symlink-цілі, доки кожного викликача/тест
  навмисно не мігровано.

Критерії виходу:

- Внутрішній код ядра більше не імпортує `readJsonFileStrict`,
  `readDurableJsonFile` або `writeJsonAtomic`, якщо це не shim сумісності.
- Псевдоніми Plugin SDK і далі проходять import/type тести.

### Фаза 3: Уніфікація сховищ

- Додайте уніфікований приватний режим до API сховища fs-safe.
- Видаліть непоставлену поверхню `privateStateStore` замість збереження другої
  групи сховищ.
- Мігруйте внутрішній приватний стан OpenClaw до уніфікованої форми сховища невеликими
  групами:
  - стан auth/profile
  - device identity і device auth
  - cron/run logs
  - commitments
  - стан extension
- Перегенеруйте базову лінію API Plugin SDK для навмисного pre-release
  видалення приватного помічника.

Критерії виходу:

- Внутрішній код OpenClaw і вбудовані плагіни не викликають окремі приватні
  JSON/текстові помічники.
- `fileStore({ private: true })` є єдиним API приватного багатофайлового сховища.

### Фаза 4: Спрощення Temp

- Замініть місця виклику одноразових тимчасових цілей OpenClaw на `tempWorkspace`.
- Збережіть `resolvePreferredOpenClawTmpDir` як політику OpenClaw.
- Приберіть одноразові temp і sibling-temp помічники з curated поверхні обгорток OpenClaw.

Критерії виходу:

- OpenClaw використовує `tempWorkspace` для життєвих циклів тимчасових файлів, якщо низькорівневий
  атомарний помічник не володіє temp шляхом.

### Фаза 5: Зменшення shim-ів

- Згрупуйте однорядкові shim-и fs-safe в меншу кількість іменованих модулів політики
  OpenClaw.
- Видаліть shim-и, які більше не імпортуються.
- Зберігайте shim-и, які підтримують публічні назви SDK або специфічні для OpenClaw типові значення.

Кандидати на стабільні shim-и:

- `src/infra/fs-safe.ts`
- `src/infra/json-files.ts`
- `src/infra/private-file-store.ts`
- `src/infra/replace-file.ts`
- `src/infra/boundary-file-read.ts`
- `src/infra/archive.ts`

Кандидати на групування лише в advanced:

- захисти шляхів
- захисти батьків symlink
- захисти hardlink
- помічники move-path
- помічники ідентичності файлів
- sibling temp помічники

Критерії виходу:

- Список локальних обгорток має політичне значення, а не один файл на модуль fs-safe.

### Фаза 6: Фіналізація публічної поверхні fs-safe

- Тримайте основний вхід `@openclaw/fs-safe` curated.
- Залиште `root()` основною історією README/API.
- Тримайте `openPinnedFileSync` внутрішнім. Використовуйте `readSecureFile`, `root().open` або
  обгортки `openRootFile*` замість експорту fd-рівневого pinned-примітива.
- Тримайте `createSidecarLockManager` внутрішнім. Публічні викликачі мають використовувати
  `acquireFileLock` / `withFileLock`; `createFileLockManager` є лише підшляхом
  для довгоживучих сервісів, яким потрібні інспекція утримуваних блокувань або drain/reset.
- Перемістіть рідкісні root escape hatch-и, як-от `openWritable`, лише до advanced, якщо API
  перевірки показують, що підтримуваному викликачу не потрібен основний root-інтерфейс.
- Тримайте помічники `regular-file`, `secure-file`, archive і root окремо,
  бо їхні моделі довіри відрізняються.
- Видаліть або позначте нестабільним будь-який окремий помічник, який повністю покривається методами root або
  store.

Критерії виходу:

- fs-safe має стабільну pre-1.0 публічну поверхню.
- OpenClaw імпортує лише стабільні API fs-safe поза shim-ами сумісності.

## Верифікація

Використовуйте цільове підтвердження для кожної фази:

- Очищення JSON:
  - тести JSON symlink
  - тести імпорту JSON-store Plugin SDK
  - репрезентативні тести extension, що використовують псевдоніми JSON store
- Уніфікація сховищ:
  - тести приватного режиму у fs-safe
  - тести збереження auth profile
  - тести device identity
  - тести cron/run-log
- Очищення Temp:
  - тести media temp
  - тести Discord voice temp
  - тести QA-lab temp helper
- Зменшення shim-ів:
  - генерація/перевірка API Plugin SDK
  - тести меж імпорту
  - `pnpm build`

Перед злиттям широкого пакета очищення запустіть changed gate і build:

```sh
pnpm check:changed
pnpm build
```

Підтвердження реалізації після цього очищення:

- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/plugin-sdk/temp-path.test.ts src/agents/models-config.write-serialization.test.ts src/infra/json-file.test.ts src/infra/json-files.test.ts`
- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/infra/device-auth-store.test.ts src/infra/device-identity.test.ts src/infra/exec-approvals.test.ts src/agents/models-config.write-serialization.test.ts src/agents/pi-embedded-runner/openrouter-model-capabilities.test.ts src/agents/harness/native-hook-relay.test.ts`
- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/infra/hardlink-guards.test.ts src/infra/file-identity.test.ts src/plugin-sdk/fs-safe-compat.test.ts src/plugin-sdk/temp-path.test.ts`
- `pnpm plugin-sdk:api:check`
- `pnpm build`
- Blacksmith Testbox `pnpm install --frozen-lockfile --config.minimum-release-age=0 && pnpm check:changed`
- У `../fs-safe`: `pnpm docs:site && pnpm build && pnpm test test/api-coverage.test.ts test/new-primitives.test.ts`

## Контрольний список перевірки

- Чи це змінення прибирає публічну назву, локальну обгортку або дубльовану семантичну
  групу?
- Чи стара назва є публічною поверхнею Plugin SDK? Якщо так, збережіть застарілий псевдонім.
- Чи заміна зберігає поведінку symlink, hardlink, режиму та відсутнього файлу?
- Чи виклик використовує ненадійний відносний шлях, довірений абсолютний шлях, секретний
  шлях, запис архіву або тимчасовий життєвий цикл? Виберіть helper, який явно це
  проговорює.
- Чи оновлено документацію та API-знімки Plugin SDK, коли змінюються експортовані назви?
