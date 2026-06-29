---
read_when:
    - चैनल के भेजने या प्राप्त करने के व्यवहार की रिफैक्टरिंग
    - चैनल इनबाउंड, उत्तर डिस्पैच, आउटबाउंड कतार, पूर्वावलोकन स्ट्रीमिंग, या Plugin SDK संदेश APIs बदलना
    - एक नया चैनल Plugin डिज़ाइन करना, जिसे टिकाऊ प्रेषणों, रसीदों, पूर्वावलोकनों, संपादनों या पुनः प्रयासों की आवश्यकता है
summary: एकीकृत टिकाऊ संदेश प्राप्ति, प्रेषण, पूर्वावलोकन, संपादन और स्ट्रीमिंग जीवनचक्र के लिए डिज़ाइन योजना
title: संदेश जीवनचक्र रिफैक्टर
x-i18n:
    generated_at: "2026-06-28T22:59:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

यह पृष्ठ बिखरे हुए channel inbound, reply
dispatch, preview streaming, और outbound delivery helpers को एक टिकाऊ
message lifecycle से बदलने के लिए लक्षित डिजाइन है।

संक्षिप्त रूप:

- मुख्य primitives **प्राप्त करना** और **भेजना** होने चाहिए, **जवाब देना** नहीं।
- reply केवल outbound message पर एक relation है।
- turn inbound-processing की सुविधा है, delivery का मालिक नहीं।
- भेजना context आधारित होना चाहिए: `begin`, render, preview या stream, final send,
  commit, fail.
- प्राप्त करना भी context आधारित होना चाहिए: normalize, dedupe, route, record,
  dispatch, platform ack, fail.
- public plugin SDK को एक छोटे channel-outbound surface में सिमट जाना चाहिए।

## समस्याएं

मौजूदा channel stack कई वैध स्थानीय जरूरतों से विकसित हुआ:

- Simple inbound adapters `runtime.channel.inbound.run` का उपयोग करते हैं।
- Rich adapters `runtime.channel.inbound.runPreparedReply` का उपयोग करते हैं।
- Legacy helpers `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, reply payload helpers, reply chunking,
  reply references, और outbound runtime helpers का उपयोग करते हैं।
- Preview streaming channel-specific dispatchers में रहती है।
- Final delivery durability मौजूदा reply payload paths के आसपास जोड़ी जा रही है।

यह आकार स्थानीय bugs ठीक करता है, लेकिन यह OpenClaw में बहुत ज्यादा public
concepts और बहुत ज्यादा ऐसी जगहें छोड़ देता है जहां delivery semantics अलग हो सकती हैं।

इसे उजागर करने वाली reliability समस्या यह है:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

लक्षित invariant Telegram से व्यापक है: जब core यह तय कर ले कि कोई visible
outbound message मौजूद होना चाहिए, तो platform send का प्रयास करने से पहले intent
durable होना चाहिए, और सफलता के बाद platform receipt commit होनी चाहिए।
इससे OpenClaw को at-least-once recovery मिलती है। Exactly-once behavior केवल
उन adapters के लिए मौजूद है जो native idempotency साबित कर सकते हैं या replay से
पहले unknown-after-send attempt को platform state से reconcile कर सकते हैं।

यह इस refactor की अंतिम अवस्था है, हर मौजूदा path का वर्णन नहीं। Migration के
दौरान, existing outbound helpers अभी भी best-effort queue writes fail होने पर
direct send पर fall through कर सकते हैं। Refactor केवल तब complete है जब durable
final sends fail closed हों या documented non-durable policy के साथ explicit opt out करें।

## लक्ष्य

- सभी channel message receive और send paths के लिए एक core lifecycle।
- नए message lifecycle में adapter द्वारा replay-safe behavior घोषित करने के बाद default रूप से durable final sends।
- साझा preview, edit, stream, finalization, retry, recovery, और receipt semantics।
- एक छोटा plugin SDK surface जिसे third-party plugins सीख और maintain कर सकें।
- Migration के दौरान existing inbound reply compatibility callers के लिए compatibility।
- नई channel capabilities के लिए साफ extension points।
- core में कोई platform-specific branches नहीं।
- कोई token-delta channel messages नहीं। Channel streaming message preview,
  edit, append, या completed block delivery बनी रहती है।
- operational/system output के लिए structured OpenClaw-origin metadata ताकि visible
  gateway failures shared bot-enabled rooms में fresh prompts की तरह फिर से enter न करें।

## गैर-लक्ष्य

- पहले phase में हर existing channel को durable message delivery पर force न करें।
- हर channel को समान native transport behavior में force न करें।
- core को Telegram topics, Slack native streams, Matrix redactions,
  Feishu cards, QQ voice, या Teams activities न सिखाएं।
- सभी internal migration helpers को stable SDK API के रूप में publish न करें।
- retries को completed non-idempotent platform operations replay न करने दें।

## संदर्भ मॉडल

Vercel Chat के पास एक अच्छा public mental model है:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- adapter methods जैसे `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, और history fetches
- dedupe, locks, queues, और persistence के लिए state adapter

OpenClaw को vocabulary उधार लेनी चाहिए, surface की copy नहीं करनी चाहिए।

उस model से आगे OpenClaw को जिन चीजों की जरूरत है:

- Direct transport calls से पहले durable outbound send intents।
- begin, commit, और fail के साथ explicit send contexts।
- Receive contexts जिन्हें platform ack policy पता हो।
- Receipts जो restart के बाद भी survive करें और edits, deletes, recovery, और
  duplicate suppression चला सकें।
- एक छोटा public SDK। Bundled plugins internal runtime helpers का उपयोग कर सकते हैं, लेकिन
  third-party plugins को एक coherent message API दिखना चाहिए।
- Agent-specific behavior: sessions, transcripts, block streaming, tool
  progress, approvals, media directives, silent replies, और group mention
  history।

`thread.post()` style promises OpenClaw के लिए पर्याप्त नहीं हैं। वे उस
transaction boundary को छिपा देते हैं जो तय करती है कि send recoverable है या नहीं।

## Core model

नया domain internal core namespace जैसे
`src/channels/message/*` के अंतर्गत रहना चाहिए।

इसके चार concepts हैं:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` inbound lifecycle का मालिक है।

`send` outbound lifecycle का मालिक है।

`live` preview, edit, progress, और stream state का मालिक है।

`state` durable intent storage, receipts, idempotency, recovery, locks, और
dedupe का मालिक है।

## Message terms

### Message

Normalized message platform-neutral है:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Target

Target बताता है कि message कहां रहता है:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relation

Reply relation है, API root नहीं:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

इससे वही send path normal replies, cron notifications, approval
prompts, task completions, message-tool sends, CLI या Control UI sends, subagent
results, और automation sends संभाल सकता है।

### Origin

Origin बताता है कि message किसने बनाया और OpenClaw को उस message की echoes के साथ
कैसा व्यवहार करना चाहिए। यह relation से अलग है: कोई message user को reply हो सकता है
और फिर भी OpenClaw-originated operational output हो सकता है।

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

OpenClaw-originated output का अर्थ core own करता है। Channels own करते हैं कि वह
origin उनके transport में कैसे encoded है।

पहला required use gateway failure output है। Humans को फिर भी
"reply से पहले Agent विफल हुआ" या "API key missing है" जैसे messages दिखने चाहिए, लेकिन tagged
OpenClaw operational output को shared rooms में bot-authored input के रूप में accept नहीं किया जाना चाहिए
जब `allowBots` enabled हो।

### Receipt

Receipts first-class हैं:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Receipts durable intent से future edit, delete, preview
finalization, duplicate suppression, और recovery तक का bridge हैं।

Receipt एक platform message या multi-part delivery का वर्णन कर सकती है। Chunked
text, media plus text, voice plus text, और card fallbacks को threading और later edits
के लिए primary id expose करते हुए भी सभी platform ids preserve करने होंगे।

## Receive context

Receiving bare helper call नहीं होना चाहिए। core को ऐसा context चाहिए जिसे
dedupe, routing, session recording, और platform ack policy पता हो।

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Receive flow:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack एक चीज नहीं है। receive contract को इन signals को अलग रखना होगा:

- **Transport ack:** platform webhook या socket को बताता है कि OpenClaw ने
  event envelope accept कर लिया। कुछ platforms को dispatch से पहले इसकी जरूरत होती है।
- **Polling offset ack:** cursor को advance करता है ताकि वही event फिर से fetch न हो।
  यह ऐसे work से आगे advance नहीं होना चाहिए जिसे recover नहीं किया जा सकता।
- **Inbound record ack:** पुष्टि करता है कि OpenClaw ने redelivery को dedupe और route करने के लिए
  पर्याप्त inbound metadata persist कर लिया है।
- **User-visible receipt:** optional read/status/typing behavior; durability boundary कभी नहीं।

`ReceiveAckPolicy` केवल transport या polling acknowledgement control करता है। इसे
read receipts या status reactions के लिए reuse नहीं किया जाना चाहिए।

Bot authorization से पहले, receive को shared OpenClaw echo policy apply करनी होगी
जब channel message origin metadata decode कर सकता हो:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

यह drop tag-based है, text-based नहीं। समान visible gateway-failure text वाला
bot-authored room message, लेकिन OpenClaw origin metadata के बिना, फिर भी normal
`allowBots` authorization से गुजरता है।

Ack policy explicit है:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling अब अपने persisted restart watermark के लिए receive-context ack policy का उपयोग करती है।
Tracker अभी भी grammY updates को middleware chain में enter करते समय observe करता है, लेकिन
OpenClaw successful dispatch के बाद केवल safe completed update id persist करता है, जिससे failed या
lower pending updates restart के बाद replayable रहते हैं। Telegram का upstream `getUpdates` fetch offset अभी भी
polling library द्वारा controlled है, इसलिए अगर हमें OpenClaw के restart
watermark से आगे platform-level redelivery चाहिए, तो remaining deeper cut पूरी तरह durable polling
source है। Webhook platforms को immediate HTTP ack की जरूरत हो सकती है, लेकिन उन्हें फिर भी
inbound dedupe और durable outbound send intents चाहिए क्योंकि webhooks redeliver कर सकते हैं।

## Send context

भेजना भी संदर्भ-आधारित है:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

पसंदीदा ऑर्केस्ट्रेशन:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

सहायक का विस्तार यह होता है:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

ट्रांसपोर्ट I/O से पहले intent मौजूद होना चाहिए। begin के बाद लेकिन
commit से पहले रीस्टार्ट रिकवर किया जा सकता है।

खतरनाक सीमा प्लेटफ़ॉर्म सफलता के बाद और receipt commit से पहले है। यदि
प्रक्रिया वहां बंद हो जाती है, तो OpenClaw यह नहीं जान सकता कि प्लेटफ़ॉर्म संदेश मौजूद है या नहीं,
जब तक adapter native idempotency या receipt reconciliation पथ उपलब्ध नहीं कराता।
उन प्रयासों को `unknown_after_send` में फिर शुरू होना चाहिए, अंधाधुंध replay नहीं। जिन channels
में reconciliation नहीं है, वे at-least-once replay केवल तभी चुन सकते हैं जब duplicate visible
messages उस channel और relation के लिए स्वीकार्य, दस्तावेज़ित tradeoff हों।
वर्तमान SDK reconciliation bridge के लिए adapter को
`reconcileUnknownSend` घोषित करना पड़ता है, फिर यह `durableFinal.reconcileUnknownSend` से
किसी अज्ञात entry को `sent`, `not_sent`, या `unresolved` के रूप में
classify करने को कहता है; केवल `not_sent`
replay की अनुमति देता है, और unresolved entries terminal रहती हैं या केवल
reconciliation check को retry करती हैं।

Durability नीति स्पष्ट होनी चाहिए:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` का अर्थ है कि जब core durable intent नहीं लिख सकता तो उसे fail closed करना होगा।
`best_effort` persistence अनुपलब्ध होने पर आगे बढ़ सकता है। `disabled`
पुराना direct send व्यवहार रखता है। migration के दौरान, legacy wrappers और public
compatibility helpers का default `disabled` होता है; उन्हें इस तथ्य से
`required` infer नहीं करना चाहिए कि किसी channel के पास generic outbound adapter है।

Send contexts channel-local post-send effects के भी मालिक होते हैं। migration तब सुरक्षित नहीं है
यदि durable delivery उस local behavior को bypass करती है जो पहले
channel के direct send path से जुड़ा था। उदाहरणों में self-echo suppression caches,
thread participation markers, native edit anchors, model-signature rendering,
और platform-specific duplicate guards शामिल हैं। उन effects को या तो
send adapter, render adapter, या named send-context hook में जाना होगा, उसके बाद ही वह
channel durable generic final delivery enable कर सकता है।

Send helpers को receipts उनके caller तक पूरे रास्ते वापस लौटानी चाहिए। Durable
wrappers message ids को swallow नहीं कर सकते या channel delivery result को
`undefined` से replace नहीं कर सकते; buffered dispatchers उन ids का उपयोग thread anchors, बाद के edits,
preview finalization, और duplicate suppression के लिए करते हैं।

Fallback sends batches पर काम करते हैं, single payloads पर नहीं। Silent-reply rewrites,
media fallback, card fallback, और chunk projection सभी एक से अधिक deliverable message
बना सकते हैं, इसलिए send context को या तो पूरा projected batch deliver करना होगा
या स्पष्ट रूप से document करना होगा कि केवल एक payload ही valid क्यों है।

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

जब ऐसा fallback durable हो, तो पूरे projected batch को
एक durable send intent या किसी अन्य atomic batch plan से represent करना होगा। प्रत्येक payload को
एक-एक करके record करना पर्याप्त नहीं है: payloads के बीच crash होने से partial visible
fallback रह सकता है, जिसमें remaining payloads के लिए कोई durable record नहीं होगा। Recovery को यह जानना होगा
कि किन units के पास पहले से receipts हैं और या तो केवल missing units को replay करना होगा या
batch को `unknown_after_send` mark करना होगा जब तक adapter उसका reconciliation नहीं कर देता।

## लाइव संदर्भ

Preview, edit, progress, और stream behavior एक opt-in lifecycle होना चाहिए।

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Live state duplicate को recover या suppress करने के लिए पर्याप्त durable है:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

यह current behavior को cover करना चाहिए:

- Telegram send plus edit preview, stale preview age के बाद fresh final के साथ।
- Discord send plus edit preview, media/error/explicit reply पर cancel।
- Slack native stream या draft preview, thread shape पर निर्भर।
- Mattermost draft post finalization।
- Matrix draft event finalization या mismatch पर redaction।
- Teams native progress stream।
- QQ Bot stream या accumulated fallback।

## Adapter सतह

Public SDK target एक subpath होना चाहिए:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Target shape:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Send adapter:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Receive adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

preflight authorization से पहले, core को shared OpenClaw echo predicate चलाना होगा
जब भी `origin.decode` OpenClaw-origin metadata लौटाए। receive adapter
platform facts देता है, जैसे bot author और room shape; core drop
decision और ordering का मालिक है ताकि channels text filters को फिर से implement न करें।

Origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core `MessageOrigin` set करता है। Channels केवल इसे native
transport metadata में और उससे translate करते हैं। Slack इसे `chat.postMessage({ metadata })` और
inbound `message.metadata` पर map करता है; Matrix इसे extra event content पर map कर सकता है; जिन channels में
native metadata नहीं है वे receipt/outbound registry का उपयोग कर सकते हैं जब वही
सबसे अच्छा उपलब्ध approximation हो।

Capabilities:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Public SDK कटौती

नई public surface को इन conceptual areas को absorb या deprecate करना चाहिए:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` के अधिकांश public uses
- ad hoc draft stream lifecycle helpers

Compatibility subpaths wrappers के रूप में रह सकते हैं, लेकिन नए third-party plugins
को उनकी जरूरत नहीं होनी चाहिए।

Bundled plugins migration के दौरान reserved runtime
subpaths के माध्यम से internal helper imports रख सकते हैं। Public docs को plugin authors को
`plugin-sdk/channel-outbound` की ओर मार्गदर्शित करना चाहिए, जब वह मौजूद हो।

## channel inbound से संबंध

`runtime.channel.inbound.*` migration के दौरान runtime bridge है।

इसे compatibility adapter बनना चाहिए:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` को भी शुरू में बने रहना चाहिए:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

पुराना `channel.turn` runtime surface हटा दिया गया था। Runtime callers
`channel.inbound.*` का उपयोग करते हैं; channel docs और SDK subpaths inbound/message nouns का उपयोग करते हैं।

## Compatibility guardrails

migration के दौरान, generic durable delivery किसी भी channel के लिए opt-in है जिसकी
existing delivery callback में "send this payload" से आगे side effects हैं।

Legacy entry points default रूप से non-durable हैं:

- `channel.inbound.run` और `dispatchChannelInboundReply` channel की
  delivery callback का उपयोग करते हैं, जब तक वह channel स्पष्ट रूप से audited durable
  policy/options object उपलब्ध न कराए।
- `channel.inbound.runPreparedReply` channel-owned रहता है, जब तक prepared dispatcher
  स्पष्ट रूप से send context को call नहीं करता।
- Public compatibility helpers जैसे `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, और direct-DM helpers caller-provided `deliver`
  या `reply` callback से पहले कभी generic durable delivery inject नहीं करते।

migration bridge types के लिए, `durable: undefined` का अर्थ है "durable नहीं"। durable
path केवल explicit policy/options value से enable होता है। `durable:
false` compatibility spelling के रूप में रह सकता है, लेकिन implementation को
हर unmigrated channel से इसे add करने की requirement नहीं रखनी चाहिए।

Current bridge code को durability decision explicit रखना होगा:

- टिकाऊ अंतिम डिलीवरी एक discriminated स्थिति लौटाती है। `handled_visible` और
  `handled_no_send` अंतिम हैं; `unsupported` और `not_applicable` channel-स्वामित्व वाली डिलीवरी पर
  वापस जा सकते हैं; `failed` भेजने की विफलता को आगे प्रसारित करता है।
- सामान्य टिकाऊ अंतिम डिलीवरी adapter क्षमताओं द्वारा नियंत्रित होती है, जैसे
  मौन डिलीवरी, reply target संरक्षण, native quote संरक्षण, और
  message-sending hooks। अनुपस्थित समानता को channel-स्वामित्व वाली डिलीवरी चुननी चाहिए,
  ऐसा सामान्य send नहीं जो उपयोगकर्ता-दृश्य व्यवहार बदल दे।
- Queue-समर्थित टिकाऊ sends एक delivery intent reference उजागर करते हैं। मौजूदा
  `pendingFinalDelivery*` session fields transition के दौरान intent id रख सकते हैं;
  अंतिम स्थिति frozen reply text और ad hoc context fields के बजाय एक `MessageSendIntent` store है।

किसी channel के लिए generic durable path तब तक सक्षम न करें जब तक ये सभी
सत्य न हों:

- generic send adapter पुराने direct path जैसा ही rendering और transport व्यवहार निष्पादित करता है।
- स्थानीय post-send side effects send context के माध्यम से संरक्षित हैं।
- adapter सभी platform message ids के साथ receipts या delivery results लौटाता है।
- Prepared dispatcher paths या तो नए send context को call करते हैं या durable guarantee से बाहर के रूप में documented रहते हैं।
- Fallback delivery हर projected payload को संभालती है, केवल पहले वाले को नहीं।
- Durable fallback delivery पूरे projected payload array को एक
  replayable intent या batch plan के रूप में रिकॉर्ड करती है।

संरक्षित रखने योग्य ठोस migration hazards:

- iMessage monitor delivery सफल send के बाद sent messages को echo cache में रिकॉर्ड करती है। Durable final sends को अभी भी वह cache populate करना होगा, अन्यथा
  OpenClaw अपनी ही final replies को inbound user messages के रूप में फिर से ingest कर सकता है।
- Tlon optional model signature जोड़ता है और group replies के बाद participated threads रिकॉर्ड करता है। Generic durable delivery को उन effects को bypass नहीं करना चाहिए;
  या तो उन्हें Tlon render/send/finalize adapters में move करें या Tlon को
  channel-owned path पर रखें।
- Discord और अन्य prepared dispatchers पहले से direct delivery और preview
  behavior के स्वामी हैं। वे assembled-turn durable guarantee द्वारा covered नहीं हैं जब तक
  उनके prepared dispatchers स्पष्ट रूप से finals को send context के माध्यम से route नहीं करते।
- Telegram silent fallback delivery को पूरा projected payload
  array deliver करना होगा। single-payload shortcut projection के बाद अतिरिक्त fallback payloads को drop कर सकता है।
- LINE, Zalo, Nostr, और अन्य मौजूदा assembled/helper paths में
  reply-token handling, media proxying, sent-message caches, loading/status
  cleanup, या callback-only targets हो सकते हैं। वे channel-owned delivery पर रहते हैं जब तक
  वे semantics send adapter द्वारा represented और tests द्वारा verified न हों।
- Direct-DM helpers में ऐसा reply callback हो सकता है जो ही एकमात्र सही transport
  target है। Generic outbound को `OriginatingTo` या `To` से guess करके
  उस callback को skip नहीं करना चाहिए।
- OpenClaw gateway failure output मनुष्यों को visible रहना चाहिए, लेकिन tagged
  bot-authored room echoes को `allowBots` authorization से पहले drop करना होगा।
  Channels को इसे visible-text prefix filters से implement नहीं करना चाहिए, सिवाय
  छोटे emergency stopgap के; durable contract structured origin metadata है।

## Internal storage

durable queue को reply payloads नहीं, message send intents store करने चाहिए।

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Recovery loop:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

queue को restart के बाद उसी account,
thread, target, formatting policy, और media rules के माध्यम से replay करने के लिए पर्याप्त identity रखनी चाहिए।

## Failure classes

Channel adapters transport failures को बंद categories में classify करते हैं:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Core policy:

- `transient` और `rate_limit` को retry करें।
- render fallback मौजूद न हो तो `invalid_payload` को retry न करें।
- configuration बदलने तक `auth` या `permission` को retry न करें।
- `not_found` के लिए, channel द्वारा safe घोषित किए जाने पर live finalization को edit से fresh send पर fall back करने दें।
- `conflict` के लिए, message पहले से मौजूद है या नहीं यह तय करने के लिए receipt/idempotency rules का उपयोग करें।
- adapter द्वारा platform I/O पूरा कर लेने के बाद लेकिन receipt
  commit से पहले कोई भी error `unknown_after_send` बन जाती है, जब तक adapter prove न कर सके कि platform
  operation नहीं हुआ।

## Channel mapping

| चैनल         | लक्षित माइग्रेशन                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | ack नीति और टिकाऊ अंतिम भेजाव प्राप्त करें। लाइव अडैप्टर भेजने और पूर्वावलोकन संपादन, पुराने पूर्वावलोकन का अंतिम भेजाव, विषयों, quote-reply पूर्वावलोकन छोड़ने, मीडिया fallback, और retry-after हैंडलिंग का स्वामी है।                                                                                                                                                                   |
| Discord         | भेजने वाला अडैप्टर मौजूदा टिकाऊ पेलोड डिलीवरी को लपेटता है। लाइव अडैप्टर ड्राफ्ट संपादन, प्रगति ड्राफ्ट, मीडिया/त्रुटि पूर्वावलोकन रद्दीकरण, उत्तर लक्ष्य संरक्षण, और संदेश id रसीदों का स्वामी है। साझा कमरों में bot द्वारा लिखी गई Gateway-विफलता प्रतिध्वनियों का ऑडिट करें; यदि Discord सामान्य संदेशों पर उद्गम मेटाडेटा नहीं ले जा सकता, तो आउटबाउंड रजिस्ट्री या अन्य स्थानीय समकक्ष का उपयोग करें। |
| Slack           | भेजने वाला अडैप्टर सामान्य चैट पोस्ट संभालता है। लाइव अडैप्टर thread आकार के समर्थन पर स्थानीय stream चुनता है, अन्यथा ड्राफ्ट पूर्वावलोकन। रसीदें thread timestamps संरक्षित करती हैं। उद्गम अडैप्टर OpenClaw Gateway विफलताओं को Slack `chat.postMessage.metadata` पर मैप करता है और `allowBots` authorization से पहले टैग की गई bot-room प्रतिध्वनियों को छोड़ता है।                                  |
| WhatsApp        | भेजने वाला अडैप्टर टिकाऊ अंतिम intents के साथ text/media भेजने का स्वामी है। प्राप्त करने वाला अडैप्टर group mention और sender identity संभालता है। जब तक WhatsApp में संपादन योग्य transport न हो, लाइव अनुपस्थित रह सकता है।                                                                                                                                                                        |
| Matrix          | लाइव अडैप्टर ड्राफ्ट event edits, finalization, redaction, encrypted media constraints, और reply-target mismatch fallback का स्वामी है। प्राप्त करने वाला अडैप्टर encrypted event hydration और dedupe का स्वामी है। उद्गम अडैप्टर को OpenClaw Gateway-विफलता उद्गम को Matrix event content में encode करना चाहिए और `allowBots` handling से पहले configured-bot room प्रतिध्वनियों को छोड़ना चाहिए।              |
| Mattermost      | लाइव अडैप्टर एक draft post, progress/tool folding, in-place finalization, और fresh-send fallback का स्वामी है।                                                                                                                                                                                                                                                       |
| Microsoft Teams | लाइव अडैप्टर स्थानीय progress और block stream व्यवहार का स्वामी है। भेजने वाला अडैप्टर activities और attachment/card receipts का स्वामी है।                                                                                                                                                                                                                                        |
| Feishu          | Render अडैप्टर text/card/raw rendering का स्वामी है। लाइव अडैप्टर streaming cards और duplicate final suppression का स्वामी है। भेजने वाला अडैप्टर comments, topic sessions, media, और voice suppression का स्वामी है।                                                                                                                                                                      |
| QQ Bot          | लाइव अडैप्टर C2C streaming, accumulator timeout, और fallback final send का स्वामी है। Render अडैप्टर media tags और text-as-voice का स्वामी है।                                                                                                                                                                                                                               |
| Signal          | सरल प्राप्ति और भेजने वाला अडैप्टर। जब तक signal-cli भरोसेमंद edit support नहीं जोड़ता, कोई लाइव अडैप्टर नहीं।                                                                                                                                                                                                                                                                |
| iMessage        | सरल प्राप्ति और भेजने वाला अडैप्टर। टिकाऊ finals monitor delivery को bypass कर सकें, उससे पहले iMessage send को monitor echo-cache population संरक्षित करनी होगी।                                                                                                                                                                                                                 |
| Google Chat     | spaces और thread ids पर मैप किए गए thread relation के साथ सरल प्राप्ति और भेजने वाला अडैप्टर। टैग की गई OpenClaw Gateway-विफलता प्रतिध्वनियों के लिए `allowBots=true` room व्यवहार का ऑडिट करें।                                                                                                                                                                                        |
| LINE            | reply-token constraints को target/relation capability के रूप में model किए गए सरल प्राप्ति और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK receive bridge और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                                                                                          |
| IRC             | सरल प्राप्ति और भेजने वाला अडैप्टर, कोई टिकाऊ edit receipts नहीं।                                                                                                                                                                                                                                                                                                    |
| Nostr           | encrypted DMs के लिए प्राप्ति और भेजने वाला अडैप्टर; रसीदें event ids हैं।                                                                                                                                                                                                                                                                                           |
| QA Channel      | प्राप्ति, भेजने, लाइव, retry, और recovery व्यवहार के लिए contract-test अडैप्टर।                                                                                                                                                                                                                                                                                   |
| Synology Chat   | सरल प्राप्ति और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                                                                                              |
| Tlon            | generic टिकाऊ final delivery सक्षम होने से पहले भेजने वाले अडैप्टर को model-signature rendering और participated-thread tracking संरक्षित करनी होगी।                                                                                                                                                                                                                        |
| Twitch          | rate-limit classification के साथ सरल प्राप्ति और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                                                               |
| Zalo            | सरल प्राप्ति और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | सरल प्राप्ति और भेजने वाला अडैप्टर।                                                                                                                                                                                                                                                                                                                              |

## माइग्रेशन योजना

### चरण 1: आंतरिक संदेश डोमेन

- संदेशों, लक्ष्यों, संबंधों,
  उद्गमों, रसीदों, क्षमताओं, टिकाऊ intents, receive context, send
  context, live context, और failure classes के लिए `src/channels/message/*` प्रकार जोड़ें।
- मौजूदा reply delivery द्वारा उपयोग किए जाने वाले migration bridge payload type में
  `origin?: MessageOrigin` जोड़ें, फिर जैसे-जैसे refactor reply payloads को बदलता है,
  उस field को `ChannelMessage` और rendered
  message types में ले जाएं।
- इसे तब तक आंतरिक रखें जब तक अडैप्टर और tests shape को सिद्ध न कर दें।
- state transitions और serialization के लिए pure unit tests जोड़ें।

### चरण 2: टिकाऊ भेजने वाला Core

- मौजूदा outbound queue को reply-payload durability से टिकाऊ
  message send intents पर ले जाएं।
- टिकाऊ send intent को केवल एक reply payload नहीं, बल्कि projected payload array या batch plan ले जाने दें।
- compatibility conversion के जरिए मौजूदा queue recovery behavior को संरक्षित रखें।
- `deliverOutboundPayloads` से `messages.send` call कराएं।
- adapter द्वारा replay safety घोषित करने के बाद, नए message lifecycle में durable intent
  नहीं लिखे जा सकने पर final-send durability को default बनाएं और fail closed करें।
  मौजूदा inbound runner और SDK compatibility paths इस चरण के दौरान default रूप से direct-send बने रहते हैं।
- रसीदें लगातार record करें।
- टिकाऊ send को terminal side effect मानने के बजाय original dispatcher caller को receipts और delivery results लौटाएं।
- durable send intents के जरिए message origin persist करें ताकि recovery, replay, और
  chunked sends OpenClaw operational provenance संरक्षित रखें।

### चरण 3: Channel Inbound Bridge

- `channel.inbound.run` और `dispatchChannelInboundReply` को
  `messages.receive` और `messages.send` के ऊपर दोबारा लागू करें।
- मौजूदा fact types स्थिर रखें।
- legacy behavior को default रूप से रखें। assembled-turn channel केवल तब durable बनता है
  जब उसका adapter replay-safe durability policy के साथ स्पष्ट रूप से opt in करता है।
- उन paths के लिए compatibility escape hatch के रूप में `durable: false` रखें जो
  native edits finalize करते हैं और अभी सुरक्षित रूप से replay नहीं कर सकते, लेकिन unmigrated channels
  की सुरक्षा के लिए `false` markers पर निर्भर न रहें।
- नए message lifecycle में ही assembled-turn durability को default करें, उसके बाद
  जब channel mapping सिद्ध कर दे कि generic send path पुराने channel
  delivery semantics को संरक्षित रखता है।

### चरण 4: Prepared Dispatcher Bridge

- `deliverDurableInboundReplyPayload` को send-context bridge से बदलें.
- पुराने helper को wrapper के रूप में रखें.
- पहले Telegram, WhatsApp, Slack, Signal, iMessage, और Discord को पोर्ट करें क्योंकि
  उनके पास पहले से durable-final काम या सरल send paths हैं.
- हर prepared dispatcher को uncovered मानें जब तक वह स्पष्ट रूप से
  send context में opt in न करे. दस्तावेज़ीकरण और changelog प्रविष्टियों में "असेंबल किए गए
  channel turns" कहना चाहिए या migrated channel paths का नाम लेना चाहिए, बजाय सभी
  automatic final replies का दावा करने के.
- `recordInboundSessionAndDispatchReply`, direct-DM helpers, और इसी तरह के
  public compatibility helpers को behavior-preserving रखें. वे बाद में स्पष्ट
  send-context opt-in उजागर कर सकते हैं, लेकिन caller-owned delivery callback से पहले
  अपने आप generic durable delivery का प्रयास नहीं करना चाहिए.

### चरण 5: एकीकृत लाइव Lifecycle

- दो proof adapters के साथ `messages.live` बनाएँ:
  - Telegram, send plus edit plus stale final send के लिए.
  - Matrix, draft finalization plus redaction fallback के लिए.
- फिर Discord, Slack, Mattermost, Teams, QQ Bot, और Feishu को migrate करें.
- duplicated preview finalization code को केवल तब हटाएँ जब हर channel के पास
  parity tests हों.

### चरण 6: Public SDK

- `openclaw/plugin-sdk/channel-outbound` जोड़ें.
- इसे preferred channel Plugin API के रूप में document करें.
- package exports, entrypoint inventory, generated API baselines, और
  Plugin SDK docs अपडेट करें.
- channel-outbound SDK surface में `MessageOrigin`, origin encode/decode hooks, और shared
  `shouldDropOpenClawEcho` predicate शामिल करें.
- पुराने subpaths के लिए compatibility wrappers रखें.
- bundled plugins migrate होने के बाद docs में reply-named SDK helpers को
  deprecated के रूप में mark करें.

### चरण 7: सभी Senders

सभी non-reply outbound producers को `messages.send` पर ले जाएँ:

- Cron और Heartbeat notifications
- task completions
- hook results
- approval prompts और approval results
- message tool sends
- subagent completion announcements
- explicit CLI या Control UI sends
- automation/broadcast paths

यहीं model "agent replies" होना बंद करता है और "OpenClaw sends
messages" बन जाता है.

### चरण 8: Turn-Named Compatibility हटाएँ

- inbound/message-named wrappers को compatibility window के रूप में रखें.
- migration notes publish करें.
- पुराने imports के विरुद्ध Plugin SDK compatibility tests चलाएँ.
- पुराने internal helpers को केवल तब हटाएँ या छिपाएँ जब किसी bundled Plugin को उनकी ज़रूरत न हो
  और third-party contracts के पास stable replacement हो.

## Test plan

Unit tests:

- Durable send intent serialization और recovery.
- Idempotency key reuse और duplicate suppression.
- Receipt commit और replay skip.
- `unknown_after_send` recovery जो replay से पहले reconcile करती है जब कोई adapter
  reconciliation support करता है.
- Failure classification policy.
- Receive ack policy sequencing.
- reply, followup, system, और broadcast sends के लिए relation mapping.
- Gateway-failure origin factory और `shouldDropOpenClawEcho` predicate.
- payload normalization, chunking, durable queue
  serialization, और recovery के दौरान origin preservation.

Integration tests:

- `channel.inbound.run` simple adapter अभी भी records और sends करता है.
- Legacy assembled-event delivery durable नहीं बनती जब तक channel
  स्पष्ट रूप से opt in न करे.
- `channel.inbound.runPreparedReply` bridge अभी भी records और finalizes करता है.
- Public compatibility helpers default रूप से caller-owned delivery callbacks call करते हैं
  और उन callbacks से पहले generic-send नहीं करते.
- Durable fallback delivery restart के बाद पूरे projected payload array को replay करती है
  और early crash के बाद बाद के payloads को unrecorded नहीं छोड़ सकती.
- Durable assembled-event delivery buffered
  dispatcher को platform message ids लौटाती है.
- durable delivery disabled या unavailable होने पर भी custom delivery hooks
  platform message ids लौटाते हैं.
- Final reply assistant completion और platform send के बीच restart से बची रहती है.
- Preview draft अनुमति होने पर उसी जगह finalize होता है.
- media/error/reply-target mismatch के कारण normal delivery आवश्यक होने पर
  Preview draft cancel या redact होता है.
- Block streaming और preview streaming दोनों एक ही text deliver नहीं करते.
- जल्दी stream हुआ media final delivery में duplicate नहीं होता.

Channel tests:

- Telegram topic reply जिसमें polling ack receive context के safe
  completed watermark तक delayed रहता है.
- accepted-but-not-delivered updates के लिए Telegram polling recovery,
  persisted safe-completed offset model से covered है.
- Telegram stale preview fresh final भेजता है और preview clean up करता है.
- Telegram silent fallback हर projected fallback payload भेजता है.
- Telegram silent fallback durability पूरे projected fallback array को
  atomically record करती है, loop iteration के प्रति एक single-payload durable intent नहीं.
- media/error/explicit reply पर Discord preview cancel.
- Discord prepared dispatcher finals docs
  या changelog द्वारा Discord final-reply durability claim करने से पहले send context से route होते हैं.
- iMessage durable final sends monitor sent-message echo cache populate करते हैं.
- LINE, Zalo, और Nostr legacy delivery paths को
  generic durable send द्वारा bypass नहीं किया जाता जब तक उनके adapter parity tests मौजूद न हों.
- Direct-DM/Nostr callback delivery authoritative रहती है जब तक स्पष्ट रूप से
  complete message target और replay-safe send adapter में migrate न किया जाए.
- Slack tagged OpenClaw gateway failure messages visible outbound रहते हैं, tagged
  bot-room echoes `allowBots` से पहले drop होते हैं, और उसी
  visible text वाले untagged bot messages अभी भी normal bot authorization follow करते हैं.
- top-level DMs में Slack native stream fallback to draft preview.
- Matrix preview finalization और redaction fallback.
- configured bot accounts से Matrix tagged OpenClaw gateway-failure room echoes
  `allowBots` handling से पहले drop होते हैं.
- Discord और Google Chat shared-room gateway-failure cascade audits
  वहाँ generic protection claim करने से पहले `allowBots` modes cover करते हैं.
- Mattermost draft finalization और fresh-send fallback.
- Teams native progress finalization.
- Feishu duplicate final suppression.
- QQ Bot accumulator timeout fallback.
- Tlon durable final sends model-signature rendering और participated
  thread tracking preserve करते हैं.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo, और Zalo Personal simple durable final
  sends.

Validation:

- development के दौरान targeted Vitest files.
- पूरी changed surface के लिए Testbox में `pnpm check:changed`.
- complete refactor land करने से पहले या
  public SDK/export changes के बाद Testbox में broader `pnpm check`.
- compatibility wrappers हटाने से पहले कम से कम एक edit-capable channel और एक
  simple send-only channel के लिए live या qa-channel smoke.

## खुले प्रश्न

- क्या Telegram को अंततः grammY runner source को ऐसे
  fully durable polling source से बदलना चाहिए जो platform-level redelivery control कर सके,
  न कि केवल OpenClaw का persisted restart watermark.
- क्या durable live preview state को final send intent जैसी ही queue record
  में store किया जाना चाहिए या sibling live-state store में.
- `plugin-sdk/channel-outbound` ship होने के बाद
  compatibility wrappers कितने समय तक documented रहें.
- क्या third-party plugins को receive adapters directly implement करने चाहिए या केवल
  `defineChannelMessageAdapter` के माध्यम से normalize/send/live hooks provide करने चाहिए.
- कौन से receipt fields public SDK में expose करने के लिए safe हैं बनाम internal runtime
  state.
- self-echo caches और participated-thread markers जैसे side effects को
  send-context hooks, adapter-owned finalize steps, या
  receipt subscribers के रूप में model किया जाना चाहिए.
- किन channels के पास native origin metadata है, किन्हें persisted outbound
  registries चाहिए, और कौन reliable cross-bot echo suppression नहीं दे सकते.

## Acceptance criteria

- हर bundled message channel final visible output को
  `messages.send` के माध्यम से भेजता है.
- हर inbound message channel `messages.receive` या
  documented compatibility wrapper के माध्यम से enter करता है.
- हर preview/edit/stream channel draft state और
  finalization के लिए `messages.live` का उपयोग करता है.
- `channel.inbound` केवल wrapper है.
- Reply-named SDK helpers compatibility exports हैं, recommended path नहीं.
- Durable recovery restart के बाद pending final sends replay कर सकती है बिना
  final response खोए या already committed sends duplicate किए; जिन sends का
  platform outcome unknown है वे replay से पहले reconciled होते हैं या उस adapter के लिए
  at-least-once के रूप में documented होते हैं.
- Durable final sends तब fail closed करते हैं जब durable intent नहीं लिखा जा सकता,
  जब तक caller ने स्पष्ट रूप से documented non-durable mode select न किया हो.
- Legacy SDK compatibility helpers default रूप से direct
  channel-owned delivery करते हैं; generic durable send केवल explicit opt-in है.
- Receipts multi-part deliveries के लिए सभी platform message ids और
  threading/edit सुविधा के लिए primary id preserve करते हैं.
- Durable wrappers direct
  delivery callbacks बदलने से पहले channel-local side effects preserve करते हैं.
- Prepared dispatchers को durable नहीं गिना जाता जब तक उनका final delivery
  path स्पष्ट रूप से send context का उपयोग न करे.
- Fallback delivery हर projected payload handle करती है.
- Durable fallback delivery हर projected payload को एक replayable
  intent या batch plan में record करती है.
- OpenClaw-originated gateway failure output humans को visible होता है लेकिन tagged
  bot-authored room echoes उन channels पर bot authorization से पहले drop होते हैं जो
  origin contract के लिए support declare करते हैं.
- docs send, receive, live, state, receipts, relations, failure
  policy, migration, और test coverage समझाते हैं.

## संबंधित

- [Messages](/hi/concepts/messages)
- [Streaming और chunking](/hi/concepts/streaming)
- [Progress drafts](/hi/concepts/progress-drafts)
- [Retry policy](/hi/concepts/retry)
- [Channel inbound API](/hi/plugins/sdk-channel-inbound)
