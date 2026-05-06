---
read_when:
    - คุณต้องการให้เอเจนต์ของคุณฟังดูไม่เป็นแบบทั่วไปมากนัก
    - คุณกำลังแก้ไข SOUL.md
    - คุณต้องการบุคลิกที่ชัดเจนขึ้นโดยไม่กระทบต่อความปลอดภัยหรือความกระชับ
summary: ใช้ SOUL.md เพื่อให้เอเจนต์ OpenClaw ของคุณมีน้ำเสียงเฉพาะตัวจริง ๆ แทนภาษาผู้ช่วยทั่วไปที่ไร้เอกลักษณ์
title: คู่มือบุคลิกภาพของ SOUL.md
x-i18n:
    generated_at: "2026-05-06T09:10:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` คือที่อยู่ของเสียงของเอเจนต์ของคุณ

OpenClaw จะฉีดไฟล์นี้เข้าไปในเซสชันปกติ ดังนั้นมันจึงมีน้ำหนักจริง หากเอเจนต์ของคุณ
ฟังดูจืดชืด ลังเล หรือเป็นองค์กรแบบแปลก ๆ นี่มักเป็นไฟล์ที่ควรแก้

## สิ่งที่ควรอยู่ใน SOUL.md

ใส่สิ่งที่เปลี่ยนความรู้สึกเวลาได้คุยกับเอเจนต์:

- น้ำเสียง
- ความเห็น
- ความกระชับ
- อารมณ์ขัน
- ขอบเขต
- ระดับความตรงไปตรงมาเริ่มต้น

อย่าเปลี่ยนมันให้เป็น:

- เรื่องราวชีวิต
- changelog
- กองนโยบายความปลอดภัย
- กำแพงความรู้สึกขนาดยักษ์ที่ไม่มีผลต่อพฤติกรรม

สั้นชนะยาว คมชนะคลุมเครือ

## ทำไมวิธีนี้ได้ผล

สิ่งนี้สอดคล้องกับคำแนะนำด้านพรอมป์ของ OpenAI:

- คู่มือวิศวกรรมพรอมป์บอกว่าพฤติกรรมระดับสูง น้ำเสียง เป้าหมาย และ
  ตัวอย่างควรอยู่ในชั้นคำสั่งที่มีลำดับความสำคัญสูง ไม่ใช่ถูกฝังไว้ใน
  รอบผู้ใช้
- คู่มือเดียวกันแนะนำให้มองพรอมป์เป็นสิ่งที่คุณทำซ้ำ ตรึงไว้ และประเมินผล
  ไม่ใช่ถ้อยคำวิเศษที่เขียนครั้งเดียวแล้วลืม

สำหรับ OpenClaw, `SOUL.md` คือชั้นนั้น

ถ้าคุณต้องการบุคลิกที่ดีขึ้น ให้เขียนคำสั่งที่แข็งแรงขึ้น ถ้าคุณต้องการบุคลิกที่เสถียร
ให้ทำให้กระชับและมีเวอร์ชัน

อ้างอิง OpenAI:

- [วิศวกรรมพรอมป์](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [บทบาทของข้อความและการทำตามคำสั่ง](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## พรอมป์ Molty

วางสิ่งนี้ลงในเอเจนต์ของคุณ แล้วให้มันเขียน `SOUL.md` ใหม่

พาธที่กำหนดไว้สำหรับเวิร์กสเปซ OpenClaw: ใช้ `SOUL.md` ไม่ใช่ `http://SOUL.md`

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

## รูปแบบที่ดีเป็นอย่างไร

กฎ `SOUL.md` ที่ดีมีหน้าตาแบบนี้:

- มีจุดยืน
- ข้ามคำฟุ่มเฟือย
- ตลกเมื่อเข้ากับบริบท
- ชี้ให้เห็นไอเดียแย่ ๆ ตั้งแต่เนิ่น ๆ
- กระชับ เว้นแต่ความลึกจะมีประโยชน์จริง ๆ

กฎ `SOUL.md` ที่แย่มีหน้าตาแบบนี้:

- รักษาความเป็นมืออาชีพตลอดเวลา
- ให้ความช่วยเหลืออย่างครอบคลุมและรอบคอบ
- ทำให้มั่นใจว่าจะได้รับประสบการณ์เชิงบวกและสนับสนุน

รายการที่สองนั่นคือวิธีที่คุณได้ของเละ ๆ

## คำเตือนหนึ่งข้อ

บุคลิกไม่ใช่ใบอนุญาตให้ทำงานลวก

เก็บ `AGENTS.md` ไว้สำหรับกฎการทำงาน เก็บ `SOUL.md` ไว้สำหรับเสียง จุดยืน และ
สไตล์ หากเอเจนต์ของคุณทำงานในช่องทางร่วม การตอบกลับสาธารณะ หรือพื้นผิวลูกค้า
ให้แน่ใจว่าน้ำเสียงยังเหมาะกับบริบทนั้น

คมคือดี น่ารำคาญไม่ใช่

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/th/concepts/agent-workspace" icon="folder-open">
    ไฟล์เวิร์กสเปซที่ OpenClaw ฉีดเข้าไปใน system prompt
  </Card>
  <Card title="System prompt" href="/th/concepts/system-prompt" icon="message-lines">
    วิธีที่ `SOUL.md` ถูกประกอบเข้าไปใน system prompt ต่อรอบ
  </Card>
  <Card title="SOUL.md template" href="/th/reference/templates/SOUL" icon="file-lines">
    เทมเพลตเริ่มต้นสำหรับไฟล์บุคลิก
  </Card>
</CardGroup>
