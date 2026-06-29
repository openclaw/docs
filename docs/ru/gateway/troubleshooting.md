---
read_when:
    - Центр устранения неполадок направил вас сюда для более глубокой диагностики
    - Вам нужны стабильные разделы runbook на основе симптомов с точными командами
sidebarTitle: Troubleshooting
summary: Подробный справочник по устранению неполадок для Gateway, каналов, автоматизации, узлов и браузера
title: Устранение неполадок
x-i18n:
    generated_at: "2026-06-28T23:01:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Эта страница — подробный runbook. Начните с [/help/troubleshooting](/ru/help/troubleshooting), если сначала нужен быстрый поток triage.

## Лестница команд

Сначала выполните это, в таком порядке:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ожидаемые признаки исправного состояния:

- `openclaw gateway status` показывает `Runtime: running`, `Connectivity probe: ok` и строку `Capability: ...`.
- `openclaw doctor` не сообщает о блокирующих проблемах конфигурации/сервиса.
- `openclaw channels status --probe` показывает живой статус транспорта по каждому аккаунту и, где поддерживается, результаты probe/audit, такие как `works` или `audit ok`.

## После обновления

Используйте это, когда обновление завершилось, но Gateway не работает, каналы пусты или
вызовы моделей начинают падать с 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Ищите:

- `Update restart` в `openclaw status` / `openclaw status --all`. Ожидающие или
  неудачные handoff включают следующую команду для запуска.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  в разделе Channels. Это означает, что конфигурация канала все еще существует, но регистрация Plugin
  завершилась с ошибкой до того, как канал смог загрузиться.
- provider 401 после повторной авторизации. `openclaw doctor --fix` проверяет устаревшие
  OAuth auth shadows для отдельных агентов и удаляет старые копии, чтобы все агенты разрешали
  текущий общий профиль.

## Split brain установки и защита более новой конфигурации

Используйте это, когда gateway service неожиданно останавливается после обновления или логи показывают, что один бинарный файл `openclaw` старше версии, которая последней записала `openclaw.json`.

OpenClaw помечает записи конфигурации через `meta.lastTouchedVersion`. Команды только для чтения все еще могут просматривать конфигурацию, записанную более новым OpenClaw, но мутации процессов и сервисов отказываются продолжать работу из более старого бинарного файла. Заблокированные действия включают запуск, остановку, перезапуск, удаление gateway service, принудительную переустановку сервиса, запуск Gateway в service-mode и очистку порта через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Исправьте `PATH`, чтобы `openclaw` разрешался в более новую установку, затем повторите действие.
  </Step>
  <Step title="Reinstall the gateway service">
    Переустановите нужный gateway service из более новой установки:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Удалите устаревший системный пакет или старые записи wrapper, которые все еще указывают на старый бинарный файл `openclaw`.
  </Step>
</Steps>

<Warning>
Только для намеренного downgrade или аварийного восстановления задайте `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для одной команды. Оставляйте переменную unset при обычной работе.
</Warning>

## Несовпадение протокола после rollback

Используйте это, когда логи продолжают печатать `protocol mismatch` после downgrade или rollback OpenClaw. Это означает, что работает более старый Gateway, но более новый локальный клиентский процесс все еще пытается переподключиться с диапазоном протокола, который старый Gateway не поддерживает.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Ищите:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` в логах Gateway.
- `Established clients:` в `openclaw gateway status --deep` или `Gateway clients` в `openclaw doctor --deep`. Здесь перечислены активные TCP-клиенты, подключенные к порту Gateway, включая PID и командные строки, когда ОС это позволяет.
- Клиентский процесс, командная строка которого указывает на более новую установку OpenClaw или wrapper, от которого вы откатились.

Исправление:

1. Остановите или перезапустите устаревший клиентский процесс OpenClaw, показанный `gateway status --deep`.
2. Перезапустите приложения или wrapper, которые встраивают OpenClaw, например локальные панели, редакторы, app-server helpers или долго работающие оболочки `openclaw logs --follow`.
3. Повторно выполните `openclaw gateway status --deep` или `openclaw doctor --deep` и убедитесь, что устаревший PID клиента исчез.

Не заставляйте более старый Gateway принимать более новый несовместимый протокол. Повышения версии протокола защищают wire contract; восстановление после rollback — это задача очистки процессов/версий.

## Skill symlink пропущен как выход за пределы пути

Используйте это, когда логи содержат:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw рассматривает каждый корень skill как границу containment. Symlink внутри
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` или
`~/.openclaw/skills` пропускается, когда его реальная цель разрешается за пределами этого корня,
если цель не является явно доверенной.

Проверьте ссылку:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Если цель намеренная, настройте и прямой корень skill, и
разрешенную цель symlink:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Затем начните новую сессию или дождитесь обновления skills watcher. Перезапустите
gateway, если работающий процесс был запущен до изменения конфигурации.

Не используйте широкие цели, такие как `~`, `/` или целую синхронизируемую папку проекта.
Ограничивайте `allowSymlinkTargets` реальным корнем skill, который содержит доверенные
каталоги `SKILL.md`.

Если Skill Workshop apply также должен записывать через эти доверенные symlink-пути
workspace skill, включите `skills.workshop.allowSymlinkTargetWrites`. Оставляйте
это отключенным для общих корней skill только для чтения.

Связано:

- [Конфигурация Skills](/ru/tools/skills-config#symlinked-skill-roots)
- [Примеры конфигурации](/ru/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: требуется extra usage для длинного контекста

Используйте это, когда логи/ошибки содержат: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Ищите:

- Выбранная модель Anthropic — GA-capable модель Claude 4.x с 1M, или у модели есть legacy `params.context1m: true`.
- Текущие учетные данные Anthropic не подходят для использования длинного контекста.
- Запросы падают только в длинных сессиях/запусках модели, которым нужен путь контекста 1M.

Варианты исправления:

<Steps>
  <Step title="Use a standard context window">
    Переключитесь на модель со стандартным окном контекста или удалите legacy `context1m` из старой
    конфигурации модели, которая не является GA-capable для контекста 1M.
  </Step>
  <Step title="Use an eligible credential">
    Используйте учетные данные Anthropic, подходящие для запросов с длинным контекстом, или переключитесь на API-ключ Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Настройте fallback-модели, чтобы запуски продолжались, когда запросы Anthropic с длинным контекстом отклоняются.
  </Step>
</Steps>

Связано:

- [Anthropic](/ru/providers/anthropic)
- [Использование токенов и расходы](/ru/reference/token-use)
- [Почему я вижу HTTP 429 от Anthropic?](/ru/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Ответы upstream 403 blocked

Используйте это, когда upstream LLM provider возвращает общий `403`, например
`Your request was blocked`.

Не предполагайте, что это всегда проблема конфигурации OpenClaw. Ответ может
приходить от upstream security layer, например CDN, WAF, правила bot-management или
reverse proxy перед OpenAI-compatible endpoint.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Ищите:

- несколько моделей у одного provider падают одинаковым образом
- HTML или общий security text вместо нормальной ошибки provider API
- security events на стороне provider в то же время запроса
- маленький прямой probe через `curl` успешен, а обычные SDK-shaped requests падают

Сначала исправьте фильтрацию на стороне provider, когда доказательства указывают на блокировку WAF/CDN.
Предпочитайте узко ограниченное правило allow или skip для API path, который использует OpenClaw,
и избегайте отключения защиты для всего сайта.

<Warning>
Успешный минимальный `curl` не гарантирует, что реальные SDK-style requests
пройдут через тот же upstream security layer.
</Warning>

Связано:

- [OpenAI-compatible endpoints](/ru/gateway/configuration-reference#openai-compatible-endpoints)
- [Конфигурация provider](/ru/providers)
- [Логи](/ru/logging)

## Локальный OpenAI-compatible backend проходит прямые probes, но agent runs падают

Используйте это, когда:

- `curl ... /v1/models` работает
- крошечные прямые вызовы `/v1/chat/completions` работают
- запуски моделей OpenClaw падают только на обычных agent turns

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Ищите:

- прямые крошечные вызовы успешны, но запуски OpenClaw падают только на больших prompts
- ошибки `model_not_found` или 404, хотя прямой `/v1/chat/completions`
  работает с тем же bare model id
- ошибки backend о том, что `messages[].content` ожидает строку
- периодические предупреждения `incomplete turn detected ... stopReason=stop payloads=0` с OpenAI-compatible local backend
- сбои backend, которые появляются только с большими prompt-token counts или полными agent runtime prompts

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` с локальным MLX/vLLM-style server → проверьте, что `baseUrl` включает `/v1`, `api` равен `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` — bare provider-local id. Выбирайте его с префиксом provider один раз, например `mlx/mlx-community/Qwen3-30B-A3B-6bit`; оставьте запись каталога как `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend отклоняет structured Chat Completions content parts. Исправление: задайте `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` или разрешенные ключи сообщений вроде `["role","content"]` → backend отклоняет OpenAI-style replay metadata в сообщениях Chat Completions. Исправление: задайте `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершил запрос Chat Completions, но не вернул видимый пользователю текст assistant для этого turn. OpenClaw один раз повторяет replay-safe empty OpenAI-compatible turns; постоянные сбои обычно означают, что backend выдает empty/non-text content или подавляет текст final-answer.
    - прямые крошечные запросы успешны, но agent runs OpenClaw падают со сбоями backend/model (например Gemma в некоторых сборках `inferrs`) → transport OpenClaw, вероятно, уже корректен; backend падает на более крупной форме prompt agent-runtime.
    - сбои уменьшаются после отключения tools, но не исчезают → tool schemas были частью нагрузки, но оставшаяся проблема все еще связана с емкостью upstream model/server или ошибкой backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Задайте `compat.requiresStringContent: true` для string-only Chat Completions backends.
    2. Задайте `compat.strictMessageKeys: true` для строгих Chat Completions backends, которые принимают только `role` и `content` в каждом сообщении.
    3. Задайте `compat.supportsTools: false` для models/backends, которые не могут надежно обрабатывать поверхность tool schema OpenClaw.
    4. Снизьте prompt pressure, где возможно: меньший workspace bootstrap, более короткая history сессии, более легкая локальная модель или backend с более сильной поддержкой long-context.
    5. Если крошечные прямые запросы продолжают проходить, а agent turns OpenClaw все еще падают внутри backend, рассматривайте это как ограничение upstream server/model и отправьте туда repro с принятой формой payload.
  </Accordion>
</AccordionGroup>

Связано:

- [Конфигурация](/ru/gateway/configuration)
- [Локальные модели](/ru/gateway/local-models)
- [OpenAI-совместимые конечные точки](/ru/gateway/configuration-reference#openai-compatible-endpoints)

## Нет ответов

Если каналы работают, но никто не отвечает, проверьте маршрутизацию и политики, прежде чем что-либо переподключать.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Ищите:

- Ожидание сопряжения для отправителей DM.
- Ограничение упоминаниями в группах (`requireMention`, `mentionPatterns`).
- Несоответствия allowlist канала/группы.

Типичные признаки:

- `drop guild message (mention required` → групповое сообщение игнорируется до упоминания.
- `pairing request` → отправителю нужно одобрение.
- `blocked` / `allowlist` → отправитель/канал был отфильтрован политикой.

Связанные материалы:

- [Устранение неполадок каналов](/ru/channels/troubleshooting)
- [Группы](/ru/channels/groups)
- [Сопряжение](/ru/channels/pairing)

## Подключение пользовательского интерфейса управления Dashboard

Если Dashboard/пользовательский интерфейс управления не подключается, проверьте URL, режим аутентификации и предположения о безопасном контексте.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Ищите:

- Правильный URL проверки и URL Dashboard.
- Несоответствие режима аутентификации/токена между клиентом и gateway.
- Использование HTTP там, где требуется идентификация устройства.

Если локальный браузер не может подключиться к `127.0.0.1:18789` после обновления, сначала
восстановите локальную службу Gateway и убедитесь, что она отдает Dashboard:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Если `curl` возвращает HTML OpenClaw, Gateway работает, а оставшаяся проблема,
вероятно, связана с кешем браузера, старой глубокой ссылкой или устаревшим состоянием вкладки. Откройте
`http://127.0.0.1:18789` напрямую и перейдите из Dashboard. Если перезапуск
не оставляет службу запущенной, выполните `openclaw gateway start` и повторно проверьте
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Признаки подключения / аутентификации">
    - `device identity required` → небезопасный контекст или отсутствует аутентификация устройства.
    - `origin not allowed` → браузерный `Origin` отсутствует в `gateway.controlUi.allowedOrigins` (или вы подключаетесь из браузерного источника не-loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клиент не завершает поток аутентификации устройства на основе challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клиент подписал неправильную полезную нагрузку (или устаревшую метку времени) для текущего handshake.
    - `AUTH_TOKEN_MISMATCH` с `canRetryWithDeviceToken=true` → клиент может выполнить одну доверенную повторную попытку с кешированным токеном устройства.
    - Эта повторная попытка с кешированным токеном повторно использует кешированный набор областей доступа, сохраненный с сопряженным токеном устройства. Вызывающие стороны с явным `deviceToken` / явными `scopes` вместо этого сохраняют запрошенный набор областей доступа.
    - `AUTH_SCOPE_MISMATCH` → токен устройства распознан, но его одобренные области доступа не покрывают этот запрос подключения; повторно сопрягите устройство или одобрите запрошенный контракт областей доступа вместо ротации общего токена gateway.
    - Вне этого пути повторной попытки приоритет аутентификации подключения таков: сначала явный общий токен/пароль, затем явный `deviceToken`, затем сохраненный токен устройства, затем bootstrap-токен.
    - В асинхронном пути Tailscale Serve Control UI неудачные попытки для одного и того же `{scope, ip}` сериализуются до того, как ограничитель записывает сбой. Поэтому две неудачные параллельные повторные попытки от одного клиента могут показать `retry later` при второй попытке вместо двух обычных несовпадений.
    - `too many failed authentication attempts (retry later)` от браузерного клиента loopback → повторные сбои из того же нормализованного `Origin` временно блокируются; другой localhost-источник использует отдельный bucket.
    - повторяющийся `unauthorized` после этой повторной попытки → рассинхронизация общего токена/токена устройства; обновите конфигурацию токена и при необходимости повторно одобрите/ротируйте токен устройства.
    - `gateway connect failed:` → неправильный целевой host/port/url.

  </Accordion>
</AccordionGroup>

### Краткая карта кодов деталей аутентификации

Используйте `error.details.code` из неудачного ответа `connect`, чтобы выбрать следующее действие:

| Код детали                  | Значение                                                                                                                                                                                      | Рекомендуемое действие                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клиент не отправил обязательный общий токен.                                                                                                                                                 | Вставьте/задайте токен в клиенте и повторите попытку. Для путей Dashboard: `openclaw config get gateway.auth.token`, затем вставьте в настройки Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Общий токен не совпал с токеном аутентификации gateway.                                                                                                                                               | Если `canRetryWithDeviceToken=true`, разрешите одну доверенную повторную попытку. Повторные попытки с кешированным токеном повторно используют сохраненные одобренные области доступа; вызывающие стороны с явным `deviceToken` / `scopes` сохраняют запрошенные области доступа. Если сбой сохраняется, выполните [контрольный список восстановления после рассинхронизации токенов](/ru/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешированный токен отдельного устройства устарел или отозван.                                                                                                                                                 | Ротируйте/повторно одобрите токен устройства с помощью [CLI устройств](/ru/cli/devices), затем переподключитесь.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Токен устройства действителен, но его одобренная роль/области доступа не покрывают этот запрос подключения.                                                                                                       | Повторно сопрягите устройство или одобрите запрошенный контракт областей доступа; не трактуйте это как рассинхронизацию общего токена.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Идентификация устройства требует одобрения. Проверьте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` или `metadata-upgrade` и используйте `requestId` / `remediationHint`, если они присутствуют. | Одобрите ожидающий запрос: `openclaw devices list`, затем `openclaw devices approve <requestId>`. Повышения областей доступа/ролей используют тот же поток после проверки запрошенного доступа.                                                                                                               |

<Note>
Прямые loopback RPC backend, аутентифицированные общим токеном/паролем gateway, не должны зависеть от базового уровня областей доступа сопряженного устройства CLI. Если субагенты или другие внутренние вызовы по-прежнему завершаются с ошибкой `scope-upgrade`, проверьте, что вызывающая сторона использует `client.id: "gateway-client"` и `client.mode: "backend"` и не принудительно задает явный `deviceIdentity` или токен устройства.
</Note>

Проверка миграции аутентификации устройства v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Если журналы показывают ошибки nonce/подписи, обновите подключающийся клиент и проверьте его:

<Steps>
  <Step title="Дождитесь connect.challenge">
    Клиент ожидает выданный gateway `connect.challenge`.
  </Step>
  <Step title="Подпишите полезную нагрузку">
    Клиент подписывает полезную нагрузку, привязанную к challenge.
  </Step>
  <Step title="Отправьте nonce устройства">
    Клиент отправляет `connect.params.device.nonce` с тем же nonce challenge.
  </Step>
</Steps>

Если `openclaw devices rotate` / `revoke` / `remove` неожиданно отклоняется:

- сеансы токенов сопряженных устройств могут управлять только **своим собственным** устройством, если у вызывающей стороны также нет `operator.admin`
- `openclaw devices rotate --scope ...` может запрашивать только операторские области доступа, которые уже есть у сеанса вызывающей стороны

Связанные материалы:

- [Конфигурация](/ru/gateway/configuration) (режимы аутентификации gateway)
- [Control UI](/ru/web/control-ui)
- [Устройства](/ru/cli/devices)
- [Удаленный доступ](/ru/gateway/remote)
- [Аутентификация доверенного прокси](/ru/gateway/trusted-proxy-auth)

## Служба Gateway не запущена

Используйте это, когда служба установлена, но процесс не остается запущенным.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Ищите:

- `Runtime: stopped` с подсказками о выходе.
- Несоответствие конфигурации службы (`Config (cli)` и `Config (service)`).
- Конфликты порта/слушателя.
- Дополнительные установки launchd/systemd/schtasks при использовании `--deep`.
- Подсказки по очистке `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Типичные признаки">
    - `Gateway start blocked: set gateway.mode=local` или `existing config is missing gateway.mode` → режим локального gateway не включен, или файл конфигурации был перезаписан и потерял `gateway.mode`. Исправление: задайте `gateway.mode="local"` в конфигурации или повторно выполните `openclaw onboard --mode local` / `openclaw setup`, чтобы заново проставить ожидаемую конфигурацию локального режима. Если вы запускаете OpenClaw через Podman, путь конфигурации по умолчанию — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → привязка не-loopback без допустимого пути аутентификации gateway (токен/пароль или доверенный прокси, если настроен).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфликт порта.
    - `Other gateway-like services detected (best effort)` → существуют устаревшие или параллельные units launchd/systemd/schtasks. В большинстве настроек следует оставлять один gateway на машину; если вам действительно нужно больше одного, изолируйте порты + конфигурацию/состояние/рабочую область. См. [/gateway#multiple-gateways-same-host](/ru/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` от doctor → существует системный unit systemd, а пользовательская служба отсутствует. Удалите или отключите дубликат, прежде чем разрешать doctor установить пользовательскую службу, или задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, если системный unit является предполагаемым supervisor.
    - `Gateway service port does not match current gateway config` → установленный supervisor все еще фиксирует старый `--port`. Выполните `openclaw doctor --fix` или `openclaw gateway install --force`, затем перезапустите службу gateway.

  </Accordion>
</AccordionGroup>

Связанные материалы:

- [Фоновое выполнение и инструмент процессов](/ru/gateway/background-process)
- [Конфигурация](/ru/gateway/configuration)
- [Doctor](/ru/gateway/doctor)

## Gateway на macOS беззвучно перестает отвечать, а затем возобновляет работу, когда вы открываете Dashboard

Используйте это, когда каналы (Telegram, WhatsApp и т. д.) на хосте macOS замолкают на минуты или часы, а gateway, похоже, возвращается в работу в тот момент, когда вы открываете Control UI, входите по SSH или иным образом взаимодействуете с хостом. Обычно в `openclaw status` нет очевидного симптома, потому что к моменту проверки gateway снова работает.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Ищите:

- Один или несколько пакетов `*-uncaught_exception.json` в `~/.openclaw/logs/stability/`, где `error.code` задан как временный сетевой код, например `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` или `ECONNREFUSED`.
- Строки `pmset -g log` вроде `Entering Sleep state due to 'Maintenance Sleep'` или `en0 driver is slow (msg: WillChangeState to 0)`, совпадающие по времени с отметками сбоев. Power Nap / Maintenance Sleep ненадолго переводит драйвер Wi-Fi в состояние 0; любой исходящий `connect()`, попавший в это окно, может завершиться с `ENETDOWN` даже на хосте, который в остальном полностью подключен к сети.
- Вывод `launchctl print`, показывающий `state = not running` с несколькими недавними `runs` и кодом выхода, особенно когда промежуток между сбоем и следующим запуском составляет примерно час, а не секунды. macOS launchd применяет недокументированный защитный механизм от частых перезапусков после серии сбоев, из-за которого `KeepAlive=true` может перестать срабатывать, пока внешний триггер, например интерактивный вход, подключение панели управления или `launchctl kickstart`, не активирует его снова.

Типичные признаки:

- Пакет стабильности, где `error.code` равен `ENETDOWN` или родственному коду, а стек вызовов указывает на Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` и новее классифицирует их как безвредные временные сетевые ошибки, поэтому они больше не передаются в верхнеуровневый обработчик неперехваченных исключений; если у вас более старый выпуск, сначала обновитесь.
- Долгие периоды тишины, которые заканчиваются в момент подключения к Control UI или входа на хост по SSH: видимая пользователю активность повторно активирует защитный механизм перезапуска launchd, а не какие-либо действия панели управления с Gateway.
- Счетчик `runs` увеличивается в течение дня, но в `~/Library/Logs/openclaw/gateway.log` нет соответствующей строки `received SIG*; shutting down`: корректные остановки пишут сигнал в журнал; временные сбои этого не делают.

Что делать:

1. **Обновите Gateway**, если используете выпуск до `2026.5.26`. После обновления будущие ошибки `ENETDOWN` будут записываться как предупреждения, а не завершать процесс.
2. **Сократите активность maintenance sleep** на Mac mini / настольных хостах, которые должны работать как постоянно включенные серверы:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Это значительно уменьшает, но не устраняет полностью базовый сбой драйвера. Система все равно может выполнять некоторые maintenance sleep для TCP keepalive и обслуживания mDNS независимо от этих флагов.

3. **Добавьте сторожевой механизм доступности**, чтобы будущая серия сбоев, остановленная launchd, быстро обнаруживалась:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Смысл в том, чтобы извне повторно активировать защитный механизм перезапуска; одного `KeepAlive=true` на macOS после серии сбоев недостаточно.

Связано:

- [Заметки о платформе macOS](/ru/platforms/macos)
- [Журналирование](/ru/logging)
- [Doctor](/ru/gateway/doctor)

## Gateway завершается при высоком использовании памяти

Используйте это, когда Gateway исчезает под нагрузкой, супервизор сообщает о перезапуске в стиле OOM или в журналах упоминается `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Ищите:

- `Reason: diagnostic.memory.pressure.critical` в последнем пакете стабильности.
- `Memory pressure:` с `critical/rss_threshold`, `critical/heap_threshold` или `critical/rss_growth`.
- Значения `V8 heap:`, близкие к лимиту кучи.
- Записи `Largest session files:`, например `agents/<agent>/sessions/<session>.jsonl` или `sessions/<session>.jsonl`.
- Счетчики памяти Linux cgroup, когда Gateway работает внутри контейнера или службы с ограничением памяти.

Типичные признаки:

- `critical memory pressure bundle written` появляется незадолго до перезапуска → OpenClaw записал пред-OOM пакет стабильности. Проверьте его с помощью `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` появляется в журналах Gateway → OpenClaw обнаружил критическое давление памяти, но пред-OOM снимок стабильности отключен.
- `Largest session files:` указывает на очень большой путь отредактированной стенограммы → уменьшите сохраняемую историю сессий, проверьте рост сессии или переместите старые стенограммы из активного хранилища перед перезапуском.
- Использованные байты `V8 heap:` близки к лимиту кучи → снизьте нагрузку от prompts/сессий, уменьшите параллельную работу или увеличьте лимит кучи Node только после подтверждения, что такая рабочая нагрузка ожидаема.
- `Memory pressure: critical/rss_growth` → память быстро выросла в пределах одного окна выборки. Проверьте последние журналы на крупный импорт, неконтролируемый вывод инструмента, повторяющиеся повторы или пакет поставленных в очередь задач агента.
- Критическое давление памяти появляется в журналах, но пакет отсутствует → это поведение по умолчанию. Установите `diagnostics.memoryPressureSnapshot: true`, чтобы при будущих событиях критического давления памяти записывать пред-OOM пакет стабильности.

Пакет стабильности не содержит полезной нагрузки. Он включает операционные свидетельства по памяти и отредактированные относительные пути файлов, но не текст сообщений, тела webhook, учетные данные, токены, cookies или сырые идентификаторы сессий. Прикладывайте экспорт диагностики к отчетам об ошибках вместо копирования сырых журналов.

Связано:

- [Состояние Gateway](/ru/gateway/health)
- [Экспорт диагностики](/ru/gateway/diagnostics)
- [Сессии](/ru/cli/sessions)

## Gateway отклонил недействительную конфигурацию

Используйте это, когда запуск Gateway завершается с `Invalid config` или журналы горячей перезагрузки сообщают,
что недействительное изменение было пропущено.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Ищите:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Файл `openclaw.json.rejected.*` с отметкой времени рядом с активной конфигурацией
- Файл `openclaw.json.clobbered.*` с отметкой времени, если `doctor --fix` исправил сломанную прямую правку
- OpenClaw хранит последние 32 файла `.clobbered.*` для каждого пути конфигурации и ротирует более старые

<AccordionGroup>
  <Accordion title="What happened">
    - Конфигурация не прошла проверку при запуске, горячей перезагрузке или записи, выполняемой OpenClaw.
    - Запуск Gateway завершается закрыто, без перезаписи `openclaw.json`.
    - Горячая перезагрузка пропускает недействительные внешние изменения и оставляет активной текущую runtime-конфигурацию.
    - Записи, выполняемые OpenClaw, отклоняют недействительные/разрушительные полезные нагрузки перед коммитом и сохраняют `.rejected.*`.
    - `openclaw doctor --fix` отвечает за исправление. Он может удалить не-JSON-префиксы или восстановить последнюю заведомо рабочую копию, сохранив отклоненную полезную нагрузку как `.clobbered.*`.
    - Когда для одного пути конфигурации выполняется много исправлений, OpenClaw ротирует старые файлы `.clobbered.*`, чтобы самая новая исправленная полезная нагрузка оставалась доступной.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` существует → doctor сохранил сломанную внешнюю правку при исправлении активной конфигурации.
    - `.rejected.*` существует → запись конфигурации, выполняемая OpenClaw, не прошла проверку схемы или защиты от перезаписи перед коммитом.
    - `Config write rejected:` → запись пыталась удалить обязательную структуру, резко уменьшить файл или сохранить недействительную конфигурацию.
    - `config reload skipped (invalid config):` → прямая правка не прошла проверку и была проигнорирована работающим Gateway.
    - `Invalid config at ...` → запуск завершился до старта служб Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` или `size-drop-vs-last-good:*` → запись, выполняемая OpenClaw, была отклонена, потому что потеряла поля или размер по сравнению с последней заведомо рабочей резервной копией.
    - `Config last-known-good promotion skipped` → кандидат содержал отредактированные заполнители секретов, например `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Запустите `openclaw doctor --fix`, чтобы doctor исправил конфигурацию с префиксом/перезаписью или восстановил последнюю заведомо рабочую.
    2. Скопируйте только нужные ключи из `.clobbered.*` или `.rejected.*`, затем примените их с помощью `openclaw config set` или `config.patch`.
    3. Запустите `openclaw config validate` перед перезапуском.
    4. Если редактируете вручную, сохраняйте полную конфигурацию JSON5, а не только частичный объект, который хотели изменить.
  </Accordion>
</AccordionGroup>

Связано:

- [Конфигурация](/ru/cli/config)
- [Конфигурация: горячая перезагрузка](/ru/gateway/configuration#config-hot-reload)
- [Конфигурация: строгая проверка](/ru/gateway/configuration#strict-validation)
- [Doctor](/ru/gateway/doctor)

## Предупреждения пробы Gateway

Используйте это, когда `openclaw gateway probe` достигает чего-то, но все равно выводит блок предупреждения.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Ищите:

- `warnings[].code` и `primaryTargetId` в выводе JSON.
- Относится ли предупреждение к резервному SSH-пути, нескольким Gateway, отсутствующим scopes или неразрешенным ссылкам auth.

Типичные признаки:

- `SSH tunnel failed to start; falling back to direct probes.` → настройка SSH не удалась, но команда все равно попробовала прямые настроенные/loopback цели.
- `multiple reachable gateway identities detected` → ответили разные Gateway, или OpenClaw не смог доказать, что достижимые цели являются одним и тем же Gateway. SSH-туннель, proxy URL или настроенный удаленный URL к тому же Gateway считается одним Gateway с несколькими транспортами, даже если порты транспортов различаются.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → подключение сработало, но подробный RPC ограничен scope; свяжите идентификатор устройства или используйте учетные данные с `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → подключение сработало, но полный набор диагностических RPC истек по тайм-ауту или завершился ошибкой. Рассматривайте это как достижимый Gateway с ухудшенной диагностикой; сравните `connect.ok` и `connect.rpcOk` в выводе `--json`.
- `Capability: pairing-pending` или `gateway closed (1008): pairing required` → Gateway ответил, но этому клиенту все еще требуется pairing/approval перед обычным операторским доступом.
- Текст предупреждения о неразрешенных `gateway.auth.*` / `gateway.remote.*` SecretRef → материал auth был недоступен в этом пути команды для неудачной цели.

Связано:

- [Gateway](/ru/cli/gateway)
- [Несколько Gateway на одном хосте](/ru/gateway#multiple-gateways-same-host)
- [Удаленный доступ](/ru/gateway/remote)

## Канал подключен, но сообщения не проходят

Если состояние канала подключено, но поток сообщений не работает, сосредоточьтесь на policy, разрешениях и правилах доставки, специфичных для канала.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Ищите:

- Policy для DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групп и требования mention.
- Отсутствующие разрешения/scopes API канала.

Типичные признаки:

- `mention required` → сообщение проигнорировано policy упоминаний в группе.
- `pairing` / следы ожидающего approval → отправитель не одобрен.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема auth/разрешений канала.

Связано:

- [Устранение неполадок каналов](/ru/channels/troubleshooting)
- [Discord](/ru/channels/discord)
- [Telegram](/ru/channels/telegram)
- [WhatsApp](/ru/channels/whatsapp)

## Доставка Cron и Heartbeat

Если Cron или Heartbeat не выполнился или не доставился, сначала проверьте состояние планировщика, затем цель доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Проверьте:

- Cron включен и указано следующее пробуждение.
- Статус истории запусков задания (`ok`, `skipped`, `error`).
- Причины пропуска Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Распространенные сигнатуры">
    - `cron: scheduler disabled; jobs will not run automatically` → cron отключен.
    - `cron: timer tick failed` → сбой такта планировщика; проверьте ошибки файлов, логов или среды выполнения.
    - `heartbeat skipped` с `reason=quiet-hours` → вне окна активных часов.
    - `heartbeat skipped` с `reason=empty-heartbeat-file` → `HEARTBEAT.md` существует, но содержит только пустые строки, комментарий, заголовок, блок кода или каркас пустого чек-листа, поэтому OpenClaw пропускает вызов модели.
    - `heartbeat skipped` с `reason=no-tasks-due` → `HEARTBEAT.md` содержит блок `tasks:`, но ни одна задача не должна выполняться на этом такте.
    - `heartbeat: unknown accountId` → недопустимый идентификатор аккаунта для целевого получателя Heartbeat.
    - `heartbeat skipped` с `reason=dm-blocked` → цель Heartbeat определена как назначение в стиле личного сообщения, а `agents.defaults.heartbeat.directPolicy` (или переопределение для агента) задано как `block`.

  </Accordion>
</AccordionGroup>

Связанные разделы:

- [Heartbeat](/ru/gateway/heartbeat)
- [Запланированные задачи](/ru/automation/cron-jobs)
- [Запланированные задачи: устранение неполадок](/ru/automation/cron-jobs#troubleshooting)

## Node сопряжен, инструмент не работает

Если узел сопряжен, но инструменты не работают, изолируйте состояние переднего плана, разрешений и одобрений.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Проверьте:

- Node онлайн с ожидаемыми возможностями.
- Разрешения ОС для камеры, микрофона, местоположения и экрана.
- Состояние одобрений exec и allowlist.

Распространенные сигнатуры:

- `NODE_BACKGROUND_UNAVAILABLE` → приложение узла должно быть на переднем плане.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → отсутствует разрешение ОС.
- `SYSTEM_RUN_DENIED: approval required` → ожидается одобрение exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команда заблокирована allowlist.

Связанные разделы:

- [Одобрения exec](/ru/tools/exec-approvals)
- [Устранение неполадок Node](/ru/nodes/troubleshooting)
- [Nodes](/ru/nodes/index)

## Инструмент браузера не работает

Используйте это, когда действия инструмента браузера не выполняются, хотя сам Gateway исправен.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Проверьте:

- Задан ли `plugins.allow` и включает ли он `browser`.
- Действительный путь к исполняемому файлу браузера.
- Доступность профиля CDP.
- Доступность локального Chrome для профилей `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатуры Plugin / исполняемого файла">
    - `unknown command "browser"` или `unknown command 'browser'` → встроенный Plugin браузера исключен через `plugins.allow`.
    - инструмент браузера отсутствует / недоступен при `browser.enabled=true` → `plugins.allow` исключает `browser`, поэтому Plugin не загрузился.
    - `Failed to start Chrome CDP on port` → не удалось запустить процесс браузера.
    - `browser.executablePath not found` → настроенный путь недействителен.
    - `browser.cdpUrl must be http(s) or ws(s)` → настроенный URL CDP использует неподдерживаемую схему, например `file:` или `ftp:`.
    - `browser.cdpUrl has invalid port` → настроенный URL CDP содержит неверный порт или порт вне допустимого диапазона.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → в текущей установке Gateway отсутствует основная зависимость среды выполнения браузера; переустановите или обновите OpenClaw, затем перезапустите Gateway. Снимки ARIA и базовые скриншоты страниц все еще могут работать, но навигация, AI-снимки, скриншоты элементов по CSS-селекторам и экспорт PDF остаются недоступны.

  </Accordion>
  <Accordion title="Сигнатуры Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session пока не смог подключиться к выбранному каталогу данных браузера. Откройте страницу инспектирования браузера, включите удаленную отладку, оставьте браузер открытым, подтвердите первый запрос на подключение, затем повторите попытку. Если состояние входа в аккаунт не требуется, предпочитайте управляемый профиль `openclaw`.
    - `No Chrome tabs found for profile="user"` → в профиле подключения Chrome MCP нет открытых локальных вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → настроенная удаленная конечная точка CDP недоступна с хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` или `Browser attachOnly is enabled and CDP websocket ... is not reachable` → у профиля только для подключения нет доступной цели, либо HTTP-конечная точка ответила, но WebSocket CDP все равно не удалось открыть.

  </Accordion>
  <Accordion title="Сигнатуры элемента / скриншота / загрузки">
    - `fullPage is not supported for element screenshots` → запрос скриншота совместил `--full-page` с `--ref` или `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → вызовы скриншотов Chrome MCP / `existing-session` должны использовать захват страницы или `--ref` из снимка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам загрузки Chrome MCP нужны ссылки снимков, а не CSS-селекторы.
    - `existing-session file uploads currently support one file at a time.` → отправляйте одну загрузку за вызов в профилях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки диалогов в профилях Chrome MCP не поддерживают переопределение тайм-аута.
    - `existing-session type does not support timeoutMs overrides.` → опустите `timeoutMs` для `act:type` в профилях `profile="user"` / Chrome MCP existing-session или используйте управляемый/CDP-профиль браузера, когда требуется пользовательский тайм-аут.
    - `existing-session evaluate does not support timeoutMs overrides.` → опустите `timeoutMs` для `act:evaluate` в профилях `profile="user"` / Chrome MCP existing-session или используйте управляемый/CDP-профиль браузера, когда требуется пользовательский тайм-аут.
    - `response body is not supported for existing-session profiles yet.` → для `responsebody` по-прежнему требуется управляемый браузер или сырой профиль CDP.
    - устаревшие переопределения области просмотра / темного режима / локали / офлайн-режима в профилях только для подключения или удаленных CDP-профилях → выполните `openclaw browser stop --browser-profile <name>`, чтобы закрыть активный сеанс управления и освободить состояние эмуляции Playwright/CDP без перезапуска всего Gateway.

  </Accordion>
</AccordionGroup>

Связанные разделы:

- [Браузер (управляемый OpenClaw)](/ru/tools/browser)
- [Устранение неполадок браузера](/ru/tools/browser-linux-troubleshooting)

## Если вы обновились и что-то внезапно сломалось

Большинство поломок после обновления связано с дрейфом конфигурации или с тем, что теперь применяются более строгие значения по умолчанию.

<AccordionGroup>
  <Accordion title="1. Поведение аутентификации и переопределения URL изменилось">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Что проверить:

    - Если `gateway.mode=remote`, вызовы CLI могут быть направлены на удаленный адрес, хотя ваш локальный сервис исправен.
    - Явные вызовы с `--url` не откатываются к сохраненным учетным данным.

    Распространенные сигнатуры:

    - `gateway connect failed:` → неверная целевая URL.
    - `unauthorized` → конечная точка доступна, но аутентификация неверна.

  </Accordion>
  <Accordion title="2. Защитные ограничения привязки и аутентификации стали строже">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Что проверить:

    - Привязки не к loopback (`lan`, `tailnet`, `custom`) требуют действительного пути аутентификации Gateway: аутентификации по общему токену/паролю или корректно настроенного развертывания `trusted-proxy` не к loopback.
    - Старые ключи вроде `gateway.token` не заменяют `gateway.auth.token`.

    Распространенные сигнатуры:

    - `refusing to bind gateway ... without auth` → привязка не к loopback без действительного пути аутентификации Gateway.
    - `Connectivity probe: failed` при работающей среде выполнения → Gateway жив, но недоступен с текущими auth/url.

  </Accordion>
  <Accordion title="3. Состояние сопряжения и идентичности устройства изменилось">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Что проверить:

    - Ожидающие одобрения устройств для панели управления/узлов.
    - Ожидающие одобрения сопряжения DM после изменений политики или идентичности.

    Распространенные сигнатуры:

    - `device identity required` → аутентификация устройства не выполнена.
    - `pairing required` → отправитель/устройство должны быть одобрены.

  </Accordion>
</AccordionGroup>

Если конфигурация сервиса и среда выполнения после проверок все еще расходятся, переустановите метаданные сервиса из того же профиля/каталога состояния:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Связанные разделы:

- [Аутентификация](/ru/gateway/authentication)
- [Фоновый exec и инструмент процесса](/ru/gateway/background-process)
- [Сопряжение, управляемое Gateway](/ru/gateway/pairing)

## Связанные разделы

- [Doctor](/ru/gateway/doctor)
- [FAQ](/ru/help/faq)
- [Runbook Gateway](/ru/gateway)
