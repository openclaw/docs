---
read_when:
    - Ви хочете запустити Gateway на сервері Linux або хмарному VPS
    - Вам потрібен короткий огляд посібників із хостингу
    - Вам потрібна загальна оптимізація сервера Linux для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на сервері Linux або хмарному VPS — вибір провайдера, архітектура та тонке налаштування
title: Linux-сервер
x-i18n:
    generated_at: "2026-04-29T21:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Запустіть OpenClaw Gateway на будь-якому Linux-сервері або хмарному VPS. Ця сторінка допоможе вам
вибрати провайдера, пояснює, як працюють хмарні розгортання, і описує загальне
налаштування Linux, яке застосовується всюди.

## Виберіть провайдера

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері одним кліком</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері одним кліком</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Рівень Always Free ARM</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на Hetzner VPS</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS із налаштуванням одним кліком</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM з HTTPS-проксі</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">Самостійний хостинг на ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** також добре працює.
Покрокове відео від спільноти доступне за адресою
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти -- може стати недоступним).

## Як працюють хмарні налаштування

- **Gateway працює на VPS** і володіє станом + робочим простором.
- Ви підключаєтеся з ноутбука або телефона через **інтерфейс керування** або **Tailscale/SSH**.
- Вважайте VPS джерелом істини та регулярно **створюйте резервні копії** стану + робочого простору.
- Безпечний типовий варіант: залишайте Gateway на loopback і отримуйте доступ через SSH-тунель або Tailscale Serve.
  Якщо ви прив’язуєтеся до `lan` або `tailnet`, вимагайте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [Віддалений доступ до Gateway](/uk/gateway/remote), [Центр платформ](/uk/platforms).

## Спочатку захистіть адміністративний доступ

Перш ніж установлювати OpenClaw на публічний VPS, вирішіть, як ви хочете адмініструвати
сам сервер.

- Якщо вам потрібен адміністративний доступ лише через Tailnet, спочатку встановіть Tailscale, приєднайте VPS
  до вашого tailnet, перевірте другий SSH-сеанс через IP-адресу Tailscale або
  ім’я MagicDNS, а потім обмежте публічний SSH.
- Якщо ви не використовуєте Tailscale, застосуйте еквівалентне посилення захисту для вашого SSH
  шляху, перш ніж відкривати додаткові сервіси.
- Це окремо від доступу до Gateway. Ви все ще можете залишити OpenClaw прив’язаним до
  loopback і використовувати SSH-тунель або Tailscale Serve для панелі керування.

Параметри Gateway, специфічні для Tailscale, описані в [Tailscale](/uk/gateway/tailscale).

## Спільний агент компанії на VPS

Запуск одного агента для команди є допустимим налаштуванням, коли всі користувачі перебувають в одній зоні довіри, а агент призначений лише для бізнесу.

- Тримайте його в окремому середовищі виконання (VPS/VM/контейнер + окремий користувач ОС/облікові записи).
- Не входьте з цього середовища виконання в особисті облікові записи Apple/Google або особисті профілі браузера/менеджера паролів.
- Якщо користувачі можуть діяти один проти одного, розділіть їх за gateway/хостом/користувачем ОС.

Докладніше про модель безпеки: [Безпека](/uk/gateway/security).

## Використання вузлів із VPS

Ви можете тримати Gateway у хмарі та спарювати **вузли** на своїх локальних пристроях
(Mac/iOS/Android/headless). Вузли надають локальні можливості екрана/камери/canvas і `system.run`,
поки Gateway залишається в хмарі.

Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

## Налаштування запуску для малих VM і ARM-хостів

Якщо CLI-команди виконуються повільно на малопотужних VM (або ARM-хостах), увімкніть кеш компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` покращує час запуску повторних команд.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових накладних витрат запуску від шляху самоперезапуску.
- Перший запуск команди прогріває кеш; наступні запуски швидші.
- Для особливостей Raspberry Pi див. [Raspberry Pi](/uk/install/raspberry-pi).

### Контрольний список налаштування systemd (необов’язково)

Для VM-хостів, які використовують `systemd`, розгляньте:

- Додайте змінні середовища сервісу для стабільного шляху запуску:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Зробіть поведінку перезапуску явною:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Надавайте перевагу дискам на SSD для шляхів стану/кешу, щоб зменшити штрафи холодного запуску через випадковий I/O.

Для стандартного шляху `openclaw onboard --install-daemon` відредагуйте користувацький unit:

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

Якщо ви навмисно встановили system unit, відредагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd може автоматизувати відновлення сервісів](https://www.redhat.com/en/blog/systemd-automate-recovery).

Про поведінку Linux OOM, вибір дочірнього процесу як жертви та діагностику `exit 137`
див. [Тиск пам’яті Linux і OOM-завершення](/uk/platforms/linux#memory-pressure-and-oom-kills).

## Пов’язане

- [Огляд встановлення](/uk/install)
- [DigitalOcean](/uk/install/digitalocean)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
