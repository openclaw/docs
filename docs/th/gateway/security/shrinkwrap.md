---
read_when:
    - คุณต้องการทราบว่า npm shrinkwrap หมายถึงอะไรในรีลีสของ OpenClaw
    - คุณกำลังตรวจทาน lockfile ของแพ็กเกจ การเปลี่ยนแปลง dependency หรือความเสี่ยงด้าน supply-chain
    - คุณกำลังตรวจสอบแพ็กเกจ npm ระดับรูทหรือ Plugin ก่อนเผยแพร่
summary: คำอธิบายแบบภาษาธรรมดาและเชิงเทคนิคเกี่ยวกับ npm shrinkwrap ในรีลีสของ OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

เช็กเอาต์ซอร์สของ OpenClaw ใช้ `pnpm-lock.yaml` แพ็กเกจ npm ของ OpenClaw ที่เผยแพร่แล้วใช้ `npm-shrinkwrap.json` ซึ่งเป็น lockfile การพึ่งพาที่เผยแพร่ได้ของ npm ดังนั้นการติดตั้งแพ็กเกจจึงใช้กราฟการพึ่งพาที่ผ่านการทบทวนระหว่างการเผยแพร่แล้ว

## เวอร์ชันเข้าใจง่าย

Shrinkwrap คือใบเสร็จของแผนผังการพึ่งพาที่ส่งไปพร้อมกับแพ็กเกจ npm
มันบอก npm ว่าต้องติดตั้งแพ็กเกจทรานซิทีฟเวอร์ชันใดแบบเจาะจง

สำหรับการเผยแพร่ OpenClaw นั่นหมายความว่า:

- แพ็กเกจที่เผยแพร่แล้วจะไม่ขอให้ npm สร้างกราฟการพึ่งพาใหม่ในเวลาติดตั้ง;
- การเปลี่ยนแปลงการพึ่งพาจะทบทวนได้ง่ายขึ้น เพราะปรากฏอยู่ใน lockfile;
- การตรวจสอบการเผยแพร่สามารถทดสอบกราฟเดียวกับที่ผู้ใช้จะติดตั้ง;
- ความประหลาดใจด้านขนาดแพ็กเกจหรือการพึ่งพาแบบ native จะสังเกตได้ง่ายขึ้นก่อนเผยแพร่

Shrinkwrap ไม่ใช่ sandbox มันไม่ได้ทำให้การพึ่งพาปลอดภัยได้ด้วยตัวเอง และไม่ได้มาแทนการแยกโฮสต์, `openclaw security audit`, package provenance หรือการทดสอบ smoke test การติดตั้ง

แบบจำลองทางความคิดสั้น ๆ:

| ไฟล์                  | สำคัญที่ไหน              | หมายถึงอะไร                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | เช็กเอาต์ซอร์ส OpenClaw | กราฟการพึ่งพาของผู้ดูแล       |
| `npm-shrinkwrap.json` | แพ็กเกจ npm ที่เผยแพร่แล้ว | กราฟการติดตั้ง npm สำหรับผู้ใช้ |
| `package-lock.json`   | แอป npm ในเครื่อง       | ไม่ใช่สัญญาการเผยแพร่ของ OpenClaw |

## ทำไม OpenClaw จึงใช้สิ่งนี้

OpenClaw เป็น Gateway, โฮสต์ Plugin, เราเตอร์โมเดล และรันไทม์เอเจนต์ การติดตั้งเริ่มต้นอาจส่งผลต่อเวลาเริ่มต้น การใช้ดิสก์ การดาวน์โหลดแพ็กเกจ native และความเสี่ยงของซัพพลายเชน

Shrinkwrap ให้ขอบเขตที่เสถียรแก่การทบทวนการเผยแพร่:

- ผู้ทบทวนสามารถเห็นการเคลื่อนไหวของการพึ่งพาแบบทรานซิทีฟ;
- ตัวตรวจสอบแพ็กเกจสามารถปฏิเสธการเบี่ยงเบนของ lockfile ที่ไม่คาดคิด;
- การยอมรับแพ็กเกจสามารถทดสอบการติดตั้งด้วยกราฟที่จะถูกส่งออกไปจริง;
- แพ็กเกจ Plugin สามารถพกกราฟการพึ่งพาที่ล็อกไว้ของตนเอง แทนที่จะพึ่งพาแพ็กเกจรากให้เป็นเจ้าของการพึ่งพาเฉพาะ Plugin

เป้าหมายไม่ใช่ "มี lockfile มากขึ้น" เป้าหมายคือการติดตั้งรุ่นเผยแพร่ที่ทำซ้ำได้พร้อมความเป็นเจ้าของที่ชัดเจน

## รายละเอียดทางเทคนิค

แพ็กเกจ npm ราก `openclaw` และแพ็กเกจ npm Plugin ที่ OpenClaw เป็นเจ้าของจะรวม `npm-shrinkwrap.json` เมื่อเผยแพร่ แพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของและเหมาะสมยังสามารถเผยแพร่พร้อม `bundledDependencies` แบบชัดเจนได้ เพื่อให้ไฟล์การพึ่งพารันไทม์ถูกพกไปใน tarball ของ Plugin แทนที่จะขึ้นกับการแก้การพึ่งพาในเวลาติดตั้งเท่านั้น

รักษาขอบเขตด้วยวิธีนี้:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ตัวสร้างจะแก้รูปแบบ lock ที่เผยแพร่ได้ของ npm แต่จะปฏิเสธเวอร์ชันแพ็กเกจที่สร้างขึ้นซึ่งยังไม่มีอยู่ใน `pnpm-lock.yaml` นั่นช่วยให้ขอบเขตด้านอายุของการพึ่งพา การ override และการทบทวน patch ของ pnpm ยังคงอยู่

ใช้คำสั่งเฉพาะรากก็ต่อเมื่อตั้งใจรีเฟรชแพ็กเกจรากโดยไม่แตะแพ็กเกจ Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

ทบทวนไฟล์เหล่านี้ในฐานะไฟล์ที่อ่อนไหวด้านความปลอดภัย:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload การพึ่งพาของ Plugin ที่ bundle มา
- diff ของ `package-lock.json` ใด ๆ

ตัวตรวจสอบแพ็กเกจของ OpenClaw กำหนดให้มี shrinkwrap ใน tarball แพ็กเกจรากใหม่
เส้นทางเผยแพร่ npm ของ Plugin จะตรวจสอบ shrinkwrap เฉพาะ Plugin ติดตั้งการพึ่งพาที่ bundle มาเฉพาะแพ็กเกจ แล้วจึง pack หรือเผยแพร่ ตัวตรวจสอบแพ็กเกจจะปฏิเสธ `package-lock.json` สำหรับแพ็กเกจ OpenClaw ที่เผยแพร่แล้ว

เพื่อตรวจสอบแพ็กเกจรากที่เผยแพร่แล้ว:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

เพื่อตรวจสอบแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของ:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

พื้นหลัง: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
