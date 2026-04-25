---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Перенесення зашифрованої історії Matrix та стану пристрою
summary: Як OpenClaw оновлює попередній Plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-25T21:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Ця сторінка описує оновлення з попереднього публічного Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення виконується на місці:

- Plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан середовища виконання залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати Plugin під новою назвою.

## Що міграція робить автоматично

Коли запускається Gateway, а також коли ви виконуєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично виправити старий стан Matrix.
Перш ніж будь-який практичний крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий знімок відновлення.

Коли ви використовуєте `openclaw update`, точний тригер залежить від того, як установлено OpenClaw:

- інсталяції з вихідного коду запускають `openclaw doctor --fix` під час процесу оновлення, а потім за замовчуванням перезапускають Gateway
- інсталяції через менеджер пакетів оновлюють пакет, запускають неінтерактивний прохід doctor, а потім покладаються на стандартний перезапуск Gateway, щоб запуск міг завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, прив’язана до запуску, відкладається, доки ви пізніше не виконаєте `openclaw doctor --fix` і не перезапустите Gateway

Автоматична міграція охоплює:

- створення або повторне використання знімка до міграції в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису та конфігурації `channels.matrix`
- переміщення найстарішого плоского сховища синхронізації Matrix у поточне розташування з областю дії облікового запису
- переміщення найстарішого плоского криптографічного сховища Matrix у поточне розташування з областю дії облікового запису, коли цільовий обліковий запис можна безпечно визначити
- витягування раніше збереженого ключа розшифрування резервної копії ключів кімнат Matrix зі старого rust crypto store, якщо цей ключ існує локально
- повторне використання найбільш повного наявного кореня сховища хеша токена для того самого облікового запису Matrix, homeserver і користувача, коли токен доступу пізніше змінюється
- сканування сусідніх коренів сховищ хеша токена на наявність метаданих очікуваного відновлення зашифрованого стану, коли токен доступу Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних ключів кімнат у нове криптографічне сховище під час наступного запуску Matrix

Деталі знімка:

- OpenClaw записує файл-маркер у `~/.openclaw/matrix/migration-snapshot.json` після успішного створення знімка, щоб подальші проходи запуску та відновлення могли повторно використовувати той самий архів.
- Ці автоматичні знімки міграції Matrix резервують лише конфігурацію та стан (`includeWorkspace: false`).
- Якщо Matrix має лише стан міграції рівня попередження, наприклад тому, що `userId` або `accessToken` ще відсутні, OpenClaw поки не створює знімок, оскільки жодна зміна Matrix ще не є практично можливою.
- Якщо крок зі знімком не вдається, OpenClaw пропускає міграцію Matrix для цього запуску замість того, щоб змінювати стан без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походило зі схеми з одним сховищем, тому OpenClaw може мігрувати його лише в одну визначену ціль Matrix-облікового запису
- уже наявні застарілі сховища Matrix з областю дії облікового запису виявляються та готуються для кожного налаштованого облікового запису Matrix

## Чого міграція не може зробити автоматично

Попередній публічний Plugin Matrix **не** створював автоматично резервні копії ключів кімнат Matrix. Він зберігав локальний криптографічний стан і запитував верифікацію пристрою, але не гарантував, що ваші ключі кімнат були збережені на homeserver.

Це означає, що деякі зашифровані інсталяції можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- локальні ключі кімнат, які ніколи не були збережені в резервній копії
- зашифрований стан, якщо цільовий обліковий запис Matrix ще неможливо визначити, тому що `homeserver`, `userId` або `accessToken` усе ще недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, коли налаштовано кілька облікових записів Matrix, але `channels.matrix.defaultAccount` не задано
- інсталяції з користувацьким шляхом до Plugin, які прив’язані до шляху репозиторію замість стандартного пакета Matrix
- відсутній ключ відновлення, коли старе сховище мало резервні ключі, але не зберегло ключ розшифрування локально

Поточний обсяг попереджень:

- інсталяції Matrix Plugin із користувацьким шляхом показуються як під час запуску Gateway, так і в `openclaw doctor`

Якщо у вашій старій інсталяції була локальна зашифрована історія, яка ніколи не резервувалася, деякі старіші зашифровані повідомлення можуть залишитися непридатними до читання після оновлення.

## Рекомендований сценарій оновлення

1. Оновіть OpenClaw і Matrix Plugin звичайним способом.
   Надавайте перевагу звичайному `openclaw update` без `--no-restart`, щоб запуск міг одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо для Matrix є практичні завдання міграції, doctor спочатку створить або повторно використає знімок до міграції та виведе шлях до архіву.

3. Запустіть або перезапустіть Gateway.
4. Перевірте поточний стан верифікації та резервного копіювання:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Помістіть ключ відновлення для облікового запису Matrix, який ви відновлюєте, у змінну середовища для конкретного облікового запису. Для одного стандартного облікового запису підійде `MATRIX_RECOVERY_KEY`. Для кількох облікових записів використовуйте одну змінну на кожен обліковий запис, наприклад `MATRIX_RECOVERY_KEY_ASSISTANT`, і додайте `--account assistant` до команди.

6. Якщо OpenClaw повідомляє, що потрібен ключ відновлення, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Якщо цей пристрій усе ще не верифіковано, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Якщо ключ відновлення прийнято і резервна копія придатна до використання, але `Cross-signing verified`
   усе ще має значення `no`, завершіть самоверифікацію з іншого клієнта Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Підтвердьте запит в іншому клієнті Matrix, порівняйте емодзі або десяткові числа
   і введіть `yes`, лише якщо вони збігаються. Команда завершується успішно лише
   після того, як `Cross-signing verified` стане `yes`.

8. Якщо ви свідомо відмовляєтеся від старої історії, яку неможливо відновити, і хочете нову базову резервну копію для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Якщо резервної копії ключів на сервері ще немає, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція зашифрованих даних

Міграція зашифрованих даних — це двоетапний процес:

1. Під час запуску або `openclaw doctor --fix` створюється або повторно використовується знімок до міграції, якщо міграція зашифрованих даних є практично можливою.
2. Під час запуску або `openclaw doctor --fix` старе криптографічне сховище Matrix перевіряється через активну інсталяцію Matrix Plugin.
3. Якщо знайдено ключ розшифрування резервної копії, OpenClaw записує його в новий процес з ключем відновлення та позначає відновлення ключів кімнат як очікуване.
4. Під час наступного запуску Matrix OpenClaw автоматично відновлює резервні ключі кімнат у нове криптографічне сховище.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw показує попередження замість того, щоб удавати, що відновлення пройшло успішно.

## Поширені повідомлення та їх значення

### Повідомлення про оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску було виявлено та мігровано до поточної структури.
- Що робити: нічого, якщо тільки той самий вивід не містить також попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив архів відновлення перед зміною стану Matrix.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція пройшла успішно.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний файл-маркер знімка міграції Matrix і повторно використав цей архів замість створення дубліката резервної копії.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція пройшла успішно.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним обліковим записом Matrix, тому що Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але все ще не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть Gateway із робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з областю дії облікового запису вже має сховище синхронізації або криптографічне сховище, тому OpenClaw не перезаписав його автоматично.
- Що робити: переконайтеся, що поточний обліковий запис є правильним, перш ніж вручну видаляти або переміщати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw спробував перемістити старий стан Matrix, але операція файлової системи завершилася помилкою.
- Що робити: перевірте дозволи файлової системи та стан диска, а потім повторно виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно визначити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть Gateway із робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після того, як кешовані облікові дані стануть доступними.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске застаріле криптографічне сховище, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграція все ще заблокована через відсутні дані ідентичності або облікових даних.
- Що робити: завершіть вхід у Matrix або налаштування конфігурації, а потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити допоміжну точку входу з Matrix Plugin, яка зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть Matrix Plugin (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до допоміжного файла, який виходить за межі кореня Plugin або не проходить перевірки меж Plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть Matrix Plugin із довіреного шляху, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, оскільки спочатку не зміг створити знімок відновлення.
- Що робити: усуньте помилку резервного копіювання, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: клієнтський резервний механізм Matrix знайшов старе плоске сховище, але переміщення не вдалося. Тепер OpenClaw перериває цей резервний механізм замість того, щоб мовчки запускатися з новим сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан недоторканим і повторіть спробу після виправлення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix прив’язано до інсталяції за шляхом, тому основні оновлення не замінюють його автоматично стандартним пакетом Matrix із репозиторію.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до стандартного Matrix Plugin.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: резервні ключі кімнат успішно відновлено в новому криптографічному сховищі.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише в старому локальному сховищі та ніколи не були завантажені в резервну копію Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете відновити ці ключі вручну з іншого верифікованого клієнта Matrix.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити ключ відновлення.
- Що робити: виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг достатньо безпечно перевірити його, щоб підготувати відновлення.
- Що робити: знову виконайте `openclaw doctor --fix`. Якщо це повторюється, збережіть старий каталог стану недоторканим і відновіть дані за допомогою іншого верифікованого клієнта Matrix плюс `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключів резервної копії та відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який ключ відновлення є правильним, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: резервні ключі все ще можна відновити, але локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий Plugin спробував виконати відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, а потім за потреби повторіть спробу з `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути ключ резервної копії, але на цьому пристрої він не активний.
- Що робити: виконайте `openclaw matrix verify backup restore` або задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої зараз не збережено ключ відновлення.
- Що робити: задайте `MATRIX_RECOVERY_KEY`, виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, а потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Значення: збережений ключ не відповідає активній резервній копії Matrix.
- Що робити: задайте `MATRIX_RECOVERY_KEY` на правильний ключ і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Якщо ви погоджуєтеся втратити стару зашифровану історію, яку неможливо відновити, ви можете натомість скинути
поточну базову резервну копію за допомогою `openclaw matrix verify backup reset --yes`. Коли
збережений секрет резервної копії пошкоджений, це скидання також може заново створити secret storage, щоб
новий ключ резервної копії міг коректно завантажитися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Значення: резервна копія існує, але цей пристрій поки що недостатньо довіряє ланцюгу cross-signing.
- Що робити: задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Значення: ви спробували виконати крок відновлення без надання ключа відновлення, коли він був потрібен.
- Що робити: повторіть команду з `--recovery-key-stdin`, наприклад `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним ключем відновлення з вашого клієнта Matrix або файла recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значення: OpenClaw зміг застосувати ключ відновлення, але Matrix усе ще не
  встановив повну довіру до cross-signing identity для цього пристрою. Перевірте
  вивід команди на наявність `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, прийміть запит в іншому
  клієнті Matrix, порівняйте SAS і введіть `yes`, лише якщо він збігається. Команда
  чекає на повну довіру до Matrix identity перед повідомленням про успіх. Використовуйте
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  лише тоді, коли ви свідомо хочете замінити поточну cross-signing identity.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створило активну сесію резервної копії на цьому пристрої.
- Що робити: спочатку верифікуйте пристрій, потім повторно перевірте стан через `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Значення: цей пристрій не може відновлювати з secret storage, доки не завершено верифікацію пристрою.
- Що робити: спочатку виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Повідомлення про інсталяцію користувацького Plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: запис про інсталяцію Plugin вказує на локальний шлях, якого більше не існує.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, або, якщо ви працюєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки в такому порядку:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Якщо резервну копію успішно відновлено, але в деяких старих кімнатах усе ще бракує історії, ці відсутні ключі, імовірно, ніколи не резервувалися попереднім Plugin.

## Якщо ви хочете почати заново для майбутніх повідомлень

Якщо ви погоджуєтеся втратити стару зашифровану історію, яку неможливо відновити, і хочете лише чисту базову резервну копію на майбутнє, виконайте ці команди в такому порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не верифіковано, завершіть верифікацію зі свого клієнта Matrix, порівнявши SAS emoji або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язані сторінки

- [Matrix](/uk/channels/matrix)
- [Doctor](/uk/gateway/doctor)
- [Migrating](/uk/install/migrating)
- [Plugins](/uk/tools/plugin)
