---
read_when:
    - Рефакторинг UI повідомлень каналу, інтерактивних корисних навантажень або нативних засобів візуалізації каналу
    - Зміна можливостей інструментів повідомлень, підказок доставки або міжконтекстних маркерів
    - Налагодження fanout імпорту Discord Carbon або лінивості середовища виконання plugin каналу
summary: Відокремте семантичне представлення повідомлень від нативних засобів візуалізації UI каналу.
title: План рефакторингу представлення каналу
x-i18n:
    generated_at: "2026-04-21T20:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# План рефакторингу представлення каналу

## Статус

Реалізовано для спільного агента, CLI, можливостей plugin і поверхонь вихідної доставки:

- `ReplyPayload.presentation` містить семантичний UI повідомлення.
- `ReplyPayload.delivery.pin` містить запити на закріплення надісланих повідомлень.
- Спільні дії повідомлень надають `presentation`, `delivery` і `pin` замість нативних для провайдера `components`, `blocks`, `buttons` або `card`.
- Ядро рендерить або автоматично деградує presentation через оголошені plugin можливості вихідної доставки.
- Рендерери Discord, Slack, Telegram, Mattermost, MS Teams і Feishu споживають узагальнений контракт.
- Код control plane каналу Discord більше не імпортує UI-контейнери на основі Carbon.

Канонічна документація тепер розміщена в [Представлення повідомлень](/uk/plugins/message-presentation).
Зберігайте цей план як історичний контекст реалізації; оновлюйте канонічний посібник
для змін у контракті, рендерері або поведінці fallback.

## Проблема

UI каналу зараз розділений між кількома несумісними поверхнями:

- Ядро володіє хук-рендерером міжконтекстного представлення у формі Discord через `buildCrossContextComponents`.
- `channel.ts` Discord може імпортувати нативний Carbon UI через `DiscordUiContainer`, що підтягує залежності UI середовища виконання в control plane plugin каналу.
- Агент і CLI надають escape hatch для нативних payload, як-от Discord `components`, Slack `blocks`, Telegram або Mattermost `buttons`, а також Teams або Feishu `card`.
- `ReplyPayload.channelData` містить як підказки транспорту, так і нативні UI-конверти.
- Загальна модель `interactive` існує, але вона вужча, ніж багатші макети, які вже використовуються в Discord, Slack, Teams, Feishu, LINE, Telegram і Mattermost.

Через це ядро знає про форми нативного UI, послаблюється лінивість середовища виконання plugin, а агенти отримують забагато специфічних для провайдера способів вираження одного й того самого наміру повідомлення.

## Цілі

- Ядро визначає найкраще семантичне представлення повідомлення на основі оголошених можливостей.
- Extensions оголошують можливості та рендерять семантичне представлення в нативні transport payload.
- Web Control UI залишається окремим від нативного UI чату.
- Нативні channel payload не доступні через спільну поверхню повідомлень агента або CLI.
- Непідтримувані можливості представлення автоматично деградують до найкращого текстового представлення.
- Поведінка доставки, така як закріплення надісланого повідомлення, є узагальненими метаданими доставки, а не представленням.

## Нецілі

- Жодного shim зворотної сумісності для `buildCrossContextComponents`.
- Жодних публічних нативних escape hatch для `components`, `blocks`, `buttons` або `card`.
- Жодних імпортів у ядрі бібліотек UI, нативних для каналу.
- Жодних специфічних для провайдера SDK seam для вбудованих каналів.

## Цільова модель

Додати до `ReplyPayload` поле `presentation`, яким володіє ядро.

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

`interactive` під час міграції стає підмножиною `presentation`:

- Блок тексту `interactive` відображається в `presentation.blocks[].type = "text"`.
- Блок кнопок `interactive` відображається в `presentation.blocks[].type = "buttons"`.
- Блок вибору `interactive` відображається в `presentation.blocks[].type = "select"`.

Зовнішні схеми агента і CLI тепер використовують `presentation`; `interactive` залишається внутрішнім legacy helper для парсингу/рендерингу для наявних продуцентів відповідей.

## Метадані доставки

Додати поле `delivery`, яким володіє ядро, для поведінки надсилання, що не є UI.

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

- `delivery.pin = true` означає закріпити перше успішно доставлене повідомлення.
- `notify` типово дорівнює `false`.
- `required` типово дорівнює `false`; непідтримувані канали або помилки під час закріплення автоматично деградують шляхом продовження доставки.
- Ручні дії повідомлень `pin`, `unpin` і `list-pins` залишаються для наявних повідомлень.

Поточну прив’язку теми Telegram ACP слід перенести з `channelData.telegram.pin = true` до `delivery.pin = true`.

## Контракт можливостей середовища виконання

Додати presentation і delivery hooks рендерингу до runtime outbound adapter, а не до plugin каналу control plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

Поведінка ядра:

- Визначити цільовий канал і runtime adapter.
- Запитати можливості presentation.
- Деградувати непідтримувані блоки перед рендерингом.
- Викликати `renderPresentation`.
- Якщо рендерер відсутній, перетворити presentation на текстовий fallback.
- Після успішного надсилання викликати `pinDeliveredMessage`, коли запитано `delivery.pin` і це підтримується.

## Відображення каналів

Discord:

- Рендерити `presentation` у components v2 і Carbon-контейнери в модулях лише для runtime.
- Зберегти helper для accent color у легких модулях.
- Прибрати імпорти `DiscordUiContainer` з коду control plane plugin каналу.

Slack:

- Рендерити `presentation` у Block Kit.
- Прибрати вхідний параметр `blocks` з агента і CLI.

Telegram:

- Рендерити text, context і divider як текст.
- Рендерити actions і select як inline keyboard, коли це налаштовано і дозволено для цільової поверхні.
- Використовувати текстовий fallback, коли inline button вимкнено.
- Перенести закріплення теми ACP до `delivery.pin`.

Mattermost:

- Рендерити actions як інтерактивні кнопки, коли це налаштовано.
- Рендерити інші блоки як текстовий fallback.

MS Teams:

- Рендерити `presentation` у Adaptive Cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage`, якщо підтримка Graph надійна для цільової розмови.

Feishu:

- Рендерити `presentation` в interactive cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage` для закріплення надісланого повідомлення, якщо поведінка API надійна.

LINE:

- Рендерити `presentation` у Flex або template messages, де це можливо.
- Для непідтримуваних блоків використовувати fallback до тексту.
- Прибрати LINE UI payload з `channelData`.

Звичайні або обмежені канали:

- Перетворювати presentation на текст із консервативним форматуванням.

## Кроки рефакторингу

1. Повторно застосувати виправлення релізу Discord, яке відокремлює `ui-colors.ts` від Carbon-backed UI і прибирає `DiscordUiContainer` з `extensions/discord/src/channel.ts`.
2. Додати `presentation` і `delivery` до `ReplyPayload`, нормалізації outbound payload, зведень доставки та hook payload.
3. Додати схему `MessagePresentation` і helper для парсингу у вузький підшлях SDK/runtime.
4. Замінити можливості повідомлень `buttons`, `cards`, `components` і `blocks` на семантичні можливості presentation.
5. Додати hooks runtime outbound adapter для рендерингу presentation і закріплення доставки.
6. Замінити побудову міжконтекстних компонентів на `buildCrossContextPresentation`.
7. Видалити `src/infra/outbound/channel-adapters.ts` і прибрати `buildCrossContextComponents` з типів plugin каналу.
8. Змінити `maybeApplyCrossContextMarker`, щоб він приєднував `presentation` замість нативних params.
9. Оновити шляхи надсилання plugin-dispatch, щоб вони споживали лише семантичне presentation і метадані delivery.
10. Видалити нативні параметри payload агента і CLI: `components`, `blocks`, `buttons` і `card`.
11. Видалити helper SDK, які створюють схеми native message-tool, замінивши їх helper схем presentation.
12. Прибрати UI/native envelopes з `channelData`; залишити лише метадані транспорту, доки не буде переглянуто кожне поле, що залишилося.
13. Мігрувати рендерери Discord, Slack, Telegram, Mattermost, MS Teams, Feishu і LINE.
14. Оновити документацію для CLI повідомлень, сторінок каналів, SDK plugin і cookbook можливостей.
15. Запустити профілювання fanout імпорту для Discord і пов’язаних entrypoint каналів.

Кроки 1-11 і 13-14 реалізовано в цьому рефакторингу для спільного агента, CLI, можливостей plugin і контрактів outbound adapter. Крок 12 залишається глибшим внутрішнім етапом очищення для приватних transport envelope провайдера в `channelData`. Крок 15 залишається подальшою перевіркою, якщо нам потрібні кількісні показники fanout імпорту понад межі перевірки типів/тестів.

## Тести

Додати або оновити:

- Тести нормалізації presentation.
- Тести автоматичної деградації presentation для непідтримуваних блоків.
- Тести міжконтекстних маркерів для шляхів plugin dispatch і доставки ядра.
- Тести матриці рендерингу каналів для Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE і текстового fallback.
- Тести схем message tool, які доводять, що нативні поля прибрано.
- Тести CLI, які доводять, що нативні прапорці прибрано.
- Регресійний тест лінивості імпорту entrypoint Discord, що покриває Carbon.
- Тести delivery pin, що покривають Telegram і загальний fallback.

## Відкриті питання

- Чи слід реалізувати `delivery.pin` для Discord, Slack, MS Teams і Feishu у першому проході, чи спочатку лише для Telegram?
- Чи має `delivery` зрештою поглинути наявні поля, як-от `replyToId`, `replyToCurrent`, `silent` і `audioAsVoice`, чи залишатися зосередженим на поведінках після надсилання?
- Чи має presentation безпосередньо підтримувати зображення або посилання на файли, чи поки що медіа мають залишатися окремо від UI-компонування?
