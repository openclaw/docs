---
read_when:
    - Розміщення PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
    - Вибір між PeekabooBridge, Codex Computer Use і cua-driver MCP
summary: Інтеграція PeekabooBridge для автоматизації користувацького інтерфейсу macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-05-05T23:38:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2b0076c0fabdc5e732c6a1b6ce9b571e8b65c1a646866f85ec4138c914d5c7d
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw може розміщувати **PeekabooBridge** як локальний, permission-aware брокер автоматизації UI. Це дає змогу CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи TCC-дозволи macOS-застосунку.

## Що це (і чим це не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (без окремої поверхні `openclaw ui ...`).
- **UI**: візуальні накладення залишаються в Peekaboo.app; OpenClaw є тонким брокерним хостом.

## Зв’язок із Computer Use

OpenClaw має три шляхи керування робочим столом, і вони навмисно залишаються окремими:

- **Хост PeekabooBridge**: OpenClaw.app може розміщувати локальний сокет PeekabooBridge.
  CLI `peekaboo` залишається клієнтом і використовує macOS-дозволи OpenClaw.app
  для примітивів автоматизації Peekaboo, таких як знімки екрана, клацання,
  меню, діалоги, дії Dock і керування вікнами.
- **Codex Computer Use**: вбудований `codex` Plugin готує app-server Codex,
  перевіряє, що MCP-сервер Codex `computer-use` доступний, а потім дає
  Codex володіти викликами нативних інструментів керування робочим столом під час ходів у режимі Codex. OpenClaw
  не проксує ці дії через PeekabooBridge.
- **Прямий MCP `cua-driver`**: OpenClaw може зареєструвати upstream-сервер
  TryCua `cua-driver mcp` як звичайний MCP-сервер. Це надає агентам власні схеми драйвера CUA
  та робочий процес pid/window/element-index без маршрутизації
  через marketplace Codex або сокет PeekabooBridge.

Використовуйте Peekaboo, коли вам потрібна широка поверхня автоматизації macOS і
permission-aware хост bridge OpenClaw.app. Використовуйте Codex Computer Use, коли агент у режимі Codex
має покладатися на нативний Plugin computer-use Codex. Використовуйте прямий `cua-driver mcp`,
коли хочете відкрити драйвер CUA для будь-якого runtime, керованого OpenClaw, як звичайний
MCP-сервер.

## Увімкнення bridge

У застосунку macOS:

- Settings → **Увімкнути Peekaboo Bridge**

Коли ввімкнено, OpenClaw запускає локальний сервер UNIX-сокета. Якщо вимкнено, хост
зупиняється, а `peekaboo` повернеться до інших доступних хостів.

## Порядок виявлення клієнтом

Клієнти Peekaboo зазвичай пробують хости в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який
шлях сокета використовується. Можна перевизначити за допомогою:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Bridge перевіряє **підписи коду викликачів**; застосовується allowlist TeamID
  (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо потрібних дозволів бракує, bridge повертає чітке повідомлення про помилку,
  а не запускає System Settings.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті й автоматично спливають після короткого проміжку.
Якщо потрібне довше зберігання, повторно зробіть знімок із клієнта.

## Усунення несправностей

- Якщо `peekaboo` повідомляє «bridge client is not authorized», переконайтеся, що клієнт
  належно підписаний, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  лише в режимі **debug**.
- Якщо хостів не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app)
  і підтвердьте, що дозволи надано.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
