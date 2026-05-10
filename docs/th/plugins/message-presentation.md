---
read_when:
    - การเพิ่มหรือแก้ไขการแสดงผลการ์ดข้อความ ปุ่ม หรือรายการเลือก
    - การสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบสมบูรณ์
    - การเปลี่ยนการนำเสนอของเครื่องมือข้อความหรือความสามารถในการส่ง
    - การดีบักการถดถอยในการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม ตัวเลือก ข้อความสำรอง และคำแนะนำการส่งสำหรับ Plugin ของช่องทาง
title: การนำเสนอข้อความ
x-i18n:
    generated_at: "2026-05-10T19:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

การนำเสนอข้อความคือสัญญาร่วมของ OpenClaw สำหรับ UI แชทขาออกแบบสมบูรณ์
ซึ่งช่วยให้เอเจนต์ คำสั่ง CLI โฟลว์การอนุมัติ และปลั๊กอินอธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่ Plugin ของแต่ละช่องทางเรนเดอร์เป็นรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้การนำเสนอสำหรับ UI ข้อความที่พกพาได้:

- ส่วนข้อความ
- ข้อความบริบท/ส่วนท้ายขนาดเล็ก
- เส้นแบ่ง
- ปุ่ม
- เมนูเลือก
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์เนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` เข้าไปในเครื่องมือข้อความร่วม
สิ่งเหล่านี้เป็นเอาต์พุตของเรนเดอร์เรอร์ที่ Plugin ของช่องทางเป็นเจ้าของ

## สัญญา

ผู้เขียน Plugin นำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

รูปร่าง:

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

- `value` คือค่าการกระทำของแอปพลิเคชันที่ถูกส่งกลับผ่านเส้นทางการโต้ตอบที่มีอยู่ของช่องทาง
  เมื่อช่องทางรองรับตัวควบคุมที่คลิกได้
- `url` คือปุ่มลิงก์ สามารถมีอยู่ได้โดยไม่มี `value`
- ต้องมี `label` และยังใช้ในข้อความสำรองด้วย
- `style` เป็นคำแนะนำ เรนเดอร์เรอร์ควรแมปสไตล์ที่ไม่รองรับไปยังค่าเริ่มต้นที่ปลอดภัย
  ไม่ใช่ทำให้การส่งล้มเหลว

ความหมายของการเลือก:

- `options[].value` คือค่าแอปพลิเคชันที่ถูกเลือก
- `placeholder` เป็นคำแนะนำและอาจถูกละเว้นโดยช่องทางที่ไม่มีการรองรับการเลือกแบบเนทีฟ
- หากช่องทางไม่รองรับการเลือก ข้อความสำรองจะแสดงรายการป้ายกำกับ

## ตัวอย่างผู้ผลิต

การ์ดอย่างง่าย:

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

การส่งแบบปักหมุดด้วย JSON ที่ระบุชัดเจน:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## สัญญาเรนเดอร์เรอร์

Plugin ของช่องทางประกาศการรองรับการเรนเดอร์บนอะแดปเตอร์ขาออกของตน:

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

ฟิลด์ความสามารถตั้งใจให้เป็นบูลีนอย่างง่าย ฟิลด์เหล่านี้อธิบายว่าเรนเดอร์เรอร์สามารถทำให้สิ่งใดโต้ตอบได้
ไม่ใช่ข้อจำกัดเนทีฟทุกอย่างของแพลตฟอร์ม เรนเดอร์เรอร์ยังคงเป็นเจ้าของข้อจำกัดเฉพาะแพลตฟอร์ม
เช่น จำนวนปุ่มสูงสุด จำนวนบล็อก และขนาดการ์ด

## โฟลว์การเรนเดอร์ของแกนหลัก

เมื่อ `ReplyPayload` หรือการกระทำข้อความมี `presentation` แกนหลักจะ:

1. ทำให้เพย์โหลดการนำเสนอเป็นมาตรฐาน
2. แก้ไขอะแดปเตอร์ขาออกของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. เรียก `renderPresentation` เมื่ออะแดปเตอร์สามารถเรนเดอร์เพย์โหลดได้
5. ถอยกลับไปใช้ข้อความแบบอนุรักษ์นิยมเมื่อไม่มีอะแดปเตอร์หรือไม่สามารถเรนเดอร์ได้
6. ส่งเพย์โหลดผลลัพธ์ผ่านเส้นทางการส่งของช่องทางตามปกติ
7. ใช้เมทาดาทาการส่ง เช่น `delivery.pin` หลังจากข้อความแรกที่ส่งสำเร็จ

แกนหลักเป็นเจ้าของพฤติกรรมสำรองเพื่อให้ผู้ผลิตยังคงไม่ผูกกับช่องทาง Plugin
ของช่องทางเป็นเจ้าของการเรนเดอร์เนทีฟและการจัดการการโต้ตอบ

## กฎการลดระดับ

การนำเสนอต้องส่งได้อย่างปลอดภัยบนช่องทางที่มีข้อจำกัด

ข้อความสำรองประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกะทัดรัด
- บล็อก `divider` เป็นตัวคั่นเชิงภาพ
- ป้ายกำกับปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- ป้ายกำกับตัวเลือกการเลือก

ตัวควบคุมเนทีฟที่ไม่รองรับควรลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิดใช้งานปุ่มแบบอินไลน์จะส่งข้อความสำรอง
- ช่องทางที่ไม่รองรับการเลือกจะแสดงรายการตัวเลือกการเลือกเป็นข้อความ
- ปุ่มที่มีเฉพาะ URL จะกลายเป็นปุ่มลิงก์เนทีฟหรือบรรทัด URL สำรอง
- ความล้มเหลวในการปักหมุดแบบไม่บังคับจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากมีการขอให้ปักหมุดแบบบังคับ
และช่องทางไม่สามารถปักหมุดข้อความที่ส่งได้ การส่งจะรายงานความล้มเหลว

## การแมปผู้ให้บริการ

เรนเดอร์เรอร์ที่บันเดิลอยู่ในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์เนทีฟ                | หมายเหตุ                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | คอมโพเนนต์และคอนเทนเนอร์คอมโพเนนต์ | รักษา `channelData.discord.components` แบบเดิมสำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งร่วมใหม่ควรใช้ `presentation` |
| Slack           | Block Kit                           | รักษา `channelData.slack.blocks` แบบเดิมสำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งร่วมใหม่ควรใช้ `presentation`       |
| Telegram        | ข้อความพร้อมแป้นพิมพ์อินไลน์          | ปุ่ม/การเลือกต้องใช้ความสามารถปุ่มอินไลน์สำหรับพื้นผิวเป้าหมาย มิฉะนั้นจะใช้ข้อความสำรอง                                         |
| Mattermost      | ข้อความพร้อมพร็อพแบบโต้ตอบ         | บล็อกอื่นจะลดระดับเป็นข้อความ                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | ข้อความ `message` แบบธรรมดาจะถูกรวมกับการ์ดเมื่อมีให้ทั้งคู่                                                                            |
| Feishu          | การ์ดแบบโต้ตอบ                   | ส่วนหัวการ์ดสามารถใช้ `title`; เนื้อหาหลีกเลี่ยงการทำซ้ำชื่อนั้น                                                                                  |
| ช่องทางธรรมดา  | ข้อความสำรอง                       | ช่องทางที่ไม่มีเรนเดอร์เรอร์ยังคงได้เอาต์พุตที่อ่านได้                                                                                            |

ความเข้ากันได้ของเพย์โหลดเนทีฟของผู้ให้บริการเป็นสิ่งอำนวยความสะดวกช่วงเปลี่ยนผ่านสำหรับผู้ผลิตการตอบกลับที่มีอยู่
ไม่ใช่เหตุผลในการเพิ่มฟิลด์เนทีฟร่วมใหม่

## การนำเสนอเทียบกับ InteractiveReply

`InteractiveReply` คือชุดย่อยภายในแบบเก่าที่ใช้โดยตัวช่วยการอนุมัติและการโต้ตอบ
รองรับ:

- ข้อความ
- ปุ่ม
- การเลือก

`MessagePresentation` คือสัญญาการส่งร่วมตามแบบบัญญัติ เพิ่ม:

- ชื่อ
- โทน
- บริบท
- เส้นแบ่ง
- ปุ่มที่มีเฉพาะ URL
- เมทาดาทาการส่งทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ตัวช่วยจาก `openclaw/plugin-sdk/interactive-runtime` เมื่อเชื่อมโค้ดเก่า:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรยอมรับหรือผลิต `MessagePresentation` โดยตรง

`presentationToInteractiveReply(...)` รักษาข้อความการนำเสนอที่มองเห็นได้โดยแมปชื่อ ข้อความ บริบท ปุ่ม
และการเลือกเข้าไปในรูปร่าง `InteractiveReply` แบบเก่า เรนเดอร์เรอร์คอมโพเนนต์ที่วาดบล็อกชื่อ ข้อความ
บริบท และเส้นแบ่งแบบเนทีฟอยู่แล้วควรใช้
`presentationToInteractiveControlsReply(...)` แทน จากนั้นจึงต่อท้ายเฉพาะตัวควบคุมปุ่มและการเลือก

`renderMessagePresentationFallbackText(...)` คืนค่าสตริงว่างสำหรับบล็อกการนำเสนอที่ไม่มีข้อความสำรอง
เช่น การนำเสนอที่มีเฉพาะเส้นแบ่ง ทรานสปอร์ตที่ต้องการเนื้อหาส่งที่ไม่ว่างสามารถส่ง
`emptyFallback` เพื่อเลือกใช้เนื้อหาขั้นต่ำโดยไม่เปลี่ยนสัญญาข้อความสำรองเริ่มต้น

## การปักหมุดการส่ง

การปักหมุดเป็นพฤติกรรมการส่ง ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทน
ฟิลด์เนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` ปักหมุดข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวในการปักหมุดแบบไม่บังคับจะลดระดับและคงข้อความที่ส่งไว้เหมือนเดิม
- ความล้มเหลวในการปักหมุดแบบบังคับทำให้การส่งล้มเหลว
- ข้อความที่ถูกแบ่งเป็นชิ้นจะปักหมุดชิ้นแรกที่ส่ง ไม่ใช่ชิ้นท้าย

การกระทำข้อความ `pin`, `unpin` และ `pins` แบบแมนนวลยังคงมีอยู่สำหรับข้อความที่มีอยู่
เมื่อผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## เช็กลิสต์ผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถเรนเดอร์
  หรือลดระดับการนำเสนอเชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยังอะแดปเตอร์ขาออกรันไทม์
- ใช้งาน `renderPresentation` ในโค้ดรันไทม์ ไม่ใช่โค้ดตั้งค่า Plugin ระดับควบคุม
- อย่าให้ไลบรารี UI เนทีฟอยู่ในเส้นทางตั้งค่า/แค็ตตาล็อกที่ร้อน
- รักษาข้อจำกัดของแพลตฟอร์มไว้ในเรนเดอร์เรอร์และการทดสอบ
- เพิ่มการทดสอบสำรองสำหรับปุ่มที่ไม่รองรับ การเลือก ปุ่ม URL การซ้ำของชื่อ/ข้อความ
  และการส่งแบบผสม `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุดรหัสข้อความที่ส่งได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มเนทีฟของผู้ให้บริการใหม่ผ่าน
  สกีมาการกระทำข้อความร่วม

## เอกสารที่เกี่ยวข้อง

- [CLI ข้อความ](/th/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนรีแฟกเตอร์การนำเสนอช่องทาง](/th/plan/ui-channels)
