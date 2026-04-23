---
read_when:
    - Ви хочете запустити Gateway на Linux-сервері або хмарному VPS
    - Вам потрібен короткий огляд посібників із хостингу
    - Вам потрібне загальне налаштування Linux-сервера для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на Linux-сервері або хмарному VPS — вибір провайдера, архітектура та налаштування продуктивності
title: Linux-сервер
x-i18n:
    generated_at: "2026-04-23T04:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Linux-сервер

Запустіть Gateway OpenClaw на будь-якому Linux-сервері або хмарному VPS. Ця сторінка допоможе вам
вибрати провайдера, пояснює, як працюють хмарні розгортання, і охоплює загальне
налаштування Linux, яке застосовується всюди.

## Вибір провайдера

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері в один клік</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері в один клік</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Завжди безкоштовний ARM-рівень</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на VPS Hetzner</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS із налаштуванням в один клік</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM із HTTPS-проксі</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">ARM із самостійним хостингом</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** також добре підходить.
Відеоогляд від спільноти доступний за посиланням
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти — може стати недоступним).

## Як працюють хмарні налаштування

- **Gateway працює на VPS** і зберігає стан + робочий простір.
- Ви підключаєтеся зі свого ноутбука або телефона через **Control UI** або **Tailscale/SSH**.
- Вважайте VPS джерелом істини та регулярно **створюйте резервні копії** стану + робочого простору.
- Безпечний варіант за замовчуванням: тримайте Gateway на loopback і отримуйте до нього доступ через SSH-тунель або Tailscale Serve.
  Якщо ви прив’язуєте його до `lan` або `tailnet`, обов’язково використовуйте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [Віддалений доступ до Gateway](/uk/gateway/remote), [Центр платформ](/uk/platforms).

## Спільний агент компанії на VPS

Запуск одного агента для команди — цілком прийнятний варіант, якщо всі користувачі перебувають в одній межі довіри, а агент використовується лише для бізнесу.

- Тримайте його в окремому середовищі виконання (VPS/VM/контейнер + окремий користувач або облікові записи ОС).
- Не входьте в цьому середовищі до особистих облікових записів Apple/Google або особистих профілів браузера/менеджера паролів.
- Якщо користувачі є потенційними противниками один для одного, розділяйте їх за gateway/хостом/користувачем ОС.

Подробиці моделі безпеки: [Безпека](/uk/gateway/security).

## Використання вузлів із VPS

Ви можете тримати Gateway у хмарі та підключати **вузли** на своїх локальних пристроях
(Mac/iOS/Android/headless). Вузли надають локальні можливості screen/camera/canvas і `system.run`,
тоді як Gateway залишається в хмарі.

Документація: [Вузли](/uk/nodes), [CLI вузлів](/cli/nodes).

## Налаштування запуску для малих VM і ARM-хостів

Якщо команди CLI працюють повільно на малопотужних VM (або ARM-хостах), увімкніть кеш компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` пришвидшує повторні запуски команд.
- `OPENCLAW_NO_RESPAWN=1` усуває додаткові накладні витрати запуску через шлях самоперезапуску.
- Перший запуск команди прогріває кеш; наступні запуски працюють швидше.
- Докладніше саме для Raspberry Pi див. [Raspberry Pi](/uk/install/raspberry-pi).

### Контрольний список налаштування systemd (необов’язково)

Для VM-хостів, які використовують `systemd`, розгляньте таке:

- Додайте змінні середовища сервісу для стабільного шляху запуску:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно задайте поведінку перезапуску:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Віддавайте перевагу дискам на SSD для шляхів стану/кешу, щоб зменшити штрафи холодного старту через випадковий I/O.

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

Якщо ви навмисно встановили системний unit, натомість редагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматичному відновленню:
[systemd може автоматизувати відновлення сервісів](https://www.redhat.com/en/blog/systemd-automate-recovery).

Про поведінку OOM у Linux, вибір жертви серед дочірніх процесів і діагностику `exit 137`
див. [Тиск на пам’ять Linux і завершення через OOM](/uk/platforms/linux#memory-pressure-and-oom-kills).
