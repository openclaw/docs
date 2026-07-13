---
read_when:
    - Добавление или изменение отображения карточек сообщений, диаграмм, таблиц, кнопок или элементов выбора
    - Создание плагина канала с поддержкой форматированных исходящих сообщений
    - Изменение возможностей представления или доставки инструмента сообщений
    - Отладка регрессий рендеринга карточек, блоков и компонентов, специфичных для провайдера
summary: Семантические карточки сообщений, диаграммы, таблицы, элементы управления, резервный текст и подсказки по доставке для плагинов каналов
title: Представление сообщений
x-i18n:
    generated_at: "2026-07-13T18:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

Представление сообщений — это общий контракт OpenClaw для форматированного интерфейса исходящих сообщений в чатах.
Он позволяет агентам, командам CLI, потокам подтверждения и плагинам однократно описать
назначение сообщения, а каждому плагину канала — отобразить его в наиболее подходящем нативном формате.

Используйте представление для переносимого интерфейса сообщений: текстовых разделов, небольшого контекстного текста или
нижнего колонтитула, разделителей, диаграмм, таблиц, кнопок, меню выбора, а также заголовка и тона карточки.

Не добавляйте в общий инструмент сообщений новые нативные поля провайдеров, такие как Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` или Feishu `card`. Это выходные данные рендерера,
которыми управляет плагин канала.

## Контракт

Авторы плагинов импортируют публичный контракт из:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Структура:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  /** @deprecated Use an action with type "url". */
  url?: string;
  /** @deprecated Use an action with type "web-app". */
  webApp?: { url: string };
  /** @deprecated Use an action with type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
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

- `action.type: "command"` запускает нативную слеш-команду через путь обработки команд
ядра. Используйте это для кнопок и меню встроенных команд.
- `action.type: "callback"` передаёт непрозрачные данные плагина через путь обработки
взаимодействий канала. Плагины каналов не должны интерпретировать данные обратного вызова как слеш-команды.
- `action.type: "approval"` определяет одно сохраняемое подтверждение оператора, его
явный тип `exec` или `plugin` и запрошенное решение. Плагины каналов
кодируют это действие в закрытый для транспорта обратный вызов и разрешают его через
службу подтверждений; они не должны анализировать текст команды `/approve` или определять
тип по идентификатору.
- `action.type: "url"` открывает обычную ссылку.
- `action.type: "web-app"` запускает нативное веб-приложение канала.
- `value` — устаревшее непрозрачное значение обратного вызова. Новые элементы управления должны использовать `action`,
чтобы плагины каналов могли сопоставлять команды и обратные вызовы без догадок по тексту.
- `url`, `webApp` и `web_app` по-прежнему принимаются как устаревшие входные данные на границе.
Нормализаторы сохраняют эти поля, чтобы рендереры могли отличать устаревшую
семантику выпущенных версий от явных типизированных действий. Новые источники должны использовать `action`.
- `label` обязателен и также используется в резервном текстовом представлении.
- `style` носит рекомендательный характер. Рендереры должны заменять неподдерживаемые стили безопасным
значением по умолчанию, а не завершать отправку с ошибкой.
- `priority` необязателен. Если канал объявляет ограничения на количество действий и некоторые элементы управления
необходимо отбросить, ядро в первую очередь сохраняет кнопки с более высоким приоритетом и оставляет
исходный порядок кнопок с одинаковым приоритетом. Если все элементы управления помещаются,
авторский порядок сохраняется.
- `disabled` необязателен. Каналы должны явно включить поддержку с помощью `supportsDisabled`; в противном случае
ядро преобразует отключённый элемент управления в неинтерактивный резервный текст. В
резервном тексте отключённая кнопка всегда отображается только как метка, даже если она
содержит действие `command`.
- `reusable` необязателен. Каналы, поддерживающие повторно используемые нативные обратные вызовы, могут
сохранять доступность действия после успешного взаимодействия. Используйте его для
повторяемых или идемпотентных действий, таких как обновление, просмотр или получение дополнительных сведений;
не задавайте его для обычных одноразовых подтверждений и деструктивных действий.

Семантика выбора:

- `options[].action` принимает только `command` или `callback`; действия подтверждения и ссылки доступны только для кнопок.
- `options[].value` — устаревшее выбранное прикладное значение.
- `placeholder` носит рекомендательный характер и может игнорироваться каналами без нативной
поддержки выбора.
- Если канал не поддерживает элементы выбора, резервный текст перечисляет метки.

Семантика диаграмм:

- `pie` требует положительных значений сегментов.
- `bar`, `area` и `line` используют один упорядоченный массив `categories`. Каждый ряд
предоставляет ровно одно конечное значение для каждой категории в том же порядке.
- Метки категорий и названия рядов должны быть уникальными. Недопустимые или неполные блоки
диаграмм отбрасываются при нормализации, а не изменяют данные без уведомления.
- Нативное отображение диаграмм явно включается через `presentationCapabilities.charts`.
Другие каналы получают заголовок диаграммы, оси, категории, ряды и значения
в виде детерминированного текста. Он также служит резервным вариантом для обеспечения доступности.

Семантика таблиц:

- `caption` — обязательный краткий заголовок. `headers` должен содержать хотя бы одну
уникальную непустую метку столбца.
- `rows` должен содержать хотя бы одну строку. В каждой строке должна быть ровно одна ячейка на
каждый заголовок, а каждая ячейка должна содержать непустую строку или конечное число.
- `rowHeaderColumnIndex` — необязательный индекс с отсчётом от нуля, определяющий столбец,
ячейки которого нативные рендереры должны предоставлять как заголовки строк.
- Нормализация таблицы атомарна. Недопустимый заголовок, заголовок столбца, ширина строки, ячейка
или индекс заголовка строки приводит к отбрасыванию блока таблицы вместо усечения или исправления
его данных.
- Нативное отображение таблиц явно включается через `presentationCapabilities.tables`.
Другие каналы получают заголовок и каждую строку в виде детерминированного линейного
текста со свёрнутыми внутренними пробелами:

  ```text
  Открытая воронка (таблица)
  - Клиент: Acme; Этап: Выиграно; ARR: 125000
  - Клиент: Globex; Этап: Проверка; ARR: 82000
  ```

Отдельного дискриминатора `report` нет. Формируйте отчёт из `title`,
`tone`, `text`, `context`, `chart`, `table` и блоков действий. Благодаря этому каждый
блок можно отображать независимо, а полный отчёт получает такое же
детерминированное резервное текстовое представление.

## Примеры источников

Простая карточка:

```json
{
  "title": "Подтверждение развёртывания",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary готов к продвижению." },
    { "type": "context", "text": "Сборка 1234, тестирование в промежуточной среде пройдено." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Подтвердить",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Отклонить",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Кнопка только со ссылкой URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Примечания к выпуску готовы." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Открыть примечания",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Кнопка мини-приложения Telegram:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Запустить",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Меню выбора:

```json
{
  "title": "Выберите среду",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Среда",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Рабочая среда", "value": "env:prod" }
      ]
    }
  ]
}
```

Диаграмма:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Квартальная выручка",
      "categories": ["1-й квартал", "2-й квартал", "3-й квартал"],
      "series": [
        { "name": "Продукт", "values": [120, 145, 138] },
        { "name": "Услуги", "values": [80, 95, 104] }
      ],
      "xLabel": "Квартал",
      "yLabel": "Выручка"
    }
  ]
}
```

Табличный отчёт:

```json
{
  "title": "Отчёт по воронке",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Текущие возможности по этапам." },
    {
      "type": "table",
      "caption": "Открытая воронка",
      "headers": ["Клиент", "Этап", "ARR"],
      "rows": [
        ["Acme", "Выиграно", 125000],
        ["Globex", "Проверка", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Обновлено из снимка CRM." }
  ]
}
```

Отправка через CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Подтверждение развёртывания" \
  --presentation '{"title":"Подтверждение развёртывания","tone":"warning","blocks":[{"type":"text","text":"Canary готов."},{"type":"buttons","buttons":[{"label":"Подтвердить","value":"deploy:approve","style":"success"},{"label":"Отклонить","value":"deploy:decline","style":"danger"}]}]}'
```

Закреплённая доставка:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Тема открыта" \
  --pin
```

Закреплённая доставка с явным JSON:

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

Плагины каналов объявляют поддержку отображения в своём адаптере исходящих сообщений:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
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

Логические значения возможностей описывают, какие элементы средство визуализации может сделать интерактивными. Необязательные
`limits` описывают универсальную оболочку, которую ядро может адаптировать перед вызовом
средства визуализации:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Перед визуализацией ядро применяет универсальные ограничения к семантическим элементам управления. Средства визуализации
по-прежнему отвечают за окончательную проверку и обрезку с учётом особенностей провайдера: количества нативных блоков,
размера карточки, ограничений URL и особенностей провайдера, которые невозможно выразить
в универсальном контракте. Если ограничения удаляют из блока все элементы управления, ядро сохраняет
метки как неинтерактивный контекстный текст, чтобы у доставленного сообщения оставался
видимый резервный вариант.

## Основной процесс визуализации

В каноническом исходящем пути, используемом CLI и стандартными действиями с сообщениями, ядро:

1. Нормализует полезную нагрузку представления.
2. Определяет исходящий адаптер целевого канала.
3. Считывает `presentationCapabilities`.
4. Применяет универсальные ограничения возможностей, например на количество действий, длину меток и
   количество вариантов выбора, если адаптер их объявляет. Блоки диаграмм и таблиц
   преобразуются в детерминированный текст, если адаптер явно не объявляет
   `charts: true` или `tables: true` соответственно.
5. Вызывает `renderPresentation`, если адаптер может визуализировать полезную нагрузку.
6. Использует консервативный текстовый резервный вариант, если адаптер отсутствует или не может выполнить визуализацию.
7. Отправляет полученную полезную нагрузку через обычный путь доставки канала.
8. Применяет метаданные доставки, например `delivery.pin`, после первой успешно
   отправленной части сообщения.

Локальные для канала пути ответов или предпросмотра, которые напрямую используют `ReplyPayload`,
должны либо входить в этот канонический путь, либо формировать тот же резервный вариант
представления перед преобразованием полезной нагрузки в обычный текст или медиафайлы.

Ядро отвечает за резервное поведение, поэтому источники могут оставаться независимыми от каналов. Плагины
каналов отвечают за нативную визуализацию и обработку взаимодействий.

## Правила упрощения

Представление должно быть безопасно для отправки в каналы с ограниченными возможностями.

Резервный текст включает:

- `title` в первой строке
- блоки `text` как обычные абзацы
- блоки `context` как компактные строки контекста
- блоки `divider` как визуальный разделитель
- метки кнопок, включая URL для кнопок-ссылок
- метки вариантов выбора
- заголовок, тип, оси, категории, ряды и значения диаграммы
- подпись таблицы, заголовки и значения каждой строки

### Видимость резервных значений кнопок

Если канал не может визуализировать интерактивные элементы управления, значения кнопок и вариантов выбора
преобразуются в обычный текст. Резервное поведение сохраняет удобство использования,
не раскрывая непрозрачные данные обратного вызова:

- **Действия типа `command`** визуализируются как `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  Входные данные отображают текст URL рядом с меткой кнопки, поскольку URL
  предназначен для пользователя.
- **Варианты выбора** отображаются только как метки. Базовое значение варианта
  не раскрывается в резервном тексте.

Адаптеры каналов, добавляющие в резервный интерфейс инструкции по ручному вводу команд (например,
инструкции для комментариев к документам Feishu), должны определять наличие команды
по тем же блокам представления, которые использует средство резервной визуализации, чтобы
текст инструкции появлялся только тогда, когда действительно показана команда для ручного ввода.

Неподдерживаемые нативные элементы управления должны упрощаться, а не приводить к сбою всей отправки.
Примеры:

- Telegram с отключёнными встроенными кнопками отправляет резервный текст.
- Канал без поддержки выбора выводит варианты выбора в виде текста.
- Канал без нативной поддержки диаграмм выводит данные диаграммы в виде текста.
- Канал без нативной поддержки таблиц выводит каждую строку таблицы в виде текста.
- Кнопка только с URL становится либо нативной кнопкой-ссылкой, либо резервной строкой с URL.
- Сбои необязательного закрепления не приводят к сбою доставки сообщения.

Основное исключение — `delivery.pin.required: true`; если закрепление указано как
обязательное, а канал не может закрепить отправленное сообщение, доставка завершается с ошибкой.

## Сопоставление провайдеров

Текущие встроенные средства визуализации:

| Канал           | Целевой формат нативной визуализации       | Примечания                                                                                                                                                                                                        |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Компоненты и контейнеры компонентов        | Сохраняет устаревший `channelData.discord.components` для существующих источников нативных полезных нагрузок провайдера, но новые общие отправки должны использовать `presentation`.                                 |
| Feishu          | Интерактивные карточки                     | Заголовок карточки может использовать `title`; основная часть не дублирует этот заголовок.                                                                                                                       |
| Matrix          | Резервный текст и структурированное поле события | Кнопки и варианты выбора объявлены как поддерживаемые, но сейчас каждый блок визуализируется как вывод `renderMessagePresentationFallbackText`, передаваемый в поле события `com.openclaw.presentation`, а не как нативные интерактивные виджеты. |
| Mattermost      | Текст и интерактивные свойства             | Варианты выбора и разделители не поддерживаются; эти блоки преобразуются в текст.                                                                                                                                  |
| Microsoft Teams | Adaptive Cards                             | Обычный текст `message` включается вместе с карточкой, если предоставлены оба варианта. Выбор, стили и отключённое состояние не поддерживаются.                                                                  |
| Slack           | Block Kit                                  | Визуализирует `chart` как нативный `data_visualization`, а `table` — как нативный `data_table`; сохраняет устаревший `channelData.slack.blocks`, но новые общие отправки должны использовать `presentation`. |
| Telegram        | Текст и встроенные клавиатуры              | Для кнопок и вариантов выбора целевая поверхность должна поддерживать встроенные кнопки; в противном случае используется резервный текст.                                                                          |
| Простые каналы  | Резервный текст                            | Каналы без средства визуализации всё равно получают читаемый вывод.                                                                                                                                                |

Совместимость с нативными полезными нагрузками провайдера — это переходная возможность для существующих
источников ответов. Она не является основанием для добавления новых общих нативных полей.

## Представление и InteractiveReply

`InteractiveReply` — более старое внутреннее подмножество, используемое вспомогательными средствами
подтверждения и взаимодействия. Оно поддерживает:

- текст
- кнопки
- варианты выбора

`MessagePresentation` — канонический общий контракт отправки. Он добавляет:

- заголовок
- тон
- контекст
- разделитель
- диаграмму
- таблицу
- кнопки только с URL
- универсальные метаданные доставки через `ReplyPayload.delivery`

При адаптации старого кода используйте вспомогательные средства из
`openclaw/plugin-sdk/interactive-runtime`:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Новый код должен напрямую принимать или создавать `MessagePresentation`. Существующие
полезные нагрузки `interactive` являются устаревшим подмножеством `presentation`; поддержка
во время выполнения сохраняется для старых источников.

Неустаревшие вспомогательные средства, о которых полезно знать:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  проверяют и преобразуют нетипизированную полезную нагрузку (например, JSON из флага CLI
  `--presentation`) в `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` сужает тип блока до объединения
  `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` и
  `resolveMessagePresentationOptionAction(option)` возвращают каноническое типизированное
  действие, принимая устаревшие граничные поля. Явно заданный `action`
  всегда имеет приоритет.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` считывают только скалярные значения
  команд и обратных вызовов. Нескалярное каноническое действие никогда не переходит к
  устаревшему теневому `value`, поэтому идентификаторы подтверждений и цели ссылок сохраняют свои типы.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` преобразуют один блок структурированных
  данных в детерминированный текст для резервных путей конкретного канала.

Устаревшие типы `InteractiveReply*` и вспомогательные средства преобразования помечены
в SDK как `@deprecated`:

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
для устаревших реализаций каналов. Новый код-производитель не должен их вызывать;
отправляйте `presentation`, а адаптация ядра/канала выполнит рендеринг.

Для вспомогательных функций подтверждения также есть замены, ориентированные прежде всего на представление:

- используйте `buildApprovalPresentationFromActionDescriptors(...)` вместо
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- используйте `buildApprovalPresentation(...)` вместо
  `buildApprovalInteractiveReply(...)`
- используйте `buildExecApprovalPresentation(...)` вместо
  `buildExecApprovalInteractiveReply(...)`

Эти поставляемые построители по-прежнему используют команды для совместимости с плагинами. Код Gateway
и встроенных каналов, владеющий устойчивым типом подтверждения, должен использовать
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` или
`buildTypedPluginApprovalPendingReplyPayload(...)`, чтобы транспортные реализации получали
явное действие `approval`, а не выводили семантику из текста `/approve`.

`renderMessagePresentationFallbackText(...)` возвращает пустую строку для
блоков представления без текстового резервного варианта, например представления,
состоящего только из разделителя. Транспортные реализации, которым требуется непустое тело отправки, могут передать
`emptyFallback`, чтобы явно включить минимальное тело без изменения стандартного контракта
резервного варианта.

## Закрепление при доставке

Закрепление относится к поведению доставки, а не к представлению. Используйте `delivery.pin` вместо
нативных полей провайдера, таких как `channelData.telegram.pin`.

Семантика:

- `pin: true` закрепляет первое успешно доставленное сообщение.
- `pin.notify` по умолчанию имеет значение `false`.
- `pin.required` по умолчанию имеет значение `false`.
- Необязательное закрепление при сбое не прерывает доставку и оставляет отправленное сообщение без изменений.
- Сбой обязательного закрепления приводит к сбою доставки.
- Для сообщений, разбитых на части, закрепляется первая доставленная часть, а не последняя.

Ручные действия над сообщениями `pin`, `unpin` и `pins` по-прежнему доступны для существующих
сообщений, если провайдер поддерживает эти операции.

## Контрольный список автора плагина

- Объявите `presentation` из `describeMessageTool(...)`, если канал может
  отображать семантическое представление или безопасно переходить к упрощённому варианту.
- Добавьте `presentationCapabilities` в исходящий адаптер среды выполнения.
- Реализуйте `renderPresentation` в коде среды выполнения, а не в коде
  настройки плагина плоскости управления.
- Не используйте нативные библиотеки пользовательского интерфейса в горячих путях настройки и каталога.
- Объявите общие ограничения возможностей в `presentationCapabilities.limits`, если
  они известны.
- Сохраняйте итоговые ограничения платформы в рендерере и тестах.
- Добавьте тесты резервного варианта для неподдерживаемых диаграмм, таблиц, кнопок, списков выбора, URL-кнопок,
  дублирования заголовка и текста, а также смешанных отправок `message` и `presentation`.
- Добавляйте поддержку закрепления при доставке через `deliveryCapabilities.pin` и
  `pinDeliveredMessage` только тогда, когда провайдер может закрепить идентификатор отправленного сообщения.
- Не предоставляйте новые нативные поля карточек, блоков, компонентов или кнопок провайдера через
  общую схему действий над сообщениями.

## Связанная документация

- [CLI сообщений](/ru/cli/message)
- [Обзор SDK плагинов](/ru/plugins/sdk-overview)
- [Архитектура плагинов](/ru/plugins/architecture-internals#message-tool-schemas)
- [План рефакторинга представления каналов](/ru/plan/ui-channels)
