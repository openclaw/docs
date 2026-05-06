---
read_when:
    - Вам потрібен контейнеризований Gateway із Podman замість Docker
summary: Запустіть OpenClaw у контейнері Podman без root-прав
title: Podman
x-i18n:
    generated_at: "2026-05-06T01:09:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

Запустіть OpenClaw Gateway у rootless-контейнері Podman, керованому вашим поточним некореневим користувачем.

Передбачена модель така:

- Podman запускає контейнер Gateway.
- Ваш хостовий CLI `openclaw` є площиною керування.
- Постійний стан за замовчуванням зберігається на хості в `~/.openclaw`.
- Повсякденне керування використовує `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого службового користувача.

## Передумови

- **Podman** у rootless-режимі
- **OpenClaw CLI**, установлений на хості
- **Необов’язково:** `systemd --user`, якщо потрібен автозапуск під керуванням Quadlet
- **Необов’язково:** `sudo` лише якщо потрібен `loginctl enable-linger "$(whoami)"` для збереження запуску після завантаження на headless-хості

## Швидкий старт

<Steps>
  <Step title="Одноразове налаштування">
    З кореня репозиторію запустіть `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запустіть контейнер Gateway">
    Запустіть контейнер командою `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запустіть onboarding усередині контейнера">
    Запустіть `./scripts/run-openclaw-podman.sh launch setup`, а потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Керуйте запущеним контейнером із хостового CLI">
    Установіть `OPENCLAW_CONTAINER=openclaw`, а потім використовуйте звичайні команди `openclaw` з хоста.
  </Step>
</Steps>

Деталі налаштування:

- `./scripts/podman/setup.sh` за замовчуванням збирає `openclaw:local` у вашому rootless-сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви задали одне з них.
- Він створює `~/.openclaw/openclaw.json` із `gateway.mode: "local"`, якщо файл відсутній.
- Він створює `~/.openclaw/.env` із `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.
- Для ручних запусків допоміжний скрипт читає лише невеликий allowlist пов’язаних із Podman ключів із `~/.openclaw/.env` і передає явні змінні середовища виконання до контейнера; він не передає повний env-файл до Podman.

Налаштування під керуванням Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet є варіантом лише для Linux, оскільки залежить від користувацьких служб systemd.

Також можна встановити `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові env-змінні для збірки/налаштування:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використати наявний/завантажений образ замість збирання `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- установити додаткові apt-пакети під час збирання образу
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності Plugin під час збирання
- `OPENCLAW_INSTALL_BROWSER` -- попередньо встановити Chromium і Xvfb для браузерної автоматизації (установіть `1`, щоб увімкнути)

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер із вашим поточним uid/gid за допомогою `--userns=keep-id` і bind-монтує ваш стан OpenClaw у контейнер.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен із `~/.openclaw/.env`.

Типове значення для хостового CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Після цього такі команди автоматично запускатимуться всередині цього контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

На macOS машина Podman може зробити браузер видимим для Gateway як нелокальний.
Якщо інтерфейс керування повідомляє про помилки автентифікації пристрою після запуску, скористайтеся вказівками щодо Tailscale у
[Podman і Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman і Tailscale

Для HTTPS або віддаленого доступу з браузера дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Залишайте хост публікації Podman на `127.0.0.1`.
- Надавайте перевагу керованому хостом `tailscale serve` замість `openclaw gateway --tailscale serve`.
- На macOS, якщо контекст автентифікації пристрою для локального браузера ненадійний, використовуйте доступ через Tailscale замість ad hoc обхідних рішень із локальними тунелями.

Дивіться:

- [Tailscale](/uk/gateway/tailscale)
- [Інтерфейс керування](/uk/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви запускали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet за адресою:

```bash
~/.config/containers/systemd/openclaw.container
```

Корисні команди:

- **Запустити:** `systemctl --user start openclaw.service`
- **Зупинити:** `systemctl --user stop openclaw.service`
- **Стан:** `systemctl --user status openclaw.service`
- **Журнали:** `journalctl --user -u openclaw.service -f`

Після редагування файлу Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для збереження запуску після завантаження на SSH/headless-хостах увімкніть lingering для вашого поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, env і сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний скрипт запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску та Quadlet bind-монтують стан хоста в контейнер:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

За замовчуванням це каталоги хоста, а не анонімний стан контейнера, тому
`openclaw.json`, агентські `auth-profiles.json`, стан каналів/провайдерів,
сесії та робочий простір переживають заміну контейнера.
Налаштування Podman також попередньо заповнює `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту Gateway, щоб локальна панель керування працювала з non-loopback bind контейнера.

Корисні env-змінні для ручного запуску:

- `OPENCLAW_PODMAN_CONTAINER` -- назва контейнера (`openclaw` за замовчуванням)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- порт хоста, зіставлений із контейнерним `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- порт хоста, зіставлений із контейнерним `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- інтерфейс хоста для опублікованих портів; за замовчуванням `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим bind Gateway усередині контейнера; за замовчуванням `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (за замовчуванням), `auto` або `host`

Ручний запуск читає `~/.openclaw/.env` перед остаточним визначенням типових значень контейнера/образу, тому ви можете зберігати їх там.

Якщо ви використовуєте нетиповий `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, установіть ті самі змінні як для `./scripts/podman/setup.sh`, так і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Repo-local launcher не зберігає власні перевизначення шляхів між shell-сесіями.

Примітка щодо Quadlet:

- Згенерована служба Quadlet навмисно зберігає фіксовану, посилену типову форму: опубліковані порти `127.0.0.1`, `--bind lan` усередині контейнера та простір імен користувача `keep-id`.
- Вона фіксує `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Вона публікує і `127.0.0.1:18789:18789` (Gateway), і `127.0.0.1:18790:18790` (міст).
- Вона читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не використовує Podman-специфічний allowlist перевизначень ручного запуску.
- Якщо вам потрібні власні порти публікації, хост публікації або інші прапорці запуску контейнера, використовуйте ручний запуск або відредагуйте `~/.config/containers/systemd/openclaw.container` напряму, а потім перезавантажте й перезапустіть службу.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL панелі керування з хостового CLI:** `openclaw dashboard --no-open`
- **Health/status через хостовий CLI:** `openclaw gateway status --deep` (RPC-зонд + додаткове
  сканування служб)

## Усунення несправностей

- **Permission denied (EACCES) для конфігурації або робочого простору:** Контейнер за замовчуванням працює з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що шляхи конфігурації/робочого простору на хості належать вашому поточному користувачу.
- **Запуск Gateway заблоковано (відсутній `gateway.mode=local`):** Переконайтеся, що `~/.openclaw/openclaw.json` існує та встановлює `gateway.mode="local"`. `scripts/podman/setup.sh` створює це, якщо відсутнє.
- **Команди CLI контейнера потрапляють у неправильну ціль:** Використовуйте `openclaw --container <name> ...` явно або експортуйте `OPENCLAW_CONTAINER=<name>` у вашому shell.
- **`openclaw update` завершується помилкою з `--container`:** Це очікувано. Перезберіть/завантажте образ, а потім перезапустіть контейнер або службу Quadlet.
- **Служба Quadlet не запускається:** Запустіть `systemctl --user daemon-reload`, потім `systemctl --user start openclaw.service`. На headless-системах також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind-монтування:** Залиште типову поведінку монтування без змін; launcher автоматично додає `:Z` на Linux, коли SELinux перебуває в режимі enforcing або permissive.

## Пов’язане

- [Docker](/uk/install/docker)
- [Фоновий процес Gateway](/uk/gateway/background-process)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
