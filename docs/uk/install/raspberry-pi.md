---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Створення недорогого завжди ввімкненого персонального ШІ
summary: Розміщення OpenClaw на Raspberry Pi для завжди ввімкненого самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-23T20:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2727a14ae5c9fa9b9fd5f33bfb10a7af73254efbdcd6374502d1704ce31e484
    source_path: install/raspberry-pi.md
    workflow: 15
---

Запустіть постійний, завжди ввімкнений Gateway OpenClaw на Raspberry Pi. Оскільки Pi тут лише gateway (моделі працюють у хмарі через API), навіть скромний Pi добре справляється з навантаженням.

## Передумови

- Raspberry Pi 4 або 5 з 2 GB+ RAM (рекомендовано 4 GB)
- Карта MicroSD (16 GB+) або USB SSD (краща продуктивність)
- Офіційний блок живлення Pi
- Підключення до мережі (Ethernet або WiFi)
- 64-бітна Raspberry Pi OS (обов’язково — не використовуйте 32-бітну)
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Запишіть ОС">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** — для безголового сервера робочий стіл не потрібен.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалоговому вікні налаштувань попередньо задайте:
       - Hostname: `gateway-host`
       - Увімкніть SSH
       - Задайте username і пароль
       - Налаштуйте WiFi (якщо не використовуєте Ethernet)
    4. Запишіть на SD-карту або USB-накопичувач, вставте її та завантажте Pi.

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

    # Встановіть часовий пояс (важливо для Cron і нагадувань)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Встановіть Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Додайте swap (важливо для 2 GB або менше)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Зменшити swappiness для пристроїв із малим RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Встановіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Дотримуйтесь wizard-а. Для безголових пристроїв рекомендовано API keys замість OAuth. Telegram — найпростіший канал для старту.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Доступ до UI Control">
    На своєму комп’ютері отримайте URL dashboard з Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Потім створіть SSH-тунель в іншому терміналі:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Відкрийте надрукований URL у своєму локальному браузері. Для постійного віддаленого доступу див. [Інтеграція Tailscale](/uk/gateway/tailscale).

  </Step>
</Steps>

## Поради щодо продуктивності

**Використовуйте USB SSD** — SD-карти повільні й зношуються. USB SSD суттєво покращує продуктивність. Див. [посібник із USB boot для Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть compile cache модулів** — пришвидшує повторні виклики CLI на менш потужних хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Зменште використання пам’яті** — для безголових конфігурацій звільніть GPU-пам’ять і вимкніть непотрібні сервіси:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Усунення несправностей

**Брак пам’яті** — перевірте, чи активний swap, командою `free -h`. Вимкніть непотрібні сервіси (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише моделі на основі API.

**Повільна робота** — використовуйте USB SSD замість SD-карти. Перевірте наявність throttling CPU через `vcgencmd get_throttled` (має повертати `0x0`).

**Сервіс не запускається** — перевірте логи через `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і виконайте `openclaw doctor --non-interactive`. Якщо це безголовий Pi, також переконайтеся, що lingering увімкнено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з binary ARM** — якщо Skill падає з "exec format error", перевірте, чи має binary збірку ARM64. Перевірте архітектуру командою `uname -m` (має показувати `aarch64`).

**WiFi обривається** — вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
