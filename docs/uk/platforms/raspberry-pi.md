---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Створення недорогого персонального AI, який завжди працює
summary: OpenClaw на Raspberry Pi (бюджетне self-hosted налаштування)
title: Raspberry Pi (платформа)
x-i18n:
    generated_at: "2026-04-23T21:01:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 976de01203f982511f8f4b66331e9263d7848cbe656b0cdb5932eb890c72a178
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw на Raspberry Pi

## Мета

Запустити постійний, завжди ввімкнений Gateway OpenClaw на Raspberry Pi за **~$35-80** одноразових витрат (без щомісячних платежів).

Ідеально для:

- персонального AI-асистента 24/7
- хаба домашньої автоматизації
- енергоефективного бота Telegram/WhatsApp, який завжди доступний

## Вимоги до обладнання

| Модель Pi        | RAM     | Працює?   | Примітки                           |
| ---------------- | ------- | --------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Найкраще | Найшвидший, рекомендовано         |
| **Pi 4**         | 4GB     | ✅ Добре   | Оптимальний варіант для більшості користувачів |
| **Pi 4**         | 2GB     | ✅ Нормально | Працює, додайте swap             |
| **Pi 4**         | 1GB     | ⚠️ Тісно   | Можливо зі swap, мінімальна конфігурація |
| **Pi 3B+**       | 1GB     | ⚠️ Повільно | Працює, але повільно              |
| **Pi Zero 2 W**  | 512MB   | ❌         | Не рекомендовано                   |

**Мінімальні характеристики:** 1GB RAM, 1 ядро, 500MB диска  
**Рекомендовано:** 2GB+ RAM, 64-bit ОС, SD-карта 16GB+ (або USB SSD)

## Що вам потрібно

- Raspberry Pi 4 або 5 (рекомендовано 2GB+)
- MicroSD-карта (16GB+) або USB SSD (краща продуктивність)
- Блок живлення (рекомендовано офіційний PSU для Pi)
- Підключення до мережі (Ethernet або WiFi)
- ~30 хвилин

## 1) Запишіть ОС

Використовуйте **Raspberry Pi OS Lite (64-bit)** — робочий стіл для headless-сервера не потрібен.

1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**
3. Натисніть іконку шестерні (⚙️), щоб попередньо налаштувати:
   - Установіть hostname: `gateway-host`
   - Увімкніть SSH
   - Установіть ім’я користувача/пароль
   - Налаштуйте WiFi (якщо не використовуєте Ethernet)
4. Запишіть образ на SD-карту / USB-накопичувач
5. Вставте носій і завантажте Pi

## 2) Підключіться через SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Налаштування системи

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Установіть Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Додайте swap (важливо для 2GB або менше)

Swap запобігає аваріям через нестачу пам’яті:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Установіть OpenClaw

### Варіант A: Стандартне встановлення (рекомендовано)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Варіант B: Встановлення для зручного експериментування (For tinkering)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Встановлення для експериментування дає прямий доступ до логів і коду — це корисно для налагодження проблем, специфічних для ARM.

## 7) Запустіть онбординг

```bash
openclaw onboard --install-daemon
```

Дотримуйтеся майстра:

1. **Режим Gateway:** Local
2. **Auth:** рекомендовано API-ключі (OAuth може бути примхливим на headless Pi)
3. **Канали:** найпростіше почати з Telegram
4. **Daemon:** Yes (systemd)

## 8) Перевірте встановлення

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Отримайте доступ до панелі OpenClaw

Замініть `user@gateway-host` на ваше ім’я користувача Pi і hostname або IP-адресу.

На вашому комп’ютері попросіть Pi вивести новий URL панелі:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Команда виводить `Dashboard URL:`. Залежно від того, як налаштовано `gateway.auth.token`,
це може бути звичайне посилання `http://127.0.0.1:18789/` або таке,
що містить `#token=...`.

В іншому терміналі на вашому комп’ютері створіть SSH-тунель:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Потім відкрийте надрукований Dashboard URL у локальному браузері.

Якщо UI просить shared-secret auth, вставте налаштований токен або пароль
у налаштуваннях Control UI. Для token auth використовуйте `gateway.auth.token` (або
`OPENCLAW_GATEWAY_TOKEN`).

Для постійного віддаленого доступу див. [Tailscale](/uk/gateway/tailscale).

---

## Оптимізація продуктивності

### Використовуйте USB SSD (велике покращення)

SD-карти повільні та зношуються. USB SSD значно покращує продуктивність:

```bash
# Check if booting from USB
lsblk
```

Налаштування див. у [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

### Прискорте запуск CLI (module compile cache)

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

- `NODE_COMPILE_CACHE` прискорює наступні запуски (`status`, `health`, `--help`).
- `/var/tmp` переживає перезавантаження краще, ніж `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових витрат на запуск через самоперезапуск CLI.
- Перший запуск прогріває кеш; наступні отримують найбільшу користь.

### Налаштування запуску systemd (необов’язково)

Якщо цей Pi в основному використовується для OpenClaw, додайте drop-in для служби, щоб зменшити
jitter під час перезапуску та зберегти стабільне середовище запуску:

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

За можливості зберігайте стан/кеш OpenClaw на SSD-backed сховищі, щоб уникнути
вузьких місць випадкового I/O SD-карти під час холодних запусків.

Якщо це headless Pi, один раз увімкніть lingering, щоб користувацька служба переживала
вихід із системи:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Зменште використання пам’яті

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Моніторте ресурси

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Примітки, специфічні для ARM

### Сумісність бінарних файлів

Більшість можливостей OpenClaw працює на ARM64, але деяким зовнішнім бінарним файлам можуть знадобитися ARM-збірки:

| Tool               | Статус ARM64 | Примітки                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Працює чудово                       |
| WhatsApp (Baileys) | ✅           | Чистий JS, без проблем              |
| Telegram           | ✅           | Чистий JS, без проблем              |
| gog (Gmail CLI)    | ⚠️           | Перевірте наявність ARM-релізу      |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Якщо Skill не працює, перевірте, чи є в його бінарного файла ARM-збірка. У багатьох Go/Rust tools вона є; у деяких — ні.

### 32-bit проти 64-bit

**Завжди використовуйте 64-bit ОС.** Node.js і багато сучасних tools цього потребують. Перевірка:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Рекомендоване налаштування моделі

Оскільки Pi тут лише виконує роль Gateway (моделі працюють у хмарі), використовуйте моделі на основі API:

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

**Не намагайтеся запускати локальні LLM на Pi** — навіть малі моделі будуть надто повільними. Нехай Claude/GPT виконують важку роботу.

---

## Автозапуск при завантаженні

Онбординг це налаштовує, але для перевірки:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Усунення проблем

### Нестача пам’яті (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Повільна робота

- Використовуйте USB SSD замість SD-карти
- Вимкніть невикористовувані служби: `sudo systemctl disable cups bluetooth avahi-daemon`
- Перевірте тротлінг CPU: `vcgencmd get_throttled` (має повертати `0x0`)

### Служба не запускається

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарними файлами

Якщо Skill завершується з "exec format error":

1. Перевірте, чи є ARM64-збірка бінарного файла
2. Спробуйте зібрати з source
3. Або використайте контейнер Docker з підтримкою ARM

### Відпадає WiFi

Для headless Pi, що працює через WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Порівняння вартості

| Налаштування   | Одноразова вартість | Щомісячна вартість | Примітки                    |
| -------------- | ------------------- | ------------------ | --------------------------- |
| **Pi 4 (2GB)** | ~$45                | $0                 | + електроенергія (~$5/рік)  |
| **Pi 4 (4GB)** | ~$55                | $0                 | Рекомендовано               |
| **Pi 5 (4GB)** | ~$60                | $0                 | Найкраща продуктивність     |
| **Pi 5 (8GB)** | ~$80                | $0                 | Надлишково, але із запасом на майбутнє |
| DigitalOcean   | $0                  | $6/міс             | $72/рік                     |
| Hetzner        | $0                  | €3.79/міс          | ~$50/рік                    |

**Точка беззбитковості:** Pi окупає себе приблизно за 6–12 місяців порівняно з хмарним VPS.

---

## Див. також

- [Linux guide](/uk/platforms/linux) — загальне налаштування Linux
- [DigitalOcean guide](/uk/install/digitalocean) — хмарна альтернатива
- [Hetzner guide](/uk/install/hetzner) — налаштування Docker
- [Tailscale](/uk/gateway/tailscale) — віддалений доступ
- [Nodes](/uk/nodes) — спарте ваш ноутбук/телефон із gateway на Pi
