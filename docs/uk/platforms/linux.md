---
read_when:
    - Пошук відомостей про стан супутнього застосунку для Linux
    - Планування підтримки платформ або внесків
    - Налагодження завершень через нестачу пам’яті (OOM) у Linux або з кодом виходу 137 на VPS чи в контейнері
summary: Підтримка Linux і статус застосунку-компаньйона
title: Застосунок для Linux
x-i18n:
    generated_at: "2026-07-12T13:22:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway повністю підтримується в Linux. Node — рекомендоване середовище виконання; Bun
не рекомендується (через відомі проблеми з WhatsApp/Telegram).

Нативного допоміжного застосунку для Linux поки немає. Внески вітаються.

## Швидкий шлях (VPS)

1. Установіть Node 24 (рекомендовано) або Node 22.19+ (LTS, усе ще підтримується).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. На своєму ноутбуці виконайте: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` й автентифікуйтеся за допомогою налаштованого спільного
   секрету (типово — токена; пароля, якщо `gateway.auth.mode` має значення `"password"`).

Повний посібник із сервера: [Сервер Linux](/uk/vps). Покроковий приклад для VPS:
[exe.dev](/uk/install/exe-dev).

## Установлення

- [Початок роботи](/uk/start/getting-started)
- [Установлення й оновлення](/uk/install/updating)
- Необов’язково: [Bun (експериментально)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Служба Gateway (systemd)

Установіть одним із таких способів:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # виберіть "Служба Gateway", коли з’явиться запит
```

Щоб виправити або перенести наявне встановлення, виконайте:

```bash
openclaw doctor
```

`openclaw gateway install` типово створює **користувацький** модуль systemd. Повні
рекомендації щодо служби, включно з варіантом модуля **системного** рівня для спільних
або постійно активних вузлів, наведено в [посібнику з експлуатації Gateway](/uk/gateway#supervision-and-service-lifecycle).

Створюйте модуль вручну лише для нестандартного налаштування. Мінімальний приклад користувацького модуля
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Увімкніть його:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Нестача пам’яті та завершення процесів через OOM

У Linux ядро вибирає жертву OOM, коли на вузлі, віртуальній машині або в cgroup контейнера
закінчується пам’ять. Gateway — невдалий вибір для завершення, оскільки він керує довготривалими
сеансами та з’єднаннями каналів, тому OpenClaw за можливості надає пріоритет завершенню тимчасових дочірніх
процесів.

Для відповідних дочірніх процесів, запущених у Linux, OpenClaw обгортає команду короткою
проміжною оболонкою `/bin/sh`, яка підвищує власне значення `oom_score_adj` дочірнього процесу до `1000`, а потім
за допомогою `exec` запускає справжню команду. Для цього не потрібні привілеї: процес завжди може підвищити
власну оцінку OOM.

Охоплені типи дочірніх процесів:

- Дочірні процеси команд під керуванням супервізора
- Дочірні процеси оболонки PTY
- Дочірні процеси серверів MCP зі стандартним введенням-виведенням
- Процеси браузера/Chrome, запущені OpenClaw (через середовище виконання процесів SDK Plugin)

Обгортка працює лише в Linux і пропускається, коли `/bin/sh` недоступний або коли
середовище дочірнього процесу задає для `OPENCLAW_CHILD_OOM_SCORE_ADJ` значення `0`, `false`, `no` чи
`off`.

Перевірте дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для охоплених дочірніх процесів — `1000`; сам процес Gateway
зберігає звичайне значення (зазвичай `0`).

Параметр `OOMPolicy=continue` у модулі systemd залишає службу Gateway активною, коли
засіб OOM-завершення вибирає тимчасовий дочірній процес, замість того щоб позначати весь
модуль як несправний і перезапускати всі канали; завершений дочірній процес або сеанс повідомляє про
власну помилку.

Це не замінює звичайного налаштування пам’яті. Якщо VPS або контейнер неодноразово
завершує дочірні процеси, збільште ліміт пам’яті, зменште паралелізм або додайте суворіші
засоби керування ресурсами (systemd `MemoryMax=`, обмеження пам’яті контейнера).

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Сервер Linux](/uk/vps)
- [Raspberry Pi](/uk/install/raspberry-pi)
- [Посібник з експлуатації Gateway](/uk/gateway)
- [Конфігурація Gateway](/uk/gateway/configuration)
