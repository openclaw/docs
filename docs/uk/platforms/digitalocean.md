---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Пошук недорогого VPS-хостингу для OpenClaw
summary: OpenClaw на DigitalOcean (простий платний варіант VPS)
title: DigitalOcean (платформа)
x-i18n:
    generated_at: "2026-04-23T21:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3783fd8036e1a6c5239fe50e61e369f1abc410a8bf027c241c053c3e4082a19c
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw на DigitalOcean

## Мета

Запустити постійний Gateway OpenClaw на DigitalOcean за **$6/місяць** (або $4/місяць за резервним тарифом).

Якщо вам потрібен варіант за $0/місяць і вас не лякають ARM + специфічне для провайдера налаштування, див. [посібник для Oracle Cloud](/uk/install/oracle).

## Порівняння вартості (2026)

| Провайдер    | План            | Характеристики          | Ціна/міс     | Примітки                              |
| ------------ | --------------- | ----------------------- | ------------ | ------------------------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24GB RAM     | $0           | ARM, обмежена ємність / нюанси реєстрації |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM         | €3.79 (~$4)  | Найдешевший платний варіант           |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM         | $6           | Простий UI, хороша документація       |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM         | $6           | Багато локацій                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM         | $5           | Тепер частина Akamai                  |

**Вибір провайдера:**

- DigitalOcean: найпростіший UX + передбачуване налаштування (цей посібник)
- Hetzner: хороше співвідношення ціни/продуктивності (див. [посібник для Hetzner](/uk/install/hetzner))
- Oracle Cloud: може коштувати $0/місяць, але більш вибагливий і лише ARM (див. [посібник для Oracle](/uk/install/oracle))

---

## Передумови

- Обліковий запис DigitalOcean ([реєстрація з безкоштовним кредитом $200](https://m.do.co/c/signup))
- Пара SSH-ключів (або готовність використовувати автентифікацію паролем)
- ~20 хвилин

## 1) Створіть Droplet

<Warning>
Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace 1-click образів, якщо ви не перевірили їхні стартові скрипти та типові налаштування фаєрвола.
</Warning>

1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/)
2. Натисніть **Create → Droplets**
3. Виберіть:
   - **Region:** найближчий до вас (або ваших користувачів)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH key (рекомендовано) або пароль
4. Натисніть **Create Droplet**
5. Запишіть IP-адресу

## 2) Підключіться через SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Установіть OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Запустіть Onboarding

```bash
openclaw onboard --install-daemon
```

Майстер проведе вас через:

- auth моделі (API-ключі або OAuth)
- налаштування каналів (Telegram, WhatsApp, Discord тощо)
- токен Gateway (генерується автоматично)
- установлення демона (systemd)

## 5) Перевірте Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Отримайте доступ до панелі керування

За замовчуванням gateway прив’язується до loopback. Щоб отримати доступ до Control UI:

**Варіант A: SSH Tunnel (рекомендовано)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Варіант B: Tailscale Serve (HTTPS, лише loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Відкрийте: `https://<magicdns>/`

Примітки:

- Serve зберігає Gateway доступним лише через loopback і автентифікує трафік Control UI/WebSocket через заголовки ідентичності Tailscale (автентифікація без токена передбачає довірений хост gateway; HTTP API не використовують ці заголовки Tailscale, а натомість дотримуються звичайного HTTP-режиму автентифікації gateway).
- Щоб натомість вимагати явні credentials через спільний секрет, задайте `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

**Варіант C: прив’язка tailnet (без Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Відкрийте: `http://<tailscale-ip>:18789` (потрібен токен).

## 7) Підключіть свої канали

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Інші провайдери див. у [Каналах](/uk/channels).

---

## Оптимізації для 1GB RAM

Droplet за $6 має лише 1GB RAM. Щоб усе працювало стабільно:

### Додайте swap (рекомендовано)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Використовуйте легшу модель

Якщо виникають OOM, варто:

- використовувати моделі через API (Claude, GPT) замість локальних моделей
- задати меншу модель у `agents.defaults.model.primary`

### Слідкуйте за пам’яттю

```bash
free -h
htop
```

---

## Збереження стану

Увесь state зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів і дані сесій
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory тощо)

Ці дані переживають перезавантаження. Періодично робіть резервні копії:

```bash
openclaw backup create
```

---

## Безкоштовна альтернатива Oracle Cloud

Oracle Cloud пропонує **Always Free** ARM-екземпляри, які значно потужніші за будь-який платний варіант тут — за $0/місяць.

| Що ви отримуєте   | Характеристики        |
| ----------------- | --------------------- |
| **4 OCPUs**       | ARM Ampere A1         |
| **24GB RAM**      | Більш ніж достатньо   |
| **200GB storage** | Block volume          |
| **Назавжди безкоштовно** | Без списань з картки |

**Застереження:**

- Реєстрація може бути вибагливою (повторіть, якщо не вдається)
- ARM-архітектура — більшість речей працює, але деяким бінарникам потрібні ARM-збірки

Повний посібник із налаштування див. у [Oracle Cloud](/uk/install/oracle). Поради щодо реєстрації та усунення проблем із процесом підключення див. в цьому [посібнику від спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Усунення несправностей

### Gateway не запускається

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Порт уже зайнятий

```bash
lsof -i :18789
kill <PID>
```

### Недостатньо пам’яті

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Див. також

- [Посібник для Hetzner](/uk/install/hetzner) — дешевше, потужніше
- [Встановлення через Docker](/uk/install/docker) — контейнеризоване налаштування
- [Tailscale](/uk/gateway/tailscale) — безпечний віддалений доступ
- [Конфігурація](/uk/gateway/configuration) — повний довідник із конфігурації
