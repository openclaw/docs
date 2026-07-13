---
read_when:
    - Вам нужно автоматизированное развёртывание сервера с усилением безопасности
    - Вам нужна изолированная брандмауэром конфигурация с доступом через VPN
    - Вы выполняете развертывание на удаленных серверах Debian/Ubuntu
summary: Автоматизированная защищённая установка OpenClaw с помощью Ansible, VPN Tailscale и изоляции брандмауэром
title: Ansible
x-i18n:
    generated_at: "2026-07-13T19:52:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Разверните OpenClaw на рабочих серверах с помощью **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизированного установщика с архитектурой, ориентированной прежде всего на безопасность.

<Info>
Репозиторий [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) является основным источником сведений о развертывании с помощью Ansible. На этой странице представлен краткий обзор.
</Info>

## Предварительные требования

| Требование | Подробности                                               |
| ----------- | --------------------------------------------------------- |
| ОС          | Debian 11+ или Ubuntu 20.04+                              |
| Доступ      | Права root или sudo                                       |
| Сеть        | Подключение к интернету для установки пакетов             |
| Ansible     | 2.14+ (автоматически устанавливается скриптом быстрого запуска) |

## Что вы получите

- Безопасность на уровне межсетевого экрана: UFW + изоляция Docker (доступны только SSH + Tailscale)
- VPN Tailscale для удаленного доступа без публичного предоставления сервисов
- Docker для изолированных контейнеров песочницы с привязкой только к localhost
- Интеграция с systemd с усилением безопасности и автоматическим запуском при загрузке
- Настройка одной командой

## Быстрый запуск

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Что устанавливается

1. Tailscale (ячеистая VPN для безопасного удаленного доступа)
2. Межсетевой экран UFW (только порты SSH + Tailscale)
3. Docker CE + Compose V2 (сервер песочницы агентов по умолчанию)
4. Node.js и pnpm (для OpenClaw требуется Node 22.22.3+, 24.15+ или 25.9+; рекомендуется Node 24)
5. OpenClaw, установленный непосредственно на хосте, а не в контейнере
6. Сервис systemd с усиленной безопасностью

<Note>
Gateway работает непосредственно на хосте, а не в Docker. Песочница агентов
необязательна; этот плейбук устанавливает Docker, поскольку он является сервером
песочницы по умолчанию. Другие серверы см. в разделе [Песочница](/ru/gateway/sandboxing).
</Note>

## Настройка после установки

<Steps>
  <Step title="Переключитесь на пользователя openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустите мастер первоначальной настройки">
    Скрипт после установки поможет вам настроить OpenClaw.
  </Step>
  <Step title="Подключите каналы обмена сообщениями">
    Войдите в WhatsApp, Telegram, Discord или Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Проверьте установку">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Подключитесь к Tailscale">
    Присоединитесь к своей ячеистой VPN для безопасного удаленного доступа.
  </Step>
</Steps>

### Основные команды

```bash
# Проверить состояние сервиса
sudo systemctl status openclaw

# Просмотреть журналы в реальном времени
sudo journalctl -u openclaw -f

# Перезапустить Gateway
sudo systemctl restart openclaw

# Вход в канал (выполняется от имени пользователя openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Архитектура безопасности

Четырехуровневая модель защиты:

1. Межсетевой экран (UFW): публично доступны только SSH (22) и Tailscale (41641/udp)
2. VPN (Tailscale): Gateway доступен только через ячеистую VPN
3. Изоляция Docker: цепочка iptables `DOCKER-USER` предотвращает доступ к портам извне
4. Усиление безопасности systemd: `NoNewPrivileges`, `PrivateTmp`, непривилегированный пользователь

Проверьте доступную извне поверхность атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Открытым должен быть только порт 22 (SSH). Gateway и Docker остаются защищенными от внешнего доступа.

Docker устанавливается для песочниц агентов (изолированного выполнения инструментов), а не для запуска Gateway. Настройку песочницы см. в разделе [Многоагентная песочница и инструменты](/ru/tools/multi-agent-sandbox-tools).

## Установка вручную

<Steps>
  <Step title="Установите необходимые компоненты">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Клонируйте репозиторий">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Установите коллекции Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Запустите плейбук">
    ```bash
    ./run-playbook.sh
    ```

    Либо запустите плейбук напрямую, а затем вручную выполните скрипт настройки:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Затем выполните: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Обновление

Установщик Ansible настраивает OpenClaw для обновления вручную; стандартный порядок действий см. в разделе [Обновление](/ru/install/updating).

Чтобы повторно запустить плейбук (например, после изменения конфигурации):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Операция идемпотентна, поэтому ее можно безопасно выполнять несколько раз.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Межсетевой экран блокирует подключение">
    - Сначала подключитесь через VPN Tailscale; по замыслу Gateway доступен только таким способом.
    - SSH (порт 22) разрешен всегда.

  </Accordion>
  <Accordion title="Сервис не запускается">
    ```bash
    # Проверить журналы
    sudo journalctl -u openclaw -n 100

    # Проверить права доступа
    sudo ls -la /opt/openclaw

    # Проверить запуск вручную
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблемы с песочницей Docker">
    ```bash
    # Проверить, работает ли Docker
    sudo systemctl status docker

    # Проверить образ песочницы
    sudo docker images | grep openclaw-sandbox

    # Собрать отсутствующий образ песочницы (требуется рабочая копия исходного кода)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Для установки через npm без рабочей копии исходного кода см.
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Не удается войти в канал">
    Убедитесь, что команда выполняется от имени пользователя `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Расширенная конфигурация

Подробное описание архитектуры безопасности и устранения неполадок см. в репозитории openclaw-ansible:

- [Архитектура безопасности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технические подробности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Руководство по устранению неполадок](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Связанные материалы

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): полное руководство по развертыванию
- [Docker](/ru/install/docker): настройка контейнеризованного Gateway
- [Песочница](/ru/gateway/sandboxing): настройка песочницы агентов
- [Многоагентная песочница и инструменты](/ru/tools/multi-agent-sandbox-tools): изоляция каждого агента
