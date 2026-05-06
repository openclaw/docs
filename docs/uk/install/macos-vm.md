---
read_when:
    - Ви хочете ізолювати OpenClaw від свого основного середовища macOS
    - Вам потрібна інтеграція iMessage (BlueBubbles) у пісочниці
    - Вам потрібне середовище macOS, яке можна скидати й клонувати
    - Ви хочете порівняти локальні та розміщені варіанти віртуальних машин macOS
summary: Запускайте OpenClaw в ізольованій віртуальній машині macOS (локальній або розміщеній на хостингу), коли вам потрібна ізоляція або iMessage
title: Віртуальні машини macOS
x-i18n:
    generated_at: "2026-05-06T02:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Рекомендовано за замовчуванням (більшість користувачів)

- **Невеликий Linux VPS** для постійно ввімкненого Gateway і низької вартості. Див. [хостинг VPS](/uk/vps).
- **Виділене обладнання** (Mac mini або Linux-комп’ютер), якщо вам потрібен повний контроль і **домашня IP-адреса** для автоматизації браузера. Багато сайтів блокують IP-адреси дата-центрів, тому локальний браузинг часто працює краще.
- **Гібридний варіант:** тримайте Gateway на дешевому VPS і підключайте свій Mac як **Node**, коли потрібна автоматизація браузера/UI. Див. [Nodes](/uk/nodes) і [віддалений Gateway](/uk/gateway/remote).

Використовуйте macOS VM, коли вам конкретно потрібні можливості лише macOS (iMessage/BlueBubbles) або сувора ізоляція від вашого повсякденного Mac.

## Варіанти macOS VM

### Локальна VM на вашому Apple Silicon Mac (Lume)

Запускайте OpenClaw в ізольованій macOS VM на наявному Apple Silicon Mac за допомогою [Lume](https://cua.ai/docs/lume).

Це дає вам:

- Повне середовище macOS в ізоляції (ваш хост залишається чистим)
- Підтримку iMessage через BlueBubbles (неможливо на Linux/Windows)
- Миттєве скидання через клонування VM
- Без додаткового обладнання чи хмарних витрат

### Провайдери hosted Mac (хмара)

Якщо вам потрібна macOS у хмарі, провайдери hosted Mac також підійдуть:

- [MacStadium](https://www.macstadium.com/) (hosted Macs)
- Інші постачальники hosted Mac також працюють; дотримуйтесь їхньої документації щодо VM + SSH

Щойно у вас буде SSH-доступ до macOS VM, перейдіть до кроку 6 нижче.

---

## Швидкий шлях (Lume, досвідчені користувачі)

1. Встановіть Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть Setup Assistant, увімкніть Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Увійдіть через SSH, встановіть OpenClaw, налаштуйте канали
6. Готово

---

## Що вам потрібно (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia або новіша на хості
- ~60 ГБ вільного місця на диску на кожну VM
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

Перевірте:

```bash
lume --version
```

Документація: [Встановлення Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Створіть macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Це завантажує macOS і створює VM. Вікно VNC відкриється автоматично.

<Note>
Завантаження може тривати певний час залежно від вашого з’єднання.
</Note>

---

## 3) Завершіть Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон
2. Пропустіть Apple ID (або увійдіть, якщо хочете пізніше використовувати iMessage)
3. Створіть обліковий запис користувача (запам’ятайте ім’я користувача та пароль)
4. Пропустіть усі необов’язкові функції

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

Дотримуйтесь підказок онбордингу, щоб налаштувати свого постачальника моделей (Anthropic, OpenAI тощо).

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

Потім увійдіть у WhatsApp (скануйте QR):

```bash
openclaw channels login
```

---

## 8) Запускайте VM без графічного дисплея

Зупиніть VM і перезапустіть без дисплея:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM працює у фоновому режимі. Демон OpenClaw підтримує роботу Gateway.

Щоб перевірити статус:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Бонус: інтеграція iMessage

Це головна перевага запуску на macOS. Використовуйте [BlueBubbles](https://bluebubbles.app), щоб додати iMessage до OpenClaw.

Усередині VM:

1. Завантажте BlueBubbles з bluebubbles.app
2. Увійдіть зі своїм Apple ID
3. Увімкніть Web API і задайте пароль
4. Спрямуйте webhooks BlueBubbles на ваш Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Додайте до конфігурації OpenClaw:

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

Перезапустіть Gateway. Тепер ваш агент може надсилати й отримувати iMessages.

Повні деталі налаштування: [канал BlueBubbles](/uk/channels/bluebubbles)

---

## Збережіть золотий образ

Перед подальшим налаштуванням зробіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скинути можна будь-коли:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Робота 24/7

Підтримуйте роботу VM так:

- Тримайте Mac підключеним до живлення
- Вимкніть сон у System Settings → Energy Saver
- За потреби використовуйте `caffeinate`

Для справді постійної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [хостинг VPS](/uk/vps).

---

## Усунення несправностей

| Проблема                 | Рішення                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Не вдається підключитися до VM через SSH | Перевірте, що "Remote Login" увімкнено в System Settings VM                        |
| IP VM не відображається  | Дочекайтеся повного завантаження VM, знову запустіть `lume get openclaw`           |
| Команду Lume не знайдено | Додайте `~/.local/bin` до свого PATH                                                |
| QR WhatsApp не сканується | Переконайтеся, що ви ввійшли у VM (а не на хості) під час запуску `openclaw channels login` |

---

## Пов’язана документація

- [Хостинг VPS](/uk/vps)
- [Nodes](/uk/nodes)
- [Віддалений Gateway](/uk/gateway/remote)
- [Канал BlueBubbles](/uk/channels/bluebubbles)
- [Швидкий старт Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Довідник CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Налаштування VM без участі користувача](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (для досвідчених)
- [Ізоляція Docker](/uk/install/docker) (альтернативний підхід до ізоляції)
