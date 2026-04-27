---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Шукаєте недорогий VPS-хостинг для OpenClaw
summary: OpenClaw на DigitalOcean (простий платний варіант VPS)
title: DigitalOcean (платформа)
x-i18n:
    generated_at: "2026-04-27T07:09:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw на DigitalOcean

## Мета

Запустити постійний Gateway OpenClaw на DigitalOcean за **$6/місяць** (або $4/міс. із резервним тарифом).

Якщо вам потрібен варіант за $0/місяць і ви не заперечуєте проти ARM та специфічного для провайдера налаштування, дивіться [посібник з Oracle Cloud](/uk/install/oracle).

## Порівняння вартості (2026)

| Provider     | Plan            | Specs                  | Price/mo    | Notes                                 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | up to 4 OCPU, 24GB RAM | $0          | ARM, limited capacity / signup quirks |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | Cheapest paid option                  |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | Easy UI, good docs                    |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Many locations                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Now part of Akamai                    |

**Вибір провайдера:**

- DigitalOcean: найпростіший UX + передбачуване налаштування (цей посібник)
- Hetzner: хороше співвідношення ціни та продуктивності (див. [посібник з Hetzner](/uk/install/hetzner))
- Oracle Cloud: може коштувати $0/місяць, але більш вибагливий і лише ARM (див. [посібник з Oracle](/uk/install/oracle))

---

## Передумови

- обліковий запис DigitalOcean ([реєстрація з $200 безкоштовного кредиту](https://m.do.co/c/signup))
- пара SSH-ключів (або готовність використовувати автентифікацію за паролем)
- ~20 хвилин

## 1) Створіть Droplet

<Warning>
Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace 1-click образів, якщо ви не перевірили їхні startup scripts і типові налаштування firewall.
</Warning>

1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/)
2. Натисніть **Create → Droplets**
3. Виберіть:
   - **Region:** найближчий до вас (або ваших користувачів)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH key (рекомендовано) або password
4. Натисніть **Create Droplet**
5. Запишіть IP-адресу

## 2) Підключіться через SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Установіть OpenClaw

```bash
# Оновити систему
apt update && apt upgrade -y

# Установити Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Установити OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Перевірити
openclaw --version
```

## 4) Запустіть Onboarding

```bash
openclaw onboard --install-daemon
```

Майстер проведе вас через:

- автентифікацію моделі (API-ключі або OAuth)
- налаштування каналів (Telegram, WhatsApp, Discord тощо)
- токен Gateway (генерується автоматично)
- установлення демона (systemd)

## 5) Перевірте Gateway

```bash
# Перевірити стан
openclaw status

# Перевірити сервіс
systemctl --user status openclaw-gateway.service

# Переглянути логи
journalctl --user -u openclaw-gateway.service -f
```

## 6) Отримайте доступ до Dashboard

Gateway за замовчуванням прив’язується до loopback. Щоб отримати доступ до Control UI:

**Варіант A: SSH-тунель (рекомендовано)**

```bash
# На вашій локальній машині
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Потім відкрийте: http://localhost:18789
```

**Варіант B: Tailscale Serve (HTTPS, лише loopback)**

```bash
# На droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Налаштувати Gateway на використання Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Відкрийте: `https://<magicdns>/`

Примітки:

- Serve зберігає Gateway доступним лише через loopback і автентифікує трафік Control UI/WebSocket через заголовки ідентичності Tailscale (автентифікація без токена передбачає довірений хост gateway; HTTP API не використовують ці заголовки Tailscale, а натомість дотримуються звичайного режиму HTTP-автентифікації gateway).
- Щоб натомість вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

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
# Відскануйте QR-код
```

Інші провайдери дивіться в [Канали](/uk/channels).

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

Якщо у вас трапляються OOM, розгляньте такі варіанти:

- використовуйте моделі на основі API (Claude, GPT) замість локальних моделей
- установіть `agents.defaults.model.primary` на меншу модель

### Відстежуйте пам’ять

```bash
free -h
htop
```

---

## Постійність даних

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналу/провайдера та дані сеансів
- `~/.openclaw/workspace/` — робоча область (SOUL.md, пам’ять тощо)

Вони зберігаються після перезавантаження. Регулярно створюйте резервні копії:

```bash
openclaw backup create
```

---

## Безкоштовна альтернатива: Oracle Cloud

Oracle Cloud пропонує екземпляри **Always Free** ARM, які значно потужніші за будь-який платний варіант тут — за $0/місяць.

| Що ви отримуєте  | Характеристики        |
| ---------------- | --------------------- |
| **4 OCPU**       | ARM Ampere A1         |
| **24GB RAM**     | Більш ніж достатньо   |
| **200GB storage** | Block volume         |
| **Завжди безкоштовно** | Без списань із банківської картки |

**Застереження:**

- реєстрація може бути вибагливою (спробуйте ще раз, якщо не вдалося)
- архітектура ARM — більшість речей працює, але для деяких бінарних файлів потрібні ARM-збірки

Повний посібник із налаштування дивіться в [Oracle Cloud](/uk/install/oracle). Поради щодо реєстрації та усунення проблем із процесом підключення дивіться в цьому [посібнику спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Усунення проблем

### Gateway не запускається

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Порт уже використовується

```bash
lsof -i :18789
kill <PID>
```

### Недостатньо пам’яті

```bash
# Перевірити пам’ять
free -h

# Додати більше swap
# Або перейти на droplet за $12/міс. (2GB RAM)
```

---

## Пов’язане

- [посібник з Hetzner](/uk/install/hetzner) — дешевше, потужніше
- [Установлення через Docker](/uk/install/docker) — налаштування в контейнері
- [Tailscale](/uk/gateway/tailscale) — безпечний віддалений доступ
- [Конфігурація](/uk/gateway/configuration) — повна довідка з конфігурації
