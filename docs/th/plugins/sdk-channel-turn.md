---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางและต้องการวงจรชีวิตของรอบขาเข้าที่ใช้ร่วมกัน
    - คุณกำลังย้ายตัวตรวจสอบช่องทางออกจากโค้ดเชื่อมการบันทึก/การส่งต่อที่เขียนเอง
    - คุณต้องเข้าใจขั้นตอนการรับเข้า การนำเข้า การจัดประเภท การตรวจสอบล่วงหน้า การแก้ไข การบันทึก การส่งต่อ และการสรุปขั้นสุดท้าย
sidebarTitle: Channel turn
summary: runtime.channel.turn -- เคอร์เนลรอบขาเข้าที่ใช้ร่วมกัน ซึ่ง Plugin ช่องทางที่รวมมาให้และของบุคคลที่สามใช้เพื่อบันทึก ส่งต่อ และสรุปปิดรอบของเอเจนต์
title: เคอร์เนลเทิร์นของช่องทาง
x-i18n:
    generated_at: "2026-04-30T10:07:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

เคอร์เนลเทิร์นของช่องทางคือสเตตแมชชีนขาเข้าที่ใช้ร่วมกัน ซึ่งแปลงเหตุการณ์แพลตฟอร์มที่ผ่านการทำให้เป็นมาตรฐานแล้วให้เป็นเทิร์นของเอเจนต์ Plugin ช่องทางจะให้ข้อเท็จจริงของแพลตฟอร์มและคอลแบ็กสำหรับการส่งมอบ Core เป็นเจ้าของการประสานงาน: รับเข้า, จัดประเภท, ตรวจล่วงหน้า, แก้ไขข้อมูล, อนุญาต, ประกอบ, บันทึก, ส่งต่อ และสรุปขั้นสุดท้าย

ใช้สิ่งนี้เมื่อ Plugin ของคุณอยู่ในเส้นทางร้อนของข้อความขาเข้า สำหรับเหตุการณ์ที่ไม่ใช่ข้อความ (คำสั่ง slash, โมดัล, การโต้ตอบของปุ่ม, เหตุการณ์วงจรชีวิต, รีแอ็กชัน, สถานะเสียง) ให้เก็บไว้ภายใน Plugin เคอร์เนลเป็นเจ้าของเฉพาะเหตุการณ์ที่อาจกลายเป็นเทิร์นข้อความของเอเจนต์เท่านั้น

<Info>
  เข้าถึงเคอร์เนลผ่านรันไทม์ Plugin ที่ถูกฉีดเข้ามาเป็น `runtime.channel.turn.*` ประเภทรันไทม์ Plugin ถูกส่งออกจาก `openclaw/plugin-sdk/core` ดังนั้น Plugin เนทีฟของบุคคลที่สามจึงใช้จุดเข้าเหล่านี้ได้แบบเดียวกับ Plugin ช่องทางที่บันเดิลมาด้วย
</Info>

## เหตุผลที่ต้องมีเคอร์เนลร่วม

Plugin ช่องทางทำโฟลว์ขาเข้าแบบเดียวกันซ้ำ: ทำให้เป็นมาตรฐาน, กำหนดเส้นทาง, กั้นตามนโยบาย, สร้างคอนเท็กซ์, บันทึกเมทาดาทาของเซสชัน, ส่งต่อเทิร์นของเอเจนต์, สรุปสถานะการส่งมอบขั้นสุดท้าย หากไม่มีเคอร์เนลร่วม การเปลี่ยนแปลงเรื่องการกั้นจาก mention, การตอบกลับที่มองเห็นได้เฉพาะเครื่องมือ, เมทาดาทาของเซสชัน, ประวัติที่รอดำเนินการ หรือการสรุปการส่งต่อขั้นสุดท้าย ต้องถูกนำไปใช้แยกตามแต่ละช่องทาง

เคอร์เนลตั้งใจแยกแนวคิดสี่อย่างนี้ออกจากกัน:

- `ConversationFacts`: ข้อความมาจากที่ใด
- `RouteFacts`: เอเจนต์และเซสชันใดควรประมวลผลข้อความนี้
- `ReplyPlanFacts`: ควรส่งการตอบกลับที่มองเห็นได้ไปที่ใด
- `MessageFacts`: เอเจนต์ควรเห็นเนื้อหาและคอนเท็กซ์เสริมใด

Slack DM, หัวข้อ Telegram, เธรด Matrix และเซสชันหัวข้อ Feishu ล้วนแยกสิ่งเหล่านี้ในทางปฏิบัติ การถือว่าสิ่งเหล่านี้เป็นตัวระบุเดียวกันจะทำให้เกิดความคลาดเคลื่อนเมื่อเวลาผ่านไป

## วงจรชีวิตของสเตจ

เคอร์เนลรันไปป์ไลน์คงที่เดียวกันไม่ว่าช่องทางใด:

1. `ingest` -- อะแดปเตอร์แปลงเหตุการณ์แพลตฟอร์มดิบเป็น `NormalizedTurnInput`
2. `classify` -- อะแดปเตอร์ประกาศว่าเหตุการณ์นี้เริ่มเทิร์นของเอเจนต์ได้หรือไม่
3. `preflight` -- อะแดปเตอร์ทำการขจัดข้อมูลซ้ำ, self-echo, hydration, debounce, ถอดรหัส, เติมข้อเท็จจริงบางส่วนล่วงหน้า
4. `resolve` -- อะแดปเตอร์ส่งคืนเทิร์นที่ประกอบครบแล้ว (เส้นทาง, แผนการตอบกลับ, ข้อความ, การส่งมอบ)
5. `authorize` -- นำนโยบาย DM, กลุ่ม, mention และคำสั่งมาใช้กับข้อเท็จจริงที่ประกอบแล้ว
6. `assemble` -- สร้าง `FinalizedMsgContext` จากข้อเท็จจริงผ่าน `buildContext`
7. `record` -- บันทึกเมทาดาทาเซสชันขาเข้าและเส้นทางล่าสุด
8. `dispatch` -- ดำเนินการเทิร์นของเอเจนต์ผ่านตัวส่งต่อบล็อกแบบบัฟเฟอร์
9. `finalize` -- รัน `onFinalize` ของอะแดปเตอร์แม้เกิดข้อผิดพลาดในการส่งต่อ

แต่ละสเตจจะปล่อยเหตุการณ์ล็อกแบบมีโครงสร้างเมื่อมีการระบุคอลแบ็ก `log` ดู [การสังเกตการณ์](#observability)

## ชนิดการรับเข้า

เคอร์เนลจะไม่ throw เมื่อเทิร์นถูกกั้นไว้ แต่จะส่งคืน `ChannelTurnAdmission`:

| ชนิด          | เมื่อใด                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | เทิร์นถูกรับเข้า เทิร์นของเอเจนต์จะรันและใช้เส้นทางการตอบกลับที่มองเห็นได้                                                                   |
| `observeOnly` | เทิร์นรันจนจบ แต่ตัวปรับการส่งมอบไม่ส่งสิ่งใดที่มองเห็นได้ ใช้สำหรับเอเจนต์ผู้สังเกตการณ์แบบบรอดแคสต์และโฟลว์หลายเอเจนต์แบบพาสซีฟอื่น ๆ |
| `handled`     | เหตุการณ์แพลตฟอร์มถูกจัดการภายในเครื่องแล้ว (วงจรชีวิต, รีแอ็กชัน, ปุ่ม, โมดัล) เคอร์เนลข้ามการส่งต่อ                                           |
| `drop`        | เส้นทางข้าม เลือกตั้งค่า `recordHistory: true` เพื่อเก็บข้อความไว้ในประวัติกลุ่มที่รอดำเนินการ เพื่อให้ mention ในอนาคตมีคอนเท็กซ์ได้                      |

การรับเข้าอาจมาจาก `classify` (คลาสเหตุการณ์บอกว่าเริ่มเทิร์นไม่ได้), จาก `preflight` (ขจัดข้อมูลซ้ำ, self-echo, ไม่มี mention พร้อมการบันทึกประวัติ) หรือจาก `resolveTurn` เอง

## จุดเข้า

รันไทม์เปิดเผยจุดเข้าที่แนะนำสามจุด เพื่อให้อะแดปเตอร์เลือกใช้ในระดับที่ตรงกับช่องทางได้

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

ตัวช่วยรันไทม์รุ่นเก่าสองตัวยังคงพร้อมใช้งานเพื่อความเข้ากันได้กับ Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

ใช้เมื่อช่องทางของคุณสามารถแสดงโฟลว์ขาเข้าเป็น `ChannelTurnAdapter<TRaw>` ได้ อะแดปเตอร์มีคอลแบ็กสำหรับ `ingest`, `classify` แบบไม่บังคับ, `preflight` แบบไม่บังคับ, `resolveTurn` แบบบังคับ และ `onFinalize` แบบไม่บังคับ

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

`run` เป็นรูปแบบที่เหมาะเมื่อช่องทางมีตรรกะอะแดปเตอร์ขนาดเล็กและได้ประโยชน์จากการเป็นเจ้าของวงจรชีวิตผ่าน hooks

### runPrepared

ใช้เมื่อช่องทางมีตัวส่งต่อภายในที่ซับซ้อนพร้อม previews, retries, edits หรือ thread bootstrap ที่ต้องอยู่ในความเป็นเจ้าของของช่องทาง เคอร์เนลยังคงบันทึกเซสชันขาเข้าก่อนการส่งต่อ และเปิดเผย `DispatchedChannelTurnResult` ที่สม่ำเสมอ

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

ช่องทางที่มีความสามารถสูง (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) ใช้ `runPrepared` เพราะตัวส่งต่อของช่องทางเหล่านี้ประสานพฤติกรรมเฉพาะแพลตฟอร์มที่เคอร์เนลไม่ควรต้องรู้

### buildContext

ฟังก์ชันบริสุทธิ์ที่แมปชุดข้อเท็จจริงเป็น `FinalizedMsgContext` ใช้เมื่อช่องทางของคุณเขียนบางส่วนของไปป์ไลน์เอง แต่ต้องการรูปทรงคอนเท็กซ์ที่สอดคล้องกัน

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
  ตัวช่วย SDK ที่เลิกแนะนำแล้ว เช่น `dispatchInboundReplyWithBase` ยังคงเชื่อมผ่านตัวช่วยเทิร์นที่ประกอบแล้ว โค้ด Plugin ใหม่ควรใช้ `run` หรือ `runPrepared`
</Note>

## ประเภทข้อเท็จจริง

ข้อเท็จจริงที่เคอร์เนลรับจากอะแดปเตอร์ของคุณเป็นแบบไม่ผูกกับแพลตฟอร์ม ให้แปลออบเจ็กต์ของแพลตฟอร์มเป็นรูปทรงเหล่านี้ก่อนส่งให้เคอร์เนล

### NormalizedTurnInput

| ฟิลด์             | วัตถุประสงค์                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | id ข้อความที่เสถียร ใช้สำหรับการขจัดข้อมูลซ้ำและล็อก                                   |
| `timestamp`       | epoch ms แบบไม่บังคับ                                                            |
| `rawText`         | เนื้อหาตามที่ได้รับจากแพลตฟอร์ม                                           |
| `textForAgent`    | เนื้อหาที่ล้างแล้วแบบไม่บังคับสำหรับเอเจนต์ (ตัด mention, ตัดข้อความ typing)             |
| `textForCommands` | เนื้อหาแบบไม่บังคับที่ใช้สำหรับการแยกวิเคราะห์ `/command`                                    |
| `raw`             | การอ้างอิงแบบส่งผ่านแบบไม่บังคับสำหรับคอลแบ็กอะแดปเตอร์ที่ต้องใช้ออบเจ็กต์ต้นฉบับ |

### ChannelEventClass

| ฟิลด์                  | วัตถุประสงค์                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | หากเป็น false เคอร์เนลจะส่งคืน `{ kind: "handled" }`                       |
| `requiresImmediateAck` | คำใบ้สำหรับอะแดปเตอร์ที่ต้อง ACK ก่อนการส่งต่อ                      |

### SenderFacts

| ฟิลด์          | วัตถุประสงค์                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | id ผู้ส่งของแพลตฟอร์มที่เสถียร                                      |
| `name`         | ชื่อที่แสดง                                                   |
| `username`     | แฮนเดิลหากแตกต่างจาก `name`                                 |
| `tag`          | ตัวแบ่งแยกแบบ Discord หรือแท็กของแพลตฟอร์ม                    |
| `roles`        | id บทบาท ใช้สำหรับการจับคู่ allowlist ของบทบาทสมาชิก              |
| `isBot`        | จริงเมื่อผู้ส่งเป็นบอตที่รู้จัก (เคอร์เนลใช้สำหรับการทิ้ง) |
| `isSelf`       | จริงเมื่อผู้ส่งเป็นเอเจนต์ที่กำหนดค่าไว้เอง            |
| `displayLabel` | ป้ายกำกับที่เรนเดอร์ไว้ล่วงหน้าสำหรับข้อความซอง                           |

### ConversationFacts

| ฟิลด์             | วัตถุประสงค์                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, หรือ `channel`                                      |
| `id`              | id การสนทนาที่ใช้สำหรับการกำหนดเส้นทาง                                     |
| `label`           | ป้ายกำกับสำหรับมนุษย์สำหรับซอง                                         |
| `spaceId`         | ตัวระบุพื้นที่ภายนอกแบบไม่บังคับ (Slack workspace, Matrix homeserver) |
| `parentId`        | id การสนทนาภายนอกเมื่อสิ่งนี้เป็นเธรด                          |
| `threadId`        | id เธรดเมื่อข้อความนี้อยู่ภายในเธรด                       |
| `nativeChannelId` | id ช่องทางเนทีฟของแพลตฟอร์มเมื่อแตกต่างจาก id การกำหนดเส้นทาง        |
| `routePeer`       | peer ที่ใช้สำหรับการค้นหา `resolveAgentRoute`                             |

### RouteFacts

| ฟิลด์                   | วัตถุประสงค์                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | เอเจนต์ที่ควรจัดการเทิร์นนี้                         |
| `accountId`             | การแทนที่แบบไม่บังคับ (ช่องทางหลายบัญชี)                 |
| `routeSessionKey`       | คีย์เซสชันที่ใช้สำหรับการกำหนดเส้นทาง                               |
| `dispatchSessionKey`    | คีย์เซสชันที่ใช้เมื่อส่งต่อเมื่อแตกต่างจากคีย์เส้นทาง |
| `persistedSessionKey`   | คีย์เซสชันที่เขียนลงในเมทาดาทาเซสชันที่คงอยู่          |
| `parentSessionKey`      | พาเรนต์สำหรับเซสชันแบบแตกแขนง/มีเธรด                      |
| `modelParentSessionKey` | พาเรนต์ฝั่งโมเดลสำหรับเซสชันแบบแตกแขนง                    |
| `mainSessionKey`        | พินเจ้าของ DM หลักสำหรับการสนทนาโดยตรง                 |
| `createIfMissing`       | อนุญาตให้ขั้นตอนบันทึกสร้างแถวเซสชันที่ขาดหาย          |

### ReplyPlanFacts

| ฟิลด์                     | วัตถุประสงค์                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | เป้าหมายการตอบกลับเชิงตรรกะที่เขียนลงในบริบท `To`          |
| `originatingTo`           | เป้าหมายบริบทต้นทาง (`OriginatingTo`)            |
| `nativeChannelId`         | ID ช่องทางแบบเนทีฟของแพลตฟอร์มสำหรับการส่งมอบ                 |
| `replyTarget`             | ปลายทางการตอบกลับที่มองเห็นสุดท้าย หากต่างจาก `to` |
| `deliveryTarget`          | การแทนที่การส่งมอบระดับล่าง                           |
| `replyToId`               | ID ข้อความที่ถูกอ้างอิง/ยึดโยง                              |
| `replyToIdFull`           | ID แบบเต็มที่ถูกอ้างอิงเมื่อแพลตฟอร์มมีทั้งสองแบบ          |
| `messageThreadId`         | ID เธรด ณ เวลาส่งมอบ                              |
| `threadParentId`          | ID ข้อความแม่ของเธรด                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` หรือ `none`       |

### AccessFacts

`AccessFacts` บรรจุบูลีนที่ขั้นตอนอนุญาตต้องใช้ การจับคู่ตัวตนยังอยู่ในช่องทาง: เคอร์เนลใช้เฉพาะผลลัพธ์เท่านั้น

| ฟิลด์      | วัตถุประสงค์                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | การตัดสินใจอนุญาต/จับคู่/ปฏิเสธ DM และรายการ `allowFrom`                       |
| `group`    | นโยบายกลุ่ม, การอนุญาตเส้นทาง, การอนุญาตผู้ส่ง, allowlist, ข้อกำหนดการกล่าวถึง   |
| `commands` | การอนุญาตคำสั่งข้ามตัวอนุญาตที่กำหนดค่าไว้                       |
| `mentions` | ตรวจจับการกล่าวถึงได้หรือไม่ และ agent ถูกกล่าวถึงหรือไม่ |

### MessageFacts

| ฟิลด์            | วัตถุประสงค์                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | เนื้อหา envelope สุดท้าย (จัดรูปแบบแล้ว)                                |
| `rawBody`        | เนื้อหาขาเข้าดิบ                                               |
| `bodyForAgent`   | เนื้อหาที่ agent เห็น                                            |
| `commandBody`    | เนื้อหาที่ใช้สำหรับแยกวิเคราะห์คำสั่ง                                  |
| `envelopeFrom`   | ป้ายชื่อผู้ส่งที่เรนเดอร์ไว้ล่วงหน้าสำหรับ envelope                     |
| `senderLabel`    | การแทนที่แบบไม่บังคับสำหรับผู้ส่งที่เรนเดอร์                      |
| `preview`        | ตัวอย่างแบบสั้นที่ปกปิดข้อมูลแล้วสำหรับบันทึก                                |
| `inboundHistory` | รายการประวัติขาเข้าล่าสุดเมื่อช่องทางเก็บบัฟเฟอร์ไว้ |

### SupplementalContextFacts

บริบทเสริมครอบคลุมบริบทของข้อความอ้างอิง ข้อความที่ส่งต่อ และการเริ่มต้นเธรด เคอร์เนลใช้นโยบาย `contextVisibility` ที่กำหนดค่าไว้ อะแดปเตอร์ช่องทางให้เฉพาะข้อเท็จจริงและแฟล็ก `senderAllowed` เพื่อให้นโยบายข้ามช่องทางสอดคล้องกัน

### InboundMediaFacts

สื่ออยู่ในรูปข้อเท็จจริง การดาวน์โหลดของแพลตฟอร์ม การยืนยันตัวตน นโยบาย SSRF กฎ CDN และการถอดรหัสยังอยู่เฉพาะช่องทาง เคอร์เนลแมปข้อเท็จจริงไปเป็น `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` และ `MediaTranscribedIndexes`

## สัญญาของอะแดปเตอร์

สำหรับ `run` แบบเต็ม รูปแบบอะแดปเตอร์คือ:

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

`resolveTurn` คืนค่า `ChannelTurnResolved` ซึ่งเป็น `AssembledChannelTurn` พร้อมชนิดการยอมรับแบบไม่บังคับ การคืนค่า `{ admission: { kind: "observeOnly" } }` จะรันเทิร์นโดยไม่สร้างเอาต์พุตที่มองเห็น อะแดปเตอร์ยังคงเป็นเจ้าของคอลแบ็กการส่งมอบ เพียงแต่คอลแบ็กนั้นจะไม่ทำงานสำหรับเทิร์นนั้น

`onFinalize` รันกับทุกผลลัพธ์ รวมถึงข้อผิดพลาดในการ dispatch ใช้เพื่อล้างประวัติกลุ่มที่ค้างอยู่ ลบรีแอ็กชันรับทราบ หยุดตัวบ่งชี้สถานะ และ flush สถานะภายในเครื่อง

## อะแดปเตอร์การส่งมอบ

เคอร์เนลไม่เรียกแพลตฟอร์มโดยตรง ช่องทางส่ง `ChannelTurnDeliveryAdapter` ให้เคอร์เนล:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` ถูกเรียกหนึ่งครั้งต่อชิ้นส่วนการตอบกลับที่บัฟเฟอร์ไว้ คืนค่า ID ข้อความของแพลตฟอร์มเมื่อช่องทางมี เพื่อให้ dispatcher รักษาจุดยึดเธรดและแก้ไขชิ้นส่วนถัดไปได้ สำหรับเทิร์นแบบสังเกตเท่านั้น ให้คืนค่า `{ visibleReplySent: false }` หรือใช้ `createNoopChannelTurnDeliveryAdapter()`

## ตัวเลือกการบันทึก

ขั้นตอนบันทึกห่อ `recordInboundSession` ไว้ ช่องทางส่วนใหญ่ใช้ค่าเริ่มต้นได้ แทนที่ผ่าน `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher รอขั้นตอนบันทึก หาก record โยนข้อผิดพลาด เคอร์เนลจะรัน `onPreDispatchFailure` (เมื่อส่งให้ `runPrepared`) แล้วโยนข้อผิดพลาดต่อ

## การสังเกตการณ์

แต่ละขั้นตอนปล่อยเหตุการณ์แบบมีโครงสร้างเมื่อมีการระบุคอลแบ็ก `log`:

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

## สิ่งที่ยังอยู่เฉพาะช่องทาง

เคอร์เนลเป็นเจ้าของการจัดลำดับงาน ช่องทางยังคงเป็นเจ้าของ:

- ทรานสปอร์ตของแพลตฟอร์ม (gateway, REST, websocket, polling, webhooks)
- การแก้ไขตัวตนและการจับคู่ชื่อที่แสดง
- คำสั่งเนทีฟ, slash commands, autocomplete, modals, buttons, สถานะเสียง
- การเรนเดอร์การ์ด, modal และ adaptive-card
- การยืนยันตัวตนสื่อ, กฎ CDN, สื่อที่เข้ารหัส, การถอดเสียง
- API สำหรับแก้ไข, reaction, การปกปิดข้อมูล และ presence
- การ backfill และการดึงประวัติฝั่งแพลตฟอร์ม
- โฟลว์การจับคู่ที่ต้องใช้การตรวจสอบเฉพาะแพลตฟอร์ม

หากสองช่องทางเริ่มต้องใช้ helper เดียวกันสำหรับเรื่องเหล่านี้ ให้แยกเป็น helper ของ SDK ที่ใช้ร่วมกันแทนการผลักเข้าไปในเคอร์เนล

## เสถียรภาพ

`runtime.channel.turn.*` เป็นส่วนหนึ่งของพื้นผิว runtime สาธารณะของ plugin ชนิดข้อเท็จจริง (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) และรูปแบบการยอมรับ (`ChannelTurnAdmission`, `ChannelEventClass`) เข้าถึงได้ผ่าน `PluginRuntime` จาก `openclaw/plugin-sdk/core`

ใช้กฎความเข้ากันได้ย้อนหลัง: ฟิลด์ข้อเท็จจริงใหม่เป็นแบบเพิ่มได้ ชนิดการยอมรับไม่ถูกเปลี่ยนชื่อ และชื่อจุดเข้าใช้งานยังคงเสถียร ความต้องการช่องทางใหม่ที่ต้องมีการเปลี่ยนแปลงแบบไม่ใช่การเพิ่ม ต้องผ่านกระบวนการย้ายของ plugin SDK

## ที่เกี่ยวข้อง

- [การสร้าง channel plugins](/th/plugins/sdk-channel-plugins) สำหรับสัญญา channel plugin ที่กว้างกว่า
- [Helper runtime ของ plugin](/th/plugins/sdk-runtime) สำหรับพื้นผิว `runtime.*` อื่นๆ
- [รายละเอียดภายในของ plugin](/th/plugins/architecture-internals) สำหรับ load pipeline และกลไก registry
