---
read_when:
    - Настройка OpenClaw в DigitalOcean
    - Ищете простой платный VPS для OpenClaw
summary: Размещение OpenClaw на дроплете DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-13T18:18:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway на Droplet в DigitalOcean (~$6/месяц для базового плана с 1 ГБ).

DigitalOcean — простой вариант платного VPS. Более дешёвые или бесплатные варианты:

- [Hetzner](/ru/install/hetzner) — больше ядер и оперативной памяти за ту же цену.
- [Oracle Cloud](/ru/install/oracle) — всегда бесплатный тариф ARM (до 4 OCPU и 24 ГБ оперативной памяти), но регистрация может быть затруднительной, а архитектура ограничена ARM.

## Предварительные требования

- Учётная запись DigitalOcean ([регистрация](https://cloud.digitalocean.com/registrations/new))
- Пара ключей SSH (или готовность использовать аутентификацию по паролю)
- Около 20 минут

## Настройка

<Steps>
  <Step title="Создайте Droplet">
    <Warning>
    Используйте чистый базовый образ (Ubuntu 24.04 LTS). Избегайте сторонних образов Marketplace с установкой в один клик, если вы не проверили их сценарии запуска и настройки межсетевого экрана по умолчанию.
    </Warning>

    1. Войдите в [DigitalOcean](https://cloud.digitalocean.com/).
    2. Нажмите **Create > Droplets**.
    3. Выберите:
       - **Region:** ближайший к вам
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 ГБ оперативной памяти / SSD 25 ГБ
       - **Authentication:** ключ SSH (рекомендуется) или пароль
    4. Нажмите **Create Droplet** и запишите IP-адрес.

  </Step>

  <Step title="Подключитесь и установите">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Установите Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Установите OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Создайте непривилегированного пользователя, которому будут принадлежать состояние и службы OpenClaw.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Используйте оболочку root только для первоначальной настройки системы. Выполняйте команды OpenClaw от имени непривилегированного пользователя `openclaw`, чтобы состояние хранилось в `/home/openclaw/.openclaw/`, а Gateway устанавливался как пользовательская служба systemd `--user` этого пользователя.

  </Step>

  <Step title="Выполните первоначальную настройку">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер проведёт вас через аутентификацию модели, настройку каналов, создание токена Gateway и установку демона (пользовательской службы systemd).

  </Step>

  <Step title="Добавьте раздел подкачки (рекомендуется для Droplet с 1 ГБ)">
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
    По умолчанию Gateway привязывается к интерфейсу обратной петли. Выберите один из следующих вариантов.

    **Вариант A: туннель SSH (самый простой)**

    ```bash
    # На локальном компьютере
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

    Затем откройте `https://<magicdns>/` на любом устройстве в вашей сети tailnet.

    Tailscale Serve аутентифицирует трафик интерфейса управления и WebSocket с помощью заголовков идентификации tailnet, что предполагает доверие к самому хосту Gateway. При этом конечные точки HTTP API по-прежнему используют обычный режим аутентификации Gateway (токен/пароль). Чтобы требовать явные учётные данные с общим секретом при доступе через Serve, задайте `gateway.auth.allowTailscale: false` и используйте `gateway.auth.mode: "token"` или `"password"`.

    **Вариант C: привязка к tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Затем откройте `http://<tailscale-ip>:18789` (требуется токен).

  </Step>
</Steps>

## Сохранение данных и резервные копии

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, учётные данные каналов и провайдеров, данные `auth-profiles.json` отдельных агентов и данные сеансов.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Эти данные сохраняются после перезагрузки Droplet. Чтобы создать переносимый снимок:

```bash
openclaw backup create
```

Снимки DigitalOcean сохраняют весь Droplet; `openclaw backup create` можно переносить между хостами.

## Рекомендации для 1 ГБ оперативной памяти

Droplet за $6 располагает только 1 ГБ оперативной памяти. Для стабильной работы:

- Убедитесь, что описанная выше настройка подкачки добавлена в `/etc/fstab`, чтобы она сохранялась после перезагрузок.
- Предпочитайте модели, доступные через API (Claude, GPT), локальным моделям — локальный инференс LLM не помещается в 1 ГБ.
- Если при обработке больших запросов возникает нехватка памяти, задайте для `agents.defaults.model.primary` модель меньшего размера.
- Отслеживайте состояние с помощью `free -h` и `htop`.

## Устранение неполадок

**Gateway не запускается** — выполните `openclaw doctor --non-interactive` и проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже используется** — выполните `lsof -i :18789`, чтобы найти процесс, а затем остановите его.

**Недостаточно памяти** — проверьте, активна ли подкачка, с помощью `free -h`. Если нехватка памяти сохраняется, вместо локальных моделей используйте модели, доступные через API (Claude, GPT), или перейдите на Droplet с 2 ГБ.

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие сервисы
- [Конфигурация Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Hetzner](/ru/install/hetzner)
- [Размещение на VPS](/ru/vps)
