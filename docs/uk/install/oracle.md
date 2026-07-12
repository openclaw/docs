---
read_when:
    - Налаштування OpenClaw в Oracle Cloud
    - Пошук безкоштовного VPS-хостингу для OpenClaw
    - Хочете, щоб OpenClaw цілодобово працював на невеликому сервері
summary: Розміщення OpenClaw на безкоштовному ARM-рівні Always Free від Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T13:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Запустіть постійний Gateway OpenClaw на рівні ARM **Always Free** від Oracle Cloud (до 4 OCPU, 24 ГБ оперативної пам’яті та 200 ГБ сховища) безкоштовно.

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) — якщо виникнуть проблеми, перегляньте [посібник спільноти з реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Обліковий запис Tailscale (безкоштовний на [tailscale.com](https://tailscale.com))
- Пара ключів SSH
- Приблизно 30 хвилин

## Налаштування

<Steps>
  <Step title="Створіть екземпляр OCI">
    1. Увійдіть до [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдіть до **Compute > Instances > Create Instance**.
    3. Налаштуйте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (або до 4)
       - **Memory:** 12 ГБ (або до 24 ГБ)
       - **Boot volume:** 50 ГБ (до 200 ГБ безкоштовно)
       - **SSH key:** додайте свій відкритий ключ
    4. Натисніть **Create** та занотуйте загальнодоступну IP-адресу.

    <Tip>
    Якщо створити екземпляр не вдається через помилку "Out of capacity", спробуйте інший домен доступності або повторіть спробу пізніше. Ресурси безкоштовного рівня обмежені.
    </Tip>

  </Step>

  <Step title="Підключіться та оновіть систему">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` потрібен для компіляції деяких залежностей під ARM.

  </Step>

  <Step title="Налаштуйте користувача та ім’я хоста">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Увімкнення linger забезпечує роботу служб користувача після виходу із системи.

  </Step>

  <Step title="Установіть Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Надалі підключайтеся через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Коли з’явиться запит "How do you want to hatch your bot?", виберіть **Do this later**.

  </Step>

  <Step title="Налаштуйте Gateway">
    Для безпечного віддаленого доступу використовуйте автентифікацію за токеном із Tailscale Serve.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки перенаправленої IP-адреси та локального клієнта локальним проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. У цьому налаштуванні маршрути переглядача відмінностей зберігають поведінку із забороною за замовчуванням: необроблені запити переглядача з `127.0.0.1` без пересланих заголовків проксі повертають `Diff not found`. Для вкладень використовуйте `mode=file` / `mode=both`. Якщо потрібні загальнодоступні посилання на переглядач, цілеспрямовано ввімкніть віддалені переглядачі та задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте проксі `baseUrl`).

  </Step>

  <Step title="Обмежте доступ у налаштуваннях безпеки VCN">
    Заблокуйте весь трафік, окрім Tailscale, на межі мережі:

    1. У консолі OCI перейдіть до **Networking > Virtual Cloud Networks**.
    2. Натисніть свою VCN, а потім **Security Lists > Default Security List**.
    3. **Видаліть** усі правила вхідного трафіку, крім `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Залиште стандартні правила вихідного трафіку (дозволити весь вихідний трафік).

    Це блокує SSH на порту 22, HTTP, HTTPS і весь інший трафік на межі мережі. Відтепер підключатися можна лише через Tailscale.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Відкрийте інтерфейс керування з будь-якого пристрою у вашій мережі tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замініть `<tailnet-name>` на назву своєї мережі tailnet (її можна побачити у виводі `tailscale status`).

  </Step>
</Steps>

## Перевірте стан захисту

Коли доступ до VCN обмежено (відкритий лише UDP 41641), а Gateway прив’язано до loopback, загальнодоступний трафік блокується на межі мережі, а адміністративний доступ можливий лише через tailnet. Завдяки цьому кілька традиційних кроків із посилення захисту VPS стають непотрібними:

| Традиційний крок                | Потрібен?     | Чому                                                                            |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| Брандмауер UFW                  | Ні            | VCN блокує трафік до того, як він досягне екземпляра.                            |
| fail2ban                        | Ні            | Порт 22 заблоковано на рівні VCN; поверхні для атак перебором немає.             |
| Посилення захисту sshd          | Ні            | Tailscale SSH не використовує sshd.                                              |
| Вимкнення входу для root        | Ні            | Tailscale автентифікує за ідентичністю tailnet, а не за системними користувачами. |
| Автентифікація SSH лише ключами | Ні            | Так само — ідентичність tailnet замінює системні ключі SSH.                      |
| Посилення захисту IPv6          | Зазвичай ні   | Залежить від налаштувань VCN/підмережі; перевірте фактичні призначення та доступ. |

Усе одно рекомендовано:

- `chmod 700 ~/.openclaw`, щоб обмежити дозволи для файлів облікових даних.
- `openclaw security audit` для перевірки стану захисту OpenClaw.
- Регулярно запускати `sudo apt update && sudo apt upgrade`, щоб установлювати виправлення ОС.
- Періодично переглядати пристрої в [консолі адміністрування Tailscale](https://login.tailscale.com/admin).

Команди для швидкої перевірки:

```bash
# Переконайтеся, що загальнодоступні порти не прослуховуються
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Перевірте, чи активний Tailscale SSH
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Необов’язково: повністю вимкніть sshd, переконавшись, що Tailscale SSH працює
sudo systemctl disable --now ssh
```

## Примітки щодо ARM

Рівень Always Free використовує ARM (`aarch64`). Більшість функцій OpenClaw працюють належним чином; для невеликої кількості нативних виконуваних файлів потрібні збірки ARM:

- Node.js, Telegram, WhatsApp (Baileys): суто JavaScript, без проблем.
- Більшість пакетів npm із нативним кодом: доступні попередньо зібрані артефакти `linux-arm64`.
- Необов’язкові допоміжні засоби CLI (наприклад, виконувані файли Go/Rust, що постачаються зі Skills): перед установленням перевірте наявність випуску `aarch64` / `linux-arm64`.

Перевірте архітектуру за допомогою `uname -m` (має вивести `aarch64`). Виконувані файли без збірки ARM установлюйте з вихідного коду або пропустіть їх.

## Збереження стану та резервні копії

Стан OpenClaw зберігається в таких каталогах:

- `~/.openclaw/` — `openclaw.json`, окремі для кожного агента файли `auth-profiles.json`, стан каналів і постачальників, а також дані сеансів.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам’ять, артефакти).

Ці дані зберігаються після перезавантаження. Щоб створити переносний знімок, виконайте:

```bash
openclaw backup create
```

## Резервний варіант: тунель SSH

Якщо Tailscale Serve не працює, створіть тунель SSH із локального комп’ютера:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

## Усунення несправностей

**Не вдається створити екземпляр ("Out of capacity")** — екземпляри ARM безкоштовного рівня мають високий попит. Спробуйте інший домен доступності або повторіть спробу в години найменшого навантаження.

**Tailscale не підключається** — виконайте `sudo tailscale up --ssh --hostname=openclaw --reset`, щоб повторно пройти автентифікацію.

**Gateway не запускається** — виконайте `openclaw doctor --non-interactive` і перевірте журнали командою `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблеми з виконуваними файлами ARM** — більшість пакетів npm працюють на ARM64. Для нативних виконуваних файлів шукайте випуски `linux-arm64` або `aarch64`. Перевірте архітектуру за допомогою `uname -m`.

## Подальші кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord тощо
- [Налаштування Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — підтримуйте OpenClaw в актуальному стані

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [GCP](/uk/install/gcp)
- [Розміщення на VPS](/uk/vps)
