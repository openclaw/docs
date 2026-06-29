---
read_when:
    - Настройка нового компьютера
    - Вы хотите получить «самое новое и лучшее», не нарушая свою личную конфигурацию
summary: Расширенная настройка и рабочие процессы разработки для OpenClaw
title: Настройка
x-i18n:
    generated_at: "2026-06-28T23:48:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Если вы настраиваете OpenClaw впервые, начните с раздела [Начало работы](/ru/start/getting-started).
Подробности об онбординге см. в разделе [Онбординг (CLI)](/ru/start/wizard).
</Note>

## Кратко

Выберите рабочий процесс настройки в зависимости от того, как часто вы хотите получать обновления и хотите ли запускать Gateway самостоятельно:

- **Индивидуальная настройка живет вне репозитория:** храните конфигурацию и рабочую область в `~/.openclaw/openclaw.json` и `~/.openclaw/workspace/`, чтобы обновления репозитория их не затрагивали.
- **Стабильный рабочий процесс (рекомендуется большинству):** установите приложение для macOS и позвольте ему запускать встроенный Gateway.
- **Рабочий процесс на переднем крае (dev):** запустите Gateway самостоятельно через `pnpm gateway:watch`, затем позвольте приложению macOS подключиться в локальном режиме.

## Предварительные требования (из исходного кода)

- Рекомендуется Node 24 (Node 22 LTS, сейчас `22.19+`, все еще поддерживается)
- Для checkout из исходного кода требуется `pnpm`. В режиме разработки OpenClaw загружает встроенные plugins из пакетов рабочей области pnpm
  `extensions/*`, поэтому корневой `npm install` не подготавливает полное дерево исходного кода.
- Docker (необязательно; только для контейнерной настройки/e2e - см. [Docker](/ru/install/docker))

## Стратегия индивидуальной настройки (чтобы обновления не вредили)

Если вам нужна «настройка на 100% под меня» _и_ простые обновления, храните свои изменения в:

- **Конфигурация:** `~/.openclaw/openclaw.json` (JSON/похоже на JSON5)
- **Рабочая область:** `~/.openclaw/workspace` (skills, prompts, memories; сделайте ее приватным git-репозиторием)

Первичная инициализация один раз:

```bash
openclaw setup
```

Изнутри этого репозитория используйте локальную точку входа CLI:

```bash
openclaw setup
```

Если глобальная установка еще отсутствует, запустите через `pnpm openclaw setup`.

## Запуск Gateway из этого репозитория

После `pnpm build` можно запустить упакованный CLI напрямую:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабильный рабочий процесс (сначала приложение macOS)

1. Установите и запустите **OpenClaw.app** (строка меню).
2. Завершите контрольный список онбординга/разрешений (запросы TCC).
3. Убедитесь, что Gateway находится в режиме **Local** и запущен (приложение управляет им).
4. Свяжите поверхности (пример: WhatsApp):

```bash
openclaw channels login
```

5. Проверка работоспособности:

```bash
openclaw health
```

Если онбординг недоступен в вашей сборке:

- Выполните `openclaw setup`, затем `openclaw channels login`, затем запустите Gateway вручную (`openclaw gateway`).

## Рабочий процесс на переднем крае (Gateway в терминале)

Цель: работать над TypeScript Gateway, получать горячую перезагрузку и держать UI приложения macOS подключенным.

### 0) (Необязательно) Запустите приложение macOS из исходного кода тоже

Если вы также хотите использовать приложение macOS на переднем крае:

```bash
./scripts/restart-mac.sh
```

### 1) Запустите dev Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускает или перезапускает процесс наблюдения Gateway в именованной сессии tmux
и автоматически подключается из интерактивных терминалов. Неинтерактивные оболочки остаются
отсоединенными и печатают `tmux attach -t openclaw-gateway-watch-main`; используйте
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, чтобы интерактивный запуск оставался
отсоединенным, или `pnpm gateway:watch:raw` для режима наблюдения на переднем плане. Наблюдатель
перезагружается при релевантных изменениях исходного кода, конфигурации и метаданных встроенных plugins. Если
наблюдаемый Gateway завершится во время запуска, `gateway:watch` один раз выполнит
`openclaw doctor --fix --non-interactive` и повторит попытку; задайте
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, чтобы отключить этот проход исправления только для разработки.
`pnpm openclaw setup` — это одноразовый шаг инициализации локальной конфигурации/рабочей области для свежего checkout.
`pnpm gateway:watch` не пересобирает `dist/control-ui`, поэтому повторно выполните `pnpm ui:build` после изменений в `ui/` или используйте `pnpm ui:dev` при разработке Control UI.

### 2) Направьте приложение macOS на ваш запущенный Gateway

В **OpenClaw.app**:

- Режим подключения: **Local**
  Приложение подключится к запущенному Gateway на настроенном порту.

### 3) Проверьте

- В приложении статус Gateway должен показывать **"Используется существующий gateway …"**
- Или через CLI:

```bash
openclaw health
```

### Частые ошибки

- **Неверный порт:** WS Gateway по умолчанию использует `ws://127.0.0.1:18789`; держите приложение и CLI на одном порту.
- **Где хранится состояние:**
  - Состояние канала/провайдера: `~/.openclaw/credentials/`
  - Профили аутентификации модели: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сессии: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Карта хранения учетных данных

Используйте это при отладке аутентификации или принятии решения, что резервировать:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env или `channels.telegram.tokenFile` (только обычный файл; symlinks отклоняются)
- **Токен бота Discord**: config/env или SecretRef (провайдеры env/file/exec)
- **Токены Slack**: config/env (`channels.slack.*`)
- **Списки разрешенных для сопряжения**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (учетная запись по умолчанию)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (учетные записи не по умолчанию)
- **Профили аутентификации модели**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Файловая полезная нагрузка секретов (необязательно)**: `~/.openclaw/secrets.json`
- **Импорт устаревшего OAuth**: `~/.openclaw/credentials/oauth.json`
  Подробнее: [Безопасность](/ru/gateway/security#credential-storage-map).

## Обновление (без разрушения вашей настройки)

- Держите `~/.openclaw/workspace` и `~/.openclaw/` как «ваши материалы»; не помещайте личные prompts/config в репозиторий `openclaw`.
- Обновление исходного кода: `git pull` + `pnpm install` + продолжайте использовать `pnpm gateway:watch`.

## Linux (пользовательский сервис systemd)

Установки Linux используют **пользовательский** сервис systemd. По умолчанию systemd останавливает пользовательские
сервисы при выходе/простое, что завершает Gateway. Онбординг пытается включить
lingering за вас (может запросить sudo). Если он все еще выключен, выполните:

```bash
sudo loginctl enable-linger $USER
```

Для постоянно включенных или многопользовательских серверов рассмотрите **системный** сервис вместо
пользовательского сервиса (lingering не нужен). См. [runbook Gateway](/ru/gateway) с примечаниями по systemd.

## Связанная документация

- [runbook Gateway](/ru/gateway) (флаги, супервизия, порты)
- [Конфигурация Gateway](/ru/gateway/configuration) (схема конфигурации + примеры)
- [Discord](/ru/channels/discord) и [Telegram](/ru/channels/telegram) (теги ответа + настройки replyToMode)
- [Настройка помощника OpenClaw](/ru/start/openclaw)
- [Приложение macOS](/ru/platforms/macos) (жизненный цикл gateway)
