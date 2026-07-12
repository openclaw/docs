---
read_when:
    - Вам нужен контейнеризованный Gateway на базе Podman вместо Docker
summary: Запуск OpenClaw в контейнере Podman без прав root
title: Podman
x-i18n:
    generated_at: "2026-07-12T11:29:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Запустите OpenClaw Gateway в rootless-контейнере Podman под управлением текущего непривилегированного пользователя.

Модель работы:

- Podman запускает контейнер Gateway.
- Установленный на хосте CLI `openclaw` служит плоскостью управления.
- По умолчанию постоянное состояние хранится на хосте в `~/.openclaw`.
- Для повседневного управления используется `openclaw --container <name> ...` вместо `sudo -u openclaw`, `podman exec` или отдельного системного пользователя.

## Предварительные требования

- **Podman** в rootless-режиме
- **CLI OpenClaw**, установленный на хосте
- **Необязательно:** `systemd --user`, если требуется автоматический запуск под управлением Quadlet
- **Необязательно:** `sudo`, только если требуется выполнить `loginctl enable-linger "$(whoami)"` для сохранения автозапуска после загрузки на хосте без графического интерфейса

## Быстрый старт

<Steps>
  <Step title="One-time setup">
    В корне репозитория выполните `./scripts/podman/setup.sh`.

    Команда собирает `openclaw:local` в вашем rootless-хранилище Podman (либо загружает `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, если переменная задана), при отсутствии создаёт `~/.openclaw/openclaw.json` с `gateway.mode: "local"` и `~/.openclaw/.env` со сгенерированным значением `OPENCLAW_GATEWAY_TOKEN`.

    Необязательные переменные окружения времени сборки:

    | Переменная | Назначение |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Использовать существующий или загруженный образ вместо сборки `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Установить дополнительные пакеты apt при сборке образа (также поддерживается устаревшая переменная `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Установить дополнительные пакеты Python при сборке образа; фиксируйте версии и используйте только доверенные индексы пакетов |
    | `OPENCLAW_EXTENSIONS` | Скомпилировать и упаковать выбранные поддерживаемые плагины, а также установить их зависимости среды выполнения |
    | `OPENCLAW_INSTALL_BROWSER` | Предварительно установить Chromium и Xvfb для автоматизации браузера (задайте значение `1`) |

    Чтобы вместо этого использовать конфигурацию под управлением Quadlet (только Linux и пользовательские службы systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Либо задайте `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Start the Gateway container">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Запускает контейнер с uid/gid текущего пользователя, используя `--userns=keep-id`, и подключает состояние OpenClaw к контейнеру через bind-монтирование.

  </Step>

  <Step title="Run onboarding inside the container">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Затем откройте `http://127.0.0.1:18789/` и используйте токен из `~/.openclaw/.env`.

    Аутентификация модели: во время настройки используйте аутентификацию под управлением OpenClaw (ключи API Anthropic либо браузерную OAuth-аутентификацию или аутентификацию по коду устройства OpenAI Codex для OpenAI на основе Codex). Средство запуска Podman не подключает каталоги учётных данных хостового CLI, такие как `~/.claude` или `~/.codex`, к контейнеру настройки или Gateway. Существующие входы через хостовый CLI удобны только при работе на том же хосте — для контейнерных установок храните данные аутентификации провайдера в подключённом состоянии `~/.openclaw`, которым управляет процесс настройки.

  </Step>

  <Step title="Manage the running container from the host CLI">
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

    В macOS из-за виртуальной машины Podman браузер может определяться Gateway как нелокальный. Если после запуска интерфейс управления сообщает об ошибках аутентификации устройства, следуйте рекомендациям по Tailscale в разделе [Podman и Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Ручное средство запуска считывает из `~/.openclaw/.env` только небольшой разрешённый список параметров, относящихся к Podman, и передаёт контейнеру явные переменные окружения среды выполнения; полный файл окружения в Podman не передаётся.

<a id="podman-and-tailscale"></a>

## Podman и Tailscale

Для доступа по HTTPS или удалённого доступа через браузер следуйте основной документации по Tailscale.

Примечания для Podman:

- Оставьте адрес публикации Podman равным `127.0.0.1`.
- Предпочитайте управляемую хостом команду `tailscale serve` вместо `openclaw gateway --tailscale serve`.
- В macOS, если контекст аутентификации устройства в локальном браузере работает ненадёжно, используйте доступ через Tailscale вместо специальных обходных решений с локальными туннелями.

См. [Tailscale](/ru/gateway/tailscale) и [интерфейс управления](/ru/web/control-ui).

## Systemd (Quadlet, необязательно)

Если вы выполнили `./scripts/podman/setup.sh --quadlet`, средство настройки устанавливает файл Quadlet в `~/.config/containers/systemd/openclaw.container`.

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

Чтобы служба сохраняла автозапуск после загрузки на хостах с доступом по SSH или без графического интерфейса, включите длительное выполнение пользовательских служб для текущего пользователя:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Созданная служба Quadlet использует фиксированную конфигурацию по умолчанию с усиленной защитой: порты, опубликованные на `127.0.0.1` (`18789` для Gateway, `18790` для моста), `--bind lan` внутри контейнера, пространство имён пользователя `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` и `TimeoutStartSec=300`. Она считывает `~/.openclaw/.env` как `EnvironmentFile` среды выполнения для таких значений, как `OPENCLAW_GATEWAY_TOKEN`, но не использует разрешённый список переопределений Podman, относящийся к ручному средству запуска. Для пользовательских портов публикации, адреса публикации или других флагов запуска контейнера используйте ручное средство запуска либо напрямую измените `~/.config/containers/systemd/openclaw.container`, а затем перезагрузите конфигурацию и перезапустите службу.

## Конфигурация, окружение и хранилище

- **Каталог конфигурации:** `~/.openclaw`
- **Каталог рабочего пространства:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Вспомогательный скрипт запуска:** `./scripts/run-openclaw-podman.sh`

Скрипт запуска и Quadlet подключают состояние хоста к контейнеру через bind-монтирование: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. По умолчанию это каталоги хоста, а не анонимное состояние контейнера, поэтому `openclaw.json`, файлы `auth-profiles.json` отдельных агентов, состояние каналов и провайдеров, сеансы и рабочее пространство сохраняются при замене контейнера. Средство настройки также добавляет в `gateway.controlUi.allowedOrigins` адреса `127.0.0.1` и `localhost` с опубликованным портом Gateway, чтобы локальная панель управления работала, когда контейнер использует привязку не к local loopback.

Полезные переменные окружения для ручного средства запуска (сохраните их в `~/.openclaw/.env`; средство запуска считывает этот файл перед окончательным определением значений контейнера и образа по умолчанию):

| Переменная                                        | Значение по умолчанию          | Назначение                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Имя контейнера                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Запускаемый образ                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Порт хоста, сопоставленный с портом контейнера `18789`  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Порт хоста, сопоставленный с портом контейнера `18790`  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Интерфейс хоста для опубликованных портов     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Режим привязки Gateway внутри контейнера |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` или `host`           |

Если вы используете нестандартное значение `OPENCLAW_CONFIG_DIR` или `OPENCLAW_WORKSPACE_DIR`, задавайте одинаковые переменные как для `./scripts/podman/setup.sh`, так и для последующих команд `./scripts/run-openclaw-podman.sh launch` — локальное средство запуска из репозитория не сохраняет пользовательские переопределения путей между сеансами оболочки.

## Обновление образов

После пересборки или загрузки нового образа перезапустите контейнер или службу Quadlet.
При первом запуске новой версии OpenClaw Gateway выполняет безопасное исправление состояния и
плагинов, прежде чем сообщить о готовности.

Если Gateway завершает работу вместо перехода в состояние готовности, один раз запустите тот же образ с
`openclaw doctor --fix`, используя то же подключённое состояние и конфигурацию, а затем перезапустите
Gateway обычным способом:

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
подключённому состоянию.

## Полезные команды

- **Журналы контейнера:** `podman logs -f openclaw`
- **Остановить контейнер:** `podman stop openclaw`
- **Удалить контейнер:** `podman rm -f openclaw`
- **Открыть URL панели управления из хостового CLI:** `openclaw dashboard --no-open`
- **Проверить работоспособность и состояние через хостовый CLI:** `openclaw gateway status --deep` (RPC-проверка + дополнительное сканирование служб)

## Устранение неполадок

- **Отказано в доступе (EACCES) к конфигурации или рабочему пространству:** По умолчанию контейнер запускается с `--userns=keep-id` и `--user <your uid>:<your gid>`. Убедитесь, что каталоги конфигурации и рабочего пространства на хосте принадлежат текущему пользователю.
- **Запуск Gateway заблокирован (отсутствует `gateway.mode=local`):** Убедитесь, что файл `~/.openclaw/openclaw.json` существует и содержит `gateway.mode="local"`. Если файл отсутствует, `scripts/podman/setup.sh` создаёт его.
- **Контейнер перезапускается после обновления образа:** Выполните одноразовую команду `openclaw doctor --fix` из раздела [Обновление образов](#upgrading-images), затем снова запустите Gateway.
- **Команды CLI контейнера обращаются не к тому целевому объекту:** Явно используйте `openclaw --container <name> ...` либо экспортируйте `OPENCLAW_CONTAINER=<name>` в оболочке.
- **Команда `openclaw update` завершается ошибкой с `--container`:** Это ожидаемое поведение. Пересоберите или загрузите образ, затем перезапустите контейнер или службу Quadlet.
- **Служба Quadlet не запускается:** Выполните `systemctl --user daemon-reload`, затем `systemctl --user start openclaw.service`. В системах без графического интерфейса также может потребоваться `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокирует bind-монтирования:** Не изменяйте поведение монтирования по умолчанию; в Linux средство запуска автоматически добавляет `:Z`, когда SELinux работает в принудительном или разрешающем режиме.

## Связанные материалы

- [Docker](/ru/install/docker)
- [Фоновый процесс Gateway](/ru/gateway/background-process)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
