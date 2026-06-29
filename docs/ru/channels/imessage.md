---
read_when:
    - Настройка поддержки iMessage
    - Отладка отправки и получения iMessage
summary: Нативная поддержка iMessage через imsg (JSON-RPC поверх stdio), с действиями private API для ответов, tapbacks, эффектов, вложений и управления группами. Предпочтительно для новых настроек OpenClaw iMessage, когда требования к хосту подходят.
title: iMessage
x-i18n:
    generated_at: "2026-06-28T22:34:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для развертываний OpenClaw iMessage используйте `imsg` на хосте macOS Messages, где выполнен вход в учетную запись. Если ваш Gateway работает на Linux или Windows, укажите в `channels.imessage.cliPath` SSH-обертку, которая запускает `imsg` на Mac.

**Входящее восстановление выполняется автоматически.** После перезапуска моста или Gateway iMessage повторно воспроизводит сообщения, пропущенные во время простоя, и подавляет устаревшую «backlog bomb», которую Apple может сбросить после восстановления Push, выполняя дедупликацию, чтобы ничего не было отправлено дважды. Включать это в конфигурации не нужно — см. [Входящее восстановление после перезапуска моста или Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Поддержка BlueBubbles удалена. Перенесите конфигурации `channels.bluebubbles` в `channels.imessage`; OpenClaw поддерживает iMessage только через `imsg`. Начните с [Удаление BlueBubbles и путь imsg для iMessage](/ru/announcements/bluebubbles-imessage) для краткого объявления или [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) для полной таблицы миграции.
</Warning>

Статус: нативная интеграция с внешним CLI. Gateway запускает `imsg rpc` и взаимодействует через JSON-RPC по stdio (без отдельного демона/порта). Расширенные действия требуют `imsg launch` и успешной проверки private API.

<CardGroup cols={3}>
  <Card title="Действия private API" icon="wand-sparkles" href="#private-api-actions">
    Ответы, tapback-реакции, эффекты, вложения и управление группами.
  </Card>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Личные сообщения iMessage по умолчанию используют режим сопряжения.
  </Card>
  <Card title="Удаленный Mac" icon="terminal" href="#remote-mac-over-ssh">
    Используйте SSH-обертку, когда Gateway не запущен на Mac с Messages.
  </Card>
  <Card title="Справочник по конфигурации" icon="settings" href="/ru/gateway/config-channels#imessage">
    Полный справочник по полям iMessage.
  </Card>
</CardGroup>

## Быстрая настройка

<Tabs>
  <Tab title="Локальный Mac (быстрый путь)">
    <Steps>
      <Step title="Установите и проверьте imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Настройте OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Запустите gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Одобрите первое сопряжение личного сообщения (dmPolicy по умолчанию)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запросы сопряжения истекают через 1 час.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Удаленный Mac через SSH">
    OpenClaw требуется только совместимый со stdio `cliPath`, поэтому можно указать в `cliPath` скрипт-обертку, который подключается по SSH к удаленному Mac и запускает `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендуемая конфигурация, когда вложения включены:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Если `remoteHost` не задан, OpenClaw пытается автоматически определить его, разбирая SSH-скрипт-обертку.
    `remoteHost` должен быть `host` или `user@host` (без пробелов и SSH-опций).
    OpenClaw использует строгую проверку ключей хоста для SCP, поэтому ключ хоста ретрансляции уже должен существовать в `~/.ssh/known_hosts`.
    Пути вложений проверяются относительно разрешенных корней (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Любая обертка `cliPath` или SSH-прокси, который вы ставите перед `imsg`, ДОЛЖНЫ вести себя как прозрачный stdio-канал для долгоживущего JSON-RPC. OpenClaw обменивается небольшими JSON-RPC-сообщениями, разделенными переводами строк, через stdin/stdout обертки на протяжении всего срока жизни канала:

- Пересылайте каждый фрагмент/строку stdin **сразу, как только доступны байты** — не ждите EOF.
- Оперативно пересылайте каждый фрагмент/строку stdout в обратном направлении.
- Сохраняйте переводы строк.
- Избегайте блокирующих чтений фиксированного размера (`read(4096)`, `cat | buffer`, стандартный shell `read`), которые могут задерживать небольшие фреймы.
- Держите stderr отдельно от потока JSON-RPC в stdout.

Обертка, которая буферизует stdin до заполнения большого блока, приведет к симптомам, похожим на сбой iMessage — `imsg rpc timeout (chats.list)` или повторные перезапуски канала, — хотя сам `imsg rpc` исправен. `ssh -T host imsg "$@"` (выше) безопасен, потому что он пересылает аргументы `cliPath` OpenClaw, такие как `rpc` и `--db`. Конвейеры вроде `ssh host imsg | grep -v '^DEBUG'` НЕ безопасны — инструменты с построчной буферизацией все равно могут удерживать фреймы; используйте `stdbuf -oL -eL` на каждом этапе, если фильтрация необходима.
</Warning>

  </Tab>
</Tabs>

## Требования и разрешения (macOS)

- На Mac, где запускается `imsg`, должен быть выполнен вход в Messages.
- Для контекста процесса, запускающего OpenClaw/`imsg`, требуется Full Disk Access (доступ к БД Messages).
- Для отправки сообщений через Messages.app требуется разрешение Automation.
- Для расширенных действий (реакция / редактирование / отмена отправки / ответ в ветке / эффекты / операции с группами) System Integrity Protection должен быть отключен — см. [Включение private API imsg](#enabling-the-imsg-private-api) ниже. Базовая отправка и получение текста и медиа работают без этого.

<Tip>
Разрешения выдаются на контекст процесса. Если gateway работает без графического сеанса (LaunchAgent/SSH), выполните одноразовую интерактивную команду в том же контексте, чтобы вызвать запросы разрешений:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Отправка через SSH-обертку завершается ошибкой AppleEvents -1743">
  Настройка через удаленный SSH может читать чаты, проходить `channels status --probe` и обрабатывать входящие сообщения, но исходящая отправка при этом все равно может завершаться ошибкой авторизации AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Проверьте базу TCC пользователя Mac, где выполнен вход, или System Settings > Privacy & Security > Automation. Если запись Automation сохранена для `/usr/libexec/sshd-keygen-wrapper` вместо процесса `imsg` или локальной оболочки, macOS может не показать пригодный переключатель Messages для этого серверного SSH-клиента:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

В таком состоянии повторный `tccutil reset AppleEvents` или повторный запуск `imsg send` через ту же SSH-обертку может продолжать завершаться ошибкой, потому что контекст процесса, которому нужен Messages Automation, — это SSH-обертка, а не приложение, которому UI может выдать разрешение.

Вместо этого используйте один из поддерживаемых контекстов процесса `imsg`:

- Запускайте Gateway или хотя бы мост `imsg` в локальном сеансе пользователя Messages, где выполнен вход.
- Запускайте Gateway через LaunchAgent для этого пользователя после выдачи Full Disk Access и Automation из того же сеанса.
- Если вы сохраняете SSH-топологию с двумя пользователями, проверьте, что реальная исходящая команда `imsg send` успешно выполняется через точную обертку перед включением канала. Если Automation нельзя выдать, перенастройте систему на однопользовательскую установку `imsg` вместо использования SSH-обертки для отправки.

</Accordion>

## Включение private API imsg

`imsg` поставляется в двух рабочих режимах:

- **Базовый режим** (по умолчанию, изменения SIP не нужны): исходящий текст и медиа через `send`, входящее наблюдение/история, список чатов. Именно это вы получаете сразу после свежей установки `brew install steipete/tap/imsg` плюс стандартные разрешения macOS выше.
- **Режим private API**: `imsg` внедряет вспомогательную dylib в `Messages.app`, чтобы вызывать внутренние функции `IMCore`. Это открывает `react`, `edit`, `unsend`, `reply` (в ветке), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а также индикаторы набора и уведомления о прочтении.

Чтобы получить поверхность расширенных действий, описанную на этой странице канала, нужен режим private API. README `imsg` прямо указывает это требование:

> Расширенные функции, такие как `read`, `typing`, `launch`, расширенная отправка через мост, изменение сообщений и управление чатами, включаются явно. Они требуют отключенного SIP и внедрения вспомогательной dylib в `Messages.app`. `imsg launch` отказывается выполнять внедрение, когда SIP включен.

Техника внедрения вспомогательной библиотеки использует собственную dylib `imsg` для доступа к private API Messages. В пути OpenClaw iMessage нет стороннего сервера или runtime BlueBubbles.

<Warning>
**Отключение SIP — это реальный компромисс безопасности.** SIP является одной из основных защит macOS от запуска измененного системного кода; его системное отключение открывает дополнительную поверхность атаки и побочные эффекты. В частности, **отключение SIP на Mac с Apple Silicon также отключает возможность устанавливать и запускать приложения iOS на вашем Mac**.

Рассматривайте это как осознанный операционный выбор, а не как значение по умолчанию. Если ваша модель угроз не допускает отключенного SIP, встроенный iMessage ограничен базовым режимом — только отправка/получение текста и медиа, без реакций / редактирования / отмены отправки / эффектов / операций с группами.
</Warning>

### Настройка

1. **Установите (или обновите) `imsg`** на Mac, где работает Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вывод `imsg status --json` сообщает `bridge_version`, `rpc_methods` и `selectors` по каждому методу, чтобы вы могли увидеть, что поддерживает текущая сборка, перед началом работы.

2. **Отключите System Integrity Protection и (на современных macOS) Library Validation.** Внедрение вспомогательной dylib не от Apple в подписанное Apple приложение `Messages.app` требует отключенного SIP **и** ослабленной проверки библиотек. Шаг SIP в Recovery Mode зависит от версии macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** отключите Library Validation через Terminal, перезагрузитесь в Recovery Mode, выполните `csrutil disable`, перезапустите.
   - **macOS 11+ (Big Sur и новее), Intel:** Recovery Mode (или Internet Recovery), `csrutil disable`, перезапуск.
   - **macOS 11+, Apple Silicon:** последовательность запуска кнопкой питания для входа в Recovery; в последних версиях macOS удерживайте клавишу **Left Shift**, когда нажимаете Continue, затем `csrutil disable`. Установки на виртуальных машинах используют отдельный процесс, поэтому сначала сделайте снимок VM.

   **На macOS 11 и новее одного `csrutil disable` обычно недостаточно.** Apple все еще применяет library validation к `Messages.app` как к platform binary, поэтому helper с adhoc-подписью отклоняется (`Library Validation failed: ... platform binary, but mapped file is not`) даже при отключенном SIP. После отключения SIP также отключите library validation и перезагрузитесь:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), проверено на 26.5.1:** отключенного SIP **плюс** команды `DisableLibraryValidation` выше достаточно для внедрения helper во всех версиях с 26.0 по 26.5.x. **boot-args не требуются.** plist является решающим фактором и самым частым пропущенным шагом, когда внедрение на Tahoe завершается ошибкой:
   - **С plist:** `imsg launch` выполняет внедрение, а `imsg status` сообщает `advanced_features: true`.
   - **Без plist (даже при отключенном SIP):** `imsg launch` завершается ошибкой `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI отклоняет adhoc helper при загрузке, поэтому мост так и не становится готовым, а запуск завершается по таймауту. Именно с этим таймаутом чаще всего сталкиваются на Tahoe, и исправление — plist выше, а не более радикальные меры.

   Это было подтверждено контролируемой проверкой до/после на macOS 26.5.1 (Apple Silicon): с plist dylib отображается в `Messages.app`, и мост запускается; удалите plist и перезагрузитесь — и `imsg launch` выдает указанную выше ошибку таймаута, а dylib не отображается.

   Если внедрение `imsg launch` или конкретные `selectors` начинают возвращать false после обновления macOS, эта проверка обычно является причиной. Проверьте состояние SIP и library validation, прежде чем считать, что сам шаг SIP не удался. Если эти настройки корректны, но мост всё равно не может выполнить внедрение, соберите `imsg status --json` вместе с выводом `imsg launch` и сообщите об этом в проект `imsg`, а не ослабляйте дополнительные общесистемные механизмы безопасности.

   Следуйте процессу Apple в режиме Recovery для вашего Mac, чтобы отключить SIP перед запуском `imsg launch`.

3. **Внедрите вспомогательный компонент.** При отключенном SIP и выполненном входе в Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` отказывается выполнять внедрение, если SIP всё ещё включен, поэтому это также служит подтверждением, что шаг 2 сработал.

4. **Проверьте мост из OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запись iMessage должна сообщать `works`, а `imsg status --json | jq '.selectors'` должна показывать `retractMessagePart: true` плюс те селекторы редактирования / набора / прочтения, которые предоставляет ваша сборка macOS. Проверка OpenClaw plugin по методам в `actions.ts` объявляет только действия, чей базовый селектор равен `true`, поэтому набор действий, который вы видите в списке инструментов агента, отражает то, что мост действительно может делать на этом хосте.

Если `openclaw channels status --probe` сообщает, что канал имеет состояние `works`, но конкретные действия во время отправки выбрасывают ошибку "iMessage `<action>` requires the imsg private API bridge", снова выполните `imsg launch` — вспомогательный компонент может отключиться (перезапуск Messages.app, обновление ОС и т. д.), а кэшированный статус `available: true` будет продолжать объявлять действия до следующего обновления проверки.

### Когда нельзя отключить SIP

Если отключение SIP неприемлемо для вашей модели угроз:

- `imsg` возвращается к базовому режиму — только текст + медиа + получение.
- OpenClaw plugin всё ещё объявляет отправку текста/медиа и мониторинг входящих сообщений; он просто скрывает `react`, `edit`, `unsend`, `reply`, `sendWithEffect` и групповые операции из поверхности действий (согласно проверке возможностей по методам).
- Можно запустить отдельный Mac не на Apple Silicon (или выделенный bot Mac) с отключенным SIP для нагрузки iMessage, сохранив SIP включенным на основных устройствах. См. [Выделенный пользователь macOS для бота (отдельная идентичность iMessage)](#deployment-patterns) ниже.

## Контроль доступа и маршрутизация

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` управляет прямыми сообщениями:

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `allowFrom` включал `"*"`)
    - `disabled`

    Поле списка разрешений: `channels.imessage.allowFrom`.

    Записи списка разрешений должны идентифицировать отправителей: идентификаторы или статические группы доступа отправителей (`accessGroup:<name>`). Используйте `channels.imessage.groupAllowFrom` для целей чата, таких как `chat_id:*`, `chat_guid:*` или `chat_identifier:*`; используйте `channels.imessage.groups` для числовых ключей реестра `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` управляет обработкой групп:

    - `allowlist` (по умолчанию, если настроено)
    - `open`
    - `disabled`

    Список разрешенных отправителей группы: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` также могут ссылаться на статические группы доступа отправителей (`accessGroup:<name>`).

    Резервное поведение во время выполнения: если `groupAllowFrom` не задан, проверки отправителей групп iMessage используют `allowFrom`; задайте `groupAllowFrom`, когда правила допуска для личных сообщений и групп должны различаться.
    Примечание о времени выполнения: если `channels.imessage` полностью отсутствует, среда выполнения возвращается к `groupPolicy="allowlist"` и записывает предупреждение в журнал (даже если задан `channels.defaults.groupPolicy`).

    <Warning>
    Групповая маршрутизация имеет **две** проверки списка разрешений, выполняемые подряд, и обе должны пройти:

    1. **Список разрешений отправителей / целей чата** (`channels.imessage.groupAllowFrom`) — идентификатор, `chat_guid`, `chat_identifier` или `chat_id`.
    2. **Реестр групп** (`channels.imessage.groups`) — при `groupPolicy: "allowlist"` эта проверка требует либо wildcard-записи `groups: { "*": { ... } }` (устанавливает `allowAll = true`), либо явной записи для конкретного `chat_id` в `groups`.

    Если во второй проверке ничего нет, каждое групповое сообщение отбрасывается. Plugin выдает два сигнала уровня `warn` при уровне журнала по умолчанию:

    - один раз на аккаунт при запуске: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - один раз на `chat_id` во время выполнения: `imessage: dropping group message from chat_id=<id> ...`

    Личные сообщения продолжают работать, потому что они проходят по другому пути кода.

    Минимальная конфигурация, чтобы группы продолжали проходить при `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Если эти строки `warn` появляются в журнале gateway, отбрасывает проверка 2 — добавьте блок `groups`.
    </Warning>

    Проверка упоминаний для групп:

    - iMessage не имеет нативных метаданных упоминаний
    - обнаружение упоминаний использует regex-шаблоны (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - без настроенных шаблонов проверку упоминаний нельзя обеспечить

    Управляющие команды от авторизованных отправителей могут обходить проверку упоминаний в группах.

    `systemPrompt` для группы:

    Каждая запись в `channels.imessage.groups.*` принимает необязательную строку `systemPrompt`. Значение внедряется в системный prompt агента на каждом ходе, который обрабатывает сообщение в этой группе. Разрешение повторяет разрешение prompt для группы, используемое `channels.whatsapp.groups`:

    1. **Системный prompt конкретной группы** (`groups["<chat_id>"].systemPrompt`): используется, когда конкретная запись группы существует в карте **и** ее ключ `systemPrompt` определен. Если `systemPrompt` является пустой строкой (`""`), wildcard подавляется и системный prompt не применяется к этой группе.
    2. **Wildcard системного prompt для групп** (`groups["*"].systemPrompt`): используется, когда конкретная запись группы полностью отсутствует в карте или когда она существует, но не задает ключ `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt для группы применяется только к групповым сообщениям — прямые сообщения в этом канале не затрагиваются.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Личные сообщения используют прямую маршрутизацию; группы используют групповую маршрутизацию.
    - При стандартном `session.dmScope=main` личные сообщения iMessage сворачиваются в основную сессию агента.
    - Групповые сессии изолированы (`agent:<agentId>:imessage:group:<chat_id>`).
    - Ответы маршрутизируются обратно в iMessage с использованием метаданных исходного канала/цели.

    Поведение потоков, похожих на групповые:

    Некоторые многопользовательские потоки iMessage могут приходить с `is_group=false`.
    Если этот `chat_id` явно настроен в `channels.imessage.groups`, OpenClaw обрабатывает его как групповой трафик (групповая проверка + изоляция групповой сессии).

  </Tab>
</Tabs>

## Привязки разговоров ACP

Устаревшие чаты iMessage также можно привязать к сессиям ACP.

Быстрый операторский процесс:

- Выполните `/acp spawn codex --bind here` внутри личного сообщения или разрешенного группового чата.
- Будущие сообщения в том же разговоре iMessage будут маршрутизироваться в созданную сессию ACP.
- `/new` и `/reset` сбрасывают ту же привязанную сессию ACP на месте.
- `/acp close` закрывает сессию ACP и удаляет привязку.

Настроенные постоянные привязки поддерживаются через записи верхнего уровня `bindings[]` с `type: "acp"` и `match.channel: "imessage"`.

`match.peer.id` может использовать:

- нормализованный идентификатор личного сообщения, например `+15555550123` или `user@example.com`
- `chat_id:<id>` (рекомендуется для стабильных групповых привязок)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Пример:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

См. [Агенты ACP](/ru/tools/acp-agents) для общего поведения привязок ACP.

## Шаблоны развертывания

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Используйте выделенный Apple ID и пользователя macOS, чтобы трафик бота был изолирован от вашего личного профиля Messages.

    Типичный процесс:

    1. Создайте выделенного пользователя macOS или войдите в него.
    2. Войдите в Messages с Apple ID бота в этом пользователе.
    3. Установите `imsg` в этом пользователе.
    4. Создайте SSH-обертку, чтобы OpenClaw мог запускать `imsg` в контексте этого пользователя.
    5. Укажите `channels.imessage.accounts.<id>.cliPath` и `.dbPath` на профиль этого пользователя.

    Первый запуск может потребовать GUI-разрешений (Automation + Full Disk Access) в сессии этого пользователя-бота.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Распространенная топология:

    - gateway работает на Linux/VM
    - iMessage + `imsg` работает на Mac в вашей tailnet
    - обертка `cliPath` использует SSH для запуска `imsg`
    - `remoteHost` включает получение вложений через SCP

    Пример:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Используйте SSH-ключи, чтобы и SSH, и SCP были неинтерактивными.
    Сначала убедитесь, что ключ хоста доверенный (например, `ssh bot@mac-mini.tailnet-1234.ts.net`), чтобы `known_hosts` был заполнен.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage поддерживает конфигурацию по аккаунтам в `channels.imessage.accounts`.

    Каждый аккаунт может переопределять поля, такие как `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, настройки истории и списки разрешенных корней вложений.

  </Accordion>

  <Accordion title="Direct-message history">
    Задайте `channels.imessage.dmHistoryLimit`, чтобы наполнять новые сессии прямых сообщений недавней декодированной историей `imsg` для этого разговора. Используйте `channels.imessage.dms["<sender>"].historyLimit` для переопределений по отправителям, включая `0`, чтобы отключить историю для отправителя.

    История личных сообщений iMessage извлекается по требованию из `imsg`. Если `dmHistoryLimit` не задан, глобальное наполнение истории личных сообщений отключено, но положительное значение `channels.imessage.dms["<sender>"].historyLimit` для конкретного отправителя всё равно включает наполнение для этого отправителя.

  </Accordion>
</AccordionGroup>

## Медиа, разбиение на части и цели доставки

<AccordionGroup>
  <Accordion title="Вложения и медиа">
    - прием входящих вложений **по умолчанию отключен** — задайте `channels.imessage.includeAttachments: true`, чтобы пересылать агенту фотографии, голосовые заметки, видео и другие вложения. Если это отключено, iMessage только с вложениями отбрасываются до попадания к агенту и могут вообще не создать строку журнала `Inbound message`.
    - удаленные пути вложений можно получать через SCP, когда задан `remoteHost`
    - пути вложений должны соответствовать разрешенным корням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (режим удаленного SCP)
      - шаблон корня по умолчанию: `/Users/*/Library/Messages/Attachments`
    - SCP использует строгую проверку ключа хоста (`StrictHostKeyChecking=yes`)
    - размер исходящих медиа задается через `channels.imessage.mediaMaxMb` (по умолчанию 16 МБ)

  </Accordion>

  <Accordion title="Разбиение исходящих сообщений">
    - лимит фрагмента текста: `channels.imessage.textChunkLimit` (по умолчанию 4000)
    - режим разбиения: `channels.imessage.chunkMode`
      - `length` (по умолчанию)
      - `newline` (разделение сначала по абзацам)

  </Accordion>

  <Accordion title="Форматы адресации">
    Предпочтительные явные цели:

    - `chat_id:123` (рекомендуется для стабильной маршрутизации)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цели по handle также поддерживаются:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Действия приватного API

Когда `imsg launch` запущен, а `openclaw channels status --probe` сообщает `privateApi.available: true`, инструмент сообщений может использовать нативные для iMessage действия в дополнение к обычной отправке текста.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Доступные действия">
    - **react**: Добавить/удалить tapback-реакции iMessage (`messageId`, `emoji`, `remove`). Поддерживаемые tapback-реакции сопоставляются с love, like, dislike, laugh, emphasize и question.
    - **reply**: Отправить ответ в ветке к существующему сообщению (`messageId`, `text` или `message`, а также `chatGuid`, `chatId`, `chatIdentifier` или `to`).
    - **sendWithEffect**: Отправить текст с эффектом iMessage (`text` или `message`, `effect` или `effectId`).
    - **edit**: Изменить отправленное сообщение на поддерживаемых версиях macOS/приватного API (`messageId`, `text` или `newText`).
    - **unsend**: Отозвать отправленное сообщение на поддерживаемых версиях macOS/приватного API (`messageId`).
    - **upload-file**: Отправить медиа/файлы (`buffer` в base64 или гидратированные `media`/`path`/`filePath`, `filename`, необязательный `asVoice`). Устаревший псевдоним: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Управлять групповыми чатами, когда текущая цель является групповым разговором.

  </Accordion>

  <Accordion title="Идентификаторы сообщений">
    Входящий контекст iMessage включает как короткие значения `MessageSid`, так и полные GUID сообщений, когда они доступны. Короткие идентификаторы ограничены недавним кэшем ответов на базе SQLite и перед использованием проверяются относительно текущего чата. Если срок действия короткого идентификатора истек или он относится к другому чату, повторите попытку с полным `MessageSidFull`.

  </Accordion>

  <Accordion title="Обнаружение возможностей">
    OpenClaw скрывает действия приватного API только тогда, когда кэшированный статус проверки говорит, что мост недоступен. Если статус неизвестен, действия остаются видимыми, а диспетчеризация запускает проверки лениво, чтобы первое действие могло успешно выполниться после `imsg launch` без отдельного ручного обновления статуса.

  </Accordion>

  <Accordion title="Отчеты о прочтении и набор текста">
    Когда мост приватного API работает, принятые входящие чаты помечаются прочитанными, а в личных чатах отображается индикатор набора, как только ход принят, пока агент подготавливает контекст и генерирует ответ. Отключите отметку о прочтении так:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Более старые сборки `imsg`, появившиеся до списка возможностей по методам, будут тихо отключать набор текста/прочтение; OpenClaw записывает однократное предупреждение при каждом перезапуске, чтобы отсутствие отчета можно было объяснить.

  </Accordion>

  <Accordion title="Входящие tapback-реакции">
    OpenClaw подписывается на tapback-реакции iMessage и маршрутизирует принятые реакции как системные события вместо обычного текста сообщения, поэтому пользовательская tapback-реакция не запускает обычный цикл ответа.

    Режим уведомлений управляется `channels.imessage.reactionNotifications`:

    - `"own"` (по умолчанию): уведомлять только когда пользователи реагируют на сообщения, созданные ботом.
    - `"all"`: уведомлять обо всех входящих tapback-реакциях от авторизованных отправителей.
    - `"off"`: игнорировать входящие tapback-реакции.

    Переопределения для отдельных аккаунтов используют `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Реакции подтверждения (👍 / 👎)">
    Когда `approvals.exec.enabled` или `approvals.plugin.enabled` имеет значение true и запрос маршрутизируется в iMessage, Gateway доставляет запрос подтверждения нативно и принимает tapback-реакцию для его разрешения:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` остается ручным запасным вариантом: отправьте `/approve <id> allow-always` как обычный ответ.

    Обработка реакции требует, чтобы handle реагирующего пользователя был явным подтверждающим. Список подтверждающих читается из `channels.imessage.allowFrom` (или `channels.imessage.accounts.<id>.allowFrom`); добавьте номер телефона пользователя в формате E.164 или его адрес электронной почты Apple ID. Подстановочная запись `"*"` учитывается, но позволяет подтверждать любому отправителю. Сокращение через реакцию намеренно обходит `reactionNotifications`, `dmPolicy` и `groupAllowFrom`, потому что единственным важным барьером для разрешения подтверждения является allowlist явных подтверждающих.

    **Изменение поведения в этом выпуске:** Когда `channels.imessage.allowFrom` не пуст, текстовая команда `/approve <id> <decision>` теперь авторизуется по этому списку подтверждающих (а не по более широкому allowlist личных сообщений). Отправители, разрешенные в allowlist личных сообщений, но отсутствующие в `allowFrom`, получат явный отказ. Добавьте каждого оператора, который должен иметь возможность подтверждать через `/approve` (и через реакции), в `allowFrom`, чтобы сохранить прежнее поведение. Когда `allowFrom` пуст, устаревший «запасной вариант того же чата» остается в силе, и `/approve` продолжает авторизовать всех, кого допускает allowlist личных сообщений.

    Заметки для операторов:
    - Привязка реакции хранится как в памяти (с TTL, соответствующим истечению подтверждения), так и в постоянном хранилище Gateway с ключами, поэтому tapback-реакция, поступившая вскоре после перезапуска Gateway, все еще разрешает подтверждение.
    - Межустройственные tapback-реакции `is_from_me=true` (собственная реакция оператора на сопряженном устройстве Apple) намеренно игнорируются, чтобы бот не мог подтвердить сам себя.
    - Устаревшие tapback-реакции в текстовом стиле (`Liked "…"` обычным текстом от очень старых клиентов Apple) не могут разрешать подтверждения, потому что не несут GUID сообщения; для разрешения через реакцию требуются структурированные метаданные tapback-реакции, которые отправляют актуальные клиенты macOS / iOS.

  </Accordion>
</AccordionGroup>

## Запись конфигурации

iMessage по умолчанию разрешает инициированную каналом запись конфигурации (для `/config set|unset`, когда `commands.config: true`).

Отключение:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Объединение личных сообщений с раздельной отправкой (команда + URL в одной композиции)

Когда пользователь вводит команду и URL вместе — например, `Dump https://example.com/article` — приложение «Сообщения» Apple разделяет отправку на **две отдельные строки `chat.db`**:

1. Текстовое сообщение (`"Dump"`).
2. Пузырь предпросмотра URL (`"https://..."`) с изображениями OG-предпросмотра как вложениями.

Эти две строки поступают в OpenClaw с интервалом примерно 0,8-2,0 с в большинстве конфигураций. Без объединения агент получает только команду на ходе 1, отвечает (часто «отправьте мне URL») и видит URL только на ходе 2 — к этому моменту контекст команды уже потерян. Это конвейер отправки Apple, а не что-то, добавленное OpenClaw или `imsg`.

`channels.imessage.coalesceSameSenderDms` включает для личных сообщений буферизацию последовательных строк от одного отправителя. Когда `imsg` предоставляет структурный маркер предпросмотра URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` в одной из исходных строк, OpenClaw объединяет только эту настоящую раздельную отправку и сохраняет любые другие буферизованные строки как отдельные ходы. В более старых сборках `imsg`, которые вообще не отправляют метаданные пузыря, OpenClaw не может отличить раздельную отправку от отдельных отправок, поэтому возвращается к объединению корзины. Это сохраняет поведение до появления метаданных, а не регрессирует раздельные отправки `Dump <url>` в два хода. Групповые чаты продолжают диспетчеризоваться по сообщениям, чтобы сохранялась структура ходов с несколькими пользователями.

<Tabs>
  <Tab title="Когда включать">
    Включайте, когда:

    - Вы поставляете Skills, которые ожидают `command + payload` в одном сообщении (dump, paste, save, queue и т. д.).
    - Ваши пользователи вставляют URL рядом с командами.
    - Вы можете принять добавленную задержку хода в личных сообщениях (см. ниже).

    Оставляйте отключенным, когда:

    - Вам нужна минимальная задержка команд для однословных триггеров в личных сообщениях.
    - Все ваши потоки — одноразовые команды без последующей полезной нагрузки.

  </Tab>
  <Tab title="Включение">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Когда флаг включен и нет явного `messages.inbound.byChannel.imessage` или глобального `messages.inbound.debounceMs`, окно debounce расширяется до **7000 мс** (устаревшее значение по умолчанию — 0 мс, без debounce). Более широкое окно требуется, потому что ритм раздельной отправки URL-предпросмотра Apple может растянуться на несколько секунд, пока Messages.app отправляет строку предпросмотра.

    Чтобы настроить окно самостоятельно:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Компромиссы">
    - **Точное объединение требует актуальных метаданных полезной нагрузки `imsg`.** Когда строка URL включает `balloon_bundle_id`, объединяется только эта настоящая раздельная отправка, а другие буферизованные строки остаются отдельными. В более старых сборках `imsg`, которые не предоставляют метаданные пузыря, OpenClaw возвращается к объединению буферизованной корзины, чтобы раздельные отправки `Dump <url>` не регрессировали в два хода (временная обратная совместимость, удаляется после того, как `imsg` начнет объединять раздельные отправки выше по потоку).
    - **Добавленная задержка для сообщений в личных чатах.** Когда флаг включен, каждое личное сообщение (включая самостоятельные управляющие команды и одиночные текстовые продолжения) ожидает до окна debounce перед диспетчеризацией на случай, если поступает строка предпросмотра URL. Сообщения групповых чатов сохраняют мгновенную диспетчеризацию.
    - **Объединенный вывод ограничен.** Объединенный текст ограничен 4000 символами с явным маркером `…[truncated]`; вложения ограничены 20; исходные записи ограничены 10 (при превышении сохраняются первая и самые последние). Каждый исходный GUID отслеживается в `coalescedMessageGuids` для последующей телеметрии.
    - **Только личные сообщения.** Групповые чаты переходят к диспетчеризации по сообщениям, чтобы бот оставался отзывчивым, когда печатает несколько человек.
    - **Включается явно, по каналу.** Другие каналы (Telegram, WhatsApp, Slack, …) не затрагиваются. Устаревшие конфигурации BlueBubbles, задающие `channels.bluebubbles.coalesceSameSenderDms`, должны перенести это значение в `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарии и что видит агент

Столбец «Флаг включен» показывает поведение в сборке `imsg`, которая передает `balloon_bundle_id`. В старых сборках `imsg`, которые вообще не передают метаданные balloon, строки ниже, помеченные как «Два хода» / «N ходов», вместо этого откатываются к устаревшему объединению (один ход): OpenClaw не может структурно отличить разделенную отправку от отдельных отправок, поэтому сохраняет объединение, использовавшееся до появления метаданных. Точное разделение включается, когда сборка начинает передавать метаданные balloon.

| Пользователь составляет                                           | `chat.db` создает                   | Флаг выключен (по умолчанию)             | Флаг включен + окно (`imsg` передает метаданные balloon)                                             |
| ------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (одна отправка)                         | 2 строки с интервалом ~1 с          | Два хода агента: только «Dump», затем URL | Один ход: объединенный текст `Dump https://example.com`                                             |
| `Save this 📎image.jpg caption` (вложение + текст)                 | 2 строки без метаданных URL balloon | Два хода                                 | Два хода после обнаружения метаданных; один объединенный ход в старых/дофиксационных сеансах без метаданных |
| `/status` (отдельная команда)                                      | 1 строка                            | Немедленная отправка                     | **Ждать до конца окна, затем отправить**                                                            |
| URL вставлен отдельно                                              | 1 строка                            | Немедленная отправка                     | Ждать до конца окна, затем отправить                                                                |
| Текст + URL отправлены как два намеренно отдельных сообщения с интервалом в минуты | 2 строки вне окна                   | Два хода                                 | Два хода (окно истекает между ними)                                                                 |
| Быстрый поток (>10 коротких DM внутри окна)                        | N строк без метаданных URL balloon  | N ходов                                  | N ходов после обнаружения метаданных; один ограниченный объединенный ход в старых/дофиксационных сеансах без метаданных |
| Два человека печатают в групповом чате                             | N строк от M отправителей           | M+ ходов (по одному на корзину отправителя) | M+ ходов — групповые чаты не объединяются                                                           |

## Входящее восстановление после перезапуска моста или Gateway

iMessage восстанавливает сообщения, пропущенные во время простоя Gateway, и одновременно подавляет устаревшую «бомбу бэклога», которую Apple может сбросить после восстановления Push. Поведение по умолчанию всегда включено и построено на входящей дедупликации.

- **Дедупликация повторного воспроизведения.** Каждое отправленное входящее сообщение записывается по его Apple GUID в постоянное состояние Plugin (`imessage.inbound-dedupe`), заявляется при приеме и фиксируется после обработки (освобождается при временном сбое, чтобы можно было повторить попытку). Все уже обработанное отбрасывается вместо повторной отправки. Именно это позволяет восстановлению агрессивно воспроизводить сообщения без учета каждого сообщения отдельно.
- **Восстановление после простоя.** При запуске монитор запоминает последний отправленный rowid из `chat.db` (постоянный курсор на учетную запись) и передает его в `imsg watch.subscribe` как `since_rowid`, поэтому imsg воспроизводит строки, появившиеся во время простоя Gateway, а затем следит за живым потоком. Повторное воспроизведение ограничено самыми свежими строками и сообщениями возрастом до ~2 часов, а дедупликация отбрасывает все уже обработанное.
- **Возрастной барьер устаревшего бэклога.** Строки выше границы запуска действительно живые; строка, дата отправки которой более чем на ~15 минут старше ее поступления, считается бэклогом после сброса Push и подавляется. Повторно воспроизводимые строки (на границе или ниже нее) вместо этого используют более широкое окно восстановления, поэтому недавно пропущенное сообщение доставляется, а древняя история — нет.

Восстановление работает как с локальными, так и с удаленными настройками `cliPath`, потому что повторное воспроизведение `since_rowid` идет через то же RPC-соединение `imsg`. Разница в окне: когда Gateway может читать `chat.db` (локально), он привязывает границу rowid запуска, ограничивает диапазон повторного воспроизведения и доставляет пропущенные сообщения возрастом до пары часов. При удаленном SSH `cliPath` он не может читать базу данных, поэтому повторное воспроизведение не ограничено, а каждая строка использует живой возрастной барьер — недавно пропущенные сообщения все равно восстанавливаются, а старый бэклог все равно подавляется, просто с более узким живым окном. Запускайте Gateway на Mac с Messages, чтобы получить более широкое окно восстановления.

### Сигнал, видимый оператору

Подавленный бэклог логируется на уровне по умолчанию и никогда не отбрасывается молча (флаг `recovery` показывает, какое окно применялось):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Миграция

`channels.imessage.catchup.*` устарел — восстановление после простоя теперь автоматическое и не требует конфигурации для новых установок. Существующие конфигурации с `catchup.enabled: true` продолжают учитываться как профиль совместимости для окна повторного воспроизведения восстановления. Отключенные блоки catchup (`enabled: false` или без `enabled: true`) выведены из использования; `openclaw doctor --fix` удаляет их.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Проверьте бинарный файл и поддержку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Если probe сообщает, что RPC не поддерживается, обновите `imsg`. Если действия private API недоступны, выполните `imsg launch` в пользовательском сеансе macOS с выполненным входом и снова выполните probe. Если Gateway не запущен на macOS, используйте настройку Remote Mac over SSH выше вместо локального пути `imsg` по умолчанию.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Сначала докажите, что сообщение дошло до локального Mac. Если `chat.db` не меняется, OpenClaw не может получить сообщение, даже когда `imsg status --json` сообщает о здоровом мосте.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Если сообщения, отправленные с телефона, не создают новых строк, исправьте слой macOS Messages и Apple Push до изменения конфигурации OpenClaw. Одноразового обновления сервисов часто достаточно:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Отправьте новое iMessage с телефона и подтвердите новую строку `chat.db` или событие `imsg watch` перед отладкой сеансов OpenClaw. Не запускайте это как периодический цикл перезапуска моста; повторные `imsg launch` плюс перезапуски Gateway во время активной работы могут прерывать доставки и оставлять выполняющиеся channel-запуски зависшими.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    `cliPath: "imsg"` по умолчанию должен выполняться на Mac, вошедшем в Messages. На Linux или Windows задайте `channels.imessage.cliPath` как скрипт-обертку, который подключается по SSH к этому Mac и запускает `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Затем выполните:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Проверьте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - подтверждения сопряжения (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Проверьте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведение allowlist `channels.imessage.groups`
    - конфигурацию шаблонов упоминаний (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Проверьте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - аутентификацию по ключу SSH/SCP с хоста Gateway
    - наличие ключа хоста в `~/.ssh/known_hosts` на хосте Gateway
    - доступность удаленного пути для чтения на Mac, где работает Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Повторно запустите в интерактивном GUI-терминале в том же пользовательском/сеансовом контексте и подтвердите запросы:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Подтвердите, что Full Disk Access + Automation выданы для контекста процесса, который запускает OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Указатели на справочник конфигурации

- [Справочник конфигурации — iMessage](/ru/gateway/config-channels#imessage)
- [Конфигурация Gateway](/ru/gateway/configuration)
- [Сопряжение](/ru/channels/pairing)

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Удаление BlueBubbles и путь imsg для iMessage](/ru/announcements/bluebubbles-imessage) — объявление и сводка миграции
- [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) — таблица перевода конфигурации и пошаговое переключение
- [Сопряжение](/ru/channels/pairing) — аутентификация DM и поток сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и ограничение по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
