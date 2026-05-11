---
read_when:
    - Додавання або змінення відтворення картки повідомлення, кнопки чи списку вибору
    - Створення Plugin для каналу, який підтримує розширені вихідні повідомлення
    - Зміна представлення інструмента повідомлень або можливостей доставки
    - Налагодження регресій рендерингу карток/блоків/компонентів, специфічних для провайдера
summary: Семантичні картки повідомлень, кнопки, селектори, резервний текст і підказки доставки для Plugin каналів
title: Подання повідомлень
x-i18n:
    generated_at: "2026-05-11T20:48:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

Подання повідомлень — це спільний контракт OpenClaw для насиченого вихідного інтерфейсу чату.
Воно дає агентам, командам CLI, потокам підтвердження та Plugins змогу один раз описати намір повідомлення, тоді як кожен канальний Plugin рендерить найкращу доступну для нього нативну форму.

Використовуйте подання для переносимого інтерфейсу повідомлень:

- текстові секції
- короткий контекстний текст або текст нижнього колонтитула
- розділювачі
- кнопки
- меню вибору
- заголовок і тон картки

Не додавайте нові provider-native поля, як-от Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` або Feishu `card`, до спільного
інструмента повідомлень. Це вихідні дані рендерера, якими володіє канальний Plugin.

## Контракт

Автори Plugin імпортують публічний контракт з:

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

- `value` — це значення дії застосунку, яке маршрутизується назад через наявний
  шлях взаємодії каналу, коли канал підтримує клікабельні елементи керування.
- `url` — це кнопка-посилання. Вона може існувати без `value`.
- `label` є обов’язковим і також використовується в текстовому запасному варіанті.
- `style` має рекомендаційний характер. Рендерери мають зіставляти непідтримувані стилі з безпечним
  стандартним варіантом, а не провалювати надсилання.

Семантика вибору:

- `options[].value` — це вибране значення застосунку.
- `placeholder` має рекомендаційний характер і може ігноруватися каналами без нативної
  підтримки вибору.
- Якщо канал не підтримує елементи вибору, запасний текст перелічує мітки.

## Приклади виробника

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

Кнопка лише з URL-посиланням:

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

Надсилання через CLI:

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

Канальні Plugins оголошують підтримку рендерингу у своєму вихідному адаптері:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Поля можливостей навмисно є простими булевими значеннями. Вони описують, що
рендерер може зробити інтерактивним, а не кожне нативне обмеження платформи. Рендерери все ще
володіють специфічними для платформи обмеженнями, як-от максимальна кількість кнопок, кількість блоків і
розмір картки.

## Основний потік рендерингу

Коли `ReplyPayload` або дія повідомлення містить `presentation`, ядро:

1. Нормалізує payload подання.
2. Розв’язує вихідний адаптер цільового каналу.
3. Читає `presentationCapabilities`.
4. Викликає `renderPresentation`, коли адаптер може рендерити payload.
5. Переходить до консервативного тексту, коли адаптера немає або він не може рендерити.
6. Надсилає отриманий payload через звичайний шлях доставки каналу.
7. Застосовує метадані доставки, як-от `delivery.pin`, після першого успішно
   надісланого повідомлення.

Ядро володіє запасною поведінкою, щоб виробники могли залишатися незалежними від каналу. Канальні
Plugins володіють нативним рендерингом і обробкою взаємодій.

## Правила деградації

Подання має бути безпечним для надсилання в обмежених каналах.

Запасний текст містить:

- `title` як перший рядок
- блоки `text` як звичайні абзаци
- блоки `context` як компактні контекстні рядки
- блоки `divider` як візуальний розділювач
- мітки кнопок, включно з URL для кнопок-посилань
- мітки варіантів вибору

Непідтримувані нативні елементи керування мають деградувати, а не провалювати все надсилання.
Приклади:

- Telegram з вимкненими inline-кнопками надсилає текстовий запасний варіант.
- Канал без підтримки вибору перелічує варіанти вибору як текст.
- Кнопка лише з URL стає або нативною кнопкою-посиланням, або запасним рядком URL.
- Необов’язкові збої закріплення не провалюють доставлене повідомлення.

Головний виняток — `delivery.pin.required: true`; якщо закріплення запитано як
обов’язкове і канал не може закріпити надіслане повідомлення, доставка повідомляє про збій.

## Зіставлення провайдерів

Поточні вбудовані рендерери:

| Канал           | Нативна ціль рендерингу            | Примітки                                                                                                                                          |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Компоненти та контейнери компонентів | Зберігає застарілий `channelData.discord.components` для наявних виробників provider-native payload, але нові спільні надсилання мають використовувати `presentation`. |
| Slack           | Block Kit                           | Зберігає застарілий `channelData.slack.blocks` для наявних виробників provider-native payload, але нові спільні надсилання мають використовувати `presentation`.       |
| Telegram        | Текст плюс inline-клавіатури        | Кнопки/вибори потребують можливості inline-кнопок для цільової поверхні; інакше використовується текстовий запасний варіант.                     |
| Mattermost      | Текст плюс інтерактивні props       | Інші блоки деградують до тексту.                                                                                                                   |
| Microsoft Teams | Adaptive Cards                      | Звичайний текст `message` включається з карткою, коли надано обидва.                                                                              |
| Feishu          | Інтерактивні картки                 | Заголовок картки може використовувати `title`; тіло уникає дублювання цього заголовка.                                                            |
| Звичайні канали | Текстовий запасний варіант          | Канали без рендерера все одно отримують читабельний вивід.                                                                                         |

Сумісність provider-native payload — це перехідна зручність для наявних
виробників відповідей. Це не причина додавати нові спільні нативні поля.

## Подання проти InteractiveReply

`InteractiveReply` — це старіша внутрішня підмножина, яку використовують помічники підтверджень і взаємодій.
Вона підтримує:

- текст
- кнопки
- елементи вибору

`MessagePresentation` — це канонічний спільний контракт надсилання. Він додає:

- заголовок
- тон
- контекст
- розділювач
- кнопки лише з URL
- загальні метадані доставки через `ReplyPayload.delivery`

Використовуйте помічники з `openclaw/plugin-sdk/interactive-runtime` під час зв’язування зі старішим
кодом:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Новий код має приймати або виробляти `MessagePresentation` напряму.

`presentationToInteractiveReply(...)` зберігає видимий текст подання, зіставляючи
заголовок, текст, контекст, кнопки та елементи вибору зі старішою
формою `InteractiveReply`. Рендерери компонентів, які вже нативно малюють заголовок, текст,
контекст і блоки розділювачів, мають натомість використовувати
`presentationToInteractiveControlsReply(...)`, а потім додавати лише
елементи керування кнопок і вибору.

`renderMessagePresentationFallbackText(...)` повертає порожній рядок для
блоків подання, які не мають текстового запасного варіанта, як-от подання лише з розділювачем.
Транспорти, які потребують непорожнього тіла надсилання, можуть передати
`emptyFallback`, щоб увімкнути мінімальне тіло без зміни стандартного контракту запасного варіанта.

## Закріплення доставки

Закріплення — це поведінка доставки, а не подання. Використовуйте `delivery.pin` замість
provider-native полів, як-от `channelData.telegram.pin`.

Семантика:

- `pin: true` закріплює перше успішно доставлене повідомлення.
- `pin.notify` за замовчуванням має значення `false`.
- `pin.required` за замовчуванням має значення `false`.
- Необов’язкові збої закріплення деградують і залишають надіслане повідомлення без змін.
- Обов’язкові збої закріплення провалюють доставку.
- Розбиті на частини повідомлення закріплюють першу доставлену частину, а не останню частину.

Ручні дії повідомлень `pin`, `unpin` і `pins` все ще існують для наявних
повідомлень, де провайдер підтримує ці операції.

## Контрольний список автора Plugin

- Оголошуйте `presentation` з `describeMessageTool(...)`, коли канал може
  рендерити або безпечно деградувати семантичне подання.
- Додайте `presentationCapabilities` до runtime вихідного адаптера.
- Реалізуйте `renderPresentation` у runtime коді, а не в control-plane коді
  налаштування Plugin.
- Тримайте нативні UI-бібліотеки поза гарячими шляхами налаштування/каталогу.
- Зберігайте обмеження платформи в рендерері та тестах.
- Додайте тести запасних варіантів для непідтримуваних кнопок, елементів вибору, URL-кнопок, дублювання заголовка/тексту
  та змішаних надсилань `message` плюс `presentation`.
- Додайте підтримку закріплення доставки через `deliveryCapabilities.pin` і
  `pinDeliveredMessage` лише тоді, коли провайдер може закріпити id надісланого повідомлення.
- Не розкривайте нові provider-native поля карток/блоків/компонентів/кнопок через
  спільну схему дії повідомлення.

## Пов’язані документи

- [CLI повідомлень](/uk/cli/message)
- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Архітектура Plugin](/uk/plugins/architecture-internals#message-tool-schemas)
- [План рефакторингу подання каналів](/uk/plan/ui-channels)
