---
read_when:
    - Добавление или изменение отрисовки карточек сообщений, кнопок или списков выбора
    - Создание Plugin канала с поддержкой расширенных исходящих сообщений
    - Изменение представления инструмента сообщений или возможностей доставки
    - Отладка регрессий рендеринга карточек, блоков и компонентов, специфичных для провайдера
summary: Семантические карточки сообщений, кнопки, списки выбора, резервный текст и подсказки доставки для плагинов каналов
title: Представление сообщений
x-i18n:
    generated_at: "2026-07-02T22:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Представление сообщений — это общий контракт OpenClaw для насыщенного исходящего UI чата.
Оно позволяет агентам, командам CLI, потокам подтверждения и Plugin описывать
намерение сообщения один раз, а каждому Plugin канала — отрисовывать лучшую
доступную нативную форму.

Используйте представление для переносимого UI сообщений:

- текстовые разделы
- небольшой текст контекста/нижнего колонтитула
- разделители
- кнопки
- меню выбора
- заголовок и тон карточки

Не добавляйте в общий инструмент сообщений новые поля, нативные для провайдера,
такие как Discord `components`, Slack `blocks`, Telegram `buttons`, Teams
`card` или Feishu `card`. Это выходные данные рендерера, которыми владеет
Plugin канала.

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

- `action.type: "command"` запускает нативную слеш-команду через путь команд
  ядра. Используйте это для встроенных кнопок команд и меню.
- `action.type: "callback"` переносит непрозрачные данные Plugin через путь
  взаимодействия канала. Plugin каналов не должны переинтерпретировать данные
  обратного вызова как слеш-команды.
- `value` — это устаревшее непрозрачное значение обратного вызова. Новые
  элементы управления должны использовать `action`, чтобы Plugin каналов могли
  сопоставлять команды и обратные вызовы без угадывания по тексту.
- `url` — это кнопка-ссылка. Она может существовать без `value`.
- `webApp` описывает кнопку веб-приложения, нативную для канала. Telegram
  отрисовывает ее как `web_app` и поддерживает ее только в личных чатах.
  `web_app` по-прежнему принимается в свободных JSON-полезных нагрузках для
  совместимости, но производителям TypeScript следует использовать `webApp`.
- `label` обязателен и также используется в текстовом резервном варианте.
- `style` носит рекомендательный характер. Рендереры должны сопоставлять
  неподдерживаемые стили с безопасным значением по умолчанию, а не срывать
  отправку.
- `priority` необязателен. Когда канал объявляет ограничения на действия и
  элементы управления нужно отбросить, ядро сначала сохраняет кнопки с более
  высоким приоритетом и сохраняет исходный порядок среди кнопок с одинаковым
  приоритетом. Когда все элементы управления помещаются, сохраняется авторский
  порядок.
- `disabled` необязателен. Каналы должны явно включить поддержку через
  `supportsDisabled`; иначе ядро деградирует отключенный элемент управления до
  неинтерактивного резервного текста.
- `reusable` необязателен. Каналы, поддерживающие повторно используемые
  нативные обратные вызовы, могут сохранять действие доступным после успешного
  взаимодействия. Используйте это для повторяемых или идемпотентных действий,
  таких как обновление, проверка или дополнительные сведения; не задавайте его
  для обычных одноразовых подтверждений и деструктивных действий.

Семантика выбора:

- `options[].action` имеет то же значение команды/обратного вызова, что и
  кнопка `action`.
- `options[].value` — это устаревшее выбранное значение приложения.
- `placeholder` носит рекомендательный характер и может игнорироваться каналами
  без нативной поддержки выбора.
- Если канал не поддерживает выбор, резервный текст перечисляет метки.

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

Отправка из CLI:

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

Доставка с закреплением и явным JSON:

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

Плагины каналов объявляют поддержку рендеринга в своем исходящем адаптере:

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

Булевы значения возможностей описывают, какие интерактивные элементы может
создавать рендерер. Необязательные `limits` описывают общий конверт, который
ядро может адаптировать перед вызовом рендерера:

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

Ядро применяет общие ограничения к семантическим элементам управления перед
рендерингом. Рендереры по-прежнему отвечают за финальную проверку,
специфичную для провайдера, и усечение для количества нативных блоков, размера
карточки, ограничений URL и особенностей провайдера, которые нельзя выразить в
общем контракте. Если ограничения удаляют из блока все элементы управления,
ядро сохраняет метки как неинтерактивный контекстный текст, чтобы доставленное
сообщение все равно имело видимый резервный вариант.

## Поток рендеринга в ядре

Когда `ReplyPayload` или действие сообщения включает `presentation`, ядро:

1. Нормализует payload презентации.
2. Определяет исходящий адаптер целевого канала.
3. Читает `presentationCapabilities`.
4. Применяет общие ограничения возможностей, такие как количество действий,
   длина метки и количество вариантов выбора, когда адаптер их объявляет.
5. Вызывает `renderPresentation`, когда адаптер может отрендерить payload.
6. Возвращается к консервативному тексту, когда адаптер отсутствует или не
   может выполнить рендеринг.
7. Отправляет получившийся payload через обычный путь доставки канала.
8. Применяет метаданные доставки, такие как `delivery.pin`, после первого
   успешно отправленного сообщения.

Ядро отвечает за резервное поведение, чтобы производители могли оставаться
независимыми от каналов. Плагины каналов отвечают за нативный рендеринг и
обработку взаимодействий.

## Правила деградации

Презентацию должно быть безопасно отправлять в каналы с ограниченными
возможностями.

Резервный текст включает:

- `title` как первую строку
- блоки `text` как обычные абзацы
- блоки `context` как компактные строки контекста
- блоки `divider` как визуальный разделитель
- метки кнопок, включая URL для кнопок-ссылок
- метки вариантов выбора

### Видимость резервных значений кнопок

Когда канал не может отрендерить интерактивные элементы управления, значения
кнопок и вариантов выбора переходят в обычный текст. Резервное поведение
сохраняет удобство использования, оставляя непрозрачные callback-данные
приватными:

- Действия с типом **`command`** рендерятся как `label: \`command\``, чтобы
  пользователи могли скопировать команду и выполнить ее вручную во вводе
  канала.
- Действия с типом **`callback`** и устаревшие поля **`value`** рендерятся
  только как метка. Непрозрачное значение callback не раскрывается в резервном
  тексте.
- Кнопки **`url` / `webApp`** рендерят текст URL рядом с меткой кнопки,
  поскольку URL предназначен для пользователя.
- **Варианты выбора** рендерятся только как метка. Базовое значение варианта
  не раскрывается в резервном тексте.

Адаптеры каналов, которые добавляют инструкции по ручным командам в своем
резервном UI (например, инструкции для комментариев к документам Feishu),
должны определять наличие команды из тех же блоков презентации, которые
использует резервный рендерер, чтобы текст подсказки появлялся только тогда,
когда ручная команда действительно показана.

Неподдерживаемые нативные элементы управления должны деградировать, а не
проваливать всю отправку. Примеры:

- Telegram с отключенными inline-кнопками отправляет текстовый резервный
  вариант.
- Канал без поддержки выбора перечисляет варианты выбора как текст.
- Кнопка только с URL становится либо нативной кнопкой-ссылкой, либо резервной
  строкой с URL.
- Необязательные сбои закрепления не приводят к сбою доставленного сообщения.

Главное исключение — `delivery.pin.required: true`; если закрепление запрошено
как обязательное и канал не может закрепить отправленное сообщение, доставка
сообщает о сбое.

## Сопоставление провайдеров

Текущие встроенные рендереры:

| Канал           | Нативная цель рендеринга            | Примечания                                                                                                                                                  |
| --------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Компоненты и контейнеры компонентов | Сохраняет устаревшие `channelData.discord.components` для существующих производителей нативных для провайдера полезных нагрузок, но новые общие отправки должны использовать `presentation`. |
| Slack           | Block Kit                           | Сохраняет устаревшие `channelData.slack.blocks` для существующих производителей нативных для провайдера полезных нагрузок, но новые общие отправки должны использовать `presentation`.       |
| Telegram        | Текст плюс встроенные клавиатуры    | Кнопки/выборы требуют возможности встроенных кнопок для целевой поверхности; иначе используется текстовый fallback.                                         |
| Mattermost      | Текст плюс интерактивные props      | Другие блоки деградируют до текста.                                                                                                                         |
| Microsoft Teams | Adaptive Cards                      | Обычный текст `message` включается вместе с карточкой, когда предоставлены оба.                                                                              |
| Feishu          | Интерактивные карточки              | Заголовок карточки может использовать `title`; тело избегает дублирования этого заголовка.                                                                   |
| Простые каналы  | Текстовый fallback                  | Каналы без renderer все равно получают читаемый вывод.                                                                                                      |

Совместимость нативных для провайдера полезных нагрузок — это переходное
удобство для существующих производителей ответов. Это не причина добавлять
новые общие нативные поля.

## Presentation и InteractiveReply

`InteractiveReply` — более старое внутреннее подмножество, используемое
помощниками подтверждений и взаимодействий. Оно поддерживает:

- текст
- кнопки
- выборы

`MessagePresentation` — канонический контракт общей отправки. Он добавляет:

- заголовок
- тон
- контекст
- разделитель
- кнопки только с URL
- общие метаданные доставки через `ReplyPayload.delivery`

Используйте помощники из `openclaw/plugin-sdk/interactive-runtime` при связывании
более старого кода:
__OC_I18N_900011__
Новый код должен напрямую принимать или производить `MessagePresentation`.
Существующие полезные нагрузки `interactive` являются устаревшим подмножеством
`presentation`; поддержка в runtime сохраняется для более старых производителей.

Устаревшие типы `InteractiveReply*` и помощники преобразования помечены как
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
`presentationToInteractiveControlsReply(...)` остаются доступными как мосты
renderer для устаревших реализаций каналов. Новый код производителей не должен
их вызывать; отправляйте `presentation` и позвольте адаптации core/канала
обработать рендеринг.

У помощников подтверждений также есть замены, ориентированные сначала на
presentation:

- используйте `buildApprovalPresentationFromActionDescriptors(...)` вместо
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- используйте `buildApprovalPresentation(...)` вместо
  `buildApprovalInteractiveReply(...)`
- используйте `buildExecApprovalPresentation(...)` вместо
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` возвращает пустую строку для
блоков presentation, у которых нет текстового fallback, например presentation
только с разделителем. Транспорты, которым требуется непустое тело отправки,
могут передать `emptyFallback`, чтобы включить минимальное тело без изменения
контракта fallback по умолчанию.

## Закрепление при доставке

Закрепление — это поведение доставки, а не presentation. Используйте
`delivery.pin` вместо нативных для провайдера полей, таких как
`channelData.telegram.pin`.

Семантика:

- `pin: true` закрепляет первое успешно доставленное сообщение.
- `pin.notify` по умолчанию равно `false`.
- `pin.required` по умолчанию равно `false`.
- Необязательные ошибки закрепления деградируют и оставляют отправленное сообщение без изменений.
- Обязательные ошибки закрепления приводят к сбою доставки.
- Разбитые на части сообщения закрепляют первую доставленную часть, а не последнюю.

Ручные действия сообщений `pin`, `unpin` и `pins` все еще существуют для
существующих сообщений, где провайдер поддерживает эти операции.

## Контрольный список автора Plugin

- Объявляйте `presentation` из `describeMessageTool(...)`, когда канал может
  рендерить или безопасно деградировать семантическую presentation.
- Добавьте `presentationCapabilities` в исходящий адаптер runtime.
- Реализуйте `renderPresentation` в коде runtime, а не в коде настройки Plugin
  control-plane.
- Не допускайте попадания нативных UI-библиотек в горячие пути настройки/каталога.
- Объявляйте общие пределы возможностей в `presentationCapabilities.limits`,
  когда они известны.
- Сохраняйте финальные ограничения платформы в renderer и тестах.
- Добавьте тесты fallback для неподдерживаемых кнопок, выборов, URL-кнопок,
  дублирования заголовка/текста и смешанных отправок `message` плюс
  `presentation`.
- Добавляйте поддержку закрепления при доставке через `deliveryCapabilities.pin`
  и `pinDeliveredMessage` только когда провайдер может закрепить идентификатор
  отправленного сообщения.
- Не раскрывайте новые нативные для провайдера поля карточек/блоков/компонентов/кнопок
  через общую схему действий сообщений.

## Связанные документы

- [CLI сообщений](/ru/cli/message)
- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Архитектура Plugin](/ru/plugins/architecture-internals#message-tool-schemas)
- [План рефакторинга presentation каналов](/ru/plan/ui-channels)
