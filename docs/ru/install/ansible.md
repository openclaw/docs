---
read_when:
    - Вам нужно автоматизированное развертывание сервера с усиленной защитой
    - Вам нужна изолированная брандмауэром конфигурация с доступом через VPN
    - Вы развёртываете систему на удалённых серверах Debian/Ubuntu
summary: Автоматизированная защищённая установка OpenClaw с помощью Ansible, VPN Tailscale и изоляции брандмауэром
title: Ansible
x-i18n:
    generated_at: "2026-07-12T11:28:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Разверните OpenClaw на производственных серверах с помощью **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизированного установщика с архитектурой, ориентированной на безопасность.

<Info>
Репозиторий [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — основной источник сведений о развертывании с помощью Ansible. На этой странице представлен краткий обзор.
</Info>

## Предварительные требования

| Требование | Подробности                                                    |
| ---------- | -------------------------------------------------------------- |
| ОС         | Debian 11+ или Ubuntu 20.04+                                   |
| Доступ     | Права root или sudo                                            |
| Сеть       | Подключение к Интернету для установки пакетов                  |
| Ansible    | 2.14+ (автоматически устанавливается скриптом быстрого запуска) |

## Что вы получите

- Защита на уровне межсетевого экрана: UFW + изоляция Docker (доступны только SSH + Tailscale)
- VPN Tailscale для удаленного доступа без публичного открытия сервисов
- Docker для изолированных контейнеров песочницы с привязкой только к localhost
- Интеграция с systemd, усиление защиты и автоматический запуск при загрузке
- Настройка одной командой

## Быстрый запуск

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Что устанавливается

1. Tailscale (ячеистая VPN для безопасного удаленного доступа)
2. Межсетевой экран UFW (только порты SSH + Tailscale)
3. Docker CE + Compose V2 (стандартный бэкенд песочницы агента)
4. Node.js и pnpm (для OpenClaw требуется Node 22.19+ или 23.11+; рекомендуется Node 24)
5. OpenClaw, устанавливаемый непосредственно на хосте, а не в контейнере
6. Сервис systemd с усиленной защитой

<Note>
Gateway работает непосредственно на хосте, а не в Docker. Песочница агента
необязательна; этот плейбук устанавливает Docker, поскольку он является
стандартным бэкендом песочницы. Другие бэкенды описаны в разделе
[«Песочница»](/ru/gateway/sandboxing).
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

### Быстрые команды

```bash
# Проверить состояние сервиса
sudo systemctl status openclaw

# Просмотреть журналы в реальном времени
sudo journalctl -u openclaw -f

# Перезапустить Gateway
sudo systemctl restart openclaw

# Войти в канал (выполнять от имени пользователя openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Архитектура безопасности

Четырехуровневая модель защиты:

1. Межсетевой экран (UFW): публично открыты только SSH (22) и Tailscale (41641/udp)
2. VPN (Tailscale): Gateway доступен только через ячеистую VPN
3. Изоляция Docker: цепочка iptables `DOCKER-USER` предотвращает открытие портов для внешнего доступа
4. Усиление защиты systemd: `NoNewPrivileges`, `PrivateTmp`, непривилегированный пользователь

Проверьте поверхность внешней атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Открытым должен быть только порт 22 (SSH). Доступ к Gateway и Docker остается закрытым.

Docker устанавливается для песочниц агентов (изолированного выполнения инструментов), а не для запуска Gateway. Настройка песочницы описана в разделе [«Мультиагентная песочница и инструменты»](/ru/tools/multi-agent-sandbox-tools).

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

    Или запустите плейбук напрямую, а затем вручную выполните скрипт настройки:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Затем выполните: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Обновление

Установщик Ansible настраивает OpenClaw для обновления вручную; стандартный процесс описан в разделе [«Обновление»](/ru/install/updating).

Чтобы повторно запустить плейбук (например, после изменения конфигурации), выполните:

```bash
cd openclaw-ansible
./run-playbook.sh
```

Этот процесс идемпотентен, поэтому его можно безопасно запускать многократно.

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

    # Собрать образ песочницы, если он отсутствует (требуется рабочая копия исходного кода)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Сведения об установке через npm без рабочей копии исходного кода:
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

Подробные сведения об архитектуре безопасности и устранении неполадок см. в репозитории openclaw-ansible:

- [Архитектура безопасности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технические подробности](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Руководство по устранению неполадок](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Связанные материалы

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): полное руководство по развертыванию
- [Docker](/ru/install/docker): настройка контейнерного Gateway
- [Песочница](/ru/gateway/sandboxing): настройка песочницы агента
- [Мультиагентная песочница и инструменты](/ru/tools/multi-agent-sandbox-tools): изоляция отдельных агентов
