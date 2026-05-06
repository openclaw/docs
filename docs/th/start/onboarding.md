---
read_when:
    - การออกแบบผู้ช่วยเริ่มต้นใช้งาน macOS
    - การใช้งานการตั้งค่าการยืนยันตัวตนหรืออัตลักษณ์
sidebarTitle: 'Onboarding: macOS App'
summary: ขั้นตอนการตั้งค่าครั้งแรกสำหรับ OpenClaw (แอป macOS)
title: การเริ่มต้นใช้งาน (แอป macOS)
x-i18n:
    generated_at: "2026-05-06T09:31:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

เอกสารนี้อธิบายโฟลว์การตั้งค่าครั้งแรกในสถานะ **ปัจจุบัน** เป้าหมายคือประสบการณ์ "day 0" ที่ราบรื่น: เลือกตำแหน่งที่ Gateway ทำงาน เชื่อมต่อการยืนยันตัวตน เรียกใช้วิซาร์ด และให้เอเจนต์ bootstrap ตัวเอง
สำหรับภาพรวมทั่วไปของเส้นทาง onboarding โปรดดู [ภาพรวม Onboarding](/th/start/onboarding-overview).

<Steps>
<Step title="อนุมัติคำเตือน macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="อนุมัติการค้นหาเครือข่ายภายใน">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ข้อความต้อนรับและประกาศด้านความปลอดภัย">
<Frame caption="อ่านประกาศด้านความปลอดภัยที่แสดงอยู่ แล้วตัดสินใจตามนั้น">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

โมเดลความไว้วางใจด้านความปลอดภัย:

- โดยค่าเริ่มต้น OpenClaw เป็นเอเจนต์ส่วนบุคคล: ขอบเขตผู้ปฏิบัติการที่เชื่อถือได้หนึ่งคน
- การตั้งค่าแบบแชร์/หลายผู้ใช้ต้องมีการล็อกดาวน์ (แยกขอบเขตความไว้วางใจ จำกัดการเข้าถึงเครื่องมือให้น้อยที่สุด และปฏิบัติตาม [ความปลอดภัย](/th/gateway/security))
- ตอนนี้ Local onboarding ตั้งค่า config ใหม่เป็น `tools.profile: "coding"` โดยค่าเริ่มต้น เพื่อให้การตั้งค่าในเครื่องใหม่ยังคงมีเครื่องมือ filesystem/runtime โดยไม่บังคับใช้โปรไฟล์ `full` ที่ไม่จำกัด
- หากเปิดใช้งาน hooks/webhooks หรือฟีดเนื้อหาอื่นที่ไม่น่าเชื่อถือ ให้ใช้ระดับโมเดลสมัยใหม่ที่แข็งแรง และคงนโยบายเครื่องมือ/การ sandbox ที่เข้มงวดไว้

</Step>
<Step title="Local เทียบกับ Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** ทำงานที่ไหน?

- **Mac เครื่องนี้ (Local เท่านั้น):** onboarding สามารถกำหนดค่าการยืนยันตัวตนและเขียน credentials ไว้ในเครื่อง
- **Remote (ผ่าน SSH/Tailnet):** onboarding จะ **ไม่** กำหนดค่าการยืนยันตัวตนในเครื่อง; credentials ต้องมีอยู่บนโฮสต์ gateway
- **กำหนดค่าภายหลัง:** ข้ามการตั้งค่าและปล่อยให้แอปยังไม่ได้กำหนดค่า

<Tip>
**เคล็ดลับการยืนยันตัวตนของ Gateway:**

- ตอนนี้วิซาร์ดสร้าง **token** แม้แต่สำหรับ loopback ดังนั้นไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน
- หากคุณปิดใช้งานการยืนยันตัวตน โปรเซสภายในเครื่องใดๆ ก็สามารถเชื่อมต่อได้; ใช้แบบนั้นเฉพาะบนเครื่องที่เชื่อถือได้อย่างเต็มที่เท่านั้น
- ใช้ **token** สำหรับการเข้าถึงหลายเครื่องหรือการ bind ที่ไม่ใช่ loopback

</Tip>
</Step>
<Step title="สิทธิ์">
<Frame caption="เลือกสิทธิ์ที่คุณต้องการมอบให้ OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding ขอสิทธิ์ TCC ที่จำเป็นสำหรับ:

- Automation (AppleScript)
- การแจ้งเตือน
- การช่วยการเข้าถึง
- การบันทึกหน้าจอ
- ไมโครโฟน
- การรู้จำเสียงพูด
- กล้อง
- ตำแหน่งที่ตั้ง

</Step>
<Step title="CLI">
  <Info>ขั้นตอนนี้ไม่บังคับ</Info>
  แอปสามารถติดตั้ง CLI `openclaw` แบบ global ผ่าน npm, pnpm หรือ bun ได้
  แอปจะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun หากนั่นเป็น package manager
  เดียวที่ตรวจพบ สำหรับ runtime ของ Gateway ยังแนะนำให้ใช้ Node เป็นแนวทางหลัก
</Step>
<Step title="แชต Onboarding (เซสชันเฉพาะ)">
  หลังตั้งค่าเสร็จ แอปจะเปิดเซสชันแชต onboarding โดยเฉพาะ เพื่อให้เอเจนต์
  แนะนำตัวเองและนำทางขั้นตอนถัดไป วิธีนี้จะแยกคำแนะนำในการใช้งานครั้งแรก
  ออกจากบทสนทนาปกติของคุณ ดู [Bootstrapping](/th/start/bootstrapping) เพื่อดูว่า
  เกิดอะไรขึ้นบนโฮสต์ gateway ระหว่างการรันเอเจนต์ครั้งแรก
</Step>
</Steps>

## ที่เกี่ยวข้อง

- [ภาพรวม Onboarding](/th/start/onboarding-overview)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
