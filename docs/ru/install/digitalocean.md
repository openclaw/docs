---
read_when:
    - Настройка OpenClaw на DigitalOcean
    - Ищете простой платный VPS для OpenClaw
summary: Разверните OpenClaw на DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-06-28T23:05:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway на DigitalOcean Droplet (~$6/месяц за тариф Basic на 1 ГБ).

DigitalOcean — самый простой платный путь через VPS. Если вы предпочитаете более дешевые или бесплатные варианты:

- [Hetzner](/ru/install/hetzner) — €3,79/мес., больше ядер/RAM за доллар.
- [Oracle Cloud](/ru/install/oracle) — Always Free ARM (до 4 OCPU, 24 ГБ RAM), но регистрация может быть капризной, и доступен только ARM.

## Предварительные требования

- Аккаунт DigitalOcean ([регистрация](https://cloud.digitalocean.com/registrations/new))
- Пара SSH-ключей (или готовность использовать аутентификацию по паролю)
- Около 20 минут

## Настройка

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    Используйте чистый базовый образ (Ubuntu 24.04 LTS). Избегайте сторонних 1-click образов из Marketplace, если вы не проверили их скрипты запуска и настройки firewall по умолчанию.
    </Warning>

    1. Войдите в [DigitalOcean](https://cloud.digitalocean.com/).
    2. Нажмите **Create > Droplets**.
    3. Выберите:
       - **Регион:** ближайший к вам
       - **Образ:** Ubuntu 24.04 LTS
       - **Размер:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Аутентификация:** SSH-ключ (рекомендуется) или пароль
    4. Нажмите **Create Droplet** и запишите IP-адрес.

  </Step>

  <Step title="Connect and install">
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

    Используйте shell root только для начальной настройки системы. Запускайте команды OpenClaw от имени пользователя `openclaw` без прав root, чтобы состояние хранилось в `/home/openclaw/.openclaw/`, а Gateway устанавливался как systemd-сервис этого пользователя.

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер проведет вас через аутентификацию модели, настройку канала, генерацию токена Gateway и установку демона (systemd).

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Gateway по умолчанию привязывается к loopback. Выберите один из этих вариантов.

    **Вариант A: SSH-туннель (самый простой)**

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

    Затем откройте `https://<magicdns>/` с любого устройства в вашем tailnet.

    Tailscale Serve аутентифицирует трафик Control UI и WebSocket через заголовки идентичности tailnet, что предполагает доверие к самому хосту Gateway. Конечные точки HTTP API в любом случае следуют обычному режиму аутентификации Gateway (токен/пароль). Чтобы требовать явные учетные данные с общим секретом через Serve, задайте `gateway.auth.allowTailscale: false` и используйте `gateway.auth.mode: "token"` или `"password"`.

    **Вариант C: Привязка к tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Затем откройте `http://<tailscale-ip>:18789` (требуется токен).

  </Step>
</Steps>

## Постоянное хранение и резервные копии

Состояние OpenClaw хранится в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для каждого агента, состояние каналов/провайдеров и данные сессий.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Они сохраняются после перезагрузок Droplet. Чтобы сделать переносимый снимок:

```bash
openclaw backup create
```

Снимки DigitalOcean создают резервную копию всего Droplet; `openclaw backup create` переносим между хостами.

## Советы для 1 ГБ RAM

Droplet за $6 имеет только 1 ГБ RAM. Чтобы все работало плавно:

- Убедитесь, что шаг с swap выше записан в `/etc/fstab`, чтобы он сохранялся после перезагрузок.
- Предпочитайте модели на основе API (Claude, GPT), а не локальные — локальный LLM-инференс не помещается в 1 ГБ.
- Задайте `agents.defaults.model.primary` на меньшую модель, если сталкиваетесь с OOM на больших prompts.
- Мониторьте с помощью `free -h` и `htop`.

## Устранение неполадок

**Gateway не запускается** -- Запустите `openclaw doctor --non-interactive` и проверьте логи с помощью `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже используется** -- Запустите `lsof -i :18789`, чтобы найти процесс, затем остановите его.

**Недостаточно памяти** -- Проверьте, что swap активен, с помощью `free -h`. Если OOM все еще возникает, используйте модели на основе API (Claude, GPT) вместо локальных моделей или перейдите на Droplet с 2 ГБ.

## Следующие шаги

- [Каналы](/ru/channels) -- подключите Telegram, WhatsApp, Discord и другие
- [Конфигурация Gateway](/ru/gateway/configuration) -- все параметры конфигурации
- [Обновление](/ru/install/updating) -- поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Hetzner](/ru/install/hetzner)
- [VPS-хостинг](/ru/vps)
