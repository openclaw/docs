---
read_when:
    - Налаштування OpenClaw на Oracle Cloud
    - Шукаєте недорогий VPS-хостинг для OpenClaw
    - Хочете OpenClaw 24/7 на невеликому сервері
summary: OpenClaw на Oracle Cloud (Always Free ARM)
title: Oracle Cloud (платформа)
x-i18n:
    generated_at: "2026-04-27T07:09:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw на Oracle Cloud (OCI)

## Мета

Запустити постійний Gateway OpenClaw на **Always Free** ARM-рівні Oracle Cloud.

Безкоштовний рівень Oracle може дуже добре підходити для OpenClaw (особливо якщо у вас уже є обліковий запис OCI), але він має компроміси:

- ARM-архітектура (більшість речей працює, але деякі бінарні файли можуть бути лише для x86)
- ємність і реєстрація можуть бути примхливими

## Порівняння вартості (2026)

| Постачальник | План            | Характеристики         | Ціна/міс | Примітки              |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24GB RAM    | $0       | ARM, обмежена ємність |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4     | Найдешевший платний варіант |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6       | Простий UI, добра документація |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6       | Багато локацій        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5       | Тепер частина Akamai  |

---

## Передумови

- обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) — див. [посібник спільноти з реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
- обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
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
   - **Boot volume:** 50 GB (безкоштовно до 200 GB)
   - **SSH key:** Додайте свій публічний ключ
4. Натисніть **Create**
5. Запишіть публічну IP-адресу

**Порада:** Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший домен доступності або повторіть пізніше. Ємність безкоштовного рівня обмежена.

## 2) Підключіться та оновіть систему

```bash
# Підключення через публічну IP-адресу
ssh ubuntu@YOUR_PUBLIC_IP

# Оновлення системи
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Примітка:** `build-essential` потрібен для ARM-компіляції деяких залежностей.

## 3) Налаштуйте користувача та ім’я хоста

```bash
# Установіть ім’я хоста
sudo hostnamectl set-hostname openclaw

# Установіть пароль для користувача ubuntu
sudo passwd ubuntu

# Увімкніть lingering (зберігає роботу користувацьких сервісів після виходу)
sudo loginctl enable-linger ubuntu
```

## 4) Установіть Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Це вмикає Tailscale SSH, тож ви зможете підключатися через `ssh openclaw` з будь-якого пристрою у вашому tailnet — без потреби в публічній IP-адресі.

Перевірте:

```bash
tailscale status
```

**Відтепер підключайтеся через Tailscale:** `ssh ubuntu@openclaw` (або використовуйте IP-адресу Tailscale).

## 5) Установіть OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Коли з’явиться запитання "How do you want to hatch your bot?", виберіть **"Do this later"**.

> Примітка: Якщо ви зіткнулися з проблемами ARM-native збірки, почніть із системних пакетів (наприклад, `sudo apt install -y build-essential`), перш ніж переходити до Homebrew.

## 6) Налаштуйте Gateway (loopback + автентифікація за токеном) і ввімкніть Tailscale Serve

Використовуйте автентифікацію за токеном як типовий варіант. Вона передбачувана й дозволяє уникнути потреби в будь-яких прапорцях “insecure auth” для Control UI.

```bash
# Залиште Gateway приватним на VM
openclaw config set gateway.bind loopback

# Вимагайте автентифікацію для Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Відкрийте через Tailscale Serve (HTTPS + доступ через tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` тут потрібен лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути переглядача diff у цій конфігурації зберігають fail-closed поведінку: сирі запити переглядача `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або навмисно ввімкніть віддалені переглядачі та задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні спільні посилання на переглядач.

## 7) Перевірте

```bash
# Перевірте версію
openclaw --version

# Перевірте стан демона
systemctl --user status openclaw-gateway.service

# Перевірте Tailscale Serve
tailscale serve status

# Перевірте локальну відповідь
curl http://localhost:18789
```

## 8) Посильте безпеку VCN

Тепер, коли все працює, посильте безпеку VCN, щоб блокувати весь трафік, окрім Tailscale. Virtual Cloud Network в OCI працює як файрвол на межі мережі — трафік блокується ще до того, як досягне вашого екземпляра.

1. Перейдіть до **Networking → Virtual Cloud Networks** в OCI Console
2. Виберіть свій VCN → **Security Lists** → Default Security List
3. **Видаліть** усі правила вхідного трафіку, крім:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Залиште стандартні правила вихідного трафіку (дозволити весь вихідний трафік)

Це блокує SSH на порту 22, HTTP, HTTPS та все інше на межі мережі. Відтепер ви зможете підключатися лише через Tailscale.

---

## Доступ до Control UI

З будь-якого пристрою у вашій мережі Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Замініть `<tailnet-name>` на назву вашого tailnet (видно в `tailscale status`).

SSH-тунель не потрібен. Tailscale забезпечує:

- HTTPS-шифрування (автоматичні сертифікати)
- автентифікацію через ідентичність Tailscale
- доступ із будь-якого пристрою у вашому tailnet (ноутбук, телефон тощо)

---

## Безпека: VCN + Tailscale (рекомендований базовий варіант)

Коли VCN заблокований (відкрито лише UDP 41641), а Gateway прив’язаний до loopback, ви отримуєте сильний багаторівневий захист: публічний трафік блокується на межі мережі, а адміністративний доступ відбувається через ваш tailnet.

Ця конфігурація часто прибирає _потребу_ в додаткових правилах файрвола на хості суто для зупинки брутфорсу SSH з усього Інтернету — але вам усе одно слід підтримувати ОС в актуальному стані, запускати `openclaw security audit` і перевіряти, що ви випадково не слухаєте публічні інтерфейси.

### Уже захищено

| Традиційний крок  | Потрібно?    | Чому                                                                         |
| ----------------- | ------------ | ---------------------------------------------------------------------------- |
| UFW firewall      | Ні           | VCN блокує трафік до того, як він досягне екземпляра                         |
| fail2ban          | Ні           | Немає брутфорсу, якщо порт 22 заблокований у VCN                             |
| sshd hardening    | Ні           | Tailscale SSH не використовує sshd                                           |
| Disable root login | Ні          | Tailscale використовує ідентичність Tailscale, а не системних користувачів   |
| SSH key-only auth | Ні           | Tailscale автентифікує через ваш tailnet                                     |
| IPv6 hardening    | Зазвичай ні  | Залежить від ваших налаштувань VCN/підмережі; перевірте, що насправді призначено/відкрито |

### Усе ще рекомендовано

- **Права доступу до облікових даних:** `chmod 700 ~/.openclaw`
- **Аудит безпеки:** `openclaw security audit`
- **Оновлення системи:** регулярно виконуйте `sudo apt update && sudo apt upgrade`
- **Моніторинг Tailscale:** переглядайте пристрої в [консолі адміністратора Tailscale](https://login.tailscale.com/admin)

### Перевірка стану безпеки

```bash
# Підтвердьте, що публічні порти не слухаються
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Перевірте, що Tailscale SSH активний
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Необов’язково: повністю вимкніть sshd
sudo systemctl disable --now ssh
```

---

## Резервний варіант: SSH-тунель

Якщо Tailscale Serve не працює, використовуйте SSH-тунель:

```bash
# На вашій локальній машині (через Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

---

## Усунення проблем

### Не вдається створити екземпляр ("Out of capacity")

Безкоштовні ARM-екземпляри популярні. Спробуйте:

- інший домен доступності
- повторити в непіковий час (рано вранці)
- використовувати фільтр "Always Free" при виборі shape

### Tailscale не підключається

```bash
# Перевірте стан
sudo tailscale status

# Повторна автентифікація
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
# Перевірте, що Tailscale Serve працює
tailscale serve status

# Перевірте, що gateway слухає
curl http://localhost:18789

# Перезапустіть за потреби
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарними файлами

Деякі інструменти можуть не мати ARM-збірок. Перевірте:

```bash
uname -m  # Має показати aarch64
```

Більшість npm-пакетів працюють нормально. Для бінарних файлів шукайте релізи `linux-arm64` або `aarch64`.

---

## Постійність даних

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналу/постачальника та дані сесій
- `~/.openclaw/workspace/` — робоча область (SOUL.md, пам’ять, артефакти)

Робіть резервні копії періодично:

```bash
openclaw backup create
```

---

## Пов’язане

- [Віддалений доступ до Gateway](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Інтеграція Tailscale](/uk/gateway/tailscale) — повна документація Tailscale
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Посібник для DigitalOcean](/uk/install/digitalocean) — якщо вам потрібен платний варіант із простішою реєстрацією
- [Посібник для Hetzner](/uk/install/hetzner) — альтернатива на базі Docker
