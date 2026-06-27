---
read_when:
    - Пошук стану супровідного застосунку для Linux
    - Планування покриття платформ або внесків
    - Налагодження Linux OOM kills або виходу 137 на VPS чи контейнері
summary: Статус підтримки Linux і супутнього застосунку
title: Програма для Linux
x-i18n:
    generated_at: "2026-06-27T17:46:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway повністю підтримується на Linux. **Node є рекомендованим середовищем виконання**.
Bun не рекомендовано для Gateway (помилки WhatsApp/Telegram).

Нативні супутні застосунки для Linux заплановані. Внески вітаються, якщо ви хочете допомогти створити такий застосунок.

## Швидкий шлях для початківців (VPS)

1. Установіть Node 24 (рекомендовано; Node 22 LTS, наразі `22.19+`, усе ще працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. З вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і автентифікуйтеся за допомогою налаштованого спільного секрету (типово токен; пароль, якщо ви встановили `gateway.auth.mode: "password"`)

Повний посібник із сервера Linux: [Сервер Linux](/uk/vps). Покроковий приклад VPS: [exe.dev](/uk/install/exe-dev)

## Установлення

- [Початок роботи](/uk/start/getting-started)
- [Установлення й оновлення](/uk/install/updating)
- Необов'язкові сценарії: [Bun (експериментально)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Gateway

- [Runbook Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Установлення служби Gateway (CLI)

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

Виберіть **Служба Gateway**, коли з'явиться запит.

Виправлення/міграція:

```
openclaw doctor
```

## Керування системою (користувацький модуль systemd)

OpenClaw типово встановлює **користувацьку** службу systemd. Використовуйте **системну**
службу для спільних або постійно ввімкнених серверів. `openclaw gateway install` і
`openclaw onboard --install-daemon` уже створюють для вас поточний канонічний модуль;
пишіть його вручну лише тоді, коли вам потрібне власне налаштування системи/менеджера служб.
Повні вказівки щодо служби наведено в [runbook Gateway](/uk/gateway).

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
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Увімкніть її:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Тиск на пам'ять і завершення OOM

У Linux ядро вибирає жертву OOM, коли cgroup хоста, VM або контейнера
вичерпує пам'ять. Gateway може бути невдалою жертвою, бо він володіє довготривалими
сеансами та з'єднаннями каналів. Тому OpenClaw, коли це можливо, зміщує пріоритет
тимчасових дочірніх процесів так, щоб їх завершували раніше за Gateway.

Для відповідних дочірніх процесів Linux OpenClaw запускає дочірній процес через коротку
обгортку `/bin/sh`, яка підвищує власний `oom_score_adj` дочірнього процесу до `1000`, а потім
виконує `exec` для справжньої команди. Це непривілейована операція, оскільки дочірній процес
лише збільшує власну ймовірність завершення OOM.

Охоплені поверхні дочірніх процесів включають:

- дочірні команди, керовані супервізором,
- дочірні PTY-оболонки,
- дочірні stdio-сервери MCP,
- процеси браузера/Chrome, запущені OpenClaw.

Обгортка працює лише в Linux і пропускається, якщо `/bin/sh` недоступний. Вона
також пропускається, якщо середовище дочірнього процесу встановлює `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` або `off`.

Щоб перевірити дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для охоплених дочірніх процесів — `1000`. Процес Gateway має зберігати
свій звичайний показник, зазвичай `0`.

Рекомендований модуль systemd також встановлює `OOMPolicy=continue`. Це зберігає
модуль Gateway активним, коли тимчасовий дочірній процес вибирається OOM killer;
дочірня команда/сеанс може завершитися з помилкою й повідомити про неї без того, щоб systemd позначив
усю службу gateway як невдалу та перезапустив усі канали.

Це не замінює звичайне налаштування пам'яті. Якщо VPS або контейнер неодноразово
завершує дочірні процеси, збільште ліміт пам'яті, зменште паралелізм або додайте сильніші
засоби контролю ресурсів, як-от systemd `MemoryMax=` або ліміти пам'яті на рівні контейнера.

## Пов'язане

- [Огляд установлення](/uk/install)
- [Сервер Linux](/uk/vps)
- [Raspberry Pi](/uk/install/raspberry-pi)
