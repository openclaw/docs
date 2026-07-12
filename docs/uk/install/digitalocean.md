---
read_when:
    - Налаштування OpenClaw у DigitalOcean
    - Шукаєте простий платний VPS для OpenClaw
summary: Розміщення OpenClaw на Droplet від DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T13:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Запустіть постійний Gateway OpenClaw на Droplet від DigitalOcean (приблизно $6/місяць за тариф Basic із 1 ГБ пам’яті).

DigitalOcean — простий платний варіант VPS. Дешевші або безкоштовні варіанти:

- [Hetzner](/uk/install/hetzner) — більше ядер і оперативної пам’яті за ту саму ціну.
- [Oracle Cloud](/uk/install/oracle) — безкоштовний тариф Always Free для ARM (до 4 OCPU та 24 ГБ оперативної пам’яті), але реєстрація може бути проблемною, а архітектура обмежена ARM.

## Передумови

- Обліковий запис DigitalOcean ([реєстрація](https://cloud.digitalocean.com/registrations/new))
- Пара ключів SSH (або готовність використовувати автентифікацію за паролем)
- Приблизно 20 хвилин

## Налаштування

<Steps>
  <Step title="Створіть Droplet">
    <Warning>
    Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх образів Marketplace для встановлення одним натисканням, якщо ви не перевірили їхні сценарії запуску та типові налаштування брандмауера.
    </Warning>

    1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/).
    2. Натисніть **Create > Droplets**.
    3. Виберіть:
       - **Region:** найближчий до вас
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 ГБ RAM / 25 ГБ SSD
       - **Authentication:** ключ SSH (рекомендовано) або пароль
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

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Використовуйте оболонку root лише для початкового налаштування системи. Запускайте команди OpenClaw від імені непривілейованого користувача `openclaw`, щоб стан зберігався в `/home/openclaw/.openclaw/`, а Gateway установлювався як служба systemd `--user` цього користувача.

  </Step>

  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через автентифікацію моделі, налаштування каналів, створення токена Gateway та встановлення фонової служби (користувацької служби systemd).

  </Step>

  <Step title="Додайте простір підкачки (рекомендовано для Droplet із 1 ГБ пам’яті)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Перевірте Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до інтерфейсу керування">
    За замовчуванням Gateway прив’язується до local loopback. Виберіть один із наведених варіантів.

    **Варіант A: тунель SSH (найпростіший)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Потім відкрийте `http://localhost:18789`.

    **Варіант B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Потім відкрийте `https://<magicdns>/` на будь-якому пристрої у вашій мережі tailnet.

    Tailscale Serve автентифікує трафік інтерфейсу керування та WebSocket за допомогою заголовків ідентичності tailnet, що передбачає довіру до самого хоста Gateway. Кінцеві точки HTTP API незалежно від цього й надалі використовують звичайний режим автентифікації Gateway (токен або пароль). Щоб вимагати явні облікові дані зі спільним секретом під час використання Serve, установіть `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

    **Варіант C: прив’язка до tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Потім відкрийте `http://<tailscale-ip>:18789` (потрібен токен).

  </Step>
</Steps>

## Збереження стану та резервні копії

Стан OpenClaw зберігається в таких каталогах:

- `~/.openclaw/` — `openclaw.json`, облікові дані каналів і постачальників, окремі для кожного агента файли `auth-profiles.json` та дані сеансів.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Ці дані зберігаються після перезавантаження Droplet. Щоб створити переносний знімок:

```bash
openclaw backup create
```

Знімки DigitalOcean створюють резервну копію всього Droplet; резервна копія, створена командою `openclaw backup create`, є переносною між хостами.

## Поради для 1 ГБ оперативної пам’яті

Droplet за $6 має лише 1 ГБ оперативної пам’яті. Щоб забезпечити стабільну роботу:

- Переконайтеся, що налаштування простору підкачки з попереднього кроку додано до `/etc/fstab`, щоб воно зберігалося після перезавантажень.
- Надавайте перевагу моделям із доступом через API (Claude, GPT), а не локальним моделям — для локального виконання LLM недостатньо 1 ГБ пам’яті.
- Якщо під час обробки великих запитів виникають помилки нестачі пам’яті, задайте для `agents.defaults.model.primary` меншу модель.
- Стежте за використанням ресурсів за допомогою `free -h` і `htop`.

## Усунення несправностей

**Gateway не запускається** — виконайте `openclaw doctor --non-interactive` і перевірте журнали командою `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже використовується** — виконайте `lsof -i :18789`, щоб знайти процес, а потім зупиніть його.

**Недостатньо пам’яті** — перевірте, чи активний простір підкачки, командою `free -h`. Якщо помилки нестачі пам’яті не зникають, перейдіть із локальних моделей на моделі з доступом через API (Claude, GPT) або оновіть Droplet до конфігурації з 2 ГБ пам’яті.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord тощо
- [Налаштування Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — підтримуйте OpenClaw в актуальному стані

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
- [Розміщення на VPS](/uk/vps)
