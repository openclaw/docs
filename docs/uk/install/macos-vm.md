---
read_when:
    - Ви хочете, щоб OpenClaw був ізольований від вашого основного середовища macOS
    - Вам потрібна інтеграція з iMessage у пісочниці
    - Вам потрібне середовище macOS із можливістю скидання, яке можна клонувати
    - Ви хочете порівняти локальні та хостингові варіанти віртуальних машин macOS
summary: Запускайте OpenClaw в ізольованій віртуальній машині macOS (локальній або хостованій), коли вам потрібна ізоляція або iMessage
title: Віртуальні машини macOS
x-i18n:
    generated_at: "2026-05-11T20:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Рекомендовано за замовчуванням (для більшості користувачів)

- **Невеликий Linux VPS** для постійно ввімкненого Gateway і низької вартості. Див. [VPS-хостинг](/uk/vps).
- **Виділене обладнання** (Mac mini або Linux-машина), якщо вам потрібен повний контроль і **резидентна IP-адреса** для браузерної автоматизації. Багато сайтів блокують IP-адреси дата-центрів, тому локальний браузинг часто працює краще.
- **Гібрид:** тримайте Gateway на дешевому VPS і підключайте свій Mac як **node**, коли потрібна браузерна/UI-автоматизація. Див. [Nodes](/uk/nodes) і [віддалений Gateway](/uk/gateway/remote).

Використовуйте macOS VM, коли вам спеціально потрібні можливості лише для macOS, як-от iMessage, або потрібна сувора ізоляція від вашого щоденного Mac.

## Варіанти macOS VM

### Локальна VM на вашому Apple Silicon Mac (Lume)

Запустіть OpenClaw в ізольованій macOS VM на вашому наявному Apple Silicon Mac за допомогою [Lume](https://cua.ai/docs/lume).

Це дає вам:

- Повне середовище macOS в ізоляції (ваш хост залишається чистим)
- Підтримку iMessage через `imsg` (типовий локальний шлях неможливий у Linux/Windows)
- Миттєве скидання через клонування VM
- Без додаткового обладнання чи хмарних витрат

### Хостингові Mac-провайдери (хмара)

Якщо вам потрібна macOS у хмарі, хостингові Mac-провайдери також підходять:

- [MacStadium](https://www.macstadium.com/) (хостингові Mac)
- Інші хостингові Mac-постачальники також працюють; дотримуйтеся їхньої документації щодо VM + SSH

Коли матимете SSH-доступ до macOS VM, перейдіть до кроку 6 нижче.

---

## Швидкий шлях (Lume, досвідчені користувачі)

1. Встановіть Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть Setup Assistant, увімкніть Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Увійдіть через SSH, встановіть OpenClaw, налаштуйте канали
6. Готово

---

## Що потрібно (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia або новіша на хості
- ~60 ГБ вільного місця на диску для кожної VM
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

Це завантажить macOS і створить VM. Вікно VNC відкриється автоматично.

<Note>
Завантаження може тривати певний час залежно від вашого з’єднання.
</Note>

---

## 3) Завершіть Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон
2. Пропустіть Apple ID (або ввійдіть, якщо хочете використовувати iMessage пізніше)
3. Створіть обліковий запис користувача (запам’ятайте ім’я користувача й пароль)
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

Замініть `youruser` на обліковий запис, який ви створили, а IP — на IP-адресу вашої VM.

---

## 6) Встановіть OpenClaw

Усередині VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Дотримуйтеся підказок онбордингу, щоб налаштувати свого модельного провайдера (Anthropic, OpenAI тощо).

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

Це головна перевага запуску на macOS. Використовуйте [iMessage](/uk/channels/imessage) з `imsg`, щоб додати Messages до OpenClaw.

Усередині VM:

1. Увійдіть у Messages.
2. Встановіть `imsg`.
3. Надайте Full Disk Access і дозвіл Automation для процесу, який запускає OpenClaw/`imsg`.
4. Перевірте підтримку RPC за допомогою `imsg rpc --help`.

Додайте до конфігурації OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Перезапустіть gateway. Тепер ваш агент може надсилати й отримувати iMessages.

Повні деталі налаштування: [канал iMessage](/uk/channels/imessage)

---

## Збережіть еталонний образ

Перш ніж налаштовувати далі, зробіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скидання будь-коли:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Робота 24/7

Підтримуйте VM увімкненою так:

- Тримайте Mac підключеним до живлення
- Вимкніть сон у System Settings → Energy Saver
- За потреби використовуйте `caffeinate`

Для справді постійної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [VPS-хостинг](/uk/vps).

---

## Усунення несправностей

| Проблема                    | Рішення                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Не вдається підключитися до VM через SSH | Перевірте, що "Remote Login" увімкнено в System Settings VM                                      |
| IP VM не відображається     | Зачекайте, доки VM повністю завантажиться, і знову виконайте `lume get openclaw`                 |
| Команду Lume не знайдено    | Додайте `~/.local/bin` до вашого PATH                                                            |
| WhatsApp QR не сканується   | Переконайтеся, що ви увійшли у VM (а не на хост), коли виконуєте `openclaw channels login`       |

---

## Пов’язана документація

- [VPS-хостинг](/uk/vps)
- [Nodes](/uk/nodes)
- [Віддалений Gateway](/uk/gateway/remote)
- [Канал iMessage](/uk/channels/imessage)
- [Швидкий старт Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Довідник Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [Налаштування VM без нагляду](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (розширено)
- [Пісочниця Docker](/uk/install/docker) (альтернативний підхід до ізоляції)
