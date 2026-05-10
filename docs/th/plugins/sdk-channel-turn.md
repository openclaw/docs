---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางและต้องการวงจรชีวิตของเทิร์นขาเข้าที่ใช้ร่วมกัน
    - คุณกำลังย้ายตัวตรวจสอบช่องทางออกจากโค้ดเชื่อม `record`/`dispatch` ที่เขียนเอง
    - คุณต้องเข้าใจขั้นตอนการรับเข้า การนำเข้า การจำแนก การตรวจสอบก่อนดำเนินการ การแก้ไข การบันทึก การส่งต่อ และการสรุปผล
sidebarTitle: Channel turn
summary: runtime.channel.turn -- เคอร์เนลรอบขาเข้าที่ใช้ร่วมกัน ซึ่ง Plugin ช่องทางที่มาพร้อมชุดและของบุคคลที่สามใช้เพื่อบันทึก ส่งต่อ และปิดจบรอบการทำงานของเอเจนต์
title: เคอร์เนลรอบการโต้ตอบของช่องทาง
x-i18n:
    generated_at: "2026-05-10T19:50:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

เคอร์เนลเทิร์นของช่องทางคือสเตตแมชชีนขาเข้าที่ใช้ร่วมกัน ซึ่งเปลี่ยนอีเวนต์แพลตฟอร์มที่ถูกทำให้เป็นมาตรฐานแล้วให้กลายเป็นเทิร์นของเอเจนต์ Plugin ช่องทางให้ข้อเท็จจริงของแพลตฟอร์มและคอลแบ็กการส่งมอบ ส่วนคอร์เป็นเจ้าของการประสานงาน ได้แก่ รับเข้า, จัดประเภท, ตรวจสอบก่อนดำเนินการ, แก้เส้นทาง, อนุญาต, ประกอบ, บันทึก, ดิสแพตช์ และสรุปปิดงาน

ใช้สิ่งนี้เมื่อ Plugin ของคุณอยู่บนเส้นทางร้อนของข้อความขาเข้า สำหรับอีเวนต์ที่ไม่ใช่ข้อความ (คำสั่งสแลช, โมดัล, การโต้ตอบกับปุ่ม, อีเวนต์วงจรชีวิต, รีแอ็กชัน, สถานะเสียง) ให้เก็บไว้เฉพาะภายใน Plugin เคอร์เนลเป็นเจ้าของเฉพาะอีเวนต์ที่อาจกลายเป็นเทิร์นข้อความของเอเจนต์เท่านั้น

<Info>
  เคอร์เนลเข้าถึงได้ผ่านรันไทม์ Plugin ที่ฉีดเข้ามาเป็น `runtime.channel.turn.*` ชนิดรันไทม์ Plugin ถูกส่งออกจาก `openclaw/plugin-sdk/core` ดังนั้น Plugin เนทีฟของบุคคลที่สามจึงใช้จุดเข้าเหล่านี้ได้แบบเดียวกับ Plugin ช่องทางที่บันเดิลมา
</Info>

## เหตุผลที่ต้องมีเคอร์เนลร่วม

Plugin ช่องทางทำโฟลว์ขาเข้าเดิมซ้ำ ๆ ได้แก่ ทำให้เป็นมาตรฐาน, กำหนดเส้นทาง, กั้นการเข้าถึง, สร้างบริบท, บันทึกเมทาดาทาของเซสชัน, ดิสแพตช์เทิร์นของเอเจนต์, สรุปสถานะการส่งมอบ หากไม่มีเคอร์เนลร่วม การเปลี่ยนแปลงเกี่ยวกับการกั้นด้วยการเมนชัน, คำตอบที่มองเห็นได้เฉพาะเครื่องมือ, เมทาดาทาของเซสชัน, ประวัติที่ค้างอยู่ หรือการสรุปการดิสแพตช์ ต้องนำไปใช้แยกตามแต่ละช่องทาง

เคอร์เนลจงใจแยกแนวคิดสี่อย่างนี้ออกจากกัน:

- `ConversationFacts`: ข้อความมาจากที่ใด
- `RouteFacts`: เอเจนต์และเซสชันใดควรประมวลผล
- `ReplyPlanFacts`: คำตอบที่มองเห็นได้ควรส่งไปที่ใด
- `MessageFacts`: เนื้อหาและบริบทเสริมใดที่เอเจนต์ควรเห็น

DM ของ Slack, หัวข้อของ Telegram, เธรดของ Matrix และเซสชันหัวข้อของ Feishu ล้วนแยกสิ่งเหล่านี้ในทางปฏิบัติ การถือว่าสิ่งเหล่านี้เป็นตัวระบุเดียวกันจะทำให้เกิดความคลาดเคลื่อนเมื่อเวลาผ่านไป

## วงจรชีวิตของสเตจ

เคอร์เนลรันไปป์ไลน์คงที่เดียวกันไม่ว่าช่องทางใด:

1. `ingest` -- อะแดปเตอร์แปลงอีเวนต์แพลตฟอร์มดิบให้เป็น `NormalizedTurnInput`
2. `classify` -- อะแดปเตอร์ประกาศว่าอีเวนต์นี้เริ่มเทิร์นของเอเจนต์ได้หรือไม่
3. `preflight` -- อะแดปเตอร์ทำการตัดซ้ำ, เสียงสะท้อนจากตัวเอง, เติมข้อมูล, ดีบาวซ์, ถอดรหัส, เติมข้อเท็จจริงบางส่วนล่วงหน้า
4. `resolve` -- อะแดปเตอร์คืนค่าเทิร์นที่ประกอบครบแล้ว (เส้นทาง, แผนการตอบกลับ, ข้อความ, การส่งมอบ)
5. `authorize` -- ใช้นโยบาย DM, กลุ่ม, การเมนชัน และคำสั่งกับข้อเท็จจริงที่ประกอบแล้ว
6. `assemble` -- สร้าง `FinalizedMsgContext` จากข้อเท็จจริงผ่าน `buildContext`
7. `record` -- คงสภาพเมทาดาทาของเซสชันขาเข้าและเส้นทางล่าสุด
8. `dispatch` -- ดำเนินเทิร์นของเอเจนต์ผ่านตัวดิสแพตช์บล็อกแบบบัฟเฟอร์
9. `finalize` -- อะแดปเตอร์ `onFinalize` รันแม้เกิดข้อผิดพลาดในการดิสแพตช์

แต่ละสเตจปล่อยอีเวนต์ล็อกแบบมีโครงสร้างเมื่อมีการส่งคอลแบ็ก `log` มาให้ ดู [การสังเกตการณ์](#observability)

## ชนิดการรับเข้า

เคอร์เนลจะไม่โยนข้อผิดพลาดเมื่อเทิร์นถูกกั้นไว้ แต่จะคืนค่า `ChannelTurnAdmission`:

| ชนิด          | เมื่อใด                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | รับเทิร์นเข้าแล้ว เทิร์นของเอเจนต์รันและใช้เส้นทางคำตอบที่มองเห็นได้                                                                   |
| `observeOnly` | เทิร์นรันครบตั้งแต่ต้นจนจบ แต่อะแดปเตอร์การส่งมอบไม่ส่งสิ่งใดที่มองเห็นได้ ใช้สำหรับเอเจนต์ผู้สังเกตการณ์แบบบรอดแคสต์และโฟลว์หลายเอเจนต์แบบพาสซีฟอื่น ๆ |
| `handled`     | อีเวนต์แพลตฟอร์มถูกใช้ภายในเครื่องแล้ว (วงจรชีวิต, รีแอ็กชัน, ปุ่ม, โมดัล) เคอร์เนลข้ามการดิสแพตช์                                           |
| `drop`        | เส้นทางข้าม หากระบุ `recordHistory: true` จะเก็บข้อความไว้ในประวัติกลุ่มที่ค้างอยู่ เพื่อให้การเมนชันในอนาคตมีบริบท                      |

การรับเข้าอาจมาจาก `classify` (คลาสอีเวนต์ระบุว่าเริ่มเทิร์นไม่ได้), จาก `preflight` (ตัดซ้ำ, เสียงสะท้อนจากตัวเอง, ไม่มีการเมนชันแต่บันทึกประวัติ) หรือจาก `resolveTurn` เอง

## จุดเข้า

รันไทม์เปิดเผยจุดเข้าที่แนะนำสามรายการ เพื่อให้อะแดปเตอร์เลือกใช้ได้ในระดับที่ตรงกับช่องทาง

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

ตัวช่วยรันไทม์รุ่นเก่าสองรายการยังคงพร้อมใช้งานเพื่อความเข้ากันได้กับ Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

ใช้เมื่อช่องทางของคุณแสดงโฟลว์ขาเข้าเป็น `ChannelTurnAdapter<TRaw>` ได้ อะแดปเตอร์มีคอลแบ็กสำหรับ `ingest`, `classify` แบบไม่บังคับ, `preflight` แบบไม่บังคับ, `resolveTurn` ที่บังคับ และ `onFinalize` แบบไม่บังคับ

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

`run` เป็นรูปแบบที่เหมาะเมื่อช่องทางมีตรรกะอะแดปเตอร์ขนาดเล็กและได้ประโยชน์จากการเป็นเจ้าของวงจรชีวิตผ่านฮุก

### runAssembled

ใช้เมื่อช่องทางแก้เส้นทางแล้ว, สร้าง `FinalizedMsgContext` แล้ว
และต้องการเฉพาะการบันทึกร่วม, ไปป์ไลน์คำตอบ, การดิสแพตช์ และลำดับการสรุปปิดงาน
นี่เป็นรูปแบบที่แนะนำสำหรับเส้นทางขาเข้าของบันเดิลแบบเรียบง่าย
ที่มิฉะนั้นจะต้องทำโค้ดสำเร็จรูป `createChannelMessageReplyPipeline(...)` และ
`runPrepared(...)` ซ้ำ

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

เลือก `runAssembled` แทน `runPrepared` เมื่อพฤติกรรมการดิสแพตช์ที่ช่องทางเป็นเจ้าของมีเพียงการส่งมอบเพย์โหลดสุดท้าย รวมถึงการพิมพ์, ตัวเลือกคำตอบ, การส่งมอบแบบคงทน หรือการล็อกข้อผิดพลาดที่เป็นทางเลือก

### runPrepared

ใช้เมื่อช่องทางมีตัวดิสแพตช์ภายในที่ซับซ้อนพร้อมตัวอย่างก่อนส่ง, การลองซ้ำ, การแก้ไข หรือการบูตสแตรปเธรดที่ต้องคงเป็นของช่องทาง เคอร์เนลยังคงบันทึกเซสชันขาเข้าก่อนดิสแพตช์และเผย `DispatchedChannelTurnResult` ที่เป็นรูปแบบเดียวกัน

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

ช่องทางที่มีความสามารถสูง (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) ใช้ `runPrepared` เพราะตัวดิสแพตช์ของช่องทางเหล่านั้นประสานพฤติกรรมเฉพาะแพลตฟอร์มที่เคอร์เนลไม่ควรต้องเรียนรู้

### buildContext

ฟังก์ชันบริสุทธิ์ที่แมปชุดข้อเท็จจริงเป็น `FinalizedMsgContext` ใช้เมื่อช่องทางของคุณเขียนบางส่วนของไปป์ไลน์เอง แต่ต้องการรูปทรงบริบทที่สอดคล้องกัน

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

`buildContext` ยังมีประโยชน์ภายในคอลแบ็ก `resolveTurn` เมื่อประกอบเทิร์นสำหรับ `run`

<Note>
  ตัวช่วย SDK ที่เลิกใช้แล้ว เช่น `dispatchInboundReplyWithBase` ยังคงเชื่อมผ่านตัวช่วยเทิร์นที่ประกอบแล้ว โค้ด Plugin ใหม่ควรใช้ `run` หรือ `runPrepared`
</Note>

## ชนิดข้อเท็จจริง

ข้อเท็จจริงที่เคอร์เนลใช้จากอะแดปเตอร์ของคุณไม่ผูกกับแพลตฟอร์ม แปลงอ็อบเจกต์แพลตฟอร์มให้เป็นรูปทรงเหล่านี้ก่อนส่งให้เคอร์เนล

### NormalizedTurnInput

| ฟิลด์             | วัตถุประสงค์                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | รหัสข้อความที่เสถียร ใช้สำหรับตัดซ้ำและล็อก                                   |
| `timestamp`       | epoch ms แบบไม่บังคับ                                                            |
| `rawText`         | เนื้อหาตามที่ได้รับจากแพลตฟอร์ม                                           |
| `textForAgent`    | เนื้อหาที่ล้างแล้วแบบไม่บังคับสำหรับเอเจนต์ (ตัดการเมนชัน, ตัดช่องว่างจากการพิมพ์)             |
| `textForCommands` | เนื้อหาแบบไม่บังคับที่ใช้สำหรับการแยกวิเคราะห์ `/command`                                    |
| `raw`             | การอ้างอิงแบบส่งผ่านไม่บังคับสำหรับคอลแบ็กอะแดปเตอร์ที่ต้องใช้ต้นฉบับ |

### ChannelEventClass

| ฟิลด์                  | วัตถุประสงค์                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | หากเป็นเท็จ เคอร์เนลจะคืนค่า `{ kind: "handled" }`                       |
| `requiresImmediateAck` | คำใบ้สำหรับอะแดปเตอร์ที่ต้อง ACK ก่อนดิสแพตช์                      |

### SenderFacts

| ฟิลด์          | วัตถุประสงค์                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | รหัสผู้ส่งของแพลตฟอร์มที่เสถียร                                      |
| `name`         | ชื่อที่แสดง                                                   |
| `username`     | แฮนเดิล หากแตกต่างจาก `name`                                 |
| `tag`          | ตัวแยกแบบ Discord หรือแท็กของแพลตฟอร์ม                    |
| `roles`        | รหัสบทบาท ใช้สำหรับการจับคู่รายการอนุญาตตามบทบาทสมาชิก              |
| `isBot`        | เป็นจริงเมื่อผู้ส่งเป็นบอตที่รู้จัก (เคอร์เนลใช้สำหรับการทิ้ง) |
| `isSelf`       | เป็นจริงเมื่อผู้ส่งคือตัวเอเจนต์ที่กำหนดค่าไว้เอง            |
| `displayLabel` | ป้ายกำกับที่เรนเดอร์ล่วงหน้าสำหรับข้อความซอง                           |

### ConversationFacts

| ฟิลด์             | วัตถุประสงค์                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, หรือ `channel`                                      |
| `id`              | รหัสบทสนทนาที่ใช้สำหรับการกำหนดเส้นทาง                                     |
| `label`           | ป้ายกำกับสำหรับมนุษย์ในซองข้อความ                                         |
| `spaceId`         | ตัวระบุพื้นที่ชั้นนอกแบบไม่บังคับ (เวิร์กสเปซ Slack, โฮมเซิร์ฟเวอร์ Matrix) |
| `parentId`        | รหัสบทสนทนาชั้นนอกเมื่อสิ่งนี้เป็นเธรด                          |
| `threadId`        | รหัสเธรดเมื่อข้อความนี้อยู่ในเธรด                       |
| `nativeChannelId` | รหัสช่องทางเนทีฟของแพลตฟอร์มเมื่อแตกต่างจากรหัสกำหนดเส้นทาง        |
| `routePeer`       | เพียร์ที่ใช้สำหรับการค้นหา `resolveAgentRoute`                             |

### RouteFacts

| ฟิลด์                   | วัตถุประสงค์                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | เอเจนต์ที่ควรจัดการเทิร์นนี้                         |
| `accountId`             | การแทนที่แบบไม่บังคับ (ช่องทางหลายบัญชี)                 |
| `routeSessionKey`       | คีย์เซสชันที่ใช้สำหรับการกำหนดเส้นทาง                               |
| `dispatchSessionKey`    | คีย์เซสชันที่ใช้ตอน dispatch เมื่อแตกต่างจากคีย์เส้นทาง |
| `persistedSessionKey`   | คีย์เซสชันที่เขียนลงในเมตาดาต้าเซสชันที่คงอยู่          |
| `parentSessionKey`      | พาเรนต์สำหรับเซสชันที่แยกสาขา/เป็นเธรด                      |
| `modelParentSessionKey` | พาเรนต์ฝั่งโมเดลสำหรับเซสชันที่แยกสาขา                    |
| `mainSessionKey`        | พินเจ้าของ DM หลักสำหรับการสนทนาโดยตรง                 |
| `createIfMissing`       | อนุญาตให้ขั้นตอน record สร้างแถวเซสชันที่ขาดหาย          |

### ReplyPlanFacts

| ฟิลด์                     | วัตถุประสงค์                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | เป้าหมายตอบกลับเชิงตรรกะที่เขียนลงในบริบท `To`          |
| `originatingTo`           | เป้าหมายบริบทต้นทาง (`OriginatingTo`)            |
| `nativeChannelId`         | รหัสช่องทางแบบเนทีฟของแพลตฟอร์มสำหรับการส่ง                 |
| `replyTarget`             | ปลายทางการตอบกลับที่มองเห็นได้สุดท้าย หากแตกต่างจาก `to` |
| `deliveryTarget`          | การแทนที่การส่งระดับล่าง                           |
| `replyToId`               | รหัสข้อความที่ถูกอ้างอิง/ยึดโยง                              |
| `replyToIdFull`           | รหัสที่ถูกอ้างอิงแบบเต็มเมื่อแพลตฟอร์มมีทั้งสองรูปแบบ          |
| `messageThreadId`         | รหัสเธรด ณ เวลาส่ง                              |
| `threadParentId`          | รหัสข้อความพาเรนต์ของเธรด                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` หรือ `none`       |

### AccessFacts

`AccessFacts` เก็บค่าบูลีนที่ขั้นตอน authorize ต้องใช้ การจับคู่ตัวตนยังอยู่ในช่องทาง: เคอร์เนลจะใช้เพียงผลลัพธ์เท่านั้น

| ฟิลด์      | วัตถุประสงค์                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | การตัดสินใจอนุญาต/จับคู่/ปฏิเสธ DM และรายการ `allowFrom`                       |
| `group`    | นโยบายกลุ่ม, การอนุญาตเส้นทาง, การอนุญาตผู้ส่ง, allowlist, ข้อกำหนดการ mention   |
| `commands` | การอนุญาตคำสั่งผ่านตัวอนุญาตที่กำหนดค่าไว้                       |
| `mentions` | ตรวจจับ mention ได้หรือไม่ และเอเจนต์ถูก mention หรือไม่ |

### MessageFacts

| ฟิลด์            | วัตถุประสงค์                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | เนื้อหา envelope สุดท้าย (จัดรูปแบบแล้ว)                                |
| `rawBody`        | เนื้อหาขาเข้าดิบ                                               |
| `bodyForAgent`   | เนื้อหาที่เอเจนต์เห็น                                            |
| `commandBody`    | เนื้อหาที่ใช้สำหรับแยกวิเคราะห์คำสั่ง                                  |
| `envelopeFrom`   | ป้ายชื่อผู้ส่งที่เรนเดอร์ไว้ล่วงหน้าสำหรับ envelope                     |
| `senderLabel`    | การแทนที่แบบไม่บังคับสำหรับผู้ส่งที่เรนเดอร์                      |
| `preview`        | ตัวอย่างสั้นที่ปกปิดข้อมูลแล้วสำหรับบันทึก                                |
| `inboundHistory` | รายการประวัติขาเข้าล่าสุดเมื่อช่องทางเก็บบัฟเฟอร์ไว้ |

### SupplementalContextFacts

บริบทเสริมครอบคลุมบริบท quote, forwarded และ thread-bootstrap เคอร์เนลจะใช้นโยบาย `contextVisibility` ที่กำหนดค่าไว้ อะแดปเตอร์ช่องทางให้เพียง facts และแฟล็ก `senderAllowed` เพื่อให้นโยบายข้ามช่องทางสอดคล้องกัน

### InboundMediaFacts

สื่อมีรูปแบบเป็น fact การดาวน์โหลดจากแพลตฟอร์ม, auth, นโยบาย SSRF, กฎ CDN และการถอดรหัสยังคงอยู่ภายในช่องทาง เคอร์เนลจะแมป facts ไปเป็น `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` และ `MediaTranscribedIndexes`

## สัญญาอะแดปเตอร์

สำหรับ `run` แบบเต็ม รูปทรงของอะแดปเตอร์คือ:

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

`resolveTurn` คืนค่า `ChannelTurnResolved` ซึ่งเป็น `AssembledChannelTurn` พร้อมชนิด admission แบบไม่บังคับ การคืนค่า `{ admission: { kind: "observeOnly" } }` จะรันเทิร์นโดยไม่สร้างเอาต์พุตที่มองเห็นได้ อะแดปเตอร์ยังคงเป็นเจ้าของคอลแบ็กการส่ง เพียงแต่จะกลายเป็น no-op สำหรับเทิร์นนั้น

`onFinalize` ทำงานกับทุกผลลัพธ์ รวมถึงข้อผิดพลาดจาก dispatch ใช้สำหรับล้างประวัติกลุ่มที่ค้างอยู่, ลบปฏิกิริยา ack, หยุดตัวบ่งชี้สถานะ และ flush สถานะภายในเครื่อง

## อะแดปเตอร์การส่ง

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

`deliver` ถูกเรียกหนึ่งครั้งต่อชิ้นส่วนการตอบกลับที่ถูกบัฟเฟอร์ ระหว่างการย้ายระบบ message-lifecycle การส่ง channel-turn ที่ประกอบแล้วจะเป็นของช่องทางโดยค่าเริ่มต้น: ฟิลด์ `durable` ที่ละไว้หมายความว่าเคอร์เนลต้องเรียก `deliver` โดยตรง และต้องไม่กำหนดเส้นทางผ่านการส่งขาออกทั่วไป ตั้งค่า `durable` เฉพาะหลังจากตรวจสอบช่องทางแล้วเพื่อพิสูจน์ว่าเส้นทางส่งทั่วไปยังรักษาพฤติกรรมการส่งเดิมไว้ รวมถึงเป้าหมาย reply/thread, การจัดการสื่อ, แคชข้อความที่ส่ง/เสียงสะท้อนจากตัวเอง, การล้างสถานะ และรหัสข้อความที่คืนกลับมา `durable: false` ยังคงเป็นการสะกดแบบเข้ากันได้สำหรับ "ใช้คอลแบ็กที่ช่องทางเป็นเจ้าของ" แต่ช่องทางที่ยังไม่ได้ย้ายระบบไม่ควรต้องเพิ่มค่านี้ คืนรหัสข้อความของแพลตฟอร์มเมื่อช่องทางมี เพื่อให้ dispatcher รักษา thread anchors และแก้ไขชิ้นส่วนภายหลังได้ เส้นทางการส่งที่ใหม่กว่าควรคืน `receipt` ด้วย เพื่อให้การกู้คืน, การสรุปตัวอย่าง และการกดซ้ำย้ายออกจาก `messageIds` ได้ สำหรับเทิร์น observe-only ให้คืน `{ visibleReplySent: false }` หรือใช้ `createNoopChannelTurnDeliveryAdapter()`

ช่องทางที่ใช้ `runPrepared` กับ dispatcher ที่ช่องทางเป็นเจ้าของทั้งหมดจะไม่มี `ChannelTurnDeliveryAdapter` dispatcher เหล่านั้นไม่ได้เป็น durable โดยค่าเริ่มต้น ควรรักษาเส้นทางการส่งโดยตรงไว้จนกว่าจะเลือกใช้บริบทการส่งใหม่อย่างชัดเจน พร้อมเป้าหมายที่ครบถ้วน, อะแดปเตอร์ที่ replay-safe, สัญญา receipt และฮุก side-effect ของช่องทาง

ตัวช่วยความเข้ากันได้สาธารณะ เช่น `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` และตัวช่วย direct-DM ต้องรักษาพฤติกรรมเดิมระหว่างการย้ายระบบ ไม่ควรเรียกการส่ง durable ทั่วไปก่อนคอลแบ็ก `deliver` หรือ `reply` ที่ผู้เรียกเป็นเจ้าของ

## ตัวเลือกการบันทึก

ขั้นตอน record ห่อหุ้ม `recordInboundSession` ช่องทางส่วนใหญ่ใช้ค่าเริ่มต้นได้ แทนที่ผ่าน `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher จะรอขั้นตอน record หาก record throw เคอร์เนลจะรัน `onPreDispatchFailure` (เมื่อระบุให้ `runPrepared`) แล้ว throw ต่อ

## การสังเกตการณ์

แต่ละขั้นตอน emit เหตุการณ์แบบมีโครงสร้างเมื่อมีการส่งคอลแบ็ก `log`:

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

ขั้นตอนที่บันทึก: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize` หลีกเลี่ยงการบันทึกเนื้อหาดิบ ใช้ `MessageFacts.preview` สำหรับตัวอย่างสั้นที่ปกปิดข้อมูลแล้ว

## สิ่งที่ยังอยู่ภายในช่องทาง

เคอร์เนลเป็นเจ้าของการจัดลำดับงาน ช่องทางยังเป็นเจ้าของ:

- การขนส่งของแพลตฟอร์ม (Gateway, REST, websocket, polling, webhooks)
- การแก้ตัวตนและการจับคู่ชื่อแสดงผล
- คำสั่งเนทีฟ, slash commands, autocomplete, modals, buttons, voice state
- การเรนเดอร์ card, modal และ adaptive-card
- Media auth, กฎ CDN, สื่อที่เข้ารหัส, การถอดเสียง
- API สำหรับ edit, reaction, redaction และ presence
- backfill และการดึงประวัติฝั่งแพลตฟอร์ม
- โฟลว์การจับคู่ที่ต้องมีการยืนยันเฉพาะแพลตฟอร์ม

หากสองช่องทางเริ่มต้องใช้ตัวช่วยเดียวกันสำหรับหนึ่งในสิ่งเหล่านี้ ให้แยกเป็นตัวช่วย SDK ที่ใช้ร่วมกันแทนการผลักเข้าไปในเคอร์เนล

## เสถียรภาพ

`runtime.channel.turn.*` เป็นส่วนหนึ่งของพื้นผิว runtime สาธารณะของ Plugin ชนิด fact (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) และรูปทรง admission (`ChannelTurnAdmission`, `ChannelEventClass`) เข้าถึงได้ผ่าน `PluginRuntime` จาก `openclaw/plugin-sdk/core`

ใช้กฎความเข้ากันได้ย้อนหลัง: ฟิลด์ fact ใหม่เป็นแบบเพิ่มเท่านั้น, ไม่เปลี่ยนชื่อชนิด admission และชื่อ entry point ต้องคงที่ ความต้องการช่องทางใหม่ที่ต้องมีการเปลี่ยนแปลงแบบไม่ใช่การเพิ่ม ต้องผ่านกระบวนการย้ายระบบของ plugin SDK

## ที่เกี่ยวข้อง

- [การปรับโครงสร้างวงจรชีวิตข้อความ](/th/concepts/message-lifecycle-refactor) สำหรับวงจรชีวิตการส่ง/รับ/สดที่วางแผนไว้ ซึ่งจะห่อหุ้มเคอร์เนลนี้
- [การสร้าง channel plugins](/th/plugins/sdk-channel-plugins) สำหรับสัญญา channel plugin ที่กว้างกว่า
- [ตัวช่วย runtime ของ Plugin](/th/plugins/sdk-runtime) สำหรับพื้นผิว `runtime.*` อื่น ๆ
- [ส่วนภายในของ Plugin](/th/plugins/architecture-internals) สำหรับกลไก load pipeline และ registry
