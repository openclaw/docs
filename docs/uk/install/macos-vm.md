---
read_when:
    - Ви хочете ізолювати OpenClaw від вашого основного середовища macOS
    - Ви хочете інтеграцію iMessage (BlueBubbles) в ізольованому середовищі
    - Ви хочете macOS-середовище, яке можна скидати й клонувати
    - Ви хочете порівняти локальні та хостингові варіанти macOS VM
summary: Запуск OpenClaw в ізольованій macOS VM (локально або в хостинговому середовищі), коли вам потрібна ізоляція або iMessage
title: macOS VM
x-i18n:
    generated_at: "2026-04-27T06:26:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw на macOS VM (ізоляція)

## Рекомендований варіант за замовчуванням (для більшості користувачів)

- **Невеликий Linux VPS** для постійно увімкненого Gateway і низької вартості. Див. [VPS hosting](/uk/vps).
- **Виділене обладнання** (Mac mini або Linux-машина), якщо вам потрібен повний контроль і **резидентський IP** для автоматизації браузера. Багато сайтів блокують IP дата-центрів, тому локальний браузинг часто працює краще.
- **Гібридний варіант:** тримайте Gateway на дешевому VPS, а свій Mac підключайте як **Node**, коли вам потрібна автоматизація браузера/UI. Див. [Nodes](/uk/nodes) і [Gateway remote](/uk/gateway/remote).

Використовуйте macOS VM, коли вам спеціально потрібні можливості лише macOS (iMessage/BlueBubbles) або коли ви хочете жорстку ізоляцію від свого щоденного Mac.

## Варіанти macOS VM

### Локальна VM на вашому Apple Silicon Mac (Lume)

Запускайте OpenClaw в ізольованій macOS VM на вашому наявному Apple Silicon Mac за допомогою [Lume](https://cua.ai/docs/lume).

Це дає вам:

- Повне середовище macOS в ізоляції (ваш хост залишається чистим)
- Підтримку iMessage через BlueBubbles (неможливо на Linux/Windows)
- Миттєве скидання через клонування VM
- Без додаткового обладнання чи витрат на хмару

### Хостингові Mac-провайдери (хмара)

Якщо вам потрібна macOS у хмарі, хостингові Mac-провайдери теж підійдуть:

- [MacStadium](https://www.macstadium.com/) (хостингові Mac)
- Підійдуть і інші хостингові постачальники Mac; дотримуйтесь їхньої документації щодо VM + SSH

Щойно у вас буде SSH-доступ до macOS VM, переходьте до кроку 6 нижче.

---

## Швидкий шлях (Lume, для досвідчених користувачів)

1. Встановіть Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть Setup Assistant, увімкніть Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Підключіться через SSH, встановіть OpenClaw, налаштуйте канали
6. Готово

---

## Що вам потрібно (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia або новіша на хості
- ~60 GB вільного місця на диску для кожної VM
- ~20 хвилин

---

## 1) Встановіть Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Якщо `~/.local/bin` немає у вашому PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Перевірка:

```bash
lume --version
```

Документація: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Створіть macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Це завантажить macOS і створить VM. Вікно VNC відкриється автоматично.

<Note>
Завантаження може тривати певний час залежно від вашого з’єднання.
</Note>

---

## 3) Завершіть Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон
2. Пропустіть Apple ID (або увійдіть, якщо пізніше хочете iMessage)
3. Створіть обліковий запис користувача (запам’ятайте ім’я користувача й пароль)
4. Пропустіть усі необов’язкові можливості

Після завершення налаштування увімкніть SSH:

1. Відкрийте System Settings → General → Sharing
2. Увімкніть "Remote Login"

---

## 4) Отримайте IP-адресу VM

```bash
lume get openclaw
```

Знайдіть IP-адресу (зазвичай `192.168.64.x`).

---

## 5) Підключіться до VM через SSH

```bash
ssh youruser@192.168.64.X
```

Замініть `youruser` на створений вами обліковий запис, а IP — на IP вашої VM.

---

## 6) Встановіть OpenClaw

Усередині VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Дотримуйтесь підказок onboarding, щоб налаштувати свого провайдера моделі (Anthropic, OpenAI тощо).

---

## 7) Налаштуйте канали

Відредагуйте файл конфігурації:

```bash
nano ~/.openclaw/openclaw.json
```

Додайте свої канали:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Потім увійдіть у WhatsApp (відскануйте QR):

```bash
openclaw channels login
```

---

## 8) Запустіть VM без дисплея

Зупиніть VM і перезапустіть без дисплея:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM працюватиме у фоновому режимі. Демон OpenClaw підтримуватиме роботу gateway.

Щоб перевірити стан:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Бонус: інтеграція iMessage

Це ключова перевага запуску на macOS. Використовуйте [BlueBubbles](https://bluebubbles.app), щоб додати iMessage до OpenClaw.

Усередині VM:

1. Завантажте BlueBubbles з bluebubbles.app
2. Увійдіть за допомогою свого Apple ID
3. Увімкніть Web API і задайте пароль
4. Спрямуйте Webhook-и BlueBubbles на ваш gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Додайте до своєї конфігурації OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Перезапустіть gateway. Тепер ваш агент зможе надсилати й отримувати iMessage.

Повні деталі налаштування: [BlueBubbles channel](/uk/channels/bluebubbles)

---

## Збережіть golden image

Перш ніж налаштовувати далі, створіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скидання в будь-який момент:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Робота 24/7

Підтримуйте VM у робочому стані так:

- Тримайте Mac підключеним до живлення
- Вимкніть sleep у System Settings → Energy Saver
- За потреби використовуйте `caffeinate`

Для справді постійної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [VPS hosting](/uk/vps).

---

## Усунення несправностей

| Проблема                 | Рішення                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Не вдається підключитися до VM через SSH | Переконайтеся, що "Remote Login" увімкнено в System Settings VM                |
| IP VM не відображається  | Дочекайтеся повного завантаження VM, потім знову виконайте `lume get openclaw`            |
| Команду Lume не знайдено | Додайте `~/.local/bin` до свого PATH                                                        |
| QR WhatsApp не сканується | Переконайтеся, що ви увійшли саме у VM (а не в хост), коли запускаєте `openclaw channels login` |

---

## Пов’язана документація

- [VPS hosting](/uk/vps)
- [Nodes](/uk/nodes)
- [Gateway remote](/uk/gateway/remote)
- [BlueBubbles channel](/uk/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (додатково)
- [Docker Sandboxing](/uk/install/docker) (альтернативний підхід до ізоляції)
