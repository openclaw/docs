---
read_when:
    - Розміщення PeekabooBridge у OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
    - Вибір між PeekabooBridge, Codex Computer Use і cua-driver MCP
summary: Інтеграція PeekabooBridge для автоматизації інтерфейсу macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-04-28T00:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації інтерфейсу з урахуванням дозволів. Це дає змогу CLI `peekaboo` керувати автоматизацією інтерфейсу, повторно використовуючи дозволи TCC macOS застосунку.

## Що це таке (і чим це не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (без окремої поверхні `openclaw ui ...`).
- **Інтерфейс**: візуальні накладки залишаються в Peekaboo.app; OpenClaw є тонким брокерським хостом.

## Зв’язок із Computer Use

OpenClaw має три шляхи керування робочим столом, і вони навмисно залишаються окремими:

- **Хост PeekabooBridge**: OpenClaw.app може розміщувати локальний сокет PeekabooBridge. Клієнтом лишається CLI `peekaboo`, який використовує дозволи macOS OpenClaw.app для примітивів автоматизації Peekaboo, як-от знімки екрана, кліки, меню, діалоги, дії Dock і керування вікнами.
- **Codex Computer Use**: вбудований Plugin `codex` готує сервер застосунку Codex, перевіряє, що MCP-сервер `computer-use` Codex доступний, а потім дає Codex змогу керувати викликами вбудованих інструментів керування робочим столом під час ходів у режимі Codex. OpenClaw не проксіює ці дії через PeekabooBridge.
- **Прямий MCP `cua-driver`**: OpenClaw може зареєструвати висхідний сервер TryCua `cua-driver mcp` як звичайний MCP-сервер. Це надає агентам власні схеми драйвера CUA та його робочий процес pid/window/element-index без маршрутизації через маркетплейс Codex або сокет PeekabooBridge.

Використовуйте Peekaboo, коли вам потрібна широка поверхня автоматизації macOS і хост-мост OpenClaw.app з урахуванням дозволів. Використовуйте Codex Computer Use, коли агент у режимі Codex має покладатися на вбудований Plugin computer-use від Codex. Використовуйте прямий `cua-driver mcp`, коли хочете, щоб драйвер CUA був доступний будь-якому середовищу виконання під керуванням OpenClaw як звичайний MCP-сервер.

## Увімкнення моста

У застосунку macOS:

- Налаштування → **Увімкнути Peekaboo Bridge**

Коли цю опцію ввімкнено, OpenClaw запускає локальний сервер UNIX-сокета. Якщо її вимкнено, хост зупиняється, а `peekaboo` повертається до інших доступних хостів.

## Порядок виявлення клієнта

Клієнти Peekaboo зазвичай пробують хости в такому порядку:

1. Peekaboo.app (повноцінний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Скористайтеся `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який шлях сокета використовується. Ви можете перевизначити це так:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Міст перевіряє **підписи коду викликача**; застосовується список дозволених TeamID (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо бракує потрібних дозволів, міст повертає чітке повідомлення про помилку замість запуску System Settings.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті та автоматично видаляються через короткий проміжок часу.
Якщо вам потрібне довше зберігання, повторно захопіть їх із клієнта.

## Усунення проблем

- Якщо `peekaboo` повідомляє “bridge client is not authorized”, переконайтеся, що клієнт підписано належним чином, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` лише в режимі **debug**.
- Якщо не знайдено жодного хоста, відкрийте один із хост-застосунків (Peekaboo.app або OpenClaw.app) і підтвердьте, що дозволи надано.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
