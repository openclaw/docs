---
read_when:
    - Ви хочете ізолювати OpenClaw від основного середовища macOS
    - Вам потрібна інтеграція з iMessage у пісочниці
    - Вам потрібне середовище macOS, яке можна клонувати та скидати до початкового стану
    - Ви хочете порівняти локальні та хостингові варіанти віртуальних машин macOS
summary: Запускайте OpenClaw в ізольованій віртуальній машині macOS (локальній або розміщеній у хмарі), коли вам потрібна ізоляція або iMessage
title: Віртуальні машини macOS
x-i18n:
    generated_at: "2026-07-12T13:26:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Рекомендований варіант за замовчуванням (для більшості користувачів)

- **Невеликий Linux VPS** для постійно ввімкненого Gateway і низьких витрат. Див. [Хостинг на VPS](/uk/vps).
- **Виділене обладнання** (Mac mini або комп’ютер із Linux), якщо вам потрібен повний контроль і **домашня IP-адреса** для автоматизації браузера. Багато сайтів блокують IP-адреси центрів обробки даних, тому локальний перегляд часто працює краще.
- **Гібридний варіант**: розмістіть Gateway на дешевому VPS і підключайте свій Mac як **вузол**, коли потрібна автоматизація браузера або інтерфейсу. Див. [Вузли](/uk/nodes) і [Віддалений Gateway](/uk/gateway/remote).

Використовуйте віртуальну машину macOS, лише якщо вам потрібні можливості, доступні виключно в macOS, як-от iMessage, або сувора ізоляція від вашого основного Mac.

## Варіанти віртуальних машин macOS

### Локальна віртуальна машина на Mac з Apple Silicon (Lume)

Запустіть OpenClaw в ізольованій віртуальній машині macOS на наявному Mac з Apple Silicon за допомогою [Lume](https://cua.ai/docs/lume). Це забезпечує:

- Повноцінне ізольоване середовище macOS (основна система залишається чистою)
- Підтримку iMessage через `imsg`; стандартний локальний варіант неможливий у Linux/Windows
- Миттєве скидання стану шляхом клонування віртуальних машин
- Відсутність витрат на додаткове обладнання або хмарні ресурси

### Хмарні постачальники Mac

Якщо вам потрібна macOS у хмарі, можна також скористатися постачальниками хостингу Mac:

- [MacStadium](https://www.macstadium.com/) (хостинг комп’ютерів Mac)
- Інші постачальники хостингу Mac також підійдуть; дотримуйтеся їхньої документації щодо віртуальних машин і SSH

Отримавши SSH-доступ до віртуальної машини macOS, перейдіть нижче до розділу [Установлення OpenClaw](#6-install-openclaw).

## Швидкий шлях (Lume, для досвідчених користувачів)

1. Установіть Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть роботу Setup Assistant і ввімкніть Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Підключіться через SSH, установіть OpenClaw і налаштуйте канали.
6. Готово.

## Що потрібно для Lume

- Mac з Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia або новіша версія на основній системі
- Приблизно 60 ГБ вільного місця на диску для кожної віртуальної машини
- Приблизно 20 хвилин

## 1) Установіть Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Якщо `~/.local/bin` відсутній у вашому PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Перевірте:

```bash
lume --version
```

Документація: [Установлення Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Створіть віртуальну машину macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Ця команда завантажить macOS і створить віртуальну машину. Вікно VNC відкриється автоматично.

<Note>
Завантаження може тривати певний час залежно від швидкості вашого з’єднання.
</Note>

## 3) Завершіть роботу Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон.
2. Пропустіть Apple ID (або ввійдіть, якщо згодом плануєте використовувати iMessage).
3. Створіть обліковий запис користувача (запам’ятайте ім’я користувача й пароль).
4. Пропустіть усі необов’язкові функції.

Після завершення налаштування:

1. Увімкніть SSH: System Settings -> General -> Sharing, потім увімкніть "Remote Login".
2. Для використання віртуальної машини без графічного інтерфейсу ввімкніть автоматичний вхід: System Settings -> Users & Groups, виберіть "Automatically log in as:" і користувача віртуальної машини.

## 4) Дізнайтеся IP-адресу віртуальної машини

```bash
lume get openclaw
```

Знайдіть IP-адресу (зазвичай `192.168.64.x`).

## 5) Підключіться до віртуальної машини через SSH

```bash
ssh youruser@192.168.64.X
```

Замініть `youruser` на ім’я створеного облікового запису, а IP-адресу — на IP-адресу вашої віртуальної машини.

## 6) Установіть OpenClaw

Усередині віртуальної машини:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Дотримуйтеся підказок початкового налаштування, щоб налаштувати постачальника моделі (Anthropic, OpenAI тощо).

## 7) Налаштуйте канали

Відредагуйте файл конфігурації:

```bash
nano ~/.openclaw/openclaw.json
```

Додайте свої канали:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Потім увійдіть у WhatsApp (відскануйте QR-код):

```bash
openclaw channels login
```

## 8) Запустіть віртуальну машину без графічного інтерфейсу

Зупиніть віртуальну машину й перезапустіть її без дисплея:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Віртуальна машина працюватиме у фоновому режимі, а демон OpenClaw підтримуватиме роботу Gateway. Щоб перевірити стан:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Додатково: інтеграція з iMessage

Це головна перевага запуску в macOS. Використовуйте [iMessage](/uk/channels/imessage) з `imsg`, щоб додати Messages до OpenClaw.

Усередині віртуальної машини:

1. Увійдіть у Messages.
2. Установіть `imsg`.
3. Надайте дозволи Full Disk Access і Automation процесу, у якому виконується OpenClaw/`imsg`.
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

Перезапустіть Gateway. Тепер ваш агент може надсилати й отримувати повідомлення iMessage. Докладні інструкції з налаштування: [Канал iMessage](/uk/channels/imessage).

## Збережіть еталонний образ

Перш ніж продовжити налаштування, створіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скинути стан можна будь-коли:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Цілодобова робота

Щоб віртуальна машина працювала постійно:

- Тримайте Mac підключеним до живлення
- Вимкніть режим сну в System Settings -> Energy Saver
- За потреби використовуйте `caffeinate`

Для справді безперервної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [Хостинг на VPS](/uk/vps).

## Усунення несправностей

| Проблема                                    | Рішення                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Не вдається підключитися до VM через SSH    | Переконайтеся, що "Remote Login" увімкнено в System Settings віртуальної машини                                 |
| IP-адреса VM не відображається              | Зачекайте, доки VM повністю завантажиться, і знову виконайте `lume get openclaw`                                 |
| Команду Lume не знайдено                    | Додайте `~/.local/bin` до PATH                                                                                  |
| QR-код WhatsApp не сканується               | Під час виконання `openclaw channels login` переконайтеся, що ви ввійшли у VM, а не в основну систему           |

## Пов’язана документація

- [Хостинг на VPS](/uk/vps)
- [Вузли](/uk/nodes)
- [Віддалений Gateway](/uk/gateway/remote)
- [Канал iMessage](/uk/channels/imessage)
- [Швидкий початок роботи з Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Довідник CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Автоматичне налаштування VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (для досвідчених користувачів)
- [Ізоляція за допомогою Docker](/uk/install/docker) (альтернативний підхід до ізоляції)
