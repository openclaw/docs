---
read_when:
    - Запуск більше ніж одного Gateway на тій самій машині
    - Вам потрібні ізольовані конфігурація, стан і порти для кожного Gateway
summary: Запуск кількох Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька Gateway
x-i18n:
    generated_at: "2026-04-24T18:10:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

У більшості конфігурацій слід використовувати один Gateway, оскільки один Gateway може обслуговувати кілька підключень до месенджерів і агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue bot), запускайте окремі Gateway з ізольованими профілями та портами.

## Найкраща рекомендована конфігурація

Для більшості користувачів найпростіша конфігурація rescue bot така:

- тримайте основного бота на профілі за замовчуванням
- запускайте rescue bot з `--profile rescue`
- використовуйте повністю окремого Telegram-бота для rescue-акаунта
- тримайте rescue bot на іншому базовому порту, наприклад `19789`

Це ізолює rescue bot від основного бота, щоб він міг налагоджувати або застосовувати
зміни конфігурації, якщо основний бот недоступний. Залишайте щонайменше 20 портів між
базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

## Швидкий старт для Rescue Bot

Використовуйте це як стандартний шлях, якщо у вас немає вагомої причини робити
інакше:

```bash
# Rescue bot (окремий Telegram-бот, окремий профіль, порт 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Якщо ваш основний бот уже запущено, зазвичай цього достатньо.

Під час `openclaw --profile rescue onboard`:

- використовуйте окремий токен Telegram-бота
- залишайте профіль `rescue`
- використовуйте базовий порт щонайменше на 20 вищий, ніж у основного бота
- прийміть стандартний rescue workspace, якщо тільки ви вже не керуєте власним

Якщо onboarding уже встановив для вас rescue service, фінальний
`gateway install` не потрібен.

## Чому це працює

Rescue bot залишається незалежним, оскільки має власні:

- профіль/конфігурацію
- каталог стану
- workspace
- базовий порт (і похідні порти)
- токен Telegram-бота

Для більшості конфігурацій використовуйте повністю окремого Telegram-бота для профілю rescue:

- його легко обмежити лише операторами
- окремий токен та ідентичність бота
- незалежність від встановлення каналу/застосунку основного бота
- простий шлях відновлення через приватні повідомлення, коли основний бот зламаний

## Що змінює `--profile rescue onboard`

`openclaw --profile rescue onboard` використовує звичайний процес onboarding, але
записує все в окремий профіль.

На практиці це означає, що rescue bot отримує власні:

- файл конфігурації
- каталог стану
- workspace (типово `~/.openclaw/workspace-rescue`)
- ім’я керованого сервісу

У решті запити такі самі, як і під час звичайного onboarding.

## Загальна конфігурація з кількома Gateway

Описана вище схема rescue bot — це найпростіший стандартний варіант, але той самий шаблон
ізоляції працює для будь-якої пари чи групи Gateway на одному хості.

Для більш загальної конфігурації дайте кожному додатковому Gateway власний іменований профіль і
власний базовий порт:

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

Сервіси дотримуються того самого шаблону:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Використовуйте швидкий старт rescue bot, коли вам потрібний резервний операторський канал. Використовуйте
загальний шаблон профілів, коли вам потрібні кілька довготривалих Gateway для
різних каналів, орендарів, workspace або операційних ролей.

## Контрольний список ізоляції

Зробіть ці параметри унікальними для кожного екземпляра Gateway:

- `OPENCLAW_CONFIG_PATH` — файл конфігурації для кожного екземпляра
- `OPENCLAW_STATE_DIR` — сесії, облікові дані, кеші для кожного екземпляра
- `agents.defaults.workspace` — кореневий workspace для кожного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- похідні порти browser/canvas/CDP

Якщо вони спільні, ви зіткнетеся з гонками конфігурації та конфліктами портів.

## Відображення портів (похідне)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт служби керування browser = базовий + 2 (лише для loopback)
- canvas host обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти CDP профілю Browser автоматично виділяються з діапазону `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-що з цього в конфігурації або env, ви повинні зберігати їх унікальними для кожного екземпляра.

## Примітки щодо Browser/CDP (поширена пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакових значеннях у кількох екземплярах.
- Кожному екземпляру потрібен власний порт керування browser і власний діапазон CDP (похідний від його порту gateway).
- Якщо вам потрібні явні порти CDP, задавайте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
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

- `gateway status --deep` допомагає виявити застарілі сервіси launchd/systemd/schtasks зі старіших встановлень.
- Попередження `gateway probe`, наприклад `multiple reachable gateways detected`, є очікуваним лише тоді, коли ви навмисно запускаєте більше ніж один ізольований gateway.

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Блокування Gateway](/uk/gateway/gateway-lock)
- [Конфігурація](/uk/gateway/configuration)
