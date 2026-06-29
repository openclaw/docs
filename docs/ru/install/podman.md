---
read_when:
    - Вам нужен контейнеризированный Gateway с Podman вместо Docker
summary: Запустите OpenClaw в контейнере Podman без root-прав
title: Podman
x-i18n:
    generated_at: "2026-06-28T23:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Запустите OpenClaw Gateway в rootless-контейнере Podman, управляемом вашим текущим пользователем без прав root.

Предполагаемая модель:

- Podman запускает контейнер Gateway.
- Ваш хостовый CLI `openclaw` является плоскостью управления.
- Постоянное состояние по умолчанию хранится на хосте в `~/.openclaw`.
- Повседневное управление использует `openclaw --container <name> ...` вместо `sudo -u openclaw`, `podman exec` или отдельного сервисного пользователя.

## Предварительные требования

- **Podman** в rootless-режиме
- **OpenClaw CLI**, установленный на хосте
- **Необязательно:** `systemd --user`, если нужен автозапуск под управлением Quadlet
- **Необязательно:** `sudo`, только если вам нужен `loginctl enable-linger "$(whoami)"` для сохранения запуска после перезагрузки на headless-хосте

## Быстрый старт

<Steps>
  <Step title="Однократная настройка">
    Из корня репозитория выполните `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запустите контейнер Gateway">
    Запустите контейнер с помощью `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запустите onboarding внутри контейнера">
    Выполните `./scripts/run-openclaw-podman.sh launch setup`, затем откройте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Управляйте запущенным контейнером из хостового CLI">
    Задайте `OPENCLAW_CONTAINER=openclaw`, затем используйте обычные команды `openclaw` с хоста.
  </Step>
</Steps>

Детали настройки:

- `./scripts/podman/setup.sh` по умолчанию собирает `openclaw:local` в вашем rootless-хранилище Podman или использует `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, если вы задали одну из этих переменных.
- Он создает `~/.openclaw/openclaw.json` с `gateway.mode: "local"`, если файл отсутствует.
- Он создает `~/.openclaw/.env` с `OPENCLAW_GATEWAY_TOKEN`, если файл отсутствует.
- Для ручных запусков вспомогательный скрипт читает из `~/.openclaw/.env` только небольшой allowlist ключей, связанных с Podman, и передает контейнеру явные переменные окружения runtime; он не передает Podman весь env-файл.

Настройка под управлением Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet доступен только в Linux, потому что зависит от пользовательских служб systemd.

Также можно задать `OPENCLAW_PODMAN_QUADLET=1`.

Необязательные env-переменные сборки/настройки:

- `OPENCLAW_IMAGE` или `OPENCLAW_PODMAN_IMAGE` -- использовать существующий/загруженный образ вместо сборки `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- установить дополнительные apt-пакеты во время сборки образа (также принимает legacy `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- установить дополнительные Python-пакеты во время сборки образа; фиксируйте версии и используйте только те индексы пакетов, которым доверяете
- `OPENCLAW_EXTENSIONS` -- предварительно установить зависимости plugins во время сборки
- `OPENCLAW_INSTALL_BROWSER` -- предварительно установить Chromium и Xvfb для автоматизации браузера (задайте `1`, чтобы включить)

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускает контейнер с вашими текущими uid/gid через `--userns=keep-id` и bind-монтирует ваше состояние OpenClaw в контейнер.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Затем откройте `http://127.0.0.1:18789/` и используйте токен из `~/.openclaw/.env`.

Аутентификация моделей в Podman:

- Используйте аутентификацию под управлением OpenClaw во время настройки: API-ключи Anthropic для Anthropic или браузерную OAuth/device-code-аутентификацию OpenAI Codex для OpenAI на базе Codex.
- Лаунчер Podman не монтирует хостовые домашние каталоги учетных данных CLI, такие как `~/.claude` или `~/.codex`, в контейнер настройки или Gateway.
- Существующие хостовые CLI-логины являются удобными путями на том же хосте. Для контейнерных установок храните аутентификацию провайдера в смонтированном состоянии `~/.openclaw`, которым управляет настройка.

Хостовый CLI по умолчанию:

```bash
export OPENCLAW_CONTAINER=openclaw
```

После этого такие команды будут автоматически выполняться внутри этого контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # включает дополнительное сканирование сервиса
openclaw doctor
openclaw channels login
```

На macOS машина Podman может заставить Gateway считать браузер нелокальным.
Если Control UI после запуска сообщает об ошибках device-auth, используйте рекомендации по Tailscale в
[Podman и Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman и Tailscale

Для HTTPS или удаленного доступа из браузера следуйте основной документации Tailscale.

Примечание, специфичное для Podman:

- Оставляйте хост публикации Podman равным `127.0.0.1`.
- Предпочитайте управляемый хостом `tailscale serve` вместо `openclaw gateway --tailscale serve`.
- На macOS, если локальный контекст device-auth в браузере ненадежен, используйте доступ через Tailscale вместо специальных обходных решений с локальными туннелями.

См.:

- [Tailscale](/ru/gateway/tailscale)
- [Control UI](/ru/web/control-ui)

## Systemd (Quadlet, необязательно)

Если вы выполнили `./scripts/podman/setup.sh --quadlet`, настройка устанавливает файл Quadlet в:

```bash
~/.config/containers/systemd/openclaw.container
```

Полезные команды:

- **Запуск:** `systemctl --user start openclaw.service`
- **Остановка:** `systemctl --user stop openclaw.service`
- **Статус:** `systemctl --user status openclaw.service`
- **Логи:** `journalctl --user -u openclaw.service -f`

После редактирования файла Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для сохранения запуска после перезагрузки на SSH/headless-хостах включите lingering для текущего пользователя:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфигурация, env и хранилище

- **Каталог конфигурации:** `~/.openclaw`
- **Каталог рабочей области:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Вспомогательный скрипт запуска:** `./scripts/run-openclaw-podman.sh`

Скрипт запуска и Quadlet bind-монтируют состояние хоста в контейнер:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

По умолчанию это каталоги хоста, а не анонимное состояние контейнера, поэтому
`openclaw.json`, поагентные `auth-profiles.json`, состояние channels/providers,
сессии и рабочая область сохраняются при замене контейнера.
Настройка Podman также заполняет `gateway.controlUi.allowedOrigins` для `127.0.0.1` и `localhost` на опубликованном порту Gateway, чтобы локальная панель dashboard работала с non-loopback bind контейнера.

Полезные env-переменные для ручного лаунчера:

- `OPENCLAW_PODMAN_CONTAINER` -- имя контейнера (по умолчанию `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуска
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- порт хоста, сопоставленный с контейнерным `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- порт хоста, сопоставленный с контейнерным `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- интерфейс хоста для опубликованных портов; по умолчанию `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим bind Gateway внутри контейнера; по умолчанию `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (по умолчанию), `auto` или `host`

Ручной лаунчер читает `~/.openclaw/.env` перед финализацией значений контейнера/образа по умолчанию, поэтому эти настройки можно сохранить там.

Если вы используете нестандартный `OPENCLAW_CONFIG_DIR` или `OPENCLAW_WORKSPACE_DIR`, задавайте одинаковые переменные как для `./scripts/podman/setup.sh`, так и для последующих команд `./scripts/run-openclaw-podman.sh launch`. Локальный для репозитория лаунчер не сохраняет пользовательские переопределения путей между shell-сессиями.

Примечание Quadlet:

- Сгенерированная служба Quadlet намеренно сохраняет фиксированную усиленную форму по умолчанию: опубликованные порты `127.0.0.1`, `--bind lan` внутри контейнера и пользовательское пространство имен `keep-id`.
- Она фиксирует `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` и `TimeoutStartSec=300`.
- Она публикует как `127.0.0.1:18789:18789` (Gateway), так и `127.0.0.1:18790:18790` (bridge).
- Она читает `~/.openclaw/.env` как runtime `EnvironmentFile` для значений вроде `OPENCLAW_GATEWAY_TOKEN`, но не использует allowlist переопределений, специфичных для Podman, из ручного лаунчера.
- Если вам нужны пользовательские порты публикации, хост публикации или другие флаги запуска контейнера, используйте ручной лаунчер или напрямую отредактируйте `~/.config/containers/systemd/openclaw.container`, затем перезагрузите и перезапустите службу.

## Полезные команды

- **Логи контейнера:** `podman logs -f openclaw`
- **Остановить контейнер:** `podman stop openclaw`
- **Удалить контейнер:** `podman rm -f openclaw`
- **Открыть URL dashboard из хостового CLI:** `openclaw dashboard --no-open`
- **Health/status через хостовый CLI:** `openclaw gateway status --deep` (RPC-зонд + дополнительное
  сканирование сервиса)

## Устранение неполадок

- **Permission denied (EACCES) для конфигурации или рабочей области:** По умолчанию контейнер запускается с `--userns=keep-id` и `--user <your uid>:<your gid>`. Убедитесь, что хостовые пути конфигурации/рабочей области принадлежат вашему текущему пользователю.
- **Запуск Gateway заблокирован (отсутствует `gateway.mode=local`):** Убедитесь, что `~/.openclaw/openclaw.json` существует и задает `gateway.mode="local"`. `scripts/podman/setup.sh` создает его, если он отсутствует.
- **Команды CLI контейнера попадают не в ту цель:** Используйте `openclaw --container <name> ...` явно или экспортируйте `OPENCLAW_CONTAINER=<name>` в своем shell.
- **`openclaw update` завершается ошибкой с `--container`:** Это ожидаемо. Пересоберите/загрузите образ, затем перезапустите контейнер или службу Quadlet.
- **Служба Quadlet не запускается:** Выполните `systemctl --user daemon-reload`, затем `systemctl --user start openclaw.service`. На headless-системах также может понадобиться `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокирует bind mounts:** Не меняйте поведение монтирования по умолчанию; лаунчер автоматически добавляет `:Z` в Linux, когда SELinux работает в enforcing- или permissive-режиме.

## Связанные материалы

- [Docker](/ru/install/docker)
- [Фоновый процесс Gateway](/ru/gateway/background-process)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
