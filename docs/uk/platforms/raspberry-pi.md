---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Створення недорогого персонального ШІ, який працює постійно
summary: OpenClaw на Raspberry Pi (бюджетне самостійне розгортання)
title: Raspberry Pi (платформа)
x-i18n:
    generated_at: "2026-04-27T07:09:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw на Raspberry Pi

## Мета

Запустити постійний, завжди активний Gateway OpenClaw на Raspberry Pi за **~$35-80** одноразових витрат (без щомісячної плати).

Ідеально для:

- персонального ШІ-асистента 24/7
- хаба домашньої автоматизації
- енергоефективного, завжди доступного бота для Telegram/WhatsApp

## Вимоги до обладнання

| Модель Pi        | RAM     | Працює?  | Примітки                           |
| ---------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Найкраще | Найшвидший, рекомендовано        |
| **Pi 4**         | 4GB     | ✅ Добре | Оптимальний варіант для більшості користувачів |
| **Pi 4**         | 2GB     | ✅ OK    | Працює, додайте swap               |
| **Pi 4**         | 1GB     | ⚠️ Тісно | Можливо зі swap, мінімальна конфігурація |
| **Pi 3B+**       | 1GB     | ⚠️ Повільно | Працює, але повільно             |
| **Pi Zero 2 W**  | 512MB   | ❌       | Не рекомендовано                   |

**Мінімальні характеристики:** 1GB RAM, 1 ядро, 500MB диска  
**Рекомендовано:** 2GB+ RAM, 64-бітна ОС, SD-карта 16GB+ (або USB SSD)

## Що вам знадобиться

- Raspberry Pi 4 або 5 (рекомендовано 2GB+)
- карта MicroSD (16GB+) або USB SSD (краща продуктивність)
- блок живлення (рекомендовано офіційний PSU для Pi)
- мережеве підключення (Ethernet або WiFi)
- ~30 хвилин

## 1) Запишіть ОС

Використовуйте **Raspberry Pi OS Lite (64-bit)** — робочий стіл не потрібен для headless-сервера.

1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**
3. Натисніть значок шестерні (⚙️), щоб попередньо налаштувати:
   - Установіть hostname: `gateway-host`
   - Увімкніть SSH
   - Установіть ім’я користувача/пароль
   - Налаштуйте WiFi (якщо не використовуєте Ethernet)
4. Запишіть образ на SD-карту / USB-накопичувач
5. Вставте носій і завантажте Pi

## 2) Підключіться через SSH

```bash
ssh user@gateway-host
# або використовуйте IP-адресу
ssh user@192.168.x.x
```

## 3) Налаштування системи

```bash
# Оновити систему
sudo apt update && sudo apt upgrade -y

# Установити основні пакети
sudo apt install -y git curl build-essential

# Установити часовий пояс (важливо для cron/нагадувань)
sudo timedatectl set-timezone America/Chicago  # Змініть на ваш часовий пояс
```

## 4) Встановіть Node.js 24 (ARM64)

```bash
# Установити Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірити
node --version  # Має показати v24.x.x
npm --version
```

## 5) Додайте swap (важливо для 2GB або менше)

Swap запобігає аваріям через нестачу пам’яті:

```bash
# Створити swap-файл на 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Зробити постійним
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Оптимізувати для малого обсягу RAM (зменшити swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Встановіть OpenClaw

### Варіант A: стандартне встановлення (рекомендовано)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Варіант B: hackable-встановлення (для експериментів)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hackable-встановлення дає вам прямий доступ до логів і коду — це корисно для налагодження ARM-специфічних проблем.

## 7) Запустіть onboarding

```bash
openclaw onboard --install-daemon
```

Дотримуйтесь майстра:

1. **Режим Gateway:** Local
2. **Auth:** рекомендовано API-ключі (OAuth може працювати нестабільно на headless Pi)
3. **Канали:** найпростіше почати з Telegram
4. **Daemon:** Yes (systemd)

## 8) Перевірте встановлення

```bash
# Перевірити статус
openclaw status

# Перевірити сервіс (стандартне встановлення = systemd user unit)
systemctl --user status openclaw-gateway.service

# Переглянути логи
journalctl --user -u openclaw-gateway.service -f
```

## 9) Отримайте доступ до панелі OpenClaw

Замініть `user@gateway-host` на ваше ім’я користувача та hostname або IP-адресу Pi.

На вашому комп’ютері попросіть Pi вивести новий URL панелі:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Команда виводить `Dashboard URL:`. Залежно від того, як налаштовано `gateway.auth.token`,
це може бути звичайне посилання `http://127.0.0.1:18789/` або посилання з
`#token=...`.

В іншому терміналі на вашому комп’ютері створіть SSH-тунель:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Потім відкрийте виведений URL панелі у вашому локальному браузері.

Якщо UI запитує автентифікацію спільним секретом, вставте налаштований токен або пароль
у налаштуваннях Control UI. Для автентифікації за токеном використовуйте `gateway.auth.token` (або
`OPENCLAW_GATEWAY_TOKEN`).

Для постійного віддаленого доступу дивіться [Tailscale](/uk/gateway/tailscale).

---

## Оптимізація продуктивності

### Використовуйте USB SSD (велике покращення)

SD-карти повільні й зношуються. USB SSD значно покращує продуктивність:

```bash
# Перевірити, чи завантаження йде з USB
lsblk
```

Налаштування дивіться в [посібнику з USB boot для Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

### Прискорення запуску CLI (кеш компіляції модулів)

На менш потужних хостах Pi увімкніть кеш компіляції модулів Node, щоб повторні запуски CLI були швидшими:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Примітки:

- `NODE_COMPILE_CACHE` пришвидшує наступні запуски (`status`, `health`, `--help`).
- `/var/tmp` переживає перезавантаження краще, ніж `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових витрат на запуск через самоперезапуск CLI.
- Перший запуск прогріває кеш; найбільшу користь дають наступні запуски.

### Налаштування запуску systemd (необов’язково)

Якщо цей Pi здебільшого запускає OpenClaw, додайте drop-in для сервісу, щоб зменшити
джитер перезапуску й стабілізувати середовище запуску:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Потім застосуйте:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Якщо можливо, зберігайте стан/кеш OpenClaw на сховищі на базі SSD, щоб уникнути
вузьких місць випадкового I/O SD-карти під час холодних стартів.

Якщо це headless Pi, один раз увімкніть lingering, щоб користувацький сервіс переживав
вихід із сесії:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Як політики `Restart=` допомагають автоматичному відновленню:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Зменшення використання пам’яті

```bash
# Вимкнути виділення пам’яті для GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Вимкнути Bluetooth, якщо не потрібен
sudo systemctl disable bluetooth
```

### Моніторинг ресурсів

```bash
# Перевірити пам’ять
free -h

# Перевірити температуру CPU
vcgencmd measure_temp

# Моніторинг у реальному часі
htop
```

---

## Примітки щодо ARM

### Сумісність бінарних файлів

Більшість можливостей OpenClaw працює на ARM64, але деяким зовнішнім бінарним файлам можуть знадобитися збірки для ARM:

| Інструмент         | Статус ARM64 | Примітки                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Працює чудово                       |
| WhatsApp (Baileys) | ✅           | Чистий JS, без проблем              |
| Telegram           | ✅           | Чистий JS, без проблем              |
| gog (Gmail CLI)    | ⚠️           | Перевірте наявність ARM-релізу      |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Якщо якийсь skill не працює, перевірте, чи має його бінарний файл збірку для ARM. Багато інструментів Go/Rust мають, але не всі.

### 32-бітна чи 64-бітна система

**Завжди використовуйте 64-бітну ОС.** Node.js і багато сучасних інструментів цього вимагають. Перевірте так:

```bash
uname -m
# Має показати: aarch64 (64-bit), а не armv7l (32-bit)
```

---

## Рекомендоване налаштування моделі

Оскільки Pi тут виконує роль лише Gateway (моделі працюють у хмарі), використовуйте моделі на базі API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Не намагайтеся запускати локальні LLM на Pi** — навіть невеликі моделі будуть надто повільними. Нехай основну роботу виконують Claude/GPT.

---

## Автозапуск під час завантаження

Onboarding налаштовує це автоматично, але для перевірки:

```bash
# Перевірити, що сервіс увімкнено
systemctl --user is-enabled openclaw-gateway.service

# Увімкнути, якщо ні
systemctl --user enable openclaw-gateway.service

# Запустити під час завантаження
systemctl --user start openclaw-gateway.service
```

---

## Усунення несправностей

### Недостатньо пам’яті (OOM)

```bash
# Перевірити пам’ять
free -h

# Додати більше swap (див. крок 5)
# Або зменшити кількість сервісів, що працюють на Pi
```

### Повільна робота

- Використовуйте USB SSD замість SD-карти
- Вимкніть непотрібні сервіси: `sudo systemctl disable cups bluetooth avahi-daemon`
- Перевірте тротлінг CPU: `vcgencmd get_throttled` (має повертати `0x0`)

### Сервіс не запускається

```bash
# Перевірити логи
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Типове виправлення: перебудова
cd ~/openclaw  # якщо використовуєте hackable-встановлення
npm run build
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарниками

Якщо якийсь skill завершується з помилкою "exec format error":

1. Перевірте, чи має бінарний файл збірку для ARM64
2. Спробуйте зібрати з вихідного коду
3. Або використайте Docker-контейнер із підтримкою ARM

### Зникає WiFi

Для headless Pi на WiFi:

```bash
# Вимкнути керування живленням WiFi
sudo iwconfig wlan0 power off

# Зробити постійним
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Порівняння вартості

| Варіант          | Одноразова вартість | Щомісячна вартість | Примітки                  |
| ---------------- | ------------------- | ------------------ | ------------------------- |
| **Pi 4 (2GB)**   | ~$45                | $0                 | + електроенергія (~$5/рік) |
| **Pi 4 (4GB)**   | ~$55                | $0                 | Рекомендовано             |
| **Pi 5 (4GB)**   | ~$60                | $0                 | Найкраща продуктивність   |
| **Pi 5 (8GB)**   | ~$80                | $0                 | Надлишково, але із запасом на майбутнє |
| DigitalOcean     | $0                  | $6/міс             | $72/рік                   |
| Hetzner          | $0                  | €3.79/міс          | ~$50/рік                  |

**Точка окупності:** Pi окупається приблизно за ~6-12 місяців порівняно з хмарним VPS.

---

## Пов’язане

- [Посібник для Linux](/uk/platforms/linux) — загальне налаштування Linux
- [Посібник для DigitalOcean](/uk/install/digitalocean) — хмарна альтернатива
- [Посібник для Hetzner](/uk/install/hetzner) — налаштування Docker
- [Tailscale](/uk/gateway/tailscale) — віддалений доступ
- [Nodes](/uk/nodes) — підключіть ваш ноутбук/телефон до Gateway на Pi
