---
read_when:
    - การเพิ่มหรือแก้ไขการเรนเดอร์การ์ดข้อความ ปุ่ม หรือเมนูเลือก
    - การสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบสมบูรณ์
    - การเปลี่ยนการนำเสนอของเครื่องมือข้อความหรือความสามารถในการส่ง
    - การดีบักการถดถอยของการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม ตัวเลือก ข้อความสำรอง และคำแนะนำการส่งสำหรับ Plugin ช่องทาง
title: การนำเสนอข้อความ
x-i18n:
    generated_at: "2026-07-02T22:52:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

การนำเสนอข้อความคือสัญญาร่วมของ OpenClaw สำหรับ UI แชตขาออกแบบสมบูรณ์
ซึ่งช่วยให้ agent, คำสั่ง CLI, โฟลว์การอนุมัติ และ plugins อธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่ Plugin ของแต่ละช่องทางเรนเดอร์เป็นรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้การนำเสนอสำหรับ UI ข้อความที่พกพาได้:

- ส่วนข้อความ
- ข้อความบริบท/ท้ายข้อความขนาดเล็ก
- เส้นแบ่ง
- ปุ่ม
- เมนูเลือก
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์เนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` ลงในเครื่องมือ
ข้อความร่วม สิ่งเหล่านี้คือเอาต์พุตของตัวเรนเดอร์ที่ Plugin ของช่องทางเป็นเจ้าของ

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

- `action.type: "command"` เรียกใช้คำสั่ง slash แบบเนทีฟผ่านเส้นทางคำสั่งของคอร์
  ใช้สิ่งนี้สำหรับปุ่มและเมนูคำสั่งในตัว
- `action.type: "callback"` ส่งข้อมูล Plugin แบบทึบผ่านเส้นทางการโต้ตอบของช่องทาง
  Plugin ของช่องทางต้องไม่ตีความข้อมูล callback ใหม่เป็นคำสั่ง slash
- `value` คือค่า callback แบบทึบดั้งเดิม คอนโทรลใหม่ควรใช้ `action`
  เพื่อให้ Plugin ของช่องทางแมปคำสั่งและ callback ได้โดยไม่ต้องเดาจากข้อความ
- `url` คือปุ่มลิงก์ สามารถมีอยู่ได้โดยไม่มี `value`
- `webApp` อธิบายปุ่มเว็บแอปเนทีฟของช่องทาง Telegram เรนเดอร์สิ่งนี้
  เป็น `web_app` และรองรับเฉพาะในแชตส่วนตัวเท่านั้น `web_app` ยังคง
  ยอมรับใน payload JSON แบบหลวมเพื่อความเข้ากันได้ แต่ผู้ผลิต TypeScript
  ควรใช้ `webApp`
- ต้องมี `label` และยังใช้ใน fallback แบบข้อความด้วย
- `style` เป็นคำแนะนำ ตัวเรนเดอร์ควรแมปสไตล์ที่ไม่รองรับไปเป็นค่าเริ่มต้นที่ปลอดภัย
  ไม่ใช่ทำให้การส่งล้มเหลว
- `priority` เป็นตัวเลือก เมื่อช่องทางประกาศขีดจำกัดของ action และต้องตัดคอนโทรลออก
  คอร์จะเก็บปุ่มที่มี priority สูงกว่าก่อน และคงลำดับเดิมระหว่างปุ่มที่มี priority เท่ากัน
  เมื่อคอนโทรลทั้งหมดใส่ได้ ลำดับที่เขียนไว้จะถูกคงไว้
- `disabled` เป็นตัวเลือก ช่องทางต้องเลือกเข้าร่วมด้วย `supportsDisabled`; มิฉะนั้น
  คอร์จะลดระดับคอนโทรลที่ปิดใช้งานเป็นข้อความ fallback ที่โต้ตอบไม่ได้
- `reusable` เป็นตัวเลือก ช่องทางที่รองรับ callback เนทีฟแบบใช้ซ้ำได้อาจ
  คง action ให้ใช้งานได้หลังการโต้ตอบสำเร็จ ใช้สำหรับ action ที่ทำซ้ำได้
  หรือ idempotent เช่น รีเฟรช ตรวจสอบ หรือรายละเอียดเพิ่มเติม;
  ปล่อยว่างไว้สำหรับการอนุมัติแบบครั้งเดียวปกติและ action ที่ทำลายข้อมูล

ความหมายของเมนูเลือก:

- `options[].action` มีความหมายของคำสั่ง/callback เหมือนกับปุ่ม `action`
- `options[].value` คือค่าของแอปพลิเคชันที่เลือกแบบดั้งเดิม
- `placeholder` เป็นคำแนะนำ และช่องทางที่ไม่มีการรองรับ select แบบเนทีฟอาจละเว้นได้
- หากช่องทางไม่รองรับ select ข้อความ fallback จะแสดงรายการ label

## ตัวอย่างจากผู้ผลิต

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

การส่งแบบปักหมุดด้วย JSON ที่ชัดเจน:

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

ค่าบูลีนของ capability อธิบายสิ่งที่ตัวเรนเดอร์สามารถทำให้โต้ตอบได้ `limits`
ที่เป็นตัวเลือกอธิบายกรอบทั่วไปที่คอร์สามารถปรับได้ก่อนเรียกตัวเรนเดอร์:

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

คอร์ใช้ขีดจำกัดทั่วไปกับคอนโทรลเชิงความหมายก่อนเรนเดอร์ ตัวเรนเดอร์
ยังคงเป็นเจ้าของการตรวจสอบและการตัดทอนเฉพาะผู้ให้บริการขั้นสุดท้ายสำหรับจำนวนบล็อกเนทีฟ
ขนาดการ์ด ขีดจำกัด URL และลักษณะเฉพาะของผู้ให้บริการที่ไม่สามารถแสดงใน
สัญญาทั่วไปได้ หากขีดจำกัดลบคอนโทรลทั้งหมดออกจากบล็อกหนึ่ง คอร์จะเก็บ
label ไว้เป็นข้อความบริบทที่โต้ตอบไม่ได้ เพื่อให้ข้อความที่ส่งแล้วยังคงมี
fallback ที่มองเห็นได้

## โฟลว์การเรนเดอร์ของคอร์

เมื่อ `ReplyPayload` หรือ action ข้อความมี `presentation` คอร์จะ:

1. ทำให้ payload การนำเสนอเป็นรูปแบบปกติ
2. แก้หาอะแดปเตอร์ขาออกของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. ใช้ขีดจำกัด capability ทั่วไป เช่น จำนวน action, ความยาว label และ
   จำนวนตัวเลือก select เมื่ออะแดปเตอร์ประกาศไว้
5. เรียก `renderPresentation` เมื่ออะแดปเตอร์สามารถเรนเดอร์ payload ได้
6. ถอยกลับไปใช้ข้อความแบบระมัดระวังเมื่อไม่มีอะแดปเตอร์หรือไม่สามารถเรนเดอร์ได้
7. ส่ง payload ที่ได้ผ่านเส้นทางการส่งของช่องทางตามปกติ
8. ใช้เมตาดาต้าการส่ง เช่น `delivery.pin` หลังจากข้อความแรกส่งสำเร็จ

คอร์เป็นเจ้าของพฤติกรรม fallback เพื่อให้ผู้ผลิตยังคงไม่ผูกกับช่องทาง
Plugin ของช่องทางเป็นเจ้าของการเรนเดอร์เนทีฟและการจัดการการโต้ตอบ

## กฎการลดระดับ

การนำเสนอต้องปลอดภัยต่อการส่งบนช่องทางที่มีข้อจำกัด

ข้อความ fallback มี:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกระชับ
- บล็อก `divider` เป็นตัวคั่นภาพ
- label ของปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- label ของตัวเลือก select

### การมองเห็น fallback ของค่าปุ่ม

เมื่อช่องทางไม่สามารถเรนเดอร์คอนโทรลแบบโต้ตอบได้ ค่าปุ่มและ select
จะถอยกลับเป็นข้อความธรรมดา พฤติกรรม fallback รักษาความสามารถในการใช้งาน
พร้อมกับเก็บข้อมูล callback แบบทึบให้เป็นส่วนตัว:

- action ชนิด **`command`** เรนเดอร์เป็น `label: \`command\`` เพื่อให้ผู้ใช้
  คัดลอกคำสั่งและเรียกใช้เองในช่องป้อนข้อมูลของช่องทางได้
- action ชนิด **`callback`** และฟิลด์ **`value`** แบบดั้งเดิมเรนเดอร์เป็น
  label อย่างเดียว ค่า callback แบบทึบจะไม่ถูกเปิดเผยในข้อความ fallback
- ปุ่ม **`url` / `webApp`** เรนเดอร์ข้อความ URL เคียงกับ label ของปุ่ม
  เนื่องจาก URL เป็นสิ่งที่ผู้ใช้มองเห็น
- **ตัวเลือก Select** เรนเดอร์เป็น label อย่างเดียว ค่าตัวเลือกที่อยู่เบื้องหลังจะไม่
  ถูกเปิดเผยในข้อความ fallback

อะแดปเตอร์ช่องทางที่เพิ่มคำแนะนำคำสั่งแบบแมนนวลใน UI fallback ของตน (เช่น
คำแนะนำสำหรับคอมเมนต์เอกสารของ Feishu) ต้องหาเช็กว่ามีคำสั่งอยู่จาก
บล็อกการนำเสนอชุดเดียวกับที่ตัวเรนเดอร์ fallback ใช้ เพื่อให้ข้อความคำแนะนำ
ปรากฏเฉพาะเมื่อมีคำสั่งแบบแมนนวลแสดงจริง

คอนโทรลเนทีฟที่ไม่รองรับควรลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิดใช้งานปุ่ม inline จะส่งข้อความ fallback
- ช่องทางที่ไม่มีการรองรับ select จะแสดงรายการตัวเลือก select เป็นข้อความ
- ปุ่มที่มีเฉพาะ URL จะกลายเป็นปุ่มลิงก์เนทีฟหรือบรรทัด URL fallback
- ความล้มเหลวของการปักหมุดแบบตัวเลือกจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากมีการขอให้ปักหมุดเป็น
ข้อกำหนด และช่องทางไม่สามารถปักหมุดข้อความที่ส่งแล้วได้ การส่งจะรายงานความล้มเหลว

## การแมปผู้ให้บริการ

ตัวเรนเดอร์ที่รวมมาในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์แบบเนทีฟ                | หมายเหตุ                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | คอมโพเนนต์และคอนเทนเนอร์คอมโพเนนต์ | รักษา `channelData.discord.components` แบบเดิมไว้สำหรับโปรดิวเซอร์เพย์โหลดแบบเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation` |
| Slack           | Block Kit                           | รักษา `channelData.slack.blocks` แบบเดิมไว้สำหรับโปรดิวเซอร์เพย์โหลดแบบเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation`       |
| Telegram        | ข้อความพร้อมคีย์บอร์ดแบบอินไลน์          | ปุ่ม/ตัวเลือกต้องใช้ความสามารถปุ่มแบบอินไลน์สำหรับพื้นผิวเป้าหมาย ไม่เช่นนั้นจะใช้ข้อความสำรอง                                         |
| Mattermost      | ข้อความพร้อมพร็อพแบบโต้ตอบ         | บล็อกอื่นจะลดรูปเป็นข้อความ                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | ข้อความ `message` ธรรมดาจะถูกรวมกับการ์ดเมื่อมีทั้งสองอย่าง                                                                            |
| Feishu          | การ์ดแบบโต้ตอบ                   | ส่วนหัวของการ์ดสามารถใช้ `title` ได้ ส่วนเนื้อหาจะหลีกเลี่ยงการทำซ้ำชื่อนั้น                                                                                  |
| ช่องทางธรรมดา  | ข้อความสำรอง                       | ช่องทางที่ไม่มีตัวเรนเดอร์ยังคงได้ผลลัพธ์ที่อ่านได้                                                                                            |

ความเข้ากันได้ของเพย์โหลดแบบเนทีฟของผู้ให้บริการเป็นสิ่งอำนวยความสะดวกช่วงเปลี่ยนผ่านสำหรับ
โปรดิวเซอร์การตอบกลับที่มีอยู่ ไม่ใช่เหตุผลในการเพิ่มฟิลด์เนทีฟแบบใช้ร่วมกันใหม่

## การนำเสนอเทียบกับ InteractiveReply

`InteractiveReply` เป็นชุดย่อยภายในแบบเก่าที่ใช้โดยตัวช่วยการอนุมัติและการโต้ตอบ
รองรับ:

- ข้อความ
- ปุ่ม
- ตัวเลือก

`MessagePresentation` เป็นสัญญาการส่งแบบใช้ร่วมกันหลัก เพิ่มสิ่งต่อไปนี้:

- ชื่อ
- โทน
- บริบท
- เส้นแบ่ง
- ปุ่ม URL เท่านั้น
- เมทาดาทาการส่งทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ตัวช่วยจาก `openclaw/plugin-sdk/interactive-runtime` เมื่อเชื่อมโค้ดเก่า:
__OC_I18N_900011__
โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง เพย์โหลด
`interactive` ที่มีอยู่เป็นชุดย่อยที่เลิกใช้แล้วของ `presentation`; การรองรับในรันไทม์
ยังคงอยู่สำหรับโปรดิวเซอร์รุ่นเก่า

ชนิด `InteractiveReply*` แบบเดิมและตัวช่วยแปลงถูกทำเครื่องหมาย
`@deprecated` ใน SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, และ
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` และ
`presentationToInteractiveControlsReply(...)` ยังคงพร้อมใช้งานเป็นบริดจ์ตัวเรนเดอร์
สำหรับการใช้งานช่องทางแบบเดิม โค้ดโปรดิวเซอร์ใหม่ไม่ควรเรียกใช้
สิ่งเหล่านี้ ให้ส่ง `presentation` แล้วปล่อยให้การปรับแกนหลัก/ช่องทางจัดการการเรนเดอร์

ตัวช่วยการอนุมัติก็มีตัวแทนแบบเน้นการนำเสนอก่อนเช่นกัน:

- ใช้ `buildApprovalPresentationFromActionDescriptors(...)` แทน
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- ใช้ `buildApprovalPresentation(...)` แทน
  `buildApprovalInteractiveReply(...)`
- ใช้ `buildExecApprovalPresentation(...)` แทน
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` คืนค่าสตริงว่างสำหรับ
บล็อกการนำเสนอที่ไม่มีข้อความสำรอง เช่น การนำเสนอที่มีเฉพาะเส้นแบ่ง
ทรานสปอร์ตที่ต้องการเนื้อหาการส่งที่ไม่ว่างสามารถส่ง
`emptyFallback` เพื่อเลือกใช้เนื้อหาขั้นต่ำโดยไม่เปลี่ยนสัญญาข้อความสำรองเริ่มต้น

## การปักหมุดการส่ง

การปักหมุดเป็นพฤติกรรมการส่ง ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทน
ฟิลด์เนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` ปักหมุดข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวของการปักหมุดแบบไม่บังคับจะลดระดับลงและคงข้อความที่ส่งไว้เหมือนเดิม
- ความล้มเหลวของการปักหมุดแบบบังคับจะทำให้การส่งล้มเหลว
- ข้อความที่แบ่งเป็นหลายชิ้นจะปักหมุดชิ้นแรกที่ส่งแล้ว ไม่ใช่ชิ้นท้าย

แอ็กชันข้อความ `pin`, `unpin` และ `pins` แบบแมนนวลยังคงมีอยู่สำหรับข้อความที่มีอยู่
เมื่อผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## เช็กลิสต์สำหรับผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถ
  เรนเดอร์หรือลดรูปการนำเสนอเชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยังอะแดปเตอร์ขาออกของรันไทม์
- ใช้งาน `renderPresentation` ในโค้ดรันไทม์ ไม่ใช่โค้ดตั้งค่า Plugin
  ของ control plane
- กันไลบรารี UI เนทีฟออกจากเส้นทางตั้งค่า/แค็ตตาล็อกที่ร้อน
- ประกาศขีดจำกัดความสามารถทั่วไปบน `presentationCapabilities.limits` เมื่อ
  ทราบแล้ว
- รักษาขีดจำกัดสุดท้ายของแพลตฟอร์มไว้ในตัวเรนเดอร์และการทดสอบ
- เพิ่มการทดสอบข้อความสำรองสำหรับปุ่มที่ไม่รองรับ ตัวเลือก ปุ่ม URL การทำซ้ำชื่อ/ข้อความ
  และการส่งแบบผสม `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุดรหัสข้อความที่ส่งได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มแบบเนทีฟของผู้ให้บริการใหม่ผ่าน
  สคีมาแอ็กชันข้อความแบบใช้ร่วมกัน

## เอกสารที่เกี่ยวข้อง

- [CLI ข้อความ](/th/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนรีแฟกเตอร์การนำเสนอช่องทาง](/th/plan/ui-channels)
