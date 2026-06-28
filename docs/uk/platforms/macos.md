---
read_when:
    - Встановлення застосунку для macOS
    - Вибір між локальним і віддаленим режимом Gateway на macOS
    - Шукаємо завантаження релізу застосунку для macOS
summary: Установлення та використання програми OpenClaw для панелі меню macOS
title: Застосунок macOS
x-i18n:
    generated_at: "2026-06-28T00:13:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

Застосунок macOS є **супутником OpenClaw у рядку меню**. Використовуйте його, коли потрібні
нативний UI в системному треї, запити дозволів macOS, сповіщення, WebChat, голосове введення,
Canvas або інструменти вузла, розміщені на Mac, як-от `system.run`.

Якщо вам потрібні лише CLI та Gateway, почніть із [Початок роботи](/uk/start/getting-started).

## Завантаження

Завантажуйте збірки застосунку macOS з
[релізів OpenClaw на GitHub](https://github.com/openclaw/openclaw/releases).
Коли реліз містить ресурси застосунку macOS, шукайте:

- `OpenClaw-<version>.dmg` (бажано)
- `OpenClaw-<version>.zip`

Деякі релізи містять лише CLI, докази або ресурси Windows. Якщо найновіший
реліз не має ресурсу застосунку macOS, використайте найновіший реліз, який його має, або зберіть
застосунок із вихідного коду за допомогою [налаштування розробки macOS](/uk/platforms/mac/dev-setup).

## Перший запуск

1. Установіть і запустіть **OpenClaw.app**.
2. Виконайте контрольний список дозволів macOS.
3. Виберіть режим **Локальний** або **Віддалений**.
4. Установіть CLI `openclaw`, якщо застосунок попросить це зробити.
5. Відкрийте WebChat з рядка меню та надішліть тестове повідомлення.

Для шляху налаштування CLI/Gateway використовуйте [Початок роботи](/uk/start/getting-started).
Для відновлення дозволів використовуйте [дозволи macOS](/uk/platforms/mac/permissions).

## Вибір режиму Gateway

| Режим      | Коли використовувати                                                                            | Сторінка з подробицями                            |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Локальний  | Цей Mac має запускати Gateway і підтримувати його роботу через launchd.                         | [Gateway на macOS](/uk/platforms/mac/bundled-gateway) |
| Віддалений | Інший хост запускає Gateway, а цей Mac має керувати ним через SSH, LAN або Tailnet.             | [Віддалене керування](/uk/platforms/mac/remote)      |

Локальний режим потребує встановленого CLI `openclaw`. Застосунок може встановити його, або ви
можете скористатися [Gateway на macOS](/uk/platforms/mac/bundled-gateway).

## За що відповідає застосунок

- Стан у рядку меню, сповіщення, справність і WebChat.
- Запити дозволів macOS для екрана, мікрофона, мовлення, автоматизації та доступності.
- Локальні інструменти вузла, як-от Canvas, захоплення камери/екрана, сповіщення та `system.run`.
- Запити затвердження виконання для команд, розміщених на Mac.
- SSH-тунелі у віддаленому режимі або прямі підключення до Gateway.

Застосунок **не** замінює OpenClaw Gateway або загальну документацію CLI. Основні
налаштування Gateway, провайдери, plugins, канали, інструменти та безпека описані в
окремій документації.

## Сторінки з подробицями про macOS

| Завдання                                  | Читати                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Установити або налагодити службу CLI/Gateway | [Gateway на macOS](/uk/platforms/mac/bundled-gateway)                                             |
| Не зберігати стан у папках із хмарною синхронізацією | [Gateway на macOS](/uk/platforms/mac/bundled-gateway#state-directory-on-macos)                    |
| Налагодити виявлення застосунку та підключення | [Gateway на macOS](/uk/platforms/mac/bundled-gateway#debug-app-connectivity)                      |
| Зрозуміти поведінку launchd               | [Життєвий цикл Gateway](/uk/platforms/mac/child-process)                                          |
| Виправити проблеми з дозволами або підписуванням/TCC | [Дозволи macOS](/uk/platforms/mac/permissions)                                                    |
| Підключитися до віддаленого Gateway       | [Віддалене керування](/uk/platforms/mac/remote)                                                   |
| Читати стан у рядку меню та перевірки справності | [Рядок меню](/uk/platforms/mac/menu-bar), [Перевірки справності](/uk/platforms/mac/health)           |
| Використовувати вбудований UI чату        | [WebChat](/uk/platforms/mac/webchat)                                                              |
| Використовувати голосове пробудження або push-to-talk | [Голосове пробудження](/uk/platforms/mac/voicewake)                                               |
| Використовувати Canvas і глибинні посилання Canvas | [Canvas](/uk/platforms/mac/canvas)                                                                |
| Розмістити PeekabooBridge для автоматизації UI | [Міст Peekaboo](/uk/platforms/mac/peekaboo)                                                       |
| Налаштувати затвердження команд           | [Затвердження виконання](/uk/tools/exec-approvals), [розширені подробиці](/uk/tools/exec-approvals-advanced) |
| Переглянути команди вузла Mac та IPC застосунку | [IPC macOS](/uk/platforms/mac/xpc)                                                                |
| Збирати журнали                           | [Журналювання macOS](/uk/platforms/mac/logging)                                                   |
| Зібрати з вихідного коду                  | [Налаштування розробки macOS](/uk/platforms/mac/dev-setup)                                       |

## Пов’язане

- [Платформи](/uk/platforms)
- [Початок роботи](/uk/start/getting-started)
- [Gateway](/uk/gateway)
- [Затвердження виконання](/uk/tools/exec-approvals)
