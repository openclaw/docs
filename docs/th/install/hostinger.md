---
read_when:
    - การตั้งค่า OpenClaw บน Hostinger
    - กำลังมองหา VPS แบบมีการจัดการสำหรับ OpenClaw
    - การใช้ OpenClaw แบบ 1-Click บน Hostinger
summary: โฮสต์ OpenClaw บน Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T09:18:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
    postprocess_version: locale-links-v1
---

รัน OpenClaw Gateway แบบคงอยู่ถาวรบน [Hostinger](https://www.hostinger.com/openclaw) ผ่านการติดตั้งแบบจัดการ **1-Click** หรือการติดตั้งบน **VPS**

## ข้อกำหนดเบื้องต้น

- บัญชี Hostinger ([สมัคร](https://www.hostinger.com/openclaw))
- เวลาประมาณ 5-10 นาที

## ตัวเลือก A: OpenClaw แบบ 1-Click

วิธีที่เร็วที่สุดในการเริ่มต้น Hostinger จะจัดการโครงสร้างพื้นฐาน Docker และการอัปเดตอัตโนมัติให้

<Steps>
  <Step title="ซื้อและเปิดใช้งาน">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน Managed OpenClaw และทำการชำระเงินให้เสร็จ

    <Note>
    ระหว่างการชำระเงิน คุณสามารถเลือกเครดิต **Ready-to-Use AI** ที่ซื้อไว้ล่วงหน้าและรวมใช้งานได้ทันทีภายใน OpenClaw -- ไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการรายอื่น คุณสามารถเริ่มแชตได้ทันที หรือจะใส่คีย์ของคุณเองจาก Anthropic, OpenAI, Google Gemini หรือ xAI ระหว่างการตั้งค่าก็ได้
    </Note>

  </Step>

  <Step title="เลือกช่องทางการส่งข้อความ">
    เลือกหนึ่งช่องทางหรือมากกว่านั้นเพื่อเชื่อมต่อ:

    - **WhatsApp** -- สแกน QR code ที่แสดงใน setup wizard
    - **Telegram** -- วาง bot token จาก [BotFather](https://t.me/BotFather)

  </Step>

  <Step title="ติดตั้งให้เสร็จสมบูรณ์">
    คลิก **Finish** เพื่อ deploy อินสแตนซ์ เมื่อพร้อมแล้ว ให้เข้าถึงแดชบอร์ด OpenClaw จาก **OpenClaw Overview** ใน hPanel
  </Step>

</Steps>

## ตัวเลือก B: OpenClaw บน VPS

ควบคุมเซิร์ฟเวอร์ของคุณได้มากกว่า Hostinger จะ deploy OpenClaw ผ่าน Docker บน VPS ของคุณ และคุณจะจัดการมันผ่าน **Docker Manager** ใน hPanel

<Steps>
  <Step title="ซื้อ VPS">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน OpenClaw on VPS และทำการชำระเงินให้เสร็จ

    <Note>
    คุณสามารถเลือกเครดิต **Ready-to-Use AI** ระหว่างการชำระเงินได้ -- เครดิตเหล่านี้ซื้อไว้ล่วงหน้าและรวมใช้งานได้ทันทีภายใน OpenClaw ทำให้คุณเริ่มแชตได้โดยไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการอื่น
    </Note>

  </Step>

  <Step title="กำหนดค่า OpenClaw">
    เมื่อ VPS ถูก provision แล้ว ให้กรอกฟิลด์การกำหนดค่า:

    - **Gateway token** -- สร้างให้อัตโนมัติ; บันทึกไว้ใช้ภายหลัง
    - **หมายเลข WhatsApp** -- หมายเลขของคุณพร้อมรหัสประเทศ (ไม่บังคับ)
    - **Telegram bot token** -- จาก [BotFather](https://t.me/BotFather) (ไม่บังคับ)
    - **API keys** -- จำเป็นเฉพาะเมื่อคุณไม่ได้เลือกเครดิต Ready-to-Use AI ระหว่างการชำระเงิน

  </Step>

  <Step title="เริ่ม OpenClaw">
    คลิก **Deploy** เมื่อระบบทำงานแล้ว ให้เปิดแดชบอร์ด OpenClaw จาก hPanel โดยคลิกที่ **Open**
  </Step>

</Steps>

log การรีสตาร์ท และการอัปเดต จะถูกจัดการโดยตรงจากอินเทอร์เฟซ Docker Manager ใน hPanel หากต้องการอัปเดต ให้กด **Update** ใน Docker Manager แล้วระบบจะดึง image ล่าสุดมาให้

## ตรวจสอบการตั้งค่าของคุณ

ส่งคำว่า "Hi" ไปยังผู้ช่วยของคุณบนช่องทางที่คุณเชื่อมต่อไว้ OpenClaw จะตอบกลับและพาคุณตั้งค่าความชอบเริ่มต้น

## การแก้ไขปัญหา

**แดชบอร์ดไม่โหลด** -- รอสักครู่ให้คอนเทนเนอร์ provision เสร็จ ตรวจสอบ log ใน Docker Manager ของ hPanel

**Docker container รีสตาร์ทตลอด** -- เปิด log ใน Docker Manager และมองหาข้อผิดพลาดในการกำหนดค่า (โทเค็นหายไป, API key ไม่ถูกต้อง)

**Telegram bot ไม่ตอบ** -- ส่งข้อความรหัสจับคู่ของคุณจาก Telegram เป็นข้อความตรงภายในแชต OpenClaw เพื่อทำการเชื่อมต่อให้เสร็จ

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือก config ทั้งหมด

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [VPS hosting](/th/vps)
- [DigitalOcean](/th/install/digitalocean)
