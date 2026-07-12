---
read_when:
    - Вам потрібен контейнеризований Gateway із Podman замість Docker
summary: Запуск OpenClaw у контейнері Podman без прав root
title: Podman
x-i18n:
    generated_at: "2026-07-12T13:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Запускайте OpenClaw Gateway у безпривілейованому контейнері Podman, яким керує поточний користувач без прав root.

Модель роботи:

- Podman запускає контейнер Gateway.
- Встановлений на хості CLI `openclaw` слугує площиною керування.
- За замовчуванням постійні дані зберігаються на хості в `~/.openclaw`.
- Для повсякденного керування використовуйте `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого службового користувача.

## Передумови

- **Podman** у безпривілейованому режимі
- **CLI OpenClaw**, установлений на хості
- **Необов’язково:** `systemd --user`, якщо потрібен автоматичний запуск під керуванням Quadlet
- **Необов’язково:** `sudo`, лише якщо потрібно виконати `loginctl enable-linger "$(whoami)"` для збереження автозапуску після завантаження на хості без графічного інтерфейсу

## Швидкий початок

<Steps>
  <Step title="Одноразове налаштування">
    У корені репозиторію виконайте `./scripts/podman/setup.sh`.

    Ця команда збирає `openclaw:local` у вашому безпривілейованому сховищі Podman (або завантажує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо змінну задано), створює `~/.openclaw/openclaw.json` із `gateway.mode: "local"`, якщо файл відсутній, і створює `~/.openclaw/.env` зі згенерованим `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.

    Необов’язкові змінні середовища для етапу збирання:

    | Змінна | Дія |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Використовувати наявний або завантажений образ замість збирання `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Установити додаткові пакети apt під час збирання образу (також приймає застарілу змінну `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Установити додаткові пакети Python під час збирання образу; фіксуйте версії та використовуйте лише надійні індекси пакетів |
    | `OPENCLAW_EXTENSIONS` | Скомпілювати й запакувати вибрані підтримувані плагіни та встановити їхні залежності середовища виконання |
    | `OPENCLAW_INSTALL_BROWSER` | Попередньо встановити Chromium і Xvfb для автоматизації браузера (задайте `1`) |

    Натомість для налаштування під керуванням Quadlet (лише Linux і користувацькі служби systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Або задайте `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Запуск контейнера Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Запускає контейнер із поточними uid/gid, параметром `--userns=keep-id` і монтує стан OpenClaw із хоста в контейнер.

  </Step>

  <Step title="Початкове налаштування всередині контейнера">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Потім відкрийте `http://127.0.0.1:18789/` і скористайтеся токеном із `~/.openclaw/.env`.

    Автентифікація моделі: під час налаштування використовуйте автентифікацію, якою керує OpenClaw (ключі API Anthropic або браузерну OAuth-автентифікацію чи автентифікацію за кодом пристрою OpenAI Codex для OpenAI на базі Codex). Засіб запуску Podman не монтує каталоги облікових даних CLI хоста, як-от `~/.claude` або `~/.codex`, у контейнер налаштування чи Gateway. Наявні входи через CLI хоста — це лише зручні способи роботи на тому самому хості; для встановлень у контейнері зберігайте автентифікаційні дані постачальника в підключеному стані `~/.openclaw`, яким керує налаштування.

  </Step>

  <Step title="Керування запущеним контейнером із CLI хоста">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Після цього звичайні команди `openclaw` автоматично виконуватимуться всередині цього контейнера:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # включає додаткове сканування служб
    openclaw doctor
    openclaw channels login
    ```

    У macOS віртуальна машина Podman може призвести до того, що браузер виглядатиме для Gateway як нелокальний. Якщо після запуску Control UI повідомляє про помилки автентифікації пристрою, скористайтеся рекомендаціями щодо Tailscale у розділі [Podman і Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Ручний засіб запуску читає з `~/.openclaw/.env` лише невеликий дозволений список ключів, пов’язаних із Podman, і передає контейнеру явно визначені змінні середовища виконання; він не передає Podman увесь файл середовища.

<a id="podman-and-tailscale"></a>

## Podman і Tailscale

Для доступу через HTTPS або віддалений браузер дотримуйтеся основної документації Tailscale.

Примітки щодо Podman:

- Залишайте адресу публікації Podman рівною `127.0.0.1`.
- Віддавайте перевагу керованій хостом команді `tailscale serve`, а не `openclaw gateway --tailscale serve`.
- У macOS, якщо контекст автентифікації пристрою в локальному браузері працює ненадійно, використовуйте доступ через Tailscale замість тимчасових обхідних рішень із локальними тунелями.

Див. [Tailscale](/uk/gateway/tailscale) і [Control UI](/uk/web/control-ui).

## Systemd (Quadlet, необов’язково)

Якщо ви виконали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet у `~/.config/containers/systemd/openclaw.container`.

| Дія    | Команда                                    |
| ------ | ------------------------------------------ |
| Запуск | `systemctl --user start openclaw.service`  |
| Зупинка | `systemctl --user stop openclaw.service`   |
| Стан   | `systemctl --user status openclaw.service` |
| Журнали | `journalctl --user -u openclaw.service -f` |

Після редагування файлу Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Щоб автозапуск зберігався після завантаження на хостах із доступом через SSH або без графічного інтерфейсу, увімкніть тривале виконання для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Згенерована служба Quadlet зберігає фіксовану, посилену за замовчуванням конфігурацію: порти, опубліковані на `127.0.0.1` (`18789` для Gateway, `18790` для мосту), `--bind lan` усередині контейнера, простір імен користувача `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`. Вона читає `~/.openclaw/.env` як `EnvironmentFile` середовища виконання для таких значень, як `OPENCLAW_GATEWAY_TOKEN`, але не використовує дозволений список перевизначень для Podman із ручного засобу запуску. Щоб налаштувати власні опубліковані порти, адресу публікації або інші параметри запуску контейнера, натомість використовуйте ручний засіб запуску або безпосередньо відредагуйте `~/.config/containers/systemd/openclaw.container`, а потім перезавантажте конфігурацію та перезапустіть службу.

## Конфігурація, середовище та сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний засіб запуску:** `./scripts/run-openclaw-podman.sh`

Сценарій запуску та Quadlet монтують стан із хоста в контейнер: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. За замовчуванням це каталоги хоста, а не анонімний стан контейнера, тому `openclaw.json`, файли `auth-profiles.json` окремих агентів, стан каналів і постачальників, сеанси та робочий простір зберігаються після заміни контейнера. Налаштування також додає початкові значення `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту Gateway, щоб локальна панель керування працювала з прив’язкою контейнера не до local loopback.

Корисні змінні середовища для ручного засобу запуску (збережіть їх у `~/.openclaw/.env`; засіб запуску читає цей файл перед остаточним визначенням значень за замовчуванням для контейнера й образу):

| Змінна                                     | Значення за замовчуванням | Дія                                    |
| ------------------------------------------ | ------------------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`                | Ім’я контейнера                        |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`          | Образ для запуску                      |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`                   | Порт хоста, зіставлений із портом контейнера `18789` |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`                   | Порт хоста, зіставлений із портом контейнера `18790` |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`               | Інтерфейс хоста для опублікованих портів |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`                     | Режим прив’язки Gateway усередині контейнера |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`                 | `keep-id`, `auto` або `host`           |

Якщо ви використовуєте нестандартне значення `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задавайте ті самі змінні як для `./scripts/podman/setup.sh`, так і для подальших команд `./scripts/run-openclaw-podman.sh launch` — засіб запуску з репозиторію не зберігає власні перевизначення шляхів між сеансами оболонки.

## Оновлення образів

Після повторного збирання або завантаження нового образу перезапустіть контейнер чи службу Quadlet.
Під час першого запуску нової версії OpenClaw Gateway виконує безпечне відновлення стану та
плагінів, перш ніж повідомити про готовність.

Якщо Gateway завершує роботу замість переходу в стан готовності, один раз запустіть той самий образ із
`openclaw doctor --fix` для того самого підключеного стану й конфігурації, а потім перезапустіть
Gateway у звичайному режимі:

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

На хостах із SELinux додайте `,Z` до обох монтувань, якщо Podman блокує доступ до
підключеного стану.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL панелі керування з CLI хоста:** `openclaw dashboard --no-open`
- **Перевірка працездатності та стану через CLI хоста:** `openclaw gateway status --deep` (перевірка RPC + додаткове сканування служб)

## Усунення несправностей

- **Відмовлено в доступі (EACCES) до конфігурації або робочого простору:** За замовчуванням контейнер працює з `--userns=keep-id` і `--user <ваш uid>:<ваш gid>`. Переконайтеся, що каталоги конфігурації та робочого простору на хості належать поточному користувачеві.
- **Запуск Gateway заблоковано (відсутнє `gateway.mode=local`):** Переконайтеся, що файл `~/.openclaw/openclaw.json` існує та містить `gateway.mode="local"`. `scripts/podman/setup.sh` створює його, якщо він відсутній.
- **Контейнер перезапускається після оновлення образу:** Виконайте одноразову команду `openclaw doctor --fix` із розділу [Оновлення образів](#upgrading-images), а потім знову запустіть Gateway.
- **Команди CLI контейнера спрямовуються не до тієї цілі:** Явно використовуйте `openclaw --container <name> ...` або експортуйте `OPENCLAW_CONTAINER=<name>` у своїй оболонці.
- **`openclaw update` завершується помилкою з `--container`:** Це очікувана поведінка. Повторно зберіть або завантажте образ, а потім перезапустіть контейнер чи службу Quadlet.
- **Служба Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, а потім `systemctl --user start openclaw.service`. У системах без графічного інтерфейсу також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує монтування:** Не змінюйте стандартну поведінку монтування; коли SELinux працює в примусовому або дозвільному режимі, засіб запуску автоматично додає `:Z` у Linux.

## Пов’язані матеріали

- [Docker](/uk/install/docker)
- [Фоновий процес Gateway](/uk/gateway/background-process)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
