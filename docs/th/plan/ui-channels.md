---
read_when:
    - การปรับโครงสร้างส่วนติดต่อผู้ใช้ข้อความของช่องทาง เพย์โหลดแบบโต้ตอบ หรือตัวเรนเดอร์ช่องทางแบบเนทีฟ
    - การเปลี่ยนความสามารถของเครื่องมือข้อความ คำแนะนำการส่งมอบ หรือเครื่องหมายข้ามบริบท
    - การดีบักการกระจายออกของการ import Discord Carbon หรือการโหลดแบบหน่วงเวลาในรันไทม์ของ Plugin ช่องทาง
summary: แยกการนำเสนอข้อความเชิงความหมายออกจากตัวเรนเดอร์ UI แบบเนทีฟของช่องทาง.
title: แผนการปรับโครงสร้างส่วนการแสดงผลของช่องทาง
x-i18n:
    generated_at: "2026-04-30T10:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## สถานะ

นำไปใช้แล้วสำหรับพื้นผิวของเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และการส่งออก:

- `ReplyPayload.presentation` เก็บ UI ข้อความเชิงความหมาย
- `ReplyPayload.delivery.pin` เก็บคำขอปักหมุดข้อความที่ส่งแล้ว
- แอ็กชันข้อความที่ใช้ร่วมกันเปิดเผย `presentation`, `delivery` และ `pin` แทน `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟของผู้ให้บริการ
- Core เรนเดอร์หรือปรับลดระดับ presentation อัตโนมัติผ่านความสามารถการส่งออกที่ Plugin ประกาศไว้
- ตัวเรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams และ Feishu ใช้สัญญาทั่วไป
- โค้ด control-plane ของช่อง Discord ไม่ได้นำเข้าคอนเทนเนอร์ UI ที่อิง Carbon อีกต่อไป

เอกสารหลักตอนนี้อยู่ที่ [Message Presentation](/th/plugins/message-presentation)
เก็บแผนนี้ไว้เป็นบริบทการนำไปใช้ในอดีต; อัปเดตคู่มือหลัก
เมื่อมีการเปลี่ยนแปลงสัญญา, ตัวเรนเดอร์ หรือพฤติกรรม fallback

## ปัญหา

ปัจจุบัน UI ของช่องถูกแบ่งอยู่บนพื้นผิวหลายแบบที่เข้ากันไม่ได้:

- Core เป็นเจ้าของ hook ตัวเรนเดอร์ข้ามบริบทที่มีรูปทรงแบบ Discord ผ่าน `buildCrossContextComponents`
- `channel.ts` ของ Discord สามารถนำเข้า UI Carbon แบบเนทีฟผ่าน `DiscordUiContainer` ซึ่งดึง dependency ของ UI runtime เข้าไปใน control plane ของ Plugin ช่อง
- เอเจนต์และ CLI เปิดเผยช่องทางเลี่ยง payload แบบเนทีฟ เช่น Discord `components`, Slack `blocks`, Telegram หรือ Mattermost `buttons` และ Teams หรือ Feishu `card`
- `ReplyPayload.channelData` เก็บทั้ง hint ของการขนส่งและ envelope ของ UI แบบเนทีฟ
- โมเดล `interactive` ทั่วไปมีอยู่แล้ว แต่แคบกว่าเลย์เอาต์ที่สมบูรณ์กว่าซึ่งใช้อยู่แล้วโดย Discord, Slack, Teams, Feishu, LINE, Telegram และ Mattermost

สิ่งนี้ทำให้ core รับรู้รูปทรง UI แบบเนทีฟ ทำให้ความ lazy ของ Plugin runtime อ่อนลง และเปิดช่องทางเฉพาะผู้ให้บริการมากเกินไปให้เอเจนต์ใช้สื่อเจตนาของข้อความเดียวกัน

## เป้าหมาย

- Core ตัดสินใจเลือก presentation เชิงความหมายที่ดีที่สุดสำหรับข้อความจากความสามารถที่ประกาศไว้
- Extension ประกาศความสามารถและเรนเดอร์ presentation เชิงความหมายเป็น payload การขนส่งแบบเนทีฟ
- Web Control UI แยกจาก UI เนทีฟของแชท
- ไม่เปิดเผย payload ช่องแบบเนทีฟผ่านพื้นผิวข้อความของเอเจนต์ที่ใช้ร่วมกันหรือ CLI
- ฟีเจอร์ presentation ที่ไม่รองรับจะปรับลดระดับอัตโนมัติเป็นการแทนค่าด้วยข้อความที่ดีที่สุด
- พฤติกรรมการส่ง เช่น การปักหมุดข้อความที่ส่งแล้ว เป็น metadata การส่งทั่วไป ไม่ใช่ presentation

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่มี shim ความเข้ากันได้ย้อนหลังสำหรับ `buildCrossContextComponents`
- ไม่มีช่องทางเลี่ยงแบบเนทีฟสาธารณะสำหรับ `components`, `blocks`, `buttons` หรือ `card`
- ไม่มีการนำเข้าไลบรารี UI เนทีฟของช่องใน core
- ไม่มี seam ของ SDK เฉพาะผู้ให้บริการสำหรับช่องที่ bundled มา

## โมเดลเป้าหมาย

เพิ่มฟิลด์ `presentation` ที่ core เป็นเจ้าของลงใน `ReplyPayload`

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

`interactive` กลายเป็นชุดย่อยของ `presentation` ระหว่างการย้ายระบบ:

- บล็อกข้อความ `interactive` แมปไปยัง `presentation.blocks[].type = "text"`
- บล็อกปุ่ม `interactive` แมปไปยัง `presentation.blocks[].type = "buttons"`
- บล็อก select `interactive` แมปไปยัง `presentation.blocks[].type = "select"`

สคีมาของเอเจนต์ภายนอกและ CLI ตอนนี้ใช้ `presentation`; `interactive` ยังคงเป็นตัวช่วย parser/renderer legacy ภายในสำหรับตัวผลิต reply ที่มีอยู่

## Metadata การส่ง

เพิ่มฟิลด์ `delivery` ที่ core เป็นเจ้าของสำหรับพฤติกรรมการส่งที่ไม่ใช่ UI

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
- `required` มีค่าเริ่มต้นเป็น `false`; ช่องที่ไม่รองรับหรือการปักหมุดที่ล้มเหลวจะปรับลดระดับอัตโนมัติโดยส่งต่อไป
- แอ็กชันข้อความ `pin`, `unpin` และ `list-pins` แบบ manual ยังคงอยู่สำหรับข้อความที่มีอยู่

การผูก topic ของ Telegram ACP ปัจจุบันควรย้ายจาก `channelData.telegram.pin = true` ไปเป็น `delivery.pin = true`

## สัญญาความสามารถ runtime

เพิ่ม hook เรนเดอร์ presentation และ delivery ลงใน adapter การส่งออกของ runtime ไม่ใช่ Plugin ช่อง control-plane

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

พฤติกรรมของ core:

- Resolve ช่องเป้าหมายและ adapter runtime
- ขอความสามารถของ presentation
- ปรับลดระดับบล็อกที่ไม่รองรับก่อนเรนเดอร์
- เรียก `renderPresentation`
- หากไม่มี renderer ให้แปลง presentation เป็น text fallback
- หลังส่งสำเร็จ เรียก `pinDeliveredMessage` เมื่อมีการร้องขอ `delivery.pin` และรองรับ

## การแมปช่อง

Discord:

- เรนเดอร์ `presentation` เป็น components v2 และคอนเทนเนอร์ Carbon ในโมดูล runtime-only
- เก็บตัวช่วยสี accent ไว้ในโมดูลเบา
- ลบการนำเข้า `DiscordUiContainer` ออกจากโค้ด control-plane ของ Plugin ช่อง

Slack:

- เรนเดอร์ `presentation` เป็น Block Kit
- ลบ input `blocks` ของเอเจนต์และ CLI

Telegram:

- เรนเดอร์ข้อความ, context และ divider เป็นข้อความ
- เรนเดอร์แอ็กชันและ select เป็น inline keyboard เมื่อกำหนดค่าและอนุญาตสำหรับพื้นผิวเป้าหมาย
- ใช้ text fallback เมื่อปิดใช้งาน inline buttons
- ย้ายการปักหมุด topic ของ ACP ไปที่ `delivery.pin`

Mattermost:

- เรนเดอร์แอ็กชันเป็นปุ่ม interactive เมื่อกำหนดค่าไว้
- เรนเดอร์บล็อกอื่นเป็น text fallback

MS Teams:

- เรนเดอร์ `presentation` เป็น Adaptive Cards
- เก็บแอ็กชัน manual pin/unpin/list-pins ไว้
- อาจนำ `pinDeliveredMessage` ไปใช้ถ้า Graph รองรับอย่างเชื่อถือได้สำหรับการสนทนาเป้าหมาย

Feishu:

- เรนเดอร์ `presentation` เป็น interactive cards
- เก็บแอ็กชัน manual pin/unpin/list-pins ไว้
- อาจนำ `pinDeliveredMessage` ไปใช้สำหรับการปักหมุดข้อความที่ส่งแล้วถ้าพฤติกรรม API เชื่อถือได้

LINE:

- เรนเดอร์ `presentation` เป็น Flex หรือ template messages เมื่อเป็นไปได้
- fallback เป็นข้อความสำหรับบล็อกที่ไม่รองรับ
- ลบ payload UI ของ LINE ออกจาก `channelData`

ช่องธรรมดาหรือมีข้อจำกัด:

- แปลง presentation เป็นข้อความด้วยการจัดรูปแบบแบบอนุรักษ์นิยม

## ขั้นตอน refactor

1. ใช้ซ้ำ fix release ของ Discord ที่แยก `ui-colors.ts` ออกจาก UI ที่อิง Carbon และลบ `DiscordUiContainer` ออกจาก `extensions/discord/src/channel.ts`
2. เพิ่ม `presentation` และ `delivery` ลงใน `ReplyPayload`, การ normalize payload การส่งออก, สรุปการส่ง และ hook payload
3. เพิ่มสคีมา `MessagePresentation` และตัวช่วย parser ใน subpath ของ SDK/runtime ที่แคบ
4. แทนที่ความสามารถของข้อความ `buttons`, `cards`, `components` และ `blocks` ด้วยความสามารถ presentation เชิงความหมาย
5. เพิ่ม hook ของ adapter การส่งออก runtime สำหรับเรนเดอร์ presentation และการปักหมุด delivery
6. แทนที่การสร้าง component ข้ามบริบทด้วย `buildCrossContextPresentation`
7. ลบ `src/infra/outbound/channel-adapters.ts` และลบ `buildCrossContextComponents` ออกจาก type ของ Plugin ช่อง
8. เปลี่ยน `maybeApplyCrossContextMarker` ให้แนบ `presentation` แทน native params
9. อัปเดตเส้นทางส่งของ plugin-dispatch ให้ใช้เฉพาะ presentation เชิงความหมายและ metadata การส่ง
10. ลบ native payload params ของเอเจนต์และ CLI: `components`, `blocks`, `buttons` และ `card`
11. ลบตัวช่วย SDK ที่สร้างสคีมา message-tool แบบเนทีฟ และแทนที่ด้วยตัวช่วยสคีมา presentation
12. ลบ UI/native envelopes ออกจาก `channelData`; เก็บไว้เฉพาะ metadata การขนส่งจนกว่าจะตรวจทานฟิลด์ที่เหลือแต่ละรายการ
13. ย้ายตัวเรนเดอร์ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu และ LINE
14. อัปเดตเอกสารสำหรับ message CLI, หน้าช่อง, Plugin SDK และ capability cookbook
15. รัน import fanout profiling สำหรับ Discord และ entrypoint ของช่องที่ได้รับผลกระทบ

ขั้นตอน 1-11 และ 13-14 ถูกนำไปใช้แล้วใน refactor นี้สำหรับเอเจนต์ที่ใช้ร่วมกัน, CLI, ความสามารถของ Plugin และสัญญา outbound adapter ขั้นตอน 12 ยังคงเป็นรอบ cleanup ภายในที่ลึกกว่า สำหรับ envelope การขนส่ง `channelData` แบบ provider-private ขั้นตอน 15 ยังคงเป็นการตรวจสอบติดตามผลหากเราต้องการตัวเลข import-fanout เชิงปริมาณนอกเหนือจาก type/test gate

## การทดสอบ

เพิ่มหรืออัปเดต:

- การทดสอบ normalization ของ presentation
- การทดสอบการปรับลดระดับอัตโนมัติของ presentation สำหรับบล็อกที่ไม่รองรับ
- การทดสอบ marker ข้ามบริบทสำหรับเส้นทาง plugin dispatch และ core delivery
- การทดสอบเมทริกซ์ตัวเรนเดอร์ช่องสำหรับ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE และ text fallback
- การทดสอบสคีมา message tool ที่พิสูจน์ว่าฟิลด์เนทีฟหายไปแล้ว
- การทดสอบ CLI ที่พิสูจน์ว่า flag เนทีฟหายไปแล้ว
- regression ความ lazy ของการนำเข้า entrypoint ของ Discord ครอบคลุม Carbon
- การทดสอบ delivery pin ครอบคลุม Telegram และ fallback ทั่วไป

## คำถามที่เปิดอยู่

- ควรนำ `delivery.pin` ไปใช้กับ Discord, Slack, MS Teams และ Feishu ในรอบแรก หรือเฉพาะ Telegram ก่อน?
- ในท้ายที่สุด `delivery` ควรดูดซับฟิลด์ที่มีอยู่ เช่น `replyToId`, `replyToCurrent`, `silent` และ `audioAsVoice` หรือควรมุ่งเน้นที่พฤติกรรมหลังส่งเท่านั้น?
- presentation ควรรองรับรูปภาพหรือ file references โดยตรง หรือสื่อต่าง ๆ ควรแยกจากเลย์เอาต์ UI ไว้ก่อนในตอนนี้?

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels)
- [Message presentation](/th/plugins/message-presentation)
