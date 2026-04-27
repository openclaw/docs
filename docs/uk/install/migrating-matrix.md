---
read_when:
    - Оновлення наявного встановлення Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній Plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-27T06:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf7ed5dd886f2e2ba292fbd06b8f5967f8952ec3b1007c466f57e6479044cb30
    source_path: install/migrating-matrix.md
    workflow: 15
---

Оновлення з попереднього публічного Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення виконується на місці:

- plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан середовища виконання залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати plugin під новою назвою.

## Що міграція робить автоматично

Коли gateway запускається і коли ви виконуєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перш ніж будь-який придатний до виконання крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий знімок для відновлення.

Коли ви використовуєте `openclaw update`, точний тригер залежить від того, як установлено OpenClaw:

- встановлення з джерел запускають `openclaw doctor --fix` під час процесу оновлення, а потім типово перезапускають gateway
- встановлення через менеджер пакунків оновлюють пакунок, запускають неінтерактивний прохід doctor, а потім покладаються на типовий перезапуск gateway, щоб запуск міг завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, що виконується під час запуску, відкладається, доки ви пізніше не запустите `openclaw doctor --fix` і не перезапустите gateway

Автоматична міграція охоплює:

- створення або повторне використання передміграційного знімка в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису й конфігурації `channels.matrix`
- переміщення найстарішого плоского сховища синхронізації Matrix до поточного розташування з областю дії облікового запису
- переміщення найстарішого плоского криптосховища Matrix до поточного розташування з областю дії облікового запису, коли цільовий обліковий запис можна безпечно визначити
- витягування раніше збереженого ключа дешифрування резервної копії ключів кімнат Matrix зі старого rust crypto store, якщо цей ключ існує локально
- повторне використання найповнішого наявного кореня сховища token-hash для того самого облікового запису Matrix, homeserver і користувача, коли пізніше змінюється access token
- сканування сусідніх коренів сховища token-hash на наявність метаданих очікуваного відновлення зашифрованого стану, коли access token Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних ключів кімнат у нове криптосховище під час наступного запуску Matrix

Відомості про знімок:

- OpenClaw записує файл-маркер у `~/.openclaw/matrix/migration-snapshot.json` після успішного створення знімка, щоб пізніші проходи запуску й відновлення могли повторно використовувати той самий архів.
- Ці автоматичні знімки міграції Matrix створюють резервні копії лише конфігурації та стану (`includeWorkspace: false`).
- Якщо Matrix має лише стан міграції з попередженнями, наприклад через те, що `userId` або `accessToken` усе ще відсутні, OpenClaw поки не створює знімок, оскільки жодна зміна Matrix ще не є придатною до виконання.
- Якщо крок створення знімка завершується помилкою, OpenClaw пропускає міграцію Matrix для цього запуску замість зміни стану без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить зі схеми з одним сховищем, тому OpenClaw може мігрувати його лише в одну визначену ціль облікового запису Matrix
- застарілі сховища Matrix, уже обмежені обліковим записом, виявляються й готуються окремо для кожного налаштованого облікового запису Matrix

## Що міграція не може зробити автоматично

Попередній публічний Plugin Matrix **не** створював автоматично резервні копії ключів кімнат Matrix. Він зберігав локальний криптографічний стан і запитував верифікацію пристрою, але не гарантував, що ваші ключі кімнат були збережені на homeserver.

Це означає, що деякі зашифровані встановлення можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- суто локальні ключі кімнат, які ніколи не були збережені в резервній копії
- зашифрований стан, коли цільовий обліковий запис Matrix ще не можна визначити, бо `homeserver`, `userId` або `accessToken` ще недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, коли налаштовано кілька облікових записів Matrix, але `channels.matrix.defaultAccount` не встановлено
- встановлення з кастомним шляхом до plugin, які закріплені за шляхом до репозиторію замість стандартного пакунка Matrix
- відсутній recovery key, коли старе сховище мало резервні ключі, але не зберегло ключ дешифрування локально

Поточний обсяг попереджень:

- встановлення Matrix plugin з кастомним шляхом відображаються і під час запуску gateway, і в `openclaw doctor`

Якщо у вашому старому встановленні була локальна зашифрована історія, яка ніколи не була збережена в резервній копії, деякі старіші зашифровані повідомлення можуть залишитися непридатними для читання після оновлення.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Matrix plugin звичайним способом.
   Краще використовувати звичайний `openclaw update` без `--no-restart`, щоб запуск міг одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо для Matrix є придатна до виконання робота з міграції, doctor спочатку створить або повторно використає передміграційний знімок і виведе шлях до архіву.

3. Запустіть або перезапустіть gateway.
4. Перевірте поточний стан верифікації та резервного копіювання:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Помістіть recovery key для облікового запису Matrix, який ви відновлюєте, у змінну середовища, специфічну для облікового запису. Для одного типового облікового запису підійде `MATRIX_RECOVERY_KEY`. Для кількох облікових записів використовуйте одну змінну на кожен обліковий запис, наприклад `MATRIX_RECOVERY_KEY_ASSISTANT`, і додавайте `--account assistant` до команди.

6. Якщо OpenClaw повідомляє, що потрібен recovery key, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Якщо цей пристрій усе ще не верифіковано, виконайте команду для відповідного облікового запису:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Якщо recovery key прийнято й резервна копія придатна до використання, але `Cross-signing verified`
   усе ще має значення `no`, завершіть самоверифікацію з іншого клієнта Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Прийміть запит в іншому клієнті Matrix, порівняйте emoji або десяткові числа
   й введіть `yes` лише якщо вони збігаються. Команда завершується успішно лише
   після того, як `Cross-signing verified` набуде значення `yes`.

8. Якщо ви навмисно відмовляєтеся від невідновлюваної старої історії й хочете нову базову лінію резервного копіювання для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Якщо резервної копії ключів на сервері ще не існує, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція шифрування

Міграція шифрування — це двоетапний процес:

1. Під час запуску або `openclaw doctor --fix` створюється або повторно використовується передміграційний знімок, якщо міграція шифрування придатна до виконання.
2. Під час запуску або `openclaw doctor --fix` OpenClaw перевіряє старе криптосховище Matrix через активне встановлення Matrix plugin.
3. Якщо знайдено ключ дешифрування резервної копії, OpenClaw записує його в новий потік recovery key і позначає відновлення ключів кімнат як очікуване.
4. Під час наступного запуску Matrix OpenClaw автоматично відновлює резервні ключі кімнат у нове криптосховище.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw показує попередження замість того, щоб удавати успішне відновлення.

## Типові повідомлення та їх значення

### Повідомлення оновлення й виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску виявлено й мігровано до поточної схеми.
- Що робити: нічого, якщо той самий вивід також не містить попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив архів відновлення перед зміною стану Matrix.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція успішна.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний маркер знімка міграції Matrix і повторно використав цей архів замість створення дубльованої резервної копії.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція успішна.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним обліковим записом Matrix, оскільки Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але все ще не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть gateway із робочим входом Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з областю дії облікового запису вже має сховище синхронізації або криптосховище, тому OpenClaw не перезаписав його автоматично.
- Що робити: переконайтеся, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщувати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` або `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw намагався перемістити старий стан Matrix, але операція файлової системи завершилася помилкою.
- Що робити: перевірте дозволи файлової системи й стан диска, а потім повторно виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно вирішити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть gateway із робочим входом Matrix або повторно виконайте `openclaw doctor --fix` після того, як кешовані облікові дані стануть доступними.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске застаріле криптосховище, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграція все ще заблокована через відсутні дані ідентичності або облікових даних.
- Що робити: завершіть вхід Matrix або налаштування конфігурації, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити helper entrypoint із Matrix plugin, який зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть Matrix plugin (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до helper-файлу, який виходить за межі кореня plugin або не проходить перевірки меж plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть Matrix plugin із довіреного шляху, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, оскільки спочатку не зміг створити знімок відновлення.
- Що робити: усуньте помилку резервного копіювання, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: клієнтський резервний механізм Matrix знайшов старе плоске сховище, але переміщення завершилося помилкою. Тепер OpenClaw перериває цей резервний шлях замість того, щоб тихо запускатися з новим сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан недоторканим і повторіть спробу після усунення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix закріплено за встановленням із шляху, тому оновлення основної гілки не замінюють його автоматично стандартним пакунком Matrix із репозиторію.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до типового Matrix plugin.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: резервні ключі кімнат успішно відновлено в нове криптосховище.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише в старому локальному сховищі й ніколи не були вивантажені до резервної копії Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете відновити ці ключі вручну з іншого верифікованого клієнта.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити recovery key.
- Що робити: виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг перевірити його достатньо безпечно, щоб підготувати відновлення.
- Що робити: повторно виконайте `openclaw doctor --fix`. Якщо це повторюється, збережіть каталог старого стану недоторканим і відновлюйтеся за допомогою іншого верифікованого клієнта Matrix плюс `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключів резервної копії й відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який recovery key є правильним, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: резервні ключі все ще можна відновити, але суто локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий plugin спробував виконати відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, а потім за потреби повторіть спробу через `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути backup key, але він не активний на цьому пристрої.
- Що робити: виконайте `openclaw matrix verify backup restore` або задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої зараз не збережено recovery key.
- Що робити: задайте `MATRIX_RECOVERY_KEY`, виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, а потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Значення: збережений ключ не збігається з активною резервною копією Matrix.
- Що робити: задайте `MATRIX_RECOVERY_KEY` на правильний ключ і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, натомість можете скинути
поточну базову лінію резервного копіювання за допомогою `openclaw matrix verify backup reset --yes`. Коли
збережений секрет резервної копії пошкоджено, це скидання також може пересоздати secret storage, щоб
новий backup key міг коректно завантажитися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Значення: резервна копія існує, але цей пристрій ще не має достатньо сильного ланцюга довіри cross-signing.
- Що робити: задайте `MATRIX_RECOVERY_KEY` і виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Значення: ви спробували виконати крок відновлення, не надавши recovery key, коли він був потрібен.
- Що робити: повторно виконайте команду з `--recovery-key-stdin`, наприклад `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розпізнати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним recovery key із вашого клієнта Matrix або файла recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значення: OpenClaw зміг застосувати recovery key, але Matrix усе ще не
  встановив повну довіру до ідентичності cross-signing для цього пристрою. Перевірте
  у виводі команди значення `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, прийміть запит в іншому
  клієнті Matrix, порівняйте SAS і введіть `yes` лише якщо він збігається. Команда
  чекає на повну довіру до ідентичності Matrix, перш ніж повідомити про успіх. Використовуйте
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  лише тоді, коли ви навмисно хочете замінити поточну ідентичність cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створило активну сесію резервного копіювання на цьому пристрої.
- Що робити: спочатку верифікуйте пристрій, а потім повторно перевірте через `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Значення: цей пристрій не може відновлюватися із secret storage, доки не завершено верифікацію пристрою.
- Що робити: спочатку виконайте `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Повідомлення про встановлення кастомного plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: запис про встановлення plugin вказує на локальний шлях, якого більше немає.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix` або, якщо ви працюєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки по черзі:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Якщо резервна копія успішно відновлюється, але в деяких старих кімнатах історія все одно відсутня, ці відсутні ключі, імовірно, ніколи не зберігалися в резервній копії попереднім plugin.

## Якщо ви хочете почати з чистого аркуша для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й хочете лише чисту базову лінію резервного копіювання надалі, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не верифіковано, завершіть верифікацію у вашому клієнті Matrix, порівнявши SAS emoji або десяткові коди й підтвердивши, що вони збігаються.

## Пов’язані сторінки

- [Matrix](/uk/channels/matrix)
- [Doctor](/uk/gateway/doctor)
- [Міграція](/uk/install/migrating)
- [Plugins](/uk/tools/plugin)
