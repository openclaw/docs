---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленим захистом
    - Вам потрібне ізольоване брандмауером налаштування з доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, захищене встановлення OpenClaw за допомогою Ansible, VPN Tailscale та ізоляції брандмауером
title: Ansible
x-i18n:
    generated_at: "2026-04-27T06:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fa6c215bc2d4a9d032438bead4336bc10433eb8c40e206d72224c7009c7dabf
    source_path: install/ansible.md
    workflow: 15
---

# Встановлення Ansible

Розгорніть OpenClaw на робочих серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання через Ansible. Ця сторінка — короткий огляд.
</Info>

## Передумови

| Вимога | Деталі |
| ----------- | --------------------------------------------------------- |
| **ОС**      | Debian 11+ або Ubuntu 20.04+                               |
| **Доступ**  | Права root або sudo                                   |
| **Мережа** | Підключення до Інтернету для встановлення пакетів              |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримаєте

- **Безпека на основі брандмауера** — UFW + ізоляція Docker (доступні лише SSH + Tailscale)
- **VPN Tailscale** — безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** — ізольовані контейнерні середовища, прив’язки лише до localhost
- **Багаторівневий захист** — 4-рівнева архітектура безпеки
- **Інтеграція з Systemd** — автозапуск під час завантаження з посиленим захистом
- **Налаштування однією командою** — повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що буде встановлено

Playbook Ansible встановлює та налаштовує:

1. **Tailscale** — mesh VPN для безпечного віддаленого доступу
2. **Брандмауер UFW** — лише порти SSH + Tailscale
3. **Docker CE + Compose V2** — для типового бекенда ізольованого середовища агента
4. **Node.js 24 + pnpm** — залежності середовища виконання (Node 22 LTS, наразі `22.14+`, також підтримується)
5. **OpenClaw** — на хості, не в контейнері
6. **Сервіс Systemd** — автозапуск із посиленим захистом

<Note>
Шлюз запускається безпосередньо на хості (не в Docker). Ізоляція агента
необов’язкова; цей playbook встановлює Docker, оскільки це типовий бекенд
ізольованого середовища. Докладніше та про інші бекенди див. у [Sandboxing](/uk/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перейдіть до користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер початкового налаштування">
    Післявстановлювальний скрипт проведе вас через налаштування параметрів OpenClaw.
  </Step>
  <Step title="Підключіть провайдерів обміну повідомленнями">
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
# Перевірити стан сервісу
sudo systemctl status openclaw

# Переглянути журнали в реальному часі
sudo journalctl -u openclaw -f

# Перезапустити шлюз
sudo systemctl restart openclaw

# Вхід до провайдера (запускати від імені користувача openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Архітектура безпеки

У розгортанні використовується 4-рівнева модель захисту:

1. **Брандмауер (UFW)** — публічно відкриті лише SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — шлюз доступний лише через VPN mesh
3. **Ізоляція Docker** — ланцюг `DOCKER-USER` в iptables запобігає зовнішньому відкриттю портів
4. **Посилення захисту Systemd** — NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Має бути відкритий лише порт 22 (SSH). Усі інші сервіси (шлюз, Docker) заблоковані.

Docker встановлюється для ізольованих середовищ агентів (ізольованого виконання інструментів), а не для запуску самого шлюзу. Докладніше про налаштування ізольованих середовищ див. у [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools).

## Ручне встановлення

Якщо ви віддаєте перевагу ручному керуванню автоматизацією:

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
    # Потім виконайте: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Оновлення

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Стандартний процес оновлення описано в [Updating](/uk/install/updating).

Щоб повторно запустити playbook Ansible (наприклад, для зміни конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентна операція, яку безпечно виконувати багаторазово.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Брандмауер блокує моє з’єднання">
    - Спочатку переконайтеся, що ви маєте доступ через VPN Tailscale
    - Доступ по SSH (порт 22) завжди дозволений
    - Доступ до шлюзу навмисно можливий лише через Tailscale

  </Accordion>
  <Accordion title="Сервіс не запускається">
    ```bash
    # Перевірити журнали
    sudo journalctl -u openclaw -n 100

    # Перевірити дозволи
    sudo ls -la /opt/openclaw

    # Протестувати ручний запуск
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблеми з ізольованим середовищем Docker">
    ```bash
    # Переконатися, що Docker запущено
    sudo systemctl status docker

    # Перевірити образ ізольованого середовища
    sudo docker images | grep openclaw-sandbox

    # Зібрати образ ізольованого середовища, якщо його немає
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Не вдається ввійти до провайдера">
    Переконайтеся, що ви працюєте від імені користувача `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладну інформацію про архітектуру безпеки та усунення несправностей дивіться в репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні подробиці](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — повний посібник із розгортання
- [Docker](/uk/install/docker) — налаштування шлюзу в контейнері
- [Sandboxing](/uk/gateway/sandboxing) — конфігурація ізольованого середовища агента
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) — ізоляція для кожного агента окремо
