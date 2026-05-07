---
read_when:
    - Пошук статусу застосунку-компаньйона для Linux
    - Планування охоплення платформ або внесків
    - Налагодження завершень процесів у Linux через OOM або коду виходу 137 на VPS чи в контейнері
summary: Підтримка Linux + стан супровідного застосунку
title: Застосунок для Linux
x-i18n:
    generated_at: "2026-05-07T15:08:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway повністю підтримується в Linux. **Node є рекомендованим середовищем виконання**.
Bun не рекомендовано для Gateway (помилки WhatsApp/Telegram).

Нативні супутні застосунки для Linux заплановані. Внески вітаються, якщо ви хочете допомогти створити такий застосунок.

## Швидкий шлях для початківців (VPS)

1. Установіть Node 24 (рекомендовано; Node 22 LTS, наразі `22.16+`, усе ще працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. З вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і автентифікуйтеся за допомогою налаштованого спільного секрету (токен за замовчуванням; пароль, якщо ви встановили `gateway.auth.mode: "password"`)

Повний посібник із сервера Linux: [Сервер Linux](/uk/vps). Покроковий приклад VPS: [exe.dev](/uk/install/exe-dev)

## Встановлення

- [Початок роботи](/uk/start/getting-started)
- [Встановлення та оновлення](/uk/install/updating)
- Необов’язкові сценарії: [Bun (експериментально)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Gateway

- [Операційний посібник Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення служби Gateway (CLI)

Скористайтеся одним із цих варіантів:

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

Виберіть **Служба Gateway**, коли з’явиться запит.

Відновлення/міграція:

```
openclaw doctor
```

## Керування системою (користувацький модуль systemd)

OpenClaw за замовчуванням установлює службу systemd **користувача**. Використовуйте **системну**
службу для спільних або постійно ввімкнених серверів. `openclaw gateway install` і
`openclaw onboard --install-daemon` уже створюють для вас поточний канонічний модуль;
пишіть його вручну лише тоді, коли вам потрібне власне налаштування системи/менеджера служб.
Повні вказівки щодо служби наведено в [операційному посібнику Gateway](/uk/gateway).

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

## Тиск на пам’ять і завершення через OOM

У Linux ядро вибирає жертву OOM, коли хост, VM або cgroup контейнера
вичерпує пам’ять. Gateway може бути невдалою жертвою, бо він володіє довготривалими
сесіями та підключеннями каналів. Тому OpenClaw, коли можливо, зміщує пріоритет так,
щоб тимчасові дочірні процеси завершувалися раніше за Gateway.

Для відповідних дочірніх процесів Linux OpenClaw запускає дочірній процес через коротку
обгортку `/bin/sh`, яка підвищує власний `oom_score_adj` дочірнього процесу до `1000`, а потім
виконує `exec` справжньої команди. Це непривілейована операція, оскільки дочірній процес
лише збільшує власну ймовірність завершення через OOM.

Охоплені поверхні дочірніх процесів включають:

- дочірні процеси команд, керовані супервізором,
- дочірні процеси оболонки PTY,
- дочірні процеси stdio-серверів MCP,
- запущені OpenClaw процеси браузера/Chrome.

Обгортка працює лише в Linux і пропускається, коли `/bin/sh` недоступний. Вона
також пропускається, якщо середовище дочірнього процесу встановлює `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` або `off`.

Щоб перевірити дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для охоплених дочірніх процесів — `1000`. Процес Gateway має зберігати
свій звичайний показник, зазвичай `0`.

Це не замінює звичайного налаштування пам’яті. Якщо VPS або контейнер повторно
завершує дочірні процеси, збільште ліміт пам’яті, зменште паралельність або додайте суворіші
засоби контролю ресурсів, як-от systemd `MemoryMax=` або ліміти пам’яті на рівні контейнера.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Сервер Linux](/uk/vps)
- [Raspberry Pi](/uk/install/raspberry-pi)
