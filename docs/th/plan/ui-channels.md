---
read_when:
    - การปรับโครงสร้าง UI ข้อความของช่อง เพย์โหลดแบบโต้ตอบ หรือตัวเรนเดอร์เนทีฟของช่อง
    - การเปลี่ยนแปลงความสามารถของเครื่องมือส่งข้อความ คำแนะนำในการนำส่ง หรือเครื่องหมายข้ามบริบท
    - การดีบักการกระจายการนำเข้า Discord Carbon หรือการโหลดแบบหน่วงเวลาของรันไทม์ Plugin ช่องทาง
summary: แยกการนำเสนอข้อความเชิงความหมายออกจากตัวเรนเดอร์ UI แบบเนทีฟของช่องทาง
title: แผนการปรับโครงสร้างการนำเสนอของช่องทาง
x-i18n:
    generated_at: "2026-07-12T16:20:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## สถานะ

นำไปใช้งานแล้วสำหรับพื้นผิวของเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และการส่งข้อความขาออก:

- `ReplyPayload.presentation` บรรจุ UI ข้อความเชิงความหมาย
- `ReplyPayload.delivery.pin` บรรจุคำขอปักหมุดข้อความที่ส่งแล้ว
- การดำเนินการกับข้อความที่ใช้ร่วมกันเปิดเผย `presentation`, `delivery` และ `pin` แทน `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟของผู้ให้บริการ
- Core เรนเดอร์หรือลดระดับการนำเสนอโดยอัตโนมัติผ่านความสามารถขาออกที่ Plugin ประกาศ
- ตัวเรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams และ Feishu ใช้สัญญาทั่วไป
- โค้ดส่วนควบคุมของช่อง Discord ไม่ได้นำเข้าคอนเทนเนอร์ UI ที่มี Carbon เป็นพื้นฐานอีกต่อไป

ขณะนี้เอกสารหลักอยู่ที่ [การนำเสนอข้อความ](/th/plugins/message-presentation)
เก็บแผนนี้ไว้เป็นบริบททางประวัติศาสตร์ของการนำไปใช้งาน และปรับปรุงคู่มือหลัก
เมื่อมีการเปลี่ยนแปลงสัญญา ตัวเรนเดอร์ หรือพฤติกรรมสำรอง

## ปัญหา

ปัจจุบัน UI ของช่องถูกแบ่งออกเป็นพื้นผิวหลายแบบที่ไม่เข้ากัน:

- Core เป็นเจ้าของฮุกตัวเรนเดอร์ข้ามบริบทที่มีรูปแบบตาม Discord ผ่าน `buildCrossContextComponents`
- `channel.ts` ของ Discord สามารถนำเข้า UI เนทีฟของ Carbon ผ่าน `DiscordUiContainer` ซึ่งดึงการขึ้นต่อกันของ UI ขณะรันไทม์เข้าสู่ส่วนควบคุมของ Plugin ช่อง
- เอเจนต์และ CLI เปิดช่องทางเลี่ยงไปใช้เพย์โหลดเนทีฟ เช่น `components` ของ Discord, `blocks` ของ Slack, `buttons` ของ Telegram หรือ Mattermost และ `card` ของ Teams หรือ Feishu
- `ReplyPayload.channelData` บรรจุทั้งคำแนะนำสำหรับการขนส่งและซอง UI เนทีฟ
- มีโมเดลทั่วไป `interactive` อยู่แล้ว แต่ขอบเขตแคบกว่าเลย์เอาต์ที่สมบูรณ์กว่าซึ่ง Discord, Slack, Teams, Feishu, LINE, Telegram และ Mattermost ใช้อยู่

สิ่งนี้ทำให้ Core ต้องรับรู้รูปแบบ UI เนทีฟ ลดประสิทธิภาพการโหลดแบบตามต้องการของรันไทม์ Plugin และเปิดให้เอเจนต์มีวิธีเฉพาะผู้ให้บริการมากเกินไปในการแสดงเจตนาของข้อความเดียวกัน

## เป้าหมาย

- Core ตัดสินใจเลือกการนำเสนอเชิงความหมายที่ดีที่สุดสำหรับข้อความจากความสามารถที่ประกาศไว้
- ส่วนขยายประกาศความสามารถและเรนเดอร์การนำเสนอเชิงความหมายเป็นเพย์โหลดการขนส่งเนทีฟ
- Web Control UI ยังคงแยกจาก UI เนทีฟของแชต
- ไม่เปิดเผยเพย์โหลดช่องเนทีฟผ่านพื้นผิวข้อความของเอเจนต์ที่ใช้ร่วมกันหรือ CLI
- คุณลักษณะการนำเสนอที่ไม่รองรับจะลดระดับเป็นการแสดงข้อความที่ดีที่สุดโดยอัตโนมัติ
- พฤติกรรมการส่ง เช่น การปักหมุดข้อความที่ส่งแล้ว เป็นข้อมูลเมตาการส่งแบบทั่วไป ไม่ใช่การนำเสนอ

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่มีชิมสำหรับความเข้ากันได้ย้อนหลังของ `buildCrossContextComponents`
- ไม่มีช่องทางเลี่ยงสาธารณะสำหรับ `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟ
- Core ไม่นำเข้าไลบรารี UI เนทีฟของช่อง
- ไม่มีรอยต่อ SDK เฉพาะผู้ให้บริการสำหรับช่องที่รวมมากับระบบ

## โมเดลเป้าหมาย

เพิ่มฟิลด์ `presentation` ที่ Core เป็นเจ้าของลงใน `ReplyPayload`

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

ระหว่างการย้าย `interactive` จะกลายเป็นเซตย่อยของ `presentation`:

- บล็อกข้อความ `interactive` จับคู่กับ `presentation.blocks[].type = "text"`
- บล็อกปุ่ม `interactive` จับคู่กับ `presentation.blocks[].type = "buttons"`
- บล็อกตัวเลือก `interactive` จับคู่กับ `presentation.blocks[].type = "select"`

ขณะนี้สคีมาของเอเจนต์ภายนอกและ CLI ใช้ `presentation` ส่วน `interactive` ยังคงเป็นตัวช่วยพาร์สและเรนเดอร์แบบเดิมภายในสำหรับตัวสร้างการตอบกลับที่มีอยู่
API สาธารณะสำหรับผู้สร้างถือว่า `interactive` เลิกใช้แล้ว การรองรับขณะรันไทม์
ยังคงอยู่เพื่อให้ตัวช่วยการอนุมัติและ Plugin รุ่นเก่าทำงานต่อได้
ขณะที่โค้ดใหม่ส่งออก `presentation`

## ข้อมูลเมตาการส่ง

เพิ่มฟิลด์ `delivery` ที่ Core เป็นเจ้าของสำหรับพฤติกรรมการส่งที่ไม่ใช่ UI

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
- ค่าเริ่มต้นของ `notify` คือ `false`
- ค่าเริ่มต้นของ `required` คือ `false` ช่องที่ไม่รองรับหรือการปักหมุดที่ล้มเหลวจะลดระดับโดยอัตโนมัติด้วยการส่งต่อไป
- การดำเนินการกับข้อความ `pin`, `unpin` และ `list-pins` แบบกำหนดเองยังคงใช้กับข้อความที่มีอยู่

การผูกหัวข้อ ACP ของ Telegram ในปัจจุบันควรย้ายจาก `channelData.telegram.pin = true` ไปเป็น `delivery.pin = true`

## สัญญาความสามารถขณะรันไทม์

เพิ่มฮุกเรนเดอร์การนำเสนอและการส่งลงในอะแดปเตอร์ขาออกขณะรันไทม์ ไม่ใช่ Plugin ช่องในส่วนควบคุม

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

พฤติกรรมของ Core:

- ระบุช่องเป้าหมายและอะแดปเตอร์ขณะรันไทม์
- ขอความสามารถด้านการนำเสนอ
- ลดระดับบล็อกที่ไม่รองรับและใช้ขีดจำกัดความสามารถทั่วไปก่อน
  การเรนเดอร์
- เรียก `renderPresentation`
- หากไม่มีตัวเรนเดอร์ ให้แปลงการนำเสนอเป็นข้อความสำรอง
- หลังจากส่งสำเร็จ ให้เรียก `pinDeliveredMessage` เมื่อมีการขอ `delivery.pin` และช่องรองรับ

## การจับคู่ช่อง

Discord:

- เรนเดอร์ `presentation` เป็นคอมโพเนนต์ v2 และคอนเทนเนอร์ Carbon ในโมดูลสำหรับรันไทม์เท่านั้น
- เก็บตัวช่วยสีเน้นไว้ในโมดูลขนาดเบา
- ลบการนำเข้า `DiscordUiContainer` ออกจากโค้ดส่วนควบคุมของ Plugin ช่อง

Slack:

- เรนเดอร์ `presentation` เป็น Block Kit
- ลบอินพุต `blocks` ของเอเจนต์และ CLI

Telegram:

- เรนเดอร์ข้อความ บริบท และตัวแบ่งเป็นข้อความ
- เรนเดอร์การดำเนินการและตัวเลือกเป็นแป้นพิมพ์แบบอินไลน์เมื่อกำหนดค่าไว้และอนุญาตสำหรับพื้นผิวเป้าหมาย
- ใช้ข้อความสำรองเมื่อปิดใช้งานปุ่มแบบอินไลน์
- ย้ายการปักหมุดหัวข้อ ACP ไปยัง `delivery.pin`

Mattermost:

- เรนเดอร์การดำเนินการเป็นปุ่มโต้ตอบเมื่อกำหนดค่าไว้
- เรนเดอร์บล็อกอื่นเป็นข้อความสำรอง

MS Teams:

- เรนเดอร์ `presentation` เป็น Adaptive Cards
- เก็บการดำเนินการ `pin`/`unpin`/`list-pins` แบบกำหนดเอง
- เลือกนำ `pinDeliveredMessage` ไปใช้งานได้ หากการรองรับ Graph เชื่อถือได้สำหรับการสนทนาเป้าหมาย

Feishu:

- เรนเดอร์ `presentation` เป็นการ์ดโต้ตอบ
- เก็บการดำเนินการ `pin`/`unpin`/`list-pins` แบบกำหนดเอง
- เลือกนำ `pinDeliveredMessage` ไปใช้งานสำหรับการปักหมุดข้อความที่ส่งแล้วได้ หากพฤติกรรมของ API เชื่อถือได้

LINE:

- เรนเดอร์ `presentation` เป็นข้อความ Flex หรือเทมเพลตเมื่อทำได้
- ย้อนกลับไปใช้ข้อความสำหรับบล็อกที่ไม่รองรับ
- ลบเพย์โหลด UI ของ LINE ออกจาก `channelData`

ช่องแบบข้อความธรรมดาหรือมีข้อจำกัด:

- แปลงการนำเสนอเป็นข้อความด้วยการจัดรูปแบบแบบระมัดระวัง

## ขั้นตอนการปรับโครงสร้าง

1. นำการแก้ไขรุ่นเผยแพร่ของ Discord ที่แยก `ui-colors.ts` ออกจาก UI ที่มี Carbon เป็นพื้นฐานมาใช้อีกครั้ง และลบ `DiscordUiContainer` ออกจาก `extensions/discord/src/channel.ts`
2. เพิ่ม `presentation` และ `delivery` ลงใน `ReplyPayload`, การปรับเพย์โหลดขาออกให้เป็นมาตรฐาน, สรุปการส่ง และเพย์โหลดของฮุก
3. เพิ่มสคีมา `MessagePresentation` และตัวช่วยพาร์สในพาธย่อย SDK/รันไทม์ที่มีขอบเขตแคบ
4. แทนที่ความสามารถด้านข้อความ `buttons`, `cards`, `components` และ `blocks` ด้วยความสามารถด้านการนำเสนอเชิงความหมาย
5. เพิ่มฮุกอะแดปเตอร์ขาออกขณะรันไทม์สำหรับการเรนเดอร์การนำเสนอและการปักหมุดการส่ง
6. แทนที่การสร้างคอมโพเนนต์ข้ามบริบทด้วย `buildCrossContextPresentation`
7. ลบ `src/infra/outbound/channel-adapters.ts` และนำ `buildCrossContextComponents` ออกจากชนิด Plugin ช่อง
8. เปลี่ยน `maybeApplyCrossContextMarker` ให้แนบ `presentation` แทนพารามิเตอร์เนทีฟ
9. ปรับปรุงพาธการส่งผ่านการจัดส่ง Plugin ให้ใช้เฉพาะการนำเสนอเชิงความหมายและข้อมูลเมตาการส่ง
10. ลบพารามิเตอร์เพย์โหลดเนทีฟของเอเจนต์และ CLI ได้แก่ `components`, `blocks`, `buttons` และ `card`
11. ลบตัวช่วย SDK ที่สร้างสคีมาเครื่องมือข้อความเนทีฟ โดยแทนที่ด้วยตัวช่วยสคีมาการนำเสนอ
12. ลบซอง UI/เนทีฟออกจาก `channelData` และเก็บเฉพาะข้อมูลเมตาการขนส่งไว้จนกว่าจะตรวจสอบแต่ละฟิลด์ที่เหลือ
13. ย้ายตัวเรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu และ LINE
14. ปรับปรุงเอกสารสำหรับ CLI ข้อความ, หน้าช่อง, SDK ของ Plugin และคู่มือความสามารถ
15. เรียกใช้การวิเคราะห์การกระจายของการนำเข้าสำหรับ Discord และจุดเข้าของช่องที่ได้รับผลกระทบ

ขั้นตอน 1-11 และ 13-14 ถูกนำไปใช้งานในการปรับโครงสร้างนี้แล้วสำหรับเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และสัญญาอะแดปเตอร์ขาออก ขั้นตอน 12 ยังคงเป็นรอบการเก็บกวาดภายในเชิงลึกสำหรับซองการขนส่ง `channelData` ส่วนตัวของผู้ให้บริการ ขั้นตอน 15 ยังคงเป็นการตรวจสอบติดตามผล หากต้องการตัวเลขการกระจายของการนำเข้าที่วัดปริมาณได้เพิ่มเติมนอกเหนือจากเกณฑ์ชนิด/การทดสอบ

## การทดสอบ

เพิ่มหรือปรับปรุง:

- การทดสอบการปรับการนำเสนอให้เป็นมาตรฐาน
- การทดสอบการลดระดับการนำเสนอโดยอัตโนมัติสำหรับบล็อกที่ไม่รองรับ
- การทดสอบเครื่องหมายข้ามบริบทสำหรับการจัดส่ง Plugin และพาธการส่งของ Core
- การทดสอบเมทริกซ์ตัวเรนเดอร์ช่องสำหรับ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE และข้อความสำรอง
- การทดสอบสคีมาเครื่องมือข้อความที่พิสูจน์ว่าฟิลด์เนทีฟถูกลบแล้ว
- การทดสอบ CLI ที่พิสูจน์ว่าแฟล็กเนทีฟถูกลบแล้ว
- การทดสอบการถดถอยด้านการโหลดการนำเข้าแบบตามต้องการของจุดเข้า Discord ที่ครอบคลุม Carbon
- การทดสอบการปักหมุดการส่งที่ครอบคลุม Telegram และการย้อนกลับแบบทั่วไป

## คำถามที่ยังเปิดอยู่

- ควรนำ `delivery.pin` ไปใช้งานสำหรับ Discord, Slack, MS Teams และ Feishu ในรอบแรก หรือเริ่มเฉพาะ Telegram ก่อน
- ในท้ายที่สุด `delivery` ควรรวมฟิลด์ที่มีอยู่ เช่น `replyToId`, `replyToCurrent`, `silent` และ `audioAsVoice` หรือควรมุ่งเน้นเฉพาะพฤติกรรมหลังการส่ง
- การนำเสนอควรรองรับรูปภาพหรือการอ้างอิงไฟล์โดยตรง หรือควรแยกสื่อออกจากเลย์เอาต์ UI ต่อไปในขณะนี้

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels)
- [การนำเสนอข้อความ](/th/plugins/message-presentation)
