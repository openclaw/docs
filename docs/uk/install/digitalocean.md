---
read_when:
    - Налаштування OpenClaw у DigitalOcean
    - Пошук простого платного VPS для OpenClaw
summary: Розмістити OpenClaw на Droplet у DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-23T20:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d09892df95c64a24c0d094e00bf93c0589ec2977880e47c9e0492e037588eb9
    source_path: install/digitalocean.md
    workflow: 15
---

Запустіть постійний Gateway OpenClaw на Droplet у DigitalOcean.

## Передумови

- Обліковий запис DigitalOcean ([реєстрація](https://cloud.digitalocean.com/registrations/new))
- Пара ключів SSH (або готовність використовувати автентифікацію за паролем)
- Приблизно 20 хвилин

## Налаштування

<Steps>
  <Step title="Створіть Droplet">
    <Warning>
    Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace 1-click образів, якщо ви не перевірили їхні стартові скрипти та типові параметри фаєрвола.
    </Warning>

    1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/).
    2. Натисніть **Create > Droplets**.
    3. Виберіть:
       - **Region:** найближчий до вас
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** ключ SSH (рекомендовано) або пароль
    4. Натисніть **Create Droplet** і запишіть IP-адресу.

  </Step>

  <Step title="Підключіться та встановіть">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через автентифікацію моделі, налаштування каналів, генерацію токена gateway і встановлення daemon (systemd).

  </Step>

  <Step title="Додайте swap (рекомендовано для Droplet з 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Перевірте gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до Control UI">
    Gateway типово прив’язується до loopback. Виберіть один із цих варіантів.

    **Варіант A: SSH-тунель (найпростіше)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Потім відкрийте `http://localhost:18789`.

    **Варіант B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Потім відкрийте `https://<magicdns>/` з будь-якого пристрою у вашому tailnet.

    **Варіант C: Прив’язка до tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Потім відкрийте `http://<tailscale-ip>:18789` (потрібен токен).

  </Step>
</Steps>

## Усунення проблем

**Gateway не запускається** -- Запустіть `openclaw doctor --non-interactive` і перевірте логи через `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже використовується** -- Запустіть `lsof -i :18789`, щоб знайти процес, а потім зупиніть його.

**Бракує пам’яті** -- Переконайтеся, що swap активний, за допомогою `free -h`. Якщо OOM все одно трапляється, використовуйте моделі на основі API (Claude, GPT) замість локальних моделей або перейдіть на Droplet з 2 GB.

## Наступні кроки

- [Channels](/uk/channels) -- підключіть Telegram, WhatsApp, Discord тощо
- [Gateway configuration](/uk/gateway/configuration) -- усі параметри конфігурації
- [Updating](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані
