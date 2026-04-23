---
read_when:
    - Налаштування OpenClaw на Oracle Cloud
    - Пошук недорогого VPS-хостингу для OpenClaw
    - Хочете мати OpenClaw 24/7 на невеликому сервері
summary: OpenClaw на Oracle Cloud (Always Free ARM)
title: Oracle Cloud (платформа)
x-i18n:
    generated_at: "2026-04-23T21:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4763dd6b111668b1b8ef1f24351f5c79f31b390e6db53cf88089f2c38dfe1670
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw на Oracle Cloud (OCI)

## Мета

Запустити постійний Gateway OpenClaw на ARM-рівні **Always Free** в Oracle Cloud.

Безкоштовний рівень Oracle може добре підходити для OpenClaw (особливо якщо у вас уже є обліковий запис OCI), але він має свої компроміси:

- архітектура ARM (більшість речей працює, але деякі binary можуть бути лише для x86)
- ємність і реєстрація можуть бути примхливими

## Порівняння вартості (2026)

| Provider     | Plan            | Specs                  | Price/mo | Notes                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24GB RAM    | $0       | ARM, обмежена ємність |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4     | Найдешевший платний варіант |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6       | Простий UI, хороша документація |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6       | Багато локацій        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5       | Тепер частина Akamai  |

---

## Передумови

- Обліковий запис Oracle Cloud ([signup](https://www.oracle.com/cloud/free/)) — див. [community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
- Обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
- ~30 хвилин

## 1) Створіть екземпляр OCI

1. Увійдіть у [Oracle Cloud Console](https://cloud.oracle.com/)
2. Перейдіть до **Compute → Instances → Create Instance**
3. Налаштуйте:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (або до 4)
   - **Memory:** 12 GB (або до 24 GB)
   - **Boot volume:** 50 GB (до 200 GB безкоштовно)
   - **SSH key:** Додайте свій публічний ключ
4. Натисніть **Create**
5. Запишіть публічну IP-адресу

**Порада:** якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший availability domain або повторіть пізніше. Ємність безкоштовного рівня обмежена.

## 2) Підключіться й оновіть систему

```bash
# Підключення через публічну IP-адресу
ssh ubuntu@YOUR_PUBLIC_IP

# Оновлення системи
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Примітка:** `build-essential` потрібен для ARM-компіляції деяких залежностей.

## 3) Налаштуйте користувача і hostname

```bash
# Задати hostname
sudo hostnamectl set-hostname openclaw

# Задати пароль для користувача ubuntu
sudo passwd ubuntu

# Увімкнути lingering (дозволяє user-сервісам працювати після виходу)
sudo loginctl enable-linger ubuntu
```

## 4) Встановіть Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Це вмикає Tailscale SSH, тож ви зможете підключатися через `ssh openclaw` з будь-якого пристрою у вашому tailnet — без потреби в публічній IP-адресі.

Перевірка:

```bash
tailscale status
```

**Відтепер підключайтеся через Tailscale:** `ssh ubuntu@openclaw` (або використовуйте Tailscale IP).

## 5) Встановіть OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Коли з’явиться запит "How do you want to hatch your bot?", виберіть **"Do this later"**.

> Примітка: якщо натрапите на проблеми зі збіркою ARM-native, спочатку спробуйте системні пакети (наприклад `sudo apt install -y build-essential`), а вже потім звертайтеся до Homebrew.

## 6) Налаштуйте Gateway (loopback + token auth) і ввімкніть Tailscale Serve

Використовуйте token auth як типовий варіант. Він передбачуваний і позбавляє потреби в будь-яких прапорцях “insecure auth” для Control UI.

```bash
# Тримати Gateway приватним усередині VM
openclaw config set gateway.bind loopback

# Вимагати auth для Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Відкрити через Tailscale Serve (HTTPS + доступ через tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути diff viewer у цій конфігурації зберігають поведінку fail-closed: сирі запити viewer з `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або навмисно ввімкніть remote viewers і задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні поширювані посилання viewer.

## 7) Перевірка

```bash
# Перевірити версію
openclaw --version

# Перевірити стан демона
systemctl --user status openclaw-gateway.service

# Перевірити Tailscale Serve
tailscale serve status

# Протестувати локальну відповідь
curl http://localhost:18789
```

## 8) Посиліть безпеку VCN

Тепер, коли все працює, посиліть VCN, щоб блокувати весь трафік, крім Tailscale. Virtual Cloud Network в OCI працює як firewall на межі мережі — трафік блокується ще до того, як досягне вашого екземпляра.

1. Перейдіть до **Networking → Virtual Cloud Networks** в OCI Console
2. Натисніть свій VCN → **Security Lists** → Default Security List
3. **Видаліть** усі ingress-правила, крім:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Залиште типові egress-правила (дозволити весь вихідний трафік)

Це блокує SSH на порту 22, HTTP, HTTPS і все інше на межі мережі. Відтепер підключатися можна лише через Tailscale.

---

## Доступ до Control UI

З будь-якого пристрою у вашій мережі Tailscale:

```text
https://openclaw.<tailnet-name>.ts.net/
```

Замініть `<tailnet-name>` на назву вашого tailnet (видно в `tailscale status`).

SSH-тунель не потрібен. Tailscale забезпечує:

- HTTPS-шифрування (автоматичні сертифікати)
- Автентифікацію через Tailscale identity
- Доступ з будь-якого пристрою у вашому tailnet (ноутбук, телефон тощо)

---

## Безпека: VCN + Tailscale (рекомендована базова лінія)

Коли VCN посилено (відкрито лише UDP 41641), а Gateway прив’язаний до loopback, ви отримуєте сильний захист у глибину: публічний трафік блокується на межі мережі, а адміністративний доступ відбувається через ваш tailnet.

У такій конфігурації часто зникає _потреба_ в додаткових host-based firewall-правилах лише для зупинки масового SSH brute force з Інтернету — але вам усе одно слід оновлювати ОС, запускати `openclaw security audit` і перевіряти, що ви випадково не слухаєте публічні інтерфейси.

### Уже захищено

| Traditional Step   | Needed?     | Why                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW firewall       | Ні          | VCN блокує трафік до того, як він досягає екземпляра                         |
| fail2ban           | Ні          | Немає brute force, якщо порт 22 заблоковано на рівні VCN                     |
| sshd hardening     | Ні          | Tailscale SSH не використовує sshd                                           |
| Disable root login | Ні          | Tailscale використовує Tailscale identity, а не системних користувачів       |
| SSH key-only auth  | Ні          | Tailscale автентифікує через ваш tailnet                                     |
| IPv6 hardening     | Зазвичай ні | Залежить від налаштувань VCN/subnet; перевірте, що саме реально призначено/відкрито |

### Усе ще рекомендовано

- **Права доступу до облікових даних:** `chmod 700 ~/.openclaw`
- **Аудит безпеки:** `openclaw security audit`
- **Оновлення системи:** регулярно виконуйте `sudo apt update && sudo apt upgrade`
- **Моніторинг Tailscale:** переглядайте пристрої в [Tailscale admin console](https://login.tailscale.com/admin)

### Перевірка стану безпеки

```bash
# Підтвердити, що немає публічних портів у режимі прослуховування
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Переконатися, що Tailscale SSH активний
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Необов’язково: повністю вимкнути sshd
sudo systemctl disable --now ssh
```

---

## Fallback: SSH-тунель

Якщо Tailscale Serve не працює, використовуйте SSH-тунель:

```bash
# Із локальної машини (через Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

---

## Усунення несправностей

### Не вдається створити екземпляр ("Out of capacity")

Безкоштовні ARM-екземпляри популярні. Спробуйте:

- Інший availability domain
- Повторити в непікові години (рано вранці)
- Використати фільтр "Always Free" під час вибору shape

### Tailscale не підключається

```bash
# Перевірити статус
sudo tailscale status

# Повторно автентифікуватися
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway не запускається

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Не вдається відкрити Control UI

```bash
# Переконатися, що Tailscale Serve працює
tailscale serve status

# Перевірити, що gateway слухає
curl http://localhost:18789

# Перезапустити за потреби
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-binary

Деякі інструменти можуть не мати ARM-збірок. Перевірте:

```bash
uname -m  # Should show aarch64
```

Більшість npm-пакетів працює нормально. Для binary шукайте релізи `linux-arm64` або `aarch64`.

---

## Збереження стану

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан channel/provider і дані сесій
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, memory, artifacts)

Періодично створюйте резервні копії:

```bash
openclaw backup create
```

---

## Див. також

- [Віддалений доступ до Gateway](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Інтеграція Tailscale](/uk/gateway/tailscale) — повна документація Tailscale
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Посібник для DigitalOcean](/uk/install/digitalocean) — якщо хочете платний варіант + простішу реєстрацію
- [Посібник для Hetzner](/uk/install/hetzner) — альтернатива на основі Docker
