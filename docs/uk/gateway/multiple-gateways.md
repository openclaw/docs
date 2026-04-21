---
read_when:
    - Запуск більш ніж одного Gateway на тій самій машині
    - Для кожного Gateway потрібні ізольовані конфігурація, стан і порти
summary: Запуск кількох Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька Gateway
x-i18n:
    generated_at: "2026-04-21T18:35:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Кілька Gateway (той самий хост)

У більшості конфігурацій слід використовувати один Gateway, оскільки один Gateway може обслуговувати кілька підключень до месенджерів і агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue bot), запускайте окремі Gateway з ізольованими профілями/портами.

## Найкраща рекомендована конфігурація

Для більшості користувачів найпростішою конфігурацією rescue bot є така:

- залиште основного бота на профілі за замовчуванням
- запустіть rescue bot з `--profile rescue`
- використовуйте повністю окремого Telegram-бота для rescue-акаунта
- тримайте rescue bot на іншому базовому порті, наприклад `19789`

Це зберігає rescue bot ізольованим від основного бота, тож він може діагностувати або застосовувати зміни конфігурації, якщо основний бот недоступний. Залишайте щонайменше 20 портів між базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

## Швидкий старт rescue bot

Використовуйте це як типовий шлях, якщо у вас немає вагомої причини робити інакше:

```bash
# Rescue bot (окремий Telegram-бот, окремий профіль, порт 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Якщо ваш основний бот уже запущений, зазвичай цього достатньо.

Під час `openclaw --profile rescue onboard`:

- використовуйте окремий токен Telegram-бота
- залиште профіль `rescue`
- використовуйте базовий порт щонайменше на 20 вищий, ніж у основного бота
- прийміть робочий простір rescue за замовчуванням, якщо ви вже не керуєте власним

Якщо onboarding уже встановив для вас rescue service, фінальний
`gateway install` не потрібен.

## Чому це працює

Rescue bot залишається незалежним, тому що має власні:

- профіль/конфігурацію
- каталог стану
- робочий простір
- базовий порт (і похідні порти)
- токен Telegram-бота

Для більшості конфігурацій використовуйте повністю окремого Telegram-бота для профілю rescue:

- легко обмежити лише операторами
- окремий токен та ідентичність бота
- незалежність від встановлення каналу/застосунку основного бота
- простий шлях відновлення через DM, коли основний бот зламаний

## Що змінює `--profile rescue onboard`

`openclaw --profile rescue onboard` використовує звичайний потік onboarding, але записує все в окремий профіль.

На практиці це означає, що rescue bot отримує власні:

- файл конфігурації
- каталог стану
- робочий простір (за замовчуванням `~/.openclaw/workspace-rescue`)
- ім’я керованого service

В іншому запити такі самі, як і під час звичайного onboarding.

## Загальна конфігурація з кількома Gateway

Наведена вище схема rescue bot є найпростішим варіантом за замовчуванням, але той самий шаблон ізоляції працює для будь-якої пари або групи Gateway на одному хості.

Для більш загальної конфігурації надайте кожному додатковому Gateway власний іменований профіль і власний базовий порт:

```bash
# main (профіль за замовчуванням)
openclaw setup
openclaw gateway --port 18789

# додатковий gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Якщо ви хочете, щоб обидва Gateway використовували іменовані профілі, це теж працює:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Services дотримуються того самого шаблону:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Використовуйте швидкий старт rescue bot, коли вам потрібен резервний операторський канал. Використовуйте загальний шаблон із профілями, коли вам потрібно кілька довготривалих Gateway для різних каналів, орендарів, робочих просторів або операційних ролей.

## Контрольний список ізоляції

Зберігайте ці параметри унікальними для кожного екземпляра Gateway:

- `OPENCLAW_CONFIG_PATH` — файл конфігурації для конкретного екземпляра
- `OPENCLAW_STATE_DIR` — сесії, облікові дані, кеші для конкретного екземпляра
- `agents.defaults.workspace` — кореневий робочий простір для конкретного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- похідні порти browser/canvas/CDP

Якщо вони спільні, ви зіткнетеся з гонками конфігурації та конфліктами портів.

## Відображення портів (похідні)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт browser control service = базовий + 2 (лише loopback)
- canvas host обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти CDP профілю браузера автоматично виділяються з діапазону `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-який із них у config або env, ви повинні зберігати їх унікальними для кожного екземпляра.

## Примітки щодо browser/CDP (поширена пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакові значення для кількох екземплярів.
- Кожному екземпляру потрібні власний порт browser control і власний діапазон CDP (похідний від його порту gateway).
- Якщо вам потрібні явні порти CDP, задайте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
- Віддалений Chrome: використовуйте `browser.profiles.<name>.cdpUrl` (для кожного профілю, для кожного екземпляра).

## Приклад env вручну

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Швидкі перевірки

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Тлумачення:

- `gateway status --deep` допомагає виявити застарілі служби launchd/systemd/schtasks від старіших встановлень.
- Попереджувальний текст `gateway probe`, наприклад `multiple reachable gateways detected`, є очікуваним лише тоді, коли ви навмисно запускаєте більше ніж один ізольований gateway.
