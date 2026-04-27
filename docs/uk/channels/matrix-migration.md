---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-27T10:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 15
---

Оновіть попередній публічний plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення виконується на місці:

- plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан середовища виконання залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати plugin під новою назвою.

## Що міграція робить автоматично

Коли запускається Gateway і коли ви виконуєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перш ніж будь-який дієвий крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий знімок для відновлення.

Коли ви використовуєте `openclaw update`, точний тригер залежить від того, як встановлено OpenClaw:

- інсталяції з вихідного коду запускають `openclaw doctor --fix` під час процесу оновлення, а потім за замовчуванням перезапускають Gateway
- інсталяції через менеджер пакетів оновлюють пакет, запускають неінтерактивний прохід doctor, а потім покладаються на стандартний перезапуск Gateway, щоб під час запуску завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, що виконується під час запуску, відкладається, доки ви пізніше не запустите `openclaw doctor --fix` і не перезапустите Gateway

Автоматична міграція охоплює:

- створення або повторне використання знімка перед міграцією в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису та конфігурації `channels.matrix`
- переміщення найстарішого плоского сховища синхронізації Matrix до поточного розташування з прив’язкою до облікового запису
- переміщення найстарішого плоского криптографічного сховища Matrix до поточного розташування з прив’язкою до облікового запису, якщо цільовий обліковий запис можна безпечно визначити
- витягування раніше збереженого ключа розшифрування резервної копії ключів кімнат Matrix зі старого rust crypto store, якщо цей ключ існує локально
- повторне використання найповнішого наявного кореня сховища з хешем токена для того самого облікового запису Matrix, homeserver і користувача, коли токен доступу пізніше змінюється
- сканування сусідніх коренів сховища з хешем токена на наявність метаданих незавершеного відновлення зашифрованого стану, якщо токен доступу Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних копій ключів кімнат у нове криптографічне сховище під час наступного запуску Matrix

Подробиці щодо знімка:

- після успішного створення знімка OpenClaw записує файл-маркер у `~/.openclaw/matrix/migration-snapshot.json`, щоб під час подальших запусків і проходів відновлення можна було повторно використати той самий архів.
- ці автоматичні знімки міграції Matrix створюють резервну копію лише конфігурації та стану (`includeWorkspace: false`).
- якщо Matrix має лише стан міграції з попередженнями, наприклад тому, що `userId` або `accessToken` ще відсутні, OpenClaw поки не створює знімок, оскільки жодна зміна Matrix не є дієвою.
- якщо крок створення знімка завершується помилкою, OpenClaw пропускає міграцію Matrix у цьому запуску замість того, щоб змінювати стан без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить із макета з єдиним сховищем, тому OpenClaw може мігрувати його лише в одну визначену ціль Matrix-облікового запису
- застарілі сховища Matrix, уже прив’язані до облікових записів, виявляються й готуються окремо для кожного налаштованого Matrix-облікового запису

## Що міграція не може зробити автоматично

Попередній публічний plugin Matrix **не** створював резервні копії ключів кімнат Matrix автоматично. Він зберігав локальний криптографічний стан і запитував верифікацію пристрою, але не гарантував, що ваші ключі кімнат було збережено в резервній копії на homeserver.

Це означає, що деякі зашифровані інсталяції можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- локальні ключі кімнат, які ніколи не були збережені в резервній копії
- зашифрований стан, коли цільовий Matrix-обліковий запис ще не можна визначити, тому що `homeserver`, `userId` або `accessToken` ще недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, якщо налаштовано кілька Matrix-облікових записів, але `channels.matrix.defaultAccount` не задано
- інсталяції з користувацьким шляхом до plugin, які закріплені за шляхом до репозиторію замість стандартного пакета Matrix
- відсутній ключ відновлення, якщо в старому сховищі були ключі з резервної копії, але ключ розшифрування не зберігався локально

Поточний обсяг попереджень:

- інсталяції Matrix plugin із користувацьким шляхом відображаються як під час запуску Gateway, так і в `openclaw doctor`

Якщо у вашій старій інсталяції була локальна зашифрована історія, яка ніколи не зберігалася в резервній копії, деякі старіші зашифровані повідомлення можуть залишитися недоступними для читання після оновлення.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Matrix plugin звичайним способом.
   Віддавайте перевагу звичайному `openclaw update` без `--no-restart`, щоб під час запуску одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо для Matrix є дієва робота з міграції, doctor спочатку створить або повторно використає знімок перед міграцією та виведе шлях до архіву.

3. Запустіть або перезапустіть Gateway.
4. Перевірте поточний стан верифікації та резервного копіювання:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Помістіть ключ відновлення для Matrix-облікового запису, який ви відновлюєте, у змінну середовища для конкретного облікового запису. Для одного облікового запису за замовчуванням підійде `MATRIX_RECOVERY_KEY`. Для кількох облікових записів використовуйте одну змінну для кожного облікового запису, наприклад `MATRIX_RECOVERY_KEY_ASSISTANT`, і додайте `--account assistant` до команди.

6. Якщо OpenClaw повідомляє, що потрібен ключ відновлення, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Якщо цей пристрій досі не верифікований, виконайте команду для відповідного облікового запису:

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
   і вводьте `yes` лише якщо вони збігаються. Команда завершується успішно лише
   після того, як `Cross-signing verified` стане `yes`.

8. Якщо ви свідомо відмовляєтеся від старої історії, яку неможливо відновити, і хочете створити нову базову лінію резервного копіювання для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Якщо резервної копії ключів на сервері ще немає, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція зашифрованих даних

Міграція зашифрованих даних — це двоетапний процес:

1. Під час запуску або `openclaw doctor --fix` створюється або повторно використовується знімок перед міграцією, якщо міграція зашифрованих даних є дієвою.
2. Під час запуску або `openclaw doctor --fix` старе криптографічне сховище Matrix перевіряється через активну інсталяцію Matrix plugin.
3. Якщо знайдено ключ розшифрування резервної копії, OpenClaw записує його в новий процес роботи з ключем відновлення та позначає відновлення ключів кімнат як таке, що очікує виконання.
4. Під час наступного запуску Matrix OpenClaw автоматично відновлює резервні копії ключів кімнат у нове криптографічне сховище.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw попереджає про це замість того, щоб удавати, що відновлення пройшло успішно.

## Поширені повідомлення та їх значення

### Повідомлення про оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску було виявлено та мігровано до поточного макета.
- Що робити: нічого, якщо тільки той самий вивід також не містить попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив архів для відновлення перед зміною стану Matrix.
- Що робити: збережіть надрукований шлях до архіву, доки не переконаєтеся, що міграція пройшла успішно.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний файл-маркер знімка міграції Matrix і повторно використав цей архів замість створення дубліката резервної копії.
- Що робити: збережіть надрукований шлях до архіву, доки не переконаєтеся, що міграція пройшла успішно.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним Matrix-обліковим записом, оскільки Matrix ще не налаштовано.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але все ще не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть Gateway із робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після того, як кешовані облікові дані стануть доступними.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, який саме іменований Matrix-обліковий запис має його отримати.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з прив’язкою до облікового запису вже містить сховище синхронізації або криптографічне сховище, тому OpenClaw не перезаписав його автоматично.
- Що робити: переконайтеся, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщувати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw спробував перемістити старий стан Matrix, але операція файлової системи завершилася помилкою.
- Що робити: перевірте дозволи файлової системи та стан диска, а потім повторно виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно визначити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть Gateway із робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після того, як кешовані облікові дані стануть доступними.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске застаріле криптографічне сховище, але відмовляється вгадувати, який саме іменований Matrix-обліковий запис має його отримати.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграцію все ще блокує відсутність даних ідентичності або облікових даних.
- Що робити: завершіть вхід у Matrix або налаштування конфігурації, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити допоміжну точку входу з Matrix plugin, яка зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть Matrix plugin (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Шлях до допоміжного файла Matrix plugin є небезпечним: ... Перевстановіть @openclaw/matrix і спробуйте ще раз.`

- Значення: OpenClaw знайшов шлях до допоміжного файла, який виходить за межі кореня plugin або не проходить перевірки меж plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть Matrix plugin із довіреного шляху, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`- Не вдалося створити знімок міграції Matrix перед відновленням: ...`

`- Поки що зміни міграції Matrix пропущено. Усуньте збій створення знімка, а потім повторно виконайте "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, оскільки спочатку не зміг створити знімок для відновлення.
- Що робити: усуньте помилку резервного копіювання, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Не вдалося мігрувати застаріле клієнтське сховище Matrix: ...`

- Значення: клієнтський резервний механізм Matrix знайшов старе плоске сховище, але переміщення завершилося помилкою. Тепер OpenClaw перериває цей резервний механізм замість того, щоб мовчки запускатися з новим порожнім сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан без змін і повторіть спробу після усунення помилки.

`Matrix встановлено з користувацького шляху: ...`

- Значення: Matrix закріплено за інсталяцією з шляху, тому основні оновлення не замінюють її автоматично на стандартний пакет Matrix із репозиторію.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до стандартного Matrix plugin.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: ключі кімнат із резервної копії успішно відновлено до нового криптографічного сховища.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише у старому локальному сховищі й ніколи не були вивантажені до резервної копії Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо тільки ви не зможете відновити ці ключі вручну з іншого верифікованого клієнта.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити ключ відновлення.
- Що робити: виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг перевірити його достатньо безпечно, щоб підготувати відновлення.
- Що робити: повторно виконайте `openclaw doctor --fix`. Якщо це повторюється, не змінюйте старий каталог стану та відновлюйтеся за допомогою іншого верифікованого клієнта Matrix плюс `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключів резервної копії та відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який саме ключ відновлення є правильним, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: ключі з резервної копії все ще можна відновити, але локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий plugin спробував виконати відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, а потім за потреби повторіть спробу за допомогою `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути ключ резервної копії, але на цьому пристрої він не активний.
- Що робити: виконайте `openclaw matrix verify backup restore` або задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої наразі не збережено ключ відновлення.
- Що робити: задайте `MATRIX_RECOVERY_KEY`, виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, а потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Значення: збережений ключ не відповідає активній резервній копії Matrix.
- Що робити: задайте `MATRIX_RECOVERY_KEY` на правильний ключ і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Якщо ви погоджуєтеся втратити стару зашифровану історію, яку неможливо відновити, ви можете натомість скинути
поточну базову лінію резервного копіювання за допомогою `openclaw matrix verify backup reset --yes`. Якщо
збережений секрет резервної копії пошкоджений, це скидання також може заново створити secret storage, щоб
новий ключ резервної копії міг коректно завантажитися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Значення: резервна копія існує, але цей пристрій поки що недостатньо довіряє ланцюжку cross-signing.
- Що робити: задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Потрібен ключ відновлення Matrix`

- Значення: ви спробували виконати крок відновлення, не надавши ключ відновлення, коли він був потрібен.
- Що робити: повторно виконайте команду з `--recovery-key-stdin`, наприклад `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Неприпустимий ключ відновлення Matrix: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним ключем відновлення з вашого клієнта Matrix або файла recovery-key.

`Ключ відновлення Matrix було застосовано, але цьому пристрою все ще бракує повної довіри до ідентичності Matrix.`

- Значення: OpenClaw зміг застосувати ключ відновлення, але Matrix усе ще не
  встановив повну довіру до ідентичності цього пристрою через cross-signing. Перевірте
  у виводі команди `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, прийміть запит в іншому
  клієнті Matrix, порівняйте SAS і введіть `yes` лише якщо він збігається. Команда
  чекає на повну довіру до ідентичності Matrix, перш ніж повідомити про успіх. Використовуйте
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  лише якщо ви свідомо хочете замінити поточну ідентичність cross-signing.

`Резервне копіювання ключів Matrix не активне на цьому пристрої після завантаження з secret storage.`

- Значення: secret storage не створило активний сеанс резервного копіювання на цьому пристрої.
- Що робити: спочатку верифікуйте пристрій, а потім повторно перевірте стан за допомогою `openclaw matrix verify backup status`.

`Криптографічний бекенд Matrix не може завантажити ключі резервної копії з secret storage. Спочатку верифікуйте цей пристрій за допомогою 'openclaw matrix verify device --recovery-key-stdin'.`

- Значення: цей пристрій не може відновлювати дані з secret storage, доки не буде завершено верифікацію пристрою.
- Що робити: спочатку виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Повідомлення про інсталяцію користувацького plugin

`Matrix встановлено з користувацького шляху, який більше не існує: ...`

- Значення: запис про інсталяцію вашого plugin вказує на локальний шлях, якого вже немає.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, або, якщо ви запускаєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повернулася

Виконайте ці перевірки по черзі:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Якщо резервну копію відновлено успішно, але в деяких старих кімнатах усе ще бракує історії, імовірно, ці відсутні ключі попередній plugin ніколи не зберігав у резервній копії.

## Якщо ви хочете почати заново для майбутніх повідомлень

Якщо ви погоджуєтеся втратити стару зашифровану історію, яку неможливо відновити, і хочете надалі лише чисту базову лінію резервного копіювання, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не верифіковано, завершіть верифікацію зі свого клієнта Matrix, порівнявши емодзі SAS або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язане

- [Matrix](/uk/channels/matrix): налаштування каналу та конфігурація.
- [Правила push для Matrix](/uk/channels/matrix-push-rules): маршрутизація сповіщень.
- [Doctor](/uk/gateway/doctor): перевірка стану та автоматичний тригер міграції.
- [Посібник із міграції](/uk/install/migrating): усі шляхи міграції (перенесення машин, імпорт між системами).
- [Plugins](/uk/tools/plugin): інсталяція та реєстрація plugin.
