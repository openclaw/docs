---
read_when:
    - Розміщення PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
    - Вибір між PeekabooBridge, Codex Computer Use і cua-driver MCP
summary: Інтеграція PeekabooBridge для автоматизації інтерфейсу користувача macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-07-16T18:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації інтерфейсу з урахуванням дозволів (`PeekabooBridgeHostCoordinator`, на основі пакета Swift `steipete/Peekaboo`). Завдяки цьому CLI `peekaboo` може керувати автоматизацією інтерфейсу, повторно використовуючи дозволи TCC застосунку macOS.

## Що це таке (і чим воно не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: CLI `peekaboo` (окремого інтерфейсу `openclaw ui ...` немає).
- **Інтерфейс**: візуальні накладки залишаються в Peekaboo.app; OpenClaw є тонким хостом-брокером.

## Зв’язок з іншими способами керування робочим столом

OpenClaw має чотири способи керування робочим столом, які навмисно залишаються окремими:

- **Хост PeekabooBridge**: OpenClaw.app розміщує локальний сокет PeekabooBridge. CLI `peekaboo` є клієнтом і використовує дозволи macOS застосунку OpenClaw.app для створення знімків екрана, клацань, роботи з меню й діалоговими вікнами, дій із Dock та керування вікнами.
- **Кероване агентом використання комп’ютера (`computer.act`)**: вбудований інструмент `computer` агента Gateway створює знімки екрана через `screen.snapshot` і керує вказівником та клавіатурою за допомогою небезпечної команди Node `computer.act`. Node macOS виконує `computer.act` у межах процесу за допомогою вбудованих сервісів автоматизації Peekaboo, які надає цей міст, і вузькоспеціалізованих примітивів CoreGraphics, не використовуючи сокет PeekabooBridge або CLI `peekaboo`. Див. [Використання комп’ютера](/uk/nodes/computer-use).
- **Codex Computer Use**: вбудований Plugin `codex` перевіряє та може встановити MCP Plugin `computer-use` від Codex (`extensions/codex/src/app-server/computer-use.ts`), після чого Codex сам керує викликами нативних інструментів керування робочим столом під час ходів у режимі Codex. OpenClaw не проксіює ці дії через PeekabooBridge.
- **Безпосередній MCP `cua-driver`**: OpenClaw може зареєструвати сервер `cua-driver mcp` від TryCua як звичайний сервер MCP, надаючи агентам власні схеми драйвера CUA та робочий процес із pid, вікнами й індексами елементів без маршрутизації через маркетплейс Codex або сокет PeekabooBridge.

Використовуйте Peekaboo для широких можливостей автоматизації macOS через хост-мост OpenClaw.app з урахуванням дозволів. Використовуйте кероване агентом використання комп’ютера, коли агент Gateway має бачити робочий стіл і керувати ним за допомогою уніфікованої команди Node `computer.act`, якою може керувати будь-яка модель із підтримкою зору. Використовуйте Codex Computer Use, коли агент у режимі Codex має покладатися на нативний Plugin Codex. Використовуйте безпосередній `cua-driver mcp`, щоб надати драйвер CUA будь-якому середовищу виконання під керуванням OpenClaw як звичайний сервер MCP.

## Увімкнення мосту

У застосунку macOS: **Settings -> Enable Peekaboo Bridge**. Для перемикача потрібно ввімкнути **Allow Computer Control**, оскільки обидва параметри надають локальну автоматизацію інтерфейсу; якщо Computer Control вимкнено, перемикач недоступний і хост не працює. Щоб керувати Peekaboo без Computer Control, натомість запустіть власний застосунок Peekaboo для Mac як хост.

Коли міст увімкнено (і Computer Control активовано), OpenClaw запускає локальний сервер UNIX-сокета за адресою `~/Library/Application Support/OpenClaw/<socket-name>`. Якщо його вимкнено, хост зупиняється, а `peekaboo` перемикається на інші доступні хости. Координатор також підтримує символічні посилання на застарілі сокети (`clawdbot`, `clawdis`, `moltbot` у Application Support), які вказують на поточний сокет для старіших інсталяцій `peekaboo`.

## Порядок виявлення клієнтом

Клієнти Peekaboo зазвичай намагаються під’єднатися до хостів у такому порядку:

1. Peekaboo.app (повний користувацький інтерфейс)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Скористайтеся `peekaboo bridge status --verbose`, щоб дізнатися, який хост активний і який шлях до сокета використовується. Щоб перевизначити його, виконайте:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Міст перевіряє **підписи коду виклику**; застосовується список дозволених TeamID (TeamID хоста Peekaboo та власний TeamID запущеного застосунку).
- Для Accessibility віддавайте перевагу підписаній ідентичності мосту або застосунку, а не універсальному середовищу виконання `node`. Надання Accessibility для `node` дає змогу будь-якому пакету, запущеному цим виконуваним файлом Node, успадкувати доступ до автоматизації графічного інтерфейсу; див. [Дозволи macOS](/uk/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Час очікування запитів спливає через 10 секунд (`requestTimeoutSec: 10`).
- Якщо потрібних дозволів немає, міст повертає зрозуміле повідомлення про помилку, а не запускає System Settings.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті з терміном дії 10 хвилин і обмеженням у 50 знімків (`InMemorySnapshotManager`); під час очищення артефакти не видаляються. Якщо потрібно зберігати їх довше, повторно створіть знімок із клієнта.

## Усунення несправностей

- Якщо `peekaboo` повідомляє "клієнт мосту не авторизований", переконайтеся, що клієнт належним чином підписано, або запустіть хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` лише в режимі **debug**.
- Якщо хостів не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app) і переконайтеся, що дозволи надано.

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
