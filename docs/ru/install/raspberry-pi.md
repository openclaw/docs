---
read_when:
    - Настройка OpenClaw на Raspberry Pi
    - Запуск OpenClaw на устройствах ARM
    - Создание недорогого персонального ИИ, работающего круглосуточно
summary: Разместите OpenClaw на Raspberry Pi для постоянного самостоятельного хостинга
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T11:31:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Запустите постоянный, непрерывно работающий Gateway OpenClaw на Raspberry Pi. Поскольку Pi используется только как шлюз (модели работают в облаке через API), с нагрузкой хорошо справляется даже недорогой Pi — типичная стоимость оборудования составляет **$35–80 единоразово**, без ежемесячной платы.

## Совместимость оборудования

| Модель Pi   | ОЗУ    | Работает?         | Примечания                                      |
| ----------- | ------ | ----------------- | ----------------------------------------------- |
| Pi 5        | 4/8 ГБ | Лучший вариант    | Самый быстрый, рекомендуется.                   |
| Pi 4        | 4 ГБ   | Хорошо            | Оптимальный вариант для большинства пользователей. |
| Pi 4        | 2 ГБ   | Нормально         | Добавьте раздел подкачки.                       |
| Pi 4        | 1 ГБ   | На пределе        | Возможно с подкачкой и минимальной конфигурацией. |
| Pi 3B+      | 1 ГБ   | Медленно          | Работает, но неторопливо.                       |
| Pi Zero 2 W | 512 МБ | Нет               | Не рекомендуется.                               |

**Минимум:** 1 ГБ ОЗУ, 1 ядро, 500 МБ свободного места на диске, 64-разрядная ОС.
**Рекомендуется:** 2 ГБ ОЗУ или больше, SD-карта на 16 ГБ или больше (либо USB SSD), Ethernet.

## Предварительные требования

- Raspberry Pi 4 или 5 с 2 ГБ ОЗУ или больше (рекомендуется 4 ГБ)
- Карта microSD (16 ГБ или больше) либо USB SSD (выше производительность)
- Официальный блок питания Pi
- Сетевое подключение (Ethernet или WiFi)
- 64-разрядная Raspberry Pi OS (обязательно — не используйте 32-разрядную версию)
- Около 30 минут

## Настройка

<Steps>
  <Step title="Запишите ОС">
    Используйте **Raspberry Pi OS Lite (64-bit)** — для сервера без монитора графическая среда не нужна.

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

    # Задайте часовой пояс (важно для Cron и напоминаний)
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

  <Step title="Добавьте подкачку (важно при 2 ГБ ОЗУ или меньше)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Уменьшите склонность к подкачке для устройств с малым объёмом ОЗУ
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
    На компьютере получите URL панели управления от Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Затем создайте SSH-туннель в другом терминале:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Откройте выведенный URL в локальном браузере. Для постоянного удалённого доступа см. [интеграцию с Tailscale](/ru/gateway/tailscale).

  </Step>
</Steps>

## Советы по производительности

**Используйте USB SSD** — SD-карты медленные и изнашиваются. USB SSD значительно повышает производительность и выдерживает больше циклов записи; если ОС остаётся на SD-карте, используйте SSD для `OPENCLAW_STATE_DIR`. См. [руководство по загрузке Pi с USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Включите кэш компиляции модулей** — он ускоряет повторные вызовы CLI на маломощных хостах Pi. `OPENCLAW_NO_RESPAWN=1` позволяет выполнять обычные перезапуски Gateway в том же процессе, избегая дополнительной передачи управления между процессами и упрощая отслеживание PID на небольших хостах:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Используйте `/var/tmp`, а не `/tmp` — некоторые дистрибутивы очищают `/tmp` при загрузке, удаляя прогретый кэш.

**Сократите использование памяти** — для конфигураций без монитора освободите память графического процессора и отключите неиспользуемые службы:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Дополнительная конфигурация systemd для стабильных перезапусков** — если этот Pi в основном используется для запуска OpenClaw, добавьте дополнительную конфигурацию службы:

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

Затем выполните `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. На Pi без монитора также один раз включите сохранение пользовательской службы после выхода из системы: `sudo loginctl enable-linger "$(whoami)"`.

## Рекомендуемая настройка моделей

Поскольку Pi запускает только Gateway, используйте модели API, размещённые в облаке, — не запускайте локальные LLM на Pi: даже небольшие модели работают слишком медленно для практического применения.

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

Большинство функций OpenClaw работают на ARM64 без изменений (Node.js, Telegram, WhatsApp/Baileys, Chromium). Двоичные файлы, для которых иногда отсутствуют сборки ARM, обычно относятся к необязательным инструментам CLI на Go или Rust, поставляемым с Skills. Проверьте архитектуру с помощью `uname -m` (должно отображаться `aarch64`), а затем перед сборкой из исходного кода проверьте страницу выпусков отсутствующего двоичного файла на наличие артефактов `linux-arm64` / `aarch64`.

## Сохранение данных и резервные копии

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, отдельные для каждого агента файлы `auth-profiles.json`, состояние каналов и поставщиков, сеансы.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Эти данные сохраняются после перезагрузки, а использование SSD вместо SD-карты повышает как производительность, так и срок службы накопителя. Создайте переносимый снимок состояния:

```bash
openclaw backup create
```

## Устранение неполадок

**Недостаточно памяти** — убедитесь, что подкачка активна, выполнив `free -h`. Отключите неиспользуемые службы (`sudo systemctl disable cups bluetooth avahi-daemon`). Используйте только модели через API.

**Низкая производительность** — используйте USB SSD вместо SD-карты. Проверьте троттлинг процессора с помощью `vcgencmd get_throttled` (команда должна вернуть `0x0`).

**Служба не запускается** — проверьте журналы командой `journalctl --user -u openclaw-gateway.service --no-pager -n 100` и выполните `openclaw doctor --non-interactive`. Если Pi работает без монитора, также убедитесь, что сохранение пользовательской службы после выхода включено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблемы с двоичными файлами ARM** — если Skills завершается с ошибкой "exec format error", проверьте, существует ли сборка двоичного файла для ARM64. Проверьте архитектуру с помощью `uname -m` (должно отображаться `aarch64`).

**Обрывы WiFi** — отключите управление энергопотреблением WiFi: `sudo iwconfig wlan0 power off`.

## Дальнейшие шаги

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие сервисы
- [Конфигурация Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Сервер Linux](/ru/vps)
- [Платформы](/ru/platforms)
