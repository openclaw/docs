---
read_when:
    - Додавання або змінення рендерингу карток повідомлень, кнопок або вибору
    - Створення channel Plugin, що підтримує розширені вихідні повідомлення
    - Змінення представлення інструмента повідомлень або можливостей доставлення
    - Налагодження специфічних для провайдера регресій рендерингу карток/блоків/компонентів
summary: Семантичні картки повідомлень, кнопки, списки вибору, резервний текст і підказки щодо доставки для плагінів каналів
title: Представлення повідомлення
x-i18n:
    generated_at: "2026-06-27T17:54:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Подання повідомлень — це спільний контракт OpenClaw для насиченого вихідного інтерфейсу чату.
Воно дає змогу агентам, командам CLI, потокам затвердження та плагінам один раз описати
намір повідомлення, тоді як кожен плагін каналу відтворює найкращу доступну нативну форму.

Використовуйте подання для переносного інтерфейсу повідомлень:

- текстові секції
- короткий контекстний текст або текст нижнього колонтитула
- роздільники
- кнопки
- меню вибору
- заголовок картки та тон

Не додавайте нові нативні для провайдера поля, як-от Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` або Feishu `card`, до спільного
інструмента повідомлень. Це вихідні дані рендерера, якими володіє плагін каналу.

## Контракт

Автори плагінів імпортують публічний контракт з:

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

- `action.type: "command"` запускає нативну slash-команду через шлях команд
  ядра. Використовуйте це для вбудованих командних кнопок і меню.
- `action.type: "callback"` передає непрозорі дані плагіна через шлях
  взаємодії каналу. Плагіни каналів не повинні переінтерпретовувати callback-дані як slash-команди.
- `value` — це застаріле непрозоре callback-значення. Нові елементи керування мають використовувати `action`,
  щоб плагіни каналів могли зіставляти команди й callback-и без здогадів на основі тексту.
- `url` — це кнопка-посилання. Вона може існувати без `value`.
- `webApp` описує нативну для каналу кнопку вебзастосунку. Telegram відтворює її
  як `web_app` і підтримує її лише в приватних чатах. `web_app` досі
  приймається у вільних JSON-навантаженнях для сумісності, але TypeScript-виробники
  мають використовувати `webApp`.
- `label` є обов’язковим і також використовується в текстовому fallback.
- `style` має рекомендаційний характер. Рендерери мають зіставляти непідтримувані стилі з безпечним
  типовим варіантом, а не провалювати надсилання.
- `priority` необов’язковий. Коли канал оголошує обмеження дій і елементи керування
  потрібно відкинути, ядро спочатку зберігає кнопки з вищим пріоритетом і зберігає
  початковий порядок серед кнопок з однаковим пріоритетом. Коли всі елементи керування вміщуються, авторський
  порядок зберігається.
- `disabled` необов’язковий. Канали мають явно підтримувати це через `supportsDisabled`; інакше
  ядро деградує вимкнений елемент керування до неінтерактивного fallback-тексту.
- `reusable` необов’язковий. Канали, що підтримують повторно використовувані нативні callback-и, можуть
  залишати дію доступною після успішної взаємодії. Використовуйте це для
  повторюваних або ідемпотентних дій, як-от оновлення, перегляд або докладніша інформація;
  не задавайте це для звичайних одноразових затверджень і руйнівних дій.

Семантика вибору:

- `options[].action` має те саме значення команди/callback, що й `action` кнопки.
- `options[].value` — це застаріле вибране значення застосунку.
- `placeholder` має рекомендаційний характер і може ігноруватися каналами без нативної
  підтримки вибору.
- Якщо канал не підтримує вибори, fallback-текст перелічує мітки.

## Приклади виробників

Проста картка:

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

Кнопка-посилання лише з URL:

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

Меню вибору:

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

Надсилання CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Закріплена доставка:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Закріплена доставка з явним JSON:

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

Плагіни каналів оголошують підтримку рендерингу у своєму вихідному адаптері:

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

Булеві значення можливостей описують, що рендерер може зробити інтерактивним. Необов’язкові
`limits` описують загальну оболонку, яку ядро може адаптувати перед викликом
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

Ядро застосовує загальні обмеження до семантичних елементів керування перед рендерингом. Рендерери
все одно володіють фінальною специфічною для провайдера валідацією та обрізанням для кількості нативних блоків,
розміру картки, обмежень URL і особливостей провайдера, які неможливо виразити в
загальному контракті. Якщо обмеження видаляють усі елементи керування з блоку, ядро зберігає
мітки як неінтерактивний контекстний текст, щоб доставлене повідомлення все одно мало
видимий fallback.

## Потік рендерингу ядра

Коли `ReplyPayload` або дія повідомлення містить `presentation`, ядро:

1. Нормалізує payload подання.
2. Визначає вихідний адаптер цільового каналу.
3. Читає `presentationCapabilities`.
4. Застосовує загальні обмеження можливостей, як-от кількість дій, довжина мітки та
   кількість варіантів вибору, коли адаптер їх оголошує.
5. Викликає `renderPresentation`, коли адаптер може відрендерити payload.
6. Повертається до консервативного тексту, коли адаптер відсутній або не може рендерити.
7. Надсилає отриманий payload через звичайний шлях доставки каналу.
8. Застосовує метадані доставки, як-от `delivery.pin`, після першого успішно
   надісланого повідомлення.

Ядро володіє fallback-поведінкою, щоб виробники могли залишатися незалежними від каналу. Плагіни
каналів володіють нативним рендерингом і обробкою взаємодій.

## Правила деградації

Подання має бути безпечним для надсилання в обмежених каналах.

Fallback-текст містить:

- `title` як перший рядок
- блоки `text` як звичайні абзаци
- блоки `context` як компактні контекстні рядки
- блоки `divider` як візуальний роздільник
- мітки кнопок, зокрема URL для кнопок-посилань
- мітки варіантів вибору

Непідтримувані нативні елементи керування мають деградувати, а не провалювати все надсилання.
Приклади:

- Telegram з вимкненими inline-кнопками надсилає текстовий fallback.
- Канал без підтримки вибору перелічує варіанти вибору як текст.
- Кнопка лише з URL стає або нативною кнопкою-посиланням, або fallback-рядком URL.
- Необов’язкові помилки закріплення не провалюють доставлене повідомлення.

Основний виняток — `delivery.pin.required: true`; якщо закріплення запитано як
обов’язкове і канал не може закріпити надіслане повідомлення, доставка повідомляє про помилку.

## Зіставлення провайдерів

Поточні вбудовані рендерери:

| Канал           | Нативна ціль рендерингу             | Примітки                                                                                                                                               |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Компоненти та контейнери компонентів | Зберігає застарілі `channelData.discord.components` для наявних виробників нативних для провайдера payload-ів, але нові спільні надсилання мають використовувати `presentation`. |
| Slack           | Block Kit                           | Зберігає застарілі `channelData.slack.blocks` для наявних виробників нативних для провайдера payload-ів, але нові спільні надсилання мають використовувати `presentation`.       |
| Telegram        | Текст плюс inline-клавіатури        | Кнопки/вибори потребують можливості inline-кнопок для цільової поверхні; інакше використовується текстовий fallback.                                   |
| Mattermost      | Текст плюс інтерактивні props       | Інші блоки деградують до тексту.                                                                                                                       |
| Microsoft Teams | Adaptive Cards                      | Звичайний текст `message` додається до картки, коли надано обидва.                                                                                     |
| Feishu          | Інтерактивні картки                 | Заголовок картки може використовувати `title`; тіло уникає дублювання цього заголовка.                                                                 |
| Звичайні канали | Текстовий fallback                  | Канали без рендерера все одно отримують читабельний вивід.                                                                                             |

Сумісність provider-native payload є перехідною зручністю для наявних
виробників відповідей. Це не причина додавати нові спільні нативні поля.

## Presentation проти InteractiveReply

`InteractiveReply` — це старіша внутрішня підмножина, яку використовують
допоміжні засоби затвердження та взаємодії. Вона підтримує:

- текст
- кнопки
- вибори

`MessagePresentation` — це канонічний спільний контракт надсилання. Він додає:

- заголовок
- тон
- контекст
- розділювач
- кнопки лише з URL
- загальні метадані доставки через `ReplyPayload.delivery`

Використовуйте допоміжні засоби з `openclaw/plugin-sdk/interactive-runtime`,
коли з’єднуєте старіший код:

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

Новий код має напряму приймати або створювати `MessagePresentation`. Наявні
payloads `interactive` є застарілою підмножиною `presentation`; підтримка в
runtime зберігається для старіших виробників.

Застарілі типи `InteractiveReply*` і допоміжні засоби перетворення позначено
як `@deprecated` у SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` і
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` і
`presentationToInteractiveControlsReply(...)` залишаються доступними як мости
рендерера для застарілих реалізацій каналів. Новий код виробників не має їх
викликати; надсилайте `presentation` і дозвольте адаптації core/каналу
обробити рендеринг.

Допоміжні засоби затвердження також мають заміни, що спершу використовують
presentation:

- використовуйте `buildApprovalPresentationFromActionDescriptors(...)` замість
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- використовуйте `buildApprovalPresentation(...)` замість
  `buildApprovalInteractiveReply(...)`
- використовуйте `buildExecApprovalPresentation(...)` замість
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` повертає порожній рядок для
блоків presentation, які не мають текстового fallback, наприклад presentation
лише з розділювачем. Транспорти, які вимагають непорожнього тіла надсилання,
можуть передати `emptyFallback`, щоб увімкнути мінімальне тіло без зміни
стандартного контракту fallback.

## Закріплення доставки

Закріплення — це поведінка доставки, а не presentation. Використовуйте
`delivery.pin` замість provider-native полів, таких як `channelData.telegram.pin`.

Семантика:

- `pin: true` закріплює перше успішно доставлене повідомлення.
- `pin.notify` за замовчуванням дорівнює `false`.
- `pin.required` за замовчуванням дорівнює `false`.
- Необов’язкові помилки закріплення деградують і залишають надіслане повідомлення без змін.
- Обов’язкові помилки закріплення призводять до збою доставки.
- Фрагментовані повідомлення закріплюють перший доставлений фрагмент, а не останній.

Ручні дії повідомлень `pin`, `unpin` і `pins` усе ще існують для наявних
повідомлень, де provider підтримує ці операції.

## Контрольний список автора Plugin

- Оголошуйте `presentation` з `describeMessageTool(...)`, коли канал може
  рендерити або безпечно деградувати семантичну presentation.
- Додайте `presentationCapabilities` до вихідного адаптера runtime.
- Реалізуйте `renderPresentation` у коді runtime, а не в коді налаштування
  Plugin площини керування.
- Не допускайте нативні UI-бібліотеки до гарячих шляхів setup/catalog.
- Оголошуйте загальні обмеження можливостей у `presentationCapabilities.limits`,
  коли вони відомі.
- Зберігайте остаточні обмеження платформи в рендерері і тестах.
- Додайте fallback-тести для непідтримуваних кнопок, виборів, URL-кнопок,
  дублювання заголовка/тексту та змішаних надсилань `message` плюс
  `presentation`.
- Додавайте підтримку закріплення доставки через `deliveryCapabilities.pin` і
  `pinDeliveredMessage` лише тоді, коли provider може закріпити id надісланого
  повідомлення.
- Не відкривайте нові provider-native поля карток/блоків/компонентів/кнопок
  через спільну схему дій повідомлень.

## Пов’язана документація

- [CLI повідомлень](/uk/cli/message)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Архітектура Plugin](/uk/plugins/architecture-internals#message-tool-schemas)
- [План рефакторингу presentation каналів](/uk/plan/ui-channels)
