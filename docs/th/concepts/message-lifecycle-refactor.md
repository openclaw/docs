---
read_when:
    - การปรับโครงสร้างพฤติกรรมการส่งหรือรับของช่องทาง
    - การเปลี่ยนแปลงรอบของช่องทาง, การจัดส่งคำตอบ, คิวขาออก, การสตรีมตัวอย่าง, หรือ API ข้อความของ Plugin SDK
    - การออกแบบ Plugin ช่องทางใหม่ที่ต้องใช้การส่งแบบคงทน การตอบรับ ตัวอย่างก่อนส่ง การแก้ไข หรือการลองใหม่
summary: แผนการออกแบบสำหรับวงจรชีวิตแบบรวมของการรับ ส่ง แสดงตัวอย่าง แก้ไข และสตรีมข้อความแบบคงทน
title: การปรับโครงสร้างวงจรชีวิตของข้อความ
x-i18n:
    generated_at: "2026-05-06T09:08:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

หน้านี้คือการออกแบบเป้าหมายสำหรับแทนที่ตัวช่วยที่กระจัดกระจายสำหรับ turn ของช่องทาง, การส่งต่อการตอบกลับ, การสตรีมตัวอย่าง และการส่งออก ด้วยวงจรชีวิตข้อความที่ทนทานหนึ่งเดียว

ฉบับสั้น:

- primitive หลักควรเป็น **รับ** และ **ส่ง** ไม่ใช่ **ตอบกลับ**
- การตอบกลับเป็นเพียงความสัมพันธ์บนข้อความขาออก
- turn เป็นความสะดวกในการประมวลผลขาเข้า ไม่ใช่เจ้าของการส่งมอบ
- การส่งต้องอิงตามบริบท: `begin`, render, preview หรือ stream, final send,
  commit, fail.
- การรับต้องอิงตามบริบทเช่นกัน: normalize, dedupe, route, record,
  dispatch, platform ack, fail.
- SDK Plugin สาธารณะควรยุบเหลือพื้นผิว channel-message ขนาดเล็กหนึ่งเดียว

## ปัญหา

สแต็กช่องทางปัจจุบันเติบโตมาจากความต้องการเฉพาะที่สมเหตุสมผลหลายอย่าง:

- อะแดปเตอร์ขาเข้าแบบง่ายใช้ `runtime.channel.turn.run`
- อะแดปเตอร์ที่มีความสามารถมากใช้ `runtime.channel.turn.runPrepared`
- ตัวช่วยเดิมใช้ `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, ตัวช่วย payload การตอบกลับ, การแบ่ง chunk การตอบกลับ,
  อ้างอิงการตอบกลับ และตัวช่วย runtime ขาออก
- การสตรีมตัวอย่างอยู่ใน dispatcher เฉพาะช่องทาง
- ความทนทานของการส่งสุดท้ายกำลังถูกเพิ่มรอบเส้นทาง payload การตอบกลับที่มีอยู่

รูปแบบนั้นแก้บั๊กเฉพาะที่ได้ แต่ทำให้ OpenClaw มีแนวคิดสาธารณะมากเกินไป
และมีหลายจุดเกินไปที่ semantics ของการส่งมอบสามารถคลาดเคลื่อนได้

ปัญหาด้านความน่าเชื่อถือที่ทำให้เรื่องนี้ชัดเจนคือ:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

invariant เป้าหมายกว้างกว่า Telegram: เมื่อ core ตัดสินว่าควรมีข้อความขาออก
ที่มองเห็นได้ ความตั้งใจนั้นต้องทนทานก่อนพยายามส่งผ่านแพลตฟอร์ม
และต้อง commit ใบรับจากแพลตฟอร์มหลังสำเร็จ นั่นทำให้ OpenClaw มีการกู้คืนแบบ at-least-once
พฤติกรรม exactly-once มีอยู่เฉพาะสำหรับอะแดปเตอร์ที่พิสูจน์ native idempotency ได้
หรือสามารถ reconcile ความพยายามที่ไม่รู้ผลหลังส่งกับสถานะของแพลตฟอร์มก่อน replay

นั่นคือสถานะปลายทางของ refactor นี้ ไม่ใช่คำอธิบายของทุกเส้นทางปัจจุบัน
ระหว่าง migration ตัวช่วยขาออกที่มีอยู่ยังสามารถ fallback ไปเป็นการส่งตรงได้
เมื่อการเขียนคิวแบบ best-effort ล้มเหลว refactor จะถือว่าเสร็จสมบูรณ์ก็ต่อเมื่อ
การส่งสุดท้ายที่ทนทาน fail closed หรือ opt out อย่างชัดเจนด้วยนโยบาย non-durable ที่มีเอกสารกำกับ

## เป้าหมาย

- วงจรชีวิต core หนึ่งเดียวสำหรับเส้นทางรับและส่งข้อความของทุกช่องทาง
- การส่งสุดท้ายที่ทนทานโดยค่าเริ่มต้นในวงจรชีวิตข้อความใหม่หลังจากอะแดปเตอร์
  ประกาศพฤติกรรมที่ replay-safe
- semantics ที่ใช้ร่วมกันสำหรับ preview, edit, stream, finalization, retry, recovery และ receipt
- พื้นผิว SDK Plugin ขนาดเล็กที่ Plugin บุคคลที่สามสามารถเรียนรู้และดูแลได้
- ความเข้ากันได้สำหรับ caller `channel.turn` ที่มีอยู่ระหว่าง migration
- จุดขยายที่ชัดเจนสำหรับความสามารถช่องทางใหม่
- ไม่มี branch เฉพาะแพลตฟอร์มใน core
- ไม่มีข้อความช่องทางแบบ token-delta การสตรีมของช่องทางยังคงเป็นการส่ง preview ของข้อความ,
  edit, append หรือ block ที่เสร็จสมบูรณ์
- metadata ที่มีโครงสร้างและมีต้นทางจาก OpenClaw สำหรับ output เชิงปฏิบัติการ/ระบบ เพื่อไม่ให้
  gateway failure ที่มองเห็นได้กลับเข้าไปในห้องที่เปิดใช้ bot ร่วมกันในฐานะ prompt ใหม่

## ไม่ใช่เป้าหมาย

- อย่าลบ `runtime.channel.turn.*` ใน phase แรก
- อย่าบังคับทุกช่องทางให้มีพฤติกรรม native transport แบบเดียวกัน
- อย่าสอน core เกี่ยวกับหัวข้อ Telegram, native stream ของ Slack, redaction ของ Matrix,
  card ของ Feishu, voice ของ QQ หรือ activity ของ Teams
- อย่าเผยแพร่ตัวช่วย migration ภายในทั้งหมดเป็น SDK API ที่เสถียร
- อย่าทำให้ retry replay การดำเนินการแพลตฟอร์ม non-idempotent ที่เสร็จสมบูรณ์แล้ว

## โมเดลอ้างอิง

Vercel Chat มีโมเดลทางความคิดสาธารณะที่ดี:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- เมธอดของอะแดปเตอร์ เช่น `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` และการดึง history
- อะแดปเตอร์สถานะสำหรับ dedupe, locks, queues และ persistence

OpenClaw ควรยืมคำศัพท์ ไม่ใช่คัดลอกพื้นผิว

สิ่งที่ OpenClaw ต้องการเพิ่มเติมจากโมเดลนั้น:

- ความตั้งใจส่งขาออกที่ทนทานก่อนเรียก direct transport
- บริบทการส่งที่ชัดเจนพร้อม begin, commit และ fail
- บริบทการรับที่รู้ policy การ ack ของแพลตฟอร์ม
- receipt ที่อยู่รอดหลัง restart และสามารถขับเคลื่อน edit, delete, recovery และ
  duplicate suppression
- SDK สาธารณะที่เล็กกว่า Plugin ที่ bundle มาใช้ตัวช่วย runtime ภายในได้ แต่
  Plugin บุคคลที่สามควรเห็น message API ที่สอดคล้องกันหนึ่งเดียว
- พฤติกรรมเฉพาะ agent: session, transcript, block streaming, tool
  progress, approval, media directive, silent reply และ history การ mention ในกลุ่ม

promise สไตล์ `thread.post()` ยังไม่พอสำหรับ OpenClaw เพราะซ่อน
ขอบเขต transaction ที่ตัดสินว่าการส่งสามารถกู้คืนได้หรือไม่

## โมเดล core

domain ใหม่ควรอยู่ใต้ namespace core ภายใน เช่น
`src/channels/message/*`.

มีแนวคิดสี่อย่าง:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` เป็นเจ้าของวงจรชีวิตขาเข้า

`send` เป็นเจ้าของวงจรชีวิตขาออก

`live` เป็นเจ้าของสถานะ preview, edit, progress และ stream

`state` เป็นเจ้าของการจัดเก็บ intent ที่ทนทาน, receipt, idempotency, recovery, locks และ
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

เป้าหมายอธิบายว่าข้อความอยู่ที่ใด:

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

สิ่งนี้ทำให้เส้นทางส่งเดียวกันรองรับการตอบกลับปกติ, การแจ้งเตือน Cron, prompt ขอ approval,
การทำงาน task เสร็จสมบูรณ์, การส่งจาก message-tool, การส่งจาก CLI หรือ Control UI, ผลลัพธ์ subagent
และการส่งอัตโนมัติ

### ต้นทาง

Origin อธิบายว่าใครสร้างข้อความและ OpenClaw ควรจัดการ echo ของข้อความนั้นอย่างไร
สิ่งนี้แยกจาก relation: ข้อความอาจเป็นการตอบกลับผู้ใช้
และยังคงเป็น output เชิงปฏิบัติการที่มีต้นทางจาก OpenClaw ได้

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

Core เป็นเจ้าของความหมายของ output ที่มีต้นทางจาก OpenClaw ช่องทางเป็นเจ้าของวิธี
encode origin นั้นลงใน transport ของตน

การใช้งานแรกที่จำเป็นคือ output ของ gateway failure มนุษย์ยังควรเห็น
ข้อความอย่าง "Agent failed before reply" หรือ "Missing API key" แต่ output เชิงปฏิบัติการของ OpenClaw
ที่ติดแท็กต้องไม่ถูกยอมรับเป็น input ที่เขียนโดย bot ในห้องร่วมเมื่อเปิดใช้ `allowBots`

### Receipt

Receipt เป็น first-class:

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

Receipt คือสะพานจาก intent ที่ทนทานไปสู่การ edit, delete, preview
finalization, duplicate suppression และ recovery ในอนาคต

Receipt สามารถอธิบายข้อความแพลตฟอร์มหนึ่งข้อความหรือการส่งแบบหลายส่วน ข้อความที่ chunk,
media พร้อม text, voice พร้อม text และ fallback ของ card ต้องรักษา
platform id ทั้งหมดไว้ ขณะยัง expose primary id สำหรับ threading และ edit ภายหลัง

## บริบทการรับ

การรับไม่ควรเป็นการเรียก helper เปล่า ๆ core ต้องมีบริบทที่รู้
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

Flow การรับ:

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

Ack ไม่ใช่สิ่งเดียว สัญญาการรับต้องแยกสัญญาณเหล่านี้ออกจากกัน:

- **Transport ack:** บอก webhook หรือ socket ของแพลตฟอร์มว่า OpenClaw ยอมรับ
  envelope ของเหตุการณ์แล้ว บางแพลตฟอร์มต้องการสิ่งนี้ก่อน dispatch
- **Polling offset ack:** เลื่อน cursor เพื่อไม่ให้ fetch เหตุการณ์เดิมอีก
  สิ่งนี้ต้องไม่เลื่อนข้ามงานที่กู้คืนไม่ได้
- **Inbound record ack:** ยืนยันว่า OpenClaw persist metadata ขาเข้าเพียงพอสำหรับ
  dedupe และ route การ redelivery
- **User-visible receipt:** พฤติกรรม read/status/typing แบบ optional; ไม่เคยเป็น
  ขอบเขตความทนทาน

`ReceiveAckPolicy` ควบคุมเฉพาะการ acknowledgement ของ transport หรือ polling เท่านั้น ต้อง
ไม่ถูกนำไปใช้ซ้ำสำหรับ read receipt หรือ status reaction

ก่อน authorization ของ bot การรับต้องใช้นโยบาย echo ของ OpenClaw ที่ใช้ร่วมกัน
เมื่อช่องทางสามารถ decode metadata ต้นทางของข้อความได้:

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

การ drop นี้อิงแท็ก ไม่ใช่อิงข้อความ ข้อความในห้องที่เขียนโดย bot พร้อมข้อความ
gateway-failure ที่มองเห็นได้เหมือนกันแต่ไม่มี metadata ต้นทาง OpenClaw ยังคง
ผ่าน authorization `allowBots` ตามปกติ

Ack policy ระบุชัดเจน:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

ตอนนี้ polling ของ Telegram ใช้ policy การ ack ของ receive-context สำหรับ persisted
restart watermark ของมัน tracker ยังคงสังเกต update ของ grammY เมื่อเข้าสู่
middleware chain แต่ OpenClaw persist เฉพาะ completed update id ที่ปลอดภัยหลัง
dispatch สำเร็จ ทำให้ update ที่ล้มเหลวหรือ pending ที่ต่ำกว่ายัง replay ได้หลัง
restart upstream `getUpdates` fetch offset ของ Telegram ยังคงถูกควบคุมโดย
ไลบรารี polling ดังนั้นส่วนที่ลึกกว่าที่ยังเหลือคือ source polling ที่ทนทานเต็มรูปแบบ
หากเราต้องการ redelivery ระดับแพลตฟอร์มที่เกินกว่า restart watermark ของ OpenClaw
แพลตฟอร์ม webhook อาจต้อง ack HTTP ทันที แต่ยังคงต้องมี inbound dedupe
และ intent การส่งขาออกที่ทนทาน เพราะ webhook สามารถ redeliver ได้

## บริบทการส่ง

การส่งก็อิงตามบริบทเช่นกัน:

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

การประสานงานที่แนะนำ:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

ตัวช่วยขยายเป็น:

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

ต้องมีเจตนาก่อน I/O ของทรานสปอร์ต การรีสตาร์ตหลังจากเริ่มต้นแล้วแต่ก่อน
commit สามารถกู้คืนได้

ขอบเขตที่อันตรายคือหลังจากแพลตฟอร์มสำเร็จและก่อน commit ใบรับ หาก
โปรเซสตายตรงนั้น OpenClaw จะไม่สามารถรู้ได้ว่าข้อความของแพลตฟอร์มมีอยู่หรือไม่
เว้นแต่อะแดปเตอร์จะให้ idempotency แบบเนทีฟหรือเส้นทางกระทบยอดใบรับ
ความพยายามเหล่านั้นต้องกลับมาทำงานต่อใน `unknown_after_send` ไม่ใช่เล่นซ้ำแบบไม่ตรวจสอบ ช่องทาง
ที่ไม่มีการกระทบยอดอาจเลือกการเล่นซ้ำแบบ at-least-once ได้เฉพาะเมื่อข้อความ
ที่มองเห็นได้ซ้ำกันเป็นข้อแลกเปลี่ยนที่ยอมรับได้และมีการบันทึกไว้สำหรับช่องทางและความสัมพันธ์นั้น
บริดจ์การกระทบยอด SDK ปัจจุบันกำหนดให้อะแดปเตอร์ประกาศ
`reconcileUnknownSend` จากนั้นขอให้ `durableFinal.reconcileUnknownSend`
จัดประเภทเอนทรีที่ไม่รู้จักเป็น `sent`, `not_sent` หรือ `unresolved`; มีเพียง `not_sent`
ที่อนุญาตให้เล่นซ้ำได้ และเอนทรีที่ยังไม่ถูกแก้ไขจะยังเป็นสถานะปลายทางหรือ retry เฉพาะ
การตรวจสอบการกระทบยอด

นโยบายความคงทนต้องระบุอย่างชัดเจน:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` หมายความว่า core ต้อง fail closed เมื่อไม่สามารถเขียนเจตนาที่คงทนได้
`best_effort` สามารถปล่อยผ่านได้เมื่อ persistence ไม่พร้อมใช้งาน `disabled` คง
พฤติกรรมการส่งตรงแบบเดิมไว้ ระหว่างการย้ายข้อมูล wrapper ดั้งเดิมและตัวช่วย
ความเข้ากันได้สาธารณะมีค่าเริ่มต้นเป็น `disabled`; สิ่งเหล่านี้ต้องไม่อนุมาน `required` จาก
ข้อเท็จจริงที่ว่าช่องทางมีอะแดปเตอร์ขาออกทั่วไป

บริบทการส่งยังเป็นเจ้าของเอฟเฟกต์หลังส่งเฉพาะช่องทางด้วย การย้ายข้อมูลจะไม่ปลอดภัย
หากการส่งที่คงทนข้ามพฤติกรรมภายในที่เคยแนบกับเส้นทางส่งตรงของช่องทาง
ตัวอย่างรวมถึงแคชระงับ self-echo, ตัวทำเครื่องหมายการเข้าร่วมเธรด, anchor การแก้ไขแบบเนทีฟ, การเรนเดอร์ลายเซ็นโมเดล,
และตัวป้องกันการซ้ำเฉพาะแพลตฟอร์ม เอฟเฟกต์เหล่านั้นต้องย้ายไปยัง
อะแดปเตอร์การส่ง อะแดปเตอร์การเรนเดอร์ หรือ hook บริบทการส่งที่มีชื่อ ก่อนที่
ช่องทางนั้นจะเปิดใช้การส่งสุดท้ายแบบทั่วไปที่คงทนได้

ตัวช่วยการส่งต้องคืนใบรับกลับไปถึงผู้เรียกทั้งหมด wrapper ที่คงทน
ไม่สามารถกลืน id ของข้อความหรือแทนที่ผลลัพธ์การส่งของช่องทางด้วย
`undefined`; dispatcher แบบบัฟเฟอร์ใช้ id เหล่านั้นสำหรับ anchor ของเธรด การแก้ไขภายหลัง
การทำให้ preview เป็นผลลัพธ์สุดท้าย และการระงับการซ้ำ

การส่ง fallback ทำงานกับ batch ไม่ใช่ payload เดี่ยว การเขียน silent-reply ใหม่,
fallback ของสื่อ, fallback ของการ์ด และ projection แบบ chunk ล้วนสามารถสร้างข้อความที่ส่งได้
มากกว่าหนึ่งรายการ ดังนั้นบริบทการส่งต้องส่ง batch ที่ถูก project ทั้งหมด
หรือบันทึกอย่างชัดเจนว่าทำไม payload เดียวเท่านั้นจึงถูกต้อง

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

เมื่อ fallback เช่นนี้มีความคงทน batch ที่ถูก project ทั้งหมดต้องถูกแทนด้วย
เจตนาการส่งที่คงทนหนึ่งรายการหรือแผน batch แบบอะตอมิกอื่น การบันทึก payload แต่ละรายการ
ทีละรายการไม่เพียงพอ: การ crash ระหว่าง payload อาจทำให้เกิด fallback ที่มองเห็นได้บางส่วน
โดยไม่มีระเบียนที่คงทนสำหรับ payload ที่เหลือ การกู้คืนต้องรู้ว่า
unit ใดมีใบรับแล้ว และเล่นซ้ำเฉพาะ unit ที่ขาดหายไป หรือทำเครื่องหมาย
batch เป็น `unknown_after_send` จนกว่าอะแดปเตอร์จะกระทบยอดได้

## บริบทแบบสด

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

สถานะแบบสดคงทนพอที่จะกู้คืนหรือระงับการซ้ำ:

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

- Telegram ส่งพร้อม edit preview โดยมี final ใหม่หลังจากอายุ preview เก่าเกินไป
- Discord ส่งพร้อม edit preview และ cancel เมื่อมีสื่อ/error/การตอบกลับอย่างชัดเจน
- Slack ใช้ native stream หรือ draft preview ตามรูปแบบเธรด
- Mattermost ทำให้ draft post เป็นผลลัพธ์สุดท้าย
- Matrix ทำให้ draft event เป็นผลลัพธ์สุดท้ายหรือ redaction เมื่อไม่ตรงกัน
- Teams ใช้ native progress stream
- QQ Bot ใช้ stream หรือ fallback ที่สะสมไว้

## พื้นผิวอะแดปเตอร์

เป้าหมาย SDK สาธารณะควรเป็น subpath เดียว:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

อะแดปเตอร์การส่ง:

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

อะแดปเตอร์การรับ:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

ก่อนการอนุญาต preflight core ต้องรัน predicate echo ที่ใช้ร่วมกันของ OpenClaw
ทุกครั้งที่ `origin.decode` คืน metadata ต้นทาง OpenClaw อะแดปเตอร์การรับ
จัดหาข้อเท็จจริงของแพลตฟอร์ม เช่น ผู้เขียนที่เป็นบอตและรูปทรงห้อง; core เป็นเจ้าของการตัดสินใจ
drop และลำดับ เพื่อให้ช่องทางไม่ต้องนำตัวกรองข้อความไปใช้ซ้ำเอง

อะแดปเตอร์ต้นทาง:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core ตั้งค่า `MessageOrigin` ช่องทางเพียงแปลค่าไปเป็นและกลับจาก metadata
ทรานสปอร์ตแบบเนทีฟ Slack แมปสิ่งนี้ไปยัง `chat.postMessage({ metadata })` และ
`message.metadata` ขาเข้า; Matrix สามารถแมปไปยังเนื้อหา event เพิ่มเติม; ช่องทาง
ที่ไม่มี metadata แบบเนทีฟสามารถใช้ registry ใบรับ/ขาออกได้เมื่อสิ่งนั้นเป็น
ค่าประมาณที่ดีที่สุดที่มี

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

## การลด SDK สาธารณะ

พื้นผิวสาธารณะใหม่ควรดูดซับหรือเลิกใช้พื้นที่เชิงแนวคิดเหล่านี้:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- การใช้งานสาธารณะส่วนใหญ่ของ `outbound-runtime`
- ตัวช่วย lifecycle ของ draft stream แบบเฉพาะกิจ

subpath ความเข้ากันได้ยังคงอยู่ในฐานะ wrapper ได้ แต่ third-party plugins ใหม่
ไม่ควรต้องใช้สิ่งเหล่านี้

Bundled plugins อาจยังคง import ตัวช่วยภายในผ่าน subpath runtime ที่สงวนไว้
ระหว่างการย้ายข้อมูล เอกสารสาธารณะควรชี้นำผู้เขียน Plugin ไปยัง
`plugin-sdk/channel-message` เมื่อมีอยู่แล้ว

## ความสัมพันธ์กับ channel turn

`runtime.channel.turn.*` ควรคงอยู่ระหว่างการย้ายข้อมูล

ควรกลายเป็นอะแดปเตอร์ความเข้ากันได้:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` ควรคงอยู่ในตอนแรกเช่นกัน:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

หลังจาก bundled plugins และเส้นทางความเข้ากันได้ของ third-party ที่รู้จักทั้งหมดถูก bridge แล้ว
`channel.turn` สามารถถูกเลิกใช้ได้ ไม่ควรถูกลบจนกว่าจะมี
เส้นทางการย้ายข้อมูล SDK ที่เผยแพร่แล้วและ contract tests ที่พิสูจน์ว่า plugins เก่ายังคงทำงาน
หรือ fail ด้วยข้อผิดพลาดเวอร์ชันที่ชัดเจน

## ราวกั้นความเข้ากันได้

ระหว่างการย้ายข้อมูล การส่งแบบทั่วไปที่คงทนเป็น opt-in สำหรับช่องทางใดก็ตามที่
callback การส่งที่มีอยู่มี side effects นอกเหนือจาก "send this payload"

entry point ดั้งเดิมเป็นแบบไม่คงทนโดยค่าเริ่มต้น:

- `channel.turn.run` และ `dispatchAssembledChannelTurn` ใช้ callback
  การส่งของช่องทาง เว้นแต่ช่องทางนั้นจะให้ object นโยบาย/options ที่คงทน
  และผ่านการตรวจสอบอย่างชัดเจน
- `channel.turn.runPrepared` ยังคงเป็นของช่องทางจนกว่า dispatcher ที่เตรียมไว้
  จะเรียกบริบทการส่งอย่างชัดเจน
- ตัวช่วยความเข้ากันได้สาธารณะ เช่น `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` และตัวช่วย direct-DM จะไม่ฉีดการส่ง
  แบบทั่วไปที่คงทนก่อน callback `deliver` หรือ `reply` ที่ผู้เรียกให้มา

สำหรับประเภท migration bridge, `durable: undefined` หมายถึง "ไม่คงทน"
เส้นทางที่คงทนจะเปิดใช้เฉพาะด้วยค่านโยบาย/options ที่ชัดเจนเท่านั้น `durable:
false` ยังคงเป็นการสะกดแบบความเข้ากันได้ได้ แต่การใช้งานไม่ควร
บังคับให้ทุกช่องทางที่ยังไม่ย้ายข้อมูลต้องเพิ่มมัน

โค้ด bridge ปัจจุบันต้องคงการตัดสินใจเรื่องความคงทนไว้อย่างชัดเจน:

- การส่งมอบผลลัพธ์สุดท้ายแบบทนทานจะคืนสถานะที่จำแนกได้ `handled_visible` และ
  `handled_no_send` เป็นสถานะสิ้นสุด; `unsupported` และ `not_applicable` อาจถอยกลับ
  ไปใช้การส่งมอบที่ช่องทางเป็นเจ้าของ; `failed` จะส่งต่อความล้มเหลวในการส่ง
- การส่งมอบผลลัพธ์สุดท้ายแบบทนทานทั่วไปถูกควบคุมด้วยความสามารถของอะแดปเตอร์ เช่น
  การส่งมอบแบบเงียบ การรักษาเป้าหมายการตอบกลับ การรักษาคำอ้างอิงแบบเนทีฟ และ
  ฮุกการส่งข้อความ หากความเท่าเทียมยังขาดอยู่ ควรเลือกการส่งมอบที่ช่องทางเป็นเจ้าของ
  ไม่ใช่การส่งทั่วไปที่เปลี่ยนพฤติกรรมที่ผู้ใช้มองเห็นได้
- การส่งแบบทนทานที่มีคิวรองรับจะแสดงข้อมูลอ้างอิงเจตนาการส่งมอบ ฟิลด์เซสชัน
  `pendingFinalDelivery*` ที่มีอยู่สามารถพก id ของเจตนาในช่วงเปลี่ยนผ่านได้;
  สถานะปลายทางคือที่เก็บ `MessageSendIntent` แทนข้อความตอบกลับที่ถูกตรึงไว้
  พร้อมฟิลด์บริบทเฉพาะกิจ

อย่าเปิดใช้เส้นทางแบบทนทานทั่วไปสำหรับช่องทางใดจนกว่าทั้งหมดต่อไปนี้จะเป็นจริง:

- อะแดปเตอร์การส่งทั่วไปทำงานด้วยพฤติกรรมการเรนเดอร์และการขนส่งเดียวกับ
  เส้นทางตรงเดิม
- ผลข้างเคียงภายในเครื่องหลังส่งถูกรักษาไว้ผ่านบริบทการส่ง
- อะแดปเตอร์คืนใบรับหรือผลลัพธ์การส่งมอบพร้อม id ข้อความของแพลตฟอร์มทั้งหมด
- เส้นทางตัวจัดส่งที่เตรียมไว้เรียกบริบทการส่งใหม่ หรือยังคงถูกบันทึกไว้ว่า
  อยู่นอกการรับประกันแบบทนทาน
- การส่งมอบสำรองรองรับ payload ที่ฉายไว้ทุกตัว ไม่ใช่เฉพาะตัวแรก
- การส่งมอบสำรองแบบทนทานบันทึกอาร์เรย์ payload ที่ฉายไว้ทั้งหมดเป็นเจตนาหรือ
  แผนชุดงานเดียวที่เล่นซ้ำได้

อันตรายในการย้ายระบบที่ต้องรักษาไว้:

- การส่งมอบของตัวติดตาม iMessage จะบันทึกข้อความที่ส่งแล้วในแคช echo หลังจาก
  ส่งสำเร็จ การส่งผลลัพธ์สุดท้ายแบบทนทานยังต้องเติมข้อมูลในแคชนั้น มิฉะนั้น
  OpenClaw อาจนำเข้าการตอบกลับสุดท้ายของตัวเองกลับมาเป็นข้อความผู้ใช้ขาเข้า
- Tlon ต่อท้ายลายเซ็นโมเดลแบบไม่บังคับและบันทึกเธรดที่เข้าร่วมหลังการตอบกลับกลุ่ม
  การส่งมอบแบบทนทานทั่วไปต้องไม่ข้ามผลเหล่านั้น; ให้ย้ายผลเหล่านั้นเข้าไปใน
  อะแดปเตอร์เรนเดอร์/ส่ง/จบงานของ Tlon หรือคง Tlon ไว้บนเส้นทางที่ช่องทางเป็นเจ้าของ
- Discord และตัวจัดส่งที่เตรียมไว้อื่น ๆ เป็นเจ้าของพฤติกรรมการส่งมอบโดยตรงและ
  การแสดงตัวอย่างอยู่แล้ว สิ่งเหล่านี้ยังไม่อยู่ภายใต้การรับประกันแบบทนทานของ
  เทิร์นที่ประกอบแล้ว จนกว่าตัวจัดส่งที่เตรียมไว้จะกำหนดเส้นทางผลลัพธ์สุดท้ายผ่าน
  บริบทการส่งอย่างชัดเจน
- การส่งมอบสำรองแบบเงียบของ Telegram ต้องส่งอาร์เรย์ payload ที่ฉายไว้ทั้งหมด
  ทางลัดแบบ payload เดียวอาจทำให้ payload สำรองเพิ่มเติมหลังการฉายถูกละทิ้ง
- LINE, BlueBubbles, Zalo, Nostr และเส้นทางแบบประกอบ/ตัวช่วยอื่น ๆ ที่มีอยู่อาจมี
  การจัดการโทเค็นตอบกลับ การพร็อกซีสื่อ แคชข้อความที่ส่งแล้ว การล้างสถานะโหลด/สถานะ
  หรือเป้าหมายแบบ callback เท่านั้น สิ่งเหล่านี้ยังคงอยู่บนการส่งมอบที่ช่องทางเป็นเจ้าของ
  จนกว่าความหมายเหล่านั้นจะแสดงผ่านอะแดปเตอร์การส่งและได้รับการยืนยันด้วยการทดสอบ
- ตัวช่วย Direct-DM อาจมี callback การตอบกลับที่เป็นเป้าหมายการขนส่งที่ถูกต้องเพียงหนึ่งเดียว
  ขาออกทั่วไปต้องไม่เดาจาก `OriginatingTo` หรือ `To` แล้วข้าม callback นั้น
- ผลลัพธ์ความล้มเหลวของ OpenClaw Gateway ต้องยังคงมองเห็นได้สำหรับมนุษย์ แต่ echo
  ในห้องที่แท็กว่าเขียนโดยบอตต้องถูกทิ้งก่อนการอนุญาต `allowBots`
  ช่องทางต้องไม่ทำสิ่งนี้ด้วยตัวกรองคำนำหน้าข้อความที่มองเห็นได้ เว้นแต่เป็นมาตรการหยุดฉุกเฉินระยะสั้น;
  สัญญาแบบทนทานคือเมตาดาตาต้นทางแบบมีโครงสร้าง

## พื้นที่จัดเก็บภายใน

คิวแบบทนทานควรจัดเก็บเจตนาการส่งข้อความ ไม่ใช่ payload การตอบกลับ

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

คิวควรเก็บข้อมูลตัวตนให้เพียงพอเพื่อเล่นซ้ำผ่านบัญชี เธรด เป้าหมาย นโยบายการจัดรูปแบบ
และกฎสื่อเดิมหลังรีสตาร์ต

## คลาสความล้มเหลว

อะแดปเตอร์ช่องทางจัดประเภทความล้มเหลวของการขนส่งเป็นหมวดหมู่แบบปิด:

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

นโยบายหลัก:

- ลองซ้ำสำหรับ `transient` และ `rate_limit`
- อย่าลองซ้ำสำหรับ `invalid_payload` เว้นแต่มีการเรนเดอร์สำรอง
- อย่าลองซ้ำสำหรับ `auth` หรือ `permission` จนกว่าการกำหนดค่าจะเปลี่ยน
- สำหรับ `not_found` ให้การจบงานสดถอยกลับจากการแก้ไขไปเป็นการส่งใหม่เมื่อช่องทางประกาศว่าปลอดภัย
- สำหรับ `conflict` ให้ใช้กฎใบรับ/idempotency เพื่อตัดสินใจว่าข้อความมีอยู่แล้วหรือไม่
- ข้อผิดพลาดใด ๆ หลังจากอะแดปเตอร์อาจทำ I/O ของแพลตฟอร์มเสร็จแล้ว แต่ก่อน commit
  ใบรับ จะกลายเป็น `unknown_after_send` เว้นแต่อะแดปเตอร์พิสูจน์ได้ว่าการทำงานบน
  แพลตฟอร์มไม่ได้เกิดขึ้น

## การแมปช่องทาง

| ช่องทาง                  | เป้าหมายการย้ายระบบ                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | รับนโยบาย ack พร้อมการส่งขั้นสุดท้ายแบบทนทาน อะแดปเตอร์สดเป็นเจ้าของการส่งพร้อมการแก้ไขพรีวิว การส่งขั้นสุดท้ายของพรีวิวที่ค้าง หัวข้อ การข้ามพรีวิว quote-reply การสำรองเมื่อมีสื่อ และการจัดการ retry-after                                                                                                                                                                   |
| Discord                  | อะแดปเตอร์ส่งห่อหุ้มการส่งเพย์โหลดแบบทนทานที่มีอยู่ อะแดปเตอร์สดเป็นเจ้าของการแก้ไขร่าง ร่างความคืบหน้า การยกเลิกพรีวิวสื่อ/ข้อผิดพลาด การคงเป้าหมายการตอบกลับ และใบรับรหัสข้อความ ตรวจสอบเสียงสะท้อนความล้มเหลวของ Gateway ที่บอทเขียนในห้องร่วม ใช้รีจิสทรีขาออกหรือสิ่งเทียบเท่าแบบเนทีฟอื่น หาก Discord ไม่สามารถพกพาเมทาดาทาต้นทางบนข้อความปกติได้ |
| Slack                    | อะแดปเตอร์ส่งจัดการโพสต์แชตปกติ อะแดปเตอร์สดเลือกสตรีมเนทีฟเมื่อรูปร่างเธรดรองรับ มิฉะนั้นใช้พรีวิวร่าง ใบรับจะคง timestamp ของเธรดไว้ อะแดปเตอร์ต้นทางแมปความล้มเหลวของ Gateway ของ OpenClaw ไปยัง `chat.postMessage.metadata` ของ Slack และทิ้งเสียงสะท้อนห้องบอทที่ติดแท็กก่อนการอนุญาต `allowBots`                                  |
| WhatsApp                 | อะแดปเตอร์ส่งเป็นเจ้าของการส่งข้อความ/สื่อพร้อม intent ขั้นสุดท้ายแบบทนทาน อะแดปเตอร์รับจัดการการกล่าวถึงในกลุ่มและตัวตนผู้ส่ง ส่วนสดอาจยังไม่มีอยู่จนกว่า WhatsApp จะมีการขนส่งที่แก้ไขได้                                                                                                                                                                        |
| Matrix                   | อะแดปเตอร์สดเป็นเจ้าของการแก้ไขเหตุการณ์ร่าง การทำให้เสร็จสิ้น การ redaction ข้อจำกัดสื่อที่เข้ารหัส และทางสำรองเมื่อเป้าหมายตอบกลับไม่ตรงกัน อะแดปเตอร์รับเป็นเจ้าของการ hydrate เหตุการณ์ที่เข้ารหัสและการกำจัดรายการซ้ำ อะแดปเตอร์ต้นทางควรเข้ารหัสต้นทางความล้มเหลวของ Gateway ของ OpenClaw ลงในเนื้อหาเหตุการณ์ Matrix และทิ้งเสียงสะท้อนห้องของบอทที่กำหนดค่าก่อนการจัดการ `allowBots`              |
| Mattermost               | อะแดปเตอร์สดเป็นเจ้าของโพสต์ร่างหนึ่งรายการ การพับความคืบหน้า/เครื่องมือ การทำให้เสร็จสิ้นในตำแหน่งเดิม และทางสำรองแบบส่งใหม่                                                                                                                                                                                                                                                       |
| Microsoft Teams          | อะแดปเตอร์สดเป็นเจ้าของความคืบหน้าเนทีฟและพฤติกรรมสตรีมบล็อก อะแดปเตอร์ส่งเป็นเจ้าของกิจกรรมและใบรับไฟล์แนบ/การ์ด                                                                                                                                                                                                                                        |
| Feishu                   | อะแดปเตอร์เรนเดอร์เป็นเจ้าของการเรนเดอร์ข้อความ/การ์ด/ดิบ อะแดปเตอร์สดเป็นเจ้าของการ์ดสตรีมมิงและการระงับขั้นสุดท้ายที่ซ้ำกัน อะแดปเตอร์ส่งเป็นเจ้าของความคิดเห็น เซสชันหัวข้อ สื่อ และการระงับเสียง                                                                                                                                                                      |
| QQ Bot                   | อะแดปเตอร์สดเป็นเจ้าของสตรีมมิง C2C timeout ของตัวสะสม และการส่งขั้นสุดท้ายสำรอง อะแดปเตอร์เรนเดอร์เป็นเจ้าของแท็กสื่อและข้อความในรูปแบบเสียง                                                                                                                                                                                                                               |
| Signal                   | อะแดปเตอร์รับและส่งแบบง่าย ไม่มีอะแดปเตอร์สด เว้นแต่ signal-cli จะเพิ่มการรองรับการแก้ไขที่เชื่อถือได้                                                                                                                                                                                                                                                                |
| iMessage และ BlueBubbles | อะแดปเตอร์รับและส่งแบบง่าย การส่งของ iMessage ต้องคงการเติม echo-cache ของมอนิเตอร์ไว้ก่อนที่ขั้นสุดท้ายแบบทนทานจะสามารถข้ามการส่งผ่านมอนิเตอร์ได้ ความสามารถเฉพาะของ BlueBubbles เช่น การพิมพ์ ปฏิกิริยา และไฟล์แนบยังคงเป็นความสามารถของอะแดปเตอร์                                                                                                                            |
| Google Chat              | อะแดปเตอร์รับและส่งแบบง่าย โดยแมปความสัมพันธ์ของเธรดกับ spaces และรหัสเธรด ตรวจสอบพฤติกรรมห้อง `allowBots=true` สำหรับเสียงสะท้อนความล้มเหลวของ Gateway ของ OpenClaw ที่ติดแท็ก                                                                                                                                                                                        |
| LINE                     | อะแดปเตอร์รับและส่งแบบง่าย พร้อมจำลองข้อจำกัด reply-token เป็นความสามารถของเป้าหมาย/ความสัมพันธ์                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | บริดจ์รับของ SDK พร้อมอะแดปเตอร์ส่ง                                                                                                                                                                                                                                                                                                                          |
| IRC                      | อะแดปเตอร์รับและส่งแบบง่าย ไม่มีใบรับการแก้ไขแบบทนทาน                                                                                                                                                                                                                                                                                                    |
| Nostr                    | อะแดปเตอร์รับและส่งสำหรับ DM ที่เข้ารหัส ใบรับคือรหัสเหตุการณ์                                                                                                                                                                                                                                                                                           |
| QA Channel               | อะแดปเตอร์ทดสอบสัญญาสำหรับพฤติกรรมการรับ ส่ง สด retry และ recovery                                                                                                                                                                                                                                                                                   |
| Synology Chat            | อะแดปเตอร์รับและส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | อะแดปเตอร์ส่งต้องคงการเรนเดอร์ลายเซ็นโมเดลและการติดตามเธรดที่เข้าร่วมไว้ ก่อนเปิดใช้การส่งขั้นสุดท้ายแบบทนทานทั่วไป                                                                                                                                                                                                                        |
| Twitch                   | อะแดปเตอร์รับและส่งแบบง่าย พร้อมการจำแนก rate-limit                                                                                                                                                                                                                                                                                               |
| Zalo                     | อะแดปเตอร์รับและส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | อะแดปเตอร์รับและส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |

## แผนการย้ายระบบ

### ระยะที่ 1: โดเมนข้อความภายใน

- เพิ่มชนิด `src/channels/message/*` สำหรับข้อความ เป้าหมาย ความสัมพันธ์
  ต้นทาง ใบรับ ความสามารถ intent แบบทนทาน บริบทการรับ บริบทการส่ง
  บริบทสด และคลาสความล้มเหลว
- เพิ่ม `origin?: MessageOrigin` ไปยังชนิดเพย์โหลดบริดจ์การย้ายระบบที่ใช้โดย
  การส่งคำตอบปัจจุบัน จากนั้นย้ายฟิลด์นั้นไปยัง `ChannelMessage` และชนิดข้อความที่เรนเดอร์
  เมื่อการรีแฟกเตอร์แทนที่เพย์โหลดคำตอบ
- คงสิ่งนี้เป็นภายในจนกว่าอะแดปเตอร์และการทดสอบจะพิสูจน์รูปร่างได้
- เพิ่มการทดสอบหน่วยแบบ pure สำหรับการเปลี่ยนสถานะและ serialization

### ระยะที่ 2: คอร์การส่งแบบทนทาน

- ย้ายคิวขาออกที่มีอยู่จากความทนทานของเพย์โหลดคำตอบไปยัง
  intent การส่งข้อความแบบทนทาน
- ให้ intent การส่งแบบทนทานพกพาอาร์เรย์เพย์โหลดที่ฉายภาพแล้วหรือแผนแบบแบตช์ ไม่ใช่
  เพียงเพย์โหลดคำตอบเดียว
- คงพฤติกรรม recovery ของคิวปัจจุบันผ่านการแปลงเพื่อความเข้ากันได้
- ทำให้ `deliverOutboundPayloads` เรียก `messages.send`
- ทำให้ความทนทานของการส่งขั้นสุดท้ายเป็นค่าเริ่มต้น และปิดแบบล้มเหลวเมื่อไม่สามารถเขียน intent แบบทนทานในวงจรชีวิตข้อความใหม่ได้ หลังจากอะแดปเตอร์ประกาศความปลอดภัยในการ replay แล้ว เส้นทางความเข้ากันได้ของ channel-turn และ SDK ที่มีอยู่ยังคงเป็นการส่งตรงโดยค่าเริ่มต้นในระยะนี้
- บันทึกใบรับอย่างสม่ำเสมอ
- ส่งคืนใบรับและผลลัพธ์การส่งไปยังผู้เรียก dispatcher เดิม แทนที่จะถือว่าการส่งแบบทนทานเป็น side effect สุดท้าย
- คงต้นทางข้อความผ่าน intent การส่งแบบทนทาน เพื่อให้ recovery, replay และ
  การส่งแบบแบ่งชิ้นคง provenance เชิงปฏิบัติการของ OpenClaw ไว้

### ระยะที่ 3: บริดจ์ Channel Turn

- นำ `channel.turn.run` และ `dispatchAssembledChannelTurn` ไปใช้งานใหม่บน
  `messages.receive` และ `messages.send`
- คงชนิด fact ปัจจุบันให้เสถียร
- คงพฤติกรรมเดิมไว้โดยค่าเริ่มต้น ช่องทาง assembled-turn จะกลายเป็นแบบทนทาน
  เฉพาะเมื่ออะแดปเตอร์ opt in อย่างชัดเจนด้วยนโยบายความทนทานที่ replay-safe
- คง `durable: false` ไว้เป็นทางหนีเพื่อความเข้ากันได้สำหรับเส้นทางที่ทำให้
  การแก้ไขเนทีฟเสร็จสิ้นและยังไม่สามารถ replay ได้อย่างปลอดภัย แต่ไม่พึ่งพา marker `false`
  เพื่อปกป้องช่องทางที่ยังไม่ได้ย้ายระบบ
- ตั้งความทนทานของ assembled-turn เป็นค่าเริ่มต้นเฉพาะในวงจรชีวิตข้อความใหม่ หลังจาก
  การแมปช่องทางพิสูจน์ว่าเส้นทางการส่งทั่วไปคงความหมายการส่งของช่องทางเดิมไว้

### ระยะที่ 4: บริดจ์ Dispatcher ที่เตรียมไว้

- แทนที่ `deliverDurableInboundReplyPayload` ด้วยบริดจ์ send-context
- คง helper เดิมไว้เป็น wrapper
- ย้าย Telegram, WhatsApp, Slack, Signal, iMessage และ Discord ก่อน เพราะ
  สิ่งเหล่านี้มีงาน durable-final อยู่แล้วหรือมีเส้นทางการส่งที่เรียบง่ายกว่า
- ให้ถือว่า dispatcher ที่เตรียมไว้ทุกรายการยังไม่ครอบคลุม จนกว่าจะเลือกใช้
  send context อย่างชัดเจน เอกสารและรายการ changelog ต้องระบุว่า "assembled
  channel turns" หรือระบุชื่อเส้นทางช่องทางที่ย้ายแล้ว แทนการอ้างว่า final
  replies อัตโนมัติทั้งหมดรองรับแล้ว
- คงพฤติกรรมของ `recordInboundSessionAndDispatchReply`, helper สำหรับ direct-DM
  และ helper ความเข้ากันได้สาธารณะในลักษณะคล้ายกันไว้เหมือนเดิม สิ่งเหล่านี้
  อาจเปิดเผยการเลือกใช้ send-context แบบชัดเจนในภายหลังได้ แต่ต้องไม่พยายามทำ
  generic durable delivery โดยอัตโนมัติก่อน delivery callback ที่ผู้เรียกเป็นเจ้าของ

### ระยะที่ 5: วงจรชีวิต Live แบบรวมศูนย์

- สร้าง `messages.live` พร้อม proof adapter สองตัว:
  - Telegram สำหรับ send, edit และ stale final send
  - Matrix สำหรับ draft finalization และ redaction fallback
- จากนั้นย้าย Discord, Slack, Mattermost, Teams, QQ Bot และ Feishu
- ลบโค้ด preview finalization ที่ซ้ำกันหลังจากแต่ละช่องทางมี
  parity tests แล้วเท่านั้น

### ระยะที่ 6: SDK สาธารณะ

- เพิ่ม `openclaw/plugin-sdk/channel-message`
- จัดทำเอกสารให้เป็น API สำหรับ Plugin ช่องทางที่แนะนำ
- อัปเดต package exports, entrypoint inventory, generated API baselines และ
  เอกสาร plugin SDK
- รวม `MessageOrigin`, origin encode/decode hooks และ predicate
  `shouldDropOpenClawEcho` ที่ใช้ร่วมกันไว้ในพื้นผิว SDK ของ channel-message
- คง compatibility wrappers สำหรับ subpaths เดิมไว้
- ทำเครื่องหมาย helper ของ SDK ที่ตั้งชื่อตาม reply ว่าเลิกแนะนำในเอกสารหลังจาก
  Plugin ที่รวมมาถูกย้ายแล้ว

### ระยะที่ 7: ผู้ส่งทั้งหมด

ย้ายตัวผลิต outbound ที่ไม่ใช่ reply ทั้งหมดไปยัง `messages.send`:

- การแจ้งเตือน cron และ heartbeat
- การเสร็จสิ้นของ task
- ผลลัพธ์ของ hook
- approval prompts และ approval results
- การส่งของ message tool
- ประกาศการเสร็จสิ้นของ subagent
- การส่งจาก CLI หรือ Control UI แบบชัดเจน
- เส้นทาง automation/broadcast

นี่คือจุดที่โมเดลหยุดเป็น "agent replies" และกลายเป็น "OpenClaw sends
messages"

### ระยะที่ 8: เลิกใช้ Turn

- คง `channel.turn` ไว้เป็น wrapper อย่างน้อยหนึ่งช่วงความเข้ากันได้
- เผยแพร่ migration notes
- รัน plugin SDK compatibility tests กับ import เดิม
- ลบหรือซ่อน helper ภายในเดิมหลังจากไม่มี Plugin ที่รวมมาต้องใช้แล้วเท่านั้น
  และสัญญาของ third-party มีตัวแทนที่เสถียรแล้ว

## แผนการทดสอบ

Unit tests:

- การทำ serialization และ recovery ของ durable send intent
- การใช้ idempotency key ซ้ำและการกดทับรายการซ้ำ
- การ commit receipt และการข้าม replay
- การ recovery ของ `unknown_after_send` ที่ reconcile ก่อน replay เมื่อ adapter
  รองรับ reconciliation
- นโยบายการจำแนก failure
- ลำดับนโยบาย receive ack
- การแมป relation สำหรับการส่งแบบ reply, followup, system และ broadcast
- origin factory สำหรับ Gateway failure และ predicate `shouldDropOpenClawEcho`
- การคง origin ผ่าน payload normalization, chunking, durable queue
  serialization และ recovery

Integration tests:

- adapter แบบง่ายของ `channel.turn.run` ยังบันทึกและส่งได้
- การส่ง legacy assembled-turn ไม่กลายเป็น durable เว้นแต่ช่องทางจะเลือกใช้
  อย่างชัดเจน
- บริดจ์ `channel.turn.runPrepared` ยังบันทึกและ finalize ได้
- helper ความเข้ากันได้สาธารณะเรียก delivery callbacks ที่ผู้เรียกเป็นเจ้าของ
  โดยค่าเริ่มต้น และไม่ generic-send ก่อน callback เหล่านั้น
- durable fallback delivery replay อาร์เรย์ payload ที่ project แล้วทั้งหมดหลัง
  restart และไม่สามารถปล่อยให้ payload ภายหลังไม่ถูกบันทึกหลัง crash ตั้งแต่ต้น
- durable assembled-turn delivery ส่งคืน platform message ids ไปยัง buffered
  dispatcher
- custom delivery hooks ยังส่งคืน platform message ids เมื่อ durable delivery
  ถูกปิดใช้งานหรือไม่พร้อมใช้งาน
- final reply รอดจาก restart ระหว่าง assistant completion กับ platform send
- preview draft finalize อยู่ที่เดิมเมื่ออนุญาต
- preview draft ถูกยกเลิกหรือ redacted เมื่อ media/error/reply-target mismatch
  ต้องใช้ normal delivery
- block streaming และ preview streaming ไม่ส่งข้อความเดียวกันทั้งคู่
- media ที่ stream ไปตั้งแต่ต้นไม่ถูกทำซ้ำในการส่งขั้นสุดท้าย

Channel tests:

- Telegram topic reply ที่ใช้ polling ack ถูกหน่วงจนถึง safe
  completed watermark ของ receive context
- Telegram polling recovery สำหรับ updates ที่ accepted-but-not-delivered ถูก
  ครอบคลุมโดยโมเดล persisted safe-completed offset
- Telegram stale preview ส่ง final ใหม่และล้าง preview
- Telegram silent fallback ส่ง fallback payload ที่ project แล้วทุกรายการ
- Telegram silent fallback durability บันทึกอาร์เรย์ fallback ที่ project แล้ว
  ทั้งหมดแบบ atomic ไม่ใช่ durable intent แบบ single-payload หนึ่งรายการต่อ
  การวนลูปแต่ละครั้ง
- Discord preview cancel เมื่อมี media/error/explicit reply
- final ของ Discord prepared dispatcher วิ่งผ่าน send context ก่อนที่เอกสาร
  หรือ changelog จะอ้างว่า Discord final-reply durability รองรับแล้ว
- iMessage durable final sends เติม monitor sent-message echo cache
- เส้นทาง legacy delivery ของ LINE, BlueBubbles, Zalo และ Nostr ไม่ถูกข้ามโดย
  generic durable send จนกว่าจะมี adapter parity tests
- Direct-DM/Nostr callback delivery ยังคงเป็นแหล่งอำนาจ เว้นแต่จะถูกย้ายอย่าง
  ชัดเจนไปยัง message target ที่สมบูรณ์และ send adapter ที่ replay-safe
- ข้อความ Slack tagged OpenClaw gateway failure ยังมองเห็นเป็น outbound,
  tagged bot-room echoes ถูก drop ก่อน `allowBots` และข้อความ bot ที่ไม่ tagged
  แต่มี visible text เดียวกันยังคงทำตามการอนุญาต bot ตามปกติ
- Slack native stream fallback ไปยัง draft preview ใน top-level DMs
- Matrix preview finalization และ redaction fallback
- Matrix tagged OpenClaw gateway-failure room echoes จากบัญชี bot ที่กำหนดค่าไว้
  ถูก drop ก่อนการจัดการ `allowBots`
- shared-room gateway-failure cascade audits ของ Discord และ Google Chat
  ครอบคลุมโหมด `allowBots` ก่อนอ้างว่ามี generic protection ที่นั่น
- Mattermost draft finalization และ fresh-send fallback
- Teams native progress finalization
- Feishu duplicate final suppression
- QQ Bot accumulator timeout fallback
- Tlon durable final sends คงการแสดงผล model-signature และการติดตาม participated
  thread
- final sends แบบ durable อย่างง่ายของ WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo และ
  Zalo Personal

Validation:

- ไฟล์ Vitest แบบเจาะจงระหว่างการพัฒนา
- `pnpm check:changed` ใน Testbox สำหรับพื้นผิวที่เปลี่ยนทั้งหมด
- `pnpm check` ที่กว้างกว่าใน Testbox ก่อนลง refactor ทั้งหมดหรือหลังการเปลี่ยน
  public SDK/export
- live หรือ qa-channel smoke สำหรับอย่างน้อยหนึ่งช่องทางที่แก้ไขได้และหนึ่ง
  ช่องทางส่งอย่างเดียวแบบง่าย ก่อนลบ compatibility wrappers

## คำถามเปิด

- Telegram ควรแทนที่แหล่ง grammY runner ด้วย durable polling source แบบเต็มในท้ายที่สุด
  หรือไม่ เพื่อควบคุม platform-level redelivery ได้ ไม่ใช่เพียง persisted restart
  watermark ของ OpenClaw
- durable live preview state ควรถูกเก็บไว้ใน queue record เดียวกับ final send
  intent หรือใน sibling live-state store
- compatibility wrappers จะยังถูกจัดทำเอกสารไว้นานแค่ไหนหลังจาก
  `plugin-sdk/channel-message` เปิดตัว
- third-party plugins ควร implement receive adapters โดยตรง หรือควรให้เฉพาะ
  normalize/send/live hooks ผ่าน `defineChannelMessageAdapter`
- receipt fields ใดปลอดภัยที่จะเปิดเผยใน SDK สาธารณะ เทียบกับ internal runtime
  state
- side effects เช่น self-echo caches และ participated-thread markers ควรถูก
  จำลองเป็น send-context hooks, adapter-owned finalize steps หรือ receipt
  subscribers
- ช่องทางใดมี native origin metadata, ช่องทางใดต้องใช้ persisted outbound
  registries และช่องทางใดไม่สามารถให้ cross-bot echo suppression ที่เชื่อถือได้

## เกณฑ์การยอมรับ

- ช่องทางข้อความที่รวมมาทุกช่องทางส่ง final visible output ผ่าน
  `messages.send`
- ช่องทางข้อความ inbound ทุกช่องทางเข้าผ่าน `messages.receive` หรือ documented
  compatibility wrapper
- ช่องทาง preview/edit/stream ทุกช่องทางใช้ `messages.live` สำหรับ draft state
  และ finalization
- `channel.turn` เป็นเพียง wrapper
- helper ของ SDK ที่ตั้งชื่อตาม reply เป็น compatibility exports ไม่ใช่เส้นทางที่แนะนำ
- durable recovery สามารถ replay pending final sends หลัง restart ได้โดยไม่สูญเสีย
  final response หรือทำซ้ำ send ที่ commit แล้ว; send ที่ไม่ทราบผลลัพธ์บน platform
  จะถูก reconciled ก่อน replay หรือถูกจัดทำเอกสารว่าเป็น at-least-once สำหรับ
  adapter นั้น
- durable final sends fail closed เมื่อไม่สามารถเขียน durable intent ได้ เว้นแต่
  ผู้เรียกเลือกโหมด non-durable ที่จัดทำเอกสารไว้โดยชัดเจน
- legacy channel-turn และ SDK compatibility helpers ตั้งค่าเริ่มต้นเป็น direct
  channel-owned delivery; generic durable send ต้องเลือกใช้แบบชัดเจนเท่านั้น
- receipts คง platform message ids ทั้งหมดสำหรับ multi-part deliveries และ
  primary id สำหรับความสะดวกในการ threading/edit
- durable wrappers คง channel-local side effects ก่อนแทนที่ direct delivery
  callbacks
- prepared dispatchers จะไม่ถูกนับว่า durable จนกว่าเส้นทาง final delivery จะใช้
  send context อย่างชัดเจน
- fallback delivery จัดการ payload ที่ project แล้วทุกรายการ
- durable fallback delivery บันทึก payload ที่ project แล้วทุกรายการไว้ใน intent
  หรือ batch plan ที่ replay ได้หนึ่งชุด
- OpenClaw-originated gateway failure output มองเห็นได้สำหรับมนุษย์ แต่ tagged
  bot-authored room echoes ถูก drop ก่อน bot authorization บนช่องทางที่ประกาศ
  รองรับ origin contract
- เอกสารอธิบาย send, receive, live, state, receipts, relations, failure policy,
  migration และ test coverage

## ที่เกี่ยวข้อง

- [Messages](/th/concepts/messages)
- [Streaming and chunking](/th/concepts/streaming)
- [Progress drafts](/th/concepts/progress-drafts)
- [Retry policy](/th/concepts/retry)
- [Channel turn kernel](/th/plugins/sdk-channel-turn)
