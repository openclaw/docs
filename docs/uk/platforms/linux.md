---
read_when:
    - Шукаю статус супутнього застосунку для Linux
    - Планування покриття платформ або внесків
    - Налагодження Linux OOM-kill або коду виходу 137 на VPS чи в контейнері
summary: Підтримка Linux + статус супутнього застосунку
title: Застосунок Linux
x-i18n:
    generated_at: "2026-04-23T04:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Застосунок Linux

Gateway повністю підтримується на Linux. **Node — рекомендоване середовище виконання**.
Bun не рекомендується для Gateway (баги WhatsApp/Telegram).

Власні супутні застосунки для Linux заплановані. Внески вітаються, якщо ви хочете допомогти створити такий застосунок.

## Швидкий шлях для початківців (VPS)

1. Встановіть Node 24 (рекомендовано; Node 22 LTS, наразі `22.14+`, усе ще працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Із вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і пройдіть автентифікацію за допомогою налаштованого спільного секрету (типово токен; пароль, якщо ви встановили `gateway.auth.mode: "password"`)

Повний посібник із Linux Server: [Linux Server](/uk/vps). Покроковий приклад VPS: [exe.dev](/uk/install/exe-dev)

## Встановлення

- [Початок роботи](/uk/start/getting-started)
- [Встановлення й оновлення](/uk/install/updating)
- Додаткові варіанти: [Bun (experimental)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Gateway

- [Інструкція з експлуатації Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення служби Gateway (CLI)

Використайте один із цих варіантів:

```
openclaw onboard --install-daemon
```

Або:

```
openclaw gateway install
```

Або:

```
openclaw configure
```

Коли з’явиться запит, виберіть **Служба Gateway**.

Відновлення/міграція:

```
openclaw doctor
```

## Керування системою (користувацький модуль systemd)

OpenClaw типово встановлює користувацьку службу systemd. Використовуйте системну
службу для спільних або постійно активних серверів. `openclaw gateway install` і
`openclaw onboard --install-daemon` уже генерують для вас поточний канонічний модуль;
створюйте його вручну лише тоді, коли вам потрібне нетипове налаштування
system/service-manager. Повні вказівки щодо служби наведено в [інструкції з експлуатації Gateway](/uk/gateway).

Мінімальне налаштування:

Створіть `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Увімкніть його:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Тиск на пам’ять і OOM-kill

У Linux ядро вибирає жертву OOM, коли на хості, у VM або cgroup контейнера
закінчується пам’ять. Gateway може бути невдалою жертвою, оскільки він утримує
довгоживучі сесії та з’єднання каналів. Тому OpenClaw, коли це можливо,
зміщує пріоритет так, щоб тимчасові дочірні процеси вбивалися раніше за Gateway.

Для відповідних запусків дочірніх процесів у Linux OpenClaw запускає дочірній
процес через коротку обгортку `/bin/sh`, яка підвищує власний `oom_score_adj`
дочірнього процесу до `1000`, а потім виконує `exec` реальної команди. Це
непривілейована операція, оскільки дочірній процес лише підвищує ймовірність
власного OOM-kill.

Поверхні дочірніх процесів, які охоплюються, включають:

- дочірні процеси команд, керовані supervisor,
- дочірні процеси PTY shell,
- дочірні процеси сервера MCP stdio,
- процеси браузера/Chrome, запущені OpenClaw.

Обгортка працює лише в Linux і пропускається, якщо `/bin/sh` недоступний. Вона
також пропускається, якщо в середовищі дочірнього процесу встановлено `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` або `off`.

Щоб перевірити дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для охоплених дочірніх процесів — `1000`. Процес Gateway має
зберігати свій звичайний показник, зазвичай `0`.

Це не замінює звичайне налаштування пам’яті. Якщо VPS або контейнер регулярно
завершує дочірні процеси, збільште ліміт пам’яті, зменште паралелізм або
додайте жорсткіші обмеження ресурсів, наприклад systemd `MemoryMax=` або
ліміти пам’яті на рівні контейнера.
