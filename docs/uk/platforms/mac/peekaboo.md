---
read_when:
    - Хостинг PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
    - Вибір між PeekabooBridge, Codex Computer Use та cua-driver MCP
summary: Інтеграція PeekabooBridge для автоматизації інтерфейсу користувача macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-05-06T05:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації UI, що враховує дозволи. Це дає змогу CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи дозволи TCC застосунку macOS.

## Що це таке (і чим не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (без окремої поверхні `openclaw ui ...`).
- **UI**: візуальні накладання залишаються в Peekaboo.app; OpenClaw є тонким хостом-брокером.

## Зв’язок із Computer Use

OpenClaw має три шляхи керування робочим столом, і вони навмисно залишаються окремими:

- **Хост PeekabooBridge**: OpenClaw.app може розміщувати локальний сокет PeekabooBridge.
  CLI `peekaboo` залишається клієнтом і використовує дозволи macOS застосунку OpenClaw.app для примітивів автоматизації Peekaboo, таких як знімки екрана, кліки, меню, діалогові вікна, дії Dock і керування вікнами.
- **Codex Computer Use**: вбудований `codex` plugin готує сервер застосунку Codex, перевіряє, що MCP-сервер `computer-use` Codex доступний, а потім дає Codex володіти викликами інструментів нативного керування робочим столом під час ходів у режимі Codex. OpenClaw не проксіює ці дії через PeekabooBridge.
- **Прямий MCP `cua-driver`**: OpenClaw може зареєструвати upstream-сервер TryCua `cua-driver mcp` як звичайний MCP-сервер. Це надає агентам власні схеми CUA-драйвера та робочий процес із pid/вікном/індексом елемента без маршрутизації через маркетплейс Codex або сокет PeekabooBridge.

Використовуйте Peekaboo, коли потрібна широка поверхня автоматизації macOS і хост-мост OpenClaw.app, що враховує дозволи. Використовуйте Codex Computer Use, коли агент у режимі Codex має покладатися на нативний plugin computer-use від Codex. Використовуйте прямий `cua-driver mcp`, коли хочете надати CUA-драйвер будь-якому середовищу виконання, керованому OpenClaw, як звичайний MCP-сервер.

## Увімкнення моста

У застосунку macOS:

- Налаштування → **Увімкнути Peekaboo Bridge**

Коли ввімкнено, OpenClaw запускає локальний сервер UNIX-сокета. Якщо вимкнено, хост зупиняється, а `peekaboo` повернеться до інших доступних хостів.

## Порядок виявлення клієнтів

Клієнти Peekaboo зазвичай пробують хости в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який шлях до сокета використовується. Можна перевизначити за допомогою:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Міст перевіряє **підписи коду викликачів**; застосовується allowlist TeamID (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо потрібних дозволів бракує, міст повертає зрозуміле повідомлення про помилку, а не запускає Системні налаштування.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті та автоматично спливають після короткого проміжку часу. Якщо потрібне довше зберігання, повторно зробіть знімок із клієнта.

## Усунення несправностей

- Якщо `peekaboo` повідомляє "bridge client is not authorized", переконайтеся, що клієнт належно підписаний, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` лише в режимі **debug**.
- Якщо хости не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app) і підтвердьте, що дозволи надано.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [дозволи macOS](/uk/platforms/mac/permissions)
