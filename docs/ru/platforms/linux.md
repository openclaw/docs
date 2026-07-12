---
read_when:
    - Проверка состояния приложения-компаньона для Linux
    - Планирование поддержки платформ и участия в разработке
    - Отладка завершений процессов из-за нехватки памяти в Linux или с кодом выхода 137 на VPS либо в контейнере
summary: Поддержка Linux и статус приложения-компаньона
title: Приложение для Linux
x-i18n:
    generated_at: "2026-07-12T11:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway полностью поддерживается в Linux. Node — рекомендуемая среда выполнения; Bun
не рекомендуется (из-за известных проблем с WhatsApp/Telegram).

Нативного приложения-компаньона для Linux пока нет. Вклад в разработку приветствуется.

## Быстрый способ (VPS)

1. Установите Node 24 (рекомендуется) или Node 22.19+ (LTS, всё ещё поддерживается).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. На ноутбуке выполните: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Откройте `http://127.0.0.1:18789/` и выполните аутентификацию с помощью настроенного общего
   секрета (по умолчанию — токена; пароля, если `gateway.auth.mode` имеет значение `"password"`).

Полное руководство по серверу: [Сервер Linux](/ru/vps). Пошаговый пример для VPS:
[exe.dev](/ru/install/exe-dev).

## Установка

- [Начало работы](/ru/start/getting-started)
- [Установка и обновления](/ru/install/updating)
- Необязательно: [Bun (экспериментальный)](/ru/install/bun), [Nix](/ru/install/nix), [Docker](/ru/install/docker)

## Служба Gateway (systemd)

Установите одним из следующих способов:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # при появлении запроса выберите "Служба Gateway"
```

Чтобы исправить или перенести существующую установку, выполните:

```bash
openclaw doctor
```

По умолчанию `openclaw gateway install` создаёт **пользовательский** модуль systemd. Полное
руководство по службе, включая вариант модуля **системного** уровня для общих
или постоянно работающих хостов, приведено в [руководстве по эксплуатации Gateway](/ru/gateway#supervision-and-service-lifecycle).

Создавайте модуль вручную только для нестандартной конфигурации. Минимальный пример пользовательского модуля
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

Включите его:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Нехватка памяти и завершение процессов механизмом OOM

В Linux ядро выбирает процесс-жертву OOM, когда на хосте, виртуальной машине или в cgroup контейнера
заканчивается память. Gateway плохо подходит на роль такой жертвы, поскольку он обслуживает долгоживущие
сеансы и подключения к каналам, поэтому OpenClaw по возможности повышает приоритет завершения временных дочерних
процессов.

Для подходящих дочерних процессов в Linux OpenClaw оборачивает команду коротким
скриптом-прокладкой `/bin/sh`, который повышает собственное значение `oom_score_adj` дочернего процесса до `1000`, а затем
с помощью `exec` запускает фактическую команду. Для этого не требуются повышенные привилегии: процесс всегда может увеличить
собственную оценку OOM.

Охватываемые категории дочерних процессов:

- Дочерние процессы команд под управлением супервизора
- Дочерние процессы оболочки PTY
- Дочерние процессы серверов MCP, использующих stdio
- Процессы браузера/Chrome, запущенные OpenClaw (через среду выполнения процессов SDK плагинов)

Обёртка используется только в Linux и пропускается, если `/bin/sh` недоступен или если
в окружении дочернего процесса переменной `OPENCLAW_CHILD_OOM_SCORE_ADJ` присвоено значение `0`, `false`, `no` либо
`off`.

Проверьте дочерний процесс:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Ожидаемое значение для охватываемых дочерних процессов — `1000`; сам процесс Gateway
сохраняет обычное значение (как правило, `0`).

Параметр `OOMPolicy=continue` в модуле systemd сохраняет службу Gateway активной, когда
механизм OOM выбирает временный дочерний процесс, вместо того чтобы помечать весь
модуль как сбойный и перезапускать все каналы; завершившийся дочерний процесс или сеанс сообщает
о собственной ошибке.

Это не заменяет обычную настройку памяти. Если VPS или контейнер регулярно
завершает дочерние процессы, увеличьте лимит памяти, сократите параллелизм или добавьте более строгие
ограничения ресурсов (systemd `MemoryMax=`, лимиты памяти контейнера).

## См. также

- [Обзор установки](/ru/install)
- [Сервер Linux](/ru/vps)
- [Raspberry Pi](/ru/install/raspberry-pi)
- [Руководство по эксплуатации Gateway](/ru/gateway)
- [Настройка Gateway](/ru/gateway/configuration)
