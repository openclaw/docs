---
read_when:
    - Настройка поддержки iMessage
    - Отладка отправки и получения iMessage
summary: Нативная поддержка iMessage через imsg (JSON-RPC поверх stdio), с действиями частного API для ответов, tapback-реакций, эффектов, опросов, вложений и управления группами. Предпочтительно для новых настроек OpenClaw iMessage, когда подходят требования к хосту.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:14:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для развертываний OpenClaw iMessage используйте `imsg` на хосте macOS Messages с выполненным входом. Если ваш Gateway работает на Linux или Windows, укажите в `channels.imessage.cliPath` SSH-обертку, которая запускает `imsg` на Mac.

**Восстановление входящих сообщений выполняется автоматически.** После перезапуска моста или Gateway iMessage повторно воспроизводит сообщения, пропущенные во время простоя, и подавляет устаревшую «бомбу накопившегося журнала», которую Apple может сбросить после восстановления Push, с дедупликацией, чтобы ничего не было отправлено дважды. Включать это в конфигурации не нужно — см. [Восстановление входящих сообщений после перезапуска моста или Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Поддержка BlueBubbles удалена. Перенесите конфигурации `channels.bluebubbles` в `channels.imessage`; OpenClaw поддерживает iMessage только через `imsg`. Начните с [Удаление BlueBubbles и путь iMessage через imsg](/ru/announcements/bluebubbles-imessage) для краткого объявления или [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) для полной таблицы миграции.
</Warning>

Статус: нативная интеграция с внешним CLI. Gateway запускает `imsg rpc` и обменивается данными через JSON-RPC по stdio (без отдельного демона/порта). Расширенные действия требуют `imsg launch` и успешной проверки приватного API.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Ответы, tapback-реакции, эффекты, опросы, вложения и управление группами.
  </Card>
  <Card title="Pairing" icon="link" href="/ru/channels/pairing">
    Личные сообщения iMessage по умолчанию используют режим сопряжения.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Используйте SSH-обертку, когда Gateway не запущен на Mac с Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ru/gateway/config-channels#imessage">
    Полный справочник полей iMessage.
  </Card>
</CardGroup>

## Быстрая настройка

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запросы на сопряжение истекают через 1 час.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw требует только совместимый со stdio `cliPath`, поэтому можно указать `cliPath` на скрипт-обертку, который подключается по SSH к удаленному Mac и запускает `imsg`.

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

    Если `remoteHost` не задан, OpenClaw пытается определить его автоматически, разбирая скрипт SSH-обертки.
    `remoteHost` должен быть `host` или `user@host` (без пробелов и SSH-опций).
    OpenClaw использует строгую проверку ключа хоста для SCP, поэтому ключ relay-хоста уже должен существовать в `~/.ssh/known_hosts`.
    Пути вложений проверяются относительно разрешенных корней (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Любая обертка `cliPath` или SSH-прокси, которые вы ставите перед `imsg`, ДОЛЖНЫ вести себя как прозрачный stdio-канал для долгоживущего JSON-RPC. OpenClaw обменивается небольшими JSON-RPC-сообщениями с разделением по переводу строки через stdin/stdout обертки на протяжении всего срока жизни канала:

- Передавайте каждый фрагмент/строку stdin **сразу, как только доступны байты** — не ждите EOF.
- Оперативно передавайте каждый фрагмент/строку stdout в обратном направлении.
- Сохраняйте переводы строк.
- Избегайте блокирующих чтений фиксированного размера (`read(4096)`, `cat | buffer`, стандартный shell `read`), которые могут задерживать небольшие кадры.
- Держите stderr отдельно от stdout-потока JSON-RPC.

Обертка, которая буферизует stdin до заполнения большого блока, приведет к симптомам, похожим на сбой iMessage — `imsg rpc timeout (chats.list)` или повторные перезапуски канала — хотя сам `imsg rpc` исправен. `ssh -T host imsg "$@"` (выше) безопасен, потому что передает аргументы `cliPath` OpenClaw, такие как `rpc` и `--db`. Конвейеры вроде `ssh host imsg | grep -v '^DEBUG'` НЕ безопасны — инструменты с построчной буферизацией все равно могут удерживать кадры; используйте `stdbuf -oL -eL` на каждом этапе, если фильтрация обязательна.
</Warning>

  </Tab>
</Tabs>

## Требования и разрешения (macOS)

- На Mac, где запускается `imsg`, должен быть выполнен вход в Messages.
- Для контекста процесса, запускающего OpenClaw/`imsg`, требуется Full Disk Access (доступ к БД Messages).
- Для отправки сообщений через Messages.app требуется разрешение Automation.
- Для расширенных действий (реакция / редактирование / отмена отправки / ответ в треде / эффекты / опросы / операции с группами) System Integrity Protection должен быть отключен — см. [Включение приватного API imsg](#enabling-the-imsg-private-api) ниже. Базовые отправка и получение текста и медиа работают без этого.

<Tip>
Разрешения выдаются для каждого контекста процесса. Если Gateway работает без графического сеанса (LaunchAgent/SSH), выполните однократную интерактивную команду в том же контексте, чтобы вызвать запросы разрешений:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Настройка через удаленный SSH может читать чаты, проходить `channels status --probe` и обрабатывать входящие сообщения, но исходящая отправка все равно может завершаться ошибкой авторизации AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Проверьте базу TCC пользователя Mac с выполненным входом или System Settings > Privacy & Security > Automation. Если запись Automation создана для `/usr/libexec/sshd-keygen-wrapper`, а не для процесса `imsg` или локального shell, macOS может не показывать пригодный переключатель Messages для этого серверного SSH-клиента:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

В таком состоянии повторение `tccutil reset AppleEvents` или повторный запуск `imsg send` через ту же SSH-обертку может продолжать завершаться ошибкой, потому что контекст процесса, которому нужна Messages Automation, — это SSH-обертка, а не приложение, которому UI может выдать разрешение.

Вместо этого используйте один из поддерживаемых контекстов процесса `imsg`:

- Запускайте Gateway или хотя бы мост `imsg` в локальной сессии вошедшего пользователя Messages.
- Запускайте Gateway через LaunchAgent этого пользователя после выдачи Full Disk Access и Automation из той же сессии.
- Если вы сохраняете SSH-топологию с двумя пользователями, проверьте, что реальная исходящая команда `imsg send` успешно проходит через точную обертку, прежде чем включать канал. Если Automation выдать невозможно, перенастройте систему на однопользовательскую установку `imsg` вместо зависимости от SSH-обертки для отправки.

</Accordion>

## Включение приватного API imsg

`imsg` поставляется в двух режимах работы:

- **Базовый режим** (по умолчанию, без изменений SIP): исходящий текст и медиа через `send`, входящие watch/history, список чатов. Это то, что вы получаете сразу после свежего `brew install steipete/tap/imsg` плюс стандартные разрешения macOS выше.
- **Режим приватного API**: `imsg` внедряет вспомогательную dylib в `Messages.app`, чтобы вызывать внутренние функции `IMCore`. Это открывает `react`, `edit`, `unsend`, `reply` (в треде), `sendWithEffect`, `poll` и `poll-vote` (нативные опросы Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а также индикаторы набора и уведомления о прочтении.

Чтобы получить доступ к поверхности расширенных действий, описанной на этой странице канала, нужен режим приватного API. В README `imsg` требование указано явно:

> Расширенные функции, такие как `read`, `typing`, `launch`, расширенная отправка через мост, изменение сообщений и управление чатами, включаются явно. Для них требуется отключить SIP и внедрить вспомогательную dylib в `Messages.app`. `imsg launch` отказывается выполнять внедрение, когда SIP включен.

Метод внедрения helper использует собственную dylib `imsg` для доступа к приватным API Messages. В пути OpenClaw iMessage нет стороннего сервера или среды выполнения BlueBubbles.

<Warning>
**Отключение SIP — это реальный компромисс безопасности.** SIP — одна из ключевых защит macOS от запуска измененного системного кода; его отключение на уровне всей системы открывает дополнительную поверхность атаки и может иметь побочные эффекты. В частности, **отключение SIP на Mac с Apple Silicon также отключает возможность устанавливать и запускать приложения iOS на вашем Mac**.

Относитесь к этому как к осознанному эксплуатационному выбору, а не как к настройке по умолчанию. Если ваша модель угроз не допускает отключенного SIP, встроенный iMessage ограничен базовым режимом — только отправка/получение текста и медиа, без реакций / редактирования / отмены отправки / эффектов / операций с группами.
</Warning>

### Настройка

1. **Установите (или обновите) `imsg`** на Mac, где работает Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вывод `imsg status --json` сообщает `bridge_version`, `rpc_methods` и `selectors` для каждого метода, чтобы вы могли увидеть, что поддерживает текущая сборка, прежде чем начинать.

2. **Отключите System Integrity Protection и (на современных macOS) Library Validation.** Внедрение не-Apple helper dylib в подписанное Apple приложение `Messages.app` требует отключенного SIP **и** ослабленной проверки библиотек. Шаг SIP в режиме Recovery зависит от версии macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** отключите Library Validation через Terminal, перезагрузитесь в Recovery Mode, выполните `csrutil disable`, перезапустите.
   - **macOS 11+ (Big Sur и новее), Intel:** Recovery Mode (или Internet Recovery), `csrutil disable`, перезапуск.
   - **macOS 11+, Apple Silicon:** последовательность запуска через кнопку питания для входа в Recovery; в недавних версиях macOS удерживайте клавишу **Left Shift**, когда нажимаете Continue, затем `csrutil disable`. Установки в виртуальных машинах используют отдельный процесс, поэтому сначала сделайте снимок VM.

   **На macOS 11 и новее одного `csrutil disable` обычно недостаточно.** Apple все еще применяет Library Validation к `Messages.app` как к platform binary, поэтому helper с adhoc-подписью отклоняется (`Library Validation failed: ... platform binary, but mapped file is not`) даже при отключенном SIP. После отключения SIP также отключите Library Validation и перезагрузитесь:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), проверено на 26.5.1:** отключенного SIP **плюс** команды `DisableLibraryValidation` выше достаточно для внедрения helper во всех версиях с 26.0 по 26.5.x. **Никакие boot-args не требуются.** Plist — решающий фактор и самый частый пропущенный шаг, когда внедрение на Tahoe завершается ошибкой:
   - **С plist:** `imsg launch` выполняет внедрение, и `imsg status` сообщает `advanced_features: true`.
   - **Без plist (даже при отключенном SIP):** `imsg launch` завершается ошибкой `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI отклоняет adhoc helper при загрузке, поэтому мост не становится готовым и запуск завершается по тайм-ауту. Этот тайм-аут — симптом, с которым большинство сталкивается на Tahoe, и исправление — plist выше, а не что-то более радикальное.

   Это подтверждено контролируемым сравнением до/после на macOS 26.5.1 (Apple Silicon): с plist dylib отображается в `Messages.app`, и мост запускается; если удалить plist и перезагрузиться, `imsg launch` выдает указанную выше ошибку тайм-аута, а dylib не отображается.

   Если внедрение `imsg launch` или конкретные `selectors` начинают возвращать false после обновления macOS, обычно причина в этом ограничении. Проверьте состояние SIP и проверки библиотек, прежде чем считать, что сам шаг с SIP завершился неудачно. Если эти настройки корректны, но bridge все равно не может выполнить внедрение, соберите `imsg status --json` вместе с выводом `imsg launch` и сообщите об этом в проект `imsg`, вместо того чтобы ослаблять дополнительные общесистемные средства защиты.

   Следуйте процедуре Apple в режиме Recovery для вашего Mac, чтобы отключить SIP перед запуском `imsg launch`.

3. **Внедрите helper.** Когда SIP отключен, а вход в Messages.app выполнен:

   ```bash
   imsg launch
   ```

   `imsg launch` отказывается выполнять внедрение, если SIP все еще включен, поэтому это также служит подтверждением, что шаг 2 сработал.

4. **Проверьте bridge из OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запись iMessage должна сообщать `works`, а `imsg status --json | jq '{rpc_methods, selectors}'` должен показывать возможности, предоставляемые вашей сборкой macOS. Для создания опросов требуется `selectors.pollPayloadMessage`; для голосования требуются и `selectors.pollVoteMessage`, и метод RPC `poll.vote`. Plugin OpenClaw объявляет только действия, поддерживаемые кэшированной проверкой, а пустой кэш остается оптимистичным и выполняет проверку при первой отправке.

Если `openclaw channels status --probe` сообщает, что канал имеет статус `works`, но конкретные действия во время отправки выдают "iMessage `<action>` requires the imsg private API bridge", снова запустите `imsg launch` — helper может отключиться (перезапуск Messages.app, обновление ОС и т. д.), и кэшированный статус `available: true` продолжит объявлять действия до следующего обновления проверки.

### Когда вы не можете отключить SIP

Если отключение SIP неприемлемо для вашей модели угроз:

- `imsg` переходит в базовый режим — только текст + медиа + получение.
- Plugin OpenClaw по-прежнему объявляет отправку текста/медиа и мониторинг входящих сообщений; он просто скрывает `react`, `edit`, `unsend`, `reply`, `sendWithEffect` и групповые операции из поверхности действий (согласно ограничению возможностей по каждому методу).
- Вы можете использовать отдельный Mac не на Apple Silicon (или выделенный bot Mac) с отключенным SIP для рабочей нагрузки iMessage, сохраняя SIP включенным на основных устройствах. См. [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) ниже.

## Контроль доступа и маршрутизация

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` управляет личными сообщениями:

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `allowFrom` включал `"*"`)
    - `disabled`

    Поле списка разрешений: `channels.imessage.allowFrom`.

    Записи списка разрешений должны идентифицировать отправителей: handle или статические группы доступа отправителей (`accessGroup:<name>`). Используйте `channels.imessage.groupAllowFrom` для целей чата, таких как `chat_id:*`, `chat_guid:*` или `chat_identifier:*`; используйте `channels.imessage.groups` для числовых ключей реестра `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` управляет обработкой групп:

    - `allowlist` (по умолчанию, если настроено)
    - `open`
    - `disabled`

    Список разрешенных отправителей для групп: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` также могут ссылаться на статические группы доступа отправителей (`accessGroup:<name>`).

    Резервное поведение runtime: если `groupAllowFrom` не задан, проверки отправителей групп iMessage используют `allowFrom`; задайте `groupAllowFrom`, когда правила допуска для личных сообщений и групп должны отличаться.
    Примечание runtime: если `channels.imessage` полностью отсутствует, runtime откатывается к `groupPolicy="allowlist"` и пишет предупреждение в журнал (даже если задан `channels.defaults.groupPolicy`).

    <Warning>
    У групповой маршрутизации есть **два** ограничения по списку разрешений, выполняемые подряд, и оба должны пройти:

    1. **Список разрешенных отправителей / целей чата** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` или `chat_id`.
    2. **Реестр групп** (`channels.imessage.groups`) — при `groupPolicy: "allowlist"` это ограничение требует либо wildcard-записи `groups: { "*": { ... } }` (задает `allowAll = true`), либо явной записи для каждого `chat_id` в `groups`.

    Если во втором ограничении ничего нет, каждое групповое сообщение отбрасывается. Plugin выводит два сигнала уровня `warn` при стандартном уровне журналирования:

    - один раз для учетной записи при запуске: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - один раз для каждого `chat_id` во время выполнения: `imessage: dropping group message from chat_id=<id> ...`

    Личные сообщения продолжают работать, потому что они используют другой путь кода.

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

    Если эти строки `warn` появляются в журнале gateway, отбрасывает второе ограничение — добавьте блок `groups`.
    </Warning>

    Ограничение по упоминаниям для групп:

    - у iMessage нет нативных метаданных упоминаний
    - обнаружение упоминаний использует regex-шаблоны (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - без настроенных шаблонов ограничение по упоминаниям невозможно применять

    Управляющие команды от авторизованных отправителей могут обходить ограничение по упоминаниям в группах.

    `systemPrompt` для каждой группы:

    Каждая запись в `channels.imessage.groups.*` принимает необязательную строку `systemPrompt`. Значение внедряется в системный prompt агента на каждом ходе, который обрабатывает сообщение в этой группе. Разрешение повторяет разрешение prompt для каждой группы, используемое `channels.whatsapp.groups`:

    1. **Системный prompt конкретной группы** (`groups["<chat_id>"].systemPrompt`): используется, когда конкретная запись группы существует в карте **и** ее ключ `systemPrompt` определен. Если `systemPrompt` является пустой строкой (`""`), wildcard подавляется, и к этой группе не применяется системный prompt.
    2. **Wildcard системного prompt для групп** (`groups["*"].systemPrompt`): используется, когда конкретная запись группы полностью отсутствует в карте или когда она существует, но не определяет ключ `systemPrompt`.

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

    Prompt для каждой группы применяется только к групповым сообщениям — личные сообщения в этом канале не затрагиваются.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Личные сообщения используют прямую маршрутизацию; группы используют групповую маршрутизацию.
    - При стандартном `session.dmScope=main` личные сообщения iMessage сворачиваются в основную сессию агента.
    - Групповые сессии изолированы (`agent:<agentId>:imessage:group:<chat_id>`).
    - Ответы маршрутизируются обратно в iMessage с использованием метаданных исходного канала/цели.

    Поведение потоков, похожих на группы:

    Некоторые многопользовательские потоки iMessage могут приходить с `is_group=false`.
    Если этот `chat_id` явно настроен в `channels.imessage.groups`, OpenClaw обрабатывает его как групповой трафик (групповые ограничения + изоляция групповой сессии).

  </Tab>
</Tabs>

## Привязки разговоров ACP

Устаревшие чаты iMessage также можно привязывать к сессиям ACP.

Быстрый поток оператора:

- Запустите `/acp spawn codex --bind here` внутри личного сообщения или разрешенного группового чата.
- Будущие сообщения в том же разговоре iMessage направляются в созданную сессию ACP.
- `/new` и `/reset` сбрасывают ту же привязанную сессию ACP на месте.
- `/acp close` закрывает сессию ACP и удаляет привязку.

Настроенные постоянные привязки поддерживаются через записи верхнего уровня `bindings[]` с `type: "acp"` и `match.channel: "imessage"`.

`match.peer.id` может использовать:

- нормализованный handle личного сообщения, например `+15555550123` или `user@example.com`
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

    Типичный поток:

    1. Создайте выделенного пользователя macOS или войдите в него.
    2. Войдите в Messages с Apple ID бота в этом пользователе.
    3. Установите `imsg` в этом пользователе.
    4. Создайте SSH-обертку, чтобы OpenClaw мог запускать `imsg` в контексте этого пользователя.
    5. Укажите `channels.imessage.accounts.<id>.cliPath` и `.dbPath` на профиль этого пользователя.

    Первый запуск может потребовать подтверждений в GUI (Automation + Full Disk Access) в сессии этого пользователя бота.

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
    iMessage поддерживает конфигурацию для каждой учетной записи в `channels.imessage.accounts`.

    Каждая учетная запись может переопределять поля, такие как `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, настройки истории и списки разрешенных корней вложений.

  </Accordion>

  <Accordion title="Direct-message history">
    Задайте `channels.imessage.dmHistoryLimit`, чтобы заполнять новые сессии личных сообщений недавней декодированной историей `imsg` для этого разговора. Используйте `channels.imessage.dms["<sender>"].historyLimit` для переопределений по отправителю, включая `0`, чтобы отключить историю для отправителя.

    История личных сообщений iMessage извлекается по требованию из `imsg`. Если `dmHistoryLimit` не задан, глобальное заполнение истории личных сообщений отключено, но положительное значение `channels.imessage.dms["<sender>"].historyLimit` для конкретного отправителя все равно включает заполнение для этого отправителя.

  </Accordion>
</AccordionGroup>

## Медиа, разбиение на части и цели доставки

<AccordionGroup>
  <Accordion title="Вложения и медиа">
    - прием входящих вложений **по умолчанию отключен** — задайте `channels.imessage.includeAttachments: true`, чтобы пересылать фотографии, голосовые заметки, видео и другие вложения агенту. Если это отключено, iMessage только с вложениями отбрасываются до попадания к агенту и могут вообще не создать строку журнала `Inbound message`.
    - удаленные пути вложений можно получать через SCP, когда задан `remoteHost`
    - пути вложений должны соответствовать разрешенным корням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (удаленный режим SCP)
      - шаблон корня по умолчанию: `/Users/*/Library/Messages/Attachments`
    - SCP использует строгую проверку ключа хоста (`StrictHostKeyChecking=yes`)
    - размер исходящих медиа задается через `channels.imessage.mediaMaxMb` (по умолчанию 16 MB)

  </Accordion>

  <Accordion title="Разбиение исходящих сообщений">
    - лимит фрагмента текста: `channels.imessage.textChunkLimit` (по умолчанию 4000)
    - режим разбиения: `channels.imessage.chunkMode`
      - `length` (по умолчанию)
      - `newline` (разбиение с приоритетом абзацев)

  </Accordion>

  <Accordion title="Форматы адресации">
    Предпочтительные явные получатели:

    - `chat_id:123` (рекомендуется для стабильной маршрутизации)
    - `chat_guid:...`
    - `chat_identifier:...`

    Получатели по handle также поддерживаются:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Действия Private API

Когда `imsg launch` запущен и `openclaw channels status --probe` сообщает `privateApi.available: true`, инструмент сообщений может использовать нативные действия iMessage в дополнение к обычной отправке текста.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Доступные действия">
    - **react**: добавить/удалить tapback iMessage (`messageId`, `emoji`, `remove`). Поддерживаемые tapback сопоставляются с love, like, dislike, laugh, emphasize и question.
    - **reply**: отправить ответ в ветке к существующему сообщению (`messageId`, `text` или `message`, а также `chatGuid`, `chatId`, `chatIdentifier` или `to`).
    - **sendWithEffect**: отправить текст с эффектом iMessage (`text` или `message`, `effect` или `effectId`).
    - **edit**: отредактировать отправленное сообщение на поддерживаемых версиях macOS/Private API (`messageId`, `text` или `newText`).
    - **unsend**: отозвать отправленное сообщение на поддерживаемых версиях macOS/Private API (`messageId`).
    - **upload-file**: отправить медиа/файлы (`buffer` в base64 или гидратированный `media`/`path`/`filePath`, `filename`, необязательный `asVoice`). Устаревший псевдоним: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: управлять групповыми чатами, когда текущий получатель является групповым диалогом.
    - **poll**: создать нативный опрос Apple Messages (`pollQuestion`, `pollOption`, повторенный от 2 до 12 раз, а также `chatGuid`, `chatId`, `chatIdentifier` или `to`). Получатели на iOS/iPadOS/macOS 26+ видят его и голосуют в нем нативно; более старые версии ОС получают текстовый запасной вариант "Sent a poll". Требует `selectors.pollPayloadMessage`.
    - **poll-vote**: проголосовать в существующем опросе (`pollId` или `messageId`, а также ровно одно из `pollOptionIndex`, `pollOptionId` или `pollOptionText`). Требует `selectors.pollVoteMessage` и RPC-метод `poll.vote`.

    Принятые входящие опросы отображаются для агента с вопросом, нумерованными метками вариантов, количеством голосов и ID сообщения опроса, нужным для `poll-vote`.

  </Accordion>

  <Accordion title="ID сообщений">
    Входящий контекст iMessage включает как короткие значения `MessageSid`, так и полные GUID сообщений, когда они доступны. Короткие ID ограничены недавним кешем ответов на базе SQLite и перед использованием проверяются относительно текущего чата. Если короткий ID истек или относится к другому чату, повторите попытку с полным `MessageSidFull`.

  </Accordion>

  <Accordion title="Обнаружение возможностей">
    OpenClaw скрывает действия Private API только когда кешированный статус проверки говорит, что мост недоступен. Если статус неизвестен, действия остаются видимыми, а отправка лениво запускает проверки, чтобы первое действие могло успешно выполниться после `imsg launch` без отдельного ручного обновления статуса.

  </Accordion>

  <Accordion title="Уведомления о прочтении и наборе текста">
    Когда мост Private API поднят, принятые входящие чаты помечаются прочитанными, а в личных чатах пузырь набора текста отображается сразу после принятия хода, пока агент подготавливает контекст и генерирует ответ. Отключите пометку прочтения так:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Более старые сборки `imsg`, выпущенные до списка возможностей по методам, будут без вывода отключать набор текста/прочтение; OpenClaw записывает однократное предупреждение за перезапуск, чтобы отсутствие уведомления о прочтении было объяснимым.

  </Accordion>

  <Accordion title="Входящие tapback">
    OpenClaw подписывается на tapback iMessage и маршрутизирует принятые реакции как системные события вместо обычного текста сообщения, поэтому tapback пользователя не запускает обычный цикл ответа.

    Режим уведомлений управляется через `channels.imessage.reactionNotifications`:

    - `"own"` (по умолчанию): уведомлять только когда пользователи реагируют на сообщения, созданные ботом.
    - `"all"`: уведомлять обо всех входящих tapback от авторизованных отправителей.
    - `"off"`: игнорировать входящие tapback.

    Переопределения для отдельных учетных записей используют `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Реакции подтверждения (👍 / 👎)">
    Когда `approvals.exec.enabled` или `approvals.plugin.enabled` равно true и запрос маршрутизируется в iMessage, Gateway доставляет запрос подтверждения нативно и принимает tapback для его разрешения:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` остается ручным запасным вариантом: отправьте `/approve <id> allow-always` как обычный ответ.

    Обработка реакции требует, чтобы handle реагирующего пользователя был явным утверждающим. Список утверждающих читается из `channels.imessage.allowFrom` (или `channels.imessage.accounts.<id>.allowFrom`); добавьте номер телефона пользователя в формате E.164 или его email Apple ID. Запись с подстановочным знаком `"*"` учитывается, но позволяет утверждать любому отправителю. Сокращение через реакцию намеренно обходит `reactionNotifications`, `dmPolicy` и `groupAllowFrom`, потому что явный allowlist утверждающих — единственный шлюз, который важен для разрешения подтверждения.

    **Изменение поведения в этом выпуске:** когда `channels.imessage.allowFrom` не пуст, текстовая команда `/approve <id> <decision>` теперь авторизуется по этому списку утверждающих (а не по более широкому allowlist личных сообщений). Отправители, разрешенные в allowlist личных сообщений, но отсутствующие в `allowFrom`, получат явный отказ. Добавьте каждого оператора, который должен иметь возможность подтверждать через `/approve` (и через реакции), в `allowFrom`, чтобы сохранить предыдущее поведение. Когда `allowFrom` пуст, устаревший "same-chat fallback" остается в силе, и `/approve` продолжает авторизовывать всех, кого допускает allowlist личных сообщений.

    Заметки для операторов:
    - Привязка реакции хранится и в памяти (с TTL, соответствующим сроку действия подтверждения), и в постоянном keyed store Gateway, поэтому tapback, пришедший вскоре после перезапуска Gateway, все равно разрешает подтверждение.
    - Межустройственные tapback с `is_from_me=true` (собственная реакция оператора на сопряженном устройстве Apple) намеренно игнорируются, чтобы бот не мог сам себя подтвердить.
    - Устаревшие tapback в текстовом стиле (`Liked "…"` plain text от очень старых клиентов Apple) не могут разрешать подтверждения, потому что не несут GUID сообщения; разрешение по реакции требует структурированных метаданных tapback, которые отправляют текущие клиенты macOS / iOS.

  </Accordion>
</AccordionGroup>

## Записи конфигурации

iMessage по умолчанию позволяет инициированные каналом записи конфигурации (для `/config set|unset`, когда `commands.config: true`).

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

## Объединение split-send личных сообщений (команда + URL в одной композиции)

Когда пользователь вводит команду и URL вместе — например, `Dump https://example.com/article` — приложение Apple Messages разделяет отправку на **две отдельные строки `chat.db`**:

1. Текстовое сообщение (`"Dump"`).
2. Пузырь предпросмотра URL (`"https://..."`) с изображениями OG-preview как вложениями.

Эти две строки приходят в OpenClaw с интервалом примерно 0,8-2,0 с в большинстве установок. Без объединения агент получает только команду на ходе 1, отвечает (часто "send me the URL") и видит URL только на ходе 2 — к этому моменту контекст команды уже потерян. Это конвейер отправки Apple, а не что-либо, добавленное OpenClaw или `imsg`.

`channels.imessage.coalesceSameSenderDms` включает для личных сообщений буферизацию последовательных строк от одного отправителя. Когда `imsg` предоставляет структурный маркер предпросмотра URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` в одной из исходных строк, OpenClaw объединяет только этот реальный split-send и сохраняет любые другие буферизованные строки как отдельные ходы. В более старых сборках `imsg`, которые вообще не отправляют метаданные balloon, OpenClaw не может отличить split-send от отдельных отправок, поэтому возвращается к объединению bucket. Это сохраняет поведение до появления метаданных, а не регрессирует split-send `Dump <url>` в два хода. Групповые чаты продолжают отправляться по одному сообщению, чтобы сохранить структуру ходов с несколькими пользователями.

<Tabs>
  <Tab title="Когда включать">
    Включайте, когда:

    - Вы поставляете Skills, ожидающие `command + payload` в одном сообщении (dump, paste, save, queue и т. д.).
    - Ваши пользователи вставляют URL рядом с командами.
    - Вы можете принять дополнительную задержку хода личного сообщения (см. ниже).

    Оставьте отключенным, когда:

    - Вам нужна минимальная задержка команды для однословных триггеров в личных сообщениях.
    - Все ваши потоки — одноразовые команды без последующих payload.

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

    Когда флаг включен и нет явного `messages.inbound.byChannel.imessage` или глобального `messages.inbound.debounceMs`, окно debounce расширяется до **7000 ms** (устаревшее значение по умолчанию — 0 ms, то есть без debounce). Более широкое окно требуется, потому что cadence split-send предпросмотра URL Apple может растягиваться на несколько секунд, пока Messages.app отправляет строку предпросмотра.

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
    - **Точному объединению нужны текущие метаданные полезной нагрузки `imsg`.** Когда строка URL содержит `balloon_bundle_id`, объединяется только эта реальная раздельная отправка, а другие буферизованные строки остаются отдельными. В старых сборках `imsg`, которые не предоставляют метаданные balloon, OpenClaw откатывается к объединению буферизованного сегмента, чтобы раздельные отправки `Dump <url>` не регрессировали в два хода (временная обратная совместимость, будет удалена, когда `imsg` начнет объединять раздельные отправки выше по цепочке).
    - **Добавлена задержка для сообщений DM.** Когда флаг включен, каждое DM (включая отдельные управляющие команды и одиночные текстовые продолжения) ожидает до окна debounce перед отправкой на случай, если придет строка предпросмотра URL. Сообщения групповых чатов отправляются мгновенно.
    - **Объединенный вывод ограничен.** Объединенный текст ограничен 4000 символами с явным маркером `…[truncated]`; вложения ограничены 20; исходные записи ограничены 10 (сверх этого сохраняются первая и последние). Каждый GUID источника отслеживается в `coalescedMessageGuids` для последующей телеметрии.
    - **Только DM.** Групповые чаты проходят к отправке по отдельным сообщениям, чтобы бот оставался отзывчивым, когда печатают несколько человек.
    - **Включается явно, для каждого канала.** Другие каналы (Telegram, WhatsApp, Slack, …) не затрагиваются. Устаревшие конфигурации BlueBubbles, задающие `channels.bluebubbles.coalesceSameSenderDms`, должны перенести это значение в `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарии и что видит агент

Столбец «Флаг включен» показывает поведение в сборке `imsg`, которая выдает `balloon_bundle_id`. В старых сборках `imsg`, которые вообще не выдают метаданные balloon, строки ниже, помеченные «Два хода» / «N ходов», вместо этого откатываются к устаревшему объединению (один ход): OpenClaw не может структурно отличить раздельную отправку от отдельных отправок, поэтому сохраняет объединение до появления метаданных. Точное разделение активируется, когда сборка начинает выдавать метаданные balloon.

| Пользователь составляет сообщение                                  | `chat.db` создает                    | Флаг выключен (по умолчанию)                  | Флаг включен + окно (`imsg` выдает метаданные balloon)                                                    |
| ------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (одна отправка)                         | 2 строки с интервалом ~1 с           | Два хода агента: отдельно "Dump", затем URL   | Один ход: объединенный текст `Dump https://example.com`                                                   |
| `Save this 📎image.jpg caption` (вложение + текст)                 | 2 строки без метаданных URL balloon  | Два хода                                      | Два хода после обнаружения метаданных; один объединенный ход в старых сеансах или сеансах до фиксации без метаданных |
| `/status` (отдельная команда)                                      | 1 строка                             | Мгновенная отправка                           | **Ожидание до окна, затем отправка**                                                                       |
| URL вставлен отдельно                                              | 1 строка                             | Мгновенная отправка                           | Ожидание до окна, затем отправка                                                                          |
| Текст + URL отправлены как два намеренно отдельных сообщения с разницей в минуты | 2 строки вне окна                    | Два хода                                      | Два хода (между ними окно истекает)                                                                       |
| Быстрый поток (>10 небольших DM внутри окна)                       | N строк без метаданных URL balloon   | N ходов                                       | N ходов после обнаружения метаданных; один ограниченный объединенный ход в старых сеансах или сеансах до фиксации без метаданных |
| Два человека печатают в групповом чате                             | N строк от M отправителей            | M+ ходов (по одному на сегмент отправителя)   | M+ ходов — групповые чаты не объединяются                                                                 |

## Восстановление входящих сообщений после перезапуска моста или Gateway

iMessage восстанавливает сообщения, пропущенные во время простоя Gateway, и одновременно подавляет устаревшую «бомбу бэклога», которую Apple может сбросить после восстановления Push. Поведение по умолчанию всегда включено и построено на дедупликации входящих сообщений.

- **Дедупликация воспроизведения.** Каждое отправленное входящее сообщение записывается по своему Apple GUID в постоянном состоянии Plugin (`imessage.inbound-dedupe`), резервируется при приеме и фиксируется после обработки (освобождается при временном сбое, чтобы его можно было повторить). Все уже обработанное отбрасывается вместо повторной отправки. Именно это позволяет восстановлению агрессивно воспроизводить сообщения без учета каждого сообщения отдельно.
- **Восстановление после простоя.** При запуске монитор запоминает последний отправленный `chat.db` rowid (сохраненный курсор для каждой учетной записи) и передает его в `imsg watch.subscribe` как `since_rowid`, поэтому imsg воспроизводит строки, поступившие во время простоя Gateway, а затем переходит к отслеживанию живого потока. Воспроизведение ограничено самыми последними строками и сообщениями возрастом до ~2 часов, а дедупликация отбрасывает все уже обработанное.
- **Возрастной барьер устаревшего бэклога.** Строки выше границы запуска действительно живые; если дата отправки строки более чем на ~15 минут старше ее поступления, это бэклог, сброшенный Push, и он подавляется. Воспроизведенные строки (на границе или ниже нее) вместо этого используют более широкое окно восстановления, поэтому недавно пропущенное сообщение доставляется, а древняя история — нет.

Восстановление работает как с локальными, так и с удаленными настройками `cliPath`, потому что воспроизведение `since_rowid` выполняется через то же RPC-соединение `imsg`. Разница в окне: когда Gateway может читать `chat.db` (локально), он привязывает границу rowid запуска, ограничивает диапазон воспроизведения и доставляет пропущенные сообщения возрастом до пары часов. Через удаленный SSH `cliPath` он не может читать базу данных, поэтому воспроизведение не ограничено, а каждая строка использует возрастной барьер живого потока — он все еще восстанавливает недавно пропущенные сообщения и подавляет старый бэклог, просто с более узким живым окном. Запускайте Gateway на Mac с Messages, чтобы получить более широкое окно восстановления.

### Сигнал, видимый оператору

Подавленный бэклог регистрируется на уровне по умолчанию и никогда не отбрасывается молча (флаг `recovery` показывает, какое окно применялось):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Миграция

`channels.imessage.catchup.*` устарел — восстановление после простоя теперь автоматическое и не требует конфигурации для новых установок. Существующие конфигурации с `catchup.enabled: true` продолжают учитываться как профиль совместимости для окна воспроизведения восстановления. Отключенные блоки catchup (`enabled: false` или отсутствие `enabled: true`) выводятся из использования; `openclaw doctor --fix` удаляет их.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="imsg не найден или RPC не поддерживается">
    Проверьте бинарный файл и поддержку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Если probe сообщает, что RPC не поддерживается, обновите `imsg`. Если действия private API недоступны, выполните `imsg launch` в сеансе вошедшего пользователя macOS и снова запустите probe. Если Gateway работает не на macOS, используйте настройку удаленного Mac через SSH выше вместо стандартного локального пути `imsg`.

  </Accordion>

  <Accordion title="Messages отправляются, но входящие iMessages не приходят">
    Сначала докажите, дошло ли сообщение до локального Mac. Если `chat.db` не меняется, OpenClaw не сможет получить сообщение, даже когда `imsg status --json` сообщает о работоспособном мосте.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Если сообщения, отправленные с телефона, не создают новых строк, исправьте слой macOS Messages и Apple Push перед изменением конфигурации OpenClaw. Часто достаточно однократного обновления сервиса:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Отправьте свежее iMessage с телефона и подтвердите новую строку `chat.db` или событие `imsg watch`, прежде чем отлаживать сеансы OpenClaw. Не запускайте это как периодический цикл перезапуска моста; повторные `imsg launch` плюс перезапуски Gateway во время активной работы могут прерывать доставку и оставлять выполняющиеся канальные запуски зависшими.

  </Accordion>

  <Accordion title="Gateway работает не на macOS">
    Стандартный `cliPath: "imsg"` должен запускаться на Mac, где выполнен вход в Messages. На Linux или Windows задайте `channels.imessage.cliPath` как скрипт-обертку, который подключается по SSH к этому Mac и запускает `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Затем выполните:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM игнорируются">
    Проверьте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - одобрения сопряжения (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групповые сообщения игнорируются">
    Проверьте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведение списка разрешений `channels.imessage.groups`
    - конфигурацию шаблонов упоминаний (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Удаленные вложения не проходят">
    Проверьте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - аутентификацию ключом SSH/SCP с хоста Gateway
    - наличие ключа хоста в `~/.ssh/known_hosts` на хосте Gateway
    - читаемость удаленного пути на Mac, где работает Messages

  </Accordion>

  <Accordion title="Запросы разрешений macOS были пропущены">
    Повторно запустите в интерактивном GUI-терминале в том же контексте пользователя/сеанса и подтвердите запросы:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Подтвердите, что Full Disk Access + Automation предоставлены для контекста процесса, который запускает OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Указатели на справочник конфигурации

- [Справочник конфигурации - iMessage](/ru/gateway/config-channels#imessage)
- [Конфигурация Gateway](/ru/gateway/configuration)
- [Сопряжение](/ru/channels/pairing)

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Удаление BlueBubbles и путь imsg iMessage](/ru/announcements/bluebubbles-imessage) — объявление и сводка миграции
- [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) — таблица перевода конфигурации и пошаговое переключение
- [Сопряжение](/ru/channels/pairing) — аутентификация DM и поток сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и ограничение по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
