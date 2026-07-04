---
read_when:
    - Встановлення застосунку macOS
    - Вибір між локальним і віддаленим режимом Gateway на macOS
    - Шукаємо завантаження релізів застосунку для macOS
summary: Установлення та використання застосунку OpenClaw для рядка меню macOS
title: macOS-застосунок
x-i18n:
    generated_at: "2026-07-04T06:48:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

Програма для macOS — це **супутник OpenClaw у рядку меню**. Використовуйте її, коли вам потрібні
нативний інтерфейс у треї, запити дозволів macOS, сповіщення, WebChat, голосове введення,
Canvas або інструменти вузла, розміщені на Mac, як-от `system.run`.

Якщо вам потрібні лише CLI і Gateway, почніть із [Початку роботи](/uk/start/getting-started).

## Завантаження

Завантажуйте збірки програми для macOS із
[релізів OpenClaw на GitHub](https://github.com/openclaw/openclaw/releases).
Коли реліз містить ресурси програми для macOS, шукайте:

- `OpenClaw-<version>.dmg` (бажано)
- `OpenClaw-<version>.zip`

Деякі релізи містять лише CLI, докази або ресурси для Windows. Якщо найновіший
реліз не має ресурсу програми для macOS, використайте найновіший реліз, який його має, або зберіть
програму з вихідного коду за допомогою [налаштування розробки для macOS](/uk/platforms/mac/dev-setup).

## Перший запуск

1. Установіть і запустіть **OpenClaw.app**.
2. Виберіть **This Mac** для локального Gateway або під’єднайтеся до віддаленого Gateway.
3. Для локального режиму зачекайте, доки програма встановить свій runtime у просторі користувача та Gateway.
4. Завершіть налаштування провайдера й контрольний список дозволів macOS.
5. Надішліть тестове повідомлення початкового налаштування.

Для шляху налаштування CLI/Gateway використовуйте [Початок роботи](/uk/start/getting-started).
Для відновлення дозволів використовуйте [дозволи macOS](/uk/platforms/mac/permissions).

## Виберіть режим Gateway

| Режим     | Коли використовувати                                                                    | Сторінка з подробицями                            |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Локальний | Цей Mac має запускати Gateway і підтримувати його роботу через launchd.                  | [Gateway на macOS](/uk/platforms/mac/bundled-gateway) |
| Віддалений | Інший хост запускає Gateway, а цей Mac має керувати ним через SSH, LAN або Tailnet.     | [Віддалене керування](/uk/platforms/mac/remote)      |

Локальний режим потребує встановленого CLI `openclaw`. На новому Mac програма автоматично встановлює
відповідні CLI і runtime перед запуском майстра Gateway.
Див. [Gateway на macOS](/uk/platforms/mac/bundled-gateway) для ручного відновлення.

## За що відповідає програма

- Стан рядка меню, сповіщення, справність і WebChat.
- Запити дозволів macOS для екрана, мікрофона, мовлення, автоматизації та доступності.
- Локальні інструменти вузла, як-от Canvas, захоплення камери/екрана, сповіщення та `system.run`.
- Запити схвалення виконання для команд, розміщених на Mac.
- SSH-тунелі у віддаленому режимі або прямі підключення до Gateway.

Програма **не** замінює Gateway OpenClaw або загальну документацію CLI. Основна
конфігурація Gateway, провайдери, плагіни, канали, інструменти та безпека описані
у власній документації.

## Сторінки з подробицями macOS

| Завдання                                      | Читати                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Установити або налагодити службу CLI/Gateway  | [Gateway на macOS](/uk/platforms/mac/bundled-gateway)                                          |
| Не зберігати стан у папках, синхронізованих із хмарою | [Gateway на macOS](/uk/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Налагодити виявлення програми та підключення  | [Gateway на macOS](/uk/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Зрозуміти поведінку launchd                   | [Життєвий цикл Gateway](/uk/platforms/mac/child-process)                                       |
| Виправити дозволи або проблеми підписування/TCC | [Дозволи macOS](/uk/platforms/mac/permissions)                                                |
| Під’єднатися до віддаленого Gateway           | [Віддалене керування](/uk/platforms/mac/remote)                                                |
| Переглянути стан рядка меню та перевірки справності | [Рядок меню](/uk/platforms/mac/menu-bar), [Перевірки справності](/uk/platforms/mac/health)        |
| Використовувати вбудований інтерфейс чату     | [WebChat](/uk/platforms/mac/webchat)                                                           |
| Використовувати голосове пробудження або push-to-talk | [Голосове пробудження](/uk/platforms/mac/voicewake)                                      |
| Використовувати Canvas і глибокі посилання Canvas | [Canvas](/uk/platforms/mac/canvas)                                                         |
| Розмістити PeekabooBridge для автоматизації інтерфейсу | [міст Peekaboo](/uk/platforms/mac/peekaboo)                                             |
| Налаштувати схвалення команд                  | [Схвалення exec](/uk/tools/exec-approvals), [розширені подробиці](/uk/tools/exec-approvals-advanced) |
| Переглянути команди вузла Mac і IPC програми  | [IPC macOS](/uk/platforms/mac/xpc)                                                             |
| Зібрати журнали                               | [Журналювання macOS](/uk/platforms/mac/logging)                                                |
| Зібрати з вихідного коду                      | [Налаштування розробки для macOS](/uk/platforms/mac/dev-setup)                                 |

## Пов’язане

- [Платформи](/uk/platforms)
- [Початок роботи](/uk/start/getting-started)
- [Gateway](/uk/gateway)
- [Схвалення exec](/uk/tools/exec-approvals)
