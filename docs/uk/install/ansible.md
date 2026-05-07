---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленим захистом
    - Вам потрібне ізольоване брандмауером налаштування з доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, посилено захищене встановлення OpenClaw за допомогою Ansible, Tailscale VPN та ізоляції брандмауером
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

Розгорніть OpenClaw на виробничих серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання Ansible. Ця сторінка містить короткий огляд.
</Info>

## Передумови

| Вимога      | Подробиці                                                |
| ----------- | -------------------------------------------------------- |
| **OS**      | Debian 11+ або Ubuntu 20.04+                             |
| **Доступ**  | Права root або sudo                                      |
| **Мережа**  | Підключення до інтернету для встановлення пакетів        |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримуєте

- **Безпека з пріоритетом брандмауера** -- UFW + ізоляція Docker (доступні лише SSH + Tailscale)
- **Tailscale VPN** -- безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** -- ізольовані контейнери пісочниці, прив'язки лише до localhost
- **Багаторівневий захист** -- 4-рівнева архітектура безпеки
- **Інтеграція з systemd** -- автозапуск під час завантаження з посиленням безпеки
- **Налаштування однією командою** -- повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що встановлюється

Ansible playbook встановлює та налаштовує:

1. **Tailscale** -- mesh VPN для безпечного віддаленого доступу
2. **Брандмауер UFW** -- лише порти SSH + Tailscale
3. **Docker CE + Compose V2** -- для стандартного бекенда пісочниці агента
4. **Node.js 24 + pnpm** -- runtime-залежності (Node 22 LTS, зараз `22.16+`, залишається підтримуваним)
5. **OpenClaw** -- на основі хоста, без контейнеризації
6. **Сервіс systemd** -- автозапуск із посиленням безпеки

<Note>
Gateway запускається безпосередньо на хості (не в Docker). Ізоляція агентів у пісочниці
необов'язкова; цей playbook встановлює Docker, оскільки це стандартний бекенд
пісочниці. Див. [Ізоляція в пісочниці](/uk/gateway/sandboxing) для подробиць та інших бекендів.
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перемкніться на користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер початкового налаштування">
    Скрипт після встановлення проведе вас через налаштування параметрів OpenClaw.
  </Step>
  <Step title="Підключіть провайдерів повідомлень">
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
    Приєднайтеся до своєї mesh VPN для безпечного віддаленого доступу.
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

1. **Брандмауер (UFW)** -- публічно відкриті лише SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway доступний лише через mesh VPN
3. **Ізоляція Docker** -- ланцюжок iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Посилення systemd** -- NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Відкритим має бути лише порт 22 (SSH). Усі інші сервіси (Gateway, Docker) заблоковані.

Docker встановлюється для пісочниць агентів (ізольоване виконання інструментів), а не для запуску самого Gateway. Див. [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools) для конфігурації пісочниці.

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

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Див. [Оновлення](/uk/install/updating) для стандартного процесу оновлення.

Щоб повторно запустити Ansible playbook (наприклад, для змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентно й безпечно для багаторазового запуску.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Брандмауер блокує моє підключення">
    - Спершу переконайтеся, що можете отримати доступ через Tailscale VPN
    - Доступ SSH (порт 22) завжди дозволений
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
  <Accordion title="Проблеми з пісочницею Docker">
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

Для докладної архітектури безпеки та усунення несправностей див. репозиторій openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні подробиці](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов'язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/uk/install/docker) -- налаштування контейнеризованого Gateway
- [Ізоляція в пісочниці](/uk/gateway/sandboxing) -- конфігурація пісочниці агента
- [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools) -- ізоляція для кожного агента
