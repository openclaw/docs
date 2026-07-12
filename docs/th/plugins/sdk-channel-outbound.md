---
read_when:
    - คุณกำลังสร้างหรือปรับโครงสร้างเส้นทางการส่งของ Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการการส่งคำตอบสุดท้ายที่เชื่อถือได้ ใบตอบรับ การปิดการแสดงตัวอย่างแบบสดให้เสร็จสมบูรณ์ หรือนโยบายการยืนยันการรับ
    - คุณกำลังย้ายจากตัวช่วยส่งต่อการตอบกลับแบบเดิม หรือจาก channel-message หรือ channel-message-runtime
summary: 'API วงจรชีวิตข้อความขาออกสำหรับ Plugin ช่องทาง: อะแดปเตอร์ ใบตอบรับ การส่งแบบคงทน การแสดงตัวอย่างแบบสด และตัวช่วยไปป์ไลน์การตอบกลับ'
title: API ขาออกของช่องทาง
x-i18n:
    generated_at: "2026-07-12T16:33:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin ช่องทางเปิดเผยพฤติกรรมการส่งข้อความออกจาก
`openclaw/plugin-sdk/channel-outbound` ใช้
`openclaw/plugin-sdk/channel-inbound` สำหรับการประสานงานด้านการรับ/บริบท/การส่งต่อ

แกนหลักรับผิดชอบการจัดคิว ความคงทน นโยบายการลองใหม่ทั่วไป ฮุก ใบรับ และ
เครื่องมือ `message` ที่ใช้ร่วมกัน ส่วน Plugin รับผิดชอบการเรียกใช้การส่ง/แก้ไข/ลบแบบเนทีฟ
การปรับเป้าหมายให้เป็นมาตรฐาน เธรดของแพลตฟอร์ม ข้อความอ้างอิงที่เลือก
แฟล็กการแจ้งเตือน สถานะบัญชี และผลข้างเคียงเฉพาะแพลตฟอร์ม

## อะแดปเตอร์

Plugin ส่วนใหญ่กำหนดอะแดปเตอร์ `message` หนึ่งตัว:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

ประกาศเฉพาะความสามารถที่การขนส่งแบบเนทีฟสามารถรักษาไว้ได้จริง ครอบคลุม
ความสามารถด้านการส่ง ใบรับ การแสดงตัวอย่างสด และการยืนยันการรับแต่ละรายการที่ประกาศ
ด้วยตัวช่วยสัญญาที่ส่งออกจากพาธย่อยนี้

## การปรับข้อความธรรมดาให้ปลอดภัย

ใช้ `sanitizeForPlainText(...)` เมื่ออะแดปเตอร์ขาออกจำเป็นต้องแปลง
แท็กการจัดรูปแบบ HTML ที่รองรับเป็นมาร์กอัปข้อความแบบเบา ค่าเริ่มต้นจะคง
เครื่องหมายตัวหนาและขีดฆ่าแบบแชตที่มีอยู่ ส่ง
`{ style: "markdown" }` เฉพาะเมื่อช่องทางจะวิเคราะห์ผลลัพธ์ซ้ำเป็น Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

รูปแบบ Markdown ใช้ `**bold**` และ `~~strikethrough~~`; ตัวเอียงและโค้ดแบบอินไลน์
จะคงเครื่องหมาย `_italic_` และแบ็กทิกไว้ในทั้งสองรูปแบบ เลือกรูปแบบที่
ขอบเขตของช่องทางแทนการเขียนข้อความเครื่องหมายใหม่หลังการปรับให้ปลอดภัย

## หลักฐานการส่งมอบ

`MessageReceipt` บันทึกผลลัพธ์ที่อะแดปเตอร์ช่องทางส่งคืน ตัวระบุข้อความของ
แพลตฟอร์มที่เป็นรูปธรรมแสดงว่าพาธการส่งของแพลตฟอร์มยอมรับข้อความแล้ว
แต่ไม่ได้พิสูจน์ว่าอุปกรณ์ของผู้รับแสดงหรืออ่านข้อความนั้นแล้ว
ใบรับที่ไม่มีตัวระบุข้อความของแพลตฟอร์มเป็นเพียงข้อมูลเมตาใบรับภายในระบบ
ช่องทางที่มีใบรับการอ่านหรือสถานะการส่งถึงอุปกรณ์ควรติดตามข้อเท็จจริงเหล่านั้น
ผ่านพาธเฉพาะของช่องทางที่แยกต่างหาก

หากอะแดปเตอร์ช่องทางสามารถพิสูจน์ได้ว่าการลองใหม่หลังเกิดความล้มเหลวไม่อาจทำให้
การส่งที่ผู้รับมองเห็นเกิดซ้ำ และยังไม่มีการเรียกที่สามารถทำให้เสร็จสิ้นเริ่มต้นขึ้น ให้โยน
`new PlatformMessageNotDispatchedError("...", { cause: error })` จาก
`openclaw/plugin-sdk/error-runtime` จากนั้นแกนหลักจะสามารถล้างหลักฐาน
ความพยายามส่งที่ค้างอยู่และลองเจตนาที่อยู่ในคิวใหม่ได้อย่างปลอดภัย เฉพาะอะแดปเตอร์
ที่เป็นเจ้าของขอบเขตการส่งต่อขั้นสุดท้ายเท่านั้นที่อาจยืนยันเช่นนี้ ห้ามใช้เครื่องหมายนี้หลังจาก
การเรียกทำให้เสร็จสิ้น/ส่งเริ่มต้นขึ้น หรือเมื่อการเรียกดังกล่าวส่งคืนผลลัพธ์ที่คลุมเครือ
การทำเครื่องหมายผิดอาจทำให้ข้อความซ้ำ

## อะแดปเตอร์ขาออกที่มีอยู่

หากช่องทางมีอะแดปเตอร์ `outbound` ที่เข้ากันได้อยู่แล้ว ให้สร้างอะแดปเตอร์
ข้อความจากอะแดปเตอร์นั้นแทนการทำโค้ดส่งซ้ำ:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## การส่งแบบคงทน

ตัวช่วยส่งขณะทำงานอยู่ใน `channel-outbound` เช่นกัน:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- ตัวช่วยการสตรีมแบบร่าง/ความคืบหน้า เช่น `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` ส่งคืนผลลัพธ์ที่ระบุชัดเจนหนึ่งรายการ:

| ผลลัพธ์          | ความหมาย                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | พาธการส่งของแพลตฟอร์มยอมรับข้อความแพลตฟอร์มที่มองเห็นได้อย่างน้อยหนึ่งข้อความ            |
| `suppressed`     | ไม่ควรถือว่ามีข้อความแพลตฟอร์มใดขาดหาย                                        |
| `partial_failed` | แพลตฟอร์มยอมรับข้อความแพลตฟอร์มอย่างน้อยหนึ่งข้อความก่อนที่เพย์โหลดหรือผลข้างเคียงถัดมาจะล้มเหลว |
| `failed`         | ไม่มีการสร้างใบรับจากแพลตฟอร์ม                                                        |

ใช้ `payloadOutcomes` เมื่อแบตช์มีเพย์โหลดที่ส่งแล้ว ถูกระงับ และล้มเหลว
ผสมกัน อย่าอนุมานการยกเลิกฮุกจากผลลัพธ์การส่งโดยตรงแบบเดิมที่ว่างเปล่า

## การอนุมัติการส่งมอบแบบเลื่อนเวลา

ใช้ `message.durableFinal.admitDeferredDelivery(...)` เมื่อบัญชีที่แก้ไขแล้ว
ไม่สามารถยอมรับการส่งขาออกหรือการส่งแบบเลื่อนเวลาที่แกนหลักจัดการได้อย่างปลอดภัย แกนหลักเรียก
ฮุกนี้แบบซิงโครนัสก่อนงานขาออกสด รวมถึงพาธที่ข้ามการบันทึกคิว
และเรียกอีกครั้งก่อนเล่นเจตนาที่กู้คืนแล้วซ้ำ บริบทประกอบด้วย `cfg`, `channel`,
`to`, `accountId` และ `phase` ที่มีค่าเป็น `live` หรือ
`recovery`

ส่งคืน `{ status: "allowed" }` เพื่อดำเนินการต่อ ส่งคืน
`{ status: "permanent_rejection", reason }` เมื่อห้ามบันทึก
ส่งโดยตรง หรือเล่นการส่งมอบซ้ำ การปฏิเสธแบบสดจะทำให้ล้มเหลวก่อนการสร้างคิว
ฮุกข้อความ หรืองานของแพลตฟอร์ม การปฏิเสธระหว่างการกู้คืนจะทำเครื่องหมายระเบียน
ในคิวว่าล้มเหลว และข้ามการกระทบยอดกับการเล่นซ้ำ การละฮุกนี้ไว้
หมายถึงอนุญาต

ฮุกนี้เป็นการตัดสินใจอนุมัติแบบซิงโครนัส ไม่ใช่พาธการส่ง อ่านเฉพาะ
การกำหนดค่าหรือสถานะรันไทม์ที่โหลดไว้แล้ว ห้ามดำเนินการเครือข่าย ระบบไฟล์ หรือ
I/O แบบอะซิงโครนัสอื่น ๆ การทดสอบสัญญาควรทดสอบทั้งสองเฟสและ
ผลลัพธ์ทั้งสองรูปแบบผ่าน `ChannelMessageDurableFinalAdapter` จาก
`openclaw/plugin-sdk/channel-outbound`

## การส่งต่อเพื่อความเข้ากันได้

ประกอบการส่งต่อการตอบกลับขาเข้าผ่าน `dispatchChannelInboundReply(...)`
จาก `channel-inbound` เก็บการส่งมอบของแพลตฟอร์มไว้ในอะแดปเตอร์การส่งมอบ ใช้
`channel-outbound` สำหรับอะแดปเตอร์ข้อความ การส่งแบบคงทน ใบรับ การแสดงตัวอย่างสด
และตัวเลือกไปป์ไลน์การตอบกลับ
