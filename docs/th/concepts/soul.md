---
read_when:
    - คุณต้องการให้เอเจนต์ของคุณฟังดูเป็นแบบทั่วไปน้อยลง
    - คุณกำลังแก้ไข SOUL.md
    - คุณต้องการบุคลิกที่ชัดเจนขึ้นโดยไม่ทำให้ความปลอดภัยหรือความกระชับเสียไป
summary: ใช้ SOUL.md เพื่อทำให้เอเจนต์ OpenClaw ของคุณมีน้ำเสียงจริง ๆ แทนที่จะเป็นข้อความผู้ช่วยทั่วไปที่ไร้เอกลักษณ์
title: คู่มือบุคลิกของ SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:30:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` คือที่ที่เสียงของ agent ของคุณอยู่

OpenClaw จะแทรกไฟล์นี้เข้าไปในเซสชันปกติ ดังนั้นมันจึงมีน้ำหนักจริง หาก agent ของคุณ
ฟังดูจืดชืด ลังเลเกินไป หรือเป็นภาษาบริษัทอย่างประหลาด ไฟล์นี้มักเป็นไฟล์ที่ควรแก้

## สิ่งที่ควรอยู่ใน SOUL.md

ใส่สิ่งที่เปลี่ยนความรู้สึกเวลาคุยกับ agent:

- น้ำเสียง
- ความเห็น
- ความกระชับ
- อารมณ์ขัน
- ขอบเขต
- ระดับความตรงไปตรงมาโดยปริยาย

**อย่า** ทำให้มันกลายเป็น:

- เรื่องราวชีวิต
- changelog
- กองนโยบายความปลอดภัย
- กำแพง vibe ขนาดใหญ่ที่ไม่มีผลต่อพฤติกรรม

สั้นชนะยาว ชัดคมชนะคลุมเครือ

## ทำไมวิธีนี้ถึงได้ผล

สิ่งนี้สอดคล้องกับคำแนะนำด้าน prompt ของ OpenAI:

- คู่มือ prompt engineering บอกว่าพฤติกรรมระดับสูง น้ำเสียง เป้าหมาย และ
  ตัวอย่างควรอยู่ในชั้นคำสั่งที่มีลำดับความสำคัญสูง ไม่ใช่ถูกฝังอยู่ใน
  เทิร์นของผู้ใช้
- คู่มือเดียวกันแนะนำให้ปฏิบัติต่อ prompt เหมือนสิ่งที่คุณวนปรับ ปักตรึง
  และประเมิน ไม่ใช่ถ้อยคำวิเศษที่เขียนครั้งเดียวแล้วลืมไป

สำหรับ OpenClaw, `SOUL.md` คือชั้นนั้น

ถ้าคุณอยากได้บุคลิกที่ดีขึ้น ให้เขียนคำสั่งที่แข็งแรงขึ้น ถ้าคุณอยากได้บุคลิกที่เสถียร
ให้เก็บคำสั่งให้กระชับและมีเวอร์ชัน

อ้างอิง OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [บทบาทของข้อความและการทำตามคำสั่ง](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt ของ Molty

วางสิ่งนี้ลงใน agent ของคุณ แล้วให้มันเขียน `SOUL.md` ใหม่

พาธที่กำหนดไว้สำหรับ workspace ของ OpenClaw: ใช้ `SOUL.md` ไม่ใช่ `http://SOUL.md`

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## หน้าตาของสิ่งที่ดี

กฎ `SOUL.md` ที่ดีจะฟังประมาณนี้:

- มีจุดยืน
- ข้ามคำเติม
- ตลกเมื่อเหมาะ
- ชี้ให้เห็นไอเดียแย่ตั้งแต่เนิ่น ๆ
- กระชับ เว้นแต่ความลึกจะมีประโยชน์จริง ๆ

กฎ `SOUL.md` ที่แย่จะฟังประมาณนี้:

- รักษาความเป็นมืออาชีพตลอดเวลา
- ให้ความช่วยเหลือที่ครอบคลุมและรอบคอบ
- รับประกันประสบการณ์ที่เป็นบวกและสนับสนุน

รายการที่สองนั่นคือวิธีที่คุณได้ของเละ ๆ

## คำเตือนหนึ่งข้อ

บุคลิกไม่ใช่ใบอนุญาตให้ทำงานลวก

เก็บ `AGENTS.md` ไว้สำหรับกฎการปฏิบัติงาน เก็บ `SOUL.md` ไว้สำหรับเสียง จุดยืน และ
สไตล์ หาก agent ของคุณทำงานในช่องทางร่วม การตอบกลับสาธารณะ หรือพื้นผิวที่ลูกค้าเห็น
ตรวจให้แน่ใจว่าน้ำเสียงยังเหมาะกับบริบทนั้น

คมคือดี น่ารำคาญไม่ใช่

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/th/concepts/agent-workspace" icon="folder-open">
    ไฟล์ workspace ที่ OpenClaw แทรกเข้าไปในบริบทของโมเดล
  </Card>
  <Card title="System prompt" href="/th/concepts/system-prompt" icon="message-lines">
    วิธีที่ `SOUL.md` ถูกประกอบเข้าไปในบริบทรันไทม์ของ OpenClaw และ Codex
  </Card>
  <Card title="SOUL.md template" href="/th/reference/templates/SOUL" icon="file-lines">
    เทมเพลตเริ่มต้นสำหรับไฟล์บุคลิก
  </Card>
</CardGroup>
