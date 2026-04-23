---
read_when:
    - Рефакторинг UI повідомлень каналу, інтерактивних payload або нативних рендерерів каналу
    - Зміна можливостей інструмента повідомлень, підказок доставки або маркерів між контекстами
    - Налагодження fanout імпорту Discord Carbon або лінивості runtime channel Plugin
summary: Відокремте семантичне представлення повідомлень від нативних UI-рендерерів каналу.
title: План рефакторингу представлення каналу
x-i18n:
    generated_at: "2026-04-23T20:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98a31cd400599542550d4549e99165704e2393baa484518482226ea05b861316
    source_path: plan/ui-channels.md
    workflow: 15
---

## Статус

Реалізовано для спільних поверхонь агента, CLI, можливостей Plugin і вихідної доставки:

- `ReplyPayload.presentation` містить семантичний UI повідомлення.
- `ReplyPayload.delivery.pin` містить запити на закріплення надісланого повідомлення.
- Спільні дії повідомлень надають `presentation`, `delivery` і `pin` замість нативних для провайдера `components`, `blocks`, `buttons` або `card`.
- Core рендерить presentation або автоматично зводить її до деградованого варіанта через оголошені Plugin можливості вихідної доставки.
- Рендерери Discord, Slack, Telegram, Mattermost, Microsoft Teams і Feishu споживають загальний контракт.
- Код control-plane каналу Discord більше не імпортує UI-контейнери на базі Carbon.

Канонічна документація тепер знаходиться в [Message Presentation](/uk/plugins/message-presentation).
Зберігайте цей план як історичний контекст реалізації; оновлюйте канонічний посібник
при змінах контракту, рендерера або поведінки fallback.

## Проблема

UI каналів зараз розділений між кількома несумісними поверхнями:

- Core володіє hook для рендерингу між контекстами у формі Discord через `buildCrossContextComponents`.
- Discord `channel.ts` може імпортувати нативний Carbon UI через `DiscordUiContainer`, що підтягує runtime-залежності UI в control plane channel Plugin.
- Агент і CLI надають нативні escape hatch для payload, як-от Discord `components`, Slack `blocks`, Telegram або Mattermost `buttons`, а також Teams або Feishu `card`.
- `ReplyPayload.channelData` містить і transport hints, і нативні UI-обгортки.
- Загальна модель `interactive` існує, але вона вужча за багатші макети, які вже використовуються в Discord, Slack, Teams, Feishu, LINE, Telegram і Mattermost.

Через це core знає про нативні форми UI, послаблюється runtime laziness Plugin, а агентам надається забагато специфічних для провайдера способів виражати той самий намір повідомлення.

## Цілі

- Core визначає найкраще семантичне представлення повідомлення на основі оголошених можливостей.
- Extensions оголошують можливості та рендерять семантичне представлення в нативні transport payload.
- Web Control UI залишається окремим від нативного UI чатів.
- Нативні payload каналів не надаються через спільну поверхню агента або CLI повідомлень.
- Непідтримувані можливості presentation автоматично зводяться до найкращого текстового представлення.
- Поведінка доставки, як-от закріплення надісланого повідомлення, є загальними метаданими доставки, а не presentation.

## Не цілі

- Жодного shim для зворотної сумісності з `buildCrossContextComponents`.
- Жодних публічних нативних escape hatch для `components`, `blocks`, `buttons` або `card`.
- Жодних імпортів core бібліотек UI, нативних для каналу.
- Жодних seam SDK, специфічних для провайдера, для bundled каналів.

## Цільова модель

Додати поле `presentation`, що належить core, до `ReplyPayload`.

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

Під час міграції `interactive` стає підмножиною `presentation`:

- Блок тексту `interactive` зіставляється з `presentation.blocks[].type = "text"`.
- Блок кнопок `interactive` зіставляється з `presentation.blocks[].type = "buttons"`.
- Блок вибору `interactive` зіставляється з `presentation.blocks[].type = "select"`.

Зовнішні схеми агента й CLI тепер використовують `presentation`; `interactive` залишається внутрішнім застарілим допоміжним засобом розбору/рендерингу для наявних продуцентів reply.

## Метадані доставки

Додати поле `delivery`, що належить core, для поведінки надсилання, яка не є UI.

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
- `required` типово дорівнює `false`; непідтримувані канали або невдале закріплення автоматично зводяться до деградованого варіанта через продовження доставки.
- Ручні дії повідомлень `pin`, `unpin` і `list-pins` залишаються для наявних повідомлень.

Поточну прив’язку ACP topic у Telegram слід перенести з `channelData.telegram.pin = true` до `delivery.pin = true`.

## Контракт runtime-можливостей

Додати hooks рендерингу presentation і доставки до runtime outbound adapter, а не до control-plane channel Plugin.

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

Поведінка core:

- Визначити цільовий канал і runtime adapter.
- Запитати можливості presentation.
- Звести непідтримувані блоки до деградованого варіанта перед рендерингом.
- Викликати `renderPresentation`.
- Якщо рендерера немає, перетворити presentation на текстовий fallback.
- Після успішного надсилання викликати `pinDeliveredMessage`, коли запитано `delivery.pin` і це підтримується.

## Зіставлення каналів

Discord:

- Рендерити `presentation` у components v2 і Carbon-контейнери в модулях лише для runtime.
- Зберегти допоміжні засоби кольорів accent у легких модулях.
- Видалити імпорти `DiscordUiContainer` з коду control-plane channel Plugin.

Slack:

- Рендерити `presentation` у Block Kit.
- Видалити вхід `blocks` для агента й CLI.

Telegram:

- Рендерити текст, context і divider як текст.
- Рендерити actions і select як inline keyboard, коли це налаштовано й дозволено для цільової поверхні.
- Використовувати текстовий fallback, коли inline buttons вимкнено.
- Перенести закріплення ACP topic до `delivery.pin`.

Mattermost:

- Рендерити actions як interactive buttons, коли це налаштовано.
- Інші блоки рендерити через текстовий fallback.

Microsoft Teams:

- Рендерити `presentation` у Adaptive Cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage`, якщо підтримка Graph надійна для цільової conversation.

Feishu:

- Рендерити `presentation` в interactive cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage` для закріплення надісланих повідомлень, якщо поведінка API надійна.

LINE:

- Рендерити `presentation` у Flex або template messages, де це можливо.
- Для непідтримуваних блоків повертатися до тексту.
- Видалити LINE UI payload із `channelData`.

Звичайні або обмежені канали:

- Перетворювати presentation на текст із консервативним форматуванням.

## Кроки рефакторингу

1. Повторно застосувати виправлення релізу Discord, яке відокремлює `ui-colors.ts` від Carbon-backed UI та прибирає `DiscordUiContainer` з `extensions/discord/src/channel.ts`.
2. Додати `presentation` і `delivery` до `ReplyPayload`, нормалізації вихідного payload, зведень доставки та payload hooks.
3. Додати схему `MessagePresentation` і допоміжні засоби parser у вузький підшлях SDK/runtime.
4. Замінити можливості повідомлень `buttons`, `cards`, `components` і `blocks` на семантичні можливості presentation.
5. Додати hooks runtime outbound adapter для рендерингу presentation і закріплення доставки.
6. Замінити побудову компонентів між контекстами на `buildCrossContextPresentation`.
7. Видалити `src/infra/outbound/channel-adapters.ts` і прибрати `buildCrossContextComponents` з типів channel Plugin.
8. Змінити `maybeApplyCrossContextMarker`, щоб він прикріплював `presentation` замість нативних params.
9. Оновити шляхи надсилання plugin-dispatch так, щоб вони споживали лише семантичне presentation і метадані delivery.
10. Видалити нативні параметри payload агента й CLI: `components`, `blocks`, `buttons` і `card`.
11. Видалити допоміжні засоби SDK, що створюють нативні схеми message-tool, замінивши їх допоміжними засобами схеми presentation.
12. Видалити UI/native envelopes з `channelData`; залишити лише transport metadata, доки не буде переглянуто кожне поле, що лишилося.
13. Мігрувати рендерери Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu і LINE.
14. Оновити документацію для message CLI, сторінок каналів, Plugin SDK і cookbook можливостей.
15. Запустити профілювання import fanout для Discord і зачеплених entrypoint каналів.

Кроки 1-11 і 13-14 реалізовано в цьому рефакторингу для контрактів спільного агента, CLI, можливостей Plugin і outbound adapter. Крок 12 залишається глибшим внутрішнім етапом очищення для provider-private transport envelope у `channelData`. Крок 15 залишається подальшою перевіркою, якщо нам потрібні кількісні значення import-fanout понад межі типів/тестів.

## Тести

Додати або оновити:

- Тести нормалізації presentation.
- Тести автоматичного зведення presentation до деградованого варіанта для непідтримуваних блоків.
- Тести маркерів між контекстами для шляхів plugin dispatch і core delivery.
- Тести матриці рендерингу каналів для Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE і текстового fallback.
- Тести схеми message tool, які доводять, що нативні поля прибрано.
- Тести CLI, які доводять, що нативні прапорці прибрано.
- Регресійний тест лінивості імпорту entrypoint Discord, що охоплює Carbon.
- Тести закріплення delivery, що охоплюють Telegram і загальний fallback.

## Відкриті питання

- Чи слід реалізовувати `delivery.pin` для Discord, Slack, Microsoft Teams і Feishu у першому проході, чи спочатку лише для Telegram?
- Чи має `delivery` згодом поглинути наявні поля, такі як `replyToId`, `replyToCurrent`, `silent` і `audioAsVoice`, чи залишатися зосередженим на поведінці після надсилання?
- Чи має presentation безпосередньо підтримувати зображення або посилання на файли, чи медіа поки що мають залишатися окремо від UI layout?
