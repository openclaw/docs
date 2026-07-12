---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на пристроях ARM
    - Створення недорогого персонального ШІ, доступного цілодобово
summary: Розмістіть OpenClaw на Raspberry Pi для безперервного самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T13:23:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустіть постійний, безперервно активний OpenClaw Gateway на Raspberry Pi. Оскільки Pi слугує лише шлюзом (моделі працюють у хмарі через API), навіть скромний Pi добре впорається з навантаженням — типова вартість обладнання становить **$35–80 одноразово**, без щомісячної плати.

## Сумісність обладнання

| Модель Pi   | ОЗП    | Працює?   | Примітки                                      |
| ----------- | ------ | --------- | --------------------------------------------- |
| Pi 5        | 4/8 ГБ | Найкраще  | Найшвидший, рекомендовано.                    |
| Pi 4        | 4 ГБ   | Добре     | Оптимальний варіант для більшості користувачів. |
| Pi 4        | 2 ГБ   | Прийнятно | Додайте файл підкачки.                        |
| Pi 4        | 1 ГБ   | На межі   | Можливо з підкачкою та мінімальною конфігурацією. |
| Pi 3B+      | 1 ГБ   | Повільно  | Працює, але мляво.                            |
| Pi Zero 2 W | 512 МБ | Ні        | Не рекомендовано.                             |

**Мінімум:** 1 ГБ ОЗП, 1 ядро, 500 МБ вільного місця на диску, 64-розрядна ОС.
**Рекомендовано:** від 2 ГБ ОЗП, SD-картка від 16 ГБ (або USB SSD), Ethernet.

## Передумови

- Raspberry Pi 4 або 5 із щонайменше 2 ГБ ОЗП (рекомендовано 4 ГБ)
- Картка MicroSD (від 16 ГБ) або USB SSD (краща продуктивність)
- Офіційний блок живлення Pi
- Підключення до мережі (Ethernet або WiFi)
- 64-розрядна Raspberry Pi OS (обов’язково — не використовуйте 32-розрядну)
- Приблизно 30 хвилин

## Налаштування

<Steps>
  <Step title="Запишіть ОС">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** — для сервера без монітора робочий стіл не потрібен.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалоговому вікні налаштувань заздалегідь укажіть:
       - Ім’я хоста: `gateway-host`
       - Увімкніть SSH
       - Установіть ім’я користувача та пароль
       - Налаштуйте WiFi (якщо не використовуєте Ethernet)
    4. Запишіть образ на SD-картку або USB-накопичувач, вставте його та завантажте Pi.

  </Step>

  <Step title="Підключіться через SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Оновіть систему">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Установіть часовий пояс (важливо для cron і нагадувань)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Установіть Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Додайте файл підкачки (важливо для 2 ГБ або менше)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Зменште схильність до підкачки для пристроїв із малим обсягом ОЗП
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --install-daemon
    ```

    Дотримуйтеся вказівок майстра. Для пристроїв без монітора рекомендовано використовувати ключі API замість OAuth. Telegram — найпростіший канал для початку роботи.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до інтерфейсу керування">
    На своєму комп’ютері отримайте URL панелі керування з Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Потім створіть SSH-тунель в іншому терміналі:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Відкрийте виведений URL у локальному браузері. Відомості про постійний віддалений доступ див. у розділі [Інтеграція з Tailscale](/uk/gateway/tailscale).

  </Step>
</Steps>

## Поради щодо продуктивності

**Використовуйте USB SSD** — SD-картки повільні та зношуються. USB SSD значно підвищує продуктивність і витримує більше циклів запису; використовуйте його для `OPENCLAW_STATE_DIR`, якщо ОС залишається на SD-картці. Див. [посібник із завантаження Pi через USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть кеш компіляції модулів** — це прискорює повторні виклики CLI на малопотужних хостах Pi. `OPENCLAW_NO_RESPAWN=1` забезпечує виконання звичайних перезапусків Gateway у межах того самого процесу, уникаючи додаткової передачі між процесами та спрощуючи відстеження PID на малих хостах:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Використовуйте `/var/tmp`, а не `/tmp` — деякі дистрибутиви очищують `/tmp` під час завантаження, через що прогрітий кеш видаляється.

**Зменште використання пам’яті** — для систем без монітора звільніть пам’ять GPU та вимкніть невикористовувані служби:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Додаткова конфігурація systemd для стабільних перезапусків** — якщо цей Pi переважно використовується для запуску OpenClaw, додайте додаткову конфігурацію служби:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Потім виконайте `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На Pi без монітора також один раз увімкніть збереження користувацьких служб після виходу із системи: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендоване налаштування моделей

Оскільки Pi запускає лише шлюз, використовуйте моделі API, розміщені у хмарі, — не запускайте локальні LLM на Pi, адже навіть малі моделі надто повільні для практичного використання:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## Примітки щодо бінарних файлів ARM

Більшість функцій OpenClaw працюють на ARM64 без змін (Node.js, Telegram, WhatsApp/Baileys, Chromium). Бінарні файли, для яких іноді немає збірок ARM, зазвичай є необов’язковими інструментами CLI на Go/Rust, що постачаються зі Skills. Перевірте архітектуру за допомогою `uname -m` (має відобразитися `aarch64`), а потім перевірте сторінку випусків відсутнього бінарного файла на наявність артефактів `linux-arm64` / `aarch64`, перш ніж переходити до збирання з вихідного коду.

## Збереження стану та резервні копії

Стан OpenClaw зберігається в таких каталогах:

- `~/.openclaw/` — `openclaw.json`, окремі для кожного агента `auth-profiles.json`, стан каналів і постачальників, сеанси.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Ці дані зберігаються після перезавантажень, а використання SSD замість SD-картки підвищує як продуктивність, так і довговічність. Створіть переносний знімок за допомогою:

```bash
openclaw backup create
```

## Усунення несправностей

**Недостатньо пам’яті** — перевірте, чи активна підкачка, за допомогою `free -h`. Вимкніть невикористовувані служби (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише моделі на основі API.

**Низька продуктивність** — використовуйте USB SSD замість SD-картки. Перевірте обмеження частоти процесора за допомогою `vcgencmd get_throttled` (має повернути `0x0`).

**Служба не запускається** — перегляньте журнали за допомогою `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і виконайте `openclaw doctor --non-interactive`. Якщо це Pi без монітора, також перевірте, чи ввімкнено збереження користувацьких служб після виходу із системи: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з бінарними файлами ARM** — якщо Skills завершується помилкою «exec format error», перевірте, чи має бінарний файл збірку ARM64. Перевірте архітектуру за допомогою `uname -m` (має відобразитися `aarch64`).

**Обриви WiFi-з’єднання** — вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord тощо
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — підтримуйте OpenClaw в актуальному стані

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Сервер Linux](/uk/vps)
- [Платформи](/uk/platforms)
