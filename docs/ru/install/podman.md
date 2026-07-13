---
read_when:
    - Вам нужен контейнеризированный Gateway с Podman вместо Docker
summary: Запуск OpenClaw в контейнере Podman без прав root
title: Podman
x-i18n:
    generated_at: "2026-07-13T19:54:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Запустите Gateway OpenClaw в rootless-контейнере Podman под управлением текущего непривилегированного пользователя.

Модель работы:

- Podman запускает контейнер Gateway.
- Установленный на хосте `openclaw` CLI служит плоскостью управления.
- По умолчанию постоянное состояние хранится на хосте в `~/.openclaw`.
- Для повседневного управления используется `openclaw --container <name> ...`, а не `sudo -u openclaw`, `podman exec` или отдельный служебный пользователь.

## Предварительные требования

- **Podman** в rootless-режиме
- **OpenClaw CLI**, установленный на хосте
- **Необязательно:** `systemd --user`, если нужен автоматический запуск под управлением Quadlet
- **Необязательно:** `sudo`, только если нужен `loginctl enable-linger "$(whoami)"` для сохранения запуска после перезагрузки на хосте без графического интерфейса

## Быстрый старт

<Steps>
  <Step title="Однократная настройка">
    В корне репозитория выполните `./scripts/podman/setup.sh`.

    Эта команда собирает `openclaw:local` в вашем rootless-хранилище Podman (либо загружает `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, если они заданы), создаёт `~/.openclaw/openclaw.json` с `gateway.mode: "local"`, если файл отсутствует, и создаёт `~/.openclaw/.env` со сгенерированным `OPENCLAW_GATEWAY_TOKEN`, если файл отсутствует.

    Необязательные переменные среды времени сборки:

    | Переменная | Действие |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Использовать существующий или загруженный образ вместо сборки `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Установить дополнительные пакеты apt при сборке образа (также поддерживается устаревшая переменная `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Установить дополнительные пакеты Python при сборке образа; фиксируйте версии и используйте только доверенные индексы пакетов |
    | `OPENCLAW_EXTENSIONS` | Скомпилировать и упаковать выбранные поддерживаемые плагины, а также установить их зависимости времени выполнения |
    | `OPENCLAW_INSTALL_BROWSER` | Предварительно установить Chromium и Xvfb для автоматизации браузера (задайте значение `1`) |

    Чтобы вместо этого использовать настройку под управлением Quadlet (только Linux и пользовательские службы systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Либо задайте `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Запустите контейнер Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Запускает контейнер с uid/gid текущего пользователя и `--userns=keep-id`, а также подключает состояние OpenClaw в контейнер через bind-монтирование.

  </Step>

  <Step title="Выполните первоначальную настройку внутри контейнера">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Затем откройте `http://127.0.0.1:18789/` и используйте токен из `~/.openclaw/.env`.

    Аутентификация модели: во время настройки используйте аутентификацию под управлением OpenClaw (API-ключи Anthropic либо браузерную OAuth-аутентификацию OpenAI Codex или аутентификацию по коду устройства для OpenAI на базе Codex). Средство запуска Podman не монтирует каталоги учётных данных CLI хоста, такие как `~/.claude` или `~/.codex`, в контейнер настройки или Gateway. Существующие входы через CLI хоста предназначены только для удобства на том же хосте — при установке в контейнере храните данные аутентификации провайдера в смонтированном состоянии `~/.openclaw`, которым управляет настройка.

  </Step>

  <Step title="Управляйте работающим контейнером через CLI хоста">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    После этого обычные команды `openclaw` автоматически выполняются внутри этого контейнера:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # включает дополнительное сканирование служб
    openclaw doctor
    openclaw channels login
    ```

    В macOS из-за виртуальной машины Podman браузер может определяться Gateway как удалённый. Если после запуска интерфейс управления сообщает об ошибках аутентификации устройства, следуйте рекомендациям по Tailscale в разделе [Podman и Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Средство ручного запуска считывает из `~/.openclaw/.env` только небольшой список разрешённых ключей, связанных с Podman, и передаёт контейнеру явные переменные среды времени выполнения; полный файл среды в Podman не передаётся.

<a id="podman-and-tailscale"></a>

## Podman и Tailscale

Для доступа по HTTPS или через удалённый браузер следуйте основной документации Tailscale.

Примечания, относящиеся к Podman:

- Оставьте адрес публикации Podman равным `127.0.0.1`.
- Предпочитайте управляемый хостом `tailscale serve` вместо `openclaw gateway --tailscale serve`.
- В macOS, если контекст аутентификации устройства в локальном браузере работает ненадёжно, используйте доступ через Tailscale вместо нестандартных обходных решений с локальными туннелями.

См. [Tailscale](/ru/gateway/tailscale) и [интерфейс управления](/ru/web/control-ui).

## Systemd (Quadlet, необязательно)

Если вы выполнили `./scripts/podman/setup.sh --quadlet`, программа настройки устанавливает файл Quadlet в `~/.config/containers/systemd/openclaw.container`.

| Действие | Команда                                    |
| ------ | ------------------------------------------ |
| Запуск  | `systemctl --user start openclaw.service`  |
| Остановка   | `systemctl --user stop openclaw.service`   |
| Состояние | `systemctl --user status openclaw.service` |
| Журналы   | `journalctl --user -u openclaw.service -f` |

После изменения файла Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Чтобы служба запускалась после перезагрузки на хостах с доступом по SSH или без графического интерфейса, включите lingering для текущего пользователя:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Сгенерированная служба Quadlet сохраняет фиксированную конфигурацию по умолчанию с усиленной защитой: `127.0.0.1` опубликованных портов (`18789` для Gateway, `18790` для моста), `--bind lan` внутри контейнера, пространство имён пользователя `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` и `TimeoutStartSec=300`. Она считывает `~/.openclaw/.env` как `EnvironmentFile` времени выполнения для таких значений, как `OPENCLAW_GATEWAY_TOKEN`, но не использует список разрешённых переопределений Podman из средства ручного запуска. Чтобы настроить порты публикации, адрес публикации или другие флаги запуска контейнера, используйте средство ручного запуска либо измените `~/.config/containers/systemd/openclaw.container` напрямую, а затем перезагрузите конфигурацию и перезапустите службу.

## Конфигурация, среда и хранилище

- **Каталог конфигурации:** `~/.openclaw`
- **Каталог рабочего пространства:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Вспомогательное средство запуска:** `./scripts/run-openclaw-podman.sh`

Сценарий запуска и Quadlet монтируют состояние хоста в контейнер: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. По умолчанию это каталоги хоста, а не анонимное состояние контейнера, поэтому `openclaw.json`, относящиеся к отдельным агентам `auth-profiles.json`, состояние каналов и провайдеров, сеансы и рабочее пространство сохраняются после замены контейнера. Настройка также заполняет `gateway.controlUi.allowedOrigins` для `127.0.0.1` и `localhost` на опубликованном порту Gateway, чтобы локальная панель управления работала с привязкой контейнера не к loopback-интерфейсу.

Полезные переменные среды для средства ручного запуска (сохраняйте их в `~/.openclaw/.env`; средство запуска считывает этот файл перед окончательным определением параметров контейнера и образа по умолчанию):

| Переменная                                        | Значение по умолчанию          | Действие                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Имя контейнера                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Запускаемый образ                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Порт хоста, сопоставленный с портом контейнера `18789`  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Порт хоста, сопоставленный с портом контейнера `18790`  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Интерфейс хоста для опубликованных портов     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Режим привязки Gateway внутри контейнера |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` или `host`           |

Если вы используете нестандартное значение `OPENCLAW_CONFIG_DIR` или `OPENCLAW_WORKSPACE_DIR`, задавайте те же переменные как для команд `./scripts/podman/setup.sh`, так и для последующих команд `./scripts/run-openclaw-podman.sh launch` — локальное средство запуска из репозитория не сохраняет пользовательские переопределения путей между сеансами оболочки.

## Обновление образов

После сборки или загрузки нового образа перезапустите контейнер либо службу Quadlet.
При первом запуске новой версии OpenClaw Gateway выполняет безопасное восстановление
состояния и плагинов, прежде чем сообщить о готовности.

Если Gateway завершается вместо перехода в состояние готовности, один раз запустите тот же образ
с `openclaw doctor --fix` и теми же смонтированными состоянием и конфигурацией, а затем перезапустите
Gateway в обычном режиме:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

На хостах с SELinux добавьте `,Z` к обоим bind-монтированиям, если Podman блокирует доступ к
смонтированному состоянию.

## Полезные команды

- **Журналы контейнера:** `podman logs -f openclaw`
- **Остановка контейнера:** `podman stop openclaw`
- **Удаление контейнера:** `podman rm -f openclaw`
- **Открытие URL панели управления через CLI хоста:** `openclaw dashboard --no-open`
- **Проверка работоспособности и состояния через CLI хоста:** `openclaw gateway status --deep` (RPC-проверка и дополнительное сканирование служб)

## Устранение неполадок

- **Отказано в доступе (EACCES) к конфигурации или рабочему пространству:** По умолчанию контейнер запускается с `--userns=keep-id` и `--user <your uid>:<your gid>`. Убедитесь, что каталоги конфигурации и рабочего пространства на хосте принадлежат текущему пользователю.
- **Запуск Gateway заблокирован (отсутствует `gateway.mode=local`):** Убедитесь, что `~/.openclaw/openclaw.json` существует и задаёт `gateway.mode="local"`. Команда `scripts/podman/setup.sh` создаёт его, если он отсутствует.
- **Контейнер перезапускается после обновления образа:** Выполните однократную команду `openclaw doctor --fix` из раздела [Обновление образов](#upgrading-images), а затем снова запустите Gateway.
- **Команды CLI контейнера обращаются не к тому объекту:** Явно используйте `openclaw --container <name> ...` либо экспортируйте `OPENCLAW_CONTAINER=<name>` в оболочке.
- **Сбой `openclaw update` с ошибкой `--container`:** Это ожидаемо. Пересоберите или загрузите образ, затем перезапустите контейнер либо службу Quadlet.
- **Служба Quadlet не запускается:** Выполните `systemctl --user daemon-reload`, затем `systemctl --user start openclaw.service`. В системах без графического интерфейса также может потребоваться `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокирует bind-монтирования:** Не изменяйте стандартное поведение монтирования; в Linux средство запуска автоматически добавляет `:Z`, когда SELinux работает в принудительном или разрешительном режиме.

## Связанные материалы

- [Docker](/ru/install/docker)
- [Фоновый процесс Gateway](/ru/gateway/background-process)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
