---
read_when:
    - Рефакторинг интерфейса сообщений канала, интерактивных полезных нагрузок или нативных рендереров каналов
    - Изменение возможностей инструмента сообщений, подсказок доставки или межконтекстных маркеров
    - Отладка веерного импорта Discord Carbon или отложенной загрузки среды выполнения Plugin канала
summary: Разделить семантическое представление сообщений и рендереры нативного UI каналов.
title: План рефакторинга представления каналов
x-i18n:
    generated_at: "2026-06-28T23:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Статус

Реализовано для общих поверхностей агента, CLI, возможностей Plugin и исходящей доставки:

- `ReplyPayload.presentation` передает семантический UI сообщения.
- `ReplyPayload.delivery.pin` передает запросы на закрепление отправленного сообщения.
- Общие действия сообщений предоставляют `presentation`, `delivery` и `pin` вместо нативных для провайдера `components`, `blocks`, `buttons` или `card`.
- Ядро отрисовывает или автоматически упрощает представление через объявленные Plugin возможности исходящей доставки.
- Рендереры Discord, Slack, Telegram, Mattermost, MS Teams и Feishu используют общий контракт.
- Код плоскости управления канала Discord больше не импортирует UI-контейнеры на базе Carbon.

Каноническая документация теперь находится в [Представление сообщений](/ru/plugins/message-presentation).
Сохраните этот план как исторический контекст реализации; обновляйте каноническое руководство
при изменениях контракта, рендерера или поведения резервного варианта.

## Проблема

UI каналов сейчас разделен между несколькими несовместимыми поверхностями:

- Ядро владеет Discord-образным хуком рендерера для межконтекстного использования через `buildCrossContextComponents`.
- Discord `channel.ts` может импортировать нативный Carbon UI через `DiscordUiContainer`, что втягивает зависимости UI времени выполнения в плоскость управления Plugin канала.
- Агент и CLI предоставляют нативные обходные пути полезной нагрузки, такие как Discord `components`, Slack `blocks`, Telegram или Mattermost `buttons`, а также Teams или Feishu `card`.
- `ReplyPayload.channelData` переносит как подсказки транспорта, так и нативные UI-конверты.
- Общая модель `interactive` существует, но она уже, чем более богатые макеты, уже используемые Discord, Slack, Teams, Feishu, LINE, Telegram и Mattermost.

Из-за этого ядро знает о нативных формах UI, ослабляется ленивость времени выполнения Plugin, а агенты получают слишком много специфичных для провайдера способов выразить один и тот же замысел сообщения.

## Цели

- Ядро выбирает лучшее семантическое представление для сообщения на основе объявленных возможностей.
- Расширения объявляют возможности и рендерят семантическое представление в нативные транспортные полезные нагрузки.
- Web Control UI остается отделенным от нативного UI чатов.
- Нативные полезные нагрузки каналов не раскрываются через общую поверхность сообщений агента или CLI.
- Неподдерживаемые функции представления автоматически упрощаются до лучшего текстового представления.
- Поведение доставки, такое как закрепление отправленного сообщения, является общими метаданными доставки, а не представлением.

## Нецели

- Нет shim для обратной совместимости для `buildCrossContextComponents`.
- Нет публичных нативных обходных путей для `components`, `blocks`, `buttons` или `card`.
- Нет импортов нативных UI-библиотек каналов в ядре.
- Нет специфичных для провайдера стыков SDK для встроенных каналов.

## Целевая модель

Добавить принадлежащее ядру поле `presentation` в `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` становится подмножеством `presentation` во время миграции:

- Текстовый блок `interactive` сопоставляется с `presentation.blocks[].type = "text"`.
- Блок кнопок `interactive` сопоставляется с `presentation.blocks[].type = "buttons"`.
- Блок выбора `interactive` сопоставляется с `presentation.blocks[].type = "select"`.

Внешние схемы агента и CLI теперь используют `presentation`; `interactive` остается внутренним устаревшим помощником парсинга/рендеринга для существующих производителей ответов.
Публичный API для производителей считает `interactive` устаревшим. Поддержка времени выполнения
сохраняется, чтобы существующие помощники подтверждений и старые Plugin продолжали
работать, пока новый код испускает `presentation`.

## Метаданные доставки

Добавить принадлежащее ядру поле `delivery` для поведения отправки, которое не является UI.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Семантика:

- `delivery.pin = true` означает закрепить первое успешно доставленное сообщение.
- `notify` по умолчанию равно `false`.
- `required` по умолчанию равно `false`; неподдерживаемые каналы или неудачное закрепление автоматически упрощаются путем продолжения доставки.
- Ручные действия сообщений `pin`, `unpin` и `list-pins` остаются для существующих сообщений.

Текущую привязку темы ACP в Telegram следует перенести из `channelData.telegram.pin = true` в `delivery.pin = true`.

## Контракт возможностей времени выполнения

Добавить хуки рендеринга представления и доставки в исходящий адаптер времени выполнения, а не в Plugin канала плоскости управления.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Поведение ядра:

- Определить целевой канал и адаптер времени выполнения.
- Запросить возможности представления.
- Упростить неподдерживаемые блоки и применить общие ограничения возможностей перед
  рендерингом.
- Вызвать `renderPresentation`.
- Если рендерера нет, преобразовать представление в текстовый резервный вариант.
- После успешной отправки вызвать `pinDeliveredMessage`, когда запрошен и поддерживается `delivery.pin`.

## Сопоставление каналов

Discord:

- Рендерить `presentation` в components v2 и контейнеры Carbon в модулях только времени выполнения.
- Сохранить помощники акцентных цветов в легких модулях.
- Удалить импорты `DiscordUiContainer` из кода Plugin канала плоскости управления.

Slack:

- Рендерить `presentation` в Block Kit.
- Удалить ввод `blocks` для агента и CLI.

Telegram:

- Рендерить текст, контекст и разделители как текст.
- Рендерить действия и выбор как встроенные клавиатуры, когда это настроено и разрешено для целевой поверхности.
- Использовать текстовый резервный вариант, когда встроенные кнопки отключены.
- Перенести закрепление темы ACP в `delivery.pin`.

Mattermost:

- Рендерить действия как интерактивные кнопки, когда это настроено.
- Рендерить остальные блоки как текстовый резервный вариант.

MS Teams:

- Рендерить `presentation` в Adaptive Cards.
- Сохранить ручные действия pin/unpin/list-pins.
- При необходимости реализовать `pinDeliveredMessage`, если поддержка Graph надежна для целевой беседы.

Feishu:

- Рендерить `presentation` в интерактивные карточки.
- Сохранить ручные действия pin/unpin/list-pins.
- При необходимости реализовать `pinDeliveredMessage` для закрепления отправленного сообщения, если поведение API надежно.

LINE:

- Рендерить `presentation` в Flex или шаблонные сообщения, где возможно.
- Откатываться к тексту для неподдерживаемых блоков.
- Удалить UI-полезные нагрузки LINE из `channelData`.

Простые или ограниченные каналы:

- Преобразовывать представление в текст с консервативным форматированием.

## Шаги рефакторинга

1. Повторно применить релизное исправление Discord, которое отделяет `ui-colors.ts` от UI на базе Carbon и удаляет `DiscordUiContainer` из `extensions/discord/src/channel.ts`.
2. Добавить `presentation` и `delivery` в `ReplyPayload`, нормализацию исходящей полезной нагрузки, сводки доставки и полезные нагрузки хуков.
3. Добавить схему `MessagePresentation` и помощники парсера в узком подпути SDK/времени выполнения.
4. Заменить возможности сообщений `buttons`, `cards`, `components` и `blocks` семантическими возможностями представления.
5. Добавить хуки исходящего адаптера времени выполнения для рендеринга представления и закрепления доставки.
6. Заменить построение межконтекстных компонентов на `buildCrossContextPresentation`.
7. Удалить `src/infra/outbound/channel-adapters.ts` и удалить `buildCrossContextComponents` из типов Plugin канала.
8. Изменить `maybeApplyCrossContextMarker`, чтобы он прикреплял `presentation` вместо нативных параметров.
9. Обновить пути отправки plugin-dispatch, чтобы они использовали только семантическое представление и метаданные доставки.
10. Удалить нативные параметры полезной нагрузки агента и CLI: `components`, `blocks`, `buttons` и `card`.
11. Удалить помощники SDK, создающие нативные схемы message-tool, заменив их помощниками схемы представления.
12. Удалить UI/нативные конверты из `channelData`; оставить только транспортные метаданные, пока каждое оставшееся поле не будет проверено.
13. Мигрировать рендереры Discord, Slack, Telegram, Mattermost, MS Teams, Feishu и LINE.
14. Обновить документацию для message CLI, страниц каналов, Plugin SDK и книги рецептов возможностей.
15. Запустить профилирование веерного импорта для Discord и затронутых точек входа каналов.

Шаги 1-11 и 13-14 реализованы в этом рефакторинге для контрактов общего агента, CLI, возможностей Plugin и исходящего адаптера. Шаг 12 остается более глубоким проходом внутренней очистки для приватных транспортных конвертов `channelData` провайдеров. Шаг 15 остается последующей проверкой, если нам нужны количественные числа веерного импорта сверх проверки типов/тестов.

## Тесты

Добавить или обновить:

- Тесты нормализации представления.
- Тесты автоматического упрощения представления для неподдерживаемых блоков.
- Тесты межконтекстного маркера для путей plugin dispatch и доставки ядра.
- Матричные тесты рендеринга каналов для Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE и текстового резервного варианта.
- Тесты схемы message tool, доказывающие, что нативные поля удалены.
- Тесты CLI, доказывающие, что нативные флаги удалены.
- Регрессионный тест ленивости импорта точки входа Discord, покрывающий Carbon.
- Тесты закрепления доставки, покрывающие Telegram и общий резервный вариант.

## Открытые вопросы

- Следует ли реализовать `delivery.pin` для Discord, Slack, MS Teams и Feishu в первом проходе или сначала только для Telegram?
- Должно ли `delivery` со временем поглотить существующие поля, такие как `replyToId`, `replyToCurrent`, `silent` и `audioAsVoice`, или остаться сфокусированным на поведении после отправки?
- Должно ли представление напрямую поддерживать изображения или ссылки на файлы, или пока медиа следует оставить отдельно от макета UI?

## Связанные материалы

- [Обзор каналов](/ru/channels)
- [Представление сообщений](/ru/plugins/message-presentation)
