---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленням безпеки
    - Вам потрібне налаштування, ізольоване брандмауером, з доступом через VPN
    - Ви виконуєте розгортання на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, посилено захищене встановлення OpenClaw з Ansible, Tailscale VPN та ізоляцією на рівні брандмауера
title: Ansible
x-i18n:
    generated_at: "2026-04-28T11:16:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Встановлення Ansible

Розгорніть OpenClaw на продакшн-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання Ansible. Ця сторінка містить короткий огляд.
</Info>

## Передумови

| Вимога      | Подробиці                                                  |
| ----------- | --------------------------------------------------------- |
| **ОС**      | Debian 11+ або Ubuntu 20.04+                              |
| **Доступ**  | Права root або sudo                                       |
| **Мережа**  | Підключення до інтернету для встановлення пакетів         |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримаєте

- **Безпека з пріоритетом firewall** -- ізоляція UFW + Docker (доступні лише SSH + Tailscale)
- **Tailscale VPN** -- безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** -- ізольовані контейнери пісочниці, прив’язки лише до localhost
- **Багаторівневий захист** -- 4-рівнева архітектура безпеки
- **Інтеграція Systemd** -- автоматичний запуск під час завантаження з посиленням безпеки
- **Налаштування однією командою** -- повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що встановлюється

Playbook Ansible встановлює й налаштовує:

1. **Tailscale** -- mesh VPN для безпечного віддаленого доступу
2. **UFW firewall** -- лише порти SSH + Tailscale
3. **Docker CE + Compose V2** -- для стандартного бекенда пісочниці агента
4. **Node.js 24 + pnpm** -- залежності середовища виконання (Node 22 LTS, наразі `22.14+`, залишається підтримуваним)
5. **OpenClaw** -- на основі хоста, без контейнеризації
6. **Сервіс Systemd** -- автоматичний запуск із посиленням безпеки

<Note>
Gateway працює безпосередньо на хості (не в Docker). Пісочниця агентів є
необов’язковою; цей playbook встановлює Docker, оскільки це стандартний бекенд
пісочниці. Див. [Пісочниці](/uk/gateway/sandboxing), щоб дізнатися подробиці та інші бекенди.
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
    Приєднайтеся до свого VPN-меша для безпечного віддаленого доступу.
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
2. **VPN (Tailscale)** -- Gateway доступний лише через VPN-меш
3. **Ізоляція Docker** -- ланцюг iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Посилення Systemd** -- NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити вашу зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Має бути відкритим лише порт 22 (SSH). Усі інші сервіси (Gateway, Docker) заблоковані.

Docker встановлюється для пісочниць агентів (ізольованого виконання інструментів), а не для запуску самого Gateway. Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб налаштувати пісочницю.

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

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Див. [Оновлення](/uk/install/updating), щоб дізнатися стандартний процес оновлення.

Щоб повторно запустити playbook Ansible (наприклад, для змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентно й безпечно для багаторазового запуску.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Firewall блокує моє підключення">
    - Спочатку переконайтеся, що маєте доступ через Tailscale VPN
    - SSH-доступ (порт 22) завжди дозволено
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

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
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

Щоб дізнатися подробиці про архітектуру безпеки та усунення несправностей, див. репозиторій openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні подробиці](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/uk/install/docker) -- налаштування контейнеризованого Gateway
- [Пісочниці](/uk/gateway/sandboxing) -- конфігурація пісочниці агента
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- ізоляція для кожного агента
