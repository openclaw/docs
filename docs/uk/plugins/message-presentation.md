---
read_when:
    - Додавання або змінення рендерингу карток повідомлень, кнопок або вибірок
    - Створення channel plugin-а, який підтримує розширені вихідні повідомлення
    - Зміна представлення інструментів повідомлень або можливостей доставки
    - Налагодження регресій рендерингу карток/блоків/компонентів, специфічних для провайдера
summary: Семантичні картки повідомлень, кнопки, вибірки, резервний текст і підказки щодо доставки для channel plugin-ів
title: Представлення повідомлень
x-i18n:
    generated_at: "2026-04-24T03:06:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

Представлення повідомлень — це спільний контракт OpenClaw для розширеного інтерфейсу вихідного чату.
Він дає змогу агентам, командам CLI, потокам погодження та plugin-ам один раз описати
намір повідомлення, тоді як кожен channel plugin рендерить найкращу доступну
нативну форму.

Використовуйте presentation для переносного UI повідомлень:

- текстові секції
- невеликий контекстний текст/текст нижнього колонтитула
- роздільники
- кнопки
- меню вибору
- заголовок і тон картки

Не додавайте нові нативні для провайдера поля, такі як Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` або Feishu `card`, до спільного
інструмента повідомлень. Це вихідні дані рендерера, якими володіє channel plugin.

## Контракт

Автори plugin-ів імпортують публічний контракт із:

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

- `value` — це значення дії застосунку, яке спрямовується назад через
  наявний шлях взаємодії каналу, коли канал підтримує клікабельні елементи керування.
- `url` — це кнопка-посилання. Вона може існувати без `value`.
- `label` є обов’язковим і також використовується в текстовому резервному варіанті.
- `style` має рекомендаційний характер. Рендерери мають зіставляти непідтримувані стилі з безпечним
  варіантом за замовчуванням, а не завершувати надсилання з помилкою.

Семантика меню вибору:

- `options[].value` — це вибране значення застосунку.
- `placeholder` має рекомендаційний характер і може ігноруватися каналами без нативної
  підтримки меню вибору.
- Якщо канал не підтримує меню вибору, резервний текст перелічує мітки.

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

Доставка із закріпленням:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Доставка із закріпленням і явним JSON:

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

Channel plugin-и оголошують підтримку рендерингу у своєму вихідному адаптері:

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

Поля можливостей навмисно зроблені простими булевими значеннями. Вони описують, що
рендерер може зробити інтерактивним, а не кожне нативне обмеження платформи. Рендерери як і раніше
володіють платформоспецифічними обмеженнями, такими як максимальна кількість кнопок, кількість блоків і розмір картки.

## Основний потік рендерингу

Коли `ReplyPayload` або дія повідомлення містить `presentation`, core:

1. Нормалізує payload presentation.
2. Визначає вихідний адаптер цільового каналу.
3. Зчитує `presentationCapabilities`.
4. Викликає `renderPresentation`, коли адаптер може відрендерити payload.
5. Повертається до консервативного тексту, коли адаптер відсутній або не може виконати рендеринг.
6. Надсилає отриманий payload звичайним шляхом доставки каналу.
7. Застосовує метадані доставки, такі як `delivery.pin`, після першого успішно
   надісланого повідомлення.

Core володіє поведінкою резервного варіанта, щоб виробники могли залишатися незалежними від каналів. Channel
plugin-и володіють нативним рендерингом і обробкою взаємодій.

## Правила деградації

Presentation має бути безпечним для надсилання в обмежених каналах.

Резервний текст містить:

- `title` як перший рядок
- блоки `text` як звичайні абзаци
- блоки `context` як компактні контекстні рядки
- блоки `divider` як візуальний роздільник
- мітки кнопок, включно з URL для кнопок-посилань
- мітки опцій меню вибору

Непідтримувані нативні елементи керування мають деградувати, а не призводити до помилки всього надсилання.
Приклади:

- Telegram із вимкненими inline-кнопками надсилає текстовий резервний варіант.
- Канал без підтримки меню вибору перелічує опції вибору як текст.
- Кнопка лише з URL перетворюється або на нативну кнопку-посилання, або на резервний рядок URL.
- Необов’язкові збої закріплення не призводять до помилки доставленого повідомлення.

Головний виняток — `delivery.pin.required: true`; якщо закріплення запитано як
обов’язкове і канал не може закріпити надіслане повідомлення, доставка повідомляє про помилку.

## Відображення провайдерів

Поточні вбудовані рендерери:

| Канал           | Ціль нативного рендерингу           | Примітки                                                                                                                                          |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components і контейнери компонентів | Зберігає застаріле `channelData.discord.components` для наявних виробників payload, нативних для провайдера, але нові спільні надсилання мають використовувати `presentation`. |
| Slack           | Block Kit                           | Зберігає застаріле `channelData.slack.blocks` для наявних виробників payload, нативних для провайдера, але нові спільні надсилання мають використовувати `presentation`. |
| Telegram        | Текст плюс inline-клавіатури        | Кнопки/меню вибору вимагають можливості inline-кнопок для цільової поверхні; інакше використовується текстовий резервний варіант.                |
| Mattermost      | Текст плюс інтерактивні props       | Інші блоки деградують до тексту.                                                                                                                  |
| Microsoft Teams | Adaptive Cards                      | Звичайний текст `message` включається разом із карткою, коли надано обидва варіанти.                                                             |
| Feishu          | Інтерактивні картки                 | Заголовок картки може використовувати `title`; тіло уникає дублювання цього заголовка.                                                           |
| Plain channels  | Текстовий резервний варіант         | Канали без рендерера все одно отримують придатний для читання вивід.                                                                              |

Сумісність із payload, нативними для провайдера, є перехідною можливістю для наявних
виробників відповідей. Це не причина додавати нові спільні нативні поля.

## Presentation проти InteractiveReply

`InteractiveReply` — це старіша внутрішня підмножина, яку використовують помічники для погодження та взаємодії.
Вона підтримує:

- текст
- кнопки
- меню вибору

`MessagePresentation` — це канонічний спільний контракт надсилання. Він додає:

- заголовок
- тон
- context
- divider
- кнопки лише з URL
- загальні метадані доставки через `ReplyPayload.delivery`

Використовуйте помічники з `openclaw/plugin-sdk/interactive-runtime` під час мостування старішого
коду:

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

Закріплення — це поведінка доставки, а не presentation. Використовуйте `delivery.pin` замість
нативних для провайдера полів, таких як `channelData.telegram.pin`.

Семантика:

- `pin: true` закріплює перше успішно доставлене повідомлення.
- Значення `pin.notify` за замовчуванням — `false`.
- Значення `pin.required` за замовчуванням — `false`.
- Необов’язкові збої закріплення деградують і залишають надіслане повідомлення без змін.
- Обов’язкові збої закріплення призводять до помилки доставки.
- Для повідомлень, надісланих частинами, закріплюється перша доставлена частина, а не остання.

Ручні дії повідомлень `pin`, `unpin` і `pins` усе ще існують для наявних
повідомлень там, де провайдер підтримує ці операції.

## Контрольний список для авторів plugin-ів

- Оголошуйте `presentation` з `describeMessageTool(...)`, коли канал може
  рендерити або безпечно деградувати семантичне presentation.
- Додайте `presentationCapabilities` до runtime outbound adapter.
- Реалізуйте `renderPresentation` у runtime-коді, а не в коді налаштування plugin-а
  рівня control plane.
- Не допускайте нативних UI-бібліотек у гарячі шляхи налаштування/каталогу.
- Зберігайте платформні обмеження в рендерері та тестах.
- Додайте резервні тести для непідтримуваних кнопок, меню вибору, URL-кнопок, дублювання title/text
  і змішаних надсилань `message` плюс `presentation`.
- Додайте підтримку закріплення доставки через `deliveryCapabilities.pin` і
  `pinDeliveredMessage` лише тоді, коли провайдер може закріпити id надісланого повідомлення.
- Не відкривайте нові нативні для провайдера поля карток/блоків/компонентів/кнопок через
  спільну схему дій повідомлень.

## Пов’язані документи

- [Message CLI](/uk/cli/message)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Архітектура plugin-ів](/uk/plugins/architecture-internals#message-tool-schemas)
- [План рефакторингу представлення каналів](/uk/plan/ui-channels)
