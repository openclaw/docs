---
read_when:
    - Ви хочете запустити Gateway на сервері Linux або хмарному VPS
    - Вам потрібна швидка мапа посібників із хостингу
    - Вам потрібне загальне налаштування Linux-сервера для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на сервері Linux або хмарному VPS — вибір провайдера, архітектура та налаштування
title: Сервер Linux
x-i18n:
    generated_at: "2026-06-27T18:31:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Запускайте OpenClaw Gateway на будь-якому Linux-сервері або хмарному VPS. Ця сторінка допоможе вам
вибрати провайдера, пояснює, як працюють хмарні розгортання, і охоплює загальне налаштування Linux,
яке застосовується всюди.

## Виберіть провайдера

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері одним клацанням</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері одним клацанням</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Рівень Always Free ARM</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на Hetzner VPS</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS із налаштуванням одним клацанням</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM із HTTPS-проксі</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">Самостійний хостинг ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / безкоштовний рівень)** також добре працює.
Відеопокроковий посібник від спільноти доступний за адресою
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти -- може стати недоступним).

## Як працюють хмарні налаштування

- **Gateway працює на VPS** і володіє станом + робочою областю.
- Ви підключаєтеся з ноутбука або телефона через **інтерфейс керування** або **Tailscale/SSH**.
- Вважайте VPS джерелом істини та регулярно **створюйте резервні копії** стану + робочої області.
- Безпечне значення за замовчуванням: тримайте Gateway на loopback і отримуйте доступ через SSH-тунель або Tailscale Serve.
  Якщо ви прив’язуєтеся до `lan` або `tailnet`, вимагайте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [віддалений доступ до Gateway](/uk/gateway/remote), [хаб платформ](/uk/platforms).

## Спершу посильте захист адміністративного доступу

Перш ніж інсталювати OpenClaw на публічному VPS, вирішіть, як ви хочете адмініструвати
сам сервер.

- Якщо ви хочете адміністративний доступ лише через Tailnet, спершу інсталюйте Tailscale, приєднайте VPS
  до вашого tailnet, перевірте другий SSH-сеанс через IP-адресу Tailscale або
  назву MagicDNS, а потім обмежте публічний SSH.
- Якщо ви не використовуєте Tailscale, застосуйте еквівалентне посилення захисту для вашого SSH-
  шляху, перш ніж відкривати більше сервісів.
- Це окремо від доступу до Gateway. Ви все ще можете тримати OpenClaw прив’язаним до
  loopback і використовувати SSH-тунель або Tailscale Serve для панелі керування.

Параметри Gateway, специфічні для Tailscale, описано в [Tailscale](/uk/gateway/tailscale).

## Спільний агент компанії на VPS

Запуск одного агента для команди є припустимим налаштуванням, коли всі користувачі перебувають в одній межі довіри, а агент призначений лише для бізнесу.

- Тримайте його в окремому середовищі виконання (VPS/VM/контейнер + окремий користувач ОС/облікові записи).
- Не входьте в цьому середовищі виконання в особисті облікові записи Apple/Google або особисті профілі браузера/менеджера паролів.
- Якщо користувачі є взаємно недовіреними, розділіть їх за gateway/хостом/користувачем ОС.

Подробиці моделі безпеки: [Безпека](/uk/gateway/security).

## Використання вузлів із VPS

Ви можете тримати Gateway у хмарі та поєднати його з **вузлами** на ваших локальних пристроях
(Mac/iOS/Android/headless). Вузли надають локальні можливості screen/camera/canvas і `system.run`,
поки Gateway залишається в хмарі.

Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

## Налаштування запуску для малих VM і ARM-хостів

Якщо CLI-команди здаються повільними на малопотужних VM (або ARM-хостах), увімкніть кеш компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` покращує час запуску повторних команд.
- `OPENCLAW_NO_RESPAWN=1` тримає звичайні перезапуски Gateway у межах процесу, що уникає додаткових передавань між процесами та спрощує відстеження PID на малих хостах.
- Перший запуск команди прогріває кеш; наступні запуски швидші.
- Особливості Raspberry Pi див. у [Raspberry Pi](/uk/install/raspberry-pi).

### Контрольний список налаштування systemd (необов’язково)

Для VM-хостів, які використовують `systemd`, розгляньте:

- Додайте змінні середовища сервісу для стабільного шляху запуску:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Залишайте поведінку перезапуску явно заданою:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Надавайте перевагу дискам на SSD для шляхів стану/кешу, щоб зменшити штрафи холодного старту через випадкове введення-виведення.

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

Якщо ви навмисно інсталювали системний unit, відредагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd може автоматизувати відновлення сервісів](https://www.redhat.com/en/blog/systemd-automate-recovery).

Про поведінку Linux під час OOM, вибір дочірнього процесу-жертви та діагностику `exit 137`
див. [тиск на пам’ять Linux і OOM-завершення](/uk/platforms/linux#memory-pressure-and-oom-kills).

## Пов’язане

- [Огляд інсталяції](/uk/install)
- [DigitalOcean](/uk/install/digitalocean)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
