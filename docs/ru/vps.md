---
read_when:
    - Вы хотите запустить Gateway на сервере Linux или облачном VPS
    - Вам нужен краткий обзор руководств по хостингу
    - Вам нужна общая настройка сервера Linux для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на сервере Linux или облачном VPS — выбор провайдера, архитектура и настройка
title: Сервер Linux
x-i18n:
    generated_at: "2026-07-12T11:59:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Запустите Gateway OpenClaw на любом сервере Linux или облачном VPS. Эта страница поможет
выбрать провайдера, объяснит принципы облачного развертывания и расскажет об общих
настройках Linux, применимых в любой среде.

## Выбор провайдера

<CardGroup cols={2}>
  <Card title="Azure" href="/ru/install/azure">Виртуальная машина Linux</Card>
  <Card title="DigitalOcean" href="/ru/install/digitalocean">Простой платный VPS</Card>
  <Card title="exe.dev" href="/ru/install/exe-dev">Виртуальная машина с HTTPS-прокси</Card>
  <Card title="Fly.io" href="/ru/install/fly">Машины Fly</Card>
  <Card title="GCP" href="/ru/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/ru/install/hetzner">Docker на VPS Hetzner</Card>
  <Card title="Hostinger" href="/ru/install/hostinger">VPS с настройкой в один клик</Card>
  <Card title="Northflank" href="/ru/install/northflank">Настройка в браузере в один клик</Card>
  <Card title="Oracle Cloud" href="/ru/install/oracle">Бессрочный бесплатный тариф ARM</Card>
  <Card title="Railway" href="/ru/install/railway">Настройка в браузере в один клик</Card>
  <Card title="Raspberry Pi" href="/ru/install/raspberry-pi">Самостоятельный хостинг на ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / бесплатный тариф)** также хорошо подходит.
Видеоинструкция от сообщества доступна по адресу
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс сообщества — может стать недоступен).

## Принципы работы облачных конфигураций

- **Gateway работает на VPS** и управляет состоянием и рабочей областью.
- Вы подключаетесь с ноутбука или телефона через **интерфейс управления** или **Tailscale/SSH**.
- Считайте VPS источником достоверных данных и регулярно создавайте **резервные копии** состояния и рабочей области.
- Безопасная конфигурация по умолчанию: оставьте Gateway на local loopback и обращайтесь к нему через туннель SSH или Tailscale Serve.
  При привязке к `lan` или `tailnet` Gateway требует общий секрет
  (`gateway.auth.token` или `gateway.auth.password`), если аутентификация не делегирована
  доверенному прокси.

Связанные страницы: [Удаленный доступ к Gateway](/ru/gateway/remote), [Обзор платформ](/ru/platforms).

## Сначала защитите административный доступ

Прежде чем устанавливать OpenClaw на общедоступный VPS, определите, как вы будете
администрировать сам сервер.

- Для административного доступа только через tailnet: сначала установите Tailscale, подключите VPS к своей
  сети tailnet, проверьте второй сеанс SSH через IP-адрес Tailscale или имя MagicDNS,
  затем ограничьте общедоступный доступ по SSH.
- Без Tailscale: примените аналогичные меры защиты для своего способа подключения по SSH, прежде чем
  открывать доступ к дополнительным службам.
- Это не относится к доступу к Gateway. OpenClaw по-прежнему можно привязать к
  local loopback и использовать туннель SSH или Tailscale Serve для панели управления.

Параметры Gateway для Tailscale описаны на странице [Tailscale](/ru/gateway/tailscale).

## Общий корпоративный агент на VPS

Один агент для всей команды — допустимая конфигурация, если все пользователи находятся
в одной доверенной среде, а агент используется только для рабочих задач.

- Используйте выделенную среду выполнения (VPS/виртуальную машину/контейнер и отдельного пользователя или учетные записи ОС).
- Не выполняйте в этой среде вход в личные учетные записи Apple/Google или личные профили браузера и менеджера паролей.
- Если пользователи не доверяют друг другу, разделите их по Gateway, хостам или пользователям ОС.

Подробности модели безопасности: [Безопасность](/ru/gateway/security).

## Использование узлов с VPS

Gateway можно оставить в облаке, а **узлы** сопрячь с локальными устройствами
(Mac/iOS/Android/без монитора). Узлы предоставляют локальные возможности экрана, камеры, холста и `system.run`,
при этом Gateway остается в облаке.

Документация: [Узлы](/ru/nodes), [CLI узлов](/ru/cli/nodes).

## Оптимизация запуска на небольших виртуальных машинах и ARM-хостах

Если команды CLI медленно выполняются на маломощных виртуальных машинах или ARM-хостах, включите кэш компиляции модулей Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ускоряет повторный запуск команд; при первом запуске кэш заполняется.
- `OPENCLAW_NO_RESPAWN=1` обеспечивает выполнение обычных перезапусков Gateway в текущем процессе, что устраняет дополнительные переключения между процессами и упрощает отслеживание PID на небольших хостах.
- Особенности Raspberry Pi описаны на странице [Raspberry Pi](/ru/install/raspberry-pi).

### Контрольный список настройки systemd (необязательно)

Для хостов виртуальных машин с `systemd` рекомендуется:

- Переменные среды службы для стабильного запуска: `OPENCLAW_NO_RESPAWN=1` и
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явная настройка перезапуска: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Диски на базе SSD для путей состояния и кэша, чтобы сократить задержки холодного запуска при произвольном вводе-выводе.

Стандартная команда `openclaw onboard --install-daemon` устанавливает пользовательский модуль
systemd; измените его с помощью команды:

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

Если вместо этого вы намеренно установили системный модуль, измените его командой
`sudo systemctl edit openclaw-gateway.service`.

Как политики `Restart=` помогают автоматическому восстановлению:
[systemd может автоматизировать восстановление службы](https://www.redhat.com/en/blog/systemd-automate-recovery).

Сведения о поведении Linux при нехватке памяти, выборе дочернего процесса для завершения и диагностике
`exit 137` см. в разделе [Нехватка памяти и завершение процессов механизмом OOM в Linux](/ru/platforms/linux#memory-pressure-and-oom-kills).

## Связанные материалы

- [Обзор установки](/ru/install)
- [DigitalOcean](/ru/install/digitalocean)
- [Fly.io](/ru/install/fly)
- [Hetzner](/ru/install/hetzner)
