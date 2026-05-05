---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Пошук простого платного VPS для OpenClaw
summary: Розмістіть OpenClaw на DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-05T16:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Запустіть постійний OpenClaw Gateway на DigitalOcean Droplet (~$6/місяць за план Basic на 1 GB).

DigitalOcean — найпростіший платний шлях через VPS. Якщо ви віддаєте перевагу дешевшим або безкоштовним варіантам:

- [Hetzner](/uk/install/hetzner) — €3.79/міс., більше ядер/RAM за ті самі гроші.
- [Oracle Cloud](/uk/install/oracle) — Always Free ARM (до 4 OCPU, 24 GB RAM), але реєстрація може бути вибагливою, і доступний лише ARM.

## Передумови

- Обліковий запис DigitalOcean ([реєстрація](https://cloud.digitalocean.com/registrations/new))
- Пара SSH-ключів (або готовність використовувати автентифікацію паролем)
- Приблизно 20 хвилин

## Налаштування

<Steps>
  <Step title="Створіть Droplet">
    <Warning>
    Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх образів Marketplace з установленням в один клік, якщо ви не перевірили їхні стартові скрипти та типові налаштування firewall.
    </Warning>

    1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/).
    2. Натисніть **Create > Droplets**.
    3. Виберіть:
       - **Регіон:** найближчий до вас
       - **Образ:** Ubuntu 24.04 LTS
       - **Розмір:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Автентифікація:** SSH-ключ (рекомендовано) або пароль
    4. Натисніть **Create Droplet** і занотуйте IP-адресу.

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

    Майстер проведе вас через автентифікацію моделі, налаштування каналу, створення токена Gateway та встановлення демона (systemd).

  </Step>

  <Step title="Додайте swap (рекомендовано для Droplet на 1 GB)">
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

    **Варіант A: SSH-тунель (найпростіший)**

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

    Потім відкрийте `https://<magicdns>/` з будь-якого пристрою у вашій tailnet.

    Tailscale Serve автентифікує Control UI і WebSocket-трафік через заголовки ідентичності tailnet, що передбачає довіру до самого хоста gateway. Кінцеві точки HTTP API дотримуються звичайного режиму автентифікації gateway (токен/пароль) незалежно від цього. Щоб вимагати явні облікові дані зі спільним секретом через Serve, задайте `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

    **Варіант C: прив’язка до tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Потім відкрийте `http://<tailscale-ip>:18789` (потрібен токен).

  </Step>
</Steps>

## Збереження стану та резервні копії

Стан OpenClaw зберігається в:

- `~/.openclaw/` — `openclaw.json`, окремі для агентів `auth-profiles.json`, стан каналів/провайдерів і дані сесій.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Вони зберігаються після перезавантажень Droplet. Щоб створити переносний знімок:

```bash
openclaw backup create
```

Знімки DigitalOcean резервно копіюють увесь Droplet; `openclaw backup create` переносний між хостами.

## Поради для 1 GB RAM

Droplet за $6 має лише 1 GB RAM. Щоб усе працювало плавно:

- Переконайтеся, що крок зі swap вище є в `/etc/fstab`, щоб він зберігався після перезавантажень.
- Надавайте перевагу моделям на основі API (Claude, GPT), а не локальним — локальний інференс LLM не вміщується в 1 GB.
- Задайте `agents.defaults.model.primary` як меншу модель, якщо стикаєтеся з OOM на великих промптах.
- Моніторте за допомогою `free -h` і `htop`.

## Усунення несправностей

**Gateway не запускається** -- Запустіть `openclaw doctor --non-interactive` і перевірте логи за допомогою `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже використовується** -- Запустіть `lsof -i :18789`, щоб знайти процес, а потім зупиніть його.

**Бракує пам’яті** -- Перевірте, що swap активний, за допомогою `free -h`. Якщо OOM усе ще трапляється, використовуйте моделі на основі API (Claude, GPT) замість локальних моделей або оновіть Droplet до 2 GB.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
- [VPS-хостинг](/uk/vps)
