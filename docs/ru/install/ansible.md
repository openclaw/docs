---
read_when:
    - Вам нужно автоматизированное развертывание сервера с усилением безопасности
    - Вам нужна изолированная брандмауэром установка с доступом через VPN
    - Вы выполняете развертывание на удалённых серверах Debian/Ubuntu
summary: Автоматизированная защищенная установка OpenClaw с Ansible, Tailscale VPN и изоляцией firewall
title: Ansible
x-i18n:
    generated_at: "2026-06-28T23:04:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

Разверните OpenClaw на производственных серверах с **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматическим установщиком с архитектурой, ориентированной на безопасность.

<Info>
Репозиторий [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) является источником истины для развертывания через Ansible. Эта страница содержит краткий обзор.
</Info>

## Предварительные требования

| Требование | Подробности                                              |
| ---------- | --------------------------------------------------------- |
| **ОС**     | Debian 11+ или Ubuntu 20.04+                              |
| **Доступ** | Права root или sudo                                       |
| **Сеть**   | Подключение к Интернету для установки пакетов             |
| **Ansible** | 2.14+ (устанавливается автоматически скриптом быстрого старта) |

## Что вы получаете

- **Безопасность с приоритетом межсетевого экрана** -- изоляция UFW + Docker (доступны только SSH + Tailscale)
- **Tailscale VPN** -- безопасный удаленный доступ без публичного раскрытия сервисов
- **Docker** -- изолированные контейнеры-песочницы, привязки только к localhost
- **Глубоко эшелонированная защита** -- 4-уровневая архитектура безопасности
- **Интеграция с systemd** -- автозапуск при загрузке с усилением безопасности
- **Настройка одной командой** -- полное развертывание за минуты

## Быстрый старт

Установка одной командой:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Что устанавливается

Playbook Ansible устанавливает и настраивает:

1. **Tailscale** -- mesh VPN для безопасного удаленного доступа
2. **Межсетевой экран UFW** -- только порты SSH + Tailscale
3. **Docker CE + Compose V2** -- для стандартного backend песочницы агента
4. **Node.js 24 + pnpm** -- зависимости среды выполнения (Node 22 LTS, сейчас `22.19+`, остается поддерживаемым)
5. **OpenClaw** -- размещается на хосте, не контейнеризируется
6. **Сервис systemd** -- автозапуск с усилением безопасности

<Note>
Gateway запускается напрямую на хосте (не в Docker). Песочница агента
необязательна; этот playbook устанавливает Docker, потому что это стандартный
backend песочницы. Подробнее и о других backend см. [Изоляция в песочнице](/ru/gateway/sandboxing).
</Note>

## Настройка после установки

<Steps>
  <Step title="Переключитесь на пользователя openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустите мастер первичной настройки">
    Скрипт после установки проведет вас через настройку параметров OpenClaw.
  </Step>
  <Step title="Подключите провайдеры сообщений">
    Войдите в WhatsApp, Telegram, Discord или Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Проверьте установку">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Подключитесь к Tailscale">
    Присоединитесь к вашей VPN mesh для безопасного удаленного доступа.
  </Step>
</Steps>

### Быстрые команды

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Архитектура безопасности

Развертывание использует 4-уровневую модель защиты:

1. **Межсетевой экран (UFW)** -- публично открыты только SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway доступен только через VPN mesh
3. **Изоляция Docker** -- цепочка iptables DOCKER-USER предотвращает внешнее раскрытие портов
4. **Усиление systemd** -- NoNewPrivileges, PrivateTmp, непривилегированный пользователь

Чтобы проверить вашу внешнюю поверхность атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Открыт должен быть только порт 22 (SSH). Все остальные сервисы (Gateway, Docker) заблокированы.

Docker устанавливается для песочниц агентов (изолированного выполнения инструментов), а не для запуска самого Gateway. Настройку песочницы см. в [Многоагентная песочница и инструменты](/ru/tools/multi-agent-sandbox-tools).

## Ручная установка

Если вы предпочитаете ручной контроль вместо автоматизации:

<Steps>
  <Step title="Установите предварительные зависимости">
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
  <Step title="Запустите playbook">
    ```bash
    ./run-playbook.sh
    ```

    Либо запустите напрямую, а затем вручную выполните скрипт настройки:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Обновление

Установщик Ansible настраивает OpenClaw для ручных обновлений. Стандартный процесс обновления см. в [Обновление](/ru/install/updating).

Чтобы повторно запустить playbook Ansible (например, для изменений конфигурации):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Это идемпотентно и безопасно для многократного запуска.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Межсетевой экран блокирует мое подключение">
    - Сначала убедитесь, что у вас есть доступ через Tailscale VPN
    - Доступ по SSH (порт 22) всегда разрешен
    - Gateway по проекту доступен только через Tailscale

  </Accordion>
  <Accordion title="Сервис не запускается">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблемы с песочницей Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Вход в провайдер не удается">
    Убедитесь, что вы запускаете команды от пользователя `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Расширенная конфигурация

Подробную архитектуру безопасности и устранение неполадок см. в репозитории openclaw-ansible:

- [Архитектура безопасности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технические подробности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Руководство по устранению неполадок](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Связанные материалы

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- полное руководство по развертыванию
- [Docker](/ru/install/docker) -- настройка контейнеризированного Gateway
- [Изоляция в песочнице](/ru/gateway/sandboxing) -- конфигурация песочницы агента
- [Многоагентная песочница и инструменты](/ru/tools/multi-agent-sandbox-tools) -- изоляция для каждого агента
