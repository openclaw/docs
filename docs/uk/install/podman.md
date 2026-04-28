---
read_when:
    - Ви хочете контейнеризований Gateway із Podman замість Docker
summary: Запустіть OpenClaw у контейнері Podman без root-прав
title: Podman
x-i18n:
    generated_at: "2026-04-28T20:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Запускайте OpenClaw Gateway у rootless-контейнері Podman, яким керує ваш поточний користувач без прав root.

Передбачена модель така:

- Podman запускає контейнер Gateway.
- Ваш хостовий CLI `openclaw` є площиною керування.
- Сталий стан за замовчуванням зберігається на хості в `~/.openclaw`.
- Повсякденне керування використовує `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого службового користувача.

## Передумови

- **Podman** у режимі rootless
- **CLI OpenClaw**, встановлений на хості
- **Необов’язково:** `systemd --user`, якщо потрібен автозапуск під керуванням Quadlet
- **Необов’язково:** `sudo` лише якщо потрібно `loginctl enable-linger "$(whoami)"` для збереження запуску після завантаження на headless-хості

## Швидкий старт

<Steps>
  <Step title="Одноразове налаштування">
    З кореня репозиторію виконайте `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запуск контейнера Gateway">
    Запустіть контейнер командою `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запуск onboarding усередині контейнера">
    Виконайте `./scripts/run-openclaw-podman.sh launch setup`, потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Керування запущеним контейнером із хостового CLI">
    Установіть `OPENCLAW_CONTAINER=openclaw`, потім використовуйте звичайні команди `openclaw` з хоста.
  </Step>
</Steps>

Деталі налаштування:

- `./scripts/podman/setup.sh` за замовчуванням збирає `openclaw:local` у вашому rootless-сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви задали одну з них.
- Він створює `~/.openclaw/openclaw.json` із `gateway.mode: "local"`, якщо файл відсутній.
- Він створює `~/.openclaw/.env` з `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.
- Для ручних запусків допоміжний скрипт читає з `~/.openclaw/.env` лише невеликий allowlist ключів, пов’язаних із Podman, і передає контейнеру явні змінні середовища виконання; він не передає Podman увесь env-файл.

Налаштування під керуванням Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet є опцією лише для Linux, оскільки залежить від користувацьких служб systemd.

Також можна задати `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові змінні середовища для збірки/налаштування:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використати наявний/завантажений образ замість збирання `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- установити додаткові apt-пакети під час збірки образу
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності плагінів під час збірки
- `OPENCLAW_INSTALL_BROWSER` -- попередньо встановити Chromium і Xvfb для автоматизації браузера (задайте `1`, щоб увімкнути)

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер із вашими поточними uid/gid, використовуючи `--userns=keep-id`, і bind-монтує ваш стан OpenClaw у контейнер.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен із `~/.openclaw/.env`.

Типовий хостовий CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Після цього такі команди автоматично виконуватимуться всередині цього контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

На macOS машина Podman може зробити браузер для Gateway таким, що виглядає не локальним.
Якщо Control UI після запуску повідомляє про помилки автентифікації пристрою, скористайтеся вказівками щодо Tailscale у
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Для HTTPS або віддаленого доступу з браузера дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Залишайте хост публікації Podman на `127.0.0.1`.
- Надавайте перевагу керованому хостом `tailscale serve` замість `openclaw gateway --tailscale serve`.
- На macOS, якщо локальний браузерний контекст автентифікації пристрою ненадійний, використовуйте доступ через Tailscale замість спеціальних обхідних рішень із локальними тунелями.

Дивіться:

- [Tailscale](/uk/gateway/tailscale)
- [Control UI](/uk/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви запускали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet за адресою:

```bash
~/.config/containers/systemd/openclaw.container
```

Корисні команди:

- **Запуск:** `systemctl --user start openclaw.service`
- **Зупинка:** `systemctl --user stop openclaw.service`
- **Стан:** `systemctl --user status openclaw.service`
- **Журнали:** `journalctl --user -u openclaw.service -f`

Після редагування файлу Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для збереження запуску після завантаження на SSH/headless-хостах увімкніть lingering для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, середовище та сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний скрипт запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску та Quadlet bind-монтують хостовий стан у контейнер:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

За замовчуванням це хостові каталоги, а не анонімний стан контейнера, тому
`openclaw.json`, агентні `auth-profiles.json`, стан каналів/провайдерів,
сесії та робочий простір зберігаються після заміни контейнера.
Налаштування Podman також засіває `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту Gateway, щоб локальна dashboard працювала з не-loopback bind контейнера.

Корисні змінні середовища для ручного launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- ім’я контейнера (`openclaw` за замовчуванням)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- хостовий порт, зіставлений із контейнерним `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- хостовий порт, зіставлений із контейнерним `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- хостовий інтерфейс для опублікованих портів; за замовчуванням `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим bind Gateway усередині контейнера; за замовчуванням `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (за замовчуванням), `auto` або `host`

Ручний launcher читає `~/.openclaw/.env` перед остаточним визначенням стандартних значень контейнера/образу, тож ви можете зберегти їх там.

Якщо ви використовуєте нетиповий `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задайте ті самі змінні як для `./scripts/podman/setup.sh`, так і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Репозиторний launcher не зберігає власні перевизначення шляхів між shell-сеансами.

Примітка щодо Quadlet:

- Згенерована служба Quadlet навмисно зберігає фіксовану, посилену стандартну форму: опубліковані порти `127.0.0.1`, `--bind lan` усередині контейнера та простір імен користувача `keep-id`.
- Вона закріплює `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Вона публікує як `127.0.0.1:18789:18789` (Gateway), так і `127.0.0.1:18790:18790` (bridge).
- Вона читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не використовує allowlist Podman-специфічних перевизначень ручного launcher.
- Якщо вам потрібні власні порти публікації, хост публікації або інші прапорці запуску контейнера, використовуйте ручний launcher або редагуйте `~/.config/containers/systemd/openclaw.container` напряму, потім перезавантажте й перезапустіть службу.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL dashboard із хостового CLI:** `openclaw dashboard --no-open`
- **Health/status через хостовий CLI:** `openclaw gateway status --deep` (RPC probe + додаткове
  сканування служби)

## Усунення несправностей

- **Permission denied (EACCES) для конфігурації або робочого простору:** Контейнер за замовчуванням запускається з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що хостові шляхи конфігурації/робочого простору належать вашому поточному користувачу.
- **Запуск Gateway заблоковано (відсутній `gateway.mode=local`):** Переконайтеся, що `~/.openclaw/openclaw.json` існує та задає `gateway.mode="local"`. `scripts/podman/setup.sh` створює це, якщо відсутнє.
- **Команди CLI контейнера потрапляють не в ту ціль:** Використовуйте `openclaw --container <name> ...` явно або експортуйте `OPENCLAW_CONTAINER=<name>` у вашій shell.
- **`openclaw update` завершується з помилкою з `--container`:** Очікувано. Перезберіть/завантажте образ, потім перезапустіть контейнер або службу Quadlet.
- **Служба Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, потім `systemctl --user start openclaw.service`. На headless-системах також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind-монтування:** Не змінюйте стандартну поведінку монтування; launcher автоматично додає `:Z` на Linux, коли SELinux у режимі enforcing або permissive.

## Пов’язане

- [Docker](/uk/install/docker)
- [Фоновий процес Gateway](/uk/gateway/background-process)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
