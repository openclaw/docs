---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Перенесення зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній Plugin Matrix безпосередньо на місці, зокрема обмеження відновлення зашифрованого стану та кроки ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-07-16T17:39:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Оновіть попередній публічний Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення вже передбачено:

- Plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан середовища виконання залишається в `~/.openclaw/matrix/`

Не потрібно перейменовувати ключі конфігурації або перевстановлювати Plugin під новою назвою.
Кореневий пакет `openclaw` більше не містить код середовища виконання Matrix або залежності Matrix SDK. Якщо `openclaw channels status` показує, що Matrix налаштовано, але
Plugin не встановлено, виконайте `openclaw doctor --fix` або
`openclaw plugins install @openclaw/matrix`; не встановлюйте пакети Matrix SDK
у кореневий пакет OpenClaw.

## Що міграція виконує автоматично

Міграція Matrix запускається під час виконання [`openclaw doctor --fix`](/uk/gateway/doctor), а також як резервний механізм, коли клієнт Matrix запускається й усе ще знаходить файловий допоміжний стан поруч зі своїм сховищем SQLite.

Автоматична міграція охоплює:

- повторне використання кешованих облікових даних Matrix
- збереження того самого вибору облікового запису й конфігурації `channels.matrix`
- імпортування файлового допоміжного стану (кеш синхронізації `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, знімки IndexedDB) до стану Matrix у SQLite; мігровані файли архівуються із суфіксом `.migrated`
- повторне використання найповнішого наявного кореня сховища хешів токенів для того самого облікового запису Matrix, домашнього сервера, користувача й пристрою, коли токен доступу згодом змінюється

## Оновлення з випусків OpenClaw, старіших за 2026.4

Випуски до гілки 2026.6 включно також мігрували початкову пласку структуру Matrix з одним сховищем (`~/.openclaw/matrix/bot-storage.json` та
`~/.openclaw/matrix/crypto/`) і готували відновлення зашифрованого стану зі
старого криптографічного сховища Rust. Поточні випуски більше не містять цієї міграції.

Якщо ви оновлюєте інсталяцію, яка досі використовує пласку структуру, спочатку
оновіть її до випуску 2026.6, виконайте `openclaw doctor --fix` і один раз запустіть Gateway,
щоб пласке сховище й усі відновлювані ключі кімнат було мігровано. Потім оновіть
до найновішого випуску.

Попередній публічний Plugin Matrix **не** створював автоматично резервні копії ключів кімнат Matrix. Якщо у старій інсталяції була лише локальна зашифрована історія, резервну копію якої ніколи не створювали, деякі старі зашифровані повідомлення можуть залишитися нечитабельними після оновлення незалежно від шляху міграції.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Plugin Matrix звичайним способом.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

3. Запустіть або перезапустіть Gateway.
4. Перевірте поточний стан перевірки й резервного копіювання:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Помістіть ключ відновлення для облікового запису Matrix, який відновлюєте, у змінну середовища для конкретного облікового запису. Для одного облікового запису за замовчуванням підійде `MATRIX_RECOVERY_KEY`. Для кількох облікових записів використовуйте окрему змінну для кожного облікового запису, наприклад `MATRIX_RECOVERY_KEY_ASSISTANT`, і додайте до команди `--account assistant`.

6. Якщо OpenClaw повідомляє, що потрібен ключ відновлення, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Якщо цей пристрій досі не перевірено, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Якщо ключ відновлення прийнято й резервна копія придатна до використання, але `Cross-signing verified`
   досі має значення `no`, завершіть самоперевірку з іншого клієнта Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Прийміть запит в іншому клієнті Matrix, порівняйте емодзі або десяткові числа
   й введіть `yes`, лише якщо вони збігаються. Команда очікує повної довіри до ідентичності Matrix,
   перш ніж повідомити про успіх.

8. Якщо ви свідомо відмовляєтеся від невідновлюваної старої історії та хочете створити нову базову резервну копію для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Додайте `--rotate-recovery-key`, лише якщо старий ключ відновлення більше не повинен розблоковувати нову резервну копію.

9. Якщо резервної копії ключів на сервері ще немає, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Поширені повідомлення та їхнє значення

`Failed migrating legacy Matrix client storage: ...`

- Значення: резервний механізм на боці клієнта Matrix знайшов файловий допоміжний стан, але не зміг імпортувати його до SQLite. OpenClaw скасовує завершені переміщення й перериває цей резервний механізм замість непомітного запуску з новим сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан без змін і повторіть спробу після виправлення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix прив’язано до інсталяції за шляхом, тому оновлення основної гілки не замінюють її автоматично стандартним пакетом Matrix.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, якщо хочете повернутися до стандартного Plugin Matrix.

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: запис про встановлення Plugin указує на локальний шлях, якого більше немає.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix` або, якщо працюєте з копії репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` також може видалити застарілі посилання на Plugin Matrix.

### Повідомлення про ручне відновлення

`openclaw matrix verify status` і `openclaw matrix verify backup status` виводять рядок `Backup issue:` та вказівки `Next steps:`, коли резервна копія ключів кімнат на цьому пристрої не справна:

| Проблема з резервною копією                                           | Значення                                           | Виправлення                                                                                                                               |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | немає джерела для відновлення                      | `openclaw matrix verify bootstrap`, щоб створити резервну копію ключів кімнат                                                                            |
| `backup decryption key is not loaded on this device`                  | ключ існує, але тут не активний                     | `openclaw matrix verify backup restore`; якщо ключ усе ще не завантажується, передайте ключ відновлення через канал за допомогою `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | не вдалося завантажити сховище секретів або воно не підтримується | передайте ключ відновлення через канал: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | збережений ключ не відповідає активній резервній копії на сервері | повторно виконайте `verify backup restore --recovery-key-stdin` з ключем активної резервної копії на сервері або `verify backup reset --yes`, щоб створити нову базову копію |
| `backup signature chain is not trusted by this device`                | пристрій ще не довіряє ланцюжку перехресного підписування | `verify device --recovery-key-stdin`, а потім `verify self` з іншого перевіреного клієнта, якщо довіра все ще неповна                        |
| `backup exists but is not active on this device`                      | резервна копія є на сервері, локальний сеанс неактивний | спочатку перевірте пристрій, а потім повторіть перевірку за допомогою `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | діагностика не дала однозначного результату         | `openclaw matrix verify status --verbose`                                                                                                 |

Інші помилки відновлення:

`Matrix recovery key is required`

- Значення: ви спробували виконати крок відновлення, не надавши ключ відновлення, коли він був потрібен.
- Що робити: повторно виконайте команду з `--recovery-key-stdin`, наприклад `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним ключем відновлення з клієнта Matrix або експорту ключа відновлення.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значення: ключ відновлення розблокував придатні до використання матеріали резервної копії, але Matrix не встановила повної довіри до ідентичності через перехресне підписування для цього пристрою. Перевірте у виводі команди `Recovery key accepted`, `Backup usable`, `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, прийміть запит в іншому клієнті Matrix, порівняйте SAS і введіть `yes`, лише якщо вони збігаються. Використовуйте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`, лише якщо свідомо хочете замінити поточну ідентичність перехресного підписування.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, натомість можна скинути
поточну базову резервну копію за допомогою `openclaw matrix verify backup reset --yes`. Якщо
збережений секрет резервної копії пошкоджено, це скидання також відновлює сховище секретів, щоб
новий ключ резервної копії міг правильно завантажитися після перезапуску.

## Якщо зашифрована історія все одно не відновилася

Виконайте такі перевірки в зазначеному порядку:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Якщо резервну копію успішно відновлено, але в деяких старих кімнатах історія все ще відсутня, резервні копії цих відсутніх ключів, імовірно, ніколи не створювалися попереднім Plugin.

## Якщо потрібно почати заново для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й хочете лише створити чисту базову резервну копію для подальшого використання, виконайте ці команди в зазначеному порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не перевірено, завершіть перевірку з клієнта Matrix, порівнявши емодзі SAS або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язані матеріали

- [Matrix](/uk/channels/matrix): налаштування каналу й конфігурація.
- [Правила push-сповіщень Matrix](/uk/channels/matrix-push-rules): маршрутизація сповіщень.
- [Doctor](/uk/gateway/doctor): перевірка справності й запуск автоматичної міграції.
- [Посібник із міграції](/uk/install/migrating): усі шляхи міграції (перенесення між машинами, імпорт між системами).
- [Plugins](/uk/tools/plugin): встановлення й реєстрація Plugin.
