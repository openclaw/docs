---
read_when:
    - Діагностика підключення каналу або стану Gateway
    - Розуміння команд CLI для перевірки стану та їхніх параметрів
summary: Команди перевірки стану та моніторинг стану Gateway
title: Перевірки стану
x-i18n:
    generated_at: "2026-04-24T18:10:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Короткий посібник, щоб перевірити підключення каналу без здогадок.

## Швидкі перевірки

- `openclaw status` — локальний зведений статус: доступність/режим gateway, підказка щодо оновлення, давність автентифікації підключених каналів, сесії та нещодавня активність.
- `openclaw status --all` — повна локальна діагностика (лише читання, з кольорами, безпечно вставляти для налагодження).
- `openclaw status --deep` — звертається до запущеного gateway за live health probe (`health` з `probe:true`), зокрема з перевірками каналів для кожного облікового запису, коли це підтримується.
- `openclaw health` — звертається до запущеного gateway по його health snapshot (лише WS; без прямих сокетів каналів із CLI).
- `openclaw health --verbose` — примусово запускає live health probe і виводить деталі підключення gateway.
- `openclaw health --json` — машиночитний вивід health snapshot.
- Надішліть `/status` як окреме повідомлення у WhatsApp/WebChat, щоб отримати відповідь зі статусом без запуску агента.
- Журнали: переглядайте `/tmp/openclaw/openclaw-*.log` і фільтруйте за `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Глибока діагностика

- Облікові дані на диску: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` має бути недавнім).
- Сховище сесій: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (шлях можна перевизначити в конфігурації). Кількість і недавні отримувачі відображаються через `status`.
- Процес повторного підключення: `openclaw channels logout && openclaw channels login --verbose`, коли в журналах з’являються коди статусу 409–515 або `loggedOut`. (Примітка: після pairing процес входу через QR автоматично перезапускається один раз для статусу 515.)
- Діагностика ввімкнена типово. Gateway записує операційні факти, якщо не встановлено `diagnostics.enabled: false`. Події пам’яті записують кількість байтів RSS/heap, тиск порогів і тиск зростання. Події надто великих payload записують, що саме було відхилено, усічено або поділено на частини, а також розміри й ліміти, коли вони доступні. Вони не записують текст повідомлення, вміст вкладень, тіло Webhook, сире тіло запиту чи відповіді, токени, cookies або секретні значення. Той самий Heartbeat запускає обмежений recorder стабільності, доступний через `openclaw gateway stability` або Gateway RPC `diagnostics.stability`. Фатальні виходи Gateway, тайм-аути завершення роботи та збої запуску після перезапуску зберігають останній snapshot recorder у `~/.openclaw/logs/stability/`, якщо події існують; перевірте найновіший збережений bundle за допомогою `openclaw gateway stability --bundle latest`.
- Для bug reports запустіть `openclaw gateway diagnostics export` і додайте згенерований zip. Експорт об’єднує зведення у Markdown, найновіший bundle стабільності, очищені метадані журналів, очищені snapshots статусу/стану Gateway і форму конфігурації. Його призначено для поширення: текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень і секретні значення пропускаються або редагуються. Див. [Експорт діагностики](/uk/gateway/diagnostics).

## Конфігурація монітора стану

- `gateway.channelHealthCheckMinutes`: як часто gateway перевіряє стан каналу. Типове значення: `5`. Установіть `0`, щоб глобально вимкнути перезапуски health monitor.
- `gateway.channelStaleEventThresholdMinutes`: як довго підключений канал може залишатися неактивним, перш ніж health monitor вважатиме його застарілим і перезапустить. Типове значення: `30`. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: ковзне обмеження на одну годину для перезапусків health monitor на канал/обліковий запис. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнути перезапуски health monitor для конкретного каналу, залишивши глобальний моніторинг увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для кількох облікових записів, яке має пріоритет над налаштуванням рівня каналу.
- Ці перевизначення для окремих каналів застосовуються до вбудованих моніторів каналів, які підтримують їх зараз: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram і WhatsApp.

## Коли щось не працює

- `logged out` або статус 409–515 → перепідключіться через `openclaw channels logout`, потім `openclaw channels login`.
- Gateway недоступний → запустіть його: `openclaw gateway --port 18789` (використайте `--force`, якщо порт зайнятий).
- Немає вхідних повідомлень → переконайтеся, що підключений телефон у мережі й відправника дозволено (`channels.whatsapp.allowFrom`); для групових чатів переконайтеся, що правила allowlist і згадок збігаються (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Окрема команда "health"

`openclaw health` звертається до запущеного gateway за його health snapshot (без прямих сокетів каналів із CLI). Типово вона може повертати свіжий кешований snapshot gateway; після цього gateway оновлює цей кеш у фоновому режимі. `openclaw health --verbose` натомість примусово запускає live probe. Команда повідомляє про підключені creds/давність автентифікації, коли це доступно, зведення probes для кожного каналу, зведення сховища сесій і тривалість probe. Вона завершується з ненульовим кодом, якщо gateway недоступний або probe завершується помилкою/тайм-аутом.

Параметри:

- `--json`: машиночитний вивід JSON
- `--timeout <ms>`: перевизначити типовий тайм-аут probe у 10 с
- `--verbose`: примусово запустити live probe і вивести деталі підключення gateway
- `--debug`: псевдонім для `--verbose`

Health snapshot містить: `ok` (boolean), `ts` (timestamp), `durationMs` (час probe), статус для кожного каналу, доступність агента та зведення сховища сесій.

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Усунення проблем Gateway](/uk/gateway/troubleshooting)
