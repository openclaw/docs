---
read_when:
    - คุณต้องการทราบว่า npm shrinkwrap หมายถึงอะไรในรุ่นที่เผยแพร่ของ OpenClaw
    - คุณกำลังตรวจสอบไฟล์ล็อกแพ็กเกจ การเปลี่ยนแปลงของการพึ่งพา หรือความเสี่ยงในห่วงโซ่อุปทาน
    - คุณกำลังตรวจสอบความถูกต้องของแพ็กเกจ npm ระดับรูทหรือ Plugin ก่อนเผยแพร่
summary: คำอธิบายเกี่ยวกับ npm shrinkwrap ในรุ่นเผยแพร่ของ OpenClaw ทั้งแบบภาษาทั่วไปและเชิงเทคนิค
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-12T16:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

เช็กเอาต์ซอร์สของ OpenClaw ใช้ `pnpm-lock.yaml` ส่วนแพ็กเกจ OpenClaw ที่เผยแพร่บน npm ใช้ `npm-shrinkwrap.json` ซึ่งเป็นไฟล์ล็อกการพึ่งพาที่ npm รองรับสำหรับการเผยแพร่ เพื่อให้การติดตั้งแพ็กเกจใช้กราฟการพึ่งพาที่ผ่านการตรวจสอบระหว่างการออกรุ่น

## เหตุใดจึงสำคัญ

Shrinkwrap เป็นหลักฐานของโครงสร้างการพึ่งพาที่จัดส่งพร้อมแพ็กเกจ npm โดยระบุให้ npm ทราบว่าต้องติดตั้งเวอร์ชันทางอ้อมที่แน่นอนใดบ้าง

| ไฟล์                  | มีผลในบริบทใด                    | ความหมาย                              |
| --------------------- | -------------------------------- | ------------------------------------- |
| `pnpm-lock.yaml`      | เช็กเอาต์ซอร์สของ OpenClaw       | กราฟการพึ่งพาสำหรับผู้ดูแล            |
| `npm-shrinkwrap.json` | แพ็กเกจ npm ที่เผยแพร่           | กราฟการติดตั้งของ npm สำหรับผู้ใช้     |
| `package-lock.json`   | แอป npm ภายในเครื่อง             | ไม่ใช่สัญญาการเผยแพร่ของ OpenClaw     |

สำหรับการออกรุ่น OpenClaw สิ่งนี้หมายความว่า:

- แพ็กเกจที่เผยแพร่จะไม่ขอให้ npm สร้างกราฟการพึ่งพาใหม่ในขณะติดตั้ง
- การเปลี่ยนแปลงการพึ่งพาสามารถตรวจสอบได้ เพราะปรากฏอยู่ในส่วนต่างของไฟล์ล็อก
- การตรวจสอบความถูกต้องของรุ่นจะทดสอบกราฟเดียวกับที่ผู้ใช้จะติดตั้ง
- ปัญหาที่ไม่คาดคิดเกี่ยวกับขนาดแพ็กเกจหรือการพึ่งพาแบบเนทีฟจะปรากฏก่อนเผยแพร่

Shrinkwrap ไม่ใช่แซนด์บ็อกซ์ ตัวมันเองไม่ได้ทำให้การพึ่งพาปลอดภัย และไม่สามารถใช้แทนการแยกโฮสต์, `openclaw security audit`, ที่มาของแพ็กเกจ หรือการทดสอบติดตั้งเบื้องต้นได้

OpenClaw เป็น Gateway, โฮสต์ Plugin, เราเตอร์โมเดล และรันไทม์เอเจนต์ ดังนั้นการติดตั้งเริ่มต้นจึงส่งผลต่อเวลาเริ่มทำงาน การใช้พื้นที่ดิสก์ การดาวน์โหลดแพ็กเกจแบบเนทีฟ และความเสี่ยงจากห่วงโซ่อุปทาน Shrinkwrap ช่วยกำหนดขอบเขตที่เสถียรสำหรับการตรวจสอบรุ่น กล่าวคือ ผู้ตรวจสอบจะเห็นความเคลื่อนไหวของการพึ่งพาทางอ้อม เครื่องมือตรวจสอบจะปฏิเสธการเปลี่ยนแปลงไฟล์ล็อกที่ไม่คาดคิด และแพ็กเกจ Plugin จะมีกราฟการพึ่งพาที่ล็อกไว้เป็นของตนเองแทนการพึ่งพาแพ็กเกจรูท

## การสร้างและการตรวจสอบ

แพ็กเกจ npm รูท `openclaw`, แพ็กเกจ Plugin npm ที่ OpenClaw เป็นเจ้าของ (เช่น `@openclaw/discord`) และแพ็กเกจเวิร์กสเปซที่เผยแพร่ได้ เช่น [`@openclaw/ai`](/reference/openclaw-ai) จะรวม `npm-shrinkwrap.json` เมื่อเผยแพร่ การพึ่งพาเวิร์กสเปซจะไม่รวมอยู่ใน Shrinkwrap ของรูท เพราะเผยแพร่พร้อมกับแพ็กเกจรูท โดยแพ็กเกจเวิร์กสเปซแต่ละรายการที่เผยแพร่ได้จะตรึงโครงสร้างการพึ่งพาทางอ้อมของตนเองแทน นอกจากนี้ แพ็กเกจ Plugin ที่เหมาะสมยังสามารถเผยแพร่พร้อม `bundledDependencies` ที่ระบุไว้อย่างชัดเจน โดยรวมไฟล์การพึ่งพาขณะรันไว้ในทาร์บอลของ Plugin แทนการพึ่งพาเฉพาะการแก้ไขการพึ่งพาขณะติดตั้ง

```bash
# แพ็กเกจทั้งหมดที่จัดการด้วย Shrinkwrap (รูท + Plugin ที่เผยแพร่ได้)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# เฉพาะแพ็กเกจรูท
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# เฉพาะแพ็กเกจที่ได้รับผลกระทบจากชุดการเปลี่ยนแปลงปัจจุบัน
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

ตัวสร้างจะแก้ไขรูปแบบล็อกสำหรับการเผยแพร่ของ npm แต่จะปฏิเสธเวอร์ชันแพ็กเกจที่สร้างขึ้นหากยังไม่มีอยู่ใน `pnpm-lock.yaml` ซึ่งช่วยรักษาขอบเขตการตรวจสอบอายุของการพึ่งพา การแทนที่ และแพตช์ของ pnpm ไว้

ให้ตรวจสอบรายการต่อไปนี้ในฐานะรายการที่มีความสำคัญด้านความปลอดภัย:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- เพย์โหลดการพึ่งพาของ Plugin ที่รวมมาในแพ็กเกจ
- ส่วนต่างใด ๆ ของ `package-lock.json`

เครื่องมือตรวจสอบแพ็กเกจ OpenClaw กำหนดให้ทาร์บอลแพ็กเกจรูทใหม่ต้องมี Shrinkwrap และปฏิเสธ `package-lock.json` สำหรับแพ็กเกจที่เผยแพร่ กระบวนการเผยแพร่ Plugin ไปยัง npm จะตรวจสอบ Shrinkwrap ภายใน Plugin ติดตั้งการพึ่งพาที่รวมไว้ภายในแพ็กเกจ แล้วจึงแพ็กหรือเผยแพร่

## การตรวจสอบแพ็กเกจที่เผยแพร่แล้ว

แพ็กเกจรูท:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

แพ็กเกจ Plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

ข้อมูลพื้นฐาน: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)
