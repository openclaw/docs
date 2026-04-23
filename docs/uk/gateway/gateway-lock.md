---
read_when:
    - Запуск або налагодження процесу Gateway
    - Діагностика примусового забезпечення одного екземпляра
summary: Захист singleton Gateway через bind WebSocket listener
title: Блокування Gateway
x-i18n:
    generated_at: "2026-04-23T20:53:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Навіщо

- Забезпечити запуск лише одного екземпляра Gateway на базовий порт на тому самому хості; додаткові Gateway мають використовувати ізольовані профілі та унікальні порти.
- Переживати crashes/SIGKILL без залишення застарілих lock-файлів.
- Завершуватися помилкою одразу з чітким повідомленням, коли control port уже зайнятий.

## Механізм

- Gateway прив’язує WebSocket listener (типово `ws://127.0.0.1:18789`) одразу під час запуску через ексклюзивний TCP listener.
- Якщо bind завершується помилкою `EADDRINUSE`, запуск викидає `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- ОС автоматично звільняє listener при будь-якому завершенні процесу, зокрема через crash і SIGKILL — окремий lock-файл або крок очищення не потрібні.
- Під час завершення роботи Gateway закриває WebSocket server і базовий HTTP server, щоб швидко звільнити порт.

## Поверхня помилок

- Якщо порт утримує інший процес, запуск викидає `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Інші помилки bind відображаються як `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Операційні примітки

- Якщо порт зайнятий _іншим_ процесом, помилка буде тією самою; звільніть порт або виберіть інший через `openclaw gateway --port <port>`.
- Застосунок macOS, як і раніше, підтримує власний легкий PID-захист перед запуском Gateway; runtime-блокування забезпечується через bind WebSocket.

## Пов’язане

- [Кілька Gateway](/uk/gateway/multiple-gateways) — запуск кількох екземплярів з унікальними портами
- [Усунення несправностей](/uk/gateway/troubleshooting) — діагностика `EADDRINUSE` і конфліктів портів
