---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній Matrix Plugin на місці, зокрема обмеження відновлення зашифрованого стану та кроки ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Оновіть попередній публічний Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення виконується на місці:

- Plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан виконання залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати Plugin під новою назвою.
Кореневий пакет `openclaw` більше не містить код виконання Matrix або залежності Matrix SDK. Якщо `openclaw channels status` показує, що Matrix налаштовано, але після оновлення Plugin відсутній, запустіть `openclaw doctor --fix` або `openclaw plugins install @openclaw/matrix`; не встановлюйте пакети Matrix SDK у кореневий пакет OpenClaw.

## Що міграція робить автоматично

Коли Gateway запускається, а також коли ви запускаєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перед тим як будь-який дієвий крок міграції Matrix змінює стан на диску, OpenClaw створює або повторно використовує цільовий знімок відновлення.

Коли ви використовуєте `openclaw update`, точний тригер залежить від способу встановлення OpenClaw:

- встановлення з вихідного коду запускають `openclaw doctor --fix` під час процесу оновлення, а потім типово перезапускають Gateway
- встановлення через менеджер пакетів оновлюють пакет, запускають неінтерактивний прохід doctor, а потім покладаються на типовий перезапуск Gateway, щоб запуск завершив міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, прив’язана до запуску, відкладається, доки ви пізніше не запустите `openclaw doctor --fix` і не перезапустите Gateway

Автоматична міграція охоплює:

- створення або повторне використання знімка перед міграцією в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису та конфігурації `channels.matrix`
- переміщення найстарішого плоского сховища синхронізації Matrix у поточне розташування з прив’язкою до облікового запису
- переміщення найстарішого плоского криптографічного сховища Matrix у поточне розташування з прив’язкою до облікового запису, коли цільовий обліковий запис можна безпечно визначити
- витяг раніше збереженого ключа розшифрування резервної копії ключів кімнат Matrix зі старого криптографічного сховища rust, коли цей ключ існує локально
- повторне використання найповнішого наявного кореня сховища хешу токена для того самого облікового запису Matrix, домашнього сервера та користувача, коли токен доступу змінюється пізніше
- сканування сусідніх коренів сховища хешу токена на наявність очікуваних метаданих відновлення зашифрованого стану, коли токен доступу Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних копій ключів кімнат у нове криптографічне сховище під час наступного запуску Matrix

Деталі знімка:

- OpenClaw записує файл-маркер у `~/.openclaw/matrix/migration-snapshot.json` після успішного знімка, щоб пізніші запуски та проходи відновлення могли повторно використати той самий архів.
- Ці автоматичні знімки міграції Matrix резервують лише конфігурацію + стан (`includeWorkspace: false`).
- Якщо Matrix має лише попереджувальний стан міграції, наприклад через те, що `userId` або `accessToken` досі відсутній, OpenClaw ще не створює знімок, бо жодна зміна Matrix не є дієвою.
- Якщо крок створення знімка завершується помилкою, OpenClaw пропускає міграцію Matrix для цього запуску замість зміни стану без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить із макета з одним сховищем, тому OpenClaw може перенести його лише в одну визначену ціль облікового запису Matrix
- застарілі сховища Matrix, які вже мають прив’язку до облікового запису, виявляються й готуються для кожного налаштованого облікового запису Matrix

## Що міграція не може зробити автоматично

Попередній публічний Matrix Plugin **не** створював автоматично резервні копії ключів кімнат Matrix. Він зберігав локальний криптографічний стан і запитував перевірку пристрою, але не гарантував, що ваші ключі кімнат були зарезервовані на домашньому сервері.

Це означає, що деякі зашифровані встановлення можна перенести лише частково.

OpenClaw не може автоматично відновити:

- локальні ключі кімнат, які ніколи не резервувалися
- зашифрований стан, коли цільовий обліковий запис Matrix ще не можна визначити, бо `homeserver`, `userId` або `accessToken` досі недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, коли налаштовано кілька облікових записів Matrix, але `channels.matrix.defaultAccount` не задано
- встановлення Plugin за користувацьким шляхом, закріплені за шляхом до репозиторію замість стандартного пакета Matrix
- відсутній ключ відновлення, коли старе сховище мало резервні копії ключів, але не зберегло ключ розшифрування локально

Поточна область попереджень:

- встановлення Matrix Plugin за користувацьким шляхом показуються як під час запуску Gateway, так і в `openclaw doctor`

Якщо ваша стара інсталяція мала локальну зашифровану історію, яка ніколи не резервувалася, деякі старіші зашифровані повідомлення можуть залишитися нечитабельними після оновлення.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Matrix Plugin звичайним способом.
   Надавайте перевагу простому `openclaw update` без `--no-restart`, щоб запуск міг одразу завершити міграцію Matrix.
2. Запустіть:

   ```bash
   openclaw doctor --fix
   ```

   Якщо Matrix має дієву роботу з міграції, doctor спочатку створить або повторно використає знімок перед міграцією та виведе шлях до архіву.

3. Запустіть або перезапустіть Gateway.
4. Перевірте поточний стан перевірки та резервної копії:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Помістіть ключ відновлення для облікового запису Matrix, який ви відновлюєте, у змінну середовища для конкретного облікового запису. Для одного типового облікового запису достатньо `MATRIX_RECOVERY_KEY`. Для кількох облікових записів використовуйте одну змінну на обліковий запис, наприклад `MATRIX_RECOVERY_KEY_ASSISTANT`, і додайте `--account assistant` до команди.

6. Якщо OpenClaw повідомляє, що потрібен ключ відновлення, запустіть команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Якщо цей пристрій досі не перевірено, запустіть команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Якщо ключ відновлення прийнято й резервна копія придатна до використання, але `Cross-signing verified` досі має значення `no`, завершіть самоперевірку з іншого клієнта Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Прийміть запит в іншому клієнті Matrix, порівняйте емодзі або десяткові числа та введіть `yes` лише якщо вони збігаються. Команда завершується успішно лише після того, як `Cross-signing verified` стане `yes`.

8. Якщо ви свідомо відмовляєтеся від невідновлюваної старої історії та хочете створити нову базову резервну копію для майбутніх повідомлень, запустіть:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Якщо серверної резервної копії ключів ще немає, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція зашифрованих даних

Міграція зашифрованих даних є двоетапним процесом:

1. Запуск або `openclaw doctor --fix` створює чи повторно використовує знімок перед міграцією, якщо зашифрована міграція є дієвою.
2. Запуск або `openclaw doctor --fix` перевіряє старе криптографічне сховище Matrix через активне встановлення Matrix Plugin.
3. Якщо знайдено ключ розшифрування резервної копії, OpenClaw записує його в новий процес ключа відновлення та позначає відновлення ключів кімнат як очікуване.
4. Під час наступного запуску Matrix OpenClaw автоматично відновлює резервні копії ключів кімнат у нове криптографічне сховище.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не резервувалися, OpenClaw попереджає замість того, щоб удавати, що відновлення успішне.

## Поширені повідомлення та що вони означають

### Повідомлення про оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску було виявлено та перенесено в поточний макет.
- Що робити: нічого, якщо той самий вивід також не містить попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив архів відновлення перед зміною стану Matrix.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите успішність міграції.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний маркер знімка міграції Matrix і повторно використав цей архів замість створення дубліката резервної копії.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите успішність міграції.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним обліковим записом Matrix, бо Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але досі не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть Gateway із робочим входом Matrix або повторно запустіть `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, який іменований обліковий запис Matrix має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` як потрібний обліковий запис, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з прив’язкою до облікового запису вже має сховище синхронізації або криптографічне сховище, тому OpenClaw не перезаписав його автоматично.
- Що робити: перевірте, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщувати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` або `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw намагався перемістити старий стан Matrix, але операція файлової системи завершилася помилкою.
- Що робити: перевірте дозволи файлової системи та стан диска, потім повторно запустіть `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно вирішити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть Gateway із робочим входом Matrix або повторно запустіть `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске застаріле криптографічне сховище, але відмовляється вгадувати, який іменований обліковий запис Matrix має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` як потрібний обліковий запис, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграція досі заблокована через відсутні дані ідентичності або облікових даних.
- Що робити: завершіть вхід у Matrix або налаштування конфігурації, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити допоміжну точку входу з Matrix plugin, яка зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть Matrix plugin (`openclaw plugins install @openclaw/matrix`, або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до допоміжного файлу, який виходить за межі кореня plugin або не проходить перевірки меж plugin, тому відмовився імпортувати його.
- Що робити: перевстановіть Matrix plugin із довіреного шляху, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, бо спочатку не зміг створити знімок для відновлення.
- Що робити: усуньте помилку резервного копіювання, потім повторно запустіть `openclaw doctor --fix` або перезапустіть Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: клієнтський fallback Matrix знайшов старе плоске сховище, але перенесення не вдалося. Тепер OpenClaw перериває цей fallback замість того, щоб непомітно запускатися зі свіжим сховищем.
- Що робити: перевірте права доступу файлової системи або конфлікти, збережіть старий стан неушкодженим і повторіть спробу після виправлення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix закріплено за path install, тому основні оновлення не замінюють його автоматично стандартним пакетом Matrix із репозиторію.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до типового Matrix plugin.

### Повідомлення відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: резервні ключі кімнат успішно відновлено в нове криптосховище.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише в старому локальному сховищі й ніколи не були завантажені в резервну копію Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете відновити ці ключі вручну з іншого перевіреного клієнта.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити ключ відновлення.
- Що робити: виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг перевірити його достатньо безпечно, щоб підготувати відновлення.
- Що робити: повторно запустіть `openclaw doctor --fix`. Якщо проблема повторюється, збережіть каталог старого стану неушкодженим і відновіть дані за допомогою іншого перевіреного клієнта Matrix плюс `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключа резервної копії та відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який ключ відновлення правильний, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: резервні ключі все ще можна відновити, але локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий plugin спробував відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, потім за потреби повторіть із `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Повідомлення ручного відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути ключ резервної копії, але він не активний на цьому пристрої.
- Що робити: виконайте `openclaw matrix verify backup restore`, або задайте `MATRIX_RECOVERY_KEY` і за потреби виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Значення: цей пристрій наразі не має збереженого ключа відновлення.
- Що робити: задайте `MATRIX_RECOVERY_KEY`, виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Значення: збережений ключ не відповідає активній резервній копії Matrix.
- Що робити: задайте для `MATRIX_RECOVERY_KEY` правильний ключ і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, натомість можете скинути
поточну базову лінію резервної копії за допомогою `openclaw matrix verify backup reset --yes`. Коли
збережений секрет резервної копії пошкоджено, це скидання також може повторно створити secret storage, щоб
новий ключ резервної копії правильно завантажився після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Значення: резервна копія існує, але цей пристрій поки що недостатньо довіряє ланцюгу cross-signing.
- Що робити: задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Значення: ви спробували крок відновлення без надання ключа відновлення, коли він був потрібен.
- Що робити: повторно запустіть команду з `--recovery-key-stdin`, наприклад `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідав очікуваному формату.
- Що робити: повторіть із точним ключем відновлення з вашого клієнта Matrix або файла recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значення: OpenClaw зміг застосувати ключ відновлення, але Matrix усе ще не
  встановив повну довіру до ідентичності cross-signing для цього пристрою. Перевірте
  вивід команди на `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, прийміть запит в іншому
  клієнті Matrix, порівняйте SAS і введіть `yes` лише якщо він збігається. Команда
  очікує повної довіри до ідентичності Matrix, перш ніж повідомити про успіх. Використовуйте
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  лише тоді, коли ви навмисно хочете замінити поточну ідентичність cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створило активний сеанс резервної копії на цьому пристрої.
- Що робити: спочатку перевірте пристрій, потім повторно перевірте за допомогою `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Значення: цей пристрій не може відновлювати з secret storage, доки перевірку пристрою не завершено.
- Що робити: спочатку виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Повідомлення встановлення користувацького plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: ваш запис встановлення plugin вказує на локальний шлях, якого вже немає.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, або, якщо ви запускаєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки по черзі:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Якщо резервну копію успішно відновлено, але в деяких старих кімнатах усе ще бракує історії, ці відсутні ключі, ймовірно, ніколи не були зарезервовані попереднім plugin.

## Якщо ви хочете почати заново для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й хочете лише чисту базову лінію резервної копії надалі, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не перевірено, завершіть перевірку зі свого клієнта Matrix, порівнявши SAS emoji або десяткові коди й підтвердивши, що вони збігаються.

## Пов’язане

- [Matrix](/uk/channels/matrix): налаштування каналу та конфігурація.
- [Правила push Matrix](/uk/channels/matrix-push-rules): маршрутизація сповіщень.
- [Doctor](/uk/gateway/doctor): перевірка справності та автоматичний тригер міграції.
- [Посібник із міграції](/uk/install/migrating): усі шляхи міграції (перенесення машин, міжсистемні імпорти).
- [Plugins](/uk/tools/plugin): встановлення та реєстрація plugin.
