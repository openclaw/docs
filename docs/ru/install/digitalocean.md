---
read_when:
    - Настройка OpenClaw в DigitalOcean
    - Ищете простой платный VPS для OpenClaw
summary: Размещение OpenClaw на Droplet в DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T11:29:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw на Droplet в DigitalOcean (около 6 долларов в месяц для тарифа Basic с 1 ГБ памяти).

DigitalOcean — простой вариант платного VPS. Более дешёвые или бесплатные варианты:

- [Hetzner](/ru/install/hetzner) — больше ядер и оперативной памяти за те же деньги.
- [Oracle Cloud](/ru/install/oracle) — всегда бесплатный тариф ARM (до 4 OCPU и 24 ГБ оперативной памяти), но при регистрации могут возникнуть сложности, а доступна только архитектура ARM.

## Предварительные требования

- Учётная запись DigitalOcean ([регистрация](https://cloud.digitalocean.com/registrations/new))
- Пара ключей SSH (либо готовность использовать аутентификацию по паролю)
- Около 20 минут

## Настройка

<Steps>
  <Step title="Создайте Droplet">
    <Warning>
    Используйте чистый базовый образ (Ubuntu 24.04 LTS). Избегайте сторонних образов Marketplace с установкой в один клик, если вы не проверили их сценарии запуска и настройки брандмауэра по умолчанию.
    </Warning>

    1. Войдите в [DigitalOcean](https://cloud.digitalocean.com/).
    2. Нажмите **Create > Droplets**.
    3. Выберите:
       - **Region:** ближайший к вам регион
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** ключ SSH (рекомендуется) или пароль
    4. Нажмите **Create Droplet** и запишите IP-адрес.

  </Step>

  <Step title="Подключитесь и установите">
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

    Используйте оболочку root только для первоначальной настройки системы. Выполняйте команды OpenClaw от имени непривилегированного пользователя `openclaw`, чтобы состояние хранилось в `/home/openclaw/.openclaw/`, а Gateway устанавливался как пользовательская служба systemd этого пользователя с параметром `--user`.

  </Step>

  <Step title="Выполните первоначальную настройку">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер проведёт вас через аутентификацию модели, настройку каналов, создание токена Gateway и установку фоновой службы (пользовательской службы systemd).

  </Step>

  <Step title="Добавьте файл подкачки (рекомендуется для Droplet с 1 ГБ памяти)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Проверьте Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Откройте интерфейс управления">
    По умолчанию Gateway привязывается к local loopback. Выберите один из следующих вариантов.

    **Вариант A: туннель SSH (самый простой)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Затем откройте `http://localhost:18789`.

    **Вариант B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Затем откройте `https://<magicdns>/` с любого устройства в вашей tailnet.

    Tailscale Serve аутентифицирует трафик интерфейса управления и WebSocket с помощью заголовков идентификации tailnet, что предполагает доверие к самому хосту Gateway. Конечные точки HTTP API при этом по-прежнему используют обычный режим аутентификации Gateway (токен или пароль). Чтобы при работе через Serve требовались явные общие секретные учётные данные, задайте `gateway.auth.allowTailscale: false` и используйте `gateway.auth.mode: "token"` или `"password"`.

    **Вариант C: привязка к tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Затем откройте `http://<tailscale-ip>:18789` (требуется токен).

  </Step>
</Steps>

## Постоянное хранение и резервные копии

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, учётные данные каналов и поставщиков, файл `auth-profiles.json` каждого агента и данные сеансов.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память и артефакты).

Эти данные сохраняются при перезагрузках Droplet. Чтобы создать переносимый снимок:

```bash
openclaw backup create
```

Снимки DigitalOcean создают резервную копию всего Droplet, а результат `openclaw backup create` можно переносить между хостами.

## Рекомендации для 1 ГБ оперативной памяти

Droplet за 6 долларов имеет всего 1 ГБ оперативной памяти. Чтобы обеспечить стабильную работу:

- Убедитесь, что указанный выше файл подкачки добавлен в `/etc/fstab`, чтобы он сохранялся после перезагрузок.
- Отдавайте предпочтение моделям через API (Claude, GPT), а не локальным моделям — для локального запуска LLM недостаточно 1 ГБ памяти.
- Если при обработке больших запросов возникает нехватка памяти, задайте для `agents.defaults.model.primary` модель меньшего размера.
- Отслеживайте использование ресурсов с помощью `free -h` и `htop`.

## Устранение неполадок

**Gateway не запускается** — выполните `openclaw doctor --non-interactive` и проверьте журналы командой `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже используется** — выполните `lsof -i :18789`, чтобы найти процесс, а затем остановите его.

**Недостаточно памяти** — убедитесь с помощью `free -h`, что файл подкачки активен. Если ошибки нехватки памяти сохраняются, вместо локальных моделей используйте модели через API (Claude, GPT) либо перейдите на Droplet с 2 ГБ памяти.

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие сервисы
- [Конфигурация Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Hetzner](/ru/install/hetzner)
- [Размещение на VPS](/ru/vps)
