---
read_when:
    - Інтеграція mac-застосунку з життєвим циклом Gateway
summary: Життєвий цикл Gateway на macOS (launchd)
title: Життєвий цикл Gateway
x-i18n:
    generated_at: "2026-04-23T21:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50de056f00cb5d9bfa5e5ea1a4efd5a37059910a2762903147aa8bfccf6202e4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Життєвий цикл Gateway на macOS

macOS-застосунок **типово керує Gateway через launchd** і не запускає
Gateway як дочірній процес. Спочатку він намагається під’єднатися до вже запущеного
Gateway на налаштованому порту; якщо жоден недосяжний, він вмикає сервіс launchd через зовнішній CLI `openclaw` (без вбудованого runtime). Це дає вам
надійний автозапуск під час входу в систему та перезапуск після збоїв.

Режим дочірнього процесу (Gateway запускається безпосередньо застосунком) **сьогодні не використовується**.
Якщо вам потрібні тісніший зв’язок з UI, запускайте Gateway вручну в терміналі.

## Типова поведінка (launchd)

- Застосунок встановлює per-user LaunchAgent з міткою `ai.openclaw.gateway`
  (або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; застаріле `com.openclaw.*` підтримується).
- Коли увімкнено локальний режим, застосунок гарантує, що LaunchAgent завантажено, і
  запускає Gateway за потреби.
- Логи записуються в шлях журналу gateway для launchd (видно в Debug Settings).

Поширені команди:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, якщо використовуєте іменований profile.

## Непідписані dev-збірки

`scripts/restart-mac.sh --no-sign` призначено для швидких локальних збірок, коли у вас немає
ключів підпису. Щоб launchd не вказував на непідписаний relay-binary, він:

- Записує `~/.openclaw/disable-launchagent`.

Підписані запуски `scripts/restart-mac.sh` очищають це перевизначення, якщо маркер
присутній. Щоб скинути вручну:

```bash
rm ~/.openclaw/disable-launchagent
```

## Режим лише під’єднання

Щоб примусово змусити macOS-застосунок **ніколи не встановлювати й не керувати launchd**, запускайте його з
`--attach-only` (або `--no-launchd`). Це встановлює `~/.openclaw/disable-launchagent`,
тому застосунок лише під’єднується до вже запущеного Gateway. Ви можете перемкнути таку саму
поведінку в Debug Settings.

## Віддалений режим

Віддалений режим ніколи не запускає локальний Gateway. Застосунок використовує SSH-тунель до
віддаленого хоста й підключається через цей тунель.

## Чому ми віддаємо перевагу launchd

- Автозапуск під час входу в систему.
- Вбудована семантика restart/KeepAlive.
- Передбачувані логи та нагляд.

Якщо колись знову знадобиться справжній режим дочірнього процесу, його слід задокументувати як
окремий, явний dev-only режим.
