---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на пристроях ARM
    - Створення дешевого персонального ШІ, що завжди працює
summary: Розміщуйте OpenClaw на Raspberry Pi для постійного самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:42:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустіть постійний, завжди увімкнений OpenClaw Gateway на Raspberry Pi. Оскільки Pi є лише Gateway (моделі працюють у хмарі через API), навіть скромний Pi добре справляється з навантаженням — типова вартість обладнання становить **$35–80 одноразово**, без щомісячних платежів.

## Сумісність обладнання

| Модель Pi    | RAM    | Працює? | Примітки                               |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | Найкраще   | Найшвидший, рекомендовано.               |
| Pi 4        | 4 GB   | Добре   | Оптимальний варіант для більшості користувачів.          |
| Pi 4        | 2 GB   | Нормально     | Додайте swap.                           |
| Pi 4        | 1 GB   | Обмежено  | Можливо зі swap, мінімальна конфігурація. |
| Pi 3B+      | 1 GB   | Повільно   | Працює, але мляво.                 |
| Pi Zero 2 W | 512 MB | Ні     | Не рекомендовано.                    |

**Мінімум:** 1 GB RAM, 1 ядро, 500 MB вільного диска, 64-бітна ОС.
**Рекомендовано:** 2 GB+ RAM, SD-карта 16 GB+ (або USB SSD), Ethernet.

## Передумови

- Raspberry Pi 4 або 5 з 2 GB+ RAM (рекомендовано 4 GB)
- Картка MicroSD (16 GB+) або USB SSD (краща продуктивність)
- Офіційний блок живлення Pi
- Мережеве підключення (Ethernet або WiFi)
- 64-бітна Raspberry Pi OS (обов’язково -- не використовуйте 32-бітну)
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Flash the OS">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** -- робочий стіл не потрібен для сервера без графічного інтерфейсу.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалоговому вікні налаштувань попередньо задайте:
       - Hostname: `gateway-host`
       - Enable SSH
       - Set username and password
       - Configure WiFi (якщо не використовуєте Ethernet)
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

    Дотримуйтесь майстра. API-ключі рекомендовані замість OAuth для пристроїв без графічного інтерфейсу. Telegram — найпростіший канал для початку.

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

**Використовуйте USB SSD** -- SD-карти повільні та зношуються. USB SSD різко покращує продуктивність. Див. [посібник із USB-завантаження Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть кеш компіляції модулів** -- пришвидшує повторні виклики CLI на менш потужних хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` утримує звичайні перезапуски Gateway у межах процесу, що уникає додаткових передавань між процесами та спрощує відстеження PID на малих хостах.

**Зменште використання пам’яті** -- Для налаштувань без графічного інтерфейсу звільніть пам’ять GPU і вимкніть невикористовувані служби:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in для стабільних перезапусків** -- Якщо цей Pi здебільшого запускає OpenClaw, додайте service drop-in:

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

Потім `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На Pi без графічного інтерфейсу також один раз увімкніть lingering, щоб служба користувача переживала вихід із системи: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендоване налаштування моделей

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

## Примітки щодо ARM-бінарників

Більшість функцій OpenClaw працює на ARM64 без змін (Node.js, Telegram, WhatsApp/Baileys, Chromium). Бінарники, для яких іноді бракує ARM-збірок, зазвичай є необов’язковими CLI-інструментами Go/Rust, що постачаються Skills. Перевірте сторінку релізів відсутнього бінарника на наявність артефактів `linux-arm64` / `aarch64`, перш ніж переходити до збирання з вихідного коду.

## Постійність і резервні копії

Стан OpenClaw зберігається в:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, стан каналів/провайдерів, сеанси.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Вони переживають перезавантаження. Створіть переносний знімок за допомогою:

```bash
openclaw backup create
```

Якщо тримати їх на SSD, і продуктивність, і довговічність покращаться порівняно з SD-картою.

## Усунення несправностей

**Бракує пам’яті** -- Перевірте, що swap активний, за допомогою `free -h`. Вимкніть невикористовувані служби (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише API-моделі.

**Повільна продуктивність** -- Використовуйте USB SSD замість SD-карти. Перевірте тротлінг CPU за допомогою `vcgencmd get_throttled` (має повернути `0x0`).

**Служба не запускається** -- Перевірте журнали за допомогою `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і запустіть `openclaw doctor --non-interactive`. Якщо це Pi без графічного інтерфейсу, також перевірте, що lingering увімкнено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з ARM-бінарниками** -- Якщо skill завершується з помилкою "exec format error", перевірте, чи має бінарник ARM64-збірку. Перевірте архітектуру за допомогою `uname -m` (має показати `aarch64`).

**WiFi від’єднується** -- Вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Linux-сервер](/uk/vps)
- [Платформи](/uk/platforms)
