---
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือแสดงรายการ Plugin ของคุณเอง
summary: 'Plugin OpenClaw ที่ดูแลโดยชุมชน: เรียกดู ติดตั้ง และส่ง Plugin ของคุณเอง'
title: Plugin ของชุมชน
x-i18n:
    generated_at: "2026-04-30T10:05:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugin ชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วยช่องทาง เครื่องมือ ผู้ให้บริการ หรือความสามารถอื่นๆ ใหม่ สร้างและดูแลโดยชุมชน โดยปกติเผยแพร่บน [ClawHub](/th/tools/clawhub) และติดตั้งได้ด้วยคำสั่งเดียว npm ยังคงเป็นทางเลือกสำรองที่รองรับสำหรับแพ็กเกจที่ยังไม่ได้ย้ายไป ClawHub

ClawHub คือพื้นที่ค้นพบอย่างเป็นทางการสำหรับ Plugin ชุมชน อย่าเปิด PR เฉพาะเอกสารเพียงเพื่อเพิ่ม Plugin ของคุณที่นี่ให้ค้นพบได้ง่ายขึ้น ให้เผยแพร่บน ClawHub แทน

```bash
openclaw plugins install <package-name>
```

OpenClaw ตรวจสอบ ClawHub ก่อน และย้อนกลับไปใช้ npm โดยอัตโนมัติ

## Plugin ที่อยู่ในรายการ

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วยสเครเปอร์สำเร็จรูปกว่า 20,000 รายการ ให้เอเจนต์ของคุณดึงข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, เว็บไซต์อีคอมเมิร์ซ และอื่นๆ ได้ เพียงแค่สั่งถาม

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

บริดจ์ OpenClaw อิสระสำหรับบทสนทนา Codex App Server ผูกแชตเข้ากับเธรด Codex พูดคุยด้วยข้อความธรรมดา และควบคุมด้วยคำสั่งแบบเนทีฟของแชตสำหรับการดำเนินการต่อ การวางแผน การรีวิว การเลือกโมเดล Compaction และอื่นๆ

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

การผสานรวมโรบอตองค์กรโดยใช้โหมด Stream รองรับข้อความ รูปภาพ และข้อความไฟล์ผ่านไคลเอนต์ DingTalk ใดก็ได้

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management สำหรับ OpenClaw การสรุปบทสนทนาแบบอิง DAG พร้อม Compaction แบบเพิ่มทีละส่วน รักษาความเที่ยงตรงของบริบทเต็มรูปแบบไว้พร้อมลดการใช้โทเคน

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin อย่างเป็นทางการที่ส่งออก trace ของเอเจนต์ไปยัง Opik ตรวจสอบพฤติกรรมเอเจนต์ ค่าใช้จ่าย โทเคน ข้อผิดพลาด และอื่นๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

มอบอวตาร Live2D ให้เอเจนต์ OpenClaw ของคุณ พร้อมลิปซิงก์แบบเรียลไทม์ การแสดงอารมณ์ และการแปลงข้อความเป็นเสียง รวมเครื่องมือสำหรับผู้สร้างเพื่อสร้างแอสเซ็ตด้วย AI และปรับใช้ไปยัง Prometheus Marketplace ได้ในคลิกเดียว ขณะนี้อยู่ในระยะอัลฟา

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

เชื่อมต่อ OpenClaw กับ QQ ผ่าน QQ Bot API รองรับแชตส่วนตัว การกล่าวถึงในกลุ่ม ข้อความช่องทาง และสื่อแบบ rich media รวมถึงเสียง รูปภาพ วิดีโอ และไฟล์

OpenClaw รุ่นปัจจุบันรวม QQ Bot มาให้แล้ว ใช้การตั้งค่าที่รวมมาใน [QQ Bot](/th/channels/qqbot) สำหรับการติดตั้งทั่วไป ติดตั้ง Plugin ภายนอกนี้เฉพาะเมื่อคุณตั้งใจต้องการแพ็กเกจแบบสแตนด์อโลนที่ Tencent ดูแลเท่านั้น

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin ช่องทาง WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วยการเชื่อมต่อถาวร WeCom Bot WebSocket รองรับข้อความโดยตรงและแชตกลุ่ม การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์ การจัดรูปแบบ Markdown การควบคุมการเข้าถึงในตัว และ Skills ด้านเอกสาร/การประชุม/การส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin ช่องทาง Yuanbao สำหรับ OpenClaw โดยทีม Tencent Yuanbao ขับเคลื่อนด้วยการเชื่อมต่อถาวร WebSocket รองรับข้อความโดยตรงและแชตกลุ่ม การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์/เสียง/วิดีโอ การจัดรูปแบบ Markdown การควบคุมการเข้าถึงในตัว และเมนูคำสั่งแบบ slash

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## ส่ง Plugin ของคุณ

เรายินดีรับ Plugin ชุมชนที่มีประโยชน์ มีเอกสารประกอบ และปลอดภัยในการใช้งาน

<Steps>
  <Step title="เผยแพร่ไปยัง ClawHub หรือ npm">
    Plugin ของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`
    เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) เว้นแต่คุณจำเป็นต้องเผยแพร่
    ผ่าน npm เท่านั้นโดยเฉพาะ
    ดู [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับคู่มือฉบับเต็ม

  </Step>

  <Step title="โฮสต์บน GitHub">
    ซอร์สโค้ดต้องอยู่ในรีโพสาธารณะที่มีเอกสารการตั้งค่าและตัวติดตามปัญหา

  </Step>

  <Step title="ใช้ PR เอกสารเฉพาะสำหรับการเปลี่ยนแปลงเอกสารซอร์ส">
    คุณไม่จำเป็นต้องเปิด PR เอกสารเพียงเพื่อทำให้ Plugin ของคุณค้นพบได้ง่ายขึ้น ให้เผยแพร่บน ClawHub แทน

    เปิด PR เอกสารเฉพาะเมื่อเอกสารซอร์สของ OpenClaw ต้องมีการเปลี่ยนแปลงเนื้อหาจริง เช่น แก้ไขคำแนะนำการติดตั้ง หรือเพิ่มเอกสารข้ามรีโพที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## เกณฑ์คุณภาพ

| ข้อกำหนด                 | เหตุผล                                           |
| --------------------------- | --------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องการให้ `openclaw plugins install` ใช้งานได้ |
| รีโพ GitHub สาธารณะ          | การตรวจสอบซอร์ส การติดตามปัญหา ความโปร่งใส   |
| เอกสารการตั้งค่าและการใช้งาน        | ผู้ใช้ต้องรู้วิธีกำหนดค่า        |
| การดูแลอย่างต่อเนื่อง          | การอัปเดตล่าสุดหรือการจัดการปัญหาที่ตอบสนองรวดเร็ว   |

ตัวห่อแบบลงแรงน้อย ความเป็นเจ้าของที่ไม่ชัดเจน หรือแพ็กเกจที่ไม่ได้รับการดูแลอาจถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
