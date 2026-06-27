---
read_when:
    - การรีแฟกเตอร์พฤติกรรมการส่งหรือรับของช่องทาง
    - การเปลี่ยนแปลงการรับเข้าขาเข้าของช่องทาง, การส่งต่อคำตอบ, คิวขาออก, การสตรีมตัวอย่างล่วงหน้า, หรือ API ข้อความของ Plugin SDK
    - การออกแบบ Plugin ช่องทางใหม่ที่ต้องการการส่งที่ทนทาน ใบตอบรับ ตัวอย่างก่อนส่ง การแก้ไข หรือการลองส่งซ้ำ
summary: แผนการออกแบบสำหรับวงจรชีวิตแบบรวมศูนย์ที่คงทนของการรับ ส่ง แสดงตัวอย่าง แก้ไข และสตรีมข้อความ
title: การปรับโครงสร้างวงจรชีวิตของข้อความ
x-i18n:
    generated_at: "2026-06-27T17:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

หน้านี้คือการออกแบบเป้าหมายสำหรับแทนที่ตัวช่วยที่กระจัดกระจายสำหรับข้อความขาเข้าของช่องทาง การส่งคำตอบ
การสตรีมตัวอย่าง และการส่งออกขาออก ด้วยวงจรชีวิตข้อความที่ทนทานเพียงหนึ่งเดียว

สรุปสั้น ๆ:

- primitive หลักควรเป็น **receive** และ **send** ไม่ใช่ **reply**
- การตอบกลับเป็นเพียงความสัมพันธ์บนข้อความขาออก
- turn เป็นความสะดวกสำหรับการประมวลผลขาเข้า ไม่ใช่เจ้าของการส่งมอบ
- การส่งต้องอิงบริบท: `begin`, render, preview หรือ stream, final send,
  commit, fail
- การรับก็ต้องอิงบริบทเช่นกัน: normalize, dedupe, route, record,
  dispatch, platform ack, fail
- SDK Plugin สาธารณะควรยุบเหลือพื้นผิว channel-outbound ขนาดเล็กเพียงหนึ่งเดียว

## ปัญหา

สแต็กช่องทางปัจจุบันเติบโตมาจากความต้องการเฉพาะที่ถูกต้องหลายอย่าง:

- อะแดปเตอร์ขาเข้าแบบง่ายใช้ `runtime.channel.inbound.run`
- อะแดปเตอร์แบบเต็มรูปแบบใช้ `runtime.channel.inbound.runPreparedReply`
- ตัวช่วย legacy ใช้ `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, ตัวช่วย payload การตอบกลับ, การแบ่งชิ้นส่วนการตอบกลับ,
  การอ้างอิงการตอบกลับ และตัวช่วย runtime ขาออก
- การสตรีมตัวอย่างอยู่ใน dispatcher เฉพาะช่องทาง
- กำลังเพิ่มความทนทานของการส่งมอบขั้นสุดท้ายรอบ path payload การตอบกลับที่มีอยู่

รูปแบบนั้นแก้บั๊กเฉพาะที่ได้ แต่ทำให้ OpenClaw มีแนวคิดสาธารณะมากเกินไป
และมีจุดมากเกินไปที่ semantics ของการส่งมอบอาจคลาดเคลื่อนได้

ปัญหาความน่าเชื่อถือที่เผยให้เห็นเรื่องนี้คือ:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

invariant เป้าหมายกว้างกว่า Telegram: เมื่อ core ตัดสินว่าควรมีข้อความขาออกที่มองเห็นได้
intent ต้องทนทานก่อนพยายามส่งไปยังแพลตฟอร์ม และต้อง commit ใบรับของแพลตฟอร์มหลังสำเร็จ
สิ่งนี้ทำให้ OpenClaw กู้คืนแบบ at-least-once ได้ พฤติกรรม exactly-once มีได้เฉพาะ
สำหรับอะแดปเตอร์ที่พิสูจน์ native idempotency ได้ หรือ reconcile ความพยายามส่งที่อยู่ในสถานะ
unknown-after-send กับสถานะแพลตฟอร์มก่อน replay ได้

นี่คือสถานะปลายทางของการ refactor นี้ ไม่ใช่คำอธิบายของทุก path ปัจจุบัน
ระหว่าง migration ตัวช่วยขาออกที่มีอยู่ยังสามารถตกกลับไปเป็น direct send ได้เมื่อการเขียน queue แบบ best-effort ล้มเหลว
การ refactor จะสมบูรณ์ก็ต่อเมื่อ durable final sends fail closed หรือ opt out อย่างชัดเจนด้วยนโยบาย non-durable ที่มีเอกสารกำกับ

## เป้าหมาย

- วงจรชีวิต core เดียวสำหรับ path การรับและส่งข้อความของทุกช่องทาง
- final sends ที่ทนทานโดยค่าเริ่มต้นในวงจรชีวิตข้อความใหม่ หลังจากอะแดปเตอร์
  ประกาศพฤติกรรมที่ replay-safe
- semantics ร่วมสำหรับ preview, edit, stream, finalization, retry, recovery และ receipt
- พื้นผิว SDK Plugin ขนาดเล็กที่ Plugin ภายนอกสามารถเรียนรู้และดูแลได้
- ความเข้ากันได้สำหรับ caller ของ inbound reply compatibility ที่มีอยู่ระหว่าง migration
- จุดขยายที่ชัดเจนสำหรับความสามารถใหม่ของช่องทาง
- ไม่มี branch เฉพาะแพลตฟอร์มใน core
- ไม่มีข้อความช่องทางแบบ token-delta การสตรีมของช่องทางยังคงเป็น message preview,
  edit, append หรือการส่งมอบ block ที่เสร็จสมบูรณ์
- metadata ต้นทางจาก OpenClaw แบบมีโครงสร้างสำหรับ output เชิงปฏิบัติการ/ระบบ เพื่อให้ gateway failure ที่มองเห็นได้
  ไม่กลับเข้าไปในห้องร่วมที่เปิดใช้บอทในฐานะ prompt ใหม่

## ไม่ใช่เป้าหมาย

- ไม่บังคับให้ทุกช่องทางที่มีอยู่ใช้การส่งมอบข้อความแบบทนทานในเฟสแรก
- ไม่บังคับให้ทุกช่องทางมีพฤติกรรม transport native เหมือนกัน
- ไม่สอน core เกี่ยวกับหัวข้อ Telegram, native streams ของ Slack, redactions ของ Matrix,
  cards ของ Feishu, เสียงของ QQ หรือ activities ของ Teams
- ไม่เผยแพร่ตัวช่วย migration ภายในทั้งหมดเป็น API SDK ที่เสถียร
- ไม่ทำให้ retry replay การดำเนินการแพลตฟอร์มแบบ non-idempotent ที่เสร็จสมบูรณ์แล้ว

## โมเดลอ้างอิง

Vercel Chat มี mental model สาธารณะที่ดี:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- เมธอดอะแดปเตอร์ เช่น `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` และการดึง history
- state adapter สำหรับ dedupe, locks, queues และ persistence

OpenClaw ควรยืมคำศัพท์ ไม่ใช่คัดลอกพื้นผิว

สิ่งที่ OpenClaw ต้องการเพิ่มเติมจากโมเดลนั้น:

- send intents ขาออกที่ทนทานก่อนเรียก transport โดยตรง
- send contexts ที่ชัดเจนพร้อม begin, commit และ fail
- receive contexts ที่รู้ policy การ ack ของแพลตฟอร์ม
- receipts ที่อยู่รอดหลัง restart และสามารถขับเคลื่อน edits, deletes, recovery และ
  duplicate suppression
- SDK สาธารณะที่เล็กกว่า Plugin ที่ bundled สามารถใช้ตัวช่วย runtime ภายในได้ แต่
  Plugin ภายนอกควรเห็น message API ที่สอดคล้องเป็นหนึ่งเดียว
- พฤติกรรมเฉพาะ agent: sessions, transcripts, block streaming, tool
  progress, approvals, media directives, silent replies และ history การ mention ใน group

promise แบบ `thread.post()` ไม่เพียงพอสำหรับ OpenClaw เพราะซ่อน
ขอบเขตธุรกรรมที่ตัดสินว่าการส่ง recoverable หรือไม่

## โมเดล Core

domain ใหม่ควรอยู่ภายใต้ namespace core ภายใน เช่น
`src/channels/message/*`

มีแนวคิดสี่อย่าง:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` เป็นเจ้าของวงจรชีวิตขาเข้า

`send` เป็นเจ้าของวงจรชีวิตขาออก

`live` เป็นเจ้าของ preview, edit, progress และสถานะ stream

`state` เป็นเจ้าของ durable intent storage, receipts, idempotency, recovery, locks และ
dedupe

## คำศัพท์ข้อความ

### ข้อความ

ข้อความที่ normalize แล้วเป็นกลางต่อแพลตฟอร์ม:

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

### เป้าหมาย

target อธิบายว่าข้อความอยู่ที่ใด:

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

### ความสัมพันธ์

Reply เป็นความสัมพันธ์ ไม่ใช่ root ของ API:

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

สิ่งนี้ทำให้ path การส่งเดียวกันรองรับการตอบกลับปกติ การแจ้งเตือน Cron, prompt การอนุมัติ,
การทำ task ให้เสร็จ, การส่งผ่าน message-tool, การส่งจาก CLI หรือ Control UI, ผลลัพธ์จาก subagent
และการส่งจาก automation ได้

### Origin

Origin อธิบายว่าใครสร้างข้อความและ OpenClaw ควรจัดการ echo ของข้อความนั้นอย่างไร
มันแยกจาก relation: ข้อความสามารถเป็นการตอบกลับผู้ใช้
และยังเป็น output เชิงปฏิบัติการที่มีต้นทางจาก OpenClaw ได้

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

Core เป็นเจ้าของความหมายของ output ที่มีต้นทางจาก OpenClaw ช่องทางเป็นเจ้าของวิธีเข้ารหัส
origin นั้นลงใน transport ของตน

การใช้งานครั้งแรกที่ต้องมีคือ output ของ gateway failure มนุษย์ยังควรเห็น
ข้อความ เช่น "Agent failed before reply" หรือ "Missing API key" แต่ output เชิงปฏิบัติการของ OpenClaw
ที่ติด tag ต้องไม่ถูกยอมรับเป็น input ที่เขียนโดยบอทในห้องร่วมเมื่อเปิดใช้ `allowBots`

### Receipt

Receipts เป็น first-class:

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

Receipts เป็นสะพานจาก durable intent ไปสู่ edit, delete, preview
finalization, duplicate suppression และ recovery ในอนาคต

receipt สามารถอธิบายข้อความแพลตฟอร์มหนึ่งข้อความหรือการส่งมอบหลายส่วนได้ ข้อความที่แบ่ง chunk,
สื่อพร้อมข้อความ, เสียงพร้อมข้อความ และ card fallback ต้องเก็บ platform ids ทั้งหมดไว้
พร้อมกับยังเปิดเผย primary id สำหรับ threading และ edits ภายหลัง

## บริบทการรับ

การรับไม่ควรเป็นการเรียกตัวช่วยเปล่า ๆ Core ต้องมี context ที่รู้
dedupe, routing, session recording และ policy การ ack ของแพลตฟอร์ม

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

Ack ไม่ใช่สิ่งเดียว สัญญา receive ต้องแยกสัญญาณเหล่านี้ออกจากกัน:

- **Transport ack:** บอก webhook หรือ socket ของแพลตฟอร์มว่า OpenClaw ยอมรับ
  event envelope แล้ว บางแพลตฟอร์มต้องการสิ่งนี้ก่อน dispatch
- **Polling offset ack:** เลื่อน cursor เพื่อไม่ให้ fetch event เดิมซ้ำ
  สิ่งนี้ต้องไม่เลื่อนผ่านงานที่กู้คืนไม่ได้
- **Inbound record ack:** ยืนยันว่า OpenClaw persist metadata ขาเข้ามากพอสำหรับ
  dedupe และ route เมื่อมีการส่งซ้ำ
- **User-visible receipt:** พฤติกรรม read/status/typing ที่เป็นตัวเลือก ไม่เคยเป็น
  ขอบเขตความทนทาน

`ReceiveAckPolicy` ควบคุมเฉพาะการ acknowledgement ของ transport หรือ polling เท่านั้น ห้าม
นำไปใช้ซ้ำสำหรับ read receipts หรือ status reactions

ก่อนการอนุญาตบอท receive ต้องใช้นโยบาย echo ร่วมของ OpenClaw
เมื่อช่องทางสามารถ decode metadata origin ของข้อความได้:

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

การ drop นี้อิง tag ไม่ใช่อิงข้อความ ข้อความในห้องที่เขียนโดยบอทและมีข้อความ gateway-failure ที่มองเห็นได้เหมือนกัน
แต่ไม่มี metadata origin ของ OpenClaw ยังคงผ่าน authorization `allowBots` ตามปกติ

Ack policy ชัดเจน:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

ตอนนี้ Telegram polling ใช้ ack policy ของ receive-context สำหรับ persisted
restart watermark ตัว tracker ยังสังเกต grammY updates ขณะที่เข้าสู่
middleware chain แต่ OpenClaw persist เฉพาะ safe completed update id หลัง
dispatch สำเร็จ โดยปล่อยให้ updates ที่ล้มเหลวหรือต่ำกว่าที่ยังค้างอยู่ replay ได้หลัง
restart offset การ fetch `getUpdates` upstream ของ Telegram ยังคงถูกควบคุมโดย
polling library ดังนั้นส่วนลึกที่เหลือคือ polling source ที่ทนทานเต็มรูปแบบ
หากเราต้องการ redelivery ระดับแพลตฟอร์มเหนือกว่า restart
watermark ของ OpenClaw แพลตฟอร์ม Webhook อาจต้อง HTTP ack ทันที แต่ยังต้องมี
inbound dedupe และ durable outbound send intents เพราะ webhooks สามารถ redeliver ได้

## บริบทการส่ง

การส่งอิงตามบริบทเช่นกัน:

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

การจัดลำดับงานที่แนะนำ:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

ตัวช่วยจะขยายเป็น:

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

intent ต้องมีอยู่ก่อน I/O ของ transport การรีสตาร์ตหลังจากเริ่มแล้วแต่ก่อน
commit สามารถกู้คืนได้

ขอบเขตที่อันตรายคือหลังแพลตฟอร์มส่งสำเร็จและก่อน commit receipt หาก
กระบวนการตายตรงนั้น OpenClaw จะไม่สามารถรู้ได้ว่าข้อความบนแพลตฟอร์มมีอยู่หรือไม่
เว้นแต่อะแดปเตอร์จะให้ idempotency แบบเนทีฟหรือเส้นทางกระทบยอด receipt
ความพยายามเหล่านั้นต้องกลับมาทำงานต่อใน `unknown_after_send` ไม่ใช่เล่นซ้ำแบบไม่ตรวจสอบ ช่องทาง
ที่ไม่มีการกระทบยอดอาจเลือกเล่นซ้ำแบบ at-least-once ได้ก็ต่อเมื่อข้อความซ้ำที่ผู้ใช้มองเห็น
เป็น tradeoff ที่ยอมรับได้และมีเอกสารกำกับสำหรับช่องทางและความสัมพันธ์นั้น
บริดจ์การกระทบยอดของ SDK ปัจจุบันกำหนดให้อะแดปเตอร์ประกาศ
`reconcileUnknownSend` จากนั้นจึงขอให้ `durableFinal.reconcileUnknownSend`
จำแนกรายการที่ไม่ทราบสถานะเป็น `sent`, `not_sent` หรือ `unresolved`; เฉพาะ `not_sent`
เท่านั้นที่อนุญาตให้เล่นซ้ำ และรายการที่ unresolved จะคงเป็น terminal หรือ retry เฉพาะ
การตรวจสอบการกระทบยอด

นโยบายความทนทานต้องระบุอย่างชัดเจน:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` หมายความว่า core ต้อง fail closed เมื่อไม่สามารถเขียน durable intent ได้
`best_effort` สามารถปล่อยผ่านได้เมื่อ persistence ไม่พร้อมใช้งาน `disabled` จะคง
พฤติกรรมส่งโดยตรงแบบเดิมไว้ ระหว่างการย้ายข้อมูล wrapper เดิมและตัวช่วย compatibility สาธารณะ
จะมีค่าเริ่มต้นเป็น `disabled`; ตัวช่วยเหล่านั้นต้องไม่อนุมาน `required` จากข้อเท็จจริง
ที่ว่าช่องทางมี generic outbound adapter

send context ยังเป็นเจ้าของเอฟเฟกต์หลังส่งที่อยู่ภายในช่องทางด้วย การย้ายข้อมูลจะไม่ปลอดภัย
หาก durable delivery ข้ามพฤติกรรมภายในที่เคยผูกกับเส้นทางส่งโดยตรงของ
ช่องทาง ตัวอย่างได้แก่แคชระงับ self-echo,
เครื่องหมายการเข้าร่วม thread, native edit anchors, การ render model-signature,
และตัวป้องกันข้อความซ้ำเฉพาะแพลตฟอร์ม เอฟเฟกต์เหล่านั้นต้องย้ายไปอยู่ใน
send adapter, render adapter หรือ send-context hook ที่มีชื่อก่อนที่
ช่องทางนั้นจะเปิดใช้ durable generic final delivery ได้

ตัวช่วยส่งต้องคืน receipts กลับไปจนถึง caller ของตัวเอง Durable
wrappers ต้องไม่กลืน message ids หรือแทนที่ผลลัพธ์การส่งของช่องทางด้วย
`undefined`; buffered dispatchers ใช้ ids เหล่านั้นสำหรับ thread anchors, การแก้ไขภายหลัง,
การ finalize preview และการระงับข้อความซ้ำ

fallback send ทำงานกับ batches ไม่ใช่ payload เดี่ยว การ rewrite silent-reply,
media fallback, card fallback และ chunk projection ล้วนสามารถสร้าง deliverable message
ได้มากกว่าหนึ่งรายการ ดังนั้น send context ต้องส่ง batch ที่ project แล้วทั้งชุด
หรือระบุในเอกสารอย่างชัดเจนว่าทำไมจึงใช้ได้แค่ payload เดียว

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

เมื่อ fallback ลักษณะนี้มีความทนทาน batch ที่ project แล้วทั้งชุดต้องถูกแทนด้วย
durable send intent เดียวหรือแผน atomic batch อื่น การบันทึกแต่ละ payload
ทีละรายการยังไม่พอ: การ crash ระหว่าง payloads อาจทิ้ง fallback บางส่วนที่ผู้ใช้มองเห็น
ไว้โดยไม่มี durable record สำหรับ payloads ที่เหลือ การกู้คืนต้องรู้ว่า
units ใดมี receipts แล้ว และเล่นซ้ำเฉพาะ units ที่ขาดหาย หรือทำเครื่องหมาย
batch เป็น `unknown_after_send` จนกว่า adapter จะกระทบยอดได้

## บริบทแบบเรียลไทม์

พฤติกรรม preview, edit, progress และ stream ควรเป็น lifecycle แบบ opt-in เดียว

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

live state มีความทนทานพอที่จะกู้คืนหรือระงับรายการซ้ำ:

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

สิ่งนี้ควรครอบคลุมพฤติกรรมปัจจุบัน:

- Telegram ส่งพร้อม edit preview โดยใช้ final ใหม่หลัง preview เก่าเกินอายุ
- Discord ส่งพร้อม edit preview และยกเลิกเมื่อมี media/error/explicit reply
- Slack native stream หรือ draft preview ขึ้นอยู่กับรูปแบบของ thread
- การ finalize draft post ของ Mattermost
- การ finalize draft event ของ Matrix หรือ redaction เมื่อไม่ตรงกัน
- Teams native progress stream
- QQ Bot stream หรือ fallback แบบสะสม

## พื้นผิวอะแดปเตอร์

เป้าหมาย SDK สาธารณะควรเป็น subpath เดียว:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

รูปทรงเป้าหมาย:

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

send adapter:

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

receive adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

ก่อน preflight authorization core ต้องเรียกใช้ shared OpenClaw echo predicate
เมื่อใดก็ตามที่ `origin.decode` คืน metadata ที่มีต้นกำเนิดจาก OpenClaw receive adapter
จะให้ข้อเท็จจริงของแพลตฟอร์ม เช่น bot author และ room shape; core เป็นเจ้าของการตัดสินใจ drop
และการจัดลำดับ เพื่อให้ช่องทางไม่ต้อง implement text filters ซ้ำ

origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core ตั้งค่า `MessageOrigin` ช่องทางเพียงแปลค่าไปและกลับจาก metadata ของ
transport แบบเนทีฟ Slack map สิ่งนี้ไปที่ `chat.postMessage({ metadata })` และ
`message.metadata` ฝั่ง inbound; Matrix สามารถ map ไปยัง event content เพิ่มเติมได้; ช่องทาง
ที่ไม่มี native metadata สามารถใช้ receipt/outbound registry เมื่อเป็น
การประมาณที่ดีที่สุดที่มีอยู่

ความสามารถ:

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

## การลดพื้นผิว SDK สาธารณะ

พื้นผิวสาธารณะใหม่ควรดูดซับหรือ deprecate พื้นที่เชิงแนวคิดเหล่านี้:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- การใช้งานสาธารณะส่วนใหญ่ของ `outbound-runtime`
- ตัวช่วย lifecycle ของ draft stream แบบเฉพาะกิจ

compatibility subpaths สามารถคงอยู่ในฐานะ wrappers ได้ แต่ Plugin บุคคลที่สามใหม่
ไม่ควรต้องใช้สิ่งเหล่านั้น

Bundled plugins อาจเก็บการ import ตัวช่วยภายในผ่าน runtime subpaths
ที่สงวนไว้ระหว่างการย้ายข้อมูล เอกสารสาธารณะควรนำทางผู้เขียน Plugin ไปยัง
`plugin-sdk/channel-outbound` เมื่อมีอยู่แล้ว

## ความสัมพันธ์กับ channel inbound

`runtime.channel.inbound.*` คือ runtime bridge ระหว่างการย้ายข้อมูล

ควรกลายเป็น compatibility adapter:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` ควรคงอยู่ในช่วงแรกด้วย:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

พื้นผิว runtime `channel.turn` เดิมถูกลบแล้ว runtime callers ใช้
`channel.inbound.*`; เอกสารช่องทางและ SDK subpaths ใช้คำนาม inbound/message

## guardrails ด้าน compatibility

ระหว่างการย้ายข้อมูล generic durable delivery เป็น opt-in สำหรับช่องทางใดก็ตามที่
delivery callback เดิมมี side effects เกินกว่า "send this payload"

entry points เดิมเป็น non-durable โดยค่าเริ่มต้น:

- `channel.inbound.run` และ `dispatchChannelInboundReply` ใช้ delivery callback ของช่องทาง
  เว้นแต่ว่าช่องทางนั้นจะให้ policy/options object แบบ durable ที่ audit แล้วอย่างชัดเจน
- `channel.inbound.runPreparedReply` ยังคงเป็นของช่องทางจนกว่า prepared dispatcher
  จะเรียก send context อย่างชัดเจน
- ตัวช่วย compatibility สาธารณะ เช่น `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` และตัวช่วย direct-DM จะไม่ inject generic
  durable delivery ก่อน callback `deliver` หรือ `reply` ที่ caller ให้มา

สำหรับชนิด migration bridge, `durable: undefined` หมายถึง "not durable"
เส้นทาง durable จะเปิดใช้เฉพาะด้วยค่า policy/options ที่ชัดเจนเท่านั้น `durable:
false` สามารถคงอยู่เป็นการสะกดแบบ compatibility ได้ แต่ implementation ไม่ควร
กำหนดให้ทุกช่องทางที่ยังไม่ย้ายข้อมูลต้องเพิ่มค่านี้

โค้ด bridge ปัจจุบันต้องทำให้การตัดสินใจเรื่องความทนทานชัดเจน:

- การส่งมอบผลลัพธ์สุดท้ายแบบคงทนจะคืนค่าสถานะแบบจำแนกชนิด `handled_visible` และ
  `handled_no_send` เป็นสถานะปลายทาง ส่วน `unsupported` และ `not_applicable` อาจ
  ถอยกลับไปใช้การส่งมอบที่ช่องเป็นเจ้าของ และ `failed` จะส่งต่อความล้มเหลวในการส่ง
- การส่งมอบผลลัพธ์สุดท้ายแบบคงทนทั่วไปถูกควบคุมด้วยความสามารถของอะแดปเตอร์ เช่น
  การส่งแบบเงียบ การคงเป้าหมายการตอบกลับ การคงข้อความอ้างอิงแบบเนทีฟ และ
  ฮุกการส่งข้อความ หากยังเทียบเท่ากันไม่ครบ ควรเลือกการส่งมอบที่ช่องเป็นเจ้าของ
  ไม่ใช่การส่งทั่วไปที่เปลี่ยนพฤติกรรมที่ผู้ใช้มองเห็น
- การส่งแบบคงทนที่มีคิวหนุนหลังจะแสดงอ้างอิงเจตนาการส่ง ฟิลด์เซสชัน
  `pendingFinalDelivery*` ที่มีอยู่สามารถพกพา intent id ระหว่างการเปลี่ยนผ่านได้
  สถานะปลายทางคือสโตร์ `MessageSendIntent` แทนข้อความตอบกลับที่ถูกตรึงไว้พร้อม
  ฟิลด์บริบทเฉพาะกิจ

อย่าเปิดใช้เส้นทางคงทนทั่วไปสำหรับช่องใดจนกว่าสิ่งต่อไปนี้จะเป็นจริงทั้งหมด:

- อะแดปเตอร์การส่งทั่วไปทำงานด้วยพฤติกรรมการเรนเดอร์และการขนส่งเดียวกับ
  เส้นทางตรงเดิม
- ผลข้างเคียงภายในหลังส่งถูกรักษาไว้ผ่านบริบทการส่ง
- อะแดปเตอร์คืนใบรับหรือผลลัพธ์การส่งมอบที่มี id ข้อความของแพลตฟอร์มทั้งหมด
- เส้นทาง dispatcher ที่เตรียมไว้เรียกบริบทการส่งใหม่ หรือยังคงถูกบันทึกไว้ว่า
  อยู่นอกการรับประกันแบบคงทน
- การส่งมอบสำรองจัดการ payload ที่ฉายออกมาทุกตัว ไม่ใช่เฉพาะตัวแรก
- การส่งมอบสำรองแบบคงทนบันทึกอาร์เรย์ payload ที่ฉายออกมาทั้งหมดเป็นเจตนาหรือ
  แผนแบตช์เดียวที่เล่นซ้ำได้

อันตรายในการย้ายระบบที่ต้องรักษาไว้:

- การส่งมอบของตัวเฝ้าดู iMessage บันทึกข้อความที่ส่งแล้วไว้ในแคช echo หลังจาก
  ส่งสำเร็จ การส่งผลลัพธ์สุดท้ายแบบคงทนยังต้องเติมแคชนั้น ไม่เช่นนั้น
  OpenClaw อาจนำเข้าคำตอบสุดท้ายของตัวเองซ้ำเป็นข้อความขาเข้าจากผู้ใช้
- Tlon เพิ่มลายเซ็นโมเดลที่เป็นทางเลือกและบันทึกเธรดที่เข้าร่วมหลังการตอบกลับกลุ่ม
  การส่งมอบแบบคงทนทั่วไปต้องไม่ข้ามผลเหล่านั้น ให้ย้ายเข้าไปในอะแดปเตอร์
  render/send/finalize ของ Tlon หรือให้ Tlon อยู่บนเส้นทางที่ช่องเป็นเจ้าของ
- Discord และ dispatcher ที่เตรียมไว้อื่น ๆ เป็นเจ้าของพฤติกรรมการส่งตรงและการพรีวิวอยู่แล้ว
  สิ่งเหล่านี้ยังไม่อยู่ภายใต้การรับประกันแบบคงทนของเทิร์นที่ประกอบแล้ว จนกว่า
  dispatcher ที่เตรียมไว้จะกำหนดเส้นทาง finals ผ่านบริบทการส่งอย่างชัดเจน
- การส่งมอบสำรองแบบเงียบของ Telegram ต้องส่งอาร์เรย์ payload ที่ฉายออกมาทั้งหมด
  ทางลัดแบบ payload เดียวอาจทำให้ payload สำรองเพิ่มเติมหลังการฉายถูกทิ้ง
- LINE, Zalo, Nostr และเส้นทาง assembled/helper อื่นที่มีอยู่ อาจ
  มีการจัดการ reply-token, การพร็อกซีสื่อ, แคชข้อความที่ส่งแล้ว, การล้าง
  loading/status หรือเป้าหมายแบบ callback-only สิ่งเหล่านี้ยังอยู่บนการส่งมอบที่ช่อง
  เป็นเจ้าของจนกว่า semantic เหล่านั้นจะแสดงแทนโดยอะแดปเตอร์การส่งและได้รับการยืนยันด้วยการทดสอบ
- ตัวช่วย Direct-DM อาจมี callback การตอบกลับที่เป็นเป้าหมายการขนส่งที่ถูกต้องเพียงหนึ่งเดียว
  outbound ทั่วไปต้องไม่เดาจาก `OriginatingTo` หรือ `To` แล้วข้าม callback นั้น
- เอาต์พุตความล้มเหลวของ OpenClaw gateway ต้องยังคงมองเห็นได้สำหรับมนุษย์ แต่ echo
  ในห้องที่ติดแท็กว่าเขียนโดยบอตต้องถูกทิ้งก่อนการอนุญาต `allowBots`
  ช่องต้องไม่ทำสิ่งนี้ด้วยตัวกรองคำนำหน้าข้อความที่มองเห็นได้ ยกเว้นเป็นมาตรการฉุกเฉิน
  ระยะสั้น สัญญาแบบคงทนคือเมทาดาทาต้นทางแบบมีโครงสร้าง

## พื้นที่จัดเก็บภายใน

คิวแบบคงทนควรจัดเก็บเจตนาการส่งข้อความ ไม่ใช่ payload การตอบกลับ

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

ลูปการกู้คืน:

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

คิวควรเก็บ identity ให้เพียงพอเพื่อเล่นซ้ำผ่านบัญชี เธรด เป้าหมาย นโยบายการจัดรูปแบบ
และกฎสื่อเดิมหลังรีสตาร์ต

## คลาสความล้มเหลว

อะแดปเตอร์ช่องจัดประเภทความล้มเหลวในการขนส่งเป็นหมวดหมู่ปิด:

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

นโยบาย core:

- ลองใหม่สำหรับ `transient` และ `rate_limit`
- อย่าลองใหม่สำหรับ `invalid_payload` เว้นแต่มี fallback สำหรับ render
- อย่าลองใหม่สำหรับ `auth` หรือ `permission` จนกว่าการกำหนดค่าจะเปลี่ยน
- สำหรับ `not_found` ให้ live finalization ถอยกลับจากการแก้ไขไปเป็นการส่งใหม่เมื่อ
  ช่องประกาศว่าปลอดภัย
- สำหรับ `conflict` ใช้กฎ receipt/idempotency เพื่อตัดสินว่าข้อความมีอยู่แล้วหรือไม่
- ข้อผิดพลาดใด ๆ หลังจากอะแดปเตอร์อาจทำ I/O ของแพลตฟอร์มเสร็จแล้ว แต่ก่อน commit ใบรับ
  จะกลายเป็น `unknown_after_send` เว้นแต่อะแดปเตอร์จะพิสูจน์ได้ว่าการดำเนินการบนแพลตฟอร์ม
  ไม่ได้เกิดขึ้น

## การแมปช่อง

| ช่องทาง         | เป้าหมายการย้าย                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | รับนโยบาย ack พร้อมการส่งสุดท้ายแบบคงทน Live adapter เป็นเจ้าของการส่งและการแก้ไขตัวอย่างก่อนส่ง, การส่งสุดท้ายของตัวอย่างก่อนส่งที่ค้างเก่า, topics, การข้ามตัวอย่างก่อนส่งของ quote-reply, media fallback และการจัดการ retry-after                                                                                                                                                                   |
| Discord         | Send adapter ครอบการส่งมอบ payload แบบคงทนที่มีอยู่ Live adapter เป็นเจ้าของการแก้ไขร่าง, ร่างความคืบหน้า, การยกเลิกตัวอย่างก่อนส่งของสื่อ/ข้อผิดพลาด, การรักษาเป้าหมายการตอบกลับ และใบรับ id ข้อความ ตรวจสอบ echo ความล้มเหลวของ Gateway ที่บอตเขียนในห้องที่ใช้ร่วมกัน ใช้รีจิสทรีขาออกหรือสิ่งเทียบเท่าแบบเนทีฟอื่น หาก Discord ไม่สามารถพกพา metadata ต้นทางบนข้อความปกติได้ |
| Slack           | Send adapter จัดการโพสต์แชตปกติ Live adapter เลือกสตรีมแบบเนทีฟเมื่อรูปทรงของเธรดรองรับ มิฉะนั้นใช้ตัวอย่างร่างก่อนส่ง ใบรับรักษา timestamp ของเธรด Origin adapter แมปความล้มเหลวของ OpenClaw gateway ไปยัง Slack `chat.postMessage.metadata` และทิ้ง echo ในห้องบอตที่ติดแท็กก่อนการอนุญาต `allowBots`                                  |
| WhatsApp        | Send adapter เป็นเจ้าของการส่งข้อความ/สื่อพร้อม intent สุดท้ายแบบคงทน Receive adapter จัดการการ mention กลุ่มและตัวตนผู้ส่ง Live ยังไม่ต้องมีอยู่จนกว่า WhatsApp จะมี transport ที่แก้ไขได้                                                                                                                                                                        |
| Matrix          | Live adapter เป็นเจ้าของการแก้ไข draft event, การ finalize, การ redact, ข้อจำกัดสื่อที่เข้ารหัส และ fallback เมื่อเป้าหมายการตอบกลับไม่ตรงกัน Receive adapter เป็นเจ้าของการ hydrate event ที่เข้ารหัสและการ dedupe Origin adapter ควรเข้ารหัสต้นทางความล้มเหลวของ OpenClaw gateway ลงในเนื้อหา event ของ Matrix และทิ้ง echo ในห้องบอตที่กำหนดค่าก่อนการจัดการ `allowBots`              |
| Mattermost      | Live adapter เป็นเจ้าของ draft post หนึ่งรายการ, การพับรวมความคืบหน้า/เครื่องมือ, การ finalize ในที่เดิม และ fallback แบบส่งใหม่                                                                                                                                                                                                                                                       |
| Microsoft Teams | Live adapter เป็นเจ้าของความคืบหน้าแบบเนทีฟและพฤติกรรม block stream Send adapter เป็นเจ้าของ activities และใบรับ attachment/card                                                                                                                                                                                                                                        |
| Feishu          | Render adapter เป็นเจ้าของการ render แบบข้อความ/card/raw Live adapter เป็นเจ้าของการ์ดแบบ streaming และการระงับ final ที่ซ้ำ Send adapter เป็นเจ้าของ comments, topic sessions, สื่อ และการระงับเสียง                                                                                                                                                                      |
| QQ Bot          | Live adapter เป็นเจ้าของ C2C streaming, accumulator timeout และ fallback final send Render adapter เป็นเจ้าของ media tags และ text-as-voice                                                                                                                                                                                                                               |
| Signal          | Receive แบบง่ายพร้อม send adapter ไม่มี live adapter เว้นแต่ signal-cli จะเพิ่มการรองรับการแก้ไขที่เชื่อถือได้                                                                                                                                                                                                                                                                |
| iMessage        | Receive แบบง่ายพร้อม send adapter การส่ง iMessage ต้องรักษาการเติม monitor echo-cache ก่อนที่ final แบบคงทนจะข้ามการส่งมอบผ่าน monitor ได้                                                                                                                                                                                                                 |
| Google Chat     | Receive แบบง่ายพร้อม send adapter โดยแมปความสัมพันธ์ของเธรดไปยัง spaces และ thread ids ตรวจสอบพฤติกรรมห้อง `allowBots=true` สำหรับ echo ความล้มเหลวของ OpenClaw gateway ที่ติดแท็ก                                                                                                                                                                                        |
| LINE            | Receive แบบง่ายพร้อม send adapter โดยจำลองข้อจำกัด reply-token เป็นความสามารถ target/relation                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK receive bridge พร้อม send adapter                                                                                                                                                                                                                                                                                                                          |
| IRC             | Receive แบบง่ายพร้อม send adapter ไม่มีใบรับการแก้ไขแบบคงทน                                                                                                                                                                                                                                                                                                    |
| Nostr           | Receive พร้อม send adapter สำหรับ DM ที่เข้ารหัส ใบรับคือ event ids                                                                                                                                                                                                                                                                                           |
| QA Channel      | Adapter สำหรับ contract-test ของพฤติกรรม receive, send, live, retry และ recovery                                                                                                                                                                                                                                                                                   |
| Synology Chat   | Receive แบบง่ายพร้อม send adapter                                                                                                                                                                                                                                                                                                                              |
| Tlon            | Send adapter ต้องรักษาการ render model-signature และการติดตามเธรดที่เข้าร่วมไว้ ก่อนเปิดใช้การส่งมอบ final แบบคงทนทั่วไป                                                                                                                                                                                                                        |
| Twitch          | Receive แบบง่ายพร้อม send adapter ที่มีการจำแนก rate-limit                                                                                                                                                                                                                                                                                               |
| Zalo            | Receive แบบง่ายพร้อม send adapter                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Receive แบบง่ายพร้อม send adapter                                                                                                                                                                                                                                                                                                                              |

## แผนการย้าย

### ระยะที่ 1: โดเมนข้อความภายใน

- เพิ่มชนิด `src/channels/message/*` สำหรับข้อความ, เป้าหมาย, ความสัมพันธ์,
  ต้นทาง, ใบรับ, ความสามารถ, intent แบบคงทน, บริบทการรับ, บริบทการส่ง,
  บริบท live และคลาสความล้มเหลว
- เพิ่ม `origin?: MessageOrigin` ไปยังชนิด payload ของ migration bridge ที่ใช้โดย
  การส่งมอบการตอบกลับปัจจุบัน จากนั้นย้ายฟิลด์นั้นไปยัง `ChannelMessage` และชนิดข้อความ
  ที่ render แล้ว เมื่อการ refactor แทนที่ reply payloads
- เก็บสิ่งนี้ไว้ภายในจนกว่า adapters และ tests จะพิสูจน์รูปทรงได้
- เพิ่ม unit tests แบบ pure สำหรับ state transitions และ serialization

### ระยะที่ 2: แกนส่งแบบคงทน

- ย้ายคิวขาออกที่มีอยู่จากความคงทนของ reply-payload ไปยัง intent การส่งข้อความ
  แบบคงทน
- ให้ durable send intent พกพา projected payload array หรือ batch plan ไม่ใช่
  reply payload เพียงรายการเดียว
- รักษาพฤติกรรมการกู้คืนคิวปัจจุบันผ่านการแปลงเพื่อความเข้ากันได้
- ทำให้ `deliverOutboundPayloads` เรียก `messages.send`
- ทำให้ final-send durability เป็นค่าเริ่มต้นและ fail closed เมื่อไม่สามารถเขียน durable intent
  ใน lifecycle ข้อความใหม่ได้ หลังจาก adapter ประกาศความปลอดภัยในการ replay แล้ว เส้นทาง inbound runner
  และความเข้ากันได้ของ SDK ที่มีอยู่ยังคงเป็น direct-send โดยค่าเริ่มต้นในระยะนี้
- บันทึกใบรับอย่างสม่ำเสมอ
- ส่งคืนใบรับและผลลัพธ์การส่งมอบไปยัง caller เดิมของ dispatcher แทนที่จะถือว่า durable send
  เป็น side effect ปลายทาง
- Persist ต้นทางข้อความผ่าน durable send intents เพื่อให้ recovery, replay และ
  การส่งแบบ chunked รักษาที่มาปฏิบัติการของ OpenClaw

### ระยะที่ 3: Channel Inbound Bridge

- Implement `channel.inbound.run` และ `dispatchChannelInboundReply` ใหม่บน
  `messages.receive` และ `messages.send`
- รักษาชนิด fact ปัจจุบันให้เสถียร
- รักษาพฤติกรรม legacy โดยค่าเริ่มต้น ช่องทางแบบ assembled-turn จะกลายเป็นแบบคงทน
  ก็ต่อเมื่อ adapter เลือกใช้โดยชัดเจนด้วยนโยบาย durability ที่ replay-safe
- รักษา `durable: false` เป็นทางออกเพื่อความเข้ากันได้สำหรับเส้นทางที่ finalize
  native edits และยังไม่สามารถ replay ได้อย่างปลอดภัย แต่อย่าพึ่งพา marker `false`
  เพื่อปกป้องช่องทางที่ยังไม่ได้ย้าย
- ตั้งค่า durability ของ assembled-turn เป็นค่าเริ่มต้นเฉพาะใน lifecycle ข้อความใหม่ หลังจาก
  การแมปช่องทางพิสูจน์ว่าเส้นทางส่งทั่วไปยังรักษา semantics การส่งมอบของช่องทางเดิมไว้ได้

### ระยะที่ 4: Prepared Dispatcher Bridge

- แทนที่ `deliverDurableInboundReplyPayload` ด้วยบริดจ์บริบทการส่ง
- เก็บ helper เดิมไว้เป็น wrapper
- พอร์ต Telegram, WhatsApp, Slack, Signal, iMessage และ Discord ก่อน เพราะ
  มีงาน durable-final อยู่แล้วหรือมีเส้นทางการส่งที่เรียบง่ายกว่า
- ถือว่า dispatcher ที่เตรียมไว้ทุกตัวไม่ได้ครอบคลุมจนกว่าจะเลือกใช้
  บริบทการส่งอย่างชัดเจน เอกสารและรายการ changelog ต้องระบุว่า "assembled
  channel turns" หรือระบุชื่อเส้นทางช่องทางที่ย้ายแล้ว แทนการอ้างว่าเป็น
  การตอบกลับสุดท้ายอัตโนมัติทั้งหมด
- รักษาพฤติกรรมของ `recordInboundSessionAndDispatchReply`, helper direct-DM และ helper
  ความเข้ากันได้สาธารณะอื่น ๆ ที่คล้ายกันให้คงเดิม อาจเปิดเผยการเลือกใช้
  send-context อย่างชัดเจนได้ภายหลัง แต่ต้องไม่พยายามทำการส่ง durable
  แบบทั่วไปโดยอัตโนมัติก่อน callback การส่งมอบที่ผู้เรียกเป็นเจ้าของ

### ระยะที่ 5: วงจรชีวิตแบบ Live ที่เป็นหนึ่งเดียว

- สร้าง `messages.live` พร้อม adapter พิสูจน์สองตัว:
  - Telegram สำหรับการส่ง รวมถึงการแก้ไข รวมถึงการส่งขั้นสุดท้ายที่หมดอายุ
  - Matrix สำหรับการสรุป draft ขั้นสุดท้าย รวมถึง fallback การ redaction
- จากนั้นย้าย Discord, Slack, Mattermost, Teams, QQ Bot และ Feishu
- ลบโค้ดการสรุป preview ขั้นสุดท้ายที่ซ้ำกันหลังจากแต่ละช่องทางมี
  การทดสอบ parity แล้วเท่านั้น

### ระยะที่ 6: SDK สาธารณะ

- เพิ่ม `openclaw/plugin-sdk/channel-outbound`
- จัดทำเอกสารว่าเป็น API Plugin ช่องทางที่แนะนำ
- อัปเดต package exports, inventory ของ entrypoint, baseline API ที่สร้างขึ้น และ
  เอกสาร SDK ของ Plugin
- รวม `MessageOrigin`, hook การ encode/decode origin และ predicate ที่ใช้ร่วมกัน
  `shouldDropOpenClawEcho` ไว้ใน surface ของ channel-outbound SDK
- เก็บ wrapper ความเข้ากันได้สำหรับ subpath เก่า
- ทำเครื่องหมาย helper SDK ที่ตั้งชื่อตาม reply ว่าเลิกแนะนำในเอกสารหลังจาก
  ย้าย Plugin ที่ bundled แล้ว

### ระยะที่ 7: ตัวส่งทั้งหมด

ย้าย producer outbound ที่ไม่ใช่ reply ทั้งหมดไปยัง `messages.send`:

- การแจ้งเตือน cron และ heartbeat
- การทำงาน task เสร็จสมบูรณ์
- ผลลัพธ์ hook
- prompt การอนุมัติและผลลัพธ์การอนุมัติ
- การส่งของ message tool
- ประกาศการเสร็จสมบูรณ์ของ subagent
- การส่งจาก CLI หรือ Control UI อย่างชัดเจน
- เส้นทาง automation/broadcast

นี่คือจุดที่โมเดลหยุดเป็น "agent replies" และกลายเป็น "OpenClaw sends
messages"

### ระยะที่ 8: ลบความเข้ากันได้ที่ตั้งชื่อตาม Turn

- เก็บ wrapper ที่ตั้งชื่อตาม inbound/message ไว้เป็นช่วงเวลาความเข้ากันได้
- เผยแพร่บันทึกการย้าย
- รันการทดสอบความเข้ากันได้ของ SDK Plugin กับ import เก่า
- ลบหรือซ่อน helper ภายในเก่าเฉพาะหลังจากไม่มี Plugin ที่ bundled ต้องใช้แล้ว
  และสัญญาของบุคคลที่สามมีตัวแทนที่เสถียร

## แผนการทดสอบ

การทดสอบ unit:

- การ serialize และกู้คืน send intent แบบ durable
- การใช้ idempotency key ซ้ำและการกดทับรายการซ้ำ
- การ commit receipt และการข้าม replay
- การกู้คืน `unknown_after_send` ที่ reconcile ก่อน replay เมื่อ adapter
  รองรับ reconciliation
- นโยบายการจำแนกความล้มเหลว
- ลำดับนโยบาย receive ack
- การ map ความสัมพันธ์สำหรับการส่งแบบ reply, followup, system และ broadcast
- factory origin สำหรับ gateway-failure และ predicate `shouldDropOpenClawEcho`
- การคง origin ผ่าน payload normalization, chunking, การ serialize durable queue
  และการกู้คืน

การทดสอบ integration:

- adapter แบบง่ายของ `channel.inbound.run` ยังคงบันทึกและส่ง
- การส่งมอบ assembled-event เดิมจะไม่กลายเป็น durable เว้นแต่ช่องทาง
  เลือกใช้อย่างชัดเจน
- บริดจ์ `channel.inbound.runPreparedReply` ยังคงบันทึกและสรุปขั้นสุดท้าย
- helper ความเข้ากันได้สาธารณะเรียก callback การส่งมอบที่ผู้เรียกเป็นเจ้าของ
  โดยค่าเริ่มต้น และไม่ generic-send ก่อน callback เหล่านั้น
- การส่งมอบ durable fallback replay อาร์เรย์ payload ที่ project แล้วทั้งหมดหลัง restart
  และไม่สามารถปล่อยให้ payload ถัด ๆ ไปไม่ถูกบันทึกหลัง crash ช่วงต้น
- การส่งมอบ assembled-event แบบ durable ส่งคืน platform message ids ไปยัง dispatcher
  ที่ buffer ไว้
- hook การส่งมอบแบบกำหนดเองยังคงส่งคืน platform message ids เมื่อการส่งมอบ durable
  ถูกปิดใช้งานหรือไม่พร้อมใช้งาน
- final reply อยู่รอดจาก restart ระหว่าง assistant completion และการส่งไปยัง platform
- preview draft สรุปในตำแหน่งเดิมเมื่ออนุญาต
- preview draft ถูกยกเลิกหรือ redacted เมื่อ media/error/reply-target mismatch
  ต้องใช้การส่งมอบปกติ
- block streaming และ preview streaming ไม่ส่งข้อความเดียวกันทั้งคู่
- media ที่ stream เร็วไม่ถูกทำซ้ำในการส่งมอบขั้นสุดท้าย

การทดสอบช่องทาง:

- Telegram topic reply พร้อม polling ack ที่หน่วงไว้จนถึง safe completed watermark
  ของ receive context
- การกู้คืน polling ของ Telegram สำหรับ update ที่ยอมรับแล้วแต่ยังไม่ส่งมอบ ครอบคลุมด้วย
  โมเดล offset safe-completed ที่ persist แล้ว
- stale preview ของ Telegram ส่ง final ใหม่และล้าง preview
- silent fallback ของ Telegram ส่งทุก projected fallback payload
- durability ของ silent fallback ของ Telegram บันทึกอาร์เรย์ fallback ที่ project แล้วทั้งหมด
  แบบ atomic ไม่ใช่ durable intent แบบ payload เดียวหนึ่งรายการต่อการวนลูปแต่ละครั้ง
- Discord preview cancel เมื่อมี media/error/explicit reply
- final ของ prepared dispatcher ใน Discord route ผ่าน send context ก่อนที่เอกสาร
  หรือ changelog จะอ้าง durability ของ final-reply ใน Discord
- การส่ง final แบบ durable ของ iMessage เติม monitor sent-message echo cache
- เส้นทางการส่งมอบ legacy ของ LINE, Zalo และ Nostr จะไม่ถูกข้ามด้วย
  generic durable send จนกว่าจะมีการทดสอบ parity ของ adapter
- การส่งมอบ callback ของ Direct-DM/Nostr ยังคงเป็นแหล่งอ้างอิงหลัก เว้นแต่จะย้ายอย่างชัดเจน
  ไปยัง message target ที่สมบูรณ์และ send adapter ที่ replay-safe
- ข้อความ Slack ที่ติดแท็ก OpenClaw gateway failure ยังคงมองเห็นได้ outbound, echo ในห้องของ bot
  ที่ติดแท็กถูก drop ก่อน `allowBots` และข้อความ bot ที่ไม่ติดแท็กซึ่งมีข้อความที่มองเห็นได้เหมือนกัน
  ยังคงตาม authorization ของ bot ปกติ
- native stream fallback ของ Slack ไปยัง draft preview ใน DM ระดับบน
- การสรุป preview ขั้นสุดท้ายและ redaction fallback ของ Matrix
- echo ในห้องแบบ gateway-failure ของ OpenClaw ที่ติดแท็กของ Matrix จากบัญชี bot
  ที่ตั้งค่าไว้ถูก drop ก่อนการจัดการ `allowBots`
- audit cascade ของ gateway-failure ในห้องร่วมของ Discord และ Google Chat ครอบคลุม
  โหมด `allowBots` ก่อนอ้างการป้องกันทั่วไปที่นั่น
- การสรุป draft ขั้นสุดท้ายและ fallback แบบ fresh-send ของ Mattermost
- การสรุปความคืบหน้าแบบ native ของ Teams
- การกดทับ final ที่ซ้ำของ Feishu
- fallback เมื่อ accumulator ของ QQ Bot timeout
- การส่ง final แบบ durable ของ Tlon คงการเรนเดอร์ model-signature และการติดตาม
  เธรดที่เข้าร่วม
- การส่ง final แบบ durable อย่างง่ายของ WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal

การตรวจสอบ:

- ไฟล์ Vitest แบบเจาะจงระหว่างการพัฒนา
- `pnpm check:changed` ใน Testbox สำหรับ surface ที่เปลี่ยนทั้งหมด
- `pnpm check` ที่กว้างขึ้นใน Testbox ก่อนลง refactor ทั้งชุดหรือหลังจาก
  การเปลี่ยนแปลง SDK/export สาธารณะ
- live หรือ qa-channel smoke สำหรับช่องทางที่แก้ไขได้อย่างน้อยหนึ่งช่องทางและช่องทาง
  ส่งอย่างเดียวแบบง่ายหนึ่งช่องทาง ก่อนลบ wrapper ความเข้ากันได้

## คำถามที่ยังเปิดอยู่

- Telegram ควรแทนที่แหล่ง runner ของ grammY ด้วยแหล่ง polling แบบ durable อย่างสมบูรณ์ในที่สุดหรือไม่
  ซึ่งควบคุมการส่งซ้ำระดับ platform ได้ ไม่ใช่เฉพาะ watermark restart ที่ persist แล้วของ OpenClaw
- สถานะ durable live preview ควรเก็บไว้ใน queue record เดียวกับ
  final send intent หรือใน live-state store ข้างเคียง
- wrapper ความเข้ากันได้จะยังอยู่ในเอกสารนานเท่าใดหลังจาก
  `plugin-sdk/channel-outbound` ship แล้ว
- Plugin บุคคลที่สามควร implement receive adapter โดยตรง หรือเพียง
  ให้ normalize/send/live hooks ผ่าน `defineChannelMessageAdapter`
- receipt fields ใดปลอดภัยสำหรับเปิดเผยใน SDK สาธารณะ เทียบกับสถานะ runtime ภายใน
- side effect เช่น self-echo cache และ participated-thread marker
  ควรถูก model เป็น send-context hooks, ขั้นตอน finalize ที่ adapter เป็นเจ้าของ หรือ
  receipt subscribers
- ช่องทางใดมี native origin metadata, ช่องทางใดต้องใช้ outbound registries ที่ persist แล้ว
  และช่องทางใดไม่สามารถให้การกดทับ echo ข้าม bot ที่เชื่อถือได้

## เกณฑ์การยอมรับ

- ช่องทางข้อความที่ bundled ทุกช่องทางส่งผลลัพธ์สุดท้ายที่มองเห็นได้ผ่าน
  `messages.send`
- ช่องทางข้อความ inbound ทุกช่องทางเข้าสู่ระบบผ่าน `messages.receive` หรือ
  wrapper ความเข้ากันได้ที่จัดทำเอกสารไว้
- ช่องทาง preview/edit/stream ทุกช่องทางใช้ `messages.live` สำหรับสถานะ draft และ
  การสรุปขั้นสุดท้าย
- `channel.inbound` เป็นเพียง wrapper
- helper SDK ที่ตั้งชื่อตาม reply เป็น compatibility exports ไม่ใช่เส้นทางที่แนะนำ
- การกู้คืน durable สามารถ replay final sends ที่รอดำเนินการหลัง restart ได้โดยไม่สูญเสีย
  final response หรือทำซ้ำการส่งที่ commit แล้ว; การส่งที่ไม่ทราบผลลัพธ์ของ platform
  จะถูก reconcile ก่อน replay หรือถูกจัดทำเอกสารว่าเป็น at-least-once สำหรับ adapter นั้น
- การส่ง final แบบ durable fail closed เมื่อเขียน durable intent ไม่ได้
  เว้นแต่ผู้เรียกเลือกโหมด non-durable ที่จัดทำเอกสารไว้อย่างชัดเจน
- helper ความเข้ากันได้ของ SDK เดิมค่าเริ่มต้นเป็นการส่งมอบโดยตรงที่ช่องทางเป็นเจ้าของ;
  generic durable send เป็นการ opt-in อย่างชัดเจนเท่านั้น
- receipt คง platform message ids ทั้งหมดสำหรับการส่งมอบหลายส่วนและ id หลัก
  เพื่อความสะดวกในการ threading/edit
- wrapper durable คง side effect ภายในช่องทางก่อนแทนที่ callback การส่งมอบโดยตรง
- prepared dispatcher จะไม่ถูกนับว่า durable จนกว่าเส้นทางการส่งมอบขั้นสุดท้าย
  จะใช้ send context อย่างชัดเจน
- การส่งมอบ fallback จัดการทุก projected payload
- การส่งมอบ durable fallback บันทึกทุก projected payload ใน intent หรือ batch plan
  เดียวที่ replay ได้
- output gateway failure ที่ OpenClaw สร้างขึ้นมองเห็นได้สำหรับมนุษย์ แต่ echo ในห้องที่เขียนโดย bot
  และติดแท็กจะถูก drop ก่อน bot authorization บนช่องทางที่ประกาศการรองรับ origin contract
- เอกสารอธิบาย send, receive, live, state, receipts, relations, failure
  policy, migration และ test coverage

## ที่เกี่ยวข้อง

- [ข้อความ](/th/concepts/messages)
- [การสตรีมและการแบ่งชิ้น](/th/concepts/streaming)
- [Progress drafts](/th/concepts/progress-drafts)
- [นโยบายการลองใหม่](/th/concepts/retry)
- [API ขาเข้าของช่องทาง](/th/plugins/sdk-channel-inbound)
