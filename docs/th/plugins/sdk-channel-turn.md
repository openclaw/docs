---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางและต้องการวงจรชีวิตของเทิร์นขาเข้าที่ใช้ร่วมกัน
    - คุณกำลังย้ายตัวเฝ้าตรวจช่องทางออกจากโค้ดเชื่อมสำหรับการบันทึก/การส่งต่อที่เขียนขึ้นเอง
    - คุณต้องเข้าใจขั้นตอนการรับเข้า การนำเข้า การจัดประเภท การตรวจสอบก่อนดำเนินการ การแก้ไข การบันทึก การจัดส่ง และการสรุปขั้นสุดท้าย
sidebarTitle: Channel turn
summary: runtime.channel.turn -- เคอร์เนลเทิร์นขาเข้าที่ใช้ร่วมกัน ซึ่ง Plugin ช่องทางที่มาพร้อมชุดและของบุคคลที่สามใช้เพื่อบันทึก ส่งต่อ และสรุปเทิร์นของเอเจนต์
title: เคอร์เนลเทิร์นของช่องทาง
x-i18n:
    generated_at: "2026-05-06T09:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

The channel turn kernel คือ state machine ขาเข้าที่ใช้ร่วมกัน ซึ่งแปลงเหตุการณ์ของแพลตฟอร์มที่ผ่านการทำให้เป็นมาตรฐานแล้วให้เป็น turn ของเอเจนต์ Channel plugins จะให้ข้อเท็จจริงของแพลตฟอร์มและ callback สำหรับการส่งมอบ ส่วน core เป็นเจ้าของการประสานงาน: ingest, classify, preflight, resolve, authorize, assemble, record, dispatch และ finalize

ใช้สิ่งนี้เมื่อ plugin ของคุณอยู่บน hot path ของข้อความขาเข้า สำหรับเหตุการณ์ที่ไม่ใช่ข้อความ (slash commands, modals, button interactions, lifecycle events, reactions, voice state) ให้เก็บไว้ภายใน plugin เท่านั้น kernel เป็นเจ้าของเฉพาะเหตุการณ์ที่อาจกลายเป็น turn ข้อความของเอเจนต์

<Info>
  เข้าถึง kernel ผ่าน plugin runtime ที่ถูกฉีดเข้ามาในรูป `runtime.channel.turn.*` ชนิดของ plugin runtime ถูกส่งออกจาก `openclaw/plugin-sdk/core` ดังนั้น third-party native plugins จึงใช้ entry points เหล่านี้ได้แบบเดียวกับ bundled channel plugins
</Info>

## เหตุผลที่มี kernel ที่ใช้ร่วมกัน

Channel plugins ทำ flow ขาเข้าแบบเดียวกันซ้ำ ๆ: normalize, route, gate, build context, record session metadata, dispatch agent turn, finalize delivery state หากไม่มี kernel ที่ใช้ร่วมกัน การเปลี่ยนแปลง mention gating, tool-only visible replies, session metadata, pending history หรือ dispatch finalization จะต้องนำไปใช้แยกตามแต่ละ channel

kernel จงใจแยกแนวคิดสี่อย่างออกจากกัน:

- `ConversationFacts`: ข้อความมาจากที่ใด
- `RouteFacts`: เอเจนต์และ session ใดควรประมวลผล
- `ReplyPlanFacts`: visible replies ควรถูกส่งไปที่ใด
- `MessageFacts`: body และ supplemental context ใดที่เอเจนต์ควรเห็น

Slack DMs, หัวข้อ Telegram, Matrix threads และ Feishu topic sessions ล้วนแยกสิ่งเหล่านี้ออกจากกันในทางปฏิบัติ การถือว่าสิ่งเหล่านี้เป็น identifier เดียวกันจะทำให้เกิด drift เมื่อเวลาผ่านไป

## วงจรชีวิตของ stage

kernel รัน pipeline คงที่ชุดเดียวกันไม่ว่าจะเป็น channel ใด:

1. `ingest` -- adapter แปลงเหตุการณ์แพลตฟอร์มดิบให้เป็น `NormalizedTurnInput`
2. `classify` -- adapter ระบุว่าเหตุการณ์นี้เริ่ม turn ของเอเจนต์ได้หรือไม่
3. `preflight` -- adapter ทำ dedupe, self-echo, hydration, debounce, decryption, partial fact prefill
4. `resolve` -- adapter ส่งคืน turn ที่ประกอบครบถ้วนแล้ว (route, reply plan, message, delivery)
5. `authorize` -- ใช้นโยบาย DM, group, mention และ command กับ facts ที่ประกอบแล้ว
6. `assemble` -- สร้าง `FinalizedMsgContext` จาก facts ผ่าน `buildContext`
7. `record` -- บันทึก inbound session metadata และ last route
8. `dispatch` -- ดำเนินการ turn ของเอเจนต์ผ่าน buffered block dispatcher
9. `finalize` -- `onFinalize` ของ adapter รันแม้เกิด dispatch error

แต่ละ stage จะปล่อย structured log event เมื่อมีการส่ง callback `log` มาให้ ดู [Observability](#observability)

## ชนิดของ admission

kernel จะไม่ throw เมื่อ turn ถูก gate แต่จะส่งคืน `ChannelTurnAdmission`:

| Kind          | เมื่อใด                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | turn ได้รับอนุญาต Agent turn รัน และมีการใช้ visible reply path                                                                   |
| `observeOnly` | turn รันตั้งแต่ต้นจนจบ แต่ delivery adapter ไม่ส่งสิ่งใดที่มองเห็นได้ ใช้สำหรับ broadcast observer agents และ passive multi-agent flows อื่น ๆ |
| `handled`     | เหตุการณ์แพลตฟอร์มถูกจัดการภายในเครื่องแล้ว (lifecycle, reaction, button, modal) kernel ข้าม dispatch                                           |
| `drop`        | เส้นทางที่ข้าม อาจตั้ง `recordHistory: true` เพื่อเก็บข้อความไว้ใน pending group history เพื่อให้ mention ในอนาคตมี context                      |

admission อาจมาจาก `classify` (event class ระบุว่าเริ่ม turn ไม่ได้), จาก `preflight` (dedupe, self-echo, mention ที่หายไปพร้อมบันทึก history) หรือจาก `resolveTurn` เอง

## Entry points

runtime เปิดเผย entry points ที่แนะนำสามรายการ เพื่อให้ adapters เลือกระดับที่ตรงกับ channel ได้

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

runtime helpers รุ่นเก่าสองรายการยังคงมีให้ใช้เพื่อความเข้ากันได้กับ Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

ใช้เมื่อ channel ของคุณสามารถแสดง flow ขาเข้าเป็น `ChannelTurnAdapter<TRaw>` ได้ adapter มี callbacks สำหรับ `ingest`, `classify` แบบ optional, `preflight` แบบ optional, `resolveTurn` ที่บังคับใช้ และ `onFinalize` แบบ optional

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` เป็นรูปแบบที่เหมาะเมื่อ channel มี logic ของ adapter เล็กน้อย และได้ประโยชน์จากการเป็นเจ้าของ lifecycle ผ่าน hooks

### runPrepared

ใช้เมื่อ channel มี dispatcher ภายในที่ซับซ้อน พร้อม previews, retries, edits หรือ thread bootstrap ที่ต้องคงความเป็นเจ้าของโดย channel ไว้ kernel ยังคงบันทึก inbound session ก่อน dispatch และแสดง `DispatchedChannelTurnResult` ที่เป็นรูปแบบเดียวกัน

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

channels ที่มีรายละเอียดมาก (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) ใช้ `runPrepared` เพราะ dispatcher ของพวกมันประสานงานพฤติกรรมเฉพาะแพลตฟอร์มที่ kernel ไม่ควรต้องรู้

### buildContext

ฟังก์ชันบริสุทธิ์ที่ map ชุด facts ให้เป็น `FinalizedMsgContext` ใช้เมื่อ channel ของคุณเขียน pipeline บางส่วนเอง แต่ต้องการ shape ของ context ที่สอดคล้องกัน

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` ยังมีประโยชน์ภายใน callbacks ของ `resolveTurn` เมื่อประกอบ turn สำหรับ `run`

<Note>
  SDK helpers ที่เลิกแนะนำแล้ว เช่น `dispatchInboundReplyWithBase` ยังคง bridge ผ่าน assembled-turn helper โค้ด plugin ใหม่ควรใช้ `run` หรือ `runPrepared`
</Note>

## ชนิดของ facts

facts ที่ kernel ใช้จาก adapter ของคุณเป็นแบบไม่ขึ้นกับแพลตฟอร์ม แปลง objects ของแพลตฟอร์มให้เป็น shapes เหล่านี้ก่อนส่งให้ kernel

### NormalizedTurnInput

| Field             | Purpose                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | message id ที่เสถียร ใช้สำหรับ dedupe และ logs                                   |
| `timestamp`       | epoch ms แบบ optional                                                            |
| `rawText`         | body ตามที่ได้รับจากแพลตฟอร์ม                                           |
| `textForAgent`    | body ที่ล้างแล้วแบบ optional สำหรับเอเจนต์ (mention strip, typing trim)             |
| `textForCommands` | body แบบ optional ที่ใช้สำหรับการ parse `/command`                                    |
| `raw`             | pass-through reference แบบ optional สำหรับ adapter callbacks ที่ต้องการต้นฉบับ |

### ChannelEventClass

| Field                  | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | หากเป็น false kernel จะส่งคืน `{ kind: "handled" }`                       |
| `requiresImmediateAck` | hint สำหรับ adapters ที่ต้อง ACK ก่อน dispatch                      |

### SenderFacts

| Field          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | platform sender id ที่เสถียร                                      |
| `name`         | ชื่อที่แสดง                                                   |
| `username`     | handle หากแตกต่างจาก `name`                                 |
| `tag`          | discriminator แบบ Discord หรือ tag ของแพลตฟอร์ม                    |
| `roles`        | role ids ใช้สำหรับการจับคู่ member-role allowlist              |
| `isBot`        | เป็น true เมื่อ sender เป็น bot ที่รู้จัก (kernel ใช้สำหรับ drop) |
| `isSelf`       | เป็น true เมื่อ sender คือเอเจนต์ที่ตั้งค่าไว้เอง            |
| `displayLabel` | label ที่ render ไว้ล่วงหน้าสำหรับ envelope text                           |

### ConversationFacts

| Field             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, หรือ `channel`                                      |
| `id`              | conversation id ที่ใช้สำหรับ routing                                     |
| `label`           | label สำหรับมนุษย์สำหรับ envelope                                         |
| `spaceId`         | outer space identifier แบบ optional (Slack workspace, Matrix homeserver) |
| `parentId`        | outer conversation id เมื่อสิ่งนี้เป็น thread                          |
| `threadId`        | thread id เมื่อข้อความนี้อยู่ใน thread                       |
| `nativeChannelId` | channel id แบบ native ของแพลตฟอร์มเมื่อแตกต่างจาก routing id        |
| `routePeer`       | peer ที่ใช้สำหรับ lookup `resolveAgentRoute`                             |

### RouteFacts

| Field                   | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | เอเจนต์ที่ควรจัดการ turn นี้                         |
| `accountId`             | override แบบ optional (channels หลายบัญชี)                 |
| `routeSessionKey`       | session key ที่ใช้สำหรับ routing                               |
| `dispatchSessionKey`    | session key ที่ใช้ตอน dispatch เมื่อแตกต่างจาก route key |
| `persistedSessionKey`   | session key ที่เขียนลงใน persisted session metadata          |
| `parentSessionKey`      | parent สำหรับ branched/threaded sessions                      |
| `modelParentSessionKey` | parent ฝั่ง model สำหรับ branched sessions                    |
| `mainSessionKey`        | pin เจ้าของ DM หลักสำหรับ direct conversations                 |
| `createIfMissing`       | อนุญาตให้ขั้นตอน record สร้าง session row ที่หายไป          |

### ReplyPlanFacts

| ฟิลด์                     | วัตถุประสงค์                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | เป้าหมายการตอบกลับเชิงตรรกะที่เขียนลงในบริบท `To`          |
| `originatingTo`           | เป้าหมายบริบทต้นทาง (`OriginatingTo`)            |
| `nativeChannelId`         | รหัสช่องทางเนทีฟของแพลตฟอร์มสำหรับการส่งมอบ                 |
| `replyTarget`             | ปลายทางการตอบกลับที่มองเห็นสุดท้าย หากแตกต่างจาก `to` |
| `deliveryTarget`          | การแทนที่การส่งมอบระดับล่าง                           |
| `replyToId`               | รหัสข้อความที่ถูกอ้างอิง/ยึดโยง                              |
| `replyToIdFull`           | รหัสอ้างอิงรูปแบบเต็มเมื่อแพลตฟอร์มมีทั้งสองแบบ          |
| `messageThreadId`         | รหัสเธรด ณ เวลาส่งมอบ                              |
| `threadParentId`          | รหัสข้อความแม่ของเธรด                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, หรือ `none`       |

### AccessFacts

`AccessFacts` เก็บค่าบูลีนที่ขั้นตอน authorize ต้องใช้ การจับคู่ตัวตนยังคงอยู่ในช่องทาง: เคอร์เนลใช้เฉพาะผลลัพธ์เท่านั้น

| ฟิลด์      | วัตถุประสงค์                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | การตัดสินใจอนุญาต/จับคู่/ปฏิเสธ DM และรายการ `allowFrom`                       |
| `group`    | นโยบายกลุ่ม, การอนุญาตเส้นทาง, การอนุญาตผู้ส่ง, allowlist, ข้อกำหนดการ mention   |
| `commands` | การอนุญาตคำสั่งข้ามตัวอนุญาตที่กำหนดค่าไว้                       |
| `mentions` | ตรวจจับ mention ได้หรือไม่ และ agent ถูก mention หรือไม่ |

### MessageFacts

| ฟิลด์            | วัตถุประสงค์                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | เนื้อหา envelope สุดท้าย (จัดรูปแบบแล้ว)                                |
| `rawBody`        | เนื้อหาขาเข้าดิบ                                               |
| `bodyForAgent`   | เนื้อหาที่ agent เห็น                                            |
| `commandBody`    | เนื้อหาที่ใช้สำหรับแยกวิเคราะห์คำสั่ง                                  |
| `envelopeFrom`   | ป้ายชื่อผู้ส่งที่เรนเดอร์ไว้ล่วงหน้าสำหรับ envelope                     |
| `senderLabel`    | การแทนที่แบบไม่บังคับสำหรับผู้ส่งที่เรนเดอร์                      |
| `preview`        | ตัวอย่างสั้นที่ปกปิดข้อมูลแล้วสำหรับ log                                |
| `inboundHistory` | รายการประวัติขาเข้าล่าสุดเมื่อช่องทางเก็บบัฟเฟอร์ไว้ |

### SupplementalContextFacts

บริบทเพิ่มเติมครอบคลุมบริบทการอ้างอิง, การส่งต่อ, และการเริ่มต้นเธรด เคอร์เนลใช้นโยบาย `contextVisibility` ที่กำหนดค่าไว้ channel adapter ให้เฉพาะ facts และแฟล็ก `senderAllowed` เพื่อให้นโยบายข้ามช่องทางสอดคล้องกัน

### InboundMediaFacts

สื่อมีรูปแบบเป็น facts การดาวน์โหลดของแพลตฟอร์ม, auth, นโยบาย SSRF, กฎ CDN, และการถอดรหัสยังคงอยู่เฉพาะในช่องทาง เคอร์เนลแมป facts ไปเป็น `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, และ `MediaTranscribedIndexes`

## สัญญา adapter

สำหรับ `run` แบบเต็ม รูปทรงของ adapter คือ:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` ส่งคืน `ChannelTurnResolved` ซึ่งเป็น `AssembledChannelTurn` พร้อมชนิด admission แบบไม่บังคับ การส่งคืน `{ admission: { kind: "observeOnly" } }` จะรัน turn โดยไม่สร้างเอาต์พุตที่มองเห็น adapter ยังคงเป็นเจ้าของ delivery callback เพียงแต่จะกลายเป็น no-op สำหรับ turn นั้น

`onFinalize` รันกับทุกผลลัพธ์ รวมถึง dispatch errors ใช้เพื่อล้างประวัติกลุ่มที่ค้างอยู่, ลบ ack reactions, หยุด status indicators, และ flush สถานะ local

## Delivery adapter

เคอร์เนลไม่เรียกแพลตฟอร์มโดยตรง ช่องทางส่ง `ChannelTurnDeliveryAdapter` ให้เคอร์เนล:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` ถูกเรียกหนึ่งครั้งต่อชิ้นส่วนการตอบกลับที่บัฟเฟอร์ไว้ ระหว่างการย้าย message-lifecycle การส่งมอบ channel-turn ที่ประกอบแล้วเป็นของช่องทางโดยค่าเริ่มต้น: ฟิลด์ `durable` ที่ละไว้หมายความว่าเคอร์เนลต้องเรียก `deliver` โดยตรง และต้องไม่กำหนดเส้นทางผ่าน generic outbound delivery ตั้งค่า `durable` เฉพาะหลังจากตรวจสอบช่องทางแล้วเพื่อพิสูจน์ว่าเส้นทางส่งทั่วไปคงพฤติกรรมการส่งมอบเดิมไว้ รวมถึงเป้าหมาย reply/thread, การจัดการสื่อ, แคช sent-message/self-echo, การล้างสถานะ, และรหัสข้อความที่ส่งคืน `durable: false` ยังคงเป็นการสะกดเพื่อความเข้ากันได้สำหรับ "ใช้ callback ที่ช่องทางเป็นเจ้าของ" แต่ช่องทางที่ยังไม่ได้ย้ายไม่ควรจำเป็นต้องเพิ่มค่าไว้ ส่งคืนรหัสข้อความของแพลตฟอร์มเมื่อช่องทางมี เพื่อให้ dispatcher รักษา thread anchors และแก้ไขชิ้นส่วนภายหลังได้ เส้นทางการส่งมอบที่ใหม่กว่าควรส่งคืน `receipt` ด้วย เพื่อให้การกู้คืน, การสรุป preview, และการระงับรายการซ้ำย้ายออกจาก `messageIds` ได้ สำหรับ observe-only turns ให้ส่งคืน `{ visibleReplySent: false }` หรือใช้ `createNoopChannelTurnDeliveryAdapter()`

ช่องทางที่ใช้ `runPrepared` กับ dispatcher ที่ช่องทางเป็นเจ้าของทั้งหมดจะไม่มี `ChannelTurnDeliveryAdapter` dispatcher เหล่านั้นไม่ durable โดยค่าเริ่มต้น ควรรักษาเส้นทางการส่งมอบโดยตรงไว้จนกว่าจะ opt in อย่างชัดเจนสู่ send context ใหม่พร้อม target ที่สมบูรณ์, adapter ที่ replay-safe, สัญญา receipt, และ hooks ผลข้างเคียงของช่องทาง

ตัวช่วยความเข้ากันได้สาธารณะ เช่น `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, และตัวช่วย direct-DM ต้องคงพฤติกรรมไว้ระหว่างการย้าย ไม่ควรเรียก generic durable delivery ก่อน callback `deliver` หรือ `reply` ที่ caller เป็นเจ้าของ

## ตัวเลือก record

ขั้นตอน record ห่อ `recordInboundSession` ช่องทางส่วนใหญ่ใช้ค่าเริ่มต้นได้ แทนที่ผ่าน `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher รอขั้นตอน record หาก record throw เคอร์เนลจะรัน `onPreDispatchFailure` (เมื่อส่งให้ `runPrepared`) แล้ว throw ต่อ

## การสังเกตการณ์

แต่ละขั้นตอนปล่อยเหตุการณ์แบบมีโครงสร้างเมื่อมี callback `log`:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

ขั้นตอนที่ log: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize` หลีกเลี่ยงการ log เนื้อหาดิบ; ใช้ `MessageFacts.preview` สำหรับตัวอย่างสั้นที่ปกปิดข้อมูลแล้ว

## สิ่งที่ยังคงอยู่เฉพาะในช่องทาง

เคอร์เนลเป็นเจ้าของการจัดลำดับงาน ช่องทางยังคงเป็นเจ้าของ:

- การขนส่งของแพลตฟอร์ม (gateway, REST, websocket, polling, webhooks)
- การแก้ไขตัวตนและการจับคู่ชื่อที่แสดง
- คำสั่งเนทีฟ, slash commands, autocomplete, modals, buttons, voice state
- การเรนเดอร์ card, modal, และ adaptive-card
- Media auth, กฎ CDN, สื่อเข้ารหัส, การถอดเสียง
- API สำหรับ edit, reaction, redaction, และ presence
- Backfill และการดึงประวัติฝั่งแพลตฟอร์ม
- โฟลว์การจับคู่ที่ต้องการการตรวจสอบเฉพาะแพลตฟอร์ม

หากสองช่องทางเริ่มต้องใช้ตัวช่วยเดียวกันสำหรับรายการใดรายการหนึ่งเหล่านี้ ให้แยกเป็น SDK helper ที่ใช้ร่วมกันแทนการดันเข้าไปในเคอร์เนล

## เสถียรภาพ

`runtime.channel.turn.*` เป็นส่วนหนึ่งของพื้นผิว runtime สาธารณะของ Plugin ชนิด fact (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) และรูปทรง admission (`ChannelTurnAdmission`, `ChannelEventClass`) เข้าถึงได้ผ่าน `PluginRuntime` จาก `openclaw/plugin-sdk/core`

ใช้กฎความเข้ากันได้ย้อนหลัง: ฟิลด์ fact ใหม่เป็นแบบเพิ่มเติม, ชนิด admission จะไม่ถูกเปลี่ยนชื่อ, และชื่อ entry point คงที่ ความต้องการช่องทางใหม่ที่จำเป็นต้องมีการเปลี่ยนแปลงแบบไม่เพิ่มเติมต้องผ่านกระบวนการย้าย Plugin SDK

## ที่เกี่ยวข้อง

- [การรีแฟกเตอร์วงจรชีวิตข้อความ](/th/concepts/message-lifecycle-refactor) สำหรับวงจรชีวิต send/receive/live ที่วางแผนไว้ซึ่งจะห่อเคอร์เนลนี้
- [การสร้าง channel plugins](/th/plugins/sdk-channel-plugins) สำหรับสัญญา channel Plugin ที่กว้างขึ้น
- [ตัวช่วย Plugin runtime](/th/plugins/sdk-runtime) สำหรับพื้นผิว `runtime.*` อื่น ๆ
- [ภายในของ Plugin](/th/plugins/architecture-internals) สำหรับ load pipeline และกลไก registry
