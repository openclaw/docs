---
read_when:
    - การเพิ่มหรือแก้ไขการแสดงผลการ์ดข้อความ ปุ่ม หรือเมนูเลือก
    - การสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบสมบูรณ์
    - การเปลี่ยนการนำเสนอเครื่องมือข้อความหรือความสามารถในการส่งข้อความ
    - การดีบักรีเกรสชันการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม ตัวเลือก ข้อความสำรอง และคำใบ้การส่งสำหรับ Plugin ช่องทาง
title: การนำเสนอข้อความ
x-i18n:
    generated_at: "2026-06-27T17:57:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

การนำเสนอข้อความคือสัญญาร่วมของ OpenClaw สำหรับ UI แชตขาออกแบบสมบูรณ์
ช่วยให้เอเจนต์ คำสั่ง CLI โฟลว์การอนุมัติ และ Plugin ต่างๆ อธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่ Plugin ช่องทางแต่ละตัวเรนเดอร์รูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้การนำเสนอสำหรับ UI ข้อความแบบพกพา:

- ส่วนข้อความ
- ข้อความบริบท/ส่วนท้ายขนาดเล็ก
- เส้นคั่น
- ปุ่ม
- เมนูเลือก
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์เนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` ลงในเครื่องมือ
ข้อความร่วม สิ่งเหล่านั้นคือเอาต์พุตของตัวเรนเดอร์ที่ Plugin ช่องทางเป็นเจ้าของ

## สัญญา

ผู้เขียน Plugin นำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

รูปแบบ:

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` รันคำสั่งสแลชเนทีฟผ่านเส้นทางคำสั่งของแกนหลัก
  ใช้สิ่งนี้สำหรับปุ่มและเมนูคำสั่งในตัว
- `action.type: "callback"` พกข้อมูล Plugin แบบทึบผ่านเส้นทางการโต้ตอบของช่องทาง
  Plugin ช่องทางต้องไม่ตีความข้อมูลคอลแบ็กใหม่เป็นคำสั่งสแลช
- `value` คือค่าคอลแบ็กแบบทึบเดิม ตัวควบคุมใหม่ควรใช้ `action`
  เพื่อให้ Plugin ช่องทางสามารถแมปคำสั่งและคอลแบ็กได้โดยไม่ต้องเดาจากข้อความ
- `url` คือปุ่มลิงก์ สามารถมีอยู่ได้โดยไม่มี `value`
- `webApp` อธิบายปุ่มเว็บแอปเนทีฟของช่องทาง Telegram เรนเดอร์สิ่งนี้
  เป็น `web_app` และรองรับเฉพาะในแชตส่วนตัวเท่านั้น `web_app` ยังคง
  ถูกยอมรับในเพย์โหลด JSON แบบหลวมเพื่อความเข้ากันได้ แต่ผู้ผลิต TypeScript
  ควรใช้ `webApp`
- ต้องมี `label` และยังใช้ในข้อความสำรองด้วย
- `style` เป็นคำแนะนำ ตัวเรนเดอร์ควรแมปสไตล์ที่ไม่รองรับไปยังค่าเริ่มต้น
  ที่ปลอดภัย ไม่ใช่ทำให้การส่งล้มเหลว
- `priority` เป็นทางเลือก เมื่อช่องทางประกาศขีดจำกัดแอ็กชันและต้องตัด
  ตัวควบคุม แกนหลักจะเก็บปุ่มที่มีลำดับความสำคัญสูงกว่าก่อน และคงลำดับเดิม
  ของปุ่มที่มีลำดับความสำคัญเท่ากัน เมื่อควบคุมทั้งหมดพอดี จะคงลำดับที่ผู้เขียนกำหนดไว้
- `disabled` เป็นทางเลือก ช่องทางต้องเลือกใช้ด้วย `supportsDisabled`; มิฉะนั้น
  แกนหลักจะลดระดับตัวควบคุมที่ปิดใช้งานเป็นข้อความสำรองที่ไม่โต้ตอบ
- `reusable` เป็นทางเลือก ช่องทางที่รองรับคอลแบ็กเนทีฟแบบใช้ซ้ำได้อาจ
  คงแอ็กชันไว้หลังการโต้ตอบสำเร็จ ใช้สำหรับแอ็กชันที่ทำซ้ำได้หรือเป็น idempotent
  เช่น รีเฟรช ตรวจสอบ หรือดูรายละเอียดเพิ่มเติม; ปล่อยว่างไว้สำหรับการอนุมัติ
  แบบครั้งเดียวปกติและแอ็กชันที่ทำลายข้อมูล

ความหมายของการเลือก:

- `options[].action` มีความหมายของคำสั่ง/คอลแบ็กเหมือนกับ `action` ของปุ่ม
- `options[].value` คือค่าแอปพลิเคชันที่เลือกแบบเดิม
- `placeholder` เป็นคำแนะนำ และช่องทางที่ไม่มีการรองรับการเลือกแบบเนทีฟอาจละเว้นได้
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

ปุ่ม Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

การส่งผ่าน CLI:

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

การส่งแบบปักหมุดด้วย JSON ชัดเจน:

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

Plugin ช่องทางประกาศการรองรับการเรนเดอร์บนอะแดปเตอร์ขาออกของตน:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

บูลีนความสามารถอธิบายสิ่งที่ตัวเรนเดอร์สามารถทำให้โต้ตอบได้ `limits`
ซึ่งเป็นทางเลือกอธิบายกรอบทั่วไปที่แกนหลักสามารถปรับได้ก่อนเรียกตัวเรนเดอร์:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

แกนหลักใช้ขีดจำกัดทั่วไปกับตัวควบคุมเชิงความหมายก่อนเรนเดอร์ ตัวเรนเดอร์
ยังคงเป็นเจ้าของการตรวจสอบและการตัดทอนเฉพาะผู้ให้บริการขั้นสุดท้ายสำหรับจำนวนบล็อกเนทีฟ
ขนาดการ์ด ขีดจำกัด URL และลักษณะเฉพาะของผู้ให้บริการที่ไม่สามารถแสดงใน
สัญญาทั่วไปได้ หากขีดจำกัดลบทุกตัวควบคุมออกจากบล็อก แกนหลักจะเก็บ
ป้ายกำกับไว้เป็นข้อความบริบทที่ไม่โต้ตอบ เพื่อให้ข้อความที่ส่งยังมี
ทางเลือกสำรองที่มองเห็นได้

## โฟลว์การเรนเดอร์ของแกนหลัก

เมื่อ `ReplyPayload` หรือแอ็กชันข้อความมี `presentation` แกนหลักจะ:

1. ทำให้เพย์โหลดการนำเสนอเป็นมาตรฐาน
2. แก้ไขอะแดปเตอร์ขาออกของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. ใช้ขีดจำกัดความสามารถทั่วไป เช่น จำนวนแอ็กชัน ความยาวป้ายกำกับ และ
   จำนวนตัวเลือกการเลือก เมื่ออะแดปเตอร์ประกาศไว้
5. เรียก `renderPresentation` เมื่ออะแดปเตอร์สามารถเรนเดอร์เพย์โหลดได้
6. ถอยกลับไปใช้ข้อความแบบระมัดระวังเมื่อไม่มีอะแดปเตอร์หรือไม่สามารถเรนเดอร์ได้
7. ส่งเพย์โหลดที่ได้ผ่านเส้นทางการส่งของช่องทางปกติ
8. ใช้ข้อมูลเมตาการส่ง เช่น `delivery.pin` หลังจากส่งข้อความแรกสำเร็จ

แกนหลักเป็นเจ้าของพฤติกรรมสำรอง เพื่อให้ผู้ผลิตคงความไม่ขึ้นกับช่องทางได้
Plugin ช่องทางเป็นเจ้าของการเรนเดอร์เนทีฟและการจัดการการโต้ตอบ

## กฎการลดระดับ

การนำเสนอต้องปลอดภัยสำหรับการส่งบนช่องทางที่มีข้อจำกัด

ข้อความสำรองประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกะทัดรัด
- บล็อก `divider` เป็นตัวคั่นเชิงภาพ
- ป้ายกำกับปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- ป้ายกำกับตัวเลือกการเลือก

ตัวควบคุมเนทีฟที่ไม่รองรับควรลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิดใช้งานปุ่มอินไลน์จะส่งข้อความสำรอง
- ช่องทางที่ไม่รองรับการเลือกจะแสดงรายการตัวเลือกการเลือกเป็นข้อความ
- ปุ่มที่มีเฉพาะ URL จะกลายเป็นปุ่มลิงก์เนทีฟหรือบรรทัด URL สำรอง
- ความล้มเหลวในการปักหมุดแบบทางเลือกจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากขอให้ปักหมุดแบบ
จำเป็นและช่องทางไม่สามารถปักหมุดข้อความที่ส่งได้ การส่งจะรายงานความล้มเหลว

## การแมปผู้ให้บริการ

ตัวเรนเดอร์ที่รวมมาในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์เนทีฟ                | หมายเหตุ                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | คอมโพเนนต์และคอนเทนเนอร์คอมโพเนนต์ | คง `channelData.discord.components` เดิมไว้สำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบร่วมใหม่ควรใช้ `presentation` |
| Slack           | Block Kit                           | คง `channelData.slack.blocks` เดิมไว้สำหรับผู้ผลิตเพย์โหลดเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบร่วมใหม่ควรใช้ `presentation`       |
| Telegram        | ข้อความพร้อมคีย์บอร์ดอินไลน์          | ปุ่ม/การเลือกต้องใช้ความสามารถปุ่มอินไลน์สำหรับพื้นผิวเป้าหมาย มิฉะนั้นจะใช้ข้อความสำรอง                                         |
| Mattermost      | ข้อความพร้อมพร็อพแบบโต้ตอบ         | บล็อกอื่นๆ ลดระดับเป็นข้อความ                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | ข้อความ `message` ธรรมดาจะถูกรวมกับการ์ดเมื่อให้มาทั้งสองอย่าง                                                                            |
| Feishu          | การ์ดแบบโต้ตอบ                   | ส่วนหัวการ์ดสามารถใช้ `title`; เนื้อหาหลีกเลี่ยงการทำซ้ำชื่อนั้น                                                                                  |
| ช่องทางธรรมดา  | ข้อความสำรอง                       | ช่องทางที่ไม่มีตัวเรนเดอร์ยังคงได้เอาต์พุตที่อ่านได้                                                                                            |

ความเข้ากันได้ของเพย์โหลดแบบเนทีฟของผู้ให้บริการเป็นตัวช่วยช่วงเปลี่ยนผ่านสำหรับตัวสร้างการตอบกลับที่มีอยู่ ไม่ใช่เหตุผลในการเพิ่มฟิลด์เนทีฟที่ใช้ร่วมกันใหม่

## การนำเสนอเทียบกับ InteractiveReply

`InteractiveReply` คือชุดย่อยภายในแบบเก่าที่ตัวช่วยการอนุมัติและการโต้ตอบใช้ รองรับ:

- ข้อความ
- ปุ่ม
- ตัวเลือก

`MessagePresentation` คือสัญญาการส่งที่ใช้ร่วมกันแบบมาตรฐาน เพิ่มสิ่งต่อไปนี้:

- ชื่อเรื่อง
- โทน
- บริบท
- เส้นแบ่ง
- ปุ่มเฉพาะ URL
- เมตาดาต้าการส่งมอบทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ตัวช่วยจาก `openclaw/plugin-sdk/interactive-runtime` เมื่อเชื่อมโค้ดเก่า:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง เพย์โหลด `interactive` ที่มีอยู่เป็นชุดย่อยที่เลิกใช้แล้วของ `presentation`; การรองรับในรันไทม์ยังคงอยู่สำหรับตัวสร้างแบบเก่า

ชนิด `InteractiveReply*` ดั้งเดิมและตัวช่วยแปลงถูกทำเครื่องหมาย
`@deprecated` ใน SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` และ
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` และ
`presentationToInteractiveControlsReply(...)` ยังคงพร้อมใช้งานเป็นสะพานเรนเดอร์สำหรับการใช้งานช่องทางแบบเดิม โค้ดตัวสร้างใหม่ไม่ควรเรียกใช้สิ่งเหล่านี้ ให้ส่ง `presentation` และปล่อยให้การปรับ core/channel จัดการการเรนเดอร์

ตัวช่วยการอนุมัติก็มีตัวทดแทนที่ยึดการนำเสนอเป็นหลักเช่นกัน:

- ใช้ `buildApprovalPresentationFromActionDescriptors(...)` แทน
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- ใช้ `buildApprovalPresentation(...)` แทน
  `buildApprovalInteractiveReply(...)`
- ใช้ `buildExecApprovalPresentation(...)` แทน
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` ส่งคืนสตริงว่างสำหรับบล็อกการนำเสนอที่ไม่มีข้อความสำรอง เช่น การนำเสนอที่มีเพียงเส้นแบ่ง ทรานสปอร์ตที่ต้องการเนื้อหาการส่งที่ไม่ว่างสามารถส่ง
`emptyFallback` เพื่อเลือกใช้เนื้อหาขั้นต่ำโดยไม่เปลี่ยนสัญญาข้อความสำรองเริ่มต้น

## การปักหมุดการส่งมอบ

การปักหมุดเป็นพฤติกรรมการส่งมอบ ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทนฟิลด์เนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` ปักหมุดข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวในการปักหมุดที่เป็นทางเลือกจะลดระดับลงและปล่อยให้ข้อความที่ส่งแล้วยังคงอยู่
- ความล้มเหลวในการปักหมุดที่จำเป็นจะทำให้การส่งมอบล้มเหลว
- ข้อความที่แบ่งเป็นชิ้นจะปักหมุดชิ้นแรกที่ส่งแล้ว ไม่ใช่ชิ้นสุดท้าย

แอ็กชันข้อความ `pin`, `unpin` และ `pins` แบบแมนนวลยังคงมีอยู่สำหรับข้อความเดิมที่ผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## รายการตรวจสอบสำหรับผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถเรนเดอร์หรือลดระดับการนำเสนอเชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยังอะแดปเตอร์ขาออกของรันไทม์
- ติดตั้ง `renderPresentation` ในโค้ดรันไทม์ ไม่ใช่โค้ดตั้งค่า Plugin ของ control-plane
- แยกไลบรารี UI เนทีฟออกจากเส้นทางตั้งค่า/แค็ตตาล็อกที่ร้อน
- ประกาศขีดจำกัดความสามารถทั่วไปบน `presentationCapabilities.limits` เมื่อทราบค่าเหล่านั้น
- รักษาขีดจำกัดขั้นสุดท้ายของแพลตฟอร์มไว้ในตัวเรนเดอร์และการทดสอบ
- เพิ่มการทดสอบสำรองสำหรับปุ่มที่ไม่รองรับ ตัวเลือก ปุ่ม URL การซ้ำกันของชื่อเรื่อง/ข้อความ และการส่งแบบผสมระหว่าง `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งมอบผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุดรหัสข้อความที่ส่งแล้วได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มเนทีฟของผู้ให้บริการใหม่ผ่านสคีมาแอ็กชันข้อความที่ใช้ร่วมกัน

## เอกสารที่เกี่ยวข้อง

- [CLI ข้อความ](/th/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนรีแฟกเตอร์การนำเสนอช่องทาง](/th/plan/ui-channels)
