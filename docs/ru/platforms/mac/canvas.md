---
read_when:
    - Реализация панели Canvas для macOS
    - Добавление элементов управления агентом для визуального рабочего пространства
    - Отладка загрузки canvas в WKWebView
summary: Панель Canvas, управляемая агентом и встроенная через WKWebView + пользовательскую схему URL
title: Холст
x-i18n:
    generated_at: "2026-06-28T23:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Приложение macOS встраивает управляемую агентом **панель Canvas** с помощью `WKWebView`. Это
легкое визуальное рабочее пространство для HTML/CSS/JS, A2UI и небольших интерактивных
поверхностей UI.

## Где находится Canvas

Состояние Canvas хранится в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas отдает эти файлы через **пользовательскую URL-схему**:

- `openclaw-canvas://<session>/<path>`

Примеры:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Если в корне нет `index.html`, приложение показывает **встроенную страницу-заготовку**.

## Поведение панели

- Безрамочная, изменяемая по размеру панель, закрепленная рядом со строкой меню (или курсором мыши).
- Запоминает размер и положение для каждого сеанса.
- Автоматически перезагружается при изменении локальных файлов Canvas.
- Одновременно видна только одна панель Canvas (сеанс переключается при необходимости).

Canvas можно отключить в Настройках → **Разрешить Canvas**. Когда он отключен, команды узла canvas
возвращают `CANVAS_DISABLED`.

## Поверхность API агента

Canvas доступен через **Gateway WebSocket**, поэтому агент может:

- показать/скрыть панель
- перейти к пути или URL
- выполнить JavaScript
- сделать снимок изображения

Примеры CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примечания:

- `canvas.navigate` принимает **локальные пути Canvas**, URL `http(s)` и URL `file://`.
- Если передать `"/"`, Canvas покажет локальную заготовку или `index.html`.

## A2UI в Canvas

A2UI размещается хостом canvas Gateway и отображается внутри панели Canvas.
Когда Gateway объявляет хост Canvas, приложение macOS автоматически переходит на
страницу хоста A2UI при первом открытии.

URL хоста A2UI по умолчанию:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Команды A2UI (v0.8)

Сейчас Canvas принимает сообщения **A2UI v0.8** server→client:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) не поддерживается.

Пример CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Быстрая smoke-проверка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск запусков агента из Canvas

Canvas может запускать новые запуски агента через deep links:

- `openclaw://agent?...`

Пример (в JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Поддерживаемые параметры запроса:

- `message`: предварительно заполненный промпт агента.
- `sessionKey`: стабильный идентификатор сеанса.
- `thinking`: необязательный профиль мышления.
- `deliver`, `to` или `channel`: цель доставки.
- `timeoutSeconds`: необязательное время ожидания запуска.
- `key`: сгенерированный приложением защитный токен для доверенных локальных вызывающих сторон.

Приложение запрашивает подтверждение, если не предоставлен действительный ключ. Ссылки без ключа
показывают сообщение и URL перед подтверждением и игнорируют поля маршрутизации доставки;
ссылки с ключом используют обычный путь запуска Gateway.

## Примечания по безопасности

- Схема Canvas блокирует обход каталогов; файлы должны находиться в корне сеанса.
- Локальный контент Canvas использует пользовательскую схему (сервер local loopback не требуется).
- Внешние URL `http(s)` разрешены только при явном переходе.

## Связанные материалы

- [приложение macOS](/ru/platforms/macos)
- [WebChat](/ru/web/webchat)
