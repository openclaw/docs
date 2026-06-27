---
read_when:
    - Ви хочете автоматизоване розгортання сервера з посиленням безпеки
    - Вам потрібне налаштування, ізольоване брандмауером, із доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, захищене встановлення OpenClaw з Ansible, Tailscale VPN та ізоляцією брандмауера
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:40:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

Розгорніть OpenClaw на production-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматизованого інсталятора з архітектурою, орієнтованою насамперед на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання Ansible. Ця сторінка — короткий огляд.
</Info>

## Передумови

| Вимога      | Подробиці                                                 |
| ----------- | --------------------------------------------------------- |
| **ОС**      | Debian 11+ або Ubuntu 20.04+                              |
| **Доступ**  | Права root або sudo                                       |
| **Мережа**  | Підключення до інтернету для встановлення пакетів         |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримуєте

- **Безпека з пріоритетом firewall** -- ізоляція UFW + Docker (доступні лише SSH + Tailscale)
- **Tailscale VPN** -- безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** -- ізольовані sandbox-контейнери, прив’язки лише до localhost
- **Багаторівневий захист** -- 4-рівнева архітектура безпеки
- **Інтеграція з systemd** -- автоматичний запуск під час завантаження з hardening
- **Налаштування однією командою** -- повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що встановлюється

Ansible playbook встановлює й налаштовує:

1. **Tailscale** -- mesh VPN для безпечного віддаленого доступу
2. **UFW firewall** -- лише порти SSH + Tailscale
3. **Docker CE + Compose V2** -- для стандартного backend sandbox агента
4. **Node.js 24 + pnpm** -- runtime-залежності (Node 22 LTS, наразі `22.19+`, залишається підтримуваним)
5. **OpenClaw** -- на хості, без контейнеризації
6. **Сервіс systemd** -- автоматичний запуск із посиленням безпеки

<Note>
Gateway запускається безпосередньо на хості (не в Docker). Sandbox для агентів
необов’язковий; цей playbook встановлює Docker, бо це стандартний backend
sandbox. Докладніше та інші backend див. у [Sandboxing](/uk/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перейдіть на користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер onboarding">
    Скрипт після встановлення проведе вас через налаштування параметрів OpenClaw.
  </Step>
  <Step title="Підключіть провайдери повідомлень">
    Увійдіть у WhatsApp, Telegram, Discord або Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Перевірте встановлення">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Підключіться до Tailscale">
    Приєднайтеся до своєї VPN mesh для безпечного віддаленого доступу.
  </Step>
</Steps>

### Швидкі команди

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

## Архітектура безпеки

Розгортання використовує 4-рівневу модель захисту:

1. **Firewall (UFW)** -- публічно відкриті лише SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- gateway доступний лише через VPN mesh
3. **Ізоляція Docker** -- ланцюжок iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Hardening systemd** -- NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Відкритим має бути лише порт 22 (SSH). Усі інші сервіси (gateway, Docker) заблоковані.

Docker встановлюється для sandbox агентів (ізольованого виконання інструментів), а не для запуску самого gateway. Конфігурацію sandbox див. у [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools).

## Ручне встановлення

Якщо ви віддаєте перевагу ручному контролю над автоматизацією:

<Steps>
  <Step title="Встановіть передумови">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Клонуйте репозиторій">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Встановіть колекції Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Запустіть playbook">
    ```bash
    ./run-playbook.sh
    ```

    Або запустіть напряму, а потім вручну виконайте скрипт налаштування:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Оновлення

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Стандартний процес оновлення див. у [Updating](/uk/install/updating).

Щоб повторно запустити Ansible playbook (наприклад, для змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентно й безпечно для багаторазового запуску.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Firewall блокує моє підключення">
    - Спершу переконайтеся, що маєте доступ через Tailscale VPN
    - Доступ SSH (порт 22) завжди дозволено
    - Gateway за задумом доступний лише через Tailscale

  </Accordion>
  <Accordion title="Сервіс не запускається">
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
  <Accordion title="Проблеми із sandbox Docker">
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
  <Accordion title="Вхід до провайдера не вдається">
    Переконайтеся, що ви запускаєте команди як користувач `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладну архітектуру безпеки та інструкції з усунення несправностей див. у репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні подробиці](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/uk/install/docker) -- налаштування контейнеризованого gateway
- [Sandboxing](/uk/gateway/sandboxing) -- конфігурація sandbox агента
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- ізоляція на рівні окремого агента
