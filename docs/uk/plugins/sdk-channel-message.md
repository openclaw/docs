---
read_when:
    - Ви створюєте або виконуєте рефакторинг Plugin каналу обміну повідомленнями
    - Вам потрібні надійна доставка фінальної відповіді, підтвердження отримання, фіналізація попереднього перегляду наживо або політика підтвердження отримання
    - Ви мігруєте зі застарілого конвеєра відповідей або допоміжних функцій диспетчеризації вхідних відповідей
summary: API життєвого циклу повідомлень для Plugin каналів, зокрема надійні надсилання, квитанції, живий попередній перегляд, політику підтвердження отримання та міграцію зі спадщини
title: API повідомлень каналу
x-i18n:
    generated_at: "2026-05-06T01:10:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14eb3105ef63a0c770173f83ed2de442a9651acdb5c81337c2751c1775d4e1e8
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

# API повідомлень каналів

Plugin-и каналів мають експортувати один адаптер `message` з
`openclaw/plugin-sdk/channel-message`. Адаптер описує нативний життєвий цикл повідомлення,
який підтримує платформа:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Ядро відповідає за черги, стійкість, загальну політику повторів, hooks, receipts і
спільний інструмент `message`. Plugin відповідає за нативні виклики send/edit/delete, нормалізацію цілей, потоки платформи, вибрані цитати, прапорці сповіщень, стан облікового запису та специфічні для платформи побічні ефекти.

Використовуйте цю сторінку разом із [Створенням Plugin-ів каналів](/uk/plugins/sdk-channel-plugins).

Підшлях `channel-message` навмисно достатньо легкий для гарячих файлів ініціалізації Plugin-ів, таких як `channel.ts`: він надає контракти адаптерів, підтвердження можливостей, receipts і фасади сумісності без завантаження вихідної доставки.
Runtime-помічники доставки доступні з
`openclaw/plugin-sdk/channel-message-runtime` для шляхів monitor/send, які вже виконують асинхронний ввід-вивід повідомлень.

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

Оголошуйте лише ті можливості, які адаптер справді зберігає. Кожна оголошена
можливість має мати контрактний тест.

## Вихідний міст

Якщо канал уже має сумісний адаптер `outbound`, краще виведіть адаптер
повідомлень із нього, а не дублюйте код надсилання:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Міст перетворює старі результати вихідного надсилання на значення `MessageReceipt`. Новий
код має передавати receipts наскрізно й виводити застарілі ідентифікатори лише на межах сумісності за допомогою `listMessageReceiptPlatformIds(...)` або
`resolveMessageReceiptPrimaryId(...)`.
Якщо політику отримання не надано, `createChannelMessageAdapterFromOutbound(...)`
використовує політику підтвердження отримання `manual`. Це робить підтвердження платформи, яким володіє Plugin, явним без зміни каналів, які підтверджують webhooks,
sockets або polling offsets поза загальним контекстом отримання.

## Надсилання інструментом Message

Спільний шлях `message(action="send")` має використовувати той самий життєвий цикл доставки ядра, що й фінальні відповіді. Якщо каналу потрібне специфічне для провайдера формування для надсилання інструментом, реалізуйте `actions.prepareSendPayload(...)` замість надсилання з
`actions.handleAction(...)`.

`prepareSendPayload(...)` отримує нормалізований ядром `ReplyPayload` плюс повний
контекст дії. Поверніть payload зі специфічними для каналу даними в
`payload.channelData.<channel>` і дозвольте ядру викликати `sendMessage(...)`,
`deliverOutboundPayloads(...)`, випереджальну чергу запису, hooks надсилання повідомлень,
повтор, відновлення та очищення ack.

Поверніть `null` лише тоді, коли надсилання неможливо представити як стійкий payload, наприклад, тому що він містить несеріалізовну фабрику компонентів. Ядро збереже fallback застарілої дії Plugin-а для сумісності, але нові можливості надсилання каналом мають виражатися як стійкі дані payload.

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
Це залишає специфічний для платформи рендеринг у Plugin-і, тоді як ядро й далі відповідає за
збереження, повтор, відновлення, hooks і ack.

Підготовлені payload-и `message(action="send")` і загальна доставка фінальної відповіді за замовчуванням використовують доставку ядра з best-effort queueing. Обов’язкова стійка черга допустима лише після того, як ядро перевірить, що канал може узгодити надсилання, результат якого після збою невідомий. Якщо адаптер не може реалізувати `reconcileUnknownSend`,
залишайте підготовлений шлях надсилання best-effort; ядро все одно спробує випереджальну чергу запису, але сталість черги або невизначене відновлення після збою не є частиною
обов’язкового контракту доставки.

## Можливості стійкого фінального надсилання

Стійка фінальна доставка вмикається окремо для кожного побічного ефекту. Ядро використовуватиме загальну
стійку доставку лише тоді, коли адаптер оголошує кожну можливість, потрібну
payload-у та параметрам доставки.

| Можливість             | Оголошуйте, коли                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Адаптер може надіслати текст і повернути receipt.                                      |
| `media`                | Надсилання медіа повертають receipts для кожного видимого повідомлення платформи.                      |
| `payload`              | Адаптер зберігає семантику розширеного payload відповіді, а не лише текст і один URL медіа. |
| `replyTo`              | Нативні цілі відповіді доходять до платформи.                                             |
| `thread`               | Нативні цілі thread, topic або channel thread доходять до платформи.                  |
| `silent`               | Приглушення сповіщень доходить до платформи.                                       |
| `nativeQuote`          | Метадані вибраної цитати доходять до платформи.                                        |
| `messageSendingHooks`  | Hooks надсилання повідомлень ядра можуть скасувати або переписати вміст перед I/O платформи.        |
| `batch`                | Багаточастинні відрендерені batch-и можна відтворити як один стійкий план.                      |
| `reconcileUnknownSend` | Адаптер може розв’язати відновлення `unknown_after_send` без сліпого повторного відтворення.          |
| `afterSendSuccess`     | Локальні для каналу побічні ефекти після надсилання виконуються один раз.                                      |
| `afterCommit`          | Локальні для каналу побічні ефекти після commit виконуються один раз.                                    |

Фінальна доставка best-effort не потребує `reconcileUnknownSend`; вона використовує
спільний життєвий цикл, коли адаптер зберігає видиму семантику payload-а, і
повертається до прямого I/O платформи, якщо сталість черги недоступна. Обов’язкова
стійка фінальна доставка має явно вимагати `reconcileUnknownSend`. Якщо
адаптер не може визначити, чи розпочате/невідоме надсилання дійшло до платформи,
не оголошуйте цю можливість; ядро відхилить обов’язкову стійку доставку
перед постановкою в чергу.

Коли виклику потрібна стійка доставка, виводьте вимоги замість ручного
створення мап:

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
лише для шляху, який навмисно не може запускати глобальні hooks надсилання повідомлень.

## Контракт стійкого надсилання

Стійке фінальне надсилання має суворішу семантику, ніж застаріла доставка, якою володіє канал:

- Створюйте стійкий намір перед I/O платформи.
- Якщо стійка доставка повертає оброблений результат, не переходьте до застарілого надсилання.
- Вважайте скасування hook-ом і результати без надсилання термінальними.
- Вважайте `unsupported` лише результатом до створення наміру.
- Для обов’язкової стійкості завершуйтеся помилкою перед I/O платформи, якщо черга не може записати,
  що надсилання на платформу розпочалося.
- Для обов’язкової фінальної доставки й обов’язкових підготовлених надсилань інструментом повідомлень
  виконуйте preflight `reconcileUnknownSend`; відновлення має бути здатне ack-нути
  вже надіслане повідомлення або повторити лише після того, як адаптер доведе, що початкове надсилання
  не відбулося.
- Для `best_effort` помилки запису в чергу можуть переходити до прямого I/O платформи.
- Передавайте abort signals до завантаження медіа та надсилань платформи.
- Запускайте after-commit hooks після ack черги; прямий fallback best-effort запускає їх
  після успішного I/O платформи, бо немає стійкого commit черги.
- Повертайте receipts для кожного видимого ідентифікатора повідомлення платформи.
- Використовуйте `reconcileUnknownSend`, коли платформа може перевірити, чи невизначене надсилання
  вже дійшло до користувача.

Цей контракт запобігає дублюванню надсилань після збоїв і запобігає обходу
hooks скасування надсилання повідомлень.

## Receipts

`MessageReceipt` — це новий внутрішній запис про те, що прийняла платформа:

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
результату надсилання. Використовуйте `createPreviewMessageReceipt(...)`, коли live preview повідомлення
стає фінальним receipt. Уникайте додавання нових локальних для власника полів `messageIds`.
Застарілий `ChannelDeliveryResult.messageIds` усе ще створюється на межах сумісності.

## Live Preview

Канали, які транслюють draft previews або progress updates, мають оголошувати live
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
`deliverWithFinalizableLivePreviewAdapter(...)` для runtime-фіналізації. Фіналізатор
вирішує, чи фінальна відповідь редагує preview на місці, надсилає
звичайний fallback, відкидає очікуваний стан preview, зберігає неоднозначну невдалу правку
без дублювання повідомлення та повертає фінальний receipt.

## Політика Ack для отримання

Вхідні receivers, які керують таймінгом підтвердження платформи, мають оголошувати
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

Адаптери, які не оголошують політику отримання, за замовчуванням мають:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Використовуйте типове значення, коли платформа не має підтвердження, яке можна відкласти, вже
підтверджує до асинхронної обробки або потребує специфічної для протоколу
семантики відповіді. Оголошуйте одну з поетапних політик лише тоді, коли отримувач справді
використовує контекст отримання, щоб перенести підтвердження платформи на пізніший етап.

Політики:

| Політика               | Коли використовувати                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `after_receive_record` | Платформу можна підтвердити після розбору й запису вхідної події.                    |
| `after_agent_dispatch` | Платформа має чекати, доки диспетчеризацію агента буде прийнято.                     |
| `after_durable_send`   | Платформа має чекати, доки фінальна доставка матиме довговічне рішення.              |
| `manual`               | Plugin керує підтвердженням, бо семантика платформи не відповідає загальному етапу. |

Використовуйте `createMessageReceiveContext(...)` в отримувачах, які відкладають стан ack, і
`shouldAckMessageAfterStage(...)`, коли отримувачу потрібно перевірити, чи
етап задовольнив налаштовану політику.

## Контрактні тести

Оголошення можливостей є частиною контракту plugin. Підтверджуйте їх тестами:

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

Додайте набори доказових тестів для live і receive, коли адаптер оголошує ці функції.
Відсутній доказ має провалювати тест, а не непомітно розширювати довговічну
поверхню.

## Застарілі API сумісності

Ці API залишаються доступними для імпорту задля сумісності зі сторонніми розробниками.
Не використовуйте їх для нового коду каналів.

| Застарілий API                              | Заміна                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` для диспетчерів сумісності або адаптер `message` для нового коду каналів |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` з `openclaw/plugin-sdk/channel-message-runtime`                   |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` лише для диспетчерів сумісності                                         |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` лише для диспетчерів сумісності                                           |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` плюс `deliverWithFinalizableLivePreviewAdapter(...)`                    |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Диспетчери сумісності все ще можуть використовувати `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` і `createTypingCallbacks(...)` через
фасад повідомлень. Новий код життєвого циклу має уникати старого
підшляху `channel-reply-pipeline`.

## Контрольний список міграції

1. Додайте `message: defineChannelMessageAdapter(...)` або
   `message: createChannelMessageAdapterFromOutbound(...)` до plugin каналу.
2. Повертайте `MessageReceipt` з надсилань тексту, медіа й payload.
3. Оголошуйте лише можливості, підкріплені нативною поведінкою та тестами.
4. Замініть рукописні мапи довговічних вимог на
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Перенесіть фіналізацію попереднього перегляду через допоміжні засоби live preview, коли канал
   редагує чернетки повідомлень на місці.
6. Оголошуйте політику receive ack лише тоді, коли отримувач справді може відкласти
   підтвердження платформи.
7. Залишайте застарілі допоміжні засоби диспетчеризації відповідей лише на межах сумісності.
