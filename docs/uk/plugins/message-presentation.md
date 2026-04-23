---
read_when:
    - Додавання або змінення рендерингу картки повідомлення, кнопки або select
    - Створення Plugin каналу, що підтримує розширені вихідні повідомлення
    - Змінення можливостей представлення або доставки в інструменті message
    - Налагодження регресій рендерингу карток/block/component, специфічних для провайдера
summary: Семантичні картки повідомлень, кнопки, select, fallback-текст і підказки доставки для Plugin каналів
title: Представлення повідомлень
x-i18n:
    generated_at: "2026-04-23T21:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9052f4c801d6e1fbf4009d34af024dd3b9b0f2af70361833eb8a0abca7383bf9
    source_path: plugins/message-presentation.md
    workflow: 15
---

Представлення повідомлень — це спільний контракт OpenClaw для розширеного UI вихідних чат-повідомлень.
Він дозволяє агентам, командам CLI, потокам схвалення й Plugins один раз описати
намір повідомлення, тоді як кожен Plugin каналу рендерить найкращу native-форму, яку може.

Використовуйте presentation для переносного UI повідомлень:

- текстові секції
- невеликий текст контексту/нижнього колонтитула
- роздільники
- кнопки
- select-меню
- заголовок картки й tone

Не додавайте до спільного
інструмента message нові поля, native для провайдера, як-от `components` у Discord, `blocks` у Slack,
`buttons` у Telegram, `card` у Teams або `card` у Feishu. Це результати рендерингу, якими володіє Plugin каналу.

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

- `value` — це значення дії застосунку, яке маршрутизується назад через
  наявний шлях взаємодії каналу, коли канал підтримує клікабельні елементи керування.
- `url` — це кнопка-посилання. Вона може існувати без `value`.
- `label` є обов’язковим і також використовується в текстовому fallback.
- `style` має консультативний характер. Renderers мають мапити непідтримувані стилі в безпечне
  типове значення, а не завершувати надсилання помилкою.

Семантика select:

- `options[].value` — це вибране значення застосунку.
- `placeholder` має консультативний характер і може ігноруватися каналами без native-
  підтримки select.
- Якщо канал не підтримує selects, fallback-текст перелічує labels.

## Приклади producer

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

Меню select:

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

Pinned delivery:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Pinned delivery з явним JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Контракт renderer-а

Plugins каналів оголошують підтримку рендерингу у своєму outbound adapter:

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

Поля можливостей навмисно є простими boolean-ами. Вони описують те, що
renderer може зробити інтерактивним, а не кожне native-обмеження платформи. Renderer-и все одно
володіють platform-specific-обмеженнями, як-от максимальна кількість кнопок, blocks і
розмір картки.

## Потік рендерингу core

Коли `ReplyPayload` або дія message містить `presentation`, core:

1. Нормалізує payload presentation.
2. Розв’язує outbound adapter цільового каналу.
3. Читає `presentationCapabilities`.
4. Викликає `renderPresentation`, коли adapter може відрендерити payload.
5. Використовує fallback до консервативного тексту, коли adapter відсутній або не може відрендерити.
6. Надсилає результуючий payload через звичайний шлях доставки каналу.
7. Застосовує metadata доставки, як-от `delivery.pin`, після першого успішно
   надісланого повідомлення.

Core володіє fallback-поведінкою, щоб producer-и могли залишатися незалежними від каналів. Plugins каналів
володіють native-рендерингом і обробкою взаємодій.

## Правила деградації

Presentation має бути безпечним для надсилання в обмежених каналах.

Fallback-текст включає:

- `title` як перший рядок
- блоки `text` як звичайні абзаци
- блоки `context` як компактні рядки контексту
- блоки `divider` як візуальний роздільник
- labels кнопок, включно з URL для кнопок-посилань
- labels опцій select

Непідтримувані native-елементи керування мають деградувати, а не ламати все надсилання.
Приклади:

- Telegram із вимкненими inline buttons надсилає текстовий fallback.
- Канал без підтримки select перелічує опції select як текст.
- Кнопка лише з URL стає або native-кнопкою-посиланням, або fallback-рядком URL.
- Необов’язкові збої pin не ламають уже доставлене повідомлення.

Головний виняток — `delivery.pin.required: true`; якщо запитано pin як
обов’язковий, а канал не може pin-нути надіслане повідомлення, доставка повідомляє про збій.

## Мапінг провайдерів

Поточні вбудовані renderers:

| Channel         | Native render target                | Notes                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components і component containers   | Зберігає застарілі `channelData.discord.components` для наявних producer-ів payload-ів, native для провайдера, але нові спільні надсилання мають використовувати `presentation`. |
| Slack           | Block Kit                           | Зберігає застарілі `channelData.slack.blocks` для наявних producer-ів payload-ів, native для провайдера, але нові спільні надсилання мають використовувати `presentation`. |
| Telegram        | Текст плюс inline keyboards         | Buttons/selects потребують можливості inline buttons на цільовій поверхні; інакше використовується текстовий fallback.                          |
| Mattermost      | Текст плюс interactive props        | Інші blocks деградують до тексту.                                                                                                                 |
| Microsoft Teams | Adaptive Cards                      | Простий текст `message` включається до картки, коли надано і його, і картку.                                                                     |
| Feishu          | Interactive cards                   | Заголовок картки може використовувати `title`; тіло уникає дублювання цього заголовка.                                                           |
| Plain channels  | Текстовий fallback                  | Канали без renderer-а все одно отримують читабельний вивід.                                                                                       |

Сумісність з payload-ами, native для провайдера, — це перехідне послаблення для наявних
producer-ів відповідей. Це не причина додавати нові спільні native-поля.

## Presentation проти InteractiveReply

`InteractiveReply` — це старіша внутрішня підмножина, яка використовується в helper-ах для approval та interaction.
Вона підтримує:

- text
- buttons
- selects

`MessagePresentation` — це канонічний спільний контракт надсилання. Він додає:

- title
- tone
- context
- divider
- кнопки лише з URL
- універсальні metadata доставки через `ReplyPayload.delivery`

Використовуйте helper-и з `openclaw/plugin-sdk/interactive-runtime` для мосту зі старішим
кодом:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Новий код має безпосередньо приймати або створювати `MessagePresentation`.

## Delivery Pin

Pin — це поведінка доставки, а не presentation. Використовуйте `delivery.pin` замість
native-полів провайдера, таких як `channelData.telegram.pin`.

Семантика:

- `pin: true` pin-ить перше успішно доставлене повідомлення.
- `pin.notify` типово дорівнює `false`.
- `pin.required` типово дорівнює `false`.
- Необов’язкові збої pin деградують і залишають надіслане повідомлення недоторканим.
- Обов’язкові збої pin призводять до збою доставки.
- Для chunked-повідомлень pin-иться перший доставлений chunk, а не tail chunk.

Ручні дії message `pin`, `unpin` і `pins` усе ще існують для наявних
повідомлень, коли провайдер підтримує ці операції.

## Checklist для автора Plugin

- Оголошуйте `presentation` у `describeMessageTool(...)`, коли канал може
  рендерити або безпечно деградувати semantic presentation.
- Додайте `presentationCapabilities` до runtime outbound adapter.
- Реалізуйте `renderPresentation` у runtime-коді, а не в control-plane-коді
  налаштування Plugin.
- Тримайте native UI-бібліотеки поза гарячими шляхами setup/catalog.
- Зберігайте platform limits у renderer-і та тестах.
- Додавайте fallback-тести для непідтримуваних buttons, selects, URL-buttons, дублювання title/text і змішаних надсилань `message` плюс `presentation`.
- Додавайте підтримку delivery pin через `deliveryCapabilities.pin` і
  `pinDeliveredMessage` лише тоді, коли провайдер може pin-нути id надісланого повідомлення.
- Не відкривайте нові native-поля провайдера для card/block/component/button через
  спільну схему дії message.

## Пов’язана документація

- [CLI Message](/uk/cli/message)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Архітектура Plugin](/uk/plugins/architecture#message-tool-schemas)
- [План рефакторингу presentation каналів](/uk/plan/ui-channels)
