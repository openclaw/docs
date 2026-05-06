---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленням захисту
    - Вам потрібне налаштування, ізольоване брандмауером, із доступом через VPN
    - Ви виконуєте розгортання на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, посилено захищене встановлення OpenClaw з Ansible, Tailscale VPN та ізоляцією міжмережевого екрана
title: Ansible
x-i18n:
    generated_at: "2026-05-06T07:18:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

Розгорніть OpenClaw на production-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання Ansible. Ця сторінка — короткий огляд.
</Info>

## Передумови

| Вимога      | Деталі                                                    |
| ----------- | --------------------------------------------------------- |
| **ОС**      | Debian 11+ або Ubuntu 20.04+                              |
| **Доступ**  | Права root або sudo                                       |
| **Мережа**  | Інтернет-з’єднання для встановлення пакетів               |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримуєте

- **Безпека з пріоритетом firewall** -- ізоляція UFW + Docker (доступні лише SSH + Tailscale)
- **Tailscale VPN** -- безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** -- ізольовані контейнери sandbox, прив’язки лише до localhost
- **Багаторівневий захист** -- 4-рівнева архітектура безпеки
- **Інтеграція Systemd** -- автозапуск під час завантаження з посиленням безпеки
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
3. **Docker CE + Compose V2** -- для типового backend sandbox агента
4. **Node.js 24 + pnpm** -- runtime-залежності (Node 22 LTS, наразі `22.14+`, і далі підтримується)
5. **OpenClaw** -- на хості, без контейнеризації
6. **Systemd service** -- автозапуск із посиленням безпеки

<Note>
Gateway працює безпосередньо на хості (не в Docker). Sandbox для агентів
необов’язковий; цей playbook встановлює Docker, оскільки це типовий sandbox
backend. Докладніше та про інші backend див. у [Sandboxing](/uk/gateway/sandboxing).
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
2. **VPN (Tailscale)** -- Gateway доступний лише через VPN mesh
3. **Ізоляція Docker** -- ланцюг iptables DOCKER-USER запобігає відкриттю зовнішніх портів
4. **Посилення Systemd** -- NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Відкритим має бути лише порт 22 (SSH). Усі інші сервіси (Gateway, Docker) заблоковані.

Docker встановлюється для sandbox агентів (ізольованого виконання інструментів), а не для запуску самого Gateway. Налаштування sandbox див. у [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools).

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

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Firewall блокує моє з’єднання">
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
    Переконайтеся, що ви працюєте як користувач `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладну архітектуру безпеки та усунення неполадок див. у репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні деталі](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення неполадок](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/uk/install/docker) -- налаштування контейнеризованого Gateway
- [Sandboxing](/uk/gateway/sandboxing) -- конфігурація sandbox агента
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- ізоляція для кожного агента
