---
read_when:
    - Оновлення наявного встановлення Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw виконує оновлення попереднього Plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-23T20:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

На цій сторінці описано оновлення з попереднього публічного Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення відбувається на місці:

- Plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- runtime state залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати Plugin під новою назвою.

## Що міграція робить автоматично

Коли gateway запускається, а також коли ви виконуєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перш ніж будь-який дієвий крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий recovery snapshot.

Коли ви використовуєте `openclaw update`, точний тригер залежить від способу встановлення OpenClaw:

- встановлення з source запускають `openclaw doctor --fix` під час процесу оновлення, а потім типово перезапускають gateway
- встановлення через package manager оновлюють пакет, запускають неінтерактивний прохід doctor, а потім покладаються на типовий перезапуск gateway, щоб startup міг завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, прив’язана до startup, відкладається, доки ви пізніше не виконаєте `openclaw doctor --fix` і не перезапустите gateway

Автоматична міграція охоплює:

- створення або повторне використання pre-migration snapshot у `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису й конфігурації `channels.matrix`
- переміщення найстарішого плоского Matrix sync store у поточне розташування з областю облікового запису
- переміщення найстарішого плоского Matrix crypto store у поточне розташування з областю облікового запису, коли цільовий обліковий запис можна безпечно розв’язати
- витягування раніше збереженого backup decryption key для Matrix room-key зі старого rust crypto store, якщо цей ключ локально існує
- повторне використання найповнішого наявного token-hash storage root для того самого облікового запису Matrix, homeserver і користувача, коли access token пізніше змінюється
- сканування сусідніх token-hash storage root на наявність pending metadata для відновлення зашифрованого стану, коли access token Matrix змінився, але ідентичність account/device залишилася тією самою
- відновлення резервних room keys у новий crypto store під час наступного startup Matrix

Подробиці snapshot:

- OpenClaw записує marker file у `~/.openclaw/matrix/migration-snapshot.json` після успішного snapshot, щоб наступні проходи startup і repair могли повторно використати той самий archive.
- Ці автоматичні snapshot міграції Matrix резервують лише config + state (`includeWorkspace: false`).
- Якщо Matrix має лише стан міграції рівня warning, наприклад тому, що `userId` або `accessToken` іще відсутні, OpenClaw поки не створює snapshot, оскільки жодна зміна Matrix ще не є дієвою.
- Якщо крок snapshot не вдається, OpenClaw пропускає міграцію Matrix у цьому запуску замість того, щоб змінювати state без recovery point.

Про оновлення з кількома обліковими записами:

- найстаріший плоский Matrix store (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить зі схеми з одним store, тому OpenClaw може мігрувати його лише в одну розв’язану ціль Matrix account
- уже account-scoped legacy Matrix stores виявляються й готуються для кожного налаштованого Matrix account окремо

## Що міграція не може зробити автоматично

Попередній публічний Plugin Matrix **не** створював автоматично Matrix room-key backups. Він зберігав локальний crypto state і запитував verification device, але не гарантував, що ваші room keys були збережені на homeserver.

Це означає, що деякі зашифровані встановлення можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- лише локальні room keys, які ніколи не були збережені в backup
- зашифрований state, коли цільовий Matrix account ще не можна розв’язати, бо `homeserver`, `userId` або `accessToken` іще недоступні
- автоматичну міграцію одного спільного плоского Matrix store, коли налаштовано кілька Matrix accounts, але `channels.matrix.defaultAccount` не задано
- встановлення custom plugin path, які прив’язані до шляху репозиторію замість стандартного пакета Matrix
- відсутній recovery key, коли старий store мав room keys у backup, але не зберіг decryption key локально

Поточна область попереджень:

- встановлення custom Matrix plugin path показуються і під час startup gateway, і в `openclaw doctor`

Якщо ваше старе встановлення мало лише локальну зашифровану історію, яку ніколи не було збережено в backup, деякі старіші зашифровані повідомлення після оновлення можуть залишитися нечитабельними.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Plugin Matrix у звичайний спосіб.
   Віддавайте перевагу звичайному `openclaw update` без `--no-restart`, щоб startup міг одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо для Matrix є дієва робота з міграції, doctor спочатку створить або повторно використає pre-migration snapshot і виведе шлях до archive.

3. Запустіть або перезапустіть gateway.
4. Перевірте поточний стан verification і backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Якщо OpenClaw повідомляє, що потрібен recovery key, виконайте:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Якщо цей пристрій іще не verified, виконайте:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Якщо ви свідомо відмовляєтеся від невідновлюваної старої історії й хочете створити свіжу базову лінію backup для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Якщо серверного key backup іще не існує, створіть його для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція шифрування

Міграція шифрування — це двоетапний процес:

1. Startup або `openclaw doctor --fix` створює або повторно використовує pre-migration snapshot, якщо міграція шифрування є дієвою.
2. Startup або `openclaw doctor --fix` перевіряє старий Matrix crypto store через активне встановлення Plugin Matrix.
3. Якщо знайдено backup decryption key, OpenClaw записує його в новий процес recovery-key і позначає відновлення room-key як pending.
4. Під час наступного startup Matrix OpenClaw автоматично відновлює room keys з backup у новий crypto store.

Якщо старий store повідомляє про room keys, які ніколи не були збережені в backup, OpenClaw попереджає про це замість того, щоб удавати, ніби відновлення було успішним.

## Поширені повідомлення та їх значення

### Повідомлення оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий Matrix state на диску було виявлено й мігровано в поточну схему.
- Що робити: нічого, якщо тільки той самий вивід не містить також попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив recovery archive перед зміною Matrix state.
- Що робити: збережіть надрукований шлях до archive, доки не підтвердите, що міграція пройшла успішно.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний marker snapshot міграції Matrix і повторно використав цей archive замість створення дубльованого backup.
- Що робити: збережіть надрукований шлях до archive, доки не підтвердите, що міграція пройшла успішно.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий Matrix state існує, але OpenClaw не може зіставити його з поточним Matrix account, бо Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий state, але все ще не може визначити точний поточний root account/device.
- Що робити: один раз запустіть gateway з робочим входом Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов один спільний плоский Matrix store, але відмовляється вгадувати, який саме іменований Matrix account має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` для потрібного облікового запису, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з областю облікового запису вже має sync або crypto store, тому OpenClaw не став автоматично його перезаписувати.
- Що робити: переконайтеся, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw спробував перемістити старий Matrix state, але операція файлової системи не вдалася.
- Що робити: перевірте дозволи файлової системи й стан диска, а потім повторно виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старий зашифрований Matrix store, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифрований store існує, але OpenClaw не може безпечно визначити, якому поточному account/device він належить.
- Що робити: один раз запустіть gateway з робочим входом Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов один спільний плоский legacy crypto store, але відмовляється вгадувати, який саме іменований Matrix account має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` для потрібного облікового запису, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий Matrix state, але міграцію все ще блокує відсутність ідентифікаційних або credential data.
- Що робити: завершіть login Matrix або налаштування конфігурації, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований Matrix state, але не зміг завантажити helper entrypoint із Plugin Matrix, який зазвичай перевіряє цей store.
- Що робити: перевстановіть або відновіть Plugin Matrix (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до helper file, який виходить за межі root Plugin або не проходить перевірки меж Plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть Plugin Matrix із довіреного шляху, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати Matrix state, бо спочатку не зміг створити recovery snapshot.
- Що робити: усуньте помилку backup, а потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: fallback на стороні клієнта Matrix знайшов старий плоский storage, але переміщення не вдалося. Тепер OpenClaw перериває цей fallback замість того, щоб мовчки запускатися з новим порожнім store.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий state недоторканим і повторіть спробу після усунення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix прив’язаний до встановлення за шляхом, тому основні оновлення не замінюють його автоматично стандартним пакетом Matrix із репозиторію.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до типового Plugin Matrix.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: room keys із backup було успішно відновлено в новий crypto store.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі room keys існували лише в старому локальному store і ніколи не були вивантажені в Matrix backup.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете вручну відновити ці keys з іншого verified client.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Значення: backup існує, але OpenClaw не зміг автоматично відновити recovery key.
- Що робити: виконайте `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старий зашифрований store, але не зміг достатньо безпечно його перевірити, щоб підготувати відновлення.
- Що робити: повторно виконайте `openclaw doctor --fix`. Якщо це повторюється, збережіть старий каталог state недоторканим і відновлюйте за допомогою іншого verified Matrix client плюс `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт backup key і відмовився автоматично перезаписувати поточний файл recovery key.
- Що робити: перевірте, який recovery key правильний, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату зберігання.
- Що робити: keys із backup усе ще можна відновити, але локальна зашифрована історія без backup може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий Plugin спробував відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, а потім за потреби повторіть спробу через `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути backup key, але він не активний на цьому пристрої.
- Що робити: виконайте `openclaw matrix verify backup restore` або передайте `--recovery-key`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої зараз не збережено recovery key.
- Що робити: спочатку виконайте verification пристрою за допомогою recovery key, а потім відновіть backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Значення: збережений key не відповідає активному Matrix backup.
- Що робити: повторно виконайте `openclaw matrix verify device "<your-recovery-key>"` з правильним key.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, ви можете
замість цього скинути поточну базову лінію backup через `openclaw matrix verify backup reset --yes`. Коли
збережений backup secret пошкоджений, це скидання також може перевідтворити secret storage, щоб
новий backup key міг коректно завантажитися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Значення: backup існує, але цей пристрій поки недостатньо довіряє cross-signing chain.
- Що робити: повторно виконайте `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Значення: ви спробували крок відновлення, не передавши recovery key там, де він був потрібен.
- Що робити: повторіть команду з вашим recovery key.

`Invalid Matrix recovery key: ...`

- Значення: наданий key не вдалося розібрати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним recovery key із вашого Matrix client або файлу recovery key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Значення: key було застосовано, але пристрій усе ще не зміг завершити verification.
- Що робити: переконайтеся, що ви використали правильний key і що для облікового запису доступний cross-signing, а потім повторіть спробу.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створив активну backup session на цьому пристрої.
- Що робити: спочатку виконайте verification пристрою, а потім ще раз перевірте через `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Значення: цей пристрій не може відновлюватися з secret storage, доки не завершено verification device.
- Що робити: спочатку виконайте `openclaw matrix verify device "<your-recovery-key>"`.

### Повідомлення про встановлення custom Plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: запис встановлення Plugin вказує на локальний шлях, якого більше немає.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, або якщо ви працюєте з checkout репозиторію — `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки по черзі:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Якщо backup відновлюється успішно, але в деяких старих rooms історія все ще відсутня, імовірно, ці відсутні keys ніколи не були збережені в backup попереднім Plugin.

## Якщо ви хочете почати з чистого аркуша для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й хочете лише чисту базову лінію backup надалі, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не verified, завершіть verification у своєму Matrix client, порівнявши SAS emoji або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язані сторінки

- [Matrix](/uk/channels/matrix)
- [Doctor](/uk/gateway/doctor)
- [Migrating](/uk/install/migrating)
- [Plugins](/uk/tools/plugin)
