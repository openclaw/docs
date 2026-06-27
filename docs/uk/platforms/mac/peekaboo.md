---
read_when:
    - Розміщення PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
    - Вибір між PeekabooBridge, Codex Computer Use і cua-driver MCP
summary: Інтеграція PeekabooBridge для автоматизації інтерфейсу користувача macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:47:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації UI з урахуванням дозволів. Це дає змогу CLI `peekaboo` виконувати автоматизацію UI, повторно використовуючи TCC-дозволи macOS-застосунку.

## Що це таке (і чим не є)

- **Хост**: OpenClaw.app може працювати як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (без окремої поверхні `openclaw ui ...`).
- **UI**: візуальні накладання залишаються в Peekaboo.app; OpenClaw є тонким брокерним хостом.

## Зв’язок із Computer Use

OpenClaw має три шляхи керування робочим столом, і вони навмисно залишаються окремими:

- **Хост PeekabooBridge**: OpenClaw.app може розміщувати локальний сокет PeekabooBridge. CLI `peekaboo` залишається клієнтом і використовує дозволи macOS для OpenClaw.app для примітивів автоматизації Peekaboo, таких як знімки екрана, кліки, меню, діалоги, дії Dock і керування вікнами.
- **Codex Computer Use**: вбудований Plugin `codex` готує сервер застосунку Codex, перевіряє доступність MCP-сервера `computer-use` Codex, а потім дає Codex керувати викликами нативних інструментів керування робочим столом під час ходів у режимі Codex. OpenClaw не проксіює ці дії через PeekabooBridge.
- **Прямий MCP `cua-driver`**: OpenClaw може зареєструвати upstream-сервер TryCua `cua-driver mcp` як звичайний MCP-сервер. Це надає агентам власні схеми CUA-драйвера та робочий процес pid/window/element-index без маршрутизації через маркетплейс Codex або сокет PeekabooBridge.

Використовуйте Peekaboo, коли потрібна широка поверхня автоматизації macOS і хост-мост OpenClaw.app з урахуванням дозволів. Використовуйте Codex Computer Use, коли агент у режимі Codex має покладатися на нативний Plugin computer-use від Codex. Використовуйте прямий `cua-driver mcp`, коли потрібно відкрити CUA-драйвер для будь-якого керованого OpenClaw середовища виконання як звичайний MCP-сервер.

## Увімкнення мосту

У застосунку macOS:

- Settings → **Увімкнути Peekaboo Bridge**

Коли ввімкнено, OpenClaw запускає локальний сервер UNIX-сокета. Якщо вимкнено, хост зупиняється, а `peekaboo` повернеться до інших доступних хостів.

## Порядок виявлення клієнта

Клієнти Peekaboo зазвичай пробують хости в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який шлях сокета використовується. Можна перевизначити за допомогою:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека та дозволи

- Міст перевіряє **підписи коду викликачів**; застосовується allowlist TeamID (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Віддавайте перевагу підписаній ідентичності мосту/застосунку над типовим середовищем виконання `node` для Accessibility. Надання Accessibility для `node` дає змогу будь-якому пакету, запущеному цим виконуваним файлом Node, успадкувати доступ до автоматизації GUI; див. [дозволи macOS](/uk/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Запити завершуються за тайм-аутом приблизно через 10 секунд.
- Якщо потрібних дозволів бракує, міст повертає зрозуміле повідомлення про помилку замість запуску System Settings.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті й автоматично завершують дію після короткого проміжку часу. Якщо потрібне довше зберігання, повторно захопіть знімок із клієнта.

## Усунення несправностей

- Якщо `peekaboo` повідомляє "bridge client is not authorized", переконайтеся, що клієнт належно підписаний, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` лише в режимі **налагодження**.
- Якщо хости не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app) і підтвердьте, що дозволи надано.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [дозволи macOS](/uk/platforms/mac/permissions)
