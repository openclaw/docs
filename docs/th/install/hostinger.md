---
read_when:
    - การตั้งค่า OpenClaw บน Hostinger
    - กำลังมองหา VPS แบบมีการจัดการสำหรับ OpenClaw
    - การใช้ OpenClaw แบบ 1-Click ของ Hostinger
summary: โฮสต์ OpenClaw บน Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T16:15:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน [Hostinger](https://www.hostinger.com/openclaw) โดยเลือกได้ทั้งการปรับใช้แบบมีการจัดการด้วย **1-Click** หรือการติดตั้งบน **VPS** ที่คุณดูแลด้วยตนเอง

## ข้อกำหนดเบื้องต้น

- บัญชี Hostinger ([สมัครใช้งาน](https://www.hostinger.com/openclaw))
- ใช้เวลาประมาณ 5-10 นาที

## ตัวเลือก A: OpenClaw แบบ 1-Click

Hostinger จะดูแลโครงสร้างพื้นฐาน, Docker และการอัปเดตอัตโนมัติให้ เป็นวิธีที่รวดเร็วที่สุดในการเริ่มใช้งานอินสแตนซ์

<Steps>
  <Step title="ซื้อและเริ่มใช้งาน">
    1. จาก[หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน Managed OpenClaw และดำเนินการชำระเงินให้เสร็จสิ้น

    <Note>
    ระหว่างชำระเงิน คุณสามารถเลือกเครดิต **Ready-to-Use AI** ซึ่งชำระเงินล่วงหน้าและผสานรวมใน OpenClaw ได้ทันที โดยไม่ต้องมีบัญชีภายนอกหรือคีย์ API จากผู้ให้บริการรายอื่น คุณสามารถเริ่มแชตได้ทันที หรือระบุคีย์ของคุณเองจาก Anthropic, OpenAI, Google Gemini หรือ xAI ระหว่างการตั้งค่า
    </Note>

  </Step>

  <Step title="เลือกช่องทางรับส่งข้อความ">
    เลือกเชื่อมต่ออย่างน้อยหนึ่งช่องทาง:

    - **WhatsApp** -- สแกนคิวอาร์โค้ดที่แสดงในตัวช่วยตั้งค่า
    - **Telegram** -- วางโทเค็นบอตจาก [BotFather](https://t.me/BotFather)

  </Step>

  <Step title="ติดตั้งให้เสร็จสมบูรณ์">
    คลิก **Finish** เพื่อปรับใช้อินสแตนซ์ เมื่อพร้อมแล้ว ให้เข้าถึงแดชบอร์ด OpenClaw จาก **OpenClaw Overview** ใน hPanel
  </Step>

</Steps>

## ตัวเลือก B: OpenClaw บน VPS

ควบคุมเซิร์ฟเวอร์ได้มากขึ้น Hostinger จะปรับใช้ OpenClaw ผ่าน Docker บน VPS ของคุณ โดยคุณจัดการผ่าน **Docker Manager** ใน hPanel

<Steps>
  <Step title="ซื้อ VPS">
    1. จาก[หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน OpenClaw on VPS และดำเนินการชำระเงินให้เสร็จสิ้น

    <Note>
    คุณสามารถเลือกเครดิต **Ready-to-Use AI** ระหว่างชำระเงินได้ เครดิตเหล่านี้ชำระเงินล่วงหน้าและผสานรวมใน OpenClaw ได้ทันที คุณจึงเริ่มแชตได้โดยไม่ต้องมีบัญชีภายนอกหรือคีย์ API จากผู้ให้บริการรายอื่น
    </Note>

  </Step>

  <Step title="กำหนดค่า OpenClaw">
    เมื่อจัดเตรียม VPS แล้ว ให้กรอกช่องการกำหนดค่า:

    - **โทเค็น Gateway** -- สร้างโดยอัตโนมัติ โปรดบันทึกไว้ใช้ภายหลัง
    - **หมายเลข WhatsApp** -- หมายเลขของคุณพร้อมรหัสประเทศ (ไม่บังคับ)
    - **โทเค็นบอต Telegram** -- จาก [BotFather](https://t.me/BotFather) (ไม่บังคับ)
    - **คีย์ API** -- จำเป็นเฉพาะเมื่อคุณไม่ได้เลือกเครดิต Ready-to-Use AI ระหว่างชำระเงิน

  </Step>

  <Step title="เริ่ม OpenClaw">
    คลิก **Deploy** เมื่อเริ่มทำงานแล้ว ให้เปิดแดชบอร์ด OpenClaw จาก hPanel โดยคลิก **Open**
  </Step>

</Steps>

จัดการบันทึก การเริ่มระบบใหม่ และการอัปเดตผ่านอินเทอร์เฟซ Docker Manager ใน hPanel หากต้องการอัปเดต ให้กด **Update** ใน Docker Manager เพื่อดึงอิมเมจล่าสุด

## ตรวจสอบการตั้งค่า

ส่ง "สวัสดี" ถึงผู้ช่วยของคุณในช่องทางที่เชื่อมต่อไว้ OpenClaw จะตอบกลับและแนะนำคุณในการตั้งค่าเริ่มต้น

## การแก้ไขปัญหา

**แดชบอร์ดไม่โหลด** -- รอสักครู่เพื่อให้คอนเทนเนอร์จัดเตรียมระบบเสร็จสิ้น จากนั้นตรวจสอบบันทึก Docker Manager ใน hPanel

**คอนเทนเนอร์ Docker เริ่มระบบใหม่ซ้ำๆ** -- เปิดบันทึก Docker Manager และตรวจหาข้อผิดพลาดในการกำหนดค่า (โทเค็นหายไป คีย์ API ไม่ถูกต้อง)

**บอต Telegram ไม่ตอบสนอง** -- หากจำเป็นต้องจับคู่ข้อความส่วนตัว ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่สั้นๆ แทนการตอบกลับ ให้อนุมัติผ่านแชตในแดชบอร์ด OpenClaw หรือใช้ `openclaw pairing approve telegram <CODE>` หากคุณมีสิทธิ์เข้าถึงเชลล์ของคอนเทนเนอร์ ดู[การจับคู่](/th/channels/pairing)

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [โฮสติ้ง VPS](/th/vps)
- [DigitalOcean](/th/install/digitalocean)
