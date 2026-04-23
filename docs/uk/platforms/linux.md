---
read_when:
    - Пошук статусу супутнього застосунку Linux
    - Планування покриття платформ або внесків иҭર્મ assistant to=final հանդես code  block omitted
    - Налагодження вбивств OOM у Linux або exit 137 на VPS чи в контейнері
summary: Підтримка Linux + статус супутнього застосунку
title: Застосунок Linux
x-i18n:
    generated_at: "2026-04-23T21:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84ba167ea33a748010ce6ee48665fd4ed8ae102f725316806777f68629807df
    source_path: platforms/linux.md
    workflow: 15
---

Gateway повністю підтримується на Linux. **Рекомендоване runtime-середовище — Node**.
Bun не рекомендується для Gateway (помилки WhatsApp/Telegram).

Нативні супутні застосунки для Linux заплановані. Якщо ви хочете допомогти створити такий застосунок, внески вітаються.

## Швидкий шлях для початківців (VPS)

1. Установіть Node 24 (рекомендовано; Node 22 LTS, наразі `22.14+`, усе ще працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. З вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і автентифікуйтеся за допомогою налаштованого спільного секрету (типово токен; пароль, якщо ви встановили `gateway.auth.mode: "password"`)

Повний посібник для Linux-сервера: [Linux Server](/uk/vps). Покроковий приклад VPS: [exe.dev](/uk/install/exe-dev)

## Встановлення

- [Початок роботи](/uk/start/getting-started)
- [Встановлення та оновлення](/uk/install/updating)
- Необов’язкові варіанти: [Bun (експериментально)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Gateway

- [Runbook Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення сервісу Gateway (CLI)

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

Коли з’явиться запит, виберіть **Gateway service**.

Відновлення/міграція:

```
openclaw doctor
```

## Керування системою (systemd user unit)

За замовчуванням OpenClaw встановлює systemd **user** service. Для спільних або постійно активних серверів використовуйте **system** service. `openclaw gateway install` і
`openclaw onboard --install-daemon` уже генерують для вас поточний канонічний unit;
пишіть його вручну лише тоді, коли вам потрібне користувацьке налаштування system/service manager. Повні вказівки щодо сервісу наведено в [runbook Gateway](/uk/gateway).

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

## Тиск на пам’ять і вбивства OOM

На Linux ядро вибирає жертву OOM, коли на хості, у VM або cgroup контейнера
закінчується пам’ять. Gateway може бути невдалою жертвою, оскільки він володіє довгоживучими
сесіями та підключеннями каналів. Тому OpenClaw, коли це можливо, зміщує пріоритет так, щоб
тимчасові дочірні процеси вбивалися раніше за Gateway.

Для придатних запусків дочірніх процесів у Linux OpenClaw запускає дочірній процес через коротку
обгортку `/bin/sh`, яка підвищує власний `oom_score_adj` дочірнього процесу до `1000`, а потім
виконує `exec` реальної команди. Це непривілейована операція, оскільки дочірній процес
лише збільшує власну ймовірність бути вбитим через OOM.

Поверхні дочірніх процесів, які покриваються:

- дочірні процеси команд, керовані supervisor,
- дочірні PTY shell-процеси,
- дочірні процеси MCP stdio server,
- запущені OpenClaw процеси browser/Chrome.

Обгортка працює лише на Linux і пропускається, якщо `/bin/sh` недоступний. Вона
також пропускається, якщо середовище дочірнього процесу задає `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` або `off`.

Щоб перевірити дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для покритих дочірніх процесів — `1000`. Процес Gateway має зберігати
свій звичайний показник, зазвичай `0`.

Це не замінює звичайне налаштування пам’яті. Якщо VPS або контейнер постійно
вбиває дочірні процеси, збільште ліміт пам’яті, зменште concurrency або додайте жорсткіші
обмеження ресурсів, такі як systemd `MemoryMax=` або ліміти пам’яті на рівні контейнера.
