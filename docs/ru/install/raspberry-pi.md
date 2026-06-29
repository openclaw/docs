---
read_when:
    - Настройка OpenClaw на Raspberry Pi
    - Запуск OpenClaw на устройствах ARM
    - Создание дешевого постоянно включенного персонального ИИ
summary: Разместите OpenClaw на Raspberry Pi для постоянно включенного самостоятельного хостинга
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-28T23:08:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустите постоянный, всегда активный OpenClaw Gateway на Raspberry Pi. Поскольку Pi используется только как Gateway (модели работают в облаке через API), даже скромный Pi хорошо справляется с нагрузкой — типичная стоимость оборудования составляет **$35–80 единоразово**, без ежемесячных платежей.

## Совместимость оборудования

| Модель Pi   | RAM    | Работает? | Примечания                               |
| ----------- | ------ | --------- | ---------------------------------------- |
| Pi 5        | 4/8 GB | Лучше всего | Самый быстрый, рекомендуется.          |
| Pi 4        | 4 GB   | Хорошо    | Оптимальный вариант для большинства пользователей. |
| Pi 4        | 2 GB   | OK        | Добавьте swap.                           |
| Pi 4        | 1 GB   | Впритык   | Возможно со swap, минимальная конфигурация. |
| Pi 3B+      | 1 GB   | Медленно  | Работает, но вяло.                       |
| Pi Zero 2 W | 512 MB | Нет       | Не рекомендуется.                        |

**Минимум:** 1 GB RAM, 1 ядро, 500 MB свободного места на диске, 64-битная ОС.
**Рекомендуется:** 2 GB+ RAM, SD-карта 16 GB+ (или USB SSD), Ethernet.

## Предварительные требования

- Raspberry Pi 4 или 5 с 2 GB+ RAM (рекомендуется 4 GB)
- Карта MicroSD (16 GB+) или USB SSD (лучше производительность)
- Официальный блок питания Pi
- Сетевое подключение (Ethernet или WiFi)
- 64-битная Raspberry Pi OS (обязательно -- не используйте 32-битную)
- Около 30 минут

## Настройка

<Steps>
  <Step title="Запишите ОС">
    Используйте **Raspberry Pi OS Lite (64-bit)** -- рабочий стол для headless-сервера не нужен.

    1. Скачайте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Выберите ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. В диалоге настроек заранее задайте:
       - Имя хоста: `gateway-host`
       - Включите SSH
       - Задайте имя пользователя и пароль
       - Настройте WiFi (если не используете Ethernet)
    4. Запишите образ на SD-карту или USB-накопитель, вставьте его и загрузите Pi.

  </Step>

  <Step title="Подключитесь по SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Обновите систему">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Установите Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Добавьте swap (важно для 2 GB или меньше)">
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

  <Step title="Установите OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустите onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Следуйте мастеру. Для headless-устройств рекомендуется использовать API-ключи вместо OAuth. Telegram — самый простой канал для начала.

  </Step>

  <Step title="Проверьте">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Откройте Control UI">
    На своем компьютере получите URL панели управления с Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Затем создайте SSH-туннель в другом терминале:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Откройте напечатанный URL в локальном браузере. Для постоянного удаленного доступа см. [интеграцию Tailscale](/ru/gateway/tailscale).

  </Step>
</Steps>

## Советы по производительности

**Используйте USB SSD** -- SD-карты медленные и изнашиваются. USB SSD значительно повышает производительность. См. [руководство по USB-загрузке Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Включите кэш компиляции модулей** -- Ускоряет повторные вызовы CLI на маломощных хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` оставляет обычные перезапуски Gateway внутри процесса, что избегает лишней передачи управления между процессами и упрощает отслеживание PID на небольших хостах.

**Снизьте использование памяти** -- Для headless-настроек освободите память GPU и отключите неиспользуемые службы:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in для стабильных перезапусков** -- Если этот Pi в основном запускает OpenClaw, добавьте drop-in для службы:

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

Затем выполните `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На headless Pi также один раз включите lingering, чтобы пользовательская служба сохранялась после выхода: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендуемая настройка модели

Поскольку Pi запускает только Gateway, используйте облачные API-модели:

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

Не запускайте локальные LLM на Pi — даже небольшие модели слишком медленные для практического использования. Пусть Claude или GPT выполняют работу модели.

## Примечания по бинарным файлам ARM

Большинство функций OpenClaw работают на ARM64 без изменений (Node.js, Telegram, WhatsApp/Baileys, Chromium). Бинарные файлы, у которых иногда нет ARM-сборок, обычно являются необязательными CLI-инструментами Go/Rust, поставляемыми Skills. Проверьте страницу релизов отсутствующего бинарного файла на наличие артефактов `linux-arm64` / `aarch64`, прежде чем переходить к сборке из исходного кода.

## Постоянное хранение и резервные копии

Состояние OpenClaw хранится в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для каждого агента, состояние каналов/провайдеров, сессии.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Они сохраняются после перезагрузок. Создайте переносимый снимок с помощью:

```bash
openclaw backup create
```

Если хранить эти данные на SSD, и производительность, и срок службы будут лучше, чем на SD-карте.

## Устранение неполадок

**Нехватка памяти** -- Проверьте, активен ли swap, с помощью `free -h`. Отключите неиспользуемые службы (`sudo systemctl disable cups bluetooth avahi-daemon`). Используйте только модели на основе API.

**Медленная производительность** -- Используйте USB SSD вместо SD-карты. Проверьте троттлинг CPU с помощью `vcgencmd get_throttled` (должно вернуться `0x0`).

**Служба не запускается** -- Проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service --no-pager -n 100` и выполните `openclaw doctor --non-interactive`. Если это headless Pi, также убедитесь, что включен lingering: `sudo loginctl enable-linger "$(whoami)"`.

**Проблемы с бинарными файлами ARM** -- Если skill завершается с ошибкой "exec format error", проверьте, есть ли у бинарного файла сборка ARM64. Проверьте архитектуру с помощью `uname -m` (должно показать `aarch64`).

**Обрывы WiFi** -- Отключите управление питанием WiFi: `sudo iwconfig wlan0 power off`.

## Следующие шаги

- [Каналы](/ru/channels) -- подключите Telegram, WhatsApp, Discord и другие
- [Конфигурация Gateway](/ru/gateway/configuration) -- все параметры конфигурации
- [Обновление](/ru/install/updating) -- поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Linux-сервер](/ru/vps)
- [Платформы](/ru/platforms)
