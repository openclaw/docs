---
read_when:
    - Реализация панели Canvas в macOS
    - Добавление элементов управления агентом для визуального рабочего пространства
    - Отладка загрузки canvas в WKWebView
summary: Управляемая агентом панель Canvas, встроенная с помощью WKWebView и пользовательской схемы URL
title: Холст
x-i18n:
    generated_at: "2026-07-13T18:24:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Приложение macOS встраивает управляемую агентом **панель Canvas**, используя `WKWebView`, —
легковесное визуальное рабочее пространство для HTML/CSS/JS, A2UI и небольших
интерактивных интерфейсов.

## Где находится Canvas

Состояние Canvas хранится в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas предоставляет эти файлы через пользовательскую схему URL
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Если в корневом каталоге нет `index.html`, приложение отображает встроенную страницу-заготовку.

## Поведение панели

- Панель без рамки с изменяемым размером, закреплённая рядом со строкой меню (или указателем мыши).
- Запоминает размер и положение для каждого сеанса.
- Автоматически перезагружается при изменении локальных файлов Canvas.
- Одновременно отображается только одна панель Canvas (при необходимости сеансы переключаются).

Canvas можно отключить в Settings -> **Allow Canvas**. Когда он отключён,
команды узла Canvas возвращают `CANVAS_DISABLED`.

## API агента

Canvas доступен через WebSocket Gateway, поэтому агент может отображать и скрывать
панель, переходить по пути или URL, выполнять JavaScript и создавать
снимок:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` принимает локальные пути Canvas, URL `http(s)` и URL `file://`.
Передача `"/"` отображает локальную заготовку или `index.html`.

Целевые ресурсы, размещённые в Gateway по адресам `/__openclaw__/canvas/` и
`/__openclaw__/a2ui/`, разрешаются через текущий URL Canvas с ограниченной областью действия
для сеанса узла. Перед переходом приложение обновляет эту кратковременную возможность;
вам не нужно самостоятельно создавать или копировать URL возможности.

## A2UI в Canvas

A2UI размещается на хосте Canvas в Gateway и отображается внутри панели
Canvas. Когда Gateway объявляет хост Canvas, приложение macOS при первом открытии
автоматически переходит на страницу хоста A2UI.

Объявленный URL ограничен областью действия возможности, например
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Считайте его временными учётными данными, а не постоянной ссылкой.

### Команды A2UI (v0.8)

Canvas принимает сообщения A2UI v0.8 от сервера к клиенту: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
пока не поддерживается.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Если вы можете прочитать это сообщение, отправка A2UI работает."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Быстрая дымовая проверка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Привет от A2UI"
```

## Запуск агентов из Canvas

Canvas может запускать новые сеансы агента через глубокие ссылки `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Поддерживаемые параметры запроса:

| Параметр                   | Значение                                              |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Предварительно заполненный запрос агента.             |
| `sessionKey`               | Стабильный идентификатор сеанса.                      |
| `thinking`                 | Необязательный профиль рассуждений.                   |
| `deliver`, `to`, `channel` | Цель доставки.                                        |
| `timeoutSeconds`           | Необязательный тайм-аут запуска.                      |
| `key`                      | Созданный приложением токен безопасности для доверенных локальных вызывающих сторон. |

Приложение запрашивает подтверждение, если не предоставлен действительный ключ. Ссылки
без ключа перед подтверждением показывают сообщение и URL и игнорируют поля маршрутизации
доставки; ссылки с ключом используют обычный путь запуска через Gateway.

## Примечания по безопасности

- Схема Canvas блокирует обход каталогов; файлы должны находиться в корне сеанса.
- Локальное содержимое Canvas использует пользовательскую схему (loopback-сервер не требуется).
- Внешние URL `http(s)` разрешены только при явном переходе.
- Обычные веб-страницы предназначены только для отображения. Действия агента принимаются только из
  принадлежащей приложению схемы Canvas или из точного документа A2UI в Gateway с ограниченной областью действия возможности,
  выбранного приложением; вложенные фреймы, перенаправления, устаревшие возможности и изменённые
  запросы не могут инициировать действия.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [WebChat](/ru/web/webchat)
