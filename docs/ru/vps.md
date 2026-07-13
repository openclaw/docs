---
read_when:
    - Вы хотите запустить Gateway на сервере Linux или облачном VPS
    - Вам нужен краткий обзор руководств по хостингу
    - Вам нужна общая настройка сервера Linux для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на сервере Linux или облачном VPS — выбор провайдера, архитектура и оптимизация
title: Сервер Linux
x-i18n:
    generated_at: "2026-07-13T18:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Запускайте Gateway OpenClaw на любом Linux-сервере или облачном VPS. Эта страница поможет
выбрать провайдера, объяснит принципы работы облачных развертываний и охватит общую
настройку Linux, применимую в любой среде.

## Выбор провайдера

<CardGroup cols={2}>
  <Card title="Azure" href="/ru/install/azure">Виртуальная машина Linux</Card>
  <Card title="DigitalOcean" href="/ru/install/digitalocean">Простой платный VPS</Card>
  <Card title="exe.dev" href="/ru/install/exe-dev">Виртуальная машина с HTTPS-прокси</Card>
  <Card title="Fly.io" href="/ru/install/fly">Машины Fly</Card>
  <Card title="GCP" href="/ru/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/ru/install/hetzner">Docker на VPS Hetzner</Card>
  <Card title="Hostinger" href="/ru/install/hostinger">VPS с настройкой в один щелчок</Card>
  <Card title="Northflank" href="/ru/install/northflank">Настройка в браузере в один щелчок</Card>
  <Card title="Oracle Cloud" href="/ru/install/oracle">Всегда бесплатный тариф ARM</Card>
  <Card title="Railway" href="/ru/install/railway">Настройка в браузере в один щелчок</Card>
  <Card title="Raspberry Pi" href="/ru/install/raspberry-pi">Самостоятельное размещение на ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / бесплатный тариф)** также хорошо подходит.
Видеоруководство от сообщества доступно по адресу
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс сообщества — может стать недоступен).

## Как работают облачные конфигурации

- **Gateway работает на VPS** и управляет состоянием и рабочим пространством.
- Вы подключаетесь с ноутбука или телефона через **интерфейс управления** или **Tailscale/SSH**.
- Считайте VPS источником достоверных данных и регулярно создавайте **резервные копии** состояния и рабочего пространства.
- Безопасная конфигурация по умолчанию: оставьте Gateway привязанным к loopback-интерфейсу и подключайтесь к нему через SSH-туннель или Tailscale Serve.
  Если привязать его к `lan` или `tailnet`, Gateway потребует общий секрет
  (`gateway.auth.token` или `gateway.auth.password`), если аутентификация не делегирована
  доверенному прокси.

Связанные страницы: [Удаленный доступ к Gateway](/ru/gateway/remote), [Обзор платформ](/ru/platforms).

## Сначала защитите административный доступ

Перед установкой OpenClaw на общедоступный VPS определите, как вы будете администрировать
сам сервер.

- Для административного доступа только через tailnet: сначала установите Tailscale, подключите VPS к своей
  tailnet, проверьте второй сеанс SSH через IP-адрес Tailscale или имя MagicDNS,
  а затем ограничьте общедоступный доступ по SSH.
- Без Tailscale: примените эквивалентные меры защиты для своего способа доступа по SSH, прежде чем
  открывать доступ к дополнительным сервисам.
- Это не относится к доступу к Gateway. OpenClaw по-прежнему можно оставить привязанным к
  loopback-интерфейсу и использовать SSH-туннель или Tailscale Serve для панели управления.

Параметры Gateway, относящиеся к Tailscale, описаны в разделе [Tailscale](/ru/gateway/tailscale).

## Общий корпоративный агент на VPS

Запуск одного агента для команды является допустимой конфигурацией, если все пользователи находятся в
одной зоне доверия, а агент используется только для рабочих задач.

- Используйте для него выделенную среду выполнения (VPS/виртуальную машину/контейнер и отдельного пользователя/учетные записи ОС).
- Не выполняйте в этой среде вход в личные учетные записи Apple/Google или личные профили браузера/менеджера паролей.
- Если пользователи не доверяют друг другу, разделите их по экземплярам Gateway, хостам или пользователям ОС.

Подробности модели безопасности: [Безопасность](/ru/gateway/security).

## Использование узлов с VPS

Gateway можно оставить в облаке и связать с ним **узлы** на локальных устройствах
(Mac/iOS/Android/без графического интерфейса). Узлы предоставляют локальные возможности экрана, камеры, холста и `system.run`,
а Gateway остается в облаке.

Документация: [Узлы](/ru/nodes), [CLI узлов](/ru/cli/nodes).

## Настройка запуска для маломощных виртуальных машин и ARM-хостов

Если команды CLI выполняются медленно на маломощных виртуальных машинах (или ARM-хостах), включите кеш компиляции модулей Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ускоряет повторный запуск команд; при первом запуске кеш заполняется.
- `OPENCLAW_NO_RESPAWN=1` выполняет обычные перезапуски Gateway внутри текущего процесса, что позволяет избежать дополнительной передачи управления между процессами и упрощает отслеживание PID на маломощных хостах.
- Особенности Raspberry Pi описаны в разделе [Raspberry Pi](/ru/install/raspberry-pi).

### Контрольный список настройки systemd (необязательно)

Для хостов виртуальных машин, использующих `systemd`, рекомендуется следующее:

- Переменные окружения сервиса для стабильного запуска: `OPENCLAW_NO_RESPAWN=1` и
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно заданное поведение перезапуска: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Диски на базе SSD для путей состояния и кеша, чтобы сократить задержки холодного запуска из-за операций произвольного ввода-вывода.

Стандартный путь `openclaw onboard --install-daemon` устанавливает пользовательский
модуль systemd; измените его с помощью:

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

Если вместо этого вы намеренно установили системный модуль, измените его с помощью
`sudo systemctl edit openclaw-gateway.service`.

Как политики `Restart=` помогают автоматическому восстановлению:
[systemd может автоматизировать восстановление сервисов](https://www.redhat.com/en/blog/systemd-automate-recovery).

Сведения о поведении Linux при нехватке памяти, выборе дочернего процесса для завершения и диагностике
`exit 137` см. в разделе [Нехватка памяти и завершение процессов OOM в Linux](/ru/platforms/linux#memory-pressure-and-oom-kills).

## Связанные материалы

- [Обзор установки](/ru/install)
- [DigitalOcean](/ru/install/digitalocean)
- [Fly.io](/ru/install/fly)
- [Hetzner](/ru/install/hetzner)
