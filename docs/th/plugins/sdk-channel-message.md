---
read_when:
    - คุณกำลังสร้างหรือปรับโครงสร้าง Plugin ช่องทางการส่งข้อความ
    - คุณต้องการการส่งคำตอบสุดท้ายแบบคงทน, ใบตอบรับ, การสรุปการแสดงตัวอย่างแบบสด, หรือนโยบายการยืนยันการรับ
    - คุณกำลังย้ายจากไปป์ไลน์การตอบกลับแบบเดิม หรือตัวช่วยส่งต่อการตอบกลับขาเข้า
summary: API วงจรชีวิตข้อความสำหรับ Plugin ช่องทาง รวมถึงการส่งแบบคงทน ใบตอบรับ ตัวอย่างสด นโยบายการตอบรับการรับข้อความ และการย้ายจากระบบเดิม
title: API ข้อความของช่องทาง
x-i18n:
    generated_at: "2026-05-10T19:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin ช่องทางควรเปิดเผยอะแดปเตอร์ `message` หนึ่งรายการจาก
`openclaw/plugin-sdk/channel-message` อะแดปเตอร์อธิบายวงจรชีวิตข้อความแบบเนทีฟ
ที่แพลตฟอร์มรองรับ:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

แกนหลักเป็นเจ้าของการจัดคิว ความคงทน นโยบายการลองใหม่ทั่วไป ฮุก ใบรับ และเครื่องมือ
`message` ที่ใช้ร่วมกัน Plugin เป็นเจ้าของการเรียกส่ง/แก้ไข/ลบแบบเนทีฟ
การปรับเป้าหมายให้เป็นมาตรฐาน การจัดเธรดของแพลตฟอร์ม คำพูดอ้างอิงที่เลือกไว้
แฟล็กการแจ้งเตือน สถานะบัญชี และผลข้างเคียงเฉพาะแพลตฟอร์ม

ใช้หน้านี้ร่วมกับ [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ซับพาธ `channel-message` ตั้งใจให้เบาพอสำหรับไฟล์บูตสแตรป Plugin ที่อยู่บนเส้นทางร้อน
เช่น `channel.ts`: ซับพาธนี้เปิดเผยสัญญาอะแดปเตอร์ หลักฐานความสามารถ
ใบรับ และฟาซาดความเข้ากันได้โดยไม่โหลดการนำส่งขาออก
ตัวช่วยการนำส่งขณะรันไทม์มีให้จาก
`openclaw/plugin-sdk/channel-message-runtime` สำหรับเส้นทางโค้ดมอนิเตอร์/ส่งที่
กำลังทำ I/O ข้อความแบบอะซิงโครนัสอยู่แล้ว

โค้ดส่งของช่องทางและ Plugin ใหม่ควรใช้ตัวช่วยวงจรชีวิตข้อความจาก
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` หรือ `deliverInboundReplyWithMessageSendContext`
ตัวช่วยเก่ากว่า
`deliverOutboundPayloads(...)` ใน `openclaw/plugin-sdk/outbound-runtime`
เลิกแนะนำให้ใช้แล้ว และเป็นวัสดุรองรับความเข้ากันได้/รันไทม์สำหรับภายในขาออก การกู้คืน
และอะแดปเตอร์เดิม ห้ามใช้สำหรับเส้นทางส่งของช่องทางหรือ Plugin ใหม่

`sendDurableMessageBatch(...)` ส่งคืนผลลัพธ์วงจรชีวิตที่ชัดเจน:

- `sent` - มีการนำส่งข้อความแพลตฟอร์มที่มองเห็นได้อย่างน้อยหนึ่งข้อความ
- `suppressed` - ไม่ควรถือว่าข้อความแพลตฟอร์มหายไป เหตุผลที่เสถียรรวมถึง `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` และ `no_visible_result` เดิม
- `partial_failed` - มีการนำส่งข้อความแพลตฟอร์มอย่างน้อยหนึ่งข้อความก่อนที่เพย์โหลดหรือผลข้างเคียงภายหลังจะล้มเหลว
  ผลลัพธ์รวมถึงพรีฟิกซ์ใบรับที่นำส่งแล้วพร้อมความล้มเหลว
- `failed` - ไม่มีการสร้างใบรับของแพลตฟอร์ม

ใช้ `payloadOutcomes` เมื่อแบตช์ผสมเพย์โหลดที่ส่งแล้ว ถูกระงับ และล้มเหลว
อย่าอนุมานการยกเลิกโดยฮุกด้วยการตรวจว่าอาร์เรย์การนำส่งโดยตรงแบบเก่าว่างหรือไม่

ดิสแพตเชอร์ความเข้ากันได้ที่ยังต้องใช้ดิสแพตเชอร์ตอบกลับแบบบัฟเฟอร์ควร
สร้างตัวเลือกพรีฟิกซ์การตอบกลับด้วย `createChannelMessageReplyPipeline(...)` จาก
`openclaw/plugin-sdk/channel-message` แล้วเรียก
`channel.turn.runPrepared(...)` ของรันไทม์ ซึ่งช่วยให้การบันทึกเซสชันและลำดับการดิสแพตช์
อยู่บนวงจรชีวิตเทิร์นที่ใช้ร่วมกันโดยไม่เพิ่มตัวครอบเทิร์นสาธารณะอีกตัว

## อะแดปเตอร์ขั้นต่ำ

Plugin ช่องทางใหม่ส่วนใหญ่สามารถเริ่มจากอะแดปเตอร์ขนาดเล็กได้:

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

จากนั้นแนบเข้ากับ Plugin ช่องทาง:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

ประกาศเฉพาะความสามารถที่อะแดปเตอร์รักษาไว้จริงเท่านั้น ความสามารถที่ประกาศทุกอย่าง
ควรมีการทดสอบสัญญา

## บริดจ์ขาออก

หากช่องทางมีอะแดปเตอร์ `outbound` ที่เข้ากันได้อยู่แล้ว ให้เลือกสร้าง
อะแดปเตอร์ข้อความจากอะแดปเตอร์นั้นแทนการทำโค้ดส่งซ้ำ:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

บริดจ์จะแปลงผลลัพธ์การส่งขาออกแบบเก่าเป็นค่า `MessageReceipt` โค้ดใหม่
ควรส่งต่อใบรับตั้งแต่ต้นจนจบ และสร้างรหัสเดิมเฉพาะที่ขอบความเข้ากันได้
ด้วย `listMessageReceiptPlatformIds(...)` หรือ
`resolveMessageReceiptPrimaryId(...)`
หากไม่ได้ระบุนโยบายการรับ `createChannelMessageAdapterFromOutbound(...)`
จะใช้นโยบายการยืนยันการรับแบบ `manual` ซึ่งทำให้การยืนยันแพลตฟอร์มที่ Plugin เป็นเจ้าของ
ชัดเจน โดยไม่เปลี่ยนช่องทางที่ยืนยัน Webhook ซ็อกเก็ต หรือออฟเซ็ตการโพล
นอกบริบทการรับทั่วไป

## การส่งของเครื่องมือข้อความ

เส้นทาง `message(action="send")` ที่ใช้ร่วมกันควรใช้วงจรชีวิตการนำส่งแกนหลักเดียวกัน
กับการตอบกลับสุดท้าย หากช่องทางต้องการการปรับรูปแบบเฉพาะผู้ให้บริการสำหรับ
การส่งของเครื่องมือ ให้ติดตั้ง `actions.prepareSendPayload(...)` แทนการส่งจาก
`actions.handleAction(...)`

`prepareSendPayload(...)` รับ `ReplyPayload` แกนหลักที่ปรับมาตรฐานแล้วพร้อมบริบทการดำเนินการเต็มรูปแบบ
ส่งคืนเพย์โหลดพร้อมข้อมูลเฉพาะช่องทางใน
`payload.channelData.<channel>` และปล่อยให้แกนหลักเรียก `sendMessage(...)`,
รันไทม์วงจรชีวิตข้อความ คิวแบบเขียนล่วงหน้า ฮุกการส่งข้อความ
การลองใหม่ การกู้คืน และการล้าง ack รันไทม์วงจรชีวิตอาจเรียก
`deliverOutboundPayloads(...)` ภายในเป็นวัสดุรองรับความเข้ากันได้ แต่ Plugin ช่องทาง
ไม่ควรเรียกโดยตรงสำหรับพฤติกรรมการส่งใหม่

ส่งคืน `null` เฉพาะเมื่อการส่งไม่สามารถแทนเป็นเพย์โหลดแบบคงทนได้
เช่น เพราะมีคอมโพเนนต์แฟกทอรีที่ทำให้เป็นอนุกรมไม่ได้ แกนหลักจะคง
ทางเลือกสำรองการดำเนินการของ Plugin เดิมไว้เพื่อความเข้ากันได้ แต่ฟีเจอร์การส่งของช่องทางใหม่
ควรแสดงเป็นข้อมูลเพย์โหลดแบบคงทนได้

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

จากนั้นอะแดปเตอร์ขาออกจะอ่าน `payload.channelData.demo` ภายใน `sendPayload`
สิ่งนี้ทำให้การเรนเดอร์เฉพาะแพลตฟอร์มอยู่ใน Plugin ขณะที่แกนหลักยังคงเป็นเจ้าของ
การคงไว้ การลองใหม่ การกู้คืน ฮุก และ ack

เพย์โหลด `message(action="send")` ที่เตรียมไว้และการนำส่งการตอบกลับสุดท้ายทั่วไป
ใช้การนำส่งของแกนหลักพร้อมการจัดคิวแบบพยายามเต็มที่โดยค่าเริ่มต้น การจัดคิวแบบคงทนที่จำเป็น
ใช้ได้เฉพาะหลังจากแกนหลักตรวจสอบแล้วว่าช่องทางสามารถกระทบยอดการส่งที่ผลลัพธ์
ไม่ทราบหลังจากเกิดแครชได้ หากอะแดปเตอร์ไม่สามารถติดตั้ง `reconcileUnknownSend`
ให้คงเส้นทางการส่งที่เตรียมไว้เป็นแบบพยายามเต็มที่ แกนหลักยังจะลองใช้คิวแบบเขียนล่วงหน้า
แต่การคงอยู่ของคิวหรือการกู้คืนแครชที่ไม่แน่นอนไม่ได้เป็นส่วนหนึ่งของ
สัญญาการนำส่งที่จำเป็น

## ความสามารถของการส่งสุดท้ายแบบคงทน

การนำส่งสุดท้ายแบบคงทนเป็นการเลือกใช้ต่อผลข้างเคียงแต่ละรายการ แกนหลักจะใช้เฉพาะ
การนำส่งคงทนทั่วไปเมื่ออะแดปเตอร์ประกาศทุกความสามารถที่จำเป็นต่อ
เพย์โหลดและตัวเลือกการนำส่ง

| ความสามารถ             | ประกาศเมื่อ                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | อะแดปเตอร์สามารถส่งข้อความและส่งคืนใบรับได้                                      |
| `media`                | การส่งสื่อส่งคืนใบรับสำหรับข้อความแพลตฟอร์มที่มองเห็นได้ทุกข้อความ                      |
| `payload`              | อะแดปเตอร์รักษาความหมายของเพย์โหลดตอบกลับแบบริช ไม่ใช่แค่ข้อความกับ URL สื่อหนึ่งรายการ |
| `replyTo`              | เป้าหมายการตอบกลับแบบเนทีฟไปถึงแพลตฟอร์ม                                             |
| `thread`               | เป้าหมายเธรด หัวข้อ หรือเธรดช่องทางแบบเนทีฟไปถึงแพลตฟอร์ม                  |
| `silent`               | การระงับการแจ้งเตือนไปถึงแพลตฟอร์ม                                       |
| `nativeQuote`          | เมตาดาต้าคำพูดอ้างอิงที่เลือกไว้ไปถึงแพลตฟอร์ม                                        |
| `messageSendingHooks`  | ฮุกการส่งข้อความของแกนหลักสามารถยกเลิกหรือเขียนเนื้อหาใหม่ก่อน I/O ของแพลตฟอร์ม        |
| `batch`                | แบตช์หลายส่วนที่เรนเดอร์แล้วสามารถเล่นซ้ำเป็นแผนคงทนหนึ่งรายการ                      |
| `reconcileUnknownSend` | อะแดปเตอร์สามารถแก้ไขการกู้คืน `unknown_after_send` โดยไม่เล่นซ้ำแบบไม่รู้ผล          |
| `afterSendSuccess`     | ผลข้างเคียงหลังส่งสำเร็จภายในช่องทางทำงานหนึ่งครั้ง                                      |
| `afterCommit`          | ผลข้างเคียงหลังคอมมิตภายในช่องทางทำงานหนึ่งครั้ง                                    |

การนำส่งสุดท้ายแบบพยายามเต็มที่ไม่ต้องใช้ `reconcileUnknownSend`; ใช้
วงจรชีวิตที่ใช้ร่วมกันเมื่ออะแดปเตอร์รักษาความหมายที่มองเห็นได้ของเพย์โหลด และ
ถอยกลับไปใช้ I/O แพลตฟอร์มโดยตรงหากการคงอยู่ของคิวไม่พร้อมใช้งาน
การนำส่งสุดท้ายแบบคงทนที่จำเป็นต้องระบุความต้องการ `reconcileUnknownSend` อย่างชัดเจน
หากอะแดปเตอร์ไม่สามารถระบุได้ว่าการส่งที่เริ่มแล้ว/ไม่ทราบผลไปถึงแพลตฟอร์มหรือไม่
อย่าประกาศความสามารถนั้น แกนหลักจะปฏิเสธการนำส่งคงทนที่จำเป็น
ก่อนจัดคิว

เมื่อผู้เรียกต้องการการนำส่งแบบคงทน ให้สร้างข้อกำหนดแทนการสร้าง
แมปด้วยมือ:

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

`messageSendingHooks` จำเป็นโดยค่าเริ่มต้น ตั้ง `messageSendingHooks: false`
เฉพาะสำหรับเส้นทางที่ตั้งใจให้ไม่สามารถเรียกใช้ฮุกการส่งข้อความส่วนกลางได้

## สัญญาการส่งแบบคงทน

การส่งสุดท้ายแบบคงทนมีความหมายเข้มงวดกว่าการนำส่งเดิมที่ช่องทางเป็นเจ้าของ:

- สร้าง intent แบบคงทนก่อน I/O ของแพลตฟอร์ม
- หากการนำส่งแบบคงทนส่งคืนผลลัพธ์ที่จัดการแล้ว อย่าถอยกลับไปใช้การส่งเดิม
- ถือว่าการยกเลิกโดยฮุกและผลลัพธ์แบบไม่ส่งเป็นสถานะปลายทาง
- ถือว่า `unsupported` เป็นผลลัพธ์ก่อน intent เท่านั้น
- สำหรับความคงทนที่จำเป็น ให้ล้มเหลวก่อน I/O ของแพลตฟอร์มหากคิวไม่สามารถบันทึก
  ได้ว่าการส่งของแพลตฟอร์มเริ่มแล้ว
- สำหรับการนำส่งสุดท้ายที่จำเป็นและการส่งของเครื่องมือข้อความที่เตรียมไว้ซึ่งจำเป็น
  ให้ตรวจล่วงหน้า `reconcileUnknownSend`; การกู้คืนต้องสามารถ ack ข้อความ
  ที่ส่งไปแล้ว หรือเล่นซ้ำเฉพาะหลังจากอะแดปเตอร์พิสูจน์ว่าการส่งเดิม
  ไม่ได้เกิดขึ้น
- สำหรับ `best_effort` ความล้มเหลวในการเขียนคิวอาจถอยกลับไปใช้ I/O แพลตฟอร์มโดยตรง
- ส่งต่อสัญญาณยกเลิกไปยังการโหลดสื่อและการส่งของแพลตฟอร์ม
- เรียกใช้ฮุกหลังคอมมิตหลังจาก ack คิว; ทางเลือกสำรองแบบพยายามเต็มที่โดยตรงเรียกใช้ฮุกเหล่านั้น
  หลัง I/O แพลตฟอร์มสำเร็จ เพราะไม่มีคอมมิตคิวแบบคงทน
- ส่งคืนใบรับสำหรับรหัสข้อความแพลตฟอร์มที่มองเห็นได้ทุกตัว
- ใช้ `reconcileUnknownSend` เมื่อแพลตฟอร์มสามารถตรวจสอบได้ว่าการส่งที่ไม่แน่นอน
  ไปถึงผู้ใช้แล้วหรือไม่

สัญญานี้หลีกเลี่ยงการส่งซ้ำหลังเกิดแครช และหลีกเลี่ยงการข้าม
ฮุกยกเลิกการส่งข้อความ

## ใบรับ

`MessageReceipt` คือระเบียนภายในใหม่ของสิ่งที่แพลตฟอร์มยอมรับ:

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

ใช้ `createMessageReceiptFromOutboundResults(...)` เมื่อปรับผลลัพธ์การส่งที่มีอยู่ ใช้ `createPreviewMessageReceipt(...)` เมื่อข้อความพรีวิวสดกลายเป็นใบตอบรับสุดท้าย หลีกเลี่ยงการเพิ่มฟิลด์ `messageIds` ใหม่แบบเฉพาะเจ้าของ `ChannelDeliveryResult.messageIds` แบบเดิมยังคงถูกสร้างที่ขอบความเข้ากันได้

## พรีวิวสด

ช่องทางที่สตรีมพรีวิวแบบร่างหรือการอัปเดตความคืบหน้าควรประกาศความสามารถแบบสด:

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

ใช้ `defineFinalizableLivePreviewAdapter(...)` และ
`deliverWithFinalizableLivePreviewAdapter(...)` สำหรับการทำขั้นสุดท้ายในรันไทม์ ตัวทำขั้นสุดท้ายจะตัดสินใจว่าการตอบกลับสุดท้ายจะแก้ไขพรีวิวในตำแหน่งเดิม ส่งทางเลือกสำรองปกติ ละทิ้งสถานะพรีวิวที่ค้างอยู่ เก็บการแก้ไขที่ล้มเหลวแบบกำกวมไว้โดยไม่ทำซ้ำข้อความ และคืนใบตอบรับสุดท้ายหรือไม่

## นโยบาย ack การรับ

ตัวรับขาเข้าที่ควบคุมจังหวะการตอบรับของแพลตฟอร์มควรประกาศนโยบายการรับ:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

อะแดปเตอร์ที่ไม่ประกาศนโยบายการรับจะใช้ค่าเริ่มต้นเป็น:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

ใช้ค่าเริ่มต้นเมื่อแพลตฟอร์มไม่มีการตอบรับให้เลื่อนออกไป ตอบรับก่อนการประมวลผลแบบอะซิงโครนัสอยู่แล้ว หรือต้องใช้ความหมายการตอบกลับเฉพาะโปรโตคอล ประกาศนโยบายแบบเป็นช่วงหนึ่งในรายการเฉพาะเมื่อตัวรับใช้บริบทการรับจริงเพื่อเลื่อนการตอบรับของแพลตฟอร์มออกไป

นโยบาย:

| นโยบาย                 | ใช้เมื่อ                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | แพลตฟอร์มสามารถได้รับการตอบรับหลังจากเหตุการณ์ขาเข้าถูกแยกวิเคราะห์และบันทึกแล้ว         |
| `after_agent_dispatch` | แพลตฟอร์มควรรอจนกว่าการจัดส่งไปยังเอเจนต์จะได้รับการยอมรับ                     |
| `after_durable_send`   | แพลตฟอร์มควรรอจนกว่าการส่งมอบสุดท้ายจะมีการตัดสินใจที่คงทน                    |
| `manual`               | Plugin เป็นเจ้าของการตอบรับ เพราะความหมายของแพลตฟอร์มไม่ตรงกับช่วงทั่วไป |

ใช้ `createMessageReceiveContext(...)` ในตัวรับที่เลื่อนสถานะ ack และใช้
`shouldAckMessageAfterStage(...)` เมื่อตัวรับต้องทดสอบว่าช่วงหนึ่งตอบสนองนโยบายที่กำหนดค่าไว้แล้วหรือไม่

## การทดสอบสัญญา

การประกาศความสามารถเป็นส่วนหนึ่งของสัญญา Plugin ให้รองรับด้วยการทดสอบ:

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

เพิ่มชุดการพิสูจน์แบบสดและการรับเมื่ออะแดปเตอร์ประกาศฟีเจอร์เหล่านั้น การพิสูจน์ที่ขาดหายควรทำให้การทดสอบล้มเหลว แทนที่จะขยายพื้นผิวที่คงทนอย่างเงียบ ๆ

## API ความเข้ากันได้ที่เลิกใช้แล้ว

API เหล่านี้ยังคงนำเข้าได้เพื่อความเข้ากันได้กับบุคคลที่สาม อย่าใช้สำหรับโค้ดช่องทางใหม่

| API ที่เลิกใช้แล้ว                               | สิ่งที่ใช้แทน                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` สำหรับตัวจัดส่งความเข้ากันได้ หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่        |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` รวมกับ `channel.turn.runPrepared(...)` หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่ |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` รวมกับ `channel.turn.runPrepared(...)` หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่ |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` รวมกับ `channel.turn.runPrepared(...)` หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่ |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` หรือ `deliverInboundReplyWithMessageSendContext(...)` จาก `channel-message-runtime`          |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` จาก `openclaw/plugin-sdk/channel-message-runtime`                        |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` รวมกับ `channel.turn.runPrepared(...)` หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่ |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` รวมกับ `channel.turn.runPrepared(...)` หรืออะแดปเตอร์ `message` สำหรับโค้ดช่องทางใหม่ |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` รวมกับ `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

ตัวจัดส่งความเข้ากันได้ยังคงใช้ `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` และ `createTypingCallbacks(...)` ผ่าน facade ของข้อความได้ โค้ดวงจรชีวิตใหม่ควรหลีกเลี่ยง subpath `channel-reply-pipeline` เก่า

## รายการตรวจสอบการย้าย

1. เพิ่ม `message: defineChannelMessageAdapter(...)` หรือ
   `message: createChannelMessageAdapterFromOutbound(...)` ไปยัง Plugin ช่องทาง
2. คืน `MessageReceipt` จากการส่งข้อความ สื่อ และ payload
3. ประกาศเฉพาะความสามารถที่รองรับด้วยพฤติกรรมเนทีฟและการทดสอบ
4. แทนที่แผนที่ข้อกำหนดแบบคงทนที่เขียนเองด้วย
   `deriveDurableFinalDeliveryRequirements(...)`
5. ย้ายการทำพรีวิวขั้นสุดท้ายผ่านตัวช่วยพรีวิวสดเมื่อช่องทางแก้ไขข้อความแบบร่างในตำแหน่งเดิม
6. ประกาศนโยบาย ack การรับเฉพาะเมื่อตัวรับสามารถเลื่อนการตอบรับของแพลตฟอร์มได้จริง
7. เก็บตัวช่วยจัดส่งการตอบกลับแบบเดิมไว้เฉพาะที่ขอบความเข้ากันได้
