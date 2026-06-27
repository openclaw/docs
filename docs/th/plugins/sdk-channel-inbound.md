---
read_when:
    - คุณกำลังสร้างหรือปรับโครงสร้างเส้นทางการรับของ Plugin ช่องทางการส่งข้อความ
    - คุณต้องมีการสร้างบริบทขาเข้าที่ใช้ร่วมกัน การบันทึกเซสชัน หรือการส่งการตอบกลับที่เตรียมไว้
    - คุณกำลังย้ายตัวช่วยเทิร์นของช่องทางแบบเก่าไปยัง API ขาเข้า/ข้อความ
summary: 'ตัวช่วยเหตุการณ์ขาเข้าสำหรับ Plugin ช่องทาง: การสร้างบริบท, การประสานงาน runner ที่ใช้ร่วมกัน, ระเบียนเซสชัน, และการส่งคำตอบที่เตรียมไว้'
title: API ขาเข้าของช่องทาง
x-i18n:
    generated_at: "2026-06-27T18:06:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Plugin ช่องทางควรจำลองเส้นทางการรับด้วยคำนาม inbound และ message:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

ใช้ `openclaw/plugin-sdk/channel-inbound` สำหรับการทำให้เหตุการณ์ inbound เป็นมาตรฐาน
การจัดรูปแบบ ราก และการประสานงาน ใช้
`openclaw/plugin-sdk/channel-outbound` สำหรับพฤติกรรมการส่งแบบเนทีฟ
ใบรับ การนำส่งที่ทนทาน และการแสดงตัวอย่างสด

## ตัวช่วยหลัก

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: ฉายข้อเท็จจริงของช่องทางที่ปรับเป็นมาตรฐานแล้วเข้าไปใน
  บริบท prompt/session ใช้ `channelContext` เพื่อส่งต่อเมตาดาต้า
  ผู้ส่ง/แชทที่ช่องทางเป็นเจ้าของไปยัง Plugin hook `ctx.channelContext`; ขยาย
  `PluginHookChannelSenderContext` หรือ `PluginHookChannelChatContext` จาก
  subpath นี้สำหรับฟิลด์เฉพาะช่องทาง
- `runChannelInboundEvent(...)`: เรียก ingest, classify, preflight, resolve,
  record, dispatch และ finalize สำหรับเหตุการณ์แพลตฟอร์ม inbound หนึ่งรายการ
- `dispatchChannelInboundReply(...)`: บันทึกและ dispatch การตอบกลับ inbound ที่ประกอบแล้ว
  ด้วยอะแดปเตอร์การนำส่ง

รันไทม์ Plugin ที่ถูกฉีดเข้ามาเปิดเผยตัวช่วยระดับสูงเดียวกันภายใต้
`runtime.channel.inbound.*` สำหรับช่องทางแบบบันเดิล/เนทีฟที่ได้รับ
อ็อบเจ็กต์รันไทม์อยู่แล้ว

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

ตัว dispatch เพื่อความเข้ากันได้ควรประกอบอินพุต `dispatchChannelInboundReply(...)`
และเก็บการนำส่งของแพลตฟอร์มไว้ในอะแดปเตอร์การนำส่ง เส้นทางส่งใหม่ควร
เลือกใช้อะแดปเตอร์ message และตัวช่วย message ที่ทนทาน

## การย้ายระบบ

นามแฝงรันไทม์ `runtime.channel.turn.*` แบบเก่าถูกนำออกแล้ว ใช้:

- `runtime.channel.inbound.run(...)` สำหรับเหตุการณ์ inbound ดิบ
- `runtime.channel.inbound.dispatchReply(...)` สำหรับบริบทการตอบกลับที่ประกอบแล้ว
- `runtime.channel.inbound.buildContext(...)` สำหรับ payload บริบท inbound
- `runtime.channel.inbound.runPreparedReply(...)` เฉพาะสำหรับเส้นทาง dispatch ที่เตรียมไว้และช่องทางเป็นเจ้าของ
  ซึ่งประกอบ dispatch closure ของตนเองอยู่แล้ว

โค้ด Plugin ใหม่ไม่ควรเพิ่ม API ช่องทางที่ตั้งชื่อด้วย `turn` เก็บคำศัพท์ของ model หรือ
agent turn ไว้ภายในโค้ด agent/provider; Plugin ช่องทางใช้คำว่า inbound,
message, delivery และ reply
