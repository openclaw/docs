---
read_when:
    - Ви створюєте або рефакторите Plugin каналу обміну повідомленнями
    - Вам потрібна надійна доставка остаточної відповіді, квитанції, фіналізація попереднього перегляду в реальному часі або політика підтвердження отримання
    - Ви мігруєте із застарілого конвеєра відповідей або допоміжних функцій диспетчеризації вхідних відповідей
summary: API життєвого циклу повідомлень для плагінів каналів, зокрема стійких надсилань, підтверджень отримання, живого попереднього перегляду, політики підтвердження отримання та міграції застарілих систем
title: API повідомлень каналу
x-i18n:
    generated_at: "2026-05-11T20:50:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin-и каналів мають надавати один адаптер `message` з
`openclaw/plugin-sdk/channel-message`. Адаптер описує нативний життєвий цикл
повідомлення, який підтримує платформа:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Ядро відповідає за постановку в чергу, довговічність, загальну політику повторних спроб, хуки, квитанції та
спільний інструмент `message`. Plugin відповідає за нативні виклики send/edit/delete, нормалізацію цілі,
платформні потоки, вибрані цитати, прапорці сповіщень, стан акаунта та платформно-специфічні побічні ефекти.

Використовуйте цю сторінку разом із [Створенням Plugin-ів каналів](/uk/plugins/sdk-channel-plugins).

Підшлях `channel-message` навмисно достатньо легкий для гарячих файлів
завантаження Plugin-а, таких як `channel.ts`: він надає контракти адаптерів, докази
можливостей, квитанції та фасади сумісності без завантаження вихідної доставки.
Допоміжні засоби доставки під час виконання доступні з
`openclaw/plugin-sdk/channel-message-runtime` для шляхів коду monitor/send, які
вже виконують асинхронний I/O повідомлень.

Новий код надсилання каналів і Plugin-ів має використовувати допоміжні засоби життєвого циклу повідомлень з
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` або `deliverInboundReplyWithMessageSendContext`.
Старіший допоміжний засіб
`deliverOutboundPayloads(...)` в `openclaw/plugin-sdk/outbound-runtime`
є застарілою сумісною/рантаймовою основою для вихідних внутрішніх механізмів, відновлення
та застарілих адаптерів. Не використовуйте його для нових шляхів надсилання каналів або Plugin-ів.

`sendDurableMessageBatch(...)` повертає явний результат життєвого циклу:

- `sent` - доставлено принаймні одне видиме платформне повідомлення.
- `suppressed` - жодне платформне повідомлення не слід вважати відсутнім. Стабільні
  причини включають `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` і застарілу `no_visible_result`.
- `partial_failed` - принаймні одне платформне повідомлення було доставлено до того, як пізніший
  payload або побічний ефект завершився помилкою. Результат містить префікс доставленої квитанції
  плюс помилку.
- `failed` - жодної платформної квитанції не створено.

Використовуйте `payloadOutcomes`, коли batch поєднує надіслані, пригнічені та невдалі payload-и.
Не виводьте скасування хуком, перевіряючи, чи старий масив прямої доставки
порожній.

Диспетчери сумісності, яким досі потрібен буферизований диспетчер відповідей, мають
створювати опції префікса відповіді за допомогою `createChannelMessageReplyPipeline(...)` з
`openclaw/plugin-sdk/channel-message`, а потім викликати рантаймовий
`channel.turn.runPrepared(...)`. Це зберігає запис сесії та порядок dispatch
у спільному життєвому циклі turn без додавання ще однієї публічної обгортки turn.

## Мінімальний адаптер

Більшість нових Plugin-ів каналів можуть почати з невеликого адаптера:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Потім приєднайте його до Plugin-а каналу:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Оголошуйте лише можливості, які адаптер справді зберігає. Кожна оголошена
можливість повинна мати контрактний тест.

## Вихідний міст

Якщо канал уже має сумісний адаптер `outbound`, краще вивести
адаптер повідомлень із нього, а не дублювати код надсилання:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Міст перетворює старі результати вихідного надсилання на значення `MessageReceipt`. Новий
код має передавати квитанції наскрізно й виводити застарілі id лише на межах
сумісності за допомогою `listMessageReceiptPlatformIds(...)` або
`resolveMessageReceiptPrimaryId(...)`.
Якщо політику receive не надано, `createChannelMessageAdapterFromOutbound(...)`
використовує політику підтвердження receive `manual`. Це робить належне Plugin-у платформне
підтвердження явним без зміни каналів, які підтверджують webhook-и,
сокети або polling offsets поза загальним контекстом receive.

## Надсилання інструментом повідомлень

Спільний шлях `message(action="send")` має використовувати той самий життєвий цикл доставки ядра,
що й фінальні відповіді. Якщо каналу потрібне провайдер-специфічне формування для
надсилання інструментом, реалізуйте `actions.prepareSendPayload(...)` замість надсилання з
`actions.handleAction(...)`.

`prepareSendPayload(...)` отримує нормалізований core `ReplyPayload` плюс
повний контекст дії. Поверніть payload із даними, специфічними для каналу, в
`payload.channelData.<channel>` і дозвольте core викликати `sendMessage(...)`,
рантайм життєвого циклу повідомлень, write-ahead чергу, хуки надсилання повідомлень,
повторні спроби, відновлення та очищення ack. Рантайм життєвого циклу може викликати
`deliverOutboundPayloads(...)` внутрішньо як основу сумісності, але Plugin-и каналів
не мають викликати його напряму для нової поведінки надсилання.

Поверніть `null` лише тоді, коли надсилання не можна представити як довговічний payload, наприклад,
тому що воно містить несеріалізовану factory компонентів. Core збереже
застарілий fallback дії Plugin-а для сумісності, але нові функції надсилання каналів
мають бути виражені як довговічні дані payload.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Потім вихідний адаптер читає `payload.channelData.demo` всередині `sendPayload`.
Це зберігає платформно-специфічний rendering у Plugin-і, тоді як core і далі відповідає за
persist, retry, recover, hooks і ack.

Підготовлені payload-и `message(action="send")` і загальна доставка фінальної відповіді використовують
core delivery з best-effort queueing за замовчуванням. Обов’язкова довговічна постановка в чергу
чинна лише після того, як core перевірить, що канал може reconcile надсилання, результат якого
невідомий після збою. Якщо адаптер не може реалізувати `reconcileUnknownSend`,
залиште підготовлений шлях надсилання best-effort; core усе одно спробує write-ahead
чергу, але сталість черги або невизначене відновлення після збою не є частиною
обов’язкового контракту доставки.

## Довговічні фінальні можливості

Довговічна фінальна доставка вмикається окремо для кожного побічного ефекту. Core використовуватиме загальну
довговічну доставку лише тоді, коли адаптер оголосить кожну можливість, потрібну
payload-у та параметрам доставки.

| Можливість             | Оголошуйте, коли                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Адаптер може надіслати текст і повернути квитанцію.                                      |
| `media`                | Надсилання медіа повертають квитанції для кожного видимого платформного повідомлення.                      |
| `payload`              | Адаптер зберігає семантику rich reply payload, а не лише текст і один media URL. |
| `replyTo`              | Нативні цілі відповіді доходять до платформи.                                             |
| `thread`               | Нативні thread, topic або channel thread цілі доходять до платформи.                  |
| `silent`               | Пригнічення сповіщень доходить до платформи.                                       |
| `nativeQuote`          | Метадані вибраної цитати доходять до платформи.                                        |
| `messageSendingHooks`  | Core-хуки надсилання повідомлень можуть скасувати або переписати вміст перед platform I/O.        |
| `batch`                | Багаточастинні відрендерені batch-и можна відтворити як один довговічний план.                      |
| `reconcileUnknownSend` | Адаптер може розв’язати відновлення `unknown_after_send` без сліпого повторного відтворення.          |
| `afterSendSuccess`     | Локальні для каналу побічні ефекти after-send виконуються один раз.                                      |
| `afterCommit`          | Локальні для каналу побічні ефекти after-commit виконуються один раз.                                    |

Best-effort фінальна доставка не потребує `reconcileUnknownSend`; вона використовує
спільний життєвий цикл, коли адаптер зберігає видиму семантику payload-а, і
повертається до прямого platform I/O, якщо сталість черги недоступна. Обов’язкова
довговічна фінальна доставка має явно вимагати `reconcileUnknownSend`. Якщо
адаптер не може визначити, чи почате/невідоме надсилання дійшло до платформи,
не оголошуйте цю можливість; core відхилить обов’язкову довговічну доставку
до постановки в чергу.

Коли викликачеві потрібна довговічна доставка, виводьте вимоги замість створення
maps вручну:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` потрібен за замовчуванням. Встановлюйте `messageSendingHooks: false`
лише для шляху, який навмисно не може запускати глобальні хуки надсилання повідомлень.

## Контракт довговічного надсилання

Довговічне фінальне надсилання має суворішу семантику, ніж застаріла delivery, якою володіє канал:

- Створіть довговічний intent перед platform I/O.
- Якщо довговічна доставка повертає оброблений результат, не повертайтеся до застарілого send.
- Вважайте скасування хуком і результати без надсилання термінальними.
- Вважайте `unsupported` лише результатом до intent.
- Для обов’язкової довговічності завершуйте з помилкою перед platform I/O, якщо черга не може записати,
  що platform send розпочато.
- Для обов’язкової фінальної доставки та обов’язкових підготовлених надсилань message-tool
  виконуйте preflight `reconcileUnknownSend`; recovery має бути здатним ack
  уже надіслане повідомлення або replay лише після того, як адаптер доведе, що початкове надсилання
  не відбулося.
- Для `best_effort` збої запису в чергу можуть повертатися до прямого platform I/O.
- Передавайте abort signals до завантаження медіа та платформних надсилань.
- Запускайте after-commit hooks після queue ack; прямий best-effort fallback запускає їх
  після успішного platform I/O, бо довговічного queue commit немає.
- Повертайте квитанції для кожного видимого id платформного повідомлення.
- Використовуйте `reconcileUnknownSend`, коли платформа може перевірити, чи невизначене надсилання
  вже дійшло до користувача.

Цей контракт запобігає дублюванню надсилань після збоїв і не дає обходити
хуки скасування надсилання повідомлень.

## Квитанції

`MessageReceipt` є новим внутрішнім записом того, що прийняла платформа:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Використовуйте `createMessageReceiptFromOutboundResults(...)` під час адаптації наявного
результату надсилання. Використовуйте `createPreviewMessageReceipt(...)`, коли повідомлення живого попереднього перегляду
стає фінальною квитанцією. Уникайте додавання нових локальних для власника полів `messageIds`.
Застарілий `ChannelDeliveryResult.messageIds` досі створюється на межах
сумісності.

## Живий попередній перегляд

Канали, які транслюють чернеткові попередні перегляди або оновлення прогресу, мають оголошувати live
можливості:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Використовуйте `defineFinalizableLivePreviewAdapter(...)` і
`deliverWithFinalizableLivePreviewAdapter(...)` для фіналізації під час виконання. Фіналізатор
вирішує, чи фінальна відповідь редагує попередній перегляд на місці, надсилає
звичайний резервний варіант, відкидає очікуваний стан попереднього перегляду, зберігає неоднозначну невдалу зміну
без дублювання повідомлення та повертає фінальну квитанцію.

## Політика підтвердження отримання

Вхідні приймачі, які контролюють час підтвердження платформою, мають оголошувати
політику отримання:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Адаптери, які не оголошують політику отримання, типово мають:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Використовуйте типову політику, коли платформа не має підтвердження, яке потрібно відкласти, уже
підтверджує до асинхронної обробки або потребує специфічної для протоколу
семантики відповіді. Оголошуйте одну з поетапних політик лише тоді, коли приймач фактично
використовує контекст отримання, щоб перенести підтвердження платформою на пізніший час.

Політики:

| Політика               | Коли використовувати                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Платформу можна підтвердити після розбору та запису вхідної події.                      |
| `after_agent_dispatch` | Платформа має чекати, доки диспетчеризацію агента буде прийнято.                        |
| `after_durable_send`   | Платформа має чекати, доки фінальна доставка матиме стале рішення.                      |
| `manual`               | Plugin керує підтвердженням, бо семантика платформи не відповідає універсальному етапу. |

Використовуйте `createMessageReceiveContext(...)` у приймачах, які відкладають стан підтвердження, і
`shouldAckMessageAfterStage(...)`, коли приймач має перевірити, чи
етап задовольнив налаштовану політику.

## Контрактні тести

Оголошення можливостей є частиною контракту Plugin. Підкріплюйте їх тестами:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Додайте набори доказових тестів для live і отримання, коли адаптер оголошує ці можливості. Відсутній
доказ має провалювати тест, а не непомітно розширювати сталу
поверхню.

## Застарілі API сумісності

Ці API залишаються імпортованими для сумісності зі сторонніми розробниками. Не використовуйте їх для
нового коду каналів.

| Застарілий API                              | Заміна                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` для диспетчерів сумісності або адаптер `message` для нового коду каналів          |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` плюс `channel.turn.runPrepared(...)` або адаптер `message` для нового коду каналів |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` плюс `channel.turn.runPrepared(...)` або адаптер `message` для нового коду каналів |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` плюс `channel.turn.runPrepared(...)` або адаптер `message` для нового коду каналів |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` або `deliverInboundReplyWithMessageSendContext(...)` з `channel-message-runtime`             |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` з `openclaw/plugin-sdk/channel-message-runtime`                           |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` плюс `channel.turn.runPrepared(...)` або адаптер `message` для нового коду каналів |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` плюс `channel.turn.runPrepared(...)` або адаптер `message` для нового коду каналів |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` плюс `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Диспетчери сумісності все ще можуть використовувати `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` і `createTypingCallbacks(...)` через
фасад повідомлень. Новий код життєвого циклу має уникати старого
підшляху `channel-reply-pipeline`.

## Контрольний список міграції

1. Додайте `message: defineChannelMessageAdapter(...)` або
   `message: createChannelMessageAdapterFromOutbound(...)` до канального Plugin.
2. Повертайте `MessageReceipt` з надсилань тексту, медіа та корисного навантаження.
3. Оголошуйте лише можливості, підкріплені нативною поведінкою та тестами.
4. Замініть власноруч написані карти сталих вимог на
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Перенесіть фіналізацію попереднього перегляду через допоміжні засоби живого попереднього перегляду, коли канал
   редагує чернеткові повідомлення на місці.
6. Оголошуйте політику підтвердження отримання лише тоді, коли приймач справді може відкласти
   підтвердження платформою.
7. Зберігайте застарілі допоміжні засоби диспетчеризації відповідей лише на межах сумісності.
