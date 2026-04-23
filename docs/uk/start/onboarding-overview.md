---
read_when:
    - Вибір шляху онбордингу
    - Налаштування нового середовища
sidebarTitle: Onboarding Overview
summary: Огляд варіантів і потоків онбордингу OpenClaw
title: Огляд онбордингу
x-i18n:
    generated_at: "2026-04-23T21:12:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa9da37fbf12033d5a6adf04fce150fa7876f4d408bc5c3cd6205001617a5426
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw має два шляхи онбордингу. Обидва налаштовують auth, Gateway і
необов’язкові chat-канали — вони відрізняються лише способом взаємодії з налаштуванням.

## Який шлях мені вибрати?

|                | Онбординг через CLI                    | Онбординг у застосунку macOS |
| -------------- | -------------------------------------- | ---------------------------- |
| **Платформи**  | macOS, Linux, Windows (нативно або WSL2) | лише macOS                 |
| **Інтерфейс**  | Майстер у терміналі                    | Покроковий UI у застосунку   |
| **Найкраще для** | Серверів, headless, повного контролю | Desktop Mac, візуального налаштування |
| **Автоматизація** | `--non-interactive` для скриптів     | Лише вручну                  |
| **Команда**    | `openclaw onboard`                     | Запустіть застосунок         |

Більшості користувачів варто починати з **онбордингу через CLI** — він працює всюди й дає
найбільше контролю.

## Що налаштовує онбординг

Незалежно від того, який шлях ви виберете, онбординг налаштовує:

1. **Провайдера моделі та auth** — API-ключ, OAuth або setup token для вибраного provider
2. **Workspace** — каталог для файлів агента, bootstrap templates і memory
3. **Gateway** — порт, bind address, режим auth
4. **Канали** (необов’язково) — вбудовані та bundled chat-канали, такі як
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp тощо
5. **Daemon** (необов’язково) — фонова служба, щоб Gateway запускався автоматично

## Онбординг через CLI

Запустіть у будь-якому терміналі:

```bash
openclaw onboard
```

Додайте `--install-daemon`, щоб також установити фонову службу за один крок.

Повний довідник: [Onboarding (CLI)](/uk/start/wizard)
Документація по команді CLI: [`openclaw onboard`](/uk/cli/onboard)

## Онбординг у застосунку macOS

Відкрийте застосунок OpenClaw. Майстер першого запуску проведе вас через ті самі кроки
через візуальний інтерфейс.

Повний довідник: [Onboarding (macOS App)](/uk/start/onboarding)

## Власні або не перелічені провайдери

Якщо ваш provider не перелічений в онбордингу, виберіть **Custom Provider** і
введіть:

- режим сумісності API (OpenAI-compatible, Anthropic-compatible або auto-detect)
- Base URL і API-ключ
- Model ID і необов’язковий alias

Кілька власних endpoint можуть співіснувати — кожен отримує власний endpoint ID.
