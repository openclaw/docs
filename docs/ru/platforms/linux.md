---
read_when:
    - Поиск статуса вспомогательного приложения для Linux
    - Планирование охвата платформ или вкладов
    - Отладка Linux OOM kills или выхода 137 на VPS или в контейнере
summary: Статус поддержки Linux и сопутствующего приложения
title: Приложение для Linux
x-i18n:
    generated_at: "2026-06-28T23:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway полностью поддерживается в Linux. **Node — рекомендуемая среда выполнения**.
Bun не рекомендуется для Gateway (ошибки WhatsApp/Telegram).

Нативные сопутствующие приложения для Linux запланированы. Вклад приветствуется, если вы хотите помочь создать такое приложение.

## Быстрый путь для начинающих (VPS)

1. Установите Node 24 (рекомендуется; Node 22 LTS, сейчас `22.19+`, по-прежнему работает для совместимости)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. С ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Откройте `http://127.0.0.1:18789/` и выполните аутентификацию с настроенным общим секретом (по умолчанию токен; пароль, если вы задали `gateway.auth.mode: "password"`)

Полное руководство по серверу Linux: [Сервер Linux](/ru/vps). Пошаговый пример VPS: [exe.dev](/ru/install/exe-dev)

## Установка

- [Начало работы](/ru/start/getting-started)
- [Установка и обновления](/ru/install/updating)
- Необязательные сценарии: [Bun (экспериментально)](/ru/install/bun), [Nix](/ru/install/nix), [Docker](/ru/install/docker)

## Gateway

- [Руководство по эксплуатации Gateway](/ru/gateway)
- [Конфигурация](/ru/gateway/configuration)

## Установка сервиса Gateway (CLI)

Используйте один из этих вариантов:

```
openclaw onboard --install-daemon
```

Или:

```
openclaw gateway install
```

Или:

```
openclaw configure
```

При запросе выберите **Сервис Gateway**.

Исправить/мигрировать:

```
openclaw doctor
```

## Управление системой (пользовательский unit systemd)

OpenClaw по умолчанию устанавливает **пользовательский** сервис systemd. Используйте **системный**
сервис для общих или постоянно работающих серверов. `openclaw gateway install` и
`openclaw onboard --install-daemon` уже создают для вас текущий канонический unit;
пишите его вручную только когда нужна пользовательская настройка системы или менеджера сервисов.
Полное руководство по сервису находится в [руководстве по эксплуатации Gateway](/ru/gateway).

Минимальная настройка:

Создайте `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

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

Включите его:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Нагрузка на память и завершения из-за OOM

В Linux ядро выбирает жертву OOM, когда у хоста, VM или cgroup контейнера
заканчивается память. Gateway может быть неудачной жертвой, потому что он владеет долгоживущими
сеансами и подключениями каналов. Поэтому OpenClaw по возможности смещает приоритет так, чтобы
временные дочерние процессы завершались раньше Gateway.

Для подходящих дочерних процессов Linux OpenClaw запускает дочерний процесс через короткую
обертку `/bin/sh`, которая повышает собственное значение `oom_score_adj` дочернего процесса до `1000`, а затем
выполняет `exec` реальной команды. Это непривилегированная операция, поскольку дочерний процесс
только увеличивает собственную вероятность завершения OOM killer.

Покрываемые поверхности дочерних процессов включают:

- дочерние процессы команд под управлением supervisor,
- дочерние процессы оболочки PTY,
- дочерние процессы stdio-серверов MCP,
- запущенные OpenClaw процессы браузера/Chrome.

Обертка работает только в Linux и пропускается, если `/bin/sh` недоступен. Она
также пропускается, если окружение дочернего процесса задает `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` или `off`.

Чтобы проверить дочерний процесс:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Ожидаемое значение для покрываемых дочерних процессов — `1000`. Процесс Gateway должен сохранять
свой обычный показатель, обычно `0`.

Рекомендуемый unit systemd также задает `OOMPolicy=continue`. Это сохраняет
unit Gateway активным, когда временный дочерний процесс выбран OOM killer;
дочерняя команда/сеанс может завершиться ошибкой и сообщить ее без того, чтобы systemd пометил
весь сервис Gateway как сбойный и перезапустил все каналы.

Это не заменяет обычную настройку памяти. Если VPS или контейнер повторно
завершает дочерние процессы, увеличьте лимит памяти, уменьшите параллелизм или добавьте более строгие
средства контроля ресурсов, такие как systemd `MemoryMax=` или лимиты памяти на уровне контейнера.

## См. также

- [Обзор установки](/ru/install)
- [Сервер Linux](/ru/vps)
- [Raspberry Pi](/ru/install/raspberry-pi)
