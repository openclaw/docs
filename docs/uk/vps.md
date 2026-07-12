---
read_when:
    - Ви хочете запустити Gateway на сервері Linux або хмарному VPS
    - Вам потрібен стислий огляд посібників із хостингу
    - Вам потрібне загальне налаштування сервера Linux для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на сервері Linux або хмарному VPS — вибір провайдера, архітектура та налаштування
title: Сервер Linux
x-i18n:
    generated_at: "2026-07-12T13:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Запустіть OpenClaw Gateway на будь-якому сервері Linux або хмарному VPS. Ця сторінка допоможе вам
вибрати постачальника, пояснить принцип роботи хмарних розгортань і охопить загальне
налаштування Linux, застосовне в будь-якому середовищі.

## Вибір постачальника

<CardGroup cols={2}>
  <Card title="Azure" href="/uk/install/azure">Віртуальна машина Linux</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">Віртуальна машина з HTTPS-проксі</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на VPS від Hetzner</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS із налаштуванням одним натисканням</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування у браузері одним натисканням</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Завжди безкоштовний тариф ARM</Card>
  <Card title="Railway" href="/uk/install/railway">Налаштування у браузері одним натисканням</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">Самостійне розміщення на ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / безкоштовний тариф)** також добре підходить.
Відеопосібник від спільноти доступний за адресою
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти — може стати недоступним).

## Принцип роботи хмарних конфігурацій

- **Gateway працює на VPS** і зберігає стан та робочий простір.
- Ви підключаєтеся з ноутбука або телефона через **інтерфейс керування** чи **Tailscale/SSH**.
- Вважайте VPS джерелом достовірних даних і регулярно створюйте **резервні копії** стану та робочого простору.
- Безпечний варіант за замовчуванням: залиште Gateway на local loopback і отримуйте доступ через тунель SSH або Tailscale Serve.
  Якщо ви прив’язуєте його до `lan` або `tailnet`, Gateway потребує спільного секрету
  (`gateway.auth.token` або `gateway.auth.password`), якщо автентифікацію не делеговано
  довіреному проксі.

Пов’язані сторінки: [Віддалений доступ до Gateway](/uk/gateway/remote), [Центр платформ](/uk/platforms).

## Спочатку захистіть адміністративний доступ

Перш ніж установлювати OpenClaw на загальнодоступному VPS, визначте, як ви хочете адмініструвати
сам сервер.

- Для адміністративного доступу лише через Tailnet: спочатку встановіть Tailscale, приєднайте VPS до своєї
  мережі tailnet, перевірте другий сеанс SSH через IP-адресу Tailscale або ім’я MagicDNS,
  а потім обмежте загальнодоступний доступ SSH.
- Без Tailscale: застосуйте еквівалентні заходи захисту для свого способу доступу через SSH, перш ніж
  відкривати доступ до додаткових служб.
- Це не стосується доступу до Gateway. Ви все одно можете залишити OpenClaw прив’язаним до
  local loopback і використовувати тунель SSH або Tailscale Serve для панелі керування.

Специфічні для Tailscale параметри Gateway описано на сторінці [Tailscale](/uk/gateway/tailscale).

## Спільний корпоративний агент на VPS

Запуск одного агента для команди є припустимою конфігурацією, якщо всі користувачі перебувають
у межах одного контуру довіри, а агент використовується лише для робочих завдань.

- Використовуйте для нього окреме середовище виконання (VPS/віртуальна машина/контейнер + окремий користувач ОС або окремі облікові записи).
- Не входьте в особисті облікові записи Apple/Google або особисті профілі браузера чи менеджера паролів у цьому середовищі виконання.
- Якщо користувачі можуть діяти вороже один щодо одного, розділіть їх за Gateway, хостом або користувачем ОС.

Докладніше про модель безпеки: [Безпека](/uk/gateway/security).

## Використання вузлів із VPS

Ви можете залишити Gateway у хмарі та сполучити **вузли** на своїх локальних пристроях
(Mac/iOS/Android/безголовому пристрої). Вузли надають локальні можливості екрана, камери, полотна та `system.run`,
а Gateway залишається у хмарі.

Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

## Налаштування запуску для малих віртуальних машин і хостів ARM

Якщо команди CLI виконуються повільно на малопотужних віртуальних машинах (або хостах ARM), увімкніть кеш компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` пришвидшує повторний запуск команд; під час першого запуску кеш заповнюється.
- `OPENCLAW_NO_RESPAWN=1` дає змогу виконувати звичайні перезапуски Gateway у межах поточного процесу, що усуває додаткову передачу керування між процесами та спрощує відстеження PID на малих хостах.
- Особливості Raspberry Pi наведено на сторінці [Raspberry Pi](/uk/install/raspberry-pi).

### Контрольний список налаштування systemd (необов’язково)

Для хостів віртуальних машин, які використовують `systemd`, розгляньте такі налаштування:

- Змінні середовища служби для стабільного запуску: `OPENCLAW_NO_RESPAWN=1` і
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно задана поведінка перезапуску: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Диски на основі SSD для шляхів стану та кешу, щоб зменшити затримки холодного запуску через випадкові операції введення-виведення.

Стандартний шлях `openclaw onboard --install-daemon` установлює користувацький модуль
systemd; відредагуйте його командою:

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

Якщо ви свідомо встановили системний модуль, відредагуйте його командою
`sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd може автоматизувати відновлення служби](https://www.redhat.com/en/blog/systemd-automate-recovery).

Відомості про поведінку Linux у разі нестачі пам’яті, вибір дочірнього процесу для примусового завершення та
діагностику `exit 137` дивіться на сторінці [Нестача пам’яті та примусове завершення процесів OOM у Linux](/uk/platforms/linux#memory-pressure-and-oom-kills).

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [DigitalOcean](/uk/install/digitalocean)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
