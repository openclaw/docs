---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на пристроях ARM
    - Створення недорогого постійно ввімкненого персонального ШІ
summary: Розмістіть OpenClaw на Raspberry Pi для постійного самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-05T16:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустіть постійний, завжди активний OpenClaw Gateway на Raspberry Pi. Оскільки Pi є лише Gateway (моделі працюють у хмарі через API), навіть скромний Pi добре справляється з навантаженням — типова вартість обладнання становить **$35–80 одноразово**, без щомісячних платежів.

## Сумісність обладнання

| Модель Pi   | ОЗП    | Працює? | Примітки                            |
| ----------- | ------ | ------- | ----------------------------------- |
| Pi 5        | 4/8 ГБ | Найкраще | Найшвидший, рекомендовано.          |
| Pi 4        | 4 ГБ   | Добре   | Оптимальний варіант для більшості користувачів. |
| Pi 4        | 2 ГБ   | OK      | Додайте swap.                       |
| Pi 4        | 1 ГБ   | Обмежено | Можливо зі swap, мінімальна конфігурація. |
| Pi 3B+      | 1 ГБ   | Повільно | Працює, але мляво.                  |
| Pi Zero 2 W | 512 МБ | Ні      | Не рекомендовано.                   |

**Мінімум:** 1 ГБ ОЗП, 1 ядро, 500 МБ вільного диска, 64-бітна ОС.
**Рекомендовано:** 2+ ГБ ОЗП, SD-карта 16+ ГБ (або USB SSD), Ethernet.

## Передумови

- Raspberry Pi 4 або 5 з 2+ ГБ ОЗП (рекомендовано 4 ГБ)
- Карта MicroSD (16+ ГБ) або USB SSD (краща продуктивність)
- Офіційний блок живлення Pi
- Підключення до мережі (Ethernet або WiFi)
- 64-бітна Raspberry Pi OS (обов’язково -- не використовуйте 32-бітну)
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Flash the OS">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** -- для headless-сервера робочий стіл не потрібен.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалозі налаштувань попередньо задайте:
       - Ім’я хоста: `gateway-host`
       - Увімкнути SSH
       - Задати ім’я користувача й пароль
       - Налаштувати WiFi (якщо не використовуєте Ethernet)
    4. Запишіть образ на SD-карту або USB-накопичувач, вставте його й завантажте Pi.

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Дотримуйтеся вказівок майстра. Для headless-пристроїв рекомендовано API-ключі замість OAuth. Telegram — найпростіший канал для початку.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    На своєму комп’ютері отримайте URL панелі керування з Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Потім створіть SSH-тунель в іншому терміналі:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Відкрийте надрукований URL у локальному браузері. Для постійного віддаленого доступу див. [інтеграцію Tailscale](/uk/gateway/tailscale).

  </Step>
</Steps>

## Поради щодо продуктивності

**Використовуйте USB SSD** -- SD-карти повільні й зношуються. USB SSD суттєво покращує продуктивність. Див. [посібник із USB-завантаження Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть кеш компіляції модулів** -- пришвидшує повторні виклики CLI на малопотужних хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Зменште використання пам’яті** -- для headless-налаштувань звільніть пам’ять GPU й вимкніть невикористовувані служби:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in для стабільних перезапусків** -- якщо цей Pi здебільшого запускає OpenClaw, додайте service drop-in:

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

Потім `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На headless Pi також один раз увімкніть lingering, щоб користувацька служба працювала після виходу з системи: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендоване налаштування моделі

Оскільки Pi запускає лише Gateway, використовуйте API-моделі, розміщені в хмарі:

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

Не запускайте локальні LLM на Pi — навіть малі моделі надто повільні, щоб бути корисними. Нехай Claude або GPT виконують роботу моделі.

## Примітки щодо бінарних файлів ARM

Більшість функцій OpenClaw працюють на ARM64 без змін (Node.js, Telegram, WhatsApp/Baileys, Chromium). Бінарні файли, для яких іноді немає ARM-збірок, зазвичай є необов’язковими CLI-інструментами Go/Rust, що постачаються Skills. Перевірте сторінку релізу відсутнього бінарного файла на наявність артефактів `linux-arm64` / `aarch64`, перш ніж переходити до збирання з вихідного коду.

## Постійність і резервні копії

Стан OpenClaw зберігається тут:

- `~/.openclaw/` — `openclaw.json`, поагентні `auth-profiles.json`, стан каналів/провайдерів, сеанси.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Вони зберігаються після перезавантажень. Створіть переносний знімок за допомогою:

```bash
openclaw backup create
```

Якщо тримати їх на SSD, продуктивність і довговічність будуть кращими, ніж на SD-карті.

## Усунення несправностей

**Бракує пам’яті** -- Перевірте, що swap активний, за допомогою `free -h`. Вимкніть невикористовувані служби (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише моделі на основі API.

**Повільна продуктивність** -- Використовуйте USB SSD замість SD-карти. Перевірте обмеження частоти CPU за допомогою `vcgencmd get_throttled` (має повернути `0x0`).

**Служба не запускається** -- Перевірте журнали за допомогою `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і запустіть `openclaw doctor --non-interactive`. Якщо це headless Pi, також перевірте, що lingering увімкнено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з бінарними файлами ARM** -- Якщо skill завершується з помилкою "exec format error", перевірте, чи має бінарний файл ARM64-збірку. Перевірте архітектуру за допомогою `uname -m` (має показати `aarch64`).

**Розривається WiFi** -- Вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Linux-сервер](/uk/vps)
- [Платформи](/uk/platforms)
