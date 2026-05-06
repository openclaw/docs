---
read_when:
    - คุณกำลังสร้างหรือปรับโครงสร้าง Plugin ช่องทางการรับส่งข้อความ
    - คุณต้องการการส่งคำตอบสุดท้ายที่เชื่อถือได้ ใบตอบรับ การสรุปพรีวิวสดให้เป็นผลลัพธ์สุดท้าย หรือนโยบายการยืนยันการรับ
    - คุณกำลังย้ายจากไปป์ไลน์การตอบกลับแบบเดิมหรือตัวช่วยส่งต่อการตอบกลับขาเข้า
summary: API วงจรชีวิตข้อความสำหรับ Plugin ช่องทาง รวมถึงการส่งแบบคงทน ใบรับ การแสดงตัวอย่างสด นโยบายการตอบรับเมื่อได้รับข้อความ และการย้ายข้อมูลจากระบบเดิม
title: API ข้อความของช่องทาง
x-i18n:
    generated_at: "2026-05-06T09:24:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin ช่องทางควรเปิดเผยอะแดปเตอร์ `message` หนึ่งตัวจาก
`openclaw/plugin-sdk/channel-message` อะแดปเตอร์จะอธิบายวงจรชีวิตข้อความแบบเนทีฟ
ที่แพลตฟอร์มรองรับ:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

แกนหลักรับผิดชอบคิว ความคงทน นโยบายลองใหม่ทั่วไป hooks ใบรับ และเครื่องมือ
`message` ที่ใช้ร่วมกัน Plugin รับผิดชอบการเรียกส่ง/แก้ไข/ลบแบบเนทีฟ การทำให้เป้าหมายเป็นมาตรฐาน
เธรดของแพลตฟอร์ม คำพูดอ้างอิงที่เลือก แฟล็กการแจ้งเตือน สถานะบัญชี
และผลข้างเคียงเฉพาะแพลตฟอร์ม

ใช้หน้านี้ร่วมกับ [การสร้าง Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ซับพาธ `channel-message` ถูกตั้งใจให้เบาพอสำหรับไฟล์บูตสแตรป Plugin ที่เป็น hot path
เช่น `channel.ts`: โดยเปิดเผยสัญญาอะแดปเตอร์ หลักฐานความสามารถ ใบรับ
และฟาซาดความเข้ากันได้ โดยไม่โหลดการนำส่งขาออก
ตัวช่วยการนำส่งขณะรันไทม์มีให้จาก
`openclaw/plugin-sdk/channel-message-runtime` สำหรับเส้นทางโค้ด monitor/send
ที่กำลังทำ I/O ข้อความแบบอะซิงโครนัสอยู่แล้ว

## อะแดปเตอร์ขั้นต่ำ

Plugin ช่องทางใหม่ส่วนใหญ่เริ่มจากอะแดปเตอร์ขนาดเล็กได้:

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

ประกาศเฉพาะความสามารถที่อะแดปเตอร์คงรักษาไว้ได้จริงเท่านั้น ทุกความสามารถที่ประกาศ
ควรมีการทดสอบสัญญา

## บริดจ์ขาออก

หากช่องทางมีอะแดปเตอร์ `outbound` ที่เข้ากันได้อยู่แล้ว ให้เลือกสร้างอะแดปเตอร์
ข้อความจากอะแดปเตอร์นั้นแทนการทำโค้ดส่งซ้ำ:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

บริดจ์จะแปลงผลลัพธ์การส่งขาออกแบบเก่าเป็นค่า `MessageReceipt` โค้ดใหม่
ควรส่งใบรับไปตลอดทาง และสร้าง id แบบเดิมเฉพาะที่ขอบความเข้ากันได้
ด้วย `listMessageReceiptPlatformIds(...)` หรือ
`resolveMessageReceiptPrimaryId(...)`
หากไม่ได้ระบุนโยบายการรับ `createChannelMessageAdapterFromOutbound(...)`
จะใช้นโยบายการยืนยันการรับแบบ `manual` ซึ่งทำให้การยืนยันการรับของแพลตฟอร์มที่ Plugin เป็นเจ้าของ
ชัดเจน โดยไม่เปลี่ยนช่องทางที่ยืนยัน webhooks, sockets หรือ polling offsets
นอกบริบทการรับทั่วไป

## การส่งผ่านเครื่องมือข้อความ

เส้นทาง `message(action="send")` ที่ใช้ร่วมกันควรใช้วงจรชีวิตการนำส่งของแกนหลักแบบเดียวกับ
คำตอบสุดท้าย หากช่องทางต้องปรับรูปแบบเฉพาะผู้ให้บริการสำหรับการส่งของเครื่องมือ
ให้ใช้งาน `actions.prepareSendPayload(...)` แทนการส่งจาก
`actions.handleAction(...)`

`prepareSendPayload(...)` จะได้รับ `ReplyPayload` ของแกนหลักที่ทำให้เป็นมาตรฐานแล้ว พร้อมกับ
บริบท action แบบเต็ม ให้คืน payload ที่มีข้อมูลเฉพาะช่องทางใน
`payload.channelData.<channel>` แล้วให้แกนหลักเรียก `sendMessage(...)`,
`deliverOutboundPayloads(...)`, คิว write-ahead, hooks การส่งข้อความ,
การลองใหม่ การกู้คืน และการล้าง ack

คืนค่า `null` เฉพาะเมื่อการส่งไม่สามารถแทนเป็น payload ที่คงทนได้
ตัวอย่างเช่น เพราะมี component factory ที่ทำให้เป็นอนุกรมไม่ได้ แกนหลักจะคง
fallback ของ plugin action แบบเดิมไว้เพื่อความเข้ากันได้ แต่ฟีเจอร์ส่งผ่านช่องทางใหม่
ควรแสดงออกเป็นข้อมูล payload ที่คงทนได้

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
วิธีนี้คงการเรนเดอร์เฉพาะแพลตฟอร์มไว้ใน Plugin ในขณะที่แกนหลักยังคงรับผิดชอบ
การคงบันทึก การลองใหม่ การกู้คืน hooks และ ack

payload ของ `message(action="send")` ที่เตรียมแล้ว และการนำส่งคำตอบสุดท้ายแบบทั่วไปใช้
การนำส่งของแกนหลักพร้อมคิวแบบ best-effort ตามค่าเริ่มต้น คิวแบบคงทนที่เป็นข้อกำหนด
จะใช้ได้หลังจากแกนหลักตรวจสอบแล้วเท่านั้นว่าช่องทางสามารถปรับคืนการส่งที่ไม่ทราบผลลัพธ์
หลังเกิดการล่มได้ หากอะแดปเตอร์ไม่สามารถใช้งาน `reconcileUnknownSend` ได้
ให้คงเส้นทางส่งที่เตรียมไว้เป็น best-effort; แกนหลักจะยังพยายามใช้คิว write-ahead
แต่ความคงอยู่ของคิวหรือการกู้คืนจากการล่มที่ไม่แน่นอนไม่ใช่ส่วนหนึ่งของ
สัญญาการนำส่งที่บังคับใช้

## ความสามารถ final แบบคงทน

การนำส่ง final แบบคงทนเป็นการเลือกใช้รายผลข้างเคียง แกนหลักจะใช้เฉพาะ
การนำส่งแบบคงทนทั่วไปเมื่ออะแดปเตอร์ประกาศความสามารถทุกอย่างที่
payload และตัวเลือกการนำส่งต้องใช้

| ความสามารถ             | ประกาศเมื่อ                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | อะแดปเตอร์ส่งข้อความและคืนใบรับได้                                      |
| `media`                | การส่งสื่อคืนใบรับสำหรับทุกข้อความแพลตฟอร์มที่มองเห็นได้                      |
| `payload`              | อะแดปเตอร์คงความหมายของ rich reply payload ไม่ใช่แค่ข้อความและ URL สื่อหนึ่งรายการ |
| `replyTo`              | เป้าหมายการตอบกลับแบบเนทีฟไปถึงแพลตฟอร์ม                                             |
| `thread`               | เป้าหมายเธรด หัวข้อ หรือเธรดช่องทางแบบเนทีฟไปถึงแพลตฟอร์ม                  |
| `silent`               | การระงับการแจ้งเตือนไปถึงแพลตฟอร์ม                                       |
| `nativeQuote`          | เมทาดาทาคำพูดอ้างอิงที่เลือกไปถึงแพลตฟอร์ม                                        |
| `messageSendingHooks`  | hooks การส่งข้อความของแกนหลักสามารถยกเลิกหรือเขียนเนื้อหาใหม่ก่อน I/O แพลตฟอร์ม        |
| `batch`                | batch ที่เรนเดอร์แบบหลายส่วนสามารถ replay เป็นแผนคงทนเดียวได้                      |
| `reconcileUnknownSend` | อะแดปเตอร์แก้การกู้คืน `unknown_after_send` ได้โดยไม่ replay แบบสุ่ม          |
| `afterSendSuccess`     | ผลข้างเคียง after-send ภายในช่องทางทำงานหนึ่งครั้ง                                      |
| `afterCommit`          | ผลข้างเคียง after-commit ภายในช่องทางทำงานหนึ่งครั้ง                                    |

การนำส่ง final แบบ best-effort ไม่ต้องใช้ `reconcileUnknownSend`; โดยใช้
วงจรชีวิตที่ใช้ร่วมกันเมื่ออะแดปเตอร์คงความหมายที่มองเห็นได้ของ payload และ
fallback เป็น I/O แพลตฟอร์มโดยตรงหากความคงอยู่ของคิวไม่พร้อมใช้งาน การนำส่ง
final แบบคงทนที่เป็นข้อกำหนดต้องกำหนด `reconcileUnknownSend` อย่างชัดเจน หาก
อะแดปเตอร์ไม่สามารถระบุได้ว่าการส่งที่เริ่มแล้ว/ไม่ทราบสถานะไปถึงแพลตฟอร์มหรือไม่
อย่าประกาศความสามารถนั้น; แกนหลักจะปฏิเสธการนำส่งแบบคงทนที่เป็นข้อกำหนด
ก่อนเข้าคิว

เมื่อผู้เรียกต้องการการนำส่งแบบคงทน ให้คำนวณข้อกำหนดแทนการสร้าง
map เอง:

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

`messageSendingHooks` เป็นข้อกำหนดตามค่าเริ่มต้น ตั้งค่า `messageSendingHooks: false`
เฉพาะสำหรับเส้นทางที่ตั้งใจให้ไม่สามารถรัน hooks การส่งข้อความส่วนกลางได้

## สัญญาการส่งแบบคงทน

การส่ง final แบบคงทนมีความหมายที่เข้มงวดกว่าการนำส่งแบบเดิมที่ช่องทางเป็นเจ้าของ:

- สร้าง intent แบบคงทนก่อน I/O แพลตฟอร์ม
- หากการนำส่งแบบคงทนคืนผลลัพธ์ที่จัดการแล้ว อย่า fallback ไปยังการส่งแบบเดิม
- ถือว่าการยกเลิกจาก hook และผลลัพธ์ no-send เป็นสถานะสิ้นสุด
- ถือว่า `unsupported` เป็นผลลัพธ์ก่อน intent เท่านั้น
- สำหรับความคงทนที่เป็นข้อกำหนด ให้ล้มเหลวก่อน I/O แพลตฟอร์มหากคิวไม่สามารถบันทึก
  ว่าการส่งไปยังแพลตฟอร์มเริ่มแล้ว
- สำหรับการนำส่ง final ที่เป็นข้อกำหนด และการส่งเครื่องมือข้อความที่เตรียมไว้ซึ่งเป็นข้อกำหนด
  ให้ preflight `reconcileUnknownSend`; การกู้คืนต้องสามารถ ack
  ข้อความที่ส่งแล้ว หรือ replay เฉพาะหลังจากอะแดปเตอร์พิสูจน์ว่าการส่งเดิม
  ไม่เกิดขึ้น
- สำหรับ `best_effort` ความล้มเหลวในการเขียนคิวอาจ fallback ไปยัง I/O แพลตฟอร์มโดยตรง
- ส่งต่อสัญญาณยกเลิกไปยังการโหลดสื่อและการส่งของแพลตฟอร์ม
- รัน hooks after-commit หลัง queue ack; fallback โดยตรงแบบ best-effort จะรัน hooks เหล่านี้
  หลัง I/O แพลตฟอร์มสำเร็จ เพราะไม่มี commit ของคิวแบบคงทน
- คืนใบรับสำหรับ id ของข้อความแพลตฟอร์มที่มองเห็นได้ทุกข้อความ
- ใช้ `reconcileUnknownSend` เมื่อแพลตฟอร์มสามารถตรวจสอบได้ว่าการส่งที่ไม่แน่นอน
  ไปถึงผู้ใช้แล้วหรือยัง

สัญญานี้หลีกเลี่ยงการส่งซ้ำหลังเกิดการล่ม และหลีกเลี่ยงการข้าม
hooks การยกเลิกการส่งข้อความ

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

ใช้ `createMessageReceiptFromOutboundResults(...)` เมื่อปรับใช้ผลลัพธ์การส่งที่มีอยู่
ใช้ `createPreviewMessageReceipt(...)` เมื่อข้อความ live preview กลายเป็นใบรับสุดท้าย
หลีกเลี่ยงการเพิ่มฟิลด์ `messageIds` แบบ owner-local ใหม่
`ChannelDeliveryResult.messageIds` แบบเดิมยังถูกสร้างที่ขอบความเข้ากันได้

## Live preview

ช่องทางที่สตรีม draft previews หรือ progress updates ควรประกาศความสามารถ live:

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
`deliverWithFinalizableLivePreviewAdapter(...)` สำหรับการ finalization ขณะรันไทม์
finalizer จะตัดสินใจว่าคำตอบสุดท้ายจะแก้ไข preview ตรงที่เดิม ส่ง
fallback ปกติ ละทิ้งสถานะ preview ที่ค้างอยู่ เก็บการแก้ไขที่ล้มเหลวแบบกำกวมไว้
โดยไม่ทำข้อความซ้ำ และคืนใบรับสุดท้ายหรือไม่

## นโยบาย receive ack

ตัวรับขาเข้าที่ควบคุมเวลาการยืนยันการรับของแพลตฟอร์มควรประกาศ
นโยบาย receive:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

อะแดปเตอร์ที่ไม่ประกาศนโยบาย receive จะใช้ค่าเริ่มต้นเป็น:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

ใช้ค่าเริ่มต้นเมื่อแพลตฟอร์มไม่มีการตอบรับให้เลื่อนออกไป ได้ตอบรับแล้วก่อนการประมวลผลแบบอะซิงโครนัส หรือต้องใช้ความหมายการตอบสนองเฉพาะโปรโตคอล ประกาศนโยบายแบบแบ่งระยะรายการใดรายการหนึ่งเฉพาะเมื่อผู้รับใช้บริบทการรับจริง ๆ เพื่อเลื่อนการตอบรับของแพลตฟอร์มออกไป

นโยบาย:

| นโยบาย                 | ใช้เมื่อ                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | แพลตฟอร์มสามารถได้รับการตอบรับหลังจากเหตุการณ์ขาเข้าถูกแยกวิเคราะห์และบันทึกแล้ว         |
| `after_agent_dispatch` | แพลตฟอร์มควรรอจนกว่าการส่งต่อไปยัง agent จะได้รับการยอมรับแล้ว                     |
| `after_durable_send`   | แพลตฟอร์มควรรอจนกว่าการส่งมอบสุดท้ายจะมีการตัดสินใจแบบคงทน                    |
| `manual`               | Plugin เป็นเจ้าของการตอบรับ เพราะความหมายของแพลตฟอร์มไม่ตรงกับระยะทั่วไป |

ใช้ `createMessageReceiveContext(...)` ในตัวรับที่เลื่อนสถานะการตอบรับออกไป และใช้
`shouldAckMessageAfterStage(...)` เมื่อตัวรับต้องทดสอบว่าระยะหนึ่งเป็นไปตามนโยบายที่กำหนดค่าไว้หรือไม่

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

เพิ่มชุดพิสูจน์แบบ live และ receive เมื่อ adapter ประกาศฟีเจอร์เหล่านั้น การพิสูจน์ที่ขาดหายควรทำให้การทดสอบล้มเหลว แทนที่จะขยายพื้นผิวแบบคงทนอย่างเงียบ ๆ

## API ความเข้ากันได้ที่เลิกใช้แล้ว

API เหล่านี้ยังคงนำเข้าได้เพื่อความเข้ากันได้กับบุคคลที่สาม อย่าใช้สำหรับโค้ดช่องทางใหม่

| API ที่เลิกใช้แล้ว                               | สิ่งที่ใช้แทน                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` สำหรับ dispatcher เพื่อความเข้ากันได้ หรือ adapter `message` สำหรับโค้ดช่องทางใหม่ |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` จาก `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` สำหรับ dispatcher เพื่อความเข้ากันได้เท่านั้น                                       |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` สำหรับ dispatcher เพื่อความเข้ากันได้เท่านั้น                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` ร่วมกับ `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

dispatcher เพื่อความเข้ากันได้ยังสามารถใช้ `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)`, และ `createTypingCallbacks(...)` ผ่าน facade
ข้อความได้ โค้ด lifecycle ใหม่ควรหลีกเลี่ยง subpath เก่า
`channel-reply-pipeline`

## เช็กลิสต์การย้าย

1. เพิ่ม `message: defineChannelMessageAdapter(...)` หรือ
   `message: createChannelMessageAdapterFromOutbound(...)` ไปยัง Plugin ช่องทาง
2. ส่งคืน `MessageReceipt` จากการส่งข้อความ สื่อ และ payload
3. ประกาศเฉพาะความสามารถที่รองรับด้วยพฤติกรรม native และการทดสอบ
4. แทนที่แผนที่ข้อกำหนดแบบคงทนที่เขียนเองด้วย
   `deriveDurableFinalDeliveryRequirements(...)`
5. ย้ายการทำ preview finalization ผ่านตัวช่วย live preview เมื่อช่องทาง
   แก้ไขข้อความฉบับร่างในที่เดิม
6. ประกาศนโยบายการตอบรับฝั่งรับเฉพาะเมื่อตัวรับสามารถเลื่อนการตอบรับของแพลตฟอร์มออกไปได้จริง
7. เก็บตัวช่วยการ dispatch reply แบบ legacy ไว้เฉพาะที่ขอบความเข้ากันได้เท่านั้น
