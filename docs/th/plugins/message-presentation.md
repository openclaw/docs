---
read_when:
    - การเพิ่มหรือแก้ไขการแสดงผลการ์ดข้อความ แผนภูมิ ตาราง ปุ่ม หรือรายการเลือก
    - การสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบสมบูรณ์ด้วยสื่อหลากหลาย
    - การเปลี่ยนแปลงการนำเสนอของเครื่องมือข้อความหรือความสามารถในการส่งข้อความ
    - การดีบักการถดถอยของการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย แผนภูมิ ตาราง ตัวควบคุม ข้อความสำรอง และคำแนะนำการส่งสำหรับ Plugin ช่องทาง
title: การนำเสนอข้อความ
x-i18n:
    generated_at: "2026-07-19T07:25:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b56ed47ce837e865aa7ac218f02f4d5523b3b71ae22dd0074f2aab00aeecb7a
    source_path: plugins/message-presentation.md
    workflow: 16
---

การนำเสนอข้อความคือสัญญาร่วมของ OpenClaw สำหรับ UI แชตขาออกแบบสมบูรณ์
ซึ่งช่วยให้เอเจนต์ คำสั่ง CLI ขั้นตอนการอนุมัติ และ plugins อธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่แต่ละ channel plugin จะแสดงผลในรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้การนำเสนอสำหรับ UI ข้อความที่ใช้ข้ามช่องทางได้ ได้แก่ ส่วนข้อความ ข้อความบริบท/ส่วนท้าย
ขนาดเล็ก เส้นคั่น แผนภูมิ ตาราง ปุ่ม เมนูเลือก และชื่อเรื่อง/โทนของการ์ด

อย่าเพิ่มฟิลด์เนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` ลงในเครื่องมือ
ข้อความที่ใช้ร่วมกัน ฟิลด์เหล่านั้นเป็นผลลัพธ์ของตัวแสดงผลที่ channel plugin เป็นเจ้าของ

## สัญญา

ผู้สร้าง Plugin นำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โครงสร้าง:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** ค่าคอลแบ็กแบบเดิม สำหรับตัวควบคุมใหม่ควรใช้ action */
  value?: string;
  /** @deprecated ใช้ action ที่มี type เป็น "url" */
  url?: string;
  /** @deprecated ใช้ action ที่มี type เป็น "web-app" */
  webApp?: { url: string };
  /** @deprecated ใช้ action ที่มี type เป็น "web-app" */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** ค่าคอลแบ็กแบบเดิม สำหรับตัวควบคุมใหม่ควรใช้ action */
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

- `action.type: "command"` เรียกใช้คำสั่ง slash แบบเนทีฟผ่านเส้นทางคำสั่งของ core
  ใช้สำหรับปุ่มและเมนูคำสั่งในตัว
- `action.type: "callback"` ส่งข้อมูล Plugin แบบทึบผ่านเส้นทางการโต้ตอบของช่องทาง
  channel plugins ต้องไม่ตีความข้อมูลคอลแบ็กใหม่เป็นคำสั่ง slash
- `action.type: "approval"` ระบุการอนุมัติของผู้ปฏิบัติงานแบบคงทนหนึ่งรายการ ชนิด
  `exec` หรือ `plugin` ที่ระบุไว้อย่างชัดเจน และการตัดสินใจที่ร้องขอ channel plugins
  เข้ารหัสการดำเนินการนั้นเป็นคอลแบ็กส่วนตัวของการขนส่งและแก้ไขผ่าน
  บริการอนุมัติ โดยต้องไม่แยกวิเคราะห์ข้อความคำสั่ง `/approve` หรืออนุมาน
  ชนิดจาก ID
- `action.type: "question"` ระบุตัวเลือกหนึ่งรายการสำหรับคำถาม `ask_user` ที่ระบบรันไทม์สร้างขึ้น
  และกำลังใช้งาน เช่นเดียวกับ `approval` นี่คือการดำเนินการรันไทม์ของ OpenClaw
  เอเจนต์และ plugins ต้องไม่สร้าง ID คำถามขึ้นเอง Telegram, Discord และ
  Slack จะแมปเป็นคอลแบ็กเนทีฟส่วนตัวของการขนส่งและส่งตัวเลือก
  ให้ Gateway ดำเนินการ เมื่อคำถามได้รับคำตอบ หมดอายุ หรือ
  ถูกยกเลิก ช่องทางเหล่านั้นจะแก้ไขข้อความที่ส่งแล้ว ลบการดำเนินการ
  และต่อท้ายสถานะสุดท้าย WhatsApp, Signal และ iMessage แสดงตัวเลือก
  แบบเลือกได้หนึ่งรายการสูงสุดสี่ตัวเลือกเป็นรีแอ็กชัน `1️⃣` ถึง `4️⃣` รูปแบบคำถามอื่น
  จะลดระดับเป็นข้อความป้ายกำกับ และผู้ใช้สามารถตอบด้วยข้อความ
  ธรรมดาได้
- `action.type: "url"` เปิดลิงก์ปกติ
- `action.type: "web-app"` เปิดเว็บแอปแบบเนทีฟของช่องทาง ตั้งค่า `url` สำหรับ
  แอปที่รองรับด้วย URL หรือ `widgetId` สำหรับวิดเจ็ตที่ OpenClaw โฮสต์ ซึ่งกลไก
  การเปิดเป็นของช่องทาง โดยต้องมีอย่างน้อยหนึ่งค่า เมื่อมีทั้งสองค่า
  ช่องทางสามารถเลือกใช้การเปิดวิดเจ็ตที่โฮสต์แบบเนทีฟก่อน และใช้ URL
  ในกรณีที่กลไกดังกล่าวไม่พร้อมใช้งาน
- `value` คือค่าคอลแบ็กแบบทึบเดิม ตัวควบคุมใหม่ควรใช้ `action`
  เพื่อให้ channel plugins สามารถแมปคำสั่งและคอลแบ็กได้โดยไม่ต้องคาดเดาจากข้อความ
- `url`, `webApp` และ `web_app` ยังคงยอมรับเป็นอินพุตขอบเขตที่เลิกใช้แล้ว
  ตัวปรับรูปแบบจะคงฟิลด์เหล่านี้ไว้เพื่อให้ตัวแสดงผลแยกความแตกต่างระหว่างความหมาย
  แบบเดิมที่เผยแพร่แล้วกับการดำเนินการแบบมีชนิดที่ระบุชัดเจน ผู้สร้างข้อมูลใหม่ควรใช้ `action`
- `label` จำเป็นต้องมีและใช้ในการสำรองเป็นข้อความด้วย
- `style` เป็นเพียงคำแนะนำ ตัวแสดงผลควรแมปสไตล์ที่ไม่รองรับเป็นค่าเริ่มต้น
  ที่ปลอดภัย แทนที่จะทำให้การส่งล้มเหลว
- `priority` ไม่บังคับ เมื่อช่องทางประกาศขีดจำกัดการดำเนินการและจำเป็นต้อง
  ตัดตัวควบคุมออก core จะเก็บปุ่มที่มีลำดับความสำคัญสูงกว่าไว้ก่อน และคง
  ลำดับเดิมระหว่างปุ่มที่มีลำดับความสำคัญเท่ากัน เมื่อใส่ตัวควบคุมทั้งหมดได้
  จะคงลำดับที่ผู้สร้างกำหนดไว้
- `disabled` ไม่บังคับ ช่องทางต้องเลือกใช้ด้วย `supportsDisabled` มิฉะนั้น
  core จะลดระดับตัวควบคุมที่ปิดใช้งานเป็นข้อความสำรองที่โต้ตอบไม่ได้
  ปุ่มที่ปิดใช้งานจะแสดงเฉพาะป้ายกำกับในข้อความสำรองเสมอ แม้จะ
  มีการดำเนินการ `command`
- `reusable` ไม่บังคับ ช่องทางที่รองรับคอลแบ็กเนทีฟแบบใช้ซ้ำได้อาจ
  คงการดำเนินการให้พร้อมใช้งานหลังจากโต้ตอบสำเร็จ ใช้สำหรับ
  การดำเนินการที่ทำซ้ำได้หรือมีผลเหมือนเดิมเมื่อทำซ้ำ เช่น รีเฟรช ตรวจสอบ หรือดูรายละเอียดเพิ่มเติม
  และไม่ต้องตั้งค่าสำหรับการอนุมัติแบบครั้งเดียวตามปกติและการดำเนินการที่ทำลายข้อมูล

ความหมายของเมนูเลือก:

- `options[].action` ยอมรับเฉพาะ `command` หรือ `callback` ส่วนการอนุมัติและการดำเนินการลิงก์ใช้ได้กับปุ่มเท่านั้น
- `options[].value` คือค่าแอปพลิเคชันที่เลือกแบบเดิม
- `placeholder` เป็นเพียงคำแนะนำและช่องทางที่ไม่รองรับเมนูเลือกแบบเนทีฟ
  อาจเพิกเฉยได้
- หากช่องทางไม่รองรับเมนูเลือก ข้อความสำรองจะแสดงรายการป้ายกำกับ

ความหมายของแผนภูมิ:

- `pie` กำหนดให้ค่าเซกเมนต์ต้องเป็นจำนวนบวก
- `bar`, `area` และ `line` ใช้อาร์เรย์ `categories` ที่เรียงลำดับหนึ่งชุด แต่ละชุดข้อมูล
  ต้องมีค่าจำกัดหนึ่งค่าต่อหนึ่งหมวดหมู่พอดีและอยู่ในลำดับเดียวกัน
- ป้ายกำกับหมวดหมู่และชื่อชุดข้อมูลต้องไม่ซ้ำกัน บล็อกแผนภูมิที่ไม่ถูกต้อง
  หรือไม่สมบูรณ์จะถูกตัดออกระหว่างการปรับรูปแบบ แทนที่จะเปลี่ยนข้อมูลโดยไม่แจ้ง
- การแสดงผลแผนภูมิแบบเนทีฟต้องเลือกใช้ผ่าน `presentationCapabilities.charts`
  ช่องทางอื่นจะได้รับชื่อแผนภูมิ แกน หมวดหมู่ ชุดข้อมูล และค่า
  เป็นข้อความที่กำหนดผลลัพธ์แน่นอน และยังเป็นข้อความสำรองสำหรับการช่วยการเข้าถึงด้วย

ความหมายของตาราง:

- `caption` คือหัวข้อสั้นที่จำเป็นต้องมี `headers` ต้องมีป้ายกำกับคอลัมน์
  ที่ไม่ซ้ำและไม่ว่างอย่างน้อยหนึ่งรายการ
- `rows` ต้องมีอย่างน้อยหนึ่งแถว แต่ละแถวต้องมีหนึ่งเซลล์ต่อหนึ่ง
  ส่วนหัวพอดี และทุกเซลล์ต้องเป็นสตริงที่ไม่ว่างหรือจำนวนจำกัด
- `rowHeaderColumnIndex` คือดัชนีฐานศูนย์ที่ไม่บังคับ ซึ่งระบุคอลัมน์
  ที่ตัวแสดงผลแบบเนทีฟควรเปิดเผยเซลล์เป็นส่วนหัวแถว
- การปรับรูปแบบตารางเป็นแบบอะตอมมิก คำอธิบายตาราง ส่วนหัว ความกว้างแถว เซลล์
  หรือดัชนีส่วนหัวแถวที่ไม่ถูกต้องจะทำให้บล็อกตารางถูกตัดออก แทนที่จะตัดทอน
  หรือซ่อมแซมข้อมูล
- การแสดงผลตารางแบบเนทีฟต้องเลือกใช้ผ่าน `presentationCapabilities.tables`
  ช่องทางอื่นจะได้รับคำอธิบายตารางและทุกแถวเป็นข้อความเชิงเส้นที่กำหนดผลลัพธ์
  แน่นอน โดยยุบช่องว่างภายใน:

  ```text
  ไปป์ไลน์ที่เปิดอยู่ (ตาราง)
  - บัญชี: Acme; ขั้นตอน: ชนะ; ARR: 125000
  - บัญชี: Globex; ขั้นตอน: ตรวจสอบ; ARR: 82000
  ```

ไม่มีตัวแยกประเภท `report` แยกต่างหาก ให้ประกอบรายงานจาก `title`,
`tone`, `text`, `context`, `chart`, `table` และบล็อกการดำเนินการ วิธีนี้ทำให้แต่ละ
บล็อกแสดงผลแยกกันได้ และทำให้รายงานฉบับสมบูรณ์มีข้อความสำรอง
ที่กำหนดผลลัพธ์แน่นอนแบบเดียวกัน

## ตัวอย่างผู้สร้างข้อมูล

การ์ดแบบง่าย:

```json
{
  "title": "การอนุมัติการปรับใช้",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary พร้อมเลื่อนระดับแล้ว" },
    { "type": "context", "text": "บิลด์ 1234 ผ่าน staging แล้ว" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "อนุมัติ",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "ปฏิเสธ",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

ปุ่มลิงก์ที่มีเฉพาะ URL:

```json
{
  "blocks": [
    { "type": "text", "text": "บันทึกประจำรุ่นพร้อมแล้ว" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "เปิดบันทึก",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "เปิดใช้งาน",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

เมนูเลือก:

```json
{
  "title": "เลือกสภาพแวดล้อม",
  "blocks": [
    {
      "type": "select",
      "placeholder": "สภาพแวดล้อม",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "โปรดักชัน", "value": "env:prod" }
      ]
    }
  ]
}
```

แผนภูมิ:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "รายได้รายไตรมาส",
      "categories": ["ไตรมาส 1", "ไตรมาส 2", "ไตรมาส 3"],
      "series": [
        { "name": "ผลิตภัณฑ์", "values": [120, 145, 138] },
        { "name": "บริการ", "values": [80, 95, 104] }
      ],
      "xLabel": "ไตรมาส",
      "yLabel": "รายได้"
    }
  ]
}
```

รายงานตาราง:

```json
{
  "title": "รายงานไปป์ไลน์",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "โอกาสปัจจุบันแยกตามขั้นตอน" },
    {
      "type": "table",
      "caption": "ไปป์ไลน์ที่เปิดอยู่",
      "headers": ["บัญชี", "ขั้นตอน", "ARR"],
      "rows": [
        ["Acme", "ชนะ", 125000],
        ["Globex", "ตรวจสอบ", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "อัปเดตจากสแนปช็อต CRM" }
  ]
}
```

การส่งด้วย CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "การอนุมัติการปรับใช้" \
  --presentation '{"title":"การอนุมัติการปรับใช้","tone":"warning","blocks":[{"type":"text","text":"Canary พร้อมแล้ว"},{"type":"buttons","buttons":[{"label":"อนุมัติ","value":"deploy:approve","style":"success"},{"label":"ปฏิเสธ","value":"deploy:decline","style":"danger"}]}]}'
```

การส่งแบบปักหมุด:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "เปิดหัวข้อแล้ว" \
  --pin
```

การส่งแบบปักหมุดด้วย JSON ที่ระบุอย่างชัดเจน:

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
    charts: false,
    tables: false,
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

ค่าบูลีนของความสามารถอธิบายสิ่งที่ตัวเรนเดอร์สามารถทำให้โต้ตอบได้ `limits` ที่เป็นทางเลือกอธิบายซองข้อมูลทั่วไปที่แกนหลักสามารถปรับก่อนเรียกตัวเรนเดอร์:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

แกนหลักใช้ขีดจำกัดทั่วไปกับตัวควบคุมเชิงความหมายก่อนเรนเดอร์ ตัวเรนเดอร์ยังคงรับผิดชอบการตรวจสอบและการตัดทอนขั้นสุดท้ายที่เฉพาะเจาะจงกับผู้ให้บริการ สำหรับจำนวนบล็อกแบบเนทีฟ ขนาดการ์ด ขีดจำกัด URL และลักษณะเฉพาะของผู้ให้บริการที่ไม่สามารถแสดงในสัญญาทั่วไปได้ หากขีดจำกัดนำตัวควบคุมทั้งหมดออกจากบล็อก แกนหลักจะเก็บป้ายกำกับไว้เป็นข้อความบริบทที่โต้ตอบไม่ได้ เพื่อให้ข้อความที่ส่งแล้วยังคงมีทางเลือกสำรองที่มองเห็นได้

## ขั้นตอนการเรนเดอร์ของแกนหลัก

บนเส้นทางขาออกมาตรฐานที่ CLI และการดำเนินการส่งข้อความมาตรฐานใช้ แกนหลักจะ:

1. ปรับเพย์โหลดการนำเสนอให้อยู่ในรูปแบบมาตรฐาน
2. แก้ไขหาอะแดปเตอร์ขาออกของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. ใช้ขีดจำกัดความสามารถทั่วไป เช่น จำนวนการดำเนินการ ความยาวป้ายกำกับ และจำนวนตัวเลือก เมื่ออะแดปเตอร์ประกาศขีดจำกัดเหล่านั้น บล็อกแผนภูมิและตารางจะกลายเป็นข้อความแบบกำหนดแน่นอน เว้นแต่อะแดปเตอร์จะประกาศ `charts: true` หรือ `tables: true` อย่างชัดเจนตามลำดับ
5. เรียก `renderPresentation` เมื่ออะแดปเตอร์สามารถเรนเดอร์เพย์โหลดได้
6. ถอยกลับไปใช้ข้อความแบบระมัดระวังเมื่อไม่มีอะแดปเตอร์หรือไม่สามารถเรนเดอร์ได้
7. ส่งเพย์โหลดผลลัพธ์ผ่านเส้นทางการส่งของช่องทางตามปกติ
8. ใช้ข้อมูลเมตาการส่ง เช่น `delivery.pin` หลังจากส่งข้อความแรกสำเร็จ

ช่องทางตอบกลับหรือดูตัวอย่างภายในช่องทางที่ใช้ `ReplyPayload` โดยตรง ต้องเข้าสู่เส้นทางมาตรฐานนั้นหรือสร้างทางเลือกสำรองของการนำเสนอแบบเดียวกันก่อนแปลงเพย์โหลดลงเป็นข้อความธรรมดา/สื่อ

แกนหลักรับผิดชอบพฤติกรรมทางเลือกสำรอง เพื่อให้ผู้ผลิตไม่ต้องผูกกับช่องทาง Plugin ของช่องทางรับผิดชอบการเรนเดอร์แบบเนทีฟและการจัดการการโต้ตอบ

## กฎการลดระดับ

การนำเสนอต้องสามารถส่งผ่านช่องทางที่มีข้อจำกัดได้อย่างปลอดภัย

ข้อความทางเลือกสำรองประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกระชับ
- บล็อก `divider` เป็นตัวคั่นที่มองเห็นได้
- ป้ายกำกับปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- ป้ายกำกับตัวเลือก
- ชื่อ ประเภท แกน หมวดหมู่ ชุดข้อมูล และค่าของแผนภูมิ
- คำบรรยายตาราง ส่วนหัว และค่าทุกแถว

### การมองเห็นค่าทางเลือกสำรองของปุ่ม

เมื่อช่องทางไม่สามารถเรนเดอร์ตัวควบคุมแบบโต้ตอบได้ ค่าของปุ่มและตัวเลือกจะถอยกลับเป็นข้อความธรรมดา พฤติกรรมทางเลือกสำรองจะรักษาความสะดวกในการใช้งาน พร้อมทั้งเก็บข้อมูลคอลแบ็กที่ไม่โปร่งใสไว้เป็นส่วนตัว:

- **การดำเนินการชนิด `command`** เรนเดอร์เป็น `` label: `command` `` เพื่อให้ผู้ใช้คัดลอกคำสั่งและเรียกใช้ด้วยตนเองในช่องป้อนข้อมูลของช่องทางได้
- **การดำเนินการชนิด `callback`** และฟิลด์ **`value`** แบบเดิม เรนเดอร์เฉพาะป้ายกำกับ ค่าคอลแบ็กที่ไม่โปร่งใสจะไม่ถูกเปิดเผยในข้อความทางเลือกสำรอง
- **การดำเนินการชนิด `approval`** เรนเดอร์เฉพาะป้ายกำกับ รหัสการอนุมัติและการตัดสินใจเป็นข้อมูลการขนส่ง และจะไม่ถูกเปิดเผยผ่านตัวช่วยสเกลาร์ทั่วไปหรือข้อความทางเลือกสำรอง
- **การดำเนินการ `url`**, **การดำเนินการ `web-app` ที่มี URL รองรับ** และอินพุต **`url` / `webApp` / `web_app`** ที่เลิกใช้แล้ว จะแสดงข้อความ URL ควบคู่กับป้ายกำกับปุ่ม เนื่องจาก URL มีไว้สำหรับผู้ใช้ การดำเนินการที่ใช้ได้เฉพาะวิดเจ็ตที่โฮสต์ไว้จะเรนเดอร์เฉพาะป้ายกำกับบนช่องทางที่ไม่มีการเปิดวิดเจ็ตแบบเนทีฟ
- **ตัวเลือก** เรนเดอร์เฉพาะป้ายกำกับ ค่าของตัวเลือกที่อยู่เบื้องหลังจะไม่ถูกเปิดเผยในข้อความทางเลือกสำรอง

อะแดปเตอร์ช่องทางที่เพิ่มคำแนะนำสำหรับคำสั่งแบบกำหนดเองใน UI ทางเลือกสำรอง (เช่น คำแนะนำความคิดเห็นในเอกสาร Feishu) ต้องหาค่าการตรวจสอบว่ามีคำสั่งจากบล็อกการนำเสนอเดียวกับที่ตัวเรนเดอร์ทางเลือกสำรองใช้ เพื่อให้ข้อความคำแนะนำปรากฏเฉพาะเมื่อมีการแสดงคำสั่งแบบกำหนดเองจริงเท่านั้น

ตัวควบคุมแบบเนทีฟที่ไม่รองรับควรลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว ตัวอย่าง:

- Telegram ที่ปิดใช้ปุ่มอินไลน์จะส่งข้อความทางเลือกสำรอง
- ช่องทางที่ไม่รองรับตัวเลือกจะแสดงรายการตัวเลือกเป็นข้อความ
- ช่องทางที่ไม่รองรับแผนภูมิแบบเนทีฟจะแสดงรายการข้อมูลแผนภูมิเป็นข้อความ
- ช่องทางที่ไม่รองรับตารางแบบเนทีฟจะแสดงรายการทุกแถวของตารางเป็นข้อความ
- ปุ่มที่มีเฉพาะ URL จะกลายเป็นปุ่มลิงก์แบบเนทีฟหรือบรรทัด URL ทางเลือกสำรอง
- ความล้มเหลวในการปักหมุดแบบเป็นทางเลือกจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากมีการร้องขอให้ปักหมุดเป็นข้อบังคับ และช่องทางไม่สามารถปักหมุดข้อความที่ส่งได้ การส่งจะรายงานความล้มเหลว

## การแมปผู้ให้บริการ

ตัวเรนเดอร์ที่รวมมาในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์แบบเนทีฟ                      | หมายเหตุ                                                                                                                                                                                                             |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | คอมโพเนนต์และคอนเทนเนอร์คอมโพเนนต์       | รักษา `channelData.discord.components` แบบเดิมสำหรับผู้ผลิตเพย์โหลดแบบเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation`                                                                 |
| Feishu          | การ์ดแบบโต้ตอบ                         | ส่วนหัวการ์ดสามารถใช้ `title`; เนื้อหาหลีกเลี่ยงการทำชื่อดังกล่าวซ้ำ                                                                                                                                                  |
| Matrix          | ข้อความทางเลือกสำรองพร้อมฟิลด์เหตุการณ์แบบมีโครงสร้าง | ปุ่ม/ตัวเลือกประกาศว่ารองรับ แต่ปัจจุบันทุกบล็อกเรนเดอร์เป็นเอาต์พุต `renderMessagePresentationFallbackText` ที่บรรจุอยู่ในฟิลด์เหตุการณ์ `com.openclaw.presentation` ไม่ใช่วิดเจ็ตโต้ตอบแบบเนทีฟ |
| Mattermost      | ข้อความพร้อมพร็อพแบบโต้ตอบ               | ไม่รองรับตัวเลือกและตัวคั่น บล็อกเหล่านั้นจะลดระดับเป็นข้อความ                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                            | ข้อความธรรมดา `message` จะรวมอยู่กับการ์ดเมื่อมีทั้งสองอย่าง ไม่รองรับตัวเลือก สไตล์ และสถานะปิดใช้งาน                                                                                     |
| Slack           | Block Kit                                 | เรนเดอร์ `chart` เป็น `data_visualization` แบบเนทีฟ และ `table` เป็น `data_table` แบบเนทีฟ รักษา `channelData.slack.blocks` แบบเดิม แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation`                                   |
| Telegram        | ข้อความพร้อมแป้นพิมพ์อินไลน์                | ปุ่ม/ตัวเลือกต้องใช้ความสามารถปุ่มอินไลน์สำหรับพื้นผิวเป้าหมาย มิฉะนั้นจะใช้ข้อความทางเลือกสำรอง                                                                                                         |
| ช่องทางแบบธรรมดา  | ข้อความทางเลือกสำรอง                             | ช่องทางที่ไม่มีตัวเรนเดอร์ยังคงได้รับเอาต์พุตที่อ่านได้                                                                                                                                                            |

ความเข้ากันได้ของเพย์โหลดแบบเนทีฟของผู้ให้บริการเป็นสิ่งอำนวยความสะดวกในช่วงเปลี่ยนผ่านสำหรับผู้ผลิตการตอบกลับที่มีอยู่ ไม่ใช่เหตุผลในการเพิ่มฟิลด์เนทีฟแบบใช้ร่วมกันใหม่

## Presentation เทียบกับ InteractiveReply

`InteractiveReply` เป็นชุดย่อยภายในแบบเก่าที่ตัวช่วยการอนุมัติและการโต้ตอบใช้ โดยรองรับ:

- ข้อความ
- ปุ่ม
- ตัวเลือก

`MessagePresentation` เป็นสัญญาการส่งแบบใช้ร่วมกันมาตรฐาน โดยเพิ่ม:

- ชื่อ
- โทน
- บริบท
- ตัวคั่น
- แผนภูมิ
- ตาราง
- ปุ่มที่มีเฉพาะ URL
- ข้อมูลเมตาการส่งทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ตัวช่วยจาก `openclaw/plugin-sdk/interactive-runtime` เมื่อเชื่อมโค้ดเก่า:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง เพย์โหลด `interactive` ที่มีอยู่เป็นชุดย่อยที่เลิกใช้แล้วของ `presentation`; การรองรับในรันไทม์ยังคงอยู่สำหรับผู้ผลิตรุ่นเก่า

ตัวช่วยที่ยังไม่เลิกใช้และควรรู้จัก:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  ตรวจสอบความถูกต้องและแปลงเพย์โหลดที่ไม่มีชนิดข้อมูล (ตัวอย่างเช่น JSON จากแฟล็ก
  `--presentation` ของ CLI) ให้เป็น `MessagePresentation`
- `isMessagePresentationInteractiveBlock(block)` จำกัดชนิดของบล็อกให้เป็นยูเนียน
  `buttons` | `select`
- `resolveMessagePresentationButtonAction(button)` และ
  `resolveMessagePresentationOptionAction(option)` คืนค่าแอ็กชันแบบมีชนิดที่เป็นรูปแบบมาตรฐาน
  โดยยังยอมรับฟิลด์ขอบเขตที่เลิกใช้แล้ว ทั้งนี้ `action` ที่ระบุไว้อย่างชัดเจน
  จะมีลำดับความสำคัญสูงสุดเสมอ
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` อ่านเฉพาะค่าสเกลาร์ของคำสั่ง/คอลแบ็ก
  แอ็กชันมาตรฐานที่ไม่ใช่สเกลาร์จะไม่ไหลต่อไปยังเงาแบบเดิม
  `value` ดังนั้น ID การอนุมัติและเป้าหมายลิงก์จึงยังคงมีชนิดข้อมูล
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` เรนเดอร์บล็อกข้อมูลแบบมีโครงสร้างหนึ่งบล็อก
  เป็นข้อความที่ให้ผลลัพธ์แน่นอนสำหรับเส้นทางสำรองเฉพาะช่องทาง

ชนิดข้อมูล `InteractiveReply*` แบบเดิมและตัวช่วยแปลงถูกทำเครื่องหมายเป็น
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
`presentationToInteractiveControlsReply(...)` ยังคงพร้อมใช้งานเป็นบริดจ์ตัวเรนเดอร์
สำหรับการติดตั้งใช้งานช่องทางแบบเดิม โค้ดผู้สร้างใหม่ไม่ควรเรียกใช้ฟังก์ชันเหล่านี้
ให้ส่ง `presentation` และปล่อยให้การปรับใช้ของแกนหลัก/ช่องทางจัดการการเรนเดอร์

ตัวช่วยการอนุมัติก็มีตัวแทนที่ยึดการนำเสนอเป็นหลักเช่นกัน:

- ใช้ `buildApprovalPresentationFromActionDescriptors(...)` แทน
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- ใช้ `buildApprovalPresentation(...)` แทน
  `buildApprovalInteractiveReply(...)`
- ใช้ `buildExecApprovalPresentation(...)` แทน
  `buildExecApprovalInteractiveReply(...)`

ตัวสร้างที่เผยแพร่แล้วเหล่านั้นยังคงใช้คำสั่งเป็นฐานเพื่อความเข้ากันได้กับ Plugin ส่วน Gateway
และโค้ดช่องทางที่รวมมาให้ซึ่งเป็นเจ้าของชนิดการอนุมัติแบบถาวรควรใช้
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` หรือ
`buildTypedPluginApprovalPendingReplyPayload(...)` เพื่อให้ระบบขนส่งได้รับ
แอ็กชัน `approval` ที่ระบุไว้อย่างชัดเจน แทนการอนุมานความหมายจากข้อความ `/approve`

`renderMessagePresentationFallbackText(...)` คืนค่าสตริงว่างสำหรับ
บล็อกการนำเสนอที่ไม่มีข้อความสำรอง เช่น การนำเสนอที่มีเพียงเส้นแบ่ง
ระบบขนส่งที่ต้องใช้เนื้อหาสำหรับส่งซึ่งไม่ว่างเปล่าสามารถส่ง
`emptyFallback` เพื่อเลือกใช้เนื้อหาขั้นต่ำโดยไม่เปลี่ยนสัญญาสำรองเริ่มต้น

## การปักหมุดการส่ง

การปักหมุดเป็นพฤติกรรมการส่ง ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทน
ฟิลด์เฉพาะของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` ปักหมุดข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวในการปักหมุดที่ไม่บังคับจะลดระดับการทำงานและคงข้อความที่ส่งไว้โดยไม่เปลี่ยนแปลง
- ความล้มเหลวในการปักหมุดที่บังคับทำให้การส่งล้มเหลว
- ข้อความที่แบ่งเป็นส่วนจะปักหมุดส่วนแรกที่ส่งสำเร็จ ไม่ใช่ส่วนท้าย

แอ็กชันข้อความ `pin`, `unpin` และ `pins` แบบกำหนดเองยังคงมีอยู่สำหรับ
ข้อความที่มีอยู่แล้วในกรณีที่ผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## รายการตรวจสอบสำหรับผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถ
  เรนเดอร์หรือลดระดับการนำเสนอเชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยังอะแดปเตอร์ขาออกของรันไทม์
- ติดตั้งใช้งาน `renderPresentation` ในโค้ดรันไทม์ ไม่ใช่โค้ดตั้งค่า Plugin
  ของระนาบควบคุม
- ไม่นำไลบรารี UI แบบเนทีฟเข้าสู่เส้นทางการตั้งค่า/แค็ตตาล็อกที่มีการเรียกใช้บ่อย
- ประกาศขีดจำกัดความสามารถทั่วไปใน `presentationCapabilities.limits` เมื่อ
  ทราบขีดจำกัดดังกล่าว
- คงขีดจำกัดสุดท้ายของแพลตฟอร์มไว้ในตัวเรนเดอร์และการทดสอบ
- เพิ่มการทดสอบเส้นทางสำรองสำหรับแผนภูมิ ตาราง ปุ่ม ตัวเลือก ปุ่ม URL
  การซ้ำกันของชื่อเรื่อง/ข้อความ และการส่งแบบผสมระหว่าง `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุด ID ของข้อความที่ส่งได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มเฉพาะของผู้ให้บริการรายการใหม่ผ่าน
  สคีมาแอ็กชันข้อความที่ใช้ร่วมกัน

## เอกสารที่เกี่ยวข้อง

- [CLI สำหรับข้อความ](/th/cli/message)
- [ภาพรวม SDK สำหรับ Plugin](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนปรับโครงสร้างการนำเสนอช่องทาง](/th/plan/ui-channels)
