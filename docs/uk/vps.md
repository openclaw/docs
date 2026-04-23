---
read_when:
    - Ви хочете запустити Gateway на Linux-сервері або cloud VPS
    - Вам потрібна швидка мапа посібників з хостингу
    - Ви хочете загальні налаштування OpenClaw для Linux-сервера
sidebarTitle: Linux Server
summary: Запуск OpenClaw на Linux-сервері або cloud VPS — вибір provider-а, архітектура та налаштування
title: Linux-сервер
x-i18n:
    generated_at: "2026-04-23T21:18:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74f0cfdc50684bc7e55e88f20f7ca5971af4eb19470be44a1c14f70791993a4f
    source_path: vps.md
    workflow: 15
---

Запустіть Gateway OpenClaw на будь-якому Linux-сервері або cloud VPS. Ця сторінка допоможе
вибрати provider-а, пояснює, як працюють cloud deployments, і описує загальні Linux-
налаштування, що застосовуються всюди.

## Вибір provider-а

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері в один клік</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері в один клік</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на VPS Hetzner</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS з налаштуванням в один клік</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM з HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** також добре підходить.
Доступне відео зі спільноти:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти — може стати недоступним).

## Як працюють cloud-налаштування

- **Gateway працює на VPS** і володіє state + workspace.
- Ви підключаєтеся зі свого ноутбука або телефона через **Control UI** або **Tailscale/SSH**.
- Сприймайте VPS як джерело істини й **регулярно створюйте резервні копії** state + workspace.
- Безпечне типове налаштування: тримайте Gateway на loopback і отримуйте до нього доступ через SSH tunnel або Tailscale Serve.
  Якщо ви прив’язуєте його до `lan` або `tailnet`, вимагайте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [Gateway remote access](/uk/gateway/remote), [Platforms hub](/uk/platforms).

## Спільний агент компанії на VPS

Запуск одного агента для команди — це валідний сценарій, коли всі користувачі знаходяться в одній межі довіри, а агент використовується лише для бізнесу.

- Тримайте його на виділеному runtime (VPS/VM/container + окремий користувач/облікові записи ОС).
- Не виконуйте вхід у цей runtime під особистими обліковими записами Apple/Google або в особистих профілях браузера/менеджера паролів.
- Якщо користувачі є потенційно ворожими один до одного, розділяйте їх за gateway/host/користувачем ОС.

Подробиці моделі безпеки: [Security](/uk/gateway/security).

## Використання Node з VPS

Ви можете тримати Gateway у cloud і виконати pairing **Node** на своїх локальних пристроях
(Mac/iOS/Android/headless). Nodes надають локальні можливості screen/camera/canvas і `system.run`,
тоді як Gateway залишається в cloud.

Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

## Налаштування startup для малих VM і ARM-хостів

Якщо команди CLI здаються повільними на малопотужних VM (або ARM-хостах), увімкніть compile cache модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` покращує час startup для повторних запусків команд.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових накладних витрат startup через self-respawn path.
- Перший запуск команди прогріває cache; наступні запуски працюють швидше.
- Специфіку Raspberry Pi див. у [Raspberry Pi](/uk/install/raspberry-pi).

### Контрольний список налаштування systemd (необов’язково)

Для VM-хостів, які використовують `systemd`, розгляньте:

- Додати service env для стабільного шляху startup:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно задати поведінку restart:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Віддавати перевагу SSD-backed disks для шляхів state/cache, щоб зменшити cold-start penalties від випадкового I/O.

Для стандартного шляху `openclaw onboard --install-daemon` відредагуйте user unit:

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

Якщо ви навмисно встановили system unit, натомість редагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Для поведінки Linux при OOM, вибору жертви серед дочірніх процесів і діагностики
`exit 137` див. [Linux memory pressure and OOM kills](/uk/platforms/linux#memory-pressure-and-oom-kills).
