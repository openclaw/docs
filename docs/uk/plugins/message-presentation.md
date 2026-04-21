---
read_when:
    - Додавання або змінення рендерингу картки повідомлення, кнопки чи списку вибору
    - Створення plugin-а каналу, який підтримує розширені вихідні повідомлення
    - Змінення представлення інструментів повідомлень або можливостей доставлення
    - Налагодження регресій рендерингу карток/блоків/компонентів, специфічних для провайдера
summary: Семантичні картки повідомлень, кнопки, списки вибору, резервний текст і підказки щодо доставлення для plugin-ів каналів
title: Представлення повідомлення
x-i18n:
    generated_at: "2026-04-21T20:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Представлення повідомлень

Представлення повідомлень — це спільний контракт OpenClaw для розширеного інтерфейсу вихідного чату.
Він дає змогу агентам, командам CLI, потокам погодження та plugin-ам описати
намір повідомлення один раз, тоді як кожен plugin каналу рендерить найкращу
нативну форму, яку він підтримує.

Використовуйте представлення для переносного інтерфейсу повідомлень:

- текстові секції
- короткий контекстний текст/текст нижнього колонтитула
- роздільники
- кнопки
- меню вибору
- заголовок картки та тон

Не додавайте нові нативні для провайдера поля, такі як Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` або Feishu `card`, до спільного
інструмента повідомлень. Це результати рендерингу, якими володіє plugin каналу.

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
  наявний шлях взаємодії каналу, коли канал підтримує натискні елементи керування.
- `url` — це кнопка-посилання. Вона може існувати без `value`.
- `label` є обов’язковим і також використовується в текстовому резервному варіанті.
- `style` є рекомендаційним. Рендерери мають зіставляти непідтримувані стилі з безпечним
  значенням за замовчуванням, а не завершувати надсилання з помилкою.

Семантика меню вибору:

- `options[].value` — це вибране значення застосунку.
- `placeholder` є рекомендаційним і може ігноруватися каналами без нативної
  підтримки вибору.
- Якщо канал не підтримує меню вибору, резервний текст перелічує мітки.

## Приклади продюсера

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

Закріплене доставлення:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Закріплене доставлення з явним JSON:

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

Plugin-и каналів оголошують підтримку рендерингу у своєму вихідному адаптері:

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

Поля можливостей навмисно прості булеві. Вони описують, що саме
рендерер може зробити інтерактивним, а не кожне обмеження нативної платформи. Рендерери все одно
володіють платформоспецифічними обмеженнями, такими як максимальна кількість кнопок, кількість блоків і
розмір картки.

## Основний потік рендерингу

Коли `ReplyPayload` або дія повідомлення містить `presentation`, ядро:

1. Нормалізує payload представлення.
2. Визначає вихідний адаптер цільового каналу.
3. Зчитує `presentationCapabilities`.
4. Викликає `renderPresentation`, коли адаптер може рендерити payload.
5. Повертається до консервативного тексту, якщо адаптер відсутній або не може рендерити.
6. Надсилає отриманий payload звичайним шляхом доставлення каналу.
7. Застосовує метадані доставлення, такі як `delivery.pin`, після першого успішно
   надісланого повідомлення.

Ядро володіє поведінкою резервного варіанта, щоб продюсери могли залишатися незалежними від каналів. Channel
plugin-и володіють нативним рендерингом і обробленням взаємодій.

## Правила деградації

Представлення має бути безпечним для надсилання в обмежених каналах.

Резервний текст містить:

- `title` як перший рядок
- блоки `text` як звичайні абзаци
- блоки `context` як компактні контекстні рядки
- блоки `divider` як візуальний роздільник
- мітки кнопок, включно з URL для кнопок-посилань
- мітки варіантів вибору

Непідтримувані нативні елементи керування мають деградувати, а не спричиняти збій усього надсилання.
Приклади:

- Telegram із вимкненими вбудованими кнопками надсилає текстовий резервний варіант.
- Канал без підтримки меню вибору перелічує варіанти вибору як текст.
- Кнопка лише з URL стає або нативною кнопкою-посиланням, або резервним рядком URL.
- Необов’язкові збої закріплення не призводять до збою доставленого повідомлення.

Головний виняток — `delivery.pin.required: true`; якщо закріплення запитується як
обов’язкове і канал не може закріпити надіслане повідомлення, доставлення повідомляє про збій.

## Відображення провайдерів

Поточні вбудовані рендерери:

| Канал           | Ціль нативного рендерингу           | Примітки                                                                                                                                          |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components і контейнери компонентів | Зберігає застаріле `channelData.discord.components` для наявних продюсерів payload, нативних для провайдера, але нові спільні надсилання мають використовувати `presentation`. |
| Slack           | Block Kit                           | Зберігає застаріле `channelData.slack.blocks` для наявних продюсерів payload, нативних для провайдера, але нові спільні надсилання мають використовувати `presentation`.       |
| Telegram        | Текст плюс вбудовані клавіатури     | Кнопки/меню вибору вимагають можливості вбудованих кнопок для цільової поверхні; інакше використовується текстовий резервний варіант.          |
| Mattermost      | Текст плюс інтерактивні props       | Інші блоки деградують до тексту.                                                                                                                 |
| Microsoft Teams | Adaptive Cards                      | Простий текст `message` включається разом із карткою, коли надано обидва.                                                                        |
| Feishu          | Інтерактивні картки                 | Заголовок картки може використовувати `title`; тіло уникає дублювання цього заголовка.                                                           |
| Прості канали   | Текстовий резервний варіант         | Канали без рендерера все одно отримують читабельний вивід.                                                                                       |

Сумісність із payload, нативними для провайдера, є перехідною можливістю для наявних
продюсерів відповідей. Це не причина додавати нові спільні нативні поля.

## Presentation проти InteractiveReply

`InteractiveReply` — це старіша внутрішня підмножина, яка використовується засобами погодження та взаємодії. Вона підтримує:

- текст
- кнопки
- меню вибору

`MessagePresentation` — це канонічний спільний контракт надсилання. Він додає:

- заголовок
- тон
- контекст
- роздільник
- кнопки лише з URL
- загальні метадані доставлення через `ReplyPayload.delivery`

Використовуйте допоміжні функції з `openclaw/plugin-sdk/interactive-runtime` під час мосту зі старішим
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

## Закріплення доставлення

Закріплення — це поведінка доставлення, а не представлення. Використовуйте `delivery.pin` замість
нативних для провайдера полів, таких як `channelData.telegram.pin`.

Семантика:

- `pin: true` закріплює перше успішно доставлене повідомлення.
- `pin.notify` за замовчуванням дорівнює `false`.
- `pin.required` за замовчуванням дорівнює `false`.
- Необов’язкові збої закріплення деградують і залишають надіслане повідомлення недоторканим.
- Обов’язкові збої закріплення призводять до збою доставлення.
- Фрагментовані повідомлення закріплюють перший доставлений фрагмент, а не хвостовий.

Ручні дії повідомлень `pin`, `unpin` і `pins` усе ще існують для наявних
повідомлень, де провайдер підтримує ці операції.

## Контрольний список автора plugin-а

- Оголосіть `presentation` з `describeMessageTool(...)`, коли канал може
  рендерити або безпечно деградувати семантичне представлення.
- Додайте `presentationCapabilities` до runtime вихідного адаптера.
- Реалізуйте `renderPresentation` у runtime коді, а не в control-plane коді
  налаштування plugin-а.
- Не допускайте потрапляння нативних бібліотек інтерфейсу в гарячі шляхи налаштування/каталогу.
- Зберігайте платформні обмеження в рендерері та тестах.
- Додайте резервні тести для непідтримуваних кнопок, меню вибору, кнопок URL, дублювання title/text і змішаних надсилань `message` плюс `presentation`.
- Додайте підтримку закріплення доставлення через `deliveryCapabilities.pin` і
  `pinDeliveredMessage` лише тоді, коли провайдер може закріпити id надісланого повідомлення.
- Не відкривайте нові нативні для провайдера поля card/block/component/button через
  спільну схему дій повідомлень.

## Пов’язана документація

- [Message CLI](/cli/message)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Архітектура plugin-ів](/uk/plugins/architecture#message-tool-schemas)
- [План рефакторингу представлення каналів](/uk/plan/ui-channels)
