---
read_when:
    - การปรับโครงสร้างพฤติกรรมการส่งหรือรับของช่องทาง
    - การเปลี่ยนการผลัดรอบของช่องทาง การส่งต่อการตอบกลับ คิวขาออก การสตรีมตัวอย่าง หรือ API ข้อความของ Plugin SDK
    - การออกแบบ Plugin ช่องทางใหม่ที่ต้องการการส่งแบบคงทน การยืนยันการรับ การแสดงตัวอย่าง การแก้ไข หรือการลองซ้ำ
summary: แผนการออกแบบสำหรับวงจรชีวิตแบบรวมของการรับ ส่ง แสดงตัวอย่าง แก้ไข และสตรีมข้อความแบบคงทน
title: การปรับโครงสร้างวงจรชีวิตของข้อความ
x-i18n:
    generated_at: "2026-05-10T19:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

หน้านี้คือการออกแบบเป้าหมายสำหรับแทนที่ตัวช่วยแบบกระจัดกระจายของรอบช่องทาง, การจัดส่งการตอบกลับ,
การสตรีมตัวอย่าง และการส่งออกภายนอก ด้วยวงจรชีวิตข้อความที่ทนทานหนึ่งชุด

ฉบับย่อ:

- primitive หลักควรเป็น **receive** และ **send** ไม่ใช่ **reply**
- การตอบกลับเป็นเพียงความสัมพันธ์บนข้อความขาออก
- turn เป็นความสะดวกในการประมวลผลขาเข้า ไม่ใช่เจ้าของการส่งมอบ
- การส่งต้องอิงบริบท: `begin`, render, preview หรือ stream, final send,
  commit, fail
- การรับก็ต้องอิงบริบทเช่นกัน: normalize, dedupe, route, record,
  dispatch, platform ack, fail
- SDK Plugin สาธารณะควรถูกรวมให้เหลือพื้นผิว channel-message ขนาดเล็กหนึ่งชุด

## ปัญหา

สแต็กช่องทางปัจจุบันเติบโตมาจากความต้องการเฉพาะที่ถูกต้องหลายอย่าง:

- อะแดปเตอร์ขาเข้าแบบเรียบง่ายใช้ `runtime.channel.turn.run`
- อะแดปเตอร์ที่สมบูรณ์กว่าใช้ `runtime.channel.turn.runPrepared`
- ตัวช่วยแบบเดิมใช้ `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, ตัวช่วย payload การตอบกลับ, การแบ่ง chunk การตอบกลับ,
  การอ้างอิงการตอบกลับ และตัวช่วย runtime ขาออก
- การสตรีมตัวอย่างอยู่ในตัวจัดส่งเฉพาะช่องทาง
- กำลังเพิ่มความทนทานของการส่งมอบขั้นสุดท้ายรอบเส้นทาง payload การตอบกลับที่มีอยู่

รูปแบบนั้นแก้บั๊กเฉพาะจุดได้ แต่ทำให้ OpenClaw มีแนวคิดสาธารณะมากเกินไป
และมีตำแหน่งมากเกินไปที่ semantic ของการส่งมอบอาจคลาดเคลื่อน

ปัญหาด้านความน่าเชื่อถือที่เปิดเผยเรื่องนี้คือ:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

invariant เป้าหมายกว้างกว่า Telegram: เมื่อ core ตัดสินใจว่าควรมีข้อความขาออก
ที่มองเห็นได้ intent ต้องทนทานก่อนพยายามส่งไปยังแพลตฟอร์ม และต้อง commit
receipt ของแพลตฟอร์มหลังสำเร็จ นั่นทำให้ OpenClaw ฟื้นตัวแบบ at-least-once ได้
พฤติกรรม exactly-once มีอยู่เฉพาะสำหรับอะแดปเตอร์ที่พิสูจน์ idempotency แบบ native ได้
หรือ reconcile การพยายามส่งที่ unknown-after-send กับสถานะของแพลตฟอร์มก่อน replay

นั่นคือสถานะปลายทางของการ refactor นี้ ไม่ใช่คำอธิบายของทุกเส้นทางปัจจุบัน
ระหว่างการย้าย ระบบตัวช่วยขาออกที่มีอยู่อาจยัง fallback ไปส่งโดยตรงเมื่อการเขียนคิวแบบ best-effort ล้มเหลว
การ refactor จะถือว่าเสร็จสมบูรณ์ก็ต่อเมื่อ final send แบบทนทาน fail closed
หรือ opt out อย่างชัดเจนด้วยนโยบาย non-durable ที่มีเอกสารกำกับ

## เป้าหมาย

- วงจรชีวิตหลักหนึ่งชุดสำหรับเส้นทางรับและส่งข้อความของทุกช่องทาง
- final send แบบทนทานเป็นค่าเริ่มต้นในวงจรชีวิตข้อความใหม่หลังจากอะแดปเตอร์
  ประกาศพฤติกรรมที่ replay ได้อย่างปลอดภัย
- semantic ร่วมสำหรับตัวอย่าง, การแก้ไข, การสตรีม, การ finalize, retry, recovery และ receipt
- พื้นผิว SDK Plugin ขนาดเล็กที่ Plugin ภายนอกเรียนรู้และดูแลรักษาได้
- ความเข้ากันได้สำหรับผู้เรียก `channel.turn` ที่มีอยู่ระหว่างการย้าย
- จุดขยายที่ชัดเจนสำหรับความสามารถใหม่ของช่องทาง
- ไม่มี branch เฉพาะแพลตฟอร์มใน core
- ไม่มีข้อความช่องทางแบบ token-delta การสตรีมของช่องทางยังคงเป็นการส่งมอบตัวอย่างข้อความ,
  การแก้ไข, การต่อท้าย หรือ block ที่เสร็จสมบูรณ์
- metadata ต้นทางจาก OpenClaw แบบมีโครงสร้างสำหรับเอาต์พุตด้านปฏิบัติการ/ระบบ เพื่อไม่ให้
  ความล้มเหลวของ Gateway ที่มองเห็นได้กลับเข้าไปในห้องร่วมที่เปิดใช้บอทเป็น prompt ใหม่

## สิ่งที่ไม่ใช่เป้าหมาย

- อย่าลบ `runtime.channel.turn.*` ในเฟสแรก
- อย่าบังคับทุกช่องทางให้ใช้พฤติกรรม transport แบบ native เดียวกัน
- อย่าสอน core เรื่องหัวข้อของ Telegram, สตรีม native ของ Slack, การ redaction ของ Matrix,
  การ์ด Feishu, เสียง QQ หรือ activity ของ Teams
- อย่าเผยแพร่ตัวช่วยการย้ายภายในทั้งหมดเป็น API SDK ที่เสถียร
- อย่าทำให้ retry replay การดำเนินการแพลตฟอร์มแบบ non-idempotent ที่เสร็จแล้ว

## โมเดลอ้างอิง

Vercel Chat มีโมเดลทางความคิดสาธารณะที่ดี:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- เมธอดของอะแดปเตอร์ เช่น `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` และการดึงประวัติ
- state adapter สำหรับ dedupe, lock, queue และ persistence

OpenClaw ควรยืมคำศัพท์ ไม่ใช่คัดลอกพื้นผิว

สิ่งที่ OpenClaw ต้องการนอกเหนือจากโมเดลนั้น:

- intent การส่งขาออกแบบทนทานก่อนเรียก transport โดยตรง
- บริบทการส่งที่ชัดเจนพร้อม begin, commit และ fail
- บริบทการรับที่รู้จักนโยบาย ack ของแพลตฟอร์ม
- receipt ที่อยู่รอดจากการ restart และขับเคลื่อนการแก้ไข, ลบ, recovery และ
  การระงับ duplicate ได้
- SDK สาธารณะที่เล็กลง Plugin ที่ bundled สามารถใช้ตัวช่วย runtime ภายในได้ แต่
  Plugin ภายนอกควรเห็น API ข้อความที่สอดคล้องกันหนึ่งชุด
- พฤติกรรมเฉพาะ agent: session, transcript, การสตรีม block, ความคืบหน้าของ tool,
  approval, media directive, การตอบกลับแบบเงียบ และประวัติการ mention ในกลุ่ม

promise แบบ `thread.post()` ยังไม่พอสำหรับ OpenClaw เพราะซ่อน
ขอบเขตธุรกรรมที่ตัดสินว่าการส่งสามารถ recover ได้หรือไม่

## โมเดลหลัก

โดเมนใหม่ควรอยู่ภายใต้ namespace ภายในของ core เช่น
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

`live` เป็นเจ้าของสถานะตัวอย่าง, การแก้ไข, ความคืบหน้า และสตรีม

`state` เป็นเจ้าของการจัดเก็บ intent แบบทนทาน, receipt, idempotency, recovery, lock และ
dedupe

## คำศัพท์เกี่ยวกับข้อความ

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

การตอบกลับคือความสัมพันธ์ ไม่ใช่ API root:

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

สิ่งนี้ทำให้เส้นทางส่งเดียวกันจัดการการตอบกลับปกติ, การแจ้งเตือน Cron, prompt ขอ approval,
การเสร็จสิ้น task, การส่งด้วย message-tool, การส่งจาก CLI หรือ Control UI, ผลลัพธ์จาก subagent
และการส่งจาก automation ได้

### ต้นทาง

ต้นทางอธิบายว่าใครสร้างข้อความและ OpenClaw ควรปฏิบัติต่อ echo ของ
ข้อความนั้นอย่างไร ต้นทางแยกจากความสัมพันธ์: ข้อความอาจเป็นการตอบกลับผู้ใช้
และยังเป็นเอาต์พุตปฏิบัติการที่มีต้นทางจาก OpenClaw ได้

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

Core เป็นเจ้าของความหมายของเอาต์พุตที่มีต้นทางจาก OpenClaw ช่องทางเป็นเจ้าของวิธี
เข้ารหัสต้นทางนั้นลงใน transport ของตน

การใช้งานครั้งแรกที่จำเป็นคือเอาต์พุตความล้มเหลวของ Gateway มนุษย์ยังควรเห็น
ข้อความเช่น "Agent failed before reply" หรือ "Missing API key" แต่เอาต์พุตปฏิบัติการ
ของ OpenClaw ที่ติดแท็กต้องไม่ถูกยอมรับเป็นอินพุตที่เขียนโดยบอทในห้องร่วม
เมื่อเปิดใช้ `allowBots`

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

Receipt เป็นสะพานจาก intent แบบทนทานไปสู่การแก้ไข, ลบ, finalize ตัวอย่าง,
การระงับ duplicate และ recovery ในอนาคต

Receipt สามารถอธิบายข้อความแพลตฟอร์มหนึ่งข้อความหรือการส่งมอบแบบหลายส่วนได้
ข้อความที่แบ่ง chunk, สื่อพร้อมข้อความ, เสียงพร้อมข้อความ และ fallback แบบการ์ดต้องเก็บ
id ของแพลตฟอร์มทั้งหมดไว้ ในขณะที่ยังเปิดเผย id หลักสำหรับ threading และการแก้ไขภายหลัง

## บริบทการรับ

การรับไม่ควรเป็นการเรียกตัวช่วยเปล่า ๆ core ต้องมีบริบทที่รู้จัก
dedupe, routing, การบันทึก session และนโยบาย ack ของแพลตฟอร์ม

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

ลำดับการรับ:

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

Ack ไม่ได้มีอย่างเดียว สัญญาการรับต้องแยกสัญญาณเหล่านี้ออกจากกัน:

- **Transport ack:** บอก webhook หรือ socket ของแพลตฟอร์มว่า OpenClaw รับ
  event envelope แล้ว บางแพลตฟอร์มต้องการสิ่งนี้ก่อน dispatch
- **Polling offset ack:** เลื่อน cursor เพื่อไม่ให้ fetch event เดิมซ้ำ
  สิ่งนี้ต้องไม่เลื่อนข้ามงานที่ recover ไม่ได้
- **Inbound record ack:** ยืนยันว่า OpenClaw persist metadata ขาเข้าเพียงพอสำหรับ
  dedupe และ route redelivery
- **User-visible receipt:** พฤติกรรม read/status/typing แบบเลือกใช้ได้; ไม่เป็น
  ขอบเขตด้านความทนทานเด็ดขาด

`ReceiveAckPolicy` ควบคุมเฉพาะ acknowledgement ของ transport หรือ polling เท่านั้น ต้อง
ไม่นำไปใช้ซ้ำกับ read receipt หรือ status reaction

ก่อน authorization ของบอท การรับต้องใช้นโยบาย echo ของ OpenClaw ร่วมกัน
เมื่อช่องทางสามารถถอดรหัส metadata ต้นทางของข้อความได้:

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

การ drop นี้อิงแท็ก ไม่ใช่อิงข้อความ ข้อความในห้องที่เขียนโดยบอทซึ่งมีข้อความความล้มเหลว
ของ Gateway ที่มองเห็นได้เหมือนกัน แต่ไม่มี metadata ต้นทางของ OpenClaw ยังคงผ่าน
authorization `allowBots` ตามปกติ

นโยบาย ack ระบุชัดเจน:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

ตอนนี้ Telegram polling ใช้นโยบาย ack ของ receive-context สำหรับ persisted
restart watermark ตัว tracker ยังสังเกต update ของ grammY เมื่อเข้าสู่
middleware chain แต่ OpenClaw จะ persist เฉพาะ safe completed update id หลัง
dispatch สำเร็จ โดยปล่อยให้ update ที่ล้มเหลวหรือ pending ที่ต่ำกว่า replay ได้หลัง restart
offset fetch `getUpdates` upstream ของ Telegram ยังถูกควบคุมโดย
ไลบรารี polling ดังนั้นการปรับลึกส่วนที่เหลือคือ polling source ที่ทนทานเต็มรูปแบบ
หากเราต้องการ redelivery ระดับแพลตฟอร์มนอกเหนือจาก restart watermark ของ OpenClaw
แพลตฟอร์ม Webhook อาจต้อง ack HTTP ทันที แต่ยังต้องมี inbound dedupe และ
intent การส่งขาออกแบบทนทาน เพราะ webhook สามารถ redeliver ได้

## บริบทการส่ง

การส่งก็อิงบริบทเช่นกัน:

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

การจัดลำดับการทำงานที่แนะนำ:

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

Intent ต้องมีอยู่ก่อน transport I/O การรีสตาร์ตหลัง begin แต่ก่อน
commit สามารถกู้คืนได้

ขอบเขตที่อันตรายคือหลังแพลตฟอร์มสำเร็จและก่อน commit ใบรับ หาก
โปรเซสตายตรงนั้น OpenClaw จะไม่สามารถรู้ได้ว่าข้อความของแพลตฟอร์มมีอยู่หรือไม่
เว้นแต่อะแดปเตอร์จะมี idempotency แบบเนทีฟหรือเส้นทางกระทบยอดใบรับ
ความพยายามเหล่านั้นต้องดำเนินต่อใน `unknown_after_send` ไม่ใช่เล่นซ้ำแบบไม่ตรวจสอบ Channel
ที่ไม่มีการกระทบยอดอาจเลือกการเล่นซ้ำแบบ at-least-once ได้เฉพาะเมื่อข้อความที่ซ้ำและมองเห็นได้
เป็น tradeoff ที่ยอมรับได้และมีเอกสารสำหรับ Channel และความสัมพันธ์นั้น
สะพานการกระทบยอด SDK ปัจจุบันกำหนดให้อะแดปเตอร์ประกาศ
`reconcileUnknownSend` จากนั้นขอให้ `durableFinal.reconcileUnknownSend`
จัดประเภทเอนทรีที่ไม่รู้เป็น `sent`, `not_sent` หรือ `unresolved`; เฉพาะ `not_sent`
เท่านั้นที่อนุญาตให้เล่นซ้ำ และเอนทรีที่ยังไม่คลี่คลายจะยังเป็นสถานะปลายทางหรือ retry เฉพาะ
การตรวจสอบการกระทบยอด

ต้องระบุนโยบายความทนทานอย่างชัดเจน:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` หมายความว่า core ต้อง fail closed เมื่อไม่สามารถเขียน durable intent ได้
`best_effort` สามารถปล่อยผ่านได้เมื่อ persistence ไม่พร้อมใช้งาน `disabled` คง
พฤติกรรมส่งโดยตรงแบบเดิมไว้ ระหว่างการย้าย wrapper แบบ legacy และตัวช่วยความเข้ากันได้สาธารณะ
มีค่าเริ่มต้นเป็น `disabled`; สิ่งเหล่านี้ต้องไม่อนุมาน `required` จาก
ข้อเท็จจริงที่ว่า Channel มีอะแดปเตอร์ outbound ทั่วไป

Send context ยังเป็นเจ้าของผลกระทบหลังส่งภายใน Channel ด้วย การย้ายไม่ปลอดภัย
หาก durable delivery ข้ามพฤติกรรมภายในที่ก่อนหน้านี้ผูกอยู่กับเส้นทางส่งโดยตรงของ
Channel ตัวอย่างรวมถึงแคชระงับ self-echo,
ตัวทำเครื่องหมายการเข้าร่วมเธรด, จุดยึดการแก้ไขแบบเนทีฟ, การเรนเดอร์ลายเซ็นโมเดล,
และตัวป้องกันการซ้ำเฉพาะแพลตฟอร์ม ผลกระทบเหล่านั้นต้องย้ายเข้าไปใน
อะแดปเตอร์ส่ง, อะแดปเตอร์เรนเดอร์, หรือ hook send-context ที่มีชื่อ ก่อนที่
Channel นั้นจะเปิดใช้ durable generic final delivery ได้

ตัวช่วยส่งต้องคืนใบรับกลับไปถึงผู้เรียกของมัน Durable
wrapper ไม่สามารถกลืน message id หรือแทนที่ผลลัพธ์การส่งของ Channel ด้วย
`undefined`; buffered dispatcher ใช้ id เหล่านั้นสำหรับจุดยึดเธรด, การแก้ไขภายหลัง,
การ finalize preview และการระงับการซ้ำ

Fallback send ทำงานกับ batch ไม่ใช่ payload เดี่ยว การเขียน silent-reply ใหม่,
media fallback, card fallback และการฉาย chunk ทั้งหมดสามารถสร้างข้อความที่ส่งได้
มากกว่าหนึ่งรายการ ดังนั้น send context ต้องส่ง batch ที่ฉายทั้งหมด
หรือระบุในเอกสารอย่างชัดเจนว่าเหตุใด payload เดียวจึงถูกต้อง

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

เมื่อ fallback ดังกล่าวเป็น durable ต้องแทน batch ที่ฉายทั้งหมดด้วย
durable send intent หนึ่งรายการหรือแผน batch แบบอะตอมิกอื่น การบันทึกแต่ละ payload
ทีละรายการไม่เพียงพอ: การ crash ระหว่าง payload อาจทิ้ง fallback ที่มองเห็นได้บางส่วน
โดยไม่มีบันทึก durable สำหรับ payload ที่เหลือ การกู้คืนต้องรู้ว่า
unit ใดมีใบรับแล้ว และเล่นซ้ำเฉพาะ unit ที่หายไป หรือทำเครื่องหมาย
batch เป็น `unknown_after_send` จนกว่าอะแดปเตอร์จะกระทบยอดได้

## บริบทสด

พฤติกรรม preview, edit, progress และ stream ควรเป็น lifecycle แบบ opt-in หนึ่งชุด

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

สถานะ live ทนทานพอที่จะกู้คืนหรือระงับรายการซ้ำ:

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

- Telegram ส่งพร้อมแก้ไข preview โดยมี final ใหม่หลังอายุ preview ค้าง
- Discord ส่งพร้อมแก้ไข preview ยกเลิกเมื่อมี media/error/explicit reply
- Slack native stream หรือ draft preview ขึ้นอยู่กับรูปแบบเธรด
- การ finalize โพสต์ draft ของ Mattermost
- การ finalize เหตุการณ์ draft ของ Matrix หรือการ redaction เมื่อไม่ตรงกัน
- Teams native progress stream
- QQ Bot stream หรือ fallback แบบสะสม

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

อะแดปเตอร์ส่ง:

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

อะแดปเตอร์รับ:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

ก่อนการอนุญาต preflight core ต้องเรียกใช้ predicate echo ที่ใช้ร่วมกันของ OpenClaw
เมื่อใดก็ตามที่ `origin.decode` คืน metadata ต้นทาง OpenClaw อะแดปเตอร์รับ
จัดเตรียมข้อเท็จจริงของแพลตฟอร์ม เช่น ผู้เขียน bot และรูปทรงห้อง; core เป็นเจ้าของการตัดสินใจ drop
และการจัดลำดับ เพื่อไม่ให้ Channel ต้องนำตัวกรองข้อความไปทำซ้ำ

อะแดปเตอร์ต้นทาง:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core ตั้งค่า `MessageOrigin` Channel แปลค่าไปและกลับจาก
metadata ของ transport แบบเนทีฟเท่านั้น Slack map สิ่งนี้ไปยัง `chat.postMessage({ metadata })` และ
`message.metadata` ขาเข้า; Matrix สามารถ map ไปยังเนื้อหาเหตุการณ์เพิ่มเติม; Channel
ที่ไม่มี metadata แบบเนทีฟสามารถใช้ registry ของ receipt/outbound เมื่อสิ่งนั้นเป็น
การประมาณที่ดีที่สุดที่มี

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

Subpath ความเข้ากันได้ยังคงอยู่เป็น wrapper ได้ แต่ Plugin บุคคลที่สามใหม่
ไม่ควรต้องใช้สิ่งเหล่านั้น

Plugin ที่บันเดิลมาอาจคงการ import ตัวช่วยภายในผ่าน subpath runtime
ที่สงวนไว้ระหว่างย้าย เอกสารสาธารณะควรนำผู้เขียน Plugin ไปยัง
`plugin-sdk/channel-message` เมื่อมีอยู่แล้ว

## ความสัมพันธ์กับ channel turn

`runtime.channel.turn.*` ควรคงอยู่ระหว่างการย้าย

มันควรกลายเป็นอะแดปเตอร์ความเข้ากันได้:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` ก็ควรคงอยู่ในช่วงแรกด้วย:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

หลังจาก Plugin ที่บันเดิลมาทั้งหมดและเส้นทางความเข้ากันได้ของบุคคลที่สามที่รู้จักทั้งหมดถูกเชื่อมแล้ว
`channel.turn` สามารถถูกเลิกใช้ได้ ไม่ควรถูกนำออกจนกว่าจะมี
เส้นทางย้าย SDK ที่เผยแพร่แล้วและ contract test ที่พิสูจน์ว่า Plugin เก่ายังคงทำงานได้
หรือล้มเหลวด้วยข้อผิดพลาดเวอร์ชันที่ชัดเจน

## Guardrail ความเข้ากันได้

ระหว่างการย้าย generic durable delivery เป็นแบบ opt-in สำหรับ Channel ใดก็ตามที่
callback การส่งปัจจุบันมีผลข้างเคียงนอกเหนือจาก "ส่ง payload นี้"

Entry point แบบ legacy ไม่เป็น durable ตามค่าเริ่มต้น:

- `channel.turn.run` และ `dispatchAssembledChannelTurn` ใช้ callback การส่งของ Channel
  เว้นแต่ Channel นั้นจะจัดเตรียมอ็อบเจ็กต์นโยบาย/ตัวเลือก durable ที่ตรวจสอบแล้วอย่างชัดเจน
- `channel.turn.runPrepared` ยังเป็นของ Channel จนกว่า dispatcher ที่เตรียมไว้
  จะเรียก send context อย่างชัดเจน
- ตัวช่วยความเข้ากันได้สาธารณะ เช่น `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` และตัวช่วย direct-DM ไม่เคยฉีด generic
  durable delivery ก่อน callback `deliver` หรือ `reply` ที่ผู้เรียกจัดเตรียม

สำหรับชนิดสะพานการย้าย `durable: undefined` หมายถึง "ไม่ durable"
เส้นทาง durable เปิดใช้ได้เฉพาะด้วยค่านโยบาย/ตัวเลือกที่ชัดเจนเท่านั้น `durable:
false` ยังคงเป็นการสะกดเพื่อความเข้ากันได้ได้ แต่การใช้งานไม่ควร
กำหนดให้ Channel ที่ยังไม่ได้ย้ายทุกตัวต้องเพิ่มค่านี้

โค้ดสะพานปัจจุบันต้องคงการตัดสินใจเรื่องความทนทานไว้อย่างชัดเจน:

- การส่งผลลัพธ์สุดท้ายแบบทนทานคืนสถานะที่จำแนกชนิดได้ `handled_visible` และ
  `handled_no_send` เป็นสถานะสิ้นสุด; `unsupported` และ `not_applicable` อาจถอยกลับ
  ไปใช้การส่งที่ช่องทางเป็นเจ้าของ; `failed` ส่งต่อความล้มเหลวในการส่ง
- การส่งผลลัพธ์สุดท้ายแบบทนทานทั่วไปถูกควบคุมด้วยความสามารถของอะแดปเตอร์ เช่น
  การส่งแบบเงียบ การคงเป้าหมายการตอบกลับ การคงคำพูดอ้างอิงแบบเนทีฟ และ
  hook สำหรับส่งข้อความ หากยังไม่มีความเท่าเทียมกัน ควรเลือกการส่งที่ช่องทางเป็นเจ้าของ
  ไม่ใช่การส่งทั่วไปที่เปลี่ยนพฤติกรรมที่ผู้ใช้มองเห็น
- การส่งแบบทนทานที่มีคิวรองรับเปิดเผยอ้างอิง intent การส่ง ฟิลด์เซสชัน
  `pendingFinalDelivery*` ที่มีอยู่สามารถพก ID ของ intent ระหว่างช่วงเปลี่ยนผ่านได้
  สถานะสุดท้ายคือ store ของ `MessageSendIntent` แทนข้อความตอบกลับที่ถูกตรึงไว้
  บวกกับฟิลด์บริบทเฉพาะกิจ

อย่าเปิดใช้เส้นทางแบบทนทานทั่วไปสำหรับช่องทางจนกว่าทั้งหมดนี้จะเป็นจริง:

- อะแดปเตอร์การส่งทั่วไปทำงานด้วยพฤติกรรมการเรนเดอร์และการขนส่งเดียวกับ
  เส้นทางตรงแบบเก่า
- ผลข้างเคียงภายในเครื่องหลังส่งถูกรักษาไว้ผ่านบริบทการส่ง
- อะแดปเตอร์คืนใบรับหรือผลลัพธ์การส่งที่มี ID ข้อความของแพลตฟอร์มทั้งหมด
- เส้นทาง dispatcher ที่เตรียมไว้ต้องเรียกบริบทการส่งใหม่ หรือยังคงถูกบันทึกไว้ในเอกสาร
  ว่าอยู่นอกการรับประกันแบบทนทาน
- การส่งแบบถอยกลับรองรับ payload ที่ฉายออกมาทุกตัว ไม่ใช่แค่ตัวแรก
- การส่งแบบถอยกลับที่ทนทานบันทึกอาร์เรย์ payload ที่ฉายออกมาทั้งหมดเป็น intent
  หรือแผน batch หนึ่งชุดที่เล่นซ้ำได้

อันตรายในการย้ายระบบที่ต้องรักษาไว้:

- การส่งของตัวตรวจสอบ iMessage บันทึกข้อความที่ส่งแล้วไว้ใน echo cache หลังจาก
  ส่งสำเร็จ การส่งผลลัพธ์สุดท้ายแบบทนทานต้องยังเติมข้อมูล cache นั้น มิฉะนั้น
  OpenClaw อาจนำเข้าการตอบกลับสุดท้ายของตัวเองกลับมาเป็นข้อความขาเข้าจากผู้ใช้
- Tlon ต่อท้ายลายเซ็นโมเดลแบบไม่บังคับและบันทึกเธรดที่เข้าร่วมหลังจากตอบกลับกลุ่ม
  การส่งแบบทนทานทั่วไปต้องไม่ข้ามผลเหล่านั้น; ให้ย้ายผลเหล่านั้นเข้าไปในอะแดปเตอร์
  เรนเดอร์/ส่ง/จบขั้นตอนของ Tlon หรือคง Tlon ไว้บนเส้นทางที่ช่องทางเป็นเจ้าของ
- Discord และ dispatcher ที่เตรียมไว้อื่น ๆ เป็นเจ้าของพฤติกรรมการส่งตรงและตัวอย่างแสดงผลอยู่แล้ว
  สิ่งเหล่านี้ไม่อยู่ภายใต้การรับประกันแบบทนทานของ turn ที่ประกอบแล้ว จนกว่า
  dispatcher ที่เตรียมไว้จะกำหนดเส้นทางผลลัพธ์สุดท้ายผ่านบริบทการส่งอย่างชัดเจน
- การส่งแบบถอยกลับแบบเงียบของ Telegram ต้องส่งอาร์เรย์ payload ที่ฉายออกมาทั้งหมด
  ทางลัดแบบ payload เดียวอาจทำให้ payload ถอยกลับเพิ่มเติมหลังการฉายถูกทิ้ง
- LINE, Zalo, Nostr และเส้นทางประกอบ/ตัวช่วยอื่น ๆ ที่มีอยู่ อาจมี
  การจัดการโทเค็นตอบกลับ การพร็อกซีสื่อ cache ข้อความที่ส่งแล้ว การล้างสถานะกำลังโหลด/สถานะ
  หรือเป้าหมายแบบ callback เท่านั้น สิ่งเหล่านี้ยังอยู่บนการส่งที่ช่องทางเป็นเจ้าของจนกว่า
  semantics เหล่านั้นจะแสดงผ่านอะแดปเตอร์การส่งและได้รับการยืนยันด้วยการทดสอบ
- ตัวช่วย DM โดยตรงอาจมี callback การตอบกลับที่เป็นเป้าหมายการขนส่งที่ถูกต้องเพียงอย่างเดียว
  การส่งออกทั่วไปต้องไม่เดาจาก `OriginatingTo` หรือ `To` แล้วข้าม callback นั้น
- เอาต์พุตความล้มเหลวของ OpenClaw Gateway ต้องยังมองเห็นได้สำหรับมนุษย์ แต่ echo ในห้อง
  ที่ติดแท็กว่าเขียนโดยบอตต้องถูกทิ้งก่อนการอนุญาต `allowBots`
  ช่องทางต้องไม่ทำสิ่งนี้ด้วยตัวกรองคำนำหน้าข้อความที่มองเห็นได้ ยกเว้นเป็นมาตรการหยุดฉุกเฉิน
  ระยะสั้น; สัญญาแบบทนทานคือ metadata ต้นทางแบบมีโครงสร้าง

## ที่จัดเก็บภายใน

คิวแบบทนทานควรเก็บ intent การส่งข้อความ ไม่ใช่ payload การตอบกลับ

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

คิวควรเก็บ identity เพียงพอสำหรับเล่นซ้ำผ่านบัญชีเดียวกัน
เธรด เป้าหมาย นโยบายการจัดรูปแบบ และกฎสื่อหลังจากรีสตาร์ท

## คลาสความล้มเหลว

อะแดปเตอร์ช่องทางจัดประเภทความล้มเหลวของการขนส่งเป็นหมวดหมู่ปิด:

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
- อย่าลองใหม่สำหรับ `invalid_payload` เว้นแต่ว่ามีการเรนเดอร์แบบถอยกลับ
- อย่าลองใหม่สำหรับ `auth` หรือ `permission` จนกว่าการกำหนดค่าจะเปลี่ยน
- สำหรับ `not_found` ให้การจบขั้นตอนแบบสดถอยกลับจากการแก้ไขไปเป็นการส่งใหม่เมื่อ
  ช่องทางประกาศว่าปลอดภัย
- สำหรับ `conflict` ให้ใช้กฎใบรับ/ความเป็น idempotent เพื่อตัดสินว่าข้อความ
  มีอยู่แล้วหรือไม่
- ข้อผิดพลาดใด ๆ หลังจากอะแดปเตอร์อาจทำ I/O ของแพลตฟอร์มเสร็จแล้วแต่ก่อน commit ใบรับ
  จะกลายเป็น `unknown_after_send` เว้นแต่ว่าอะแดปเตอร์พิสูจน์ได้ว่าการดำเนินการบนแพลตฟอร์ม
  ไม่ได้เกิดขึ้น

## การแมปช่องทาง

| ช่องทาง         | เป้าหมายการย้ายระบบ                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | รับนโยบาย ack พร้อมการส่งผลลัพธ์สุดท้ายแบบคงทน Adapter แบบสดเป็นเจ้าของการส่งพร้อมการแก้ไขพรีวิว, การส่งผลลัพธ์สุดท้ายของพรีวิวที่ค้าง, หัวข้อ, การข้ามพรีวิว quote-reply, การสำรองสำหรับสื่อ และการจัดการ retry-after                                                                                                                                                                   |
| Discord         | Adapter การส่งห่อหุ้มการส่ง payload แบบคงทนที่มีอยู่ Adapter แบบสดเป็นเจ้าของการแก้ไขฉบับร่าง, ฉบับร่างความคืบหน้า, การยกเลิกพรีวิวสื่อ/ข้อผิดพลาด, การคงเป้าหมายการตอบกลับ และใบรับรหัสข้อความ ตรวจสอบ echo ความล้มเหลวของ Gateway ที่บอตเขียนในห้องที่ใช้ร่วมกัน ใช้ registry ขาออกหรือสิ่งเทียบเท่าแบบ native อื่น หาก Discord ไม่สามารถพกเมทาดาทาต้นทางบนข้อความปกติได้ |
| Slack           | Adapter การส่งจัดการโพสต์แชตปกติ Adapter แบบสดเลือกสตรีม native เมื่อรูปร่างของ thread รองรับ มิฉะนั้นใช้พรีวิวฉบับร่าง ใบรับคง timestamp ของ thread Adapter ต้นทางแมปความล้มเหลวของ Gateway ของ OpenClaw ไปยัง Slack `chat.postMessage.metadata` และทิ้ง echo ของห้องบอตที่ติดแท็กก่อนการอนุญาต `allowBots`                                  |
| WhatsApp        | Adapter การส่งเป็นเจ้าของการส่งข้อความ/สื่อด้วย intent สุดท้ายแบบคงทน Adapter การรับจัดการการกล่าวถึงในกลุ่มและตัวตนผู้ส่ง Live สามารถยังไม่มีได้จนกว่า WhatsApp จะมี transport ที่แก้ไขได้                                                                                                                                                                        |
| Matrix          | Adapter แบบสดเป็นเจ้าของการแก้ไขเหตุการณ์ฉบับร่าง, การทำให้เป็นผลลัพธ์สุดท้าย, การ redaction, ข้อจำกัดของสื่อที่เข้ารหัส และการสำรองเมื่อเป้าหมายการตอบกลับไม่ตรงกัน Adapter การรับเป็นเจ้าของการเติมข้อมูลเหตุการณ์ที่เข้ารหัสและการ dedupe Adapter ต้นทางควรเข้ารหัสต้นทางความล้มเหลวของ Gateway ของ OpenClaw ลงในเนื้อหาเหตุการณ์ Matrix และทิ้ง echo ของห้องบอตที่กำหนดค่าก่อนการจัดการ `allowBots`              |
| Mattermost      | Adapter แบบสดเป็นเจ้าของโพสต์ฉบับร่างหนึ่งรายการ, การพับความคืบหน้า/เครื่องมือ, การทำให้เป็นผลลัพธ์สุดท้ายในที่เดิม และการสำรองด้วยการส่งใหม่                                                                                                                                                                                                                                                       |
| Microsoft Teams | Adapter แบบสดเป็นเจ้าของความคืบหน้า native และพฤติกรรม block stream Adapter การส่งเป็นเจ้าของกิจกรรมและใบรับสิ่งที่แนบ/การ์ด                                                                                                                                                                                                                                        |
| Feishu          | Adapter การเรนเดอร์เป็นเจ้าของการเรนเดอร์ข้อความ/การ์ด/raw Adapter แบบสดเป็นเจ้าของการ์ดแบบสตรีมและการระงับผลลัพธ์สุดท้ายที่ซ้ำ Adapter การส่งเป็นเจ้าของความคิดเห็น, เซสชันหัวข้อ, สื่อ และการระงับเสียง                                                                                                                                                                      |
| QQ Bot          | Adapter แบบสดเป็นเจ้าของการสตรีม C2C, timeout ของ accumulator และการส่งผลลัพธ์สุดท้ายสำรอง Adapter การเรนเดอร์เป็นเจ้าของแท็กสื่อและข้อความเป็นเสียง                                                                                                                                                                                                                               |
| Signal          | Adapter การรับและการส่งแบบง่าย ไม่มี adapter แบบสด เว้นแต่ signal-cli จะเพิ่มการรองรับการแก้ไขที่เชื่อถือได้                                                                                                                                                                                                                                                                |
| iMessage        | Adapter การรับและการส่งแบบง่าย การส่ง iMessage ต้องคงการเติม echo-cache ของ monitor ก่อนที่ผลลัพธ์สุดท้ายแบบคงทนจะข้ามการส่งผ่าน monitor ได้                                                                                                                                                                                                                 |
| Google Chat     | Adapter การรับและการส่งแบบง่าย โดยแมปความสัมพันธ์ของ thread ไปยัง spaces และรหัส thread ตรวจสอบพฤติกรรมห้อง `allowBots=true` สำหรับ echo ความล้มเหลวของ Gateway ของ OpenClaw ที่ติดแท็ก                                                                                                                                                                                        |
| LINE            | Adapter การรับและการส่งแบบง่าย พร้อมข้อจำกัดของ reply-token ที่โมเดลเป็นความสามารถ target/relation                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | บริดจ์การรับของ SDK พร้อม adapter การส่ง                                                                                                                                                                                                                                                                                                                          |
| IRC             | Adapter การรับและการส่งแบบง่าย ไม่มีใบรับการแก้ไขแบบคงทน                                                                                                                                                                                                                                                                                                    |
| Nostr           | Adapter การรับและการส่งสำหรับ DM ที่เข้ารหัส ใบรับคือรหัสเหตุการณ์                                                                                                                                                                                                                                                                                           |
| QA Channel      | Adapter ทดสอบสัญญาสำหรับพฤติกรรมการรับ, การส่ง, live, การลองซ้ำ และการกู้คืน                                                                                                                                                                                                                                                                                   |
| Synology Chat   | Adapter การรับและการส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |
| Tlon            | Adapter การส่งต้องคงการเรนเดอร์ model-signature และการติดตาม participated-thread ก่อนเปิดใช้การส่งผลลัพธ์สุดท้ายแบบคงทนทั่วไป                                                                                                                                                                                                                        |
| Twitch          | Adapter การรับและการส่งแบบง่ายพร้อมการจัดประเภท rate-limit                                                                                                                                                                                                                                                                                               |
| Zalo            | Adapter การรับและการส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Adapter การรับและการส่งแบบง่าย                                                                                                                                                                                                                                                                                                                              |

## แผนการย้ายระบบ

### ระยะที่ 1: โดเมนข้อความภายใน

- เพิ่มชนิด `src/channels/message/*` สำหรับข้อความ, เป้าหมาย, ความสัมพันธ์,
  ต้นทาง, ใบรับ, ความสามารถ, intent แบบคงทน, บริบทการรับ, บริบทการส่ง,
  บริบท live และคลาสความล้มเหลว
- เพิ่ม `origin?: MessageOrigin` ไปยังชนิด payload ของบริดจ์การย้ายระบบที่ใช้โดย
  การส่งการตอบกลับปัจจุบัน จากนั้นย้ายฟิลด์นั้นไปยัง `ChannelMessage` และชนิดข้อความ
  ที่เรนเดอร์แล้วเมื่อการปรับโครงสร้างแทนที่ reply payload
- คงส่วนนี้เป็นภายในจนกว่า adapter และการทดสอบจะพิสูจน์รูปร่างได้
- เพิ่ม unit test ล้วนสำหรับการเปลี่ยนสถานะและ serialization

### ระยะที่ 2: แกนการส่งแบบคงทน

- ย้ายคิวขาออกที่มีอยู่จากความคงทนของ reply-payload ไปเป็น intent การส่งข้อความ
  แบบคงทน
- ให้ intent การส่งแบบคงทนพก array payload ที่ฉายแล้วหรือแผน batch ไม่ใช่
  reply payload เดียวเท่านั้น
- คงพฤติกรรมการกู้คืนคิวปัจจุบันผ่านการแปลงเพื่อความเข้ากันได้
- ทำให้ `deliverOutboundPayloads` เรียก `messages.send`
- ทำให้ความคงทนของ final-send เป็นค่าเริ่มต้นและ fail closed เมื่อเขียน intent แบบคงทน
  ใน lifecycle ข้อความใหม่ไม่ได้ หลังจาก adapter ประกาศความปลอดภัยในการ replay แล้ว
  เส้นทางความเข้ากันได้ของ channel-turn และ SDK ที่มีอยู่ยังคงเป็น direct-send โดยค่าเริ่มต้น
  ระหว่างระยะนี้
- บันทึกใบรับอย่างสม่ำเสมอ
- ส่งคืนใบรับและผลลัพธ์การส่งไปยังผู้เรียก dispatcher เดิม แทนที่จะถือว่าการส่งแบบคงทน
  เป็น side effect ปลายทาง
- คงต้นทางข้อความผ่าน intent การส่งแบบคงทน เพื่อให้การกู้คืน, replay และการส่งแบบแบ่งชิ้น
  คง provenance เชิงปฏิบัติการของ OpenClaw

### ระยะที่ 3: บริดจ์ Channel Turn

- ติดตั้ง `channel.turn.run` และ `dispatchAssembledChannelTurn` ใหม่บนฐานของ
  `messages.receive` และ `messages.send`
- คงชนิด fact ปัจจุบันให้เสถียร
- คงพฤติกรรม legacy เป็นค่าเริ่มต้น ช่องทาง assembled-turn จะกลายเป็นแบบคงทนก็ต่อเมื่อ
  adapter ของช่องทางนั้น opt in อย่างชัดเจนด้วยนโยบายความคงทนที่ปลอดภัยต่อการ replay
- คง `durable: false` เป็นทางหนีเพื่อความเข้ากันได้สำหรับเส้นทางที่ทำ native edit ให้จบ
  และยัง replay ได้ไม่ปลอดภัย แต่ไม่พึ่งพา marker `false` เพื่อปกป้องช่องทางที่ยังไม่ได้ย้ายระบบ
- ตั้งค่าความคงทนของ assembled-turn เป็นค่าเริ่มต้นเฉพาะใน lifecycle ข้อความใหม่ หลังจาก
  การแมปช่องทางพิสูจน์ว่าเส้นทางการส่งทั่วไปคง semantics การส่งของช่องทางเดิมไว้

### ระยะที่ 4: บริดจ์ Prepared Dispatcher

- แทนที่ `deliverDurableInboundReplyPayload` ด้วยบริดจ์ send-context
- เก็บตัวช่วยเดิมไว้เป็น wrapper
- ย้าย Telegram, WhatsApp, Slack, Signal, iMessage และ Discord ก่อน เพราะ
  มีงาน durable-final อยู่แล้วหรือมีเส้นทางส่งที่ง่ายกว่า
- ถือว่า prepared dispatcher ทุกตัวไม่มีการครอบคลุม จนกว่าจะเลือกใช้
  send context อย่างชัดเจน เอกสารและรายการ changelog ต้องระบุว่า "assembled
  channel turns" หรือระบุชื่อเส้นทาง channel ที่ย้ายแล้ว แทนการอ้างถึง final replies
  อัตโนมัติทั้งหมด
- รักษาพฤติกรรมของ `recordInboundSessionAndDispatchReply`, ตัวช่วย direct-DM และตัวช่วย
  ความเข้ากันได้สาธารณะที่คล้ายกันให้เหมือนเดิม ตัวช่วยเหล่านี้อาจเปิดเผยการเลือกใช้
  send-context อย่างชัดเจนในภายหลัง แต่ต้องไม่พยายามส่งแบบ durable ทั่วไปโดยอัตโนมัติ
  ก่อน delivery callback ที่ caller เป็นเจ้าของ

### ระยะที่ 5: วงจรชีวิต Live แบบรวมศูนย์

- สร้าง `messages.live` พร้อม proof adapter สองตัว:
  - Telegram สำหรับส่ง แก้ไข และส่ง final ที่ stale
  - Matrix สำหรับ draft finalization และ redaction fallback
- จากนั้นย้าย Discord, Slack, Mattermost, Teams, QQ Bot และ Feishu
- ลบโค้ด preview finalization ที่ซ้ำกันหลังจากแต่ละ channel มี
  parity tests แล้วเท่านั้น

### ระยะที่ 6: SDK สาธารณะ

- เพิ่ม `openclaw/plugin-sdk/channel-message`
- บันทึกในเอกสารว่าเป็น API ของ channel Plugin ที่แนะนำ
- อัปเดต package exports, entrypoint inventory, generated API baselines และ
  เอกสาร Plugin SDK
- รวม `MessageOrigin`, origin encode/decode hooks และ shared
  `shouldDropOpenClawEcho` predicate ในพื้นผิว channel-message SDK
- เก็บ compatibility wrappers สำหรับ subpaths เก่า
- ทำเครื่องหมายตัวช่วย SDK ที่มีชื่อแบบ reply ว่าเลิกแนะนำในเอกสารหลังจาก Plugin ที่รวมมา
  ถูกย้ายแล้ว

### ระยะที่ 7: ตัวส่งทั้งหมด

ย้ายผู้ผลิต outbound ที่ไม่ใช่ reply ทั้งหมดไปยัง `messages.send`:

- การแจ้งเตือน Cron และ Heartbeat
- การทำงานของ task เสร็จสิ้น
- ผลลัพธ์ของ hook
- approval prompts และ approval results
- การส่งจาก message tool
- ประกาศการทำงานของ subagent เสร็จสิ้น
- การส่งผ่าน CLI หรือ Control UI แบบชัดเจน
- เส้นทาง automation/broadcast

นี่คือจุดที่โมเดลหยุดเป็น "agent replies" และกลายเป็น "OpenClaw sends
messages"

### ระยะที่ 8: เลิกใช้ Turn

- เก็บ `channel.turn` ไว้เป็น wrapper อย่างน้อยหนึ่งช่วงเวลาความเข้ากันได้
- เผยแพร่บันทึกการย้าย
- รันการทดสอบความเข้ากันได้ของ Plugin SDK กับ import เก่า
- ลบหรือซ่อนตัวช่วยภายในเก่าหลังจากไม่มี Plugin ที่รวมมาต้องใช้แล้วเท่านั้น
  และสัญญาของบุคคลที่สามมีตัวแทนที่เสถียร

## แผนการทดสอบ

Unit tests:

- การ serialization และ recovery ของ durable send intent
- การใช้ idempotency key ซ้ำและการระงับรายการซ้ำ
- การ commit receipt และการข้าม replay
- recovery ของ `unknown_after_send` ที่ reconcile ก่อน replay เมื่อ adapter
  รองรับการ reconciliation
- นโยบายการจัดประเภท failure
- ลำดับนโยบาย receive ack
- การแมป relation สำหรับการส่ง reply, followup, system และ broadcast
- origin factory สำหรับ Gateway failure และ `shouldDropOpenClawEcho` predicate
- การรักษา origin ผ่าน payload normalization, chunking, durable queue
  serialization และ recovery

Integration tests:

- adapter อย่างง่ายของ `channel.turn.run` ยังบันทึกและส่ง
- การส่ง legacy assembled-turn ไม่กลายเป็น durable เว้นแต่ channel
  จะเลือกใช้อย่างชัดเจน
- บริดจ์ `channel.turn.runPrepared` ยังบันทึกและ finalize
- ตัวช่วยความเข้ากันได้สาธารณะเรียก delivery callbacks ที่ caller เป็นเจ้าของโดยค่าเริ่มต้น
  และไม่ generic-send ก่อน callback เหล่านั้น
- การส่ง durable fallback replay อาร์เรย์ projected payload ทั้งหมดหลัง
  restart และไม่สามารถปล่อยให้ payload ภายหลังไม่ถูกบันทึกหลัง crash ช่วงต้น
- การส่ง durable assembled-turn ส่งคืน platform message ids ไปยัง buffered
  dispatcher
- custom delivery hooks ยังคงส่งคืน platform message ids เมื่อ durable delivery
  ปิดอยู่หรือใช้งานไม่ได้
- final reply รอดจาก restart ระหว่าง assistant completion และ platform send
- preview draft finalize ในที่เดิมเมื่ออนุญาต
- preview draft ถูกยกเลิกหรือ redact เมื่อ media/error/reply-target mismatch
  ต้องใช้การส่งปกติ
- block streaming และ preview streaming ไม่ส่งข้อความเดียวกันทั้งคู่
- media ที่ streamed เร็วไม่ถูกทำซ้ำในการส่ง final

Channel tests:

- Telegram topic reply ที่ใช้ polling ack ล่าช้าจนถึง safe
  completed watermark ของ receive context
- Telegram polling recovery สำหรับ updates ที่ accepted-but-not-delivered ครอบคลุมด้วย
  persisted safe-completed offset model
- Telegram stale preview ส่ง final ใหม่และล้าง preview
- Telegram silent fallback ส่ง projected fallback payload ทุกตัว
- Telegram silent fallback durability บันทึกอาร์เรย์ projected fallback ทั้งหมด
  แบบ atomic ไม่ใช่ durable intent แบบ single-payload หนึ่งรายการต่อ loop iteration
- Discord preview cancel เมื่อมี media/error/explicit reply
- finals ของ Discord prepared dispatcher route ผ่าน send context ก่อนที่เอกสาร
  หรือ changelog จะอ้างถึงความ durable ของ Discord final-reply
- iMessage durable final sends เติม monitor sent-message echo cache
- เส้นทาง legacy delivery ของ LINE, Zalo และ Nostr ไม่ถูก bypass โดย
  generic durable send จนกว่าจะมี adapter parity tests
- การส่ง Direct-DM/Nostr callback ยังคงเป็น authoritative เว้นแต่จะย้ายอย่างชัดเจน
  ไปยัง message target ที่ครบถ้วนและ send adapter ที่ replay-safe
- ข้อความ Gateway failure ของ Slack ที่ติดแท็ก OpenClaw ยังคงมองเห็นได้แบบ outbound,
  bot-room echoes ที่ติดแท็ก drop ก่อน `allowBots` และข้อความ bot ที่ไม่ติดแท็กซึ่งมี
  ข้อความที่มองเห็นเหมือนกันยังคงทำตาม bot authorization ปกติ
- Slack native stream fallback ไปยัง draft preview ใน top-level DMs
- Matrix preview finalization และ redaction fallback
- room echoes ของ Matrix ที่ติดแท็ก OpenClaw gateway-failure จากบัญชี bot
  ที่กำหนดค่าไว้ drop ก่อนการจัดการ `allowBots`
- cascade audits ของ Discord และ Google Chat shared-room gateway-failure ครอบคลุม
  โหมด `allowBots` ก่อนอ้างถึงการป้องกันทั่วไปที่นั่น
- Mattermost draft finalization และ fresh-send fallback
- Teams native progress finalization
- Feishu duplicate final suppression
- QQ Bot accumulator timeout fallback
- Tlon durable final sends รักษา model-signature rendering และ participated
  thread tracking
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal simple durable final
  sends

Validation:

- ไฟล์ Vitest เป้าหมายระหว่างการพัฒนา
- `pnpm check:changed` ใน Testbox สำหรับพื้นผิวที่เปลี่ยนทั้งหมด
- `pnpm check` ที่กว้างขึ้นใน Testbox ก่อน landing refactor ที่สมบูรณ์ หรือหลัง
  การเปลี่ยนแปลง SDK/export สาธารณะ
- live หรือ qa-channel smoke สำหรับอย่างน้อยหนึ่ง channel ที่แก้ไขได้และหนึ่ง
  channel แบบส่งอย่างเดียวง่าย ๆ ก่อนลบ compatibility wrappers

## คำถามที่ยังเปิดอยู่

- Telegram ควรแทนที่ grammY runner source ด้วย
  durable polling source แบบเต็มที่ควบคุม platform-level redelivery ได้ในที่สุดหรือไม่ ไม่ใช่
  แค่ persisted restart watermark ของ OpenClaw
- durable live preview state ควรเก็บใน queue record เดียวกับ
  final send intent หรือใน sibling live-state store
- compatibility wrappers จะยังคงถูกบันทึกในเอกสารนานเท่าใดหลังจาก
  `plugin-sdk/channel-message` ship
- Plugin ภายนอกควร implement receive adapters โดยตรง หรือเพียง
  provide normalize/send/live hooks ผ่าน `defineChannelMessageAdapter`
- receipt fields ใดที่ปลอดภัยต่อการเปิดเผยใน SDK สาธารณะ เทียบกับ internal runtime
  state
- side effects เช่น self-echo caches และ participated-thread markers
  ควรถูกจำลองเป็น send-context hooks, adapter-owned finalize steps หรือ
  receipt subscribers
- channel ใดมี native origin metadata, channel ใดต้องใช้ persisted outbound
  registries และ channel ใดไม่สามารถให้การระงับ cross-bot echo ที่เชื่อถือได้

## เกณฑ์การยอมรับ

- message channel ที่รวมมาทุกตัวส่ง final visible output ผ่าน
  `messages.send`
- inbound message channel ทุกตัวเข้าสู่ระบบผ่าน `messages.receive` หรือ
  compatibility wrapper ที่มีเอกสาร
- preview/edit/stream channel ทุกตัวใช้ `messages.live` สำหรับ draft state และ
  finalization
- `channel.turn` เป็นเพียง wrapper
- ตัวช่วย SDK ที่มีชื่อแบบ reply เป็น compatibility exports ไม่ใช่เส้นทางที่แนะนำ
- durable recovery สามารถ replay pending final sends หลัง restart โดยไม่สูญเสีย
  final response หรือทำซ้ำ sends ที่ commit แล้ว; sends ที่
  platform outcome ไม่ทราบแน่ชัดจะถูก reconcile ก่อน replay หรือถูกบันทึกในเอกสารว่า
  เป็น at-least-once สำหรับ adapter นั้น
- durable final sends fail closed เมื่อไม่สามารถเขียน durable intent ได้
  เว้นแต่ caller จะเลือก documented non-durable mode อย่างชัดเจน
- compatibility helpers ของ legacy channel-turn และ SDK มีค่าเริ่มต้นเป็น direct
  channel-owned delivery; generic durable send เป็น explicit opt-in เท่านั้น
- receipts รักษา platform message ids ทั้งหมดสำหรับ multi-part deliveries และ
  primary id สำหรับความสะดวกของ threading/edit
- durable wrappers รักษา channel-local side effects ก่อนแทนที่ direct
  delivery callbacks
- prepared dispatchers ไม่ถูกนับว่า durable จนกว่า final delivery
  path จะใช้ send context อย่างชัดเจน
- fallback delivery จัดการ projected payload ทุกตัว
- durable fallback delivery บันทึก projected payload ทุกตัวใน replayable
  intent หรือ batch plan เดียว
- output ของ Gateway failure ที่มีต้นทางจาก OpenClaw มองเห็นได้สำหรับมนุษย์ แต่
  room echoes ที่ authored โดย bot และติดแท็กจะถูก drop ก่อน bot authorization บน channel ที่
  ประกาศรองรับ origin contract
- เอกสารอธิบาย send, receive, live, state, receipts, relations, failure
  policy, migration และ test coverage

## ที่เกี่ยวข้อง

- [Messages](/th/concepts/messages)
- [Streaming and chunking](/th/concepts/streaming)
- [Progress drafts](/th/concepts/progress-drafts)
- [Retry policy](/th/concepts/retry)
- [Channel turn kernel](/th/plugins/sdk-channel-turn)
