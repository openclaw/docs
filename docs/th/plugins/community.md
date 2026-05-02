---
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือแสดงรายการ Plugin ของคุณเอง
summary: 'Plugin ของ OpenClaw ที่ดูแลโดยชุมชน: เรียกดู ติดตั้ง และส่ง Plugin ของคุณเอง'
title: Plugin ของชุมชน
x-i18n:
    generated_at: "2026-05-02T20:47:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Plugin ชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วย
ช่องทาง เครื่องมือ ผู้ให้บริการ หรือความสามารถอื่น ๆ ใหม่ ๆ แพ็กเกจเหล่านี้สร้างและดูแล
โดยชุมชน โดยปกติเผยแพร่บน [ClawHub](/th/tools/clawhub) และติดตั้งได้
ด้วยคำสั่งเดียว npm ยังคงเป็นค่าเริ่มต้นสำหรับการเปิดใช้สเปกแพ็กเกจเปล่า
ขณะที่การติดตั้งแพ็ก ClawHub กำลังทยอยเปิดใช้

ClawHub คือพื้นผิวการค้นพบอย่างเป็นทางการสำหรับ Plugin ชุมชน อย่าเปิด
PR ที่มีแต่เอกสารเพียงเพื่อเพิ่ม Plugin ของคุณที่นี่ให้ค้นพบได้ง่ายขึ้น ให้เผยแพร่บน
ClawHub แทน

```bash
openclaw plugins install clawhub:<package-name>
```

ใช้ `openclaw plugins install <package-name>` สำหรับแพ็กเกจที่โฮสต์บน npm

## Plugin ที่แสดงรายการ

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วยสเครปเปอร์สำเร็จรูปกว่า 20,000 รายการ ให้เอเจนต์ของคุณ
ดึงข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, เว็บไซต์อีคอมเมิร์ซ และอื่น ๆ ได้ เพียงแค่สั่งถาม

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

บริดจ์ OpenClaw อิสระสำหรับการสนทนา Codex App Server ผูกแชตกับ
เธรด Codex พูดคุยด้วยข้อความธรรมดา และควบคุมด้วยคำสั่งแบบเนทีฟของแชต
สำหรับการดำเนินต่อ การวางแผน การรีวิว การเลือกโมเดล การทำ Compaction และอื่น ๆ

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

Plugin Lossless Context Management สำหรับ OpenClaw การสรุปบทสนทนาแบบใช้ DAG
พร้อม Compaction แบบเพิ่มทีละส่วน รักษาความถูกต้องครบถ้วนของบริบททั้งหมด
ขณะลดการใช้โทเค็น

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin อย่างเป็นทางการที่ส่งออก trace ของเอเจนต์ไปยัง Opik ตรวจสอบพฤติกรรมเอเจนต์
ค่าใช้จ่าย โทเค็น ข้อผิดพลาด และอื่น ๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

มอบอวาตาร์ Live2D ให้เอเจนต์ OpenClaw ของคุณ พร้อมการลิปซิงก์แบบเรียลไทม์
การแสดงอารมณ์ และการแปลงข้อความเป็นเสียง มีเครื่องมือสำหรับครีเอเตอร์เพื่อสร้างแอสเซ็ตด้วย AI
และปรับใช้ไปยัง Prometheus Marketplace ได้ในคลิกเดียว ขณะนี้อยู่ในระยะ alpha

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
[QQ Bot](/th/channels/qqbot) สำหรับการติดตั้งทั่วไป ติดตั้ง Plugin ภายนอกนี้เฉพาะ
เมื่อคุณตั้งใจต้องการแพ็กเกจสแตนด์อโลนที่ Tencent ดูแลเท่านั้น

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin ช่องทาง WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วย
การเชื่อมต่อถาวร WeCom Bot WebSocket รองรับข้อความตรงและแชตกลุ่ม
การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์ การจัดรูปแบบ Markdown
การควบคุมการเข้าถึงในตัว และ Skills ด้านเอกสาร/การประชุม/การส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin ช่องทาง Yuanbao สำหรับ OpenClaw โดยทีม Tencent Yuanbao ขับเคลื่อนด้วย
การเชื่อมต่อถาวร WebSocket รองรับข้อความตรงและแชตกลุ่ม
การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์/เสียง/วิดีโอ
การจัดรูปแบบ Markdown การควบคุมการเข้าถึงในตัว และเมนูคำสั่งแบบสแลช

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## ส่ง Plugin ของคุณ

เรายินดีรับ Plugin ชุมชนที่มีประโยชน์ มีเอกสาร และใช้งานได้อย่างปลอดภัย

<Steps>
  <Step title="Publish to ClawHub or npm">
    Plugin ของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`
    เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) เว้นแต่คุณจำเป็นต้องใช้การกระจาย
    ผ่าน npm เท่านั้นโดยเฉพาะ
    ดูคู่มือฉบับเต็มได้ที่ [Building Plugins](/th/plugins/building-plugins)

  </Step>

  <Step title="Host on GitHub">
    ซอร์สโค้ดต้องอยู่ในรีโพสาธารณะ พร้อมเอกสารการตั้งค่าและตัวติดตาม issue

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    คุณไม่จำเป็นต้องเปิด PR เอกสารเพียงเพื่อทำให้ Plugin ของคุณค้นพบได้ ให้เผยแพร่
    บน ClawHub แทน

    เปิด PR เอกสารเฉพาะเมื่อเอกสารต้นทางของ OpenClaw จำเป็นต้องมีการเปลี่ยนแปลง
    เนื้อหาจริง เช่น การแก้คำแนะนำการติดตั้ง หรือการเพิ่มเอกสารข้ามรีโป
    ที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## เกณฑ์คุณภาพ

| ข้อกำหนด                    | เหตุผล                                        |
| --------------------------- | --------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องใช้ `openclaw plugins install` ได้ |
| รีโพ GitHub สาธารณะ          | การรีวิวซอร์ส การติดตาม issue ความโปร่งใส   |
| เอกสารการตั้งค่าและการใช้งาน | ผู้ใช้ต้องรู้วิธีกำหนดค่า                    |
| การดูแลอย่างต่อเนื่อง        | มีการอัปเดตล่าสุดหรือการจัดการ issue ที่ตอบสนอง |

Wrapper ที่ใช้ความพยายามต่ำ ความเป็นเจ้าของที่ไม่ชัดเจน หรือแพ็กเกจที่ไม่มีการดูแลอาจถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [Install and Configure Plugins](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [Building Plugins](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest
