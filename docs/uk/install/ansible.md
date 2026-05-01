---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленням безпеки
    - Потрібне середовище, ізольоване брандмауером, із доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, посилено захищене встановлення OpenClaw з Ansible, VPN Tailscale та ізоляцією за допомогою брандмауера
title: Ansible
x-i18n:
    generated_at: "2026-05-01T11:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Встановлення Ansible

Розгорніть OpenClaw на production-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматизованого інсталятора з архітектурою, орієнтованою насамперед на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання Ansible. Ця сторінка містить короткий огляд.
</Info>

## Передумови

| Вимога      | Подробиці                                                 |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ або Ubuntu 20.04+                              |
| **Доступ**  | Права root або sudo                                       |
| **Мережа**  | Підключення до інтернету для встановлення пакетів         |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримаєте

- **Безпека з пріоритетом firewall** -- UFW + ізоляція Docker (доступні лише SSH + Tailscale)
- **Tailscale VPN** -- безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** -- ізольовані sandbox-контейнери, прив’язки лише до localhost
- **Багаторівневий захист** -- 4-рівнева архітектура безпеки
- **Інтеграція з systemd** -- автозапуск під час завантаження з посиленням захисту
- **Налаштування однією командою** -- повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що встановлюється

Ansible playbook встановлює та налаштовує:

1. **Tailscale** -- mesh VPN для безпечного віддаленого доступу
2. **UFW firewall** -- лише порти SSH + Tailscale
3. **Docker CE + Compose V2** -- для стандартного sandbox-бекенда агента
4. **Node.js 24 + pnpm** -- runtime-залежності (Node 22 LTS, наразі `22.14+`, залишається підтримуваним)
5. **OpenClaw** -- на хості, не контейнеризовано
6. **Сервіс systemd** -- автозапуск із посиленим захистом

<Note>
Gateway працює безпосередньо на хості (не в Docker). Sandbox для агентів
необов’язковий; цей playbook встановлює Docker, оскільки це стандартний sandbox-
бекенд. Докладніше та про інші бекенди див. у [Sandboxing](/uk/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    Скрипт після встановлення проведе вас через налаштування параметрів OpenClaw.
  </Step>
  <Step title="Connect messaging providers">
    Увійдіть у WhatsApp, Telegram, Discord або Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
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
2. **VPN (Tailscale)** -- Gateway доступний лише через VPN mesh
3. **Ізоляція Docker** -- ланцюжок iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Посилення systemd** -- NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Відкритим має бути лише порт 22 (SSH). Усі інші сервіси (Gateway, Docker) заблоковані.

Docker встановлюється для sandbox агентів (ізольованого виконання інструментів), а не для запуску самого Gateway. Налаштування sandbox див. у [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools).

## Ручне встановлення

Якщо ви віддаєте перевагу ручному контролю замість автоматизації:

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
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
  <Accordion title="Firewall blocks my connection">
    - Спочатку переконайтеся, що маєте доступ через Tailscale VPN
    - Доступ SSH (порт 22) завжди дозволено
    - Gateway за проєктом доступний лише через Tailscale

  </Accordion>
  <Accordion title="Service will not start">
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
  <Accordion title="Docker sandbox issues">
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
  <Accordion title="Provider login fails">
    Переконайтеся, що ви працюєте як користувач `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладну архітектуру безпеки й усунення несправностей див. у репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні подробиці](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/uk/install/docker) -- налаштування контейнеризованого Gateway
- [Sandboxing](/uk/gateway/sandboxing) -- конфігурація sandbox агента
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- ізоляція для кожного агента
