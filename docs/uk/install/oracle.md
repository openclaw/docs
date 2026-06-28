---
read_when:
    - Налаштування OpenClaw в Oracle Cloud
    - Пошук безкоштовного VPS-хостингу для OpenClaw
    - Потрібен OpenClaw 24/7 на невеликому сервері
summary: Розмістіть OpenClaw на ARM-рівні Always Free в Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-05T16:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Запустіть постійний OpenClaw Gateway на ARM-рівні **Always Free** Oracle Cloud (до 4 OCPU, 24 ГБ RAM, 200 ГБ сховища) безплатно.

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) -- див. [посібник спільноти з реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
- Обліковий запис Tailscale (безплатно на [tailscale.com](https://tailscale.com))
- Пара SSH-ключів
- Приблизно 30 хвилин

## Налаштування

<Steps>
  <Step title="Створіть інстанс OCI">
    1. Увійдіть до [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдіть до **Compute > Instances > Create Instance**.
    3. Налаштуйте:
       - **Назва:** `openclaw`
       - **Образ:** Ubuntu 24.04 (aarch64)
       - **Форма:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (або до 4)
       - **Пам'ять:** 12 ГБ (або до 24 ГБ)
       - **Завантажувальний том:** 50 ГБ (до 200 ГБ безплатно)
       - **SSH-ключ:** додайте свій публічний ключ
    4. Натисніть **Create** і занотуйте публічну IP-адресу.

    <Tip>
    Якщо створення інстанса завершується помилкою "Out of capacity", спробуйте інший домен доступності або повторіть пізніше. Ємність безплатного рівня обмежена.
    </Tip>

  </Step>

  <Step title="Підключіться й оновіть систему">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` потрібен для ARM-компіляції деяких залежностей.

  </Step>

  <Step title="Налаштуйте користувача та ім'я хоста">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Увімкнення linger зберігає роботу користувацьких служб після виходу із системи.

  </Step>

  <Step title="Встановіть Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Відтепер підключайтеся через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Встановіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Коли з'явиться запит "How do you want to hatch your bot?", виберіть **Do this later**.

  </Step>

  <Step title="Налаштуйте Gateway">
    Використовуйте автентифікацію за токеном із Tailscale Serve для безпечного віддаленого доступу.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` тут призначено лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути переглядача diff у цьому налаштуванні зберігають fail-closed поведінку: необроблені запити переглядача `127.0.0.1` без заголовків проксі переспрямування можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або навмисно ввімкніть віддалені переглядачі й задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте проксі `baseUrl`), якщо потрібні посилання переглядача, якими можна ділитися.

  </Step>

  <Step title="Заблокуйте безпеку VCN">
    Заблокуйте весь трафік, крім Tailscale, на мережевому периметрі:

    1. Перейдіть до **Networking > Virtual Cloud Networks** у OCI Console.
    2. Натисніть свою VCN, потім **Security Lists > Default Security List**.
    3. **Видаліть** усі правила входу, крім `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Залиште стандартні правила виходу (дозволити весь вихідний трафік).

    Це блокує SSH на порту 22, HTTP, HTTPS і все інше на мережевому периметрі. З цього моменту підключатися можна лише через Tailscale.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Отримайте доступ до Control UI з будь-якого пристрою у вашій tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замініть `<tailnet-name>` на назву вашої tailnet (видно в `tailscale status`).

  </Step>
</Steps>

## Перевірте стан безпеки

Коли VCN заблоковано (відкритий лише UDP 41641), а Gateway прив'язано до loopback, публічний трафік блокується на мережевому периметрі, а адміністративний доступ доступний лише з tailnet. Це усуває потребу в кількох традиційних кроках посилення безпеки VPS:

| Традиційний крок          | Потрібен?       | Чому                                                                          |
| ------------------------- | --------------- | ----------------------------------------------------------------------------- |
| Брандмауер UFW            | Ні              | VCN блокує трафік до того, як він досягне інстанса.                           |
| fail2ban                  | Ні              | Порт 22 заблоковано на рівні VCN; поверхні для brute-force немає.             |
| Посилення sshd            | Ні              | Tailscale SSH не використовує sshd.                                           |
| Вимкнення входу root      | Ні              | Tailscale автентифікує за ідентичністю tailnet, а не системними користувачами. |
| Автентифікація лише ключем SSH | Ні         | Те саме — ідентичність tailnet замінює системні SSH-ключі.                    |
| Посилення IPv6            | Зазвичай ні     | Залежить від налаштувань VCN/підмережі; перевірте, що фактично призначено/відкрито. |

Усе ще рекомендовано:

- `chmod 700 ~/.openclaw`, щоб обмежити дозволи файлів облікових даних.
- `openclaw security audit` для перевірки стану безпеки, специфічної для OpenClaw.
- Регулярно виконувати `sudo apt update && sudo apt upgrade` для патчів ОС.
- Періодично переглядати пристрої в [адміністративній консолі Tailscale](https://login.tailscale.com/admin).

Швидкі команди перевірки:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Примітки щодо ARM

Рівень Always Free працює на ARM (`aarch64`). Більшість функцій OpenClaw працюють нормально; невелика кількість нативних бінарних файлів потребує ARM-збірок:

- Node.js, Telegram, WhatsApp (Baileys): чистий JavaScript, без проблем.
- Більшість npm-пакетів із нативним кодом: доступні попередньо зібрані артефакти `linux-arm64`.
- Необов'язкові CLI-помічники (наприклад, Go/Rust-бінарники, що постачаються Skills): перед встановленням перевірте наявність релізу `aarch64` / `linux-arm64`.

Перевірте архітектуру за допомогою `uname -m` (має вивести `aarch64`). Для бінарних файлів без ARM-збірки встановіть із вихідного коду або пропустіть їх.

## Постійність і резервні копії

Стан OpenClaw зберігається в:

- `~/.openclaw/` — `openclaw.json`, поагентні `auth-profiles.json`, стан каналів/провайдерів і дані сесій.
- `~/.openclaw/workspace/` — робочий простір агента (SOUL.md, пам'ять, артефакти).

Вони зберігаються після перезавантажень. Щоб створити переносний знімок:

```bash
openclaw backup create
```

## Резервний варіант: SSH-тунель

Якщо Tailscale Serve не працює, використайте SSH-тунель зі своєї локальної машини:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

## Усунення несправностей

**Створення інстанса завершується помилкою ("Out of capacity")** -- ARM-інстанси безплатного рівня популярні. Спробуйте інший домен доступності або повторіть у години меншого навантаження.

**Tailscale не підключається** -- Виконайте `sudo tailscale up --ssh --hostname=openclaw --reset`, щоб повторно автентифікуватися.

**Gateway не запускається** -- Виконайте `openclaw doctor --non-interactive` і перевірте журнали командою `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблеми з ARM-бінарниками** -- Більшість npm-пакетів працюють на ARM64. Для нативних бінарних файлів шукайте релізи `linux-arm64` або `aarch64`. Перевірте архітектуру за допомогою `uname -m`.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов'язане

- [Огляд встановлення](/uk/install)
- [GCP](/uk/install/gcp)
- [Хостинг VPS](/uk/vps)
