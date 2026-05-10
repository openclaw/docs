---
read_when:
    - การเปลี่ยนลักษณะการทำงานหรือค่าเริ่มต้นของตัวบ่งชี้การพิมพ์
summary: OpenClaw แสดงตัวบ่งชี้การพิมพ์เมื่อใดและวิธีปรับแต่ง
title: ตัวบ่งชี้การพิมพ์
x-i18n:
    generated_at: "2026-05-10T19:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

ตัวบ่งชี้การพิมพ์จะถูกส่งไปยังช่องทางแชทระหว่างที่การรันยังทำงานอยู่ ใช้
`agents.defaults.typingMode` เพื่อควบคุมว่าเริ่มแสดงการพิมพ์ **เมื่อใด** และใช้ `typingIntervalSeconds`
เพื่อควบคุมว่าจะรีเฟรช **บ่อยเพียงใด**

## ค่าเริ่มต้น

เมื่อไม่ได้ตั้งค่า `agents.defaults.typingMode` OpenClaw จะคงพฤติกรรมแบบเดิมไว้:

- **แชทโดยตรง**: การพิมพ์จะเริ่มทันทีเมื่อ model loop เริ่มทำงาน
- **แชทกลุ่มที่มีการกล่าวถึง**: การพิมพ์จะเริ่มทันที
- **แชทกลุ่มที่ไม่มีการกล่าวถึง**: การพิมพ์จะเริ่มเฉพาะเมื่อข้อความเริ่มสตรีม
- **การรัน Heartbeat**: การพิมพ์จะเริ่มเมื่อการรัน Heartbeat เริ่มขึ้น หากเป้าหมาย Heartbeat
  ที่ resolve แล้วเป็นแชทที่รองรับการพิมพ์และไม่ได้ปิดใช้งานการพิมพ์

## โหมด

ตั้งค่า `agents.defaults.typingMode` เป็นค่าใดค่าหนึ่งต่อไปนี้:

- `never` - ไม่แสดงตัวบ่งชี้การพิมพ์เลย
- `instant` - เริ่มแสดงการพิมพ์ **ทันทีที่ model loop เริ่มทำงาน** แม้ว่าการรัน
  จะส่งคืนเฉพาะโทเค็นตอบกลับแบบเงียบในภายหลังก็ตาม
- `thinking` - เริ่มแสดงการพิมพ์เมื่อมี **reasoning delta แรก** (ต้องใช้
  `reasoningLevel: "stream"` สำหรับการรัน)
- `message` - เริ่มแสดงการพิมพ์เมื่อมี **text delta แรกที่ไม่ใช่แบบเงียบ** (ละเว้น
  โทเค็นเงียบ `NO_REPLY`)

ลำดับของ “เริ่มเร็วเพียงใด”:
`never` → `message` → `thinking` → `instant`

## การกำหนดค่า

ตั้งค่าเริ่มต้นระดับ agent:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Override โหมดหรือจังหวะต่อ session:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## หมายเหตุ

- โหมด `message` จะไม่แสดงการพิมพ์สำหรับการตอบกลับที่มีเฉพาะแบบเงียบ เมื่อ payload ทั้งหมด
  เป็นโทเค็นเงียบตรงตัว (เช่น `NO_REPLY` / `no_reply`,
  จับคู่โดยไม่สนใจตัวพิมพ์ใหญ่เล็ก)
- `thinking` จะทำงานเฉพาะเมื่อการรันสตรีม reasoning (`reasoningLevel: "stream"`)
  หากโมเดลไม่ส่ง reasoning deltas การพิมพ์จะไม่เริ่ม
- การพิมพ์ของ Heartbeat เป็นสัญญาณ liveness สำหรับเป้าหมายการส่งที่ resolve แล้ว โดยจะ
  เริ่มตั้งแต่การรัน Heartbeat เริ่มขึ้น แทนที่จะตามเวลา stream ของ `message` หรือ `thinking`
  ตั้งค่า `typingMode: "never"` เพื่อปิดใช้งาน
- Heartbeats จะไม่แสดงการพิมพ์เมื่อ `target: "none"`, เมื่อไม่สามารถ resolve เป้าหมายได้,
  เมื่อปิดใช้งานการส่งผ่านแชทสำหรับ Heartbeat, หรือเมื่อช่องทางไม่รองรับการพิมพ์
- `typingIntervalSeconds` ควบคุม **จังหวะการรีเฟรช** ไม่ใช่เวลาเริ่มต้น
  ค่าเริ่มต้นคือ 6 วินาที

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="สถานะการปรากฏ" href="/th/concepts/presence" icon="signal">
    วิธีที่ Gateway ติดตาม clients ที่เชื่อมต่ออยู่และแสดงในแท็บ Instances ของ macOS
  </Card>
  <Card title="การสตรีมและการแบ่ง chunk" href="/th/concepts/streaming" icon="bars-staggered">
    พฤติกรรมการสตรีมขาออก ขอบเขตของ chunk และการส่งที่เฉพาะเจาะจงตามช่องทาง
  </Card>
</CardGroup>
