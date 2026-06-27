---
read_when:
    - การรีแฟกเตอร์ UI ข้อความของช่องทาง เพย์โหลดแบบโต้ตอบ หรือเรนเดอร์เรอร์ของช่องทางแบบเนทีฟ
    - การเปลี่ยนความสามารถของเครื่องมือข้อความ คำใบ้การส่งมอบ หรือเครื่องหมายข้ามบริบท
    - การดีบัก fanout ของการนำเข้า Discord Carbon หรือความ lazy ของรันไทม์ของ Plugin ช่องทาง
summary: แยกการนำเสนอข้อความเชิงความหมายออกจากตัวเรนเดอร์ UI เนทีฟของช่องทาง
title: แผนการปรับโครงสร้างการนำเสนอของช่องทาง
x-i18n:
    generated_at: "2026-06-27T17:48:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## สถานะ

นำไปใช้แล้วสำหรับพื้นผิวของเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และการส่งออกขาออก:

- `ReplyPayload.presentation` พกพา UI ข้อความเชิงความหมาย
- `ReplyPayload.delivery.pin` พกพาคำขอปักหมุดข้อความที่ส่งแล้ว
- การกระทำข้อความที่ใช้ร่วมกันเปิดเผย `presentation`, `delivery` และ `pin` แทน `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟของผู้ให้บริการ
- แกนหลักเรนเดอร์หรือลดระดับ presentation โดยอัตโนมัติผ่านความสามารถขาออกที่ Plugin ประกาศไว้
- เรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams และ Feishu ใช้สัญญาทั่วไปนี้
- โค้ดระนาบควบคุมของช่องทาง Discord ไม่ได้นำเข้าคอนเทนเนอร์ UI ที่อิง Carbon อีกต่อไป

เอกสารมาตรฐานตอนนี้อยู่ที่ [การนำเสนอข้อความ](/th/plugins/message-presentation)
เก็บแผนนี้ไว้เป็นบริบทการนำไปใช้ในอดีต; อัปเดตคู่มือมาตรฐาน
สำหรับการเปลี่ยนแปลงสัญญา, เรนเดอร์ หรือพฤติกรรม fallback

## ปัญหา

UI ของช่องทางตอนนี้ถูกแยกอยู่ในหลายพื้นผิวที่เข้ากันไม่ได้:

- แกนหลักเป็นเจ้าของ hook เรนเดอร์ข้ามบริบทที่มีรูปแบบเหมือน Discord ผ่าน `buildCrossContextComponents`
- `channel.ts` ของ Discord สามารถนำเข้า UI Carbon แบบเนทีฟผ่าน `DiscordUiContainer` ซึ่งดึง dependency UI ของรันไทม์เข้ามาในระนาบควบคุมของ Plugin ช่องทาง
- เอเจนต์และ CLI เปิดเผยช่องทางเลี่ยง payload แบบเนทีฟ เช่น Discord `components`, Slack `blocks`, Telegram หรือ Mattermost `buttons` และ Teams หรือ Feishu `card`
- `ReplyPayload.channelData` พกพาทั้ง hint ของการขนส่งและซอง UI แบบเนทีฟ
- โมเดล `interactive` ทั่วไปมีอยู่แล้ว แต่แคบกว่า layout ที่สมบูรณ์กว่าซึ่ง Discord, Slack, Teams, Feishu, LINE, Telegram และ Mattermost ใช้อยู่แล้ว

สิ่งนี้ทำให้แกนหลักรับรู้รูปร่าง UI แบบเนทีฟ ทำให้ความ lazy ของรันไทม์ Plugin อ่อนลง และให้เอเจนต์มีวิธีแบบเฉพาะผู้ให้บริการมากเกินไปในการสื่อเจตนาข้อความเดียวกัน

## เป้าหมาย

- แกนหลักตัดสินใจ presentation เชิงความหมายที่ดีที่สุดสำหรับข้อความจากความสามารถที่ประกาศไว้
- ส่วนขยายประกาศความสามารถและเรนเดอร์ presentation เชิงความหมายเป็น payload การขนส่งแบบเนทีฟ
- Web Control UI แยกจาก UI เนทีฟของแชท
- payload ช่องทางแบบเนทีฟจะไม่ถูกเปิดเผยผ่านพื้นผิวข้อความของเอเจนต์ที่ใช้ร่วมกันหรือ CLI
- ฟีเจอร์ presentation ที่ไม่รองรับจะลดระดับอัตโนมัติเป็นการแสดงข้อความที่ดีที่สุด
- พฤติกรรมการส่ง เช่น การปักหมุดข้อความที่ส่งแล้ว เป็น metadata การส่งทั่วไป ไม่ใช่ presentation

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่มี shim ความเข้ากันได้ย้อนหลังสำหรับ `buildCrossContextComponents`
- ไม่มีช่องทางเลี่ยงแบบเนทีฟสาธารณะสำหรับ `components`, `blocks`, `buttons` หรือ `card`
- ไม่มีการนำเข้าไลบรารี UI เนทีฟของช่องทางในแกนหลัก
- ไม่มี seam SDK เฉพาะผู้ให้บริการสำหรับช่องทางที่ bundled

## โมเดลเป้าหมาย

เพิ่มฟิลด์ `presentation` ที่แกนหลักเป็นเจ้าของลงใน `ReplyPayload`

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` กลายเป็น subset ของ `presentation` ระหว่าง migration:

- บล็อกข้อความ `interactive` map ไปที่ `presentation.blocks[].type = "text"`
- บล็อกปุ่ม `interactive` map ไปที่ `presentation.blocks[].type = "buttons"`
- บล็อก select `interactive` map ไปที่ `presentation.blocks[].type = "select"`

schema ของเอเจนต์ภายนอกและ CLI ตอนนี้ใช้ `presentation`; `interactive` ยังคงเป็นตัวช่วย parser/rendering legacy ภายในสำหรับ producer การตอบกลับที่มีอยู่
API สาธารณะที่หันหน้าเข้าหา producer ถือว่า `interactive` deprecated แล้ว การรองรับรันไทม์
ยังคงอยู่เพื่อให้ตัวช่วย approval ที่มีอยู่และ Plugin รุ่นเก่ายังคง
ทำงานได้ ขณะที่โค้ดใหม่ emit `presentation`

## Metadata การส่ง

เพิ่มฟิลด์ `delivery` ที่แกนหลักเป็นเจ้าของสำหรับพฤติกรรมการส่งที่ไม่ใช่ UI

```ts
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

ความหมาย:

- `delivery.pin = true` หมายถึงปักหมุดข้อความแรกที่ส่งสำเร็จ
- `notify` มีค่าเริ่มต้นเป็น `false`
- `required` มีค่าเริ่มต้นเป็น `false`; ช่องทางที่ไม่รองรับหรือการปักหมุดที่ล้มเหลวจะลดระดับอัตโนมัติโดยดำเนินการส่งต่อไป
- การกระทำข้อความแบบ manual `pin`, `unpin` และ `list-pins` ยังคงอยู่สำหรับข้อความที่มีอยู่

การผูกหัวข้อ Telegram ACP ปัจจุบันควรย้ายจาก `channelData.telegram.pin = true` ไปเป็น `delivery.pin = true`

## สัญญาความสามารถของรันไทม์

เพิ่ม hook เรนเดอร์ presentation และ delivery ลงในอะแดปเตอร์ขาออกของรันไทม์ ไม่ใช่ Plugin ช่องทางระนาบควบคุม

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

พฤติกรรมของแกนหลัก:

- resolve ช่องทางเป้าหมายและอะแดปเตอร์รันไทม์
- ขอความสามารถ presentation
- ลดระดับบล็อกที่ไม่รองรับและใช้ข้อจำกัดความสามารถทั่วไปก่อน
  การเรนเดอร์
- เรียก `renderPresentation`
- หากไม่มีเรนเดอร์ ให้แปลง presentation เป็น fallback ข้อความ
- หลังจากส่งสำเร็จ ให้เรียก `pinDeliveredMessage` เมื่อมีการขอ `delivery.pin` และรองรับ

## การ map ช่องทาง

Discord:

- เรนเดอร์ `presentation` เป็น components v2 และคอนเทนเนอร์ Carbon ในโมดูลเฉพาะรันไทม์
- เก็บตัวช่วยสี accent ไว้ในโมดูลเบา
- ลบการนำเข้า `DiscordUiContainer` จากโค้ดระนาบควบคุมของ Plugin ช่องทาง

Slack:

- เรนเดอร์ `presentation` เป็น Block Kit
- ลบ input `blocks` ของเอเจนต์และ CLI

Telegram:

- เรนเดอร์ข้อความ, context และ divider เป็นข้อความ
- เรนเดอร์ actions และ select เป็น inline keyboard เมื่อกำหนดค่าไว้และอนุญาตสำหรับพื้นผิวเป้าหมาย
- ใช้ fallback ข้อความเมื่อ inline buttons ถูกปิดใช้งาน
- ย้ายการปักหมุดหัวข้อ ACP ไปที่ `delivery.pin`

Mattermost:

- เรนเดอร์ actions เป็นปุ่ม interactive เมื่อกำหนดค่าไว้
- เรนเดอร์บล็อกอื่นเป็น fallback ข้อความ

MS Teams:

- เรนเดอร์ `presentation` เป็น Adaptive Cards
- เก็บการกระทำ manual pin/unpin/list-pins ไว้
- อาจนำ `pinDeliveredMessage` ไปใช้หากการรองรับ Graph เชื่อถือได้สำหรับบทสนทนาเป้าหมาย

Feishu:

- เรนเดอร์ `presentation` เป็น interactive cards
- เก็บการกระทำ manual pin/unpin/list-pins ไว้
- อาจนำ `pinDeliveredMessage` ไปใช้สำหรับการปักหมุดข้อความที่ส่งแล้ว หากพฤติกรรม API เชื่อถือได้

LINE:

- เรนเดอร์ `presentation` เป็น Flex หรือ template messages เมื่อทำได้
- fallback เป็นข้อความสำหรับบล็อกที่ไม่รองรับ
- ลบ payload UI ของ LINE ออกจาก `channelData`

ช่องทางแบบ plain หรือจำกัด:

- แปลง presentation เป็นข้อความด้วยการจัดรูปแบบแบบอนุรักษ์นิยม

## ขั้นตอนการ refactor

1. ใช้ fix สำหรับ release ของ Discord ซ้ำ ซึ่งแยก `ui-colors.ts` ออกจาก UI ที่อิง Carbon และลบ `DiscordUiContainer` ออกจาก `extensions/discord/src/channel.ts`
2. เพิ่ม `presentation` และ `delivery` ลงใน `ReplyPayload`, การ normalize payload ขาออก, สรุปการส่ง และ hook payload
3. เพิ่ม schema `MessagePresentation` และตัวช่วย parser ใน subpath SDK/runtime ที่แคบ
4. แทนที่ความสามารถข้อความ `buttons`, `cards`, `components` และ `blocks` ด้วยความสามารถ presentation เชิงความหมาย
5. เพิ่ม hook อะแดปเตอร์ขาออกของรันไทม์สำหรับเรนเดอร์ presentation และการปักหมุด delivery
6. แทนที่การสร้าง component ข้ามบริบทด้วย `buildCrossContextPresentation`
7. ลบ `src/infra/outbound/channel-adapters.ts` และลบ `buildCrossContextComponents` ออกจากชนิดของ Plugin ช่องทาง
8. เปลี่ยน `maybeApplyCrossContextMarker` ให้แนบ `presentation` แทน native params
9. อัปเดตเส้นทางส่งของ plugin-dispatch ให้ใช้เฉพาะ presentation เชิงความหมายและ metadata การส่ง
10. ลบ native payload params ของเอเจนต์และ CLI: `components`, `blocks`, `buttons` และ `card`
11. ลบตัวช่วย SDK ที่สร้าง schema message-tool แบบเนทีฟ และแทนที่ด้วยตัวช่วย schema presentation
12. ลบซอง UI/native ออกจาก `channelData`; เก็บเฉพาะ metadata การขนส่งจนกว่าจะตรวจทานฟิลด์ที่เหลือแต่ละฟิลด์
13. migrate เรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu และ LINE
14. อัปเดตเอกสารสำหรับ message CLI, หน้าช่องทาง, Plugin SDK และ capability cookbook
15. รัน profiling import fanout สำหรับ Discord และ entrypoint ช่องทางที่ได้รับผลกระทบ

ขั้นตอน 1-11 และ 13-14 ถูกนำไปใช้แล้วในการ refactor นี้สำหรับสัญญาของเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และอะแดปเตอร์ขาออก ขั้นตอน 12 ยังเป็นรอบ cleanup ภายในที่ลึกขึ้นสำหรับซองการขนส่ง `channelData` ส่วนตัวของผู้ให้บริการ ขั้นตอน 15 ยังเป็นการตรวจสอบติดตามผล หากเราต้องการตัวเลข import-fanout เชิงปริมาณนอกเหนือจาก gate ของ type/test

## การทดสอบ

เพิ่มหรืออัปเดต:

- การทดสอบ normalization ของ presentation
- การทดสอบ auto-degrade ของ presentation สำหรับบล็อกที่ไม่รองรับ
- การทดสอบ marker ข้ามบริบทสำหรับเส้นทาง plugin dispatch และ core delivery
- การทดสอบ matrix การเรนเดอร์ช่องทางสำหรับ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE และ fallback ข้อความ
- การทดสอบ schema ของ message tool ที่พิสูจน์ว่าฟิลด์เนทีฟหายไปแล้ว
- การทดสอบ CLI ที่พิสูจน์ว่า flag เนทีฟหายไปแล้ว
- regression การนำเข้าแบบ lazy ของ entrypoint Discord ที่ครอบคลุม Carbon
- การทดสอบ delivery pin ที่ครอบคลุม Telegram และ fallback ทั่วไป

## คำถามที่ยังเปิดอยู่

- ควรนำ `delivery.pin` ไปใช้กับ Discord, Slack, MS Teams และ Feishu ในรอบแรก หรือเริ่มเฉพาะ Telegram ก่อน?
- สุดท้ายแล้ว `delivery` ควรรวมฟิลด์ที่มีอยู่ เช่น `replyToId`, `replyToCurrent`, `silent` และ `audioAsVoice` หรือควรโฟกัสที่พฤติกรรมหลังส่งต่อไป?
- presentation ควรรองรับรูปภาพหรือการอ้างอิงไฟล์โดยตรง หรือควรแยก media ออกจาก layout UI ไว้ก่อนในตอนนี้?

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels)
- [การนำเสนอข้อความ](/th/plugins/message-presentation)
