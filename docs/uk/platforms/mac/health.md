---
read_when:
    - Налагодження індикаторів справності застосунку macOS
summary: Як застосунок macOS повідомляє про стани справності gateway/Baileys
title: Перевірки справності (macOS)
x-i18n:
    generated_at: "2026-04-24T04:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# Перевірки справності на macOS

Як побачити в застосунку в рядку меню, чи справний прив’язаний канал.

## Рядок меню

- Тепер точка стану відображає справність Baileys:
  - Зелена: прив’язано + socket нещодавно відкривався.
  - Помаранчева: підключення/повторна спроба.
  - Червона: виконано вихід або probe завершився невдачею.
- Другий рядок показує "прив’язано · auth 12 хв" або причину збою.
- Пункт меню "Run Health Check" запускає probe на вимогу.

## Налаштування

- На вкладці General з’являється картка Health, яка показує: вік linked auth, шлях/кількість session-store, час останньої перевірки, код останньої помилки/стану та кнопки Run Health Check / Reveal Logs.
- Використовується кешований snapshot, тож UI завантажується миттєво й коректно переходить у резервний режим без мережі.
- На вкладці **Channels** відображаються стан каналу + елементи керування для WhatsApp/Telegram (QR входу, вихід, probe, останнє відключення/помилка).

## Як працює probe

- Застосунок запускає `openclaw health --json` через `ShellExecutor` приблизно кожні 60 с і на вимогу. Probe завантажує credentials і повідомляє стан без надсилання повідомлень.
- Кешуйте останній успішний snapshot і останню помилку окремо, щоб уникнути мерехтіння; показуйте часову позначку для кожного.

## Якщо є сумніви

- Ви все ще можете використовувати потік CLI з [Справність Gateway](/uk/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) і переглядати `/tmp/openclaw/openclaw-*.log` для `web-heartbeat` / `web-reconnect`.

## Пов’язане

- [Справність Gateway](/uk/gateway/health)
- [Застосунок macOS](/uk/platforms/macos)
