---
read_when:
    - การตั้งค่า OpenClaw บน Hostinger
    - กำลังมองหา VPS แบบ managed สำหรับ OpenClaw
    - การใช้ OpenClaw แบบ 1-Click บน Hostinger
summary: โฮสต์ OpenClaw บน Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T10:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

รัน OpenClaw Gateway แบบถาวรบน [Hostinger](https://www.hostinger.com/openclaw) ผ่านการติดตั้งแบบ managed **1-Click** หรือการติดตั้งบน **VPS**

## ข้อกำหนดเบื้องต้น

- บัญชี Hostinger ([สมัครใช้งาน](https://www.hostinger.com/openclaw))
- ใช้เวลาประมาณ 5-10 นาที

## ตัวเลือก A: OpenClaw แบบ 1-Click

วิธีที่เร็วที่สุดในการเริ่มต้น Hostinger จะดูแลโครงสร้างพื้นฐาน Docker และการอัปเดตอัตโนมัติให้

<Steps>
  <Step title="ซื้อและเปิดใช้งาน">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) เลือกแพ็กเกจ Managed OpenClaw และดำเนินการชำระเงินให้เสร็จสิ้น

    <Note>
    ระหว่างการชำระเงิน คุณสามารถเลือกเครดิต **Ready-to-Use AI** ที่ซื้อไว้ล่วงหน้าและผสานรวมพร้อมใช้งานทันทีภายใน OpenClaw โดยไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการรายอื่น คุณสามารถเริ่มแชตได้ทันที อีกทางหนึ่ง คุณสามารถระบุ key ของคุณเองจาก Anthropic, OpenAI, Google Gemini หรือ xAI ระหว่างการตั้งค่า
    </Note>

  </Step>

  <Step title="เลือกช่องทางการส่งข้อความ">
    เลือกหนึ่งหรือหลาย channels ที่ต้องการเชื่อมต่อ:

    - **WhatsApp** -- สแกน QR code ที่แสดงในตัวช่วยตั้งค่า
    - **Telegram** -- วาง bot token จาก [BotFather](https://t.me/BotFather)

  </Step>

  <Step title="ติดตั้งให้เสร็จสมบูรณ์">
    คลิก **Finish** เพื่อ deploy อินสแตนซ์ เมื่อพร้อมแล้ว ให้เข้าถึงแดชบอร์ด OpenClaw จาก **OpenClaw Overview** ใน hPanel
  </Step>

</Steps>

## ตัวเลือก B: OpenClaw บน VPS

ควบคุมเซิร์ฟเวอร์ของคุณได้มากกว่า Hostinger จะ deploy OpenClaw ผ่าน Docker บน VPS ของคุณ และคุณจะจัดการผ่าน **Docker Manager** ใน hPanel

<Steps>
  <Step title="ซื้อ VPS">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) เลือกแพ็กเกจ OpenClaw on VPS และดำเนินการชำระเงินให้เสร็จสิ้น

    <Note>
    คุณสามารถเลือกเครดิต **Ready-to-Use AI** ระหว่างการชำระเงินได้เช่นกัน ซึ่งเครดิตเหล่านี้จะถูกซื้อไว้ล่วงหน้าและผสานรวมพร้อมใช้งานทันทีภายใน OpenClaw ดังนั้นคุณจึงเริ่มแชตได้โดยไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการรายอื่น
    </Note>

  </Step>

  <Step title="กำหนดค่า OpenClaw">
    เมื่อ VPS ถูก provision แล้ว ให้กรอกข้อมูลในช่องการกำหนดค่า:

    - **Gateway token** -- สร้างให้อัตโนมัติ; บันทึกไว้เพื่อใช้ภายหลัง
    - **หมายเลข WhatsApp** -- หมายเลขของคุณพร้อมรหัสประเทศ (ไม่บังคับ)
    - **Telegram bot token** -- จาก [BotFather](https://t.me/BotFather) (ไม่บังคับ)
    - **API keys** -- จำเป็นเฉพาะเมื่อคุณไม่ได้เลือกเครดิต Ready-to-Use AI ระหว่างการชำระเงิน

  </Step>

  <Step title="เริ่ม OpenClaw">
    คลิก **Deploy** เมื่อระบบทำงานแล้ว ให้เปิดแดชบอร์ด OpenClaw จาก hPanel โดยคลิก **Open**
  </Step>

</Steps>

บันทึกการทำงาน การรีสตาร์ท และการอัปเดตจะถูกจัดการโดยตรงจากอินเทอร์เฟซ Docker Manager ใน hPanel หากต้องการอัปเดต ให้กด **Update** ใน Docker Manager แล้วระบบจะดึงอิมเมจล่าสุด

## ตรวจสอบการตั้งค่าของคุณ

ส่งข้อความ "Hi" ไปยังผู้ช่วยของคุณบน channel ที่คุณเชื่อมต่อ OpenClaw จะตอบกลับและแนะนำคุณผ่านการตั้งค่าความชอบเริ่มต้น

## การแก้ไขปัญหา

**แดชบอร์ดไม่โหลด** -- รอสักสองสามนาทีเพื่อให้ container provision เสร็จ ตรวจสอบบันทึก Docker Manager ใน hPanel

**Docker container รีสตาร์ทตลอด** -- เปิดบันทึก Docker Manager และมองหาข้อผิดพลาดในการกำหนดค่า (token หายไป, API key ไม่ถูกต้อง)

**Telegram bot ไม่ตอบสนอง** -- ส่งข้อความ pairing code ของคุณจาก Telegram โดยตรงเป็นข้อความภายในแชต OpenClaw ของคุณเพื่อทำการเชื่อมต่อให้เสร็จสมบูรณ์

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
