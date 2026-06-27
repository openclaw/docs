---
read_when:
    - Рефакторинг інтерфейсу повідомлень каналів, інтерактивних корисних навантажень або нативних рендерерів каналів
    - Зміна можливостей інструменту повідомлень, підказок доставки або міжконтекстних маркерів
    - Налагодження розгалуження імпорту Discord Carbon або лінивості виконання channel plugin
summary: Відокремте семантичне представлення повідомлень від рендерерів нативного UI каналів.
title: План рефакторингу представлення каналу
x-i18n:
    generated_at: "2026-06-27T17:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Стан

Реалізовано для спільного агента, CLI, можливостей Plugin і поверхонь вихідної доставки:

- `ReplyPayload.presentation` передає семантичний UI повідомлення.
- `ReplyPayload.delivery.pin` передає запити на закріплення надісланого повідомлення.
- Спільні дії повідомлень надають `presentation`, `delivery` і `pin` замість провайдерних `components`, `blocks`, `buttons` або `card`.
- Ядро рендерить або автоматично деградує презентацію через оголошені Plugin вихідні можливості.
- Рендерери Discord, Slack, Telegram, Mattermost, MS Teams і Feishu використовують узагальнений контракт.
- Код площини керування каналу Discord більше не імпортує UI-контейнери на базі Carbon.

Канонічна документація тепер розміщена в [Презентація повідомлень](/uk/plugins/message-presentation).
Зберігайте цей план як історичний контекст реалізації; оновлюйте канонічний посібник
для змін контракту, рендерера або поведінки fallback.

## Проблема

UI каналів зараз розділений між кількома несумісними поверхнями:

- Ядро володіє кросконтекстним хуком рендерера у формі Discord через `buildCrossContextComponents`.
- Discord `channel.ts` може імпортувати нативний Carbon UI через `DiscordUiContainer`, що затягує runtime-залежності UI у площину керування канального Plugin.
- Агент і CLI надають нативні аварійні виходи payload, як-от Discord `components`, Slack `blocks`, Telegram або Mattermost `buttons`, а також Teams або Feishu `card`.
- `ReplyPayload.channelData` містить і транспортні підказки, і нативні UI-конверти.
- Узагальнена модель `interactive` існує, але вона вужча за багатші макети, які вже використовуються Discord, Slack, Teams, Feishu, LINE, Telegram і Mattermost.

Через це ядро знає про нативні форми UI, послаблюється лінивість runtime Plugin, а агенти отримують забагато провайдер-специфічних способів виразити той самий намір повідомлення.

## Цілі

- Ядро обирає найкращу семантичну презентацію для повідомлення на основі оголошених можливостей.
- Розширення оголошують можливості й рендерять семантичну презентацію в нативні транспортні payload.
- Web Control UI залишається окремим від нативного chat UI.
- Нативні payload каналів не відкриваються через спільну поверхню повідомлень агента або CLI.
- Непідтримувані функції презентації автоматично деградують до найкращого текстового представлення.
- Поведінка доставки, наприклад закріплення надісланого повідомлення, є узагальненими метаданими доставки, а не презентацією.

## Нецілі

- Немає shim зворотної сумісності для `buildCrossContextComponents`.
- Немає публічних нативних аварійних виходів для `components`, `blocks`, `buttons` або `card`.
- Немає імпортів канально-нативних UI-бібліотек у ядрі.
- Немає провайдер-специфічних SDK-швів для bundled каналів.

## Цільова модель

Додайте поле `presentation`, яким володіє ядро, до `ReplyPayload`.

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

`interactive` стає підмножиною `presentation` під час міграції:

- Текстовий блок `interactive` відображається в `presentation.blocks[].type = "text"`.
- Блок кнопок `interactive` відображається в `presentation.blocks[].type = "buttons"`.
- Блок select `interactive` відображається в `presentation.blocks[].type = "select"`.

Зовнішні схеми агента й CLI тепер використовують `presentation`; `interactive` залишається внутрішнім застарілим helper для парсингу/рендерингу для наявних виробників відповідей.
Публічний API для виробників вважає `interactive` застарілим. Підтримка runtime
залишається, щоб наявні helper-и approvals і старіші Plugin продовжували
працювати, тоді як новий код emit-ить `presentation`.

## Метадані доставки

Додайте поле `delivery`, яким володіє ядро, для поведінки надсилання, що не є UI.

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
- `notify` за замовчуванням дорівнює `false`.
- `required` за замовчуванням дорівнює `false`; непідтримувані канали або невдале закріплення автоматично деградують, продовжуючи доставку.
- Ручні дії повідомлення `pin`, `unpin` і `list-pins` залишаються для наявних повідомлень.

Поточне прив’язування Telegram ACP topic має перейти з `channelData.telegram.pin = true` на `delivery.pin = true`.

## Runtime-контракт можливостей

Додайте хуки рендерингу презентації та доставки до вихідного runtime-адаптера, а не до Plugin каналу площини керування.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- Визначити цільовий канал і runtime-адаптер.
- Запитати можливості презентації.
- Деградувати непідтримувані блоки й застосувати узагальнені ліміти можливостей перед
  рендерингом.
- Викликати `renderPresentation`.
- Якщо рендерера немає, перетворити презентацію на текстовий fallback.
- Після успішного надсилання викликати `pinDeliveredMessage`, коли запитано `delivery.pin` і це підтримується.

## Мапінг каналів

Discord:

- Рендерити `presentation` у components v2 і Carbon-контейнери в runtime-only модулях.
- Тримати helper-и accent color у легких модулях.
- Прибрати імпорти `DiscordUiContainer` з коду площини керування канального Plugin.

Slack:

- Рендерити `presentation` у Block Kit.
- Прибрати введення `blocks` агента й CLI.

Telegram:

- Рендерити текст, контекст і розділювачі як текст.
- Рендерити дії та select як inline keyboards, коли це налаштовано й дозволено для цільової поверхні.
- Використовувати текстовий fallback, коли inline-кнопки вимкнено.
- Перенести закріплення ACP topic у `delivery.pin`.

Mattermost:

- Рендерити дії як інтерактивні кнопки, коли це налаштовано.
- Рендерити інші блоки як текстовий fallback.

MS Teams:

- Рендерити `presentation` у Adaptive Cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За бажання реалізувати `pinDeliveredMessage`, якщо підтримка Graph надійна для цільової розмови.

Feishu:

- Рендерити `presentation` в interactive cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За бажання реалізувати `pinDeliveredMessage` для закріплення надісланого повідомлення, якщо поведінка API надійна.

LINE:

- Рендерити `presentation` у Flex або template messages, де можливо.
- Повертатися до тексту для непідтримуваних блоків.
- Прибрати UI payload LINE з `channelData`.

Прості або обмежені канали:

- Перетворювати презентацію на текст із консервативним форматуванням.

## Кроки рефакторингу

1. Повторно застосувати release-виправлення Discord, яке відокремлює `ui-colors.ts` від UI на базі Carbon і прибирає `DiscordUiContainer` з `extensions/discord/src/channel.ts`.
2. Додати `presentation` і `delivery` до `ReplyPayload`, нормалізації вихідних payload, підсумків доставки й hook payload.
3. Додати схему `MessagePresentation` і parser helper-и у вузькому підшляху SDK/runtime.
4. Замінити можливості повідомлень `buttons`, `cards`, `components` і `blocks` на семантичні можливості презентації.
5. Додати хуки вихідного runtime-адаптера для рендерингу презентації та закріплення доставки.
6. Замінити побудову кросконтекстних компонентів на `buildCrossContextPresentation`.
7. Видалити `src/infra/outbound/channel-adapters.ts` і прибрати `buildCrossContextComponents` з типів Plugin каналу.
8. Змінити `maybeApplyCrossContextMarker`, щоб прикріплювати `presentation` замість нативних params.
9. Оновити шляхи надсилання plugin-dispatch, щоб вони споживали лише семантичну презентацію й метадані доставки.
10. Прибрати нативні params payload агента й CLI: `components`, `blocks`, `buttons` і `card`.
11. Прибрати SDK helper-и, що створюють нативні схеми message-tool, замінивши їх helper-ами схеми презентації.
12. Прибрати UI/нативні конверти з `channelData`; залишити тільки транспортні метадані, доки кожне поле, що залишилося, не буде переглянуто.
13. Мігрувати рендерери Discord, Slack, Telegram, Mattermost, MS Teams, Feishu і LINE.
14. Оновити документацію для message CLI, сторінок каналів, Plugin SDK і capability cookbook.
15. Запустити профілювання import fanout для Discord і зачеплених entrypoint каналів.

Кроки 1-11 і 13-14 реалізовано в цьому рефакторингу для спільного агента, CLI, можливостей Plugin і контрактів вихідного адаптера. Крок 12 залишається глибшим внутрішнім проходом очищення для provider-private транспортних конвертів `channelData`. Крок 15 залишається подальшою валідацією, якщо нам потрібні кількісні показники import-fanout понад type/test gate.

## Тести

Додати або оновити:

- Тести нормалізації презентації.
- Тести автоматичної деградації презентації для непідтримуваних блоків.
- Тести кросконтекстного маркера для plugin dispatch і шляхів доставки ядра.
- Матричні тести рендерингу каналів для Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE і текстового fallback.
- Тести схеми message tool, що доводять відсутність нативних полів.
- Тести CLI, що доводять відсутність нативних прапорців.
- Регресія лінивості імпорту entrypoint Discord, що покриває Carbon.
- Тести закріплення доставки, що покривають Telegram і узагальнений fallback.

## Відкриті питання

- Чи слід реалізувати `delivery.pin` для Discord, Slack, MS Teams і Feishu в першому проході, чи спочатку лише Telegram?
- Чи має `delivery` з часом поглинути наявні поля, як-от `replyToId`, `replyToCurrent`, `silent` і `audioAsVoice`, чи залишитися зосередженим на поведінці після надсилання?
- Чи має презентація підтримувати зображення або посилання на файли напряму, чи медіа наразі мають залишатися окремими від UI-макета?

## Пов’язане

- [Огляд каналів](/uk/channels)
- [Презентація повідомлень](/uk/plugins/message-presentation)
