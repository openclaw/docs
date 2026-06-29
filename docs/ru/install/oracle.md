---
read_when:
    - Настройка OpenClaw в Oracle Cloud
    - Ищем бесплатный VPS-хостинг для OpenClaw
    - Хотите круглосуточно использовать OpenClaw на небольшом сервере
summary: Разместите OpenClaw на уровне Always Free ARM в Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-06-28T23:08:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway на ARM-уровне **Always Free** в Oracle Cloud (до 4 OCPU, 24 ГБ ОЗУ, 200 ГБ хранилища) без затрат.

## Предварительные требования

- Учетная запись Oracle Cloud ([регистрация](https://www.oracle.com/cloud/free/)) -- если возникнут проблемы, см. [руководство сообщества по регистрации](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Учетная запись Tailscale (бесплатно на [tailscale.com](https://tailscale.com))
- Пара SSH-ключей
- Около 30 минут

## Настройка

<Steps>
  <Step title="Create an OCI instance">
    1. Войдите в [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдите в **Compute > Instances > Create Instance**.
    3. Настройте:
       - **Имя:** `openclaw`
       - **Образ:** Ubuntu 24.04 (aarch64)
       - **Форма:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (или до 4)
       - **Память:** 12 ГБ (или до 24 ГБ)
       - **Загрузочный том:** 50 ГБ (до 200 ГБ бесплатно)
       - **SSH-ключ:** добавьте свой открытый ключ
    4. Нажмите **Create** и запишите публичный IP-адрес.

    <Tip>
    Если создание экземпляра завершается ошибкой "Out of capacity", попробуйте другой домен доступности или повторите попытку позже. Емкость бесплатного уровня ограничена.
    </Tip>

  </Step>

  <Step title="Connect and update the system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` требуется для компиляции некоторых зависимостей на ARM.

  </Step>

  <Step title="Configure user and hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Включение linger сохраняет пользовательские сервисы запущенными после выхода из системы.

  </Step>

  <Step title="Install Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    С этого момента подключайтесь через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    При запросе "How do you want to hatch your bot?" выберите **Do this later**.

  </Step>

  <Step title="Configure the gateway">
    Используйте аутентификацию по токену с Tailscale Serve для безопасного удаленного доступа.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` здесь используется только для обработки forwarded-IP/local-client локальным прокси Tailscale Serve. Это **не** `gateway.auth.mode: "trusted-proxy"`. В этой настройке маршруты просмотрщика diff сохраняют отказ по умолчанию: необработанные запросы просмотрщика с `127.0.0.1` без заголовков пересылающего прокси могут возвращать `Diff not found`. Используйте `mode=file` / `mode=both` для вложений или намеренно включите удаленные просмотрщики и задайте `plugins.entries.diffs.config.viewerBaseUrl` (либо передайте прокси `baseUrl`), если вам нужны ссылки просмотрщика, которыми можно делиться.

  </Step>

  <Step title="Lock down VCN security">
    Заблокируйте весь трафик на сетевой границе, кроме Tailscale:

    1. Перейдите в **Networking > Virtual Cloud Networks** в консоли OCI.
    2. Нажмите свой VCN, затем **Security Lists > Default Security List**.
    3. **Удалите** все входящие правила, кроме `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Оставьте стандартные исходящие правила (разрешить все исходящие соединения).

    Это блокирует SSH на порту 22, HTTP, HTTPS и все остальное на сетевой границе. С этого момента подключаться можно только через Tailscale.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Откройте Control UI с любого устройства в вашем tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замените `<tailnet-name>` на имя вашего tailnet (видно в `tailscale status`).

  </Step>
</Steps>

## Проверьте состояние безопасности

Когда VCN заблокирован (открыт только UDP 41641), а Gateway привязан к loopback, публичный трафик блокируется на сетевой границе, а административный доступ доступен только через tailnet. Это устраняет необходимость в нескольких традиционных шагах по усилению защиты VPS:

| Традиционный шаг             | Требуется?  | Почему                                                                       |
| ---------------------------- | ----------- | --------------------------------------------------------------------------- |
| Файрвол UFW                  | Нет         | VCN блокирует трафик до того, как он достигает экземпляра.                  |
| fail2ban                     | Нет         | Порт 22 заблокирован на уровне VCN; поверхности для брутфорса нет.          |
| Усиление sshd                | Нет         | Tailscale SSH не использует sshd.                                           |
| Отключение входа root        | Нет         | Tailscale аутентифицирует по идентичности tailnet, а не системным пользователям. |
| Аутентификация только по SSH-ключу | Нет   | То же самое — идентичность tailnet заменяет системные SSH-ключи.            |
| Усиление IPv6                | Обычно нет  | Зависит от настроек VCN/подсети; проверьте, что действительно назначено/открыто. |

По-прежнему рекомендуется:

- `chmod 700 ~/.openclaw`, чтобы ограничить права доступа к файлам учетных данных.
- `openclaw security audit` для проверки состояния безопасности, специфичной для OpenClaw.
- Регулярно выполнять `sudo apt update && sudo apt upgrade` для установки исправлений ОС.
- Периодически проверять устройства в [административной консоли Tailscale](https://login.tailscale.com/admin).

Команды для быстрой проверки:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Примечания по ARM

Уровень Always Free использует ARM (`aarch64`). Большинство возможностей OpenClaw работают нормально; небольшому числу нативных бинарных файлов нужны ARM-сборки:

- Node.js, Telegram, WhatsApp (Baileys): чистый JavaScript, проблем нет.
- Большинство npm-пакетов с нативным кодом: доступны предварительно собранные артефакты `linux-arm64`.
- Необязательные CLI-помощники (например, бинарные файлы Go/Rust, поставляемые Skills): перед установкой проверьте наличие релиза `aarch64` / `linux-arm64`.

Проверьте архитектуру с помощью `uname -m` (должно вывести `aarch64`). Для бинарных файлов без ARM-сборки установите их из исходного кода или пропустите.

## Постоянное хранение и резервные копии

Состояние OpenClaw находится в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для каждого агента, состояние каналов/провайдеров и данные сессий.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Они сохраняются после перезагрузок. Чтобы создать переносимый снимок:

```bash
openclaw backup create
```

## Резервный вариант: SSH-туннель

Если Tailscale Serve не работает, используйте SSH-туннель с локальной машины:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Затем откройте `http://localhost:18789`.

## Устранение неполадок

**Создание экземпляра завершается ошибкой ("Out of capacity")** -- ARM-экземпляры бесплатного уровня популярны. Попробуйте другой домен доступности или повторите попытку в часы меньшей нагрузки.

**Tailscale не подключается** -- Выполните `sudo tailscale up --ssh --hostname=openclaw --reset`, чтобы пройти повторную аутентификацию.

**Gateway не запускается** -- Выполните `openclaw doctor --non-interactive` и проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблемы с ARM-бинарными файлами** -- Большинство npm-пакетов работает на ARM64. Для нативных бинарных файлов ищите релизы `linux-arm64` или `aarch64`. Проверьте архитектуру с помощью `uname -m`.

## Следующие шаги

- [Каналы](/ru/channels) -- подключите Telegram, WhatsApp, Discord и другие
- [Конфигурация Gateway](/ru/gateway/configuration) -- все параметры конфигурации
- [Обновление](/ru/install/updating) -- поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [GCP](/ru/install/gcp)
- [Хостинг VPS](/ru/vps)
