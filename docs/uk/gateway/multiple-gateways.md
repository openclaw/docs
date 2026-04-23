---
read_when:
    - Запуск більше ніж одного Gateway на одній машині
    - Вам потрібні ізольовані config/state/ports для кожного Gateway
summary: Запуск кількох Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька Gateway-ів
x-i18n:
    generated_at: "2026-04-23T20:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 372f2ba155d2bf70c3d4ded5952e1d41124c9123c888525845f7d85bd6ebfba9
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Кілька Gateway-ів (один хост)

У більшості конфігурацій варто використовувати один Gateway, тому що один Gateway може обробляти кілька з’єднань для повідомлень і агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue-бот), запускайте окремі Gateway-и з ізольованими профілями/портами.

## Найкраща рекомендована конфігурація

Для більшості користувачів найпростіша конфігурація rescue-бота така:

- тримати основного бота на типовому профілі
- запускати rescue-бота на `--profile rescue`
- використовувати повністю окремого Telegram-бота для rescue-акаунта
- тримати rescue-бота на іншому базовому порту, наприклад `19789`

Це ізолює rescue-бота від основного бота, щоб він міг налагоджувати або застосовувати
зміни конфігурації, якщо основний бот не працює. Залишайте щонайменше 20 портів між
базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

## Швидкий старт для rescue-бота

Використовуйте це як типовий шлях, якщо у вас немає вагомої причини робити щось
інше:

```bash
# Rescue-бот (окремий Telegram-бот, окремий профіль, порт 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Якщо ваш основний бот уже запущений, цього зазвичай достатньо.

Під час `openclaw --profile rescue onboard`:

- використовуйте окремий токен Telegram-бота
- зберігайте профіль `rescue`
- використовуйте базовий порт щонайменше на 20 вищий, ніж у основного бота
- приймайте типовий rescue-workspace, якщо тільки ви вже не керуєте власним

Якщо onboarding уже встановив для вас rescue-сервіс, фінальний
`gateway install` не потрібен.

## Чому це працює

Rescue-бот залишається незалежним, тому що має власні:

- profile/config
- state directory
- workspace
- base port (плюс похідні порти)
- токен Telegram-бота

Для більшості конфігурацій використовуйте повністю окремого Telegram-бота для профілю rescue:

- його легко зробити доступним лише оператору
- окремий токен бота й ідентичність
- незалежність від встановлення каналу/застосунку основного бота
- простий шлях відновлення через DM, коли основний бот зламаний

## Що змінює `--profile rescue onboard`

`openclaw --profile rescue onboard` використовує звичайний потік onboarding, але
записує все в окремий профіль.

На практиці це означає, що rescue-бот отримує власні:

- файл config
- state directory
- workspace (типово `~/.openclaw/workspace-rescue`)
- ім’я керованого сервісу

В іншому підказки залишаються такими самими, як і для звичайного onboarding.

## Загальна конфігурація з кількома Gateway

Наведена вище схема rescue-бота — найпростіший типовий варіант, але той самий шаблон
ізоляції працює для будь-якої пари або групи Gateway-ів на одному хості.

Для загальнішої конфігурації надайте кожному додатковому Gateway власний іменований профіль і
власний базовий порт:

```bash
# main (типовий профіль)
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

Сервіси працюють за тим самим шаблоном:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Використовуйте швидкий старт rescue-бота, коли вам потрібен резервний операторський канал. Використовуйте
загальний шаблон профілів, коли вам потрібні кілька довготривалих Gateway-ів для
різних каналів, орендарів, workspace або операційних ролей.

## Контрольний список ізоляції

Зберігайте унікальними для кожного екземпляра Gateway:

- `OPENCLAW_CONFIG_PATH` — файл config для кожного екземпляра
- `OPENCLAW_STATE_DIR` — sessions, creds, кеші для кожного екземпляра
- `agents.defaults.workspace` — корінь workspace для кожного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- похідні порти browser/canvas/CDP

Якщо вони спільні, ви зіткнетеся з гонками config і конфліктами портів.

## Відображення портів (похідні)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт сервісу керування браузером = base + 2 (лише loopback)
- canvas host обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти Browser profile CDP автоматично виділяються з `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-який із них у config або env, ви маєте зберігати їх унікальними для кожного екземпляра.

## Примітки про Browser/CDP (поширена пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакові значення для кількох екземплярів.
- Кожному екземпляру потрібен власний порт керування браузером і власний діапазон CDP (похідний від його порту gateway).
- Якщо вам потрібні явні порти CDP, задавайте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
- Віддалений Chrome: використовуйте `browser.profiles.<name>.cdpUrl` (для кожного профілю, для кожного екземпляра).

## Приклад ручного env

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

- `gateway status --deep` допомагає виявити застарілі сервіси launchd/systemd/schtasks від старіших встановлень.
- Попереджувальний текст `gateway probe`, наприклад `multiple reachable gateways detected`, є очікуваним лише тоді, коли ви навмисно запускаєте більше ніж один ізольований gateway.
