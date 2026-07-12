---
read_when:
    - Настройка OpenClaw в Oracle Cloud
    - Поиск бесплатного хостинга VPS для OpenClaw
    - Хотите, чтобы OpenClaw круглосуточно работал на небольшом сервере
summary: Размещение OpenClaw на ARM-тарифе Always Free от Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T11:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw на ARM-тарифе Oracle Cloud **Always Free** (до 4 OCPU, 24 ГБ ОЗУ и 200 ГБ хранилища) без каких-либо затрат.

## Предварительные требования

- Учетная запись Oracle Cloud ([регистрация](https://www.oracle.com/cloud/free/)); если возникнут проблемы, см. [руководство сообщества по регистрации](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Учетная запись Tailscale (бесплатная на [tailscale.com](https://tailscale.com))
- Пара ключей SSH
- Около 30 минут

## Настройка

<Steps>
  <Step title="Создайте экземпляр OCI">
    1. Войдите в [консоль Oracle Cloud](https://cloud.oracle.com/).
    2. Перейдите в **Compute > Instances > Create Instance**.
    3. Настройте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (или до 4)
       - **Memory:** 12 ГБ (или до 24 ГБ)
       - **Boot volume:** 50 ГБ (бесплатно до 200 ГБ)
       - **SSH key:** добавьте свой открытый ключ
    4. Нажмите **Create** и запишите публичный IP-адрес.

    <Tip>
    Если при создании экземпляра возникает ошибка «Out of capacity», попробуйте другой домен доступности или повторите попытку позже. Ресурсы бесплатного тарифа ограничены.
    </Tip>

  </Step>

  <Step title="Подключитесь и обновите систему">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` необходим для компиляции некоторых зависимостей под ARM.

  </Step>

  <Step title="Настройте пользователя и имя хоста">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Включение режима linger позволяет пользовательским службам продолжать работу после выхода из системы.

  </Step>

  <Step title="Установите Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Теперь подключайтесь через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Установите OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Когда появится запрос «How do you want to hatch your bot?», выберите **Do this later**.

  </Step>

  <Step title="Настройте Gateway">
    Для безопасного удаленного доступа используйте аутентификацию по токену вместе с Tailscale Serve.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Здесь `gateway.trustedProxies=["127.0.0.1"]` используется только для обработки перенаправленного IP-адреса и локального клиента локальным прокси Tailscale Serve. Это **не** `gateway.auth.mode: "trusted-proxy"`. При такой настройке маршруты средства просмотра различий сохраняют закрытое при ошибке поведение: необработанные запросы средства просмотра с `127.0.0.1` без перенаправленных заголовков прокси возвращают `Diff not found`. Для вложений используйте `mode=file` / `mode=both`. Если вам нужны общедоступные ссылки на средство просмотра, намеренно включите удаленные средства просмотра и задайте `plugins.entries.diffs.config.viewerBaseUrl` (либо передайте прокси-параметр `baseUrl`).

  </Step>

  <Step title="Ограничьте доступ в настройках безопасности VCN">
    Заблокируйте весь трафик, кроме Tailscale, на границе сети:

    1. В консоли OCI перейдите в **Networking > Virtual Cloud Networks**.
    2. Нажмите свою VCN, затем выберите **Security Lists > Default Security List**.
    3. **Удалите** все правила входящего трафика, кроме `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Сохраните стандартные правила исходящего трафика (разрешить весь исходящий трафик).

    Это блокирует SSH на порту 22, HTTP, HTTPS и весь остальной трафик на границе сети. С этого момента подключаться можно только через Tailscale.

  </Step>

  <Step title="Проверьте настройку">
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

    Замените `<tailnet-name>` именем своей сети tailnet (оно отображается в выводе `tailscale status`).

  </Step>
</Steps>

## Проверьте состояние безопасности

Если доступ к VCN ограничен (открыт только UDP-порт 41641), а Gateway привязан к local loopback, публичный трафик блокируется на границе сети, а административный доступ возможен только из сети tailnet. Поэтому несколько традиционных мер по усилению защиты VPS не требуются:

| Традиционная мера                  | Нужна?              | Причина                                                                                      |
| ---------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| Межсетевой экран UFW               | Нет                 | VCN блокирует трафик до того, как он достигает экземпляра.                                   |
| fail2ban                           | Нет                 | Порт 22 заблокирован на уровне VCN, поэтому поверхность для перебора отсутствует.             |
| Усиление защиты sshd               | Нет                 | Tailscale SSH не использует sshd.                                                            |
| Отключение входа от имени root     | Нет                 | Tailscale выполняет аутентификацию по идентификатору tailnet, а не по системным пользователям. |
| Аутентификация SSH только по ключу | Нет                 | Аналогично: идентификатор tailnet заменяет системные ключи SSH.                               |
| Усиление защиты IPv6               | Обычно не требуется | Зависит от настроек VCN и подсети; проверьте, что фактически назначено и доступно извне.       |

По-прежнему рекомендуется:

- Выполнить `chmod 700 ~/.openclaw`, чтобы ограничить права доступа к файлам учетных данных.
- Выполнить `openclaw security audit` для проверки состояния безопасности с учетом особенностей OpenClaw.
- Регулярно выполнять `sudo apt update && sudo apt upgrade` для установки исправлений ОС.
- Периодически проверять устройства в [консоли администрирования Tailscale](https://login.tailscale.com/admin).

Команды для быстрой проверки:

```bash
# Убедиться, что публичные порты не прослушиваются
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Проверить, что Tailscale SSH активен
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH активен"

# Необязательно: полностью отключить sshd после подтверждения работоспособности Tailscale SSH
sudo systemctl disable --now ssh
```

## Примечания об ARM

Тариф Always Free использует архитектуру ARM (`aarch64`). Большинство возможностей OpenClaw работает без проблем; для небольшого числа нативных исполняемых файлов требуются сборки под ARM:

- Node.js, Telegram, WhatsApp (Baileys): чистый JavaScript, проблем нет.
- Большинство пакетов npm с нативным кодом: доступны предварительно собранные артефакты `linux-arm64`.
- Необязательные вспомогательные CLI-инструменты (например, исполняемые файлы Go/Rust, поставляемые с Skills): перед установкой проверьте наличие выпуска для `aarch64` / `linux-arm64`.

Проверьте архитектуру с помощью `uname -m` (команда должна вывести `aarch64`). Исполняемые файлы без сборки под ARM установите из исходного кода или пропустите.

## Сохранение данных и резервные копии

Состояние OpenClaw хранится в следующих каталогах:

- `~/.openclaw/` — `openclaw.json`, отдельные для каждого агента файлы `auth-profiles.json`, состояние каналов и поставщиков, а также данные сеансов.
- `~/.openclaw/workspace/` — рабочее пространство агента (SOUL.md, память, артефакты).

Эти данные сохраняются после перезагрузки. Чтобы создать переносимый снимок, выполните:

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

**Не удается создать экземпляр («Out of capacity»)** — бесплатные экземпляры ARM пользуются популярностью. Попробуйте другой домен доступности или повторите попытку в часы наименьшей нагрузки.

**Tailscale не подключается** — выполните `sudo tailscale up --ssh --hostname=openclaw --reset`, чтобы пройти аутентификацию повторно.

**Gateway не запускается** — выполните `openclaw doctor --non-interactive` и проверьте журналы с помощью `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблемы с исполняемыми файлами ARM** — большинство пакетов npm работает на ARM64. Для нативных исполняемых файлов ищите выпуски `linux-arm64` или `aarch64`. Проверьте архитектуру с помощью `uname -m`.

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие службы
- [Настройка Gateway](/ru/gateway/configuration) — все параметры конфигурации
- [Обновление](/ru/install/updating) — поддерживайте OpenClaw в актуальном состоянии

## Связанные материалы

- [Обзор установки](/ru/install)
- [GCP](/ru/install/gcp)
- [Размещение на VPS](/ru/vps)
