---
read_when:
    - Настройка OpenClaw на Raspberry Pi
    - Запуск OpenClaw на устройствах ARM
    - Создание недорогого персонального ИИ, работающего круглосуточно
summary: Разместите OpenClaw на Raspberry Pi для непрерывного самостоятельного хостинга
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-13T18:20:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустите постоянный, круглосуточно работающий OpenClaw Gateway на Raspberry Pi. Поскольку Pi используется только как шлюз (модели работают в облаке через API), даже недорогой Pi хорошо справляется с нагрузкой — типичная стоимость оборудования составляет **$35-80 единоразово**, без ежемесячной платы.

## Совместимость оборудования

| Модель Pi   | ОЗУ    | Работает? | Примечания                                      |
| ----------- | ------ | --------- | ------------------------------------------------ |
| Pi 5        | 4/8 GB | Лучше всего | Самый быстрый, рекомендуется.                  |
| Pi 4        | 4 GB   | Хорошо    | Оптимальный вариант для большинства пользователей. |
| Pi 4        | 2 GB   | Нормально | Добавьте раздел подкачки.                        |
| Pi 4        | 1 GB   | На пределе | Возможно с разделом подкачки и минимальной конфигурацией. |
| Pi 3B+      | 1 GB   | Медленно  | Работает, но медленно.                           |
| Pi Zero 2 W | 512 MB | Нет       | Не рекомендуется.                               |

**Минимум:** 1 GB ОЗУ, 1 ядро, 500 MB свободного места на диске, 64-разрядная ОС.
**Рекомендуется:** 2 GB+ ОЗУ, SD-карта на 16 GB+ (или USB SSD), Ethernet.

## Предварительные требования

- Raspberry Pi 4 или 5 с 2 GB+ ОЗУ (рекомендуется 4 GB)
- Карта MicroSD (16 GB+) или USB SSD (более высокая производительность)
- Официальный блок питания Pi
- Сетевое подключение (Ethernet или WiFi)
- 64-разрядная Raspberry Pi OS (обязательно — не используйте 32-разрядную)
- Около 30 минут

## Настройка

<Steps>
  <Step title="Запишите образ ОС">
    Используйте **Raspberry Pi OS Lite (64-bit)** — для сервера без монитора рабочий стол не нужен.

    1. Скачайте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Выберите ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. В диалоговом окне настроек заранее укажите:
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

    # Задайте часовой пояс (важно для cron и напоминаний)
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

  <Step title="Добавьте раздел подкачки (важно для 2 GB или меньше)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Уменьшите интенсивность подкачки для устройств с небольшим объёмом ОЗУ
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Установите OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --install-daemon
    ```

    Следуйте указаниям мастера. Для устройств без монитора рекомендуется использовать ключи API вместо OAuth. Проще всего начать с канала Telegram.

  </Step>

  <Step title="Проверьте работу">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Откройте интерфейс управления">
    На компьютере получите URL панели управления с Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Затем создайте SSH-туннель в другом терминале:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Откройте выведенный URL в локальном браузере. Для постоянного удалённого доступа см. раздел [Интеграция с Tailscale](/ru/gateway/tailscale).

  </Step>
</Steps>

## Советы по производительности

**Используйте USB SSD** — SD-карты работают медленно и изнашиваются. USB SSD значительно повышает производительность и выдерживает больше циклов записи; используйте его для `OPENCLAW_STATE_DIR`, если ОС остаётся на SD-карте. См. [руководство по загрузке Pi с USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Включите кеш компиляции модулей** — это ускоряет повторные вызовы CLI на маломощных хостах Pi. `OPENCLAW_NO_RESPAWN=1` выполняет обычные перезапуски Gateway внутри процесса, избегая дополнительных передач управления между процессами и упрощая отслеживание PID на небольших хостах:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Используйте `/var/tmp`, а не `/tmp` — некоторые дистрибутивы очищают `/tmp` при загрузке, из-за чего прогретый кеш удаляется.

**Сократите потребление памяти** — для систем без монитора освободите память GPU и отключите неиспользуемые службы:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Дополнительная конфигурация systemd для стабильных перезапусков** — если этот Pi в основном используется для OpenClaw, добавьте дополнительную конфигурацию службы:

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

Затем `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На Pi без монитора также один раз включите сохранение пользовательских служб после выхода из системы: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендуемая настройка моделей

Поскольку Pi запускает только шлюз, используйте модели API, размещённые в облаке, — не запускайте локальные LLM на Pi: даже небольшие модели работают слишком медленно, чтобы быть полезными:

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

## Примечания о двоичных файлах ARM

Большинство функций OpenClaw работают на ARM64 без изменений (Node.js, Telegram, WhatsApp/Baileys, Chromium). Двоичные файлы, для которых иногда отсутствуют сборки ARM, обычно относятся к необязательным инструментам CLI на Go/Rust, поставляемым с Skills. Проверьте архитектуру с помощью `uname -m` (должно отображаться `aarch64`), затем перед сборкой из исходного кода проверьте страницу выпусков отсутствующего двоичного файла на наличие артефактов `linux-arm64` / `aarch64`.

## Сохранение данных и резервные копии

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, отдельные для каждого агента `auth-profiles.json`, состояние каналов и провайдеров, сеансы.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Эти данные сохраняются после перезагрузки, а использование SSD вместо SD-карты повышает производительность и продлевает срок службы. Создайте переносимый снимок с помощью:

```bash
openclaw backup create
```

## Устранение неполадок

**Недостаточно памяти** — проверьте активность раздела подкачки с помощью `free -h`. Отключите неиспользуемые службы (`sudo systemctl disable cups bluetooth avahi-daemon`). Используйте только модели на основе API.

**Низкая производительность** — используйте USB SSD вместо SD-карты. Проверьте троттлинг процессора с помощью `vcgencmd get_throttled` (команда должна вернуть `0x0`).

**Служба не запускается** — проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service --no-pager -n 100` и выполните `openclaw doctor --non-interactive`. Если это Pi без монитора, также убедитесь, что сохранение пользовательских служб после выхода из системы включено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблемы с двоичными файлами ARM** — если навык завершается с ошибкой "exec format error", проверьте наличие сборки двоичного файла для ARM64. Проверьте архитектуру с помощью `uname -m` (должно отображаться `aarch64`).

**Обрывы WiFi** — отключите управление энергопотреблением WiFi: `sudo iwconfig wlan0 power off`.

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие сервисы
- [Конфигурация Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Сервер Linux](/ru/vps)
- [Платформы](/ru/platforms)
