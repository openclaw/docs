---
read_when:
    - Вам потрібен контейнеризований Gateway із Podman замість Docker
summary: Запускайте OpenClaw у rootless-контейнері Podman
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:42:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Запускайте OpenClaw Gateway у безrootовому контейнері Podman, керованому вашим поточним некореневим користувачем.

Цільова модель така:

- Podman запускає контейнер gateway.
- Ваш хостовий CLI `openclaw` є площиною керування.
- Сталий стан за замовчуванням зберігається на хості в `~/.openclaw`.
- Повсякденне керування використовує `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого службового користувача.

## Передумови

- **Podman** у безrootовому режимі
- **OpenClaw CLI**, установлений на хості
- **Необов’язково:** `systemd --user`, якщо вам потрібен автозапуск, керований Quadlet
- **Необов’язково:** `sudo`, лише якщо вам потрібен `loginctl enable-linger "$(whoami)"` для сталого запуску під час завантаження на безголовому хості

## Швидкий старт

<Steps>
  <Step title="One-time setup">
    З кореня репозиторію виконайте `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Start the Gateway container">
    Запустіть контейнер за допомогою `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Run onboarding inside the container">
    Виконайте `./scripts/run-openclaw-podman.sh launch setup`, а потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Manage the running container from the host CLI">
    Установіть `OPENCLAW_CONTAINER=openclaw`, а потім використовуйте звичайні команди `openclaw` з хоста.
  </Step>
</Steps>

Подробиці налаштування:

- `./scripts/podman/setup.sh` за замовчуванням збирає `openclaw:local` у вашому безrootовому сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви задали одне з них.
- Він створює `~/.openclaw/openclaw.json` з `gateway.mode: "local"`, якщо файл відсутній.
- Він створює `~/.openclaw/.env` з `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.
- Для ручних запусків допоміжний скрипт читає лише невеликий дозволений список пов’язаних із Podman ключів з `~/.openclaw/.env` і передає контейнеру явні змінні середовища виконання; він не передає Podman увесь файл середовища.

Налаштування, кероване Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet доступний лише для Linux, бо залежить від користувацьких служб systemd.

Також можна встановити `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові змінні середовища для збірки/налаштування:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використати наявний/завантажений образ замість збірки `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- установити додаткові пакети apt під час збірки образу (також приймає застарілий `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- установити додаткові пакети Python під час збірки образу; фіксуйте версії та використовуйте лише індекси пакетів, яким довіряєте
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності plugin під час збірки
- `OPENCLAW_INSTALL_BROWSER` -- попередньо встановити Chromium і Xvfb для браузерної автоматизації (установіть `1`, щоб увімкнути)

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер від імені вашого поточного uid/gid з `--userns=keep-id` і монтує стан OpenClaw у контейнер через bind mount.

Початкове налаштування:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен з `~/.openclaw/.env`.

Автентифікація моделей у Podman:

- Використовуйте автентифікацію, керовану OpenClaw, під час налаштування: API-ключі Anthropic для Anthropic або браузерну OAuth/автентифікацію кодом пристрою OpenAI Codex для OpenAI на базі Codex.
- Запускач Podman не монтує домашні каталоги облікових даних хостового CLI, як-от `~/.claude` або `~/.codex`, у контейнер налаштування чи gateway.
- Наявні входи хостового CLI є зручними шляхами на тому самому хості. Для контейнерних установок зберігайте автентифікацію провайдерів у змонтованому стані `~/.openclaw`, яким керує налаштування.

Типове значення для хостового CLI:

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

На macOS машина Podman може змусити браузер виглядати для Gateway нелокальним.
Якщо Control UI повідомляє про помилки автентифікації пристрою після запуску, скористайтеся настановами щодо Tailscale у
[Podman і Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman і Tailscale

Для HTTPS або віддаленого доступу з браузера дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Тримайте хост публікації Podman на `127.0.0.1`.
- Надавайте перевагу керованому хостом `tailscale serve` замість `openclaw gateway --tailscale serve`.
- На macOS, якщо локальний браузерний контекст автентифікації пристрою ненадійний, використовуйте доступ через Tailscale замість ситуативних обхідних локальних тунелів.

Дивіться:

- [Tailscale](/uk/gateway/tailscale)
- [Control UI](/uk/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви виконали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet за шляхом:

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

Для сталого запуску під час завантаження на SSH/безголових хостах увімкніть lingering для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, середовище та сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний скрипт запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску та Quadlet монтують хостовий стан у контейнер через bind mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

За замовчуванням це каталоги хоста, а не анонімний стан контейнера, тому
`openclaw.json`, агентні `auth-profiles.json`, стан каналів/провайдерів,
сеанси та робочий простір зберігаються після заміни контейнера.
Налаштування Podman також початково заповнює `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту Gateway, щоб локальна панель працювала з нелокальним bind контейнера.

Корисні змінні середовища для ручного запускача:

- `OPENCLAW_PODMAN_CONTAINER` -- ім’я контейнера (`openclaw` за замовчуванням)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- порт хоста, зіставлений із контейнерним `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- порт хоста, зіставлений із контейнерним `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- інтерфейс хоста для опублікованих портів; типово `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим bind Gateway всередині контейнера; типово `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (типово), `auto` або `host`

Ручний запускач читає `~/.openclaw/.env` перед фіналізацією типових значень контейнера/образу, тому ви можете зберегти їх там.

Якщо ви використовуєте нестандартний `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задайте ті самі змінні і для `./scripts/podman/setup.sh`, і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Локальний для репозиторію запускач не зберігає перевизначення власних шляхів між shell-сеансами.

Примітка щодо Quadlet:

- Згенерована служба Quadlet навмисно зберігає фіксовану, посилену типову форму: опубліковані порти `127.0.0.1`, `--bind lan` всередині контейнера та простір імен користувача `keep-id`.
- Вона фіксує `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Вона публікує і `127.0.0.1:18789:18789` (gateway), і `127.0.0.1:18790:18790` (bridge).
- Вона читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не споживає дозволений список специфічних для Podman перевизначень ручного запускача.
- Якщо вам потрібні власні порти публікації, хост публікації або інші прапорці запуску контейнера, використовуйте ручний запускач або редагуйте `~/.config/containers/systemd/openclaw.container` безпосередньо, а потім перезавантажте й перезапустіть службу.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL панелі з хостового CLI:** `openclaw dashboard --no-open`
- **Стан/здоров’я через хостовий CLI:** `openclaw gateway status --deep` (RPC-зонд + додаткове
  сканування служб)

## Усунення несправностей

- **Відмовлено в доступі (EACCES) до конфігурації або робочого простору:** За замовчуванням контейнер запускається з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що шляхи конфігурації/робочого простору на хості належать вашому поточному користувачу.
- **Запуск Gateway заблоковано (відсутній `gateway.mode=local`):** Переконайтеся, що `~/.openclaw/openclaw.json` існує і задає `gateway.mode="local"`. `scripts/podman/setup.sh` створює його, якщо він відсутній.
- **Команди CLI контейнера потрапляють не в ту ціль:** Явно використовуйте `openclaw --container <name> ...` або експортуйте `OPENCLAW_CONTAINER=<name>` у вашій shell.
- **`openclaw update` завершується помилкою з `--container`:** Очікувано. Перезберіть/завантажте образ, а потім перезапустіть контейнер або службу Quadlet.
- **Служба Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, а потім `systemctl --user start openclaw.service`. На безголових системах також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind mounts:** Залиште типову поведінку монтування без змін; запускач автоматично додає `:Z` у Linux, коли SELinux у режимі enforcing або permissive.

## Пов’язане

- [Docker](/uk/install/docker)
- [Фоновий процес Gateway](/uk/gateway/background-process)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
