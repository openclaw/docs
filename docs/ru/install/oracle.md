---
read_when:
    - Настройка OpenClaw в Oracle Cloud
    - Ищете бесплатный VPS-хостинг для OpenClaw
    - Хотите, чтобы OpenClaw работал круглосуточно на небольшом сервере
summary: Разместите OpenClaw на ARM-тарифе Always Free в Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-13T18:20:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw на ARM-тарифе Oracle Cloud **Always Free** (до 4 OCPU, 24 ГБ ОЗУ и 200 ГБ хранилища) бесплатно.

## Предварительные требования

- Учетная запись Oracle Cloud ([регистрация](https://www.oracle.com/cloud/free/)) — если возникнут проблемы, ознакомьтесь с [руководством сообщества по регистрации](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Учетная запись Tailscale (бесплатно на [tailscale.com](https://tailscale.com))
- Пара ключей SSH
- Около 30 минут

## Настройка

<Steps>
  <Step title="Создание экземпляра OCI">
    1. Войдите в [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдите в **Compute > Instances > Create Instance**.
    3. Настройте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (или до 4)
       - **Memory:** 12 ГБ (или до 24 ГБ)
       - **Boot volume:** 50 ГБ (бесплатно до 200 ГБ)
       - **SSH key:** добавьте свой открытый ключ
    4. Нажмите **Create** и запишите общедоступный IP-адрес.

    <Tip>
    Если создать экземпляр не удается из-за ошибки "Out of capacity", попробуйте другой домен доступности или повторите попытку позже. Ресурсы бесплатного тарифа ограничены.
    </Tip>

  </Step>

  <Step title="Подключение и обновление системы">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` требуется для компиляции некоторых зависимостей под ARM.

  </Step>

  <Step title="Настройка пользователя и имени хоста">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Включение linger позволяет пользовательским службам продолжать работу после выхода из системы.

  </Step>

  <Step title="Установка Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Теперь подключайтесь через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Установка OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    При появлении запроса "How do you want to hatch your bot?" выберите **Do this later**.

  </Step>

  <Step title="Настройка Gateway">
    Используйте аутентификацию по токену вместе с Tailscale Serve для безопасного удаленного доступа.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Здесь `gateway.trustedProxies=["127.0.0.1"]` используется только для обработки перенаправленного IP-адреса и локального клиента локальным прокси Tailscale Serve. Это **не** `gateway.auth.mode: "trusted-proxy"`. В этой конфигурации маршруты средства просмотра различий сохраняют закрытое по умолчанию поведение: необработанные запросы средства просмотра `127.0.0.1` без перенаправленных заголовков прокси возвращают `Diff not found`. Используйте `mode=file` / `mode=both` для вложений либо намеренно включите удаленные средства просмотра и задайте `plugins.entries.diffs.config.viewerBaseUrl` (или передайте прокси `baseUrl`), если нужны общедоступные ссылки на средство просмотра.

  </Step>

  <Step title="Ограничение доступа в VCN">
    Заблокируйте на границе сети весь трафик, кроме Tailscale:

    1. Перейдите в **Networking > Virtual Cloud Networks** в OCI Console.
    2. Нажмите на свою VCN, затем выберите **Security Lists > Default Security List**.
    3. **Удалите** все правила входящего трафика, кроме `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Сохраните стандартные правила исходящего трафика (разрешить весь исходящий трафик).

    Это блокирует SSH на порту 22, HTTP, HTTPS и весь остальной трафик на границе сети. С этого момента подключаться можно только через Tailscale.

  </Step>

  <Step title="Проверка">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Откройте интерфейс управления с любого устройства в своей сети tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замените `<tailnet-name>` именем своей сети tailnet (оно отображается в `tailscale status`).

  </Step>
</Steps>

## Проверка уровня безопасности

Когда доступ к VCN ограничен (открыт только UDP-порт 41641), а Gateway привязан к loopback-интерфейсу, общедоступный трафик блокируется на границе сети, а административный доступ возможен только из сети tailnet. Благодаря этому несколько традиционных мер по усилению защиты VPS не требуются:

| Традиционная мера                | Требуется?         | Причина                                                                    |
| -------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| Межсетевой экран UFW             | Нет                | VCN блокирует трафик до того, как он достигнет экземпляра.                 |
| fail2ban                         | Нет                | Порт 22 заблокирован на уровне VCN; поверхность для перебора отсутствует.  |
| Усиление защиты sshd             | Нет                | Tailscale SSH не использует sshd.                                          |
| Отключение входа для root        | Нет                | Tailscale выполняет аутентификацию по идентификатору tailnet, а не системным пользователям. |
| Аутентификация только по SSH-ключу | Нет              | Аналогично — идентификатор tailnet заменяет системные SSH-ключи.            |
| Усиление защиты IPv6             | Обычно нет         | Зависит от настроек VCN и подсети; проверьте, что фактически назначено и доступно извне. |

По-прежнему рекомендуется:

- `chmod 700 ~/.openclaw` для ограничения разрешений файлов учетных данных.
- `openclaw security audit` для проверки уровня безопасности OpenClaw.
- Регулярно выполнять `sudo apt update && sudo apt upgrade` для установки исправлений ОС.
- Периодически проверять устройства в [консоли администрирования Tailscale](https://login.tailscale.com/admin).

Команды для быстрой проверки:

```bash
# Убедитесь, что общедоступные порты не прослушиваются
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Убедитесь, что Tailscale SSH активен
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH активен"

# Необязательно: полностью отключите sshd, убедившись, что Tailscale SSH работает
sudo systemctl disable --now ssh
```

## Примечания об ARM

Тариф Always Free использует ARM (`aarch64`). Большинство функций OpenClaw работают без проблем; небольшому числу нативных исполняемых файлов требуются сборки для ARM:

- Node.js, Telegram, WhatsApp (Baileys): чистый JavaScript, проблем нет.
- Большинство пакетов npm с нативным кодом: доступны предварительно собранные артефакты `linux-arm64`.
- Необязательные вспомогательные инструменты CLI (например, исполняемые файлы Go/Rust, поставляемые навыками): перед установкой проверьте наличие выпуска `aarch64` / `linux-arm64`.

Проверьте архитектуру с помощью `uname -m` (команда должна вывести `aarch64`). Исполняемые файлы без сборки для ARM установите из исходного кода или не устанавливайте.

## Хранение данных и резервное копирование

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, данные `auth-profiles.json` отдельных агентов, состояние каналов и провайдеров, а также данные сеансов.
- `~/.openclaw/workspace/` — рабочая область агента (SOUL.md, память, артефакты).

Эти данные сохраняются после перезагрузки. Чтобы создать переносимый снимок:

```bash
openclaw backup create
```

## Резервный вариант: туннель SSH

Если Tailscale Serve не работает, создайте туннель SSH с локального компьютера:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Затем откройте `http://localhost:18789`.

## Устранение неполадок

**Не удается создать экземпляр ("Out of capacity")** — ARM-экземпляры бесплатного тарифа популярны. Попробуйте другой домен доступности или повторите попытку в часы наименьшей нагрузки.

**Tailscale не подключается** — выполните `sudo tailscale up --ssh --hostname=openclaw --reset` для повторной аутентификации.

**Gateway не запускается** — выполните `openclaw doctor --non-interactive` и проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблемы с исполняемыми файлами ARM** — большинство пакетов npm работают на ARM64. Для нативных исполняемых файлов ищите выпуски `linux-arm64` или `aarch64`. Проверьте архитектуру с помощью `uname -m`.

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие сервисы
- [Настройка Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [GCP](/ru/install/gcp)
- [Размещение на VPS](/ru/vps)
