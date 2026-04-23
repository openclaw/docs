---
read_when:
    - Налаштування OpenClaw на Oracle Cloud
    - Пошук безкоштовного VPS-хостингу для OpenClaw
    - Потрібен OpenClaw 24/7 на невеликому сервері
summary: Розгорнути OpenClaw на Always Free ARM tier від Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-23T20:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d3272cac5549e98f1e19031dd9af9399a60488a5e3b20d026cd28aa48dc04d0
    source_path: install/oracle.md
    workflow: 15
---

Запустіть постійний Gateway OpenClaw на **Always Free** ARM tier від Oracle Cloud (до 4 OCPU, 24 ГБ RAM, 200 ГБ сховища) безкоштовно.

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) — див. [посібник зі створення облікового запису від спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
- Обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
- Пара SSH-ключів
- Приблизно 30 хвилин

## Налаштування

<Steps>
  <Step title="Створіть екземпляр OCI">
    1. Увійдіть у [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдіть до **Compute > Instances > Create Instance**.
    3. Налаштуйте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (або до 4)
       - **Memory:** 12 ГБ (або до 24 ГБ)
       - **Boot volume:** 50 ГБ (до 200 ГБ безкоштовно)
       - **SSH key:** додайте свій публічний ключ
    4. Натисніть **Create** і запишіть публічну IP-адресу.

    <Tip>
    Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший availability domain або повторіть пізніше. Ємність free tier обмежена.
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

  <Step title="Налаштуйте користувача та ім’я хоста">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Увімкнення linger дає змогу службам користувача працювати після виходу із системи.

  </Step>

  <Step title="Установіть Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Відтепер підключайтеся через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Коли з’явиться запитання "How do you want to hatch your bot?", виберіть **Do this later**.

  </Step>

  <Step title="Налаштуйте gateway">
    Використовуйте автентифікацію токеном із Tailscale Serve для безпечного віддаленого доступу.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` тут потрібне лише для обробки forwarded-IP/local-client локальним проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути diff viewer у цій конфігурації зберігають поведінку fail-closed: необроблені запити viewer до `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або навмисно ввімкніть віддалені viewer і задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні спільні посилання на viewer.

  </Step>

  <Step title="Посильте безпеку VCN">
    Блокуйте весь трафік, окрім Tailscale, на мережевому рівні:

    1. У OCI Console перейдіть до **Networking > Virtual Cloud Networks**.
    2. Виберіть свій VCN, потім **Security Lists > Default Security List**.
    3. **Видаліть** усі ingress-правила, крім `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Залиште типові egress-правила (дозволити весь вихідний трафік).

    Це блокує SSH на порту 22, HTTP, HTTPS та все інше на мережевому рівні. З цього моменту підключення можливе лише через Tailscale.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Відкрийте Control UI з будь-якого пристрою у вашому tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замініть `<tailnet-name>` на назву вашого tailnet (її видно в `tailscale status`).

  </Step>
</Steps>

## Резервний варіант: SSH tunnel

Якщо Tailscale Serve не працює, використайте SSH tunnel зі своєї локальної машини:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

## Усунення несправностей

**Не вдається створити екземпляр ("Out of capacity")** — ARM-екземпляри free tier популярні. Спробуйте інший availability domain або повторіть у непікові години.

**Tailscale не підключається** — запустіть `sudo tailscale up --ssh --hostname=openclaw --reset`, щоб повторно пройти автентифікацію.

**Gateway не запускається** — запустіть `openclaw doctor --non-interactive` і перевірте журнали через `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблеми з ARM-бінарниками** — більшість npm-пакетів працює на ARM64. Для нативних бінарників шукайте випуски `linux-arm64` або `aarch64`. Перевірте архітектуру через `uname -m`.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — підтримуйте OpenClaw в актуальному стані
