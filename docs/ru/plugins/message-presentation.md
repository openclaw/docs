---
read_when:
    - Добавление или изменение отрисовки карточки сообщения, кнопки или выбора
    - Создание Plugin канала, который поддерживает расширенные исходящие сообщения
    - Изменение представления инструментов сообщений или возможностей доставки
    - Отладка регрессий рендеринга карточек/блоков/компонентов, специфичных для провайдера
summary: Семантические карточки сообщений, кнопки, списки выбора, резервный текст и подсказки доставки для Plugin каналов
title: Представление сообщений
x-i18n:
    generated_at: "2026-06-28T23:19:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Представление сообщений — общий контракт OpenClaw для расширенного исходящего UI чата.
Оно позволяет агентам, командам CLI, потокам подтверждения и plugins один раз описать
намерение сообщения, а каждый channel plugin отрисовывает лучшую доступную нативную форму.

Используйте представление для переносимого UI сообщений:

- текстовые разделы
- небольшой текст контекста/нижнего колонтитула
- разделители
- кнопки
- меню выбора
- заголовок карточки и тон

Не добавляйте новые provider-native поля, такие как Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` или Feishu `card`, в общий
инструмент сообщений. Это выходные данные рендерера, которыми владеет channel plugin.

## Контракт

Авторы Plugin импортируют публичный контракт из:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Форма:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

Семантика кнопок:

- `action.type: "command"` запускает нативную slash-команду через командный
  путь ядра. Используйте это для встроенных командных кнопок и меню.
- `action.type: "callback"` переносит непрозрачные данные Plugin через путь
  взаимодействий канала. Channel plugins не должны переинтерпретировать callback-данные как slash-команды.
- `value` — устаревшее непрозрачное callback-значение. Новые элементы управления должны использовать `action`,
  чтобы channel plugins могли сопоставлять команды и callbacks без догадок по тексту.
- `url` — кнопка-ссылка. Она может существовать без `value`.
- `webApp` описывает кнопку channel-native веб-приложения. Telegram отрисовывает ее
  как `web_app` и поддерживает только в приватных чатах. `web_app` по-прежнему
  принимается в свободных JSON-пейлоадах для совместимости, но TypeScript-производители
  должны использовать `webApp`.
- `label` обязателен и также используется в текстовом fallback.
- `style` носит рекомендательный характер. Рендереры должны сопоставлять неподдерживаемые стили с безопасным
  значением по умолчанию, а не прерывать отправку.
- `priority` необязателен. Когда канал объявляет ограничения действий и элементы управления
  нужно отбросить, ядро сначала сохраняет кнопки с более высоким приоритетом и сохраняет
  исходный порядок среди кнопок с одинаковым приоритетом. Когда все элементы управления помещаются,
  сохраняется авторский порядок.
- `disabled` необязателен. Каналы должны явно включить это через `supportsDisabled`; иначе
  ядро понижает отключенный элемент управления до неинтерактивного fallback-текста.
- `reusable` необязателен. Каналы, поддерживающие повторно используемые нативные callbacks, могут
  оставить действие доступным после успешного взаимодействия. Используйте это для
  повторяемых или идемпотентных действий, таких как обновить, проверить или подробнее;
  не задавайте его для обычных одноразовых подтверждений и разрушительных действий.

Семантика выбора:

- `options[].action` имеет то же значение команды/callback, что и кнопочный `action`.
- `options[].value` — устаревшее выбранное значение приложения.
- `placeholder` носит рекомендательный характер и может игнорироваться каналами без нативной
  поддержки выбора.
- Если канал не поддерживает выбор, fallback-текст перечисляет метки.

## Примеры производителей

Простая карточка:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Кнопка-ссылка только с URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Кнопка Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Меню выбора:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Отправка через CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Закрепленная доставка:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Закрепленная доставка с явным JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Контракт рендерера

Channel plugins объявляют поддержку рендеринга в своем outbound-адаптере:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Логические флаги возможностей описывают, что рендерер может сделать интерактивным. Необязательные
`limits` описывают общий конверт, который ядро может адаптировать перед вызовом
рендерера:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

Ядро применяет общие ограничения к семантическим элементам управления перед рендерингом. Рендереры
по-прежнему владеют финальной provider-specific валидацией и обрезкой для нативного количества блоков,
размера карточки, ограничений URL и особенностей провайдера, которые нельзя выразить в
общем контракте. Если ограничения удаляют каждый элемент управления из блока, ядро сохраняет
метки как неинтерактивный текст контекста, чтобы доставленное сообщение все равно имело
видимый fallback.

## Поток рендеринга ядра

Когда `ReplyPayload` или действие сообщения включает `presentation`, ядро:

1. Нормализует пейлоад представления.
2. Разрешает outbound-адаптер целевого канала.
3. Читает `presentationCapabilities`.
4. Применяет общие ограничения возможностей, такие как количество действий, длина меток и
   количество вариантов выбора, когда адаптер их объявляет.
5. Вызывает `renderPresentation`, когда адаптер может отрисовать пейлоад.
6. Возвращается к консервативному тексту, когда адаптер отсутствует или не может выполнить рендеринг.
7. Отправляет получившийся пейлоад через обычный путь доставки канала.
8. Применяет метаданные доставки, такие как `delivery.pin`, после первого успешно
   отправленного сообщения.

Ядро владеет fallback-поведением, чтобы производители могли оставаться channel-agnostic. Channel
plugins владеют нативным рендерингом и обработкой взаимодействий.

## Правила деградации

Представление должно быть безопасно отправлять в каналах с ограниченными возможностями.

Fallback-текст включает:

- `title` первой строкой
- блоки `text` как обычные абзацы
- блоки `context` как компактные строки контекста
- блоки `divider` как визуальный разделитель
- метки кнопок, включая URL для кнопок-ссылок
- метки вариантов выбора

Неподдерживаемые нативные элементы управления должны деградировать, а не срывать всю отправку.
Примеры:

- Telegram с отключенными inline-кнопками отправляет текстовый fallback.
- Канал без поддержки выбора перечисляет варианты выбора как текст.
- Кнопка только с URL становится либо нативной кнопкой-ссылкой, либо fallback-строкой URL.
- Необязательные ошибки закрепления не приводят к сбою доставленного сообщения.

Главное исключение — `delivery.pin.required: true`; если закрепление запрошено как
обязательное и канал не может закрепить отправленное сообщение, доставка сообщает об ошибке.

## Сопоставление провайдеров

Текущие встроенные рендереры:

| Канал           | Нативная цель рендеринга            | Примечания                                                                                                                                                     |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Компоненты и контейнеры компонентов | Сохраняет устаревшие `channelData.discord.components` для существующих производителей provider-native пейлоадов, но новые общие отправки должны использовать `presentation`. |
| Slack           | Block Kit                           | Сохраняет устаревшие `channelData.slack.blocks` для существующих производителей provider-native пейлоадов, но новые общие отправки должны использовать `presentation`.       |
| Telegram        | Текст плюс inline-клавиатуры        | Кнопки/выбор требуют возможности inline-кнопок для целевой поверхности; иначе используется текстовый fallback.                                                  |
| Mattermost      | Текст плюс интерактивные props      | Остальные блоки деградируют до текста.                                                                                                                         |
| Microsoft Teams | Adaptive Cards                      | Обычный текст `message` включается в карточку, когда предоставлены оба.                                                                                         |
| Feishu          | Интерактивные карточки              | Заголовок карточки может использовать `title`; тело избегает дублирования этого заголовка.                                                                      |
| Простые каналы  | Текстовый fallback                  | Каналы без рендерера все равно получают читаемый вывод.                                                                                                        |

Совместимость с payload в нативном формате провайдера — это временное средство перехода для существующих
производителей ответов. Это не причина добавлять новые общие нативные поля.

## Представление и InteractiveReply

`InteractiveReply` — более старое внутреннее подмножество, используемое вспомогательными
функциями подтверждения и взаимодействия. Оно поддерживает:

- текст
- кнопки
- списки выбора

`MessagePresentation` — канонический общий контракт отправки. Он добавляет:

- заголовок
- тон
- контекст
- разделитель
- кнопки только с URL
- общие метаданные доставки через `ReplyPayload.delivery`

Используйте вспомогательные функции из `openclaw/plugin-sdk/interactive-runtime` при соединении со старым
кодом:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Новый код должен принимать или создавать `MessagePresentation` напрямую. Существующие
payload `interactive` являются устаревшим подмножеством `presentation`; поддержка в runtime
сохраняется для старых производителей.

Устаревшие типы `InteractiveReply*` и вспомогательные функции преобразования помечены
`@deprecated` в SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` и
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` и
`presentationToInteractiveControlsReply(...)` остаются доступными как мосты рендеринга
для устаревших реализаций каналов. Новый код производителей не должен вызывать
их; отправляйте `presentation` и позвольте адаптации в core/канале обработать рендеринг.

У вспомогательных функций подтверждения также есть замены, где приоритет у представления:

- используйте `buildApprovalPresentationFromActionDescriptors(...)` вместо
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- используйте `buildApprovalPresentation(...)` вместо
  `buildApprovalInteractiveReply(...)`
- используйте `buildExecApprovalPresentation(...)` вместо
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` возвращает пустую строку для
блоков представления, у которых нет текстового fallback, например для представления
только с разделителем. Транспорты, которым требуется непустое тело отправки, могут передать
`emptyFallback`, чтобы включить минимальное тело без изменения контракта fallback по умолчанию.

## Закрепление доставки

Закрепление — это поведение доставки, а не представления. Используйте `delivery.pin` вместо
нативных полей провайдера, таких как `channelData.telegram.pin`.

Семантика:

- `pin: true` закрепляет первое успешно доставленное сообщение.
- `pin.notify` по умолчанию равно `false`.
- `pin.required` по умолчанию равно `false`.
- Необязательные ошибки закрепления деградируют и оставляют отправленное сообщение без изменений.
- Обязательные ошибки закрепления приводят к сбою доставки.
- Для сообщений, разбитых на части, закрепляется первая доставленная часть, а не последняя.

Ручные действия сообщений `pin`, `unpin` и `pins` по-прежнему существуют для существующих
сообщений, если провайдер поддерживает эти операции.

## Контрольный список автора Plugin

- Объявляйте `presentation` из `describeMessageTool(...)`, когда канал может
  отрендерить или безопасно деградировать семантическое представление.
- Добавьте `presentationCapabilities` в runtime-адаптер исходящих сообщений.
- Реализуйте `renderPresentation` в runtime-коде, а не в коде настройки Plugin
  на уровне управления.
- Не допускайте попадания нативных UI-библиотек в горячие пути настройки/каталога.
- Объявляйте общие ограничения возможностей в `presentationCapabilities.limits`, когда
  они известны.
- Сохраняйте окончательные ограничения платформы в рендерере и тестах.
- Добавьте fallback-тесты для неподдерживаемых кнопок, списков выбора, URL-кнопок, дублирования заголовка/текста
  и смешанных отправок `message` плюс `presentation`.
- Добавляйте поддержку закрепления доставки через `deliveryCapabilities.pin` и
  `pinDeliveredMessage` только тогда, когда провайдер может закрепить id отправленного сообщения.
- Не раскрывайте новые нативные для провайдера поля карточек/блоков/компонентов/кнопок через
  общую схему действий сообщений.

## Связанные документы

- [CLI сообщений](/ru/cli/message)
- [Обзор SDK Plugin](/ru/plugins/sdk-overview)
- [Архитектура Plugin](/ru/plugins/architecture-internals#message-tool-schemas)
- [План рефакторинга представления каналов](/ru/plan/ui-channels)
