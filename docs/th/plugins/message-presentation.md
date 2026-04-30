---
read_when:
    - การเพิ่มหรือแก้ไขการแสดงผลการ์ดข้อความ ปุ่ม หรือเมนูเลือก
    - การสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบริช
    - การเปลี่ยนการนำเสนอเครื่องมือข้อความหรือความสามารถในการนำส่ง
    - การดีบักการถดถอยในการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม เมนูเลือก ข้อความสำรอง และคำแนะนำการส่งสำหรับ Plugin ช่องทาง
title: การแสดงข้อความ
x-i18n:
    generated_at: "2026-04-30T10:07:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

การนำเสนอข้อความคือสัญญาที่ใช้ร่วมกันของ OpenClaw สำหรับ UI แชทขาออกแบบริช
ช่วยให้เอเจนต์, คำสั่ง CLI, โฟลว์การอนุมัติ และ Plugin อธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่ Plugin ของแต่ละช่องทางเรนเดอร์เป็นรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้การนำเสนอสำหรับ UI ข้อความแบบพกพาได้:

- ส่วนข้อความ
- ข้อความบริบท/ส่วนท้ายขนาดเล็ก
- เส้นแบ่ง
- ปุ่ม
- เมนูเลือก
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์เนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` ลงในเครื่องมือ
ข้อความที่ใช้ร่วมกัน สิ่งเหล่านั้นคือเอาต์พุตของตัวเรนเดอร์ที่ Plugin ของช่องทางเป็นเจ้าของ

## สัญญา

ผู้เขียน Plugin นำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

รูปทรง:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

ความหมายของปุ่ม:

- `value` คือค่าการดำเนินการของแอปพลิเคชันที่ถูกส่งกลับผ่านเส้นทางการโต้ตอบเดิมของช่องทาง
  เมื่อช่องทางรองรับตัวควบคุมที่คลิกได้
- `url` คือปุ่มลิงก์ สามารถมีได้โดยไม่มี `value`
- ต้องมี `label` และยังใช้ในข้อความสำรองด้วย
- `style` เป็นเพียงคำแนะนำ ตัวเรนเดอร์ควรแมปสไตล์ที่ไม่รองรับไปยังค่าเริ่มต้น
  ที่ปลอดภัย ไม่ใช่ทำให้การส่งล้มเหลว

ความหมายของการเลือก:

- `options[].value` คือค่าของแอปพลิเคชันที่ถูกเลือก
- `placeholder` เป็นเพียงคำแนะนำ และอาจถูกละเว้นโดยช่องทางที่ไม่มีการรองรับ
  การเลือกแบบเนทีฟ
- หากช่องทางไม่รองรับการเลือก ข้อความสำรองจะแสดงรายการป้ายกำกับ

## ตัวอย่างฝั่งผู้ผลิต

การ์ดแบบง่าย:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

ปุ่มลิงก์ที่มีเฉพาะ URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

เมนูเลือก:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

การส่งด้วย CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

การส่งแบบปักหมุด:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

การส่งแบบปักหมุดด้วย JSON แบบชัดเจน:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## สัญญาของตัวเรนเดอร์

Plugin ของช่องทางประกาศการรองรับการเรนเดอร์บนอะแดปเตอร์ขาออก:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

ฟิลด์ความสามารถเป็นบูลีนแบบเรียบง่ายโดยตั้งใจ ฟิลด์เหล่านี้อธิบายว่าตัวเรนเดอร์
ทำให้อะไรโต้ตอบได้ ไม่ใช่ขีดจำกัดทุกอย่างของแพลตฟอร์มเนทีฟ ตัวเรนเดอร์ยังคง
เป็นเจ้าของขีดจำกัดเฉพาะแพลตฟอร์ม เช่น จำนวนปุ่มสูงสุด, จำนวนบล็อก และ
ขนาดการ์ด

## โฟลว์การเรนเดอร์ของแกนหลัก

เมื่อ `ReplyPayload` หรือการดำเนินการข้อความมี `presentation` แกนหลักจะ:

1. ทำให้เพย์โหลดการนำเสนอเป็นรูปแบบมาตรฐาน
2. ระบุอะแดปเตอร์ขาออกของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. เรียก `renderPresentation` เมื่ออะแดปเตอร์สามารถเรนเดอร์เพย์โหลดได้
5. ถอยกลับไปใช้ข้อความแบบระมัดระวังเมื่อไม่มีอะแดปเตอร์หรือไม่สามารถเรนเดอร์ได้
6. ส่งเพย์โหลดผลลัพธ์ผ่านเส้นทางการส่งของช่องทางตามปกติ
7. ใช้เมตาดาต้าการส่ง เช่น `delivery.pin` หลังจากข้อความแรกถูกส่งสำเร็จ

แกนหลักเป็นเจ้าของพฤติกรรมสำรองเพื่อให้ผู้ผลิตยังคงไม่ผูกกับช่องทางใดช่องทางหนึ่ง
Plugin ของช่องทางเป็นเจ้าของการเรนเดอร์เนทีฟและการจัดการการโต้ตอบ

## กฎการลดระดับ

การนำเสนอต้องปลอดภัยสำหรับการส่งบนช่องทางที่มีข้อจำกัด

ข้อความสำรองประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกระชับ
- บล็อก `divider` เป็นตัวคั่นแบบมองเห็นได้
- ป้ายกำกับปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- ป้ายกำกับตัวเลือกของการเลือก

ตัวควบคุมเนทีฟที่ไม่รองรับควรลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิดใช้ปุ่มอินไลน์จะส่งข้อความสำรอง
- ช่องทางที่ไม่รองรับการเลือกจะแสดงรายการตัวเลือกเป็นข้อความ
- ปุ่มที่มีเฉพาะ URL จะกลายเป็นปุ่มลิงก์เนทีฟหรือบรรทัด URL สำรอง
- ความล้มเหลวของการปักหมุดแบบไม่บังคับจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากขอให้ปักหมุดเป็น
ข้อกำหนดบังคับ และช่องทางไม่สามารถปักหมุดข้อความที่ส่งได้ การส่งจะรายงานความล้มเหลว

## การแมปผู้ให้บริการ

ตัวเรนเดอร์ที่รวมมาในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์แบบเนทีฟ                | หมายเหตุ                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | คอมโพเนนต์และคอนเทนเนอร์คอมโพเนนต์ | รักษา `channelData.discord.components` แบบเดิมสำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation` |
| Slack           | Block Kit                           | รักษา `channelData.slack.blocks` แบบเดิมสำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation`       |
| Telegram        | ข้อความพร้อมแป้นพิมพ์อินไลน์          | ปุ่ม/การเลือกต้องใช้ความสามารถปุ่มอินไลน์สำหรับพื้นผิวเป้าหมาย มิฉะนั้นจะใช้ข้อความสำรอง                                         |
| Mattermost      | ข้อความพร้อมพร็อพแบบโต้ตอบ         | บล็อกอื่น ๆ จะลดระดับเป็นข้อความ                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | ข้อความ `message` แบบธรรมดาจะถูกรวมกับการ์ดเมื่อมีทั้งสองอย่าง                                                                            |
| Feishu          | การ์ดแบบโต้ตอบ                   | ส่วนหัวการ์ดสามารถใช้ `title`; เนื้อหาจะหลีกเลี่ยงการทำซ้ำชื่อนั้น                                                                                  |
| ช่องทางธรรมดา  | ข้อความสำรอง                       | ช่องทางที่ไม่มีตัวเรนเดอร์ยังคงได้เอาต์พุตที่อ่านได้                                                                                            |

ความเข้ากันได้ของเพย์โหลดเนทีฟของผู้ให้บริการเป็นตัวช่วยเปลี่ยนผ่านสำหรับ
ผู้ผลิตการตอบกลับที่มีอยู่ ไม่ใช่เหตุผลในการเพิ่มฟิลด์เนทีฟที่ใช้ร่วมกันใหม่

## Presentation เทียบกับ InteractiveReply

`InteractiveReply` คือชุดย่อยภายในรุ่นเก่าที่ใช้โดยตัวช่วยการอนุมัติและการโต้ตอบ
รองรับ:

- ข้อความ
- ปุ่ม
- การเลือก

`MessagePresentation` คือสัญญาการส่งแบบใช้ร่วมกันหลัก เพิ่ม:

- ชื่อ
- โทน
- บริบท
- เส้นแบ่ง
- ปุ่มที่มีเฉพาะ URL
- เมตาดาต้าการส่งทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ตัวช่วยจาก `openclaw/plugin-sdk/interactive-runtime` เมื่อเชื่อมโค้ดเก่า:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง

## การปักหมุดการส่ง

การปักหมุดเป็นพฤติกรรมการส่ง ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทน
ฟิลด์เนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` ปักหมุดข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวของการปักหมุดแบบไม่บังคับจะลดระดับและปล่อยให้ข้อความที่ส่งแล้วยังคงอยู่
- ความล้มเหลวของการปักหมุดแบบบังคับจะทำให้การส่งล้มเหลว
- ข้อความที่แบ่งเป็นชิ้นจะปักหมุดชิ้นแรกที่ส่ง ไม่ใช่ชิ้นท้าย

การดำเนินการข้อความแบบแมนนวล `pin`, `unpin` และ `pins` ยังคงมีอยู่สำหรับ
ข้อความเดิมเมื่อผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## เช็กลิสต์ผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถ
  เรนเดอร์หรือลดระดับการนำเสนอเชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยังอะแดปเตอร์ขาออกของรันไทม์
- ใช้ `renderPresentation` ในโค้ดรันไทม์ ไม่ใช่โค้ดตั้งค่า Plugin
  ของ control-plane
- เก็บไลบรารี UI เนทีฟออกจากเส้นทางตั้งค่า/แคตตาล็อกที่ร้อน
- รักษาขีดจำกัดของแพลตฟอร์มในตัวเรนเดอร์และการทดสอบ
- เพิ่มการทดสอบสำรองสำหรับปุ่มที่ไม่รองรับ, การเลือก, ปุ่ม URL, การทำซ้ำชื่อ/ข้อความ
  และการส่งแบบผสม `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุด id ข้อความที่ส่งได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มเนทีฟของผู้ให้บริการใหม่ผ่าน
  สคีมาการดำเนินการข้อความที่ใช้ร่วมกัน

## เอกสารที่เกี่ยวข้อง

- [CLI ข้อความ](/th/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนรีแฟกเตอร์การนำเสนอช่องทาง](/th/plan/ui-channels)
