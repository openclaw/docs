---
read_when:
    - Ви хочете контейнеризований gateway з Podman замість Docker
summary: Запустити OpenClaw у rootless-контейнері Podman
title: Podman
x-i18n:
    generated_at: "2026-04-23T20:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

Запустіть Gateway OpenClaw у rootless-контейнері Podman, яким керує ваш поточний користувач без root.

Запланована модель така:

- Podman запускає контейнер gateway.
- Ваш хостовий CLI `openclaw` є control plane.
- Постійний стан типово зберігається на хості в `~/.openclaw`.
- Щоденне керування виконується через `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого користувача служби.

## Передумови

- **Podman** у rootless-режимі
- **OpenClaw CLI** встановлений на хості
- **Необов’язково:** `systemd --user`, якщо ви хочете автозапуск із керуванням через Quadlet
- **Необов’язково:** `sudo`, лише якщо ви хочете `loginctl enable-linger "$(whoami)"` для збереження після перезавантаження на headless-хості

## Швидкий старт

<Steps>
  <Step title="Одноразове налаштування">
    З кореня repo запустіть `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запустіть контейнер Gateway">
    Запустіть контейнер через `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запустіть онбординг усередині контейнера">
    Виконайте `./scripts/run-openclaw-podman.sh launch setup`, потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Керуйте запущеним контейнером із хостового CLI">
    Установіть `OPENCLAW_CONTAINER=openclaw`, а потім використовуйте звичайні команди `openclaw` з хоста.
  </Step>
</Steps>

Деталі налаштування:

- `./scripts/podman/setup.sh` типово збирає `openclaw:local` у вашому rootless-сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви їх задали.
- Він створює `~/.openclaw/openclaw.json` з `gateway.mode: "local"`, якщо файл відсутній.
- Він створює `~/.openclaw/.env` з `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.
- Для ручних запусків допоміжний скрипт читає лише невеликий allowlist ключів, пов’язаних із Podman, з `~/.openclaw/.env` і передає явні env vars runtime до контейнера; він не передає Podman увесь env-файл.

Налаштування з керуванням через Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet — це лише Linux-варіант, оскільки він залежить від служб користувача systemd.

Ви також можете задати `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові env vars для build/setup:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використовувати наявний/завантажений образ замість збирання `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- встановити додаткові apt-пакети під час збирання образу
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності Plugin під час build

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер від вашого поточного uid/gid з `--userns=keep-id` і bind-mount-ить ваш стан OpenClaw у контейнер.

Онбординг:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен з `~/.openclaw/.env`.

Типове значення для хостового CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Тоді такі команди автоматично виконуватимуться всередині цього контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

На macOS Podman machine може зробити браузер для gateway нелокальним.
Якщо після запуску Control UI повідомляє про помилки device-auth, скористайтеся вказівками Tailscale в
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Для HTTPS або віддаленого доступу з браузера дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Залишайте Podman publish host на `127.0.0.1`.
- Надавайте перевагу `tailscale serve`, яким керує хост, замість `openclaw gateway --tailscale serve`.
- На macOS, якщо контекст device-auth локального браузера ненадійний, використовуйте доступ через Tailscale замість тимчасових локальних обхідних тунелів.

Див.:

- [Tailscale](/uk/gateway/tailscale)
- [Control UI](/uk/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви запускали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet за адресою:

```bash
~/.config/containers/systemd/openclaw.container
```

Корисні команди:

- **Запустити:** `systemctl --user start openclaw.service`
- **Зупинити:** `systemctl --user stop openclaw.service`
- **Стан:** `systemctl --user status openclaw.service`
- **Логи:** `journalctl --user -u openclaw.service -f`

Після редагування файла Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для збереження після перезавантаження на SSH/headless-хостах увімкніть lingering для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, env і сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний скрипт запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску й Quadlet bind-mount-ять стан хоста в контейнер:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Типово це каталоги хоста, а не анонімний стан контейнера, тому
`openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів,
сесії та робочий простір переживають заміну контейнера.
Налаштування Podman також ініціалізує `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту gateway, щоб локальна панель працювала з не-loopback-прив’язкою контейнера.

Корисні env vars для ручного launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- ім’я контейнера (типово `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- хостовий порт, зіставлений із контейнерним `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- хостовий порт, зіставлений із контейнерним `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- хостовий інтерфейс для опублікованих портів; типово `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим прив’язки gateway усередині контейнера; типово `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (типово), `auto` або `host`

Ручний launcher читає `~/.openclaw/.env` перед остаточним визначенням типових значень контейнера/образу, тож ви можете зберігати їх там.

Якщо ви використовуєте нетиповий `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задайте ті самі змінні і для `./scripts/podman/setup.sh`, і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Launcher з локального repo не зберігає перевизначення користувацьких шляхів між оболонками.

Примітка щодо Quadlet:

- Згенерована служба Quadlet навмисно зберігає фіксовану, посилену типову форму: опубліковані порти на `127.0.0.1`, `--bind lan` усередині контейнера та простір імен користувача `keep-id`.
- Вона фіксує `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Вона публікує і `127.0.0.1:18789:18789` (gateway), і `127.0.0.1:18790:18790` (bridge).
- Вона читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не використовує allowlist Podman-специфічних перевизначень із ручного launcher.
- Якщо вам потрібні власні publish ports, publish host або інші прапорці запуску контейнера, використовуйте ручний launcher або безпосередньо відредагуйте `~/.config/containers/systemd/openclaw.container`, а потім перезавантажте й перезапустіть службу.

## Корисні команди

- **Логи контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL панелі з хостового CLI:** `openclaw dashboard --no-open`
- **Health/status через хостовий CLI:** `openclaw gateway status --deep` (RPC probe + додаткове
  сканування служб)

## Усунення проблем

- **Permission denied (EACCES) для конфігурації або робочого простору:** Контейнер типово запускається з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що шляхи конфігурації/робочого простору на хості належать вашому поточному користувачу.
- **Запуск Gateway заблоковано (немає `gateway.mode=local`):** Переконайтеся, що `~/.openclaw/openclaw.json` існує і має `gateway.mode="local"`. `scripts/podman/setup.sh` створює це, якщо файл відсутній.
- **Команди CLI контейнера звертаються не до тієї цілі:** Явно використовуйте `openclaw --container <name> ...` або експортуйте `OPENCLAW_CONTAINER=<name>` у вашій оболонці.
- **`openclaw update` не працює з `--container`:** Це очікувано. Перезберіть/перезавантажте образ, а потім перезапустіть контейнер або службу Quadlet.
- **Служба Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, потім `systemctl --user start openclaw.service`. На headless-системах вам також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind mounts:** Не змінюйте типову поведінку монтування; launcher автоматично додає `:Z` у Linux, коли SELinux працює в режимі enforcing або permissive.

## Пов’язане

- [Docker](/uk/install/docker)
- [Gateway background process](/uk/gateway/background-process)
- [Gateway troubleshooting](/uk/gateway/troubleshooting)
