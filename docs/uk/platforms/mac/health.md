---
read_when:
    - Налагодження індикаторів стану здоров’я в mac app
summary: Як macOS app повідомляє стани здоров’я gateway/Baileys
title: Перевірки стану здоров’я (macOS)
x-i18n:
    generated_at: "2026-04-23T21:00:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17961525351f144236d215956dd3ee324f84d8fc59df97e5f377e1cd66992fb8
    source_path: platforms/mac/health.md
    workflow: 15
---

# Перевірки стану здоров’я на macOS

Як побачити в menu bar app, чи пов’язаний канал працює справно.

## Menu bar

- Точка стану тепер відображає стан здоров’я Baileys:
  - Зелена: пов’язано + socket нещодавно відкривався.
  - Помаранчева: підключення/повторні спроби.
  - Червона: вийшло з облікового запису або probe завершився помилкою.
- Другий рядок показує "linked · auth 12m" або причину збою.
- Пункт меню "Run Health Check" запускає probe на вимогу.

## Settings

- Вкладка General отримує картку Health, яка показує: вік пов’язаної auth, шлях/кількість session-store, час останньої перевірки, останню помилку/код статусу та кнопки Run Health Check / Reveal Logs.
- Використовує кешований snapshot, тому UI завантажується миттєво й коректно повертається до fallback, коли офлайн.
- **Вкладка Channels** показує стан каналу + елементи керування для WhatsApp/Telegram (login QR, logout, probe, останнє disconnect/error).

## Як працює probe

- App запускає `openclaw health --json` через `ShellExecutor` приблизно кожні 60 с і на вимогу. Probe завантажує creds і повідомляє стан, не надсилаючи повідомлень.
- Кешуйте останній добрий snapshot і останню помилку окремо, щоб уникнути мерехтіння; показуйте часову позначку кожного.

## Якщо є сумніви

- Ви все ще можете використовувати потік CLI з [Gateway health](/uk/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) і виконувати tail для `/tmp/openclaw/openclaw-*.log` на предмет `web-heartbeat` / `web-reconnect`.
