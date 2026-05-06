---
read_when:
    - Ви створюєте або виконуєте рефакторинг Plugin для каналу обміну повідомленнями
    - Вам потрібні надійна доставка остаточних відповідей, підтвердження, фіналізація попереднього перегляду в реальному часі або політика підтвердження отримання
    - Ви мігруєте із застарілого конвеєра відповідей або допоміжних засобів диспетчеризації вхідних відповідей
summary: API життєвого циклу повідомлень для плагінів каналів, зокрема надійні надсилання, квитанції, попередній перегляд наживо, політика підтвердження отримання та міграція зі застарілої версії
title: API повідомлень каналу
x-i18n:
    generated_at: "2026-05-06T04:53:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Channel plugins мають надавати один адаптер `message` з
`openclaw/plugin-sdk/channel-message`. Адаптер описує нативний життєвий цикл
повідомлення, який підтримує платформа:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core відповідає за черги, довговічність, загальну політику повторних спроб, hooks, receipts і
спільний інструмент `message`. Plugin відповідає за нативні виклики send/edit/delete, нормалізацію цілі, потоки платформи, вибрані цитати, прапорці сповіщень, стан акаунта та специфічні для платформи побічні ефекти.

Використовуйте цю сторінку разом із [Створенням channel plugins](/uk/plugins/sdk-channel-plugins).

Підшлях `channel-message` навмисно достатньо легкий для гарячих файлів початкового завантаження plugin, таких як `channel.ts`: він надає контракти адаптера, докази можливостей, receipts і фасади сумісності без завантаження вихідної доставки.
Runtime-помічники доставки доступні з
`openclaw/plugin-sdk/channel-message-runtime` для шляхів monitor/send, які
вже виконують асинхронний message I/O.

## Мінімальний адаптер

Більшість нових channel plugins можуть почати з малого адаптера:

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

Потім приєднайте його до channel plugin:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Оголошуйте лише ті можливості, які адаптер справді зберігає. Кожна оголошена
можливість повинна мати контрактний тест.

## Outbound-міст

Якщо канал уже має сумісний адаптер `outbound`, краще вивести message-адаптер із нього, а не дублювати код надсилання:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Міст перетворює старі результати outbound-надсилання на значення `MessageReceipt`. Новий
код має передавати receipts наскрізно й виводити legacy ids лише на межах сумісності за допомогою `listMessageReceiptPlatformIds(...)` або
`resolveMessageReceiptPrimaryId(...)`.
Якщо receive policy не надано, `createChannelMessageAdapterFromOutbound(...)`
використовує політику receive acknowledgement `manual`. Це робить plugin-owned platform
acknowledgement явним, не змінюючи канали, які підтверджують webhooks,
sockets або polling offsets поза загальним receive context.

## Надсилання інструментом Message

Спільний шлях `message(action="send")` має використовувати той самий core delivery
lifecycle, що й фінальні відповіді. Якщо каналу потрібне специфічне для провайдера формування для
tool send, реалізуйте `actions.prepareSendPayload(...)` замість надсилання з
`actions.handleAction(...)`.

`prepareSendPayload(...)` отримує нормалізований core `ReplyPayload` плюс повний action context. Поверніть payload зі специфічними для каналу даними в
`payload.channelData.<channel>` і дозвольте core викликати `sendMessage(...)`,
`deliverOutboundPayloads(...)`, write-ahead queue, message-sending hooks,
retry, recovery і ack cleanup.

Повертайте `null` лише тоді, коли надсилання неможливо представити як durable payload, наприклад тому, що воно містить несеріалізовану component factory. Core збереже legacy plugin action fallback для сумісності, але нові функції channel send мають виражатися як durable payload data.

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

Outbound-адаптер потім читає `payload.channelData.demo` всередині `sendPayload`.
Це зберігає специфічний для платформи rendering у plugin, тоді як core і далі відповідає за
persist, retry, recover, hooks і ack.

Підготовлені payloads `message(action="send")` і загальна доставка final-reply використовують
core delivery із best-effort queueing за замовчуванням. Обов’язкова durable queueing
дійсна лише після того, як core перевірить, що канал може узгодити надсилання, результат якого
невідомий після збою. Якщо адаптер не може реалізувати `reconcileUnknownSend`,
залиште підготовлений send path best-effort; core все одно спробує write-ahead
queue, але збереження черги або невизначене відновлення після збою не є частиною
обов’язкового delivery contract.

## Можливості durable final

Durable final delivery вмикається окремо для кожного побічного ефекту. Core використовуватиме загальну
durable delivery лише тоді, коли адаптер оголошує всі можливості, потрібні для
payload і параметрів доставки.

| Можливість             | Оголошуйте, коли                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Адаптер може надсилати текст і повертати receipt.                                    |
| `media`                | Media sends повертають receipts для кожного видимого повідомлення платформи.          |
| `payload`              | Адаптер зберігає семантику rich reply payload, а не лише текст і один media URL.      |
| `replyTo`              | Нативні reply targets доходять до платформи.                                         |
| `thread`               | Нативні thread, topic або channel thread targets доходять до платформи.              |
| `silent`               | Приглушення сповіщень доходить до платформи.                                         |
| `nativeQuote`          | Метадані вибраної цитати доходять до платформи.                                      |
| `messageSendingHooks`  | Core message-sending hooks можуть скасувати або переписати вміст до platform I/O.    |
| `batch`                | Багаточастинні rendered batches можна відтворити як один durable plan.               |
| `reconcileUnknownSend` | Адаптер може вирішити recovery `unknown_after_send` без сліпого replay.              |
| `afterSendSuccess`     | Channel-local after-send side effects виконуються один раз.                          |
| `afterCommit`          | Channel-local after-commit side effects виконуються один раз.                        |

Best-effort final delivery не потребує `reconcileUnknownSend`; вона використовує
спільний lifecycle, коли адаптер зберігає видиму семантику payload, і
повертається до прямого platform I/O, якщо queue persistence недоступна. Required
durable final delivery має явно вимагати `reconcileUnknownSend`. Якщо
адаптер не може визначити, чи started/unknown send дійшов до платформи,
не оголошуйте цю можливість; core відхилить required durable delivery
перед постановкою в чергу.

Коли caller потребує durable delivery, виводьте requirements замість ручного створення
maps:

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

`messageSendingHooks` є обов’язковим за замовчуванням. Установлюйте `messageSendingHooks: false`
лише для шляху, який навмисно не може запускати global message-sending hooks.

## Контракт durable send

Durable final send має суворішу семантику, ніж legacy channel-owned delivery:

- Створіть durable intent перед platform I/O.
- Якщо durable delivery повертає handled result, не повертайтеся до legacy send.
- Вважайте hook cancellation і no-send results кінцевими.
- Вважайте `unsupported` лише pre-intent result.
- Для required durability завершуйтеся помилкою перед platform I/O, якщо черга не може записати,
  що platform send розпочато.
- Для required final delivery і required prepared message-tool sends
  виконуйте preflight `reconcileUnknownSend`; recovery має бути здатне ack an
  already-sent message або replay лише після того, як адаптер доведе, що початкового send
  не було.
- Для `best_effort` помилки queue write можуть повертатися до прямого platform I/O.
- Передавайте abort signals до media loading і platform sends.
- Запускайте after-commit hooks після queue ack; direct best-effort fallback запускає їх
  після успішного platform I/O, бо durable queue commit немає.
- Повертайте receipts для кожного видимого platform message id.
- Використовуйте `reconcileUnknownSend`, коли платформа може перевірити, чи uncertain send
  уже дійшов до користувача.

Цей контракт уникає дубльованих sends після збоїв і не допускає обходу
message-sending cancellation hooks.

## Receipts

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
send result. Використовуйте `createPreviewMessageReceipt(...)`, коли live preview message
стає final receipt. Уникайте додавання нових owner-local полів `messageIds`.
Legacy `ChannelDeliveryResult.messageIds` і далі створюється на межах сумісності.

## Live preview

Канали, які транслюють draft previews або progress updates, мають оголошувати live
capabilities:

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
`deliverWithFinalizableLivePreviewAdapter(...)` для runtime finalization. Finalizer
вирішує, чи фінальна відповідь редагує preview на місці, надсилає
normal fallback, відкидає pending preview state, зберігає ambiguous failed edit
без дублювання повідомлення та повертає final receipt.

## Політика receive ack

Inbound receivers, які керують timing platform acknowledgement, мають оголошувати
receive policy:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Адаптери, які не оголошують receive policy, за замовчуванням мають:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Використовуйте типове значення, коли платформа не має підтвердження, яке можна відкласти, уже підтверджує перед асинхронною обробкою або потребує специфічної для протоколу семантики відповіді. Оголошуйте одну з поетапних політик лише тоді, коли приймач справді використовує контекст отримання, щоб перенести підтвердження платформи на пізніший момент.

Політики:

| Політика               | Використовуйте, коли                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Платформу можна підтвердити після розбору й запису вхідної події.                       |
| `after_agent_dispatch` | Платформа має чекати, доки dispatch агента буде прийнято.                               |
| `after_durable_send`   | Платформа має чекати, доки остаточна доставка матиме стійке рішення.                    |
| `manual`               | Plugin відповідає за підтвердження, бо семантика платформи не відповідає generic-етапу. |

Використовуйте `createMessageReceiveContext(...)` у приймачах, які відкладають стан підтвердження, і `shouldAckMessageAfterStage(...)`, коли приймачу потрібно перевірити, чи етап задовольнив налаштовану політику.

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

Додавайте набори live- і receive-доказів, коли адаптер оголошує ці функції. Відсутній доказ має спричиняти збій тесту, а не непомітно розширювати стійку поверхню.

## Застарілі API сумісності

Ці API залишаються доступними для імпорту заради сумісності зі сторонніми інтеграціями. Не використовуйте їх для нового коду каналів.

| Застарілий API                              | Заміна                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` для dispatcher-ів сумісності або адаптер `message` для нового коду каналів |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` з `openclaw/plugin-sdk/channel-message-runtime`                    |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` лише для dispatcher-ів сумісності                                       |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` лише для dispatcher-ів сумісності                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` плюс `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Dispatcher-и сумісності й надалі можуть використовувати `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` і `createTypingCallbacks(...)` через фасад повідомлень. Новий код життєвого циклу має уникати старого підшляху `channel-reply-pipeline`.

## Контрольний список міграції

1. Додайте `message: defineChannelMessageAdapter(...)` або `message: createChannelMessageAdapterFromOutbound(...)` до Plugin каналу.
2. Повертайте `MessageReceipt` з надсилань тексту, медіа й payload.
3. Оголошуйте лише можливості, підкріплені нативною поведінкою й тестами.
4. Замініть власноруч написані мапи вимог до стійкості на `deriveDurableFinalDeliveryRequirements(...)`.
5. Перенесіть фіналізацію попереднього перегляду через helpers live-перегляду, коли канал редагує draft-повідомлення на місці.
6. Оголошуйте політику receive ack лише тоді, коли приймач справді може відкласти підтвердження платформи.
7. Залишайте legacy helpers для dispatch відповідей лише на межах сумісності.
