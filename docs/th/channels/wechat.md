---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ WeChat หรือ Weixin
    - คุณกำลังติดตั้งหรือแก้ไขปัญหา Plugin ช่องทาง openclaw-weixin
    - คุณต้องเข้าใจวิธีที่ Plugin ช่องทางภายนอกทำงานควบคู่กับ Gateway
summary: การตั้งค่าช่องทาง WeChat ผ่าน Plugin ภายนอก openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T15:55:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw เชื่อมต่อกับ WeChat ผ่าน Plugin ช่องทางภายนอก
`@tencent-weixin/openclaw-weixin` ของ Tencent

สถานะ: Plugin ภายนอกที่ดูแลโดยทีม Tencent Weixin รองรับการแชตโดยตรงและ
สื่อ เมทาดาทาความสามารถของ Plugin ไม่ได้ระบุว่ารองรับการแชตแบบกลุ่ม
(ระบุเฉพาะการแชตโดยตรง)

## การตั้งชื่อ

- **WeChat** คือชื่อที่แสดงต่อผู้ใช้ในเอกสารเหล่านี้
- **Weixin** คือชื่อที่ใช้โดยแพ็กเกจของ Tencent และในรหัส Plugin
- `openclaw-weixin` คือรหัสช่องทางของ OpenClaw (`weixin` และ `wechat` ใช้เป็นนามแฝงได้)
- `@tencent-weixin/openclaw-weixin` คือแพ็กเกจ npm

ใช้ `openclaw-weixin` ในคำสั่ง CLI และพาธการกำหนดค่า

## วิธีการทำงาน

โค้ดของ WeChat ไม่ได้อยู่ในรีโพซิทอรีหลักของ OpenClaw โดย OpenClaw จัดเตรียม
สัญญาทั่วไปสำหรับ Plugin ช่องทาง และ Plugin ภายนอกจัดเตรียมรันไทม์
เฉพาะสำหรับ WeChat:

1. `openclaw plugins install` ติดตั้ง `@tencent-weixin/openclaw-weixin`
2. Gateway ตรวจพบแมนิเฟสต์ของ Plugin และโหลดจุดเริ่มต้นของ Plugin
3. Plugin ลงทะเบียนรหัสช่องทาง `openclaw-weixin`
4. `openclaw channels login --channel openclaw-weixin` เริ่มการเข้าสู่ระบบด้วยคิวอาร์โค้ด
5. Plugin จัดเก็บข้อมูลประจำตัวของบัญชีไว้ภายใต้ไดเรกทอรีสถานะของ OpenClaw
   (ค่าเริ่มต้นคือ `~/.openclaw`)
6. เมื่อ Gateway เริ่มทำงาน Plugin จะเริ่มตัวตรวจติดตาม Weixin สำหรับแต่ละ
   บัญชีที่กำหนดค่าไว้
7. ข้อความขาเข้าจาก WeChat จะถูกปรับให้อยู่ในรูปแบบมาตรฐานผ่านสัญญาของช่องทาง ส่งต่อไปยัง
   เอเจนต์ OpenClaw ที่เลือก และส่งกลับผ่านพาธขาออกของ Plugin

การแยกส่วนนี้มีความสำคัญ: แกนหลักของ OpenClaw ยังคงไม่ขึ้นกับช่องทาง การเข้าสู่ระบบ WeChat,
การเรียกใช้ Tencent iLink API, การอัปโหลด/ดาวน์โหลดสื่อ, โทเค็นบริบท และการ
ตรวจติดตามบัญชี เป็นความรับผิดชอบของ Plugin ภายนอก

## การติดตั้ง

ติดตั้งอย่างรวดเร็ว:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

รีสตาร์ต Gateway หลังการติดตั้ง:

```bash
openclaw gateway restart
```

## การเข้าสู่ระบบ

เรียกใช้การเข้าสู่ระบบด้วยคิวอาร์โค้ดบนเครื่องเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

สแกนคิวอาร์โค้ดด้วย WeChat บนโทรศัพท์และยืนยันการเข้าสู่ระบบ หลังจากสแกนสำเร็จ Plugin จะบันทึก
โทเค็นบัญชีไว้ในเครื่อง

หากต้องการเพิ่มบัญชี WeChat อีกบัญชี ให้เรียกใช้คำสั่งเข้าสู่ระบบเดิมอีกครั้ง สำหรับการใช้งานหลาย
บัญชี ให้แยกเซสชันข้อความโดยตรงตามบัญชี ช่องทาง และผู้ส่ง:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## การควบคุมการเข้าถึง

ข้อความโดยตรงใช้รูปแบบการจับคู่และรายการอนุญาตตามปกติของ OpenClaw สำหรับ Plugin
ช่องทาง

อนุมัติผู้ส่งรายใหม่:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

สำหรับรูปแบบการควบคุมการเข้าถึงทั้งหมด โปรดดู [การจับคู่](/th/channels/pairing)

## ความเข้ากันได้

Plugin จะตรวจสอบเวอร์ชัน OpenClaw ของโฮสต์เมื่อเริ่มต้นทำงาน

| สายรุ่นของ Plugin | เวอร์ชัน OpenClaw                                                | แท็ก npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (ปัจจุบันคือ 2.4.6; รุ่น 2.x ช่วงแรกยอมรับ `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

หาก Plugin รายงานว่าเวอร์ชัน OpenClaw ของคุณเก่าเกินไป ให้อัปเดต
OpenClaw หรือติดตั้งสายรุ่นเก่าของ Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## โปรเซสประกอบ

Plugin ของ WeChat สามารถเรียกใช้งานตัวช่วยควบคู่กับ Gateway ขณะที่ตรวจติดตาม
Tencent iLink API ในปัญหา #68451 พาธของตัวช่วยดังกล่าวเผยให้เห็นข้อบกพร่องในการ
ล้าง Gateway ที่ค้างตามกลไกทั่วไปของ OpenClaw: โปรเซสลูกอาจพยายามล้างโปรเซส
Gateway แม่ ทำให้เกิดลูปการรีสตาร์ตภายใต้ตัวจัดการโปรเซส เช่น systemd

การล้างข้อมูลเมื่อเริ่มต้นระบบของ OpenClaw ในปัจจุบันจะยกเว้นโปรเซสปัจจุบันและโปรเซสบรรพบุรุษ
ดังนั้นตัวช่วยของช่องทางจึงไม่สามารถหยุด Gateway ที่เรียกใช้งานตัวช่วยนั้นได้ การแก้ไขนี้เป็นแบบ
ทั่วไป ไม่ใช่พาธเฉพาะสำหรับ WeChat ในแกนหลัก

## การแก้ไขปัญหา

ตรวจสอบการติดตั้งและสถานะ:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

หากช่องทางแสดงว่าติดตั้งแล้วแต่เชื่อมต่อไม่ได้ ให้ยืนยันว่าเปิดใช้งาน Plugin
แล้วและรีสตาร์ต:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

หาก Gateway รีสตาร์ตซ้ำ ๆ หลังจากเปิดใช้งาน WeChat ให้อัปเดตทั้ง OpenClaw และ
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

หากเมื่อเริ่มต้นระบบมีรายงานว่าแพ็กเกจ Plugin ที่ติดตั้ง `requires compiled runtime
output for TypeScript entry` แสดงว่าแพ็กเกจ npm ถูกเผยแพร่โดยไม่มีไฟล์รันไทม์
JavaScript ที่คอมไพล์แล้วซึ่ง OpenClaw ต้องใช้ ให้อัปเดต/ติดตั้งใหม่หลังจากผู้เผยแพร่ Plugin
เผยแพร่แพ็กเกจที่แก้ไขแล้ว หรือปิดใช้งาน/ถอนการติดตั้ง Plugin ชั่วคราว

ปิดใช้งานชั่วคราว:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## เอกสารที่เกี่ยวข้อง

- ภาพรวมช่องทาง: [ช่องทางแชต](/th/channels)
- การจับคู่: [การจับคู่](/th/channels/pairing)
- การกำหนดเส้นทางช่องทาง: [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- สถาปัตยกรรม Plugin: [สถาปัตยกรรม Plugin](/th/plugins/architecture)
- SDK สำหรับ Plugin ช่องทาง: [SDK สำหรับ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- แพ็กเกจภายนอก: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
