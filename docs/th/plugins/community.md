---
read_when:
    - คุณต้องการค้นหาปลั๊กอิน OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือแสดงรายการ Plugin ของคุณเอง
summary: 'ปลั๊กอิน OpenClaw ที่ชุมชนดูแลร่วมกัน: เรียกดู ติดตั้ง และส่งปลั๊กอินของคุณเอง'
title: ปลั๊กอินชุมชน
x-i18n:
    generated_at: "2026-04-26T11:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

ปลั๊กอินชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วย
channels, tools, providers หรือความสามารถอื่น ๆ ปลั๊กอินเหล่านี้ถูกสร้างและดูแลรักษา
โดยชุมชน เผยแพร่บน [ClawHub](/th/tools/clawhub) หรือ npm และ
ติดตั้งได้ด้วยคำสั่งเดียว

ClawHub คือพื้นผิวการค้นพบหลักอย่างเป็นทางการสำหรับปลั๊กอินชุมชน อย่าเปิด
PR เฉพาะ docs เพียงเพื่อเพิ่มปลั๊กอินของคุณที่นี่เพื่อให้ค้นพบได้ง่ายขึ้น; ให้เผยแพร่บน
ClawHub แทน

```bash
openclaw plugins install <package-name>
```

OpenClaw จะตรวจสอบ ClawHub ก่อน และ fallback ไปยัง npm โดยอัตโนมัติ

## ปลั๊กอินที่แสดงรายการ

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วยตัวดึงข้อมูลสำเร็จรูปกว่า 20,000 รายการ ให้เอเจนต์ของคุณ
ดึงข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, เว็บไซต์อีคอมเมิร์ซ และอื่น ๆ ได้ เพียงแค่สั่ง

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

บริดจ์ OpenClaw แบบอิสระสำหรับการสนทนา Codex App Server ผูกแชทเข้ากับ
เธรด Codex พูดคุยกับมันด้วยข้อความธรรมดา และควบคุมมันด้วย
คำสั่งที่เป็นธรรมชาติสำหรับแชทสำหรับ resume, planning, review, การเลือกโมเดล, Compaction และอื่น ๆ

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

การเชื่อมต่อ enterprise robot โดยใช้โหมด Stream รองรับข้อความ รูปภาพ และ
ข้อความไฟล์ผ่านไคลเอนต์ DingTalk ใดก็ได้

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin การจัดการบริบทแบบไม่สูญเสียสำหรับ OpenClaw การสรุปการสนทนาแบบ
อิง DAG พร้อม Compaction แบบ incremental — รักษาความเที่ยงตรงของบริบททั้งหมด
ไว้ขณะลดการใช้โทเค็น

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin อย่างเป็นทางการที่ส่งออก agent traces ไปยัง Opik ตรวจสอบพฤติกรรมของเอเจนต์
ต้นทุน โทเค็น ข้อผิดพลาด และอื่น ๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

มอบอวาตาร์ Live2D ให้เอเจนต์ OpenClaw ของคุณพร้อม lip-sync แบบเรียลไทม์ การแสดงออกทางอารมณ์
และ text-to-speech มีเครื่องมือสำหรับครีเอเตอร์สำหรับการสร้างแอสเซ็ต AI
และการปรับใช้ไปยัง Prometheus Marketplace ได้ในคลิกเดียว ปัจจุบันอยู่ในช่วงอัลฟา

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

เชื่อมต่อ OpenClaw เข้ากับ QQ ผ่าน QQ Bot API รองรับแชทส่วนตัว การพูดถึงในกลุ่ม
ข้อความในแชนแนล และสื่อสมบูรณ์แบบต่าง ๆ รวมถึงเสียง รูปภาพ วิดีโอ
และไฟล์

รุ่น OpenClaw ปัจจุบันรวม QQ Bot มาให้แล้ว ใช้การตั้งค่าที่รวมมาให้ใน
[QQ Bot](/th/channels/qqbot) สำหรับการติดตั้งทั่วไป; ติดตั้ง Plugin ภายนอกนี้เฉพาะ
เมื่อคุณตั้งใจต้องการแพ็กเกจสแตนด์อโลนที่ดูแลโดย Tencent เท่านั้น

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin แชนแนล WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วย
การเชื่อมต่อ WebSocket แบบ persistent ของ WeCom Bot โดยรองรับ
ข้อความโดยตรงและแชทกลุ่ม การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์ การจัดรูปแบบ Markdown
การควบคุมการเข้าถึงในตัว และ Skills สำหรับเอกสาร/การประชุม/การส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## ส่งปลั๊กอินของคุณ

เรายินดีต้อนรับปลั๊กอินชุมชนที่มีประโยชน์ มีเอกสารกำกับ และปลอดภัยต่อการใช้งาน

<Steps>
  <Step title="เผยแพร่ไปยัง ClawHub หรือ npm">
    ปลั๊กอินของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`.
    เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) (แนะนำ) หรือ npm
    ดู [การสร้าง Plugins](/th/plugins/building-plugins) สำหรับคู่มือฉบับเต็ม

  </Step>

  <Step title="โฮสต์บน GitHub">
    ซอร์สโค้ดต้องอยู่ในรีโพสาธารณะพร้อมเอกสารการตั้งค่าและตัวติดตาม
    ปัญหา

  </Step>

  <Step title="ใช้ PR ของ docs เฉพาะเมื่อมีการเปลี่ยนแปลงเอกสารต้นทาง">
    คุณไม่จำเป็นต้องมี PR ของ docs เพียงเพื่อทำให้ปลั๊กอินของคุณค้นพบได้ง่ายขึ้น ให้เผยแพร่
    บน ClawHub แทน

    เปิด PR ของ docs เฉพาะเมื่อเอกสารต้นทางของ OpenClaw ต้องการ
    การเปลี่ยนแปลงเนื้อหาจริง เช่น การแก้ไขคำแนะนำในการติดตั้ง หรือการเพิ่มเอกสารข้ามรีโพ
    ที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## เกณฑ์คุณภาพ

| ข้อกำหนด                 | เหตุผล                                         |
| ------------------------ | ---------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องสามารถใช้ `openclaw plugins install` ได้ |
| รีโพ GitHub แบบสาธารณะ   | การตรวจสอบซอร์ส การติดตามปัญหา ความโปร่งใส       |
| เอกสารการตั้งค่าและการใช้งาน | ผู้ใช้ต้องรู้วิธีกำหนดค่า                        |
| การดูแลรักษาอย่างต่อเนื่อง   | มีการอัปเดตล่าสุดหรือจัดการปัญหาอย่างตอบสนองได้    |

wrapper ที่ทำแบบผิวเผิน ความเป็นเจ้าของที่ไม่ชัดเจน หรือแพ็กเกจที่ไม่มีการดูแลรักษา อาจไม่ได้รับการอนุมัติ

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [การสร้าง Plugins](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
