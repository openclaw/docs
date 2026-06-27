---
read_when:
    - การกำหนดค่าข้อความช่องทางที่บอตเป็นผู้เขียน
    - การปรับแต่งการป้องกันลูประหว่างบอทกับบอท
sidebarTitle: Bot loop protection
summary: ค่าเริ่มต้นการป้องกันลูปบอตต่อบอตและการแทนที่ของช่องทาง
title: การป้องกันลูปของบอต
x-i18n:
    generated_at: "2026-06-27T17:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# การป้องกันลูปของบอต

OpenClaw สามารถรับข้อความที่เขียนโดยบอตอื่นบนช่องทางที่รองรับ `allowBots` ได้
เมื่อเปิดใช้เส้นทางนี้ การป้องกันลูปแบบคู่จะป้องกันไม่ให้ตัวตนบอตสองตัว
ตอบกลับกันไปมาอย่างไม่สิ้นสุด

ตัวป้องกันนี้บังคับใช้โดยตัวรันการตอบกลับขาเข้าของแกนหลัก ช่องทางที่รองรับแต่ละช่องทาง
จะแปลงเหตุการณ์ขาเข้าของตนเองเป็นข้อเท็จจริงทั่วไป: บัญชีหรือขอบเขต, รหัสการสนทนา,
รหัสบอตผู้ส่ง และรหัสบอตผู้รับ จากนั้นแกนหลักจะติดตามคู่ผู้เข้าร่วมทั้งสองทิศทาง
ใช้โควตาแบบหน้าต่างเลื่อน และระงับคู่นั้นระหว่างช่วงพักหลังจากใช้โควตาเกิน

## ค่าเริ่มต้น

การป้องกันลูปแบบคู่จะทำงานเมื่อช่องทางอนุญาตให้ข้อความที่บอตเป็นผู้เขียนไปถึง
การกระจายงาน ค่าเริ่มต้นในตัวคือ:

- `maxEventsPerWindow: 20` - คู่บอตสามารถแลกเปลี่ยนเหตุการณ์ได้ 20 รายการภายในหน้าต่าง
- `windowSeconds: 60` - ความยาวของหน้าต่างเลื่อน
- `cooldownSeconds: 60` - เวลาระงับหลังจากคู่นั้นใช้โควตาเกิน

ตัวป้องกันนี้ไม่กระทบข้อความปกติที่มนุษย์เป็นผู้เขียน, การใช้งานบอตตัวเดียว,
การกรองข้อความของตนเอง หรือการตอบกลับบอตแบบครั้งเดียวที่ยังอยู่ภายใต้โควตา

## กำหนดค่าเริ่มต้นร่วม

ตั้งค่า `channels.defaults.botLoopProtection` ครั้งเดียวเพื่อให้ช่องทางที่รองรับทุกช่องทาง
มีค่าพื้นฐานเดียวกัน การตั้งค่าทับระดับช่องทางและบัญชียังคงปรับแต่งพื้นผิวแต่ละส่วนได้

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

ตั้งค่า `enabled: false` เฉพาะเมื่อ นโยบายช่องทางของคุณตั้งใจอนุญาต
การสนทนาระหว่างบอตกับบอตโดยไม่มีการระงับอัตโนมัติ

## ตั้งค่าทับต่อช่องทางหรือบัญชี

ช่องทางที่รองรับจะซ้อนการกำหนดค่าของตนเองทับค่าเริ่มต้นร่วม ลำดับความสำคัญคือ:

- `channels.<channel>.<room-or-space>.botLoopProtection` เมื่อช่องทางรองรับการตั้งค่าทับต่อการสนทนา
- `channels.<channel>.accounts.<account>.botLoopProtection` เมื่อช่องทางรองรับบัญชี
- `channels.<channel>.botLoopProtection` เมื่อช่องทางรองรับค่าเริ่มต้นระดับบนสุด
- `channels.defaults.botLoopProtection`
- ค่าเริ่มต้นในตัว

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## การรองรับของช่องทาง

- Discord: ข้อเท็จจริง `author.bot` แบบเนทีฟ โดยใช้บัญชี Discord, ช่องทาง และคู่บอตเป็นคีย์
- Slack: ข้อเท็จจริง `bot_id` แบบเนทีฟสำหรับข้อความที่บอตเป็นผู้เขียนและได้รับการยอมรับ โดยใช้บัญชี Slack, ช่องทาง และคู่บอตเป็นคีย์
- Matrix: บัญชีบอต Matrix ที่กำหนดค่าไว้ โดยใช้บัญชี Matrix, ห้อง และคู่บอตที่กำหนดค่าไว้เป็นคีย์
- Google Chat: ข้อเท็จจริง `sender.type=BOT` แบบเนทีฟสำหรับข้อความที่บอตเป็นผู้เขียนและได้รับการยอมรับ โดยใช้บัญชี, พื้นที่ และคู่บอตเป็นคีย์

ช่องทางที่ไม่เปิดเผยตัวตนบอตขาเข้าที่เชื่อถือได้จะยังคงใช้
ตัวกรองข้อความของตนเองและนโยบายการเข้าถึงตามปกติ ไม่ควรเลือกใช้
ตัวป้องกันนี้จนกว่าจะระบุผู้เข้าร่วมทั้งสองในคู่บอตได้

ดู [รันไทม์ SDK](/th/plugins/sdk-runtime#reusable-runtime-utilities) สำหรับรายละเอียดการใช้งาน Plugin
