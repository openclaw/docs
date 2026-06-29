---
read_when:
    - Размещение PeekabooBridge в OpenClaw.app
    - Интеграция Peekaboo через Swift Package Manager
    - Изменение протокола/путей PeekabooBridge
    - Выбор между PeekabooBridge, Codex Computer Use и cua-driver MCP
summary: Интеграция PeekabooBridge для автоматизации интерфейса macOS
title: Мост Peekaboo
x-i18n:
    generated_at: "2026-06-28T23:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw может размещать **PeekabooBridge** как локальный, учитывающий разрешения брокер автоматизации UI. Это позволяет CLI `peekaboo` управлять автоматизацией UI, повторно используя разрешения TCC приложения macOS.

## Что это такое (и чем не является)

- **Хост**: OpenClaw.app может выступать хостом PeekabooBridge.
- **Клиент**: используйте CLI `peekaboo` (без отдельной поверхности `openclaw ui ...`).
- **UI**: визуальные оверлеи остаются в Peekaboo.app; OpenClaw — тонкий хост-брокер.

## Связь с Computer Use

У OpenClaw есть три пути управления рабочим столом, и они намеренно остаются раздельными:

- **Хост PeekabooBridge**: OpenClaw.app может размещать локальный сокет PeekabooBridge.
  CLI `peekaboo` остается клиентом и использует разрешения macOS OpenClaw.app для примитивов автоматизации Peekaboo, таких как снимки экрана, щелчки, меню, диалоги, действия Dock и управление окнами.
- **Codex Computer Use**: встроенный Plugin `codex` подготавливает сервер приложений Codex, проверяет доступность MCP-сервера Codex `computer-use`, а затем позволяет Codex владеть вызовами инструментов нативного управления рабочим столом во время ходов в режиме Codex. OpenClaw не проксирует эти действия через PeekabooBridge.
- **Прямой MCP `cua-driver`**: OpenClaw может зарегистрировать вышестоящий сервер TryCua `cua-driver mcp` как обычный MCP-сервер. Это дает агентам собственные схемы CUA-драйвера и рабочий процесс pid/окно/индекс элемента без маршрутизации через маркетплейс Codex или сокет PeekabooBridge.

Используйте Peekaboo, когда вам нужна широкая поверхность автоматизации macOS и учитывающий разрешения хост-мост OpenClaw.app. Используйте Codex Computer Use, когда агент в режиме Codex должен полагаться на нативный Plugin Codex для computer-use. Используйте прямой `cua-driver mcp`, когда хотите предоставить CUA-драйвер любой среде выполнения, управляемой OpenClaw, как обычный MCP-сервер.

## Включение моста

В приложении macOS:

- Настройки → **Включить Peekaboo Bridge**

Когда включено, OpenClaw запускает локальный сервер UNIX-сокета. Если отключено, хост останавливается, и `peekaboo` вернется к другим доступным хостам.

## Порядок обнаружения клиентов

Клиенты Peekaboo обычно пробуют хосты в таком порядке:

1. Peekaboo.app (полный UX)
2. Claude.app (если установлено)
3. OpenClaw.app (тонкий брокер)

Используйте `peekaboo bridge status --verbose`, чтобы увидеть, какой хост активен и какой путь к сокету используется. Можно переопределить с помощью:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безопасность и разрешения

- Мост проверяет **подписи кода вызывающих клиентов**; применяется allowlist TeamID (TeamID хоста Peekaboo + TeamID приложения OpenClaw).
- Предпочитайте подписанную идентичность моста/приложения вместо универсальной среды выполнения `node` для Accessibility. Предоставление Accessibility для `node` позволяет любому пакету, запущенному этим исполняемым файлом Node, наследовать доступ к автоматизации GUI; см. [разрешения macOS](/ru/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Время ожидания запросов истекает примерно через 10 секунд.
- Если необходимые разрешения отсутствуют, мост возвращает понятное сообщение об ошибке, а не запускает «Системные настройки».

## Поведение снимков (автоматизация)

Снимки хранятся в памяти и автоматически истекают через короткий промежуток времени. Если требуется более длительное хранение, повторно сделайте снимок из клиента.

## Устранение неполадок

- Если `peekaboo` сообщает "bridge client is not authorized", убедитесь, что клиент правильно подписан, или запускайте хост с `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` только в режиме **отладки**.
- Если хосты не найдены, откройте одно из приложений-хостов (Peekaboo.app или OpenClaw.app) и убедитесь, что разрешения предоставлены.

## Связанные материалы

- [приложение macOS](/ru/platforms/macos)
- [разрешения macOS](/ru/platforms/mac/permissions)
