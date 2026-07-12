---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленим захистом
    - Вам потрібне налаштування з ізоляцією брандмауером і доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване захищене встановлення OpenClaw за допомогою Ansible, VPN Tailscale та ізоляції брандмауером
title: Ansible
x-i18n:
    generated_at: "2026-07-12T13:17:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Розгорніть OpenClaw на виробничих серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизованого інсталятора з архітектурою, у якій безпека має найвищий пріоритет.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є основним джерелом інформації про розгортання за допомогою Ansible. На цій сторінці наведено короткий огляд.
</Info>

## Передумови

| Вимога      | Докладні відомості                                                   |
| ----------- | -------------------------------------------------------------------- |
| ОС          | Debian 11+ або Ubuntu 20.04+                                         |
| Доступ      | Права root або sudo                                                  |
| Мережа      | Підключення до Інтернету для встановлення пакетів                     |
| Ansible     | 2.14+ (автоматично встановлюється скриптом швидкого запуску)          |

## Що ви отримуєте

- Захист насамперед за допомогою брандмауера: ізоляція UFW + Docker (доступні лише SSH + Tailscale)
- VPN Tailscale для віддаленого доступу без публічного відкриття служб
- Docker для ізольованих контейнерів пісочниці з прив’язками лише до localhost
- Інтеграція із systemd із посиленим захистом та автоматичним запуском під час завантаження
- Налаштування однією командою

## Швидкий запуск

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що встановлюється

1. Tailscale (mesh-VPN для захищеного віддаленого доступу)
2. Брандмауер UFW (лише порти SSH + Tailscale)
3. Docker CE + Compose V2 (типовий серверний компонент пісочниці агента)
4. Node.js і pnpm (OpenClaw потребує Node 22.19+ або 23.11+; рекомендовано Node 24)
5. OpenClaw, установлений безпосередньо на хості, а не в контейнері
6. Служба systemd із посиленим захистом

<Note>
Gateway працює безпосередньо на хості, а не в Docker. Ізоляція агентів у пісочниці
необов’язкова; цей плейбук установлює Docker, оскільки він є типовим серверним
компонентом пісочниці. Інші серверні компоненти описано в розділі [Ізоляція в пісочниці](/uk/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перейдіть до користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер початкового налаштування">
    Скрипт після встановлення допоможе вам налаштувати OpenClaw.
  </Step>
  <Step title="Підключіть канали обміну повідомленнями">
    Увійдіть у WhatsApp, Telegram, Discord або Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Перевірте встановлення">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Підключіться до Tailscale">
    Приєднайтеся до своєї VPN-мережі для захищеного віддаленого доступу.
  </Step>
</Steps>

### Швидкі команди

```bash
# Перевірити стан служби
sudo systemctl status openclaw

# Переглянути журнали в реальному часі
sudo journalctl -u openclaw -f

# Перезапустити Gateway
sudo systemctl restart openclaw

# Увійти в канал (виконувати від імені користувача openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Архітектура безпеки

Чотирирівнева модель захисту:

1. Брандмауер (UFW): публічно відкриті лише SSH (22) і Tailscale (41641/udp)
2. VPN (Tailscale): Gateway доступний лише через VPN-мережу
3. Ізоляція Docker: ланцюжок iptables `DOCKER-USER` запобігає відкриттю портів назовні
4. Посилення захисту systemd: `NoNewPrivileges`, `PrivateTmp`, непривілейований користувач

Перевірте свою зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Відкритим має бути лише порт 22 (SSH). Gateway і Docker залишаються захищеними від зовнішнього доступу.

Docker установлюється для пісочниць агентів (ізольованого виконання інструментів), а не для запуску Gateway. Налаштування пісочниці описано в розділі [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools).

## Встановлення вручну

<Steps>
  <Step title="Установіть необхідні компоненти">
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
  <Step title="Установіть колекції Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Запустіть плейбук">
    ```bash
    ./run-playbook.sh
    ```

    Або запустіть плейбук безпосередньо, а потім вручну запустіть скрипт налаштування:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Потім виконайте: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Оновлення

Інсталятор Ansible налаштовує OpenClaw для оновлення вручну; стандартний процес описано в розділі [Оновлення](/uk/install/updating).

Щоб повторно запустити плейбук (наприклад, після змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Цей процес ідемпотентний, тому його можна безпечно запускати кілька разів.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Брандмауер блокує моє підключення">
    - Спочатку підключіться через VPN Tailscale; за задумом Gateway доступний лише в такий спосіб.
    - SSH (порт 22) дозволено завжди.

  </Accordion>
  <Accordion title="Служба не запускається">
    ```bash
    # Перевірити журнали
    sudo journalctl -u openclaw -n 100

    # Перевірити дозволи
    sudo ls -la /opt/openclaw

    # Перевірити запуск вручну
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблеми з пісочницею Docker">
    ```bash
    # Перевірити, чи працює Docker
    sudo systemctl status docker

    # Перевірити образ пісочниці
    sudo docker images | grep openclaw-sandbox

    # Зібрати образ пісочниці, якщо його немає (потрібна копія вихідного коду)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Відомості про встановлення через npm без копії вихідного коду див. на сторінці
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Не вдається увійти в канал">
    Переконайтеся, що ви виконуєте команди від імені користувача `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладний опис архітектури безпеки та усунення несправностей наведено в репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні відомості](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язані матеріали

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): повний посібник із розгортання
- [Docker](/uk/install/docker): налаштування контейнеризованого Gateway
- [Ізоляція в пісочниці](/uk/gateway/sandboxing): конфігурація пісочниці агента
- [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools): ізоляція окремих агентів
