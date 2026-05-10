---
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือแสดงรายการ Plugin ของคุณเอง
summary: 'Plugin ของ OpenClaw ที่ชุมชนดูแล: เรียกดู ติดตั้ง และส่ง Plugin ของคุณเอง'
title: Plugin จากชุมชน
x-i18n:
    generated_at: "2026-05-10T19:47:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Plugin ของชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วย
ช่องทาง เครื่องมือ ผู้ให้บริการ หรือความสามารถอื่นๆ ใหม่ โดยชุมชนเป็นผู้สร้างและดูแล
โดยมักเผยแพร่บน [ClawHub](/th/clawhub) และติดตั้งได้
ด้วยคำสั่งเดียว npm ยังคงเป็นค่าเริ่มต้นสำหรับการเริ่มใช้งานด้วยสเป็กแพ็กเกจเปล่า
ระหว่างที่การติดตั้งแพ็กของ ClawHub กำลังทยอยเปิดใช้งาน

ClawHub คือพื้นที่ค้นพบมาตรฐานสำหรับ Plugin ของชุมชน อย่าเปิด
PR เฉพาะเอกสารเพียงเพื่อเพิ่ม Plugin ของคุณไว้ที่นี่เพื่อให้ค้นพบได้ง่ายขึ้น ให้เผยแพร่บน
ClawHub แทน

```bash
openclaw plugins install clawhub:<package-name>
```

ใช้ `openclaw plugins install <package-name>` สำหรับแพ็กเกจที่โฮสต์บน npm

## Plugin ที่แสดงรายการ

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วยสเครเปอร์สำเร็จรูปกว่า 20,000 รายการ ให้เอเจนต์ของคุณ
สกัดข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, เว็บไซต์อีคอมเมิร์ซ และอื่นๆ ได้ เพียงแค่สั่งถาม

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

บริดจ์ OpenClaw อิสระสำหรับการสนทนาของ Codex App Server ผูกแชตเข้ากับ
เธรด Codex พูดคุยด้วยข้อความธรรมดา และควบคุมด้วยคำสั่งที่เป็นธรรมชาติในแชต
สำหรับการดำเนินการต่อ การวางแผน การรีวิว การเลือกรุ่น Compaction และอื่นๆ

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

การผสานรวมโรบอตสำหรับองค์กรโดยใช้โหมด Stream รองรับข้อความ รูปภาพ และ
ข้อความไฟล์ผ่านไคลเอนต์ DingTalk ใดก็ได้

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin การจัดการบริบทแบบไม่สูญเสียข้อมูลสำหรับ OpenClaw การสรุปบทสนทนา
แบบอิง DAG พร้อม Compaction แบบเพิ่มทีละส่วน ซึ่งรักษาความครบถ้วนของบริบททั้งหมด
พร้อมลดการใช้โทเค็น

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ทางการที่ส่งออกเทรซของเอเจนต์ไปยัง Opik ตรวจสอบพฤติกรรมของเอเจนต์
ค่าใช้จ่าย โทเค็น ข้อผิดพลาด และอื่นๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

ให้เอเจนต์ OpenClaw ของคุณมีอวาตาร์ Live2D พร้อมลิปซิงก์แบบเรียลไทม์
การแสดงอารมณ์ และการแปลงข้อความเป็นเสียง รวมเครื่องมือสำหรับผู้สร้างเพื่อสร้างแอสเซตด้วย AI
และการปรับใช้ไปยัง Prometheus Marketplace ได้ในคลิกเดียว ขณะนี้อยู่ในสถานะ alpha

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

เชื่อมต่อ OpenClaw กับ QQ ผ่าน QQ Bot API รองรับแชตส่วนตัว การกล่าวถึงในกลุ่ม
ข้อความช่องทาง และสื่อสมบูรณ์ รวมถึงเสียง รูปภาพ วิดีโอ
และไฟล์

OpenClaw รุ่นปัจจุบันรวม QQ Bot มาให้ ใช้การตั้งค่าที่รวมมาใน
[QQ Bot](/th/channels/qqbot) สำหรับการติดตั้งปกติ ให้ติดตั้ง Plugin ภายนอกนี้เฉพาะ
เมื่อคุณต้องการแพ็กเกจสแตนด์อโลนที่ Tencent ดูแลโดยตั้งใจเท่านั้น

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin ช่องทาง WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วย
การเชื่อมต่อถาวรของ WeCom Bot WebSocket รองรับข้อความโดยตรงและแชตกลุ่ม
การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์ การจัดรูปแบบ Markdown
การควบคุมการเข้าถึงในตัว และ Skills ด้านเอกสาร/การประชุม/การส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin ช่องทาง Yuanbao สำหรับ OpenClaw โดยทีม Tencent Yuanbao ขับเคลื่อนด้วย
การเชื่อมต่อถาวรของ WebSocket รองรับข้อความโดยตรงและแชตกลุ่ม
การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์/เสียง/วิดีโอ
การจัดรูปแบบ Markdown การควบคุมการเข้าถึงในตัว และเมนูคำสั่งแบบสแลช

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## ส่ง Plugin ของคุณ

เรายินดีรับ Plugin ของชุมชนที่มีประโยชน์ มีเอกสารประกอบ และปลอดภัยต่อการใช้งาน

<Steps>
  <Step title="เผยแพร่ไปยัง ClawHub หรือ npm">
    Plugin ของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`
    เผยแพร่ไปยัง [ClawHub](/th/clawhub) เว้นแต่คุณต้องการการจัดจำหน่ายแบบ
    npm เท่านั้นโดยเฉพาะ
    ดู [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับคู่มือฉบับเต็ม

  </Step>

  <Step title="โฮสต์บน GitHub">
    ซอร์สโค้ดต้องอยู่ในรีโพสาธารณะ พร้อมเอกสารการตั้งค่าและตัวติดตามปัญหา

  </Step>

  <Step title="ใช้ PR เอกสารเฉพาะสำหรับการเปลี่ยนแปลงซอร์สเอกสาร">
    คุณไม่จำเป็นต้องมี PR เอกสารเพียงเพื่อทำให้ Plugin ของคุณค้นพบได้ เผยแพร่บน
    ClawHub แทน

    เปิด PR เอกสารเฉพาะเมื่อเอกสารซอร์สของ OpenClaw ต้องมีการเปลี่ยนแปลงเนื้อหา
    จริง เช่น การแก้ไขคำแนะนำการติดตั้งหรือเพิ่มเอกสารข้ามรีโพ
    ที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## มาตรฐานคุณภาพ

| ข้อกำหนด                 | เหตุผล                                           |
| --------------------------- | --------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องการให้ `openclaw plugins install` ทำงานได้ |
| รีโพ GitHub สาธารณะ          | การรีวิวซอร์ส การติดตามปัญหา ความโปร่งใส   |
| เอกสารการตั้งค่าและการใช้งาน        | ผู้ใช้ต้องรู้วิธีกำหนดค่า        |
| การดูแลอย่างต่อเนื่อง          | มีการอัปเดตล่าสุดหรือการจัดการปัญหาอย่างตอบสนอง   |

ตัวห่อที่ใช้ความพยายามต่ำ ความเป็นเจ้าของที่ไม่ชัดเจน หรือแพ็กเกจที่ไม่มีผู้ดูแลอาจถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest
