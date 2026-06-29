---
read_when:
    - Обновление существующей установки Matrix
    - Миграция зашифрованной истории Matrix и состояния устройства
summary: Как OpenClaw обновляет предыдущий Matrix Plugin на месте, включая ограничения восстановления зашифрованного состояния и шаги ручного восстановления.
title: Миграция Matrix
x-i18n:
    generated_at: "2026-06-28T22:35:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Обновитесь с предыдущего публичного Plugin `matrix` до текущей реализации.

Для большинства пользователей обновление выполняется на месте:

- Plugin остается `@openclaw/matrix`
- канал остается `matrix`
- ваша конфигурация остается в `channels.matrix`
- кэшированные учетные данные остаются в `~/.openclaw/credentials/matrix/`
- состояние среды выполнения остается в `~/.openclaw/matrix/`

Вам не нужно переименовывать ключи конфигурации или переустанавливать Plugin под новым именем.
Корневой пакет `openclaw` больше не включает код среды выполнения Matrix или зависимости Matrix SDK. Если `openclaw channels status` показывает, что Matrix настроен, но Plugin отсутствует после обновления, выполните `openclaw doctor --fix` или `openclaw plugins install @openclaw/matrix`; не устанавливайте пакеты Matrix SDK в корневой пакет OpenClaw.

## Что миграция делает автоматически

Когда запускается Gateway и когда вы выполняете [`openclaw doctor --fix`](/ru/gateway/doctor), OpenClaw пытается автоматически исправить старое состояние Matrix.
Перед тем как любой требующий действия шаг миграции Matrix изменит состояние на диске, OpenClaw создает или повторно использует целевой снимок восстановления.

Когда вы используете `openclaw update`, точный триггер зависит от способа установки OpenClaw:

- установки из исходного кода выполняют `openclaw doctor --fix` во время процесса обновления, затем по умолчанию перезапускают Gateway
- установки через менеджер пакетов обновляют пакет, выполняют неинтерактивный проход doctor, затем полагаются на стандартный перезапуск Gateway, чтобы запуск мог завершить миграцию Matrix
- если вы используете `openclaw update --no-restart`, миграция Matrix, выполняемая при запуске, откладывается до тех пор, пока вы позже не выполните `openclaw doctor --fix` и не перезапустите Gateway

Автоматическая миграция охватывает:

- создание или повторное использование снимка перед миграцией в `~/Backups/openclaw-migrations/`
- повторное использование ваших кэшированных учетных данных Matrix
- сохранение того же выбора учетной записи и конфигурации `channels.matrix`
- перемещение самого старого плоского хранилища синхронизации Matrix в текущее расположение, привязанное к учетной записи
- перемещение самого старого плоского криптографического хранилища Matrix в текущее расположение, привязанное к учетной записи, когда целевую учетную запись можно безопасно определить
- извлечение ранее сохраненного ключа расшифрования резервной копии ключей комнат Matrix из старого криптографического хранилища rust, когда этот ключ существует локально
- повторное использование наиболее полного существующего корня хранилища с хешем токена для той же учетной записи Matrix, homeserver и пользователя, когда токен доступа позже изменяется
- сканирование соседних корней хранилища с хешем токена на наличие ожидающих метаданных восстановления зашифрованного состояния, когда токен доступа Matrix изменился, но идентичность учетной записи/устройства осталась прежней
- восстановление резервных копий ключей комнат в новое криптографическое хранилище при следующем запуске Matrix

Подробности о снимках:

- OpenClaw записывает файл-маркер в `~/.openclaw/matrix/migration-snapshot.json` после успешного создания снимка, чтобы последующие проходы запуска и исправления могли повторно использовать тот же архив.
- Эти автоматические снимки миграции Matrix создают резервную копию только конфигурации и состояния (`includeWorkspace: false`).
- Если у Matrix есть только состояние миграции уровня предупреждений, например потому что `userId` или `accessToken` все еще отсутствует, OpenClaw пока не создает снимок, потому что никакое изменение Matrix не является требующим действия.
- Если шаг создания снимка завершается неудачно, OpenClaw пропускает миграцию Matrix для этого запуска вместо изменения состояния без точки восстановления.

Об обновлениях с несколькими учетными записями:

- самое старое плоское хранилище Matrix (`~/.openclaw/matrix/bot-storage.json` и `~/.openclaw/matrix/crypto/`) пришло из схемы с одним хранилищем, поэтому OpenClaw может мигрировать его только в одну определенную целевую учетную запись Matrix
- уже привязанные к учетным записям устаревшие хранилища Matrix обнаруживаются и подготавливаются отдельно для каждой настроенной учетной записи Matrix

## Что миграция не может сделать автоматически

Предыдущий публичный Matrix Plugin **не** создавал резервные копии ключей комнат Matrix автоматически. Он сохранял локальное криптографическое состояние и запрашивал проверку устройства, но не гарантировал, что ваши ключи комнат были сохранены в резервной копии на homeserver.

Это означает, что некоторые зашифрованные установки можно мигрировать только частично.

OpenClaw не может автоматически восстановить:

- локальные ключи комнат, для которых никогда не создавалась резервная копия
- зашифрованное состояние, когда целевую учетную запись Matrix пока нельзя определить, потому что `homeserver`, `userId` или `accessToken` все еще недоступны
- автоматическую миграцию одного общего плоского хранилища Matrix, когда настроено несколько учетных записей Matrix, но `channels.matrix.defaultAccount` не задан
- установки Plugin с пользовательским путем, закрепленные за путем к репозиторию вместо стандартного пакета Matrix
- отсутствующий ключ восстановления, когда в старом хранилище были ключи из резервной копии, но ключ расшифрования не был сохранен локально

Текущая область предупреждений:

- установки Matrix Plugin с пользовательским путем отображаются и при запуске Gateway, и в `openclaw doctor`

Если в вашей старой установке была локальная зашифрованная история, для которой никогда не создавалась резервная копия, некоторые старые зашифрованные сообщения могут остаться недоступными для чтения после обновления.

## Рекомендуемый процесс обновления

1. Обновите OpenClaw и Matrix Plugin обычным способом.
   Предпочитайте простой `openclaw update` без `--no-restart`, чтобы запуск мог сразу завершить миграцию Matrix.
2. Выполните:

   ```bash
   openclaw doctor --fix
   ```

   Если у Matrix есть требующая действия работа по миграции, doctor сначала создаст или повторно использует снимок перед миграцией и выведет путь к архиву.

3. Запустите или перезапустите Gateway.
4. Проверьте текущее состояние проверки и резервного копирования:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Поместите ключ восстановления для учетной записи Matrix, которую вы исправляете, в переменную среды, специфичную для учетной записи. Для одной учетной записи по умолчанию подходит `MATRIX_RECOVERY_KEY`. Для нескольких учетных записей используйте отдельную переменную для каждой учетной записи, например `MATRIX_RECOVERY_KEY_ASSISTANT`, и добавьте `--account assistant` к команде.

6. Если OpenClaw сообщает, что нужен ключ восстановления, выполните команду для соответствующей учетной записи:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Если это устройство все еще не проверено, выполните команду для соответствующей учетной записи:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Если ключ восстановления принят и резервная копия пригодна к использованию, но `Cross-signing verified`
   все еще `no`, завершите самопроверку из другого клиента Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Примите запрос в другом клиенте Matrix, сравните эмодзи или десятичные числа
   и введите `yes` только если они совпадают. Команда успешно завершается только
   после того, как `Cross-signing verified` станет `yes`.

8. Если вы намеренно отказываетесь от невосстановимой старой истории и хотите создать новую базовую резервную копию для будущих сообщений, выполните:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Если серверной резервной копии ключей еще нет, создайте ее для будущих восстановлений:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Как работает миграция шифрования

Миграция шифрования выполняется в два этапа:

1. Запуск или `openclaw doctor --fix` создает или повторно использует снимок перед миграцией, если миграция шифрования требует действия.
2. Запуск или `openclaw doctor --fix` проверяет старое криптографическое хранилище Matrix через активную установку Matrix Plugin.
3. Если найден ключ расшифрования резервной копии, OpenClaw записывает его в новый поток ключа восстановления и помечает восстановление ключей комнат как ожидающее.
4. При следующем запуске Matrix OpenClaw автоматически восстанавливает резервные копии ключей комнат в новое криптографическое хранилище.

Если старое хранилище сообщает о ключах комнат, для которых никогда не создавалась резервная копия, OpenClaw выдает предупреждение вместо того, чтобы делать вид, что восстановление успешно.

## Частые сообщения и что они означают

### Сообщения обновления и обнаружения

`Matrix plugin upgraded in place.`

- Значение: старое состояние Matrix на диске было обнаружено и мигрировано в текущую структуру.
- Что делать: ничего, если тот же вывод не содержит предупреждений.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значение: OpenClaw создал архив восстановления перед изменением состояния Matrix.
- Что делать: сохраните выведенный путь к архиву, пока не подтвердите, что миграция прошла успешно.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значение: OpenClaw нашел существующий маркер снимка миграции Matrix и повторно использовал этот архив вместо создания дублирующей резервной копии.
- Что делать: сохраните выведенный путь к архиву, пока не подтвердите, что миграция прошла успешно.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значение: старое состояние Matrix существует, но OpenClaw не может сопоставить его с текущей учетной записью Matrix, потому что Matrix не настроен.
- Что делать: настройте `channels.matrix`, затем повторно выполните `openclaw doctor --fix` или перезапустите Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значение: OpenClaw нашел старое состояние, но все еще не может определить точный текущий корень учетной записи/устройства.
- Что делать: один раз запустите Gateway с рабочим входом Matrix или повторно выполните `openclaw doctor --fix` после появления кэшированных учетных данных.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значение: OpenClaw нашел одно общее плоское хранилище Matrix, но отказывается угадывать, какая именованная учетная запись Matrix должна его получить.
- Что делать: задайте `channels.matrix.defaultAccount` как нужную учетную запись, затем повторно выполните `openclaw doctor --fix` или перезапустите Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значение: новое расположение, привязанное к учетной записи, уже содержит хранилище синхронизации или криптографическое хранилище, поэтому OpenClaw не перезаписал его автоматически.
- Что делать: убедитесь, что текущая учетная запись правильная, прежде чем вручную удалять или перемещать конфликтующую цель.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Значение: OpenClaw попытался переместить старое состояние Matrix, но операция файловой системы завершилась неудачно.
- Что делать: проверьте права файловой системы и состояние диска, затем повторно выполните `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значение: OpenClaw нашел старое зашифрованное хранилище Matrix, но нет текущей конфигурации Matrix, к которой его можно привязать.
- Что делать: настройте `channels.matrix`, затем повторно выполните `openclaw doctor --fix` или перезапустите Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значение: зашифрованное хранилище существует, но OpenClaw не может безопасно решить, какой текущей учетной записи/устройству оно принадлежит.
- Что делать: один раз запустите Gateway с рабочим входом Matrix или повторно выполните `openclaw doctor --fix` после появления кэшированных учетных данных.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значение: OpenClaw нашел одно общее плоское устаревшее криптографическое хранилище, но отказывается угадывать, какая именованная учетная запись Matrix должна его получить.
- Что делать: задайте `channels.matrix.defaultAccount` как нужную учетную запись, затем повторно выполните `openclaw doctor --fix` или перезапустите Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значение: OpenClaw обнаружил старое состояние Matrix, но миграция все еще заблокирована из-за отсутствующих данных идентичности или учетных данных.
- Что делать: завершите вход в Matrix или настройку конфигурации, затем повторно выполните `openclaw doctor --fix` или перезапустите Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значение: OpenClaw нашел старое зашифрованное состояние Matrix, но не смог загрузить вспомогательную точку входа из Matrix plugin, которая обычно проверяет это хранилище.
- Что делать: переустановите или восстановите Matrix plugin (`openclaw plugins install @openclaw/matrix` или `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозитория), затем повторно запустите `openclaw doctor --fix` или перезапустите gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значение: OpenClaw нашел путь к вспомогательному файлу, который выходит за пределы корня plugin или не проходит проверки границ plugin, поэтому отказался импортировать его.
- Что делать: переустановите Matrix plugin из доверенного пути, затем повторно запустите `openclaw doctor --fix` или перезапустите gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значение: OpenClaw отказался изменять состояние Matrix, потому что сначала не смог создать снимок для восстановления.
- Что делать: устраните ошибку резервного копирования, затем повторно запустите `openclaw doctor --fix` или перезапустите gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значение: клиентский fallback Matrix обнаружил старое плоское хранилище, но перенос завершился ошибкой. Теперь OpenClaw прерывает этот fallback вместо того, чтобы молча запускаться с новым хранилищем.
- Что делать: проверьте права доступа файловой системы или конфликты, сохраните старое состояние нетронутым и повторите попытку после исправления ошибки.

`Matrix is installed from a custom path: ...`

- Значение: Matrix закреплен за установкой из пути, поэтому обновления основной ветки не заменяют его автоматически стандартным пакетом Matrix из репозитория.
- Что делать: переустановите через `openclaw plugins install @openclaw/matrix`, когда захотите вернуться к стандартному Matrix plugin.

### Сообщения восстановления зашифрованного состояния

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значение: резервные копии ключей комнат успешно восстановлены в новое криптохранилище.
- Что делать: обычно ничего.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значение: некоторые старые ключи комнат существовали только в старом локальном хранилище и никогда не загружались в резервную копию Matrix.
- Что делать: ожидайте, что часть старой зашифрованной истории останется недоступной, если вы не сможете вручную восстановить эти ключи из другого проверенного клиента.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Значение: резервная копия существует, но OpenClaw не смог автоматически восстановить ключ восстановления.
- Что делать: выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значение: OpenClaw нашел старое зашифрованное хранилище, но не смог проверить его достаточно безопасно, чтобы подготовить восстановление.
- Что делать: повторно запустите `openclaw doctor --fix`. Если проблема повторяется, сохраните старый каталог состояния нетронутым и восстановите данные через другой проверенный клиент Matrix плюс `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значение: OpenClaw обнаружил конфликт ключа резервной копии и отказался автоматически перезаписывать текущий файл recovery-key.
- Что делать: проверьте, какой ключ восстановления правильный, прежде чем повторять любую команду восстановления.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значение: это жесткое ограничение старого формата хранилища.
- Что делать: ключи из резервной копии все еще можно восстановить, но локальная зашифрованная история может остаться недоступной.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значение: новый plugin попытался выполнить восстановление, но Matrix вернул ошибку.
- Что делать: выполните `openclaw matrix verify backup status`, затем при необходимости повторите с `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Сообщения ручного восстановления

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значение: OpenClaw знает, что у вас должен быть ключ резервной копии, но он не активен на этом устройстве.
- Что делать: выполните `openclaw matrix verify backup restore` или задайте `MATRIX_RECOVERY_KEY` и при необходимости выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Значение: на этом устройстве сейчас не сохранен ключ восстановления.
- Что делать: задайте `MATRIX_RECOVERY_KEY`, выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, затем восстановите резервную копию.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Значение: сохраненный ключ не совпадает с активной резервной копией Matrix.
- Что делать: задайте `MATRIX_RECOVERY_KEY` правильным ключом и выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Если вы готовы потерять невосстановимую старую зашифрованную историю, вместо этого можно сбросить
текущую базовую линию резервной копии командой `openclaw matrix verify backup reset --yes`. Если
сохраненный секрет резервной копии поврежден, этот сброс также может пересоздать секретное хранилище, чтобы
новый ключ резервной копии корректно загрузился после перезапуска.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Значение: резервная копия существует, но это устройство пока недостаточно доверяет цепочке cross-signing.
- Что делать: задайте `MATRIX_RECOVERY_KEY` и выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Значение: вы попытались выполнить шаг восстановления без ключа восстановления, хотя он был обязателен.
- Что делать: повторно запустите команду с `--recovery-key-stdin`, например `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Значение: предоставленный ключ не удалось разобрать или он не соответствует ожидаемому формату.
- Что делать: повторите попытку с точным ключом восстановления из вашего клиента Matrix или файла recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значение: OpenClaw смог применить ключ восстановления, но Matrix все еще не
  установил полное доверие к личности cross-signing для этого устройства. Проверьте
  вывод команды на наличие `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` и `Device verified by owner`.
- Что делать: выполните `openclaw matrix verify self`, примите запрос в другом
  клиенте Matrix, сравните SAS и введите `yes` только если он совпадает. Команда
  ждет полного доверия к личности Matrix перед сообщением об успехе. Используйте
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  только если вы намеренно хотите заменить текущую личность cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значение: секретное хранилище не создало активный сеанс резервной копии на этом устройстве.
- Что делать: сначала проверьте устройство, затем перепроверьте с `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Значение: это устройство не может восстановиться из секретного хранилища, пока проверка устройства не завершена.
- Что делать: сначала выполните `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Сообщения установки пользовательского plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значение: запись установки вашего plugin указывает на локальный путь, которого больше нет.
- Что делать: переустановите через `openclaw plugins install @openclaw/matrix` или, если вы запускаете из checkout репозитория, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Если зашифрованная история все еще не возвращается

Выполните эти проверки по порядку:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Если резервная копия успешно восстановлена, но в некоторых старых комнатах все еще отсутствует история, вероятно, эти отсутствующие ключи никогда не были зарезервированы предыдущим plugin.

## Если вы хотите начать заново для будущих сообщений

Если вы готовы потерять невосстановимую старую зашифрованную историю и хотите только чистую базовую линию резервного копирования на будущее, выполните эти команды по порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Если после этого устройство все еще не проверено, завершите проверку из вашего клиента Matrix, сравнив emoji SAS или десятичные коды и подтвердив, что они совпадают.

## Связанное

- [Matrix](/ru/channels/matrix): настройка канала и конфигурация.
- [Правила push Matrix](/ru/channels/matrix-push-rules): маршрутизация уведомлений.
- [Doctor](/ru/gateway/doctor): проверка работоспособности и автоматический запуск миграции.
- [Руководство по миграции](/ru/install/migrating): все пути миграции (переносы между машинами, импорты между системами).
- [Plugins](/ru/tools/plugin): установка и регистрация plugin.
